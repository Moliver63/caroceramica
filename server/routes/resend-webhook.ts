import { Router } from "express";
import { Webhook } from "svix";
import { db } from "../db";
import { mensagensContato } from "../../shared/schema";
import { ENV } from "../_core/env";

const resendWebhookRouter = Router();

// POST /api/webhooks/resend — recebido quando alguém manda e-mail pra
// contato@carovargas.com.br (configurado como webhook de "Inbound" no
// painel do Resend, evento email.received)
resendWebhookRouter.post("/", async (req, res) => {
  try {
    const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;

    // Verifica a assinatura (Resend usa Svix) — só se o segredo estiver
    // configurado. Sem RESEND_WEBHOOK_SECRET, aceita sem verificar (pior
    // que verificar, mas melhor que travar quem ainda não configurou).
    if (ENV.resendWebhookSecret && rawBody) {
      try {
        const wh = new Webhook(ENV.resendWebhookSecret);
        wh.verify(rawBody, {
          "svix-id": req.header("svix-id") ?? "",
          "svix-timestamp": req.header("svix-timestamp") ?? "",
          "svix-signature": req.header("svix-signature") ?? "",
        });
      } catch {
        console.warn("[resend-webhook] assinatura inválida, requisição ignorada.");
        return res.sendStatus(401);
      }
    }

    const { type, data } = req.body ?? {};

    if (type === "email.received" && data) {
      await db.insert(mensagensContato).values({
        remetente: data.from ?? "desconhecido",
        destinatario: Array.isArray(data.to) ? data.to.join(", ") : data.to,
        assunto: data.subject ?? "(sem assunto)",
        corpoTexto: data.text ?? null,
        corpoHtml: data.html ?? null,
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
