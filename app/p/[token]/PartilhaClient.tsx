'use client'

import { useEffect, useState } from 'react'
import { NotionBlocks, plainText, type Block } from '../../portal-cliente/NotionRenderer'
import '../../portal-cliente/atmosphere/atmosphere.css'
import {
  FilmeHero, FilmeTitulo, FilmePlayer, FilmeTrio,
} from '../../portal-cliente/[id]/page'

/**
 * Página partilhada. Ao contrário do portal, isto só sabe carregar UMA
 * página: o id vem assinado no token e nunca há navegação, links ou
 * pedidos que revelem outras páginas do portal.
 */
export default function PartilhaClient({ id, videos, casal }: {
  id: string; videos: Record<string, string>
  casal: { cliente: string; data_evento: string | null; local: string } | null
}) {
  const [blocks, setBlocks] = useState<Block[] | null>(null)
  const [erro, setErro] = useState(false)

  // Único pedido do cliente: os blocos DESTA página. O casal e os vídeos já
  // vêm resolvidos do servidor, para nada mais do portal viajar até aqui.
  useEffect(() => {
    let vivo = true
    fetch(`/api/portais-clientes?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => { if (vivo) setBlocks(Array.isArray(d.blocks) ? d.blocks : []) })
      .catch(() => { if (vivo) setErro(true) })
    return () => { vivo = false }
  }, [id])

  if (erro) return <Moldura><p className="pmsg">Não foi possível carregar esta página.</p></Moldura>
  if (!blocks) return <Moldura><p className="pmsg">A carregar…</p></Moldura>

  // ── mesma leitura de blocos do portal, mas sem nada em redor ──────────────
  const temCards = (b: Block) => b.type === 'column_list'
    ? (b.children ?? []).some((col: Block) =>
        (col.children ?? []).some((c: Block) =>
          c.type === 'callout' && (c.children ?? []).some((ch: Block) => ch.type === 'image')))
    : b.type === 'callout' && (b.children ?? []).some((c: Block) => c.type === 'image')

  const cartoes = (b: Block): Block[] => b.type === 'column_list'
    ? (b.children ?? []).flatMap((col: Block) =>
        (col.children ?? []).filter((c: Block) =>
          c.type === 'callout' && (c.children ?? []).some((ch: Block) => ch.type === 'image')))
    : temCards(b) ? [b] : []

  const imgDo = (b: Block) => {
    const f = (b.children ?? []).find((c: Block) => c.type === 'image')
    if (!f) return null
    return f.image?.type === 'external' ? f.image.external?.url : f.image?.file?.url
  }

  const idxCards = blocks.findIndex(temCards)

  const todos = (idxCards === -1 ? [] : cartoes(blocks[idxCards])).map(c => {
    const t = plainText(c.callout?.rich_text ?? []).trim()
    return { callout: c, titulo: t, T: t.toUpperCase() }
  })
  const urlDo = (T: string) =>
    T.includes('WEDDING FILM') ? videos.wedding_film_url :
    T.includes('PRÉ-WEDDING') || T.includes('PRE-WEDDING') ? videos.video_prewedding_url :
    T.includes('SAME DAY') ? videos.same_day_edit_url :
    T.includes('TEASER') || T.includes('TRAILER') ? videos.teaser_url : undefined

  const principal = todos.find(c => c.T.includes('WEDDING FILM'))
  const ordem = ['TEASER', 'PRÉ-WEDDING', 'SAME DAY']
  const secundarios = todos.filter(c => c !== principal).sort((a, b) => {
    const pos = (x: typeof a) => {
      const i = ordem.findIndex(o => x.T.includes(o) || (o === 'TEASER' && x.T.includes('TRAILER')))
      return i === -1 ? 99 : i
    }
    return pos(a) - pos(b)
  })

  // Depois dos cards: testemunhos e restante texto, sem imagens de fundo.
  const depois = idxCards === -1 ? [] : blocks.slice(idxCards + 1).filter(b => b.type !== 'image')

  return (
    <Moldura>
      {/* Sem titulo nem dropdown: o texto introdutorio fala do portal, dos
          avisos por WhatsApp e do acesso a plataforma, que nada dizem a
          quem so recebeu o link. A pagina abre directamente no hero. */}
      <FilmeHero settings={null} evento={casal} />
      <FilmeTitulo />
      {principal && (
        <FilmePlayer
          titulo={principal.titulo}
          legenda="Filme completo"
          imgUrl={imgDo(principal.callout)}
          url={urlDo(principal.T) || undefined}
        />
      )}
      {secundarios.length > 0 && (
        <FilmeTrio itens={secundarios.map(c => ({ titulo: c.titulo, url: urlDo(c.T) || undefined }))} />
      )}
      {/* Sem os tres passos: descarregar, partilhar e deixar testemunho sao
          accoes dos noivos. Quem recebe o link so vem ver o filme, e o
          "Copiar link" nem sequer teria token para emitir. */}
      {depois.length > 0 && <NotionBlocks blocks={depois} />}
    </Moldura>
  )
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="portal-atmosphere">
      <style dangerouslySetInnerHTML={{ __html: `
        .ppag{ max-width:860px; margin:0 auto; padding:clamp(24px,5vh,56px) clamp(16px,4vw,32px) 80px; }
        .pmsg{ text-align:center; color:rgba(243,237,226,.5); font-family:'Hanken Grotesk',sans-serif;
          padding:22vh 0; }
        .prodape{ margin-top:64px; text-align:center; font-family:'Space Mono',monospace;
          font-size:10px; letter-spacing:.3em; text-transform:uppercase; color:rgba(243,237,226,.28); }
      ` }} />
      <div className="grain" />
      <main className="ppag">
        {children}
        <p className="prodape">RL Photo · Video</p>
      </main>
    </div>
  )
}
