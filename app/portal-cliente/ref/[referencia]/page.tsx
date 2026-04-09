'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { NotionBlocks, plainText, type Block } from '../../NotionRenderer'

const NOTION_PAGE_ID = '311220116d8a80d29468e817ae7bb79f'

// ─── Countdown ────────────────────────────────────────────────────────────────

function Countdown({ targetDate }: { targetDate: string }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    function tick() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) return setT({ d: 0, h: 0, m: 0, s: 0 })
      setT({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [targetDate])
  const U = ({ v, l }: { v: number; l: string }) => (
    <div className="flex flex-col items-center">
      <span className="font-playfair text-4xl sm:text-5xl font-bold text-white tabular-nums">{String(v).padStart(2,'0')}</span>
      <span className="text-[10px] tracking-[0.25em] text-white/40 uppercase mt-1">{l}</span>
    </div>
  )
  const Sep = () => <span className="font-playfair text-3xl text-[#C9A84C]/40 self-start mt-2">|</span>
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8">
      <U v={t.d} l="Dias" /><Sep /><U v={t.h} l="Horas" /><Sep /><U v={t.m} l="Min" /><Sep /><U v={t.s} l="Seg" />
    </div>
  )
}

function Leaf({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 80 30" className={`w-16 sm:w-20 h-auto text-[#C9A84C]/50 ${flip ? 'scale-x-[-1]' : ''}`} fill="currentColor">
      <path d="M5 15 Q20 5 40 15 Q20 25 5 15Z" opacity="0.6"/>
      <path d="M30 15 Q50 3 75 15 Q50 27 30 15Z" opacity="0.4"/>
      <line x1="5" y1="15" x2="75" y2="15" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
    </svg>
  )
}

function findAllChildPages(blocks: Block[]): Array<{ id: string; title: string }> {
  const out: Array<{ id: string; title: string }> = []
  for (const b of blocks) {
    if (b.type === 'child_page') out.push({ id: b.id, title: b.child_page?.title ?? '' })
    if (b.children) out.push(...findAllChildPages(b.children))
  }
  return out
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function PortalRefContent() {
  const { referencia } = useParams<{ referencia: string }>()
  const ref = decodeURIComponent(referencia)

  const [portal, setPortal] = useState<any>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/portais?ref=${encodeURIComponent(ref)}`).then(r => r.json()),
      fetch(`/api/notion-block?id=${NOTION_PAGE_ID}`).then(r => r.json()).catch(() => ({ blocks: [] })),
    ]).then(([pd, bd]) => {
      if (!pd.portal) { setNotFound(true); setLoading(false); return }
      setPortal(pd.portal)
      setForm(pd.portal)
      setBlocks(bd.blocks ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [ref])

  async function handleSave() {
    setSaving(true)
    const settings = {
      ...(portal.settings ?? {}),
      noiva: form.noiva ?? '',
      noivo: form.noivo ?? '',
      data: form.data ?? '',
      dataFormatada: form.data_formatada ?? '',
      local: form.local ?? '',
      heroImageUrl: form.settings?.heroImageUrl ?? portal.settings?.heroImageUrl ?? '',
    }
    await fetch('/api/portais', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referencia: ref,
        updates: {
          noiva: form.noiva,
          noivo: form.noivo,
          data: form.data,
          local: form.local,
          settings,
        },
      }),
    })
    setPortal((p: any) => ({ ...p, ...form, settings }))
    setSaving(false)
    setEditing(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <span className="text-white/30 text-xs tracking-widest animate-pulse">A carregar...</span>
    </div>
  )
  if (notFound) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
      <p className="text-white/40 text-sm">Portal <span className="text-[#C9A84C]/70 font-mono">{ref}</span> não encontrado.</p>
      <Link href="/portais-clientes" className="text-[10px] text-white/25 hover:text-white/50 tracking-widest uppercase">‹ Voltar</Link>
    </div>
  )

  const s = portal.settings ?? {}
  const heroImage = s.heroImageUrl || null
  const navPages = findAllChildPages(blocks).filter((p: any) => !(s.hiddenNav ?? []).includes(p.id))
  const tasks: Array<{ id: string; text: string; done: boolean }> = s.tasks ?? []

  // Edit mode
  if (editing) return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 py-10 max-w-2xl mx-auto">
      <button onClick={() => setEditing(false)} className="text-xs text-white/30 hover:text-white/60 mb-8 flex items-center gap-1">‹ voltar ao portal</button>
      <h2 className="font-playfair text-2xl text-white mb-8">Configurar Portal</h2>
      <div className="space-y-5">
        {[
          { label: 'Nome da Noiva', field: 'noiva' },
          { label: 'Nome do Noivo', field: 'noivo' },
          { label: 'Local', field: 'local' },
        ].map(({ label, field }) => (
          <div key={field}>
            <p className="text-[10px] text-white/40 tracking-widest uppercase mb-1.5">{label}</p>
            <input type="text" value={form[field] ?? ''} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))}
              className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#C9A84C]/40" />
          </div>
        ))}
        <div>
          <p className="text-[10px] text-white/40 tracking-widest uppercase mb-1.5">Data do Casamento</p>
          <input type="date" value={form.data ?? ''} onChange={e => setForm((f: any) => ({ ...f, data: e.target.value }))}
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#C9A84C]/40" />
        </div>
        <div>
          <p className="text-[10px] text-white/40 tracking-widest uppercase mb-1.5">URL da Foto de Capa</p>
          <input type="url" value={form.settings?.heroImageUrl ?? ''} onChange={e => setForm((f: any) => ({ ...f, settings: { ...(f.settings ?? {}), heroImageUrl: e.target.value } }))}
            className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-[#C9A84C]/40" />
        </div>
      </div>
      <div className="flex gap-3 mt-8">
        <button onClick={() => setEditing(false)} className="px-5 py-2.5 rounded-xl border border-white/15 text-white/40 text-sm hover:text-white/60 transition-all">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-xl bg-[#C9A84C] text-black font-bold text-sm hover:bg-[#C9A84C]/80 transition-all disabled:opacity-50">
          {saving ? 'A guardar...' : '✓ Guardar'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* Admin bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-white/5">
        <Link href="/portais-clientes" className="text-[10px] tracking-widest text-white/25 hover:text-white/50 transition-colors uppercase">‹ Portais</Link>
        <div className="flex gap-2">
          <button onClick={() => { setForm(portal); setEditing(true) }} className="text-[10px] px-2.5 py-1 border border-[#C9A84C]/20 rounded text-[#C9A84C]/50 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all uppercase tracking-wider">
            ✎ Configurar
          </button>
        </div>
      </div>

      {/* Hero */}
      <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-end justify-center pb-12 overflow-hidden">
        {heroImage ? (
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroImage})` }}>
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1408] to-[#0a0a0a]" />
        )}
        <div className="relative z-10 text-center px-4">
          <p className="text-[10px] tracking-[0.4em] text-white/30 uppercase mb-6">RL PHOTO.VIDEO</p>
          <h1 className="font-playfair font-black text-5xl sm:text-7xl lg:text-8xl text-white tracking-tight leading-none">
            {s.noiva || 'NOIVA'}
            <span className="text-[#C9A84C] font-cormorant italic font-normal mx-4">&</span>
            {s.noivo || 'NOIVO'}
          </h1>
          <div className="flex flex-col items-center gap-1 mt-4">
            {s.local && <p className="font-cormorant text-white/60 text-base sm:text-lg italic tracking-wide">{s.local}</p>}
            <p className="font-cormorant text-white/50 text-sm sm:text-base italic tracking-wide">♡ {s.dataFormatada || '—'}</p>
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 opacity-40">
            <div className="h-px w-12 bg-[#C9A84C]" /><span className="text-[#C9A84C] text-xs">✦</span><div className="h-px w-12 bg-[#C9A84C]" />
          </div>
        </div>
      </section>

      {/* Countdown */}
      {s.data && (
        <section className="py-10 sm:py-14 border-y border-white/[0.05] bg-[#0d0d0d]">
          <p className="font-playfair font-black text-[#C9A84C] text-xl sm:text-2xl text-center mb-6 tracking-tight">Contagem Regressiva</p>
          <div className="flex items-center justify-center gap-4">
            <Leaf /><Countdown targetDate={s.data} /><Leaf flip />
          </div>
          <div className="flex justify-center mt-4"><span className="text-[#C9A84C]/20 text-lg">♡</span></div>
        </section>
      )}

      {/* Reference badge */}
      {ref && (
        <div className="flex justify-center px-4 pb-6 pt-4">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border border-[#C9A84C]/40 bg-[#C9A84C]/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] animate-pulse shrink-0" />
            <span className="font-playfair text-[#C9A84C] text-base sm:text-lg tracking-wide">{ref}</span>
          </div>
        </div>
      )}

      {/* Quick access nav */}
      {navPages.length > 0 && (
        <section className="py-6 sm:py-10 px-4">
          <p className="font-playfair font-black text-white/50 text-lg sm:text-xl text-center mb-8 tracking-tight">Acesso Rápido</p>
          <div className="flex gap-3 overflow-x-auto pb-2 justify-start sm:justify-center snap-x snap-mandatory">
            {navPages.map(page => (
              <Link key={page.id} href={`/portal-cliente/${page.id}?title=${encodeURIComponent(page.title)}&from=${NOTION_PAGE_ID}&fromTitle=Portal`}
                className="snap-start shrink-0 flex flex-col items-center gap-2 px-4 py-4 rounded-2xl border bg-black border-white/40 text-white/60 hover:border-white/70 transition-all duration-300 min-w-[80px] group"
                style={{ boxShadow: '0 0 18px 4px rgba(255,255,255,0.18), 0 0 6px 1px rgba(255,255,255,0.25), inset 0 0 20px 0 rgba(255,255,255,0.06)' }}
              >
                <span className="text-[9px] tracking-widest uppercase text-center leading-tight max-w-[70px] text-white/80 group-hover:text-white transition-colors"
                  style={{ textShadow: '0 0 8px rgba(255,255,255,0.9), 0 0 16px rgba(255,255,255,0.5)' }}>
                  {page.title}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <section className="px-4 pb-10 sm:pb-14">
          <div className="max-w-2xl mx-auto rounded-2xl overflow-hidden border border-[#C9A84C]/40 bg-black"
            style={{ boxShadow: '0 0 18px 2px rgba(212,175,55,0.18), inset 0 0 30px 0 rgba(212,175,55,0.04)' }}>
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-[#C9A84C]/20">
              <span className="w-2 h-2 rounded-full bg-[#C9A84C] animate-pulse" />
              <h2 className="font-playfair font-black text-xl text-[#C9A84C]"
                style={{ textShadow: '0 0 12px rgba(212,175,55,0.8), 0 0 24px rgba(212,175,55,0.4)' }}>Gestão de Tarefas</h2>
            </div>
            <div className="p-5 space-y-2.5">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3">
                  <span className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${task.done ? 'border-[#C9A84C] bg-[#C9A84C]/25' : 'border-[#C9A84C]/40'}`}>
                    {task.done && <span className="text-[#C9A84C] text-[10px] font-bold">✓</span>}
                  </span>
                  <span className={`flex-1 text-sm ${task.done ? 'line-through text-[#C9A84C]/30' : 'text-white/80'}`}>{task.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Notion content */}
      {blocks.length > 0 && (
        <div className="px-3 sm:px-6 pb-16 max-w-[860px] mx-auto">
          <NotionBlocks blocks={blocks} hiddenNav={s.hiddenNav ?? []} />
        </div>
      )}

      <div className="flex justify-center pb-16 pt-4"><span className="text-white/10 text-2xl">♡</span></div>
    </div>
  )
}

export default function PortalRefPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <span className="text-white/30 text-xs tracking-widest animate-pulse">A carregar...</span>
      </div>
    }>
      <PortalRefContent />
    </Suspense>
  )
}
