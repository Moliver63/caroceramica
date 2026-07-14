import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "../../lib/trpc";
import { campoBase } from "./AdminUI";

export default function AdminLogin() {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [, navegar] = useLocation();
  const utils = trpc.useUtils();
  const login = trpc.admin.login.useMutation({
    onSuccess: async () => {
      await utils.admin.sessaoAtual.invalidate();
      navegar("/admin/produtos");
    },
    onError: (e) => setErro(e.message),
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F4F1] px-6">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-2.5">
            <img src="/marca/icone.png" alt="" className="h-8 w-8" />
            <div>
              <p className="font-serif text-lg leading-none text-[#2B2420]">Caro Vargas</p>
              <p className="mt-1 text-[0.65rem] uppercase tracking-wide leading-none text-[#8C7A6B]">
                Painel administrativo
              </p>
            </div>
          </div>

          <form
            className="mt-7 flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              setErro(null);
              login.mutate({ senha });
            }}
          >
            <div>
              <label className="text-xs font-medium uppercase tracking-wide text-[#8C7A6B]">
                Senha
              </label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                autoFocus
                className={campoBase}
              />
            </div>

            {erro && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="mt-1 w-full rounded-lg bg-carvao px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#3a3128] disabled:opacity-50"
            >
              {login.isPending ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>

        <Link
          href="/"
          className="mt-5 block text-center text-sm text-[#8C7A6B] hover:text-terracota"
        >
          ‹ Voltar ao site
        </Link>
      </div>
    </div>
  );
}
