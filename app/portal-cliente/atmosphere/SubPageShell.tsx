'use client'

/* ============================================================
   SubPageShell — wrapper Atmosphère para sub-páginas
   (Atendimento, Pagamentos, Contrato, Guias, etc.)

   Aplica o shell visual (sidebar + main com hero + article) mas
   recebe TODOS os controlos admin e o conteúdo via children/props.
   Não altera lógica — só presentation.
   ============================================================ */

import { useEffect, useState, type ReactNode } from 'react'
import './atmosphere.css'
import {
  PortalShell, SidebarCouple, SidebarNav, SidebarMiniCountdown,
  type SidebarNavItem,
} from './PortalShell'

export type SubPageData = {
  // identidade do casal — para a sidebar (mesmo que home portal)
  noiva?: string | null
  noivo?: string | null
  dataIso?: string | null
  dataLabel?: string | null
  referencia?: string | null

  // sub-páginas para a nav lateral
  subPages: Array<{ id: string; title: string }>
  hiddenNav?: string[]
  pageTitles?: Record<string, string>
  /** id da sub-página actual (highlight no nav) */
  currentPageId?: string | null
  /** referencia para construir hrefs `/portal-cliente/<id>?title=...&portalRef=<ref>` */
  portalRefForLinks?: string | null

  // hero
  pageTitle: string                  // título grande do hero ("Atendimento")
  heroImageUrl?: string | null

  // botão Voltar (default: ?portalRef=<ref> → /portal-cliente/ref/<ref>)
  backHref?: string
}

export function SubPageShell({
  data,
  adminActions,
  heroControls,
  bodyClassName,
  children,
}: {
  data: SubPageData
  /** Botões da barra de acções do admin (Atualizar, Fotos, Publicar...) */
  adminActions?: ReactNode
  /** Botões sobre o hero (Trocar foto, Remover, ✎ Editar título...) */
  heroControls?: ReactNode
  /** className adicional do container .article */
  bodyClassName?: string
  /** Conteúdo do artigo (paragraphs Notion, secções, etc.) */
  children: ReactNode
}) {
  const weddingDate = data.dataIso ? parseIsoDate(data.dataIso) : null

  const titleFor = (p: { id: string; title: string }) =>
    (data.pageTitles?.[p.id] ?? p.title).replace(/\s*\(\d+\)\s*$/, '')

  const defaultHrefBuilder = (id: string, title: string) => {
    const ref = data.portalRefForLinks
    const qs = new URLSearchParams()
    qs.set('title', title)
    if (ref) qs.set('portalRef', ref)
    return `/portal-cliente/${id}?${qs.toString()}`
  }

  const navItems: SidebarNavItem[] = data.subPages
    .filter(p => !(data.hiddenNav ?? []).includes(p.id))
    .map(p => {
      const t = titleFor(p)
      return {
        id: p.id,
        label: t,
        active: data.currentPageId === p.id,
        href: defaultHrefBuilder(p.id, t),
      }
    })

  const sidebar = (
    <>
      <SidebarCouple noiva={data.noiva} noivo={data.noivo} data={data.dataLabel} />
      <SidebarNav items={navItems} />
      <SidebarMiniCountdown weddingDate={weddingDate} coupleCode={data.referencia} />
    </>
  )

  const backHref = data.backHref
    ?? (data.portalRefForLinks ? `/portal-cliente/ref/${encodeURIComponent(data.portalRefForLinks)}` : '/portal-cliente')

  return (
    <PortalShell sidebar={sidebar}>
      {/* Admin actions bar */}
      {adminActions && (
        <div className="atm-abar">{adminActions}</div>
      )}

      {/* Hero */}
      <header className="atm-subhero">
        {data.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.heroImageUrl} alt="" className="atm-subhero-img" />
        ) : (
          <div className="ph" data-label={`Fotografia · ${data.pageTitle}`} style={{ position: 'absolute', inset: 0 }} />
        )}
        <div className="atm-subhero-scrim" />
        {heroControls && <div className="atm-subhero-controls">{heroControls}</div>}
        <div className="atm-subhero-cap">
          <div className="eyebrow">RL Photo · Video</div>
          <h1>{data.pageTitle}</h1>
        </div>
      </header>

      {/* Article */}
      <article className={`atm-article${bodyClassName ? ' ' + bodyClassName : ''}`}>
        <a className="atm-back" href={backHref}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 6l-6 6 6 6" />
          </svg>
          Voltar
        </a>
        <div className="atm-article-body">
          {children}
        </div>
      </article>

      {/* Inline styles específicos da sub-página */}
      <style jsx>{`
        :global(.portal-atmosphere .atm-abar) {
          display: flex; justify-content: flex-end; gap: 8px;
          margin-bottom: 22px; flex-wrap: wrap;
        }
        :global(.portal-atmosphere .atm-subhero) {
          position: relative;
          border-radius: var(--atm-r-lg);
          overflow: hidden;
          border: 1px solid var(--gold-faint);
          height: 300px;
          box-shadow: 0 40px 90px -50px rgba(0,0,0,.9);
        }
        :global(.portal-atmosphere .atm-subhero-img) {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
        }
        :global(.portal-atmosphere .atm-subhero-scrim) {
          position: absolute; inset: 0;
          background:
            linear-gradient(90deg, rgba(18,13,8,.85) 0%, rgba(18,13,8,.45) 45%, rgba(18,13,8,.15) 100%),
            linear-gradient(0deg, rgba(18,13,8,.7), transparent 55%);
          pointer-events: none;
        }
        :global(.portal-atmosphere .atm-subhero-controls) {
          position: absolute; top: 16px; right: 16px;
          display: flex; gap: 8px; z-index: 2;
        }
        :global(.portal-atmosphere .atm-subhero-cap) {
          position: absolute; left: 34px; right: 34px; bottom: 30px; z-index: 2;
        }
        :global(.portal-atmosphere .atm-subhero-cap .eyebrow) { color: var(--gold); }
        :global(.portal-atmosphere .atm-subhero-cap h1) {
          font-family: 'Cormorant Garamond', serif; font-weight: 400;
          font-size: clamp(38px, 5.5vw, 64px);
          letter-spacing: .14em; text-transform: uppercase;
          color: #fff; margin: 10px 0 0; line-height: 1;
        }

        :global(.portal-atmosphere .atm-article) {
          margin-top: 26px;
          border: 1px solid var(--line);
          border-radius: var(--atm-r-lg);
          background: linear-gradient(180deg, var(--surface), var(--bg-2));
          padding: 40px 48px 48px;
          position: relative;
        }
        :global(.portal-atmosphere .atm-back) {
          display: inline-flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 600; letter-spacing: .06em;
          color: var(--ink-2);
          padding: 9px 18px 9px 14px; border-radius: 999px;
          border: 1px solid var(--gold-faint);
          background: rgba(200,168,102,.05);
          transition: .2s;
          margin-bottom: 28px;
        }
        :global(.portal-atmosphere .atm-back svg) { stroke: var(--gold); }
        :global(.portal-atmosphere .atm-back:hover) { border-color: var(--gold); color: var(--ink); }
        :global(.portal-atmosphere .atm-article-body) {
          max-width: 720px;
        }

        @media (max-width: 980px) {
          :global(.portal-atmosphere .atm-subhero) { height: 230px; }
          :global(.portal-atmosphere .atm-subhero-cap) { left: 20px; right: 20px; bottom: 22px; }
          :global(.portal-atmosphere .atm-article) { padding: 28px 22px 32px; }
        }
      `}</style>
    </PortalShell>
  )
}

/* ── Botão Atmosphère para a admin bar (.abtn) ───────────────────── */
export function AtmAdminButton({
  children, icon, onClick, variant = 'default', disabled,
}: {
  children: ReactNode
  icon?: ReactNode
  onClick?: () => void
  variant?: 'default' | 'primary' | 'accent' | 'danger'
  disabled?: boolean
}) {
  return (
    <>
      <button
        type="button"
        className={`atm-abtn ${variant}`}
        onClick={onClick}
        disabled={disabled}
      >
        {icon}
        {children}
      </button>
      <style jsx>{`
        .atm-abtn {
          display: inline-flex; align-items: center; gap: 8px;
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 12px; font-weight: 600; letter-spacing: .02em;
          color: var(--ink-2);
          padding: 9px 16px; border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(239,231,214,.02);
          cursor: pointer; transition: .2s;
        }
        .atm-abtn :global(svg) {
          width: 15px; height: 15px;
          stroke: var(--ink-3); flex: none;
        }
        .atm-abtn:hover:not(:disabled) {
          border-color: var(--gold-line);
          color: var(--ink);
          background: rgba(200,168,102,.06);
        }
        .atm-abtn:hover:not(:disabled) :global(svg) { stroke: var(--gold); }
        .atm-abtn:disabled { opacity: .4; cursor: not-allowed; }
        .atm-abtn.primary {
          color: #1c150b; border-color: transparent;
          background: linear-gradient(168deg, #efd6a2, #d4b46f 60%, #c19a52);
          box-shadow: inset 0 1px 0 rgba(255,250,236,.5), 0 8px 20px -12px rgba(200,168,102,.55);
        }
        .atm-abtn.primary :global(svg) { stroke: #1c150b; }
        .atm-abtn.primary:hover:not(:disabled) {
          background: linear-gradient(168deg, #f3dcaa, #ddbe79 60%, #c8a35a);
        }
        .atm-abtn.accent { color: var(--gold-soft); border-color: var(--gold-faint); }
        .atm-abtn.accent :global(svg) { stroke: var(--gold-soft); }
        .atm-abtn.danger { color: #d8a59b; border-color: rgba(216,165,155,.3); }
        .atm-abtn.danger :global(svg) { stroke: #d8a59b; }
      `}</style>
    </>
  )
}

/* ── Botão de control sobre o hero (.gbtn) ───────────────────────── */
export function AtmHeroButton({
  children, icon, onClick, variant = 'default',
}: {
  children: ReactNode
  icon?: ReactNode
  onClick?: () => void
  variant?: 'default' | 'danger'
}) {
  return (
    <>
      <button type="button" className={`atm-gbtn ${variant}`} onClick={onClick}>
        {icon}
        {children}
      </button>
      <style jsx>{`
        .atm-gbtn {
          display: inline-flex; align-items: center; gap: 7px;
          font-family: 'Hanken Grotesk', sans-serif;
          font-size: 11px; font-weight: 600; letter-spacing: .03em;
          color: var(--ink);
          padding: 8px 13px; border-radius: 999px;
          background: rgba(20,15,9,.55);
          border: 1px solid rgba(239,231,214,.16);
          backdrop-filter: blur(8px);
          cursor: pointer; transition: .2s;
        }
        .atm-gbtn :global(svg) { width: 13px; height: 13px; stroke: currentColor; }
        .atm-gbtn:hover {
          background: rgba(20,15,9,.8);
          border-color: var(--gold-line);
        }
        .atm-gbtn.danger {
          color: #d8a59b;
          border-color: rgba(216,165,155,.3);
        }
      `}</style>
    </>
  )
}

/* ── Style do article body para parágrafos Notion (.atm-prose) ───── */
export function AtmProseStyles() {
  return (
    <style jsx global>{`
      .portal-atmosphere .atm-article-body p {
        color: var(--ink-2);
        font-size: 15.5px;
        line-height: 1.9;
        margin: 0 0 18px;
        text-wrap: pretty;
      }
      .portal-atmosphere .atm-article-body p strong {
        color: var(--ink);
        font-weight: 600;
      }
      .portal-atmosphere .atm-article-body p:first-child {
        color: var(--ink);
        font-size: 17px;
      }
      .portal-atmosphere .atm-article-body h2 {
        font-family: 'Cormorant Garamond', serif;
        font-weight: 500;
        font-size: clamp(28px, 3.4vw, 40px);
        color: var(--ink);
        margin: 28px 0 6px;
        line-height: 1.1;
      }
      .portal-atmosphere .atm-article-body h2::after {
        content: ''; display: block;
        width: 48px; height: 2px;
        background: linear-gradient(90deg, var(--gold), transparent);
        margin: 14px 0 26px;
      }
    `}</style>
  )
}

/* ── Helper local ─────────────────────────────────────────────── */
function parseIsoDate(iso: string): Date | null {
  try {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (!m) return null
    const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3])
    return new Date(y, mo, d, 12, 0, 0)
  } catch { return null }
}
