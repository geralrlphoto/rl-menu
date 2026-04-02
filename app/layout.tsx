import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'RL PHOTO.VIDEO',
  description: 'Menu principal RL Photo Video',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className={`${inter.variable} bg-dark text-white min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
