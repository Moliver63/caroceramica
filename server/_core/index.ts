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

async function startServer() {
  const app = express();
  const server = createServer(app);

  if (ENV.isProduction) {
    app.set("trust proxy", 1);
  }

  app.use(cookieParser());
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // Webhook do Asaas — REST simples, fora do tRPC (chamada externa do gateway)
  app.use("/api/webhooks/asaas", asaasWebhookRouter);

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
