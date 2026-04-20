import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import SubscribersClient from './client'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export default async function SubscribersPage() {
  const { data: subs } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  return <SubscribersClient initial={subs || []} />
}
