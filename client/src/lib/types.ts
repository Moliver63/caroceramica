// Tipos compartilhados de domínio. Produto/VarianteCor vêm direto do
// AppRouter (inferRouterOutputs) — única fonte de verdade, sem risco de
// dessincronizar do schema real do banco. Os demais são tipos de estado
// local (carrinho, formulário de checkout).

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../server/routers";

type RouterOutputs = inferRouterOutputs<AppRouter>;

export type Produto = RouterOutputs["produtos"]["listar"][number];
export type VarianteCor = Produto["variantesCor"][number];
export type VarianteArgila = Produto["variantesArgila"][number];

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

// Item do carrinho — estado local, ainda não é pedido
export interface ItemCarrinho {
  produtoId: number;
  produto: Pick<Produto, "id" | "nome" | "slug" | "precoBase" | "personalizavel" | "custoPersonalizacao">;
  varianteCorId: number | null;
  varianteArgilaId?: number | null;
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
