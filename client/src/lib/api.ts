import type { Produto, PedidoCriadoResponse } from "./types";

const API_BASE = "/api";

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
