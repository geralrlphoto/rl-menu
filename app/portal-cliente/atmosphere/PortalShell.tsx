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
import './tema-rl.css'
import { refDoEndereco, temTemaRL } from '@/lib/portalTema'

// As fontes tem de ser injectadas em runtime: o Turbopack remove os
// `@import url(...)` dos ficheiros .css no build de producao, por isso o
// import dentro de atmosphere.css nunca chega ao browser. Mesmo padrao
// usado em /adquirir-fotografias.
const ATMOSPHERE_FONTS = `@import url('https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,200;0,300;0,400;0,500;1,200;1,300&family=Hanken+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');`
import {
  ArrowUpRightIcon, CheckIcon, ClockIcon, DocumentIcon, HeartIcon,
  HomeIcon, MailIcon, ShieldIcon, getNavIconFor,
} from './icons'

/* ── Util: lê dias até uma data (ignora horas) ───────────────── */
/* "susana maria silva" → "Susana" */
function primeiroNome(s?: string | null): string {
  const w = String(s ?? '').trim().split(/\s+/)[0] ?? ''
  return w ? w.charAt(0).toLocaleUpperCase('pt-PT') + w.slice(1).toLocaleLowerCase('pt-PT') : ''
}

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
/* Novo design (tema RL) só nos portais em teste, lidos pelo endereço */
export function useTemaRL(): boolean {
  const [on, setOn] = useState(false)
  useEffect(() => {
    setOn(temTemaRL(refDoEndereco(window.location.pathname, window.location.search)))
  }, [])
  return on
}

/* Tema RL: avisos por secção e próximo passo (/api/portal-avisos), partilhados
   pelo menu e pela barra do telemóvel com um só pedido por página */
type AvisoRL = { texto: string; tom: 'alerta' | 'novo' | 'info' }
export type AvisosRL = { avisos: Record<string, AvisoRL>; proximo: { titulo: string; quando?: string; chave: string } | null }
const cacheAvisos = new Map<string, Promise<AvisosRL | null>>()
export function useAvisosRL(on: boolean): AvisosRL | null {
  const [d, setD] = useState<AvisosRL | null>(null)
  useEffect(() => {
    if (!on) return
    const ref = refDoEndereco(window.location.pathname, window.location.search)
    if (!ref) return
    let pedido = cacheAvisos.get(ref)
    if (!pedido) {
      pedido = fetch(`/api/portal-avisos?ref=${encodeURIComponent(ref)}`).then(r => r.ok ? r.json() : null).catch(() => null)
      cacheAvisos.set(ref, pedido)
    }
    let vivo = true
    pedido.then(x => { if (vivo) setD(x) })
    return () => { vivo = false }
  }, [on])
  return d
}

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
  const temaRL = useTemaRL()
  // Botão "Mais" da barra de atalhos do telemóvel (tema RL) abre o menu completo
  useEffect(() => {
    const abrir = () => { setMenuOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }
    window.addEventListener('rl-abrir-menu', abrir)
    return () => window.removeEventListener('rl-abrir-menu', abrir)
  }, [])

  return (
    <div className={`portal-atmosphere${temaRL ? ' tema-rl' : ''}`}>
      <style dangerouslySetInnerHTML={{ __html: ATMOSPHERE_FONTS }} />
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
  const names = [primeiroNome(noiva), primeiroNome(noivo)].filter(Boolean).join(' & ') || lbl
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
  /** Página bloqueada (portal à espera da adjudicação e do contrato assinado) */
  locked?: boolean
}

/* Caixa "Pedimos desculpa, página bloqueada" com o que falta para desbloquear */
export type FaltaBloqueio = { adjudicacao: boolean; contrato: boolean }
export function CaixaBloqueio({ falta, hrefContrato, hrefPagamentos, onClose }: {
  falta: FaltaBloqueio; hrefContrato?: string; hrefPagamentos?: string; onClose?: () => void
}) {
  const linha = (txt: string, sub: string, href?: string) => (
    <li style={{ display: 'flex', gap: 12, alignItems: 'flex-start', textAlign: 'left', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,.08)' }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e46b6b', boxShadow: '0 0 8px #e46b6b', marginTop: 7, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>
        <strong style={{ fontWeight: 500 }}>{txt}</strong>
        <span style={{ display: 'block', opacity: .65, fontSize: 13.5, marginTop: 3 }}>{sub}</span>
      </span>
      {href && <a href={href} style={{ color: 'var(--gold, #d8be93)', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', whiteSpace: 'nowrap', marginTop: 3 }}>Ir →</a>}
    </li>
  )
  return (
    <div style={{ width: '100%', maxWidth: 440, padding: '32px 28px 22px', borderRadius: 18, background: '#0f0d0a', border: '1px solid rgba(255,255,255,.55)', boxShadow: '0 0 22px rgba(255,255,255,.12), 0 30px 80px rgba(0,0,0,.6)', textAlign: 'center', position: 'relative' }}
      role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
      {onClose && <button type="button" onClick={onClose} aria-label="Fechar" style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: 'inherit', opacity: .6, fontSize: 22, cursor: 'pointer' }}>×</button>}
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--gold, #d8be93)' }}>
        <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 30, margin: '12px 0 6px' }}>Pedimos desculpa</h2>
      <p style={{ margin: '0 0 18px', opacity: .8, lineHeight: 1.6 }}>Esta página está bloqueada. Para a desbloquear faltam estes documentos:</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {falta.adjudicacao && linha('Pagamento da adjudicação', 'Registem o pagamento na página Pagamentos.', hrefPagamentos)}
        {falta.contrato && linha('Contrato assinado', 'Assinem o contrato e enviem-no na página Contrato.', hrefContrato)}
      </ul>
    </div>
  )
}

export function SidebarNav({
  label = 'Acesso Rápido',
  items,
  falta,
}: {
  label?: string
  items: SidebarNavItem[]
  /** O que falta para desbloquear (abre a caixa ao tocar numa página bloqueada) */
  falta?: FaltaBloqueio
}) {
  const [caixa, setCaixa] = useState(false)
  const hrefDe = (re: RegExp) => items.find(i => !i.locked && re.test(i.label.toUpperCase()))?.href
  const temaRL = useTemaRL()
  const avisos = useAvisosRL(temaRL)

  if (temaRL) {
    const nome = (l: string) => {
      const u = l.toUpperCase()
      const mapa: Array<[RegExp, string]> = [
        [/CONTRAT/, 'Contrato'], [/PAGAMENT/, 'Pagamentos'], [/SAT/, 'A vossa opinião'], [/CRONOGRAMA/, 'Cronograma'],
        [/PR[ÉE]-WEDDING/, 'Guia pré-wedding'], [/FILME/, 'O nosso filme'], [/FOTOGRAF/, 'Fotografias'],
        [/ATEND/, 'Atendimento'], [/BRIEFING/, 'Briefing'], [/GUIA DOS NOIVOS/, 'Guia dos noivos'], [/IN[ÍI]CIO/, 'Início'],
      ]
      const m = mapa.find(([re]) => re.test(u))
      return m ? m[1] : l.charAt(0).toUpperCase() + l.slice(1).toLowerCase()
    }
    const grupo = (l: string) => {
      const u = l.toUpperCase()
      if (/IN[ÍI]CIO/.test(u)) return 'inicio'
      if (/CONTRAT|PAGAMENT|BRIEFING|PR[ÉE]-WEDDING|CRONOGRAMA/.test(u)) return 'antes'
      if (/FOTOGRAF|FILME|SAT/.test(u)) return 'depois'
      return 'ajuda'
    }
    const avisoDe = (l: string) => {
      const u = l.toUpperCase()
      const k = Object.keys(avisos?.avisos ?? {}).find(k => u.includes(k))
      return k ? avisos!.avisos[k] : null
    }
    const inicio = items.find(i => grupo(i.label) === 'inicio')
    const casa = inicio?.href ?? ''
    const guiaHref = `${casa}${casa.includes('?') ? '&' : '?'}guia=1`
    const cor = (t: string) => t === 'alerta' ? { c: '#fca5a5', b: 'rgba(239,68,68,.45)', bg: 'rgba(239,68,68,.1)' } : { c: '#86efac', b: 'rgba(74,222,128,.4)', bg: 'rgba(74,222,128,.1)' }

    const linha = (it: SidebarNavItem, rotulo?: string) => {
      const aviso = avisoDe(it.label)
      const inner = (
        <>
          {getNavIconFor(it.label)}
          <span style={{ flex: 1, minWidth: 0 }}>{rotulo ?? nome(it.label)}</span>
          {aviso && !it.locked && (
            <span style={{ flexShrink: 0, borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700, letterSpacing: '.04em', color: cor(aviso.tom).c, border: `1px solid ${cor(aviso.tom).b}`, background: cor(aviso.tom).bg }}>{aviso.texto}</span>
          )}
        </>
      )
      if (it.locked) return (
        <button key={it.id} type="button" className="nv" aria-disabled="true" onClick={() => setCaixa(true)} style={{ opacity: .38 }}>
          {inner}
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-label="Bloqueado">
            <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </button>
      )
      return it.href
        ? <a key={it.id} className={`nv${it.active ? ' on' : ''}`} href={it.href}>{inner}</a>
        : <button key={it.id} className={`nv${it.active ? ' on' : ''}`} onClick={it.onClick} type="button">{inner}</button>
    }
    const bloco = (titulo: string, lista: SidebarNavItem[], extra?: ReactNode) => (lista.length || extra) ? (
      <>
        <div className="nav-label">{titulo}</div>
        <nav>{lista.map(i => linha(i))}{extra}</nav>
      </>
    ) : null
    const prox = avisos?.proximo
    const proxHref = prox ? (prox.chave === 'INICIO' ? casa : items.find(i => !i.locked && i.label.toUpperCase().includes(prox.chave))?.href) : undefined
    const atalho = (re: RegExp) => items.find(i => re.test(i.label.toUpperCase()))

    return (
      <>
        {caixa && falta && (
          <div onClick={() => setCaixa(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <CaixaBloqueio falta={falta} hrefContrato={hrefDe(/CONTRATO/)} hrefPagamentos={hrefDe(/PAGAMENTO/)} onClose={() => setCaixa(false)} />
          </div>
        )}
        {inicio && <nav style={{ marginTop: 18 }}>{linha(inicio)}</nav>}
        {bloco('Antes do casamento', items.filter(i => grupo(i.label) === 'antes'))}
        {bloco('Depois do casamento', items.filter(i => grupo(i.label) === 'depois'))}
        {bloco('Ajuda', items.filter(i => grupo(i.label) === 'ajuda'),
          casa ? <a key="__guia__" className="nv" href={guiaHref}>{getNavIconFor('GUIA')}<span>Guia do portal</span></a> : null)}

        {/* Próximo passo (no lugar da contagem, que já está no Início) */}
        {prox && (
          <a href={proxHref || casa || undefined} className="rl-proximo" style={{ display: 'block', marginTop: 22, borderRadius: 18, border: '1px solid rgba(216,190,147,.3)', background: 'rgba(17,17,17,.8)', padding: '14px 16px', boxShadow: '0 0 40px -22px rgba(216,190,147,.6)', color: 'inherit' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 9.5, letterSpacing: '.26em', textTransform: 'uppercase', color: '#d8be93', fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#d8be93', boxShadow: '0 0 8px #d8be93' }} />Próximo passo
            </span>
            <span style={{ display: 'block', marginTop: 8, fontSize: 15, fontWeight: 600, color: '#fff' }}>{prox.titulo}</span>
            {prox.quando && <span style={{ display: 'block', marginTop: 2, fontSize: 12, color: 'rgba(255,255,255,.5)' }}>{prox.quando}</span>}
          </a>
        )}

        {/* Telemóvel: barra fixa com 4 atalhos e "Mais" para o menu completo */}
        <div className="rl-barra">
          {[[/IN[ÍI]CIO/, 'Início'], [/PAGAMENT/, 'Pagamentos'], [/FOTOGRAF/, 'Fotos'], [/FILME/, 'Filme']].map(([re, rot]) => {
            const it = atalho(re as RegExp)
            if (!it) return null
            const a = avisoDe(it.label)
            const conteudo = <>{getNavIconFor(it.label, 20)}<span>{rot as string}</span>{a && !it.locked && <i className={`ponto ${a.tom}`} />}</>
            return it.locked || !it.href
              ? <button key={it.id} type="button" className="b" onClick={() => it.locked ? setCaixa(true) : it.onClick?.()} style={{ opacity: it.locked ? .4 : 1 }}>{conteudo}</button>
              : <a key={it.id} className={`b${it.active ? ' on' : ''}`} href={it.href}>{conteudo}</a>
          })}
          <button type="button" className="b" onClick={() => window.dispatchEvent(new Event('rl-abrir-menu'))}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            <span>Mais</span>
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {caixa && falta && (
        <div onClick={() => setCaixa(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <CaixaBloqueio falta={falta} hrefContrato={hrefDe(/CONTRATO/)} hrefPagamentos={hrefDe(/PAGAMENTO/)} onClose={() => setCaixa(false)} />
        </div>
      )}
      <div className="nav-label">{label}</div>
      <nav>
        {items.map(it => {
          const inner = (
            <>
              {getNavIconFor(it.label)}
              <span>{it.label}</span>
            </>
          )
          if (it.locked) return (
            <button key={it.id} type="button" className="nv" aria-disabled="true"
              onClick={() => setCaixa(true)}
              style={{ opacity: .38 }}>
              {inner}
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0 }} aria-label="Bloqueado">
                <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            </button>
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
  const temaRL = useTemaRL()
  useEffect(() => {
    setParts(diffParts(weddingDate))
    const id = setInterval(() => setParts(diffParts(weddingDate)), 60_000)
    return () => clearInterval(id)
  }, [weddingDate])
  if (temaRL) return null // tema RL: o "Próximo passo" do menu substitui a contagem
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

  // Na página inicial só o primeiro nome (o formulário do contrato guarda o nome completo)
  const a = primeiroNome(noiva)
  const b = primeiroNome(noivo)
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
export type DeliveryState = 'ok' | 'wait' | 'info' | 'done' | 'select' | 'edit' | 'review' | 'final'
const STATE_LABEL: Record<DeliveryState, string> = {
  ok:     'Entregue',
  wait:   'Aguarda',
  info:   'Aprovado',
  done:   'Concluído',
  select: 'Em Seleção',
  edit:   'Em Edição',
  review: 'Em Revisão',
  final:  'Finalizado',
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
