'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'

const HIDDEN_PATHS = ['/login', '/portal-cliente', '/freelancer-view', '/r/', '/nova-lead']
const HIDDEN_EXACT = ['/'] // brand selector — sem menu lateral

const MEDIA_LINKS = [
  {
    href: '/media/crm', label: 'CRM',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    href: '/media/recursos-humanos', label: 'Recursos Humanos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"/></svg>,
  },
  {
    href: '/media/financas', label: 'Finanças',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  },
  {
    href: '/media/portal-cliente', label: 'Portal Cliente',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>,
  },
]

const LINKS = [
  {
    href: '/photo', label: 'Menu Principal',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    href: '/crm', label: 'CRM',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    href: '/calendario', label: 'Calendário',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18"/></svg>,
  },
  {
    href: '/financas', label: 'Finanças',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  },
  {
    href: '/casamentos', label: 'Casamentos',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21.593c-5.63-5.539-11-10.297-11-14.402C1 3.498 3.498 1 6.5 1c1.8 0 3.4.9 4.5 2.3A5.49 5.49 0 0115.5 1C18.502 1 21 3.498 21 7.191c0 4.105-5.37 8.863-11 14.402z"/></svg>,
  },
  {
    href: '/relatorio-diario', label: 'Relatório Diário',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  },
  {
    href: '/freelancers', label: 'Freelancers',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14"/><rect x="1" y="6" width="14" height="12" rx="2"/></svg>,
  },
  {
    href: '/albuns-casamento', label: 'Álbuns',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21"/></svg>,
  },
  {
    href: '/portais-clientes', label: 'Portais Clientes',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg>,
  },
  {
    href: '/fotos-selecao', label: 'Fotos Seleção',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  },
  {
    href: '/eventos-2026', label: 'Eventos 2026',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  },
]

export default function GlobalMenu() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Esconder em paths proibidos ou no selector de marca
  if (HIDDEN_EXACT.includes(pathname)) return null
  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null

  // Detectar marca activa
  const isMedia = pathname.startsWith('/media')
  const gold = 'rgba(201,168,76,'
  const accent = (op: number) => isMedia ? `rgba(255,255,255,${op})` : `${gold}${op})`

  return (
    <>
      {/* Botão hambúrguer */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 w-10 h-10 flex flex-col items-center justify-center gap-[5px] rounded-xl transition-all duration-200"
        style={{
          background: 'rgba(0,4,10,0.75)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${accent(0.2)}`,
          boxShadow: `0 0 16px ${accent(0.06)}`,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = accent(0.45); e.currentTarget.style.boxShadow = `0 0 20px ${accent(0.12)}` }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = accent(0.2);  e.currentTarget.style.boxShadow = `0 0 16px ${accent(0.06)}` }}
        aria-label="Menu"
      >
        <span className="block rounded-full transition-all duration-200" style={{ width: '16px', height: '1px', background: accent(0.8) }} />
        <span className="block rounded-full transition-all duration-200" style={{ width: '10px', height: '1px', background: accent(0.5) }} />
        <span className="block rounded-full transition-all duration-200" style={{ width: '16px', height: '1px', background: accent(0.8) }} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,4,10,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: '256px',
          background: 'rgba(0,4,10,0.98)',
          borderRight: `1px solid ${accent(0.12)}`,
          boxShadow: `4px 0 40px ${accent(0.06)}`,
        }}
      >
        {/* Grid bg */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(${accent(0.025)} 1px,transparent 1px),linear-gradient(90deg,${accent(0.025)} 1px,transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-5"
          style={{ borderBottom: `1px solid ${accent(0.1)}` }}>
          <div>
            <p className="text-[9px] tracking-[0.5em] uppercase font-semibold"
              style={{ color: accent(0.65) }}>
              {isMedia ? 'RL Media · Audiovisual' : 'RL Photo · Video'}
            </p>
            <p className="text-[10px] tracking-[0.3em] uppercase mt-1"
              style={{ color: 'rgba(255,255,255,0.2)' }}>
              Admin
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-150"
            style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.02)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Links de navegação */}
        <nav className="relative flex-1 min-h-0 overflow-y-auto px-3 pb-4 pt-3 flex flex-col gap-0.5">

          {/* Links normais — RL PHOTO */}
          {!isMedia && LINKS.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== '/photo' && pathname.startsWith(href))
            return (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                style={active ? {
                  background: `${gold}0.08)`,
                  border: `1px solid ${gold}0.22)`,
                  boxShadow: `0 0 16px ${gold}0.06)`,
                } : { border: '1px solid transparent' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ color: active ? `${gold}0.85)` : 'rgba(255,255,255,0.3)' }} className="shrink-0">
                  {icon}
                </span>
                <span className="text-[12px] tracking-wide" style={{ color: active ? `${gold}0.9)` : 'rgba(255,255,255,0.45)' }}>
                  {label}
                </span>
                {active && (
                  <span className="ml-auto w-1 h-1 rounded-full shrink-0"
                    style={{ background: `${gold}0.8)`, boxShadow: `0 0 6px ${gold}0.6)` }} />
                )}
              </a>
            )
          })}

          {/* Links RL MEDIA — dentro de /media */}
          {isMedia && (
            <>
              <a
                href="/media"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                style={pathname === '/media' ? {
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.18)',
                } : { border: '1px solid transparent' }}
                onMouseEnter={e => { if (pathname !== '/media') e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (pathname !== '/media') e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                </span>
                <span className="text-[12px] tracking-wide" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  Menu RL Media
                </span>
                {pathname === '/media' && (
                  <span className="ml-auto w-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.7)' }} />
                )}
              </a>

              {MEDIA_LINKS.map(({ href, label, icon }) => {
                const active = pathname === href || pathname.startsWith(href)
                return (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
                    style={active ? {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.18)',
                    } : { border: '1px solid transparent' }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ color: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }} className="shrink-0">
                      {icon}
                    </span>
                    <span className="text-[12px] tracking-wide" style={{ color: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)' }}>
                      {label}
                    </span>
                    {active && (
                      <span className="ml-auto w-1 h-1 rounded-full shrink-0" style={{ background: 'rgba(255,255,255,0.7)' }} />
                    )}
                  </a>
                )
              })}
            </>
          )}

          {/* ── Separador ── */}
          <div className="relative" style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '6px 4px' }} />

          {/* ── Botão RL MEDIA / RL PHOTO ── mesmo estilo dos links normais ── */}
          <a
            href={isMedia ? '/photo' : '/media'}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.18)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
          >
            <span className="shrink-0" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
              </svg>
            </span>
            <span className="text-[12px] tracking-wide font-medium flex-1" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {isMedia ? 'RL Photo.Video' : 'RL Media'}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>→</span>
          </a>

        </nav>

        {/* Footer */}
        <div className="relative px-5 py-3" style={{ borderTop: `1px solid ${accent(0.05)}` }}>
          <p className="text-[8px] tracking-[0.4em] uppercase" style={{ color: 'rgba(255,255,255,0.1)' }}>
            {isMedia ? '© RL Media · Audiovisual' : '© RL Photo · Video'}
          </p>
        </div>
      </div>
    </>
  )
}
