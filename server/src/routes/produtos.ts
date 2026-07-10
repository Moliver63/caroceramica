import { Router } from "express";
import { db } from "../db";
import { produtos, variantesCor, itensKit } from "../db/schema";
import { eq } from "drizzle-orm";

export const produtosRouter = Router();

const CATEGORIAS_VALIDAS = ["consultorio", "casa"] as const;

// GET /api/produtos?categoria=casa
produtosRouter.get("/", async (req, res) => {
  try {
    const { categoria } = req.query;

    if (
      categoria !== undefined &&
      !CATEGORIAS_VALIDAS.includes(categoria as "consultorio" | "casa")
    ) {
      return res.status(400).json({
        erro: `Categoria inválida. Use uma de: ${CATEGORIAS_VALIDAS.join(", ")}.`,
      });
    }

    const lista = await db.query.produtos.findMany({
      where: categoria
        ? eq(produtos.categoria, categoria as "consultorio" | "casa")
        : eq(produtos.ativo, true),
      with: {
        variantesCor: true,
      },
    });

    res.json(lista);
  } catch (erro) {
    console.error("Erro ao listar produtos:", erro);
    res.status(500).json({ erro: "Erro interno ao listar produtos." });
  }
});

// GET /api/produtos/:slug
produtosRouter.get("/:slug", async (req, res) => {
  try {
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
  } catch (erro) {
    console.error(`Erro ao buscar produto "${req.params.slug}":`, erro);
    res.status(500).json({ erro: "Erro interno ao buscar produto." });
  }
});

// POST /api/produtos (admin)
produtosRouter.post("/", async (req, res) => {
  try {
    const [novo] = await db.insert(produtos).values(req.body).returning();
    res.status(201).json(novo);
  } catch (erro) {
    console.error("Erro ao criar produto:", erro);
    res.status(400).json({ erro: "Não foi possível criar o produto. Verifique os dados enviados." });
  }
});

// PUT /api/produtos/:id (admin)
produtosRouter.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ erro: "ID de produto inválido." });
    }

    const [atualizado] = await db
      .update(produtos)
      .set({ ...req.body, atualizadoEm: new Date() })
      .where(eq(produtos.id, id))
      .returning();

    if (!atualizado) return res.status(404).json({ erro: "Produto não encontrado" });
    res.json(atualizado);
  } catch (erro) {
    console.error(`Erro ao atualizar produto ${req.params.id}:`, erro);
    res.status(400).json({ erro: "Não foi possível atualizar o produto. Verifique os dados enviados." });
  }
});
