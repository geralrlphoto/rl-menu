import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import GlobalMenu from './components/GlobalMenu'

export const metadata: Metadata = {
  title: 'RL PHOTO.VIDEO',
  description: 'Menu principal RL Photo Video',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const auth = cookieStore.get('rl_auth')?.value
  const isAdmin = auth === process.env.AUTH_SECRET

  return (
    <html lang="pt">
      <body className="bg-dark text-white min-h-screen">
        {isAdmin && <GlobalMenu />}
        {children}
      </body>
    </html>
  )
}
