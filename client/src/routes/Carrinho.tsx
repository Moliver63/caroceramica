import { Link, useLocation } from "wouter";
import { useCarrinho } from "../lib/carrinho-context";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function Carrinho() {
  const { itens, removerItem, atualizarQuantidade, subtotal } = useCarrinho();
  const [, navegar] = useLocation();

  if (itens.length === 0) {
    return (
      <div>
        <Header />
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-marrom">Seu carrinho está vazio.</p>
          <Link href="/">
            <a className="mt-4 inline-block text-terracota underline">
              Voltar para o catálogo
            </a>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />

      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-serif text-3xl text-marrom-escuro">Seu carrinho</h1>

        <div className="mt-8 divide-y divide-borda">
          {itens.map((item) => {
            const precoUnit =
              Number(item.produto.precoBase) +
              (item.personalizacao ? Number(item.produto.custoPersonalizacao) : 0);

            return (
              <div
                key={`${item.produtoId}-${item.varianteCorId}`}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <p className="font-medium text-marrom-escuro">{item.produto.nome}</p>
                  {item.personalizacao && (
                    <p className="text-xs text-terracota">Personalizado com carimbo</p>
                  )}
                  <p className="text-sm text-marrom">
                    R$ {precoUnit.toFixed(2).replace(".", ",")}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={item.quantidade}
                    onChange={(e) =>
                      atualizarQuantidade(
                        item.produtoId,
                        item.varianteCorId,
                        Number(e.target.value)
                      )
                    }
                    className="w-16 rounded border border-borda px-2 py-1 text-center"
                  />
                  <button
                    onClick={() => removerItem(item.produtoId, item.varianteCorId)}
                    className="text-sm text-marrom hover:text-red-600"
                  >
                    Remover
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between border-t border-borda pt-6">
          <p className="text-lg font-medium text-marrom-escuro">
            Subtotal: R$ {subtotal.toFixed(2).replace(".", ",")}
          </p>
          <button
            onClick={() => navegar("/checkout")}
            className="rounded-lg bg-marrom-escuro px-6 py-3 text-white hover:bg-[#3a2e26]"
          >
            Ir para o checkout
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
