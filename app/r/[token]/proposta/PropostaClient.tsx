'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { DEFAULT_CONTENT, PageContent, Proposta, ExtraServico, FONTS, TITLE_SIZES } from '../LeadPageClient'
import { CSS_BRIEFING } from '../../../_briefing/estilo'
import { DETALHES_PROPOSTAS, nomePropostaPadrao, propostaVisivel, ofertaDaProposta } from '@/lib/crm'
import RodaPropostas from './RodaPropostas'

const IMG_BASE = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images'
const MASTER_TOKEN = '85343645-b0d3-4412-ae78-795fd7f8ddf1'
// Cena "O grande dia": a criança de chapéu a olhar para o vestido pendurado, da galeria do portfólio no Wfolio (foto 22)
const FOTO_GRANDE_DIA = 'https://i.wfolio.com/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgBdCvXqdZSYC/zyAGIGx14QnH8prwkbZ-T_VQC0dpw9Hp/imD7pN62XUepN3NSIwunZoos_XinagtM/fbvcdOyKJWF1e5Z62MJQXoK8GOyeLUdi/LKuebCPWUyqXzGP1hnLy0odg3uAVZ1Ek/I65fwkJIUKkYjy8XoUJP1k-dbpQ_WQPX/5sgMnZmG15TobA87u2fFOKOL4-cUkc2O/MZ4r9ovAuooJlP4Ylybgoiaei5NtTuMC/3rRTRJPC7dHxh6_-1NZsjoNewE3laLJg/RiVsXPTlaFe0HNbflD3YxsuH0AHwiPk5/aR5WGzXHVzINEmBk_Z51cH313wUdVAlP/d15WV0HWbcbYwtcCKDUtRGD_-xwp9-rS/_rYFt4M4ItnLgVOKLNZQBmg3AgmLiCDP/nflnesvI_Rr-hsQ001PAl-pD5RDtDI1C/38iNulTlpdjbET6d3mf2S7Lx2r_KK2KA/hyLR8NYHDlmd-5keY5XhJO-wHYKPIwgE/F0xLlQ6ovv7APDQyqXY69O8CkSX31VF_/cAZXyAQKfYA.jpg'
// Cena da confiança: as mãos dos noivos, da galeria do portfólio no Wfolio (servida pelo i.wfolio.com)
const FOTO_CONFIANCA = 'https://i.wfolio.com/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgBdCvXqdZSYC/zyAGIGx14QnH8prwkbZ-T_VQC0dpw9Hp/imD7pN62XUepN3NSIwunZoos_XinagtM/fbvcdOyKJWF1e5Z62MJQXoK8GOyeLUdi/LKuebCPWUyqXzGP1hnLy0odg3uAVZ1Ek/I65fwkJIUKkYjy8XoUJP1k-dbpQ_WQPX/5sgMnZmG15TobA87u2fFOKOL4-cUkc2O/MZ4r9ovAuoqhmbQy9CfDa0daUXrv1zuz/YpfUV1ZRNWYCFIw_Tkd-ilkIPYKrEMRY/ES_rPO1P_nabPEQiVu9kM-u8wAW9xf74/_KpBIdRV95rGcuYqIbuxdhQk155K8CAr/Ho1EU1bzx29rTD5vFdpGrNGZgDk8k6cb/A45grNZxoXG2tk_ZVWgwxZY_y3OgdAAk/tEBKhq2GD4eSAL0pcHapVlJraJFPO_KG/t_O-50yUIB3P3_mZXu1pxjkQ6XI0CkvX/X-u99pvGJKkozQVHsHNyOFZFcYcqRCLg/k8O6e0xDTgxSqO5cl4gzpPP7zwtvBx2K/Cd5qVpOVgdI.jpg'

// Cada slide é uma cena, como no briefing /nova-lead: etiqueta em mono e
// um título em romano com a ênfase em itálico dourado.
const CENAS: Record<string, { cena: string; titulo: string; em: string }> = {
  cover:   { cena: 'Antes de rodar', titulo: 'Proposta',            em: 'criativa'     },
  intro:   { cena: 'Cena 01',        titulo: 'Quem são os',         em: 'nossos noivos' },
  blank:   { cena: 'Cena 02',        titulo: 'Como imaginam',       em: 'o vosso dia'  },
  about:   { cena: 'Cena 03',        titulo: 'Quem está',           em: 'atrás da câmara' },
  relive:  { cena: 'Cena 04',        titulo: 'O vosso',             em: 'portal'       },
  blank2:  { cena: 'Cena 05',        titulo: 'O grande',            em: 'dia'          },
  duvidas: { cena: 'Cena 06',        titulo: 'O que os noivos',     em: 'nos perguntam' },
  motivo:  { cena: 'Cena 07',        titulo: 'O que ainda',         em: 'vos faz pensar' },
  confianca: { cena: 'Cena 08',      titulo: 'Confiavam-nos',       em: 'o vosso dia' },
  invest:  { cena: 'Cena 09',        titulo: 'O',                   em: 'investimento' },
  'pkg-0': { cena: 'Proposta 01',    titulo: 'A',                   em: 'primeira'     },
  'pkg-1': { cena: 'Proposta 02',    titulo: 'A',                   em: 'segunda'      },
  'pkg-2': { cena: 'Proposta 03',    titulo: 'A',                   em: 'terceira'     },
  'pkg-3': { cena: 'Proposta 04',    titulo: 'A',                   em: 'quarta'       },
  propostas: { cena: 'As propostas', titulo: 'As',                  em: 'propostas'    },
  final:   { cena: 'Cena 10',      titulo: 'Fica para',           em: 'sempre'       },
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
  // Vídeos não listados (vimeo.com/ID/HASH): sem o h=HASH só abrem para quem tem sessão no Vimeo
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([0-9a-f]{6,}))?/)
  const vh = vm?.[2] ?? url.match(/[?&]h=([0-9a-f]+)/)?.[1]
  if (vm) return `https://player.vimeo.com/video/${vm[1]}${vh ? `?h=${vh}` : ''}`
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
    revista:      { ...DEFAULT_CONTENT.revista,      ...(saved.revista      || {}) },
    proposta:     { ...DEFAULT_CONTENT.proposta,     ...(saved.proposta     || {}) },
    propostas:       saved.propostas       || DEFAULT_CONTENT.propostas,
    extras_proposta: saved.extras_proposta || [],
    propostaPage: { ...DEFAULT_CONTENT.propostaPage, ...(saved.propostaPage || {}), about: { ...DEFAULT_CONTENT.propostaPage.about, ...(saved.propostaPage?.about || {}) }, relive: { ...DEFAULT_CONTENT.propostaPage.relive, ...(saved.propostaPage?.relive || {}) }, couple: { ...DEFAULT_CONTENT.propostaPage.couple, ...(saved.propostaPage?.couple || {}) }, reflexao: { ...DEFAULT_CONTENT.propostaPage.reflexao, ...(saved.propostaPage?.reflexao || {}) }, final: { ...DEFAULT_CONTENT.propostaPage.final, ...(saved.propostaPage?.final || {}) }, slidePhotos: { ...(saved.propostaPage?.slidePhotos || {}) }, grandeDia: { ...DEFAULT_CONTENT.propostaPage.grandeDia, ...(saved.propostaPage?.grandeDia || {}) }, packages: saved.propostaPage?.packages || DEFAULT_CONTENT.propostaPage.packages, propostaAtiva: saved.propostaPage?.propostaAtiva ?? 1, typography: { ...DEFAULT_CONTENT.propostaPage.typography, ...(saved.propostaPage?.typography || {}) } },
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
  const [incluiOpen,     setIncluiOpen]     = useState<Record<number, boolean>>({})
  const [extrasSelected, setExtrasSelected] = useState<Record<number, string[]>>({})
  const [formaOpen,      setFormaOpen]      = useState<Record<number, boolean>>({})
  const [escolhida,      setEscolhida]      = useState<number | null>(null)
  const [planoN,         setPlanoN]         = useState<Record<number, number>>({})
  const [videoOn,        setVideoOn]        = useState(false)
  // Capa: "Sabem quantos dias faltam?" e, no primeiro Começar, a contagem até aos dias reais
  const [diasRevelados,  setDiasRevelados]  = useState(false)
  const [diasConta,      setDiasConta]      = useState(0)
  const reveladoEm = useRef(0)
  const [viradas,        setViradas]        = useState<Record<number, boolean>>({})
  const [rodaSel,        setRodaSel]        = useState<number | null>(null)
  // Fotos dos cartões da roda: vêm da galeria do portfólio no Wfolio (i.wfolio.com, 0 no Supabase)
  const [wfolio,         setWfolio]         = useState<string[]>([])
  useEffect(() => {
    fetch('/api/portfolio-wfolio').then(r => r.json())
      .then(d => setWfolio(Array.isArray(d.fotos) ? d.fotos.map((f: { src: string }) => f.src) : []))
      .catch(() => {})
  }, [])

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

  // A 4.ª proposta (DOCUMENTAL) só entra quando está ativada no CRM
  // Só entram propostas com serviços (e a DOCUMENTAL só quando ativada); na maquete mostra as três
  const idxPropostas = [0, 1, 2, 3].filter(i => token === MASTER_TOKEN ? i < 3 : propostaVisivel(content.propostas?.[i], i))
  // Primeiro o casal (quem são, como imaginam o dia), só depois nós; as dúvidas ficam mesmo antes dos preços
  // As propostas ficam todas numa só cena, em roda (RodaPropostas)
  const slides = ['cover', 'intro', 'blank', 'about', 'relive', 'blank2', 'duvidas', 'motivo', 'confianca', 'invest', ...(idxPropostas.length ? ['propostas'] : []), 'final', 'cta', 'contact']
  // A roda abre sempre na primeira proposta (BASIC)
  const propostaRoda = rodaSel !== null && idxPropostas.includes(rodaSel) ? rodaSel : idxPropostas[0]
  const total  = slides.length

  const goTo = useCallback((idx: number) => {
    if (idx === current || idx < 0 || idx >= total) return
    setDirection(idx > current ? 'right' : 'left')
    setCurrent(idx)
  }, [current, total])

  const diasAte = contact?.data_casamento
    ? Math.max(0, Math.round((new Date(`${contact.data_casamento}T12:00:00`).getTime() - Date.now()) / 86400000))
    : null

  // Primeiro avanço na capa: conta de 0 até aos dias que faltam; só o segundo passa de cena
  const revelarDias = useCallback(() => {
    if (diasAte === null) return
    reveladoEm.current = Date.now()
    setDiasRevelados(true)
    const t0 = performance.now(), dur = 1800
    const passo = (t: number) => {
      const p = Math.min(1, (t - t0) / dur)
      setDiasConta(Math.round(diasAte * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(passo)
    }
    requestAnimationFrame(passo)
  }, [diasAte])

  const prev = useCallback(() => goTo(current - 1), [goTo, current])
  const next = useCallback(() => {
    if (current === 0 && diasAte !== null && !diasRevelados) { revelarDias(); return }
    // Um duplo clique não salta a contagem
    if (current === 0 && Date.now() - reveladoEm.current < 900) return
    goTo(current + 1)
  }, [goTo, current, diasAte, diasRevelados, revelarDias])

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

      // Capa no estilo do topo do /photo: foto esbatida, anéis e tudo ao centro
      case 'cover': {
        const dataEv = contact?.data_casamento ? new Date(`${contact.data_casamento}T12:00:00`) : null
        const dias = dataEv ? Math.max(0, Math.round((dataEv.getTime() - Date.now()) / 86400000)) : null
        return (
          <div className="relative h-full w-full overflow-hidden">
            {/* A mesma foto do topo do menu (/photo): a preto e branco, esbatida, com pontilhado */}
            <div className="rl-ken absolute inset-0 bg-cover bg-[center_35%] grayscale opacity-[0.3]"
              style={{ backgroundImage: "url('/casamentos-2028.webp')" }} />
            <div className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse 55% 50% at 55% 38%, rgba(216,190,147,0.10), transparent 70%)' }} />
            <div className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
                backgroundSize: '26px 26px',
                maskImage: 'radial-gradient(ellipse 70% 60% at 50% 42%, #000 25%, transparent 75%)',
                WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 42%, #000 25%, transparent 75%)',
              }} />
            {/* Anéis finos ao centro, como no /photo */}
            <svg className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] opacity-[0.09]"
              viewBox="0 0 100 100" fill="none" stroke="#d8be93" strokeWidth="0.1" aria-hidden>
              <circle cx="50" cy="50" r="18" />
              <circle cx="50" cy="50" r="30" strokeDasharray="0.5 1.2" />
              <circle cx="50" cy="50" r="44" />
            </svg>
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #070707 0%, rgba(7,7,7,0.45) 20%, rgba(7,7,7,0.55) 65%, #070707 100%)' }} />

            {/* Tudo ao centro: nomes, dias que faltam (como o relógio) e a data */}
            <div className="rl-in relative h-full flex flex-col items-center justify-center text-center px-6 pb-16">
              <p className="text-[11px] sm:text-[13px] font-semibold tracking-[0.4em] uppercase" style={{ color: 'var(--g)' }}>RL Photo.Video · Proposta criativa</p>
              <h1 style={{ fontSize: 'clamp(46px,7vw,84px)', lineHeight: 1.04, marginTop: 18 }}>
                {(nome || 'Para vocês').split(/\s+(?:&|e)\s+/i).map((n: string, i: number) => (
                  <React.Fragment key={i}>{i > 0 && <em> &amp; </em>}{n}</React.Fragment>
                ))}
              </h1>
              {dias !== null && (diasRevelados ? (
                <p key="conta" className="rl-relogio rl-aparece mt-6">
                  <span>{diasConta}</span><span style={{ color: 'var(--g)' }}>{dias === 1 ? 'dia' : 'dias'}</span>
                </p>
              ) : (
                <p key="pergunta" className="rl-pergunta mt-7">
                  Sabem quantos <span style={{ color: 'var(--g)' }}>dias</span> faltam?
                </p>
              ))}
              {dataEv && diasRevelados && (
                <p className="rl-data rl-aparece mt-3">
                  {(() => {
                    const s = dataEv.toLocaleDateString('pt-PT', { weekday: 'long' }).split('-')[0]
                    const m = dataEv.toLocaleDateString('pt-PT', { month: 'long' })
                    const up = (x: string) => x.charAt(0).toUpperCase() + x.slice(1)
                    return `${up(s)} | ${up(m)} ${dataEv.getDate()} ${dataEv.getFullYear()}`
                  })()}
                </p>
              )}
              <p className="lead mt-6" style={{ maxWidth: '34rem' }}>{pp.subtitle}</p>
              <div className="flex flex-col items-center gap-3 mt-8">
                <button type="button" onClick={next} className="btn">
                  {dias !== null && diasRevelados ? 'Avançar' : 'Começar'} <span style={{ color: 'var(--g)' }}>→</span>
                </button>
                <span className="hint">{total} cenas · setas para avançar</span>
              </div>
            </div>
          </div>
        )
      }

      case 'about': return (
        <div className="relative h-full w-full flex flex-col items-center justify-center px-6 sm:px-16" style={{ paddingTop: 150, paddingBottom: 56 }}>

          {/* Título: quem sou, antes do que fazemos ("Sobre nós" fica como etiqueta, editável) */}
          <div className="text-center mb-8">
            <p className="meta" style={{ color: 'var(--g)' }}>{pp.about?.title || 'Sobre Nós'}</p>
            <h2 style={{ fontSize: 'clamp(1.9rem,3.8vw,3.2rem)', lineHeight: 1.12, marginTop: 14 }}>
              <span style={{ display: 'block' }}>Antes de vos contar o que fazemos,</span>
              <em style={{ display: 'block' }}>quero que saibam quem sou.</em>
            </h2>
          </div>

          {/* Conteúdo: foto + vídeo — tamanhos iguais */}
          <div className="flex flex-row items-center gap-10 sm:gap-16 w-full max-w-7xl justify-center">

            {/* Foto vertical */}
            <div className="relative flex-shrink-0" style={{ width: 'clamp(200px,24vw,360px)', height: 'clamp(260px,44vh,480px)' }}>
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
            <div className="relative flex-shrink-0" style={{ width: 'clamp(200px,24vw,360px)', height: 'clamp(260px,44vh,480px)' }}>
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
                  'Um portal só vosso, do primeiro contacto à entrega',
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

      // Mesmo layout da cena da confiança: foto do Wfolio à esquerda, o dia em três momentos à direita
      case 'blank2': {
        const momentos = [
          { t: 'Preparações', d: pp.grandeDia?.p1 },
          { t: 'Cerimónia', d: pp.grandeDia?.p2 },
          { t: 'Golden hour', d: pp.grandeDia?.p3 },
        ].filter(m => m.d)
        return (
          <div className="relative h-full w-full overflow-hidden flex flex-col md:flex-row">
            <div className="relative h-[34%] md:h-full md:w-[46%] shrink-0 overflow-hidden">
              <img src={FOTO_GRANDE_DIA} alt=""
                onError={e => { const alt = pp.grandeDia?.imageUrl || '/eventos-hero-2026.webp'; if (!e.currentTarget.src.endsWith(alt)) e.currentTarget.src = alt }}
                className="rl-ken absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 hidden md:block" style={{ background: 'linear-gradient(90deg, rgba(7,7,7,0) 55%, #070707 100%)' }} />
              <div className="absolute inset-0 md:hidden" style={{ background: 'linear-gradient(180deg, rgba(7,7,7,0) 55%, #070707 100%)' }} />
            </div>
            <div className="relative flex-1 flex items-center px-8 sm:px-14 lg:px-20 pb-20 md:pb-0 md:pt-16">
              <div className="rl-in max-w-xl">
                <p className="eyebrow">Como trabalhamos no dia</p>
                <h2 className="mt-5" style={{ fontSize: 'clamp(2.1rem,4.4vw,3.8rem)', lineHeight: 1.1 }}>O grande <em>dia</em></h2>
                <ol className="rl-dia mt-7">
                  {momentos.map((m, i) => (
                    <li key={i}>
                      <span className="meta" style={{ color: 'var(--g)' }}>{String(i + 1).padStart(2, '0')} · {m.t}</span>
                      <p>{m.d}</p>
                    </li>
                  ))}
                </ol>
                {pp.grandeDia?.note && <p className="hint mt-5" style={{ textTransform: 'none', letterSpacing: '.02em', lineHeight: 1.55, maxWidth: '34rem' }}>{pp.grandeDia.note}</p>}
              </div>
            </div>
          </div>
        )
      }

      case 'blank': {
        // Só a pergunta, ao centro, sobre a foto esbatida
        const blankPhoto = pp.slidePhotos?.['blank'] || pp.reflexao?.imageUrl || '/eventos-hero-2027.webp'
        return (
          <div className="relative h-full w-full overflow-hidden">
            <div className="rl-ken absolute inset-0 bg-cover bg-center grayscale opacity-[0.28]"
              style={{ backgroundImage: `url('${blankPhoto}')` }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #070707 0%, rgba(7,7,7,0.5) 22%, rgba(7,7,7,0.6) 65%, #070707 100%)' }} />
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-8 max-w-3xl mx-auto">
              <h2 className="rl-guiao" style={{ animationDelay: '0.3s', fontSize: 'clamp(2.4rem,6vw,4.4rem)', lineHeight: 1.1 }}>
                Como imaginam <em>o vosso dia?</em>
              </h2>
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


      // As dúvidas que se repetem nas reuniões, respondidas antes de serem ditas: cada cartão vira ao tocar
      case 'duvidas': {
        const duvidas = [
          { q: '“Não fico bem nas fotos.”', a: 'Quase tudo é apanhado sem darem por nós. Não precisam de ter jeito: o ritmo é vosso, não é nosso.' },
          { q: '“Não queremos horas de fotos de grupo.”', a: 'Meia hora, no máximo, e à sombra. As fotos com os mais próximos fazem-se logo a seguir à cerimónia, e voltam para a festa.' },
          { q: '“E se demoram meses a entregar?”', a: 'Os prazos ficam escritos no contrato e no portal veem cada entrega a avançar, sem terem de perguntar.' },
          { q: '“E se o fotógrafo falhar no dia?”', a: 'Não trabalhamos a solo. Há sempre uma equipa por trás, e o vosso dia nunca depende de uma só pessoa.' },
        ]
        return (
          <div className="h-full w-full flex items-center justify-center px-6 sm:px-16" style={{ paddingTop: 120, paddingBottom: 72 }}>
            <div className="rl-in w-full max-w-5xl flex flex-col items-center text-center">
              <h2 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: 1.1 }}>O que os noivos <em>nos perguntam</em></h2>
              <p className="hint mt-4 mb-8">Toquem em cada cartão</p>
              <div className="rl-cartas">
                {duvidas.map((d, i) => (
                  <button key={i} type="button" className={`rl-carta${viradas[i] ? ' on' : ''}`} aria-pressed={!!viradas[i]}
                    onClick={() => setViradas(v => ({ ...v, [i]: !v[i] }))}>
                    <span className="rl-face">
                      <span className="meta">{String(i + 1).padStart(2, '0')}</span>
                      <b>{d.q}</b>
                      <span className="hint">Ver resposta ↻</span>
                    </span>
                    <span className="rl-face rl-verso">
                      <span className="meta" style={{ color: 'var(--g)' }}>A nossa resposta</span>
                      <b>{d.a}</b>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      }

      // Pergunta de fecho antes dos valores: foto à esquerda, pergunta e resposta à direita
      case 'confianca': return (
        <div className="relative h-full w-full overflow-hidden flex flex-col md:flex-row">
          <div className="relative h-[38%] md:h-full md:w-[46%] shrink-0 overflow-hidden">
            <img src={pp.slidePhotos?.['confianca'] || FOTO_CONFIANCA} alt=""
              onError={e => { if (!e.currentTarget.src.endsWith('/eventos-hero-2026.webp')) e.currentTarget.src = '/eventos-hero-2026.webp' }}
              className="rl-ken absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 hidden md:block" style={{ background: 'linear-gradient(90deg, rgba(7,7,7,0) 55%, #070707 100%)' }} />
            <div className="absolute inset-0 md:hidden" style={{ background: 'linear-gradient(180deg, rgba(7,7,7,0) 55%, #070707 100%)' }} />
          </div>
          <div className="relative flex-1 flex items-center px-8 sm:px-14 lg:px-20 pb-20 md:pb-0">
            <div className="rl-in max-w-xl">
              <p className="eyebrow">Uma pergunta antes dos valores</p>
              <h2 className="mt-6" style={{ fontSize: 'clamp(2.1rem,4.4vw,3.8rem)', lineHeight: 1.1 }}>
                Do que viram até agora, <span className="whitespace-nowrap">confiavam&#8209;nos</span> <em className="whitespace-nowrap">o vosso dia?</em>
              </h2>
              <p className="lead mt-6" style={{ maxWidth: '30rem' }}>
                Respondam com o coração. Se ainda houver alguma dúvida, é agora que a resolvemos.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-9">
                <button type="button" className="btn" onClick={() => goTo(slides.indexOf('invest'))}>
                  Sim, confiamos <span style={{ color: 'var(--g)' }}>→</span>
                </button>
                <button type="button" className="pill" onClick={() => goTo(slides.indexOf('duvidas'))}>
                  Ainda temos dúvidas
                </button>
              </div>
            </div>
          </div>
        </div>
      )

      // Cena de conversa (sem formulário): os noivos dizem porque ainda não fecharam,
      // para a proposta ir ao encontro do que procuram. As etiquetas só servem de ponto de partida.
      case 'motivo': {
        const motivoPhoto = pp.slidePhotos?.['motivo'] || ''
        const pistas = ['O orçamento', 'Ainda estão a comparar', 'Encontrar o estilo certo', 'Confiar em quem vai estar lá', 'Prazos e entregas']
        return (
          <div className="relative h-full w-full overflow-hidden flex items-center">
            {motivoPhoto && (
              <img src={motivoPhoto} alt=""
                className="rl-ken-left absolute inset-0 w-full h-full object-cover object-right"
                style={{ maskImage: 'linear-gradient(to left, black 0%, black 40%, transparent 75%)', WebkitMaskImage: 'linear-gradient(to left, black 0%, black 40%, transparent 75%)' }}
              />
            )}
            <div className={`relative z-10 flex flex-col gap-7 ${motivoPhoto ? 'text-left' : 'items-center text-center px-8 sm:px-20 mx-auto'}`}
              style={{ maxWidth: motivoPhoto ? '54%' : '720px', paddingLeft: motivoPhoto ? 'clamp(5rem, 14vw, 12rem)' : undefined }}>
              <h2 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: typo.titleColor, lineHeight: 1.15 }}>
                O que ainda <em>vos faz pensar?</em>
              </h2>
              <p className="font-light leading-relaxed" style={{ fontSize: '20px', color: typo.bodyColor, opacity: 0.75 }}>
                Ainda não fecharam a fotografia e o filme do vosso casamento, e há sempre uma razão.<br />
                Contem-nos com toda a franqueza: o que vos tem feito esperar,
                e o que precisam de sentir para saberem que é a escolha certa?
              </p>
              <div className={`flex flex-wrap gap-2 ${motivoPhoto ? '' : 'justify-center'}`}>
                {pistas.map(t => (
                  <span key={t} className="text-[11px] tracking-[0.18em] uppercase px-3.5 py-2 rounded-full"
                    style={{ border: `1px solid ${typo.accentColor}55`, color: typo.accentColor }}>{t}</span>
                ))}
              </div>
            </div>
            {isAdmin && (
              <label className="absolute bottom-6 right-6 z-20 flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-[10px] tracking-[0.2em] uppercase transition-all"
                style={{ background: 'rgba(201,168,76,0.12)', border: '0.5px solid rgba(201,168,76,0.4)', color: 'rgba(201,168,76,0.8)' }}>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleSlidePhotoUpload('motivo', f) }} />
                {uploadingSlidePhoto === 'motivo' ? '⏳' : motivoPhoto ? '✦ Trocar foto' : '⬆ Foto direita'}
              </label>
            )}
          </div>
        )
      }

      case 'intro': {
        // Fundo como a capa: foto a preto e branco esbatida, texto ao centro
        const introPhoto = pp.slidePhotos?.['intro'] || pp.couple?.imageUrl || '/prewedding-hero.webp'
        return (
          <div className="relative h-full w-full overflow-hidden">
            <div className="rl-ken absolute inset-0 bg-cover bg-center grayscale opacity-[0.3]"
              style={{ backgroundImage: `url('${introPhoto}')` }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #070707 0%, rgba(7,7,7,0.45) 22%, rgba(7,7,7,0.55) 65%, #070707 100%)' }} />
            <div className="relative flex flex-col items-center justify-center h-full text-center px-8 sm:px-20 gap-8 max-w-3xl mx-auto">
              <h2 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', lineHeight: 1.1 }}>
                Quem são os <em>meus noivos?</em>
              </h2>
              <p className={`${fontClass(typo.bodyFont)} text-2xl sm:text-3xl italic font-light leading-relaxed`} style={{ color: typo.bodyColor }}>
                &ldquo;{pp.intro}&rdquo;
              </p>
            </div>
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
          {idxPropostas.length > 0 && <p className="hint mt-9">{idxPropostas.length === 1 ? 'Uma proposta a seguir' : `${['Nenhuma', 'Uma', 'Duas', 'Três', 'Quatro'][idxPropostas.length]} propostas a seguir`}</p>}
        </div>
      )

      // Todas as propostas numa cena: a roda à direita escolhe, o cartão completo fica à esquerda
      case 'propostas': {
        // Foto de cada cartão: a carregada no editor para essa proposta, senão uma do Wfolio
        // (fotos 9, 16, 15 e 8 da galeria), senão uma das fotos da app
        const WF = [8, 15, 14, 7]
        const LOCAIS = ['/prewedding-hero.webp', '/eventos-hero-2027.webp', '/eventos-hero-2026.webp', '/casamentos-2028.webp']
        const itens = idxPropostas.map((i, k) => ({
          idx: i,
          nome: content.propostas?.[i]?.nome || nomePropostaPadrao(i),
          img: pp.slidePhotos?.[`pkg-${i}`] || wfolio[WF[k]] || LOCAIS[k] || '',
          recomendada: (pp.propostaAtiva ?? 1) === i,
        }))
        return (
          <div className="rl-roda relative h-full w-full">
            <div className="hidden min-[901px]:block"><RodaPropostas itens={itens} sel={propostaRoda} onSel={setRodaSel} /></div>
            {/* Telemóvel: em vez da roda, um botão por proposta */}
            <div className="min-[901px]:hidden absolute left-0 right-0 flex justify-center gap-2 px-4 z-10" style={{ top: 138 }}>
              {itens.map(it => (
                <button key={it.idx} type="button" className={`pill${it.idx === propostaRoda ? ' on' : ''}`} onClick={() => setRodaSel(it.idx)}>{it.nome}</button>
              ))}
            </div>
            <div key={propostaRoda} className="rl-roda-cartao">{renderSlide(`pkg-${propostaRoda}`)}</div>
          </div>
        )
      }

      case 'pkg-0':
      case 'pkg-1':
      case 'pkg-2':
      case 'pkg-3': {
        const idx = parseInt(id.split('-')[1])
        const proposta: Proposta = content.propostas?.[idx] || { nome: '', servicos_foto: [], servicos_video: [], valor: '' }
        const isAtiva = (pp.propostaAtiva ?? 1) === idx
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
        const momentos = restante > 0
          ? [
              { v: `${ADJUDICACAO.toLocaleString('pt-PT')} €`, l: 'Hoje, reserva a data' },
              { v: `${reforco.toLocaleString('pt-PT')} €`,     l: 'Até 2 dias antes' },
              { v: `${valorFinal.toLocaleString('pt-PT')} €`,  l: 'Após o dia' },
            ]
          : []
        // ── Plano de pagamento do reforço ─────────────────────────
        // Divide o valor a liquidar até 2 dias antes do casamento em
        // prestações mensais, nunca abaixo de 200 €.
        const MIN_PRESTACAO = 200
        const dataEvento = contact?.data_casamento ? new Date(`${contact.data_casamento}T00:00:00`) : null
        const limitePlano = dataEvento ? new Date(dataEvento.getTime() - 2 * 86400000) : null
        const hojeD = new Date()
        const mesesAteLimite = limitePlano
          ? Math.max(0, (limitePlano.getFullYear() - hojeD.getFullYear()) * 12 + (limitePlano.getMonth() - hojeD.getMonth()))
          : 0
        const maxPorValor   = Math.floor(reforco / MIN_PRESTACAO)
        const maxPrestacoes = Math.max(1, Math.min(mesesAteLimite > 0 ? mesesAteLimite : maxPorValor, maxPorValor))
        const nPlano        = Math.min(Math.max(1, planoN[idx] ?? maxPrestacoes), maxPrestacoes)
        const valorMes      = nPlano > 0 ? reforco / nPlano : 0
        const mesesAteEvento = dataEvento
          ? Math.max(0, (dataEvento.getFullYear() - hojeD.getFullYear()) * 12 + (dataEvento.getMonth() - hojeD.getMonth()))
          : 0
        const limiteLabel = limitePlano
          ? limitePlano.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
          : ''
        const nomeEvento = 'o casamento'
        const mesLabel = (d: Date) => d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
        const mesFim   = limitePlano ? new Date(limitePlano.getFullYear(), limitePlano.getMonth(), 1) : null
        const mesIni   = mesFim ? new Date(mesFim.getFullYear(), mesFim.getMonth() - (nPlano - 1), 1) : null
        const planoPossivel = reforco >= MIN_PRESTACAO
        // Mesmo layout do cartão da proposta desdobrável do portal (app/_lead/PropostasDropdown.tsx)
        const nomeP = proposta.nome || nomePropostaPadrao(idx)
        const det = DETALHES_PROPOSTAS[(nomeP || '').trim().toUpperCase()]
        const inclui = !!incluiOpen[idx]
        const opcoesAbertas = !!extrasOpen[idx] || (planoPossivel && !!formaOpen[idx])
        const painelOpcoes = (<>
              {extrasOpen[idx] && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {(content.extras_proposta || []).length > 0
                    ? (content.extras_proposta || []).map((e, i) => (
                        <button key={i} type="button" onClick={() => toggleExtraSlide(e.nome)}
                          className={`pill${selectedExtras.includes(e.nome) ? ' on' : ''}`}>{e.nome}</button>
                      ))
                    : <p className="hint">Sem serviços extras definidos</p>}
                </div>
              )}

              {planoPossivel && formaOpen[idx] && (
                <div className="mt-3" style={{ border: '1px solid var(--line-soft)', borderRadius: 12, padding: 'clamp(10px,1.7vh,15px) 15px' }}>
                  {dataEvento && (
                    <p className="meta mb-3" style={{ color: 'var(--g)' }}>
                      Faltam {mesesAteEvento} {mesesAteEvento === 1 ? 'mês' : 'meses'} para {nomeEvento}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                    <div className="flex items-center gap-3">
                      <span className="hint">{reforco.toLocaleString('pt-PT')} € em</span>
                      <button type="button" aria-label="Menos uma prestação" disabled={nPlano <= 1}
                        onClick={() => setPlanoN(p => ({ ...p, [idx]: Math.max(1, nPlano - 1) }))}
                        style={{ width: '28px', height: '28px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--g)', cursor: nPlano <= 1 ? 'not-allowed' : 'pointer', opacity: nPlano <= 1 ? .3 : 1, lineHeight: 1 }}>&minus;</button>
                      <span style={{ fontFamily: 'var(--fs)', fontSize: '26px', lineHeight: 1, color: 'var(--tx)', minWidth: '32px', textAlign: 'center' }}>{nPlano}</span>
                      <button type="button" aria-label="Mais uma prestação" disabled={nPlano >= maxPrestacoes}
                        onClick={() => setPlanoN(p => ({ ...p, [idx]: Math.min(maxPrestacoes, nPlano + 1) }))}
                        style={{ width: '28px', height: '28px', border: '1px solid var(--line)', background: 'transparent', color: 'var(--g)', cursor: nPlano >= maxPrestacoes ? 'not-allowed' : 'pointer', opacity: nPlano >= maxPrestacoes ? .3 : 1, lineHeight: 1 }}>+</button>
                      <span className="hint">{nPlano === 1 ? 'prestação' : 'prestações'}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p style={{ fontFamily: 'var(--fs)', fontWeight: 300, fontSize: 'clamp(24px,3.4vh,34px)', lineHeight: 1, color: 'var(--g)' }}>
                        {valorMes.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                      </p>
                      <span className="hint">por mês</span>
                    </div>
                  </div>
                  <p className="hint mt-3" style={{ lineHeight: 1.55 }}>
                    {mesIni && mesFim ? `De ${mesLabel(mesIni)} a ${mesLabel(mesFim)}` : ''}
                    {limiteLabel ? `, liquidado até ${limiteLabel}` : ''}
                    {mesIni && mesFim ? '. ' : ''}
                    Mínimo {MIN_PRESTACAO} € por prestação. A adjudicação e o valor final ficam de fora.
                  </p>
                </div>
              )}
        </>)
        return (
          <div className="rl-pwrap" style={{ top: 180 }}>
            {/* Computador: extras e plano de pagamento abrem num painel à esquerda */}
            {opcoesAbertas && (
              <aside className="rl-pleft">
                <div className="flex items-center justify-between gap-3">
                  <p className="meta" style={{ color: 'var(--g)' }}>
                    {extrasOpen[idx] && planoPossivel && formaOpen[idx] ? 'Extras e pagamento' : extrasOpen[idx] ? 'Serviços extras' : 'Plano de pagamento'}
                  </p>
                  <button type="button" aria-label="Fechar" className="rl-pfechar"
                    onClick={() => { setExtrasOpen(prev => ({ ...prev, [idx]: false })); setFormaOpen(prev => ({ ...prev, [idx]: false })) }}>×</button>
                </div>
                {painelOpcoes}
              </aside>
            )}
            <div className={`rl-pcard${isAtiva ? ' top' : ''}`}>
              <p className="meta" style={{ color: 'var(--g)' }}>Proposta {String(idx + 1).padStart(2, '0')}</p>
              <h3 className="rl-pnome">{nomeP}</h3>
              {(proposta.notas?.trim() || det?.explicacao) && <p className="rl-pexp">{proposta.notas?.trim() || det?.explicacao}</p>}
              {ofertaDaProposta(proposta, idx) && <p className="rl-poferta"><b>✦ Oferta</b>{ofertaDaProposta(proposta, idx)}</p>}

              <div className="rl-pvalor">
                <p className="meta mb-2">{selectedExtras.length > 0 ? 'Total com extras' : 'Investimento total'}</p>
                <b>{displayValor || 'Sob consulta'}</b>
                {selectedExtras.length > 0 && baseValor > 0 && (
                  <small>base {proposta.valor.trim().includes('€') ? proposta.valor : `${proposta.valor} €`}</small>
                )}
              </div>

              {momentos.length > 0 && (
                <div className="rl-pmomentos">
                  {momentos.map((m, i) => (
                    <div key={i}><span className="hint">{m.l}</span><span className="v">{m.v}</span></div>
                  ))}
                </div>
              )}

              {/* Alguns serviços logo à vista; o resto abre em "Ver tudo o que inclui" */}
              {hasAny && !inclui && (() => {
                const todos = [...(proposta.servicos_foto || []), ...(proposta.servicos_video || [])].filter(Boolean)
                return (
                  <ul className="rl-presumo">
                    {todos.slice(0, 5).map((sv, i) => <li key={i}>{sv}</li>)}
                    {todos.length > 5 && <li className="mais">e mais {todos.length - 5}</li>}
                  </ul>
                )
              })()}
              <button type="button" className={`rl-pver${inclui ? ' on' : ''}`} onClick={() => setIncluiOpen(prev => ({ ...prev, [idx]: !prev[idx] }))} aria-expanded={inclui}>
                {inclui ? 'Esconder' : 'Ver tudo o que inclui'} <span>⌄</span>
              </button>
              <div className={`rl-pinclui${inclui ? ' on' : ''}`}>
                <div>
                  {hasAny ? (<>
                    {hasFoto && (<>
                      <p className="meta" style={{ margin: '14px 0 8px' }}>Fotografia</p>
                      <ul>{(proposta.servicos_foto || []).map((sv, i) => <li key={i}>{sv}</li>)}</ul>
                    </>)}
                    {hasVideo && (<>
                      <p className="meta" style={{ margin: '14px 0 8px' }}>Filme</p>
                      <ul>{(proposta.servicos_video || []).map((sv, i) => <li key={i}>{sv}</li>)}</ul>
                    </>)}
                  </>) : <p className="hint" style={{ marginTop: 12 }}>Serviços a definir no CRM</p>}
                </div>
              </div>

              {/* Extras e plano de pagamento */}
              <div className="rl-pbotoes flex flex-wrap gap-2 mt-5">
                <button type="button" className={`pill${extrasOpen[idx] ? ' on' : ''}`}
                  onClick={() => setExtrasOpen(prev => ({ ...prev, [idx]: !prev[idx] }))}>
                  Serviços extras{selectedExtras.length > 0 ? ` (${selectedExtras.length})` : ''}
                </button>
                {planoPossivel && (
                  <button type="button" className={`pill${formaOpen[idx] ? ' on' : ''}`}
                    onClick={() => setFormaOpen(prev => ({ ...prev, [idx]: !prev[idx] }))}>
                    Plano de pagamento
                  </button>
                )}
              </div>

              {/* Telemóvel: extras e plano abrem por baixo, dentro do cartão */}
              <div className="rl-pbaixo">{painelOpcoes}</div>

              <div className="rl-pescolher">
                {escolhida === idx ? (
                  <a href={`/r/${token}`} className="btn" style={{ width: '100%' }}>
                    <span className="fill" />
                    ✓ Escolhida
                  </a>
                ) : (
                  <button type="button" onClick={() => setEscolhida(idx)} className="btn" style={{ width: '100%' }}>
                    <span className="fill" />
                    Escolher esta
                  </button>
                )}
              </div>
            </div>

            {/* Ao lado (computador): o que está incluído, sempre à vista */}
            <aside className={`rl-pside${isAtiva ? ' top' : ''}`}>
              <p className="meta" style={{ color: 'var(--g)' }}>O que inclui</p>
              <h4 className="rl-pside-t">{nomeP}</h4>
              {hasAny ? (<>
                {hasFoto && (<>
                  <p className="meta" style={{ margin: '22px 0 10px' }}>Fotografia</p>
                  <ul>{(proposta.servicos_foto || []).map((sv, i) => <li key={i}>{sv}</li>)}</ul>
                </>)}
                {hasVideo && (<>
                  <p className="meta" style={{ margin: '22px 0 10px' }}>Filme</p>
                  <ul>{(proposta.servicos_video || []).map((sv, i) => <li key={i}>{sv}</li>)}</ul>
                </>)}
                {selectedExtras.length > 0 && (<>
                  <p className="meta" style={{ margin: '22px 0 10px' }}>Extras escolhidos</p>
                  <ul>{selectedExtras.map((sv, i) => <li key={i}>{sv}</li>)}</ul>
                </>)}
              </>) : <p className="hint" style={{ marginTop: 16 }}>Serviços a definir no CRM</p>}
            </aside>
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
    <div className="nlead rl-app font-cond relative w-full overflow-hidden" style={{ height: '100dvh', background: '#070707' }}>

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
        .rl-tkt { display: flex }
        .rl-tkt .rl-stub { width: 292px; flex-shrink: 0; border-left: 1px dashed rgba(216,190,147,.34) }
        @media (max-width: 760px) {
          .rl-tkt { flex-direction: column }
          .rl-tkt .rl-stub { width: 100%; border-left: none; border-top: 1px dashed rgba(216,190,147,.34) }
          .rl-notch { display: none }
        }
        /* Cartão da proposta: mesmo desenho do desdobrável do portal (PropostasDropdown) */
        /* Área fixa entre o logótipo (topo) e a barra dos slides (fundo): nada se sobrepõe */
        .rl-pwrap { position: absolute; left: 0; right: 0; bottom: 72px; display: flex; align-items: center; justify-content: center; gap: 22px; padding: 0 16px; box-sizing: border-box }
        .rl-pleft { width: 100%; max-width: 360px; max-height: 100%; overflow-y: auto; scrollbar-width: none; padding: 30px 26px; border-radius: 20px; border: 1px solid rgba(216,190,147,.3); background: rgba(216,190,147,.03); align-self: center; animation: rlPEntra .45s cubic-bezier(.2,.7,.2,1) both }
        .rl-pfechar { background: none; border: none; color: var(--tx-dim); font-size: 22px; line-height: 1; cursor: pointer }
        .rl-pfechar:hover { color: var(--g) }
        @keyframes rlPEntra { from { opacity: 0; transform: translateX(18px) } to { opacity: 1; transform: none } }
        @media (min-width: 901px) { .rl-pcard .rl-pbaixo { display: none } }
        @media (max-width: 900px) { .rl-pleft { display: none } }
        @media (max-width: 1260px) { .rl-pwrap:has(.rl-pleft) .rl-pside { display: none } }
        .rl-pside { width: 100%; max-width: 360px; max-height: 100%; overflow-y: auto; scrollbar-width: none; padding: 34px 28px; border-radius: 20px; border: 1px solid var(--line-soft); background: rgba(255,255,255,.015); align-self: center }
        .rl-pside.top { border-color: rgba(216,190,147,.3) }
        .rl-pside-t { font-family: var(--fs); font-weight: 300; font-size: 28px; line-height: 1.1; color: var(--tx); margin: 8px 0 0 }
        .rl-pside ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px }
        .rl-pside li { position: relative; padding-left: 22px; font-family: var(--fd); font-weight: 300; font-size: 15px; line-height: 1.5; color: var(--tx-mid) }
        .rl-pside li::before { content: ""; position: absolute; left: 0; top: .65em; width: 10px; height: 1px; background: var(--g) }
        @media (min-width: 901px) { .rl-pcard .rl-pver, .rl-pcard .rl-pinclui { display: none } }
        @media (max-width: 900px) { .rl-pside { display: none } }
        .rl-pcard { position: relative; width: 100%; max-width: 460px; max-height: 100%; overflow-y: auto; padding: 34px 28px 26px; border-radius: 20px; border: 1px solid var(--line); background: linear-gradient(180deg, rgba(255,255,255,.035), rgba(255,255,255,.01)); scrollbar-width: none }
        .rl-pcard::-webkit-scrollbar { display: none }
        .rl-pescolher { position: sticky; bottom: -26px; margin: 22px -28px -26px; padding: 16px 28px 26px; background: linear-gradient(to top, #121110 70%, rgba(18,17,16,0)) }
        .rl-pcard.top { border-color: rgba(216,190,147,.55); background: radial-gradient(120% 90% at 50% 0%, rgba(216,190,147,.13), transparent 60%), rgba(255,255,255,.02); box-shadow: 0 30px 70px -35px rgba(216,190,147,.5) }
        .rl-pbadge { display: inline-block; margin-bottom: 14px; white-space: nowrap; padding: 6px 14px; border-radius: 999px; background: var(--g); color: #0b0a08; font-family: var(--fm); font-size: 9.5px; letter-spacing: .2em; text-transform: uppercase }
        .rl-pnome { font-family: var(--fs); font-weight: 300; font-size: clamp(32px, 5vh, 42px); line-height: 1.05; color: var(--tx); margin: 10px 0 0 }
        .rl-pexp { margin: 12px 0 0; color: var(--tx-mid); font-family: var(--fd); font-weight: 300; font-size: 15px; line-height: 1.65 }
        .rl-poferta { margin: 16px 0 0; padding: 12px 14px; border-radius: 12px; border: 1px dashed rgba(216,190,147,.55); background: rgba(216,190,147,.08); color: var(--tx); font-family: var(--fd); font-size: 14px; line-height: 1.55 }
        .rl-poferta b { display: block; margin-bottom: 4px; font-family: var(--fm); font-weight: 400; font-size: 9.5px; letter-spacing: .24em; text-transform: uppercase; color: var(--g) }
        .rl-pvalor { margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--line-soft) }
        .rl-pvalor b { display: block; font-family: var(--fs); font-weight: 400; font-size: clamp(36px, 5.4vh, 46px); line-height: 1; color: var(--g) }
        .rl-pvalor small { display: block; margin-top: 6px; font-size: 12px; color: var(--tx-dim) }
        .rl-pmomentos { margin-top: 14px }
        .rl-pmomentos > div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--line-soft) }
        .rl-pmomentos .v { font-family: var(--fs); font-size: 19px; color: var(--tx); white-space: nowrap }
        .rl-pver { margin-top: 14px; display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 12px 0; background: none; border: none; border-bottom: 1px solid var(--line-soft); cursor: pointer; color: var(--tx); font-family: var(--fm); font-size: 10.5px; letter-spacing: .2em; text-transform: uppercase }
        .rl-pver span { color: var(--g); font-size: 16px; transition: transform .4s ease }
        .rl-pver.on span { transform: rotate(180deg) }
        .rl-pinclui { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .5s cubic-bezier(.2,.7,.2,1) }
        .rl-pinclui.on { grid-template-rows: 1fr }
        .rl-pinclui > div { overflow: hidden }
        .rl-pinclui ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 7px }
        .rl-pinclui li { position: relative; padding-left: 20px; font-family: var(--fd); font-weight: 300; font-size: 14px; line-height: 1.5; color: var(--tx-mid) }
        .rl-pinclui li::before { content: ""; position: absolute; left: 0; top: .6em; width: 9px; height: 1px; background: var(--g) }
        .rl-cta { transition: transform 0.25s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease, background 0.25s ease }
        .rl-cta:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(201,168,76,0.22) }
        @media (prefers-reduced-motion: reduce) {
          .rl-in > *, .rl-glow, .rl-rule, .rl-ken, .rl-ken-left, .rl-guiao { animation: none !important }
        }

        /* ── Layout da app (CRM, /photo, ficha do evento): Roboto Condensed, títulos
           em negrito com o destaque em dourado, cartões de vidro e botões redondos ── */
        .rl-app {
          --ink: #070707; --g: #d8be93; --g-deep: #9c7c47;
          --tx: #ffffff; --tx-mid: rgba(255,255,255,.6); --tx-dim: rgba(255,255,255,.4);
          --line: rgba(216,190,147,.3); --line-soft: rgba(255,255,255,.08);
          /* Letras do relógio do portal dos noivos: nomes em Jost 200, números em Roboto Condensed 100 */
          --fs: 'Jost', sans-serif; --fd: 'Roboto Condensed', sans-serif;
          --fb: 'Roboto Condensed', sans-serif; --fm: 'Roboto Condensed', sans-serif;
          --fn: 'Roboto Condensed', sans-serif;
          font-weight: 300;
        }
        .rl-app .fx-grain { display: none }
        .rl-app h1, .rl-app h2 { font-family: var(--fs); font-weight: 200; letter-spacing: 0; line-height: 1.04; color: #fff }
        .rl-app h1 em, .rl-app h2 em { font-style: normal; color: var(--g) }
        .rl-app .rl-relogio { font-family: var(--fn); font-weight: 100; line-height: .85; letter-spacing: .02em; font-size: clamp(84px,11vw,124px); color: rgba(255,255,255,.9) }
        .rl-app .rl-pergunta { font-family: var(--fs); font-weight: 200; font-size: clamp(30px,4.2vw,52px); line-height: 1.1; color: rgba(255,255,255,.9) }
        /* Propostas em roda: o cartão completo fica à esquerda, a roda à direita */
        .rl-app .rl-presumo { list-style: none; margin: 16px 0 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px }
        .rl-app .rl-presumo li { position: relative; padding-left: 18px; font-weight: 300; font-size: 14px; line-height: 1.4; color: rgba(255,255,255,.8) }
        .rl-app .rl-presumo li::before { content: ""; position: absolute; left: 0; top: .65em; width: 9px; height: 1px; background: var(--g) }
        .rl-app .rl-presumo li.mais { color: var(--g); font-size: 12px; letter-spacing: .12em; text-transform: uppercase; padding-top: 1px }
        .rl-app .rl-presumo li.mais::before { display: none }
        /* Na roda: nome, preço e serviços primeiro; o resto por baixo */
        .rl-app .rl-roda .rl-pcard { display: flex; flex-direction: column }
        .rl-app .rl-roda .rl-pcard > .meta { order: 1 } .rl-app .rl-roda .rl-pnome { order: 2 }
        .rl-app .rl-roda .rl-pvalor { order: 3; margin-top: 14px; padding-top: 14px }
        .rl-app .rl-roda .rl-presumo { order: 4 } .rl-app .rl-roda .rl-pver { order: 5 } .rl-app .rl-roda .rl-pinclui { order: 6 }
        .rl-app .rl-roda .rl-pmomentos { order: 7 } .rl-app .rl-roda .rl-poferta { order: 8 } .rl-app .rl-roda .rl-pexp { order: 9; display: none }
        .rl-app .rl-roda .rl-pbotoes { order: 10 } .rl-app .rl-roda .rl-pbaixo { order: 11 } .rl-app .rl-roda .rl-pescolher { order: 12 }
        /* Cartão compacto e sem botão colado por cima: "Escolher esta" fica a seguir aos botões */
        .rl-app .rl-roda .rl-pcard { padding: 28px 26px 24px }
        .rl-app .rl-roda .rl-pescolher { position: static; margin: 16px 0 0; padding: 0; background: none }
        .rl-app .rl-roda .rl-pvalor b { font-size: clamp(44px,6.4vh,60px) }
        .rl-app .rl-roda .rl-pmomentos { margin-top: 8px }
        .rl-app .rl-roda .rl-pmomentos > div { padding: 6px 0 }
        .rl-app .rl-roda .rl-poferta { margin-top: 12px; padding: 10px 12px; font-size: 13px }
        .rl-app .rl-roda .rl-pbotoes { margin-top: 14px }
        /* Os dois cartões com o mesmo tamanho: mesma largura e a altura toda da área */
        @media (min-width: 901px) {
          .rl-app .rl-roda .rl-pwrap { align-items: stretch }
          .rl-app .rl-roda .rl-pcard, .rl-app .rl-roda .rl-pside { flex: 1 1 0; width: 100%; max-width: 390px !important; align-self: stretch }
          .rl-app .rl-roda .rl-pescolher { margin-top: auto; padding-top: 16px }
        }
        /* "O que inclui" compacto, para as propostas com muitos serviços caberem sem scroll */
        .rl-app .rl-roda .rl-pside { padding: 24px 24px 20px }
        .rl-app .rl-roda .rl-pside .meta { margin: 14px 0 6px !important }
        .rl-app .rl-roda .rl-pside > .meta:first-child { margin-top: 0 !important }
        .rl-app .rl-roda .rl-pside ul { gap: 3px }
        .rl-app .rl-roda .rl-pside li { font-size: 18px; line-height: 1.25 }
        .rl-app .rl-roda-cartao { position: absolute; inset: 0; pointer-events: none; animation: rlPEntra .45s cubic-bezier(.2,.7,.2,1) both }
        .rl-app .rl-roda-cartao .rl-pwrap { pointer-events: none }
        .rl-app .rl-roda-cartao .rl-pwrap > * { pointer-events: auto }
        /* Computador: cartão + "O que inclui" lado a lado, a roda encostada à direita */
        @media (min-width: 901px) {
          .rl-app .rl-roda .rl-pwrap { right: 27%; justify-content: center; padding: 0 1.5vw 0 4vw }
          .rl-app .rl-roda .rl-pleft, .rl-app .rl-roda .rl-presumo { display: none }
          .rl-app .rl-roda .rl-pside { display: block; max-width: 340px }
          .rl-app .rl-roda .rl-pcard { max-width: 420px }
          .rl-app .rl-roda .rl-pcard .rl-pbaixo { display: block }
        }
        @media (max-width: 900px) { .rl-app .rl-roda .rl-pwrap { top: 196px !important } }

        /* O grande dia: três momentos numa linha dourada */
        .rl-app .rl-dia { list-style: none; margin: 0; padding: 0 0 0 22px; border-left: 1px solid rgba(216,190,147,.3); display: flex; flex-direction: column; gap: 18px }
        .rl-app .rl-dia li { position: relative }
        .rl-app .rl-dia li::before { content: ""; position: absolute; left: -27px; top: 3px; width: 9px; height: 9px; border-radius: 50%; background: #070707; border: 1px solid var(--g) }
        .rl-app .rl-dia p { margin-top: 6px; font-weight: 300; font-size: clamp(15px,1.15vw,17px); line-height: 1.6; color: rgba(255,255,255,.7) }

        /* Cartões das dúvidas: vidro escuro com contorno dourado, viram ao tocar */
        .rl-app .rl-cartas { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 16px; width: 100% }
        .rl-app .rl-carta { position: relative; height: clamp(220px,36vh,300px); perspective: 1200px; background: none; border: none; padding: 0; cursor: pointer; text-align: left }
        .rl-app .rl-face { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; padding: 24px 22px;
          border-radius: 22px; border: 1px solid rgba(255,255,255,.1); background: rgba(17,17,17,.8); backdrop-filter: blur(24px);
          backface-visibility: hidden; -webkit-backface-visibility: hidden; transition: transform .8s cubic-bezier(.16,1,.3,1), border-color .3s }
        .rl-app .rl-face b { font-family: var(--fs); font-weight: 200; font-size: clamp(21px,1.9vw,27px); line-height: 1.2; color: #fff }
        .rl-app .rl-verso { transform: rotateY(180deg); border-color: rgba(216,190,147,.45); box-shadow: 0 0 48px -22px rgba(216,190,147,.55);
          background: radial-gradient(120% 90% at 50% 0%, rgba(216,190,147,.12), transparent 65%), rgba(17,17,17,.9) }
        .rl-app .rl-verso b { font-family: var(--fd); font-weight: 300; font-size: clamp(15px,1.15vw,17px); line-height: 1.55; color: rgba(255,255,255,.75) }
        .rl-app .rl-carta:hover .rl-face:not(.rl-verso) { border-color: rgba(216,190,147,.4) }
        .rl-app .rl-carta.on .rl-face:not(.rl-verso) { transform: rotateY(-180deg) }
        .rl-app .rl-carta.on .rl-verso { transform: rotateY(0) }
        @media (max-width: 900px) { .rl-app .rl-cartas { grid-template-columns: 1fr 1fr } .rl-app .rl-carta { height: 210px } }
        @media (max-width: 480px) { .rl-app .rl-carta { height: 190px } .rl-app .rl-face { padding: 18px 16px } .rl-app .rl-face b { font-size: 19px } .rl-app .rl-verso b { font-size: 13.5px } }
        .rl-app .rl-guiao { animation: rlGuiao 1.1s cubic-bezier(0.22,1,0.36,1) both }
        @keyframes rlGuiao { from { opacity: 0; filter: blur(8px); transform: translateY(10px) } to { opacity: 1; filter: none; transform: none } }
        .rl-app .rl-aparece { animation: rlRise .7s cubic-bezier(0.22,1,0.36,1) both }
        .rl-app .rl-data { font-family: var(--fn); font-weight: 300; font-size: clamp(17px,1.6vw,20px); letter-spacing: .04em; color: rgba(255,255,255,.75) }
        .rl-app .font-cormorant, .rl-app .font-playfair { font-family: var(--fd) !important; font-weight: 300 !important }
        .rl-app .eyebrow { font-size: 11px; font-weight: 500; letter-spacing: .2em; color: var(--g) }
        .rl-app .eyebrow::before { width: 12px; background: var(--g); opacity: 1 }
        .rl-app .lead { font-weight: 300; font-size: clamp(16px,1.3vw,19px); color: rgba(255,255,255,.6) }
        .rl-app .meta { font-size: 11px; font-weight: 500; letter-spacing: .2em; color: rgba(255,255,255,.45) }
        .rl-app .hint { font-size: 11px; letter-spacing: .14em; color: rgba(255,255,255,.35) }
        .rl-app .btn { gap: .6em; padding: 11px 22px; border-radius: 999px; background: rgba(14,14,14,.9); border: 1px solid rgba(201,168,76,.45);
          color: #fff; font-size: 15px; font-weight: 600; letter-spacing: 0; text-transform: none; box-shadow: 0 0 28px -12px rgba(201,168,76,.6);
          backdrop-filter: blur(12px); transition: border-color .3s, transform .3s }
        .rl-app .btn:hover { color: #fff; border-color: rgba(201,168,76,.8); transform: translateY(-1px) }
        .rl-app .btn .fill { display: none }
        .rl-app .pill { font-size: 13px; font-weight: 600; letter-spacing: .02em; text-transform: none; color: rgba(255,255,255,.75);
          border: 1px solid rgba(255,255,255,.14); background: rgba(14,14,14,.9); padding: 8px 16px }
        .rl-app .pill:hover { border-color: rgba(255,255,255,.3); color: #fff }
        .rl-app .pill.on { border-color: rgba(201,168,76,.7); background: rgba(201,168,76,.15); color: #fff }
        .rl-app .fotograma.feito { background: rgba(201,168,76,.4) }

        /* Cartão de vidro, como o "Pulso do estúdio" e o resumo do CRM */
        .rl-app .rl-card { border-radius: 22px; border: 1px solid rgba(201,168,76,.3); background: rgba(17,17,17,.8); backdrop-filter: blur(24px);
          padding: 20px; box-shadow: 0 0 48px -22px rgba(201,168,76,.5) }
        .rl-app .rl-card-t { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: rgba(255,255,255,.85) }
        .rl-app .rl-card-t span { width: 6px; height: 6px; border-radius: 50%; background: var(--g); box-shadow: 0 0 8px var(--g) }

        /* Cartões das propostas com o mesmo vidro */
        .rl-app .rl-pcard, .rl-app .rl-pside, .rl-app .rl-pleft { border-radius: 22px; border-color: rgba(255,255,255,.1); background: rgba(17,17,17,.8); backdrop-filter: blur(24px) }
        .rl-app .rl-pcard.top, .rl-app .rl-pside.top { border-color: rgba(201,168,76,.45); background: rgba(17,17,17,.85); box-shadow: 0 0 48px -22px rgba(201,168,76,.55) }
        .rl-app .rl-pescolher { background: linear-gradient(to top, #111 70%, rgba(17,17,17,0)) }
        .rl-app .rl-pnome { font-weight: 200; letter-spacing: .01em; font-size: clamp(36px,5.6vh,48px) }
        .rl-app .rl-pside-t { font-weight: 200 }
        .rl-app .rl-pvalor b { font-family: var(--fn); font-weight: 100; font-size: clamp(52px,8vh,76px); line-height: .9 }
        .rl-app .rl-pmomentos .v { font-family: var(--fn); font-weight: 300 }
        .rl-app .rl-card .font-semibold { font-family: var(--fn); font-weight: 300 }
        .rl-app .rl-pver { font-weight: 600; letter-spacing: .12em }
        .rl-app .rl-poferta { border-style: solid; border-color: rgba(201,168,76,.35); background: rgba(201,168,76,.1) }
        .rl-app .rl-poferta b { font-weight: 600 }
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
            {pp.slidePhotos?.[slides[current]] && !['cover', 'intro', 'blank', 'blank2', 'confianca'].includes(slides[current]) && (
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
      <div className={`absolute left-10 sm:left-16 lg:left-20 right-6 sm:right-10 flex items-center gap-1.5 z-30 ${isAdmin ? 'bottom-6' : 'bottom-7'}`}>
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
        <p className={`eyebrow absolute left-10 sm:left-16 lg:left-20 z-30 ${isAdmin ? 'top-16' : 'top-8'}`}>
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
                    ['motivo', 'O que ainda vos faz pensar?'],
                    ['relive', 'Portal dos Noivos'],
                    ['blank',  'Como imaginam o dia?'],
                    ['blank2', 'O Grande Dia'],
                    ['invest', 'Investimento'],
                    ...idxPropostas.map(i => [`pkg-${i}`, content.propostas?.[i]?.nome || nomePropostaPadrao(i)]),
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
                  {idxPropostas.map(i => (
                    <button key={i} onClick={() => setPage('propostaAtiva', i)}
                      className="flex-1 py-2 rounded-lg text-xs transition-all"
                      style={(pp.propostaAtiva ?? 1) === i
                        ? { background: 'rgba(201,168,76,0.2)', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' }
                        : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {content.propostas?.[i]?.nome || nomePropostaPadrao(i)}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {idxPropostas.map(i => {
                    const p = content.propostas?.[i]
                    const sf = p?.servicos_foto?.filter(Boolean) || []
                    const sv = p?.servicos_video?.filter(Boolean) || []
                    return (
                      <div key={i} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-[10px] tracking-widest text-white/25 uppercase mb-1">{p?.nome || nomePropostaPadrao(i)}</p>
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
