import { Link } from "wouter";
import { CATEGORIAS } from "@shared/const";
import NewsletterForm from "./NewsletterForm";

export default function Footer() {
  return (
    <footer className="mt-24 bg-carvao text-creme/80">
      <div className="mx-auto max-w-6xl border-b border-creme/10 px-6 py-12">
        <p className="eyebrow text-creme/50">Fique por dentro</p>
        <p className="mt-1 max-w-md font-serif text-xl text-creme">
          Novidades e promoções direto no seu e-mail, sem spam.
        </p>
        <div className="mt-5 max-w-md">
          <NewsletterForm />
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/marca/icone-creme.png" alt="" className="h-8 w-8" aria-hidden="true" />
            <img src="/marca/wordmark-creme.png" alt="Caro Vargas Cerâmica" className="h-4 w-auto" />
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Peças de cerâmica feitas à mão, uma a uma, com muito carinho e dedicação.
            Cada uma leva o tempo que precisa e pode carregar pequenas variações de
            forma, tamanho e cor, pois são artesanais.
          </p>
        </div>

        <div>
          <p className="eyebrow text-creme/50">Catálogo</p>
          <nav className="mt-4 flex flex-col gap-2 text-sm">
            {CATEGORIAS.map((c) => (
              <Link key={c.valor} href={`/catalogo/${c.valor}`} className="hover:text-terracota">
                {c.label}
              </Link>
            ))}
            <Link href="/carrinho" className="hover:text-terracota">
              Meu carrinho
            </Link>
            <Link href="/historia" className="hover:text-terracota">
              Nossa história
            </Link>
            <Link href="/rastreio" className="hover:text-terracota">
              Rastrear pedido
            </Link>
          </nav>
        </div>

        <div>
          <p className="eyebrow text-creme/50">Atendimento</p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <a href="mailto:contato@carovargas.com.br" className="hover:text-terracota">
              contato@carovargas.com.br
            </a>
            <a
              href="https://www.instagram.com/carovargas.ceramica"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-terracota"
            >
              @carovargas.ceramica
            </a>
            <p>Produção sob encomenda — prazo informado em cada peça.</p>
            <p>Pagamento via Pix, boleto ou cartão.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-creme/10 px-6 py-6 text-center text-xs text-creme/50">
        <p>
          Cada peça possui pequenas variações de forma, textura e tonalidade —
          marcas do processo artesanal e da singularidade de cada criação.
        </p>
        <p className="mt-2">© {new Date().getFullYear()} Caro Vargas Cerâmica. Feito à mão, com carinho.</p>
      </div>
    </footer>
  );
}
