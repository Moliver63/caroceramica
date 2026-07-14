CREATE TABLE IF NOT EXISTS "pedido_eventos" (
	"id" serial PRIMARY KEY NOT NULL,
	"pedido_id" integer NOT NULL,
	"status" "status_pedido" NOT NULL,
	"descricao" text,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "transportadora" varchar(60);--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "codigo_rastreio" varchar(60);--> statement-breakpoint
ALTER TABLE "produtos" ADD COLUMN "controlar_estoque" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "produtos" ADD COLUMN "estoque" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pedido_eventos" ADD CONSTRAINT "pedido_eventos_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
