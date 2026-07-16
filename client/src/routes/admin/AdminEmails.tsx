import { useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { trpc } from "../../lib/trpc";
import AdminGuard from "./AdminGuard";
import AdminLayout from "./AdminLayout";
import { Card, Botao, Badge, EmptyState, Label, campoBase } from "./AdminUI";

type Pasta = "entrada" | "enviados" | "arquivadas" | "excluidas";

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
  excluida: boolean;
  criadoEm: string | Date;
};

type Enviada = {
  id: number;
  mensagemOrigemId: number | null;
  destinatario: string;
  assunto: string | null;
  corpo: string;
  criadoEm: string | Date;
};

function iniciais(nomeOuEmail: string) {
  const nome = nomeOuEmail.replace(/<.*>/, "").trim() || nomeOuEmail;
  const partes = nome.split(/\s+/).filter(Boolean);
  const letras = partes.length >= 2 ? partes[0][0] + partes[1][0] : nome.slice(0, 2);
  return letras.toUpperCase();
}

function nomeExibicao(remetente: string) {
  const semEmail = remetente.replace(/<.*>/, "").trim();
  return semEmail || remetente;
}

function snippetRecebida(m: Mensagem) {
  const base = m.corpoTexto?.trim() || m.corpoHtml?.replace(/<[^>]+>/g, " ").trim() || "";
  return base.slice(0, 90);
}

const PASTAS: { valor: Pasta; label: string }[] = [
  { valor: "entrada", label: "Caixa de entrada" },
  { valor: "enviados", label: "Enviados" },
  { valor: "arquivadas", label: "Arquivadas" },
  { valor: "excluidas", label: "Lixeira" },
];

function PainelLeituraRecebida({
  mensagem,
  pasta,
  onVoltouMobile,
}: {
  mensagem: Mensagem;
  pasta: Pasta;
  onVoltouMobile: () => void;
}) {
  const utils = trpc.useUtils();
  const [resposta, setResposta] = useState("");
  const [enviado, setEnviado] = useState(false);

  function invalidarTudo() {
    utils.mensagens.listar.invalidate();
    utils.mensagens.listarEnviadas.invalidate();
  }

  const arquivar = trpc.mensagens.arquivar.useMutation({
    onSuccess: () => {
      invalidarTudo();
      onVoltouMobile();
    },
  });
  const excluir = trpc.mensagens.excluir.useMutation({
    onSuccess: () => {
      invalidarTudo();
      onVoltouMobile();
    },
  });
  const excluirPermanentemente = trpc.mensagens.excluirPermanentemente.useMutation({
    onSuccess: () => {
      invalidarTudo();
      onVoltouMobile();
    },
  });
  const responder = trpc.mensagens.responder.useMutation({
    onSuccess: () => {
      invalidarTudo();
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-base font-semibold text-[#2B2420]">
              {mensagem.assunto || "(sem assunto)"}
            </p>
            <p className="mt-1 text-sm text-[#6b6459]">
              {nomeExibicao(mensagem.remetente)}
              <span className="text-[#8C7A6B]"> · {mensagem.remetente.match(/<(.+)>/)?.[1] ?? mensagem.remetente}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {mensagem.respondida && <Badge cor="bg-esmalte-claro text-esmalte">Respondida</Badge>}

            {pasta === "excluidas" ? (
              <>
                <Botao variante="secundario" onClick={() => excluir.mutate({ id: mensagem.id, excluida: false })}>
                  Restaurar
                </Botao>
                <Botao
                  variante="perigo"
                  onClick={() => {
                    if (confirm("Excluir permanentemente? Não dá pra desfazer.")) {
                      excluirPermanentemente.mutate({ id: mensagem.id });
                    }
                  }}
                >
                  Excluir de vez
                </Botao>
              </>
            ) : (
              <>
                <Botao
                  variante="fantasma"
                  onClick={() => arquivar.mutate({ id: mensagem.id, arquivada: !mensagem.arquivada })}
                >
                  {mensagem.arquivada ? "Desarquivar" : "Arquivar"}
                </Botao>
                <Botao variante="fantasma" onClick={() => excluir.mutate({ id: mensagem.id, excluida: true })}>
                  Excluir
                </Botao>
              </>
            )}
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

      {pasta !== "excluidas" && (
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
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
          {enviado && <p className="mt-2 text-xs font-medium text-esmalte">Resposta enviada ✓</p>}
          {responder.isError && (
            <p className="mt-2 text-xs text-red-600">{responder.error.message}</p>
          )}
        </div>
      )}
    </Card>
  );
}

function PainelLeituraEnviada({ mensagem, onVoltouMobile }: { mensagem: Enviada; onVoltouMobile: () => void }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-black/5 p-5">
        <button
          onClick={onVoltouMobile}
          className="mb-3 text-xs text-[#8C7A6B] hover:text-terracota md:hidden"
        >
          ‹ Voltar pra lista
        </button>
        <p className="text-base font-semibold text-[#2B2420]">
          {mensagem.assunto || "(sem assunto)"}
        </p>
        <p className="mt-1 text-sm text-[#6b6459]">Para: {mensagem.destinatario}</p>
        <p className="mt-2 text-xs text-[#8C7A6B]">
          {new Date(mensagem.criadoEm).toLocaleString("pt-BR")}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-5 text-sm text-[#2B2420]">
        <p className="whitespace-pre-wrap">{mensagem.corpo}</p>
      </div>
    </Card>
  );
}

function Compositor({ onFechar, onEnviado }: { onFechar: () => void; onEnviado: () => void }) {
  const utils = trpc.useUtils();
  const { data: clientes = [] } = trpc.clientes.listar.useQuery();
  const { data: leads = [] } = trpc.leads.listar.useQuery();

  const sugestoes = useMemo(() => {
    const emails = new Set<string>();
    clientes.forEach((c) => c.email && emails.add(c.email));
    leads.forEach((l) => emails.add(l.email));
    return Array.from(emails);
  }, [clientes, leads]);

  const [destinatario, setDestinatario] = useState("");
  const [assunto, setAssunto] = useState("");
  const [corpo, setCorpo] = useState("");

  const enviar = trpc.mensagens.enviarNovo.useMutation({
    onSuccess: () => {
      utils.mensagens.listarEnviadas.invalidate();
      setDestinatario("");
      setAssunto("");
      setCorpo("");
      onEnviado();
    },
  });

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-black/5 p-5">
        <p className="text-base font-semibold text-[#2B2420]">Nova mensagem</p>
        <button onClick={onFechar} className="text-sm text-[#8C7A6B] hover:text-terracota">
          Cancelar
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        <div>
          <Label>Para</Label>
          <input
            type="email"
            list="sugestoes-email"
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
            placeholder="cliente@email.com"
            className={campoBase}
          />
          <datalist id="sugestoes-email">
            {sugestoes.map((email) => (
              <option key={email} value={email} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-[#8C7A6B]">
            Sugestões vêm dos e-mails de clientes e da newsletter — mas pode digitar
            qualquer endereço.
          </p>
        </div>

        <div>
          <Label>Assunto</Label>
          <input
            value={assunto}
            onChange={(e) => setAssunto(e.target.value)}
            placeholder="Assunto do e-mail"
            className={campoBase}
          />
        </div>

        <div>
          <Label>Mensagem</Label>
          <textarea
            value={corpo}
            onChange={(e) => setCorpo(e.target.value)}
            rows={10}
            placeholder="Escreva sua mensagem…"
            className={campoBase}
          />
        </div>
      </div>

      <div className="border-t border-black/5 bg-black/[0.015] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#8C7A6B]">
            Sai de contato@carovargas.com.br, com a assinatura da marca automática.
          </p>
          <Botao
            variante="primario"
            disabled={!destinatario.trim() || !assunto.trim() || !corpo.trim() || enviar.isPending}
            onClick={() => enviar.mutate({ destinatario, assunto, corpo })}
          >
            {enviar.isPending ? "Enviando…" : "Enviar"}
          </Botao>
        </div>
        {enviar.isError && <p className="mt-2 text-xs text-red-600">{enviar.error.message}</p>}
      </div>
    </Card>
  );
}

function Inbox() {
  const [pasta, setPasta] = useState<Pasta>("entrada");
  const ehEnviados = pasta === "enviados";

  const { data: mensagens = [], isLoading: carregandoRecebidas } = trpc.mensagens.listar.useQuery(
    { pasta: ehEnviados ? "entrada" : pasta },
    { enabled: !ehEnviados }
  );
  const { data: enviadas = [], isLoading: carregandoEnviadas } = trpc.mensagens.listarEnviadas.useQuery(
    undefined,
    { enabled: ehEnviados }
  );

  const utils = trpc.useUtils();
  const marcarComoLida = trpc.mensagens.marcarComoLida.useMutation({
    onSuccess: () => utils.mensagens.listar.invalidate(),
  });

  const [busca, setBusca] = useState("");
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null);
  const [compondo, setCompondo] = useState(false);

  const listaAtual: (Mensagem | Enviada)[] = ehEnviados ? enviadas : mensagens;

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return listaAtual;
    return listaAtual.filter((m) => {
      const assunto = (m.assunto ?? "").toLowerCase();
      const quem = "remetente" in m ? m.remetente : m.destinatario;
      return assunto.includes(termo) || quem.toLowerCase().includes(termo);
    });
  }, [listaAtual, busca]);

  const selecionada = filtradas.find((m) => m.id === selecionadaId) ?? null;
  const naoLidas = pasta === "entrada" ? mensagens.filter((m) => !m.lida).length : 0;
  const isLoading = ehEnviados ? carregandoEnviadas : carregandoRecebidas;

  function selecionar(m: Mensagem | Enviada) {
    setSelecionadaId(m.id);
    setCompondo(false);
    if ("lida" in m && !m.lida) marcarComoLida.mutate({ id: m.id });
  }

  function trocarPasta(p: Pasta) {
    setPasta(p);
    setSelecionadaId(null);
    setCompondo(false);
    setBusca("");
  }

  function escrever() {
    setSelecionadaId(null);
    setCompondo(true);
  }

  return (
    <AdminLayout
      titulo="E-mails"
      acoes={
        <Botao variante="primario" onClick={escrever}>
          + Escrever
        </Botao>
      }
    >
      <p className="-mt-3 mb-5 text-sm text-[#8C7A6B]">
        Caixa de contato@carovargas.com.br
        {pasta === "entrada" && naoLidas > 0 && ` — ${naoLidas} não lida${naoLidas > 1 ? "s" : ""}`}
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {PASTAS.map((p) => (
          <button
            key={p.valor}
            onClick={() => trocarPasta(p.valor)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              pasta === p.valor
                ? "bg-carvao text-creme"
                : "border border-black/10 bg-white text-[#2B2420] hover:bg-black/[0.03]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-sm text-[#8C7A6B]">Carregando…</p>}

      {!isLoading && listaAtual.length === 0 && !compondo && (
        <EmptyState>
          {pasta === "entrada" && "Nenhuma mensagem recebida ainda."}
          {pasta === "enviados" && "Você ainda não respondeu nenhuma mensagem."}
          {pasta === "arquivadas" && "Nenhuma mensagem arquivada."}
          {pasta === "excluidas" && "Lixeira vazia."}
        </EmptyState>
      )}

      {(listaAtual.length > 0 || compondo) && (
        <div className="grid gap-5 md:grid-cols-[22rem_1fr]" style={{ minHeight: "32rem" }}>
          <Card className={`flex flex-col overflow-hidden ${selecionada || compondo ? "hidden md:flex" : "flex"}`}>
            <div className="border-b border-black/5 p-3">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por assunto ou remetente…"
                className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#2B2420] outline-none focus:border-terracota focus:ring-1 focus:ring-terracota"
              />
            </div>
            <div className="flex-1 divide-y divide-black/5 overflow-y-auto">
              {filtradas.map((m) => {
                const ehRecebida = "remetente" in m;
                const quem = ehRecebida ? nomeExibicao(m.remetente) : `Para: ${m.destinatario}`;
                const naoLida = ehRecebida && !m.lida;
                return (
                  <button
                    key={m.id}
                    onClick={() => selecionar(m)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-black/[0.02] ${
                      selecionadaId === m.id ? "bg-terracota/[0.08]" : ""
                    }`}
                  >
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-carvao text-[0.65rem] font-semibold text-creme">
                      {iniciais(ehRecebida ? m.remetente : m.destinatario)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm ${naoLida ? "font-semibold text-[#2B2420]" : "text-[#6b6459]"}`}>
                          {quem}
                        </span>
                        <span className="flex-shrink-0 text-[0.65rem] text-[#8C7A6B]">
                          {new Date(m.criadoEm).toLocaleDateString("pt-BR")}
                        </span>
                      </span>
                      <span className={`mt-0.5 block truncate text-xs ${naoLida ? "font-medium text-[#2B2420]" : "text-[#8C7A6B]"}`}>
                        {m.assunto || "(sem assunto)"}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-[#8C7A6B]/80">
                        {ehRecebida ? snippetRecebida(m) : m.corpo.slice(0, 90)}
                      </span>
                    </span>
                    {naoLida && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-terracota" />}
                  </button>
                );
              })}
              {filtradas.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-[#8C7A6B]">
                  Nada encontrado pra "{busca}".
                </p>
              )}
            </div>
          </Card>

          <div className={selecionada || compondo ? "flex" : "hidden md:flex"}>
            {compondo ? (
              <Compositor
                onFechar={() => setCompondo(false)}
                onEnviado={() => {
                  setCompondo(false);
                  trocarPasta("enviados");
                }}
              />
            ) : selecionada ? (
              "remetente" in selecionada ? (
                <PainelLeituraRecebida
                  mensagem={selecionada}
                  pasta={pasta}
                  onVoltouMobile={() => setSelecionadaId(null)}
                />
              ) : (
                <PainelLeituraEnviada mensagem={selecionada} onVoltouMobile={() => setSelecionadaId(null)} />
              )
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
