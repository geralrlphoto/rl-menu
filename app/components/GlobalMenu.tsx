'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'

// Páginas públicas — menu não aparece nestas
const HIDDEN_PATHS = ['/login', '/portal-cliente', '/freelancer-view', '/r/']

const LINKS = [
  { href: '/',                  label: 'Menu Principal',  icon: '⌂' },
  { href: '/crm',               label: 'CRM',             icon: '👥' },
  { href: '/calendario',        label: 'Calendário',      icon: '📅' },
  { href: '/financas',          label: 'Finanças',        icon: '💰' },
  { href: '/casamentos',        label: 'Casamentos',      icon: '💍' },
  { href: '/relatorio-diario',  label: 'Relatório Diário',icon: '📊' },
  { href: '/freelancers',       label: 'Freelancers',     icon: '🎥' },
  { href: '/albuns-casamento',  label: 'Álbuns',          icon: '🖼' },
  { href: '/portais-clientes',  label: 'Portais Clientes',icon: '🌐' },
  { href: '/fotos-selecao',     label: 'Fotos Seleção',   icon: '📸' },
  { href: '/eventos-2026',      label: 'Eventos 2026',    icon: '🗓' },
]

export default function GlobalMenu() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Não mostrar em páginas públicas
  if (HIDDEN_PATHS.some(p => pathname.startsWith(p))) return null

  return (
    <>
      {/* Botão hambúrguer */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 w-10 h-10 flex flex-col items-center justify-center gap-1.5 rounded-xl transition-all hover:scale-105"
        style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        aria-label="Menu"
      >
        <span className="block bg-white/70 rounded-full transition-all" style={{ width: '18px', height: '1.5px' }} />
        <span className="block bg-white/70 rounded-full transition-all" style={{ width: '12px', height: '1.5px' }} />
        <span className="block bg-white/70 rounded-full transition-all" style={{ width: '18px', height: '1.5px' }} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: '260px',
          background: '#0d0d0d',
          borderRight: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase" style={{ color: '#C9A84C' }}>
              RL Photo · Video
            </p>
            <p className="text-[11px] tracking-widest text-white/30 uppercase mt-0.5">Admin</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all text-sm"
          >
            ✕
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
          {LINKS.map(({ href, label, icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group"
                style={{
                  background: active ? 'rgba(201,168,76,0.08)' : 'transparent',
                  border: active ? '1px solid rgba(201,168,76,0.15)' : '1px solid transparent',
                }}
              >
                <span className="text-base w-5 text-center">{icon}</span>
                <span
                  className="text-[13px] tracking-wide transition-colors"
                  style={{ color: active ? '#C9A84C' : 'rgba(255,255,255,0.5)' }}
                >
                  {label}
                </span>
                {active && (
                  <span className="ml-auto w-1 h-1 rounded-full" style={{ background: '#C9A84C' }} />
                )}
              </a>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.04)' }}
        >
          <p className="text-[9px] tracking-widest text-white/15 uppercase">© RL Photo · Video</p>
        </div>
      </div>
    </>
  )
}
