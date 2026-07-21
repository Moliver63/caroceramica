/**
 * JSON.stringify comum não escapa "<", então um valor que contenha
 * literalmente "</script>" (ex: um nome ou descrição de produto)
 * fecharia a tag de script antes da hora, quebrando o resto da página
 * — problema clássico e conhecido de embutir JSON-LD via
 * dangerouslySetInnerHTML. Escapamos "<" como \u003c, que o JSON
 * aceita normalmente e o navegador decodifica de volta sem problema
 * nenhum na hora de interpretar como JSON-LD.
 */
export function jsonLdSeguro(dados: unknown): string {
  return JSON.stringify(dados).replace(/</g, "\\u003c");
}
