// Vídeos do editorial Zankyou × Quinta da Ria para a roda do slide do editorial.
// Vêm das entregas do editorial (janela do + em /portais-clientes): o que lá tiver link aparece aqui,
// com a capa do Vimeo. Mudar ou acrescentar um vídeo lá muda-o também na apresentação.
import { lerEditorial } from '@/lib/editorialAcesso'
import { montarEntregas } from '@/lib/editoriaisEntregas'
import { capaVimeo } from '@/lib/vimeoCapa'

export type FilmeRia = { id: string; nome: string; grupo: string; src: string; capa?: string; vertical: boolean }

const SLUG = 'zankyou-quinta-da-ria'

// vimeo.com/<id>[/<hash>] → player.vimeo.com/video/<id>[?h=<hash>]
function player(link: string) {
  const m = link.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([0-9a-f]+))?/i)
  if (!m) return null
  return `https://player.vimeo.com/video/${m[1]}${m[2] ? `?h=${m[2]}` : ''}`
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
      capa: await capaVimeo(i.link),
      vertical: /9\s*:\s*16/.test(i.formato ?? ''),
    })))
    return todos.filter(f => f.capa)
  } catch {
    return []
  }
}
