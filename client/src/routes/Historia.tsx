import Header from "../components/Header";
import Footer from "../components/Footer";
import Seo from "../components/Seo";

export default function Historia() {
  return (
    <div>
      <Seo
        titulo="Nossa história"
        descricao="Conheça a história por trás da Caro Vargas Cerâmica — peças feitas à mão, uma a uma, no torno."
        caminho="/historia"
      />
      <Header />

      <section className="mx-auto max-w-2xl px-6 py-16">
        <p className="eyebrow text-terracota">Nossa história</p>
        <h1 className="mt-2 font-serif text-4xl text-marrom-escuro">
          Feito à mão, uma peça de cada vez
        </h1>

        <div className="mt-8 space-y-5 text-marrom leading-relaxed">
          <p>
            A Caro Vargas nasceu do encontro entre as mãos, a argila e o tempo.
            Cada peça é moldada no torno, uma de cada vez — sem pressa, sem
            atalhos — porque acreditamos que o cuidado no processo é o que
            transforma um objeto simples em algo que carrega significado.
          </p>
          <p>
            Trabalhamos com cerâmica artesanal para casa e para momentos de
            personalização especial, sempre respeitando o ritmo natural do
            barro: cada peça leva o tempo que precisa pra secar, ser
            esmaltada e queimada, e é exatamente por isso que nenhuma sai
            igual à outra. Pequenas variações de forma, textura e tonalidade
            não são imperfeições — são a prova de que uma pessoa, e não uma
            máquina, fez aquela peça pra você.
          </p>
          <p>
            Mais do que objetos, pensamos em peças que acolhem histórias,
            criam memórias e transformam momentos simples — um café pela
            manhã, um presente, uma mesa posta — em experiências especiais.
          </p>
        </div>

        <a
          href="https://www.instagram.com/carovargas.ceramica"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-marrom-escuro px-6 py-3 text-sm font-semibold text-marrom-escuro transition hover:bg-borda/30"
        >
          Ver mais no Instagram — @carovargas.ceramica
        </a>
      </section>

      <Footer />
    </div>
  );
}
