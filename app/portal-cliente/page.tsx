'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Block = {
  id: string
  type: string
  [key: string]: any
}

function richText(arr: any[]): string {
  if (!arr) return ''
  return arr.map((t: any) => t.plain_text).join('')
}

function NotionBlock({ block }: { block: Block }) {
  const { type } = block
  const data = block[type] ?? {}

  switch (type) {
    case 'heading_1':
      return <h1 className="text-2xl font-bold text-white tracking-wide mt-8 mb-3">{richText(data.rich_text)}</h1>
    case 'heading_2':
      return <h2 className="text-lg font-semibold text-white tracking-wide mt-6 mb-2">{richText(data.rich_text)}</h2>
    case 'heading_3':
      return <h3 className="text-base font-semibold text-white/80 tracking-wide mt-4 mb-1.5">{richText(data.rich_text)}</h3>
    case 'paragraph': {
      const text = richText(data.rich_text)
      if (!text) return <div className="h-3" />
      return <p className="text-sm text-white/60 leading-relaxed mb-3">{text}</p>
    }
    case 'bulleted_list_item':
      return (
        <div className="flex gap-2 mb-1.5">
          <span className="text-gold/50 mt-1 shrink-0">·</span>
          <span className="text-sm text-white/60 leading-relaxed">{richText(data.rich_text)}</span>
        </div>
      )
    case 'numbered_list_item':
      return (
        <div className="flex gap-2 mb-1.5">
          <span className="text-gold/50 mt-1 shrink-0 text-xs">—</span>
          <span className="text-sm text-white/60 leading-relaxed">{richText(data.rich_text)}</span>
        </div>
      )
    case 'to_do':
      return (
        <div className="flex gap-2.5 items-start mb-2">
          <div className={`w-4 h-4 mt-0.5 rounded border shrink-0 flex items-center justify-center ${data.checked ? 'bg-gold/30 border-gold/50' : 'border-white/20'}`}>
            {data.checked && <span className="text-gold text-[10px]">✓</span>}
          </div>
          <span className={`text-sm leading-relaxed ${data.checked ? 'line-through text-white/25' : 'text-white/60'}`}>
            {richText(data.rich_text)}
          </span>
        </div>
      )
    case 'callout': {
      const colorMap: Record<string, string> = {
        orange_background: 'bg-orange-500/10 border-orange-500/25',
        brown_background:  'bg-amber-900/20 border-amber-700/25',
        green_background:  'bg-green-500/10 border-green-500/25',
        blue_background:   'bg-blue-500/10 border-blue-500/25',
        default:           'bg-white/[0.04] border-white/10',
      }
      const cls = colorMap[data.color] ?? colorMap.default
      return (
        <div className={`rounded-xl border px-4 py-3 mb-3 ${cls}`}>
          <p className="text-sm font-semibold text-white/80 mb-1">{richText(data.rich_text)}</p>
        </div>
      )
    }
    case 'divider':
      return <hr className="border-white/[0.08] my-5" />
    case 'image': {
      const url = data.type === 'external' ? data.external?.url : data.file?.url
      if (!url) return null
      return (
        <div className="my-4 rounded-xl overflow-hidden">
          <img src={url} alt="" className="w-full object-cover max-h-64 rounded-xl" />
        </div>
      )
    }
    case 'column_list':
    case 'column':
      return null // handled separately
    default:
      return null
  }
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

  // Group consecutive list items
  const renderBlocks = (blocks: Block[]) => {
    const elements: React.ReactNode[] = []
    let i = 0
    while (i < blocks.length) {
      const b = blocks[i]
      if (b.type === 'bulleted_list_item' || b.type === 'numbered_list_item') {
        const group = []
        while (i < blocks.length && blocks[i].type === b.type) {
          group.push(<NotionBlock key={blocks[i].id} block={blocks[i]} />)
          i++
        }
        elements.push(<div key={`list-${i}`} className="mb-2">{group}</div>)
      } else if (b.type === 'column_list') {
        // skip column_list blocks (rendered inline in Notion, skip for simplicity)
        i++
      } else {
        elements.push(<NotionBlock key={b.id} block={b} />)
        i++
      }
    }
    return elements
  }

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
          {renderBlocks(blocks)}
        </div>
      )}

    </main>
  )
}
