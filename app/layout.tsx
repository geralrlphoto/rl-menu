import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import GlobalMenu from './components/GlobalMenu'
import AdminContentShift from './components/AdminContentShift'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'RL PHOTO.VIDEO',
  description: 'Menu principal RL Photo Video',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const auth = cookieStore.get('rl_auth')?.value
  const isAdmin = auth === process.env.AUTH_SECRET

  return (
    <html lang="pt" className={cormorant.variable}>
      <body className="bg-dark text-white min-h-screen">
        {isAdmin && <GlobalMenu />}
        {isAdmin
          ? <AdminContentShift>{children}</AdminContentShift>
          : children
        }
      </body>
    </html>
  )
}
