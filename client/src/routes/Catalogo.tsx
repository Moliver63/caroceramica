import { useParams } from "wouter";
import { trpc } from "../lib/trpc";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProdutoCard from "../components/ProdutoCard";

export default function Catalogo() {
  const { categoria } = useParams<{ categoria: "consultorio" | "casa" }>();
  const { data: produtos = [], isLoading: carregando } = trpc.produtos.listar.useQuery({
    categoria,
  });

  const titulo = categoria === "consultorio" ? "Para consultório" : "Para casa";

  return (
    <div>
      <Header />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="font-serif text-3xl text-marrom-escuro">{titulo}</h1>

        {carregando && <p className="mt-6 text-marrom">Carregando…</p>}

        {!carregando && produtos.length === 0 && (
          <p className="mt-6 text-marrom">Nenhuma peça encontrada nesta categoria.</p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-3">
          {produtos.map((p) => (
            <ProdutoCard key={p.id} produto={p} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
