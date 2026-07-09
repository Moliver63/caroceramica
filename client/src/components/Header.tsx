import { Link } from "wouter";
import { useCarrinho } from "../lib/carrinho-context";

export default function Header() {
  const { totalItens } = useCarrinho();

  return (
    <header className="border-b border-borda bg-creme">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/">
          <a className="font-serif text-2xl text-marrom-escuro">Caro Cerâmica</a>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/catalogo/consultorio">
            <a className="hover:text-terracota">Consultório</a>
          </Link>
          <Link href="/catalogo/casa">
            <a className="hover:text-terracota">Casa</a>
          </Link>
          <Link href="/carrinho">
            <a className="hover:text-terracota">Carrinho ({totalItens})</a>
          </Link>
        </nav>
      </div>
    </header>
  );
}
