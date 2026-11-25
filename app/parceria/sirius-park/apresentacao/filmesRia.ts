// Vídeos do editorial Zankyou × Quinta da Ria para a roda do slide do editorial.
// Vêm das entregas do editorial (janela do + em /portais-clientes): o que lá tiver link aparece aqui,
// com a capa do Vimeo. Mudar ou acrescentar um vídeo lá muda-o também na apresentação.
import { lerEditorial } from '@/lib/editorialAcesso'
import { montarEntregas } from '@/lib/editoriaisEntregas'

export type FilmeRia = { id: string; nome: string; grupo: string; src: string; capa?: string; vertical: boolean }

const SLUG = 'zankyou-quinta-da-ria'

// vimeo.com/<id>[/<hash>] → player.vimeo.com/video/<id>[?h=<hash>]
function player(link: string) {
  const m = link.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([0-9a-f]+))?/i)
  if (!m) return null
  return `https://player.vimeo.com/video/${m[1]}${m[2] ? `?h=${m[2]}` : ''}`
}

// Capa e formato real pelo oEmbed público do Vimeo (funciona com links privados com o código)
async function infoVimeo(link: string): Promise<{ capa?: string; vertical: boolean }> {
  try {
    const r = await fetch(`https://vimeo.com/api/oembed.json?width=1280&url=${encodeURIComponent(link.split('?')[0])}`, { next: { revalidate: 86400 } })
    if (!r.ok) return { vertical: false }
    const j = (await r.json()) as { thumbnail_url?: string; width?: number; height?: number }
    return { capa: j.thumbnail_url, vertical: !!j.width && !!j.height && j.height > j.width }
  } catch {
    return { vertical: false }
  }
}

export async function lerFilmesRia(): Promise<FilmeRia[]> {
  try {
    const ed = await lerEditorial(SLUG)
    const itens = montarEntregas(SLUG, ed.entregas).flatMap(g => g.itens.map(i => ({ ...i, grupo: g.parceiro })))
    const comLink = itens.filter(i => i.link && player(i.link))
    // Sem capa no oEmbed = o Vimeo não deixa mostrar (link privado sem o código, ou ainda a processar): fica de fora
    const todos = await Promise.all(comLink.map(async i => ({
      id: i.id,
      nome: i.nome,
      grupo: i.grupo,
      src: player(i.link!)!,
      ...(await infoVimeo(i.link!)),
    })))
    return todos.filter(f => f.capa)
  } catch {
    return []
  }
}
