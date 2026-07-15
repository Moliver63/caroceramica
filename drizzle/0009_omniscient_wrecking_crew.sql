CREATE TABLE IF NOT EXISTS "mensagens_enviadas" (
	"id" serial PRIMARY KEY NOT NULL,
	"mensagem_origem_id" integer,
	"destinatario" varchar(200) NOT NULL,
	"assunto" varchar(250),
	"corpo" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mensagens_contato" ADD COLUMN "excluida" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "mensagens_enviadas" ADD CONSTRAINT "mensagens_enviadas_mensagem_origem_id_mensagens_contato_id_fk" FOREIGN KEY ("mensagem_origem_id") REFERENCES "public"."mensagens_contato"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
