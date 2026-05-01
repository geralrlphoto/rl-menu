'use client'

import { useEffect, useRef, useState } from 'react'
import type { RMPageContent, RMPackage } from '../RMLeadPageClient'

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
        { threshold: 0.05, rootMargin: '0px 0px -16px 0px' }
      )
      obs.observe(el); return () => obs.disconnect()
    }, 60)
    return () => clearTimeout(t)
  }, [])
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(18px)',
      transition: `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  )
}

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
    videos:  { label: 'O Nosso Trabalho', titulo: '', urls: ['','',''] },
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

const DIFERENCIAIS = [
  {
    n: '01',
    titulo: 'Estratégia Primeiro',
    texto: 'Cada projeto começa com uma sessão de alinhamento. Definimos objetivos, audiência e mensagem antes de ligar qualquer câmara.',
  },
  {
    n: '02',
    titulo: 'Produção de Excelência',
    texto: 'Equipamento profissional, diretores de fotografia experientes e pós-produção nativa — em cada entrega, sem exceção.',
  },
  {
    n: '03',
    titulo: 'Formatos para Todos os Canais',
    texto: 'Entregamos conteúdo otimizado para LinkedIn, Instagram, YouTube, site e apresentações — em todos os formatos nativos.',
  },
  {
    n: '04',
    titulo: 'Resultados Mensuráveis',
    texto: 'Acompanhamos o desempenho do conteúdo e ajustamos a estratégia com base em dados reais, não em intuição.',
  },
]

const PROCESSO = [
  { n: '01', titulo: 'Briefing', desc: 'Alinhamento de objetivos, audiência e mensagem-chave.' },
  { n: '02', titulo: 'Pré-Produção', desc: 'Moodboard, storyboard, scouting e logística.' },
  { n: '03', titulo: 'Produção', desc: 'Dia(s) de filmagem com equipa especializada.' },
  { n: '04', titulo: 'Pós-Produção', desc: 'Edição, correção de cor, sound design e motion graphics.' },
  { n: '05', titulo: 'Entrega', desc: 'Revisões, aprovação e entrega em todos os formatos.' },
]

// ─── Main component ───────────────────────────────────────────────────────────
export default function RMPropostaClient({ token, isAdmin }: { token: string; isAdmin: boolean }) {
  const [lead,      setLead]      = useState<Record<string, any> | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)
  const [content,   setContent]   = useState<RMPageContent | null>(null)

  // Password gate
  const [unlocked,  setUnlocked]  = useState(false)
  const [pwInput,   setPwInput]   = useState('')
  const [pwError,   setPwError]   = useState(false)

  useEffect(() => {
    fetch(`/api/media-portal/view?token=${token}`)
      .then(r => r.json())
      .then(data => {
        if (!data.lead) { setNotFound(true); setLoading(false); return }
        const c = merge(data.lead.page_content)
        setLead(data.lead)
        setContent(c)
        // Verificar sessão anterior
        if (typeof window !== 'undefined') {
          const stored = sessionStorage.getItem(`rm_proposta_${token}`)
          if (stored === c.proposta.password || !c.proposta.password || isAdmin) {
            setUnlocked(true)
          }
        }
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [token, isAdmin])

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

  const labelCls = "text-[8px] tracking-[0.55em] text-white/20 uppercase"

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

  const { proposta, sobre } = content!
  const empresa = lead!.empresa || lead!.nome || ''

  // ── PASSWORD GATE ─────────────────────────────────────────────────────────
  if (!unlocked) return (
    <main className="min-h-screen bg-[#050507] flex flex-col items-center justify-center px-6 relative">
      {/* Grid */}
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
          <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/75 uppercase">Proposta Criativa</h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-px w-8 bg-white/15" />
            <div className="w-1 h-1 bg-white/20 rotate-45" />
            <div className="h-px w-8 bg-white/15" />
          </div>
          {empresa && (
            <p className="text-[10px] tracking-[0.5em] text-white/20 uppercase mt-2">{empresa}</p>
          )}
        </div>
        <form onSubmit={handleUnlock} className="w-full flex flex-col gap-4">
          <div className="relative">
            <input
              type="password"
              value={pwInput}
              onChange={e => { setPwInput(e.target.value); setPwError(false) }}
              placeholder="Password de acesso"
              autoFocus
              className={`w-full bg-white/[0.03] border px-5 py-4 text-[12px] text-white/65 placeholder:text-white/15 tracking-wider text-center focus:outline-none transition-colors ${pwError ? 'border-red-400/40' : 'border-white/[0.08] focus:border-white/20'}`}
            />
            {pwError && (
              <p className="mt-2 text-[9px] tracking-[0.4em] text-red-400/60 uppercase text-center">Password incorreta</p>
            )}
          </div>
          <button type="submit"
            className="w-full border border-white/20 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/35 py-4 text-[9px] tracking-[0.5em] text-white/50 hover:text-white/75 uppercase transition-all">
            Aceder →
          </button>
        </form>
        <a href={`/rm/${token}`} className="text-[8px] tracking-[0.4em] text-white/15 hover:text-white/35 uppercase transition-colors">
          ‹ Voltar ao Portal
        </a>
      </div>
    </main>
  )

  // ── PROPOSAL CONTENT ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050507] relative">

      {/* Grid */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.013) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.013) 1px,transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 70% 45% at 50% -5%, rgba(180,200,255,0.04) 0%, transparent 65%)',
      }} />

      <div className="relative z-10">

        {/* ── CAPA ── */}
        <section className="min-h-[90vh] flex flex-col items-center justify-center px-6 pb-16 text-center">
          <FadeIn delay={60}>
            <p className={`${labelCls} mb-4`}>RL Media · Audiovisual</p>
          </FadeIn>
          <FadeIn delay={180}>
            <h1 className="text-5xl sm:text-7xl font-extralight tracking-[0.2em] text-white/80 uppercase mb-4 leading-none">
              Proposta<br />Criativa
            </h1>
          </FadeIn>
          <FadeIn delay={300}>
            <div className="flex items-center gap-4 my-8">
              <div className="h-px w-12 bg-white/20" />
              <div className="w-1.5 h-1.5 bg-white/25 rotate-45" />
              <div className="h-px w-12 bg-white/20" />
            </div>
          </FadeIn>
          <FadeIn delay={400}>
            {empresa && (
              <p className="text-sm font-extralight tracking-[0.4em] text-white/35 uppercase mb-3">{empresa}</p>
            )}
            <p className="text-[10px] tracking-[0.5em] text-white/15 uppercase font-mono">
              {new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </FadeIn>
          {/* Scroll cue */}
          <FadeIn delay={600} className="absolute bottom-10 left-1/2 -translate-x-1/2">
            <div className="flex flex-col items-center gap-2 opacity-25">
              <div className="w-px h-10 bg-white/50" />
              <span className="text-[7px] tracking-[0.6em] text-white uppercase">Scroll</span>
            </div>
          </FadeIn>
        </section>

        <div className="w-full h-px bg-white/[0.04]" />

        {/* ── VISÃO ESTRATÉGICA ── */}
        <section className="py-20 px-6 max-w-3xl mx-auto">
          <FadeIn>
            <p className={`${labelCls} mb-6`}>01 — Visão Estratégica</p>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="text-2xl sm:text-3xl font-extralight text-white/70 leading-relaxed tracking-wide mb-10">
              "Não produzimos apenas vídeos. Construímos narrativas visuais que comunicam com precisão, envolvem audiências e trabalham para a vossa marca a longo prazo."
            </p>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-sm font-light text-white/30 leading-relaxed tracking-wide max-w-xl">
              {proposta.intro || 'Uma proposta desenvolvida com base nos objetivos da vossa marca. Foco em resultados, narrativa estratégica e produção de excelência — do briefing à entrega final.'}
            </p>
          </FadeIn>
        </section>

        <div className="w-full h-px bg-white/[0.04]" />

        {/* ── O QUE NOS DISTINGUE ── */}
        <section className="py-20 px-6 max-w-5xl mx-auto">
          <FadeIn>
            <p className={`${labelCls} mb-12`}>02 — O Que Nos Distingue</p>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DIFERENCIAIS.map((d, i) => (
              <FadeIn key={i} delay={i * 80}>
                <div className="border border-white/[0.06] bg-white/[0.01] p-7 flex flex-col gap-4 h-full">
                  <p className="text-[8px] tracking-[0.5em] text-white/15 uppercase font-mono">{d.n}</p>
                  <h3 className="text-base font-extralight tracking-[0.25em] text-white/70 uppercase">{d.titulo}</h3>
                  <p className="text-[12px] font-light text-white/30 leading-relaxed">{d.texto}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        <div className="w-full h-px bg-white/[0.04]" />

        {/* ── PACOTES ── */}
        <section className="py-20 px-6 max-w-5xl mx-auto">
          <FadeIn>
            <div className="mb-12">
              <p className={`${labelCls} mb-4`}>03 — Pacotes</p>
              <p className="text-sm font-light text-white/30 tracking-wide max-w-lg">
                Três níveis de produção desenhados para diferentes objetivos e dimensões de projeto.
                O pacote assinalado é o que consideramos mais adequado para a vossa situação.
              </p>
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {proposta.packages.map((pkg, i) => {
              const isActive = i === proposta.propostaAtiva
              return (
                <FadeIn key={i} delay={i * 100}>
                  <div className={`relative flex flex-col h-full border p-7 transition-all ${
                    isActive ? 'border-white/25 bg-white/[0.03]' : 'border-white/[0.06] bg-white/[0.01]'
                  }`}>
                    {isActive && (
                      <div className="absolute -top-px left-0 right-0 h-px bg-white/30" />
                    )}
                    {isActive && (
                      <div className="mb-5">
                        <span className="text-[7px] tracking-[0.6em] text-white/30 uppercase border border-white/15 px-2.5 py-1">
                          Recomendado
                        </span>
                      </div>
                    )}
                    <p className={`${labelCls} mb-3`}>{pkg.titulo}</p>
                    <p className="text-[12px] font-light text-white/30 leading-relaxed mb-8">{pkg.descricao}</p>
                    <div className="flex flex-col gap-3 flex-1 mb-8">
                      {pkg.itens.map((item, j) => (
                        <div key={j} className="flex items-start gap-3">
                          <span className="text-white/15 text-[8px] mt-0.5 shrink-0">—</span>
                          <span className="text-[11px] text-white/40 font-light leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-white/[0.06] pt-5 mt-auto">
                      <p className={`text-[10px] tracking-[0.45em] uppercase font-light ${isActive ? 'text-white/55' : 'text-white/20'}`}>
                        {pkg.preco}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              )
            })}
          </div>
        </section>

        <div className="w-full h-px bg-white/[0.04]" />

        {/* ── PROCESSO ── */}
        <section className="py-20 px-6 max-w-5xl mx-auto">
          <FadeIn>
            <p className={`${labelCls} mb-12`}>04 — Processo de Trabalho</p>
          </FadeIn>
          <div className="flex flex-col gap-0">
            {PROCESSO.map((step, i) => (
              <FadeIn key={i} delay={i * 70}>
                <div className={`flex items-start gap-8 py-7 ${i < PROCESSO.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>
                  <span className="text-[8px] tracking-[0.5em] text-white/15 uppercase font-mono mt-1 shrink-0 w-8">{step.n}</span>
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-baseline sm:gap-8 flex-1">
                    <h3 className="text-[13px] font-light tracking-[0.3em] text-white/60 uppercase shrink-0 sm:w-40">{step.titulo}</h3>
                    <p className="text-[12px] font-light text-white/25 tracking-wide">{step.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        <div className="w-full h-px bg-white/[0.04]" />

        {/* ── PRÓXIMOS PASSOS ── */}
        <section className="py-20 px-6 max-w-3xl mx-auto text-center">
          <FadeIn>
            <p className={`${labelCls} mb-8`}>05 — Próximos Passos</p>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="text-xl sm:text-2xl font-extralight text-white/55 tracking-wide leading-relaxed mb-12">
              Estamos prontos para começar.<br />Basta dar o próximo passo.
            </p>
          </FadeIn>
          <FadeIn delay={200} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={`/rm/${token}`}
              className="flex items-center gap-3 border border-white/25 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/40 px-10 py-5 text-[9px] tracking-[0.5em] text-white/60 hover:text-white/85 uppercase transition-all duration-300 group">
              <span>{proposta.cta}</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </a>
          </FadeIn>
          <FadeIn delay={300}>
            <p className="mt-10 text-[10px] font-light text-white/20 tracking-wider leading-relaxed">
              Esta proposta foi preparada especificamente para {empresa || 'a vossa empresa'}.<br />
              É confidencial e destinada exclusivamente ao seu destinatário.
            </p>
          </FadeIn>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/[0.04] px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[8px] tracking-[0.6em] text-white/12 uppercase">© RL Media · Audiovisual</p>
          <a href={`/rm/${token}`} className="text-[8px] tracking-[0.4em] text-white/15 hover:text-white/35 uppercase transition-colors">
            ‹ Voltar ao Portal
          </a>
        </footer>

      </div>
    </div>
  )
}
