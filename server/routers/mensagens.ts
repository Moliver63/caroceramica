import { TRPCError } from "@trpc/server";
import { and, count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { mensagensContato, mensagensEnviadas } from "../../shared/schema";
import { enviarEmail, emailRespostaContato, getResend } from "../lib/email";
import { ENV } from "../_core/env";
import { adminProcedure, router } from "../_core/trpc";

// O campo "remetente" vem como "Nome <email@dominio.com>" ou só o e-mail
// puro, dependendo de como a pessoa configurou o cliente dela.
function extrairEndereco(remetente: string): string {
  const match = remetente.match(/<([^>]+)>/);
  return match ? match[1] : remetente.trim();
}

const pastaSchema = z.enum(["entrada", "arquivadas", "excluidas"]);

export const mensagensRouter = router({
  // ── Caixa de entrada / arquivadas / lixeira — uma pasta por vez ──
  listar: adminProcedure
    .input(z.object({ pasta: pastaSchema.default("entrada") }).optional())
    .query(async ({ input }) => {
      const pasta = input?.pasta ?? "entrada";

      const condicao =
        pasta === "excluidas"
          ? eq(mensagensContato.excluida, true)
          : pasta === "arquivadas"
          ? and(eq(mensagensContato.arquivada, true), eq(mensagensContato.excluida, false))
          : and(eq(mensagensContato.arquivada, false), eq(mensagensContato.excluida, false));

      return db.query.mensagensContato.findMany({
        where: condicao,
        orderBy: desc(mensagensContato.criadoEm),
      });
    }),

  // ── Pasta "Enviados" — respostas que o admin mandou ───────────
  listarEnviadas: adminProcedure.query(async () => {
    return db.query.mensagensEnviadas.findMany({
      orderBy: desc(mensagensEnviadas.criadoEm),
    });
  }),

  // ── Contagem de não lidas — pro badge no menu lateral ─────────
  contarNaoLidas: adminProcedure.query(async () => {
    const [{ total }] = await db
      .select({ total: count() })
      .from(mensagensContato)
      .where(
        and(
          eq(mensagensContato.lida, false),
          eq(mensagensContato.arquivada, false),
          eq(mensagensContato.excluida, false)
        )
      );
    return total;
  }),

  marcarComoLida: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db
        .update(mensagensContato)
        .set({ lida: true })
        .where(eq(mensagensContato.id, input.id));
      return { sucesso: true as const };
    }),

  // ── Voltar a marcar como não lida (qualquer webmail de verdade tem) ──
  marcarComoNaoLida: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db
        .update(mensagensContato)
        .set({ lida: false })
        .where(eq(mensagensContato.id, input.id));
      return { sucesso: true as const };
    }),

  arquivar: adminProcedure
    .input(z.object({ id: z.number().int(), arquivada: z.boolean().default(true) }))
    .mutation(async ({ input }) => {
      await db
        .update(mensagensContato)
        .set({ arquivada: input.arquivada })
        .where(eq(mensagensContato.id, input.id));
      return { sucesso: true as const };
    }),

  // ── Mover pra lixeira / restaurar da lixeira ──────────────────
  excluir: adminProcedure
    .input(z.object({ id: z.number().int(), excluida: z.boolean().default(true) }))
    .mutation(async ({ input }) => {
      await db
        .update(mensagensContato)
        .set({ excluida: input.excluida })
        .where(eq(mensagensContato.id, input.id));
      return { sucesso: true as const };
    }),

  // ── Esvaziar a lixeira de vez (aí sim apaga do banco) ─────────
  excluirPermanentemente: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db.delete(mensagensContato).where(eq(mensagensContato.id, input.id));
      return { sucesso: true as const };
    }),

  // ── Link fresco pra baixar um anexo — o link que o Resend dá expira,
  //    então buscamos um novo toda vez que o admin clica em baixar ──
  buscarLinkAnexo: adminProcedure
    .input(z.object({ mensagemId: z.number().int(), anexoId: z.string() }))
    .query(async ({ input }) => {
      const mensagem = await db.query.mensagensContato.findFirst({
        where: eq(mensagensContato.id, input.mensagemId),
      });
      if (!mensagem?.resendEmailId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mensagem não encontrada" });
      }

      const resend = getResend();
      if (!resend) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Resend não configurado no servidor.",
        });
      }

      const { data, error } = await resend.emails.receiving.attachments.get({
        emailId: mensagem.resendEmailId,
        id: input.anexoId,
      });

      if (error || !data) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Não foi possível gerar o link do anexo agora.",
        });
      }

      return { url: data.download_url };
    }),

  // ── Encaminhar a mensagem original pra outro e-mail — usa o
  //    encaminhamento nativo do Resend (passthrough preserva o
  //    e-mail original inteiro, incluindo anexos) ──
  encaminhar: adminProcedure
    .input(z.object({ id: z.number().int(), para: z.string().email() }))
    .mutation(async ({ input }) => {
      const mensagem = await db.query.mensagensContato.findFirst({
        where: eq(mensagensContato.id, input.id),
      });
      if (!mensagem?.resendEmailId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mensagem não encontrada" });
      }

      const resend = getResend();
      if (!resend) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Resend não configurado no servidor.",
        });
      }

      const { error } = await resend.emails.receiving.forward({
        emailId: mensagem.resendEmailId,
        to: input.para,
        from: ENV.emailContato,
        passthrough: true,
      });

      if (error) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Não foi possível encaminhar a mensagem agora.",
        });
      }

      return { sucesso: true as const };
    }),

  // ── Responder direto do admin — sai com a assinatura da marca,
  //    do endereço contato@carovargas.com.br, cita a mensagem
  //    original (padrão de qualquer cliente de e-mail), e fica
  //    salva em "Enviados" (antes simplesmente sumia depois de
  //    enviada) ──
  responder: adminProcedure
    .input(z.object({ id: z.number().int(), corpo: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const mensagem = await db.query.mensagensContato.findFirst({
        where: eq(mensagensContato.id, input.id),
      });

      if (!mensagem) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mensagem não encontrada" });
      }

      const enderecoDestino = extrairEndereco(mensagem.remetente);
      const assuntoOriginal = mensagem.assunto ?? "";
      const assuntoResposta = assuntoOriginal.toLowerCase().startsWith("re:")
        ? assuntoOriginal
        : `Re: ${assuntoOriginal || "sua mensagem"}`;

      const corpoOriginal = mensagem.corpoTexto?.trim();

      const enviado = await enviarEmail({
        para: enderecoDestino,
        assunto: assuntoResposta,
        html: emailRespostaContato({
          corpoResposta: input.corpo,
          citacao: corpoOriginal
            ? {
                remetente: mensagem.remetente,
                data: mensagem.criadoEm.toLocaleString("pt-BR"),
                corpo: corpoOriginal,
              }
            : undefined,
        }),
        remetente: ENV.emailContato,
        responderPara: ENV.emailContato,
      });

      if (!enviado) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message:
            "Não foi possível enviar a resposta agora (confira se RESEND_API_KEY está configurada). Tente novamente.",
        });
      }

      await db
        .update(mensagensContato)
        .set({ respondida: true, lida: true })
        .where(eq(mensagensContato.id, input.id));

      await db.insert(mensagensEnviadas).values({
        mensagemOrigemId: mensagem.id,
        destinatario: enderecoDestino,
        assunto: assuntoResposta,
        corpo: input.corpo,
      });

      return { sucesso: true as const };
    }),

  // ── Escrever um e-mail novo, do zero (não em resposta a nada) —
  //    pra falar com um cliente por iniciativa própria ──
  enviarNovo: adminProcedure
    .input(
      z.object({
        destinatario: z.string().email(),
        assunto: z.string().min(1),
        corpo: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const enviado = await enviarEmail({
        para: input.destinatario,
        assunto: input.assunto,
        html: emailRespostaContato({ corpoResposta: input.corpo }),
        remetente: ENV.emailContato,
        responderPara: ENV.emailContato,
      });

      if (!enviado) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message:
            "Não foi possível enviar o e-mail agora (confira se RESEND_API_KEY está configurada). Tente novamente.",
        });
      }

      await db.insert(mensagensEnviadas).values({
        mensagemOrigemId: null,
        destinatario: input.destinatario,
        assunto: input.assunto,
        corpo: input.corpo,
      });

      return { sucesso: true as const };
    }),
});
