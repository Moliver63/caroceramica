import { and, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { pedidos } from "../../shared/schema";
import { adminProcedure, router } from "../_core/trpc";

// Só conta como faturamento de verdade o que já foi pago — pedidos
// "aguardando_pagamento" são intenção de compra, não receita ainda.
// "cancelado" nunca virou dinheiro. O resto do funil (pago em diante)
// já é receita confirmada, independente da etapa de produção/envio.
const STATUS_CONFIRMADOS = [
  "pago",
  "em_producao",
  "pronto_envio",
  "enviado",
  "entregue",
] as const;

const periodoSchema = z.object({
  desde: z.string(), // "AAAA-MM-DD"
  ate: z.string(),
});

export const financeiroRouter = router({
  resumo: adminProcedure.input(periodoSchema).query(async ({ input }) => {
    const inicio = new Date(`${input.desde}T00:00:00`);
    const fim = new Date(`${input.ate}T23:59:59.999`);

    const todos = await db.query.pedidos.findMany({
      where: and(gte(pedidos.criadoEm, inicio), lte(pedidos.criadoEm, fim)),
      with: {
        itens: { with: { produto: true } },
      },
    });

    const confirmados = todos.filter((p) =>
      STATUS_CONFIRMADOS.includes(p.status as (typeof STATUS_CONFIRMADOS)[number])
    );
    const pendentes = todos.filter((p) => p.status === "aguardando_pagamento");
    const cancelados = todos.filter((p) => p.status === "cancelado");

    const faturamentoConfirmado = confirmados.reduce((s, p) => s + Number(p.total), 0);
    const faturamentoFrete = confirmados.reduce((s, p) => s + Number(p.frete ?? 0), 0);
    const faturamentoPendente = pendentes.reduce((s, p) => s + Number(p.total), 0);
    const faturamentoCancelado = cancelados.reduce((s, p) => s + Number(p.total), 0);
    const ticketMedio = confirmados.length > 0 ? faturamentoConfirmado / confirmados.length : 0;

    // Evolução por dia — base pro gráfico
    const porDiaMapa = new Map<string, { faturamento: number; pedidos: number }>();
    for (const p of confirmados) {
      const dia = p.criadoEm.toISOString().split("T")[0];
      const atual = porDiaMapa.get(dia) ?? { faturamento: 0, pedidos: 0 };
      atual.faturamento += Number(p.total);
      atual.pedidos += 1;
      porDiaMapa.set(dia, atual);
    }
    const porDia = Array.from(porDiaMapa.entries())
      .map(([data, v]) => ({ data, ...v }))
      .sort((a, b) => a.data.localeCompare(b.data));

    // Faturamento por categoria
    const porCategoriaMapa = new Map<string, { faturamento: number; quantidade: number }>();
    for (const p of confirmados) {
      for (const item of p.itens) {
        const cat = item.produto.categoria;
        const atual = porCategoriaMapa.get(cat) ?? { faturamento: 0, quantidade: 0 };
        atual.faturamento += Number(item.precoUnitario) * item.quantidade;
        atual.quantidade += item.quantidade;
        porCategoriaMapa.set(cat, atual);
      }
    }
    const porCategoria = Array.from(porCategoriaMapa.entries())
      .map(([categoria, v]) => ({ categoria, ...v }))
      .sort((a, b) => b.faturamento - a.faturamento);

    // Peças mais vendidas (por faturamento)
    const porProdutoMapa = new Map<
      number,
      { nome: string; faturamento: number; quantidade: number }
    >();
    for (const p of confirmados) {
      for (const item of p.itens) {
        const atual = porProdutoMapa.get(item.produtoId) ?? {
          nome: item.produto.nome,
          faturamento: 0,
          quantidade: 0,
        };
        atual.faturamento += Number(item.precoUnitario) * item.quantidade;
        atual.quantidade += item.quantidade;
        porProdutoMapa.set(item.produtoId, atual);
      }
    }
    const topProdutos = Array.from(porProdutoMapa.values())
      .sort((a, b) => b.faturamento - a.faturamento)
      .slice(0, 10);

    // Por método de pagamento
    const porMetodoMapa = new Map<string, { faturamento: number; pedidos: number }>();
    for (const p of confirmados) {
      const metodo = p.metodoPagamento ?? "não informado";
      const atual = porMetodoMapa.get(metodo) ?? { faturamento: 0, pedidos: 0 };
      atual.faturamento += Number(p.total);
      atual.pedidos += 1;
      porMetodoMapa.set(metodo, atual);
    }
    const porMetodo = Array.from(porMetodoMapa.entries()).map(([metodo, v]) => ({
      metodo,
      ...v,
    }));

    return {
      faturamentoConfirmado,
      faturamentoProdutos: faturamentoConfirmado - faturamentoFrete,
      faturamentoFrete,
      pedidosConfirmados: confirmados.length,
      ticketMedio,
      faturamentoPendente,
      pedidosPendentes: pendentes.length,
      faturamentoCancelado,
      pedidosCancelados: cancelados.length,
      porDia,
      porCategoria,
      topProdutos,
      porMetodo,
    };
  }),

  // ── Lista plana pra exportar CSV (contabilidade, planilha, etc.) ──
  exportar: adminProcedure.input(periodoSchema).query(async ({ input }) => {
    const inicio = new Date(`${input.desde}T00:00:00`);
    const fim = new Date(`${input.ate}T23:59:59.999`);

    const todos = await db.query.pedidos.findMany({
      where: and(gte(pedidos.criadoEm, inicio), lte(pedidos.criadoEm, fim)),
      orderBy: (p, { asc }) => asc(p.criadoEm),
    });

    return todos.map((p) => ({
      codigoPedido: p.codigoPedido,
      data: p.criadoEm.toISOString().split("T")[0],
      cliente: p.clienteNome,
      status: p.status,
      metodoPagamento: p.metodoPagamento ?? "",
      subtotal: p.subtotal,
      frete: p.frete ?? "0",
      total: p.total,
    }));
  }),
});
