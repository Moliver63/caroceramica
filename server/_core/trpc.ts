import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  // Sem isso, um erro de validação (Zod) vaza pro cliente como um JSON
  // técnico bruto (tipo '[{"code":"too_small","message":"String must
  // contain at least 1 character(s)"...}]') — péssima experiência,
  // e em português nenhum. Troca por uma mensagem amigável sempre que
  // a causa for validação de input; erros que a gente mesmo lançou
  // com throw new TRPCError({message: "..."}) continuam intactos,
  // porque já escrevemos a mensagem certa nesses casos.
  errorFormatter({ shape, error }) {
    if (error.cause instanceof ZodError) {
      return {
        ...shape,
        message: "Verifique os dados preenchidos e tente novamente.",
      };
    }
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

/** Procedure que só executa se o cookie de sessão do admin for válido. */
export const adminProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.isAdmin) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Faça login para acessar o painel administrativo.",
    });
  }
  return next({ ctx });
});
