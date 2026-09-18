'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { AdminNotificationsBell } from './AdminNotificationsBell'

const HIDDEN_PATHS = ['/login', '/portal-cliente', '/portal-batizado', '/freelancer-view', '/r/', '/b/', '/nova-lead', '/portal-media', '/painel-editor']
// Paths em que o menu lateral permanente é colapsado (só botão flutuante visível)
const COLLAPSED_PATHS = ['/freelancers/', '/painel-fotografo']
const HIDDEN_EXACT = ['/'] // brand selector — sem menu lateral

const MEDIA_LINKS = [
  {
    href: '/media', label: 'RL PROD', sub: 'Menu principal',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    exact: true,
  },
  {
    href: '/media/crm', label: 'CRM', sub: 'Leads e contactos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    href: '/media/recursos-humanos', label: 'Recursos Humanos', sub: 'Equipa e gestão',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"/></svg>,
  },
  {
    href: '/media/financas', label: 'Finanças', sub: 'Pagamentos e receitas',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  },
  {
    href: '/media/portal-cliente', label: 'Portal Cliente', sub: 'Portais e senhas',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>,
  },
]

const LINKS = [
  {
    href: '/photo', label: 'Menu Principal', sub: 'Dashboard',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
    exact: true,
  },
  {
    href: '/crm', label: 'CRM', sub: 'Clientes',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    href: '/calendario', label: 'Calendário', sub: 'Agenda',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18"/></svg>,
  },
  {
    href: '/financas', label: 'Finanças', sub: 'Receitas',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  },
  {
    href: '/casamentos', label: 'Casamentos', sub: 'Eventos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.498 3.498 1 6.5 1c1.8 0 3.4.9 4.5 2.3A5.49 5.49 0 0115.5 1C18.502 1 21 3.498 21 7.191c0 4.105-5.37 8.863-11 14.402z"/></svg>,
  },
  {
    href: '/relatorio-diario', label: 'Relatório Diário', sub: 'Análise',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  },
  {
    href: '/freelancers', label: 'Freelancers', sub: 'Equipa',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14"/><rect x="1" y="6" width="14" height="12" rx="2"/></svg>,
  },
  {
    href: '/albuns-casamento', label: 'Álbuns', sub: 'Galeria',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21"/></svg>,
  },
  {
    href: '/portais-clientes', label: 'Portais Clientes', sub: 'Acesso',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>,
  },
  {
    href: '/fotos-selecao', label: 'Fotos Seleção', sub: 'Ficheiros',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  },
  {
    href: '/eventos-2026', label: 'Eventos 2026', sub: 'Agenda',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  },
]

export default function GlobalMenu() {
  // useSearchParams requires Suspense em Next.js 16
  return (
    <Suspense fallback={null}>
      <GlobalMenuInner />
    </Suspense>
  )
}

function GlobalMenuInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  // Barra estreita (só ícones) — fica guardado entre visitas
  const [compact, setCompact] = useState(false)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    setCompact(localStorage.getItem('rl-menu-compacto') === '1')
  }, [])

  // O conteúdo das páginas acompanha a largura da barra
  useEffect(() => {
    document.documentElement.style.setProperty('--rl-sidebar', compact ? '76px' : '230px')
  }, [compact])

  function toggleCompact() {
    setCompact(v => {
      localStorage.setItem('rl-menu-compacto', v ? '0' : '1')
      return !v
    })
  }

  const isHidden = HIDDEN_EXACT.includes(pathname) || HIDDEN_PATHS.some(p => pathname.startsWith(p))
  // Esconder também quando ?view=freelancer (modo "Ver como Freelancer")
  const isFreelancerView = searchParams?.get('view') === 'freelancer'
  if (isHidden || isFreelancerView) return null

  // Em paths colapsados: sidebar permanente escondida, só botão flutuante (drawer)
  const isCollapsed = COLLAPSED_PATHS.some(p => pathname.startsWith(p))

  const isMedia = pathname.startsWith('/media')
  const gold = 'rgba(201,168,76,'
  const accent = (op: number) => isMedia ? `rgba(255,255,255,${op})` : `${gold}${op})`

  const navLinks = isMedia ? MEDIA_LINKS : LINKS

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : (pathname === href || pathname.startsWith(href + '/') || (href !== '/photo' && href !== '/media' && pathname.startsWith(href)))

  const semAcentos = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  // ── Link item — shared between drawer and sidebar ──────────────────────────
  const NavItem = ({ href, label, sub, icon, exact, mini }: { href: string; label: string; sub?: string; icon: ReactNode; exact?: boolean; mini?: boolean }) => {
    const active = isActive(href, exact)
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        title={mini ? label : undefined}
        className={`group relative flex items-center ${mini ? 'justify-center' : 'gap-3'} rounded-xl transition-all duration-200`}
        style={{
          padding: mini ? '10px 0' : '9px 10px',
          background: active ? (isMedia ? 'rgba(255,255,255,0.05)' : `${gold}0.09)`) : 'transparent',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.035)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Barra dourada do item ativo */}
        <span className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full transition-all duration-300"
          style={{
            width: '2px',
            height: active ? '60%' : '0%',
            background: accent(0.9),
            boxShadow: active ? `0 0 10px ${accent(0.5)}` : 'none',
          }} />

        <span className="shrink-0 flex items-center justify-center rounded-lg transition-all duration-200 group-hover:scale-[1.06]"
          style={{
            width: '30px', height: '30px',
            color: active ? accent(0.95) : accent(0.42),
            background: active ? (isMedia ? 'rgba(255,255,255,0.07)' : `${gold}0.12)`) : 'rgba(255,255,255,0.03)',
            border: `1px solid ${active ? accent(0.28) : 'rgba(255,255,255,0.05)'}`,
          }}>
          {icon}
        </span>

        {!mini && (
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] tracking-wide leading-tight truncate transition-colors duration-200"
              style={{ color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.62)' }}>
              {label}
            </p>
            {sub && (
              <p className="text-[8.5px] leading-tight mt-0.5 truncate uppercase tracking-[0.2em]"
                style={{ color: active ? accent(0.55) : 'rgba(255,255,255,0.18)' }}>
                {sub}
              </p>
            )}
          </div>
        )}
      </Link>
    )
  }

  // ── Cross-brand switcher ───────────────────────────────────────────────────
  const BrandSwitch = ({ mini }: { mini?: boolean }) => (
    <Link
      href={isMedia ? '/photo' : '/media'}
      onClick={() => setOpen(false)}
      title={mini ? (isMedia ? 'RL Photo.Video' : 'RL PROD') : undefined}
      className={`flex items-center ${mini ? 'justify-center' : 'gap-3'} rounded-xl transition-all duration-200`}
      style={{ padding: mini ? '10px 0' : '9px 10px', background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.045)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
    >
      <span className="shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
        </svg>
      </span>
      {!mini && (
        <>
          <span className="text-[12px] tracking-wide font-medium flex-1" style={{ color: 'rgba(255,255,255,0.72)' }}>
            {isMedia ? 'RL Photo.Video' : 'RL PROD'}
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>→</span>
        </>
      )}
    </Link>
  )

  // ── Sidebar content (shared) ───────────────────────────────────────────────
  // mini = barra estreita (só no desktop); comToggle = tem o botão de encolher
  const SidebarContent = ({ mini = false, comToggle = false }: { mini?: boolean; comToggle?: boolean }) => {
    const filtro = semAcentos(busca.trim())
    const visiveis = filtro
      ? navLinks.filter((l: any) => semAcentos(l.label).includes(filtro) || semAcentos(l.sub ?? '').includes(filtro))
      : navLinks

    return (
      <>
        {/* Brilho dourado no canto superior */}
        <div className="absolute inset-x-0 top-0 h-48 pointer-events-none"
          style={{ background: `radial-gradient(120% 80% at 0% 0%, ${accent(0.08)}, transparent 70%)` }} />

        {/* Header */}
        <div className={`relative flex items-center ${mini ? 'justify-center' : 'justify-between'} px-4 py-5`}>
          <Link href={isMedia ? '/media' : '/photo'} onClick={() => setOpen(false)}
            className={`flex items-center ${mini ? '' : 'gap-3'} min-w-0`}>
            <span className="shrink-0 flex items-center justify-center rounded-xl"
              style={{
                width: '34px', height: '34px',
                border: `1px solid ${accent(0.35)}`,
                background: `linear-gradient(140deg, ${accent(0.16)}, transparent)`,
                color: accent(0.95),
                boxShadow: `0 0 18px -6px ${accent(0.6)}`,
              }}>
              <span className="text-[11px] tracking-[0.1em] font-semibold">RL</span>
            </span>
            {!mini && (
              <div className="min-w-0">
                <p className="text-[9.5px] tracking-[0.4em] uppercase font-semibold truncate" style={{ color: accent(0.8) }}>
                  {isMedia ? 'RL PROD' : 'Photo · Video'}
                </p>
                <p className="text-[8px] tracking-[0.3em] uppercase mt-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>
                  Admin
                </p>
              </div>
            )}
          </Link>

          {!comToggle && (
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-150"
              style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        {/* Pesquisa — só com a barra larga */}
        {!mini && (
          <div className="relative px-3 pb-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.22)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                  <circle cx="11" cy="11" r="7"/><path strokeLinecap="round" d="M21 21l-4-4"/>
                </svg>
              </span>
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Procurar…"
                className="w-full rounded-xl pl-9 pr-8 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                onFocus={ev => { ev.currentTarget.style.borderColor = accent(0.35); ev.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onBlur={ev => { ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; ev.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
              />
              {busca && (
                <button onClick={() => setBusca('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors text-sm leading-none">
                  ×
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav className={`relative flex-1 min-h-0 overflow-y-auto ${mini ? 'px-2.5' : 'px-3'} pb-4 flex flex-col gap-1`}>
          {/* Sino de Notificações — só no menu RL Photo (não no MEDIA) */}
          {!isMedia && (
            <>
              <AdminNotificationsBell compact={mini} />
              <div className="h-px my-1.5 mx-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </>
          )}

          {visiveis.map(({ href, label, sub, icon, exact }: any) => (
            <NavItem key={href} href={href} label={label} sub={sub} icon={icon} exact={exact} mini={mini} />
          ))}
          {visiveis.length === 0 && (
            <p className="text-[11px] text-white/25 italic px-2 py-3">Nada com esse nome.</p>
          )}

          <div className="h-px my-1.5 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <BrandSwitch mini={mini} />
        </nav>

        {/* Footer */}
        <div className={`relative flex items-center ${mini ? 'justify-center' : 'justify-between'} gap-2 px-4 py-3`}
          style={{ borderTop: `1px solid ${accent(0.07)}` }}>
          {!mini && (
            <p className="text-[8px] tracking-[0.35em] uppercase truncate" style={{ color: 'rgba(255,255,255,0.14)' }}>
              {isMedia ? '© RL PROD' : '© RL Photo · Video'}
            </p>
          )}
          {comToggle && (
            <button
              onClick={toggleCompact}
              title={mini ? 'Alargar menu' : 'Encolher menu'}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200 shrink-0"
              style={{ border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)' }}
              onMouseEnter={ev => { ev.currentTarget.style.borderColor = accent(0.4); ev.currentTarget.style.color = accent(0.9) }}
              onMouseLeave={ev => { ev.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; ev.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"
                style={{ transform: mini ? 'rotate(180deg)' : 'none', transition: 'transform .3s ease' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6"/>
              </svg>
            </button>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      {/* Esconde tudo no PDF / print */}
      <style jsx global>{`
        @media print {
          [data-global-menu] { display: none !important; }
        }
      `}</style>

      {/* ── DESKTOP: sidebar permanente (escondida em paths colapsados) ───── */}
      {!isCollapsed && (
        <aside
          data-global-menu
          className="hidden lg:flex flex-col fixed top-0 left-0 h-full z-40 print:hidden"
          style={{
            width: compact ? '76px' : '230px',
            transition: 'width .28s cubic-bezier(.2,.7,.2,1)',
            background: 'linear-gradient(180deg, rgba(8,7,5,0.97), rgba(4,4,6,0.97))',
            borderRight: `1px solid ${accent(0.12)}`,
            boxShadow: '2px 0 30px rgba(0,0,0,0.45)',
          }}
        >
          <SidebarContent mini={compact} comToggle />
        </aside>
      )}

      {/* ── Botão hambúrguer/seta (mobile sempre; desktop só em paths colapsados) ── */}
      <button
        onClick={() => setOpen(true)}
        data-global-menu
        className={`${isCollapsed ? '' : 'lg:hidden'} fixed top-4 z-[60] w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-xl transition-all duration-200 print:hidden`}
        style={{
          left: isCollapsed ? 'auto' : '1rem',
          right: isCollapsed ? '1rem' : 'auto',
          background: 'rgba(0,4,10,0.75)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${accent(0.2)}`,
          boxShadow: `0 0 16px ${accent(0.06)}`,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = accent(0.45); e.currentTarget.style.boxShadow = `0 0 20px ${accent(0.12)}` }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = accent(0.2);  e.currentTarget.style.boxShadow = `0 0 16px ${accent(0.06)}` }}
        aria-label="Menu"
        title="Menu Principal"
      >
        {isCollapsed ? (
          /* Seta indicando 'abrir menu' */
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" style={{ color: accent(0.85) }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        ) : (
          <>
            <span className="block rounded-full" style={{ width: '16px', height: '1px', background: accent(0.8) }} />
            <span className="block rounded-full" style={{ width: '10px', height: '1px', background: accent(0.5) }} />
            <span className="block rounded-full" style={{ width: '16px', height: '1px', background: accent(0.8) }} />
          </>
        )}
      </button>

      {/* Drawer overlay (mobile sempre; desktop só em paths colapsados) */}
      {open && (
        <div
          data-global-menu
          className={`${isCollapsed ? '' : 'lg:hidden'} fixed inset-0 z-[55] print:hidden`}
          style={{ background: 'rgba(0,4,10,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer (mobile sempre; desktop só em paths colapsados) */}
      <div
        data-global-menu
        className={`${isCollapsed ? '' : 'lg:hidden'} fixed top-0 left-0 h-full z-[60] flex flex-col transition-transform duration-300 ease-in-out print:hidden ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: '264px',
          background: 'linear-gradient(180deg, rgba(8,7,5,0.99), rgba(4,4,6,0.99))',
          borderRight: `1px solid ${accent(0.12)}`,
          boxShadow: `4px 0 40px ${accent(0.06)}`,
        }}
      >
        <SidebarContent />
      </div>
    </>
  )
}

