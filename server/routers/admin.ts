import { createHash } from "crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { COOKIE_NOME, criarTokenSessao } from "../_core/admin-session";

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: ENV.isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const adminRouter = router({
  // ── Login por senha única (definida em ADMIN_PASSWORD) ──────
  login: publicProcedure
    .input(z.object({ senha: z.string().min(1) }))
    .mutation(({ input, ctx }) => {
      if (!ENV.adminPassword || !ENV.adminSessionSecret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Login de admin não configurado no servidor (faltam ADMIN_PASSWORD/ADMIN_SESSION_SECRET no .env).",
        });
      }

      if (input.senha !== ENV.adminPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha incorreta." });
      }

      ctx.res.cookie(COOKIE_NOME, criarTokenSessao(), cookieOpts);
      return { sucesso: true as const };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NOME, { path: "/" });
    return { sucesso: true as const };
  }),

  // ── O client usa isso pra saber se já está logado ────────────
  sessaoAtual: publicProcedure.query(({ ctx }) => ({ isAdmin: ctx.isAdmin })),

  // ── Assinatura pro upload direto no Cloudinary (o browser envia
  //    a imagem direto pra Cloudinary, sem passar pelo nosso servidor) ──
  gerarAssinaturaUpload: adminProcedure.mutation(() => {
    if (
      !ENV.cloudinaryCloudName ||
      !ENV.cloudinaryApiKey ||
      !ENV.cloudinaryApiSecret
    ) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Cloudinary não configurado no servidor (.env).",
      });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "caro-ceramica/produtos";

    // Cloudinary exige a assinatura sobre os parâmetros em ordem alfabética,
    // concatenados como "chave=valor&...", com o api_secret no final.
    const paramsParaAssinar = `folder=${folder}&timestamp=${timestamp}${ENV.cloudinaryApiSecret}`;
    const assinatura = createHash("sha1").update(paramsParaAssinar).digest("hex");

    return {
      timestamp,
      assinatura,
      folder,
      apiKey: ENV.cloudinaryApiKey,
      cloudName: ENV.cloudinaryCloudName,
    };
  }),
});
