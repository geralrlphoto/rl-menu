import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import { Roboto_Condensed } from 'next/font/google'
import GlobalMenu from './components/GlobalMenu'
import AdminContentShift from './components/AdminContentShift'

const cond = Roboto_Condensed({ subsets: ['latin'], weight: ['100', '300', '400', '500', '600', '700'], variable: '--font-cond' })

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
      <body className={`${cond.variable} bg-dark text-white min-h-screen`}>
        {isAdmin && <GlobalMenu />}
        {isAdmin
          ? <AdminContentShift>{children}</AdminContentShift>
          : children
        }
      </body>
    </html>
  )
}
