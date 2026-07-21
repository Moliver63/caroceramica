import { Link } from "wouter";
import { trpc } from "../lib/trpc";
import { CATEGORIAS } from "@shared/const";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProdutoCard from "../components/ProdutoCard";
import Seo from "../components/Seo";
import { jsonLdSeguro } from "../lib/jsonld";

export default function Home() {
  const { data: lista } = trpc.produtos.listar.useQuery();
  const { data: banners } = trpc.categorias.listarBanners.useQuery();
  const destaques = (lista ?? []).slice(0, 4);

  return (
    <div>
      <Seo
        titulo="Caro Vargas Cerâmica | Peças artesanais feitas à mão"
        descricao="Cerâmica artesanal feita à mão em Balneário Camboriú/SC. Peças de pronta entrega e personalizadas — cada uma única, feita no torno, para casa e presentes."
        caminho="/"
      />
      <Header />

      {/* Hero — banda com o divisor orgânico como elemento de assinatura */}
      <section className="borda-torneada bg-gradient-to-b from-borda/50 to-creme pb-24 pt-16 md:pb-32">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="eyebrow text-terracota">Feito à mão, uma peça de cada vez</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-marrom-escuro md:text-5xl">
            Receber com charme: um convite para celebrar o aqui e agora
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-marrom">
            Cada peça nasce do encontro entre a argila, o tempo e o cuidado. Mais do
            que objetos, são peças pensadas para acolher histórias, criar memórias e
            transformar momentos simples em experiências especiais.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {CATEGORIAS.map((cat, i) => (
              <Link
                key={cat.valor}
                href={`/catalogo/${cat.valor}`}
                className={
                  i === 0
                    ? "rounded-full bg-marrom-escuro px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#3a2e26]"
                    : "rounded-full border border-marrom-escuro px-7 py-3 text-sm font-semibold text-marrom-escuro transition hover:bg-borda/30"
                }
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Tiles de categoria — entrada visual pro catálogo, não só texto */}
      <section className="mx-auto -mt-10 grid max-w-6xl gap-6 px-6 md:-mt-16 md:grid-cols-3 md:gap-8">
        {CATEGORIAS.map((cat) => {
          const banner = banners?.[cat.valor];
          return (
            <Link
              key={cat.valor}
              href={`/catalogo/${cat.valor}`}
              className="group relative flex h-48 items-end overflow-hidden rounded-2xl bg-marrom-escuro bg-cover bg-center p-6 shadow-lg transition md:h-64"
              style={banner ? { backgroundImage: `url(${banner})` } : undefined}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-carvao/85 via-carvao/25 to-transparent transition group-hover:from-carvao/95" />
              <div className="relative">
                <p className="font-serif text-2xl text-creme">{cat.label}</p>
                <p className="mt-1 text-sm text-creme/70">{cat.descricao}</p>
              </div>
            </Link>
          );
        })}
      </section>

      {destaques.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-20">
          <p className="eyebrow text-marrom/60">Seleção atual</p>
          <h2 className="mb-8 mt-1 font-serif text-2xl text-marrom-escuro">Destaques do ateliê</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4">
            {destaques.map((p) => (
              <ProdutoCard key={p.id} produto={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-3xl px-6 py-20">
        <p className="eyebrow text-marrom/60">Dúvidas frequentes</p>
        <h2 className="mb-8 mt-1 font-serif text-2xl text-marrom-escuro">Perguntas frequentes</h2>
        <div className="space-y-6">
          {FAQ.map((item) => (
            <div key={item.pergunta} className="border-b border-borda pb-6">
              <p className="font-medium text-marrom-escuro">{item.pergunta}</p>
              <p className="mt-2 text-sm leading-relaxed text-marrom">{item.resposta}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Schema.org FAQPage — ajuda o Google a mostrar as perguntas
          direto no resultado de busca */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdSeguro({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map((item) => ({
              "@type": "Question",
              name: item.pergunta,
              acceptedAnswer: { "@type": "Answer", text: item.resposta },
            })),
          }),
        }}
      />

      <Footer />
    </div>
  );
}

const FAQ = [
  {
    pergunta: "Como funciona a personalização das peças?",
    resposta:
      "Nas peças personalizadas, você pode adicionar um carimbo exclusivo ou decalque com texto, iniciais ou logo. Na hora da compra, envia a arte (ou o texto) e recebe uma prova antes da produção começar.",
  },
  {
    pergunta: "Qual o prazo de produção?",
    resposta:
      "Cada peça é feita à mão, uma de cada vez — o prazo varia conforme a complexidade, geralmente até 30 dias. O prazo exato de cada peça aparece na página do produto, antes de você finalizar a compra.",
  },
  {
    pergunta: "Peças de pronta entrega saem mais rápido?",
    resposta:
      "Sim. As peças da categoria 'Pronta Entrega' já estão prontas no ateliê e vão direto pro envio, sem esperar o tempo de produção das personalizadas.",
  },
  {
    pergunta: "Como funciona o frete?",
    resposta:
      "O frete é calculado pelo CEP de entrega direto no carrinho, antes de você finalizar a compra — sem surpresa no final.",
  },
  {
    pergunta: "As peças têm variações entre si?",
    resposta:
      "Sim, e é assim de propósito: como cada peça é moldada à mão no torno, pequenas variações de forma, tom e textura são naturais — é o que garante que a sua peça seja única, não uma cópia idêntica de outras 500.",
  },
  {
    pergunta: "Quais as formas de pagamento?",
    resposta: "Pix, boleto ou cartão de crédito, direto no checkout do site.",
  },
  {
    pergunta: "Como acompanho meu pedido depois da compra?",
    resposta:
      "Você recebe atualizações por e-mail em cada etapa (pedido recebido, em produção, enviado) e também pode consultar o status a qualquer momento na página de Rastreamento, com o código do pedido e o e-mail usado na compra.",
  },
];
