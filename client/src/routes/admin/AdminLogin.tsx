import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "../../lib/trpc";

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
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <p className="eyebrow text-marrom/60">Área restrita</p>
      <h1 className="mt-1 font-serif text-2xl text-marrom-escuro">Login do ateliê</h1>

      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setErro(null);
          login.mutate({ senha });
        }}
      >
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          placeholder="Senha"
          autoFocus
          className="rounded-lg border border-borda bg-creme px-4 py-3 text-marrom-escuro"
        />

        {erro && <p className="text-sm text-red-700">{erro}</p>}

        <button
          type="submit"
          disabled={login.isPending}
          className="rounded-full bg-marrom-escuro px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#3a2e26] disabled:opacity-50"
        >
          {login.isPending ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <Link href="/" className="mt-6 text-center text-sm text-marrom hover:text-terracota">
        ‹ Voltar ao site
      </Link>
    </div>
  );
}
