'use client'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

// Paths where the sidebar is hidden (matches GlobalMenu HIDDEN_PATHS)
const HIDDEN_PATHS = ['/login', '/portal-cliente', '/portal-batizado', '/freelancer-view', '/r/', '/b/', '/nova-lead', '/portal-media', '/painel-editor']
const HIDDEN_EXACT = ['/']

export default function AdminContentShift({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const isHidden = HIDDEN_EXACT.includes(pathname) || HIDDEN_PATHS.some(p => pathname.startsWith(p))

  return (
    <div className={!isHidden ? 'lg:pl-[220px]' : ''}>
      {children}
    </div>
  )
}
