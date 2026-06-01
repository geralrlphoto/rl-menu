'use client'

/* ============================================================
   DashboardClient — Portal do Cliente RL PROD (v2)
   Design do handoff design_handoff_portal_cliente (Portal Dashboard.html).
   Tema escuro navy, fiel ao login. Identidade + Welcome + Stats +
   Fase actual (stepper) + Menu 8 tiles + Tile Interno (admin only).

   A versão anterior (com AdminBar e edição inline de campos) está
   preservada em DashboardClientLegacy.tsx para fallback futuro.
   ============================================================ */

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { Manrope, Space_Grotesk } from 'next/font/google'
import type { Projeto } from '@/app/portal-media/_data/mockProject'
import './portal-dashboard.css'

const manrope = Manrope({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-manrope', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-space-grotesk', display: 'swap' })

/* ── Helpers ─────────────────────────────────────────────────── */
function detectActivePhase(projeto: Projeto): number {
  const emCurso = (projeto.fases ?? []).findIndex(f => f.estado === 'em_curso')
  if (emCurso >= 0) return emCurso
  const concluidas = (projeto.fases ?? []).filter(f => f.estado === 'concluido').length
  return Math.max(0, concluidas)
}

/* ── Menu (links para sub-rotas existentes) ────────────────── */
const MENU_ITEMS = [
  { num: '01', icon: 'workflow', name: 'Workflow',         desc: 'Fases do projeto',       slug: 'workflow' },
  { num: '02', icon: 'map',      name: 'Road Map',         desc: 'Planeamento e tarefas',  slug: 'roadmap' },
  { num: '03', icon: 'briefing', name: 'Briefing',         desc: 'Objetivos e referências', slug: 'briefing' },
  { num: '04', icon: 'doc',      name: 'Contrato & Dados', desc: 'Documentos e dados',     slug: 'contrato' },
  { num: '05', icon: 'pay',      name: 'Pagamentos',       desc: 'Estado financeiro',      slug: 'pagamentos' },
  { num: '06', icon: 'deliver',  name: 'Entregas',         desc: 'Ficheiros e revisões',   slug: 'entregas' },
  { num: '07', icon: 'support',  name: 'Atendimento',      desc: 'Equipa e contactos',     slug: 'atendimento' },
  { num: '08', icon: 'star',     name: 'Satisfação',       desc: 'Avaliação do projeto',   slug: 'satisfacao' },
] as const

/* ============================================================
   COMPONENT
   ============================================================ */
export default function DashboardClient({
  projeto, isAdmin,
}: { projeto: Projeto; isAdmin: boolean }) {
  const totalFases = (projeto.fases ?? []).length || 5
  const initialActive = detectActivePhase(projeto)
  const [active, setActive] = useState(initialActive)

  // Persistência local da escolha do stepper (apenas para admin).
  // Quando o Supabase voltar, isto pode ser substituído por uma chamada
  // à API que escreve em media_portais.dados.fase_atual.
  useEffect(() => {
    if (!isAdmin) return
    try {
      const k = `pcd-phase-${projeto.ref}`
      const v = localStorage.getItem(k)
      if (v !== null) setActive(parseInt(v, 10))
    } catch {/* noop */}
  }, [projeto.ref, isAdmin])

  const handleStepClick = (i: number) => {
    if (!isAdmin) return
    setActive(i)
    try { localStorage.setItem(`pcd-phase-${projeto.ref}`, String(i)) } catch {/* noop */}
  }

  const phaseName = (projeto.fases?.[active]?.nome) ?? `Fase ${active + 1}`
  const phasePct = Math.round(((active + 1) / totalFases) * 100)

  // ── Mini-chart pagamentos ──────────────────────────────────────
  const pagamentos = projeto.pagamentos ?? []
  const valorTotal = pagamentos.reduce((s, p) => s + (p.valor ?? 0), 0)
  const valorPago = pagamentos.filter(p => p.estado === 'pago').reduce((s, p) => s + (p.valor ?? 0), 0)
  const valorPendente = valorTotal - valorPago
  const pctPago = valorTotal > 0 ? Math.round((valorPago / valorTotal) * 100) : 0
  const fmtEur = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
  const RING_R = 36
  const RING_C = 2 * Math.PI * RING_R
  const ringPayOffset = RING_C * (1 - pctPago / 100)
  const ringFlowOffset = RING_C * (1 - phasePct / 100)

  // Stats — fallbacks honestos quando faltam dados.
  const local = projeto.local?.trim() ? projeto.local : null
  const filmagem = projeto.dataFilmagem?.trim() ? projeto.dataFilmagem : null
  const revUsadas = projeto.revisoes?.usadas ?? 0
  const revTotal = projeto.revisoes?.total ?? 3
  const entrega = projeto.dataEntrega?.trim() ? projeto.dataEntrega : null

  return (
    <div className={`portal-cliente-dashboard ${manrope.variable} ${spaceGrotesk.variable}`}>
      <div className="pcd-bg-fx" />

      <div className="pcd-page">
        {/* HERO */}
        <div className="pcd-hero">
          {projeto.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={projeto.heroImageUrl} alt="" />
          ) : (
            <div className="pcd-hero-ph">Imagem do projeto</div>
          )}
          <div className="pcd-hero__fade" />
          <div className="pcd-hero__edge" />
        </div>

        {/* IDENTITY */}
        <header className="pcd-ident">
          <div className="pcd-ident__row">
            <div className="pcd-ident__logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/portal-cliente/mark-white.png" alt="RL PROD" />
            </div>
            <div className="pcd-ident__txt">
              <span className="pcd-eyebrow">Produção de Fotografia e Vídeo</span>
              <h1 className="pcd-ident__name">RL&nbsp;PROD</h1>
            </div>
          </div>
          <div className="pcd-ident__meta">
            <span className="pcd-ident__client">Projeto · {projeto.nome ?? projeto.cliente ?? '—'}</span>
            <span className="pcd-badge"><span className="pcd-pulse" />{projeto.status ?? 'Em produção'}</span>
          </div>
        </header>

        {/* WELCOME */}
        <section className="pcd-card pcd-welcome">
          <div className="pcd-welcome__head">
            <span className="pcd-ic"><IcWave /></span>
            <h2>Bem-vindo ao Portal do Cliente</h2>
          </div>
          <p className="pcd-welcome__intro">
            Olá, seja bem-vindo ao Portal do Cliente. Aqui encontra <b>tudo o que precisa saber sobre o andamento do seu projeto</b> de forma clara, organizada e transparente.
          </p>

          <div className="pcd-welcome__cols">
            <div className="pcd-col">
              <p className="pcd-col__title"><span className="pcd-ic"><IcEye /></span>O que pode acompanhar</p>
              <ul>
                <li><span className="pcd-mk"><IcDot /></span><span><b>Workflow do Projeto:</b> Etapas concluídas, em curso e próximas fases</span></li>
                <li><span className="pcd-mk"><IcDot /></span><span><b>Cronograma:</b> Progresso detalhado de cada fase</span></li>
                <li><span className="pcd-mk"><IcDot /></span><span><b>Contactos Dedicados:</b> A quem falar em cada momento</span></li>
                <li><span className="pcd-mk"><IcDot /></span><span><b>Documentos &amp; Entregas:</b> Ficheiros e registos importantes</span></li>
              </ul>
            </div>
            <div className="pcd-col pcd-col--how">
              <p className="pcd-col__title"><span className="pcd-ic"><IcGrid /></span>Como usar</p>
              <ol>
                <li><span className="pcd-num">1</span><span>Navegue pelo menu para explorar cada secção.</span></li>
                <li><span className="pcd-num">2</span><span>Clique na fase do projeto para ver detalhes, prazos e status.</span></li>
                <li><span className="pcd-num">3</span><span>Use a área de contactos para falar diretamente com os responsáveis.</span></li>
              </ol>
            </div>
          </div>

          <p className="pcd-welcome__foot">
            <span className="pcd-ic"><IcHand /></span>
            <span>Este portal foi criado para <b>garantir transparência, confiança e proximidade</b> durante todo o processo. Obrigado pela confiança na nossa equipa.</span>
          </p>
        </section>

        {/* STATS */}
        <section className="pcd-stats">
          <div className="pcd-card pcd-stat">
            <p className="pcd-stat__k">Local</p>
            <p className={'pcd-stat__v' + (local ? '' : ' pcd-empty')}>{local ?? 'vazio'}</p>
          </div>
          <div className="pcd-card pcd-stat">
            <p className="pcd-stat__k">Filmagem</p>
            <p className={'pcd-stat__v' + (filmagem ? '' : ' pcd-empty')}>{filmagem ?? 'sem data'}</p>
          </div>
          <div className="pcd-card pcd-stat">
            <p className="pcd-stat__k">Revisões</p>
            <p className="pcd-stat__v"><em>{revUsadas}</em> / {revTotal}</p>
          </div>
          <div className="pcd-card pcd-stat">
            <p className="pcd-stat__k">Entrega final</p>
            <p className={'pcd-stat__v' + (entrega ? '' : ' pcd-empty')}>{entrega ?? 'sem data'}</p>
          </div>
        </section>

        {/* FASE ACTUAL */}
        <section className="pcd-card pcd-phase">
          <div className="pcd-phase__top">
            <p className="pcd-phase__title">Fase actual · <em>{phaseName}</em></p>
            <span className="pcd-phase__pct">{phasePct}%</span>
          </div>
          {isAdmin && (
            <p className="pcd-phase__hint"><IcCursor /> Clica numa fase para definir a fase actual</p>
          )}

          <div className="pcd-steps">
            {Array.from({ length: totalFases }).map((_, i) => {
              const f = projeto.fases?.[i]
              const lbl = f?.nome ?? `Fase ${i + 1}`
              const cls = [
                'pcd-step',
                i < active ? 'pcd-done' : '',
                i === active ? 'pcd-active' : '',
              ].filter(Boolean).join(' ')
              return (
                <button key={i} type="button" className={cls}
                  onClick={() => handleStepClick(i)}
                  disabled={!isAdmin}
                  style={{ cursor: isAdmin ? 'pointer' : 'default' }}>
                  <span className="pcd-step__dot" />
                  <span className="pcd-step__lbl">{lbl}</span>
                </button>
              )
            })}
          </div>

          <div className="pcd-bar">
            <div className="pcd-bar__fill" style={{ width: `${phasePct}%` }} />
          </div>
        </section>

        {/* MINI GRÁFICOS — Pagamentos + Workflow */}
        <section className="pcd-graphs">
          {/* Pagamentos */}
          <Link className="pcd-graph-card pcd-card"
            href={`/portal-media/${projeto.ref}/pagamentos`}>
            <div className="pcd-graph-head">
              <p className="pcd-graph-title">Pagamentos</p>
              <span className="pcd-graph-go">Ver tudo →</span>
            </div>
            <div className="pcd-graph-body">
              <div className="pcd-mini-ring">
                <svg width={88} height={88} viewBox="0 0 88 88">
                  <circle className="pcd-mini-ring__track" cx={44} cy={44} r={RING_R} />
                  <circle className="pcd-mini-ring__fill pcd-color-pay" cx={44} cy={44} r={RING_R}
                    style={{ strokeDasharray: RING_C, strokeDashoffset: ringPayOffset, transition: 'stroke-dashoffset 1.4s cubic-bezier(.3,.1,.2,1)' }} />
                </svg>
                <div className="pcd-mini-ring__num">
                  <span className="pcd-mini-ring__pct">{pctPago}<small>%</small></span>
                  <span className="pcd-mini-ring__cap">Pago</span>
                </div>
              </div>
              <div className="pcd-graph-info">
                <div className="pcd-graph-row">
                  <span className="pcd-graph-row__k">Total</span>
                  <span className="pcd-graph-row__v">{fmtEur(valorTotal)}</span>
                </div>
                <div className="pcd-graph-row">
                  <span className="pcd-graph-row__k">Pago</span>
                  <span className="pcd-graph-row__v"><em>{fmtEur(valorPago)}</em></span>
                </div>
                <div className="pcd-graph-row">
                  <span className="pcd-graph-row__k">Em falta</span>
                  <span className="pcd-graph-row__v"><em className="pending">{fmtEur(valorPendente)}</em></span>
                </div>
              </div>
            </div>
          </Link>

          {/* Workflow snapshot */}
          <Link className="pcd-graph-card pcd-card"
            href={`/portal-media/${projeto.ref}/workflow`}>
            <div className="pcd-graph-head">
              <p className="pcd-graph-title">Workflow</p>
              <span className="pcd-graph-go">Ver tudo →</span>
            </div>
            <div className="pcd-graph-body">
              <div className="pcd-mini-ring">
                <svg width={88} height={88} viewBox="0 0 88 88">
                  <circle className="pcd-mini-ring__track" cx={44} cy={44} r={RING_R} />
                  <circle className="pcd-mini-ring__fill pcd-color-flow" cx={44} cy={44} r={RING_R}
                    style={{ strokeDasharray: RING_C, strokeDashoffset: ringFlowOffset, transition: 'stroke-dashoffset 1.4s cubic-bezier(.3,.1,.2,1) .1s' }} />
                </svg>
                <div className="pcd-mini-ring__num">
                  <span className="pcd-mini-ring__pct">{phasePct}<small>%</small></span>
                  <span className="pcd-mini-ring__cap">Concluído</span>
                </div>
              </div>
              <div className="pcd-graph-info">
                <div className="pcd-graph-row">
                  <span className="pcd-graph-row__k">Fase atual</span>
                  <span className="pcd-graph-row__v" style={{ fontSize: 12, letterSpacing: '.04em' }}>{phaseName}</span>
                </div>
                <div className="pcd-graph-row">
                  <span className="pcd-graph-row__k">Progresso</span>
                  <span className="pcd-graph-row__v">{active + 1} / {totalFases}</span>
                </div>
              </div>
            </div>
            {/* Mini-timeline horizontal */}
            <div className="pcd-mini-tl">
              {Array.from({ length: totalFases }).map((_, i) => (
                <span key={i} style={{ display: 'contents' }}>
                  <span className={
                    'pcd-mini-tl__dot' +
                    (i < active ? ' pcd-done' : '') +
                    (i === active ? ' pcd-doing' : '')
                  } />
                  {i < totalFases - 1 && (
                    <span className={'pcd-mini-tl__seg' + (i < active ? ' pcd-done' : '')} />
                  )}
                </span>
              ))}
            </div>
          </Link>
        </section>

        {/* MENU */}
        <p className="pcd-section-label">Menu</p>
        <nav className="pcd-menu">
          {MENU_ITEMS.map(item => (
            <Link key={item.slug} className="pcd-tile"
              href={`/portal-media/${projeto.ref}/${item.slug}`}>
              <div className="pcd-tile__top">
                <span className="pcd-tile__ic"><MenuIcon name={item.icon} /></span>
                <span className="pcd-tile__num">{item.num}</span>
              </div>
              <p className="pcd-tile__name">{item.name}</p>
              <p className="pcd-tile__desc">{item.desc}</p>
            </Link>
          ))}
        </nav>

        {/* INTERNO — só admin */}
        {isAdmin && (
          <div className="pcd-intern">
            <Link className="pcd-tile pcd-tile--intern"
              href={`/portal-media/${projeto.ref}/reproducao`}>
              <span className="pcd-tag-intern">Interno</span>
              <div className="pcd-tile__top">
                <span className="pcd-tile__ic"><IcFilm /></span>
                <span className="pcd-tile__num">★</span>
              </div>
              <p className="pcd-tile__name">Reprodução</p>
              <p className="pcd-tile__desc">Storytelling · Storyboard · Moodboard</p>
            </Link>
          </div>
        )}

        <p className="pcd-foot">
          © 2026 RL PROD · Portal do Cliente · <a href="#">Ajuda</a> · <a href="#">Contacto</a>
        </p>
      </div>
    </div>
  )
}

/* ============================================================
   ICONS (SVG inline, leves — reaproveitados de portal.js)
   ============================================================ */
function S(children: ReactNode, sw: number = 1.7, w: number = 16) {
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={sw}
      strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  )
}

const IcWave = () => S(<path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1V4.5a1.5 1.5 0 0 1 3 0V10m0-.5V6a1.5 1.5 0 0 1 3 0v6.5c0 3.6-2.4 6.5-6 6.5-2.2 0-3.6-1-4.7-2.6l-2-3a1.5 1.5 0 0 1 2.4-1.8L7 13" />)
const IcEye = () => S(<><path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6S2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.6" /></>)
const IcGrid = () => S(<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>)
const IcHand = () => S(<path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1V4.5a1.5 1.5 0 0 1 3 0V10m0-.5V6a1.5 1.5 0 0 1 3 0v6.5c0 3.6-2.4 6.5-6 6.5-2.2 0-3.6-1-4.7-2.6l-2-3a1.5 1.5 0 0 1 2.4-1.8L7 13" />)
const IcDot = () => (<svg width={7} height={7} viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="currentColor" /></svg>)
const IcCursor = () => S(<path d="M5 3l14 7-6 1.6L9 19 5 3Z" />, 1.7, 14)
const IcFilm = () => S(<><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M3 9h18M3 15h18M8 4v16M16 4v16" /></>, 1.6, 22)

function MenuIcon({ name }: { name: string }) {
  switch (name) {
    case 'workflow': return S(<><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="12" r="2.5" /><path d="M8.4 6.8 15.6 11M8.4 17.2 15.6 13" /></>, 1.6, 22)
    case 'map':      return S(<><path d="M9 4 4 6.5v13l5-2.5 6 2.5 5-2.5v-13L15 6.5 9 4Z" /><path d="M9 4v13M15 6.5v13" /></>, 1.6, 22)
    case 'briefing': return S(<><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M9 8h6M9 12h6M9 16h3" /></>, 1.6, 22)
    case 'doc':      return S(<><path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4h4M9 13h6M9 17h6" /></>, 1.6, 22)
    case 'pay':      return S(<><rect x="3" y="6" width="18" height="12" rx="2.5" /><path d="M3 10h18" /><path d="M7 14.5h3" /></>, 1.6, 22)
    case 'deliver':  return S(<><path d="M3.5 8 12 4l8.5 4-8.5 4-8.5-4Z" /><path d="M3.5 8v8L12 20l8.5-4V8M12 12v8" /></>, 1.6, 22)
    case 'support':  return S(<><path d="M4.5 13a7.5 7.5 0 0 1 15 0" /><rect x="3" y="13" width="3.5" height="6" rx="1.5" /><rect x="17.5" y="13" width="3.5" height="6" rx="1.5" /><path d="M19 19v.5a2.5 2.5 0 0 1-2.5 2.5H12" /></>, 1.6, 22)
    case 'star':     return S(<path d="M12 3.5 14.6 9l6 .7-4.5 4.1 1.3 5.9L12 16.7 6.6 19.7l1.3-5.9L3.4 9.7l6-.7L12 3.5Z" />, 1.6, 22)
    default:         return null
  }
}
