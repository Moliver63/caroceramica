import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { mensagensContato } from "../../shared/schema";
import { ENV } from "../_core/env";
import { getResend } from "../lib/email";

const resendWebhookRouter = Router();

// POST /api/webhooks/resend — recebido quando alguém manda e-mail pra
// contato@carovargas.com.br (configurado como webhook de "Inbound" no
// painel do Resend, evento email.received)
//
// IMPORTANTE: o payload do webhook só traz METADADOS (remetente,
// destinatário, assunto) — o corpo do e-mail (texto/html) não vem nele.
// Precisa buscar separadamente via resend.emails.receiving.get(email_id).
// (https://resend.com/docs/dashboard/receiving/get-email-content)
resendWebhookRouter.post("/", async (req, res) => {
  try {
    const resend = getResend();
    if (!resend) {
      console.warn("[resend-webhook] RESEND_API_KEY não configurada — ignorando.");
      return res.sendStatus(200);
    }

    const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let evento: any;

    if (ENV.resendWebhookSecret && rawBody) {
      try {
        evento = resend.webhooks.verify({
          payload: rawBody.toString("utf-8"),
          headers: {
            id: req.header("svix-id") ?? "",
            timestamp: req.header("svix-timestamp") ?? "",
            signature: req.header("svix-signature") ?? "",
          },
          webhookSecret: ENV.resendWebhookSecret,
        });
      } catch {
        console.warn("[resend-webhook] assinatura inválida, requisição ignorada.");
        return res.sendStatus(401);
      }
    } else {
      // Sem segredo configurado, aceita sem verificar (funciona, só
      // menos seguro — mesmo padrão de degradação graciosa do resto
      // dos serviços opcionais do projeto).
      evento = req.body ?? {};
    }

    if (evento.type === "email.received" && evento.data?.email_id) {
      // Proteção contra reenvio do webhook (o Resend pode reenviar se não
      // receber 200 a tempo) — se já processamos esse email_id, ignora.
      const jaExiste = await db.query.mensagensContato.findFirst({
        where: eq(mensagensContato.resendEmailId, evento.data.email_id),
      });
      if (jaExiste) {
        return res.sendStatus(200);
      }

      const { data: email, error } = await resend.emails.receiving.get(
        evento.data.email_id
      );

      if (error || !email) {
        console.error("[resend-webhook] falha ao buscar corpo do e-mail:", error);
        return res.sendStatus(200);
      }

      await db.insert(mensagensContato).values({
        resendEmailId: evento.data.email_id,
        remetente: email.from ?? "desconhecido",
        destinatario: Array.isArray(email.to) ? email.to.join(", ") : String(email.to ?? ""),
        assunto: email.subject ?? "(sem assunto)",
        corpoTexto: email.text ?? null,
        corpoHtml: email.html ?? null,
      });
    }

    res.sendStatus(200);
  } catch (erro) {
    console.error("Erro ao processar webhook Resend:", erro);
    // Responde 200 mesmo em erro interno pra evitar reenvios agressivos.
    res.sendStatus(200);
  }
});

export default resendWebhookRouter;
