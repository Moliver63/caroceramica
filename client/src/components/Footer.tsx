import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="mt-24 bg-carvao text-creme/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <p className="font-serif text-2xl text-creme">Caro Cerâmica</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            Peças de cerâmica feitas à mão, uma a uma, no torno. Cada uma leva o
            tempo que precisa — e carrega pequenas variações que são prova disso.
          </p>
        </div>

        <div>
          <p className="eyebrow text-creme/50">Catálogo</p>
          <nav className="mt-4 flex flex-col gap-2 text-sm">
            <Link href="/catalogo/consultorio" className="hover:text-terracota">
              Para consultório
            </Link>
            <Link href="/catalogo/casa" className="hover:text-terracota">
              Para casa
            </Link>
            <Link href="/carrinho" className="hover:text-terracota">
              Meu carrinho
            </Link>
          </nav>
        </div>

        <div>
          <p className="eyebrow text-creme/50">Atendimento</p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <a href="mailto:contato@carovargas.com.br" className="hover:text-terracota">
              contato@carovargas.com.br
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
        <p className="mt-2">© {new Date().getFullYear()} Caro Cerâmica. Feito à mão, com carinho.</p>
      </div>
    </footer>
  );
}
