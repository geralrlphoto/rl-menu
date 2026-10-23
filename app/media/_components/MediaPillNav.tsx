'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import EstiloRLProd from '@/app/media/_components/EstiloRLProd'
import { LogoutButton } from '@/app/components/LogoutButton'
import MediaNotificationsBell from '@/app/media/_components/MediaNotificationsBell'

// Páginas da RL PROD (as mesmas de MEDIA_LINKS em GlobalMenu.tsx)
const NAV = [
  { label: 'CRM',              href: '/media/crm' },
  { label: 'Recursos Humanos', href: '/media/recursos-humanos' },
  { label: 'Finanças',         href: '/media/financas' },
  { label: 'Portal Cliente',   href: '/media/portal-cliente' },
]

// Barra em pílula de todas as páginas /media (desenhada pelo GlobalMenu)
export default function MediaPillNav() {
  const pathname = usePathname()

  return (
    <>
    <EstiloRLProd />
    <header data-global-menu className={`rlp relative z-40 px-4 pt-3 print:hidden text-white`}>
      <nav className="max-w-5xl mx-auto flex items-center justify-between gap-4 rounded-full
                      border border-white/[0.08] bg-[#00141f]/80 backdrop-blur-md pl-5 pr-2 py-2">
        <Link href="/media" className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-rl-prod-branco.png" alt="" className="w-6 h-6 object-contain" />
          <span className="rlp-t text-[17px] tracking-[0.04em]">RL Prod</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {NAV.map(n => {
            const ativo = pathname === n.href || pathname.startsWith(n.href + '/')
            return (
              <Link key={n.href} href={n.href}
                className={`text-[12.5px] transition-colors ${ativo ? 'text-[#5a8bff]' : 'text-white/60 hover:text-white'}`}>
                {n.label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/photo" className="hidden sm:inline text-[12.5px] text-white/35 hover:text-white transition-colors">
            RL Photo
          </Link>
          <div className="flex items-center gap-3 rounded-full border border-white/[0.12] bg-white/[0.02] px-4 py-2">
            <MediaNotificationsBell />
            <span className="h-3 w-px bg-white/15" />
            <LogoutButton />
          </div>
        </div>
      </nav>

      {/* Telemóvel: as páginas por baixo da pílula, com deslize lateral */}
      <div className="md:hidden max-w-5xl mx-auto mt-2 flex gap-2 overflow-x-auto px-1">
        {NAV.map(n => {
          const ativo = pathname === n.href || pathname.startsWith(n.href + '/')
          return (
            <Link key={n.href} href={n.href}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] ${ativo ? 'border-[#2e6cf6]/60 text-[#5a8bff]' : 'border-white/[0.1] text-white/60'}`}>
              {n.label}
            </Link>
          )
        })}
      </div>
    </header>
    </>
  )
}
