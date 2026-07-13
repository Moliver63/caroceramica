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

// Rate limit simples em memória — suficiente pra um servidor de instância
// única. Bloqueia um IP após muitas tentativas erradas seguidas.
const LIMITE_TENTATIVAS = 8;
const JANELA_MS = 15 * 60 * 1000; // 15 minutos
const tentativasPorIp = new Map<string, { contagem: number; expiraEm: number }>();

function ipBloqueado(ip: string): boolean {
  const registro = tentativasPorIp.get(ip);
  if (!registro) return false;
  if (Date.now() > registro.expiraEm) {
    tentativasPorIp.delete(ip);
    return false;
  }
  return registro.contagem >= LIMITE_TENTATIVAS;
}

function registrarTentativaFalha(ip: string) {
  const registro = tentativasPorIp.get(ip);
  if (!registro || Date.now() > registro.expiraEm) {
    tentativasPorIp.set(ip, { contagem: 1, expiraEm: Date.now() + JANELA_MS });
  } else {
    registro.contagem += 1;
  }
}

function limparTentativas(ip: string) {
  tentativasPorIp.delete(ip);
}

export const adminRouter = router({
  // ── Login por senha única (definida em ADMIN_PASSWORD) ──────
  login: publicProcedure
    .input(z.object({ senha: z.string().min(1) }))
    .mutation(({ input, ctx }) => {
      const ip = ctx.req.ip ?? "desconhecido";

      if (ipBloqueado(ip)) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente.",
        });
      }

      if (!ENV.adminPassword || !ENV.adminSessionSecret) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            "Login de admin não configurado no servidor (faltam ADMIN_PASSWORD/ADMIN_SESSION_SECRET no .env).",
        });
      }

      if (input.senha !== ENV.adminPassword) {
        registrarTentativaFalha(ip);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Senha incorreta." });
      }

      limparTentativas(ip);
      ctx.res.cookie(COOKIE_NOME, criarTokenSessao(), cookieOpts);
      return { sucesso: true as const };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    ctx.res.clearCookie(COOKIE_NOME, { path: "/" });
    return { sucesso: true as const };
  }),

  // ── O client usa isso pra saber se já está logado ────────────
  sessaoAtual: publicProcedure.query(({ ctx }) => ({ isAdmin: ctx.isAdmin })),

  // ── URL de upload direto do Cloudflare Images (o browser sobe a
  //    imagem direto pro Cloudflare, sem passar pelo nosso servidor) ──
  gerarUploadCloudflare: adminProcedure.mutation(async () => {
    if (!ENV.cloudflareAccountId || !ENV.cloudflareApiToken) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Cloudflare Images não configurado no servidor (.env).",
      });
    }

    let dados: { success?: boolean; result?: { uploadURL: string; id: string } };
    try {
      const resposta = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ENV.cloudflareAccountId}/images/v2/direct_upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ENV.cloudflareApiToken}`,
          },
          body: new URLSearchParams({ requireSignedURLs: "false" }),
        }
      );
      dados = await resposta.json();

      if (!resposta.ok || !dados.success || !dados.result) {
        console.error("Erro ao gerar upload do Cloudflare Images:", dados);
        throw new Error("resposta_invalida");
      }
    } catch (erro) {
      console.error("Falha ao contatar o Cloudflare Images:", erro);
      throw new TRPCError({
        code: "BAD_GATEWAY",
        message: "Não foi possível preparar o upload de imagem agora. Tente novamente.",
      });
    }

    return {
      uploadURL: dados.result.uploadURL,
      id: dados.result.id,
    };
  }),
});
