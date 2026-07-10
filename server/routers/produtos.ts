/**
 * produtos.ts — Router tRPC de produtos
 * Localização: server/routers/produtos.ts
 *
 * No frontend, as chamadas ficam:
 *   trpc.produtos.listar.useQuery({ categoria: "casa" })
 *   trpc.produtos.buscarPorSlug.useQuery({ slug: "prato-oval-azul" })
 *   trpc.produtos.criar.useMutation()
 *   trpc.produtos.atualizar.useMutation()
 */

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { produtos, itensKit } from "../../shared/schema";
import { publicProcedure, router } from "../_core/trpc";

const categoriaSchema = z.enum(["consultorio", "casa"]);

export const produtosRouter = router({
  // ── Listar produtos (com filtro opcional de categoria) ──────
  listar: publicProcedure
    .input(z.object({ categoria: categoriaSchema.optional() }).optional())
    .query(async ({ input }) => {
      const categoria = input?.categoria;

      return db.query.produtos.findMany({
        where: categoria
          ? eq(produtos.categoria, categoria)
          : eq(produtos.ativo, true),
        with: { variantesCor: true },
      });
    }),

  // ── Buscar um produto pelo slug ──────────────────────────────
  buscarPorSlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const produto = await db.query.produtos.findFirst({
        where: eq(produtos.slug, input.slug),
        with: { variantesCor: true },
      });

      if (!produto) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Produto não encontrado",
        });
      }

      if (produto.ehKit) {
        const itens = await db.query.itensKit.findMany({
          where: eq(itensKit.kitId, produto.id),
          with: { produto: true },
        });
        return { ...produto, itensDoKit: itens };
      }

      return produto;
    }),

  // ── Criar produto (admin) ────────────────────────────────────
  criar: publicProcedure
    .input(
      z.object({
        nome: z.string().min(1),
        slug: z.string().min(1),
        categoria: categoriaSchema,
        descricao: z.string().optional(),
        precoBase: z.string(),
        personalizavel: z.boolean().default(false),
        custoPersonalizacao: z.string().optional(),
        ehKit: z.boolean().default(false),
        prazoProducaoDias: z.number().int().positive().default(30),
        observacaoArtesanal: z.string().optional(),
        imagens: z.array(z.string()).default([]),
        ativo: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const [novo] = await db.insert(produtos).values(input).returning();
        return novo;
      } catch (erro) {
        console.error("Erro ao criar produto:", erro);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não foi possível criar o produto. Verifique os dados enviados.",
        });
      }
    }),

  // ── Atualizar produto (admin) ────────────────────────────────
  atualizar: publicProcedure
    .input(
      z.object({
        id: z.number().int(),
        dados: z.record(z.string(), z.unknown()),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const [atualizado] = await db
          .update(produtos)
          .set({ ...input.dados, atualizadoEm: new Date() })
          .where(eq(produtos.id, input.id))
          .returning();

        if (!atualizado) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Produto não encontrado" });
        }
        return atualizado;
      } catch (erro) {
        if (erro instanceof TRPCError) throw erro;
        console.error(`Erro ao atualizar produto ${input.id}:`, erro);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não foi possível atualizar o produto. Verifique os dados enviados.",
        });
      }
    }),
});
