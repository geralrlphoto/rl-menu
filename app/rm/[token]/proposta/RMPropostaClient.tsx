'use client'

import { useCallback, useEffect, useState } from 'react'
import type { RMPageContent, RMPackage, RMProposta } from '../RMLeadPageClient'

// ─── Comprime imagem no browser → base64 JPEG ────────────────────────────────
function compressImage(file: File, maxWidth = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let w = img.width, h = img.height
      if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('canvas')); return }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

// ─── Embed helper ─────────────────────────────────────────────────────────────
function toEmbedUrl(url: string): string | null {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?title=0&byline=0&portrait=0`
  if (url.includes('/embed/') || url.includes('player.vimeo')) return url
  return null
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const GOLD     = '#c4a46a'
const GOLD_50  = 'rgba(196,164,106,0.50)'
const GOLD_30  = 'rgba(196,164,106,0.30)'
const GOLD_15  = 'rgba(196,164,106,0.15)'
const GOLD_06  = 'rgba(196,164,106,0.06)'
const GOLD_04  = 'rgba(196,164,106,0.04)'
const BG       = '#07080f'

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_PACKAGES: RMPackage[] = [
  { titulo:'Essencial',   descricao:'', itens:[], preco:'Sob consulta' },
  { titulo:'Profissional',descricao:'', itens:[], preco:'Sob consulta' },
  { titulo:'Estratégico', descricao:'', itens:[], preco:'Sob consulta' },
]
const DEFAULT_PLANO = [
  { titulo:'Definir a Visão Estratégica',        texto:'Começamos por explorar em conjunto o potencial único da marca. Identificamos oportunidades e definimos um caminho claro para melhorar a presença visual no mercado.' },
  { titulo:'Alinhar a Narrativa e Storytelling', texto:'Mergulhamos na essência da marca para desenvolver uma narrativa visual autêntica que se conecta naturalmente com o público.' },
  { titulo:'Acompanhamento Contínuo',            texto:'Desenvolvemos em conjunto um plano de produção personalizado para elevar a comunicação a um novo patamar e fortalecer genuinamente a ligação com o público.' },
]
const DEFAULT_INCLUIDO = [
  'Planeamento estratégico',
  'Gestor de conta dedicado à tua Marca',
  'Desenvolvimento da Narrativa & Storytelling',
  'Produção de fotografias e vídeos personalizado',
  'Edição de fotografias e vídeos personalizado',
  'Acompanhamento contínuo durante todo o projeto',
]
const COMO_FUNCIONA = [
  { n:'01', t:'Briefing e Imersão',       d:'Recebemos o teu briefing, analisamos a marca, o mercado e a concorrência.' },
  { n:'02', t:'Proposta',                 d:'Desenvolvemos a nossa proposta com uma visão completa e estratégica.' },
  { n:'03', t:'Planeamento',              d:'Definimos como e quando tudo vai acontecer.' },
  { n:'04', t:'Pré-Produção e Produção',  d:'Preparamos tudo para que não falte nada na captação de conteúdos.' },
  { n:'05', t:'Edição',                   d:'Editamos o conteúdo captado com rigor e estética.' },
  { n:'06', t:'Aprovação',                d:'Recebemos feedback, fazemos ajustes e obtemos a tua validação.' },
  { n:'07', t:'Entrega',                  d:'Garantimos que tens os conteúdos prontos a serem usados.' },
  { n:'08', t:'Feedback e Resultados',    d:'Analisamos o impacto e refinamos a estratégia futura.' },
]

function merge(saved: any): RMPageContent {
  const d: RMPageContent = {
    hero:    { titulo:'Reunião Marcada', subtitulo:'RL Media · Audiovisual' },
    videos:  { label:'', titulo:'', urls:['','',''] },
    proposta: {
      titulo:'Proposta Criativa', intro:'', packages:DEFAULT_PACKAGES,
      propostaAtiva:1, cta:'Iniciar Produção', password:'',
      planoEtapas:DEFAULT_PLANO, incluido:DEFAULT_INCLUIDO,
      videoUrls:['','',''], checkpointPergunta:'Esta abordagem alinha-se com a visão da vossa marca?',
      slideImages:['','','','','','','','','',''],
    },
    sobre: { label:'Quem Somos', titulo:'RL Media', texto:'' },
    propostas: [
      { titulo:'Proposta 1', valor:'', servicos:[] },
      { titulo:'Proposta 2', valor:'', servicos:[] },
      { titulo:'Proposta 3', valor:'', servicos:[] },
    ],
  }
  if (!saved) return d
  return {
    hero:   { ...d.hero,   ...(saved.hero   || {}) },
    videos: { ...d.videos, ...(saved.videos || {}), urls: saved.videos?.urls || d.videos.urls },
    proposta: {
      ...d.proposta, ...(saved.proposta || {}),
      packages:           saved.proposta?.packages           || d.proposta.packages,
      propostaAtiva:      saved.proposta?.propostaAtiva      ?? 1,
      password:           saved.proposta?.password           || '',
      planoEtapas:        saved.proposta?.planoEtapas        || d.proposta.planoEtapas,
      incluido:           saved.proposta?.incluido           || d.proposta.incluido,
      videoUrls:          saved.proposta?.videoUrls          || d.proposta.videoUrls,
      checkpointPergunta: saved.proposta?.checkpointPergunta || d.proposta.checkpointPergunta,
      slideImages:        saved.proposta?.slideImages        || d.proposta.slideImages,
    },
    sobre:    { ...d.sobre, ...(saved.sobre || {}) },
    propostas: saved.propostas || d.propostas,
  }
}

const TOTAL_SLIDES = 10

// Editor input styles
const INP  = 'w-full bg-white/[0.04] border border-white/[0.10] px-3 py-2.5 text-[13px] text-white/75 placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-colors'
const AREA = INP + ' resize-none leading-relaxed'
const LBL  = 'text-[9px] tracking-[0.55em] uppercase mb-1.5 block' + ' ' + `text-[${GOLD_50}]`

// ─── Component ────────────────────────────────────────────────────────────────
export default function RMPropostaClient({ token, isAdmin }: { token: string; isAdmin: boolean }) {
  const [lead,    setLead]    = useState<Record<string,any>|null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound,setNotFound]= useState(false)
  const [content, setContent] = useState<RMPageContent|null>(null)

  const [unlocked,setUnlocked]= useState(false)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState(false)

  const [current, setCurrent] = useState(0)
  const [dir,     setDir]     = useState<1|-1>(1)

  const [editingSlide,setEditingSlide]= useState<number|null>(null)
  const [draft,       setDraft]       = useState<RMPageContent['proposta']|null>(null)
  const [saving,      setSaving]      = useState(false)
  const [savedOk,     setSavedOk]     = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [uploadErr,   setUploadErr]   = useState(false)

  function startEdit(idx: number) {
    if (!content) return
    setDraft(JSON.parse(JSON.stringify(content.proposta)))
    setEditingSlide(idx); setSavedOk(false)
  }
  function cancelEdit() { setEditingSlide(null); setDraft(null) }

  async function saveEdit() {
    if (!content || !draft) return
    setSaving(true)
    const nc: RMPageContent = { ...content, proposta: draft }
    try {
      await fetch('/api/media-portal/save-content', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token, page_content: nc }),
      })
      setContent(nc); setSavedOk(true)
      setTimeout(() => { setEditingSlide(null); setDraft(null); setSavedOk(false) }, 900)
    } finally { setSaving(false) }
  }

  async function handleImageFile(file: File, idx: number) {
    if (!draft) return
    setUploading(true); setUploadErr(false)
    try {
      const dataUrl = await compressImage(file)
      const imgs = [...(draft.slideImages || Array(10).fill(''))]
      imgs[idx] = dataUrl
      setDraft({ ...draft, slideImages: imgs })
    } catch { setUploadErr(true) }
    finally { setUploading(false) }
  }

  function setSlideImage(idx: number, val: string) {
    if (!draft) return
    const imgs = [...(draft.slideImages || Array(10).fill(''))]
    imgs[idx] = val
    setDraft({ ...draft, slideImages: imgs })
  }

  useEffect(() => {
    fetch(`/api/media-portal/view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.lead) { setNotFound(true); setLoading(false); return }
        const c = merge(data.lead.page_content)
        setLead(data.lead); setContent(c)
        if (typeof window !== 'undefined') {
          const stored = sessionStorage.getItem(`rm_proposta_${token}`)
          if (stored === c.proposta.password || !c.proposta.password || isAdmin) setUnlocked(true)
        }
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token, isAdmin])

  const goTo = useCallback((next: number) => {
    if (next < 0 || next >= TOTAL_SLIDES || editingSlide !== null) return
    setDir(next > current ? 1 : -1); setCurrent(next)
  }, [current, editingSlide])

  useEffect(() => {
    if (!unlocked) return
    const onKey = (e: KeyboardEvent) => {
      if (editingSlide !== null) return
      if (e.key === 'ArrowRight') goTo(current + 1)
      if (e.key === 'ArrowLeft')  goTo(current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [unlocked, current, goTo, editingSlide])

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (!content) return
    if (!content.proposta.password || pwInput === content.proposta.password) {
      sessionStorage.setItem(`rm_proposta_${token}`, pwInput)
      setUnlocked(true); setPwError(false)
    } else { setPwError(true); setPwInput('') }
  }

  // ── Loading / Not found ────────────────────────────────────────────────────
  if (loading) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <p className="text-[9px] tracking-[0.7em] animate-pulse uppercase" style={{ color: GOLD_30 }}>A carregar...</p>
    </main>
  )
  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
      <p className="text-[9px] tracking-[0.7em] uppercase" style={{ color: GOLD_30 }}>Página não disponível</p>
    </main>
  )

  const { proposta } = content!
  const empresa = lead!.empresa || lead!.nome || ''

  // ── Password Gate ──────────────────────────────────────────────────────────
  if (!unlocked) return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 relative" style={{ background: BG }}>
      <BgLayer />
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-[9px] tracking-[0.7em] uppercase" style={{ color: GOLD_50 }}>RL Media · Audiovisual</p>
          <h1 className="text-[22px] font-extralight tracking-[0.35em] text-white/80 uppercase">Proposta Criativa</h1>
          <div className="flex items-center gap-4 mt-1">
            <div className="h-px w-10" style={{ background: GOLD_30 }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD_30 }} />
            <div className="h-px w-10" style={{ background: GOLD_30 }} />
          </div>
          {empresa && <p className="text-[11px] tracking-[0.45em] text-white/40 uppercase mt-1">{empresa}</p>}
        </div>
        <form onSubmit={handleUnlock} className="w-full flex flex-col gap-3">
          <input type="password" value={pwInput} onChange={e => { setPwInput(e.target.value); setPwError(false) }}
            placeholder="Password de acesso" autoFocus
            className={`w-full px-5 py-4 text-[13px] text-white/70 placeholder:text-white/25 tracking-wider text-center focus:outline-none transition-colors ${pwError ? 'border border-red-400/40' : 'border'}`}
            style={{ background:'rgba(255,255,255,0.03)', borderColor: pwError ? undefined : GOLD_15 }}
          />
          {pwError && <p className="text-[10px] tracking-[0.4em] text-red-400/60 uppercase text-center">Password incorreta</p>}
          <button type="submit" className="w-full py-4 text-[10px] tracking-[0.55em] uppercase transition-all"
            style={{ border: `1px solid ${GOLD_30}`, color: GOLD, background: GOLD_06 }}>
            Aceder →
          </button>
        </form>
        <a href={`/rm/${token}`} className="text-[9px] tracking-[0.4em] text-white/30 hover:text-white/55 uppercase transition-colors">‹ Voltar ao Portal</a>
      </div>
    </main>
  )

  // ── Slide header image ─────────────────────────────────────────────────────
  function SlideHeader({ idx }: { idx: number }) {
    const img = proposta.slideImages?.[idx]
    if (!img) return null
    return (
      <div className="w-full shrink-0 overflow-hidden" style={{ height: 260 }}>
        <img src={img} alt="" className="w-full h-full object-cover object-center"
          style={{ maskImage:'linear-gradient(to bottom, black 0%, black 35%, transparent 100%)', WebkitMaskImage:'linear-gradient(to bottom, black 0%, black 35%, transparent 100%)' }}
        />
      </div>
    )
  }

  // ── Slide title block ──────────────────────────────────────────────────────
  function SlideMeta({ label, title }: { label: string; title: string }) {
    return (
      <div className="mb-8 sm:mb-10">
        <p className="text-[9px] tracking-[0.7em] uppercase mb-3" style={{ color: GOLD_50 }}>{label}</p>
        <h2 className="text-[34px] sm:text-[40px] font-extralight tracking-[0.12em] text-white/88 uppercase leading-tight mb-5">{title}</h2>
        <div className="h-px w-14" style={{ background: GOLD_30 }} />
      </div>
    )
  }

  // ── PropostaSlide ──────────────────────────────────────────────────────────
  function PropostaSlide({ idx, propIdx }: { idx: number; propIdx: number }) {
    const prop: RMProposta = (content!.propostas || [])[propIdx] || { titulo:`Proposta ${propIdx+1}`, valor:'', servicos:[] }
    return (
      <div className="flex flex-col h-full w-full">
        <SlideHeader idx={idx} />
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">

          {/* Left panel */}
          <div className="sm:w-[38%] flex flex-col justify-between px-8 sm:px-12 py-10 border-b sm:border-b-0 sm:border-r" style={{ borderColor: GOLD_15 }}>
            <div>
              <p className="text-[9px] tracking-[0.7em] uppercase mb-4" style={{ color: GOLD_50 }}>Opção</p>
              <div className="text-[80px] sm:text-[100px] font-extralight leading-none mb-3 select-none"
                style={{ color: GOLD_06, letterSpacing: '-0.02em' }}>
                0{propIdx + 1}
              </div>
              <h2 className="text-[26px] sm:text-[32px] font-extralight tracking-[0.15em] text-white/85 uppercase leading-tight">
                {prop.titulo}
              </h2>
              <div className="h-px w-10 mt-4" style={{ background: GOLD_30 }} />
            </div>

            {prop.valor ? (
              <div className="mt-6 pt-6 border-t" style={{ borderColor: GOLD_15 }}>
                <p className="text-[9px] tracking-[0.7em] uppercase mb-2" style={{ color: GOLD_50 }}>Investimento</p>
                <p className="text-[38px] sm:text-[48px] font-extralight leading-none" style={{ color: GOLD }}>
                  {prop.valor}
                </p>
              </div>
            ) : (
              <p className="text-[10px] tracking-[0.4em] text-white/20 uppercase mt-6">Valor a definir</p>
            )}
          </div>

          {/* Right panel — services */}
          <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 py-10 overflow-y-auto">
            {prop.servicos.length > 0 ? (
              <div className="flex flex-col">
                {prop.servicos.map((s, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 border-b" style={{ borderColor:'rgba(255,255,255,0.055)' }}>
                    <div className="w-1 h-1 rounded-full shrink-0" style={{ background: GOLD_50 }} />
                    <p className="text-[14px] font-light text-white/65">{s}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                <div className="w-8 h-px" style={{ background: GOLD_30 }} />
                <p className="text-[10px] tracking-[0.4em] text-white/40 uppercase">Serviços a definir</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Image edit block ───────────────────────────────────────────────────────
  function ImageEditBlock({ idx }: { idx: number }) {
    if (!draft) return null
    const img = draft.slideImages?.[idx] || ''
    return (
      <div className="border-t pt-5 mt-5" style={{ borderColor: GOLD_15 }}>
        <p className="text-[9px] tracking-[0.55em] uppercase mb-3" style={{ color: GOLD_50 }}>Foto do Cabeçalho</p>
        <label className="relative mb-3 flex items-center justify-center gap-2 w-full py-4 border border-dashed cursor-pointer transition-all"
          style={{ borderColor: uploading ? 'rgba(255,255,255,0.06)' : GOLD_15 }}>
          <span className="text-[11px] tracking-[0.4em] uppercase" style={{ color: uploading ? 'rgba(255,255,255,0.2)' : GOLD_50 }}>
            {uploading ? 'A processar...' : '↑ Carregar imagem'}
          </span>
          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" disabled={uploading}
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f, idx); e.target.value = '' }} />
        </label>
        {uploadErr && <p className="mb-2 text-[11px] text-red-400/60">Erro. Tenta novamente.</p>}
        <div className="mb-3">
          <p className="text-[9px] tracking-[0.5em] uppercase mb-1.5" style={{ color: GOLD_50 }}>Ou cole um URL</p>
          <input className={INP} placeholder="https://..." value={img.startsWith('data:') ? '' : img}
            onChange={e => setSlideImage(idx, e.target.value)} />
        </div>
        {img ? (
          <div className="relative overflow-hidden" style={{ height: 100 }}>
            <img src={img} alt="" className="w-full h-full object-cover" />
            <button onClick={() => { setSlideImage(idx, ''); setUploadErr(false) }}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-black/70 text-white/60 hover:text-white text-[11px] border border-white/15 transition-all">✕</button>
          </div>
        ) : (
          <div className="flex items-center justify-center border border-dashed" style={{ height:50, borderColor: GOLD_06 }}>
            <p className="text-[9px] tracking-widest text-white/15 uppercase">Sem imagem</p>
          </div>
        )}
      </div>
    )
  }

  // ── Edit form per slide ────────────────────────────────────────────────────
  function renderEditForm(idx: number) {
    if (!draft) return null
    const imgBlock = <ImageEditBlock idx={idx} />
    const lbl = (t: string) => <p className="text-[9px] tracking-[0.55em] uppercase mb-1.5 block" style={{ color: GOLD_50 }}>{t}</p>

    if (idx === 0) return <>{lbl('Slide de capa — apenas foto de cabeçalho')}{imgBlock}</>

    if (idx === 1) return (
      <div className="flex flex-col gap-6">
        {draft.planoEtapas.map((e, i) => (
          <div key={i} className="flex flex-col gap-3 pb-6 border-b last:border-0 last:pb-0" style={{ borderColor: GOLD_06 }}>
            {lbl(`Etapa ${i+1} — Título`)}<input className={INP} value={e.titulo} onChange={x => { const n=[...draft.planoEtapas]; n[i]={...n[i],titulo:x.target.value}; setDraft({...draft,planoEtapas:n}) }} />
            {lbl(`Etapa ${i+1} — Texto`)}<textarea rows={3} className={AREA} value={e.texto} onChange={x => { const n=[...draft.planoEtapas]; n[i]={...n[i],texto:x.target.value}; setDraft({...draft,planoEtapas:n}) }} />
          </div>
        ))}
        {imgBlock}
      </div>
    )

    if (idx === 2) return <>{lbl('Slide fixo — apenas foto de cabeçalho')}{imgBlock}</>

    if (idx === 3) return (
      <div className="flex flex-col gap-3">
        {lbl('Itens incluídos — um por linha')}
        <textarea rows={10} className={AREA} value={draft.incluido.join('\n')} onChange={e => setDraft({...draft, incluido:e.target.value.split('\n')})} />
        {imgBlock}
      </div>
    )

    if (idx === 4) return (
      <div className="flex flex-col gap-5">
        {draft.videoUrls.map((url, i) => {
          const valid = !!toEmbedUrl(url)
          return (
            <div key={i}>
              {lbl(`Vídeo ${i+1} — URL YouTube ou Vimeo`)}
              <div className="relative">
                <input className={INP+' pr-8'} placeholder="https://youtu.be/..." value={url}
                  onChange={e => { const n=[...draft.videoUrls]; n[i]=e.target.value; setDraft({...draft,videoUrls:n}) }} />
                {url && <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[13px] ${valid?'text-emerald-400/70':'text-red-400/60'}`}>{valid?'✓':'✕'}</span>}
              </div>
            </div>
          )
        })}
        {imgBlock}
      </div>
    )

    if (idx === 5) return (
      <div className="flex flex-col gap-3">
        {lbl('Pergunta de reflexão')}
        <textarea rows={4} className={AREA} value={draft.checkpointPergunta} onChange={e => setDraft({...draft,checkpointPergunta:e.target.value})} />
        {imgBlock}
      </div>
    )

    return imgBlock
  }

  // ── Slides ─────────────────────────────────────────────────────────────────
  const slides = [

    // 0 — CAPA
    <div key={0} className="flex flex-col h-full w-full">
      <SlideHeader idx={0} />
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-8 py-12">
        <div style={{ borderRadius:'9999px', padding:'8px', background:BG, boxShadow:`0 0 0 1px ${GOLD_15}, 0 0 40px ${GOLD_06}, 0 0 80px rgba(196,164,106,0.04)` }}>
          <img src="/logo-rl-media-branco.png" alt="RL Media" className="w-32 h-32 object-contain block" style={{ mixBlendMode:'screen', borderRadius:'9999px' }} />
        </div>
        <div className="flex flex-col items-center gap-5 max-w-lg">
          <p className="text-[10px] tracking-[0.7em] uppercase" style={{ color: GOLD_50 }}>RL Media · Audiovisual</p>
          <h1 className="text-[52px] sm:text-[64px] font-extralight tracking-[0.3em] text-white/90 uppercase leading-none">
            Proposta<br />Criativa
          </h1>
          <div className="flex items-center gap-5">
            <div className="h-px w-16" style={{ background: GOLD_30 }} />
            <div className="w-2 h-2 rotate-45" style={{ background: GOLD_30 }} />
            <div className="h-px w-16" style={{ background: GOLD_30 }} />
          </div>
          {empresa && <p className="text-[18px] font-extralight tracking-[0.4em] text-white/60 uppercase">{empresa}</p>}
          <p className="text-[11px] tracking-[0.5em] text-white/30 uppercase font-mono">
            {new Date().toLocaleDateString('pt-PT', { day:'2-digit', month:'long', year:'numeric' })}
          </p>
        </div>
      </div>
    </div>,

    // 1 — PLANO DE AÇÃO
    <div key={1} className="flex flex-col h-full w-full">
      <SlideHeader idx={1} />
      <div className="flex-1 flex flex-col justify-center px-10 sm:px-16 lg:px-24 py-8 relative overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[200px] font-bold leading-none select-none pointer-events-none" style={{ color: GOLD_04, letterSpacing:'-0.04em' }}>01</div>
        <div className="relative z-10 max-w-3xl">
          <SlideMeta label="Proposta Criativa" title="Plano de Ação" />
          <div className="flex flex-col gap-6">
            {proposta.planoEtapas.map((e, i) => (
              <div key={i} className="flex gap-5 pb-6 border-b last:border-0 last:pb-0" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                <div className="shrink-0 w-7 h-7 flex items-center justify-center text-[10px] font-medium border" style={{ border:`1px solid ${GOLD_15}`, color: GOLD }}>
                  {String(i+1).padStart(2,'0')}
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-white/80 mb-1.5">{e.titulo}</h3>
                  <p className="text-[14px] font-light text-white/50 leading-relaxed">{e.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,

    // 2 — COMO FUNCIONA
    <div key={2} className="flex flex-col h-full w-full">
      <SlideHeader idx={2} />
      <div className="flex-1 flex flex-col justify-center px-10 sm:px-16 lg:px-24 py-8 relative overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[200px] font-bold leading-none select-none pointer-events-none" style={{ color: GOLD_04, letterSpacing:'-0.04em' }}>02</div>
        <div className="relative z-10 max-w-5xl w-full">
          <SlideMeta label="Processo" title="Como Funciona?" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-5">
            {COMO_FUNCIONA.map((item, i) => (
              <div key={i} className="flex flex-col gap-2">
                <p className="text-[11px] font-medium" style={{ color: GOLD }}>{item.n}</p>
                <p className="text-[13px] font-medium text-white/70 leading-snug">{item.t}</p>
                <p className="text-[12px] font-light text-white/40 leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,

    // 3 — O QUE ESTÁ INCLUÍDO
    <div key={3} className="flex flex-col h-full w-full">
      <SlideHeader idx={3} />
      <div className="flex-1 flex flex-col justify-center px-10 sm:px-16 lg:px-24 py-8 relative overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[200px] font-bold leading-none select-none pointer-events-none" style={{ color: GOLD_04, letterSpacing:'-0.04em' }}>03</div>
        <div className="relative z-10 max-w-3xl">
          <SlideMeta label="Serviços" title="O Que Está Incluído?" />
          <div className="flex flex-col gap-4">
            {proposta.incluido.map((item, i) => (
              <div key={i} className="flex items-center gap-4 pb-4 border-b last:border-0 last:pb-0" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                <div className="w-5 h-5 flex items-center justify-center shrink-0 text-[11px]" style={{ border:`1px solid ${GOLD_30}`, color: GOLD }}>✓</div>
                <p className="text-[16px] font-light text-white/75">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,

    // 4 — VÍDEOS
    <div key={4} className="flex flex-col h-full w-full">
      <SlideHeader idx={4} />
      <div className="flex-1 flex flex-col justify-center px-10 sm:px-16 py-8 relative overflow-hidden">
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[200px] font-bold leading-none select-none pointer-events-none" style={{ color: GOLD_04, letterSpacing:'-0.04em' }}>04</div>
        <div className="relative z-10 max-w-5xl w-full">
          <SlideMeta label="Portfólio" title="O Nosso Trabalho" />
          <div className="grid grid-cols-1 gap-4">
            {proposta.videoUrls.map((url, i) => {
              const embed = toEmbedUrl(url)
              if (embed) return (
                <div key={i} className="border w-full" style={{ aspectRatio:'16/9', borderColor: GOLD_15 }}>
                  <iframe src={embed} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
              )
              return (
                <div key={i} className="border border-dashed flex items-center justify-center" style={{ aspectRatio:'16/9', borderColor: GOLD_06 }}>
                  <p className="text-[10px] tracking-widest uppercase" style={{ color: GOLD_30 }}>Vídeo {i+1}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>,

    // 5 — CHECKPOINT
    <div key={5} className="flex flex-col h-full w-full">
      <SlideHeader idx={5} />
      <div className="flex-1 flex flex-col items-center justify-center px-10 sm:px-20 text-center py-12 gap-8 max-w-3xl mx-auto w-full">
        <p className="text-[9px] tracking-[0.7em] uppercase" style={{ color: GOLD_50 }}>Reflexão</p>
        <h2 className="text-[40px] sm:text-[52px] font-extralight tracking-[0.12em] text-white/88 uppercase leading-tight">
          Momento de<br />Reflexão
        </h2>
        <div className="flex items-center gap-5">
          <div className="h-px w-12" style={{ background: GOLD_30 }} />
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD_30 }} />
          <div className="h-px w-12" style={{ background: GOLD_30 }} />
        </div>
        <p className="text-[20px] sm:text-[24px] font-extralight text-white/60 leading-relaxed max-w-xl italic">
          "{proposta.checkpointPergunta}"
        </p>
      </div>
    </div>,

    // 6 — INVESTIMENTO
    <div key={6} className="flex flex-col h-full w-full">
      <SlideHeader idx={6} />
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center py-12 gap-6">
        <p className="text-[9px] tracking-[0.7em] uppercase" style={{ color: GOLD_50 }}>Valor</p>
        <h1 className="text-[72px] sm:text-[100px] font-extralight tracking-[0.25em] text-white/90 uppercase leading-none">
          INVESTI<br />MENTO
        </h1>
        <div className="h-px w-20 mt-2" style={{ background: GOLD_30 }} />
      </div>
    </div>,

    // 7–9 — PROPOSTAS
    <PropostaSlide key={7} idx={7} propIdx={0} />,
    <PropostaSlide key={8} idx={8} propIdx={1} />,
    <PropostaSlide key={9} idx={9} propIdx={2} />,
  ]

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: BG }}>
      <BgLayer />

      {/* ── Top bar ── */}
      <div className="relative z-20 flex items-center justify-between px-8 py-4 shrink-0 border-b" style={{ borderColor: GOLD_15 }}>
        <a href={`/rm/${token}`} className="text-[9px] tracking-[0.5em] uppercase transition-colors hover:opacity-80" style={{ color: GOLD_50 }}>
          ‹ Portal
        </a>
        <div className="flex items-center gap-3">
          <div className="h-px w-6" style={{ background: GOLD_30 }} />
          <p className="text-[9px] tracking-[0.6em] uppercase" style={{ color: GOLD_50 }}>Proposta Criativa</p>
          <div className="h-px w-6" style={{ background: GOLD_30 }} />
        </div>
        <p className="text-[9px] tracking-widest font-mono text-white/30">
          {String(current+1).padStart(2,'0')} / {String(TOTAL_SLIDES).padStart(2,'0')}
        </p>
      </div>

      {/* ── Slides ── */}
      <div className="relative flex-1 z-10 overflow-hidden">
        {slides.map((slide, i) => (
          <div key={i} className="absolute inset-0 overflow-y-auto"
            style={{
              opacity:       current === i ? 1 : 0,
              pointerEvents: current === i ? 'auto' : 'none',
              transform:     current === i ? 'translateX(0)' : `translateX(${(i-current)*dir > 0 ? '28px' : '-28px'})`,
              transition:    'opacity 0.5s cubic-bezier(0.22,1,0.36,1), transform 0.5s cubic-bezier(0.22,1,0.36,1)',
            }}>
            {slide}

            {/* ✎ Edit button */}
            {isAdmin && editingSlide !== i && (
              <button onClick={() => startEdit(i)}
                className="absolute bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-2 text-[9px] tracking-[0.45em] uppercase transition-all border"
                style={{ background:`rgba(7,8,15,0.85)`, borderColor: GOLD_30, color: GOLD_50 }}>
                <span style={{ fontSize:14 }}>✎</span> Editar
              </button>
            )}

            {/* Edit overlay */}
            {isAdmin && editingSlide === i && draft && (
              <div className="absolute inset-0 z-50 flex flex-col overflow-y-auto" style={{ background: BG }}>
                <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-4 border-b" style={{ background: BG, borderColor: GOLD_15 }}>
                  <p className="text-[9px] tracking-[0.6em] uppercase" style={{ color: GOLD_50 }}>✎ Slide {i+1}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={cancelEdit} className="px-4 py-2 text-[9px] tracking-[0.4em] text-white/35 hover:text-white/60 border border-white/[0.08] hover:border-white/20 uppercase transition-all">✕ Cancelar</button>
                    <button onClick={saveEdit} disabled={saving}
                      className={`px-6 py-2 text-[9px] tracking-[0.4em] uppercase transition-all border disabled:opacity-40 ${savedOk ? 'text-emerald-400/80' : 'text-white/65 hover:text-white/90'}`}
                      style={{ borderColor: savedOk ? 'rgba(52,211,153,0.4)' : GOLD_30, background: savedOk ? 'rgba(52,211,153,0.05)' : GOLD_06 }}>
                      {savedOk ? '✓ Guardado' : saving ? 'A guardar...' : '✓ Guardar'}
                    </button>
                  </div>
                </div>
                <div className="flex-1 px-8 sm:px-16 py-8 max-w-2xl w-full mx-auto">
                  {renderEditForm(i)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Bottom nav ── */}
      <div className="relative z-20 shrink-0 flex items-center justify-between px-8 py-5 border-t" style={{ borderColor: GOLD_15 }}>
        <button onClick={() => goTo(current-1)} disabled={current===0 || editingSlide!==null}
          className="flex items-center gap-2 px-5 py-3 border transition-all disabled:opacity-20 disabled:cursor-not-allowed text-white/45 hover:text-white/75"
          style={{ borderColor: current===0 ? 'rgba(255,255,255,0.07)' : GOLD_15 }}>
          <span className="text-[18px] leading-none">‹</span>
          <span className="text-[9px] tracking-[0.4em] uppercase hidden sm:inline">Anterior</span>
        </button>

        <div className="flex items-center gap-1.5">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button key={i} onClick={() => goTo(i)} disabled={editingSlide!==null}
              className="transition-all duration-300 disabled:cursor-not-allowed"
              style={{ width: current===i ? 22 : 7, height: 1, background: current===i ? GOLD : 'rgba(255,255,255,0.15)' }} />
          ))}
        </div>

        <button onClick={() => goTo(current+1)} disabled={current===TOTAL_SLIDES-1 || editingSlide!==null}
          className="flex items-center gap-2 px-5 py-3 border transition-all disabled:opacity-20 disabled:cursor-not-allowed text-white/45 hover:text-white/75"
          style={{ borderColor: current===TOTAL_SLIDES-1 ? 'rgba(255,255,255,0.07)' : GOLD_15 }}>
          <span className="text-[9px] tracking-[0.4em] uppercase hidden sm:inline">Seguinte</span>
          <span className="text-[18px] leading-none">›</span>
        </button>
      </div>
    </div>
  )
}

// ── Background layer ─────────────────────────────────────────────────────────
function BgLayer() {
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(180,150,90,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(180,150,90,0.035) 1px,transparent 1px)`,
        backgroundSize: '72px 72px',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 100% 50% at 50% -10%, rgba(180,140,60,0.09) 0%, rgba(150,110,40,0.04) 40%, transparent 70%)',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 50% 60% at -5% 50%, rgba(180,140,60,0.05) 0%, transparent 55%)',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 50% 60% at 105% 50%, rgba(180,140,60,0.04) 0%, transparent 55%)',
      }} />
    </>
  )
}
