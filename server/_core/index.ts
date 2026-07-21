import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { ENV } from "./env";
import asaasWebhookRouter from "../routes/asaas-webhook";
import resendWebhookRouter from "../routes/resend-webhook";
import cronRouter from "../routes/cron";
import sitemapRouter from "../routes/sitemap";
import socialPreviewRouter from "../routes/social-preview";

async function startServer() {
  const app = express();
  const server = createServer(app);

  if (ENV.isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(cookieParser());
  app.use(
    express.json({
      // Guarda o corpo bruto (antes do parse) — necessário pra verificar
      // a assinatura de webhooks (Resend usa isso pra provar que é ele
      // mesmo enviando, não alguém se passando por ele).
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    })
  );

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // Webhook do Asaas — REST simples, fora do tRPC (chamada externa do gateway)
  app.use("/api/webhooks/asaas", asaasWebhookRouter);

  // Webhook do Resend — recebe e-mails enviados pra contato@carovargas.com.br
  app.use("/api/webhooks/resend", resendWebhookRouter);

  // Endpoints de cron (verificação periódica, chamados por serviço externo)
  app.use("/api/cron", cronRouter);

  // sitemap.xml — gerado na hora a partir dos produtos ativos reais
  app.use("/sitemap.xml", sitemapRouter);

  // Prévia de link pra bots de redes sociais (WhatsApp, Facebook, etc.)
  // que não executam JavaScript — precisa vir antes do serveStatic/Vite,
  // que serviria a SPA normal (sem os meta tags certos) pra qualquer um.
  app.use(socialPreviewRouter);

  // API tRPC — todas as chamadas do client passam por aqui
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Error handler global — última linha de defesa. Sem isso, qualquer erro
  // não tratado (ex: rejeição de Promise em uma rota async sem try/catch)
  // derruba o processo Node inteiro e tira o site do ar para todo mundo.
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error("Erro não tratado:", err);
    if (res.headersSent) return;
    res.status(500).json({ erro: "Erro interno do servidor." });
  };
  app.use("/api", errorHandler);

  if (ENV.isProduction) {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  server.listen(ENV.port, () => {
    console.log(`Caro Cerâmica rodando em http://localhost:${ENV.port}/`);
  });
}

startServer().catch((err) => {
  console.error("[FATAL] startServer failed:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});
