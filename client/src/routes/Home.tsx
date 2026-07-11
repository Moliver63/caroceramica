import { Link } from "wouter";
import { trpc } from "../lib/trpc";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProdutoCard from "../components/ProdutoCard";

export default function Home() {
  const { data: lista } = trpc.produtos.listar.useQuery();
  const destaques = (lista ?? []).slice(0, 4);

  return (
    <div>
      <Header />

      {/* Hero — banda com o divisor orgânico como elemento de assinatura */}
      <section className="borda-torneada bg-gradient-to-b from-borda/50 to-creme pb-24 pt-16 md:pb-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="eyebrow text-terracota">Feito à mão, uma peça de cada vez</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-marrom-escuro md:text-5xl">
            Receber com charme: um convite para celebrar o aqui e agora
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-marrom">
            Cada peça nasce do encontro entre a argila, o tempo e o cuidado. Mais do
            que objetos, são peças pensadas para acolher histórias, criar memórias e
            transformar momentos simples em experiências especiais.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/catalogo/consultorio"
              className="rounded-full bg-marrom-escuro px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#3a2e26]"
            >
              Para consultório
            </Link>
            <Link
              href="/catalogo/casa"
              className="rounded-full border border-marrom-escuro px-7 py-3 text-sm font-semibold text-marrom-escuro transition hover:bg-borda/30"
            >
              Para casa
            </Link>
          </div>
        </div>
      </section>

      {/* Tiles de categoria — entrada visual pro catálogo, não só texto */}
      <section className="mx-auto -mt-10 grid max-w-6xl gap-6 px-6 md:-mt-16 md:grid-cols-2 md:gap-8">
        {[
          { href: "/catalogo/consultorio", titulo: "Para consultório", desc: "Peças que acolhem quem chega." },
          { href: "/catalogo/casa", titulo: "Para casa", desc: "Objetos que viram rotina e memória." },
        ].map((cat) => (
          <Link
            key={cat.href}
            href={cat.href}
            className="group relative flex h-48 items-end overflow-hidden rounded-2xl bg-marrom-escuro p-6 shadow-lg md:h-64"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-carvao/80 via-carvao/20 to-transparent transition group-hover:from-carvao/90" />
            <div className="relative">
              <p className="font-serif text-2xl text-creme">{cat.titulo}</p>
              <p className="mt-1 text-sm text-creme/70">{cat.desc}</p>
            </div>
          </Link>
        ))}
      </section>

      {destaques.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <p className="eyebrow text-marrom/60">Seleção atual</p>
          <h2 className="mb-8 mt-1 font-serif text-2xl text-marrom-escuro">Destaques do ateliê</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
            {destaques.map((p) => (
              <ProdutoCard key={p.id} produto={p} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
