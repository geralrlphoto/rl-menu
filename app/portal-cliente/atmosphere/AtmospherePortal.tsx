'use client'

/* ============================================================
   AtmospherePortal — view home do portal de noivos no estilo
   "Atmosphère + Atelier". Toma os mesmos dados que a página
   actual já tem (settings, blocks, etc.) e renderiza no novo
   layout. Não muda lógica de negócio.
   ============================================================ */

import { type ReactNode } from 'react'
import {
  PortalShell, SidebarCouple, SidebarNav, SidebarMiniCountdown,
  Countdown, Welcome, Gallery, DeliveriesGrid, DeliveryCard,
  TasksEmpty, FeatureGrid, ExploreCards, Footer, AtmButton,
  DEFAULT_FEATURES,
  type SidebarNavItem, type ExploreItem, type DeliveryState,
} from './PortalShell'
import { ArrowUpRightIcon, MailIcon } from './icons'

export type AtmosphereData = {
  // identidade do casal
  noiva?: string | null
  noivo?: string | null
  dataIso?: string | null         // ex: '2026-09-12' (YYYY-MM-DD)
  dataLabel?: string | null       // ex: '12 · Setembro · 2026'
  referencia?: string | null      // ex: 'CAS_150_26_RL' — usado para hrefs

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
  if (!v || v === 'aguardar' || v === 'aguarda' || v.startsWith('em ediç') || v.startsWith('em selec')) return 'wait'
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
  const weddingDate = data.dataIso ? parseIsoDate(data.dataIso) : null

  // Builder de href para sub-página: usa custom, ou builder default
  const defaultHrefBuilder = (id: string, title: string) => {
    const ref = data.portalRefForLinks
    const qs = new URLSearchParams()
    qs.set('title', title)
    if (ref) qs.set('portalRef', ref)
    return `/portal-cliente/${id}?${qs.toString()}`
  }
  const hrefFor = (id: string, title: string) =>
    data.buildSubpageHref ? data.buildSubpageHref(id, title) : defaultHrefBuilder(id, title)

  const titleFor = (p: { id: string; title: string }) =>
    (data.pageTitles?.[p.id] ?? p.title).replace(/\s*\(\d+\)\s*$/, '')

  // Ocultar "Guia dos Noivos" da nav (mantém só Guia Pré-Wedding)
  const isHiddenByTitle = (p: { id: string; title: string }) => {
    const t = (titleFor(p) || '').toUpperCase()
    return t.includes('GUIA DOS NOIVOS')
  }

  // Item "Início" no topo da nav — leva à home do portal
  const homeHref = data.portalRefForLinks
    ? `/portal-cliente/ref/${encodeURIComponent(data.portalRefForLinks)}`
    : '/portal-cliente'
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

  const sidebar = (
    <>
      <SidebarCouple noiva={data.noiva} noivo={data.noivo} data={data.dataLabel} />
      <SidebarNav items={navItems} />
      <SidebarMiniCountdown weddingDate={weddingDate} coupleCode={data.referencia} />
    </>
  )

  return (
    <PortalShell sidebar={sidebar}>
      {adminBar}

      <Countdown
        weddingDate={weddingDate}
        noiva={data.noiva}
        noivo={data.noivo}
        dateLabel={data.dataLabel}
      />

      <Welcome
        photoUrl={data.heroImageUrl}
        heading={data.welcomeHeading ?? 'Bem-vindos ao <em>vosso</em> portal'}
        paragraphs={data.welcomeParagraphs ?? [
          'Este é o vosso espaço dedicado. Aqui podem acompanhar todas as etapas do vosso casamento, desde a sessão pré-wedding até à entrega final das memórias.',
          'Cada secção foi pensada para vos manter informados e tornar o processo claro e tranquilo.',
        ]}
        pull={data.welcomePull ?? 'A vossa história, contada com tempo e detalhe.'}
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
