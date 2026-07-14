import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

/**
 * Tabela de frete por região — provisória, enquanto não há integração
 * com Melhor Envio ou Correios (nenhuma conta com API configurada ainda).
 * Origem: Balneário Camboriú/SC.
 *
 * Pra trocar por uma API real no futuro: essa procedure é o único lugar
 * que precisa mudar — o client já manda só o CEP e recebe { valor, prazoDias }.
 */
const TABELA_FRETE = [
  { prefixoDe: 80, prefixoAte: 99, regiao: "Sul", valor: 25, prazoDias: 5 },
  { prefixoDe: 1, prefixoAte: 39, regiao: "Sudeste", valor: 35, prazoDias: 7 },
  { prefixoDe: 70, prefixoAte: 79, regiao: "Centro-Oeste", valor: 45, prazoDias: 9 },
  { prefixoDe: 40, prefixoAte: 65, regiao: "Nordeste", valor: 55, prazoDias: 12 },
  { prefixoDe: 66, prefixoAte: 69, regiao: "Norte", valor: 65, prazoDias: 15 },
  { prefixoDe: 76, prefixoAte: 77, regiao: "Norte", valor: 65, prazoDias: 15 },
] as const;

export function calcularPorCep(cep: string) {
  const digitos = cep.replace(/\D/g, "");
  if (digitos.length !== 8) return null;

  const prefixo = Number(digitos.slice(0, 2));
  const faixa = TABELA_FRETE.find(
    (f) => prefixo >= f.prefixoDe && prefixo <= f.prefixoAte
  );
  return faixa ?? null;
}

export const freteRouter = router({
  calcular: publicProcedure
    .input(z.object({ cep: z.string().min(8) }))
    .query(({ input }) => {
      const resultado = calcularPorCep(input.cep);

      if (!resultado) {
        return {
          encontrado: false as const,
          mensagem: "CEP inválido. Confira e tente novamente.",
        };
      }

      return {
        encontrado: true as const,
        regiao: resultado.regiao,
        valor: resultado.valor,
        prazoDias: resultado.prazoDias,
      };
    }),
});
