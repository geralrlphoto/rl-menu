import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RL PHOTO.VIDEO',
  description: 'Menu principal RL Photo Video',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <body className="bg-dark text-white min-h-screen">
        {children}
      </body>
    </html>
  )
}
