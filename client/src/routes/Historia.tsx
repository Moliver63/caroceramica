import Header from "../components/Header";
import Footer from "../components/Footer";
import Seo from "../components/Seo";

export default function Historia() {
  return (
    <div>
      <Seo
        titulo="Nossa história"
        descricao="Conheça a história por trás da Caro Vargas Cerâmica, peças feitas à mão, uma a uma, no torno."
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
            Cada peça é moldada no torno, uma de cada vez, sem pressa. O cuidado
            no processo é o que dá significado ao objeto final.
          </p>
          <p>
            Trabalhamos com cerâmica pra casa e peças personalizadas, sempre no
            ritmo do barro: cada uma leva o tempo que precisa pra secar, ser
            esmaltada e queimada. Por isso nenhuma sai igual à outra. As
            pequenas variações de forma, textura e tom não são defeito. São a
            marca de que uma pessoa fez aquela peça com as próprias mãos.
          </p>
          <p>
            Gostamos de pensar nessas peças fazendo parte do dia a dia de
            alguém: o café da manhã, um presente, a mesa posta num domingo.
          </p>
        </div>

        <a
          href="https://www.instagram.com/carovargas.ceramica"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-marrom-escuro px-6 py-3 text-sm font-semibold text-marrom-escuro transition hover:bg-borda/30"
        >
          Ver mais no Instagram: @carovargas.ceramica
        </a>
      </section>

      <Footer />
    </div>
  );
}
