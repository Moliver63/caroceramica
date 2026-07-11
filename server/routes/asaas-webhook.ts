import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { pedidos } from "../../shared/schema";

const asaasWebhookRouter = Router();

// POST /api/webhooks/asaas — recebido pelo Asaas em mudanças de status
asaasWebhookRouter.post("/", async (req, res) => {
  try {
    const { event, payment } = req.body ?? {};

    if (
      (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") &&
      payment?.id
    ) {
      await db
        .update(pedidos)
        .set({ status: "pago", atualizadoEm: new Date() })
        .where(eq(pedidos.gatewayReferenciaId, payment.id));
    }

    res.sendStatus(200);
  } catch (erro) {
    console.error("Erro ao processar webhook Asaas:", erro);
    // Responde 200 mesmo em erro interno para evitar reenvios agressivos do
    // gateway; o erro já foi logado para investigação manual.
    res.sendStatus(200);
  }
});

export default asaasWebhookRouter;
