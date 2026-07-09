DO $$ BEGIN
 CREATE TYPE "public"."categoria" AS ENUM('consultorio', 'casa');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."gateway_pagamento" AS ENUM('asaas', 'stripe');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."metodo_pagamento" AS ENUM('pix', 'boleto', 'cartao_credito');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status_arte" AS ENUM('nao_aplicavel', 'aguardando_upload', 'em_analise', 'aprovada', 'reprovada');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status_pedido" AS ENUM('aguardando_pagamento', 'pago', 'em_producao', 'pronto_envio', 'enviado', 'entregue', 'cancelado');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "itens_kit" (
	"id" serial PRIMARY KEY NOT NULL,
	"kit_id" integer NOT NULL,
	"produto_id" integer NOT NULL,
	"quantidade" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "itens_pedido" (
	"id" serial PRIMARY KEY NOT NULL,
	"pedido_id" integer NOT NULL,
	"produto_id" integer NOT NULL,
	"variante_cor_id" integer,
	"quantidade" integer DEFAULT 1 NOT NULL,
	"preco_unitario" numeric(10, 2) NOT NULL,
	"personalizado" boolean DEFAULT false NOT NULL,
	"arte_carimbo_url" text,
	"status_arte" "status_arte" DEFAULT 'nao_aplicavel' NOT NULL,
	"texto_carimbo" varchar(60),
	"observacoes_cliente" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pedidos" (
	"id" serial PRIMARY KEY NOT NULL,
	"codigo_pedido" varchar(20) NOT NULL,
	"cliente_nome" varchar(160) NOT NULL,
	"cliente_email" varchar(160) NOT NULL,
	"cliente_telefone" varchar(30),
	"cliente_documento" varchar(20),
	"endereco_entrega" jsonb,
	"status" "status_pedido" DEFAULT 'aguardando_pagamento' NOT NULL,
	"gateway" "gateway_pagamento" NOT NULL,
	"metodo_pagamento" "metodo_pagamento",
	"gateway_referencia_id" varchar(120),
	"subtotal" numeric(10, 2) NOT NULL,
	"custo_personalizacao_total" numeric(10, 2) DEFAULT '0',
	"frete" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"prazo_producao_estimado" timestamp,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pedidos_codigo_pedido_unique" UNIQUE("codigo_pedido")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "produtos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(160) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"categoria" "categoria" NOT NULL,
	"descricao" text,
	"preco_base" numeric(10, 2) NOT NULL,
	"personalizavel" boolean DEFAULT false NOT NULL,
	"custo_personalizacao" numeric(10, 2) DEFAULT '0',
	"eh_kit" boolean DEFAULT false NOT NULL,
	"prazo_producao_dias" integer DEFAULT 30 NOT NULL,
	"observacao_artesanal" text DEFAULT 'Peça feita à mão. Pequenas variações de forma, textura e tonalidade fazem parte do processo artesanal.',
	"imagens" jsonb DEFAULT '[]'::jsonb,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"atualizado_em" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "produtos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "variantes_cor" (
	"id" serial PRIMARY KEY NOT NULL,
	"produto_id" integer NOT NULL,
	"nome" varchar(80) NOT NULL,
	"codigo_hex" varchar(7),
	"codigo_fornecedor" varchar(40),
	"imagem_url" text,
	"estoque_disponivel" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itens_kit" ADD CONSTRAINT "itens_kit_kit_id_produtos_id_fk" FOREIGN KEY ("kit_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itens_kit" ADD CONSTRAINT "itens_kit_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_variante_cor_id_variantes_cor_id_fk" FOREIGN KEY ("variante_cor_id") REFERENCES "public"."variantes_cor"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "variantes_cor" ADD CONSTRAINT "variantes_cor_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
