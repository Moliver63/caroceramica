import { Link } from "wouter";
import { useState } from "react";
import { useCarrinho } from "../lib/carrinho-context";
import { CATEGORIAS } from "@shared/const";

function IconeSacola({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6 8h12l1 12.5a1.5 1.5 0 0 1-1.5 1.5H6.5A1.5 1.5 0 0 1 5 20.5L6 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 8V6a3 3 0 0 1 6 0v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconeCadeado({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect
        x="5"
        y="10.5"
        width="14"
        height="9.5"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 10.5V7.5a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const links = CATEGORIAS.map((c) => ({
  href: `/catalogo/${c.valor}`,
  label: c.label,
}));

export default function Header() {
  const { totalItens } = useCarrinho();
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-borda bg-creme/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/marca/icone.png" alt="" className="h-9 w-9" aria-hidden="true" />
          <span className="flex items-baseline gap-1.5">
            <span className="font-serif text-xl text-marrom-escuro">Caro Vargas</span>
            <span className="eyebrow text-[0.65rem] text-marrom/60">Cerâmica</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="eyebrow text-marrom-escuro/80 hover:text-terracota">
              {l.label}
            </Link>
          ))}
          <Link
            href="/carrinho"
            className="relative flex items-center gap-2 text-marrom-escuro hover:text-terracota"
            aria-label={`Carrinho, ${totalItens} ${totalItens === 1 ? "item" : "itens"}`}
          >
            <IconeSacola className="h-6 w-6" />
            {totalItens > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-terracota text-xs text-white">
                {totalItens}
              </span>
            )}
          </Link>

          <Link
            href="/admin/produtos"
            className="ml-2 border-l border-borda pl-6 text-marrom-escuro/40 hover:text-marrom-escuro"
            aria-label="Acesso administrativo"
            title="Acesso administrativo"
          >
            <IconeCadeado className="h-5 w-5" />
          </Link>
        </nav>

        <div className="flex items-center gap-4 md:hidden">
          <Link href="/carrinho" className="relative text-marrom-escuro" aria-label="Carrinho">
            <IconeSacola className="h-6 w-6" />
            {totalItens > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-terracota text-xs text-white">
                {totalItens}
              </span>
            )}
          </Link>
          <button
            onClick={() => setMenuAberto((v) => !v)}
            aria-label="Abrir menu"
            aria-expanded={menuAberto}
            className="flex h-9 w-9 flex-col items-center justify-center gap-1.5"
          >
            <span
              className={`h-px w-6 bg-marrom-escuro transition ${menuAberto ? "translate-y-[3.5px] rotate-45" : ""}`}
            />
            <span
              className={`h-px w-6 bg-marrom-escuro transition ${menuAberto ? "-translate-y-[3.5px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      {menuAberto && (
        <nav className="flex flex-col gap-1 border-t border-borda bg-creme px-6 pb-5 pt-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuAberto(false)}
              className="py-2 text-marrom-escuro"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/admin/produtos"
            onClick={() => setMenuAberto(false)}
            className="mt-2 flex items-center gap-2 border-t border-borda py-3 text-sm text-marrom-escuro/50"
          >
            <IconeCadeado className="h-4 w-4" />
            Acesso administrativo
          </Link>
        </nav>
      )}
    </header>
  );
}
