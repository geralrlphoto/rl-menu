import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  // Todas as newsletters (não só as enviadas)
  const { data: newsletters } = await supabase
    .from('newsletters')
    .select('id, title, status, scheduled_for, sent_at, sent_to_count')
    .order('order_index', { ascending: true })
    .limit(10)

  // Subscritores: total, ativos, pendentes
  const { count: totalSubs } = await supabase
    .from('newsletter_subscribers').select('*', { count: 'exact', head: true })
  const { count: activeSubs } = await supabase
    .from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'active')
  const { count: pendingSubs } = await supabase
    .from('newsletter_subscribers').select('*', { count: 'exact', head: true }).eq('status', 'pending')

  // Verifica se ruimngpro existe
  const { data: ruiCheck } = await supabase
    .from('newsletter_subscribers')
    .select('email, nome, status, created_at, source')
    .eq('email', 'ruimngpro@gmail.com')
    .maybeSingle()

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

  return NextResponse.json({
    env,
    subscribers: { total: totalSubs, active: activeSubs, pending: pendingSubs },
    rui_gmail: ruiCheck || '❌ não encontrado',
    newsletters: newsletters?.map(n => ({
      title: n.title,
      status: n.status,
      scheduled_for: n.scheduled_for,
      sent_at: n.sent_at,
      sent_to_count: n.sent_to_count,
    })),
    sends,
    events,
  })
}
