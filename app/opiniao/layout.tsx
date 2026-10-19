import type { Metadata } from 'next'
import { Jost, Roboto_Condensed } from 'next/font/google'

// Mesmas letras do portal dos noivos: Jost fino nos títulos, Roboto Condensed no resto
const jost = Jost({ subsets: ['latin'], weight: ['200', '300', '400'], style: ['normal', 'italic'], variable: '--font-op-jost' })
const cond = Roboto_Condensed({ subsets: ['latin'], weight: ['100', '300', '400', '500', '600', '700'], variable: '--font-op-cond' })

export const metadata: Metadata = { title: 'A vossa opinião · RL Photo Video', robots: { index: false } }

export default function OpiniaoLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${jost.variable} ${cond.variable}`}>{children}</div>
}
