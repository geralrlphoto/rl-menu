'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { slug: '',           label: 'Início',        desc: 'Visão geral do projeto', icon: '◈' },
  { slug: 'workflow',   label: 'Workflow',       desc: 'Fases do projeto',       icon: '◎' },
  { slug: 'roadmap',    label: 'Road Map',       desc: 'Planeamento e tarefas',  icon: '⬡' },
  { slug: 'briefing',   label: 'Briefing',       desc: 'Objetivos e refs.',      icon: '◇' },
  { slug: 'contrato',   label: 'Contrato & CPS', desc: 'Documentos e dados',     icon: '◉' },
  { slug: 'pagamentos', label: 'Pagamentos',     desc: 'Estado financeiro',      icon: '◐' },
  { slug: 'entregas',   label: 'Entregas',       desc: 'Ficheiros e revisões',   icon: '◑' },
  { slug: 'atendimento',label: 'Atendimento',    desc: 'Equipa e contactos',     icon: '◒' },
  { slug: 'satisfacao', label: 'Satisfação',     desc: 'Avaliação do projeto',   icon: '◓' },
]

interface Props {
  portalRef: string
  nomeProjeto: string
}

export default function PortalHamburger({ portalRef, nomeProjeto }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const base = `/portal-media/${portalRef}`

  const isActive = (slug: string) => {
    if (slug === '') return pathname === base
    return pathname.startsWith(`${base}/${slug}`)
  }

  return (
    <>
      {/* ── Barra de cabeçalho fixa (rebrand navy v2) ── */}
      <div
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4"
        style={{
          height: '44px',
          background: 'rgba(14,27,39,0.88)' /* navy-950 transparente */,
          backdropFilter: 'blur(14px)',
          borderBottom: '1px solid oklch(0.50 0.03 245 / 0.18)',
          fontFamily: 'Manrope, system-ui, sans-serif',
        }}
      >
        {/* Esquerda: hamburger + nome */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            aria-label="Menu do portal"
            className="w-8 h-8 flex flex-col items-center justify-center gap-[4px] shrink-0 transition-opacity duration-150 hover:opacity-70"
          >
            <span className="block" style={{ width: '16px', height: '1px', background: 'rgba(255,255,255,0.65)' }} />
            <span className="block" style={{ width: '10px', height: '1px', background: 'rgba(255,255,255,0.35)' }} />
            <span className="block" style={{ width: '16px', height: '1px', background: 'rgba(255,255,255,0.65)' }} />
          </button>
          <span className="text-[12px] tracking-[0.45em] uppercase hidden sm:block"
            style={{ color: 'oklch(0.70 0.03 245)', fontFamily: 'Space Grotesk, Manrope, sans-serif', fontWeight: 500 }}>
            RL PROD &nbsp;·&nbsp; Portal do Cliente
          </span>
        </div>

        {/* Direita: indicador activo (azul accent, em vez de verde) */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'oklch(0.80 0.11 245)' /* accent-bright */ }} />
          <span className="text-[12px] tracking-[0.4em] uppercase"
            style={{ color: 'oklch(0.70 0.03 245)' }}>Activo</span>
        </div>
      </div>

      {/* Overlay (scrim) — navy */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(14,27,39,0.72)', backdropFilter: 'blur(6px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer (rebrand navy v2) */}
      <div
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: '268px',
          background: 'linear-gradient(180deg, #16293a, #122230 60%, #0e1b27)',
          borderRight: '1px solid oklch(0.50 0.03 245 / 0.22)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.55)',
          fontFamily: 'Manrope, system-ui, sans-serif',
        }}
      >
        {/* Grão subtil (substitui o grid neon) */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '4px 4px',
          opacity: 0.5,
          mixBlendMode: 'overlay',
        }} />
        {/* Halo accent breathing no topo */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 100% 40% at 50% 0%, oklch(0.66 0.13 245 / 0.10) 0%, transparent 65%)',
        }} />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-5"
          style={{ borderBottom: '1px solid oklch(0.50 0.03 245 / 0.18)' }}>
          <div>
            <p className="text-[9px] tracking-[0.55em] uppercase mb-1.5"
              style={{ color: 'oklch(0.80 0.11 245)' /* accent-bright */, fontFamily: 'Space Grotesk, Manrope, sans-serif', fontWeight: 500, letterSpacing: '0.32em' }}>
              Portal do Cliente
            </p>
            <p className="text-[15px] tracking-[0.07em] font-semibold"
              style={{ color: '#fff', fontFamily: 'Space Grotesk, Manrope, sans-serif' }}>
              {nomeProjeto}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            className="w-8 h-8 flex items-center justify-center rounded-md transition-all duration-150"
            style={{ border: '1px solid oklch(0.50 0.03 245 / 0.22)', color: 'oklch(0.70 0.03 245)', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'oklch(0.80 0.11 245)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'oklch(0.50 0.03 245 / 0.22)'; e.currentTarget.style.color = 'oklch(0.70 0.03 245)' }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Nav (rebrand: navy + barra accent à esquerda no item activo + ponto pulse) */}
        <nav className="relative flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-4 flex flex-col gap-1">
          {NAV.map(({ slug, label, desc, icon }) => {
            const active = isActive(slug)
            const href = slug === '' ? base : `${base}/${slug}`
            return (
              <Link
                key={slug}
                href={href}
                onClick={() => setOpen(false)}
                className="relative flex items-center gap-3 px-3.5 py-2.5 rounded-md transition-all duration-150"
                style={active ? {
                  background: 'oklch(0.66 0.13 245 / 0.12)',
                  border: '1px solid oklch(0.66 0.13 245 / 0.30)',
                } : { border: '1px solid transparent' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'oklch(0.40 0.04 245 / 0.30)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Barra accent à esquerda quando activo */}
                {active && (
                  <span aria-hidden className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r"
                    style={{ background: 'oklch(0.80 0.11 245)', boxShadow: '0 0 8px oklch(0.66 0.13 245 / 0.6)' }} />
                )}
                <span className="text-lg select-none shrink-0"
                  style={{ color: active ? 'oklch(0.80 0.11 245)' : 'oklch(0.58 0.03 245)' }}>
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] tracking-[0.18em] uppercase leading-tight font-semibold"
                    style={{
                      color: active ? '#fff' : 'oklch(0.70 0.03 245)',
                      fontFamily: 'Space Grotesk, Manrope, sans-serif',
                    }}>
                    {label}
                  </p>
                  <p className="text-[11px] mt-0.5 leading-tight"
                    style={{ color: 'oklch(0.58 0.03 245)' }}>
                    {desc}
                  </p>
                </div>
                {active && (
                  <span aria-hidden className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                    style={{ background: 'oklch(0.80 0.11 245)', boxShadow: '0 0 8px oklch(0.66 0.13 245 / 0.7)' }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer com logo */}
        <div className="relative px-5 py-4 flex items-center gap-3" style={{ borderTop: '1px solid oklch(0.50 0.03 245 / 0.14)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/portal-cliente/mark-white.png" alt="" style={{ height: 22, width: 'auto', opacity: 0.85 }} />
          <p className="text-[9px] tracking-[0.32em] uppercase font-semibold"
            style={{ color: 'oklch(0.58 0.03 245)' }}>
            RL PROD · Photography &amp; Video
          </p>
        </div>
      </div>
    </>
  )
}

