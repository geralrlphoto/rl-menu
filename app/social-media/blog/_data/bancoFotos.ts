/* ============================================================
   Banco de fotos para os posts do blog.
   Fotos que já estão carregadas no site (Hostinger), para o código
   sair pronto sem ter de colar links. Cada artigo recebe sempre as
   mesmas fotos (escolha fixa a partir do título), e podem ser
   trocadas à mão em "Trocar fotos".
   Para acrescentar: carregar a foto na Hostinger e juntar o nome aqui.
   ============================================================ */

const BASE = 'https://assets.zyrosite.com/Ylev2r3y41up6191/'

/** Fotos na horizontal: servem de capa. */
const HORIZONTAIS = [
  '0j0a5075-tdq2N6DmjeKh8c1S.jpg',
  '0j0a6025-JnYXfWX1iuIQ1DwB.jpg',
  '0j0a6058-X3Ay1qe1S1qKjxSf.jpg',
  '0j0a6082-Egz0boZnGB87lICH.jpg',
  '0j0a7540-ieIAyxqeJIxas671.jpg',
  '0j0a7648-dvT00ng42OLIJSW5.jpg',
  '0j0a8793-UDI8P1lBjWu4n2m7.jpg',
  '0j0a8920-gHHfmxBbMpn2Iir4.jpg',
  '0j0a9006-91PEThZ2fHEBg2ur.jpg',
  '0j0a9421-KiUkLOekhtnGGdHm.jpg',
  '0j9a9460-mnQgLigMBu5njRaA.jpg',
  '0j9a9669-TUNcHH5LyZvZzwhL.jpg',
]

/** Fotos na vertical: só para o corpo do artigo. */
const VERTICAIS = [
  '0j0a5035-vUlH1kqIALunQSvu.jpg',
  '0j0a5267-4bJAELos3py6YcQ7.jpg',
  '0j0a7791-2-gRZIuYao6jgwPrgz.jpg',
  '0j9a9540-gNQVuXT6gUkV0sIL.jpg',
  '0j9a9656-fw15ybd3tFiTrJS4.jpg',
]

function hash(t: string): number {
  let h = 0
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0
  return h
}

/** Capa + 3 fotos para o corpo, sempre as mesmas para o mesmo artigo. */
export function fotosParaArtigo(seed: string, quantas = 3): string[] {
  const h = hash(seed)
  const capa = HORIZONTAIS[h % HORIZONTAIS.length]
  const resto = [...HORIZONTAIS, ...VERTICAIS].filter(f => f !== capa)
  const corpo: string[] = []
  for (let i = 0; corpo.length < quantas && i < resto.length; i++) {
    corpo.push(resto[(h + i * 7) % resto.length])
  }
  return [capa, ...Array.from(new Set(corpo))].map(f => BASE + f)
}
