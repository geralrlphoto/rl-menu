'use client'

import { useEffect, useRef, useState } from 'react'
import EstiloRLProd from '@/app/media/_components/EstiloRLProd'
import { FUNDO } from '@/app/media/_lib/estilo'

// ─── Types ────────────────────────────────────────────────────────────────────
type RMLead = Record<string, any>

export type RMPackage = {
  titulo: string
  descricao: string
  itens: string[]
  preco: string
}

export type RMProposta = {
  titulo: string
  valor: string
  servicos: string[]
}

export type RMPageContent = {
  hero:    { titulo: string; subtitulo: string; imageUrl?: string }
  videos:  { label: string; titulo: string; urls: string[] }
  proposta: {
    titulo: string
    intro: string
    packages: RMPackage[]
    propostaAtiva: number
    cta: string
    password: string
    // Slide 1 — Plano de Ação
    planoEtapas: { titulo: string; texto: string }[]
    // Slide 3 — O Que Está Incluído
    incluido: string[]
    // Slide 4 — Vídeos da Proposta
    videoUrls: string[]
    // Slide 5 — Checkpoint
    checkpointPergunta: string
    // Imagens de cabeçalho por slide (índice 0–6)
    slideImages: string[]
  }
  sobre: { label: string; titulo: string; texto: string }
  propostas: RMProposta[]
}

const DEFAULT_CONTENT: RMPageContent = {
  hero: {
    titulo: 'Reunião Marcada',
    subtitulo: 'RL PROD · Photography & Video',
    imageUrl: '',
  },
  videos: {
    label: 'O Nosso Trabalho',
    titulo: 'Produção Photography & Video com propósito.',
    urls: ['', '', ''],
  },
  proposta: {
    titulo: 'Proposta Criativa',
    intro:
      'Uma proposta desenvolvida com base nos objetivos da vossa marca. Foco em resultados, narrativa estratégica e produção de excelência — do briefing à entrega final.',
    packages: [
      {
        titulo: 'Essencial',
        descricao: 'Produção focada e objetiva para uma peça de comunicação impactante.',
        itens: [
          '1 dia de produção (8h)',
          '1 vídeo final (até 3 min)',
          'Correção de cor profissional',
          'Sound design + música licenciada',
          '1 ronda de revisões',
          'Entrega digital em 15 dias úteis',
        ],
        preco: 'Sob consulta',
      },
      {
        titulo: 'Profissional',
        descricao: 'Produção completa com cortes adaptados para múltiplas plataformas.',
        itens: [
          '2 dias de produção',
          '1 vídeo principal (até 5 min)',
          '3 cortes para redes sociais (16:9, 9:16, 1:1)',
          'Pós-produção premium + motion graphics',
          '2 rondas de revisões',
          'Música premium licenciada',
          'Entrega em 21 dias úteis',
        ],
        preco: 'Sob consulta',
      },
      {
        titulo: 'Estratégico',
        descricao: 'Estratégia de conteúdo completa para uma presença de marca consistente.',
        itens: [
          'Sessão de estratégia + moodboard',
          '3+ dias de produção',
          'Vídeo institucional + série de conteúdos',
          'Pós-produção premium + efeitos visuais',
          'Copywriting integrado',
          'Revisões ilimitadas',
          'Calendário editorial de publicação',
          'Entrega faseada',
        ],
        preco: 'Sob consulta',
      },
    ],
    propostaAtiva: 1,
    cta: 'Iniciar Produção',
    password: '',
    planoEtapas: [
      { titulo: 'Definir a Visão Estratégica',        texto: 'Começamos por explorar em conjunto o potencial único da marca. Vamos identificar oportunidades e definir um caminho claro para melhorar a presença visual no mercado.' },
      { titulo: 'Alinhar a Narrativa e Storytelling', texto: 'Mergulhamos na essência da marca para desenvolver uma narrativa visual autêntica para se conectar naturalmente com o público.' },
      { titulo: 'Acompanhamento Contínuo',            texto: 'Por fim, desenvolvemos em conjunto um plano de produção personalizado para elevar a comunicação a um novo patamar, para potenciar o crescimento da Marca e fortalecer genuinamente a ligação com o público.' },
    ],
    incluido: [
      'Planeamento estratégico',
      'Gestor de conta dedicado à tua Marca',
      'Desenvolvimento da Narrativa & Storytelling',
      'Produção de fotografias e vídeos personalizado',
      'Edição de fotografias e vídeos personalizado e website',
      'Acompanhamento contínuo durante todo o projeto',
    ],
    videoUrls: ['', '', ''],
    checkpointPergunta: 'Esta abordagem alinha-se com a visão da vossa marca?',
    slideImages: ['', '', '', '', '', '', '', '', ''],
  },
  sobre: {
    label: 'Quem Somos',
    titulo: 'RL PROD',
    texto:
      'Produzimos conteúdo Photography & Video que comunica com clareza e impacto. Trabalhamos com marcas que entendem o valor da narrativa visual — desde vídeos institucionais a campanhas digitais. A nossa abordagem é estratégica, estética e orientada para resultados concretos.',
  },
  propostas: [
    { titulo: 'Proposta 1', valor: '', servicos: [] },
    { titulo: 'Proposta 2', valor: '', servicos: [] },
    { titulo: 'Proposta 3', valor: '', servicos: [] },
  ],
}

function merge(saved: any): RMPageContent {
  if (!saved) return DEFAULT_CONTENT
  return {
    hero:    { ...DEFAULT_CONTENT.hero,    ...(saved.hero    || {}) },
    videos:  { ...DEFAULT_CONTENT.videos,  ...(saved.videos  || {}), urls: saved.videos?.urls || DEFAULT_CONTENT.videos.urls },
    proposta: {
      ...DEFAULT_CONTENT.proposta,
      ...(saved.proposta || {}),
      packages:            saved.proposta?.packages            || DEFAULT_CONTENT.proposta.packages,
      propostaAtiva:       saved.proposta?.propostaAtiva       ?? 1,
      password:            saved.proposta?.password            || '',
      planoEtapas:         saved.proposta?.planoEtapas         || DEFAULT_CONTENT.proposta.planoEtapas,
      incluido:            saved.proposta?.incluido            || DEFAULT_CONTENT.proposta.incluido,
      videoUrls:           saved.proposta?.videoUrls           || DEFAULT_CONTENT.proposta.videoUrls,
      checkpointPergunta:  saved.proposta?.checkpointPergunta  || DEFAULT_CONTENT.proposta.checkpointPergunta,
      slideImages:         saved.proposta?.slideImages         || DEFAULT_CONTENT.proposta.slideImages,
    },
    sobre: { ...DEFAULT_CONTENT.sobre, ...(saved.sobre || {}) },
    propostas: saved.propostas || DEFAULT_CONTENT.propostas,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toEmbedUrl(url: string): string | null {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`
  // Vídeos não listados (vimeo.com/ID/HASH): sem o h=HASH só abrem para quem tem sessão no Vimeo
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([0-9a-f]{6,}))?/)
  const vh = vm?.[2] ?? url.match(/[?&]h=([0-9a-f]+)/)?.[1]
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?title=0&byline=0&portrait=0${vh ? `&h=${vh}` : ''}`
  if (url.includes('/embed/') || url.includes('player.vimeo')) return url
  return null
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
function fmtData(d: string) {
  if (!d) return ''
  try {
    const dt = new Date(d + 'T00:00:00')
    return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()]} ${dt.getFullYear()}`
  } catch { return d }
}
function fmtHora(h: string) { return (h || '').slice(0, 5) }

// ─── FadeIn ──────────────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const t = setTimeout(() => {
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } },
        { threshold: 0.06, rootMargin: '0px 0px -20px 0px' }
      )
      obs.observe(el); return () => obs.disconnect()
    }, 60)
    return () => clearTimeout(t)
  }, [])
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      transition: `opacity 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

// ─── Countdown ───────────────────────────────────────────────────────────────
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
  const U = ({ v, label }: { v: number; label: string }) => (
    <div className="flex flex-col items-center gap-1">
      <span className="text-4xl sm:text-5xl font-extralight text-white/85 tabular-nums tracking-tight">{String(v).padStart(2,'0')}</span>
      <span className="text-[8px] tracking-[0.5em] text-white/20 uppercase">{label}</span>
    </div>
  )
  const Sep = () => <span className="text-2xl text-white/10 self-start mt-2 font-extralight">|</span>
  return (
    <div className="flex items-center justify-center gap-5 sm:gap-10">
      <U v={t.d} label="Dias"/><Sep/>
      <U v={t.h} label="Horas"/><Sep/>
      <U v={t.m} label="Min"/><Sep/>
      <U v={t.s} label="Seg"/>
    </div>
  )
}

// ─── Admin editor helpers ─────────────────────────────────────────────────────
function TInput({ value, onChange, rows }: { value: string; onChange: (v: string) => void; rows?: number }) {
  const cls = "w-full bg-white/[0.04] border border-white/[0.08] focus:border-white/20 focus:outline-none px-3 py-2 text-xs text-white/70 placeholder:text-white/15 resize-none transition-colors"
  return rows
    ? <textarea rows={rows} className={cls} value={value} onChange={e => onChange(e.target.value)} />
    : <input className={cls} value={value} onChange={e => onChange(e.target.value)} />
}

function AccordionSection({ title, children, open: defaultOpen }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(defaultOpen || false)
  return (
    <div className="border border-white/[0.06]">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
        <span className="text-[9px] tracking-[0.4em] text-white/35 uppercase">{title}</span>
        <span className="text-white/20 text-[9px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-4 pb-4 pt-3 border-t border-white/[0.05] flex flex-col gap-3">{children}</div>}
    </div>
  )
}

function EditorField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[8px] tracking-[0.4em] text-white/20 uppercase">{label}</span>
      {children}
    </div>
  )
}

const MASTER_TOKEN = 'rm-master-rlprod'

// Foto do cabeçalho quando a página ainda não tem uma própria
const HERO_PADRAO = 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=2000&q=80&auto=format&fit=crop'

// "Antes da reunião": o espírito da conversa (adaptado do portal dos casamentos para marcas)
const CONVERSA = [
  { t: 'Não vamos mostrar uma tabela de preços', d: 'Se esta reunião fosse para apresentar valores, enviávamos um PDF, como muitos fazem. Não é isso que queremos convosco.' },
  { t: 'Queremos conhecer a vossa marca', d: 'A história, o público, o que vos distingue e onde querem chegar. É isso que depois se vê em cada fotografia e em cada plano do vídeo.' },
  { t: 'E que nos conheçam a nós', d: 'Quem somos, como trabalhamos e como é produzir connosco. Vamos estar ao vosso lado do briefing à entrega final.' },
  { t: 'Estratégia antes de tudo', d: 'Uma boa produção começa com objetivos claros e confiança. Se no fim desta conversa houver sintonia entre nós, o resto flui naturalmente.' },
]

// ─── Main component ───────────────────────────────────────────────────────────
export default function RMLeadPageClient({ token, isAdmin }: { token: string; isAdmin: boolean }) {
  const isMaster = token === MASTER_TOKEN
  const [lead,       setLead]       = useState<RMLead | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)
  const [status,     setStatus]     = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [requesting, setRequesting] = useState(false)

  // Editor
  const [editorOpen, setEditorOpen] = useState(false)
  const [content,    setContent]    = useState<RMPageContent>(DEFAULT_CONTENT)
  const [saving,      setSaving]     = useState(false)
  const [saved,       setSaved]      = useState(false)
  const [saveError,   setSaveError]  = useState<string | null>(null)
  const [publishing,  setPublishing] = useState(false)
  const [published,   setPublished]  = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const heroImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/media-portal/view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.lead) { setNotFound(true); setLoading(false); return }
        setLead(data.lead)
        setStatus(data.lead.page_confirmacao || null)
        setContent(merge(data.lead.page_content))
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token])

  // ── Content helpers ──
  function setHero(k: keyof RMPageContent['hero'], v: string) {
    setContent(c => ({ ...c, hero: { ...c.hero, [k]: v } }))
  }
  function setVideos(k: keyof RMPageContent['videos'], v: any) {
    setContent(c => ({ ...c, videos: { ...c.videos, [k]: v } }))
  }
  function setVideoUrl(i: number, v: string) {
    setContent(c => { const urls = [...c.videos.urls]; urls[i] = v; return { ...c, videos: { ...c.videos, urls } } })
  }
  function setSobre(k: keyof RMPageContent['sobre'], v: string) {
    setContent(c => ({ ...c, sobre: { ...c.sobre, [k]: v } }))
  }
  function setProposta(k: keyof RMPageContent['proposta'], v: any) {
    setContent(c => ({ ...c, proposta: { ...c.proposta, [k]: v } }))
  }
  function setPackage(i: number, k: keyof RMPackage, v: string | string[]) {
    setContent(c => {
      const packages = [...c.proposta.packages]
      packages[i] = { ...packages[i], [k]: v }
      return { ...c, proposta: { ...c.proposta, packages } }
    })
  }

  // ── Hero image upload ──
  async function handleHeroImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingHero(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch('/api/media-portal/upload-image', { method: 'POST', body: fd })
      const d = await res.json()
      if (d.url) setHero('imageUrl', d.url)
    } catch {}
    setUploadingHero(false)
    e.target.value = ''
  }

  // ── Save ──
  async function handleSave() {
    setSaving(true); setSaveError(null)
    try {
      const res = await fetch('/api/media-portal/save-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, page_content: content }),
      })
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
      else { const d = await res.json().catch(() => ({})); setSaveError(d.error || `Erro ${res.status}`) }
    } catch { setSaveError('Erro de ligação') }
    setSaving(false)
  }

  // ── Publicar (só maquete) ──
  async function handlePublish() {
    setPublishing(true)
    try {
      await fetch('/api/media-portal/save-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, page_content: content }),
      })
      const res = await fetch('/api/media-portal/sync-rm', { method: 'POST' })
      const d = await res.json()
      if (d.ok) { setPublished(true); setTimeout(() => setPublished(false), 3000) }
    } catch {}
    setPublishing(false)
  }

  // ── Confirm / Change ──
  async function handleConfirm() {
    setConfirming(true)
    await fetch(`/api/media-portal/confirm?token=${token}`, { method: 'POST' })
    setStatus('confirmada'); setConfirming(false)
  }
  async function handleChangeRequest() {
    setRequesting(true)
    await fetch(`/api/media-portal/confirm?token=${token}`, { method: 'DELETE' })
    setStatus('alteracao_pedida'); setRequesting(false)
  }

  // ─── Loading / Not Found ─────────────────────────────────────────────────
  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-[#00141f]">
      <p className="text-[9px] tracking-[0.6em] text-white/15 uppercase animate-pulse">A carregar...</p>
    </main>
  )
  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center bg-[#00141f]">
      <p className="text-[9px] tracking-[0.6em] text-white/15 uppercase">Página não disponível</p>
    </main>
  )

  // Na maquete mestre usamos dados de demonstração para ver todas as secções
  const DEMO_DATA  = isMaster ? '2026-06-15' : lead!.reuniao_data || ''
  const DEMO_HORA  = isMaster ? '14:30' : lead!.reuniao_hora || ''
  const DEMO_TIPO  = isMaster ? 'Videochamada' : lead!.reuniao_tipo || ''

  const isVideo  = DEMO_TIPO === 'Videochamada'
  const dataFmt  = fmtData(DEMO_DATA)
  const horaFmt  = fmtHora(DEMO_HORA)
  const targetDate = DEMO_DATA && DEMO_HORA
    ? `${DEMO_DATA}T${horaFmt}:00` : null

  const { hero, videos, proposta, sobre } = content
  const labelCls = "rlp-m text-[9.5px] text-white/45"
  const fotoHero = hero.imageUrl || HERO_PADRAO
  const nomeMarca = isMaster ? 'Empresa / Marca' : (lead!.empresa || lead!.nome || '')
  const nomePessoa = isMaster ? 'Nome do Cliente' : (lead!.nome || '')
  const CARD = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/75 backdrop-blur-sm'

  return (
    <div className="rlp min-h-screen relative text-white">
      <EstiloRLProd />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      {/* ── ADMIN BAR ── */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-3 px-4 sm:px-5 py-2.5 bg-[#00141f]/90 backdrop-blur-md border-b border-white/[0.08]">
          <a href="/media/crm/leads" className="rlp-m text-[10px] text-white/50 hover:text-white transition-colors">‹ Leads</a>
          <div className="hidden sm:flex items-center gap-3">
            <span className="rlp-m text-[9px] text-white/40">Admin · Portal da reunião</span>
            {isMaster && <span className="rlp-m rounded-full border border-[#2e6cf6]/50 px-2.5 py-0.5 text-[8.5px] text-[#a9c1ff]">Maquete mestre</span>}
          </div>
          <div className="flex items-center gap-2">
            {isMaster && (
              <button onClick={handlePublish} disabled={publishing}
                className="rounded-full border border-[#2e6cf6]/60 bg-[#2e6cf6]/15 hover:bg-[#2e6cf6]/30 px-4 py-1.5 text-[12px] text-[#a9c1ff] transition-colors disabled:opacity-40">
                {published ? '✓ Publicado' : publishing ? 'A publicar…' : '⬆ Publicar'}
              </button>
            )}
            <button onClick={() => heroImageInputRef.current?.click()} disabled={uploadingHero}
              className="rounded-full border border-white/[0.16] hover:border-white/40 px-4 py-1.5 text-[12px] text-white/75 hover:text-white transition-colors disabled:opacity-40">
              {uploadingHero ? 'A carregar…' : hero.imageUrl ? '✓ Foto' : '✎ Foto'}
            </button>
            <button onClick={() => setEditorOpen(true)}
              className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-4 py-1.5 text-[12px] font-medium transition-colors">
              ✎ Editar página
            </button>
          </div>
        </div>
      )}

      <div className={`relative z-10 ${isAdmin ? 'pt-[46px]' : ''}`}>
        <input ref={heroImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleHeroImageUpload} />

        {/* ── HERO: foto em ecrã inteiro ── */}
        <section className="relative min-h-[88vh] flex items-end overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={fotoHero} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,20,31,0.92) 0%, rgba(0,20,31,0.55) 55%, rgba(0,20,31,0.25) 100%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: 'linear-gradient(to top, #00141f 0%, transparent 100%)' }} />
          {isAdmin && hero.imageUrl && (
            <button onClick={() => setHero('imageUrl', '')}
              className="absolute top-4 right-4 z-20 rounded-full border border-white/25 bg-black/50 backdrop-blur-sm px-3 py-1.5 text-[11.5px] text-white/70 hover:text-[#ff8a8a]">
              ✕ Remover foto
            </button>
          )}
          <div className="relative w-full max-w-6xl mx-auto px-6 sm:px-10 pb-20 pt-32">
            <FadeIn>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="w-14 h-14 object-contain opacity-90 mb-8" />
            </FadeIn>
            <FadeIn delay={80}><p className="rlp-m traco text-[11px] text-[#5a8bff]">{hero.subtitulo || 'RL PROD · Photography & Video'}</p></FadeIn>
            <FadeIn delay={180}><h1 className="rlp-t mt-4 text-[56px] sm:text-[96px] leading-[0.88]">{hero.titulo}<span className="text-[#5a8bff]">.</span></h1></FadeIn>
            <FadeIn delay={300}>
              <p className="rlp-t mt-5 text-[22px] sm:text-[28px] text-white/85">{nomeMarca}</p>
              {nomePessoa && nomePessoa !== nomeMarca && <p className="mt-1 text-[14px] text-white/55">{nomePessoa}</p>}
              {dataFmt && (
                <p className="rlp-m mt-5 text-[10.5px] text-[#a9c1ff]">{dataFmt}{horaFmt && ` · ${horaFmt}`}{DEMO_TIPO && ` · ${DEMO_TIPO}`}</p>
              )}
              {isMaster && <p className="rlp-m mt-2 text-[8.5px] text-[#a9c1ff]/60">Dados de demonstração</p>}
            </FadeIn>
          </div>
        </section>

        {/* ── CONTAGEM ── */}
        {targetDate && (
          <section className="px-6 pt-4 pb-14">
            <FadeIn className="max-w-3xl mx-auto">
              <p className={`${labelCls} text-center mb-6`}>Faltam</p>
              <Countdown targetDate={targetDate} />
            </FadeIn>
          </section>
        )}

        {/* ── ANTES DA REUNIÃO ── */}
        <section className="px-6 sm:px-10 py-16 max-w-6xl mx-auto">
          <FadeIn>
            <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Antes da reunião</p>
            <h2 className="rlp-t mt-3 text-[40px] sm:text-[56px] leading-[0.95]">Uma conversa, não uma proposta.</h2>
          </FadeIn>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CONVERSA.map((c, i) => (
              <FadeIn key={c.t} delay={i * 90}>
                <article className={`${CARD} group h-full p-6 transition-colors hover:border-[#2e6cf6]/70 hover:bg-[#0c2236]/80`}>
                  <span className="rlp-t text-[34px] leading-none text-[#2e6cf6]">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="rlp-t mt-5 text-[22px] leading-tight">{c.t}</h3>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/60">{c.d}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ── DETALHES DA REUNIÃO ── */}
        <section className="px-6 py-14">
          <FadeIn className="w-full max-w-md mx-auto">
            <div className={`${CARD} overflow-hidden`}>
              <div className="px-6 py-4 border-b border-white/[0.08]"><p className="rlp-m traco text-[10px] text-[#5a8bff]">Detalhes da reunião</p></div>
              <div className="px-6 py-5 grid gap-4">
                {[['Data', dataFmt], ['Hora', horaFmt], ['Modo', DEMO_TIPO]].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-4">
                    <span className={labelCls}>{k}</span>
                    <span className="rlp-t text-[19px]">{v}</span>
                  </div>
                ))}
              </div>
              {lead!.reuniao_link && (
                <div className="px-6 pb-5">
                  <a href={lead!.reuniao_link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center w-full rounded-full border border-white/[0.16] hover:border-[#2e6cf6] py-3 text-[13.5px] text-white/80 hover:text-white transition-colors">
                    {isVideo ? '↗ Entrar na videochamada' : '↗ Ver localização'}
                  </a>
                </div>
              )}
            </div>

            {status === 'confirmada' && (
              <p className="mt-4 rounded-full border border-[#2e6cf6] bg-[#2e6cf6]/20 py-3 text-center text-[13px] text-[#a9c1ff]">✓ Reunião confirmada</p>
            )}
            {status === 'alteracao_pedida' && (
              <p className="mt-4 rounded-full border border-white/25 py-3 text-center text-[13px] text-white/70">Pedido de alteração enviado. Vamos entrar em contacto.</p>
            )}

            <div className="mt-4 grid gap-2">
              {status !== 'confirmada' && (
                <button onClick={handleConfirm} disabled={confirming || isAdmin}
                  className="w-full rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] py-3.5 text-[14px] font-medium transition-colors disabled:opacity-40">
                  {confirming ? 'A confirmar…' : '✓ Confirmar reunião'}
                </button>
              )}
              <button onClick={handleChangeRequest} disabled={requesting || isAdmin}
                className="w-full rounded-full border border-white/[0.16] hover:border-white/40 py-3 text-[13.5px] text-white/70 hover:text-white transition-colors disabled:opacity-40">
                {requesting ? 'A enviar…' : 'Pedir alteração'}
              </button>
              {isAdmin && <p className="text-center text-[11.5px] text-white/40 mt-1">Botões desativados em modo admin</p>}
            </div>

            {targetDate && !isAdmin && (() => {
              const fmt = (d: string, h: string) => `${d.replace(/-/g,'')}T${h.replace(':','')}00`
              const start = fmt(lead!.reuniao_data, horaFmt)
              const end   = fmt(lead!.reuniao_data, String(parseInt(horaFmt.split(':')[0])+1).padStart(2,'0') + ':' + horaFmt.split(':')[1])
              const title = encodeURIComponent('Reunião RL PROD · Photography & Video')
              const loc   = encodeURIComponent(lead!.reuniao_link || DEMO_TIPO || 'Reunião')
              const gcal  = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${loc}`
              const downloadIcs = () => {
                const ics = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//RL PROD//Photography & Video//PT','BEGIN:VEVENT',
                  `DTSTART:${start}`, `DTEND:${end}`, 'SUMMARY:Reunião RL PROD · Photography & Video', `LOCATION:${decodeURIComponent(loc)}`,
                  'END:VEVENT','END:VCALENDAR'].join('\r\n')
                const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
                Object.assign(document.createElement('a'), { href: url, download: 'reuniao-rl-prod.ics' }).click()
                URL.revokeObjectURL(url)
              }
              return (
                <div className="mt-6">
                  <p className={`${labelCls} text-center mb-2`}>Adicionar ao calendário</p>
                  <div className="flex gap-2">
                    <a href={gcal} target="_blank" rel="noopener noreferrer" className="flex-1 rounded-full border border-white/[0.12] py-2.5 text-center text-[12.5px] text-white/65 hover:text-white">Google</a>
                    <button onClick={downloadIcs} className="flex-1 rounded-full border border-white/[0.12] py-2.5 text-[12.5px] text-white/65 hover:text-white">Apple / ICS</button>
                  </div>
                </div>
              )
            })()}
          </FadeIn>
        </section>

        {/* ── O NOSSO TRABALHO ── */}
        {(videos.urls.some(u => u) || isAdmin) && (
          <section className="px-6 sm:px-10 py-16 max-w-6xl mx-auto">
            <FadeIn>
              <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">{videos.label}</p>
              <h2 className="rlp-t mt-3 text-[36px] sm:text-[48px] leading-[0.95]">{videos.titulo}</h2>
            </FadeIn>
            <FadeIn delay={150} className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {videos.urls.map((url, i) => {
                const embed = toEmbedUrl(url)
                if (embed) return (
                  <div key={i} className="overflow-hidden rounded-2xl border border-white/[0.1]" style={{ aspectRatio: '16/9' }}>
                    <iframe src={embed} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                  </div>
                )
                if (isAdmin) return (
                  <div key={i} className="rounded-2xl border border-dashed border-white/[0.14] flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                    <span className="rlp-m text-[9px] text-white/35">Vídeo {i + 1} · no editor</span>
                  </div>
                )
                return null
              })}
            </FadeIn>
          </section>
        )}

        {/* ── PROPOSTA CRIATIVA ── */}
        <section className="px-6 sm:px-10 py-14 max-w-6xl mx-auto">
          <FadeIn>
            <div className="rounded-2xl border border-[#2e6cf6]/50 bg-[#2e6cf6]/[0.12] px-6 sm:px-10 py-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <p className="rlp-m traco text-[10.5px] text-[#a9c1ff]">Proposta criativa</p>
                <p className="mt-3 text-[15px] leading-relaxed text-white/75">{proposta.intro}</p>
              </div>
              <a href={`/rm/${token}/proposta`}
                className="shrink-0 rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-7 py-3.5 text-[14px] font-medium text-white transition-colors">
                Ver proposta →
              </a>
            </div>
          </FadeIn>
        </section>

        {/* ── ÁREA DO CLIENTE ── */}
        {(!isMaster && (content as any).portal_cliente?.ativo) && (
          <section className="px-6 sm:px-10 pb-14 max-w-6xl mx-auto">
            <FadeIn>
              <div className={`${CARD} px-6 sm:px-10 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6`}>
                <div>
                  <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Área do cliente</p>
                  <p className="mt-3 text-[14.5px] text-white/65">Acompanha o progresso do projeto, as entregas e os ficheiros.</p>
                </div>
                <a href={`/portal-media/${(content as any).portal_cliente?.ref || token}`}
                  className="shrink-0 rounded-full border border-white/[0.2] hover:border-[#2e6cf6] px-7 py-3.5 text-[14px] text-white/85 hover:text-white transition-colors">
                  Abrir área do cliente →
                </a>
              </div>
            </FadeIn>
          </section>
        )}

        {/* ── UMA PALAVRA NOSSA ── */}
        <section className="px-6 py-16 max-w-3xl mx-auto text-center">
          <FadeIn>
            <p className="rlp-m traco text-[10.5px] text-[#5a8bff] inline-block">Uma palavra nossa</p>
            <p className="rlp-t mt-5 text-[26px] sm:text-[34px] leading-snug text-white/90">
              &ldquo;Cada marca tem uma história que merece ser contada com verdade. Estamos aqui para a ouvir primeiro.&rdquo;
            </p>
          </FadeIn>
        </section>

        {/* ── QUEM SOMOS + CONTACTOS ── */}
        <section className="px-6 sm:px-10 py-16 max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          <FadeIn>
            <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">{sobre.label}</p>
            <h2 className="rlp-t mt-3 text-[40px] leading-none">{sobre.titulo}</h2>
            <p className="mt-5 text-[15px] leading-relaxed text-white/65">{sobre.texto}</p>
          </FadeIn>
          <FadeIn delay={120}>
            <div className={`${CARD} p-6`}>
              <p className="rlp-m traco text-[10px] text-[#5a8bff]">Contactos</p>
              <div className="mt-4 grid gap-2.5 text-[14.5px]">
                <a href="tel:+351916162728" className="text-white/85 hover:text-white">+351 916 162 728</a>
                <a href="mailto:geral@rlprod.pt" className="text-white/85 hover:text-white">geral@rlprod.pt</a>
                <a href="https://rlprod.pt" target="_blank" rel="noopener noreferrer" className="text-white/85 hover:text-white">rlprod.pt</a>
                <a href="https://instagram.com/rlprod_pt" target="_blank" rel="noopener noreferrer" className="text-white/85 hover:text-white">@rlprod_pt</a>
                <span className="text-white/50">Pinhal Novo, Portugal</span>
              </div>
              <a href="https://wa.me/351916162728" target="_blank" rel="noopener noreferrer"
                className="mt-5 inline-flex rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-6 py-3 text-[13.5px] font-medium">Falar connosco</a>
            </div>
          </FadeIn>
        </section>

        {/* ── RODAPÉ ── */}
        <footer className="border-t border-white/[0.08] px-6 py-10 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="w-10 h-10 object-contain mx-auto opacity-80" />
          <p className="rlp-t mt-4 text-[18px]">More than a product, <span className="text-[#5a8bff]">an experience.</span></p>
          <p className="rlp-m mt-2 text-[8.5px] text-white/35">RL Prod · Photography & Video · Setúbal</p>
        </footer>
      </div>

      {/* ══════════════════════════════
          EDITOR PANEL (admin only)
      ══════════════════════════════ */}
      {isAdmin && (
        <>
          {editorOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setEditorOpen(false)} />}
          <div className={`fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300 ${editorOpen ? 'translate-x-0' : 'translate-x-full'}`}
            style={{ width: '300px', background: '#060608', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
              <div>
                <p className="text-[9px] tracking-[0.5em] text-white/50 uppercase">Editor</p>
                <p className="text-[8px] text-white/15 mt-0.5 tracking-wider">Alterações em tempo real</p>
              </div>
              <button onClick={() => setEditorOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-white/25 hover:text-white/60 border border-white/[0.07] hover:border-white/20 transition-all">
                ✕
              </button>
            </div>

            {/* Scrollable */}
            <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">

              <AccordionSection title="Hero" open>
                <EditorField label="Título">
                  <TInput value={hero.titulo} onChange={v => setHero('titulo', v)} />
                </EditorField>
                <EditorField label="Subtítulo">
                  <TInput value={hero.subtitulo} onChange={v => setHero('subtitulo', v)} />
                </EditorField>
                <EditorField label="Foto de Cabeçalho">
                  {hero.imageUrl ? (
                    <div className="relative">
                      <img src={hero.imageUrl} alt="" className="w-full h-20 object-cover opacity-60" />
                      <button onClick={() => setHero('imageUrl', '')}
                        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/70 text-white/60 hover:text-red-400/80 text-[10px] border border-white/10 transition-colors">
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => heroImageInputRef.current?.click()} disabled={uploadingHero}
                      className="w-full py-2.5 border border-dashed border-white/10 text-[9px] text-white/25 tracking-widest uppercase hover:border-white/20 hover:text-white/40 transition-colors disabled:opacity-40">
                      {uploadingHero ? 'A carregar...' : '+ Carregar foto'}
                    </button>
                  )}
                </EditorField>
              </AccordionSection>

              <AccordionSection title="Vídeos">
                <EditorField label="Label">
                  <TInput value={videos.label} onChange={v => setVideos('label', v)} />
                </EditorField>
                <EditorField label="Título">
                  <TInput value={videos.titulo} onChange={v => setVideos('titulo', v)} />
                </EditorField>
                {[0,1,2].map(i => (
                  <EditorField key={i} label={`URL Vídeo ${i+1}`}>
                    <TInput value={videos.urls[i] || ''} onChange={v => setVideoUrl(i, v)} />
                    {videos.urls[i] && (
                      <span className={`text-[9px] ${toEmbedUrl(videos.urls[i]) ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                        {toEmbedUrl(videos.urls[i]) ? '✓ Válido' : '✕ Inválido'}
                      </span>
                    )}
                  </EditorField>
                ))}
              </AccordionSection>

              <AccordionSection title="Proposta — Geral">
                <EditorField label="Título">
                  <TInput value={proposta.titulo} onChange={v => setProposta('titulo', v)} />
                </EditorField>
                <EditorField label="Intro (banner no portal)">
                  <TInput value={proposta.intro} onChange={v => setProposta('intro', v)} rows={3} />
                </EditorField>
                <EditorField label="CTA (slide final)">
                  <TInput value={proposta.cta} onChange={v => setProposta('cta', v)} />
                </EditorField>
                <EditorField label="Password de acesso">
                  <TInput value={proposta.password} onChange={v => setProposta('password', v)} />
                </EditorField>
                {!proposta.password && (
                  <p className="text-[8px] text-amber-400/50 tracking-wider">Sem password → acesso livre a quem tiver o link</p>
                )}
              </AccordionSection>

              <AccordionSection title="Slide 1 — Plano de Ação">
                {proposta.planoEtapas.map((etapa, i) => (
                  <div key={i} className="border border-white/[0.05] p-3 flex flex-col gap-2">
                    <p className="text-[8px] tracking-[0.4em] text-white/20 uppercase">Etapa {i+1}</p>
                    <EditorField label="Título">
                      <TInput value={etapa.titulo} onChange={v => {
                        const arr = [...proposta.planoEtapas]; arr[i] = { ...arr[i], titulo: v }; setProposta('planoEtapas', arr)
                      }} />
                    </EditorField>
                    <EditorField label="Texto">
                      <TInput value={etapa.texto} onChange={v => {
                        const arr = [...proposta.planoEtapas]; arr[i] = { ...arr[i], texto: v }; setProposta('planoEtapas', arr)
                      }} rows={3} />
                    </EditorField>
                  </div>
                ))}
              </AccordionSection>

              <AccordionSection title="Slide 3 — O Que Está Incluído">
                <EditorField label="Itens (um por linha)">
                  <TInput
                    value={proposta.incluido.join('\n')}
                    onChange={v => setProposta('incluido', v.split('\n').filter(Boolean))}
                    rows={8}
                  />
                </EditorField>
              </AccordionSection>

              <AccordionSection title="Slide 4 — Vídeos da Proposta">
                {[0,1,2].map(i => (
                  <EditorField key={i} label={`URL Vídeo ${i+1}`}>
                    <TInput value={proposta.videoUrls[i] || ''} onChange={v => {
                      const arr = [...proposta.videoUrls]; arr[i] = v; setProposta('videoUrls', arr)
                    }} />
                    {proposta.videoUrls[i] && (
                      <span className={`text-[9px] ${toEmbedUrl(proposta.videoUrls[i]) ? 'text-emerald-400/60' : 'text-red-400/60'}`}>
                        {toEmbedUrl(proposta.videoUrls[i]) ? '✓ Válido' : '✕ Inválido'}
                      </span>
                    )}
                  </EditorField>
                ))}
              </AccordionSection>

              <AccordionSection title="Slide 5 — Checkpoint">
                <EditorField label="Pergunta">
                  <TInput value={proposta.checkpointPergunta} onChange={v => setProposta('checkpointPergunta', v)} rows={2} />
                </EditorField>
              </AccordionSection>

              <AccordionSection title="Sobre">
                <EditorField label="Label">
                  <TInput value={sobre.label} onChange={v => setSobre('label', v)} />
                </EditorField>
                <EditorField label="Título">
                  <TInput value={sobre.titulo} onChange={v => setSobre('titulo', v)} />
                </EditorField>
                <EditorField label="Texto">
                  <TInput value={sobre.texto} onChange={v => setSobre('texto', v)} rows={4} />
                </EditorField>
              </AccordionSection>

            </div>

            {/* Save */}
            <div className="px-4 py-4 border-t border-white/[0.05] flex flex-col gap-2">
              {saveError && (
                <p className="text-[9px] text-red-400/70 text-center tracking-wider">✕ {saveError}</p>
              )}
              <button onClick={handleSave} disabled={saving}
                className="w-full py-3 border text-[9px] tracking-[0.45em] uppercase transition-all disabled:opacity-40"
                style={{
                  borderColor: saved ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.15)',
                  color: saved ? 'rgba(74,222,128,0.7)' : 'rgba(255,255,255,0.45)',
                  background: saved ? 'rgba(74,222,128,0.05)' : 'rgba(255,255,255,0.02)',
                }}>
                {saving ? 'A guardar...' : saved ? '✓ Guardado' : 'Guardar Alterações'}
              </button>
            </div>

          </div>
        </>
      )}

    </div>
  )
}
