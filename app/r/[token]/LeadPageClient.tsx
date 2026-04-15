'use client'

import { useEffect, useRef, useState } from 'react'

const WHATSAPP     = 'https://wa.me/351919191919'
const DEFAULT_HERO = 'https://rl-menu-lake.vercel.app/casamentos-2028.png'

type Contact = Record<string, any>

const FONTS: { value: string; label: string; className: string }[] = [
  { value: 'playfair',  label: 'Playfair',  className: 'font-playfair' },
  { value: 'cormorant', label: 'Cormorant', className: 'font-cormorant' },
  { value: 'sans',      label: 'Sans',      className: 'font-sans' },
]

const SIZES: { value: string; label: string; className: string }[] = [
  { value: 'sm',  label: 'S',  className: 'text-2xl' },
  { value: 'md',  label: 'M',  className: 'text-4xl' },
  { value: 'lg',  label: 'L',  className: 'text-5xl sm:text-6xl' },
  { value: 'xl',  label: 'XL', className: 'text-6xl sm:text-7xl' },
]

export type PageContent = {
  hero:         { title: string; titleFont: string; titleSize: string; titleColor: string; brandLine: string; brandColor: string }
  countdown:    { title: string; titleColor: string }
  portfolio:    { label: string; title: string; titleFont: string; titleColor: string; photos: string[] }
  testimonials: { label: string; items: { text: string; author: string }[] }
  about:        { label: string; title: string; titleFont: string; titleColor: string; text: string; textColor: string }
}

export const DEFAULT_CONTENT: PageContent = {
  hero: {
    title: 'Reunião Marcada', titleFont: 'playfair', titleSize: 'xl',
    titleColor: '#ffffff', brandLine: 'RL Photo · Video', brandColor: '#C9A84C',
  },
  countdown:    { title: 'Contagem Regressiva', titleColor: '#C9A84C' },
  portfolio: {
    label: 'O nosso trabalho', title: 'Momentos que ficam para sempre.',
    titleFont: 'cormorant', titleColor: '#ffffff', photos: ['', '', ''],
  },
  testimonials: {
    label: 'O que dizem',
    items: [
      { text: 'Captaram cada momento com uma sensibilidade única. As nossas fotos são pura magia.', author: '— Ana & Pedro · Casamento 2024' },
      { text: 'Desde o primeiro contacto sentimos que estaríamos em boas mãos. Superaram todas as expectativas.', author: '— Sofia & Miguel · Casamento 2024' },
    ],
  },
  about: {
    label: 'Quem somos', title: 'RL Photo · Video', titleFont: 'cormorant',
    titleColor: '#ffffff',
    text: 'Somos especializados em fotografia e vídeo de casamentos. O nosso objetivo é preservar a autenticidade de cada momento — a emoção, os detalhes, as histórias que só acontecem uma vez.',
    textColor: '#666666',
  },
}

function merge(saved: any): PageContent {
  if (!saved) return DEFAULT_CONTENT
  return {
    hero:         { ...DEFAULT_CONTENT.hero,         ...(saved.hero         || {}) },
    countdown:    { ...DEFAULT_CONTENT.countdown,    ...(saved.countdown    || {}) },
    portfolio:    { ...DEFAULT_CONTENT.portfolio,    ...(saved.portfolio    || {}), photos: saved.portfolio?.photos || DEFAULT_CONTENT.portfolio.photos },
    testimonials: { ...DEFAULT_CONTENT.testimonials, ...(saved.testimonials || {}), items: saved.testimonials?.items || DEFAULT_CONTENT.testimonials.items },
    about:        { ...DEFAULT_CONTENT.about,        ...(saved.about        || {}) },
  }
}

function fontClass(f: string) { return FONTS.find(x => x.value === f)?.className || 'font-playfair' }
function sizeClass(s: string) { return SIZES.find(x => x.value === s)?.className || 'text-6xl sm:text-7xl' }

// ─── UI helpers ──────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] tracking-[0.25em] text-white/30 uppercase">{label}</label>
      {children}
    </div>
  )
}

function TInput({ value, onChange, multiline }: { value: string; onChange: (v: string) => void; multiline?: boolean }) {
  const cls = "w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold/40 placeholder:text-white/20 resize-none"
  return multiline
    ? <textarea rows={3} className={cls} value={value} onChange={e => onChange(e.target.value)} />
    : <input type="text" className={cls} value={value} onChange={e => onChange(e.target.value)} />
}

function FontPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      {FONTS.map(f => (
        <button key={f.value} onClick={() => onChange(f.value)}
          className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${value === f.value ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>
          {f.label}
        </button>
      ))}
    </div>
  )
}

function SizePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      {SIZES.map(s => (
        <button key={s.value} onClick={() => onChange(s.value)}
          className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${value === s.value ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'}`}>
          {s.label}
        </button>
      ))}
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-9 h-9 rounded-lg cursor-pointer border border-white/10 bg-transparent p-0.5" />
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold/40 font-mono" />
    </div>
  )
}

function AccordionSection({ title, children, defaultOpen }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || false)
  return (
    <div className="border border-white/[0.07] rounded-xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.03] transition-all">
        <span className="text-xs tracking-[0.2em] text-white/50 uppercase">{title}</span>
        <span className="text-white/20 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-4 flex flex-col gap-4 border-t border-white/[0.06]" style={{ paddingTop: '1rem' }}>{children}</div>}
    </div>
  )
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
function fmtData(d: string) {
  if (!d) return ''
  try {
    const dt = new Date(d + 'T00:00:00')
    return `${String(dt.getDate()).padStart(2,'0')} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`
  } catch { return d }
}
function fmtHora(h: string) { return (h || '').slice(0, 5) }

function Leaf({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 80 30" className={`w-16 sm:w-20 h-auto text-gold/50 ${flip ? 'scale-x-[-1]' : ''}`} fill="currentColor">
      <path d="M5 15 Q20 5 40 15 Q20 25 5 15Z" opacity="0.6"/>
      <path d="M30 15 Q50 3 75 15 Q50 27 30 15Z" opacity="0.4"/>
      <line x1="5" y1="15" x2="75" y2="15" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
    </svg>
  )
}

function Countdown({ targetDate }: { targetDate: string }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    function tick() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) return setT({ d: 0, h: 0, m: 0, s: 0 })
      setT({ d: Math.floor(diff/86400000), h: Math.floor((diff%86400000)/3600000), m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [targetDate])
  const Unit = ({ v, label }: { v: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="font-playfair text-4xl sm:text-5xl font-bold text-white tabular-nums">{String(v).padStart(2,'0')}</span>
      <span className="text-[10px] tracking-[0.25em] text-white/40 uppercase mt-1">{label}</span>
    </div>
  )
  const Sep = () => <span className="font-playfair text-3xl text-gold/40 self-start mt-2">|</span>
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8">
      <Unit v={t.d} label="Dias"/><Sep/>
      <Unit v={t.h} label="Horas"/><Sep/>
      <Unit v={t.m} label="Min"/><Sep/>
      <Unit v={t.s} label="Seg"/>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LeadPageClient({ token, isAdmin }: { token: string; isAdmin: boolean }) {
  const [contact,    setContact]    = useState<Contact | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)
  const [status,     setStatus]     = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [requesting, setRequesting] = useState(false)

  // Hero photo
  const [heroPreview,  setHeroPreview]  = useState('')
  const [heroInput,    setHeroInput]    = useState('')
  const [editingHero,  setEditingHero]  = useState(false)
  const [savingHero,   setSavingHero]   = useState(false)
  const [heroSaved,    setHeroSaved]    = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Editor
  const [editorOpen,  setEditorOpen]  = useState(false)
  const [content,     setContent]     = useState<PageContent>(DEFAULT_CONTENT)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)

  // Photo upload refs for portfolio
  const photoRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  useEffect(() => {
    fetch(`/api/lead-page/view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.contact) { setNotFound(true); setLoading(false); return }
        setContact(data.contact)
        setStatus(data.contact.page_confirmacao || null)
        setHeroPreview(data.contact.page_foto_url || DEFAULT_HERO)
        setHeroInput(data.contact.page_foto_url || '')
        setContent(merge(data.contact.page_content))
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  // ── Content updater helpers ──
  function setHero(k: keyof PageContent['hero'], v: string) {
    setContent(c => ({ ...c, hero: { ...c.hero, [k]: v } }))
  }
  function setCountdown(k: keyof PageContent['countdown'], v: string) {
    setContent(c => ({ ...c, countdown: { ...c.countdown, [k]: v } }))
  }
  function setPortfolio(k: keyof PageContent['portfolio'], v: any) {
    setContent(c => ({ ...c, portfolio: { ...c.portfolio, [k]: v } }))
  }
  function setTestimonial(i: number, k: 'text' | 'author', v: string) {
    setContent(c => {
      const items = [...c.testimonials.items]
      items[i] = { ...items[i], [k]: v }
      return { ...c, testimonials: { ...c.testimonials, items } }
    })
  }
  function setAbout(k: keyof PageContent['about'], v: string) {
    setContent(c => ({ ...c, about: { ...c.about, [k]: v } }))
  }
  function setPhoto(i: number, url: string) {
    setContent(c => {
      const photos = [...c.portfolio.photos]
      photos[i] = url
      return { ...c, portfolio: { ...c.portfolio, photos } }
    })
  }

  // ── Save content ──
  const handleSaveContent = async () => {
    setSaving(true)
    const res = await fetch('/api/lead-page/save-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, page_content: content }),
    })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    setSaving(false)
  }

  // ── Hero photo ──
  const handleSaveHero = async () => {
    setSavingHero(true)
    const res = await fetch('/api/lead-page/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, page_foto_url: heroInput || null }),
    })
    if (res.ok) {
      setHeroPreview(heroInput || DEFAULT_HERO)
      setContact(c => c ? { ...c, page_foto_url: heroInput || null } : c)
      setHeroSaved(true)
      setTimeout(() => { setHeroSaved(false); setEditingHero(false) }, 1500)
    }
    setSavingHero(false)
  }

  const handleUpload = async (file: File, cb: (url: string) => void) => {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.url) cb(data.url)
  }

  // ── Confirm / change ──
  const handleConfirm = async () => {
    setConfirming(true)
    await fetch(`/api/lead-page/confirm?token=${token}`, { method: 'POST' })
    setStatus('confirmada'); setConfirming(false)
  }
  const handleChangeRequest = async () => {
    setRequesting(true)
    await fetch('/api/lead-page/request-change-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    setStatus('alteracao_pedida')
    setRequesting(false)
  }

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

  const heroImage  = heroPreview || DEFAULT_HERO
  const isVideo    = contact!.reuniao_tipo === 'Videochamada'
  const dataFmt    = fmtData(contact!.reuniao_data || '')
  const horaFmt    = fmtHora(contact!.reuniao_hora || '')
  const targetDate = contact!.reuniao_data && contact!.reuniao_hora
    ? `${contact!.reuniao_data}T${horaFmt}:00` : null

  const { hero, countdown, portfolio, testimonials, about } = content

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* ── ADMIN BAR ── */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-white/5">
          <a href="/crm" className="text-[10px] tracking-widest text-white/25 hover:text-white/50 transition-colors uppercase">‹ CRM</a>
          <span className="text-[10px] tracking-widest text-white/20 uppercase">Admin · Página do Cliente</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditingHero(true)}
              className="text-[10px] px-2.5 py-1 border border-white/10 rounded text-white/40 hover:text-white hover:border-white/30 transition-all uppercase tracking-wider">
              ✎ Foto
            </button>
            <button onClick={() => setEditorOpen(true)}
              className="text-[10px] px-2.5 py-1 border border-gold/30 rounded text-gold/70 hover:text-gold hover:border-gold/60 transition-all uppercase tracking-wider">
              ✎ Editar Página
            </button>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section id="sec-reuniao" className={`relative min-h-[70vh] sm:min-h-[80vh] flex items-end justify-center pb-12 overflow-hidden ${isAdmin ? 'pt-10' : ''}`}>
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url(${heroImage})` }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />
        </div>

        {/* Hero edit overlay */}
        {isAdmin && editingHero && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/75 backdrop-blur-sm">
            <div className="w-full max-w-md px-4">
              <p className="text-[10px] text-gold/60 tracking-widest uppercase mb-3 text-center">Trocar fotografia de fundo</p>
              <label className="flex items-center justify-center w-full py-3 rounded-xl border border-dashed border-white/20 hover:border-gold/50 hover:bg-gold/5 text-white/40 hover:text-gold/80 cursor-pointer transition-all mb-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, url => { setHeroInput(url); setHeroPreview(url) }) }} />
                <span className="text-sm">⬆ Carregar do dispositivo</span>
              </label>
              <input value={heroInput} onChange={e => { setHeroInput(e.target.value); setHeroPreview(e.target.value || DEFAULT_HERO) }}
                placeholder="ou cola um URL de imagem..."
                className="w-full bg-white/[0.08] border border-white/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50 mb-3 placeholder:text-white/25" />
              {heroPreview && <div className="w-full h-28 rounded-lg bg-cover bg-center mb-3 border border-white/10" style={{ backgroundImage: `url(${heroPreview})` }} />}
              <div className="flex gap-2 justify-center">
                <button onClick={() => { setEditingHero(false); setHeroPreview(contact!.page_foto_url || DEFAULT_HERO); setHeroInput(contact!.page_foto_url || '') }}
                  className="px-4 py-2 text-xs border border-white/15 rounded-lg text-white/50 hover:text-white/80 transition-all">Cancelar</button>
                <button onClick={handleSaveHero} disabled={savingHero}
                  className="px-5 py-2 text-xs bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30 transition-all disabled:opacity-50">
                  {savingHero ? 'A guardar...' : heroSaved ? '✓ Guardado!' : '✓ Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isAdmin && !editingHero && (
          <button onClick={() => setEditingHero(true)}
            className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 border border-white/15 text-[10px] text-white/50 hover:text-white transition-all backdrop-blur-sm">
            📷 Trocar foto
          </button>
        )}

        <div className="relative z-10 text-center px-4 pt-20">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Leaf />
            <p className={`${fontClass(hero.titleFont)} text-sm sm:text-base tracking-[0.4em] uppercase italic`} style={{ color: hero.brandColor }}>
              {hero.brandLine}
            </p>
            <Leaf flip />
          </div>
          <h1 className={`${fontClass(hero.titleFont)} ${sizeClass(hero.titleSize)} font-black leading-none tracking-tight mb-4`} style={{ color: hero.titleColor }}>
            {hero.title}
          </h1>
          <div className="flex flex-col items-center gap-1 mt-2">
            {contact!.nome && <p className="font-cormorant text-white/60 text-lg sm:text-xl italic tracking-wide">{contact!.nome}</p>}
            {dataFmt && <p className="font-cormorant text-white/50 text-sm sm:text-base italic tracking-wide">♡ {dataFmt} · {horaFmt} · {contact!.reuniao_tipo || 'Presencial'}</p>}
          </div>
        </div>
      </section>

      {/* ── COUNTDOWN ── */}
      {targetDate && (
        <section id="sec-countdown" className="py-10 sm:py-14 border-y border-white/[0.05] bg-[#0d0d0d]">
          <p className={`font-playfair font-black text-xl sm:text-2xl text-center mb-6 tracking-tight`} style={{ color: countdown.titleColor }}>
            {countdown.title}
          </p>
          <div className="flex items-center justify-center gap-4">
            <Leaf /><Countdown targetDate={targetDate} /><Leaf flip />
          </div>
        </section>
      )}

      {/* ── CARD REUNIÃO ── */}
      <section className="flex flex-col items-center px-6 py-14">
        <div className="w-full max-w-sm border border-white/10 rounded-2xl overflow-hidden mb-8" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="px-6 py-4 border-b border-white/8">
            <p className="text-xs tracking-[0.3em] text-white/25 uppercase">Detalhes da Reunião</p>
          </div>
          <div className="px-6 py-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.2em] text-white/30 uppercase">Data</span>
              <span className="font-cormorant text-lg text-white/90">{dataFmt}</span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.2em] text-white/30 uppercase">Hora</span>
              <span className="font-cormorant text-lg text-white/90">{horaFmt}</span>
            </div>
            <div className="h-px bg-white/5" />
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.2em] text-white/30 uppercase">Modo</span>
              <span className="font-cormorant text-lg text-white/90">{contact!.reuniao_tipo || 'Presencial'}</span>
            </div>
          </div>
          {contact!.reuniao_link && (
            <div className="px-6 pb-5">
              <a href={contact!.reuniao_link} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs tracking-widest uppercase transition-all"
                style={{ background: 'rgba(201,168,76,0.08)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.2)' }}>
                <span>{isVideo ? '🎥' : '📍'}</span>
                <span>{isVideo ? 'Entrar na videochamada' : 'Ver localização'}</span>
              </a>
            </div>
          )}
        </div>

        <div className="w-full max-w-sm flex flex-col gap-3">

          {/* Status badge */}
          {status === 'confirmada' && (
            <div className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl text-sm tracking-wider"
              style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)' }}>
              <span>✓</span><span>Reunião Confirmada — Até breve!</span>
            </div>
          )}
          {status === 'alteracao_pedida' && (
            <div className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl text-sm tracking-wider"
              style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)' }}>
              <span>⏳</span><span>Pedido enviado — Entraremos em contacto</span>
            </div>
          )}

          {/* Confirmar — só se ainda não confirmou */}
          {status !== 'confirmada' && (
            <button onClick={handleConfirm} disabled={confirming || isAdmin}
              className="w-full py-4 rounded-2xl text-sm font-semibold tracking-[0.15em] uppercase transition-all disabled:opacity-50"
              style={{ background: '#C9A84C', color: '#0a0a0a' }}>
              {confirming ? 'A confirmar...' : 'Confirmar Reunião'}
            </button>
          )}

          {/* Alterar — sempre visível */}
          <button onClick={handleChangeRequest} disabled={requesting || isAdmin}
            className="w-full py-4 rounded-2xl text-sm tracking-[0.15em] uppercase transition-all disabled:opacity-50"
            style={{ color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {requesting ? 'A enviar...' : 'Alterar Reunião'}
          </button>

          {isAdmin && <p className="text-center text-[10px] text-white/20 tracking-widest uppercase">Botões desativados em modo admin</p>}
        </div>
      </section>

      <div className="w-full max-w-sm mx-auto h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />

      {/* ── PORTFÓLIO ── */}
      <section id="sec-portfolio" className="px-6 py-14 flex flex-col items-center">
        <p className="text-xs tracking-[0.35em] text-white/25 uppercase mb-2">{portfolio.label}</p>
        <h2 className={`${fontClass(portfolio.titleFont)} text-3xl font-light mb-8 text-center`} style={{ color: portfolio.titleColor }}>
          {portfolio.title}
        </h2>
        <div className="w-full max-w-2xl grid grid-cols-3 gap-3">
          {portfolio.photos.map((url, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden relative group"
              style={{ background: url ? undefined : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {url
                ? <img src={url} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><span className="text-white/10 text-xs tracking-widest">foto</span></div>
              }
            </div>
          ))}
        </div>
      </section>

      <div className="w-full max-w-sm mx-auto h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />

      {/* ── TESTEMUNHOS ── */}
      <section id="sec-testemunhos" className="px-6 py-14 flex flex-col items-center gap-8 max-w-2xl mx-auto">
        <p className="text-xs tracking-[0.35em] text-white/25 uppercase">{testimonials.label}</p>
        {testimonials.items.map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-4 w-full">
            <blockquote className="text-center">
              <p className="font-cormorant text-xl text-white/70 italic font-light leading-relaxed mb-3">"{item.text}"</p>
              <cite className="text-xs tracking-[0.2em] text-gold/60 not-italic">{item.author}</cite>
            </blockquote>
            {i < testimonials.items.length - 1 && <div className="w-8 h-px" style={{ background: 'rgba(201,168,76,0.2)' }} />}
          </div>
        ))}
      </section>

      <div className="w-full max-w-sm mx-auto h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />

      {/* ── SOBRE NÓS ── */}
      <section id="sec-sobre" className="px-6 py-14 flex flex-col items-center max-w-sm mx-auto text-center">
        <p className="text-xs tracking-[0.35em] text-white/25 uppercase mb-2">{about.label}</p>
        <h2 className={`${fontClass(about.titleFont)} text-3xl font-light mb-6`} style={{ color: about.titleColor }}>
          {about.title}
        </h2>
        <p className="text-sm leading-relaxed font-light" style={{ color: about.textColor }}>{about.text}</p>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-10 text-center border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-xs tracking-widest text-white/15 uppercase">© RL Photo · Video</p>
      </footer>

      {/* ── WHATSAPP ── */}
      {!isAdmin && (
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 z-50"
          style={{ background: '#25D366' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>
      )}

      {/* ══════════════════════════════════════════════
          EDITOR PANEL (admin only)
      ══════════════════════════════════════════════ */}
      {isAdmin && (
        <>
          {/* Overlay */}
          {editorOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setEditorOpen(false)} />}

          {/* Panel */}
          <div className={`fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${editorOpen ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ width: '320px', background: '#0d0d0d', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-xs tracking-widest text-white/60 uppercase">Editor</p>
                <p className="text-[10px] text-white/20 mt-0.5">Alterações em tempo real</p>
              </div>
              <button onClick={() => setEditorOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all">✕</button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

              {/* ── HERO ── */}
              <AccordionSection title="Hero" defaultOpen>
                <Field label="Título">
                  <TInput value={hero.title} onChange={v => setHero('title', v)} />
                </Field>
                <Field label="Tipo de letra">
                  <FontPicker value={hero.titleFont} onChange={v => setHero('titleFont', v)} />
                </Field>
                <Field label="Tamanho">
                  <SizePicker value={hero.titleSize} onChange={v => setHero('titleSize', v)} />
                </Field>
                <Field label="Cor do título">
                  <ColorPicker value={hero.titleColor} onChange={v => setHero('titleColor', v)} />
                </Field>
                <Field label="Linha da marca">
                  <TInput value={hero.brandLine} onChange={v => setHero('brandLine', v)} />
                </Field>
                <Field label="Cor da marca">
                  <ColorPicker value={hero.brandColor} onChange={v => setHero('brandColor', v)} />
                </Field>
              </AccordionSection>

              {/* ── CONTAGEM ── */}
              <AccordionSection title="Contagem Regressiva">
                <Field label="Título">
                  <TInput value={countdown.title} onChange={v => setCountdown('title', v)} />
                </Field>
                <Field label="Cor do título">
                  <ColorPicker value={countdown.titleColor} onChange={v => setCountdown('titleColor', v)} />
                </Field>
              </AccordionSection>

              {/* ── PORTFÓLIO ── */}
              <AccordionSection title="Portfólio">
                <Field label="Etiqueta">
                  <TInput value={portfolio.label} onChange={v => setPortfolio('label', v)} />
                </Field>
                <Field label="Título">
                  <TInput value={portfolio.title} onChange={v => setPortfolio('title', v)} />
                </Field>
                <Field label="Tipo de letra">
                  <FontPicker value={portfolio.titleFont} onChange={v => setPortfolio('titleFont', v)} />
                </Field>
                <Field label="Cor do título">
                  <ColorPicker value={portfolio.titleColor} onChange={v => setPortfolio('titleColor', v)} />
                </Field>
                <Field label="Fotos (3)">
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="flex flex-col gap-1">
                        <label className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-gold/40 transition-all group"
                          style={{ background: portfolio.photos[i] ? undefined : 'rgba(255,255,255,0.04)' }}>
                          <input ref={photoRefs[i]} type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, url => setPhoto(i, url)) }} />
                          {portfolio.photos[i]
                            ? <img src={portfolio.photos[i]} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                <span className="text-white/20 text-lg">⬆</span>
                                <span className="text-white/20 text-[9px] tracking-wider">Foto {i+1}</span>
                              </div>
                          }
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                            <span className="text-white text-xs">Trocar</span>
                          </div>
                        </label>
                        {portfolio.photos[i] && (
                          <button onClick={() => setPhoto(i, '')}
                            className="text-[9px] text-white/20 hover:text-red-400 transition-colors text-center tracking-wider">
                            ✕ remover
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </Field>
              </AccordionSection>

              {/* ── TESTEMUNHOS ── */}
              <AccordionSection title="Testemunhos">
                <Field label="Etiqueta">
                  <TInput value={testimonials.label} onChange={v => setContent(c => ({ ...c, testimonials: { ...c.testimonials, label: v } }))} />
                </Field>
                {testimonials.items.map((item, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[10px] tracking-widest text-white/20 uppercase">Testemunho {i + 1}</p>
                    <Field label="Texto">
                      <TInput value={item.text} onChange={v => setTestimonial(i, 'text', v)} multiline />
                    </Field>
                    <Field label="Autor">
                      <TInput value={item.author} onChange={v => setTestimonial(i, 'author', v)} />
                    </Field>
                  </div>
                ))}
              </AccordionSection>

              {/* ── SOBRE NÓS ── */}
              <AccordionSection title="Sobre Nós">
                <Field label="Etiqueta">
                  <TInput value={about.label} onChange={v => setAbout('label', v)} />
                </Field>
                <Field label="Título">
                  <TInput value={about.title} onChange={v => setAbout('title', v)} />
                </Field>
                <Field label="Tipo de letra">
                  <FontPicker value={about.titleFont} onChange={v => setAbout('titleFont', v)} />
                </Field>
                <Field label="Cor do título">
                  <ColorPicker value={about.titleColor} onChange={v => setAbout('titleColor', v)} />
                </Field>
                <Field label="Texto">
                  <TInput value={about.text} onChange={v => setAbout('text', v)} multiline />
                </Field>
                <Field label="Cor do texto">
                  <ColorPicker value={about.textColor} onChange={v => setAbout('textColor', v)} />
                </Field>
              </AccordionSection>

            </div>

            {/* Save button */}
            <div className="px-4 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <button onClick={handleSaveContent} disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold tracking-[0.1em] uppercase transition-all disabled:opacity-50"
                style={{ background: saved ? 'rgba(74,222,128,0.15)' : 'rgba(201,168,76,0.15)', color: saved ? '#4ade80' : '#C9A84C', border: `1px solid ${saved ? 'rgba(74,222,128,0.3)' : 'rgba(201,168,76,0.3)'}` }}>
                {saving ? 'A guardar...' : saved ? '✓ Guardado!' : 'Guardar Alterações'}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
