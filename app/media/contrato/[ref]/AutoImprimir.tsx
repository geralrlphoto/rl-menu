'use client'

import { useEffect } from 'react'

// Com ?imprimir=1 (botão "Descarregar PDF" do portal do cliente) abre logo a
// janela de imprimir, onde se escolhe "Guardar como PDF".
export default function AutoImprimir() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('imprimir') !== '1') return
    const t = setTimeout(() => window.print(), 700)
    return () => clearTimeout(t)
  }, [])
  return null
}
