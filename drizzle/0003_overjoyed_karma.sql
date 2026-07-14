DO $$ BEGIN
 CREATE TYPE "public"."tipo_personalizacao" AS ENUM('carimbo', 'decalque');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(160) NOT NULL,
	"nome" varchar(160),
	"criado_em" timestamp DEFAULT now() NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "leads_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "variantes_argila" (
	"id" serial PRIMARY KEY NOT NULL,
	"produto_id" integer NOT NULL,
	"nome" varchar(80) NOT NULL,
	"codigo_hex" varchar(7),
	"imagem_url" text,
	"estoque_disponivel" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
ALTER TABLE "itens_pedido" ADD COLUMN "variante_argila_id" integer;--> statement-breakpoint
ALTER TABLE "produtos" ADD COLUMN "tipo_personalizacao" "tipo_personalizacao";--> statement-breakpoint
ALTER TABLE "produtos" ADD COLUMN "preco_sob_consulta" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "variantes_argila" ADD CONSTRAINT "variantes_argila_produto_id_produtos_id_fk" FOREIGN KEY ("produto_id") REFERENCES "public"."produtos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "itens_pedido" ADD CONSTRAINT "itens_pedido_variante_argila_id_variantes_argila_id_fk" FOREIGN KEY ("variante_argila_id") REFERENCES "public"."variantes_argila"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
