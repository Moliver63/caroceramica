import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "../../lib/trpc";
import { CATEGORIAS, type Categoria } from "@shared/const";
import AdminGuard from "./AdminGuard";
import AdminLayout from "./AdminLayout";
import GerenciarVariantes from "./GerenciarVariantes";
import { Card, Botao, Label, campoBase } from "./AdminUI";

function gerarSlug(nome: string) {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const LIMITE_IMAGENS = 10;
type TipoPersonalizacao = "carimbo" | "decalque";

function Secao({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-6">
      <p className="text-sm font-semibold text-[#2B2420]">{titulo}</p>
      {descricao && <p className="mt-0.5 text-xs text-[#8C7A6B]">{descricao}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </Card>
  );
}

function Formulario() {
  const { slug: slugEdicao } = useParams<{ slug?: string }>();
  const editando = !!slugEdicao;
  const [, navegar] = useLocation();
  const utils = trpc.useUtils();

  const { data: produtoExistente } = trpc.produtos.buscarPorSlug.useQuery(
    { slug: slugEdicao ?? "" },
    { enabled: editando }
  );

  const [nome, setNome] = useState(produtoExistente?.nome ?? "");
  const [slug, setSlug] = useState(produtoExistente?.slug ?? "");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(editando);
  const [categoria, setCategoria] = useState<Categoria>(
    produtoExistente?.categoria ?? "pronta-entrega"
  );
  const [descricao, setDescricao] = useState(produtoExistente?.descricao ?? "");
  const [precoBase, setPrecoBase] = useState(produtoExistente?.precoBase ?? "");
  const [personalizavel, setPersonalizavel] = useState(
    produtoExistente?.personalizavel ?? false
  );
  const [tipoPersonalizacao, setTipoPersonalizacao] = useState<TipoPersonalizacao>(
    (produtoExistente?.tipoPersonalizacao as TipoPersonalizacao | null) ?? "carimbo"
  );
  const [precoSobConsulta, setPrecoSobConsulta] = useState(
    produtoExistente?.precoSobConsulta ?? false
  );
  const [custoPersonalizacao, setCustoPersonalizacao] = useState(
    produtoExistente?.custoPersonalizacao ?? "0"
  );
  const [prazoProducaoDias, setPrazoProducaoDias] = useState(
    produtoExistente?.prazoProducaoDias ?? 30
  );
  const [observacaoArtesanal, setObservacaoArtesanal] = useState(
    produtoExistente?.observacaoArtesanal ?? ""
  );
  const [ativo, setAtivo] = useState(produtoExistente?.ativo ?? true);
  const [controlarEstoque, setControlarEstoque] = useState(
    produtoExistente?.controlarEstoque ?? false
  );
  const [estoque, setEstoque] = useState(produtoExistente?.estoque ?? 0);
  const [imagens, setImagens] = useState<string[]>(produtoExistente?.imagens ?? []);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [progressoUpload, setProgressoUpload] = useState<{ atual: number; total: number } | null>(
    null
  );
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!produtoExistente) return;
    setNome(produtoExistente.nome);
    setSlug(produtoExistente.slug);
    setCategoria(produtoExistente.categoria);
    setDescricao(produtoExistente.descricao ?? "");
    setPrecoBase(produtoExistente.precoBase);
    setPersonalizavel(produtoExistente.personalizavel);
    setTipoPersonalizacao(
      (produtoExistente.tipoPersonalizacao as TipoPersonalizacao | null) ?? "carimbo"
    );
    setPrecoSobConsulta(produtoExistente.precoSobConsulta);
    setControlarEstoque(produtoExistente.controlarEstoque);
    setEstoque(produtoExistente.estoque);
    setCustoPersonalizacao(produtoExistente.custoPersonalizacao ?? "0");
    setPrazoProducaoDias(produtoExistente.prazoProducaoDias);
    setObservacaoArtesanal(produtoExistente.observacaoArtesanal ?? "");
    setAtivo(produtoExistente.ativo);
    setImagens(produtoExistente.imagens ?? []);
  }, [produtoExistente]);

  const gerarUpload = trpc.admin.gerarUploadCloudflare.useMutation();
  const criar = trpc.produtos.criar.useMutation();
  const atualizar = trpc.produtos.atualizar.useMutation();
  const notificarNovidade = trpc.produtos.notificarNovidade.useMutation();
  const salvando = criar.isPending || atualizar.isPending;

  async function handleUploadImagens(arquivos: FileList) {
    const lista = Array.from(arquivos);
    const vagas = LIMITE_IMAGENS - imagens.length;

    if (vagas <= 0) {
      setErro(`Limite de ${LIMITE_IMAGENS} imagens por peça atingido.`);
      return;
    }

    const paraEnviar = lista.slice(0, vagas);
    if (lista.length > vagas) {
      setErro(
        `Só cabem mais ${vagas} imagem(ns) (limite de ${LIMITE_IMAGENS}). As demais foram ignoradas.`
      );
    } else {
      setErro(null);
    }

    for (let i = 0; i < paraEnviar.length; i++) {
      setProgressoUpload({ atual: i + 1, total: paraEnviar.length });
      await handleUploadImagem(paraEnviar[i]);
    }
    setProgressoUpload(null);
  }

  async function handleUploadImagem(arquivo: File) {
    if (imagens.length >= LIMITE_IMAGENS) {
      setErro(`Limite de ${LIMITE_IMAGENS} imagens por peça atingido.`);
      return;
    }

    setErro(null);
    setEnviandoImagem(true);
    try {
      const { uploadURL } = await gerarUpload.mutateAsync();

      const formData = new FormData();
      formData.append("file", arquivo);

      const resposta = await fetch(uploadURL, { method: "POST", body: formData });
      const dados = await resposta.json();

      if (!resposta.ok || !dados.success) {
        throw new Error(dados?.errors?.[0]?.message ?? "Falha no upload da imagem.");
      }

      const urlImagem = dados.result.variants[0] as string;
      setImagens((atual) => [...atual, urlImagem]);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha no upload da imagem.");
    } finally {
      setEnviandoImagem(false);
    }
  }

  function removerImagem(url: string) {
    setImagens((atual) => atual.filter((i) => i !== url));
  }

  async function salvar() {
    setErro(null);

    if (!nome.trim() || !slug.trim() || (!precoBase && !precoSobConsulta)) {
      setErro("Preencha ao menos nome, slug e preço base (ou marque 'sob consulta').");
      return;
    }

    const dadosComuns = {
      nome,
      slug,
      categoria,
      descricao: descricao || undefined,
      precoBase: precoBase || "0",
      personalizavel,
      tipoPersonalizacao: personalizavel ? tipoPersonalizacao : undefined,
      custoPersonalizacao: personalizavel ? custoPersonalizacao : "0",
      precoSobConsulta,
      controlarEstoque,
      estoque: Number(estoque),
      prazoProducaoDias: Number(prazoProducaoDias),
      observacaoArtesanal: observacaoArtesanal || undefined,
      imagens,
      ativo,
    };

    try {
      if (editando && produtoExistente) {
        await atualizar.mutateAsync({ id: produtoExistente.id, dados: dadosComuns });
      } else {
        await criar.mutateAsync({ ...dadosComuns, ehKit: false });
      }
      await utils.produtos.listar.invalidate();
      navegar("/admin/produtos");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar o produto.");
    }
  }

  return (
    <AdminLayout
      titulo={editando ? "Editar peça" : "Nova peça"}
      acoes={
        <>
          {editando && produtoExistente && (
            <Botao
              variante="secundario"
              onClick={() => notificarNovidade.mutate({ produtoId: produtoExistente.id })}
              disabled={notificarNovidade.isPending}
            >
              {notificarNovidade.isPending
                ? "Enviando…"
                : notificarNovidade.isSuccess
                ? `Avisados ${notificarNovidade.data.enviados}`
                : "Avisar assinantes"}
            </Botao>
          )}
          <Botao variante="secundario" onClick={() => navegar("/admin/produtos")}>
            Cancelar
          </Botao>
          <Botao variante="primario" onClick={salvar} disabled={salvando || enviandoImagem}>
            {salvando ? "Salvando…" : "Salvar peça"}
          </Botao>
        </>
      }
    >
      <div className="mx-auto max-w-2xl space-y-6">
        {erro && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>
        )}

        <Secao titulo="Informações básicas">
          <div>
            <Label>Nome</Label>
            <input
              value={nome}
              onChange={(e) => {
                setNome(e.target.value);
                if (!slugEditadoManualmente) setSlug(gerarSlug(e.target.value));
              }}
              className={campoBase}
            />
          </div>

          <div>
            <Label>Slug (URL da peça)</Label>
            <input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugEditadoManualmente(true);
              }}
              className={`${campoBase} font-mono`}
            />
          </div>

          <div>
            <Label>Categoria</Label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Categoria)}
              className={campoBase}
            >
              {CATEGORIAS.map((c) => (
                <option key={c.valor} value={c.valor}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Descrição</Label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className={campoBase}
            />
          </div>
        </Secao>

        <Secao titulo="Preço e produção">
          <label className="flex items-center gap-2.5 text-sm text-[#2B2420]">
            <input
              type="checkbox"
              checked={precoSobConsulta}
              onChange={(e) => setPrecoSobConsulta(e.target.checked)}
            />
            Preço sob consulta (não mostra valor fixo na vitrine)
          </label>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Label>Preço base (R$){precoSobConsulta && " — opcional"}</Label>
              <input
                value={precoBase}
                onChange={(e) => setPrecoBase(e.target.value)}
                placeholder="74.00"
                className={campoBase}
              />
            </div>
            <div className="flex-1">
              <Label>Prazo de produção (dias)</Label>
              <input
                type="number"
                min={1}
                value={prazoProducaoDias}
                onChange={(e) => setPrazoProducaoDias(Number(e.target.value))}
                className={campoBase}
              />
            </div>
          </div>

          <div>
            <Label>Observação artesanal (opcional)</Label>
            <textarea
              value={observacaoArtesanal}
              onChange={(e) => setObservacaoArtesanal(e.target.value)}
              rows={2}
              placeholder="Ex: pequenas variações de tom são esperadas nesta peça."
              className={campoBase}
            />
          </div>
        </Secao>

        <Secao titulo="Estoque">
          <label className="flex items-center gap-2.5 text-sm text-[#2B2420]">
            <input
              type="checkbox"
              checked={controlarEstoque}
              onChange={(e) => setControlarEstoque(e.target.checked)}
            />
            Controlar estoque (desmarcado = sob encomenda, sem limite fixo)
          </label>

          {controlarEstoque && (
            <div className="max-w-[10rem]">
              <Label>Peças em estoque</Label>
              <input
                type="number"
                min={0}
                value={estoque}
                onChange={(e) => setEstoque(Number(e.target.value))}
                className={campoBase}
              />
            </div>
          )}
        </Secao>

        <Secao titulo="Personalização">
          <label className="flex items-center gap-2.5 text-sm text-[#2B2420]">
            <input
              type="checkbox"
              checked={personalizavel}
              onChange={(e) => setPersonalizavel(e.target.checked)}
            />
            Esta peça é personalizável
          </label>

          {personalizavel && (
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="flex-1">
                <Label>Tipo</Label>
                <select
                  value={tipoPersonalizacao}
                  onChange={(e) => setTipoPersonalizacao(e.target.value as TipoPersonalizacao)}
                  className={campoBase}
                >
                  <option value="carimbo">Carimbo</option>
                  <option value="decalque">Decalque</option>
                </select>
              </div>
              <div className="flex-1">
                <Label>Custo (R$)</Label>
                <input
                  value={custoPersonalizacao}
                  onChange={(e) => setCustoPersonalizacao(e.target.value)}
                  placeholder="50.00"
                  className={campoBase}
                />
              </div>
            </div>
          )}
        </Secao>

        <Secao titulo="Imagens" descricao={`${imagens.length}/${LIMITE_IMAGENS} usadas`}>
          <div className="flex flex-wrap gap-3">
            {imagens.map((url) => (
              <div key={url} className="relative h-24 w-24 overflow-hidden rounded-lg border border-black/5">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removerImagem(url)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                  aria-label="Remover imagem"
                >
                  ×
                </button>
              </div>
            ))}

            {imagens.length < LIMITE_IMAGENS && (
              <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-black/10 text-center text-xs text-[#8C7A6B] hover:border-terracota">
                {progressoUpload
                  ? `Enviando ${progressoUpload.atual}/${progressoUpload.total}…`
                  : "+ Imagens"}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={enviandoImagem}
                  onChange={(e) => {
                    const arquivos = e.target.files;
                    if (arquivos && arquivos.length > 0) handleUploadImagens(arquivos);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </Secao>

        <Secao titulo="Visibilidade">
          <label className="flex items-center gap-2.5 text-sm text-[#2B2420]">
            <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
            Ativo (visível no catálogo)
          </label>
        </Secao>

        {editando && produtoExistente ? (
          <GerenciarVariantes
            produtoId={produtoExistente.id}
            variantesArgila={produtoExistente.variantesArgila}
            variantesCor={produtoExistente.variantesCor}
          />
        ) : (
          <Card className="border-dashed p-5 text-sm text-[#8C7A6B]">
            Salve a peça primeiro pra poder cadastrar as cores de argila e esmalte.
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminProdutoForm() {
  return (
    <AdminGuard>
      <Formulario />
    </AdminGuard>
  );
}
