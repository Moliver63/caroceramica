CREATE TABLE IF NOT EXISTS "categoria_banners" (
	"categoria" varchar(40) PRIMARY KEY NOT NULL,
	"imagem_url" text,
	"atualizado_em" timestamp DEFAULT now() NOT NULL
);
