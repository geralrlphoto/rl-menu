'use client'

/* ============================================================
   WorkflowV2Client — cronograma das 12 fases do projecto.
   Design do handoff design_handoff_portal_cliente/Workflow v2.html.
   Tema escuro navy. Motion: focus-pull do título, anel de progresso
   que conta a %, linha da timeline que se desenha até à fase em curso,
   reveal on-scroll dos cartões, checkmark que se desenha, dot da fase
   "em curso" a pulsar. Respeita prefers-reduced-motion.
   ============================================================ */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { Manrope, Space_Grotesk } from 'next/font/google'
import type { Projeto } from '@/app/portal-media/_data/mockProject'
import './workflow-v2.css'

const manrope = Manrope({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-manrope', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-space-grotesk', display: 'swap' })

/* ── Tipo público das fases ───────────────────────────────── */
export type WorkflowPhase = {
  n: string
  icon: keyof typeof ICONS
  name: string
  state: 'done' | 'doing' | 'pending'
  desc: string
  date?: string
}

/* ── Fases padrão (12) — usadas quando projeto.workflowFases vazio ── */
const DEFAULT_PHASES: WorkflowPhase[] = [
  { n: '01', icon: 'contact',   name: 'Primeiro Contato',                       state: 'done',    desc: 'Quando nos contatas e falamos pela primeira vez.' },
  { n: '02', icon: 'brief',     name: 'Briefing Inicial',                       state: 'done',    desc: 'Este briefing pode ser realizado através do link ou mesmo durante a nossa primeira reunião.' },
  { n: '03', icon: 'proposal',  name: 'Proposta Base',                          state: 'done',    desc: 'Fazemos-te uma proposta com base nas informações que fomos recolhendo.' },
  { n: '04', icon: 'handshake', name: 'Adjudicação',                            state: 'done',    desc: 'A proposta foi do vosso agrado, então vamos iniciar o processo.' },
  { n: '05', icon: 'cps',       name: 'Elaboração do CPS',                      state: 'done',    desc: 'Após o serviço estar adjudicado vamos recolher todos os dados para realizar este passo.' },
  { n: '06', icon: 'briefFull', name: 'Briefing Completo',                      state: 'doing',   desc: 'Vamos entregar-te um briefing mais completo e detalhado.' },
  { n: '07', icon: 'contract',  name: 'CPS — Contrato de Prestação de Serviços', state: 'pending', desc: 'Por vezes juntamos o briefing com o CPS assim evita-se mais um documento. O CPS tem que ser assinado e devolvido.' },
  { n: '08', icon: 'plan',      name: 'Planeamento',                            state: 'pending', desc: 'Vamos definir como e quando tudo vai acontecer.' },
  { n: '09', icon: 'prod',      name: 'Produção',                               state: 'pending', desc: 'Chegou o dia de irmos para o terreno fazer acontecer.',                   date: '19 Jul 2025' },
  { n: '10', icon: 'post',      name: 'Pós-Produção',                           state: 'pending', desc: 'Nesta fase vamos começar a editar e a criar o que foi planeado.',         date: 'Ago 2025' },
  { n: '11', icon: 'approve',   name: 'Aprovação',                              state: 'pending', desc: 'Uma das fases mais esperadas de todo o processo — a tua avaliação.',     date: 'Set 2025' },
  { n: '12', icon: 'deliver',   name: 'Entrega',                                state: 'pending', desc: 'Vamos entregar todos os conteúdos que foram acordados.',                  date: '25 Set 2025' },
]

const STATE_LABEL = { done: 'Concluído', doing: 'Em curso', pending: 'Pendente' } as const

/* ============================================================
   COMPONENT
   ============================================================ */
export default function WorkflowV2Client({
  projeto, isAdmin,
}: { projeto: Projeto; isAdmin: boolean }) {
  // Fonte das fases — projeto pode ter override em data.workflowFases (não
  // existe ainda na tipagem; fallback para DEFAULT_PHASES).
  const phasesOverride = (projeto as any)?.workflowFases as WorkflowPhase[] | undefined
  const phases: WorkflowPhase[] = (Array.isArray(phasesOverride) && phasesOverride.length > 0)
    ? phasesOverride
    : DEFAULT_PHASES

  const doneCount = phases.filter(p => p.state === 'done').length
  const totalCount = phases.length
  const pct = Math.round((doneCount / totalCount) * 100)
  const nowName = phases.find(p => p.state === 'doing')?.name ?? '—'

  // Refs para animações
  const ringFillRef = useRef<SVGCircleElement | null>(null)
  const tlFillRef = useRef<HTMLDivElement | null>(null)
  const tlRef = useRef<HTMLDivElement | null>(null)
  const [pctNum, setPctNum] = useState(0)
  const [doneNum, setDoneNum] = useState(0)

  // Anel: stroke-dasharray = circunferência. r=50.
  const C = 2 * Math.PI * 50

  // Disparo das animações + IntersectionObserver para reveal dos nodes
  useEffect(() => {
    // ── Reveal cartões on scroll ──
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('pwv-in')
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.25, rootMargin: '0px 0px -8% 0px' })

    const nodes = tlRef.current?.querySelectorAll('.pwv-node') ?? []
    nodes.forEach(n => io.observe(n))

    // ── Anel + count-up ──
    const t = window.setTimeout(() => {
      if (ringFillRef.current) {
        ringFillRef.current.style.strokeDasharray = String(C)
        ringFillRef.current.style.strokeDashoffset = String(C * (1 - pct / 100))
      }
      // count-up easeOutCubic
      const start = performance.now()
      const dur = 1500
      let raf = 0
      const tick = (now: number) => {
        const k = Math.min((now - start) / dur, 1)
        const ease = 1 - Math.pow(1 - k, 3)
        setPctNum(Math.round(ease * pct))
        setDoneNum(Math.round(ease * doneCount))
        if (k < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)

      // Linha da timeline desenha até ao centro do dot "em curso"
      const doingDot = tlRef.current?.querySelector('.pwv-node.pwv-is-doing .pwv-node__dot') as HTMLElement | null
      if (doingDot && tlFillRef.current) {
        const top = doingDot.offsetTop + doingDot.offsetHeight / 2 - 8
        tlFillRef.current.style.height = Math.max(0, top) + 'px'
      } else if (tlFillRef.current && doneCount === totalCount) {
        // Tudo concluído → linha vai até ao fim
        tlFillRef.current.style.height = '100%'
      }

      return () => cancelAnimationFrame(raf)
    }, 350)

    return () => {
      window.clearTimeout(t)
      io.disconnect()
    }
  }, [phases, pct, doneCount, totalCount, C])

  // Título letra-a-letra (focus-pull)
  const titleWord = 'WORKFLOW'

  // Notify cliente — só admin
  const [notifyingIdx, setNotifyingIdx] = useState<number | null>(null)
  const [notifySuccess, setNotifySuccess] = useState<number | null>(null)
  const handleNotify = async (idx: number, phase: WorkflowPhase) => {
    if (!isAdmin) return
    setNotifyingIdx(idx)
    try {
      const res = await fetch(`/api/media-portal/${projeto.ref}/notify-fase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phaseNumber: phase.n,
          phaseName: phase.name,
          phaseState: phase.state,
          phaseDate: phase.date ?? null,
        }),
      })
      if (res.ok) {
        setNotifySuccess(idx)
        window.setTimeout(() => setNotifySuccess(null), 2500)
      } else {
        alert('Falhou a notificação. Tenta novamente.')
      }
    } catch {
      alert('Erro de ligação. Tenta novamente.')
    } finally {
      setNotifyingIdx(null)
    }
  }

  const backHref = `/portal-media/${projeto.ref}`

  return (
    <div className={`portal-workflow-v2 ${manrope.variable} ${spaceGrotesk.variable}`}>
      <div className="pwv-bg-fx" />

      <div className="pwv-page">
        <p className="pwv-crumb">
          <Link href={backHref}>‹ Portal · {projeto.nome ?? projeto.cliente ?? '—'}</Link>
        </p>

        <header>
          <p className="pwv-eyebrow pwv-head__eyebrow">RL PROD · {projeto.nome ?? projeto.cliente ?? 'Projeto'}</p>
          <h1 className="pwv-title" aria-label="Workflow">
            {titleWord.split('').map((ch, i) => (
              <span key={i} style={{ animationDelay: `${0.2 + i * 0.06}s` }}>{ch}</span>
            ))}
          </h1>
        </header>

        {/* Progress panel */}
        <section className="pwv-card pwv-prog">
          <div className="pwv-ring">
            <svg width={118} height={118} viewBox="0 0 118 118">
              <defs>
                <linearGradient id="pwv-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.72 0.12 165)" />
                  <stop offset="100%" stopColor="oklch(0.80 0.11 245)" />
                </linearGradient>
              </defs>
              <circle className="pwv-ring__track" cx={59} cy={59} r={50} />
              <circle ref={ringFillRef} className="pwv-ring__fill" cx={59} cy={59} r={50}
                style={{ strokeDasharray: C, strokeDashoffset: C }} />
            </svg>
            <div className="pwv-ring__num">
              <span className="pwv-ring__pct">{pctNum}<small>%</small></span>
              <span className="pwv-ring__cap">Concluído</span>
            </div>
          </div>
          <div className="pwv-prog__info">
            <h2>Progresso do projeto</h2>
            <p className="pwv-count"><b>{doneNum}</b> de {totalCount} fases concluídas</p>
            <p className="pwv-nowlbl">Fase atual</p>
            <span className="pwv-prog__now"><span className="pwv-pdot" />{nowName}</span>
          </div>
        </section>

        {/* Timeline */}
        <div ref={tlRef} className="pwv-tl">
          <div className="pwv-tl__track" />
          <div ref={tlFillRef} className="pwv-tl__fill" />

          {phases.map((p, i) => (
            <div key={i} className={`pwv-node pwv-is-${p.state}`} data-st={p.state}>
              <div className="pwv-node__dot">
                {p.state === 'done' && (
                  <span className="pwv-node__check">
                    <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
                  </span>
                )}
                {p.state === 'doing' && (
                  <svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" fill="#fff" /></svg>
                )}
              </div>
              <div className="pwv-pcard">
                <div className="pwv-pcard__top">
                  <p className="pwv-pcard__name">
                    <span className="pwv-pcard__num">{p.n}</span>
                    <span className="pwv-pcard__ic">
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth={1.6}
                        strokeLinecap="round" strokeLinejoin="round">
                        <Icon name={p.icon} />
                      </svg>
                    </span>
                    {p.name}
                  </p>
                  <span className="pwv-status">
                    <span className="pwv-sdot" />{STATE_LABEL[p.state]}
                  </span>
                </div>
                <p className="pwv-pcard__desc">{p.desc}</p>
                <div className="pwv-pcard__foot">
                  <p className="pwv-pcard__date">{p.date ?? 'Data estimada'}</p>
                  {isAdmin && (
                    <button type="button" className="pwv-btn-notify"
                      disabled={notifyingIdx === i}
                      onClick={() => handleNotify(i, p)}>
                      <BellIcon />
                      {notifyingIdx === i
                        ? 'A enviar…'
                        : notifySuccess === i
                          ? '✓ Notificado'
                          : 'Notificar Cliente'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <footer className="pwv-foot">
          <p className="pwv-foot__tag">More than a product, <b>an experience.</b></p>
          <p className="pwv-foot__sub">RL PROD · Photography &amp; Video</p>
        </footer>
      </div>
    </div>
  )
}

/* ============================================================
   ICONS — paths SVG das fases (reaproveitados de Workflow v2.html)
   ============================================================ */
const ICONS = {
  contact:   <path d="M4 5.5h16v10a1.5 1.5 0 0 1-1.5 1.5H8l-4 3.5V5.5Z" />,
  brief:     <><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  proposal:  <><path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4h4" /></>,
  handshake: <path d="M3 12l4-4 5 4 2-2 4 3-4 5-3-2-4 2-4-4Z" />,
  cps:       <path d="M7 3h10v18l-5-3-5 3V3Z" />,
  briefFull: <><rect x="4" y="4" width="16" height="16" rx="2.5" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
  contract:  <><path d="M7 3h7l4 4v14H7V3Z" /><path d="M10 13l2 2 4-4" /></>,
  plan:      <><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M4 9h16M8 3v4M16 3v4" /></>,
  prod:      <><rect x="3" y="6" width="14" height="12" rx="2" /><path d="M17 10l4-2v8l-4-2" /></>,
  post:      <><circle cx="12" cy="12" r="8" /><path d="M10 9l5 3-5 3V9Z" /></>,
  approve:   <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></>,
  deliver:   <><path d="M3.5 8 12 4l8.5 4-8.5 4Z" /><path d="M3.5 8v8L12 20l8.5-4V8" /></>,
} as const

function Icon({ name }: { name: keyof typeof ICONS }): ReactNode {
  return ICONS[name] ?? null
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10.5 19a1.5 1.5 0 0 0 3 0" />
    </svg>
  )
}
