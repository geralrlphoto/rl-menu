'use client'

import { useEffect, useRef, useState } from 'react'

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
  hero:    { titulo: string; subtitulo: string }
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
    subtitulo: 'RL Media · Audiovisual',
  },
  videos: {
    label: 'O Nosso Trabalho',
    titulo: 'Produção audiovisual com propósito.',
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
    titulo: 'RL Media',
    texto:
      'Produzimos conteúdo audiovisual que comunica com clareza e impacto. Trabalhamos com marcas que entendem o valor da narrativa visual — desde vídeos institucionais a campanhas digitais. A nossa abordagem é estratégica, estética e orientada para resultados concretos.',
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
  const vm = url.match(/vimeo\.com\/(\d+)/)
  if (vm) return `https://player.vimeo.com/video/${vm[1]}?title=0&byline=0&portrait=0`
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

// ─── Main component ───────────────────────────────────────────────────────────
export default function RMLeadPageClient({ token, isAdmin }: { token: string; isAdmin: boolean }) {
  const [lead,       setLead]       = useState<RMLead | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)
  const [status,     setStatus]     = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [requesting, setRequesting] = useState(false)

  // Editor
  const [editorOpen, setEditorOpen] = useState(false)
  const [content,    setContent]    = useState<RMPageContent>(DEFAULT_CONTENT)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [saveError,  setSaveError]  = useState<string | null>(null)

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
    <main className="min-h-screen flex items-center justify-center bg-[#050507]">
      <p className="text-[9px] tracking-[0.6em] text-white/15 uppercase animate-pulse">A carregar...</p>
    </main>
  )
  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center bg-[#050507]">
      <p className="text-[9px] tracking-[0.6em] text-white/15 uppercase">Página não disponível</p>
    </main>
  )

  const isVideo  = lead!.reuniao_tipo === 'Videochamada'
  const dataFmt  = fmtData(lead!.reuniao_data || '')
  const horaFmt  = fmtHora(lead!.reuniao_hora || '')
  const targetDate = lead!.reuniao_data && lead!.reuniao_hora
    ? `${lead!.reuniao_data}T${horaFmt}:00` : null

  const { hero, videos, proposta, sobre } = content
  const labelCls = "text-[8px] tracking-[0.5em] text-white/20 uppercase"

  return (
    <div className="min-h-screen relative" style={{ background: '#04080f' }}>

      {/* ── Background: grelha + neon azul ── */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(70,120,255,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(70,120,255,0.055) 1px,transparent 1px)`,
        backgroundSize: '64px 64px',
      }} />
      {/* halo topo centro */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 110% 55% at 50% -8%, rgba(50,110,255,0.13) 0%, rgba(30,70,200,0.05) 45%, transparent 70%)',
      }} />
      {/* halo lateral esquerdo */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 45% 55% at -6% 45%, rgba(60,130,255,0.07) 0%, transparent 55%)',
      }} />
      {/* halo lateral direito */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 45% 55% at 106% 55%, rgba(40,100,255,0.06) 0%, transparent 52%)',
      }} />

      {/* ── ADMIN BAR ── */}
      {isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-2.5 bg-[#050507]/90 backdrop-blur-sm border-b border-white/[0.06]">
          <a href="/media/crm/leads" className="text-[9px] tracking-[0.4em] text-white/20 hover:text-white/50 transition-colors uppercase">‹ Leads</a>
          <span className="text-[8px] tracking-[0.5em] text-white/15 uppercase">Admin · Portal de Reunião</span>
          <button onClick={() => setEditorOpen(true)}
            className="text-[11px] tracking-[0.35em] text-white/70 hover:text-white/90 border border-white/25 hover:border-white/50 bg-white/[0.05] hover:bg-white/[0.10] px-4 py-2 uppercase transition-all font-medium">
            ✎ Editar
          </button>
        </div>
      )}

      <div className={`relative z-10 ${isAdmin ? 'pt-10' : ''}`}>

        {/* ── HERO ── */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pb-20">
          <FadeIn delay={80}>
            <p className={`${labelCls} text-center mb-3`}>{hero.subtitulo}</p>
          </FadeIn>
          <FadeIn delay={200}>
            <h1 className="text-4xl sm:text-6xl font-extralight tracking-[0.25em] text-white/85 uppercase text-center mb-6">
              {hero.titulo}
            </h1>
          </FadeIn>
          <FadeIn delay={340}>
            <div className="flex items-center gap-3 justify-center mb-8">
              <div className="h-px w-8 bg-white/20" />
              <div className="h-px w-1 bg-white/[0.08]" />
              <div className="h-px flex-shrink-0 w-1 bg-white/[0.08]" />
              <div className="h-px w-8 bg-white/20" />
            </div>
          </FadeIn>
          <FadeIn delay={440} className="flex flex-col items-center gap-2">
            {lead!.nome && (
              <p className="text-xl sm:text-2xl font-extralight tracking-[0.2em] text-white/60 uppercase">
                {lead!.nome}
              </p>
            )}
            {lead!.empresa && (
              <p className="text-[11px] tracking-[0.4em] text-white/25 uppercase">{lead!.empresa}</p>
            )}
            {dataFmt && (
              <p className="mt-3 text-[10px] tracking-[0.45em] text-white/20 uppercase font-mono">
                {dataFmt}{horaFmt && ` · ${horaFmt}`}{lead!.reuniao_tipo && ` · ${lead!.reuniao_tipo}`}
              </p>
            )}
          </FadeIn>

          {/* Scroll cue */}
          <FadeIn delay={600} className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <div className="flex flex-col items-center gap-2 opacity-30">
              <div className="w-px h-10 bg-white/40" />
              <span className="text-[7px] tracking-[0.6em] text-white uppercase">Scroll</span>
            </div>
          </FadeIn>
        </section>

        <div className="w-full h-px bg-white/[0.04]" />

        {/* ── COUNTDOWN ── */}
        {targetDate && (
          <section className="py-16 flex flex-col items-center px-6">
            <FadeIn>
              <p className={`${labelCls} text-center mb-10`}>Falta</p>
            </FadeIn>
            <FadeIn delay={120}>
              <Countdown targetDate={targetDate} />
            </FadeIn>
          </section>
        )}

        {/* ── MEETING CARD + ACTIONS ── */}
        <section className="py-16 flex flex-col items-center px-6">
          <FadeIn className="w-full max-w-sm">

            {/* Card detalhes */}
            <div className="border border-white/[0.07] bg-white/[0.02] mb-6">
              <div className="px-6 py-4 border-b border-white/[0.05]">
                <p className={labelCls}>Detalhes da Reunião</p>
              </div>
              <div className="px-6 py-5 flex flex-col gap-5">
                {dataFmt && (
                  <div className="flex items-center justify-between">
                    <span className={labelCls}>Data</span>
                    <span className="text-sm font-extralight text-white/70 tracking-wider">{dataFmt}</span>
                  </div>
                )}
                {horaFmt && (
                  <>
                    <div className="h-px bg-white/[0.04]" />
                    <div className="flex items-center justify-between">
                      <span className={labelCls}>Hora</span>
                      <span className="text-sm font-extralight text-white/70 tracking-wider font-mono">{horaFmt}</span>
                    </div>
                  </>
                )}
                {lead!.reuniao_tipo && (
                  <>
                    <div className="h-px bg-white/[0.04]" />
                    <div className="flex items-center justify-between">
                      <span className={labelCls}>Modo</span>
                      <span className="text-sm font-extralight text-white/70 tracking-wider">{lead!.reuniao_tipo}</span>
                    </div>
                  </>
                )}
              </div>
              {lead!.reuniao_link && (
                <div className="px-6 pb-5">
                  <a href={lead!.reuniao_link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 border border-white/[0.08] hover:border-white/20 text-[9px] tracking-[0.45em] text-white/35 hover:text-white/60 uppercase transition-all">
                    <span>{isVideo ? '↗ Entrar na videochamada' : '↗ Ver localização'}</span>
                  </a>
                </div>
              )}
            </div>

            {/* Status badges */}
            {status === 'confirmada' && (
              <div className="flex items-center justify-center gap-2 w-full px-5 py-3 border border-emerald-400/20 bg-emerald-400/5 mb-4">
                <span className="text-emerald-400/70 text-[9px] tracking-[0.5em] uppercase">✓ Reunião Confirmada</span>
              </div>
            )}
            {status === 'alteracao_pedida' && (
              <div className="flex items-center justify-center gap-2 w-full px-5 py-3 border border-amber-400/20 bg-amber-400/5 mb-4">
                <span className="text-amber-400/60 text-[9px] tracking-[0.5em] uppercase">⏳ Pedido de Alteração Enviado</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {status !== 'confirmada' && (
                <button onClick={handleConfirm} disabled={confirming || isAdmin}
                  className="w-full py-4 border border-white/25 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/40 text-[9px] tracking-[0.5em] text-white/60 hover:text-white/85 uppercase transition-all disabled:opacity-30">
                  {confirming ? 'A confirmar...' : '✓  Confirmar Reunião'}
                </button>
              )}
              <button onClick={handleChangeRequest} disabled={requesting || isAdmin}
                className="w-full py-3 border border-white/[0.07] hover:border-white/15 text-[9px] tracking-[0.45em] text-white/25 hover:text-white/45 uppercase transition-all disabled:opacity-30">
                {requesting ? 'A enviar...' : 'Pedir Alteração'}
              </button>
              {isAdmin && <p className="text-center text-[8px] text-white/15 tracking-widest uppercase mt-1">Botões desativados em modo admin</p>}
            </div>

            {/* Adicionar ao calendário */}
            {targetDate && !isAdmin && (() => {
              const fmt = (d: string, h: string) => `${d.replace(/-/g,'')}T${h.replace(':','')}00`
              const start = fmt(lead!.reuniao_data, horaFmt)
              const end   = fmt(lead!.reuniao_data, String(parseInt(horaFmt.split(':')[0])+1).padStart(2,'0') + ':' + horaFmt.split(':')[1])
              const title = encodeURIComponent('Reunião RL Media · Audiovisual')
              const loc   = encodeURIComponent(lead!.reuniao_link || (isVideo ? 'Videochamada' : 'Presencial'))
              const gcal  = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${loc}`
              const downloadIcs = () => {
                const ics = [
                  'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//RL Media//Audiovisual//PT',
                  'BEGIN:VEVENT',
                  `DTSTART:${start}`, `DTEND:${end}`,
                  `SUMMARY:Reunião RL Media · Audiovisual`,
                  `LOCATION:${decodeURIComponent(loc)}`,
                  'END:VEVENT','END:VCALENDAR',
                ].join('\r\n')
                const blob = new Blob([ics], { type: 'text/calendar' })
                const url  = URL.createObjectURL(blob)
                Object.assign(document.createElement('a'), { href: url, download: 'reuniao-rl-media.ics' }).click()
                URL.revokeObjectURL(url)
              }
              return (
                <div className="mt-6 flex flex-col items-center gap-3">
                  <p className={labelCls}>Adicionar ao Calendário</p>
                  <div className="flex gap-2 w-full">
                    <a href={gcal} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-white/[0.07] hover:border-white/15 text-[9px] tracking-[0.3em] text-white/20 hover:text-white/40 uppercase transition-all">
                      Google
                    </a>
                    <button onClick={downloadIcs}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-white/[0.07] hover:border-white/15 text-[9px] tracking-[0.3em] text-white/20 hover:text-white/40 uppercase transition-all">
                      Apple / ICS
                    </button>
                  </div>
                </div>
              )
            })()}

          </FadeIn>
        </section>

        <div className="w-full h-px bg-white/[0.04]" />

        {/* ── VÍDEOS ── */}
        {(videos.urls.some(u => u) || isAdmin) && (
          <section className="py-16 px-6 flex flex-col items-center bg-white/[0.01]">
            <FadeIn>
              <p className={`${labelCls} text-center mb-3`}>{videos.label}</p>
            </FadeIn>
            <FadeIn delay={100}>
              <h2 className="text-xl sm:text-2xl font-extralight tracking-[0.2em] text-white/60 uppercase text-center mb-10">
                {videos.titulo}
              </h2>
            </FadeIn>
            <FadeIn delay={200} className="w-full max-w-5xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {videos.urls.map((url, i) => {
                  const embed = toEmbedUrl(url)
                  if (embed) return (
                    <div key={i} className="border border-white/[0.06]" style={{ aspectRatio: '16/9' }}>
                      <iframe src={embed} className="w-full h-full" allowFullScreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    </div>
                  )
                  if (isAdmin) return (
                    <div key={i} className="border border-dashed border-white/[0.06] flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
                      <span className="text-[9px] tracking-[0.4em] text-white/15 uppercase">Vídeo {i + 1}</span>
                    </div>
                  )
                  return null
                })}
              </div>
            </FadeIn>
          </section>
        )}

        {/* ── PROPOSTA CRIATIVA — banner ── */}
        <section className="px-6 py-16 max-w-3xl mx-auto">
          <FadeIn>
            <div className="relative border border-white/[0.08] bg-white/[0.02] px-8 sm:px-14 py-12 flex flex-col sm:flex-row items-center justify-between gap-8">
              {/* Cantos ornamentais */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-white/20" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-white/20" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-white/20" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-white/20" />
              <div className="flex flex-col gap-3 text-center sm:text-left">
                <p className={labelCls}>Proposta Criativa</p>
                <p className="text-[13px] font-extralight text-white/50 tracking-wider leading-relaxed">
                  {proposta.intro}
                </p>
              </div>
              <a href={`/rm/${token}/proposta`}
                className="shrink-0 flex items-center gap-3 border border-white/20 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/35 px-8 py-4 text-[9px] tracking-[0.5em] text-white/55 hover:text-white/80 uppercase transition-all duration-300 group whitespace-nowrap">
                <span>Ver Proposta</span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </a>
            </div>
          </FadeIn>
        </section>

        <div className="w-full h-px bg-white/[0.04]" />

        {/* ── SOBRE ── */}
        <section className="py-16 px-6 flex flex-col items-center max-w-lg mx-auto text-center">
          <FadeIn>
            <p className={`${labelCls} mb-4`}>{sobre.label}</p>
          </FadeIn>
          <FadeIn delay={100}>
            <h2 className="text-2xl font-extralight tracking-[0.3em] text-white/70 uppercase mb-6">{sobre.titulo}</h2>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-sm font-light text-white/30 leading-relaxed tracking-wide">{sobre.texto}</p>
          </FadeIn>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/[0.04] px-6 py-8 text-center">
          <FadeIn>
            <p className="text-[8px] tracking-[0.6em] text-white/12 uppercase">© RL Media · Audiovisual</p>
          </FadeIn>
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
