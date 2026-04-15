import { cookies } from 'next/headers'
import PropostaClient from './PropostaClient'

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const cookieStore = await cookies()
  const auth = cookieStore.get('rl_auth')?.value
  const isAdmin = auth === process.env.AUTH_SECRET
  return <PropostaClient token={token} isAdmin={isAdmin} />
}
