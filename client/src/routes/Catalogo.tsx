import { useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { trpc } from "../lib/trpc";
import { labelCategoria, type Categoria } from "@shared/const";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProdutoCard from "../components/ProdutoCard";
import Seo from "../components/Seo";

type Ordenacao = "relevancia" | "menor-preco" | "maior-preco" | "nome";

export default function Catalogo() {
  const { categoria } = useParams<{ categoria: Categoria }>();
  const { data: produtos = [], isLoading: carregando } = trpc.produtos.listar.useQuery({
    categoria,
  });
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("relevancia");

  const titulo = labelCategoria(categoria ?? "");

  const produtosOrdenados = useMemo(() => {
    const lista = [...produtos];
    switch (ordenacao) {
      case "menor-preco":
        return lista.sort((a, b) => Number(a.precoBase) - Number(b.precoBase));
      case "maior-preco":
        return lista.sort((a, b) => Number(b.precoBase) - Number(a.precoBase));
      case "nome":
        return lista.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
      default:
        return lista;
    }
  }, [produtos, ordenacao]);

  return (
    <div>
      <Seo
        titulo={`${titulo} — Cerâmica artesanal`}
        descricao={`Confira as peças de ${titulo.toLowerCase()} da Caro Vargas Cerâmica — feitas à mão, uma a uma, no torno.`}
        caminho={`/catalogo/${categoria}`}
      />
      <Header />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <nav className="mb-4 flex items-center gap-1.5 text-sm text-marrom">
          <Link href="/" className="hover:text-terracota">
            Início
          </Link>
          <span>/</span>
          <span className="text-marrom-escuro">{titulo}</span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-borda pb-6">
          <div>
            <p className="eyebrow text-marrom/60">Catálogo</p>
            <h1 className="mt-1 font-serif text-3xl text-marrom-escuro">{titulo}</h1>
          </div>

          {!carregando && produtos.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-marrom">
              Ordenar por
              <select
                value={ordenacao}
                onChange={(e) => setOrdenacao(e.target.value as Ordenacao)}
                className="rounded-lg border border-borda bg-creme px-3 py-2 text-marrom-escuro"
              >
                <option value="relevancia">Relevância</option>
                <option value="menor-preco">Menor preço</option>
                <option value="maior-preco">Maior preço</option>
                <option value="nome">Nome (A–Z)</option>
              </select>
            </label>
          )}
        </div>

        {carregando && (
          <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-2xl bg-borda/40" />
                <div className="mt-3 h-3 w-16 rounded bg-borda/40" />
                <div className="mt-2 h-4 w-32 rounded bg-borda/40" />
              </div>
            ))}
          </div>
        )}

        {!carregando && produtos.length === 0 && (
          <p className="mt-10 text-center text-marrom">
            Ainda não temos peças publicadas nesta categoria. Volte em breve.
          </p>
        )}

        <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3">
          {produtosOrdenados.map((p) => (
            <ProdutoCard key={p.id} produto={p} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
