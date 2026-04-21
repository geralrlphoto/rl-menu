import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  // Últimas 5 newsletters enviadas
  const { data: newsletters } = await supabase
    .from('newsletters')
    .select('id, title, status, sent_at, sent_to_count, delivered_count, unique_opens')
    .eq('status', 'sent')
    .order('sent_at', { ascending: false })
    .limit(5)

  // Últimos 10 envios individuais
  const { data: sends } = await supabase
    .from('newsletter_sends')
    .select('*, newsletter:newsletters(title), subscriber:newsletter_subscribers(email)')
    .order('sent_at', { ascending: false })
    .limit(10)

  // Últimos 10 eventos webhook
  const { data: events } = await supabase
    .from('newsletter_events')
    .select('event_type, url, created_at')
    .order('created_at', { ascending: false })
    .limit(10)

  // Status das env vars
  const env = {
    has_resend_key: !!process.env.RESEND_API_KEY,
    has_admin_key: !!process.env.NEWSLETTER_ADMIN_KEY,
    has_base_url: !!process.env.NEXT_PUBLIC_BASE_URL,
    base_url: process.env.NEXT_PUBLIC_BASE_URL || '(não definido)',
  }

  return NextResponse.json({ env, newsletters, sends, events })
}
