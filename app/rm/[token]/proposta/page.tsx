import { cookies } from 'next/headers'
import RMPropostaClient from './RMPropostaClient'

export const dynamic = 'force-dynamic'

export default async function RMPropostaPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cookieStore = await cookies()
  const auth = cookieStore.get('rl_auth')?.value
  const isAdmin = auth === process.env.AUTH_SECRET
  return <RMPropostaClient token={token} isAdmin={isAdmin} />
}
