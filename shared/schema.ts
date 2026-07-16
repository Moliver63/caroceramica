import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ──────────────────────────────────────────────────────────
// ENUMS
// ──────────────────────────────────────────────────────────

export const categoriaEnum = pgEnum("categoria", [
  "personalizados",
  "casa",
  "pronta-entrega",
]);

export const statusArteEnum = pgEnum("status_arte", [
  "nao_aplicavel", // produto não personalizável
  "aguardando_upload",
  "em_analise",
  "aprovada",
  "reprovada",
]);

export const statusPedidoEnum = pgEnum("status_pedido", [
  "aguardando_pagamento",
  "pago",
  "em_producao",
  "pronto_envio",
  "enviado",
  "entregue",
  "cancelado",
]);

export const gatewayEnum = pgEnum("gateway_pagamento", ["asaas", "stripe"]);

export const metodoPagamentoEnum = pgEnum("metodo_pagamento", [
  "pix",
  "boleto",
  "cartao_credito",
]);

export const tipoPersonalizacaoEnum = pgEnum("tipo_personalizacao", [
  "carimbo",
  "decalque",
]);

// ──────────────────────────────────────────────────────────
// PRODUTOS
// ──────────────────────────────────────────────────────────

export const produtos = pgTable("produtos", {
  id: serial("id").primaryKey(),
  nome: varchar("nome", { length: 160 }).notNull(),
  slug: varchar("slug", { length: 180 }).notNull().unique(),
  categoria: categoriaEnum("categoria").notNull(),
  descricao: text("descricao"),

  precoBase: numeric("preco_base", { precision: 10, scale: 2 }).notNull(),

  // Personalização (carimbo exclusivo, gravação, etc.)
  personalizavel: boolean("personalizavel").notNull().default(false),
  tipoPersonalizacao: tipoPersonalizacaoEnum("tipo_personalizacao"),
  custoPersonalizacao: numeric("custo_personalizacao", {
    precision: 10,
    scale: 2,
  }).default("0"),

  // Quando true, esconde precoBase na vitrine e mostra "Sob consulta"
  precoSobConsulta: boolean("preco_sob_consulta").notNull().default(false),

  // Estoque — só é levado em conta quando controlarEstoque=true (faz
  // sentido pra "Pronta Entrega"; peças sob encomenda/personalizadas
  // normalmente não têm estoque fixo, então ficam de fora do controle)
  controlarEstoque: boolean("controlar_estoque").notNull().default(false),
  estoque: integer("estoque").notNull().default(0),

  // Kit (ex: prato oval + amassadinho P)
  ehKit: boolean("eh_kit").notNull().default(false),

  // Produção artesanal
  prazoProducaoDias: integer("prazo_producao_dias").notNull().default(30),
  observacaoArtesanal: text("observacao_artesanal").default(
    "Peça feita à mão. Pequenas variações de forma, textura e tonalidade fazem parte do processo artesanal."
  ),

  imagens: jsonb("imagens").$type<string[]>().default([]),
  ativo: boolean("ativo").notNull().default(true),

  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});

// Variantes de cor de um produto (ex: Azul SC076, Verde SC091, Dourado SC092)
export const variantesCor = pgTable("variantes_cor", {
  id: serial("id").primaryKey(),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 80 }).notNull(), // ex: "Cinza Urbano"
  codigoHex: varchar("codigo_hex", { length: 7 }), // ex: "#B08D6E"
  codigoFornecedor: varchar("codigo_fornecedor", { length: 40 }), // ex: "SC076"
  imagemUrl: text("imagem_url"),
  estoqueDisponivel: boolean("estoque_disponivel").notNull().default(true),
});

// Variantes de cor da argila (antes do esmalte) — ex: Terracota, Branca, Preta
export const variantesArgila = pgTable("variantes_argila", {
  id: serial("id").primaryKey(),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "cascade" }),
  nome: varchar("nome", { length: 80 }).notNull(),
  codigoHex: varchar("codigo_hex", { length: 7 }),
  imagemUrl: text("imagem_url"),
  estoqueDisponivel: boolean("estoque_disponivel").notNull().default(true),
});

// Itens que compõem um kit (auto-relação produto -> produto)
export const itensKit = pgTable("itens_kit", {
  id: serial("id").primaryKey(),
  kitId: integer("kit_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "cascade" }),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id, { onDelete: "cascade" }),
  quantidade: integer("quantidade").notNull().default(1),
});

export const produtosRelations = relations(produtos, ({ many }) => ({
  variantesCor: many(variantesCor),
  variantesArgila: many(variantesArgila),
  itensDoKit: many(itensKit, { relationName: "kit" }),
}));

export const variantesCorRelations = relations(variantesCor, ({ one }) => ({
  produto: one(produtos, {
    fields: [variantesCor.produtoId],
    references: [produtos.id],
  }),
}));

export const variantesArgilaRelations = relations(variantesArgila, ({ one }) => ({
  produto: one(produtos, {
    fields: [variantesArgila.produtoId],
    references: [produtos.id],
  }),
}));

export const itensKitRelations = relations(itensKit, ({ one }) => ({
  kit: one(produtos, {
    fields: [itensKit.kitId],
    references: [produtos.id],
    relationName: "kit",
  }),
  produto: one(produtos, {
    fields: [itensKit.produtoId],
    references: [produtos.id],
  }),
}));

// ──────────────────────────────────────────────────────────
// PEDIDOS
// ──────────────────────────────────────────────────────────

export const pedidos = pgTable("pedidos", {
  id: serial("id").primaryKey(),
  codigoPedido: varchar("codigo_pedido", { length: 20 }).notNull().unique(), // ex: CC-2026-0042

  clienteNome: varchar("cliente_nome", { length: 160 }).notNull(),
  clienteEmail: varchar("cliente_email", { length: 160 }).notNull(),
  clienteTelefone: varchar("cliente_telefone", { length: 30 }),
  clienteDocumento: varchar("cliente_documento", { length: 20 }), // CPF/CNPJ (Asaas exige)

  enderecoEntrega: jsonb("endereco_entrega").$type<{
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    pais: string; // "BR" ou outro, para decidir Asaas x Stripe
  }>(),

  status: statusPedidoEnum("status").notNull().default("aguardando_pagamento"),

  gateway: gatewayEnum("gateway").notNull(), // asaas (padrão) | stripe (fase 2)
  metodoPagamento: metodoPagamentoEnum("metodo_pagamento"),
  gatewayReferenciaId: varchar("gateway_referencia_id", { length: 120 }), // id da cobrança no provedor

  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  custoPersonalizacaoTotal: numeric("custo_personalizacao_total", {
    precision: 10,
    scale: 2,
  }).default("0"),
  frete: numeric("frete", { precision: 10, scale: 2 }).default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),

  prazoProducaoEstimado: timestamp("prazo_producao_estimado"),

  // Rastreio — preenchido pelo admin quando o pedido é despachado
  transportadora: varchar("transportadora", { length: 60 }),
  codigoRastreio: varchar("codigo_rastreio", { length: 60 }),

  // true depois que o lembrete de "checkout abandonado" foi mandado —
  // evita mandar o mesmo lembrete mais de uma vez pro mesmo pedido
  lembreteAbandonoEnviado: boolean("lembrete_abandono_enviado").notNull().default(false),

  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});

export const itensPedido = pgTable("itens_pedido", {
  id: serial("id").primaryKey(),
  pedidoId: integer("pedido_id")
    .notNull()
    .references(() => pedidos.id, { onDelete: "cascade" }),
  produtoId: integer("produto_id")
    .notNull()
    .references(() => produtos.id),
  varianteCorId: integer("variante_cor_id").references(() => variantesCor.id),
  varianteArgilaId: integer("variante_argila_id").references(() => variantesArgila.id),

  quantidade: integer("quantidade").notNull().default(1),
  precoUnitario: numeric("preco_unitario", { precision: 10, scale: 2 }).notNull(),

  // Personalização deste item específico (carimbo)
  personalizado: boolean("personalizado").notNull().default(false),
  arteCarimboUrl: text("arte_carimbo_url"),
  statusArte: statusArteEnum("status_arte").notNull().default("nao_aplicavel"),
  textoCarimbo: varchar("texto_carimbo", { length: 60 }),
  observacoesCliente: text("observacoes_cliente"),
});

export const pedidosRelations = relations(pedidos, ({ many }) => ({
  itens: many(itensPedido),
  eventos: many(pedidoEventos),
}));

export const itensPedidoRelations = relations(itensPedido, ({ one }) => ({
  pedido: one(pedidos, {
    fields: [itensPedido.pedidoId],
    references: [pedidos.id],
  }),
  produto: one(produtos, {
    fields: [itensPedido.produtoId],
    references: [produtos.id],
  }),
  varianteCor: one(variantesCor, {
    fields: [itensPedido.varianteCorId],
    references: [variantesCor.id],
  }),
  varianteArgila: one(variantesArgila, {
    fields: [itensPedido.varianteArgilaId],
    references: [variantesArgila.id],
  }),
}));

// Linha do tempo de um pedido — um evento por mudança de status,
// usado tanto pela página pública de rastreio quanto pelo admin.
export const pedidoEventos = pgTable("pedido_eventos", {
  id: serial("id").primaryKey(),
  pedidoId: integer("pedido_id")
    .notNull()
    .references(() => pedidos.id, { onDelete: "cascade" }),
  status: statusPedidoEnum("status").notNull(),
  descricao: text("descricao"),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

export const pedidoEventosRelations = relations(pedidoEventos, ({ one }) => ({
  pedido: one(pedidos, {
    fields: [pedidoEventos.pedidoId],
    references: [pedidos.id],
  }),
}));

// ──────────────────────────────────────────────────────────
// LEADS (cadastro pra newsletter/promoções)
// ──────────────────────────────────────────────────────────

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  nome: varchar("nome", { length: 160 }),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
  ativo: boolean("ativo").notNull().default(true),
});

// ──────────────────────────────────────────────────────────
// MENSAGENS RECEBIDAS (contato@carovargas.com.br via Resend)
// ──────────────────────────────────────────────────────────

export const mensagensContato = pgTable("mensagens_contato", {
  id: serial("id").primaryKey(),
  resendEmailId: varchar("resend_email_id", { length: 200 }).unique(),
  remetente: varchar("remetente", { length: 200 }).notNull(),
  destinatario: varchar("destinatario", { length: 200 }),
  assunto: varchar("assunto", { length: 250 }),
  corpoTexto: text("corpo_texto"),
  corpoHtml: text("corpo_html"),
  // Metadados dos anexos — [{id, filename, size, contentType}]. O link de
  // download do Resend expira, então guardamos só os metadados aqui e
  // buscamos um link fresco na hora que o admin quiser baixar.
  anexos: jsonb("anexos").$type<
    { id: string; filename: string; size: number; contentType: string }[]
  >(),
  lida: boolean("lida").notNull().default(false),
  respondida: boolean("respondida").notNull().default(false),
  arquivada: boolean("arquivada").notNull().default(false),
  // Lixeira — diferente de "arquivada" (arquivar é "guardar fora da
  // caixa de entrada", excluir é "descartar"). Nada é apagado de
  // verdade do banco, só marcado, então dá pra restaurar.
  excluida: boolean("excluida").notNull().default(false),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

// E-mails que o admin mandou pela aba /admin/emails — sem isso, uma
// resposta enviada simplesmente "sumia": saía de verdade pelo Resend,
// mas não ficava nenhum registro em lugar nenhum pra rever depois.
export const mensagensEnviadas = pgTable("mensagens_enviadas", {
  id: serial("id").primaryKey(),
  // Se a resposta foi a uma mensagem recebida, guarda a referência —
  // fica nulo pra e-mails avulsos (não é obrigatório responder algo).
  mensagemOrigemId: integer("mensagem_origem_id").references(() => mensagensContato.id, {
    onDelete: "set null",
  }),
  destinatario: varchar("destinatario", { length: 200 }).notNull(),
  assunto: varchar("assunto", { length: 250 }),
  corpo: text("corpo").notNull(),
  criadoEm: timestamp("criado_em").defaultNow().notNull(),
});

// ──────────────────────────────────────────────────────────
// BANNERS DE CATEGORIA (foto de fundo dos tiles "Pronta Entrega",
// "Personalizados", "Casa" na Home) — editável pelo admin
// ──────────────────────────────────────────────────────────

export const categoriaBanners = pgTable("categoria_banners", {
  categoria: varchar("categoria", { length: 40 }).primaryKey(),
  imagemUrl: text("imagem_url"),
  atualizadoEm: timestamp("atualizado_em").defaultNow().notNull(),
});
