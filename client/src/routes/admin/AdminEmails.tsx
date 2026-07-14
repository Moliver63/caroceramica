import { useState } from "react";
import DOMPurify from "dompurify";
import { trpc } from "../../lib/trpc";
import AdminGuard from "./AdminGuard";
import AdminLayout from "./AdminLayout";
import { Card, EmptyState } from "./AdminUI";

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
    <AdminLayout titulo="E-mails">
      <p className="-mt-3 mb-6 text-sm text-[#8C7A6B]">
        Mensagens recebidas em contato@carovargas.com.br.
      </p>

      {isLoading && <p className="text-sm text-[#8C7A6B]">Carregando…</p>}

      {!isLoading && mensagens.length === 0 && (
        <EmptyState>Nenhuma mensagem recebida ainda.</EmptyState>
      )}

      <div className="space-y-2">
        {mensagens.map((m) => (
          <Card key={m.id} className="overflow-hidden">
            <button
              onClick={() => abrir(m.id, m.lida)}
              className="flex w-full items-center justify-between gap-4 px-5 py-3.5 text-left"
            >
              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm ${m.lida ? "text-[#6b6459]" : "font-semibold text-[#2B2420]"}`}
                >
                  {!m.lida && (
                    <span className="mr-2 inline-block h-2 w-2 rounded-full bg-terracota" />
                  )}
                  {m.assunto || "(sem assunto)"}
                </p>
                <p className="mt-0.5 truncate text-xs text-[#8C7A6B]">{m.remetente}</p>
              </div>
              <p className="flex-shrink-0 text-xs text-[#8C7A6B]">
                {new Date(m.criadoEm).toLocaleDateString("pt-BR")}
              </p>
            </button>

            {aberta === m.id && (
              <div className="border-t border-black/5 px-5 py-4 text-sm text-[#2B2420]">
                {m.corpoHtml ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(m.corpoHtml, {
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
                  className="mt-4 inline-block text-sm font-medium text-terracota hover:underline"
                >
                  Responder por e-mail →
                </a>
              </div>
            )}
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}

export default function AdminEmails() {
  return (
    <AdminGuard>
      <ListaMensagens />
    </AdminGuard>
  );
}
