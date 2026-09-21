'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { DEFAULT_CONTENT, PageContent, Proposta, ExtraServico, FONTS, TITLE_SIZES } from '../LeadPageClient'
import { CSS_BRIEFING } from '../../../_briefing/estilo'

const IMG_BASE = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images'
const MASTER_TOKEN = '85343645-b0d3-4412-ae78-795fd7f8ddf1'

// Cada slide é uma cena, como no briefing /nova-lead: etiqueta em mono e
// um título em romano com a ênfase em itálico dourado.
const CENAS: Record<string, { cena: string; titulo: string; em: string }> = {
  cover:   { cena: 'Antes de rodar', titulo: 'Proposta',            em: 'criativa'     },
  about:   { cena: 'Cena 01',        titulo: 'Quem está',           em: 'atrás da câmara' },
  intro:   { cena: 'Cena 02',        titulo: 'Quem são os',         em: 'nossos noivos' },
  relive:  { cena: 'Cena 03',        titulo: 'O vosso',             em: 'portal'       },
  blank:   { cena: 'Cena 04',        titulo: 'Como imaginam',       em: 'o vosso dia'  },
  blank2:  { cena: 'Cena 05',        titulo: 'O grande',            em: 'dia'          },
  invest:  { cena: 'Cena 06',        titulo: 'O',                   em: 'investimento' },
  'pkg-0': { cena: 'Proposta 01',    titulo: 'A',                   em: 'primeira'     },
  'pkg-1': { cena: 'Proposta 02',    titulo: 'A',                   em: 'segunda'      },
  'pkg-2': { cena: 'Proposta 03',    titulo: 'A',                   em: 'terceira'     },
  final:   { cena: 'Cena 07',        titulo: 'Fica para',           em: 'sempre'       },
  cta:     { cena: 'Ficha técnica',  titulo: 'Informações',         em: 'gerais'       },
  contact: { cena: 'Fim',            titulo: 'Vamos contar esta',   em: 'história'     },
}

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
    propostas:       saved.propostas       || DEFAULT_CONTENT.propostas,
    extras_proposta: saved.extras_proposta || [],
    propostaPage: { ...DEFAULT_CONTENT.propostaPage, ...(saved.propostaPage || {}), about: { ...DEFAULT_CONTENT.propostaPage.about, ...(saved.propostaPage?.about || {}) }, relive: { ...DEFAULT_CONTENT.propostaPage.relive, ...(saved.propostaPage?.relive || {}) }, couple: { ...DEFAULT_CONTENT.propostaPage.couple, ...(saved.propostaPage?.couple || {}) }, reflexao: { ...DEFAULT_CONTENT.propostaPage.reflexao, ...(saved.propostaPage?.reflexao || {}) }, final: { ...DEFAULT_CONTENT.propostaPage.final, ...(saved.propostaPage?.final || {}) }, slidePhotos: { ...(saved.propostaPage?.slidePhotos || {}) }, grandeDia: { ...DEFAULT_CONTENT.propostaPage.grandeDia, ...(saved.propostaPage?.grandeDia || {}) }, packages: saved.propostaPage?.packages || DEFAULT_CONTENT.propostaPage.packages, propostaAtiva: saved.propostaPage?.propostaAtiva ?? 0, typography: { ...DEFAULT_CONTENT.propostaPage.typography, ...(saved.propostaPage?.typography || {}) } },
  }
}

// ── Slide transition wrapper ──────────────────────────────────────────────────
function SlideIn({ children, dir }: { children: React.ReactNode; dir: 'right' | 'left' }) {
  const [vis, setVis] = useState(false)
  useEffect(() => { const t = setTimeout(() => setVis(true), 20); return () => clearTimeout(t) }, [])
  const ease = 'cubic-bezier(0.22,1,0.36,1)'
  return (
    <div style={{
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateX(0px) scale(1)' : `translateX(${dir === 'right' ? '64px' : '-64px'}) scale(0.986)`,
      filter: vis ? 'blur(0px)' : 'blur(7px)',
      transition: `opacity 0.7s ${ease}, transform 0.7s ${ease}, filter 0.7s ${ease}`,
      height: '100%',
      width: '100%',
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

function parseValorNum(v: string): number {
  if (!v) return 0
  return parseFloat(v.replace(/€/g, '').replace(/\s+/g, '').replace(',', '.')) || 0
}
function formatValorNum(n: number): string {
  if (n === 0) return ''
  return n.toLocaleString('pt-PT') + ' €'
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

  // Slides
  const [current,   setCurrent]   = useState(0)
  const [direction, setDirection] = useState<'right' | 'left'>('right')
  const [extrasOpen,     setExtrasOpen]     = useState<Record<number, boolean>>({})
  const [extrasSelected, setExtrasSelected] = useState<Record<number, string[]>>({})
  const [formaOpen,      setFormaOpen]      = useState<Record<number, boolean>>({})
  const [escolhida,      setEscolhida]      = useState<number | null>(null)
  const [videoOn,        setVideoOn]        = useState(false)

  // Editor
  const [editorOpen,    setEditorOpen]    = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [publishing,    setPublishing]    = useState(false)
  const [published,     setPublished]     = useState(false)
  const [editorTab,     setEditorTab]     = useState<'tipografia'|'texto'>('tipografia')
  const [uploadingAbout,  setUploadingAbout]  = useState(false)
  const [uploadingRelive, setUploadingRelive] = useState(false)
  const [uploadingSlidePhoto, setUploadingSlidePhoto] = useState<string | null>(null)

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

  const slides = ['cover', 'about', 'intro', 'relive', 'blank', 'blank2', 'invest', 'pkg-0', 'pkg-1', 'pkg-2', 'final', 'cta', 'contact']
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

  const handlePublish = async () => {
    setPublishing(true)
    // 1. Save master first
    await fetch('/api/lead-page/save-content', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, page_content: content }),
    })
    // 2. Sync design to all other proposals
    await fetch('/api/lead-page/sync-template', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
    })
    setPublished(true); setTimeout(() => setPublished(false), 3000); setPublishing(false)
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
  const handleSlidePhotoUpload = async (slideId: string, file: File) => {
    setUploadingSlidePhoto(slideId)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setContent(c => {
          const newContent = { ...c, propostaPage: { ...c.propostaPage, slidePhotos: { ...(c.propostaPage.slidePhotos || {}), [slideId]: data.url } } }
          // Auto-save immediately so photo persists after refresh
          fetch('/api/lead-page/save-content', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, page_content: newContent }),
          })
          return newContent
        })
      }
    } catch {}
    setUploadingSlidePhoto(null)
  }
  function clearSlidePhoto(slideId: string) {
    setContent(c => {
      const sp = { ...(c.propostaPage.slidePhotos || {}) }
      delete sp[slideId]
      const newContent = { ...c, propostaPage: { ...c.propostaPage, slidePhotos: sp } }
      // Auto-save so removal persists
      fetch('/api/lead-page/save-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, page_content: newContent }),
      })
      return newContent
    })
  }
  function setGrandeDia(k: keyof PageContent['propostaPage']['grandeDia'], v: string) {
    setContent(c => ({ ...c, propostaPage: { ...c.propostaPage, grandeDia: { ...c.propostaPage.grandeDia, [k]: v } } }))
  }
  const handleGrandeDiaUpload = async (file: File) => {
    setUploadingRelive(true)
    const fd = new FormData(); fd.append('file', file)
    const r = await fetch('/api/upload-image', { method: 'POST', body: fd })
    const d = await r.json()
    if (d.url) setGrandeDia('imageUrl', d.url)
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
    <main className="min-h-screen flex items-center justify-center bg-[#0b0a08]">
      <p className="text-white/20 tracking-[0.3em] text-xs uppercase animate-pulse">A carregar...</p>
    </main>
  )
  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center bg-[#0b0a08]">
      <p className="text-white/20 tracking-[0.3em] text-xs uppercase">Página não disponível</p>
    </main>
  )

  // ── Password gate ─────────────────────────────────────────────────────────
  if (locked) return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: '#0b0a08' }}>
      <div className="w-full max-w-sm">
        <div className="relative" style={{ border: '0.5px solid rgba(201,168,76,0.3)', background: 'linear-gradient(135deg, #1c1408 0%, #0f0c07 50%, #1c1408 100%)' }}>
          <div className="absolute top-0 left-0 w-8 h-8"  style={{ borderTop: '1px solid rgba(201,168,76,0.6)', borderLeft:  '1px solid rgba(201,168,76,0.6)' }} />
          <div className="absolute top-0 right-0 w-8 h-8" style={{ borderTop: '1px solid rgba(201,168,76,0.6)', borderRight: '1px solid rgba(201,168,76,0.6)' }} />
          <div className="absolute bottom-0 left-0 w-8 h-8"  style={{ borderBottom: '1px solid rgba(201,168,76,0.6)', borderLeft:  '1px solid rgba(201,168,76,0.6)' }} />
          <div className="absolute bottom-0 right-0 w-8 h-8" style={{ borderBottom: '1px solid rgba(201,168,76,0.6)', borderRight: '1px solid rgba(201,168,76,0.6)' }} />
          <div className="px-10 py-12 text-center flex flex-col items-center gap-6">
            <img src={`/logo_rl_gold.png`} alt="RL" className="w-12 opacity-75" />
            <p className="text-[10px] tracking-[0.45em] text-white/20 uppercase">Exclusivo</p>
            <div>
              <h1 className="font-cormorant text-3xl font-light italic text-white/90">Proposta</h1>
              <h1 className="font-cormorant text-3xl font-light italic" style={{ color: '#C9A84C' }}>Criativa</h1>
            </div>
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
        <div className="rl-in h-full w-full flex flex-col items-center justify-center text-center px-8">
          <img src={`/logo_rl_gold.png`} alt="RL Photo · Video" className="opacity-85 mb-6" style={{ width: 'clamp(112px, 19vh, 176px)' }} />
          <p className="eyebrow mb-6">{nome || 'Para vocês'}</p>
          <h1 style={{ fontSize: 'clamp(40px,5.6vw,84px)' }}>
            Proposta<br /><em>criativa</em>
          </h1>
          <div className="h-px w-12 mt-7 mb-7" style={{ background: 'var(--g)', opacity: .6 }} />
          <p className="lead" style={{ maxWidth: '440px' }}>{pp.subtitle}</p>
          <p className="hint mt-7">{total} cenas &middot; setas para avançar</p>
        </div>
      )

      case 'about': return (
        <div className="relative h-full w-full flex items-center justify-center px-10 sm:px-16">

          {/* Título — posição editável */}
          <div className="absolute" style={titlePosStyle(pp.about?.titlePos || 'top-right', isAdmin)}>
            <h2 
              style={{ fontSize: 'clamp(2rem,4vw,3.4rem)', color: typo.titleColor, lineHeight: 1.1, whiteSpace: 'nowrap' }}>
              {pp.about?.title || 'Sobre Nós'}
            </h2>
            <div className="mt-2" style={{ width: '36px', height: '1px', background: `${typo.accentColor}66`, marginLeft: 'auto' }} />
          </div>

          {/* Conteúdo: foto + vídeo — tamanhos iguais */}
          <div className="flex flex-row items-center gap-10 sm:gap-16 w-full max-w-7xl justify-center">

            {/* Foto vertical */}
            <div className="relative flex-shrink-0" style={{ width: 'clamp(220px,26vw,400px)', height: 'clamp(320px,52vh,560px)' }}>
              <div className="absolute -top-2 -left-2 w-6 h-6" style={{ borderTop: `1px solid ${typo.accentColor}`, borderLeft: `1px solid ${typo.accentColor}` }} />
              <div className="absolute -top-2 -right-2 w-6 h-6" style={{ borderTop: `1px solid ${typo.accentColor}`, borderRight: `1px solid ${typo.accentColor}` }} />
              <div className="absolute -bottom-2 -left-2 w-6 h-6" style={{ borderBottom: `1px solid ${typo.accentColor}`, borderLeft: `1px solid ${typo.accentColor}` }} />
              <div className="absolute -bottom-2 -right-2 w-6 h-6" style={{ borderBottom: `1px solid ${typo.accentColor}`, borderRight: `1px solid ${typo.accentColor}` }} />
              {pp.about?.photo
                ? <div className="w-full h-full overflow-hidden">
                    <img src={pp.about.photo} alt="" className="rl-ken w-full h-full object-cover" />
                  </div>
                : <div className="w-full h-full" style={{ background: 'rgba(201,168,76,0.06)', border: '0.5px solid rgba(201,168,76,0.25)' }} />
              }
            </div>

            {/* Vídeo — mesmo tamanho que a foto */}
            <div className="relative flex-shrink-0" style={{ width: 'clamp(220px,26vw,400px)', height: 'clamp(320px,52vh,560px)' }}>
              <div className="absolute -top-2 -left-2 w-6 h-6 z-10" style={{ borderTop: `1px solid ${typo.accentColor}`, borderLeft: `1px solid ${typo.accentColor}` }} />
              <div className="absolute -top-2 -right-2 w-6 h-6 z-10" style={{ borderTop: `1px solid ${typo.accentColor}`, borderRight: `1px solid ${typo.accentColor}` }} />
              <div className="absolute -bottom-2 -left-2 w-6 h-6 z-10" style={{ borderBottom: `1px solid ${typo.accentColor}`, borderLeft: `1px solid ${typo.accentColor}` }} />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 z-10" style={{ borderBottom: `1px solid ${typo.accentColor}`, borderRight: `1px solid ${typo.accentColor}` }} />
              {pp.about?.videoUrl && toEmbed(pp.about.videoUrl)
                ? (videoOn
                    ? <iframe
                        src={`${toEmbed(pp.about.videoUrl)}${toEmbed(pp.about.videoUrl)!.includes('?') ? '&' : '?'}autoplay=1`}
                        className="w-full h-full"
                        style={{ border: 'none' }} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
                    : <button type="button" onClick={() => setVideoOn(true)}
                        aria-label="Reproduzir vídeo"
                        className="rl-cta w-full h-full flex flex-col items-center justify-center gap-4"
                        style={{ background: `${typo.accentColor}0A`, border: `0.5px solid ${typo.accentColor}40` }}>
                        <span className="flex items-center justify-center rounded-full"
                          style={{ width: '64px', height: '64px', border: `1px solid ${typo.accentColor}99` }}>
                          <svg width="20" height="22" viewBox="0 0 20 22" fill="none" aria-hidden="true">
                            <path d="M3 2.2v17.6L18 11 3 2.2z" fill={typo.accentColor} fillOpacity="0.85" />
                          </svg>
                        </span>
                        <span className="text-[10px] tracking-[0.35em] uppercase" style={{ color: `${typo.accentColor}AA` }}>Ver vídeo</span>
                      </button>)
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

      case 'couple': return (
        <div className="relative h-full w-full overflow-hidden">
          {pp.couple?.imageUrl && (
            <>
              <img
                src={pp.couple.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, #0a0806 25%, rgba(10,8,6,0.55) 60%, transparent 100%)' }} />
            </>
          )}
          {!pp.couple?.imageUrl && (
            <div className="absolute inset-0" style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-[10px] tracking-[0.4em] uppercase text-white/15">Carregar foto no editor →</p>
              </div>
            </div>
          )}
          <div className="relative z-10 h-full flex flex-col justify-center px-12 sm:px-20" style={{ maxWidth: '58%' }}>
            <h2 
              style={{ fontSize: 'clamp(1.4rem, 3.8vw, 3rem)', color: '#ffffff', lineHeight: 1.2 }}>
              {pp.couple?.title || 'Os nossos noivos'}
            </h2>
            <div className="mt-4 w-10 h-px" style={{ background: typo.accentColor }} />
          </div>
        </div>
      )

      case 'relive': return (
        <div className="flex items-center justify-center h-full w-full px-8 sm:px-16">
          <div className="flex flex-row items-center gap-2 sm:gap-3 w-full max-w-5xl">

            {/* Esquerda — texto */}
            <div className="rl-in flex flex-col gap-6 flex-1">
              <h2 
                style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: typo.titleColor, lineHeight: 1.1 }}>
                Portal dos <em>Noivos</em>
              </h2>
              <div className="flex flex-col gap-3">
                {[
                  'Acesso privado com e-mail e palavra-passe',
                  'Fotografias, vídeos e documentos num só lugar',
                  'Seleção de fotos e estado das entregas',
                  'Contrato, pagamentos e cronograma sempre à mão',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span style={{ color: typo.accentColor, fontSize: '0.7rem', marginTop: '3px', flexShrink: 0 }}>◆</span>
                    <p className={`${fontClass(typo.bodyFont)} font-light`} style={{ color: typo.bodyColor, fontSize: '20px' }}>{item}</p>
                  </div>
                ))}
              </div>
              <a href="/portal-cliente" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center justify-center self-start px-8 py-3 text-[11px] tracking-[0.35em] uppercase transition-all hover:scale-[1.03]"
                style={{ background: `${typo.accentColor}1F`, border: `0.5px solid ${typo.accentColor}73`, color: typo.accentColor }}>
                Aceder
              </a>
            </div>

            {/* Direita — imagem */}
            <div className="flex-shrink-0" style={{ width: 'clamp(300px,48vw,580px)' }}>
              <img src="/portal-noivos-login.webp" alt="Portal dos Noivos"
                className="w-full h-auto"
                style={{ borderRadius: '8px', border: `0.5px solid ${typo.accentColor}2E`, boxShadow: '0 18px 50px rgba(0,0,0,0.45)' }} />
            </div>
          </div>
        </div>
      )

      case 'blank2': return (
        <div className="flex items-center justify-center h-full w-full px-8 sm:px-16">
          <div className="flex flex-row items-center gap-2 sm:gap-3 w-full max-w-5xl">

            {/* Esquerda — texto */}
            <div className="rl-in flex flex-col gap-5 flex-1">
              <h2 
                style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: typo.titleColor, lineHeight: 1.1 }}>
                {pp.grandeDia?.title || 'o grande dia'}
              </h2>
              <div className="flex flex-col gap-4" style={{ fontSize: '20px', color: typo.bodyColor, opacity: 0.75, lineHeight: 1.75 }}>
                <p>{pp.grandeDia?.p1 || ''}</p>
                <p>{pp.grandeDia?.p2 || ''}</p>
                <p>{pp.grandeDia?.p3 || ''}</p>
                <p style={{ fontSize: '14px', opacity: 0.45, fontStyle: 'italic', marginTop: '4px' }}>{pp.grandeDia?.note || ''}</p>
              </div>
            </div>

            {/* Direita — imagem grande */}
            <div className="flex-shrink-0 self-stretch" style={{ width: 'clamp(200px,30vw,360px)' }}>
              {pp.grandeDia?.imageUrl
                ? <img src={pp.grandeDia.imageUrl} alt="O Grande Dia"
                    className="w-full h-full object-cover"
                    style={{ borderRadius: '8px' }} />
                : <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: '8px' }}>
                    <p className="text-[10px] tracking-widest text-white/15 uppercase">Imagem</p>
                  </div>
              }
            </div>

          </div>
        </div>
      )

      case 'blank': {
        const blankPhoto = pp.slidePhotos?.['blank'] || pp.reflexao?.imageUrl || ''
        return (
          <div className="relative h-full w-full overflow-hidden flex items-center">
            {blankPhoto && (
              <img src={blankPhoto} alt=""
                className="rl-ken-left absolute inset-0 w-full h-full object-cover object-right"
                style={{ maskImage: 'linear-gradient(to left, black 0%, black 40%, transparent 75%)', WebkitMaskImage: 'linear-gradient(to left, black 0%, black 40%, transparent 75%)' }}
              />
            )}
            <div className={`relative z-10 flex flex-col gap-8 ${blankPhoto ? 'text-left' : 'items-center text-center px-8 sm:px-20 mx-auto'}`}
              style={{ maxWidth: blankPhoto ? '52%' : '680px', paddingLeft: blankPhoto ? 'clamp(5rem, 14vw, 12rem)' : undefined }}>
              <h2 
                style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: typo.titleColor, lineHeight: 1.15 }}>
                Como imaginam <em>o vosso dia?</em>
              </h2>
              <p className="font-light leading-relaxed" style={{ fontSize: '20px', color: typo.bodyColor, opacity: 0.7 }}>
                O que é que torna este dia verdadeiramente único para vocês?<br />
                Qual é o momento, o detalhe, a emoção que não pode ficar por registar?
              </p>
            </div>
            {/* Botão upload inline — só admin */}
            {isAdmin && (
              <label className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-[10px] tracking-[0.2em] uppercase transition-all"
                style={{ background: 'rgba(201,168,76,0.12)', border: '0.5px solid rgba(201,168,76,0.4)', color: 'rgba(201,168,76,0.8)' }}>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleSlidePhotoUpload('blank', f) }} />
                {uploadingSlidePhoto === 'blank' ? '⏳' : blankPhoto ? '✦ Trocar foto' : '⬆ Foto direita'}
              </label>
            )}
          </div>
        )
      }

      case 'intro': {
        const introPhoto = pp.slidePhotos?.['intro'] || pp.couple?.imageUrl || ''
        return (
          <div className="relative h-full w-full overflow-hidden">
            {introPhoto && (
              <img src={introPhoto} alt=""
                className="rl-ken-left absolute inset-0 w-full h-full object-cover object-right"
                style={{ maskImage: 'linear-gradient(to left, black 0%, black 40%, transparent 75%)', WebkitMaskImage: 'linear-gradient(to left, black 0%, black 40%, transparent 75%)' }}
              />
            )}
            {introPhoto ? (
              <div className="relative z-10 h-full flex flex-col justify-center" style={{ maxWidth: '54%', paddingLeft: 'clamp(5rem, 14vw, 12rem)' }}>
                <p className="mb-6"
                  style={{ fontSize: 'clamp(1.5rem,3.5vw,2.6rem)', color: 'rgba(255,255,255,0.95)', lineHeight: 1.1 }}>
                  Quem são os <em>meus noivos?</em>
                </p>
                <p className={`${fontClass(typo.bodyFont)} text-xl italic font-light leading-relaxed`} style={{ color: 'rgba(255,255,255,0.85)' }}>
                  &ldquo;{pp.intro}&rdquo;
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-8 sm:px-20 gap-8 max-w-3xl mx-auto">
                <p 
                  style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: 'rgba(255,255,255,0.2)', lineHeight: 1.1 }}>
                  Quem são os <em>meus noivos?</em>
                </p>
                <p className={`${fontClass(typo.bodyFont)} text-2xl sm:text-3xl italic font-light leading-relaxed`} style={{ color: typo.bodyColor }}>
                  &ldquo;{pp.intro}&rdquo;
                </p>
              </div>
            )}
            {isAdmin && (
              <label className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-[10px] tracking-[0.2em] uppercase transition-all"
                style={{ background: 'rgba(201,168,76,0.12)', border: '0.5px solid rgba(201,168,76,0.4)', color: 'rgba(201,168,76,0.8)' }}>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleSlidePhotoUpload('intro', f) }} />
                {uploadingSlidePhoto === 'intro' ? '⏳' : introPhoto ? '✦ Trocar foto' : '⬆ Foto direita'}
              </label>
            )}
          </div>
        )
      }

      case 'invest': return (
        <div className="rl-in h-full w-full flex flex-col items-center justify-center text-center px-8">
          <h2 style={{ fontSize: 'clamp(40px,5.4vw,80px)' }}>O <em>investimento</em></h2>
          <div className="h-px w-12 mt-7 mb-7" style={{ background: 'var(--g)', opacity: .6 }} />
          <p className="lead" style={{ maxWidth: '480px' }}>
            As memórias que criamos juntos duram uma vida inteira. O valor que investem hoje é o
            retorno eterno de cada momento que nunca mais poderão reviver, apenas recordar.
          </p>
          <p className="hint mt-9">Três propostas a seguir</p>
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
        // ── extras dinâmicos ──────────────────────────────────────
        const selectedExtras = extrasSelected[idx] || []
        const toggleExtraSlide = (nome: string) =>
          setExtrasSelected(prev => {
            const cur = prev[idx] || []
            const has = cur.includes(nome)
            return { ...prev, [idx]: has ? cur.filter(n => n !== nome) : [...cur, nome] }
          })
        const extrasValorTotal = selectedExtras.reduce((sum, nome) => {
          const ex = (content.extras_proposta || []).find(e => e.nome === nome)
          return sum + parseValorNum(ex?.valor || '')
        }, 0)
        const baseValor  = parseValorNum(proposta.valor)
        const totalValor = baseValor > 0 ? baseValor + extrasValorTotal : 0
        // ── forma de investimento ─────────────────────────────────
        const ADJUDICACAO = 400
        const totalPagamento = totalValor > 0 ? totalValor : baseValor
        const restante   = totalPagamento > ADJUDICACAO ? totalPagamento - ADJUDICACAO : 0
        const reforco    = Math.round(restante * 0.8)
        const valorFinal = Math.round(restante * 0.2)
        const displayValor = selectedExtras.length > 0 && totalValor > 0
          ? formatValorNum(totalValor)
          : proposta.valor
            ? (proposta.valor.trim().includes('€') ? proposta.valor : `${proposta.valor} €`)
            : ''
        const perf = {
          width: '26px',
          flexShrink: 0,
          backgroundImage: 'repeating-linear-gradient(to bottom, rgba(243,237,226,.16) 0 10px, transparent 10px 26px)',
          backgroundSize: '12px 100%',
          backgroundRepeat: 'repeat-y',
          backgroundPosition: 'center top',
        } as React.CSSProperties
        const momentos = restante > 0
          ? [
              { v: `${ADJUDICACAO.toLocaleString('pt-PT')} €`, l: 'Hoje, reserva a data' },
              { v: `${reforco.toLocaleString('pt-PT')} €`,     l: 'Até 30 dias antes' },
              { v: `${valorFinal.toLocaleString('pt-PT')} €`,  l: 'Após o dia' },
            ]
          : []
        return (
          <div className="flex items-center justify-center h-full w-full px-3 sm:px-8">
            <div className={`relative w-full overflow-hidden ${isAtiva ? 'rl-glow' : ''}`}
              style={{
                maxWidth: '1040px',
                display: 'flex',
                border: isAtiva ? '1px solid var(--g)' : '1px solid var(--line)',
                background: 'rgba(216,190,147,0.018)',
                transition: 'border-color .45s var(--ease)',
              }}>

              {/* Perfuração esquerda */}
              <div className="hidden sm:block" style={{ ...perf, borderRight: '1px solid var(--line-soft)' }} aria-hidden="true" />

              <div className="flex-1 min-w-0 relative">

                {/* Numeral gigante em contorno, cortado pela moldura */}
                <span aria-hidden="true" style={{
                  position: 'absolute', right: '-18px', top: '-46px', zIndex: 0,
                  fontFamily: 'var(--fs)', fontStyle: 'italic', fontWeight: 300,
                  fontSize: 'clamp(150px,30vh,300px)', lineHeight: 1,
                  color: 'transparent', WebkitTextStroke: '1px rgba(216,190,147,.13)',
                  pointerEvents: 'none', userSelect: 'none',
                }}>{labels[idx]}</span>

                {/* Cabeçalho do fotograma */}
                <div className="relative flex items-center justify-between gap-4 px-5 sm:px-9"
                  style={{ zIndex: 1, height: 'clamp(40px,5.2vh,50px)', borderBottom: '1px solid var(--line-soft)' }}>
                  <p className="meta" style={{ color: 'var(--g)' }}>
                    {proposta.nome || `Proposta ${labels[idx]}`}
                  </p>
                  {isAtiva
                    ? <span className="meta" style={{ color: 'var(--ink)', background: 'var(--g)', padding: '5px 12px' }}>A mais escolhida</span>
                    : <span className="meta">Fotograma {labels[idx]} de 3</span>}
                </div>

                {/* O preço é o herói */}
                <div className="relative px-5 sm:px-9 flex flex-wrap items-end justify-between gap-x-10 gap-y-5"
                  style={{ paddingTop: 'clamp(13px,2.4vh,21px)', paddingBottom: 'clamp(13px,2.4vh,21px)', zIndex: 1, borderBottom: '1px solid var(--line-soft)' }}>
                  <div>
                    <p className="meta mb-2">{selectedExtras.length > 0 ? 'Total com extras' : 'Investimento total'}</p>
                    <p style={{ fontFamily: 'var(--fs)', fontWeight: 300, fontSize: 'clamp(44px,6.8vh,78px)', lineHeight: .88, color: 'var(--g)' }}>
                      {displayValor || 'Sob consulta'}
                    </p>
                    {selectedExtras.length > 0 && baseValor > 0 && (
                      <p className="hint mt-3">
                        base {proposta.valor.trim().includes('€') ? proposta.valor : `${proposta.valor} €`} mais {selectedExtras.length} extra{selectedExtras.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>

                  {/* Os três momentos, à vista em vez de escondidos */}
                  {momentos.length > 0 && (
                    <div className="flex items-stretch">
                      {momentos.map((m, i) => (
                        <div key={i} className="px-4 sm:px-5 first:pl-0 last:pr-0"
                          style={{ borderRight: i < 2 ? '1px solid var(--line-soft)' : 'none' }}>
                          <p style={{ fontFamily: 'var(--fs)', fontSize: 'clamp(19px,2.7vh,25px)', lineHeight: 1.1, color: 'var(--tx)' }}>{m.v}</p>
                          <p className="hint mt-1.5" style={{ maxWidth: '96px', lineHeight: 1.45 }}>{m.l}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Créditos: o que entra */}
                <div className="relative px-5 sm:px-9" style={{ paddingTop: 'clamp(13px,2.2vh,21px)', paddingBottom: 'clamp(13px,2.2vh,21px)', zIndex: 1, borderBottom: '1px solid var(--line-soft)' }}>
                  {hasAny ? (
                    <div className="flex gap-7 sm:gap-10">
                      {hasFoto && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="meta" style={{ color: 'var(--g)' }}>Fotografia</span>
                            <div className="flex-1 h-px" style={{ background: 'var(--line-soft)' }} />
                          </div>
                          <ul className="flex flex-col" style={{ gap: 'clamp(4px,0.85vh,8px)' }}>
                            {(proposta.servicos_foto || []).map((s, i) => (
                              <li key={i} style={{ fontFamily: 'var(--fd)', fontWeight: 300, fontSize: 'clamp(13px,1.85vh,15px)', lineHeight: 1.4, color: 'var(--tx-mid)' }}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {hasFoto && hasVideo && <div className="w-px self-stretch" style={{ background: 'var(--line-soft)' }} />}
                      {hasVideo && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-4">
                            <span className="meta" style={{ color: 'var(--g)' }}>Vídeo</span>
                            <div className="flex-1 h-px" style={{ background: 'var(--line-soft)' }} />
                          </div>
                          <ul className="flex flex-col" style={{ gap: 'clamp(4px,0.85vh,8px)' }}>
                            {(proposta.servicos_video || []).map((s, i) => (
                              <li key={i} style={{ fontFamily: 'var(--fd)', fontWeight: 300, fontSize: 'clamp(13px,1.85vh,15px)', lineHeight: 1.4, color: 'var(--tx-mid)' }}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="hint text-center">Serviços a definir no CRM</p>
                  )}

                  {proposta.notas && (
                    <p className="hint mt-5" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{proposta.notas}</p>
                  )}
                </div>

                {/* Rodapé: extras e decisão */}
                <div className="relative px-5 sm:px-9 flex flex-col gap-3" style={{ paddingTop: 'clamp(11px,1.9vh,18px)', paddingBottom: 'clamp(11px,1.9vh,18px)', zIndex: 1 }}>
                  <button type="button"
                    onClick={() => setExtrasOpen(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className="flex items-center gap-3 w-full text-left"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <span className="meta" style={{ color: 'var(--g)' }}>Serviços extras</span>
                    {selectedExtras.length > 0 && (
                      <span className="meta" style={{ color: 'var(--ink)', background: 'var(--g)', padding: '2px 8px' }}>{selectedExtras.length}</span>
                    )}
                    <span className="flex-1 h-px" style={{ background: 'var(--line-soft)' }} />
                    <span className="meta">{extrasOpen[idx] ? 'Fechar' : 'Abrir'}</span>
                  </button>

                  {extrasOpen[idx] && (
                    <div className="flex flex-wrap gap-2">
                      {(content.extras_proposta || []).length > 0
                        ? (content.extras_proposta || []).map((e, i) => (
                            <button key={i} type="button" onClick={() => toggleExtraSlide(e.nome)}
                              className={`pill${selectedExtras.includes(e.nome) ? ' on' : ''}`}>
                              {e.nome}
                            </button>
                          ))
                        : <p className="hint">Sem serviços extras definidos</p>}
                    </div>
                  )}

                  {escolhida === idx ? (
                    <a href={`/r/${token}`} className="btn mt-1" style={{ width: '100%' }}>
                      <span className="fill" />
                      Escolhida &middot; confirmar
                    </a>
                  ) : (
                    <button type="button" onClick={() => setEscolhida(idx)} className="btn mt-1" style={{ width: '100%' }}>
                      <span className="fill" />
                      Escolher esta proposta
                    </button>
                  )}
                </div>
              </div>

              {/* Perfuração direita */}
              <div className="hidden sm:block" style={{ ...perf, borderLeft: '1px solid var(--line-soft)' }} aria-hidden="true" />
            </div>
          </div>
        )
      }

      case 'cta': return (
        <div className="flex items-center justify-center h-full w-full px-8 sm:px-16 py-8">
          <div className="rl-in w-full max-w-5xl flex flex-col gap-6">

            <h2 
              style={{ fontSize: 'clamp(1.6rem,3.5vw,2.8rem)', color: typo.titleColor, lineHeight: 1.1 }}>
              Informações <em>gerais</em>
            </h2>

            <div className="h-px" style={{ background: `${typo.accentColor}25` }} />

            <ul className="flex flex-col gap-2.5" style={{ fontSize: '20px', color: typo.bodyColor, opacity: 0.75, lineHeight: 1.65 }}>
              <li className="flex gap-2"><span style={{ color: typo.accentColor, flexShrink: 0 }}>–</span><span>Adjudicação no valor de <strong style={{ color: typo.accentColor, fontWeight: 500 }}>400€</strong>;</span></li>
              <li className="flex gap-2"><span style={{ color: typo.accentColor, flexShrink: 0 }}>–</span><span><strong style={{ color: typo.accentColor, fontWeight: 500 }}>80%</strong> do valor em falta até 48 horas antes do evento, <strong style={{ color: typo.accentColor, fontWeight: 500 }}>10%</strong> na edição do vídeo, <strong style={{ color: typo.accentColor, fontWeight: 500 }}>10%</strong> na entrega de seleção de fotografias;</span></li>
              <li className="flex gap-2"><span style={{ color: typo.accentColor, flexShrink: 0 }}>–</span><span>Entrega de fotografias para seleção <strong style={{ color: typo.accentColor, fontWeight: 500 }}>30 dias úteis</strong> após o evento;</span></li>
              <li className="flex gap-2"><span style={{ color: typo.accentColor, flexShrink: 0 }}>–</span><span>Entrega até um prazo estimado de <strong style={{ color: typo.accentColor, fontWeight: 500 }}>180 dias úteis</strong>;</span></li>
              <li className="flex gap-2"><span style={{ color: typo.accentColor, flexShrink: 0 }}>–</span><span>Entrega do vídeo e fotografias com resolução máxima por link online;</span></li>
              <li className="flex gap-2"><span style={{ color: typo.accentColor, flexShrink: 0 }}>–</span><span>Direito a <strong style={{ color: typo.accentColor, fontWeight: 500 }}>três alterações</strong> de uma só vez após a entrega final;</span></li>
              <li className="flex gap-2"><span style={{ color: typo.accentColor, flexShrink: 0 }}>–</span><span>A refeição da equipa na quinta tem de ser assegurada pelos noivos;</span></li>
              <li className="flex gap-2"><span style={{ color: typo.accentColor, flexShrink: 0 }}>–</span><span>Orçamento com validade de <strong style={{ color: typo.accentColor, fontWeight: 500 }}>30 dias</strong> após envio;</span></li>
              <li className="flex gap-2" style={{ opacity: 0.45, fontSize: '14px', fontStyle: 'italic' }}><span style={{ color: typo.accentColor, flexShrink: 0 }}>*</span><span>Duração: permanecemos no local até acharmos que registámos todos os momentos para vos poder entregar um bom vídeo.</span></li>
              <li className="flex gap-2" style={{ opacity: 0.45, fontSize: '14px', fontStyle: 'italic' }}><span style={{ color: typo.accentColor, flexShrink: 0 }}>*</span><span>Deslocação: casamentos fora da zona de Setúbal/Almada/Montijo será cobrado valor extra.</span></li>
            </ul>

            <div className="h-px" style={{ background: `${typo.accentColor}25` }} />

            <a href={`/r/${token}`}
              className="self-start flex items-center gap-3 px-8 py-3 text-[10px] tracking-[0.4em] uppercase transition-all hover:scale-[1.03]"
              style={{ background: `${typo.accentColor}1F`, border: `0.5px solid ${typo.accentColor}73`, color: typo.accentColor }}>
              ← Voltar à página
            </a>

          </div>
        </div>
      )

      case 'contact': return (
        <div className="relative flex items-center w-full h-full overflow-hidden" style={{ paddingLeft: 'clamp(5rem, 14vw, 12rem)', paddingRight: 'clamp(3rem, 8vw, 7rem)' }}>

          {/* Decoração floral canto inferior direito */}
          <svg className="absolute bottom-0 right-0 pointer-events-none select-none" width="480" height="420" viewBox="0 0 260 220" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.18 }}>
            <g stroke={typo.accentColor} strokeWidth="0.8" fill="none">
              <path d="M220 210 Q180 160 140 120 Q100 80 60 30" strokeWidth="1"/>
              <path d="M220 210 Q200 170 170 150 Q140 130 120 100" strokeWidth="0.8"/>
              <path d="M140 120 Q155 100 170 95 Q185 90 195 80"/>
              <path d="M140 120 Q125 100 110 98 Q95 96 85 85"/>
              <path d="M170 150 Q185 135 198 130 Q210 125 218 115"/>
              <path d="M170 150 Q158 133 148 130"/>
              <path d="M100 80 Q115 65 128 62 Q140 58 148 48"/>
              <path d="M100 80 Q88 65 78 63 Q68 60 58 50"/>
              <circle cx="196" cy="79" r="3"/><circle cx="196" cy="79" r="6" strokeWidth="0.5"/>
              <circle cx="85" cy="84" r="3"/><circle cx="85" cy="84" r="6" strokeWidth="0.5"/>
              <circle cx="149" cy="47" r="3"/><circle cx="149" cy="47" r="6" strokeWidth="0.5"/>
              <circle cx="218" cy="114" r="2.5"/><circle cx="218" cy="114" r="5" strokeWidth="0.5"/>
              <circle cx="57" cy="49" r="2.5"/><circle cx="57" cy="49" r="5" strokeWidth="0.5"/>
              <ellipse cx="160" cy="108" rx="6" ry="3" transform="rotate(-40 160 108)" strokeWidth="0.6"/>
              <ellipse cx="122" cy="108" rx="6" ry="3" transform="rotate(40 122 108)" strokeWidth="0.6"/>
              <ellipse cx="185" cy="142" rx="6" ry="3" transform="rotate(-30 185 142)" strokeWidth="0.6"/>
              <ellipse cx="110" cy="65" rx="5" ry="2.5" transform="rotate(-50 110 65)" strokeWidth="0.6"/>
            </g>
          </svg>

          {/* Left — text content */}
          <div className="rl-in flex flex-col gap-6 flex-1">
            <h2 
              style={{ fontSize: 'clamp(1.8rem,4vw,3.2rem)', color: typo.titleColor, lineHeight: 1.1 }}>
              Vamos contar<br />esta história<br /><em>juntos?</em>
            </h2>

            {/* divider */}
            <div className="flex items-center gap-3" style={{ maxWidth: '260px' }}>
              <div className="flex-1 h-px" style={{ background: `${typo.accentColor}40` }} />
              <span className="text-[8px]" style={{ color: `${typo.accentColor}80` }}>&#9670;</span>
              <div className="flex-1 h-px" style={{ background: `${typo.accentColor}40` }} />
            </div>

            <p className="font-light leading-relaxed" style={{ fontSize: 'clamp(0.85rem,1.4vw,1.1rem)', color: typo.bodyColor, opacity: 0.75, maxWidth: '380px' }}>
              Será uma honra fazer parte deste dia tão especial e transformar cada momento em memórias que ficam para sempre.
            </p>

            <div className="flex flex-col gap-2 mt-2">
              <a href="https://www.rlphotovideo.pt" target="_blank" rel="noopener noreferrer"
                className="font-light tracking-[0.12em] hover:opacity-80 transition-opacity"
                style={{ fontSize: 'clamp(0.8rem,1.3vw,1rem)', color: typo.accentColor }}>
                www.rlphotovideo.pt
              </a>
              <a href="tel:912932768" className="font-light tracking-[0.15em] hover:opacity-80 transition-opacity"
                style={{ fontSize: 'clamp(0.8rem,1.3vw,1rem)', color: typo.bodyColor, opacity: 0.75 }}>
                912 932 768
              </a>
              <p className="font-light tracking-[0.2em]"
                style={{ fontSize: 'clamp(0.75rem,1.2vw,0.95rem)', color: typo.bodyColor, opacity: 0.4 }}>
                Pinhal Novo · Palmela
              </p>
            </div>
          </div>

          {/* Right — large logo */}
          <div className="flex items-center justify-center" style={{ width: '38%', flexShrink: 0 }}>
            <img src={`/logo_rl_gold.png`} alt="RL Photo Video" className="opacity-70"
              style={{ width: 'clamp(160px, 22vw, 300px)' }} />
          </div>

        </div>
      )

      case 'final': {
        const finalPhoto = pp.slidePhotos?.['final'] || pp.final?.imageUrl || ''
        return (
          <div className="relative h-full w-full overflow-hidden flex items-center">
            {finalPhoto && (
              <img src={finalPhoto} alt=""
                className="rl-ken-left absolute inset-0 w-full h-full object-cover object-right"
                style={{ maskImage: 'linear-gradient(to left, black 0%, black 40%, transparent 75%)', WebkitMaskImage: 'linear-gradient(to left, black 0%, black 40%, transparent 75%)' }}
              />
            )}
            <div className={`relative z-10 flex flex-col gap-8 ${finalPhoto ? 'text-left' : 'items-center text-center px-8 sm:px-20 mx-auto'}`}
              style={{ maxWidth: finalPhoto ? '52%' : '680px', paddingLeft: finalPhoto ? 'clamp(5rem, 14vw, 12rem)' : undefined }}>
              <h2 
                style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: typo.titleColor, lineHeight: 1.15 }}>
                O que gostaram mais até agora?
              </h2>
              <p className="font-light leading-relaxed" style={{ fontSize: '20px', color: typo.bodyColor, opacity: 0.7 }}>
                Há algum momento, detalhe ou serviço que vos tocou de forma especial?<br />
                A vossa opinião ajuda-nos a construir algo verdadeiramente único para vocês.
              </p>
            </div>
            {isAdmin && (
              <label className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-[10px] tracking-[0.2em] uppercase transition-all"
                style={{ background: 'rgba(201,168,76,0.12)', border: '0.5px solid rgba(201,168,76,0.4)', color: 'rgba(201,168,76,0.8)' }}>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleSlidePhotoUpload('final', f) }} />
                {uploadingSlidePhoto === 'final' ? '⏳' : finalPhoto ? '✦ Trocar foto' : '⬆ Foto direita'}
              </label>
            )}
          </div>
        )
      }

      default: return null
    }
  }

  // ── Main presentation ─────────────────────────────────────────────────────
  return (
    <div className="nlead relative w-full overflow-hidden" style={{ height: '100dvh', background: '#0b0a08' }}>

      {/* Sistema de estilo partilhado com os briefings (/nova-lead) */}
      <style>{CSS_BRIEFING}</style>

      {/* Grão de película */}
      <div className="fx-grain" aria-hidden="true" />

      {/* Animações — entradas escalonadas e realces */}
      <style>{`
        @keyframes rlRise { from { opacity: 0; transform: translateY(42px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
        @keyframes rlKen { from { transform: scale(1.04) } to { transform: scale(1.16) } }
        @keyframes rlKenLeft { from { transform: scale(1.14) translateX(1.2%) } to { transform: scale(1.04) translateX(-1.2%) } }
        .rl-ken { animation: rlKen 18s ease-out both }
        .rl-ken-left { animation: rlKenLeft 20s ease-out both }
        @keyframes rlGlow { 0%, 100% { box-shadow: 0 0 44px rgba(201,168,76,0.10) } 50% { box-shadow: 0 0 74px rgba(201,168,76,0.22) } }
        @keyframes rlDraw { from { transform: scaleX(0) } to { transform: scaleX(1) } }
        .rl-in > * { animation: rlRise 0.72s cubic-bezier(0.22,1,0.36,1) both }
        .rl-in > *:nth-child(1) { animation-delay: 0.10s }
        .rl-in > *:nth-child(2) { animation-delay: 0.19s }
        .rl-in > *:nth-child(3) { animation-delay: 0.28s }
        .rl-in > *:nth-child(4) { animation-delay: 0.37s }
        .rl-in > *:nth-child(5) { animation-delay: 0.46s }
        .rl-in > *:nth-child(6) { animation-delay: 0.55s }
        .rl-in > *:nth-child(7) { animation-delay: 0.64s }
        .rl-in > *:nth-child(8) { animation-delay: 0.73s }
        .rl-in > *:nth-child(n+9) { animation-delay: 0.82s }
        .rl-glow { animation: rlGlow 3.6s ease-in-out infinite }
        .rl-rule { transform-origin: left center; animation: rlDraw 0.9s cubic-bezier(0.22,1,0.36,1) 0.5s both }
        .rl-cta { transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease, background 0.25s ease }
        .rl-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(201,168,76,0.22) }
        @media (prefers-reduced-motion: reduce) {
          .rl-in > *, .rl-glow, .rl-rule, .rl-ken, .rl-ken-left { animation: none !important }
        }
      `}</style>

      {/* Fundo degradé */}
      <div className="absolute inset-0" style={{ background: 'var(--ink)' }} />

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

      {/* Logo topo — slides 1 a N (exceto contact) */}
      {current > 0 && slides[current] !== 'contact' && (
        <div className={`absolute left-0 right-0 flex justify-center z-20 pointer-events-none ${isAdmin ? 'top-11' : 'top-5'}`}>
          <img src={`/logo_rl_gold.png`} alt="RL" className="w-40 opacity-70" />
        </div>
      )}

      {/* Slide atual */}
      <div className={`absolute inset-0 flex items-center justify-center ${isAdmin ? 'pt-9' : ''}`}>
        <SlideIn key={current} dir={direction}>
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Foto com desvanecer — universal para todos os slides */}
            {pp.slidePhotos?.[slides[current]] && (
              <img
                src={pp.slidePhotos[slides[current]]}
                alt=""
                className="rl-ken-left absolute inset-0 w-full h-full object-cover object-right"
                style={{
                  maskImage: 'linear-gradient(to left, black 0%, black 40%, transparent 75%)',
                  WebkitMaskImage: 'linear-gradient(to left, black 0%, black 40%, transparent 75%)',
                  zIndex: 0,
                }}
              />
            )}
            <div className="relative w-full h-full flex items-center justify-center" style={{ zIndex: 1 }}>
              {renderSlide(slides[current])}
            </div>
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

      {/* Progresso — barra contínua no fundo do ecrã */}
      <div className="absolute bottom-0 left-0 right-0 z-30" style={{ height: '2px', background: 'rgba(201,168,76,0.10)' }}>
        <div style={{
          height: '100%',
          width: `${((current + 1) / total) * 100}%`,
          background: 'linear-gradient(90deg, rgba(201,168,76,0.5) 0%, #E8B43C 100%)',
          transition: 'width 0.65s cubic-bezier(0.22,1,0.36,1)',
        }} />
      </div>

      {/* Fotogramas — um por slide, como no briefing */}
      <div className={`absolute left-6 sm:left-10 right-6 sm:right-10 flex items-center gap-1.5 z-30 ${isAdmin ? 'bottom-6' : 'bottom-7'}`}>
        {slides.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            aria-label={`Ir para a cena ${i + 1} de ${total}`}
            className="flex-1 flex items-center py-3">
            <span className={`fotograma${i === current ? ' agora' : i < current ? ' feito' : ''}`} />
          </button>
        ))}
      </div>

      {/* Etiqueta da cena e contador */}
      {current > 0 && (
        <p className={`eyebrow absolute left-6 sm:left-10 z-30 ${isAdmin ? 'top-16' : 'top-8'}`}>
          {CENAS[slides[current]]?.cena || ''}
        </p>
      )}
      <p className={`meta absolute right-6 sm:right-10 z-30 ${isAdmin ? 'top-16' : 'top-8'}`}>
        {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
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
                <AccordionSection title="Fotos por Slide (desvanecer direita)">
                  {([
                    ['cover',  'Capa'],
                    ['about',  'Sobre Nós'],
                    ['intro',  'Quem são os noivos?'],
                    ['relive', 'Portal dos Noivos'],
                    ['blank',  'Como imaginam o dia?'],
                    ['blank2', 'O Grande Dia'],
                    ['invest', 'Investimento'],
                    ['pkg-0',  'Proposta 1'],
                    ['pkg-1',  'Proposta 2'],
                    ['pkg-2',  'Proposta 3'],
                    ['final',  'O que gostaram mais?'],
                    ['cta',    'Informações Gerais'],
                    ['contact','Contactos'],
                  ] as [string, string][]).map(([id, label]) => {
                    const imgUrl = pp.slidePhotos?.[id] || ''
                    const isUploading = uploadingSlidePhoto === id
                    return (
                      <div key={id} className="flex flex-col gap-1.5">
                        <p className="text-[10px] tracking-[0.2em] text-white/30 uppercase">{label}</p>
                        <label className={`flex items-center justify-center gap-2 w-full py-2 rounded-lg text-xs cursor-pointer transition-all ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)' }}>
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => { const f = e.target.files?.[0]; if (f) handleSlidePhotoUpload(id, f) }} />
                          {isUploading ? '⏳ A carregar...' : imgUrl ? '✓ Trocar foto' : '⬆ Foto'}
                        </label>
                        {imgUrl && (
                          <div className="relative rounded-lg overflow-hidden" style={{ height: '70px' }}>
                            <img src={imgUrl} alt="" className="w-full h-full object-cover object-right opacity-70" />
                            <button onClick={() => clearSlidePhoto(id)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                              style={{ background: 'rgba(0,0,0,0.7)', color: 'rgba(255,255,255,0.5)' }}>✕</button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </AccordionSection>

                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <p className="text-[9px] tracking-[0.3em] text-white/20 uppercase">Slide "O Grande Dia"</p>
                <Field label="Título">
                  <TInput value={pp.grandeDia?.title || ''} onChange={v => setGrandeDia('title', v)} />
                </Field>
                <Field label="Parágrafo 1">
                  <TInput value={pp.grandeDia?.p1 || ''} onChange={v => setGrandeDia('p1', v)} multiline />
                </Field>
                <Field label="Parágrafo 2">
                  <TInput value={pp.grandeDia?.p2 || ''} onChange={v => setGrandeDia('p2', v)} multiline />
                </Field>
                <Field label="Parágrafo 3">
                  <TInput value={pp.grandeDia?.p3 || ''} onChange={v => setGrandeDia('p3', v)} multiline />
                </Field>
                <Field label="Nota de rodapé">
                  <TInput value={pp.grandeDia?.note || ''} onChange={v => setGrandeDia('note', v)} multiline />
                </Field>
                <Field label="Imagem">
                  <label className="flex items-center justify-center w-full py-2.5 rounded-lg border border-dashed border-white/15 hover:border-gold/40 cursor-pointer text-white/30 hover:text-gold/70 transition-all text-xs gap-2">
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleGrandeDiaUpload(f) }} />
                    {uploadingRelive ? '⏳ A carregar...' : pp.grandeDia?.imageUrl ? '✓ Trocar imagem' : '⬆ Carregar imagem'}
                  </label>
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
            <div className="px-4 py-4 border-t flex flex-col gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3 rounded-xl text-sm font-semibold tracking-[0.1em] uppercase transition-all disabled:opacity-50"
                style={{ background: saved ? 'rgba(74,222,128,0.15)' : 'rgba(201,168,76,0.15)', color: saved ? '#4ade80' : '#C9A84C', border: `1px solid ${saved ? 'rgba(74,222,128,0.3)' : 'rgba(201,168,76,0.3)'}` }}>
                {saving ? 'A guardar...' : saved ? '✓ Guardado!' : 'Guardar'}
              </button>
              {token === MASTER_TOKEN && (
                <button onClick={handlePublish} disabled={publishing}
                  className="w-full py-3 rounded-xl text-sm font-semibold tracking-[0.1em] uppercase transition-all disabled:opacity-50"
                  style={{ background: published ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.08)', color: published ? '#4ade80' : '#ffffff', border: `1px solid ${published ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.15)'}` }}>
                  {publishing ? '⏳ A publicar...' : published ? '✓ Publicado em todos!' : '🌐 Publicar Maquete'}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
