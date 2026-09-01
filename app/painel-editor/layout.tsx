import { SidebarMobileToggle } from '@/app/components/SidebarMobileToggle'

// O hamburger vive no layout para servir as 8 páginas do painel sem repetir
// código em cada uma. Em desktop está escondido por CSS.
export default function PainelEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SidebarMobileToggle />
      {children}
    </>
  )
}
