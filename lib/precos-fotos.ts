/* ============================================================
   Preços das fotografias vendidas no dia e aos convidados.

   Estes números estavam escritos à mão em seis sítios: a página
   pública dos convidados, o ticket do fotógrafo, três rotas de API e
   a lista de pedidos. Bastava esquecer um para se cobrar valores
   diferentes conforme o caminho. Agora vivem aqui.
   ============================================================ */

/** Preço de cada fotografia, em euros. */
export const PRECO_FOTO = 5

/** Portes de envio em papel, em euros. */
export const PORTES_PAPEL = 5

/** A partir desta quantidade, os portes são grátis. */
export const PORTES_GRATIS_A_PARTIR_DE = 8

/** Portes a cobrar para um pedido. Só o papel tem portes. */
export function calcularPortes(formato: string, quantidade: number): number {
  const ehPapel = (formato ?? '').toLowerCase() === 'papel'
  if (!ehPapel) return 0
  return quantidade >= PORTES_GRATIS_A_PARTIR_DE ? 0 : PORTES_PAPEL
}

/** Texto do cartão informativo, para não andar a repetir números na copy. */
export const TEXTO_PORTES =
  `Só abaixo de ${PORTES_GRATIS_A_PARTIR_DE} fotografias. A partir de ${PORTES_GRATIS_A_PARTIR_DE}, portes grátis.`
