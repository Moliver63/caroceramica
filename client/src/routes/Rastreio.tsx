import { useState, type FormEvent } from "react";
import { trpc } from "../lib/trpc";
import { labelStatusPedido } from "@shared/const";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Rastreio() {
  const [codigoPedido, setCodigoPedido] = useState("");
  const [email, setEmail] = useState("");
  const [consultado, setConsultado] = useState<{ codigo: string; email: string } | null>(null);

  const { data: resultado, isFetching, error } = trpc.rastreio.consultar.useQuery(
    { codigoPedido: consultado?.codigo ?? "", email: consultado?.email ?? "" },
    { enabled: !!consultado, retry: false }
  );

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!codigoPedido.trim() || !email.trim()) return;
    setConsultado({ codigo: codigoPedido.trim(), email: email.trim() });
  }

  return (
    <div>
      <Header />

      <section className="mx-auto max-w-lg px-6 py-16">
        <p className="eyebrow text-terracota">Rastreamento</p>
        <h1 className="mt-1 font-serif text-3xl text-marrom-escuro">Onde está minha peça?</h1>
        <p className="mt-3 text-marrom">
          Digite o código do pedido (enviado por e-mail na confirmação da compra) e o
          e-mail usado na compra.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <input
            value={codigoPedido}
            onChange={(e) => setCodigoPedido(e.target.value)}
            placeholder="Código do pedido (ex: CC-2026-1234)"
            className="rounded-lg border border-borda bg-creme px-4 py-2.5 text-marrom-escuro"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail usado na compra"
            className="rounded-lg border border-borda bg-creme px-4 py-2.5 text-marrom-escuro"
          />
          <button
            type="submit"
            disabled={isFetching}
            className="rounded-full bg-marrom-escuro px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3a2e26] disabled:opacity-50"
          >
            {isFetching ? "Consultando…" : "Rastrear pedido"}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-600">
            {error.message}
          </p>
        )}

        {resultado && (
          <div className="mt-8 rounded-lg border border-borda p-5">
            <p className="eyebrow text-marrom/60">Pedido {resultado.codigoPedido}</p>
            <p className="mt-1 text-lg font-medium text-marrom-escuro">
              {labelStatusPedido(resultado.status)}
            </p>

            {resultado.codigoRastreio && (
              <p className="mt-2 text-sm text-marrom">
                {resultado.transportadora && `${resultado.transportadora} — `}
                Código de rastreio: <strong>{resultado.codigoRastreio}</strong>
              </p>
            )}

            <div className="mt-5 space-y-4 border-t border-borda pt-4">
              {resultado.eventos.map((evento, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-terracota" />
                  <div>
                    <p className="text-sm font-medium text-marrom-escuro">
                      {labelStatusPedido(evento.status)}
                    </p>
                    {evento.descricao && (
                      <p className="text-sm text-marrom">{evento.descricao}</p>
                    )}
                    <p className="text-xs text-marrom/60">
                      {new Date(evento.criadoEm).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
