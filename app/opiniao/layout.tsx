import type { Metadata } from 'next'
import { Cormorant_Garamond, Roboto_Condensed } from 'next/font/google'

const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['300', '400', '500'], style: ['normal', 'italic'], variable: '--font-op-serif' })
const cond = Roboto_Condensed({ subsets: ['latin'], weight: ['300', '400', '500', '700'], variable: '--font-op-cond' })

export const metadata: Metadata = { title: 'A vossa opinião · RL Photo Video', robots: { index: false } }

export default function OpiniaoLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${serif.variable} ${cond.variable}`}>{children}</div>
}
