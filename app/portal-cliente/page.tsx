'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Block = {
  id: string
  type: string
  has_children?: boolean
  children?: Block[]
  [key: string]: any
}

function richText(arr: any[]): React.ReactNode {
  if (!arr?.length) return null
  return arr.map((t: any, i: number) => {
    let node: React.ReactNode = t.plain_text
    if (t.annotations?.bold)          node = <strong key={i} className="font-semibold text-white">{node}</strong>
    if (t.annotations?.italic)        node = <em key={i} className="italic">{node}</em>
    if (t.annotations?.strikethrough) node = <s key={i}>{node}</s>
    if (t.annotations?.code)          node = <code key={i} className="bg-white/10 px-1 rounded text-xs font-mono">{node}</code>
    if (t.href)                        node = <a key={i} href={t.href} target="_blank" rel="noopener noreferrer" className="text-gold/80 hover:text-gold underline underline-offset-2">{node}</a>
    return <span key={i}>{node}</span>
  })
}

function plainText(arr: any[]): string {
  if (!arr?.length) return ''
  return arr.map((t: any) => t.plain_text).join('')
}

function NotionBlocks({ blocks }: { blocks: Block[] }) {
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < blocks.length) {
    const b = blocks[i]
    const { type } = b
    const data = b[type] ?? {}

    if (type === 'bulleted_list_item') {
      const group: Block[] = []
      while (i < blocks.length && blocks[i].type === 'bulleted_list_item') {
        group.push(blocks[i++])
      }
      elements.push(
        <ul key={`ul-${b.id}`} className="mb-3 space-y-1.5 pl-1">
          {group.map(item => (
            <li key={item.id} className="flex gap-2 items-start">
              <span className="text-gold/50 mt-1.5 shrink-0 text-xs">•</span>
              <div className="text-sm text-white/60 leading-relaxed">
                {richText(item.bulleted_list_item?.rich_text)}
                {item.children && <div className="mt-1 pl-3"><NotionBlocks blocks={item.children} /></div>}
              </div>
            </li>
          ))}
        </ul>
      )
      continue
    }

    if (type === 'numbered_list_item') {
      const group: Block[] = []
      while (i < blocks.length && blocks[i].type === 'numbered_list_item') {
        group.push(blocks[i++])
      }
      elements.push(
        <ol key={`ol-${b.id}`} className="mb-3 space-y-1.5 pl-1 list-decimal list-inside">
          {group.map(item => (
            <li key={item.id} className="text-sm text-white/60 leading-relaxed">
              {richText(item.numbered_list_item?.rich_text)}
              {item.children && <div className="mt-1 pl-4"><NotionBlocks blocks={item.children} /></div>}
            </li>
          ))}
        </ol>
      )
      continue
    }

    switch (type) {
      case 'heading_1':
        elements.push(
          <h1 key={b.id} className="text-xl sm:text-2xl font-bold text-white tracking-wide mt-8 mb-3">
            {richText(data.rich_text)}
          </h1>
        )
        break

      case 'heading_2':
        elements.push(
          <h2 key={b.id} className="text-lg font-semibold text-white/90 tracking-wide mt-6 mb-2 pb-1 border-b border-white/[0.06]">
            {richText(data.rich_text)}
          </h2>
        )
        break

      case 'heading_3':
        elements.push(
          <h3 key={b.id} className="text-base font-semibold text-white/75 tracking-wide mt-4 mb-1.5">
            {richText(data.rich_text)}
          </h3>
        )
        break

      case 'paragraph': {
        const text = plainText(data.rich_text)
        elements.push(
          text
            ? <p key={b.id} className="text-sm text-white/60 leading-relaxed mb-3">{richText(data.rich_text)}</p>
            : <div key={b.id} className="h-2" />
        )
        break
      }

      case 'to_do':
        elements.push(
          <div key={b.id} className="flex gap-2.5 items-start mb-2">
            <div className={`w-4 h-4 mt-0.5 rounded border shrink-0 flex items-center justify-center ${data.checked ? 'bg-gold/30 border-gold/50' : 'border-white/25'}`}>
              {data.checked && <span className="text-gold text-[9px] font-bold">✓</span>}
            </div>
            <span className={`text-sm leading-relaxed ${data.checked ? 'line-through text-white/25' : 'text-white/65'}`}>
              {richText(data.rich_text)}
            </span>
          </div>
        )
        break

      case 'callout': {
        const colorMap: Record<string, string> = {
          orange_background: 'bg-orange-500/10 border-orange-500/25',
          brown_background:  'bg-amber-900/15 border-amber-700/20',
          green_background:  'bg-green-500/10 border-green-500/25',
          blue_background:   'bg-blue-500/10 border-blue-500/25',
          yellow_background: 'bg-yellow-500/10 border-yellow-500/25',
          red_background:    'bg-red-500/10 border-red-500/25',
          gray_background:   'bg-white/5 border-white/10',
          default:           'bg-white/[0.04] border-white/10',
        }
        const cls = colorMap[data.color] ?? colorMap.default
        elements.push(
          <div key={b.id} className={`rounded-xl border px-4 py-3 mb-3 ${cls}`}>
            {plainText(data.rich_text) && (
              <p className="text-sm font-semibold text-white/85 mb-2">{richText(data.rich_text)}</p>
            )}
            {b.children && <NotionBlocks blocks={b.children} />}
          </div>
        )
        break
      }

      case 'quote':
        elements.push(
          <blockquote key={b.id} className="border-l-2 border-gold/40 pl-4 mb-3 italic text-sm text-white/50">
            {richText(data.rich_text)}
            {b.children && <NotionBlocks blocks={b.children} />}
          </blockquote>
        )
        break

      case 'code':
        elements.push(
          <pre key={b.id} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-3 overflow-x-auto">
            <code className="text-xs font-mono text-white/70">{plainText(data.rich_text)}</code>
          </pre>
        )
        break

      case 'divider':
        elements.push(<hr key={b.id} className="border-white/[0.08] my-5" />)
        break

      case 'image': {
        const url = data.type === 'external' ? data.external?.url : data.file?.url
        const caption = plainText(data.caption)
        if (url) elements.push(
          <figure key={b.id} className="my-5">
            <img src={url} alt={caption || ''} className="w-full object-cover rounded-xl max-h-80" />
            {caption && <figcaption className="text-xs text-white/30 text-center mt-2">{caption}</figcaption>}
          </figure>
        )
        break
      }

      case 'video': {
        const url = data.type === 'external' ? data.external?.url : data.file?.url
        if (url) elements.push(
          <div key={b.id} className="my-4">
            <video src={url} controls className="w-full rounded-xl" />
          </div>
        )
        break
      }

      case 'column_list':
        elements.push(
          <div key={b.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {b.children?.map((col: Block) => (
              <div key={col.id} className="min-w-0">
                {col.children && <NotionBlocks blocks={col.children} />}
              </div>
            ))}
          </div>
        )
        break

      case 'toggle':
        elements.push(
          <details key={b.id} className="mb-3 group">
            <summary className="cursor-pointer text-sm font-semibold text-white/80 hover:text-white transition-colors py-1 flex items-center gap-2">
              <span className="text-gold/50 text-xs group-open:rotate-90 transition-transform inline-block">▶</span>
              {richText(data.rich_text)}
            </summary>
            {b.children && (
              <div className="pl-5 pt-2">
                <NotionBlocks blocks={b.children} />
              </div>
            )}
          </details>
        )
        break

      case 'child_page':
        elements.push(
          <div key={b.id} className="flex items-center gap-2 mb-2 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg hover:border-gold/20 transition-colors">
            <span className="text-gold/40 text-sm">📄</span>
            <span className="text-sm text-white/60">{data.title}</span>
          </div>
        )
        break

      case 'table':
        elements.push(
          <div key={b.id} className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <tbody>
                {b.children?.map((row: Block, ri: number) => (
                  <tr key={row.id} className={ri === 0 ? 'border-b border-white/20' : 'border-b border-white/[0.05]'}>
                    {row.table_row?.cells?.map((cell: any[], ci: number) => (
                      ri === 0
                        ? <th key={ci} className="px-3 py-2 text-left text-[10px] tracking-widest text-white/40 uppercase font-semibold">{plainText(cell)}</th>
                        : <td key={ci} className="px-3 py-2 text-white/60">{richText(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        break

      default:
        break
    }

    i++
  }

  return <>{elements}</>
}

export default function PortalClientePage() {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/portais-clientes')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setBlocks(d.blocks ?? [])
        setLoading(false)
      })
      .catch(() => { setError('Erro ao carregar'); setLoading(false) })
  }, [])

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[860px] mx-auto">

      <Link href="/" className="inline-flex items-center gap-2 text-xs tracking-widest text-white/40 hover:text-gold transition-colors mb-8">
        ‹ VOLTAR AO MENU
      </Link>

      <header className="mb-8">
        <p className="text-xs tracking-[0.4em] text-white/30 uppercase mb-1">RL PHOTO.VIDEO</p>
        <h1 className="text-2xl sm:text-3xl font-light tracking-widest text-gold uppercase">Portal dos Noivos</h1>
        <div className="mt-3 h-px w-16 bg-gold/40" />
      </header>

      {loading && (
        <div className="text-center py-24 text-white/20 text-xs tracking-widest uppercase">A carregar...</div>
      )}
      {error && (
        <div className="text-center py-24 text-red-400/60 text-sm">{error}</div>
      )}

      {!loading && !error && (
        <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-5 sm:p-8">
          <NotionBlocks blocks={blocks} />
        </div>
      )}

    </main>
  )
}
