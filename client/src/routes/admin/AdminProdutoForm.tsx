import { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "wouter";
import { trpc } from "../../lib/trpc";
import { CATEGORIAS, type Categoria } from "@shared/const";
import AdminGuard from "./AdminGuard";
import GerenciarVariantes from "./GerenciarVariantes";

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

  // produtoExistente chega de forma assíncrona (query) — popula o form
  // quando os dados finalmente carregarem, em vez de só no primeiro render.
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

    // Envia uma de cada vez (em série), pra manter a ordem e não estourar
    // limite de requisições simultâneas no Cloudinary.
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
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Link href="/admin/produtos" className="text-sm text-marrom hover:text-terracota">
        ‹ Voltar aos produtos
      </Link>
      <p className="mt-3 eyebrow text-marrom/60">Admin</p>
      <h1 className="mt-1 font-serif text-2xl text-marrom-escuro">
        {editando ? "Editar peça" : "Nova peça"}
      </h1>

      <div className="mt-8 flex flex-col gap-5">
        <div>
          <label className="text-sm text-marrom">Nome</label>
          <input
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              if (!slugEditadoManualmente) setSlug(gerarSlug(e.target.value));
            }}
            className="mt-1 w-full rounded-lg border border-borda bg-creme px-4 py-2.5 text-marrom-escuro"
          />
        </div>

        <div>
          <label className="text-sm text-marrom">Slug (URL da peça)</label>
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEditadoManualmente(true);
            }}
            className="mt-1 w-full rounded-lg border border-borda bg-creme px-4 py-2.5 font-mono text-sm text-marrom-escuro"
          />
        </div>

        <div>
          <label className="text-sm text-marrom">Categoria</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria)}
            className="mt-1 w-full rounded-lg border border-borda bg-creme px-4 py-2.5 text-marrom-escuro"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-marrom">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-borda bg-creme px-4 py-2.5 text-marrom-escuro"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-marrom-escuro">
          <input
            type="checkbox"
            checked={precoSobConsulta}
            onChange={(e) => setPrecoSobConsulta(e.target.checked)}
          />
          Preço sob consulta (não mostra valor fixo na vitrine)
        </label>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-sm text-marrom">
              Preço base (R$){precoSobConsulta && " — opcional, uso interno"}
            </label>
            <input
              value={precoBase}
              onChange={(e) => setPrecoBase(e.target.value)}
              placeholder="74.00"
              className="mt-1 w-full rounded-lg border border-borda bg-creme px-4 py-2.5 text-marrom-escuro"
            />
          </div>
          <div className="flex-1">
            <label className="text-sm text-marrom">Prazo de produção (dias)</label>
            <input
              type="number"
              min={1}
              value={prazoProducaoDias}
              onChange={(e) => setPrazoProducaoDias(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-borda bg-creme px-4 py-2.5 text-marrom-escuro"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-marrom-escuro">
          <input
            type="checkbox"
            checked={controlarEstoque}
            onChange={(e) => setControlarEstoque(e.target.checked)}
          />
          Controlar estoque (desmarcado = sob encomenda, sem limite fixo)
        </label>

        {controlarEstoque && (
          <div className="max-w-[10rem]">
            <label className="text-sm text-marrom">Peças em estoque</label>
            <input
              type="number"
              min={0}
              value={estoque}
              onChange={(e) => setEstoque(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-borda bg-creme px-4 py-2.5 text-marrom-escuro"
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-marrom-escuro">
          <input
            type="checkbox"
            checked={personalizavel}
            onChange={(e) => setPersonalizavel(e.target.checked)}
          />
          Personalizável
        </label>

        {personalizavel && (
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm text-marrom">Tipo de personalização</label>
              <select
                value={tipoPersonalizacao}
                onChange={(e) => setTipoPersonalizacao(e.target.value as TipoPersonalizacao)}
                className="mt-1 w-full rounded-lg border border-borda bg-creme px-4 py-2.5 text-marrom-escuro"
              >
                <option value="carimbo">Carimbo</option>
                <option value="decalque">Decalque</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-sm text-marrom">Custo da personalização (R$)</label>
              <input
                value={custoPersonalizacao}
                onChange={(e) => setCustoPersonalizacao(e.target.value)}
                placeholder="50.00"
                className="mt-1 w-full rounded-lg border border-borda bg-creme px-4 py-2.5 text-marrom-escuro"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-sm text-marrom">Observação artesanal (opcional)</label>
          <textarea
            value={observacaoArtesanal}
            onChange={(e) => setObservacaoArtesanal(e.target.value)}
            rows={2}
            placeholder="Ex: pequenas variações de tom são esperadas nesta peça."
            className="mt-1 w-full rounded-lg border border-borda bg-creme px-4 py-2.5 text-marrom-escuro"
          />
        </div>

        <div>
          <label className="text-sm text-marrom">
            Imagens{" "}
            <span className="text-marrom/50">
              ({imagens.length}/{LIMITE_IMAGENS})
            </span>
          </label>
          <div className="mt-2 flex flex-wrap gap-3">
            {imagens.map((url) => (
              <div key={url} className="relative h-24 w-24 overflow-hidden rounded-lg bg-borda/30">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removerImagem(url)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-carvao/70 text-xs text-white"
                  aria-label="Remover imagem"
                >
                  ×
                </button>
              </div>
            ))}

            {imagens.length < LIMITE_IMAGENS && (
            <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-borda text-center text-xs text-marrom hover:border-terracota">
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
        </div>

        <label className="flex items-center gap-2 text-sm text-marrom-escuro">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Ativo (visível no catálogo)
        </label>

        {editando && produtoExistente ? (
          <GerenciarVariantes
            produtoId={produtoExistente.id}
            variantesArgila={produtoExistente.variantesArgila}
            variantesCor={produtoExistente.variantesCor}
          />
        ) : (
          <p className="rounded-lg border border-dashed border-borda p-4 text-sm text-marrom">
            Salve a peça primeiro pra poder cadastrar as cores de argila e esmalte.
          </p>
        )}

        {erro && <p className="text-sm text-red-700">{erro}</p>}

        <div className="mt-4 flex gap-3">
          <button
            onClick={salvar}
            disabled={salvando || enviandoImagem}
            className="rounded-full bg-marrom-escuro px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3a2e26] disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar peça"}
          </button>
          <button
            onClick={() => navegar("/admin/produtos")}
            className="rounded-full border border-borda px-6 py-3 text-sm text-marrom-escuro"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProdutoForm() {
  return (
    <AdminGuard>
      <Formulario />
    </AdminGuard>
  );
}
