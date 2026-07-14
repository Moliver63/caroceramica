import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { leads } from "../../shared/schema";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";

export const leadsRouter = router({
  // ── Cadastro público (formulário de newsletter) ──────────────
  cadastrar: publicProcedure
    .input(z.object({ email: z.string().email(), nome: z.string().optional() }))
    .mutation(async ({ input }) => {
      try {
        await db
          .insert(leads)
          .values({ email: input.email, nome: input.nome })
          .onConflictDoUpdate({
            target: leads.email,
            set: { ativo: true, nome: input.nome },
          });
        return { sucesso: true as const };
      } catch (erro) {
        console.error("Erro ao cadastrar lead:", erro);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Não foi possível cadastrar seu e-mail agora. Tente novamente.",
        });
      }
    }),

  // ── Lista pro admin ver quem cadastrou ────────────────────────
  listar: adminProcedure.query(async () => {
    return db.query.leads.findMany({
      where: eq(leads.ativo, true),
      orderBy: desc(leads.criadoEm),
    });
  }),
});
