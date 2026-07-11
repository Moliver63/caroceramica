import { createHmac, timingSafeEqual } from "crypto";
import { ENV } from "./env";

export const COOKIE_NOME = "admin_session";
const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function assinar(payload: string): string {
  return createHmac("sha256", ENV.adminSessionSecret).update(payload).digest("hex");
}

/** Gera o valor do cookie de sessão: "expiraEm.assinatura" */
export function criarTokenSessao(): string {
  const expiraEm = Date.now() + VALIDADE_MS;
  const payload = String(expiraEm);
  return `${payload}.${assinar(payload)}`;
}

/** Verifica se o token do cookie é válido e não expirou. */
export function tokenSessaoValido(token: string | undefined): boolean {
  if (!token || !ENV.adminSessionSecret) return false;

  const [payload, assinatura] = token.split(".");
  if (!payload || !assinatura) return false;

  const esperada = assinar(payload);
  const bufA = Buffer.from(assinatura);
  const bufB = Buffer.from(esperada);
  if (bufA.length !== bufB.length || !timingSafeEqual(bufA, bufB)) return false;

  const expiraEm = Number(payload);
  return Number.isFinite(expiraEm) && Date.now() < expiraEm;
}
