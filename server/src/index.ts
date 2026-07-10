import "./env";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { produtosRouter } from "./routes/produtos";
import { checkoutRouter } from "./routes/checkout";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/produtos", produtosRouter);
app.use("/api/checkout", checkoutRouter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Rota não encontrada
app.use("/api", (_req, res) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

// Error handler global — última linha de defesa. Sem isso, qualquer erro
// não tratado (ex: rejeição de Promise em uma rota async sem try/catch)
// derruba o processo Node inteiro e tira o site do ar para todo mundo.
const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error("Erro não tratado:", err);
  if (res.headersSent) return;
  res.status(500).json({ erro: "Erro interno do servidor." });
};
app.use(errorHandler);

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Caro Cerâmica API rodando na porta ${PORT}`);
});
