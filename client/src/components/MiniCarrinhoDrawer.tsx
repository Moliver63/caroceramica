import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useCarrinho } from "../lib/carrinho-context";

export default function MiniCarrinhoDrawer() {
  const { ultimoItemAdicionado, drawerAberto, fecharDrawer, itens, totalItens, subtotal } =
    useCarrinho();
  const [, navegar] = useLocation();

  // Fecha sozinho com Esc — comportamento padrão de qualquer drawer/modal
  useEffect(() => {
    if (!drawerAberto) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") fecharDrawer();
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [drawerAberto, fecharDrawer]);

  if (!drawerAberto || !ultimoItemAdicionado) return null;

  const item = ultimoItemAdicionado;
  const precoUnitario =
    Number(item.produto.precoBase) +
    (item.personalizacao ? Number(item.produto.custoPersonalizacao) : 0);

  function irParaCheckout() {
    fecharDrawer();
    navegar("/checkout");
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Fundo escurecido — clicar fora fecha, igual qualquer drawer */}
      <button
        aria-label="Fechar"
        onClick={fecharDrawer}
        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
      />

      <aside className="relative flex h-full w-full max-w-md flex-col bg-creme shadow-2xl animate-[entrar_0.25s_ease-out]">
        <div className="flex items-center justify-between border-b border-borda px-6 py-5">
          <p className="flex items-center gap-2 font-serif text-lg text-marrom-escuro">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-esmalte text-xs text-creme">
              ✓
            </span>
            Adicionado ao carrinho
          </p>
          <button
            onClick={fecharDrawer}
            aria-label="Fechar"
            className="text-2xl leading-none text-marrom hover:text-terracota"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex gap-4 rounded-lg border border-borda p-3">
            {item.produto.imagens?.[0] && (
              <img
                src={item.produto.imagens[0]}
                alt=""
                className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-marrom-escuro">{item.produto.nome}</p>
              <p className="mt-1 text-xs text-marrom">Quantidade: {item.quantidade}</p>
              {item.personalizacao && (
                <p className="mt-0.5 text-xs text-terracota">Personalizado</p>
              )}
              <p className="mt-1 text-sm text-marrom-escuro">
                R$ {precoUnitario.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>

          {itens.length > 1 && (
            <p className="mt-4 text-sm text-marrom">
              Você tem <strong>{totalItens}</strong> {totalItens === 1 ? "item" : "itens"} no
              carrinho — subtotal de{" "}
              <strong>R$ {subtotal.toFixed(2).replace(".", ",")}</strong>.
            </p>
          )}
        </div>

        <div className="space-y-2.5 border-t border-borda px-6 py-5">
          <button
            onClick={irParaCheckout}
            className="w-full rounded-full bg-marrom-escuro py-3 text-sm font-semibold text-white transition hover:bg-[#3a2e26]"
          >
            Finalizar compra
          </button>
          <Link
            href="/carrinho"
            onClick={fecharDrawer}
            className="block w-full rounded-full border border-marrom-escuro py-3 text-center text-sm font-semibold text-marrom-escuro transition hover:bg-borda/30"
          >
            Ver carrinho
          </Link>
          <button
            onClick={fecharDrawer}
            className="w-full py-2 text-sm text-marrom hover:text-terracota"
          >
            Continuar comprando
          </button>
        </div>
      </aside>
    </div>
  );
}
