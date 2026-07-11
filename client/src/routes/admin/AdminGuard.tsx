import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { trpc } from "../../lib/trpc";

/** Envolve páginas /admin/* — redireciona pro login se a sessão não for válida. */
export default function AdminGuard({ children }: { children: ReactNode }) {
  const { data, isLoading } = trpc.admin.sessaoAtual.useQuery();
  const [, navegar] = useLocation();

  useEffect(() => {
    if (!isLoading && !data?.isAdmin) {
      navegar("/admin/login");
    }
  }, [isLoading, data, navegar]);

  if (isLoading) {
    return <div className="p-10 text-center text-marrom">Verificando sessão…</div>;
  }

  if (!data?.isAdmin) return null;

  return <>{children}</>;
}
