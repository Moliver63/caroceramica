import { useEffect } from "react";

const BASE_URL = "https://carovargas.com.br";

function definirMeta(atributo: "name" | "property", chave: string, conteudo: string) {
  let tag = document.querySelector(`meta[${atributo}="${chave}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(atributo, chave);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", conteudo);
}

export default function Seo({
  titulo,
  descricao,
  caminho,
  imagem,
  semIndexar = false,
}: {
  titulo: string;
  descricao: string;
  caminho: string;
  imagem?: string;
  semIndexar?: boolean;
}) {
  useEffect(() => {
    const tituloCompleto = titulo.includes("Caro Vargas") ? titulo : `${titulo} | Caro Vargas Cerâmica`;
    const url = `${BASE_URL}${caminho}`;
    const imagemFinal = imagem ?? `${BASE_URL}/marca/og-banner.jpg`;

    document.title = tituloCompleto;
    definirMeta("name", "description", descricao);
    definirMeta("property", "og:title", tituloCompleto);
    definirMeta("property", "og:description", descricao);
    definirMeta("property", "og:url", url);
    definirMeta("property", "og:image", imagemFinal);
    definirMeta("name", "twitter:image", imagemFinal);
    definirMeta("name", "robots", semIndexar ? "noindex, nofollow" : "index, follow");

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [titulo, descricao, caminho, imagem, semIndexar]);

  return null;
}
