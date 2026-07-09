import { useParams } from "wouter";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function PedidoConfirmado() {
  const { codigo } = useParams();

  return (
    <div>
      <Header />

      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="font-serif text-3xl text-marrom-escuro">
          Pedido {codigo} recebido!
        </h1>
        <p className="mt-4 text-marrom">
          Assim que o pagamento for confirmado, sua peça entra em produção.
          Peças artesanais têm prazo de produção de até 30 dias — vamos te
          manter avisado por e-mail a cada etapa.
        </p>
      </div>

      <Footer />
    </div>
  );
}
