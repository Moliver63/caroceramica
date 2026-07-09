import { useParams } from "wouter";
import { useEffect, useState } from "react";
import type { Produto, VarianteCor } from "../lib/types";
import { useCarrinho } from "../lib/carrinho-context";
import { api } from "../lib/api";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ProdutoDetalhe() {
  const { slug } = useParams();
  const { adicionarItem } = useCarrinho();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [corSelecionada, setCorSelecionada] = useState<VarianteCor | null>(null);
  const [arteCarimbo, setArteCarimbo] = useState<File | null>(null);
  const [textoCarimbo, setTextoCarimbo] = useState("");

  useEffect(() => {
    if (!slug) return;
    api.buscarProduto(slug).then((data) => {
      setProduto(data);
      setCorSelecionada(data.variantesCor[0] ?? null);
    });
  }, [slug]);

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
      <div className="mx-auto max-w-5xl px-6 py-10 grid md:grid-cols-2 gap-10">
      <div>
        <img
          src={produto.imagens[0]}
          alt={produto.nome}
          className="w-full rounded-xl object-cover"
        />
      </div>

      <div>
        <h1 className="font-serif text-3xl text-[#4A3B31]">{produto.nome}</h1>
        <p className="mt-2 text-[#8C7A6B]">{produto.descricao}</p>

        <p className="mt-4 text-2xl text-[#B08D6E]">
          R$ {precoFinal.toFixed(2).replace(".", ",")}
        </p>

        {produto.variantesCor.length > 0 && (
          <div className="mt-6">
            <p className="text-sm font-medium mb-2">Cor</p>
            <div className="flex gap-3">
              {produto.variantesCor.map((cor) => (
                <button
                  key={cor.id}
                  onClick={() => setCorSelecionada(cor)}
                  className={`h-9 w-9 rounded-full border-2 ${
                    corSelecionada?.id === cor.id
                      ? "border-[#4A3B31]"
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
          <div className="mt-6 space-y-3 rounded-lg border border-[#E4D9CC] p-4">
            <p className="text-sm font-medium">
              Personalização com carimbo exclusivo (+R${" "}
              {Number(produto.custoPersonalizacao).toFixed(2).replace(".", ",")})
            </p>
            <input
              type="text"
              placeholder="Texto ou iniciais para o carimbo"
              value={textoCarimbo}
              onChange={(e) => setTextoCarimbo(e.target.value)}
              className="w-full rounded border border-[#E4D9CC] px-3 py-2 text-sm"
            />
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setArteCarimbo(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <p className="text-xs text-[#8C7A6B]">
              Envie sua arte/logo, ou deixe em branco para receber uma prova por
              e-mail antes da produção.
            </p>
          </div>
        )}

        <p className="mt-6 text-sm text-[#8C7A6B]">
          {produto.observacaoArtesanal} Prazo de produção: {produto.prazoProducaoDias}{" "}
          dias.
        </p>

        <button
          onClick={handleAdicionarAoCarrinho}
          className="mt-6 w-full rounded-lg bg-[#4A3B31] py-3 text-white hover:bg-[#3a2e26] transition"
        >
          Adicionar ao carrinho
        </button>
      </div>
      </div>
      <Footer />
    </div>
  );
}
