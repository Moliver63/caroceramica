import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { mensagensContato } from "../../shared/schema";
import { enviarEmail, emailRespostaContato } from "../lib/email";
import { ENV } from "../_core/env";
import { adminProcedure, router } from "../_core/trpc";

// O campo "remetente" vem como "Nome <email@dominio.com>" ou só o e-mail
// puro, dependendo de como a pessoa configurou o cliente dela.
function extrairEndereco(remetente: string): string {
  const match = remetente.match(/<([^>]+)>/);
  return match ? match[1] : remetente.trim();
}

export const mensagensRouter = router({
  listar: adminProcedure
    .input(z.object({ arquivadas: z.boolean().default(false) }).optional())
    .query(async ({ input }) => {
      return db.query.mensagensContato.findMany({
        where: eq(mensagensContato.arquivada, input?.arquivadas ?? false),
        orderBy: desc(mensagensContato.criadoEm),
      });
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

  arquivar: adminProcedure
    .input(z.object({ id: z.number().int(), arquivada: z.boolean().default(true) }))
    .mutation(async ({ input }) => {
      await db
        .update(mensagensContato)
        .set({ arquivada: input.arquivada })
        .where(eq(mensagensContato.id, input.id));
      return { sucesso: true as const };
    }),

  // ── Responder direto do admin — sai com a assinatura da marca,
  //    do endereço contato@carovargas.com.br ──
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

      const enviado = await enviarEmail({
        para: enderecoDestino,
        assunto: assuntoResposta,
        html: emailRespostaContato({ corpoResposta: input.corpo }),
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

      return { sucesso: true as const };
    }),
});
