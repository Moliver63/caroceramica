CREATE TABLE IF NOT EXISTS "mensagens_contato" (
	"id" serial PRIMARY KEY NOT NULL,
	"remetente" varchar(200) NOT NULL,
	"destinatario" varchar(200),
	"assunto" varchar(250),
	"corpo_texto" text,
	"corpo_html" text,
	"lida" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
