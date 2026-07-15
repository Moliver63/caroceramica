ALTER TABLE "mensagens_contato" ADD COLUMN "resend_email_id" varchar(200);--> statement-breakpoint
ALTER TABLE "mensagens_contato" ADD COLUMN "respondida" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mensagens_contato" ADD COLUMN "arquivada" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "mensagens_contato" ADD CONSTRAINT "mensagens_contato_resend_email_id_unique" UNIQUE("resend_email_id");