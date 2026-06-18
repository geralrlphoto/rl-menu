'use client'

/* ============================================================
   AtmospherePortal — view home do portal de noivos no estilo
   "Atmosphère + Atelier". Toma os mesmos dados que a página
   actual já tem (settings, blocks, etc.) e renderiza no novo
   layout. Não muda lógica de negócio.
   ============================================================ */

import { type ReactNode, useState, useEffect } from 'react'
import {
  PortalShell, SidebarCouple, SidebarNav, SidebarMiniCountdown,
  Countdown, Welcome, Gallery, DeliveriesGrid, DeliveryCard,
  TasksEmpty, FeatureGrid, ExploreCards, Footer, AtmButton,
  DEFAULT_FEATURES,
  type SidebarNavItem, type ExploreItem, type DeliveryState,
} from './PortalShell'
import { ArrowUpRightIcon, MailIcon } from './icons'

export type PortalTipo = 'casamento' | 'batizado'

export type AtmosphereData = {
  /** Tipo de portal — controla labels (Os Noivos vs Os Pais), filtros de
   *  sub-páginas e defaults. Default 'casamento' para compatibilidade. */
  tipo?: PortalTipo
  /** Label do casal/pais (default conforme tipo). Override raro. */
  coupleLabel?: string

  // identidade do casal/pais
  noiva?: string | null            // batizado: mãe
  noivo?: string | null            // batizado: pai
  dataIso?: string | null         // ex: '2026-09-12' (YYYY-MM-DD)
  dataLabel?: string | null       // ex: '12 · Setembro · 2026'
  referencia?: string | null      // ex: 'CAS_150_26_RL' / 'BAT_001_26_RL'

  // hero / welcome
  heroImageUrl?: string | null
  welcomeHeading?: string | null     // pode conter <em>
  welcomeParagraphs?: string[]
  welcomePull?: string | null

  // galeria
  galleryUrls?: Array<string | null | undefined>

  // sub-páginas (do Notion ou hard-coded)
  subPages: Array<{ id: string; title: string }>
  hiddenNav?: string[]
  activeNavId?: string | null
  /**
   * Overrides de título por página (admin renomeou): `pageTitles[id] = 'novo'`.
   * Se ausente usa o título original.
   */
  pageTitles?: Record<string, string>
  /**
   * Builder do URL para uma sub-página. Recebe (pageId, displayTitle) e
   * devolve o href absoluto. Default: '/portal-cliente/<id>?title=<t>&portalRef=<ref>'.
   * Quando há `portalRefForLinks`, esse é o `<ref>` no fallback.
   */
  buildSubpageHref?: (pageId: string, displayTitle: string) => string
  /** Referência para o ?portalRef= no link default (necessário em /ref/<REF>) */
  portalRefForLinks?: string | null

  // entregas — se não passar usa default ilustrativo
  deliveries?: Array<{
    roman: string
    title: string
    meta?: string
    state: DeliveryState
    when?: string
  }>

  // notificações enviadas pelo admin para os noivos/pais
  noivosNotifications?: Array<{ id: string; titulo: string; texto: string; ts: string }>

  // tarefas (apenas para detectar empty state)
  hasTasks?: boolean
  tasksMessage?: string

  // botões do hero do Welcome
  primaryAction?: { label: string; onClick?: () => void; href?: string }
  secondaryAction?: { label: string; onClick?: () => void; href?: string }
}

export type AtmosphereCallbacks = {
  /** Chamado quando se clica numa nav item sem href (fallback). */
  onSelectSubpage?: (id: string) => void
}

const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

/** Default real: tudo em "Aguarda" — usado quando settings não tem
 *  estado nenhum gravado. Não mostra mocks fakes. */
const DEFAULT_DELIVERIES: NonNullable<AtmosphereData['deliveries']> = [
  { roman: 'I',   title: 'Seleção de Fotos', meta: 'Prazo · 30 dias',           state: 'wait' },
  { roman: 'II',  title: 'Entrega do Vídeo', meta: 'Prazo · 180 dias úteis',    state: 'wait' },
  { roman: 'III', title: 'Fotos para Edição', meta: 'Em curso no atelier',       state: 'wait' },
  { roman: 'IV',  title: 'Álbum',            meta: 'Em aprovação',               state: 'wait' },
  { roman: 'V',   title: 'Seleção · Acordos', meta: 'Galeria privada partilhada', state: 'wait' },
]

/** Mapeia um estado humano gravado em settings (vindo do Notion/admin)
 *  para o DeliveryState do design Atmosphère. */
function mapEstadoToDeliveryState(s: string | null | undefined): import('./PortalShell').DeliveryState {
  const v = String(s ?? '').trim().toLowerCase()
  if (v.startsWith('em sele')) return 'select'
  if (!v || v === 'aguardar' || v === 'aguarda' || v.startsWith('em edi')) return 'wait'
  if (v === 'entregue') return 'ok'
  if (v.startsWith('aprov') || v.startsWith('em aprov')) return 'info'
  if (v.startsWith('conclu') || v === 'selecionadas' || v === 'editadas') return 'done'
  return 'wait'
}

/** Constrói o array de deliveries a partir do settings do portal.
 *  Lê: sel_fotos_estado, video_estado, fotos_edicao_estado,
 *  album_estado, selecao_noivos_estado. Em falta → "wait". */
export function buildDeliveriesFromSettings(settings: Record<string, any> | null | undefined): NonNullable<AtmosphereData['deliveries']> {
  const s = settings ?? {}
  return [
    { roman: 'I',   title: 'Seleção de Fotos',  meta: 'Prazo · 30 dias',           state: mapEstadoToDeliveryState(s.sel_fotos_estado) },
    { roman: 'II',  title: 'Entrega do Vídeo',  meta: 'Prazo · 180 dias úteis',    state: mapEstadoToDeliveryState(s.video_estado) },
    { roman: 'III', title: 'Fotos para Edição', meta: 'Em curso no atelier',       state: mapEstadoToDeliveryState(s.fotos_edicao_estado) },
    { roman: 'IV',  title: 'Álbum',             meta: 'Em aprovação',              state: mapEstadoToDeliveryState(s.album_estado) },
    { roman: 'V',   title: 'Seleção · Acordos', meta: 'Galeria privada partilhada', state: mapEstadoToDeliveryState(s.selecao_noivos_estado) },
  ]
}

/** Sino de notificações dos noivos — estilo card premium (gold/dark).
 *  Mostra as notificações enviadas pelo admin. "Lidas" guardadas em
 *  localStorage por referência do portal. */
function NoivosNotificationsBell({
  notifs,
  refKey,
}: {
  notifs: Array<{ id: string; titulo: string; texto: string; ts: string }>
  refKey: string
}) {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState<Set<string>>(new Set())
  const [deleted, setDeleted] = useState<Set<string>>(new Set())
  const LS = `noivos_notif_seen_${refKey}`
  const LS_DEL = `noivos_notif_deleted_${refKey}`

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS)
      if (raw) setSeen(new Set(JSON.parse(raw)))
      const rawDel = localStorage.getItem(LS_DEL)
      if (rawDel) setDeleted(new Set(JSON.parse(rawDel)))
    } catch { /* ignore */ }
  }, [LS, LS_DEL])

  // Só conta as que não foram apagadas localmente pelos noivos.
  const ordered = [...notifs]
    .filter(n => !deleted.has(n.id))
    .sort((a, b) => (b.ts || '').localeCompare(a.ts || ''))
  const unread = ordered.filter(n => !seen.has(n.id)).length

  function markAllSeen() {
    const next = new Set([...seen, ...ordered.map(n => n.id)])
    setSeen(next)
    try { localStorage.setItem(LS, JSON.stringify(Array.from(next))) } catch { /* ignore */ }
  }

  // Apagar só no portal (localStorage) — não mexe na ficha/admin.
  function apagar(id: string) {
    const next = new Set(deleted); next.add(id)
    setDeleted(next)
    try { localStorage.setItem(LS_DEL, JSON.stringify(Array.from(next))) } catch { /* ignore */ }
  }

  function toggle() {
    const willOpen = !open
    setOpen(willOpen)
    if (willOpen) markAllSeen()
  }

  // Se já não há notificações visíveis, o sino desaparece.
  if (ordered.length === 0) return null

  const fmtData = (ts: string) => {
    try { return new Date(ts).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) }
    catch { return '' }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', marginLeft: 'auto', zIndex: 60 }}>
      <style>{`
        @keyframes noivosBellGlow {
          0%, 100% { box-shadow: 0 8px 24px -6px rgba(0,0,0,0.6), 0 0 10px -4px rgba(201,164,92,0.45); border-color: rgba(201,164,92,0.45); }
          50%      { box-shadow: 0 8px 24px -6px rgba(0,0,0,0.6), 0 0 28px 3px rgba(201,164,92,0.9);  border-color: rgba(232,199,109,0.95); }
        }
        .noivos-bell-glow { animation: noivosBellGlow 1.7s ease-in-out infinite; }
      `}</style>
      {/* Botão sino */}
      <button
        onClick={toggle}
        aria-label="Notificações"
        className={unread > 0 ? 'noivos-bell-glow' : ''}
        style={{
          position: 'relative', width: 46, height: 46, borderRadius: 14,
          border: '1px solid rgba(201,164,92,0.45)',
          background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(15,12,8,0.92))',
          boxShadow: '0 8px 24px -6px rgba(0,0,0,0.6), 0 0 18px -6px rgba(201,164,92,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d9b25e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -6, right: -6, minWidth: 18, height: 18, padding: '0 5px',
            borderRadius: 9, background: '#c9a45c', color: '#1a1306', fontSize: 11, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.25)',
          }}>{unread}</span>
        )}
      </button>

      {/* Painel */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 59 }} />
          <div style={{
            position: 'fixed', top: 84, left: 16, zIndex: 61, width: 'min(340px, calc(100vw - 32px))', maxHeight: '70vh', overflowY: 'auto',
            borderRadius: 18, border: '1px solid rgba(201,164,92,0.35)',
            background: 'linear-gradient(180deg, rgba(20,16,10,0.98), rgba(10,8,5,0.98))',
            boxShadow: '0 30px 60px -20px rgba(0,0,0,0.8), 0 0 24px -8px rgba(201,164,92,0.35)',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{
              padding: '14px 16px', borderBottom: '1px solid rgba(201,164,92,0.18)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 9, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(201,164,92,0.8)', fontWeight: 700 }}>
                Notificações
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {ordered.map(n => (
                <div key={n.id} style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d9b25e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#f2e6cf', fontFamily: 'Cormorant Garamond, Georgia, serif', flex: 1 }}>{n.titulo}</span>
                    <button
                      onClick={() => apagar(n.id)}
                      aria-label="Apagar notificação"
                      title="Apagar"
                      style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
                        color: 'rgba(255,255,255,0.4)', fontSize: 11, cursor: 'pointer', lineHeight: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >✕</button>
                  </div>
                  <p style={{ fontSize: 12.5, lineHeight: 1.55, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{n.texto}</p>
                  {n.ts && <p style={{ fontSize: 10, color: 'rgba(201,164,92,0.55)', marginTop: 6, letterSpacing: '0.05em' }}>{fmtData(n.ts)}</p>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function AtmospherePortal({
  data,
  callbacks,
  adminBar,
  children, // conteúdo extra (ex: sub-página activa) renderizado entre Welcome e Gallery
}: {
  data: AtmosphereData
  callbacks: AtmosphereCallbacks
  adminBar?: ReactNode
  children?: ReactNode
}) {
  const tipo: PortalTipo = data.tipo ?? 'casamento'
  const isBatizado = tipo === 'batizado'
  const portalBase = isBatizado ? '/portal-batizado' : '/portal-cliente'
  const coupleLabel = data.coupleLabel ?? (isBatizado ? 'Os Pais' : 'Os Noivos')
  const weddingDate = data.dataIso ? parseIsoDate(data.dataIso) : null

  // Builder de href para sub-página: usa custom, ou builder default
  const defaultHrefBuilder = (id: string, title: string) => {
    const ref = data.portalRefForLinks
    const qs = new URLSearchParams()
    qs.set('title', title)
    if (ref) qs.set('portalRef', ref)
    return `${portalBase}/${id}?${qs.toString()}`
  }
  const hrefFor = (id: string, title: string) =>
    data.buildSubpageHref ? data.buildSubpageHref(id, title) : defaultHrefBuilder(id, title)

  const titleFor = (p: { id: string; title: string }) =>
    (data.pageTitles?.[p.id] ?? p.title).replace(/\s*\(\d+\)\s*$/, '')

  // Ocultar "Guia dos Noivos/Pais" da nav (mantém só Guia Pré-Wedding)
  const isHiddenByTitle = (p: { id: string; title: string }) => {
    const t = (titleFor(p) || '').toUpperCase()
    if (isBatizado) {
      // Em batizado, esconde Pré-Wedding (não existe) e Guia Pré-Wedding
      return t.includes('GUIA DOS NOIVOS') || t.includes('PRÉ-WEDDING') || t.includes('PRE-WEDDING') || t.includes('GUIA DOS PAIS')
    }
    return t.includes('GUIA DOS NOIVOS')
  }

  // Item "Início" no topo da nav — leva à home do portal
  const homeHref = data.portalRefForLinks
    ? `${portalBase}/ref/${encodeURIComponent(data.portalRefForLinks)}`
    : portalBase
  const inicioItem: SidebarNavItem = {
    id: '__inicio__',
    label: 'Início',
    href: homeHref,
    // Activo quando não há activeNavId (estamos na home)
    active: !data.activeNavId,
  }

  // Sidebar nav — sub-páginas filtradas por hiddenNav, com href real
  const navItems: SidebarNavItem[] = [inicioItem, ...data.subPages
    .filter(p => !(data.hiddenNav ?? []).includes(p.id))
    .filter(p => !isHiddenByTitle(p))
    .map(p => {
      const t = titleFor(p)
      return {
        id: p.id,
        label: t,
        active: data.activeNavId === p.id,
        href: hrefFor(p.id, t),
        onClick: callbacks.onSelectSubpage ? () => callbacks.onSelectSubpage?.(p.id) : undefined,
      }
    })]

  const exploreItems: ExploreItem[] = data.subPages
    .filter(p => !(data.hiddenNav ?? []).includes(p.id))
    .filter(p => !isHiddenByTitle(p))
    .slice(0, 6)
    .map(p => {
      const t = titleFor(p)
      return {
        id: p.id,
        title: t,
        href: hrefFor(p.id, t),
        onClick: callbacks.onSelectSubpage ? () => callbacks.onSelectSubpage?.(p.id) : undefined,
      }
    })

  const deliveries = data.deliveries ?? DEFAULT_DELIVERIES

  const defaultParagraphs = isBatizado
    ? [
        'Este é o vosso espaço dedicado. Aqui podem acompanhar todas as etapas do batizado, desde a sessão fotográfica até à entrega final das memórias.',
        'Cada secção foi pensada para vos manter informados e tornar o processo claro e tranquilo.',
      ]
    : [
        'Este é o vosso espaço dedicado. Aqui podem acompanhar todas as etapas do vosso casamento, desde a sessão pré-wedding até à entrega final das memórias.',
        'Cada secção foi pensada para vos manter informados e tornar o processo claro e tranquilo.',
      ]
  const defaultPull = isBatizado
    ? 'O dia do batizado, contado com tempo e detalhe.'
    : 'A vossa história, contada com tempo e detalhe.'

  const sidebar = (
    <>
      <SidebarCouple noiva={data.noiva} noivo={data.noivo} data={data.dataLabel} coupleLabel={coupleLabel} />
      <SidebarNav items={navItems} />
      <SidebarMiniCountdown weddingDate={weddingDate} coupleCode={data.referencia} coupleLabel={coupleLabel} />
    </>
  )

  return (
    <PortalShell
      sidebar={sidebar}
      headerRight={
        <NoivosNotificationsBell
          notifs={data.noivosNotifications ?? []}
          refKey={data.referencia ?? data.portalRefForLinks ?? 'portal'}
        />
      }
    >
      {adminBar}

      <Countdown
        weddingDate={weddingDate}
        noiva={data.noiva}
        noivo={data.noivo}
        dateLabel={data.dataLabel}
        coupleLabel={coupleLabel}
      />

      <Welcome
        photoUrl={data.heroImageUrl}
        heading={data.welcomeHeading ?? 'Bem-vindos ao <em>vosso</em> portal'}
        paragraphs={data.welcomeParagraphs ?? defaultParagraphs}
        pull={data.welcomePull ?? defaultPull}
        actions={
          <>
            {data.primaryAction && (
              <AtmButton solid {...actionProps(data.primaryAction)}>
                {data.primaryAction.label}
              </AtmButton>
            )}
            {data.secondaryAction && (
              <AtmButton {...actionProps(data.secondaryAction)}>
                {data.secondaryAction.label}
              </AtmButton>
            )}
          </>
        }
      />

      {children /* sub-página activa renderiza-se aqui */}

      <Gallery
        title="Momentos selecionados"
        subtitle="Pequena selecção do trabalho recente do estúdio — para vos inspirar."
        images={(data.galleryUrls ?? []).slice(0, 3)}
      />

      <DeliveriesGrid>
        {deliveries.map((d, i) => (
          <DeliveryCard
            key={i}
            roman={d.roman || ROMANS[i] || '—'}
            title={d.title}
            meta={d.meta}
            state={d.state}
            when={d.when}
          />
        ))}
        <TasksEmpty
          message={
            data.hasTasks
              ? (data.tasksMessage ?? 'Tarefas em curso — verifiquem a área de tarefas.')
              : 'Sem tarefas pendentes — tudo em dia.'
          }
        />
      </DeliveriesGrid>

      <FeatureGrid items={DEFAULT_FEATURES} />

      <ExploreCards items={exploreItems} />

      <Footer />
    </PortalShell>
  )
}

/* ── helpers ─────────────────────────────────────────────────── */
function parseIsoDate(iso: string): Date | null {
  // aceita YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ss
  try {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!m) return null
    const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3])
    return new Date(y, mo, d, 12, 0, 0)
  } catch { return null }
}

function actionProps(a: { onClick?: () => void; href?: string }) {
  return {
    onClick: a.onClick,
    href: a.href,
    target: a.href?.startsWith('http') ? '_blank' : undefined,
  }
}
