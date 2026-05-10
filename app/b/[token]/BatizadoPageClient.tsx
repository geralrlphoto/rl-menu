'use client'

import { useEffect, useRef, useState } from 'react'

const WHATSAPP      = 'https://wa.me/351919191919'
const DEFAULT_HERO  = 'https://rl-menu-lake.vercel.app/casamentos-2028.png'

export const FONTS: { value: string; label: string; className: string }[] = [
  { value: 'playfair',  label: 'Playfair',  className: 'font-playfair' },
  { value: 'cormorant', label: 'Cormorant', className: 'font-cormorant' },
  { value: 'sans',      label: 'Sans',      className: 'font-sans' },
]

export const SIZES: { value: string; label: string; className: string }[] = [
  { value: 'sm',  label: 'S',  className: 'text-2xl' },
  { value: 'md',  label: 'M',  className: 'text-4xl' },
  { value: 'lg',  label: 'L',  className: 'text-3xl sm:text-6xl' },
  { value: 'xl',  label: 'XL', className: 'text-4xl sm:text-7xl' },
]

export const TITLE_SIZES: { value: string; label: string; className: string }[] = [
  { value: 'sm',  label: 'S',  className: 'text-4xl sm:text-5xl' },
  { value: 'md',  label: 'M',  className: 'text-2xl sm:text-6xl' },
  { value: 'lg',  label: 'L',  className: 'text-3xl sm:text-7xl' },
  { value: 'xl',  label: 'XL', className: 'text-4xl sm:text-8xl' },
]

export type ExtraServico = { nome: string; valor: string }
export type Proposta     = { nome: string; servicos_foto: string[]; servicos_video: string[]; valor: string; notas?: string }

export type BatizadoContent = {
  hero:         { title: string; titleFont: string; titleSize: string; titleColor: string; brandLine: string; brandColor: string; imageUrl: string }
  evento:       { nome: string; data: string; hora: string; local: string }
  video:        { label: string; title: string; urls: string[] }
  portfolio:    { label: string; title: string; titleFont: string; titleColor: string; photos: string[] }
  revista:      { visible: boolean; label: string; title: string; subtitle: string; imageUrl: string; linkUrl: string; buttonLabel: string }
  testimonials: { label: string; items: { text: string; author: string }[] }
  about:        { label: string; title: string; titleFont: string; titleColor: string; text: string; textColor: string }
  banner:       { message: string; signature: string }
  proposta:     { password: string; buttonLabel: string }
  propostas:    Proposta[]
  extras_proposta: ExtraServico[]
  propostaPage: {
    subtitle: string; intro: string
    about:    { title: string; text: string; photo: string; videoUrl: string; titlePos: string }
    relive:   { imageUrl: string; buttonUrl: string }
    grandeDia: { title: string; p1: string; p2: string; p3: string; note: string; imageUrl: string }
    packages:  { title: string; description: string; price: string }[]
    propostaAtiva: number
    ctaText: string
    typography: {
      titleFont: string; titleSize: string; titleColor: string
      accentColor: string
      bodyFont: string; bodyColor: string
      pkgTitleFont: string; pkgTitleColor: string
    }
  }
}

export const DEFAULT_BATIZADO_CONTENT: BatizadoContent = {
  hero: {
    title: 'Proposta Criativa', titleFont: 'playfair', titleSize: 'xl',
    titleColor: '#ffffff', brandLine: 'RL Photo · Video', brandColor: '#C9A84C',
    imageUrl: '',
  },
  evento: { nome: '', data: '', hora: '', local: '' },
  video:  { label: 'O nosso trabalho', title: 'Vê como captamos cada momento.', urls: ['', '', ''] },
  portfolio: {
    label: 'Portfólio', title: 'Momentos que ficam para sempre.',
    titleFont: 'cormorant', titleColor: '#ffffff', photos: ['', '', ''],
  },
  revista: {
    visible: false,
    label: 'Revista',
    title: 'A nossa revista de batizados',
    subtitle: 'Inspira-te com as histórias de outras famílias. Uma coleção de momentos únicos, captados com cuidado e emoção.',
    imageUrl: '',
    linkUrl: '',
    buttonLabel: 'Ver Revista',
  },
  testimonials: {
    label: 'O que dizem',
    items: [
      { text: 'Captaram o batizado da nossa filha com uma delicadeza e sensibilidade únicas. As memórias ficaram para sempre.', author: '— Família Silva · Batizado 2024' },
      { text: 'Desde o primeiro contacto sentimos que estaríamos em boas mãos. Superaram todas as expectativas.', author: '— Família Costa · Batizado 2024' },
    ],
  },
  about: {
    label: 'Quem somos', title: 'RL Photo · Video', titleFont: 'cormorant',
    titleColor: '#ffffff',
    text: 'Somos especializados em fotografia e vídeo de batizados e eventos de família. O nosso objetivo é preservar a autenticidade de cada momento — a emoção, os detalhes, as histórias que só acontecem uma vez.',
    textColor: '#666666',
  },
  banner: {
    message: 'Cada sorriso, cada olhar de amor, cada detalhe deste dia especial merece ser preservado para sempre.',
    signature: '',
  },
  proposta: { password: '', buttonLabel: 'Ver Proposta Criativa' },
  propostas: [
    { nome: 'Proposta 1', servicos_foto: [], servicos_video: [], valor: '' },
    { nome: 'Proposta 2', servicos_foto: [], servicos_video: [], valor: '' },
    { nome: 'Proposta 3', servicos_foto: [], servicos_video: [], valor: '' },
  ],
  extras_proposta: [] as ExtraServico[],
  propostaPage: {
    subtitle: 'Uma proposta criada especialmente para vocês.',
    intro: 'O batizado do vosso bebé é um momento único e especial — e é essa unicidade que merece ser preservada para sempre. Cada detalhe, cada sorriso, cada olhar é parte de algo que nunca mais se repetirá.',
    about: { title: 'Sobre Nós', text: '', photo: '', videoUrl: '', titlePos: 'top-right' },
    relive: { imageUrl: '', buttonUrl: 'https://relive.wedding' },
    grandeDia: {
      title: 'o dia do batizado',
      p1: 'Nas preparações (sempre que possível), aconselhamos reunir com a família aproximadamente 1 hora antes do início da cerimónia.',
      p2: 'Gostamos de chegar ao local da cerimónia 20 minutos antes do seu início, para conseguirmos recolher imagens do espaço antes dos momentos principais.',
      p3: 'Após a cerimónia, reservem 20 a 30 minutos para uma sessão de família — os momentos mais naturais e emotivos.',
      note: '* O batizado é um momento íntimo. Trabalhamos sempre com a máxima discrição para não perturbar o ambiente.',
      imageUrl: '',
    },
    packages: [
      { title: 'Essencial',  description: 'Cobertura fotográfica completa do batizado, edição premium e galeria online privada.', price: 'Sob consulta' },
      { title: 'Premium',   description: 'Fotografia + Vídeo cinematográfico com highlights do evento e música personalizada.', price: 'Sob consulta' },
      { title: 'Luxe',      description: 'Pacote completo com álbum premium, second shooter e vídeo completo do dia.', price: 'Sob consulta' },
    ],
    propostaAtiva: 0,
    ctaText: 'Falemos sobre este momento especial',
    typography: {
      titleFont: 'cormorant', titleSize: 'xl', titleColor: '#ffffff',
      accentColor: '#C9A84C',
      bodyFont: 'cormorant', bodyColor: '#c8c0b0',
      pkgTitleFont: 'cormorant', pkgTitleColor: '#C9A84C',
    },
  },
}

export function mergeBatizado(saved: any): BatizadoContent {
  if (!saved) return DEFAULT_BATIZADO_CONTENT
  return {
    hero:         { ...DEFAULT_BATIZADO_CONTENT.hero,         ...(saved.hero         || {}) },
    evento:       { ...DEFAULT_BATIZADO_CONTENT.evento,       ...(saved.evento       || {}) },
    video:        { ...DEFAULT_BATIZADO_CONTENT.video,        ...(saved.video        || {}), urls: saved.video?.urls || DEFAULT_BATIZADO_CONTENT.video.urls },
    portfolio:    { ...DEFAULT_BATIZADO_CONTENT.portfolio,    ...(saved.portfolio    || {}), photos: saved.portfolio?.photos || DEFAULT_BATIZADO_CONTENT.portfolio.photos },
    revista:      { ...DEFAULT_BATIZADO_CONTENT.revista,      ...(saved.revista      || {}) },
    testimonials: { ...DEFAULT_BATIZADO_CONTENT.testimonials, ...(saved.testimonials || {}), items: saved.testimonials?.items || DEFAULT_BATIZADO_CONTENT.testimonials.items },
    about:        { ...DEFAULT_BATIZADO_CONTENT.about,        ...(saved.about        || {}) },
    banner:       { ...DEFAULT_BATIZADO_CONTENT.banner,       ...(saved.banner       || {}) },
    proposta:     { ...DEFAULT_BATIZADO_CONTENT.proposta,     ...(saved.proposta     || {}) },
    propostas:       saved.propostas       || DEFAULT_BATIZADO_CONTENT.propostas,
    extras_proposta: saved.extras_proposta || [],
    propostaPage: {
      ...DEFAULT_BATIZADO_CONTENT.propostaPage,
      ...(saved.propostaPage || {}),
      about:     { ...DEFAULT_BATIZADO_CONTENT.propostaPage.about,     ...(saved.propostaPage?.about     || {}) },
      relive:    { ...DEFAULT_BATIZADO_CONTENT.propostaPage.relive,    ...(saved.propostaPage?.relive    || {}) },
      grandeDia: { ...DEFAULT_BATIZADO_CONTENT.propostaPage.grandeDia, ...(saved.propostaPage?.grandeDia || {}) },
      packages:  saved.propostaPage?.packages  || DEFAULT_BATIZADO_CONTENT.propostaPage.packages,
      propostaAtiva: saved.propostaPage?.propostaAtiva ?? 0,
      typography: { ...DEFAULT_BATIZADO_CONTENT.propostaPage.typography, ...(saved.propostaPage?.typography || {}) },
    },
  }
}

function fontClass(f: string) { return FONTS.find(x => x.value === f)?.className || 'font-playfair' }
function sizeClass(s: string) { return SIZES.find(x => x.value === s)?.className || 'text-6xl sm:text-7xl' }

function toEmbedUrl(url: string): string | null {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1&color=white`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?title=0&byline=0&portrait=0&color=C9A84C`
  if (url.includes('/embed/') || url.includes('player.vimeo')) return url
  return null
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
function fmtData(d: string) {
  if (!d) return ''
  try {
    const dt = new Date(d + 'T00:00:00')
    return `${String(dt.getDate()).padStart(2,'0')} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`
  } catch { return d }
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] tracking-[0.25em] text-white/30 uppercase">{label}</label>
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
function FadeIn({ children, delay = 0, className = '', style = {} }: {
  children: React.ReactNode; delay?: number; className?: string; style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const t = setTimeout(() => {
      const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' })
      obs.observe(el)
      return () => obs.disconnect()
    }, 60)
    return () => clearTimeout(t)
  }, [])
  return (
    <div ref={ref} className={className} style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0px)' : 'translateY(22px)', transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  )
}
function Leaf({ flip }: { flip?: boolean }) {
  return (
    <svg viewBox="0 0 80 30" className={`w-16 sm:w-20 h-auto text-gold/50 ${flip ? 'scale-x-[-1]' : ''}`} fill="currentColor">
      <path d="M5 15 Q20 5 40 15 Q20 25 5 15Z" opacity="0.6"/>
      <path d="M30 15 Q50 3 75 15 Q50 27 30 15Z" opacity="0.4"/>
      <line x1="5" y1="15" x2="75" y2="15" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function BatizadoPageClient({ token, isAdmin }: { token: string; isAdmin: boolean }) {
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)
  const [content,   setContent]   = useState<BatizadoContent>(DEFAULT_BATIZADO_CONTENT)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Hero photo
  const [heroPreview,  setHeroPreview]  = useState('')
  const [heroInput,    setHeroInput]    = useState('')
  const [editingHero,  setEditingHero]  = useState(false)
  const [uploadError,  setUploadError]  = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Editor
  const [editorOpen, setEditorOpen] = useState(false)

  // Evento edit
  const [editingEvento, setEditingEvento] = useState(false)

  // Photo upload refs for portfolio
  const photoRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  useEffect(() => {
    fetch(`/api/batizado/view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setNotFound(true); setLoading(false); return }
        const saved = data.maquete?.settings?.content
        const merged = mergeBatizado(saved)
        setContent(merged)
        const heroUrl = merged.hero.imageUrl || ''
        setHeroPreview(heroUrl || DEFAULT_HERO)
        setHeroInput(heroUrl)
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  // ── Content updaters ──
  function setHero(k: keyof BatizadoContent['hero'], v: string) {
    setContent(c => ({ ...c, hero: { ...c.hero, [k]: v } }))
  }
  function setEvento(k: keyof BatizadoContent['evento'], v: string) {
    setContent(c => ({ ...c, evento: { ...c.evento, [k]: v } }))
  }
  function setVideo(k: keyof BatizadoContent['video'], v: any) {
    setContent(c => ({ ...c, video: { ...c.video, [k]: v } }))
  }
  function setVideoUrl(i: number, v: string) {
    setContent(c => { const urls = [...c.video.urls]; urls[i] = v; return { ...c, video: { ...c.video, urls } } })
  }
  function setPortfolio(k: keyof BatizadoContent['portfolio'], v: any) {
    setContent(c => ({ ...c, portfolio: { ...c.portfolio, [k]: v } }))
  }
  function setRevista(k: keyof BatizadoContent['revista'], v: any) {
    setContent(c => ({ ...c, revista: { ...c.revista, [k]: v } }))
  }
  function setTestimonial(i: number, k: 'text' | 'author', v: string) {
    setContent(c => { const items = [...c.testimonials.items]; items[i] = { ...items[i], [k]: v }; return { ...c, testimonials: { ...c.testimonials, items } } })
  }
  function setAbout(k: keyof BatizadoContent['about'], v: string) {
    setContent(c => ({ ...c, about: { ...c.about, [k]: v } }))
  }
  function setBanner(k: keyof BatizadoContent['banner'], v: string) {
    setContent(c => ({ ...c, banner: { ...c.banner, [k]: v } }))
  }
  function setProposta(k: keyof BatizadoContent['proposta'], v: string) {
    setContent(c => ({ ...c, proposta: { ...c.proposta, [k]: v } }))
  }
  function setPhoto(i: number, url: string) {
    setContent(c => { const photos = [...c.portfolio.photos]; photos[i] = url; return { ...c, portfolio: { ...c.portfolio, photos } } })
  }

  // ── Save (accepts optional explicit content to avoid stale-closure issues) ──
  const saveToServer = async (overrideContent?: BatizadoContent) => {
    const toSave = overrideContent ?? content
    setSaving(true); setSaveError(null)
    try {
      const res = await fetch('/api/batizado/save-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, content: toSave }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
      else { const d = await res.json().catch(() => ({})); setSaveError(d.error || `Erro ${res.status}`) }
    } catch { setSaveError('Erro de ligação') }
    setSaving(false)
  }

  const handleSaveContent = () => saveToServer()

  // ── Hero save ──
  const handleSaveHero = async () => {
    const updatedContent = { ...content, hero: { ...content.hero, imageUrl: heroInput } }
    setContent(updatedContent)
    setHeroPreview(heroInput || DEFAULT_HERO)
    setSaving(true); setSaveError(null)
    try {
      const res = await fetch('/api/batizado/save-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, content: updatedContent }),
      })
      if (res.ok) { setEditingHero(false) }
      else { const d = await res.json().catch(() => ({})); setSaveError(d.error || `Erro ${res.status}`) }
    } catch { setSaveError('Erro de ligação') }
    setSaving(false)
  }

  // ── Upload ──
  const handleUpload = async (file: File, cb: (url: string) => void, photoIndex?: number) => {
    if (photoIndex !== undefined) setUploadingPhoto(photoIndex)
    setUploadError(null)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) cb(data.url)
      else setUploadError(data.error || 'Erro ao carregar foto')
    } catch { setUploadError('Erro de ligação') }
    finally { if (photoIndex !== undefined) setUploadingPhoto(null) }
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

  const heroImage = heroPreview || DEFAULT_HERO
  const { hero, evento, video, portfolio, revista, testimonials, about, banner, proposta } = content
  const dataFmt = fmtData(evento.data)

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* ── ADMIN BAR ── */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-sm border-b border-white/5">
          <a href="/crm" className="text-[10px] tracking-widest text-white/25 hover:text-white/50 transition-colors uppercase">‹ CRM</a>
          <span className="text-[10px] tracking-widest text-white/20 uppercase">Admin · Maquete Batizado</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditingHero(true)}
              className="text-[10px] px-2.5 py-1 border border-white/10 rounded text-white/40 hover:text-white hover:border-white/30 transition-all uppercase tracking-wider">
              ✎ Foto
            </button>
            <button onClick={() => setEditorOpen(true)}
              className="text-[10px] px-2.5 py-1 border border-gold/30 rounded text-gold/70 hover:text-gold hover:border-gold/60 transition-all uppercase tracking-wider">
              ✎ Editar
            </button>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className={`relative min-h-[85vh] sm:min-h-[80vh] flex items-end justify-center pb-12 overflow-hidden ${isAdmin ? 'pt-10' : ''}`}>
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
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (!f) return
                    handleUpload(f, url => {
                      setHeroInput(url)
                      setHeroPreview(url)
                      // Auto-save hero image immediately after upload
                      setContent(c => {
                        const newContent = { ...c, hero: { ...c.hero, imageUrl: url } }
                        fetch('/api/batizado/save-content', {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ token, content: newContent }),
                        }).catch(() => {})
                        return newContent
                      })
                    })
                  }} />
                <span className="text-sm">⬆ Carregar do dispositivo</span>
              </label>
              <input value={heroInput} onChange={e => { setHeroInput(e.target.value); setHeroPreview(e.target.value || DEFAULT_HERO) }}
                placeholder="ou cola um URL de imagem..."
                className="w-full bg-white/[0.08] border border-white/20 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-gold/50 mb-3 placeholder:text-white/25" />
              {heroPreview && <div className="w-full h-28 rounded-lg bg-cover bg-center mb-3 border border-white/10" style={{ backgroundImage: `url(${heroPreview})` }} />}
              <div className="flex gap-2 justify-center">
                <button onClick={() => { setEditingHero(false); setHeroPreview(content.hero.imageUrl || DEFAULT_HERO); setHeroInput(content.hero.imageUrl || '') }}
                  className="px-4 py-2 text-xs border border-white/15 rounded-lg text-white/50 hover:text-white/80 transition-all">Cancelar</button>
                <button onClick={handleSaveHero}
                  className="px-5 py-2 text-xs bg-gold/20 border border-gold/40 rounded-lg text-gold hover:bg-gold/30 transition-all">✓ Guardar</button>
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

        <div className="relative z-10 text-center px-4 pt-12 sm:pt-20">
          <FadeIn delay={80} className="flex items-center justify-center gap-3 mb-4">
            <Leaf />
            <p className={`${fontClass(hero.titleFont)} text-sm sm:text-base tracking-[0.4em] uppercase italic`} style={{ color: hero.brandColor }}>
              {hero.brandLine}
            </p>
            <Leaf flip />
          </FadeIn>
          <FadeIn delay={220}>
            <h1 className={`${fontClass(hero.titleFont)} ${sizeClass(hero.titleSize)} font-black leading-none tracking-tight mb-4`} style={{ color: hero.titleColor }}>
              {hero.title}
            </h1>
          </FadeIn>
          <FadeIn delay={380} className="flex flex-col items-center gap-1 mt-2">
            {evento.nome && <p className="font-cormorant text-white/60 text-lg sm:text-xl italic tracking-wide">{evento.nome}</p>}
            {dataFmt && <p className="font-cormorant text-white/50 text-sm sm:text-base italic tracking-wide">✦ {dataFmt}{evento.hora ? ` · ${evento.hora}` : ''}{evento.local ? ` · ${evento.local}` : ''}</p>}
          </FadeIn>
        </div>
      </section>

      {/* ── CARD EVENTO ── */}
      <section className="flex flex-col items-center px-6 py-10 sm:py-14">
        <FadeIn className="w-full max-w-sm">
          <div className="w-full border border-white/10 rounded-2xl overflow-hidden mb-8" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
              <p className="text-xs tracking-[0.3em] text-white/25 uppercase">Detalhes do Batizado</p>
              {isAdmin && (
                <button onClick={() => setEditingEvento(e => !e)}
                  className="text-[10px] px-2 py-1 rounded border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all">
                  {editingEvento ? '✓ Fechar' : '✎ Editar'}
                </button>
              )}
            </div>

            {editingEvento && isAdmin ? (
              <div className="px-6 py-5 flex flex-col gap-3">
                <Field label="Nome (bebé / família)"><TInput value={evento.nome} onChange={v => setEvento('nome', v)} placeholder="Ex: Beatriz Santos" /></Field>
                <Field label="Data (AAAA-MM-DD)"><TInput value={evento.data} onChange={v => setEvento('data', v)} placeholder="2025-06-15" /></Field>
                <Field label="Hora"><TInput value={evento.hora} onChange={v => setEvento('hora', v)} placeholder="15:00" /></Field>
                <Field label="Local"><TInput value={evento.local} onChange={v => setEvento('local', v)} placeholder="Igreja de..." /></Field>
                <button onClick={handleSaveContent}
                  className="mt-2 w-full py-2.5 rounded-xl text-xs tracking-widest uppercase transition-all"
                  style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', color: '#C9A84C' }}>
                  {saving ? 'A guardar...' : '✓ Guardar'}
                </button>
              </div>
            ) : (
              <div className="px-6 py-5 flex flex-col gap-4">
                {evento.nome && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs tracking-[0.2em] text-white/30 uppercase">Nome</span>
                    <span className="font-cormorant text-lg text-white/90">{evento.nome}</span>
                  </div>
                )}
                {evento.data && <><div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-xs tracking-[0.2em] text-white/30 uppercase">Data</span>
                  <span className="font-cormorant text-lg text-white/90">{dataFmt}</span>
                </div></>}
                {evento.hora && <><div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-xs tracking-[0.2em] text-white/30 uppercase">Hora</span>
                  <span className="font-cormorant text-lg text-white/90">{evento.hora}</span>
                </div></>}
                {evento.local && <><div className="h-px bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-xs tracking-[0.2em] text-white/30 uppercase">Local</span>
                  <span className="font-cormorant text-lg text-white/90 text-right max-w-[180px]">{evento.local}</span>
                </div></>}
                {!evento.nome && !evento.data && !evento.hora && !evento.local && (
                  <p className="text-xs text-white/20 text-center py-2 italic">
                    {isAdmin ? 'Clica em Editar para adicionar os detalhes do batizado' : 'Detalhes em breve'}
                  </p>
                )}
              </div>
            )}
          </div>
        </FadeIn>
      </section>

      {/* ── VÍDEO ── */}
      {(video.urls.some(u => u) || isAdmin) && (
        <section className="px-6 py-14 flex flex-col items-center" style={{ background: '#0d0d0d' }}>
          <FadeIn><p className="text-xs tracking-[0.35em] text-white/25 uppercase mb-2">{video.label}</p></FadeIn>
          <FadeIn delay={120}><h2 className="font-cormorant text-xl sm:text-3xl font-light mb-8 text-center text-white/90">{video.title}</h2></FadeIn>
          <FadeIn delay={240} className="w-full max-w-7xl">
            <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-5">
              {video.urls.map((url, i) => {
                const embed = toEmbedUrl(url)
                if (embed) return (
                  <div key={i} className="rounded-xl overflow-hidden shadow-xl" style={{ aspectRatio: '16/9', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <iframe src={embed} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                )
                if (isAdmin) return (
                  <div key={i} className="rounded-xl flex flex-col items-center justify-center gap-1" style={{ aspectRatio: '16/9', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(201,168,76,0.15)' }}>
                    <span className="text-gold/20 text-lg">▶</span>
                    <span className="text-white/15 text-[9px] tracking-widest uppercase">Vídeo {i + 1}</span>
                  </div>
                )
                return null
              })}
            </div>
          </FadeIn>
        </section>
      )}

      <div className="w-full max-w-sm mx-auto h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />

      {/* ── PORTFÓLIO ── */}
      <section className="px-6 py-14 flex flex-col items-center">
        <FadeIn><p className="text-xs tracking-[0.35em] text-white/25 uppercase mb-2">{portfolio.label}</p></FadeIn>
        <FadeIn delay={120}>
          <h2 className={`${fontClass(portfolio.titleFont)} text-xl sm:text-3xl font-light mb-8 text-center`} style={{ color: portfolio.titleColor }}>
            {portfolio.title}
          </h2>
        </FadeIn>
        <div className="w-full max-w-2xl grid grid-cols-3 gap-3">
          {portfolio.photos.map((url, i) => (
            <FadeIn key={i} delay={i * 120} className="aspect-square">
              <div className="aspect-square rounded-xl overflow-hidden relative group w-full h-full"
                style={{ background: url ? undefined : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {url ? <img src={url} alt="" className="w-full h-full object-cover" />
                     : <div className="w-full h-full flex items-center justify-center"><span className="text-white/10 text-xs tracking-widest">foto</span></div>}
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── REVISTA ── */}
      {(revista.visible || isAdmin) && (
        <section className="px-6 py-14 flex flex-col items-center" style={{ background: '#0d0d0d' }}>
          {isAdmin && !revista.visible && (
            <div className="mb-6 px-4 py-2 rounded-full border border-dashed border-gold/20 text-[10px] tracking-[0.3em] text-gold/30 uppercase">
              Secção Oculta — ativa no editor
            </div>
          )}
          <FadeIn>
            <p className="text-xs tracking-[0.35em] text-white/25 uppercase mb-2 text-center">{revista.label}</p>
          </FadeIn>
          <FadeIn delay={120}>
            <h2 className="font-cormorant text-xl sm:text-3xl font-light mb-3 text-center text-white/90">{revista.title}</h2>
          </FadeIn>
          {revista.subtitle && (
            <FadeIn delay={200}>
              <p className="text-sm text-white/35 text-center mb-10 max-w-sm leading-relaxed font-light">{revista.subtitle}</p>
            </FadeIn>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-10 w-full max-w-2xl">
            {/* Capa */}
            <FadeIn delay={260} className="flex-shrink-0">
              {revista.imageUrl ? (
                <div className="relative rounded-xl overflow-hidden shadow-2xl"
                  style={{ width: '180px', aspectRatio: '2/3', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <img src={revista.imageUrl} alt="Revista" className="w-full h-full object-cover" />
                </div>
              ) : isAdmin ? (
                <div className="rounded-xl flex flex-col items-center justify-center gap-2"
                  style={{ width: '180px', aspectRatio: '2/3', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(201,168,76,0.15)' }}>
                  <span className="text-gold/20 text-2xl">◻</span>
                  <span className="text-white/15 text-[9px] tracking-widest uppercase">Capa</span>
                </div>
              ) : null}
            </FadeIn>

            {/* Texto + botão */}
            <FadeIn delay={340} className="flex flex-col items-center sm:items-start gap-6 text-center sm:text-left">
              <div className="flex flex-col gap-2">
                <p className="text-[10px] tracking-[0.4em] text-gold/40 uppercase">◆ Edição Exclusiva</p>
                <p className="font-cormorant text-2xl sm:text-3xl font-light text-white/80">{revista.title}</p>
                {revista.subtitle && <p className="text-sm text-white/30 leading-relaxed font-light max-w-xs">{revista.subtitle}</p>}
              </div>
              {(revista.linkUrl || isAdmin) && (
                <a
                  href={revista.linkUrl || '#'}
                  target={revista.linkUrl ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  onClick={!revista.linkUrl ? (e) => e.preventDefault() : undefined}
                  className="group flex items-center gap-3 px-8 py-3.5 text-[10px] tracking-[0.4em] uppercase transition-all duration-300 hover:scale-[1.04]"
                  style={{ background: 'rgba(201,168,76,0.12)', border: '0.5px solid rgba(201,168,76,0.5)', color: '#C9A84C', opacity: revista.linkUrl ? 1 : 0.4 }}>
                  <span>{revista.buttonLabel || 'Ver Revista'}</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </a>
              )}
            </FadeIn>
          </div>
        </section>
      )}

      <div className="w-full max-w-sm mx-auto h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />

      {/* ── TESTEMUNHOS ── */}
      <section className="px-6 py-14 flex flex-col items-center gap-8 max-w-2xl mx-auto">
        <FadeIn><p className="text-xs tracking-[0.35em] text-white/25 uppercase">{testimonials.label}</p></FadeIn>
        {testimonials.items.map((item, i) => (
          <FadeIn key={i} delay={i * 150} className="w-full">
            <div className="flex flex-col items-center gap-4 w-full">
              <blockquote className="text-center">
                <p className="font-cormorant text-base sm:text-xl text-white/70 italic font-light leading-relaxed mb-3">"{item.text}"</p>
                <cite className="text-xs tracking-[0.2em] text-gold/60 not-italic">{item.author}</cite>
              </blockquote>
              {i < testimonials.items.length - 1 && <div className="w-8 h-px" style={{ background: 'rgba(201,168,76,0.2)' }} />}
            </div>
          </FadeIn>
        ))}
      </section>

      {/* ── BANNER ── */}
      <section className="px-4 sm:px-8 py-10" style={{ background: '#0a0a0a' }}>
        <FadeIn>
          <div className="relative w-full max-w-5xl mx-auto overflow-hidden" style={{ border: '0.5px solid rgba(201,168,76,0.3)' }}>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1c1408 0%, #0f0c07 35%, #13100a 65%, #1c1408 100%)' }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 70% 120% at 30% 50%, rgba(201,168,76,0.08) 0%, transparent 65%)' }} />
            <div className="absolute top-0 left-0 w-10 h-10" style={{ borderTop: '1px solid rgba(201,168,76,0.7)', borderLeft: '1px solid rgba(201,168,76,0.7)' }} />
            <div className="absolute top-0 right-0 w-10 h-10" style={{ borderTop: '1px solid rgba(201,168,76,0.7)', borderRight: '1px solid rgba(201,168,76,0.7)' }} />
            <div className="absolute bottom-0 left-0 w-10 h-10" style={{ borderBottom: '1px solid rgba(201,168,76,0.7)', borderLeft: '1px solid rgba(201,168,76,0.7)' }} />
            <div className="absolute bottom-0 right-0 w-10 h-10" style={{ borderBottom: '1px solid rgba(201,168,76,0.7)', borderRight: '1px solid rgba(201,168,76,0.7)' }} />
            <div className="absolute top-8 bottom-8 hidden sm:block" style={{ left: '62%', width: '0.5px', background: 'rgba(201,168,76,0.2)' }} />
            <div className="relative z-10 flex flex-col sm:flex-row items-center px-6 sm:px-14 py-8 sm:py-10 gap-8 sm:gap-10">
              <div className="flex-1 flex flex-col gap-3 sm:pr-8">
                <p className="text-[10px] tracking-[0.45em]" style={{ color: 'rgba(201,168,76,0.4)' }}>&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</p>
                <p className="font-cormorant text-xl sm:text-2xl italic font-light leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  &ldquo;{banner.message}&rdquo;
                </p>
                {banner.signature && <p className="font-cormorant text-base italic" style={{ color: '#C9A84C' }}>{banner.signature}</p>}
              </div>
              <div className="flex flex-col items-center gap-5 sm:pl-8">
                <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
                  alt="RL" className="w-10 h-auto opacity-60" />
                <a href={`/b/${token}/proposta`}
                  className="group flex items-center gap-3 px-8 py-3.5 text-[10px] tracking-[0.4em] uppercase transition-all duration-300 hover:scale-[1.04] whitespace-nowrap"
                  style={{ background: 'rgba(201,168,76,0.12)', border: '0.5px solid rgba(201,168,76,0.5)', color: '#C9A84C' }}>
                  <span>{proposta.buttonLabel}</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </a>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      <div className="w-full max-w-sm mx-auto h-px" style={{ background: 'rgba(201,168,76,0.15)' }} />

      {/* ── SOBRE NÓS ── */}
      <section className="px-6 py-14 flex flex-col items-center max-w-lg mx-auto text-center">
        <FadeIn><p className="text-xs tracking-[0.35em] text-white/25 uppercase mb-2">{about.label}</p></FadeIn>
        <FadeIn delay={120}>
          <h2 className={`${fontClass(about.titleFont)} text-xl sm:text-3xl font-light mb-6`} style={{ color: about.titleColor }}>
            {about.title}
          </h2>
        </FadeIn>
        <FadeIn delay={240}>
          <p className="text-sm leading-relaxed font-light" style={{ color: about.textColor }}>{about.text}</p>
        </FadeIn>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-10 text-center border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <FadeIn><p className="text-xs tracking-widest text-white/15 uppercase">© RL Photo · Video</p></FadeIn>
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

      {/* ══ EDITOR PANEL ══ */}
      {isAdmin && (
        <>
          {editorOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setEditorOpen(false)} />}
          <div className={`fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${editorOpen ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ width: '320px', background: '#0d0d0d', borderLeft: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div>
                <p className="text-xs tracking-widest text-white/60 uppercase">Editor · Batizado</p>
                <p className="text-[10px] text-white/20 mt-0.5">Alterações em tempo real</p>
              </div>
              <button onClick={() => setEditorOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

              {/* ── HERO ── */}
              <AccordionSection title="Hero" defaultOpen>
                <Field label="Título"><TInput value={hero.title} onChange={v => setHero('title', v)} /></Field>
                <Field label="Tipo de letra"><FontPicker value={hero.titleFont} onChange={v => setHero('titleFont', v)} /></Field>
                <Field label="Tamanho"><SizePicker value={hero.titleSize} onChange={v => setHero('titleSize', v)} /></Field>
                <Field label="Cor do título"><ColorPicker value={hero.titleColor} onChange={v => setHero('titleColor', v)} /></Field>
                <Field label="Linha da marca"><TInput value={hero.brandLine} onChange={v => setHero('brandLine', v)} /></Field>
                <Field label="Cor da marca"><ColorPicker value={hero.brandColor} onChange={v => setHero('brandColor', v)} /></Field>
              </AccordionSection>

              {/* ── EVENTO ── */}
              <AccordionSection title="Detalhes do Batizado">
                <Field label="Nome (bebé / família)"><TInput value={evento.nome} onChange={v => setEvento('nome', v)} placeholder="Ex: Beatriz Santos" /></Field>
                <Field label="Data (AAAA-MM-DD)"><TInput value={evento.data} onChange={v => setEvento('data', v)} placeholder="2025-06-15" /></Field>
                <Field label="Hora"><TInput value={evento.hora} onChange={v => setEvento('hora', v)} placeholder="15:00" /></Field>
                <Field label="Local"><TInput value={evento.local} onChange={v => setEvento('local', v)} /></Field>
              </AccordionSection>

              {/* ── VÍDEO ── */}
              <AccordionSection title="Vídeo">
                <Field label="Etiqueta"><TInput value={video.label} onChange={v => setVideo('label', v)} /></Field>
                <Field label="Título"><TInput value={video.title} onChange={v => setVideo('title', v)} /></Field>
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex flex-col gap-1 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[10px] tracking-widest text-white/25 uppercase mb-1">Vídeo {i + 1}</p>
                    <input type="text" placeholder="https://youtube.com/watch?v=..." value={video.urls[i] || ''}
                      onChange={e => setVideoUrl(i, e.target.value)}
                      className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-gold/40 placeholder:text-white/20" />
                    {video.urls[i] && (
                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-[10px] ${toEmbedUrl(video.urls[i]) ? 'text-green-400/70' : 'text-red-400/70'}`}>
                          {toEmbedUrl(video.urls[i]) ? '✓ Válido' : '✕ Inválido'}
                        </p>
                        <button onClick={() => setVideoUrl(i, '')} className="text-[9px] text-white/20 hover:text-red-400 transition-colors">✕ remover</button>
                      </div>
                    )}
                  </div>
                ))}
              </AccordionSection>

              {/* ── PORTFÓLIO ── */}
              <AccordionSection title="Portfólio">
                <Field label="Etiqueta"><TInput value={portfolio.label} onChange={v => setPortfolio('label', v)} /></Field>
                <Field label="Título"><TInput value={portfolio.title} onChange={v => setPortfolio('title', v)} /></Field>
                <Field label="Tipo de letra"><FontPicker value={portfolio.titleFont} onChange={v => setPortfolio('titleFont', v)} /></Field>
                <Field label="Cor do título"><ColorPicker value={portfolio.titleColor} onChange={v => setPortfolio('titleColor', v)} /></Field>
                <Field label="Fotos (3)">
                  <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="flex flex-col gap-1">
                        <label className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border border-white/10 hover:border-gold/40 transition-all group"
                          style={{ background: portfolio.photos[i] ? undefined : 'rgba(255,255,255,0.04)' }}>
                          <input ref={photoRefs[i]} type="file" accept="image/*" className="hidden"
                            onChange={e => {
                              const f = e.target.files?.[0]
                              if (!f) return
                              handleUpload(f, url => {
                                // Build new content immediately (avoids stale closure) and auto-save
                                setContent(c => {
                                  const photos = [...c.portfolio.photos]
                                  photos[i] = url
                                  const newContent = { ...c, portfolio: { ...c.portfolio, photos } }
                                  // Fire-and-forget save with the brand-new content
                                  fetch('/api/batizado/save-content', {
                                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ token, content: newContent }),
                                  }).catch(() => {})
                                  return newContent
                                })
                              }, i)
                            }} />
                          {portfolio.photos[i]
                            ? <img src={portfolio.photos[i]} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                                <span className="text-white/20 text-lg">⬆</span>
                                <span className="text-white/20 text-[9px] tracking-wider">Foto {i+1}</span>
                              </div>
                          }
                          {uploadingPhoto === i && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                              <span className="text-white/70 text-lg animate-spin">⟳</span>
                            </div>
                          )}
                          {uploadingPhoto !== i && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                              <span className="text-white text-xs">Trocar</span>
                            </div>
                          )}
                        </label>
                        {portfolio.photos[i] && (
                          <button onClick={() => setPhoto(i, '')} className="text-[9px] text-white/20 hover:text-red-400 transition-colors text-center">✕ remover</button>
                        )}
                      </div>
                    ))}
                  </div>
                </Field>
              </AccordionSection>

              {/* ── REVISTA ── */}
              <AccordionSection title="Revista">
                {/* Toggle visível/oculto */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-xs text-white/50">Mostrar secção</span>
                  <button
                    onClick={() => setRevista('visible', !revista.visible)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={revista.visible
                      ? { background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)', color: '#C9A84C' }
                      : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
                    {revista.visible ? '● Visível' : '○ Oculta'}
                  </button>
                </div>
                <Field label="Etiqueta"><TInput value={revista.label} onChange={v => setRevista('label', v)} /></Field>
                <Field label="Título"><TInput value={revista.title} onChange={v => setRevista('title', v)} /></Field>
                <Field label="Subtítulo"><TInput value={revista.subtitle} onChange={v => setRevista('subtitle', v)} multiline /></Field>
                <Field label="Capa (URL ou upload)">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center justify-center w-full py-2.5 rounded-lg border border-dashed border-white/15 hover:border-gold/40 hover:bg-gold/5 text-white/30 hover:text-gold/60 cursor-pointer transition-all text-xs">
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0]
                          if (!f) return
                          handleUpload(f, url => {
                            setContent(c => {
                              const newContent = { ...c, revista: { ...c.revista, imageUrl: url } }
                              fetch('/api/batizado/save-content', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ token, content: newContent }),
                              }).catch(() => {})
                              return newContent
                            })
                          })
                        }} />
                      ⬆ Carregar capa
                    </label>
                    <TInput value={revista.imageUrl} onChange={v => setRevista('imageUrl', v)} placeholder="ou URL da imagem..." />
                    {revista.imageUrl && (
                      <div className="rounded-lg overflow-hidden border border-white/8" style={{ aspectRatio: '2/3', maxWidth: '80px' }}>
                        <img src={revista.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </Field>
                <Field label="Link da Revista"><TInput value={revista.linkUrl} onChange={v => setRevista('linkUrl', v)} placeholder="https://..." /></Field>
                <Field label="Texto do botão"><TInput value={revista.buttonLabel} onChange={v => setRevista('buttonLabel', v)} /></Field>
              </AccordionSection>

              {/* ── TESTEMUNHOS ── */}
              <AccordionSection title="Testemunhos">
                <Field label="Etiqueta"><TInput value={testimonials.label} onChange={v => setContent(c => ({ ...c, testimonials: { ...c.testimonials, label: v } }))} /></Field>
                {testimonials.items.map((item, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-[10px] tracking-widest text-white/20 uppercase">Testemunho {i + 1}</p>
                    <Field label="Texto"><TInput value={item.text} onChange={v => setTestimonial(i, 'text', v)} multiline /></Field>
                    <Field label="Autor"><TInput value={item.author} onChange={v => setTestimonial(i, 'author', v)} /></Field>
                  </div>
                ))}
              </AccordionSection>

              {/* ── PROPOSTA ── */}
              <AccordionSection title="Proposta Criativa">
                <Field label="Texto do botão"><TInput value={proposta.buttonLabel} onChange={v => setProposta('buttonLabel', v)} /></Field>
                <Field label="Password de acesso"><TInput value={proposta.password} onChange={v => setProposta('password', v)} /></Field>
                {!proposta.password && <p className="text-[10px] text-amber-400/60 text-center">Sem password → qualquer pessoa com o link acede</p>}
              </AccordionSection>

              {/* ── BANNER ── */}
              <AccordionSection title="Banner">
                <Field label="Mensagem / Frase"><TInput value={banner.message} onChange={v => setBanner('message', v)} multiline /></Field>
                <Field label="Assinatura"><TInput value={banner.signature} onChange={v => setBanner('signature', v)} /></Field>
              </AccordionSection>

              {/* ── SOBRE NÓS ── */}
              <AccordionSection title="Sobre Nós">
                <Field label="Etiqueta"><TInput value={about.label} onChange={v => setAbout('label', v)} /></Field>
                <Field label="Título"><TInput value={about.title} onChange={v => setAbout('title', v)} /></Field>
                <Field label="Tipo de letra"><FontPicker value={about.titleFont} onChange={v => setAbout('titleFont', v)} /></Field>
                <Field label="Cor do título"><ColorPicker value={about.titleColor} onChange={v => setAbout('titleColor', v)} /></Field>
                <Field label="Texto"><TInput value={about.text} onChange={v => setAbout('text', v)} multiline /></Field>
                <Field label="Cor do texto"><ColorPicker value={about.textColor} onChange={v => setAbout('textColor', v)} /></Field>
              </AccordionSection>

            </div>

            {/* Save */}
            <div className="px-4 py-4 border-t flex flex-col gap-2" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              {uploadError && <p className="text-[11px] text-red-400 text-center bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">✕ {uploadError}</p>}
              {saveError  && <p className="text-[11px] text-red-400 text-center bg-red-500/10 rounded-lg px-3 py-2 border border-red-500/20">✕ {saveError}</p>}
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
