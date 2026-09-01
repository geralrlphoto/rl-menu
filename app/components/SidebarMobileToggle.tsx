'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Hamburger dos painéis (editor e fotógrafo).
 *
 * A barra lateral destes painéis é `fixed` com 230–250px e o conteúdo tem um
 * `padding-left` igual. Num telemóvel de 375px isso deixava ~135px de conteúdo
 * espremido ao lado de uma barra que ocupava dois terços do ecrã, sem forma de
 * a fechar.
 *
 * Em vez de mexer nas 16 páginas, o estado vive numa classe no <body> e o CSS
 * (globals.css) trata de esconder/mostrar a barra e de tirar o padding. Este
 * componente só rende o botão e faz o toggle.
 */
export function SidebarMobileToggle() {
  const [aberta, setAberta] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    document.body.classList.toggle('sidebar-aberta', aberta)
    return () => document.body.classList.remove('sidebar-aberta')
  }, [aberta])

  // Navegar fecha a barra — senão ficava aberta por cima da página seguinte.
  useEffect(() => { setAberta(false) }, [pathname])

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(v => !v)}
        aria-label={aberta ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={aberta}
        className="painel-hamburger fixed top-3 left-3 z-[60] w-11 h-11 rounded-xl border border-gold/30 bg-black/70 backdrop-blur-md text-gold flex items-center justify-center text-lg"
        style={{ boxShadow: '0 8px 24px -8px rgba(0,0,0,0.7)' }}
      >
        {aberta ? '✕' : '☰'}
      </button>

      {/* Fundo escuro: fechar tocando fora da barra */}
      {aberta && (
        <div
          className="painel-hamburger-fundo fixed inset-0 z-40 bg-black/60"
          onClick={() => setAberta(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
