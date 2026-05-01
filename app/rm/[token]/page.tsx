import { cookies } from 'next/headers'
import RMLeadPageClient from './RMLeadPageClient'

export const dynamic = 'force-dynamic'

export default async function RMLeadPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cookieStore = await cookies()
  const auth = cookieStore.get('rl_auth')?.value
  const isAdmin = auth === process.env.AUTH_SECRET
  return <RMLeadPageClient token={token} isAdmin={isAdmin} />
}
