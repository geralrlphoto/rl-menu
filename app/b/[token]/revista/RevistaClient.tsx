'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { mergeBatizado, BatizadoContent } from '../BatizadoPageClient'

type Pagina = { id: string; imageUrl: string; titulo: string; legenda: string }

function uid() { return Math.random().toString(36).slice(2, 9) }

// ─── Transition wrapper ───────────────────────────────────────────────────────
function PageSlide({ page, active }: { page: Pagina; active: boolean }) {
  return (
    <div
      className="absolute inset-0 transition-opacity duration-700"
      style={{ opacity: active ? 1 : 0, pointerEvents: active ? 'auto' : 'none' }}
    >
      {page.imageUrl ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${page.imageUrl})` }}
        >
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.82) 100%)'
          }} />
        </div>
      ) : (
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #110f09 0%, #0a0a0a 50%, #110f09 100%)'
        }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-cormorant text-gold/5" style={{ fontSize: '20vw' }}>◇</span>
          </div>
        </div>
      )}

      {/* Text overlay */}
      {(page.titulo || page.legenda) && (
        <div className="absolute bottom-0 left-0 right-0 px-8 sm:px-16 pb-24 pt-16 flex flex-col gap-3"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }}>
          {page.titulo && (
            <h2 className="font-cormorant text-3xl sm:text-5xl font-light text-white leading-tight"
              style={{ textShadow: '0 2px 24px rgba(0,0,0,0.9)' }}>
              {page.titulo}
            </h2>
          )}
          {page.legenda && (
            <p className="text-sm text-white/55 font-light max-w-lg leading-relaxed"
              style={{ textShadow: '0 1px 8px rgba(0,0,0,0.9)' }}>
              {page.legenda}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RevistaClient({ token, isAdmin }: { token: string; isAdmin: boolean }) {
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<BatizadoContent | null>(null)
  const [paginas, setPaginas] = useState<Pagina[]>([])
  const [current, setCurrent] = useState(0)
  const [editorOpen, setEditorOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  // ── Load ──
  useEffect(() => {
    fetch(`/api/batizado/view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        const saved = data.maquete?.settings?.content
        const merged = mergeBatizado(saved)
        setContent(merged)
        setPaginas(merged.revista?.paginas || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  // ── Keyboard navigation ──
  useEffect(() => {
    if (editorOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next()
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [paginas.length, editorOpen, current])

  const prev = () => setCurrent(c => Math.max(c - 1, 0))
  const next = () => setCurrent(c => Math.min(c + 1, paginas.length - 1))

  // ── Save ──
  const doSave = async (newPaginas: Pagina[]) => {
    if (!content) return
    setSaving(true)
    const newContent: BatizadoContent = {
      ...content,
      revista: { ...content.revista, paginas: newPaginas },
    }
    setContent(newContent)
    try {
      const res = await fetch('/api/batizado/save-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, content: newContent }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
    } catch {}
    setSaving(false)
  }

  // ── Upload ──
  const handleUpload = async (file: File, idx: number) => {
    setUploadingIdx(idx)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        const newPaginas = paginas.map((p, i) => i === idx ? { ...p, imageUrl: data.url } : p)
        setPaginas(newPaginas)
        await doSave(newPaginas)
      }
    } catch {}
    setUploadingIdx(null)
  }

  // ── Page operations ──
  const addPage = () => {
    const newPaginas = [...paginas, { id: uid(), imageUrl: '', titulo: '', legenda: '' }]
    setPaginas(newPaginas)
    setCurrent(newPaginas.length - 1)
  }

  const deletePage = (idx: number) => {
    if (!confirm('Apagar esta página?')) return
    const newPaginas = paginas.filter((_, i) => i !== idx)
    setPaginas(newPaginas)
    setCurrent(Math.min(current, Math.max(0, newPaginas.length - 1)))
  }

  const movePage = (idx: number, dir: -1 | 1) => {
    const t = idx + dir
    if (t < 0 || t >= paginas.length) return
    const np = [...paginas];
    [np[idx], np[t]] = [np[t], np[idx]]
    setPaginas(np)
    setCurrent(t)
  }

  const updatePage = (idx: number, key: keyof Pagina, value: string) =>
    setPaginas(prev => prev.map((p, i) => i === idx ? { ...p, [key]: value } : p))

  // ── Loading / empty ──
  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <p className="text-white/20 tracking-[0.3em] text-xs uppercase animate-pulse">A carregar...</p>
    </div>
  )

  if (paginas.length === 0 && !isAdmin) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6">
      <span className="font-cormorant text-gold/15 text-7xl">◇</span>
      <p className="text-white/20 tracking-[0.3em] text-xs uppercase">Revista em breve</p>
      <Link href={`/b/${token}`}
        className="text-[11px] tracking-widest text-gold/40 hover:text-gold transition-colors uppercase">
        ← Voltar
      </Link>
    </div>
  )

  const total = paginas.length

  return (
    <div className="fixed inset-0 bg-[#0a0a0a] overflow-hidden select-none">

      {/* ── PAGES ── */}
      <div className="absolute inset-0">
        {paginas.map((p, i) => (
          <PageSlide key={p.id} page={p} active={i === current} />
        ))}
        {paginas.length === 0 && isAdmin && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <span className="font-cormorant text-gold/10 text-8xl">◇</span>
            <p className="text-white/20 tracking-[0.3em] text-xs uppercase">Sem páginas — adiciona a primeira</p>
            <button onClick={() => setEditorOpen(true)}
              className="mt-2 px-6 py-2.5 rounded-xl text-xs tracking-widest uppercase transition-all"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.35)', color: '#C9A84C' }}>
              ✎ Gerir páginas
            </button>
          </div>
        )}
      </div>

      {/* ── CLICK ZONES (prev / next) ── */}
      {total > 1 && !editorOpen && (
        <div className="absolute inset-0 flex z-10">
          <div className="flex-1 cursor-pointer" onClick={prev} />
          <div className="flex-1 cursor-pointer" onClick={next} />
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 pointer-events-none">
        <Link href={`/b/${token}`}
          className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all text-[11px] tracking-widest uppercase text-white/50 hover:text-white"
          style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
          ← Voltar
        </Link>

        <div className="pointer-events-auto flex items-center gap-2">
          {/* Page counter */}
          {total > 0 && (
            <span className="text-[10px] tracking-[0.3em] text-white/30 font-mono px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {current + 1} / {total}
            </span>
          )}
          {isAdmin && (
            <button onClick={() => setEditorOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-sm text-[11px] tracking-widest uppercase transition-all"
              style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(201,168,76,0.35)', color: '#C9A84C' }}>
              ✎ Páginas
            </button>
          )}
        </div>
      </div>

      {/* ── ARROWS ── */}
      {total > 1 && (
        <>
          <button onClick={prev} disabled={current === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm transition-all hover:scale-110 disabled:opacity-0"
            style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)' }}>
            ‹
          </button>
          <button onClick={next} disabled={current === total - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center text-2xl backdrop-blur-sm transition-all hover:scale-110 disabled:opacity-0"
            style={{ background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)' }}>
            ›
          </button>
        </>
      )}

      {/* ── DOT NAVIGATION ── */}
      {total > 1 && (
        <div className="absolute bottom-5 left-0 right-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
          {paginas.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className="pointer-events-auto rounded-full transition-all duration-300"
              style={{
                width: i === current ? '22px' : '6px', height: '6px',
                background: i === current ? 'rgba(201,168,76,0.9)' : 'rgba(255,255,255,0.25)',
              }} />
          ))}
        </div>
      )}

      {/* ── EDITOR PANEL ── */}
      {isAdmin && (
        <>
          {editorOpen && (
            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setEditorOpen(false)} />
          )}
          <div
            className={`fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${editorOpen ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ width: '320px', background: '#0d0d0d', borderLeft: '1px solid rgba(255,255,255,0.07)' }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0"
              style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-xs tracking-widest text-white/60 uppercase">Páginas da Revista</p>
                <p className="text-[10px] text-white/20 mt-0.5">{paginas.length} página{paginas.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => doSave(paginas)}
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider transition-all disabled:opacity-40"
                  style={saved
                    ? { background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }
                    : { background: 'rgba(201,168,76,0.15)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}>
                  {saving ? '...' : saved ? '✓ Guardado' : 'Guardar'}
                </button>
                <button onClick={() => setEditorOpen(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all text-sm">
                  ✕
                </button>
              </div>
            </div>

            {/* Page list */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5">
              {paginas.map((p, i) => {
                const isActive = i === current
                return (
                  <div key={p.id} className="rounded-xl overflow-hidden flex flex-col"
                    style={{ border: isActive ? '1px solid rgba(201,168,76,0.45)' : '1px solid rgba(255,255,255,0.07)' }}>

                    {/* Row: thumbnail + title + actions */}
                    <div
                      className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-all hover:bg-white/3"
                      style={{ background: isActive ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.02)' }}
                      onClick={() => { setCurrent(i); setEditorOpen(false) }}
                    >
                      {/* Thumb */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
                        style={{ background: p.imageUrl ? undefined : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {p.imageUrl
                          ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                          : <span className="text-white/15 text-lg">◻</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-white/60 truncate">{p.titulo || `Página ${i + 1}`}</p>
                        <p className="text-[9px] text-white/25 truncate">{p.legenda || '—'}</p>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <button onClick={() => movePage(i, -1)} disabled={i === 0}
                          className="w-6 h-6 flex items-center justify-center text-white/20 hover:text-white/60 disabled:opacity-0 text-xs transition-colors">↑</button>
                        <button onClick={() => movePage(i, 1)} disabled={i === paginas.length - 1}
                          className="w-6 h-6 flex items-center justify-center text-white/20 hover:text-white/60 disabled:opacity-0 text-xs transition-colors">↓</button>
                        <button onClick={() => deletePage(i)}
                          className="w-6 h-6 flex items-center justify-center text-white/20 hover:text-red-400 text-xs transition-colors">✕</button>
                      </div>
                    </div>

                    {/* Edit fields — expanded when this page is active */}
                    {isActive && (
                      <div className="px-3 pb-3 pt-2.5 flex flex-col gap-2.5 border-t"
                        style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>

                        {/* Photo */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] tracking-[0.25em] text-white/25 uppercase">Fotografia</label>
                          <label className="flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-white/10 hover:border-gold/40 text-white/25 hover:text-gold/60 cursor-pointer transition-all text-[10px]">
                            <input type="file" accept="image/*" className="hidden"
                              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, i) }} />
                            {uploadingIdx === i ? '⟳ A carregar...' : '⬆ Carregar foto'}
                          </label>
                          <input type="text" value={p.imageUrl} placeholder="ou colar URL..."
                            onChange={e => updatePage(i, 'imageUrl', e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-gold/30 placeholder:text-white/15" />
                          {p.imageUrl && (
                            <div className="rounded-lg overflow-hidden border border-white/8"
                              style={{ height: '80px' }}>
                              <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>

                        {/* Título */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] tracking-[0.25em] text-white/25 uppercase">Título</label>
                          <input type="text" value={p.titulo} placeholder="Título da página..."
                            onChange={e => updatePage(i, 'titulo', e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-gold/30 placeholder:text-white/15" />
                        </div>

                        {/* Legenda */}
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] tracking-[0.25em] text-white/25 uppercase">Legenda</label>
                          <textarea rows={2} value={p.legenda} placeholder="Legenda ou texto..."
                            onChange={e => updatePage(i, 'legenda', e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/8 rounded-lg px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-gold/30 placeholder:text-white/15 resize-none" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add page button */}
              <button onClick={addPage}
                className="w-full py-3 rounded-xl border border-dashed text-xs tracking-widest uppercase transition-all hover:scale-[1.01]"
                style={{ borderColor: 'rgba(201,168,76,0.25)', color: 'rgba(201,168,76,0.5)' }}
                onMouseEnter={e => { (e.currentTarget).style.borderColor = 'rgba(201,168,76,0.6)'; (e.currentTarget).style.color = '#C9A84C' }}
                onMouseLeave={e => { (e.currentTarget).style.borderColor = 'rgba(201,168,76,0.25)'; (e.currentTarget).style.color = 'rgba(201,168,76,0.5)' }}>
                + Adicionar página
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
