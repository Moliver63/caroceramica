import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { mensagensContato } from "../../shared/schema";
import { adminProcedure, router } from "../_core/trpc";

export const mensagensRouter = router({
  listar: adminProcedure.query(async () => {
    return db.query.mensagensContato.findMany({
      orderBy: desc(mensagensContato.criadoEm),
    });
  }),

  marcarComoLida: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      await db
        .update(mensagensContato)
        .set({ lida: true })
        .where(eq(mensagensContato.id, input.id));
      return { sucesso: true as const };
    }),
});
