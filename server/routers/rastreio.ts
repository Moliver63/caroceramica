import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { pedidos } from "../../shared/schema";
import { publicProcedure, router } from "../_core/trpc";

export const rastreioRouter = router({
  // ── Consulta pública — código do pedido + e-mail do cliente ───
  // (não usa CPF sozinho de propósito: com só o código de pedido,
  // que é bem menos previsível, e o e-mail que o próprio cliente
  // informou na compra, evita expor pedido de terceiros por tentativa.)
  consultar: publicProcedure
    .input(z.object({ codigoPedido: z.string().min(1), email: z.string().email() }))
    .query(async ({ input }) => {
      const pedido = await db.query.pedidos.findFirst({
        where: and(
          eq(pedidos.codigoPedido, input.codigoPedido.trim().toUpperCase()),
          eq(pedidos.clienteEmail, input.email.trim().toLowerCase())
        ),
        with: {
          eventos: { orderBy: (e, { desc }) => desc(e.criadoEm) },
        },
      });

      if (!pedido) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Não encontramos um pedido com esses dados. Confira o código e o e-mail usados na compra.",
        });
      }

      return {
        codigoPedido: pedido.codigoPedido,
        status: pedido.status,
        transportadora: pedido.transportadora,
        codigoRastreio: pedido.codigoRastreio,
        criadoEm: pedido.criadoEm,
        eventos: pedido.eventos.map((e) => ({
          status: e.status,
          descricao: e.descricao,
          criadoEm: e.criadoEm,
        })),
      };
    }),
});
