import { router } from "./_core/trpc";
import { produtosRouter } from "./routers/produtos";
import { checkoutRouter } from "./routers/checkout";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  produtos: produtosRouter,
  checkout: checkoutRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
