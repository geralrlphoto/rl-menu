'use client'

// Transição tipo obturador entre páginas: o ecrã fecha num círculo (a partir
// de um ponto) e volta a abrir já na página nova. Fica no layout para não
// desmontar durante a navegação. Para usar:
//   window.dispatchEvent(new CustomEvent('obturador', { detail: { href, x, y } }))

import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

type Fase = 'aberto' | 'fechar' | 'fechado' | 'abrir'
const FECHAR_MS = 550
const ABRIR_MS = 650

export default function Obturador() {
  const router = useRouter()
  const pathname = usePathname()
  const [fase, setFase] = useState<Fase>('aberto')
  const [centro, setCentro] = useState({ x: 50, y: 50 })   // em % do ecrã
  const origem = useRef<string | null>(null)

  // Pedido de transição: fecha e navega
  useEffect(() => {
    const onPedido = (e: Event) => {
      const { href, x, y } = (e as CustomEvent<{ href: string; x?: number; y?: number }>).detail
      origem.current = window.location.pathname
      setCentro({ x: ((x ?? innerWidth / 2) / innerWidth) * 100, y: ((y ?? innerHeight / 2) / innerHeight) * 100 })
      setFase('fechar')
      router.prefetch(href)
      setTimeout(() => { setFase('fechado'); router.push(href) }, FECHAR_MS)
    }
    window.addEventListener('obturador', onPedido)
    return () => window.removeEventListener('obturador', onPedido)
  }, [router])

  // Chegou à página nova: abre a partir do centro
  useEffect(() => {
    if (fase !== 'fechado') return
    const abrir = () => {
      setCentro({ x: 50, y: 50 })
      setFase('abrir')
      setTimeout(() => setFase('aberto'), ABRIR_MS)
    }
    if (pathname !== origem.current) {
      const t = setTimeout(abrir, 120)
      return () => clearTimeout(t)
    }
    // se a página não mudar (erro, mesma página), não fica preso no preto
    const t = setTimeout(abrir, 4000)
    return () => clearTimeout(t)
  }, [pathname, fase])

  if (fase === 'aberto') return null

  // O buraco do obturador é um círculo transparente com uma sombra enorme preta à volta
  return (
    <>
      <style>{`
        @keyframes obtFechar { from { width: 260vmax; height: 260vmax } to { width: 0; height: 0 } }
        @keyframes obtAbrir  { from { width: 0; height: 0 } to { width: 260vmax; height: 260vmax } }
      `}</style>
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'all', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: `${centro.x}%`, top: `${centro.y}%`, transform: 'translate(-50%,-50%)',
          borderRadius: '50%', boxShadow: '0 0 0 260vmax #050505', border: '1px solid rgba(216,190,147,.6)',
          width: fase === 'fechado' ? 0 : undefined, height: fase === 'fechado' ? 0 : undefined,
          animation: fase === 'fechar' ? `obtFechar ${FECHAR_MS}ms cubic-bezier(.7,0,.84,0) forwards`
            : fase === 'abrir' ? `obtAbrir ${ABRIR_MS}ms cubic-bezier(.16,1,.3,1) forwards` : undefined,
        }} />
        {fase === 'fechado' && (
          <div style={{ position: 'absolute', inset: 0, background: '#050505' }} />
        )}
      </div>
    </>
  )
}
