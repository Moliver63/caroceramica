import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Quando o painel admin tiver autenticação, adicionar aqui:
// export const adminProcedure = t.procedure.use(requireAdminMiddleware);
// (mesmo padrão do shadiahasan: server/_core/trpc.ts)
