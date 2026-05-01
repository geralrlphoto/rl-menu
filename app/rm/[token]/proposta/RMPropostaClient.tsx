'use client'

import { useCallback, useEffect, useState } from 'react'
import type { RMPageContent, RMPackage } from '../RMLeadPageClient'

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_PACKAGES: RMPackage[] = [
  {
    titulo: 'Essencial',
    descricao: 'Produção focada e objetiva para uma peça de comunicação impactante.',
    itens: ['1 dia de produção (8h)','1 vídeo final (até 3 min)','Correção de cor profissional','Sound design + música licenciada','1 ronda de revisões','Entrega digital em 15 dias úteis'],
    preco: 'Sob consulta',
  },
  {
    titulo: 'Profissional',
    descricao: 'Produção completa com cortes adaptados para múltiplas plataformas.',
    itens: ['2 dias de produção','1 vídeo principal (até 5 min)','3 cortes para redes sociais (16:9, 9:16, 1:1)','Pós-produção premium + motion graphics','2 rondas de revisões','Música premium licenciada','Entrega em 21 dias úteis'],
    preco: 'Sob consulta',
  },
  {
    titulo: 'Estratégico',
    descricao: 'Estratégia de conteúdo completa para uma presença de marca consistente.',
    itens: ['Sessão de estratégia + moodboard','3+ dias de produção','Vídeo institucional + série de conteúdos','Pós-produção premium + efeitos visuais','Copywriting integrado','Revisões ilimitadas','Calendário editorial de publicação','Entrega faseada'],
    preco: 'Sob consulta',
  },
]

function merge(saved: any): RMPageContent {
  const d: RMPageContent = {
    hero:    { titulo: 'Reunião Marcada', subtitulo: 'RL Media · Audiovisual' },
    videos:  { label: '', titulo: '', urls: ['','',''] },
    proposta: { titulo: 'Proposta Criativa', intro: '', packages: DEFAULT_PACKAGES, propostaAtiva: 1, cta: 'Iniciar Produção', password: '' },
    sobre:   { label: 'Quem Somos', titulo: 'RL Media', texto: '' },
  }
  if (!saved) return d
  return {
    hero:    { ...d.hero,    ...(saved.hero    || {}) },
    videos:  { ...d.videos,  ...(saved.videos  || {}), urls: saved.videos?.urls || d.videos.urls },
    proposta: { ...d.proposta, ...(saved.proposta || {}), packages: saved.proposta?.packages || d.proposta.packages, propostaAtiva: saved.proposta?.propostaAtiva ?? 1, password: saved.proposta?.password || '' },
    sobre:   { ...d.sobre,   ...(saved.sobre   || {}) },
  }
}

const PLANO_ETAPAS = [
  {
    n: '1.',
    titulo: 'Definir a Visão Estratégica',
    texto: 'Começamos por explorar em conjunto o potencial único da marca. Vamos identificar oportunidades e definir um caminho claro para melhorar a presença visual no mercado.',
  },
  {
    n: '2.',
    titulo: 'Alinhar a Narrativa e Storytelling',
    texto: 'Mergulhamos na essência da marca para desenvolver uma narrativa visual autêntica para se conectar naturalmente com o público.',
  },
  {
    n: '3.',
    titulo: 'Acompanhamento Contínuo',
    texto: 'Por fim, desenvolvemos em conjunto um plano de produção personalizado para elevar a comunicação a um novo patamar, para potenciar o crescimento da Marca e fortalecer genuinamente a ligação com o público.',
  },
]

const PROCESSO = [
  { n: '01', titulo: 'Briefing',       desc: 'Alinhamento de objetivos, audiência e mensagem-chave.' },
  { n: '02', titulo: 'Pré-Produção',   desc: 'Moodboard, storyboard, scouting e logística.' },
  { n: '03', titulo: 'Produção',       desc: 'Dia(s) de filmagem com equipa especializada.' },
  { n: '04', titulo: 'Pós-Produção',   desc: 'Edição, correção de cor, sound design e motion graphics.' },
  { n: '05', titulo: 'Entrega',        desc: 'Revisões, aprovação e entrega em todos os formatos.' },
]

const TOTAL_SLIDES = 6

// Escala tipográfica: mín 13px — máx 18px
const T = {
  xs:  'text-[13px]',          // labels, notas, mono
  sm:  'text-[14px]',          // corpo secundário
  md:  'text-[15px]',          // corpo principal
  lg:  'text-[16px]',          // subtítulos
  xl:  'text-[17px]',          // títulos médios
  xxl: 'text-[18px]',          // títulos maiores
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function RMPropostaClient({ token, isAdmin }: { token: string; isAdmin: boolean }) {
  const [lead,     setLead]     = useState<Record<string, any> | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [content,  setContent]  = useState<RMPageContent | null>(null)

  const [unlocked, setUnlocked] = useState(false)
  const [pwInput,  setPwInput]  = useState('')
  const [pwError,  setPwError]  = useState(false)

  const [current,  setCurrent]  = useState(0)
  const [dir,      setDir]      = useState<1 | -1>(1)

  useEffect(() => {
    fetch(`/api/media-portal/view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.lead) { setNotFound(true); setLoading(false); return }
        const c = merge(data.lead.page_content)
        setLead(data.lead)
        setContent(c)
        if (typeof window !== 'undefined') {
          const stored = sessionStorage.getItem(`rm_proposta_${token}`)
          if (stored === c.proposta.password || !c.proposta.password || isAdmin) setUnlocked(true)
        }
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token, isAdmin])

  const goTo = useCallback((next: number) => {
    if (next < 0 || next >= TOTAL_SLIDES) return
    setDir(next > current ? 1 : -1)
    setCurrent(next)
  }, [current])

  useEffect(() => {
    if (!unlocked) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goTo(current + 1)
      if (e.key === 'ArrowLeft')  goTo(current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [unlocked, current, goTo])

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    if (!content) return
    if (!content.proposta.password || pwInput === content.proposta.password) {
      sessionStorage.setItem(`rm_proposta_${token}`, pwInput)
      setUnlocked(true)
      setPwError(false)
    } else {
      setPwError(true)
      setPwInput('')
    }
  }

  const labelCls = `${T.xs} tracking-[0.55em] text-white/50 uppercase`

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-[#050507]">
      <p className={`${T.xs} tracking-[0.6em] text-white/40 uppercase animate-pulse`}>A carregar...</p>
    </main>
  )
  if (notFound) return (
    <main className="min-h-screen flex items-center justify-center bg-[#050507]">
      <p className={`${T.xs} tracking-[0.6em] text-white/40 uppercase`}>Página não disponível</p>
    </main>
  )

  const { proposta } = content!
  const empresa = lead!.empresa || lead!.nome || ''

  // ── PASSWORD GATE ─────────────────────────────────────────────────────────
  if (!unlocked) return (
    <main className="min-h-screen bg-[#050507] flex flex-col items-center justify-center px-6 relative">
      <div className="pointer-events-none fixed inset-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.013) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.013) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="pointer-events-none fixed inset-0" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(180,200,255,0.04) 0%, transparent 70%)',
      }} />
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-3">
          <p className={labelCls}>RL Media · Audiovisual</p>
          <h1 className={`${T.xxl} font-extralight tracking-[0.3em] text-white/80 uppercase`}>Proposta Criativa</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-px w-8 bg-white/30" />
            <div className="w-1 h-1 bg-white/40 rotate-45" />
            <div className="h-px w-8 bg-white/30" />
          </div>
          {empresa && <p className={`${T.xs} tracking-[0.5em] text-white/50 uppercase mt-2`}>{empresa}</p>}
        </div>
        <form onSubmit={handleUnlock} className="w-full flex flex-col gap-4">
          <div>
            <input
              type="password"
              value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false) }}
              placeholder="Password de acesso"
              autoFocus
              className={`w-full bg-white/[0.03] border px-5 py-4 ${T.sm} text-white/70 placeholder:text-white/30 tracking-wider text-center focus:outline-none transition-colors ${pwError ? 'border-red-400/40' : 'border-white/[0.12] focus:border-white/30'}`}
            />
            {pwError && <p className={`mt-2 ${T.xs} tracking-[0.4em] text-red-400/70 uppercase text-center`}>Password incorreta</p>}
          </div>
          <button type="submit"
            className={`w-full border border-white/30 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/45 py-4 ${T.xs} tracking-[0.5em] text-white/60 hover:text-white/80 uppercase transition-all`}>
            Aceder →
          </button>
        </form>
        <a href={`/rm/${token}`} className={`${T.xs} tracking-[0.4em] text-white/40 hover:text-white/60 uppercase transition-colors`}>
          ‹ Voltar ao Portal
        </a>
      </div>
    </main>
  )

  // ── SLIDES ────────────────────────────────────────────────────────────────
  const slides = [

    // ── SLIDE 0 — CAPA ──────────────────────────────────────────────────────
    <div key={0} className="flex flex-col items-center justify-center h-full px-8 text-center gap-6">
      <div style={{
        background: '#050507',
        borderRadius: '9999px',
        padding: '4px',
        boxShadow: '0 0 18px rgba(255,255,255,0.20), 0 0 40px rgba(255,255,255,0.08)',
      }}>
        <img
          src="/logo-rl-media-branco.png"
          alt="RL Media"
          className="w-24 h-24 object-contain block"
          style={{ mixBlendMode: 'screen', borderRadius: '9999px' }}
        />
      </div>
      <div className="flex flex-col items-center gap-4">
        <p className={labelCls}>RL Media · Audiovisual</p>
        <h1 className={`${T.xxl} font-extralight tracking-[0.35em] text-white/85 uppercase leading-snug`}>
          Proposta<br />Criativa
        </h1>
        <div className="flex items-center gap-4 my-2">
          <div className="h-px w-12 bg-white/30" />
          <div className="w-1.5 h-1.5 bg-white/40 rotate-45" />
          <div className="h-px w-12 bg-white/30" />
        </div>
        {empresa && <p className={`${T.sm} font-extralight tracking-[0.4em] text-white/60 uppercase`}>{empresa}</p>}
        <p className={`${T.xs} tracking-[0.5em] text-white/40 uppercase font-mono`}>
          {new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>,

    // ── SLIDE 1 — VISÃO ESTRATÉGICA ─────────────────────────────────────────
    <div key={1} className="flex flex-col justify-center h-full px-8 sm:px-20 gap-10 max-w-4xl mx-auto w-full">
      <p className={labelCls}>01 — Visão Estratégica</p>
      <p className="text-[24px] font-extralight text-white/75 leading-relaxed tracking-wide">
        "Não produzimos apenas vídeos. Construímos narrativas visuais que comunicam com precisão, envolvem audiências e trabalham para a vossa marca a longo prazo."
      </p>
      <div className="h-px w-16 bg-white/30" />
      <p className={`${T.md} font-light text-white/55 leading-relaxed tracking-wide max-w-xl`}>
        Uma proposta desenvolvida com base nos objetivos da vossa marca. Foco em resultados, narrativa estratégica e produção de excelência do briefing à entrega final.
      </p>
    </div>,

    // ── SLIDE 2 — PLANO DE AÇÃO ─────────────────────────────────────────────
    <div key={2} className="flex flex-col justify-center h-full px-8 sm:px-20 gap-10 max-w-3xl mx-auto w-full">
      {/* Título principal */}
      <h2 className="text-[24px] font-extrabold tracking-[0.12em] text-white/90 uppercase leading-tight text-center">
        Plano de Ação<br />Personalizado<br />com 3 Etapas
      </h2>
      {/* Etapas */}
      <div className="flex flex-col gap-7">
        {PLANO_ETAPAS.map((etapa, i) => (
          <div key={i} className={`flex flex-col gap-2 ${i < PLANO_ETAPAS.length - 1 ? 'pb-7 border-b border-white/[0.07]' : ''}`}>
            <h3 className={`${T.xl} font-bold text-white/85`}>
              {etapa.n} {etapa.titulo}
            </h3>
            <p className={`${T.sm} font-light text-white/55 leading-relaxed`}>{etapa.texto}</p>
          </div>
        ))}
      </div>
    </div>,

    // ── SLIDE 3 — PACOTES ───────────────────────────────────────────────────
    <div key={3} className="flex flex-col justify-center h-full px-8 sm:px-20 gap-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <p className={labelCls}>03 — Pacotes</p>
        <p className={`${T.xs} font-light text-white/50 tracking-wide`}>O pacote assinalado é o recomendado para a vossa situação.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {proposta.packages.map((pkg, i) => {
          const isActive = i === proposta.propostaAtiva
          return (
            <div key={i} className={`relative flex flex-col border p-6 ${isActive ? 'border-white/30 bg-white/[0.04]' : 'border-white/[0.08] bg-white/[0.01]'}`}>
              {isActive && <div className="absolute -top-px left-0 right-0 h-px bg-white/40" />}
              {isActive && (
                <div className="mb-4">
                  <span className={`${T.xs} tracking-[0.5em] text-white/55 uppercase border border-white/25 px-2 py-1`}>Recomendado</span>
                </div>
              )}
              <p className={labelCls + ' mb-2'}>{pkg.titulo}</p>
              <p className={`${T.sm} font-light text-white/55 leading-relaxed mb-5`}>{pkg.descricao}</p>
              <div className="flex flex-col gap-2 flex-1 mb-5">
                {pkg.itens.map((item, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <span className={`text-white/40 ${T.xs} mt-0.5 shrink-0`}>—</span>
                    <span className={`${T.sm} text-white/60 font-light leading-snug`}>{item}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/[0.08] pt-4 mt-auto">
                <p className={`${T.xs} tracking-[0.45em] uppercase font-light ${isActive ? 'text-white/65' : 'text-white/45'}`}>{pkg.preco}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>,

    // ── SLIDE 4 — PROCESSO ──────────────────────────────────────────────────
    <div key={4} className="flex flex-col justify-center h-full px-8 sm:px-20 gap-8 max-w-4xl mx-auto w-full">
      <p className={labelCls}>04 — Processo de Trabalho</p>
      <div className="flex flex-col">
        {PROCESSO.map((step, i) => (
          <div key={i} className={`flex items-start gap-8 py-5 ${i < PROCESSO.length - 1 ? 'border-b border-white/[0.07]' : ''}`}>
            <span className={`${T.xs} tracking-[0.5em] text-white/40 uppercase font-mono mt-0.5 shrink-0 w-8`}>{step.n}</span>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-8 flex-1">
              <h3 className={`${T.md} font-light tracking-[0.3em] text-white/70 uppercase shrink-0 sm:w-40`}>{step.titulo}</h3>
              <p className={`${T.sm} font-light text-white/55 tracking-wide`}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>,

    // ── SLIDE 5 — PRÓXIMOS PASSOS ───────────────────────────────────────────
    <div key={5} className="flex flex-col items-center justify-center h-full px-8 text-center gap-10">
      <p className={labelCls}>05 — Próximos Passos</p>
      <div className="flex flex-col items-center gap-5">
        <p className={`${T.xxl} font-extralight text-white/70 tracking-wide leading-relaxed`}>
          Estamos prontos para começar.<br />Basta dar o próximo passo.
        </p>
        <a href={`/rm/${token}`}
          className={`flex items-center gap-3 border border-white/30 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/50 px-10 py-5 ${T.xs} tracking-[0.5em] text-white/65 hover:text-white/90 uppercase transition-all duration-300 group`}>
          <span>{proposta.cta}</span>
          <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
        </a>
      </div>
      <p className={`${T.xs} font-light text-white/45 tracking-wider leading-relaxed max-w-sm`}>
        Esta proposta foi preparada especificamente para {empresa || 'a vossa empresa'}.<br />
        É confidencial e destinada exclusivamente ao seu destinatário.
      </p>
    </div>,
  ]

  return (
    <div className="h-screen bg-[#050507] relative overflow-hidden flex flex-col">

      {/* Grid bg */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.013) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.013) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(180,200,255,0.04) 0%, transparent 65%)',
      }} />

      {/* Top bar */}
      <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
        <a href={`/rm/${token}`} className={`${T.xs} tracking-[0.4em] text-white/45 hover:text-white/65 uppercase transition-colors`}>
          ‹ Portal
        </a>
        <p className={`${T.xs} tracking-[0.5em] text-white/40 uppercase`}>RL Media · Proposta Criativa</p>
        <p className={`${T.xs} tracking-widest text-white/45 font-mono`}>
          {String(current + 1).padStart(2,'0')} / {String(TOTAL_SLIDES).padStart(2,'0')}
        </p>
      </div>

      {/* Slides container */}
      <div className="relative flex-1 z-10 overflow-hidden">
        {slides.map((slide, i) => (
          <div
            key={i}
            className="absolute inset-0 overflow-y-auto"
            style={{
              opacity:       current === i ? 1 : 0,
              pointerEvents: current === i ? 'auto' : 'none',
              transform:     current === i
                ? 'translateX(0px)'
                : `translateX(${(i - current) * dir > 0 ? '32px' : '-32px'})`,
              transition: 'opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            {slide}
          </div>
        ))}
      </div>

      {/* Bottom navigation */}
      <div className="relative z-20 shrink-0 flex items-center justify-between px-6 py-5 border-t border-white/[0.06]">

        <button
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className={`flex items-center gap-2 border border-white/[0.12] hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.07] px-5 py-3 text-white/50 hover:text-white/80 transition-all disabled:opacity-20 disabled:cursor-not-allowed`}
        >
          <span className={`${T.xxl} leading-none`}>‹</span>
          <span className={`${T.xs} tracking-[0.4em] uppercase hidden sm:inline`}>Anterior</span>
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-300"
              style={{
                width:      current === i ? 20 : 6,
                height:     6,
                background: current === i ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => goTo(current + 1)}
          disabled={current === TOTAL_SLIDES - 1}
          className={`flex items-center gap-2 border border-white/[0.12] hover:border-white/30 bg-white/[0.02] hover:bg-white/[0.07] px-5 py-3 text-white/50 hover:text-white/80 transition-all disabled:opacity-20 disabled:cursor-not-allowed`}
        >
          <span className={`${T.xs} tracking-[0.4em] uppercase hidden sm:inline`}>Seguinte</span>
          <span className={`${T.xxl} leading-none`}>›</span>
        </button>

      </div>
    </div>
  )
}
