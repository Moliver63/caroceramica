import { Router } from "express";
import { db } from "../db";
import { produtos, variantesCor, itensKit } from "../db/schema";
import { eq } from "drizzle-orm";

export const produtosRouter = Router();

// GET /api/produtos?categoria=casa
produtosRouter.get("/", async (req, res) => {
  const { categoria } = req.query;

  const lista = await db.query.produtos.findMany({
    where: categoria
      ? eq(produtos.categoria, categoria as "consultorio" | "casa")
      : eq(produtos.ativo, true),
    with: {
      variantesCor: true,
    },
  });

  res.json(lista);
});

// GET /api/produtos/:slug
produtosRouter.get("/:slug", async (req, res) => {
  const produto = await db.query.produtos.findFirst({
    where: eq(produtos.slug, req.params.slug),
    with: {
      variantesCor: true,
    },
  });

  if (!produto) {
    return res.status(404).json({ erro: "Produto não encontrado" });
  }

  // Se for kit, resolve os itens que o compõem
  if (produto.ehKit) {
    const itens = await db.query.itensKit.findMany({
      where: eq(itensKit.kitId, produto.id),
      with: { produto: true },
    });
    return res.json({ ...produto, itensDoKit: itens });
  }

  res.json(produto);
});

// POST /api/produtos (admin)
produtosRouter.post("/", async (req, res) => {
  const [novo] = await db.insert(produtos).values(req.body).returning();
  res.status(201).json(novo);
});

// PUT /api/produtos/:id (admin)
produtosRouter.put("/:id", async (req, res) => {
  const [atualizado] = await db
    .update(produtos)
    .set({ ...req.body, atualizadoEm: new Date() })
    .where(eq(produtos.id, Number(req.params.id)))
    .returning();

  if (!atualizado) return res.status(404).json({ erro: "Produto não encontrado" });
  res.json(atualizado);
});
