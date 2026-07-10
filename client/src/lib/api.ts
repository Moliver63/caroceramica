import type { Produto, PedidoCriadoResponse } from "./types";

// Em dev, o vite.config.ts faz proxy de /api pra localhost:4000.
// Em producao, client e server ficam em dominios .onrender.com diferentes,
// entao a URL completa da API precisa vir de uma env var do Vite.
const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : "/api";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const erro = await res.json().catch(() => ({ erro: res.statusText }));
    throw new Error(erro.erro ?? "Erro ao comunicar com o servidor");
  }

  return res.json() as Promise<T>;
}

export const api = {
  listarProdutos: (categoria?: "consultorio" | "casa") =>
    apiFetch<Produto[]>(`/produtos${categoria ? `?categoria=${categoria}` : ""}`),

  buscarProduto: (slug: string) => apiFetch<Produto>(`/produtos/${slug}`),

  criarPedido: (payload: unknown) =>
    apiFetch<PedidoCriadoResponse>("/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
