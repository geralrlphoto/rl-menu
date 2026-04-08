'use client'

import Link from 'next/link'

export type Block = {
  id: string
  type: string
  has_children?: boolean
  children?: Block[]
  [key: string]: any
}

export function richText(arr: any[], backUrl?: string): React.ReactNode {
  if (!arr?.length) return null
  return arr.map((t: any, i: number) => {
    let node: React.ReactNode = t.plain_text
    if (t.annotations?.bold)          node = <strong key={i} className="font-semibold text-white">{node}</strong>
    if (t.annotations?.italic)        node = <em key={i} className="italic">{node}</em>
    if (t.annotations?.strikethrough) node = <s key={i}>{node}</s>
    if (t.annotations?.code)          node = <code key={i} className="bg-white/10 px-1 rounded text-xs font-mono">{node}</code>
    if (t.href) {
      const href = (backUrl && t.href === '/portal-cliente') ? backUrl : t.href
      const isInternal = href.startsWith('/')
      node = isInternal
        ? <a key={i} href={href} className="text-gold/80 hover:text-gold underline underline-offset-2">{node}</a>
        : <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-gold/80 hover:text-gold underline underline-offset-2">{node}</a>
    }
    return <span key={i}>{node}</span>
  })
}

export function plainText(arr: any[]): string {
  if (!arr?.length) return ''
  return arr.map((t: any) => t.plain_text).join('')
}

export function NotionBlocks({ blocks, rootId, hiddenNav, backUrl }: { blocks: Block[], rootId?: string, hiddenNav?: string[], backUrl?: string }) {
  const rt = (arr: any[]) => richText(arr, backUrl)
  const NB = (props: { blocks: Block[], rootId?: string }) =>
    <NotionBlocks blocks={props.blocks} rootId={props.rootId ?? rootId} hiddenNav={hiddenNav} backUrl={backUrl} />
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
                {rt(item.bulleted_list_item?.rich_text)}
                {item.children && <div className="mt-1 pl-3"><NB blocks={item.children} /></div>}
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
              {rt(item.numbered_list_item?.rich_text)}
              {item.children && <div className="mt-1 pl-4"><NB blocks={item.children} /></div>}
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
            {rt(data.rich_text)}
          </h1>
        )
        break
      case 'heading_2':
        elements.push(
          <h2 key={b.id} className="text-lg font-semibold text-white/90 tracking-wide mt-6 mb-2 pb-1 border-b border-white/[0.06]">
            {rt(data.rich_text)}
          </h2>
        )
        break
      case 'heading_3':
        elements.push(
          <h3 key={b.id} className="text-base font-semibold text-white/75 tracking-wide mt-4 mb-1.5">
            {rt(data.rich_text)}
          </h3>
        )
        break
      case 'paragraph': {
        const text = plainText(data.rich_text)
        elements.push(
          text
            ? <p key={b.id} className="text-sm text-white/60 leading-relaxed mb-3">{rt(data.rich_text)}</p>
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
              {rt(data.rich_text)}
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
              <p className="text-sm font-semibold text-white/85 mb-2">{rt(data.rich_text)}</p>
            )}
            {b.children && <NB blocks={b.children} />}
          </div>
        )
        break
      }
      case 'quote':
        elements.push(
          <blockquote key={b.id} className="border-l-2 border-gold/40 pl-4 mb-3 italic text-sm text-white/50">
            {rt(data.rich_text)}
            {b.children && <NB blocks={b.children} />}
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
        const caption = plainText(data.caption ?? [])
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
                {col.children && <NB blocks={col.children} />}
              </div>
            ))}
          </div>
        )
        break
      case 'toggle':
        elements.push(
          <details key={b.id} className="mb-3 group">
            <summary className="cursor-pointer text-sm font-semibold text-white/80 hover:text-white transition-colors py-1 flex items-center gap-2 list-none">
              <span className="text-gold/50 text-xs group-open:rotate-90 transition-transform inline-block">▶</span>
              {rt(data.rich_text)}
            </summary>
            {b.children && (
              <div className="pl-5 pt-2">
                <NB blocks={b.children} />
              </div>
            )}
          </details>
        )
        break
      case 'child_page':
        if (hiddenNav?.includes(b.id)) break // skip hidden nav items
        elements.push(
          <Link key={b.id} href={`/portal-cliente/${b.id}?title=${encodeURIComponent(data.title ?? '')}`}
            className="flex items-center gap-3 mb-2 px-4 py-3 bg-white/[0.03] border border-white/[0.07] hover:border-gold/30 hover:bg-white/[0.06] rounded-xl transition-all group">
            <span className="text-white/30 text-base group-hover:text-gold/50 transition-colors">📄</span>
            <span className="text-sm text-white/70 group-hover:text-white transition-colors tracking-wide uppercase">{data.title}</span>
            <span className="ml-auto text-gold/30 group-hover:text-gold transition-colors text-sm">›</span>
          </Link>
        )
        break
      case 'table':
        elements.push(
          <div key={b.id} className="overflow-x-auto mb-4 rounded-xl border border-white/[0.07]">
            <table className="w-full text-sm border-collapse">
              <tbody>
                {b.children?.map((row: Block, ri: number) => (
                  <tr key={row.id} className={ri === 0 ? 'border-b border-white/20 bg-white/[0.03]' : 'border-b border-white/[0.04]'}>
                    {row.table_row?.cells?.map((cell: any[], ci: number) => (
                      ri === 0
                        ? <th key={ci} className="px-4 py-2.5 text-left text-[10px] tracking-widest text-white/40 uppercase font-semibold whitespace-nowrap">{plainText(cell)}</th>
                        : <td key={ci} className="px-4 py-2.5 text-white/60">{rt(cell)}</td>
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
