import { createContext, useContext, useState, type ReactNode } from "react";
import type { ItemCarrinho } from "./types";

interface CarrinhoContextValue {
  itens: ItemCarrinho[];
  adicionarItem: (item: ItemCarrinho) => void;
  removerItem: (produtoId: number, varianteCorId: number | null) => void;
  atualizarQuantidade: (
    produtoId: number,
    varianteCorId: number | null,
    quantidade: number
  ) => void;
  limparCarrinho: () => void;
  totalItens: number;
  subtotal: number;
  // Confirmação visual ao adicionar — o mini-carrinho lateral escuta isso
  ultimoItemAdicionado: ItemCarrinho | null;
  drawerAberto: boolean;
  fecharDrawer: () => void;
}

const CarrinhoContext = createContext<CarrinhoContextValue | null>(null);

export function CarrinhoProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [ultimoItemAdicionado, setUltimoItemAdicionado] = useState<ItemCarrinho | null>(null);
  const [drawerAberto, setDrawerAberto] = useState(false);

  function adicionarItem(novoItem: ItemCarrinho) {
    setItens((atual) => {
      const existente = atual.findIndex(
        (i) =>
          i.produtoId === novoItem.produtoId &&
          i.varianteCorId === novoItem.varianteCorId &&
          !novoItem.personalizacao // itens personalizados nunca fazem merge
      );

      if (existente >= 0) {
        const copia = [...atual];
        copia[existente] = {
          ...copia[existente],
          quantidade: copia[existente].quantidade + novoItem.quantidade,
        };
        return copia;
      }

      return [...atual, novoItem];
    });

    setUltimoItemAdicionado(novoItem);
    setDrawerAberto(true);
  }

  function fecharDrawer() {
    setDrawerAberto(false);
  }

  function removerItem(produtoId: number, varianteCorId: number | null) {
    setItens((atual) =>
      atual.filter(
        (i) => !(i.produtoId === produtoId && i.varianteCorId === varianteCorId)
      )
    );
  }

  function atualizarQuantidade(
    produtoId: number,
    varianteCorId: number | null,
    quantidade: number
  ) {
    setItens((atual) =>
      atual.map((i) =>
        i.produtoId === produtoId && i.varianteCorId === varianteCorId
          ? { ...i, quantidade }
          : i
      )
    );
  }

  function limparCarrinho() {
    setItens([]);
  }

  const totalItens = itens.reduce((soma, i) => soma + i.quantidade, 0);
  const subtotal = itens.reduce((soma, i) => {
    const precoBase = Number(i.produto.precoBase);
    const custoPersonalizacao = i.personalizacao
      ? Number(i.produto.custoPersonalizacao)
      : 0;
    return soma + (precoBase + custoPersonalizacao) * i.quantidade;
  }, 0);

  return (
    <CarrinhoContext.Provider
      value={{
        itens,
        adicionarItem,
        removerItem,
        atualizarQuantidade,
        limparCarrinho,
        totalItens,
        subtotal,
        ultimoItemAdicionado,
        drawerAberto,
        fecharDrawer,
      }}
    >
      {children}
    </CarrinhoContext.Provider>
  );
}

export function useCarrinho() {
  const ctx = useContext(CarrinhoContext);
  if (!ctx) throw new Error("useCarrinho precisa estar dentro de CarrinhoProvider");
  return ctx;
}
