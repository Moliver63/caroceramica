import { Link } from "wouter";
import type { Produto } from "../lib/types";

export default function ProdutoCard({ produto }: { produto: Produto }) {
  return (
    <Link href={`/produto/${produto.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-borda/30">
        {produto.imagens?.[0] ? (
          <img
            src={produto.imagens[0]}
            alt={produto.nome}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-marrom/40">
            <span className="font-serif text-sm">Caro Vargas</span>
          </div>
        )}

        {produto.personalizavel && (
          <span className="absolute left-3 top-3 rounded-full bg-esmalte-claro px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-esmalte">
            Personalizável
          </span>
        )}

        <div className="absolute inset-0 flex items-end justify-center bg-carvao/0 pb-4 opacity-0 transition group-hover:bg-carvao/20 group-hover:opacity-100">
          <span className="rounded-full bg-creme px-4 py-2 text-xs font-semibold text-marrom-escuro shadow">
            Ver peça
          </span>
        </div>
      </div>

      <p className="eyebrow mt-3 text-marrom/60">
        {produto.categoria === "consultorio" ? "Consultório" : "Casa"}
      </p>
      <h3 className="font-serif text-lg text-marrom-escuro">{produto.nome}</h3>
      <p className="mt-0.5 text-terracota">
        R$ {Number(produto.precoBase).toFixed(2).replace(".", ",")}
      </p>
    </Link>
  );
}
