import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "../../lib/trpc";

function IconeCasa({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 11.5 12 5l8 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconeCaixa({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3.5 8.5 12 4l8.5 4.5L12 13 3.5 8.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3.5 8.5V16l8.5 4.5 8.5-4.5V8.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 13v7.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function IconePessoas({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15.2 12.3a4.3 4.3 0 0 1 5.3 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function IconeEnvelope({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="1.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.5 7 12 12.5 19.5 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconeEstrela({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3.5 14.4 9l6 .6-4.5 3.9 1.4 5.9L12 16.3 6.7 19.4l1.4-5.9L3.6 9.6l6-.6 2.4-5.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function IconeSaida({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 8l-4 4 4 4M6 12h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV = [
  { href: "/admin/produtos", label: "Produtos", Icone: IconeCasa, base: "/admin/produtos" },
  { href: "/admin/pedidos", label: "Pedidos", Icone: IconeCaixa, base: "/admin/pedidos" },
  { href: "/admin/clientes", label: "Clientes", Icone: IconePessoas, base: "/admin/clientes" },
  { href: "/admin/emails", label: "E-mails", Icone: IconeEnvelope, base: "/admin/emails" },
  { href: "/admin/leads", label: "Newsletter", Icone: IconeEstrela, base: "/admin/leads" },
];

export default function AdminLayout({
  titulo,
  acoes,
  children,
}: {
  titulo: string;
  acoes?: ReactNode;
  children: ReactNode;
}) {
  const [location] = useLocation();
  const utils = trpc.useUtils();
  const logout = trpc.admin.logout.useMutation({
    onSuccess: () => utils.admin.sessaoAtual.invalidate(),
  });

  return (
    <div className="flex min-h-screen bg-[#F5F4F1]">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 flex-col bg-carvao text-creme/80 md:flex">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <img src="/marca/icone-creme.png" alt="" className="h-7 w-7" aria-hidden="true" />
          <div>
            <p className="font-serif text-base leading-none text-creme">Caro Vargas</p>
            <p className="eyebrow mt-1 text-[0.6rem] leading-none text-creme/40">Painel admin</p>
          </div>
        </div>

        <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-3">
          {NAV.map(({ href, label, Icone, base }) => {
            const ativo = location.startsWith(base);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  ativo
                    ? "bg-creme/10 font-medium text-creme"
                    : "text-creme/60 hover:bg-creme/5 hover:text-creme"
                }`}
              >
                <Icone className="h-[18px] w-[18px]" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-creme/10 px-3 py-3">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-creme/50 transition hover:bg-creme/5 hover:text-creme"
          >
            ‹ Ver site
          </Link>
          <button
            onClick={() => logout.mutate()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-creme/50 transition hover:bg-creme/5 hover:text-creme"
          >
            <IconeSaida className="h-[18px] w-[18px]" />
            Sair
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar mobile (sidebar vira topo em telas pequenas) */}
        <div className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 md:hidden">
          <Link href="/admin/produtos" className="flex items-center gap-2">
            <img src="/marca/icone.png" alt="" className="h-6 w-6" />
            <span className="font-serif text-sm text-marrom-escuro">Admin</span>
          </Link>
          <Link href="/" className="text-xs text-marrom hover:text-terracota">
            Ver site
          </Link>
        </div>

        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 bg-white px-6 py-5 md:px-10">
          <h1 className="text-xl font-semibold text-[#2B2420]">{titulo}</h1>
          {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
        </header>

        <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
