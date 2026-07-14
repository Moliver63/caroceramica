import { router } from "./_core/trpc";
import { produtosRouter } from "./routers/produtos";
import { checkoutRouter } from "./routers/checkout";
import { adminRouter } from "./routers/admin";
import { leadsRouter } from "./routers/leads";
import { freteRouter } from "./routers/frete";

export const appRouter = router({
  produtos: produtosRouter,
  checkout: checkoutRouter,
  admin: adminRouter,
  leads: leadsRouter,
  frete: freteRouter,
});

export type AppRouter = typeof appRouter;
