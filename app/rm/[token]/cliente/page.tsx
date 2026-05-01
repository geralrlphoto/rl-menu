import { cookies } from 'next/headers'
import ClientPortalClient from './ClientPortalClient'

export const dynamic = 'force-dynamic'

export default async function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cookieStore = await cookies()
  const auth = cookieStore.get('rl_auth')?.value
  const isAdmin = auth === process.env.AUTH_SECRET
  return <ClientPortalClient token={token} isAdmin={isAdmin} />
}
