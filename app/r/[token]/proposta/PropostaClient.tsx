'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { DEFAULT_CONTENT, PageContent, Proposta, FONTS, TITLE_SIZES } from '../LeadPageClient'

const IMG_BASE = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images'

function titlePosStyle(pos: string, isAdmin: boolean): React.CSSProperties {
  const t = isAdmin ? '76px' : '52px'
  const m = '40px'
  const map: Record<string, React.CSSProperties> = {
    'top-left':   { top: t, left: m, textAlign: 'left' },
    'top-center': { top: t, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' },
    'top-right':  { top: t, right: m, textAlign: 'right' },
    'mid-left':   { top: '50%', transform: 'translateY(-50%)', left: m, textAlign: 'left' },
    'mid-center': { top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' },
    'mid-right':  { top: '50%', transform: 'translateY(-50%)', right: m, textAlign: 'right' },
    'bot-left':   { bottom: m, left: m, textAlign: 'left' },
    'bot-center': { bottom: m, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' },
    'bot-right':  { bottom: m, right: m, textAlign: 'right' },
  }
  return map[pos] || map['top-right']
}

function toEmbed(url: string) {
  if (!url) return ''
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`
  const gd = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (gd) return `https://drive.google.com/file/d/${gd[1]}/preview`
  return url
}

function mergeContent(saved: any): PageContent {
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
    propostas:    saved.propostas || DEFAULT_CONTENT.propostas,
    propostaPage: { ...DEFAULT_CONTENT.propostaPage, ...(saved.propostaPage || {}), about: { ...DEFAULT_CONTENT.propostaPage.about, ...(saved.propostaPage?.about || {}) }, relive: { ...DEFAULT_CONTENT.propostaPage.relive, ...(saved.propostaPage?.relive || {}) }, packages: saved.propostaPage?.packages || DEFAULT_CONTENT.propostaPage.packages, propostaAtiva: saved.propostaPage?.propostaAtiva ?? 0, typography: { ...DEFAULT_CONTENT.propostaPage.typography, ...(saved.propostaPage?.typography || {}) } },
  }
}

// ── Slide transition wrapper ──────────────────────────────────────────────────
function SlideIn({ children, dir }: { children: React.ReactNode; dir: 'right' | 'left' }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVis(true), 30); return () => clearTimeout(t) }, [])
  return (
    <div style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateX(0px)' : `translateX(${dir === 'right' ? '48px' : '-48px'})`,
      transition: 'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)',
      height: '100%',
    }}>
      {children}
    </div>
  )
}

// ── Editor helpers ────────────────────────────────────────────────────────────
function TInput({ value, onChange, multiline, placeholder }: { value: string; onChange: (v: string) => void; multiline?: boolean; placeholder?: string }) {
  const cls = "w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gold/40 placeholder:text-white/20 resize-none"
  return multiline
    ? <textarea rows={4} className={cls} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
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
      {TITLE_SIZES.map(s => (
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
function AccordionSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
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

function fontClass(f: string) { return FONTS.find(x => x.value === f)?.className || 'font-cormorant' }
function sizeClass(s: string) { return TITLE_SIZES.find(x => x.value === s)?.className || 'text-6xl sm:text-7xl' }

// ─────────────────────────────────────────────────────────────────────────────
export default function PropostaClient({ token, isAdmin }: { token: string; isAdmin: boolean }) {
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [contact,  setContact]  = useState<Record<string, any> | null>(null)
  const [content,  setContent]  = useState<PageContent>(DEFAULT_CONTENT)
  const [locked,   setLocked]   = useState(true)
  const [pwInput,  setPwInput]  = useState('')
  const [pwError,  setPwError]  = useState(false)

  // Slides
  const [current,   setCurrent]   = useState(0)
  const [direction, setDirection] = useState<'right' | 'left'>('right')

  // Editor
  const [editorOpen,    setEditorOpen]    = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [editorTab,     setEditorTab]     = useState<'tipografia'|'texto'>('tipografia')
  const [uploadingAbout,  setUploadingAbout]  = useState(false)
  const [uploadingRelive, setUploadingRelive] = useState(false)

  useEffect(() => {
    fetch(`/api/lead-page/view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.contact) { setNotFound(true); setLoading(false); return }
        setContact(data.contact)
        const merged = mergeContent(data.contact.page_content)
        setContent(merged)
        const stored = localStorage.getItem(`proposta_${token}`)
        const pw = merged.proposta?.password || ''
        if (isAdmin || !pw || stored === pw) setLocked(false)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token, isAdmin])

  const slides = ['cover', 'about', 'intro', 'relive', 'invest', 'pkg-0', 'pkg-1', 'pkg-2', 'cta']
  const total  = slides.length

  const goTo = useCallback((idx: number) => {
    if (idx === current || idx < 0 || idx >= total) return
    setDirection(idx > current ? 'right' : 'left')
    setCurrent(idx)
  }, [current, total])

  const prev = useCallback(() => goTo(current - 1), [goTo, current])
  const next = useCallback(() => goTo(current + 1), [goTo, current])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft')  prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [next, prev])

  const handleUnlock = () => {
    const pw = content.proposta?.password || ''
    if (!pw || pwInput === pw) {
      localStorage.setItem(`proposta_${token}`, pwInput)
      setLocked(false)
    } else {
      setPwError(true); setTimeout(() => setPwError(false), 1500)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/lead-page/save-content', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, page_content: content }),
    })
    setSaved(true); setTimeout(() => setSaved(false), 2000); setSaving(false)
  }

  function setPage(k: keyof PageContent['propostaPage'], v: any) {
    setContent(c => ({ ...c, propostaPage: { ...c.propostaPage, [k]: v } }))
  }
  function setTypo(k: keyof PageContent['propostaPage']['typography'], v: string) {
    setContent(c => ({ ...c, propostaPage: { ...c.propostaPage, typography: { ...c.propostaPage.typography, [k]: v } } }))
  }
  function setPkg(i: number, k: 'title' | 'description' | 'price', v: string) {
    setContent(c => {
      const packages = [...c.propostaPage.packages]
      packages[i] = { ...packages[i], [k]: v }
      return { ...c, propostaPage: { ...c.propostaPage, packages } }
    })
  }
  function setAbout(k: keyof PageContent['propostaPage']['about'], v: string) {
    setContent(c => ({ ...c, propostaPage: { ...c.propostaPage, about: { ...c.propostaPage.about, [k]: v } } }))
  }
  function setRelive(k: keyof PageContent['propostaPage']['relive'], v: string) {
    setContent(c => ({ ...c, propostaPage: { ...c.propostaPage, relive: { ...c.propostaPage.relive, [k]: v } } }))
  }
  const handleReliveUpload = async (file: File) => {
    setUploadingRelive(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setRelive('imageUrl', data.url)
    } catch {}
    setUploadingRelive(false)
  }
  const handleAboutUpload = async (file: File) => {
    setUploadingAbout(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setAbout('photo', data.url)
    } catch {}
    setUploadingAbout(false)
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

  // ── Password gate ─────────────────────────────────────────────────────────
  if (locked) return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0a0a0a' }}>
      <div className="w-full max-w-sm">
        <div className="relative" style={{ border: '0.5px solid rgba(201,168,76,0.3)', background: 'linear-gradient(135deg, #1c1408 0%, #0f0c07 50%, #1c1408 100%)' }}>
          <div className="absolute top-0 left-0 w-8 h-8"  style={{ borderTop: '1px solid rgba(201,168,76,0.6)', borderLeft:  '1px solid rgba(201,168,76,0.6)' }} />
          <div className="absolute top-0 right-0 w-8 h-8" style={{ borderTop: '1px solid rgba(201,168,76,0.6)', borderRight: '1px solid rgba(201,168,76,0.6)' }} />
          <div className="absolute bottom-0 left-0 w-8 h-8"  style={{ borderBottom: '1px solid rgba(201,168,76,0.6)', borderLeft:  '1px solid rgba(201,168,76,0.6)' }} />
          <div className="absolute bottom-0 right-0 w-8 h-8" style={{ borderBottom: '1px solid rgba(201,168,76,0.6)', borderRight: '1px solid rgba(201,168,76,0.6)' }} />
          <div className="px-10 py-12 text-center flex flex-col items-center gap-6">
            <img src={`${IMG_BASE}/logo_rl_gold.png`} alt="RL" className="w-12 opacity-75" />
            <p className="text-[10px] tracking-[0.45em] text-white/20 uppercase">Exclusivo</p>
            <div>
              <h1 className="font-cormorant text-3xl font-light italic text-white/90">Proposta</h1>
              <h1 className="font-cormorant text-3xl font-light italic" style={{ color: '#C9A84C' }}>Criativa</h1>
            </div>
            <p className="text-[11px] tracking-[0.45em]" style={{ color: 'rgba(201,168,76,0.35)' }}>&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</p>
            <div className="w-full flex flex-col gap-3">
              <input type="password" placeholder="Introduz a password" value={pwInput}
                onChange={e => setPwInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                className={`w-full bg-white/[0.05] rounded-xl px-4 py-3 text-sm text-white text-center outline-none placeholder:text-white/20 transition-all ${pwError ? 'border border-red-400/60' : 'border border-white/10 focus:border-gold/40'}`} />
              {pwError && <p className="text-[11px] text-red-400/70 text-center">Password incorreta</p>}
              <button onClick={handleUnlock}
                className="w-full py-3 text-xs tracking-[0.35em] uppercase transition-all"
                style={{ background: 'rgba(201,168,76,0.15)', border: '0.5px solid rgba(201,168,76,0.4)', color: '#C9A84C' }}>
                Entrar
              </button>
            </div>
            <a href={`/r/${token}`} className="text-[10px] tracking-widest text-white/20 hover:text-white/40 transition-colors uppercase">← Voltar</a>
          </div>
        </div>
      </div>
    </main>
  )

  const { propostaPage: pp } = content
  const typo = pp.typography
  const nome = contact!.nome || ''

  // ── Slide content ─────────────────────────────────────────────────────────
  const renderSlide = (id: string) => {
    switch (id) {

      case 'cover': return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-6">
          <img src={`${IMG_BASE}/logo_rl_gold.png`} alt="RL" className="w-28 sm:w-36 opacity-80 mb-2" />
          <p className="text-[10px] tracking-[0.5em] text-white/25 uppercase">{nome || 'Para vocês'}</p>
          <div>
            <h1 className={`${fontClass(typo.titleFont)} ${sizeClass(typo.titleSize)} font-light`} style={{ color: typo.titleColor, lineHeight: 1 }}>Proposta</h1>
            <h1 className={`${fontClass(typo.titleFont)} ${sizeClass(typo.titleSize)} font-light italic`} style={{ color: typo.accentColor, lineHeight: 1.1 }}>Criativa</h1>
          </div>
          <p className="text-[11px] tracking-[0.5em]" style={{ color: `${typo.accentColor}66` }}>&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</p>
          <p className={`${fontClass(typo.bodyFont)} text-lg sm:text-xl italic opacity-60`} style={{ color: typo.bodyColor }}>{pp.subtitle}</p>
        </div>
      )

      case 'about': return (
        <div className="relative h-full w-full flex items-center justify-center px-10 sm:px-16">

          {/* Título — posição editável */}
          <div className="absolute" style={titlePosStyle(pp.about?.titlePos || 'top-right', isAdmin)}>
            <h2 className={`${fontClass(typo.titleFont)} font-light italic`}
              style={{ fontSize: 'clamp(1.6rem,3.5vw,2.6rem)', color: typo.titleColor, lineHeight: 1.1, whiteSpace: 'nowrap' }}>
              {pp.about?.title || 'Sobre Nós'}
            </h2>
            <div className="mt-2" style={{ width: '36px', height: '1px', background: `${typo.accentColor}66`, marginLeft: 'auto' }} />
          </div>

          {/* Conteúdo: foto + vídeo — tamanhos iguais */}
          <div className="flex flex-row items-center gap-10 sm:gap-14 w-full max-w-5xl justify-center">

            {/* Foto vertical */}
            <div className="relative flex-shrink-0" style={{ width: 'clamp(180px,24vw,300px)', height: 'clamp(260px,36vw,430px)' }}>
              <div className="absolute -top-2 -left-2 w-6 h-6" style={{ borderTop: `1px solid ${typo.accentColor}`, borderLeft: `1px solid ${typo.accentColor}` }} />
              <div className="absolute -top-2 -right-2 w-6 h-6" style={{ borderTop: `1px solid ${typo.accentColor}`, borderRight: `1px solid ${typo.accentColor}` }} />
              <div className="absolute -bottom-2 -left-2 w-6 h-6" style={{ borderBottom: `1px solid ${typo.accentColor}`, borderLeft: `1px solid ${typo.accentColor}` }} />
              <div className="absolute -bottom-2 -right-2 w-6 h-6" style={{ borderBottom: `1px solid ${typo.accentColor}`, borderRight: `1px solid ${typo.accentColor}` }} />
              {pp.about?.photo
                ? <img src={pp.about.photo} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full" style={{ background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.25)' }} />
              }
            </div>

            {/* Vídeo — mesmo tamanho que a foto */}
            <div className="relative flex-shrink-0" style={{ width: 'clamp(180px,24vw,300px)', height: 'clamp(260px,36vw,430px)' }}>
              <div className="absolute -top-2 -left-2 w-6 h-6 z-10" style={{ borderTop: `1px solid ${typo.accentColor}`, borderLeft: `1px solid ${typo.accentColor}` }} />
              <div className="absolute -top-2 -right-2 w-6 h-6 z-10" style={{ borderTop: `1px solid ${typo.accentColor}`, borderRight: `1px solid ${typo.accentColor}` }} />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 z-10" style={{ borderBottom: `1px solid ${typo.accentColor}`, borderLeft: `1px solid ${typo.accentColor}` }} />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 z-10" style={{ borderBottom: `1px solid ${typo.accentColor}`, borderRight: `1px solid ${typo.accentColor}` }} />
              {pp.about?.videoUrl && toEmbed(pp.about.videoUrl)
                ? <iframe src={toEmbed(pp.about.videoUrl)} className="w-full h-full"
                    style={{ border: 'none' }} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
                : <div className="w-full h-full flex flex-col items-center justify-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: `${typo.accentColor}44`, fontSize: '1.5rem' }}>▶</span>
                    <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: 'rgba(255,255,255,0.15)' }}>Vídeo</p>
                  </div>
              }
            </div>
          </div>
        </div>
      )

      case 'relive': return (
        <div className="flex items-center justify-center h-full w-full px-8 sm:px-16">
          <div className="flex flex-row items-center gap-10 sm:gap-16 w-full max-w-5xl">

            {/* Esquerda — texto */}
            <div className="flex flex-col gap-6 flex-1">
              <h2 className={`${fontClass(typo.titleFont)} font-light italic`}
                style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: typo.titleColor, lineHeight: 1.1 }}>
                Relive Wedding
              </h2>
              <div className="flex flex-col gap-3">
                {[
                  'Armazenamento seguro durante 10 anos',
                  'Acesso privado com palavra-passe',
                  'Todos os vídeos na plataforma',
                  'Experiência cinematográfica completa',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span style={{ color: typo.accentColor, fontSize: '0.7rem', marginTop: '3px', flexShrink: 0 }}>◆</span>
                    <p className={`${fontClass(typo.bodyFont)} font-light`} style={{ color: typo.bodyColor, fontSize: '16px' }}>{item}</p>
                  </div>
                ))}
              </div>
              <a href={pp.relive?.buttonUrl || 'https://relive.wedding'} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center self-start px-8 py-3 text-[11px] tracking-[0.35em] uppercase transition-all hover:scale-[1.03]"
                style={{ background: `${typo.accentColor}1F`, border: `0.5px solid ${typo.accentColor}73`, color: typo.accentColor }}>
                Aceder
              </a>
            </div>

            {/* Direita — imagem */}
            <div className="flex-shrink-0" style={{ width: 'clamp(300px,48vw,580px)' }}>
              {pp.relive?.imageUrl
                ? <img src={pp.relive.imageUrl} alt="Relive Wedding"
                    className="w-full h-auto"
                    style={{ borderRadius: '8px' }} />
                : <div className="w-full flex items-center justify-center" style={{ height: '260px', background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-[10px] tracking-widest text-white/15 uppercase">Imagem</p>
                  </div>
              }
            </div>
          </div>
        </div>
      )

      case 'intro': return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8 sm:px-20 gap-8 max-w-3xl mx-auto">
          <p className={`${fontClass(typo.titleFont)} font-light italic`} style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: 'rgba(255,255,255,0.2)', lineHeight: 1.1, whiteSpace: 'nowrap' }}>Quem são os meus noivos?</p>
          <p className="text-[11px] tracking-[0.45em]" style={{ color: `${typo.accentColor}66` }}>&#9670;</p>
          <p className={`${fontClass(typo.bodyFont)} text-2xl sm:text-3xl italic font-light leading-relaxed`} style={{ color: typo.bodyColor }}>
            &ldquo;{pp.intro}&rdquo;
          </p>
          <p className="text-[11px] tracking-[0.45em]" style={{ color: `${typo.accentColor}66` }}>&#9670;</p>
        </div>
      )

      case 'invest': return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8 sm:px-20 gap-8 max-w-2xl mx-auto">
          <p className="text-[10px] tracking-[0.5em] text-white/20 uppercase">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</p>
          <h2 className={`${fontClass(typo.titleFont)} font-light italic`}
            style={{ fontSize: 'clamp(2.5rem,7vw,5rem)', color: typo.titleColor, lineHeight: 1.0, letterSpacing: '0.06em' }}>
            Investimento
          </h2>
          <p className="text-[10px] tracking-[0.5em] text-white/20 uppercase">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</p>
          <p className={`${fontClass(typo.bodyFont)} font-light leading-relaxed`}
            style={{ fontSize: 'clamp(0.9rem,1.8vw,1.1rem)', color: typo.bodyColor, maxWidth: '480px' }}>
            As memórias que criamos juntos duram uma vida inteira. O valor que investem hoje é o retorno eterno de cada momento que nunca mais poderão reviver — apenas recordar.
          </p>
        </div>
      )

      case 'pkg-0':
      case 'pkg-1':
      case 'pkg-2': {
        const idx = parseInt(id.split('-')[1])
        const proposta: Proposta = content.propostas?.[idx] || { nome: '', servicos_foto: [], servicos_video: [], valor: '' }
        const isAtiva = (pp.propostaAtiva ?? 0) === idx
        const labels = ['1', '2', '3']
        const hasFoto  = (proposta.servicos_foto  || []).length > 0
        const hasVideo = (proposta.servicos_video || []).length > 0
        const hasAny   = hasFoto || hasVideo
        return (
          <div className="flex items-center justify-center h-full w-full px-6 sm:px-12">
            <div className="relative w-full max-w-4xl flex"
              style={{ border: `0.5px solid ${typo.accentColor}33`, minHeight: 'clamp(340px, 62vh, 480px)' }}>

              {/* Cantos decorativos */}
              <div className="absolute top-0 left-0 w-10 h-10" style={{ borderTop: `1px solid ${typo.accentColor}`, borderLeft: `1px solid ${typo.accentColor}` }} />
              <div className="absolute top-0 right-0 w-10 h-10" style={{ borderTop: `1px solid ${typo.accentColor}`, borderRight: `1px solid ${typo.accentColor}` }} />
              <div className="absolute bottom-0 left-0 w-10 h-10" style={{ borderBottom: `1px solid ${typo.accentColor}`, borderLeft: `1px solid ${typo.accentColor}` }} />
              <div className="absolute bottom-0 right-0 w-10 h-10" style={{ borderBottom: `1px solid ${typo.accentColor}`, borderRight: `1px solid ${typo.accentColor}` }} />

              {/* Badge Recomendado */}
              {isAtiva && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-1 text-[9px] tracking-[0.5em] uppercase z-10"
                  style={{ background: '#0d0b07', border: `0.5px solid ${typo.accentColor}`, color: typo.accentColor }}>
                  Recomendado
                </div>
              )}

              {/* Painel esquerdo — identidade */}
              <div className="relative flex flex-col justify-between"
                style={{ width: '38%', background: `linear-gradient(170deg, ${typo.accentColor}12 0%, ${typo.accentColor}04 100%)`, borderRight: `0.5px solid ${typo.accentColor}22`, padding: '44px 32px 36px', overflow: 'hidden' }}>

                {/* Letra decorativa de fundo */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
                  <span className={`${fontClass(typo.pkgTitleFont)} italic`}
                    style={{ fontSize: 'clamp(14rem,30vw,26rem)', color: `${typo.accentColor}09`, lineHeight: 1, userSelect: 'none' }}>
                    {labels[idx]}
                  </span>
                </div>

                {/* Conteúdo topo */}
                <div className="relative z-10">
                  <p className="text-[9px] tracking-[0.55em] uppercase mb-3" style={{ color: `${typo.accentColor}80` }}>
                    Proposta {labels[idx]}
                  </p>
                  <h2 className={`${fontClass(typo.pkgTitleFont)} italic font-light leading-tight`}
                    style={{ fontSize: 'clamp(1.6rem,3.5vw,2.5rem)', color: typo.pkgTitleColor }}>
                    {proposta.nome || `Proposta ${labels[idx]}`}
                  </h2>
                  <div className="mt-4 w-10 h-px" style={{ background: typo.accentColor }} />
                </div>

                {/* Valor */}
                <div className="relative z-10">
                  {proposta.valor ? (
                    <>
                      <p className="text-[9px] tracking-[0.4em] uppercase mb-1" style={{ color: `${typo.accentColor}60` }}>Investimento</p>
                      <p className={`${fontClass(typo.pkgTitleFont)} italic`}
                        style={{ fontSize: 'clamp(1.5rem,3vw,2.2rem)', color: typo.accentColor, lineHeight: 1.1 }}>
                        {proposta.valor.trim().includes('€') ? proposta.valor : `${proposta.valor} €`}
                      </p>
                    </>
                  ) : (
                    <p className="text-[10px] tracking-widest uppercase" style={{ color: `${typo.accentColor}30` }}>
                      Sob consulta
                    </p>
                  )}
                </div>
              </div>

              {/* Painel direito — serviços */}
              <div className="flex-1 flex flex-col justify-center" style={{ padding: '44px 36px 36px' }}>
                {hasAny ? (
                  <div className={`flex gap-8 h-full ${hasFoto && hasVideo ? '' : 'items-center'}`}>
                    {/* Fotografia */}
                    {hasFoto && (
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-[9px] tracking-[0.45em] uppercase" style={{ color: `${typo.accentColor}70` }}>Fotografia</span>
                          <div className="flex-1 h-px" style={{ background: `${typo.accentColor}20` }} />
                        </div>
                        <div className="flex flex-col gap-2.5">
                          {(proposta.servicos_foto || []).map((s, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <span style={{ color: typo.accentColor, fontSize: '0.5rem', marginTop: '5px', flexShrink: 0 }}>◆</span>
                              <p className={`${fontClass(typo.bodyFont)} font-light leading-snug`} style={{ fontSize: '13px', color: typo.bodyColor }}>{s}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Divisor central */}
                    {hasFoto && hasVideo && (
                      <div className="w-px self-stretch my-2" style={{ background: `${typo.accentColor}15` }} />
                    )}

                    {/* Vídeo */}
                    {hasVideo && (
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-[9px] tracking-[0.45em] uppercase" style={{ color: `${typo.accentColor}70` }}>Vídeo</span>
                          <div className="flex-1 h-px" style={{ background: `${typo.accentColor}20` }} />
                        </div>
                        <div className="flex flex-col gap-2.5">
                          {(proposta.servicos_video || []).map((s, i) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <span style={{ color: typo.accentColor, fontSize: '0.5rem', marginTop: '5px', flexShrink: 0 }}>◆</span>
                              <p className={`${fontClass(typo.bodyFont)} font-light leading-snug`} style={{ fontSize: '13px', color: typo.bodyColor }}>{s}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                    <p className="text-[10px] tracking-[0.4em] uppercase" style={{ color: typo.bodyColor }}>Serviços a definir no CRM</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }

      case 'cta': return (
        <div className="flex flex-col items-center justify-center h-full text-center px-8 gap-8">
          <p className="text-[11px] tracking-[0.45em]" style={{ color: `${typo.accentColor}66` }}>&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</p>
          <p className={`${fontClass(typo.bodyFont)} text-2xl sm:text-3xl italic font-light`} style={{ color: typo.bodyColor }}>{pp.ctaText}</p>
          <a href={`/r/${token}`}
            className="flex items-center gap-3 px-10 py-4 text-[10px] tracking-[0.4em] uppercase transition-all hover:scale-[1.03]"
            style={{ background: `${typo.accentColor}1F`, border: `0.5px solid ${typo.accentColor}73`, color: typo.accentColor }}>
            ← Voltar à página
          </a>
        </div>
      )

      default: return null
    }
  }

  // ── Main presentation ─────────────────────────────────────────────────────
  return (
    <div className="relative w-full overflow-hidden" style={{ height: '100dvh', background: '#0a0a0a' }}>

      {/* Fundo degradé */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #0e0b07 0%, #1a1206 30%, #0e0b07 70%, #060504 100%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 75% 65% at 50% 48%, rgba(201,168,76,0.18) 0%, rgba(160,120,40,0.07) 45%, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 40% 40% at 50% 48%, rgba(232,180,60,0.08) 0%, transparent 60%)' }} />

      {/* Admin bar */}
      {isAdmin && (
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black/70 backdrop-blur-sm border-b border-white/5">
          <a href={`/r/${token}`} className="text-[10px] tracking-widest text-white/25 hover:text-white/50 transition-colors uppercase">‹ Página</a>
          <span className="text-[10px] tracking-widest text-white/15 uppercase">Admin · Proposta</span>
          <button onClick={() => setEditorOpen(true)}
            className="text-[10px] px-2.5 py-1 border border-gold/30 rounded text-gold/70 hover:text-gold transition-all uppercase tracking-wider">
            ✎ Editar
          </button>
        </div>
      )}

      {/* Logo topo — slides 1 a N */}
      {current > 0 && (
        <div className={`absolute left-0 right-0 flex justify-center z-20 pointer-events-none ${isAdmin ? 'top-11' : 'top-5'}`}>
          <img src={`${IMG_BASE}/logo_rl_gold.png`} alt="RL" className="w-20 opacity-70" />
        </div>
      )}

      {/* Slide atual */}
      <div className={`absolute inset-0 flex items-center justify-center ${isAdmin ? 'pt-9' : ''}`}>
        <SlideIn key={current} dir={direction}>
          <div className="w-full h-full flex items-center justify-center">
            {renderSlide(slides[current])}
          </div>
        </SlideIn>
      </div>

      {/* Seta esquerda */}
      <button onClick={prev} disabled={current === 0}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 rounded-full transition-all disabled:opacity-0 disabled:pointer-events-none"
        style={{ background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.25)', color: 'rgba(201,168,76,0.7)' }}
        aria-label="Anterior">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>

      {/* Seta direita */}
      <button onClick={next} disabled={current === total - 1}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 rounded-full transition-all disabled:opacity-0 disabled:pointer-events-none"
        style={{ background: 'rgba(201,168,76,0.08)', border: '0.5px solid rgba(201,168,76,0.25)', color: 'rgba(201,168,76,0.7)' }}
        aria-label="Próximo">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 18l6-6-6-6"/>
        </svg>
      </button>

      {/* Dots — indicador de posição */}
      <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-2 z-30">
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width:   i === current ? '20px' : '6px',
              height:  '6px',
              background: i === current ? '#C9A84C' : 'rgba(201,168,76,0.25)',
            }}
          />
        ))}
      </div>

      {/* Contador */}
      <p className="absolute bottom-6 right-6 text-[10px] tracking-widest z-30" style={{ color: 'rgba(201,168,76,0.3)' }}>
        {current + 1} / {total}
      </p>

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
            {/* Tabs */}
            <div className="flex border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {(['tipografia','texto'] as const).map(t => (
                <button key={t} onClick={() => setEditorTab(t)}
                  className="flex-1 py-2.5 text-[10px] tracking-[0.2em] uppercase transition-all"
                  style={{ color: editorTab === t ? '#C9A84C' : 'rgba(255,255,255,0.25)', borderBottom: editorTab === t ? '1px solid #C9A84C' : '1px solid transparent' }}>
                  {t === 'tipografia' ? 'Tipografia' : 'Texto'}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              {editorTab === 'tipografia' && <>
                <p className="text-[9px] tracking-[0.3em] text-white/20 uppercase">Título (slide capa)</p>
                <Field label="Tipo de letra">
                  <FontPicker value={typo.titleFont} onChange={v => setTypo('titleFont', v)} />
                </Field>
                <Field label="Tamanho">
                  <SizePicker value={typo.titleSize} onChange={v => setTypo('titleSize', v)} />
                </Field>
                <Field label="Cor">
                  <ColorPicker value={typo.titleColor} onChange={v => setTypo('titleColor', v)} />
                </Field>

                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <p className="text-[9px] tracking-[0.3em] text-white/20 uppercase">Corpo / Introdução</p>
                <Field label="Tipo de letra">
                  <FontPicker value={typo.bodyFont} onChange={v => setTypo('bodyFont', v)} />
                </Field>
                <Field label="Cor">
                  <ColorPicker value={typo.bodyColor} onChange={v => setTypo('bodyColor', v)} />
                </Field>

                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <p className="text-[9px] tracking-[0.3em] text-white/20 uppercase">Nome dos pacotes</p>
                <Field label="Tipo de letra">
                  <FontPicker value={typo.pkgTitleFont} onChange={v => setTypo('pkgTitleFont', v)} />
                </Field>
                <Field label="Cor">
                  <ColorPicker value={typo.pkgTitleColor} onChange={v => setTypo('pkgTitleColor', v)} />
                </Field>

                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <p className="text-[9px] tracking-[0.3em] text-white/20 uppercase">Cor de destaque</p>
                <Field label="Dourado / Accent">
                  <ColorPicker value={typo.accentColor} onChange={v => setTypo('accentColor', v)} />
                </Field>
              </>}

              {editorTab === 'texto' && <>
                <Field label="Subtítulo (capa)">
                  <TInput value={pp.subtitle} onChange={v => setPage('subtitle', v)} />
                </Field>
                <Field label="Texto de introdução">
                  <TInput value={pp.intro} onChange={v => setPage('intro', v)} multiline />
                </Field>

                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <p className="text-[9px] tracking-[0.3em] text-white/20 uppercase">Slide "Sobre mim"</p>
                <Field label="Foto (slide 2)">
                  <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs cursor-pointer transition-all ${uploadingAbout ? 'opacity-50 pointer-events-none' : ''}`}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)' }}>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleAboutUpload(f) }} />
                    {uploadingAbout ? '⏳ A carregar...' : pp.about?.photo ? '✓ Trocar foto' : '⬆ Carregar foto'}
                  </label>
                  {pp.about?.photo && (
                    <div className="relative mt-1 rounded-lg overflow-hidden" style={{ height: '90px' }}>
                      <img src={pp.about.photo} alt="" className="w-full h-full object-cover opacity-70" />
                      <button onClick={() => setAbout('photo', '')}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                        style={{ background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.5)' }}>✕</button>
                    </div>
                  )}
                </Field>
                <Field label="Título">
                  <TInput value={pp.about?.title || ''} onChange={v => setAbout('title', v)} placeholder="Sobre Nós" />
                </Field>
                <Field label="Posição do título">
                  <div className="grid grid-cols-3 gap-1">
                    {([
                      ['top-left','↖'],['top-center','↑'],['top-right','↗'],
                      ['mid-left','←'],['mid-center','·'],['mid-right','→'],
                      ['bot-left','↙'],['bot-center','↓'],['bot-right','↘'],
                    ] as [string,string][]).map(([pos, arrow]) => (
                      <button key={pos} onClick={() => setAbout('titlePos', pos)}
                        className="py-2 rounded text-sm transition-all"
                        style={(pp.about?.titlePos || 'top-right') === pos
                          ? { background: 'rgba(201,168,76,0.2)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' }
                          : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {arrow}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="URL do vídeo (YouTube / Vimeo)">
                  <TInput value={pp.about?.videoUrl || ''} onChange={v => setAbout('videoUrl', v)} placeholder="https://youtu.be/..." />
                </Field>

                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <p className="text-[9px] tracking-[0.3em] text-white/20 uppercase">Slide Relive Wedding</p>
                <Field label="Imagem (PNG sem fundo)">
                  <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs cursor-pointer transition-all ${uploadingRelive ? 'opacity-50 pointer-events-none' : ''}`}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)' }}>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleReliveUpload(f) }} />
                    {uploadingRelive ? '⏳ A carregar...' : pp.relive?.imageUrl ? '✓ Trocar imagem' : '⬆ Carregar imagem'}
                  </label>
                </Field>
                <Field label="URL do botão ACEDER">
                  <TInput value={pp.relive?.buttonUrl || ''} onChange={v => setRelive('buttonUrl', v)} placeholder="https://relive.wedding/..." />
                </Field>

                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <p className="text-[9px] tracking-[0.3em] text-white/20 uppercase">Propostas</p>
                <p className="text-[11px] text-white/30 leading-relaxed">Os serviços e valores são definidos na ficha do CRM. Seleciona qual a proposta em destaque:</p>
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <button key={i} onClick={() => setPage('propostaAtiva', i)}
                      className="flex-1 py-2 rounded-lg text-xs transition-all"
                      style={(pp.propostaAtiva ?? 0) === i
                        ? { background: 'rgba(201,168,76,0.2)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' }
                        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {content.propostas?.[i]?.nome || `Proposta ${['1','2','3'][i]}`}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {[0,1,2].map(i => {
                    const p = content.propostas?.[i]
                    const sf = p?.servicos_foto?.filter(Boolean) || []
                    const sv = p?.servicos_video?.filter(Boolean) || []
                    return (
                      <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-[10px] tracking-widest text-white/25 uppercase mb-1">{p?.nome || `Proposta ${['1','2','3'][i]}`}</p>
                        {sf.length > 0 && <><p className="text-[9px] text-white/20 mt-1">📷 Foto</p>{sf.map((s, j) => <p key={j} className="text-[11px] text-white/35 ml-2">◆ {s}</p>)}</>}
                        {sv.length > 0 && <><p className="text-[9px] text-white/20 mt-1">🎥 Vídeo</p>{sv.map((s, j) => <p key={j} className="text-[11px] text-white/35 ml-2">◆ {s}</p>)}</>}
                        {p?.valor && <p className="text-[11px] text-gold/60 mt-1 font-mono">{p.valor}</p>}
                        {!sf.length && !sv.length && <p className="text-[11px] text-white/20 italic">Sem serviços — define no CRM</p>}
                      </div>
                    )
                  })}
                </div>
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <Field label="Texto final (CTA)">
                  <TInput value={pp.ctaText} onChange={v => setPage('ctaText', v)} />
                </Field>
              </>}
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
