'use client'

/* ============================================================
   PortalShell — direção "Atmosphère + Atelier"
   Shell + componentes reutilizáveis:
     - PortalShell (grid sidebar + main)
     - Sidebar (brand, couple, nav, mini countdown)
     - Countdown (cband, h/m/s ticker + dias)
     - Welcome (foto + texto editorial)
     - Gallery (grid cinematográfico)
     - DeliveriesGrid + DeliveryCard
     - TasksEmpty
     - FeatureGrid (4-col)
     - ExploreCards (3-col)
     - Footer
     - AtmButton

   Apenas apresentação. Lógica/dados continuam nas páginas que
   compõem estes componentes.
   ============================================================ */

import { useEffect, useRef, useState, type ReactNode } from 'react'
import './atmosphere.css'
import {
  ArrowUpRightIcon, CheckIcon, ClockIcon, DocumentIcon, HeartIcon,
  HomeIcon, MailIcon, ShieldIcon, getNavIconFor,
} from './icons'

/* ── Util: lê dias até uma data (ignora horas) ───────────────── */
function diffParts(target: Date | null) {
  if (!target) return { d: 0, h: 0, m: 0, s: 0, totalDays: 0, past: false }
  const now = new Date()
  const ms = target.getTime() - now.getTime()
  if (ms < 0) return { d: 0, h: 0, m: 0, s: 0, totalDays: 0, past: true }
  const day = 86400000
  const d = Math.floor(ms / day)
  const h = Math.floor((ms % day) / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return { d, h, m, s, totalDays: d, past: false }
}

/* ============================================================
   PortalShell
   ============================================================ */
export function PortalShell({
  sidebar,
  children,
  headerRight,
}: {
  sidebar: ReactNode
  children: ReactNode
  headerRight?: ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="portal-atmosphere">
      <div className="grain" />
      <div className="shell">
        <aside className={`sidebar${menuOpen ? ' open' : ''}`}>
          <div className="brand">
            <img src="/portal-noivos/mono-gold.png" alt="" />
            <div className="wm">
              RL Photo Video
              <small>WEDDING MOMENTS</small>
            </div>
            {headerRight}
            <button
              className="menu-toggle"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Abrir menu"
            >
              ☰ Menu
            </button>
          </div>
          {sidebar}
        </aside>
        <main className="main">{children}</main>
      </div>
    </div>
  )
}

/* ============================================================
   Sidebar — Couple + Nav + MiniCountdown
   ============================================================ */
export function SidebarCouple({
  noiva, noivo, data, coupleLabel, fotoUrl,
}: {
  noiva?: string | null
  noivo?: string | null
  data?: string | null
  coupleLabel?: string  // default 'Os Noivos'; em batizado: 'Os Pais'
  fotoUrl?: string | null
}) {
  const lbl = coupleLabel ?? 'Os Noivos'
  const names = [noiva, noivo].filter(Boolean).join(' & ') || lbl
  const inicial = (noiva || noivo || lbl).trim().charAt(0).toUpperCase()
  return (
    <div className="couple">
      <div className="couple-foto" aria-hidden>
        {fotoUrl ? <img src={fotoUrl} alt="" /> : <span>{inicial}</span>}
      </div>
      <div className="lbl">{lbl}</div>
      <div className="names">{names}</div>
      {data && <div className="date">{data}</div>}
    </div>
  )
}

export type SidebarNavItem = {
  id: string
  label: string
  active?: boolean
  onClick?: () => void
  href?: string
}

export function SidebarNav({
  label = 'Acesso Rápido',
  items,
}: {
  label?: string
  items: SidebarNavItem[]
}) {
  return (
    <>
      <div className="nav-label">{label}</div>
      <nav>
        {items.map(it => {
          const inner = (
            <>
              {getNavIconFor(it.label)}
              <span>{it.label}</span>
            </>
          )
          return it.href ? (
            <a key={it.id} className={`nv${it.active ? ' on' : ''}`} href={it.href}>
              {inner}
            </a>
          ) : (
            <button
              key={it.id}
              className={`nv${it.active ? ' on' : ''}`}
              onClick={it.onClick}
              type="button"
            >
              {inner}
            </button>
          )
        })}
      </nav>
    </>
  )
}

export function SidebarMiniCountdown({
  weddingDate,
  coupleCode,
  coupleLabel,  // (mantido para futura customização do texto "para o grande dia")
}: {
  weddingDate: Date | null
  coupleCode?: string | null
  coupleLabel?: string
}) {
  const [parts, setParts] = useState(() => diffParts(weddingDate))
  useEffect(() => {
    setParts(diffParts(weddingDate))
    const id = setInterval(() => setParts(diffParts(weddingDate)), 60_000)
    return () => clearInterval(id)
  }, [weddingDate])
  return (
    <div className="mini">
      <div className="c">
        <div className="l">Faltam</div>
        <div className="big">{String(parts.totalDays).padStart(2, '0')}</div>
        <div className="sub">dias para o grande dia</div>
      </div>
      {coupleCode && (
        <div className="code">
          <span className="dot" />
          {coupleCode}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Countdown band (cband)
   ============================================================ */
export function Countdown({
  weddingDate,
  noiva, noivo, dateLabel, coupleLabel,
}: {
  weddingDate: Date | null
  noiva?: string | null
  noivo?: string | null
  dateLabel?: string | null
  coupleLabel?: string  // default 'Os Noivos'; em batizado: 'Os Pais'
}) {
  const [parts, setParts] = useState(() => diffParts(weddingDate))
  useEffect(() => {
    setParts(diffParts(weddingDate))
    const id = setInterval(() => setParts(diffParts(weddingDate)), 1000)
    return () => clearInterval(id)
  }, [weddingDate])

  const a = noiva ?? ''
  const b = noivo ?? ''
  const showAmp = a && b

  return (
    <section className="cband">
      <div className="eyebrow">Contagem Regressiva</div>
      <h1 className="names">
        {a}
        {showAmp && <> <em>&amp;</em> </>}
        {b}
        {!a && !b && (coupleLabel ?? 'Os Noivos')}
      </h1>
      {dateLabel && <div className="date">{dateLabel}</div>}
      <div className="hcount">
        <div>
          <div className="num">{String(parts.d).padStart(2, '0')}</div>
          <div className="lbl">Dias</div>
        </div>
        <div>
          <div className="num">{String(parts.h).padStart(2, '0')}</div>
          <div className="lbl">Horas</div>
        </div>
        <div>
          <div className="num">{String(parts.m).padStart(2, '0')}</div>
          <div className="lbl">Min</div>
        </div>
        <div>
          <div className="num">{String(parts.s).padStart(2, '0')}</div>
          <div className="lbl">Seg</div>
        </div>
      </div>
    </section>
  )
}

/* ============================================================
   Welcome — foto + texto editorial
   ============================================================ */
export function Welcome({
  photoUrl,
  heading,
  paragraphs,
  pull,
  actions,
}: {
  photoUrl?: string | null
  heading?: string
  paragraphs?: string[]
  pull?: string
  actions?: ReactNode
}) {
  return (
    <section className="welcome">
      <div className="photo">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" />
        ) : (
          <div className="ph" style={{ height: '100%', width: '100%' }} data-label="Foto · Noivos" />
        )}
      </div>
      <div>
        <div className="eyebrow">Bem-vindos</div>
        {heading && (
          <h1
            // permite incluir <em> no heading
            dangerouslySetInnerHTML={{ __html: heading }}
          />
        )}
        {(paragraphs ?? []).map((p, i) => <p key={i}>{p}</p>)}
        {pull && <div className="pull">{pull}</div>}
        {actions && <div className="actions">{actions}</div>}
      </div>
    </section>
  )
}

/* ============================================================
   Gallery — grid cinematográfico
   ============================================================ */
export function Gallery({
  title = 'Momentos selecionados',
  subtitle,
  images,
}: {
  title?: string
  subtitle?: string
  images: Array<string | null | undefined>
}) {
  // 1 grande + 2 pequenas = 3 frames; se houver 4ª, vai para o slot grande como fallback
  const main  = images[0] ?? null
  const top   = images[1] ?? null
  const bot   = images[2] ?? null
  return (
    <>
      <div className="cine-head">
        <div>
          <div className="eyebrow">Galeria</div>
          <h2>{title}</h2>
        </div>
        {subtitle && <p className="sub">{subtitle}</p>}
      </div>
      <div className="cine">
        <div className="frame big">
          {main ? <img src={main} alt="" /> : <div className="ph" style={{ width: '100%', height: '100%' }} data-label="Foto · Principal" />}
        </div>
        <div className="frame">
          {top ? <img src={top} alt="" /> : <div className="ph" style={{ width: '100%', height: '100%' }} data-label="Foto" />}
        </div>
        <div className="frame">
          {bot ? <img src={bot} alt="" /> : <div className="ph" style={{ width: '100%', height: '100%' }} data-label="Foto" />}
        </div>
      </div>
    </>
  )
}

/* ============================================================
   Deliveries
   ============================================================ */
export type DeliveryState = 'ok' | 'wait' | 'info' | 'done' | 'select'
const STATE_LABEL: Record<DeliveryState, string> = {
  ok:     'Entregue',
  wait:   'Aguarda',
  info:   'Aprovado',
  done:   'Concluído',
  select: 'Em Seleção',
}

export function DeliveryCard({
  roman,
  title,
  meta,
  state,
  when,
}: {
  roman: string
  title: string
  meta?: string
  state: DeliveryState
  when?: string
}) {
  return (
    <article className={`dcard ${state}`}>
      <div className="roman">{roman}</div>
      <h3>{title}</h3>
      {meta && <div className="meta">{meta}</div>}
      <div className="foot">
        <span className={`atm-status ${state}`}>
          <span className="pip" />
          {STATE_LABEL[state]}
        </span>
        {when && <span className="when">{when}</span>}
      </div>
    </article>
  )
}

export function DeliveriesGrid({ children }: { children: ReactNode }) {
  return <div className="dcards">{children}</div>
}

export function TasksEmpty({
  label = 'Gestão de Tarefas',
  message = 'Sem tarefas pendentes — tudo em dia.',
}: {
  label?: string
  message?: string
}) {
  return (
    <div className="tasks">
      <span className="icon"><CheckIcon size={18} /></span>
      <div>
        <div className="lbl">{label}</div>
        <div className="msg">{message}</div>
      </div>
    </div>
  )
}

/* ============================================================
   Feature grid (.feat4) — "Como vos acompanhamos"
   ============================================================ */
export type FeatureItem = { icon: ReactNode; text: string }

export function FeatureGrid({
  title = 'Como vos acompanhamos',
  items,
}: {
  title?: string
  items: FeatureItem[]
}) {
  return (
    <>
      <div className="feat-head">
        <div className="eyebrow">Atelier</div>
        <h2>{title}</h2>
      </div>
      <div className="feat4">
        {items.map((it, i) => (
          <div key={i} className="f">
            <span className="ico">{it.icon}</span>
            <p>{it.text}</p>
          </div>
        ))}
      </div>
    </>
  )
}

/** 4 features default — pode-se sobrepor passando `items` */
export const DEFAULT_FEATURES: FeatureItem[] = [
  { icon: <HeartIcon  size={24} />, text: 'Acompanhamento de todo o processo' },
  { icon: <ClockIcon  size={24} />, text: 'Prazos e entregas organizados' },
  { icon: <MailIcon   size={24} />, text: 'Comunicação transparente' },
  { icon: <DocumentIcon size={24} />, text: 'Acesso rápido a documentos' },
]

/* ============================================================
   Explore cards (.cards) — 6 cartões de sub-páginas
   ============================================================ */
export type ExploreItem = {
  id: string
  title: string
  onClick?: () => void
  href?: string
}

export function ExploreCards({
  title = 'O que encontram aqui',
  items,
}: {
  title?: string
  items: ExploreItem[]
}) {
  return (
    <>
      <div className="cards-head">
        <div className="eyebrow">Atalhos</div>
        <h2>{title}</h2>
      </div>
      <div className="cards-grid">
        {items.map(it => {
          const content = (
            <>
              <span className="ico">{getNavIconFor(it.title, 22)}</span>
              <h3>{it.title}</h3>
              <div className="more">Ver detalhe →</div>
            </>
          )
          return it.href ? (
            <a key={it.id} className="card-item" href={it.href}>{content}</a>
          ) : (
            <button key={it.id} className="card-item" onClick={it.onClick} type="button">
              {content}
            </button>
          )
        })}
      </div>
    </>
  )
}

/* ============================================================
   Footer
   ============================================================ */
export function Footer({
  message = 'Mal podemos esperar pelo vosso grande dia',
  signature = 'RL PHOTO VIDEO · WEDDING MOMENTS',
}: {
  message?: string
  signature?: string
}) {
  return (
    <footer className="foot">
      <img src="/portal-noivos/logo-gold.png" alt="RL Photo Video" />
      <div className="msg">{message}</div>
      <div className="sig">{signature}</div>
    </footer>
  )
}

/* ============================================================
   Button helper
   ============================================================ */
export function AtmButton({
  children, solid, onClick, href, target, icon,
  type = 'button',
}: {
  children: ReactNode
  solid?: boolean
  onClick?: () => void
  href?: string
  target?: string
  icon?: ReactNode
  type?: 'button' | 'submit'
}) {
  const cls = `atm-btn${solid ? ' solid' : ''}`
  const inner = (
    <>
      {children}
      {icon ?? <ArrowUpRightIcon size={14} />}
    </>
  )
  if (href) {
    return (
      <a className={cls} href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined}>
        {inner}
      </a>
    )
  }
  return (
    <button type={type} className={cls} onClick={onClick}>
      {inner}
    </button>
  )
}
