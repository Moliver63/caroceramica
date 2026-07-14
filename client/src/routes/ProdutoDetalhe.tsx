import { useParams, Link } from "wouter";
import { useEffect, useMemo, useState } from "react";
import type { VarianteCor, VarianteArgila } from "../lib/types";
import { useCarrinho } from "../lib/carrinho-context";
import { trpc } from "../lib/trpc";
import { labelCategoria } from "@shared/const";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CarrosselImagens from "../components/CarrosselImagens";

export default function ProdutoDetalhe() {
  const { slug } = useParams();
  const { adicionarItem } = useCarrinho();

  const { data: produto } = trpc.produtos.buscarPorSlug.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug }
  );
  const [argilaSelecionada, setArgilaSelecionada] = useState<VarianteArgila | null>(null);
  const [corSelecionada, setCorSelecionada] = useState<VarianteCor | null>(null);
  const [arteCarimbo, setArteCarimbo] = useState<File | null>(null);
  const [textoCarimbo, setTextoCarimbo] = useState("");

  useEffect(() => {
    if (produto) {
      setArgilaSelecionada(produto.variantesArgila[0] ?? null);
      setCorSelecionada(produto.variantesCor[0] ?? null);
    }
  }, [produto]);

  // A imagem muda pra refletir a cor escolhida — prioriza o esmalte
  // (é a variante mais visível na peça pronta), cai pra argila se o
  // esmalte não tiver foto própria, senão mantém a galeria padrão.
  const imagensExibidas = useMemo(() => {
    if (!produto) return [];
    const imagemVariante = corSelecionada?.imagemUrl || argilaSelecionada?.imagemUrl;
    if (!imagemVariante) return produto.imagens ?? [];
    const resto = (produto.imagens ?? []).filter((u) => u !== imagemVariante);
    return [imagemVariante, ...resto];
  }, [produto, corSelecionada, argilaSelecionada]);

  if (!produto)
    return (
      <div>
        <Header />
        <div className="p-10 text-center text-marrom">Carregando…</div>
        <Footer />
      </div>
    );

  const precoFinal =
    Number(produto.precoBase) +
    (produto.personalizavel ? Number(produto.custoPersonalizacao) : 0);

  const labelPersonalizacao =
    produto.tipoPersonalizacao === "decalque"
      ? "Personalização com decalque exclusivo"
      : "Personalização com carimbo exclusivo";

  function handleAdicionarAoCarrinho() {
    if (!produto) return;

    adicionarItem({
      produtoId: produto.id,
      produto: {
        id: produto.id,
        nome: produto.nome,
        slug: produto.slug,
        precoBase: produto.precoBase,
        personalizavel: produto.personalizavel,
        custoPersonalizacao: produto.custoPersonalizacao,
      },
      varianteCorId: corSelecionada?.id ?? null,
      varianteArgilaId: argilaSelecionada?.id ?? null,
      quantidade: 1,
      personalizacao: produto.personalizavel
        ? {
            arteCarimboFile: arteCarimbo ?? undefined,
            textoCarimbo,
          }
        : undefined,
    });
  }

  return (
    <div>
      <Header />
      <div className="mx-auto max-w-5xl px-6 pt-8">
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-marrom">
          <Link href="/" className="hover:text-terracota">
            Início
          </Link>
          <span>/</span>
          <Link href={`/catalogo/${produto.categoria}`} className="hover:text-terracota">
            {labelCategoria(produto.categoria)}
          </Link>
          <span>/</span>
          <span className="text-marrom-escuro">{produto.nome}</span>
        </nav>
      </div>

      <div className="mx-auto grid max-w-5xl gap-10 px-6 py-10 md:grid-cols-2">
        <CarrosselImagens imagens={imagensExibidas} nomeProduto={produto.nome} />

        <div>
          <p className="eyebrow text-marrom/60">
            {labelCategoria(produto.categoria)}
          </p>
          <h1 className="mt-1 font-serif text-3xl text-marrom-escuro">{produto.nome}</h1>
          <p className="mt-2 text-marrom">{produto.descricao}</p>

          {produto.precoSobConsulta ? (
            <p className="mt-4 text-2xl text-terracota">Sob consulta</p>
          ) : (
            <p className="mt-4 text-2xl text-terracota">
              R$ {precoFinal.toFixed(2).replace(".", ",")}
            </p>
          )}

          {produto.variantesArgila.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-marrom-escuro">Cor da argila</p>
              <div className="flex gap-3">
                {produto.variantesArgila.map((argila) => (
                  <button
                    key={argila.id}
                    onClick={() => setArgilaSelecionada(argila)}
                    className={`h-9 w-9 rounded-full border-2 ${
                      argilaSelecionada?.id === argila.id
                        ? "border-marrom-escuro"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: argila.codigoHex ?? "#ccc" }}
                    title={argila.nome}
                  />
                ))}
              </div>
            </div>
          )}

          {produto.variantesCor.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-marrom-escuro">Cor do esmalte</p>
              <div className="flex gap-3">
                {produto.variantesCor.map((cor) => (
                  <button
                    key={cor.id}
                    onClick={() => setCorSelecionada(cor)}
                    className={`h-9 w-9 rounded-full border-2 ${
                      corSelecionada?.id === cor.id
                        ? "border-marrom-escuro"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: cor.codigoHex ?? "#ccc" }}
                    title={cor.nome}
                  />
                ))}
              </div>
            </div>
          )}

          {produto.personalizavel && (
            <div className="mt-6 space-y-3 rounded-lg border border-borda p-4">
              <p className="text-sm font-medium text-marrom-escuro">
                {labelPersonalizacao}
                {!produto.precoSobConsulta &&
                  ` (+R$ ${Number(produto.custoPersonalizacao).toFixed(2).replace(".", ",")})`}
              </p>
              <input
                type="text"
                placeholder="Texto ou iniciais"
                value={textoCarimbo}
                onChange={(e) => setTextoCarimbo(e.target.value)}
                className="w-full rounded border border-borda px-3 py-2 text-sm text-marrom-escuro"
              />
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setArteCarimbo(e.target.files?.[0] ?? null)}
                className="text-sm text-marrom"
              />
              <p className="text-xs text-marrom">
                Envie sua arte/logo, ou deixe em branco para receber uma prova por
                e-mail antes da produção.
              </p>
            </div>
          )}

          <p className="mt-6 text-sm text-marrom">
            {produto.observacaoArtesanal} Prazo de produção: {produto.prazoProducaoDias}{" "}
            dias.
          </p>

          {produto.precoSobConsulta ? (
            <a
              href={`mailto:contato@carovargas.com.br?subject=${encodeURIComponent(
                "Consulta de valor — " + produto.nome
              )}`}
              className="mt-6 block w-full rounded-full bg-marrom-escuro py-3 text-center text-white transition hover:bg-[#3a2e26]"
            >
              Consultar valor
            </a>
          ) : (
            <button
              onClick={handleAdicionarAoCarrinho}
              className="mt-6 w-full rounded-full bg-marrom-escuro py-3 text-white transition hover:bg-[#3a2e26]"
            >
              Adicionar ao carrinho
            </button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
