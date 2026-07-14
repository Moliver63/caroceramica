import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { pedidos, pedidoEventos } from "../../shared/schema";
import { enviarEmail, emailPagamentoConfirmado } from "../lib/email";

const asaasWebhookRouter = Router();

// POST /api/webhooks/asaas — recebido pelo Asaas em mudanças de status
asaasWebhookRouter.post("/", async (req, res) => {
  try {
    const { event, payment } = req.body ?? {};

    if (
      (event === "PAYMENT_CONFIRMED" || event === "PAYMENT_RECEIVED") &&
      payment?.id
    ) {
      const [atualizado] = await db
        .update(pedidos)
        .set({ status: "pago", atualizadoEm: new Date() })
        .where(eq(pedidos.gatewayReferenciaId, payment.id))
        .returning();

      if (atualizado) {
        await db.insert(pedidoEventos).values({
          pedidoId: atualizado.id,
          status: "pago",
          descricao: "Pagamento confirmado pelo gateway.",
        });

        await enviarEmail({
          para: atualizado.clienteEmail,
          assunto: `Pagamento confirmado — Pedido ${atualizado.codigoPedido}`,
          html: emailPagamentoConfirmado({
            nomeCliente: atualizado.clienteNome,
            codigoPedido: atualizado.codigoPedido,
          }),
        });
      }
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
