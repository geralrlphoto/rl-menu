import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import TicketAccess from './TicketAccess'

export const dynamic = 'force-dynamic'

export default async function TicketFotosDiaPage() {
  const c = await cookies()
  const isAdmin = c.get('rl_auth')?.value === process.env.AUTH_SECRET

  let password = ''
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    const { data } = await supabase.from('app_config').select('value').eq('key', 'ticket_password').maybeSingle()
    password = (data?.value ?? '').trim()
  } catch {}

  return <TicketAccess isAdmin={isAdmin} hasPassword={!!password} adminPassword={isAdmin ? password : ''} />
}
