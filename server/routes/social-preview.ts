import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { produtos } from "../../shared/schema";
import { labelCategoria } from "../../shared/const";

const socialPreviewRouter = Router();

const BASE_URL = "https://carovargas.com.br";
const OG_IMAGEM_PADRAO = `${BASE_URL}/marca/og-banner.jpg`;

// User-Agents dos bots que buscam a prévia de link (não executam JS —
// por isso precisam receber HTML pronto, diferente do Googlebot que
// consegue rodar a SPA normalmente).
const REGEX_BOT_SOCIAL =
  /WhatsApp|facebookexternalhit|Facebot|Twitterbot|LinkedInBot|TelegramBot|Slackbot|Discordbot|SkypeUriPreview|Pinterest/i;

function paginaHtml(params: {
  titulo: string;
  descricao: string;
  imagem: string;
  url: string;
}) {
  const escapar = (s: string) => s.replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<title>${escapar(params.titulo)}</title>
<meta name="description" content="${escapar(params.descricao)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Caro Vargas Cerâmica" />
<meta property="og:title" content="${escapar(params.titulo)}" />
<meta property="og:description" content="${escapar(params.descricao)}" />
<meta property="og:image" content="${params.imagem}" />
<meta property="og:url" content="${params.url}" />
<meta name="twitter:card" content="summary_large_image" />
<meta http-equiv="refresh" content="0; url=${params.url}" />
</head>
<body></body>
</html>`;
}

socialPreviewRouter.get("/produto/:slug", async (req, res, next) => {
  const userAgent = req.header("user-agent") ?? "";
  if (!REGEX_BOT_SOCIAL.test(userAgent)) return next();

  try {
    const produto = await db.query.produtos.findFirst({
      where: eq(produtos.slug, req.params.slug),
    });

    if (!produto) return next();

    const preco = produto.precoSobConsulta
      ? "Sob consulta"
      : `R$ ${Number(produto.precoBase).toFixed(2).replace(".", ",")}`;

    res.send(
      paginaHtml({
        titulo: `${produto.nome} — Caro Vargas Cerâmica`,
        descricao: `${produto.descricao ?? labelCategoria(produto.categoria)} — ${preco}`,
        imagem: produto.imagens?.[0] ?? OG_IMAGEM_PADRAO,
        url: `${BASE_URL}/produto/${produto.slug}`,
      })
    );
  } catch (erro) {
    console.error("Erro ao gerar prévia social do produto:", erro);
    next();
  }
});

export default socialPreviewRouter;
