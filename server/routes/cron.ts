import { Router } from "express";
import { and, eq, lt } from "drizzle-orm";
import { db } from "../db";
import { pedidos } from "../../shared/schema";
import { enviarEmail, emailLembreteAbandono } from "../lib/email";
import { ENV } from "../_core/env";

const cronRouter = Router();

// Depois de quantas horas "aguardando_pagamento" sem pagar é considerado
// abandonado o suficiente pra mandar um lembrete.
const HORAS_PARA_LEMBRETE = 2;

// POST /api/cron/verificar-abandonos — chamado periodicamente por um
// serviço de cron externo (Render Cron Job, cron-job.org, etc.), nunca
// pelo navegador do cliente. Protegido por CRON_SECRET no header
// Authorization, pra ninguém de fora poder disparar isso à toa.
cronRouter.post("/verificar-abandonos", async (req, res) => {
  try {
    if (!ENV.cronSecret) {
      console.warn("[cron] CRON_SECRET não configurado — endpoint desativado.");
      return res.status(503).json({ erro: "Cron não configurado no servidor." });
    }

    const auth = req.header("authorization");
    if (auth !== `Bearer ${ENV.cronSecret}`) {
      return res.sendStatus(401);
    }

    const limite = new Date(Date.now() - HORAS_PARA_LEMBRETE * 60 * 60 * 1000);

    const pedidosAbandonados = await db.query.pedidos.findMany({
      where: and(
        eq(pedidos.status, "aguardando_pagamento"),
        eq(pedidos.lembreteAbandonoEnviado, false),
        lt(pedidos.criadoEm, limite)
      ),
    });

    for (const pedido of pedidosAbandonados) {
      await enviarEmail({
        para: pedido.clienteEmail,
        assunto: `Ainda dá tempo — Pedido ${pedido.codigoPedido}`,
        html: emailLembreteAbandono({
          nomeCliente: pedido.clienteNome,
          codigoPedido: pedido.codigoPedido,
        }),
      });

      await db
        .update(pedidos)
        .set({ lembreteAbandonoEnviado: true })
        .where(eq(pedidos.id, pedido.id));
    }

    res.json({ processados: pedidosAbandonados.length });
  } catch (erro) {
    console.error("Erro ao verificar abandonos:", erro);
    res.status(500).json({ erro: "Falha ao processar." });
  }
});

export default cronRouter;
