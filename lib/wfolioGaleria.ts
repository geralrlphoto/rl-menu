// Lê uma galeria do Wfolio (pastas + fotografias) para a galeria de seleção
// dentro do portal dos noivos. As imagens continuam a ser servidas pelo Wfolio
// (tráfego do Wfolio, 0 no Supabase): aqui só se lê a lista e os endereços.
// A leitura fica em cache 10 min na Vercel.

import type { SelecaoFotos } from './selecao-fotos-save'

export type FotoWfolio = { n: string; t: string; g: string; r: number }
export type PastaWfolio = { nome: string; slug: string; campo: CampoSelecao; fotos: FotoWfolio[] }
export type CampoSelecao = keyof Pick<SelecaoFotos,
  'preparacao' | 'sessao_noivos' | 'fotos_noiva' | 'fotos_noivo' | 'convidados' |
  'cerimonia' | 'bolo_bouquet' | 'sala_animacao' | 'fotos_album' | 'detalhes'>

const UA = 'Mozilla/5.0 (RL Photo.Video portal)'
const CDN = '//im-sl-cf.wfolio.photo/x/'

export function ehGaleriaWfolio(url: string | null | undefined): boolean {
  return !!url && /^https:\/\/[a-z0-9-]+\.wfolio\.(pro|com)\/disk\/[^/?#]+/i.test(url.trim())
}

function baseDaGaleria(url: string): string {
  const m = url.trim().match(/^(https:\/\/[a-z0-9-]+\.wfolio\.(?:pro|com)\/disk\/[^/?#]+)/i)
  return m ? m[1] : url
}

const ENT: Record<string, string> = { amp: '&', quot: '"', lt: '<', gt: '>', '#39': "'", nbsp: ' ' }
const decode = (s: string) => s.replace(/&(amp|quot|lt|gt|#39|nbsp);/g, (_, k) => ENT[k])

const semAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Em que campo do formulário da seleção cai cada pasta da galeria. */
export function campoDaPasta(nome: string): CampoSelecao {
  const n = semAcentos(nome)
  if (/sess|^noivos$/.test(n)) return 'sessao_noivos'
  if (/prepar/.test(n)) return 'preparacao'
  if (/noiva/.test(n)) return 'fotos_noiva'
  if (/noivo/.test(n)) return 'fotos_noivo'
  if (/cerim/.test(n)) return 'cerimonia'
  if (/convid/.test(n)) return 'convidados'
  if (/bolo|bouquet/.test(n)) return 'bolo_bouquet'
  if (/sala|anima|festa/.test(n)) return 'sala_animacao'
  if (/album/.test(n)) return 'fotos_album'
  return 'detalhes'
}

/** "SALA ANIMAÇÃO" → "Sala Animação" */
function nomeBonito(s: string): string {
  return s.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase())
}

async function texto(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: { 'User-Agent': UA },
    next: { revalidate: 600 },
    signal: AbortSignal.timeout(15000),
  })
  if (!r.ok) throw new Error(`wfolio ${r.status}`)
  return r.text()
}

function encurtar(u: string): string {
  return u.startsWith(CDN) ? u.slice(CDN.length) : u
}

function lerFotos(html: string): FotoWfolio[] {
  const fotos: FotoWfolio[] = []
  for (const bloco of html.split('class="piece"').slice(1)) {
    const n = bloco.match(/data-gallery-title="([^"]*)"/)?.[1]
    const g = bloco.match(/data-gallery-src="([^"]*)"/)?.[1]
    if (!n || !g) continue
    const w = Number(bloco.match(/data-gallery-width="(\d+)"/)?.[1] ?? 0)
    const h = Number(bloco.match(/data-gallery-height="(\d+)"/)?.[1] ?? 0)
    // miniatura: a versão de 600w do srcset da imagem da grelha
    const srcset = bloco.match(/data-srcset="([^"]*)"/)?.[1] ?? ''
    const t = srcset.split(',').map(p => p.trim().split(/\s+/)).find(([, w]) => w === '600w')?.[0] ?? g
    fotos.push({ n: decode(n).replace(/\.(jpe?g|png|webp)$/i, ''), t: encurtar(t), g: encurtar(g), r: w && h ? Math.round((w / h) * 1000) / 1000 : 1.5 })
  }
  return fotos
}

export async function lerGaleriaWfolio(url: string): Promise<{ titulo: string; pastas: PastaWfolio[] }> {
  const base = baseDaGaleria(url)
  const html = await texto(base)
  const titulo = decode(html.match(/<title>([^<]*)/)?.[1] ?? '').trim()

  // Pastas = links do menu da galeria (aparecem no menu de computador e no de telemóvel)
  const vistas = new Map<string, string>()
  for (const m of html.matchAll(/<a class="menu__link[^"]*"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const href = decode(m[1])
    if (!href.startsWith(base + '/')) continue
    const slug = href.slice(base.length + 1).split(/[/?#]/)[0]
    const nome = decode(m[2].replace(/<[^>]+>/g, '')).trim()
    if (slug && nome && !vistas.has(slug)) vistas.set(slug, nome)
  }
  // Galeria sem pastas: tudo fica numa só
  if (vistas.size === 0) vistas.set('photos', titulo || 'Fotografias')

  const pastas = await Promise.all([...vistas].map(async ([slug, nome]) => {
    const fotos = lerFotos(await texto(`${base}/pieces?design_variant=masonry&folder_path=${encodeURIComponent(slug)}`))
    return { nome: nomeBonito(nome), slug, campo: campoDaPasta(nome), fotos }
  }))
  return { titulo, pastas: pastas.filter(p => p.fotos.length > 0) }
}

export const WFOLIO_CDN = 'https:' + CDN
