import { router } from "./_core/trpc";
import { produtosRouter } from "./routers/produtos";
import { checkoutRouter } from "./routers/checkout";
import { adminRouter } from "./routers/admin";
import { leadsRouter } from "./routers/leads";
import { freteRouter } from "./routers/frete";
import { pedidosRouter } from "./routers/pedidos";
import { clientesRouter } from "./routers/clientes";
import { rastreioRouter } from "./routers/rastreio";
import { mensagensRouter } from "./routers/mensagens";
import { categoriasRouter } from "./routers/categorias";

export const appRouter = router({
  produtos: produtosRouter,
  checkout: checkoutRouter,
  admin: adminRouter,
  leads: leadsRouter,
  frete: freteRouter,
  pedidos: pedidosRouter,
  clientes: clientesRouter,
  rastreio: rastreioRouter,
  mensagens: mensagensRouter,
  categorias: categoriasRouter,
});

export type AppRouter = typeof appRouter;
