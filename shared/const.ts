// Constantes compartilhadas entre client e server.
// Mesmo padrão usado no projeto shadiahasan (shared/const.ts).

// Fonte única das categorias — ordem, rótulo e descrição usados em
// Header, Home, Catálogo, ProdutoCard, ProdutoDetalhe e no formulário
// admin. Mudar categoria é só mexer aqui.
export const CATEGORIAS = [
  {
    valor: "pronta-entrega",
    label: "Pronta Entrega",
    descricao:
      "Peças disponíveis para envio imediato, sem necessidade de produção sob encomenda.",
  },
  {
    valor: "personalizados",
    label: "Personalizados",
    descricao:
      "Peças desenvolvidas sob medida, criadas de acordo com o desejo e a necessidade de cada cliente.",
  },
  {
    valor: "casa",
    label: "Casa",
    descricao: "Objetos que viram rotina e memória.",
  },
] as const;

export const CATEGORIAS_VALIDAS = [
  "pronta-entrega",
  "personalizados",
  "casa",
] as const;

export type Categoria = (typeof CATEGORIAS_VALIDAS)[number];

export function labelCategoria(valor: string): string {
  return CATEGORIAS.find((c) => c.valor === valor)?.label ?? valor;
}

export const ROTA_NAO_ENCONTRADA_MSG = "Rota não encontrada.";
export const ERRO_INTERNO_MSG = "Erro interno do servidor.";
