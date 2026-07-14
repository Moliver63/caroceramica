import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { pedidos } from "../../shared/schema";
import { adminProcedure, router } from "../_core/trpc";

const statusValidos = [
  "aguardando_pagamento",
  "pago",
  "em_producao",
  "pronto_envio",
  "enviado",
  "entregue",
  "cancelado",
] as const;

export const pedidosRouter = router({
  // ── Lista todos os pedidos, mais recentes primeiro ────────────
  listar: adminProcedure.query(async () => {
    return db.query.pedidos.findMany({
      orderBy: desc(pedidos.criadoEm),
    });
  }),

  // ── Detalhe completo de um pedido (itens, cliente, endereço) ──
  buscarPorCodigo: adminProcedure
    .input(z.object({ codigoPedido: z.string() }))
    .query(async ({ input }) => {
      const pedido = await db.query.pedidos.findFirst({
        where: eq(pedidos.codigoPedido, input.codigoPedido),
        with: {
          itens: {
            with: {
              produto: true,
              varianteCor: true,
              varianteArgila: true,
            },
          },
        },
      });

      if (!pedido) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      return pedido;
    }),

  // ── Atualizar status manualmente (produção, enviado, etc.) ────
  atualizarStatus: adminProcedure
    .input(
      z.object({
        codigoPedido: z.string(),
        status: z.enum(statusValidos),
      })
    )
    .mutation(async ({ input }) => {
      const [atualizado] = await db
        .update(pedidos)
        .set({ status: input.status, atualizadoEm: new Date() })
        .where(eq(pedidos.codigoPedido, input.codigoPedido))
        .returning();

      if (!atualizado) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Pedido não encontrado" });
      }

      return atualizado;
    }),
});
