import { useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { trpc } from "../../lib/trpc";
import AdminGuard from "./AdminGuard";
import AdminLayout from "./AdminLayout";
import { Card, Botao, Badge, EmptyState } from "./AdminUI";

type Mensagem = {
  id: number;
  remetente: string;
  destinatario: string | null;
  assunto: string | null;
  corpoTexto: string | null;
  corpoHtml: string | null;
  lida: boolean;
  respondida: boolean;
  arquivada: boolean;
  criadoEm: string | Date;
};

function iniciais(remetente: string) {
  const nome = remetente.replace(/<.*>/, "").trim() || remetente;
  const partes = nome.split(/\s+/).filter(Boolean);
  const letras = partes.length >= 2 ? partes[0][0] + partes[1][0] : nome.slice(0, 2);
  return letras.toUpperCase();
}

function nomeExibicao(remetente: string) {
  const semEmail = remetente.replace(/<.*>/, "").trim();
  return semEmail || remetente;
}

function snippet(m: Mensagem) {
  const base = m.corpoTexto?.trim() || m.corpoHtml?.replace(/<[^>]+>/g, " ").trim() || "";
  return base.slice(0, 90);
}

function PainelLeitura({
  mensagem,
  onVoltouMobile,
}: {
  mensagem: Mensagem;
  onVoltouMobile: () => void;
}) {
  const utils = trpc.useUtils();
  const [resposta, setResposta] = useState("");
  const [enviado, setEnviado] = useState(false);

  const arquivar = trpc.mensagens.arquivar.useMutation({
    onSuccess: () => {
      utils.mensagens.listar.invalidate();
      onVoltouMobile();
    },
  });

  const responder = trpc.mensagens.responder.useMutation({
    onSuccess: () => {
      utils.mensagens.listar.invalidate();
      setEnviado(true);
      setResposta("");
    },
  });

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-black/5 p-5">
        <button
          onClick={onVoltouMobile}
          className="mb-3 text-xs text-[#8C7A6B] hover:text-terracota md:hidden"
        >
          ‹ Voltar pra lista
        </button>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-base font-semibold text-[#2B2420]">
              {mensagem.assunto || "(sem assunto)"}
            </p>
            <p className="mt-1 text-sm text-[#6b6459]">
              {nomeExibicao(mensagem.remetente)}
              <span className="text-[#8C7A6B]"> · {mensagem.remetente.match(/<(.+)>/)?.[1] ?? mensagem.remetente}</span>
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            {mensagem.respondida && <Badge cor="bg-esmalte-claro text-esmalte">Respondida</Badge>}
            <Botao
              variante="fantasma"
              onClick={() => arquivar.mutate({ id: mensagem.id, arquivada: !mensagem.arquivada })}
            >
              {mensagem.arquivada ? "Desarquivar" : "Arquivar"}
            </Botao>
          </div>
        </div>
        <p className="mt-2 text-xs text-[#8C7A6B]">
          {new Date(mensagem.criadoEm).toLocaleString("pt-BR")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 text-sm text-[#2B2420]">
        {mensagem.corpoHtml ? (
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(mensagem.corpoHtml, {
                FORBID_TAGS: ["script", "iframe", "object", "embed", "style"],
                FORBID_ATTR: ["style", "onerror", "onclick", "onload"],
              }),
            }}
          />
        ) : (
          <p className="whitespace-pre-wrap">{mensagem.corpoTexto || "(sem conteúdo)"}</p>
        )}
      </div>

      <div className="border-t border-black/5 bg-black/[0.015] p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-[#8C7A6B]">
          Responder como contato@carovargas.com.br
        </p>
        <textarea
          value={resposta}
          onChange={(e) => {
            setResposta(e.target.value);
            setEnviado(false);
          }}
          rows={4}
          placeholder="Escreva sua resposta…"
          className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#2B2420] outline-none focus:border-terracota focus:ring-1 focus:ring-terracota"
        />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-[#8C7A6B]">
            A assinatura da Caro Vargas (com logo) é adicionada automaticamente.
          </p>
          <Botao
            variante="primario"
            disabled={!resposta.trim() || responder.isPending}
            onClick={() => responder.mutate({ id: mensagem.id, corpo: resposta })}
          >
            {responder.isPending ? "Enviando…" : "Enviar resposta"}
          </Botao>
        </div>
        {enviado && (
          <p className="mt-2 text-xs font-medium text-esmalte">Resposta enviada ✓</p>
        )}
        {responder.isError && (
          <p className="mt-2 text-xs text-red-600">{responder.error.message}</p>
        )}
      </div>
    </Card>
  );
}

function Inbox() {
  const [verArquivadas, setVerArquivadas] = useState(false);
  const { data: mensagens = [], isLoading } = trpc.mensagens.listar.useQuery({
    arquivadas: verArquivadas,
  });
  const utils = trpc.useUtils();
  const marcarComoLida = trpc.mensagens.marcarComoLida.useMutation({
    onSuccess: () => utils.mensagens.listar.invalidate(),
  });

  const [busca, setBusca] = useState("");
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null);

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return mensagens;
    return mensagens.filter(
      (m) =>
        (m.assunto ?? "").toLowerCase().includes(termo) ||
        m.remetente.toLowerCase().includes(termo)
    );
  }, [mensagens, busca]);

  const selecionada = filtradas.find((m) => m.id === selecionadaId) ?? null;
  const naoLidas = mensagens.filter((m) => !m.lida).length;

  function selecionar(m: Mensagem) {
    setSelecionadaId(m.id);
    if (!m.lida) marcarComoLida.mutate({ id: m.id });
  }

  return (
    <AdminLayout
      titulo="E-mails"
      acoes={
        <Botao
          variante="secundario"
          onClick={() => {
            setVerArquivadas((v) => !v);
            setSelecionadaId(null);
          }}
        >
          {verArquivadas ? "Ver caixa de entrada" : "Ver arquivadas"}
        </Botao>
      }
    >
      <p className="-mt-3 mb-5 text-sm text-[#8C7A6B]">
        Caixa de contato@carovargas.com.br
        {!verArquivadas && naoLidas > 0 && ` — ${naoLidas} não lida${naoLidas > 1 ? "s" : ""}`}
      </p>

      {isLoading && <p className="text-sm text-[#8C7A6B]">Carregando…</p>}

      {!isLoading && mensagens.length === 0 && (
        <EmptyState>
          {verArquivadas ? "Nenhuma mensagem arquivada." : "Nenhuma mensagem recebida ainda."}
        </EmptyState>
      )}

      {mensagens.length > 0 && (
        <div className="grid gap-5 md:grid-cols-[22rem_1fr]" style={{ minHeight: "32rem" }}>
          <Card
            className={`flex flex-col overflow-hidden ${selecionada ? "hidden md:flex" : "flex"}`}
          >
            <div className="border-b border-black/5 p-3">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por assunto ou remetente…"
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2B2420] outline-none focus:border-terracota focus:ring-1 focus:ring-terracota"
              />
            </div>
            <div className="flex-1 divide-y divide-black/5 overflow-y-auto">
              {filtradas.map((m) => (
                <button
                  key={m.id}
                  onClick={() => selecionar(m)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-black/[0.02] ${
                    selecionadaId === m.id ? "bg-terracota/[0.08]" : ""
                  }`}
                >
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-carvao text-[0.65rem] font-semibold text-creme">
                    {iniciais(m.remetente)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-sm ${!m.lida ? "font-semibold text-[#2B2420]" : "text-[#6b6459]"}`}
                      >
                        {nomeExibicao(m.remetente)}
                      </span>
                      <span className="flex-shrink-0 text-[0.65rem] text-[#8C7A6B]">
                        {new Date(m.criadoEm).toLocaleDateString("pt-BR")}
                      </span>
                    </span>
                    <span
                      className={`mt-0.5 block truncate text-xs ${!m.lida ? "font-medium text-[#2B2420]" : "text-[#8C7A6B]"}`}
                    >
                      {m.assunto || "(sem assunto)"}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[#8C7A6B]/80">
                      {snippet(m)}
                    </span>
                  </span>
                  {!m.lida && (
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-terracota" />
                  )}
                </button>
              ))}
              {filtradas.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-[#8C7A6B]">
                  Nada encontrado pra "{busca}".
                </p>
              )}
            </div>
          </Card>

          <div className={selecionada ? "flex" : "hidden md:flex"}>
            {selecionada ? (
              <PainelLeitura mensagem={selecionada} onVoltouMobile={() => setSelecionadaId(null)} />
            ) : (
              <Card className="flex flex-1 items-center justify-center p-10 text-center text-sm text-[#8C7A6B]">
                Selecione uma mensagem pra ler.
              </Card>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminEmails() {
  return (
    <AdminGuard>
      <Inbox />
    </AdminGuard>
  );
}
