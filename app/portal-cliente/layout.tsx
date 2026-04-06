import { Playfair_Display, Cormorant_Garamond } from 'next/font/google'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['700', '800', '900'],
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  style: ['italic', 'normal'],
  weight: ['300', '400', '500', '600'],
})

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${playfair.variable} ${cormorant.variable}`}>
      {children}
    </div>
  )
}
