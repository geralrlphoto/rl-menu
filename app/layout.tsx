import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import './globals.css'
import GlobalMenu from './components/GlobalMenu'
import AdminContentShift from './components/AdminContentShift'

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
      <head>
        {/* Roboto Condensed (font-cond): num <link> próprio, porque o @import do globals.css
            deixa de valer quando o CSS de produção é juntado com outros ficheiros */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@100;300;400;500;600;700&display=swap" />
      </head>
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
