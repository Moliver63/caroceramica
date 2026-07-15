import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { categoriaBanners } from "../../shared/schema";
import { CATEGORIAS_VALIDAS } from "../../shared/const";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";

const categoriaSchema = z.enum(CATEGORIAS_VALIDAS);

export const categoriasRouter = router({
  // ── Público — a Home usa isso pra saber a foto de cada tile ────
  listarBanners: publicProcedure.query(async () => {
    const linhas = await db.query.categoriaBanners.findMany();
    // devolve como { "pronta-entrega": "https://...", ... }
    const mapa: Record<string, string | null> = {};
    for (const l of linhas) mapa[l.categoria] = l.imagemUrl;
    return mapa;
  }),

  // ── Admin — define/troca o banner de uma categoria ──────────────
  definirBanner: adminProcedure
    .input(z.object({ categoria: categoriaSchema, imagemUrl: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await db
        .insert(categoriaBanners)
        .values({ categoria: input.categoria, imagemUrl: input.imagemUrl })
        .onConflictDoUpdate({
          target: categoriaBanners.categoria,
          set: { imagemUrl: input.imagemUrl, atualizadoEm: new Date() },
        });
      return { sucesso: true as const };
    }),

  removerBanner: adminProcedure
    .input(z.object({ categoria: categoriaSchema }))
    .mutation(async ({ input }) => {
      await db
        .insert(categoriaBanners)
        .values({ categoria: input.categoria, imagemUrl: null })
        .onConflictDoUpdate({
          target: categoriaBanners.categoria,
          set: { imagemUrl: null, atualizadoEm: new Date() },
        });
      return { sucesso: true as const };
    }),
});
