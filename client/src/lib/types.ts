// Tipos compartilhados de domínio — espelham o schema do Drizzle,
// mas ficam desacoplados para uso livre no client (forms, carrinho, etc.)

export type Categoria = "consultorio" | "casa";

export type StatusArte =
  | "nao_aplicavel"
  | "aguardando_upload"
  | "em_analise"
  | "aprovada"
  | "reprovada";

export type StatusPedido =
  | "aguardando_pagamento"
  | "pago"
  | "em_producao"
  | "pronto_envio"
  | "enviado"
  | "entregue"
  | "cancelado";

export type GatewayPagamento = "asaas" | "stripe";
export type MetodoPagamento = "pix" | "boleto" | "cartao_credito";

export interface VarianteCor {
  id: number;
  nome: string;
  codigoHex: string | null;
  codigoFornecedor: string | null;
  imagemUrl: string | null;
  estoqueDisponivel: boolean;
}

export interface Produto {
  id: number;
  nome: string;
  slug: string;
  categoria: Categoria;
  descricao: string | null;

  precoBase: string; // numeric vem como string do Postgres/Drizzle

  personalizavel: boolean;
  custoPersonalizacao: string;

  ehKit: boolean;
  itensDoKit?: Array<{ produto: Produto; quantidade: number }>;

  prazoProducaoDias: number;
  observacaoArtesanal: string | null;

  imagens: string[];
  variantesCor: VarianteCor[];
  ativo: boolean;
}

// Item do carrinho — estado local, ainda não é pedido
export interface ItemCarrinho {
  produtoId: number;
  produto: Pick<Produto, "id" | "nome" | "slug" | "precoBase" | "personalizavel" | "custoPersonalizacao">;
  varianteCorId: number | null;
  quantidade: number;

  // Preenchido apenas se produto.personalizavel === true
  personalizacao?: {
    arteCarimboFile?: File;
    arteCarimboUrl?: string;
    textoCarimbo?: string;
    observacoes?: string;
  };
}

export interface EnderecoEntrega {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  pais: string; // "BR" define Asaas; qualquer outro sinaliza necessidade de Stripe
}

export interface DadosCliente {
  nome: string;
  email: string;
  telefone: string;
  documento: string; // CPF/CNPJ — obrigatório para Asaas
}

export interface PedidoCriadoResponse {
  codigoPedido: string;
  gateway: GatewayPagamento;
  // Asaas: link de fatura/QR Code Pix. Stripe: client_secret / checkout url.
  linkPagamento: string;
  qrCodePix?: string;
  copiaECola?: string;
  totalCentavos: number;
}
