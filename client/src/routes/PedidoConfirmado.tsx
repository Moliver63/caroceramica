import { useParams, Link } from "wouter";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PedidoConfirmado() {
  const { codigo } = useParams();

  return (
    <div>
      <Header />

      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <img
          src="/marca/selo.png"
          alt="Selo Caro Vargas"
          className="mx-auto h-24 w-auto rounded-2xl shadow-sm"
        />

        <h1 className="mt-8 font-serif text-3xl text-marrom-escuro">
          Pedido {codigo} recebido!
        </h1>
        <p className="mt-4 text-marrom">
          Assim que o pagamento for confirmado, sua peça entra em produção.
          Peças artesanais têm prazo de produção de até 30 dias — vamos te
          manter avisado por e-mail a cada etapa.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/rastreio"
            className="rounded-full border border-marrom-escuro px-7 py-3 text-sm font-semibold text-marrom-escuro transition hover:bg-borda/30"
          >
            Rastrear meu pedido
          </Link>
          <Link
            href="/"
            className="rounded-full bg-marrom-escuro px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#3a2e26]"
          >
            Continuar comprando
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
