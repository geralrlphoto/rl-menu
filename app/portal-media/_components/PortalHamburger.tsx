'use client'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import NotificationsBell from './NotificationsBell'
import MessagesBell from './MessagesBell'

// Barra do topo e menu lateral do portal do cliente (identidade do rlprod.pt)

const NAV = [
  { slug: '',           label: 'Início',        desc: 'Visão geral do projeto' },
  { slug: 'workflow',   label: 'Workflow',       desc: 'Fases do projeto' },
  { slug: 'roadmap',    label: 'Road Map',       desc: 'Planeamento e tarefas' },
  { slug: 'briefing',   label: 'Briefing',       desc: 'Objetivos e referências' },
  { slug: 'contrato',   label: 'Contrato & CPS', desc: 'Documentos e dados' },
  { slug: 'pagamentos', label: 'Pagamentos',     desc: 'Estado financeiro' },
  { slug: 'entregas',   label: 'Entregas',       desc: 'Ficheiros e revisões' },
  { slug: 'atendimento',label: 'Atendimento',    desc: 'Equipa e contactos' },
  { slug: 'satisfacao', label: 'Satisfação',     desc: 'Avaliação do projeto' },
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
  const atual = NAV.find(n => isActive(n.slug))

  return (
    <>
      {/* ── Barra fixa do topo ── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-[52px] flex items-center justify-between px-3 sm:px-5 bg-[#00141f]/95 border-b border-white/[0.08]">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setOpen(true)} aria-label="Menu do portal"
            className="w-9 h-9 shrink-0 rounded-full border border-white/[0.14] hover:border-[#2e6cf6] flex flex-col items-center justify-center gap-[4px] transition-colors">
            <span className="block w-4 h-px bg-white/80" />
            <span className="block w-2.5 h-px bg-white/45" />
            <span className="block w-4 h-px bg-white/80" />
          </button>
          <Link href={base} className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="w-7 h-7 object-contain shrink-0" />
            <span className="rlp-t text-[17px] tracking-[0.04em] shrink-0">RL Prod</span>
            <span className="rlp-m hidden md:inline text-[9.5px] text-[#5a8bff] truncate">
              Portal do cliente{atual && atual.slug ? ` · ${atual.label}` : ''}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <MessagesBell portalRef={portalRef} />
          <NotificationsBell portalRef={portalRef} />
          <span className="rlp-m hidden sm:flex items-center gap-2 ml-1 text-[9.5px] text-white/55">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2e6cf6] animate-pulse" />Ativo
          </span>
        </div>
      </header>

      {/* Fundo escuro por trás do menu */}
      {open && <div className="fixed inset-0 z-40 bg-[#000d17]/75" onClick={() => setOpen(false)} />}

      {/* ── Menu lateral ── */}
      <aside className={`rlp fixed top-0 left-0 h-full z-50 w-[288px] flex flex-col bg-[#00141f] border-r border-white/[0.1] shadow-[4px_0_40px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-start justify-between gap-3 px-5 pt-6 pb-5 border-b border-white/[0.08]">
          <div className="min-w-0">
            <p className="rlp-m traco text-[9.5px] text-[#5a8bff]">Portal do cliente</p>
            <p className="rlp-t mt-2 text-[24px] leading-tight break-words">{nomeProjeto}</p>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Fechar menu"
            className="w-9 h-9 shrink-0 rounded-full border border-white/[0.14] hover:border-[#2e6cf6] text-white/70 hover:text-white flex items-center justify-center transition-colors">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3 flex flex-col gap-1">
          {NAV.map(({ slug, label, desc }, i) => {
            const active = isActive(slug)
            const href = slug === '' ? base : `${base}/${slug}`
            return (
              <Link key={slug} href={href} onClick={() => setOpen(false)}
                className={`relative flex items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors ${active ? 'border-[#2e6cf6]/60 bg-[#2e6cf6]/[0.12]' : 'border-transparent hover:bg-white/[0.04]'}`}>
                {active && <span aria-hidden className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r bg-[#2e6cf6]" />}
                <span className={`rlp-t w-7 shrink-0 text-[18px] ${active ? 'text-[#5a8bff]' : 'text-white/30'}`}>{String(i + 1).padStart(2, '0')}</span>
                <span className="min-w-0 flex-1">
                  <span className={`rlp-t block text-[16px] tracking-[0.03em] leading-tight ${active ? 'text-white' : 'text-white/80'}`}>{label}</span>
                  <span className="block text-[11.5px] text-white/45 leading-tight mt-0.5">{desc}</span>
                </span>
              </Link>
            )
          })}
        </nav>

        <div className="px-5 py-4 flex items-center gap-3 border-t border-white/[0.08]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-rl-prod-branco.png" alt="" className="w-7 h-7 object-contain opacity-80" />
          <p className="rlp-m text-[9px] text-white/45">RL Prod · Photography &amp; Video</p>
        </div>
      </aside>
    </>
  )
}
