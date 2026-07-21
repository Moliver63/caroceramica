import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { produtos } from "../../shared/schema";

const sitemapRouter = Router();

const BASE_URL = "https://carovargas.com.br";

const PAGINAS_ESTATICAS = [
  { caminho: "/", prioridade: "1.0", frequencia: "daily" },
  { caminho: "/catalogo/pronta-entrega", prioridade: "0.9", frequencia: "daily" },
  { caminho: "/catalogo/personalizados", prioridade: "0.9", frequencia: "daily" },
  { caminho: "/catalogo/casa", prioridade: "0.9", frequencia: "daily" },
  { caminho: "/historia", prioridade: "0.6", frequencia: "monthly" },
  { caminho: "/rastreio", prioridade: "0.3", frequencia: "monthly" },
];

sitemapRouter.get("/", async (_req, res) => {
  try {
    const produtosAtivos = await db.query.produtos.findMany({
      where: eq(produtos.ativo, true),
      columns: { slug: true, atualizadoEm: true },
    });

    const urls = [
      ...PAGINAS_ESTATICAS.map(
        (p) =>
          `<url><loc>${BASE_URL}${p.caminho}</loc><changefreq>${p.frequencia}</changefreq><priority>${p.prioridade}</priority></url>`
      ),
      ...produtosAtivos.map(
        (p) =>
          `<url><loc>${BASE_URL}/produto/${p.slug}</loc><lastmod>${p.atualizadoEm.toISOString().split("T")[0]}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
      ),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    res.header("Content-Type", "application/xml");
    res.send(xml);
  } catch (erro) {
    console.error("Erro ao gerar sitemap:", erro);
    res.status(500).send("Erro ao gerar sitemap.");
  }
});

export default sitemapRouter;
