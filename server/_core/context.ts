import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { COOKIE_NOME, tokenSessaoValido } from "./admin-session";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  isAdmin: boolean;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const token = opts.req.cookies?.[COOKIE_NOME];

  return {
    req: opts.req,
    res: opts.res,
    isAdmin: tokenSessaoValido(token),
  };
}
