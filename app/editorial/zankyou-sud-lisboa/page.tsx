import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { cookieEditorial, cookieValido, lerEditorial } from '@/lib/editorialAcesso'
import EntradaEditorial from '../EntradaEditorial'
import PortalEvento from './PortalEvento'

/* Portal do evento XIX Zankyou Wedding Club × SUD Lisboa (16/11/2026), onde a RL Photo Video é o vídeo oficial.
   Mesmo sistema dos editoriais: senha "RL.XXXXXX" (lib/editorialAcesso.ts), entregas geridas na janela do +
   em /portais-clientes (lib/editoriaisEntregas.ts). O desenho do portal está em PortalEvento.tsx.
   Fonte do programa e dos contactos: site oficial do evento (thatstheone.com) e lista dos parceiros. */

export const metadata: Metadata = {
  title: 'XIX Zankyou Wedding Club × SUD Lisboa',
  description: 'Portal do evento: localização, meteorologia, programa, parceiros e entregas. RL Photo Video.',
  robots: { index: false, follow: false },
}

const SLUG = 'zankyou-sud-lisboa'

export default async function ZankyouSudLisboaPage() {
  // Só entra quem tem a senha do portal (cookie assinado) ou a sessão de admin
  const c = await cookies()
  const admin = !!process.env.AUTH_SECRET && c.get('rl_auth')?.value === process.env.AUTH_SECRET
  const ed = await lerEditorial(SLUG)
  if (!admin && !cookieValido(SLUG, ed.senhaHash, c.get(cookieEditorial(SLUG))?.value)) {
    return <EntradaEditorial slug={SLUG} parceiros={['Zankyou', 'SUD Lisboa', 'RL Photo Video']}
      titulo={<>Wedding <em>Club</em></>} fundo="/editorial/zankyou-sud-lisboa/sud-terrazza.webp" />
  }
  return <PortalEvento entregas={ed.entregas} />
}
