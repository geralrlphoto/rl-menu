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
      {/* Hambúrguer */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Menu do portal"
        className="fixed top-4 left-4 z-40 w-10 h-10 flex flex-col items-center justify-center gap-[5px] transition-all duration-200"
        style={{
          background: 'rgba(0,4,14,0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 0 16px rgba(50,110,255,0.10)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.30)'
          e.currentTarget.style.boxShadow   = '0 0 20px rgba(50,110,255,0.18)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
          e.currentTarget.style.boxShadow   = '0 0 16px rgba(50,110,255,0.10)'
        }}
      >
        <span className="block" style={{ width: '16px', height: '1px', background: 'rgba(255,255,255,0.7)' }} />
        <span className="block" style={{ width: '10px', height: '1px', background: 'rgba(255,255,255,0.4)' }} />
        <span className="block" style={{ width: '16px', height: '1px', background: 'rgba(255,255,255,0.7)' }} />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,4,14,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          width: '260px',
          background: 'rgba(2,6,18,0.98)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Grid neon bg */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{
          backgroundImage: `linear-gradient(rgba(70,120,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(70,120,255,0.025) 1px,transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 100% 40% at 50% 0%, rgba(50,110,255,0.08) 0%, transparent 65%)',
        }} />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-5"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="text-[8px] tracking-[0.55em] text-white/20 uppercase mb-1">Portal do Cliente</p>
            <p className="text-[12px] tracking-[0.25em] text-white/70 uppercase font-light">{nomeProjeto}</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="w-8 h-8 flex items-center justify-center transition-all duration-150"
            style={{ border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.02)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="relative flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-4 flex flex-col gap-0.5">
          {NAV.map(({ slug, label, desc, icon }) => {
            const active = isActive(slug)
            const href = slug === '' ? base : `${base}/${slug}`
            return (
              <Link
                key={slug}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 transition-all duration-150 group"
                style={active ? {
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.14)',
                } : { border: '1px solid transparent' }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
              >
                <span className="text-base select-none shrink-0"
                  style={{ color: active ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.18)' }}>
                  {icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] tracking-[0.25em] uppercase leading-tight"
                    style={{ color: active ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.40)' }}>
                    {label}
                  </p>
                  <p className="text-[9px] mt-0.5 leading-tight"
                    style={{ color: 'rgba(255,255,255,0.12)' }}>
                    {desc}
                  </p>
                </div>
                {active && (
                  <span className="w-1 h-1 rounded-full shrink-0"
                    style={{ background: 'rgba(255,255,255,0.55)', boxShadow: '0 0 6px rgba(255,255,255,0.35)' }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="relative px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-[8px] tracking-[0.4em] uppercase" style={{ color: 'rgba(255,255,255,0.08)' }}>
            RL Media · Audiovisual
          </p>
        </div>
      </div>
    </>
  )
}
