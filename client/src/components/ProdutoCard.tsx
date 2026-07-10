import { Link } from "wouter";
import type { Produto } from "../lib/types";

export default function ProdutoCard({ produto }: { produto: Produto }) {
  return (
    <Link href={`/produto/${produto.slug}`} className="group block">
      <div className="aspect-square overflow-hidden rounded-xl bg-borda/30">
        {produto.imagens[0] && (
          <img
            src={produto.imagens[0]}
            alt={produto.nome}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        )}
      </div>
      <h3 className="mt-3 font-serif text-lg text-marrom-escuro">{produto.nome}</h3>
      <p className="text-terracota">
        R$ {Number(produto.precoBase).toFixed(2).replace(".", ",")}
      </p>
    </Link>
  );
}
