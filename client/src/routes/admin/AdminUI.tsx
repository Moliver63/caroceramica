import type { ReactNode, ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";
import { Link } from "wouter";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-black/5 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

const botaoBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
const variantes = {
  primario: "bg-carvao text-white hover:bg-[#3a3128]",
  secundario: "border border-black/10 bg-white text-[#2B2420] hover:bg-black/[0.03]",
  perigo: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  fantasma: "text-[#6b6459] hover:bg-black/[0.03]",
};

export function Botao({
  variante = "secundario",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: keyof typeof variantes }) {
  return <button className={`${botaoBase} ${variantes[variante]} ${className}`} {...props} />;
}

export function BotaoLink({
  variante = "secundario",
  className = "",
  href,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variante?: keyof typeof variantes;
  href: string;
}) {
  return (
    <Link href={href} className={`${botaoBase} ${variantes[variante]} ${className}`} {...props} />
  );
}

export function Badge({ children, cor }: { children: ReactNode; cor: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cor}`}>
      {children}
    </span>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-black/10 bg-white/50 py-16 text-center text-sm text-[#6b6459]">
      {children}
    </div>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="text-xs font-medium uppercase tracking-wide text-[#8C7A6B]">{children}</label>;
}

export const campoBase =
  "mt-1.5 w-full rounded-lg border border-black/10 bg-white px-3.5 py-2.5 text-sm text-[#2B2420] outline-none transition focus:border-terracota focus:ring-1 focus:ring-terracota";
