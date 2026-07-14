import { sql } from "drizzle-orm";
import { db } from "../db";
import { pedidos } from "../../shared/schema";
import { adminProcedure, router } from "../_core/trpc";

export const clientesRouter = router({
  // ── Lista clientes únicos, agregados a partir dos pedidos ─────
  listar: adminProcedure.query(async () => {
    const linhas = await db
      .select({
        email: pedidos.clienteEmail,
        nome: sql<string>`max(${pedidos.clienteNome})`,
        telefone: sql<string>`max(${pedidos.clienteTelefone})`,
        totalPedidos: sql<number>`count(*)`,
        totalGasto: sql<string>`sum(${pedidos.total})`,
        ultimoPedidoEm: sql<string>`max(${pedidos.criadoEm})`,
      })
      .from(pedidos)
      .groupBy(pedidos.clienteEmail)
      .orderBy(sql`max(${pedidos.criadoEm}) desc`);

    return linhas;
  }),
});
