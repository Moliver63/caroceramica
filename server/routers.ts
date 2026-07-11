import { router } from "./_core/trpc";
import { produtosRouter } from "./routers/produtos";
import { checkoutRouter } from "./routers/checkout";

export const appRouter = router({
  produtos: produtosRouter,
  checkout: checkoutRouter,
});

export type AppRouter = typeof appRouter;
