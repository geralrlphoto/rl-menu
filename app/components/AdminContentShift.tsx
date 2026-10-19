'use client'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// Paths where the sidebar is hidden (matches GlobalMenu HIDDEN_PATHS)
const HIDDEN_PATHS = ['/login', '/portal-cliente', '/portal-batizado', '/freelancer-view', '/r/', '/b/', '/nova-lead', '/portal-media', '/painel-editor', '/convidados/', '/opiniao']
const HIDDEN_EXACT = ['/']

export default function AdminContentShift({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isHidden = HIDDEN_EXACT.includes(pathname) || HIDDEN_PATHS.some(p => pathname.startsWith(p))

  return (
    // O menu passou para uma barra no topo (em fluxo normal): já não há margem à esquerda
    <div className={!isHidden ? 'lg:pl-[var(--rl-sidebar,0px)] transition-[padding] duration-300' : ''}>
      {children}
    </div>
  )
}
