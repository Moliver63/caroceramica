import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCarrinho } from "../lib/carrinho-context";
import { trpc } from "../lib/trpc";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Checkout() {
  const { itens, subtotal, limparCarrinho } = useCarrinho();
  const [, navegar] = useLocation();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState("");
  const [metodoPagamento, setMetodoPagamento] = useState<"PIX" | "BOLETO" | "CREDIT_CARD">(
    "PIX"
  );

  const [endereco, setEndereco] = useState({
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    pais: "BR",
  });

  const [erro, setErro] = useState<string | null>(null);
  const criarPedido = trpc.checkout.criarPedido.useMutation();
  const enviando = criarPedido.isPending;

  const cepLimpo = endereco.cep.replace(/\D/g, "");
  const { data: frete, isFetching: calculandoFrete } = trpc.frete.calcular.useQuery(
    { cep: cepLimpo },
    { enabled: cepLimpo.length === 8 }
  );
  const valorFrete = frete?.encontrado ? frete.valor : 0;
  const total = subtotal + valorFrete;

  async function finalizarPedido() {
    setErro(null);

    try {
      const resposta = await criarPedido.mutateAsync({
        cliente: { nome, email, telefone, documento },
        enderecoEntrega: endereco,
        itens: itens.map((i) => ({
          produtoId: i.produtoId,
          varianteCorId: i.varianteCorId,
          varianteArgilaId: i.varianteArgilaId ?? null,
          quantidade: i.quantidade,
          precoUnitario:
            Number(i.produto.precoBase) +
            (i.personalizacao ? Number(i.produto.custoPersonalizacao) : 0),
          personalizado: !!i.personalizacao,
          textoCarimbo: i.personalizacao?.textoCarimbo,
          observacoesCliente: i.personalizacao?.observacoes,
        })),
        metodoPagamento,
      });

      if (!resposta.sucesso) {
        // Pedido foi registrado, mas a cobrança falhou — ainda assim leva
        // pro estado "aguardando pagamento" pra equipe entrar em contato.
        setErro(resposta.erro);
      }

      limparCarrinho();
      navegar(`/pedido/${resposta.codigoPedido}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao finalizar pedido");
    }
  }

  return (
    <div>
      <Header />

      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link href="/carrinho" className="text-sm text-marrom hover:text-terracota">
          ‹ Voltar ao carrinho
        </Link>
        <h1 className="mt-2 font-serif text-3xl text-marrom-escuro">Checkout</h1>

        <div className="mt-8 space-y-4">
          <h2 className="font-medium">Seus dados</h2>
          <input
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full rounded border border-borda px-3 py-2"
          />
          <input
            placeholder="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-borda px-3 py-2"
          />
          <input
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            className="w-full rounded border border-borda px-3 py-2"
          />
          <input
            placeholder="CPF ou CNPJ"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
            className="w-full rounded border border-borda px-3 py-2"
          />

          <h2 className="pt-4 font-medium">Endereço de entrega</h2>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="CEP"
              value={endereco.cep}
              onChange={(e) => setEndereco({ ...endereco, cep: e.target.value })}
              className="rounded border border-borda px-3 py-2"
            />
            <input
              placeholder="Número"
              value={endereco.numero}
              onChange={(e) => setEndereco({ ...endereco, numero: e.target.value })}
              className="rounded border border-borda px-3 py-2"
            />
            <input
              placeholder="Logradouro"
              value={endereco.logradouro}
              onChange={(e) => setEndereco({ ...endereco, logradouro: e.target.value })}
              className="col-span-2 rounded border border-borda px-3 py-2"
            />
            <input
              placeholder="Bairro"
              value={endereco.bairro}
              onChange={(e) => setEndereco({ ...endereco, bairro: e.target.value })}
              className="rounded border border-borda px-3 py-2"
            />
            <input
              placeholder="Cidade"
              value={endereco.cidade}
              onChange={(e) => setEndereco({ ...endereco, cidade: e.target.value })}
              className="rounded border border-borda px-3 py-2"
            />
            <input
              placeholder="UF"
              value={endereco.uf}
              onChange={(e) => setEndereco({ ...endereco, uf: e.target.value })}
              className="rounded border border-borda px-3 py-2"
            />
          </div>

          {cepLimpo.length === 8 && (
            <p className="text-sm text-marrom">
              {calculandoFrete && "Calculando frete…"}
              {!calculandoFrete && frete?.encontrado && (
                <>
                  Frete para {frete.regiao}: <strong>R$ {frete.valor.toFixed(2).replace(".", ",")}</strong>{" "}
                  — chega em até {frete.prazoDias} dias úteis após a produção
                </>
              )}
              {!calculandoFrete && frete && !frete.encontrado && (
                <span className="text-red-600">{frete.mensagem}</span>
              )}
            </p>
          )}

          <h2 className="pt-4 font-medium">Forma de pagamento (Asaas)</h2>
          <div className="flex gap-3">
            {(["PIX", "BOLETO", "CREDIT_CARD"] as const).map((metodo) => (
              <button
                key={metodo}
                onClick={() => setMetodoPagamento(metodo)}
                className={`rounded-lg border px-4 py-2 text-sm ${
                  metodoPagamento === metodo
                    ? "border-marrom-escuro bg-marrom-escuro text-white"
                    : "border-borda text-marrom-escuro"
                }`}
              >
                {metodo === "PIX" ? "Pix" : metodo === "BOLETO" ? "Boleto" : "Cartão"}
              </button>
            ))}
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex items-center justify-between border-t border-borda pt-6">
            <div>
              <p className="text-sm text-marrom">
                Subtotal: R$ {subtotal.toFixed(2).replace(".", ",")}
                {valorFrete > 0 && ` + Frete: R$ ${valorFrete.toFixed(2).replace(".", ",")}`}
              </p>
              <p className="text-lg font-medium">
                Total: R$ {total.toFixed(2).replace(".", ",")}
              </p>
            </div>
            <button
              onClick={finalizarPedido}
              disabled={enviando}
              className="rounded-lg bg-terracota px-6 py-3 text-white hover:opacity-90 disabled:opacity-50"
            >
              {enviando ? "Processando…" : "Finalizar pedido"}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
