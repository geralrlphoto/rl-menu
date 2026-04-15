'use client'

import { useEffect, useRef, useState } from 'react'
import { DEFAULT_CONTENT, PageContent } from '../LeadPageClient'

const IMG_BASE = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images'

function merge(saved: any): PageContent {
  if (!saved) return DEFAULT_CONTENT
  return {
    hero:         { ...DEFAULT_CONTENT.hero,         ...(saved.hero         || {}) },
    countdown:    { ...DEFAULT_CONTENT.countdown,    ...(saved.countdown    || {}) },
    video:        { ...DEFAULT_CONTENT.video,        ...(saved.video        || {}), urls: saved.video?.urls || DEFAULT_CONTENT.video.urls },
    portfolio:    { ...DEFAULT_CONTENT.portfolio,    ...(saved.portfolio    || {}), photos: saved.portfolio?.photos || DEFAULT_CONTENT.portfolio.photos },
    testimonials: { ...DEFAULT_CONTENT.testimonials, ...(saved.testimonials || {}), items: saved.testimonials?.items || DEFAULT_CONTENT.testimonials.items },
    about:        { ...DEFAULT_CONTENT.about,        ...(saved.about        || {}) },
    banner:       { ...DEFAULT_CONTENT.banner,       ...(saved.banner       || {}) },
    proposta:     { ...DEFAULT_CONTENT.proposta,     ...(saved.proposta     || {}) },
    propostaPage: { ...DEFAULT_CONTENT.propostaPage, ...(saved.propostaPage || {}), packages: saved.propostaPage?.packages || DEFAULT_CONTENT.propostaPage.packages },
  }
}

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const t = setTimeout(() => {
      const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.06 })
      obs.observe(el); return () => obs.disconnect()
    }, 60)
    return () => clearTimeout(t)
  }, [])
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  )
}

function TInput({ value, onChange, multiline, placeholder }: { value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string }) {
  const cls = "w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold/40 placeholder:text-white/20 resize-none"
  return multiline
    ? <textarea rows={3} className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    : <input type="text" className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] tracking-[0.25em] text-white/30 uppercase">{label}</label>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PropostaClient({ token, isAdmin }: { token: string; isAdmin: boolean }) {
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [contact,  setContact]  = useState<Record<string, any> | null>(null)
  const [content,  setContent]  = useState<PageContent>(DEFAULT_CONTENT)
  const [locked,   setLocked]   = useState(true)
  const [pwInput,  setPwInput]  = useState('')
  const [pwError,  setPwError]  = useState(false)

  // Editor
  const [editorOpen, setEditorOpen] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)

  useEffect(() => {
    fetch(`/api/lead-page/view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.contact) { setNotFound(true); setLoading(false); return }
        setContact(data.contact)
        const merged = merge(data.contact.page_content)
        setContent(merged)
        // Check if already unlocked
        const stored = localStorage.getItem(`proposta_${token}`)
        const pw = merged.proposta?.password || ''
        if (isAdmin || !pw || stored === pw) setLocked(false)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token, isAdmin])

  const handleUnlock = () => {
    const pw = content.proposta?.password || ''
    if (!pw || pwInput === pw) {
      localStorage.setItem(`proposta_${token}`, pwInput)
      setLocked(false)
    } else {
      setPwError(true)
      setTimeout(() => setPwError(false), 1500)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/lead-page/save-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, page_content: content }),
    })
    setSaved(true); setTimeout(() => setSaved(false), 2000); setSaving(false)
  }

  function setPage(k: keyof PageContent['propostaPage'], v: any) {
    setContent(c => ({ ...c, propostaPage: { ...c.propostaPage, [k]: v } }))
  }
  function setPkg(i: number, k: 'title' | 'description' | 'price', v: string) {
    setContent(c => {
      const packages = [...c.propostaPage.packages]
      packages[i] = { ...packages[i], [k]: v }
      return { ...c, propostaPage: { ...c.propostaPage, packages } }
    })
  }

  // ── Loading ──
  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <p className="text-white/20 tracking-[0.3em] text-xs uppercase animate-pulse">A carregar...</p>
    </main>
  )
  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <p className="text-white/20 tracking-[0.3em] text-xs uppercase">Página não disponível</p>
    </main>
  )

  // ── Password gate ──
  if (locked) return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0a0a0a' }}>
      <div className="w-full max-w-sm">
        <div className="relative" style={{ border: '0.5px solid rgba(201,168,76,0.3)', background: 'linear-gradient(135deg, #1c1408 0%, #0f0c07 50%, #1c1408 100%)' }}>
          {/* cantos */}
          {[['top-0 left-0','borderTop borderLeft'],['top-0 right-0','borderTop borderRight'],['bottom-0 left-0','borderBottom borderLeft'],['bottom-0 right-0','borderBottom borderRight']].map(([pos, _], i) => (
            <div key={i} className={`absolute ${pos} w-8 h-8`} style={{ borderTop: i < 2 ? '1px solid rgba(201,168,76,0.6)' : undefined, borderBottom: i >= 2 ? '1px solid rgba(201,168,76,0.6)' : undefined, borderLeft: i % 2 === 0 ? '1px solid rgba(201,168,76,0.6)' : undefined, borderRight: i % 2 === 1 ? '1px solid rgba(201,168,76,0.6)' : undefined }} />
          ))}

          <div className="px-10 py-12 text-center flex flex-col items-center gap-6">
            <img src={`${IMG_BASE}/logo_rl_gold.png`} alt="RL" className="w-12 opacity-75" />
            <p className="text-[10px] tracking-[0.45em] text-white/20 uppercase">Exclusivo</p>
            <div>
              <h1 className="font-cormorant text-3xl font-light italic text-white/90 leading-tight">Proposta</h1>
              <h1 className="font-cormorant text-3xl font-light italic" style={{ color: '#C9A84C' }}>Criativa</h1>
            </div>
            <p className="text-[11px] tracking-[0.45em]" style={{ color: 'rgba(201,168,76,0.35)' }}>&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</p>
            <div className="w-full flex flex-col gap-3">
              <input
                type="password"
                placeholder="Introduz a password"
                value={pwInput}
                onChange={e => setPwInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                className={`w-full bg-white/[0.05] rounded-xl px-4 py-3 text-sm text-white text-center outline-none placeholder:text-white/20 transition-all ${pwError ? 'border border-red-400/60' : 'border border-white/10 focus:border-gold/40'}`}
              />
              {pwError && <p className="text-[11px] text-red-400/70 text-center">Password incorreta</p>}
              <button onClick={handleUnlock}
                className="w-full py-3 text-xs tracking-[0.35em] uppercase transition-all"
                style={{ background: 'rgba(201,168,76,0.15)', border: '0.5px solid rgba(201,168,76,0.4)', color: '#C9A84C' }}>
                Entrar
              </button>
            </div>
            <a href={`/r/${token}`} className="text-[10px] tracking-widest text-white/20 hover:text-white/40 transition-colors uppercase">
              ← Voltar
            </a>
          </div>
        </div>
      </div>
    </main>
  )

  const { propostaPage: pp } = content

  // ── Proposta page ──
  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>

      {/* Admin bar */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-white/5">
          <a href={`/r/${token}`} className="text-[10px] tracking-widest text-white/25 hover:text-white/50 transition-colors uppercase">‹ Página</a>
          <span className="text-[10px] tracking-widest text-white/20 uppercase">Admin · Proposta Criativa</span>
          <button onClick={() => setEditorOpen(true)}
            className="text-[10px] px-2.5 py-1 border border-gold/30 rounded text-gold/70 hover:text-gold hover:border-gold/60 transition-all uppercase tracking-wider">
            ✎ Editar
          </button>
        </div>
      )}

      {/* ── HERO ── */}
      <section className={`relative min-h-[50vh] flex items-center justify-center overflow-hidden ${isAdmin ? 'pt-10' : ''}`}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #130f08 40%, #0a0a0a 100%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(201,168,76,0.08) 0%, transparent 70%)' }} />
        <div className="relative z-10 text-center px-6 py-16">
          <FadeIn delay={80}>
            <p className="text-[10px] tracking-[0.5em] text-white/25 uppercase mb-6">{contact!.nome || 'Para vocês'}</p>
          </FadeIn>
          <FadeIn delay={200}>
            <h1 className="font-cormorant font-light leading-none mb-3" style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', color: 'rgba(255,255,255,0.9)' }}>
              Proposta
            </h1>
            <h1 className="font-cormorant font-light italic leading-none" style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', color: '#C9A84C' }}>
              Criativa
            </h1>
          </FadeIn>
          <FadeIn delay={360}>
            <p className="font-cormorant text-lg sm:text-xl italic text-white/45 mt-6">{pp.subtitle}</p>
          </FadeIn>
        </div>
      </section>

      {/* ── INTRO ── */}
      <section className="px-6 py-16 max-w-2xl mx-auto text-center">
        <FadeIn>
          <p className="text-[11px] tracking-[0.45em] mb-8" style={{ color: 'rgba(201,168,76,0.4)' }}>&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</p>
          <p className="font-cormorant text-xl sm:text-2xl italic font-light leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {pp.intro}
          </p>
          <p className="text-[11px] tracking-[0.45em] mt-8" style={{ color: 'rgba(201,168,76,0.4)' }}>&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</p>
        </FadeIn>
      </section>

      {/* ── PACOTES ── */}
      <section className="px-6 py-16" style={{ background: '#0d0d0d' }}>
        <FadeIn>
          <p className="text-[10px] tracking-[0.45em] text-white/20 uppercase text-center mb-12">Os nossos pacotes</p>
        </FadeIn>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {pp.packages.map((pkg, i) => (
            <FadeIn key={i} delay={i * 130}>
              <div className="relative flex flex-col h-full p-8 text-center" style={{ background: 'linear-gradient(180deg, rgba(201,168,76,0.06) 0%, rgba(201,168,76,0.02) 100%)', border: '0.5px solid rgba(201,168,76,0.25)' }}>
                {/* Cantos */}
                <div className="absolute top-0 left-0 w-5 h-5" style={{ borderTop: '1px solid rgba(201,168,76,0.5)', borderLeft: '1px solid rgba(201,168,76,0.5)' }} />
                <div className="absolute top-0 right-0 w-5 h-5" style={{ borderTop: '1px solid rgba(201,168,76,0.5)', borderRight: '1px solid rgba(201,168,76,0.5)' }} />
                <div className="absolute bottom-0 left-0 w-5 h-5" style={{ borderBottom: '1px solid rgba(201,168,76,0.5)', borderLeft: '1px solid rgba(201,168,76,0.5)' }} />
                <div className="absolute bottom-0 right-0 w-5 h-5" style={{ borderBottom: '1px solid rgba(201,168,76,0.5)', borderRight: '1px solid rgba(201,168,76,0.5)' }} />
                <p className="font-cormorant text-2xl italic font-light mb-4" style={{ color: '#C9A84C' }}>{pkg.title}</p>
                <div className="h-px mb-6" style={{ background: 'rgba(201,168,76,0.15)' }} />
                <p className="text-sm leading-relaxed text-white/50 flex-1 mb-6">{pkg.description}</p>
                <p className="font-cormorant text-xl italic" style={{ color: 'rgba(255,255,255,0.7)' }}>{pkg.price}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-6 py-16 flex flex-col items-center text-center">
        <FadeIn className="flex flex-col items-center gap-6">
          <p className="font-cormorant text-2xl italic text-white/60">{pp.ctaText}</p>
          <a href={`/r/${token}`}
            className="flex items-center gap-3 px-10 py-4 text-[11px] tracking-[0.4em] uppercase transition-all hover:scale-[1.02]"
            style={{ background: 'rgba(201,168,76,0.12)', border: '0.5px solid rgba(201,168,76,0.4)', color: '#C9A84C' }}>
            ← Voltar à página
          </a>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-[10px] tracking-widest text-white/15 uppercase">© RL Photo · Video</p>
      </footer>

      {/* ══ EDITOR PANEL ══ */}
      {isAdmin && (
        <>
          {editorOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setEditorOpen(false)} />}
          <div className={`fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ${editorOpen ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ width: '320px', background: '#0d0d0d', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-xs tracking-widest text-white/60 uppercase">Editar Proposta</p>
              <button onClick={() => setEditorOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              <Field label="Subtítulo">
                <TInput value={pp.subtitle} onChange={v => setPage('subtitle', v)} />
              </Field>
              <Field label="Texto de introdução">
                <TInput value={pp.intro} onChange={v => setPage('intro', v)} multiline />
              </Field>
              <p className="text-[10px] tracking-widest text-white/25 uppercase mt-2">Pacotes</p>
              {pp.packages.map((pkg, i) => (
                <div key={i} className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-[10px] tracking-widest text-white/20 uppercase">Pacote {i + 1}</p>
                  <Field label="Nome"><TInput value={pkg.title} onChange={v => setPkg(i, 'title', v)} /></Field>
                  <Field label="Descrição"><TInput value={pkg.description} onChange={v => setPkg(i, 'description', v)} multiline /></Field>
                  <Field label="Preço"><TInput value={pkg.price} onChange={v => setPkg(i, 'price', v)} placeholder="Ex: A partir de 2500€" /></Field>
                </div>
              ))}
              <Field label="Texto CTA">
                <TInput value={pp.ctaText} onChange={v => setPage('ctaText', v)} />
              </Field>
            </div>
            <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold tracking-[0.1em] uppercase transition-all disabled:opacity-50"
                style={{ background: saved ? 'rgba(74,222,128,0.15)' : 'rgba(201,168,76,0.15)', color: saved ? '#4ade80' : '#C9A84C', border: `1px solid ${saved ? 'rgba(74,222,128,0.3)' : 'rgba(201,168,76,0.3)'}` }}>
                {saving ? 'A guardar...' : saved ? '✓ Guardado!' : 'Guardar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
