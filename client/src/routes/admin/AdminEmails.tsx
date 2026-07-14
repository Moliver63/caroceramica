import { useState } from "react";
import { Link } from "wouter";
import DOMPurify from "dompurify";
import { trpc } from "../../lib/trpc";
import AdminGuard from "./AdminGuard";

function ListaMensagens() {
  const { data: mensagens = [], isLoading } = trpc.mensagens.listar.useQuery();
  const utils = trpc.useUtils();
  const marcarComoLida = trpc.mensagens.marcarComoLida.useMutation({
    onSuccess: () => utils.mensagens.listar.invalidate(),
  });
  const [aberta, setAberta] = useState<number | null>(null);

  function abrir(id: number, lida: boolean) {
    setAberta(aberta === id ? null : id);
    if (!lida) marcarComoLida.mutate({ id });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/admin/produtos" className="text-sm text-marrom hover:text-terracota">
        ‹ Voltar aos produtos
      </Link>

      <h1 className="mt-2 font-serif text-2xl text-marrom-escuro">Admin — E-mails</h1>
      <p className="mt-1 text-sm text-marrom">
        Mensagens recebidas em contato@carovargas.com.br.
      </p>

      {isLoading && <p className="mt-6 text-marrom">Carregando…</p>}

      {!isLoading && mensagens.length === 0 && (
        <p className="mt-6 text-marrom">Nenhuma mensagem recebida ainda.</p>
      )}

      <div className="mt-6 space-y-2">
        {mensagens.map((m) => (
          <div key={m.id} className="rounded-lg border border-borda">
            <button
              onClick={() => abrir(m.id, m.lida)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
            >
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm ${m.lida ? "text-marrom" : "font-semibold text-marrom-escuro"}`}
                >
                  {!m.lida && (
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-terracota" />
                  )}
                  {m.assunto || "(sem assunto)"}
                </p>
                <p className="truncate text-xs text-marrom/70">{m.remetente}</p>
              </div>
              <p className="flex-shrink-0 text-xs text-marrom/60">
                {new Date(m.criadoEm).toLocaleDateString("pt-BR")}
              </p>
            </button>

            {aberta === m.id && (
              <div className="border-t border-borda px-4 py-3 text-sm text-marrom-escuro">
                {m.corpoHtml ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(m.corpoHtml, {
                        // Nunca permite <script>, <iframe>, ou atributos
                        // tipo onclick/onerror — e-mail é conteúdo de
                        // fora, não confiável.
                        FORBID_TAGS: ["script", "iframe", "object", "embed", "style"],
                        FORBID_ATTR: ["style", "onerror", "onclick", "onload"],
                      }),
                    }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{m.corpoTexto || "(sem conteúdo)"}</p>
                )}
                <a
                  href={`mailto:${m.remetente}?subject=${encodeURIComponent("Re: " + (m.assunto || ""))}`}
                  className="mt-4 inline-block text-terracota hover:underline"
                >
                  Responder por e-mail →
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminEmails() {
  return (
    <AdminGuard>
      <ListaMensagens />
    </AdminGuard>
  );
}
