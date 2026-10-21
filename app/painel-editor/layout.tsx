import { SidebarMobileToggle } from '@/app/components/SidebarMobileToggle'
import '@/app/components/painel-novo.css'

// O hamburger vive no layout para servir as 8 páginas do painel sem repetir
// código em cada uma. Em desktop está escondido por CSS.
export default function PainelEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="painel-novo font-cond text-white">
      <SidebarMobileToggle />
      {children}
    </div>
  )
}
