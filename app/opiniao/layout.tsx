import type { Metadata } from 'next'
import type { CSSProperties } from 'react'

// Mesmas letras do portal dos noivos: Jost fino nos títulos, Roboto Condensed no resto.
// Por <link> e não por next/font/google: o Vercel falha a descarregar estas letras no build.
const FONTES_CSS = 'https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,200;0,300;0,400;1,200;1,300;1,400&family=Roboto+Condensed:wght@100;300;400;500;600;700&display=swap'
const FONTES = { '--font-op-jost': "'Jost', sans-serif", '--font-op-cond': "'Roboto Condensed', sans-serif" } as CSSProperties

export const metadata: Metadata = { title: 'A vossa opinião · RL Photo Video', robots: { index: false } }

export default function OpiniaoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={FONTES}>
      <link rel="stylesheet" href={FONTES_CSS} precedence="default" />
      {children}
    </div>
  )
}
