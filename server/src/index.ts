import "./env";
import express from "express";
import cors from "cors";
import { produtosRouter } from "./routes/produtos";
import { checkoutRouter } from "./routes/checkout";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/produtos", produtosRouter);
app.use("/api/checkout", checkoutRouter);

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Caro Cerâmica API rodando na porta ${PORT}`);
});
