import { Link } from "wouter";
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Produto } from "../lib/types";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProdutoCard from "../components/ProdutoCard";

export default function Home() {
  const [destaques, setDestaques] = useState<Produto[]>([]);

  useEffect(() => {
    api.listarProdutos().then((lista) => setDestaques(lista.slice(0, 4)));
  }, []);

  return (
    <div>
      <Header />

      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="font-serif text-4xl text-marrom-escuro md:text-5xl">
          Receber com charme: um convite para celebrar o aqui e agora
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-marrom">
          Cada peça nasce do encontro entre a argila, o tempo e o cuidado. Mais do
          que objetos, são peças pensadas para acolher histórias, criar memórias e
          transformar momentos simples em experiências especiais.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/catalogo/consultorio"
            className="rounded-lg bg-marrom-escuro px-6 py-3 text-white hover:bg-[#3a2e26]"
          >
            Para consultório
          </Link>
          <Link
            href="/catalogo/casa"
            className="rounded-lg border border-marrom-escuro px-6 py-3 text-marrom-escuro hover:bg-borda/20"
          >
            Para casa
          </Link>
        </div>
      </section>

      {destaques.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <h2 className="mb-6 font-serif text-2xl text-marrom-escuro">Destaques</h2>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
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
