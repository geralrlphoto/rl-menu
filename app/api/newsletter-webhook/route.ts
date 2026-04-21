import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Webhook da Resend. Recebe eventos: email.delivered, email.opened, email.clicked, email.bounced, email.complained
// Configurar em resend.com/webhooks apontando para /api/newsletter-webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const type = body.type
    const data = body.data || {}
    const resendId = data.email_id || data.id

    if (!resendId || !type) return NextResponse.json({ ok: true })

    // Encontrar o envio correspondente
    const { data: send } = await supabase
      .from('newsletter_sends')
      .select('id, newsletter_id, subscriber_id')
      .eq('resend_id', resendId)
      .maybeSingle()

    if (!send) return NextResponse.json({ ok: true, ignored: true })

    // Guardar evento
    const url = data.click?.link || null
    await supabase.from('newsletter_events').insert({
      resend_id: resendId,
      newsletter_id: send.newsletter_id,
      subscriber_id: send.subscriber_id,
      event_type: type,
      url,
      metadata: data,
    })

    // Atualizar newsletter_sends e newsletter (agregados)
    if (type === 'email.delivered') {
      await supabase.from('newsletter_sends').update({ status: 'delivered' }).eq('id', send.id)
      await incrementNewsletter(send.newsletter_id, 'delivered_count')
    }

    if (type === 'email.opened') {
      const { data: current } = await supabase
        .from('newsletter_sends')
        .select('opened_at')
        .eq('id', send.id)
        .single()

      await supabase.from('newsletter_sends').update({
        status: 'opened',
        opened_at: current?.opened_at || new Date().toISOString(),
      }).eq('id', send.id)

      // Incrementar unique_opens apenas na primeira abertura
      if (!current?.opened_at) {
        await incrementNewsletter(send.newsletter_id, 'unique_opens')
      }
      await incrementNewsletter(send.newsletter_id, 'opened_count')
    }

    if (type === 'email.clicked') {
      await supabase.from('newsletter_sends').update({
        status: 'clicked',
        clicked_at: new Date().toISOString(),
        clicked_url: url,
      }).eq('id', send.id)

      await incrementNewsletter(send.newsletter_id, 'clicked_count')
      await incrementNewsletter(send.newsletter_id, 'total_clicks')

      // Classificar tipo de clique
      if (url && url.includes('instagram.com')) {
        await incrementNewsletter(send.newsletter_id, 'ig_clicks')
        await supabase.rpc('increment_sends_field', {
          send_id: send.id, field: 'ig_clicks',
        }).catch(() => {})
      } else if (url && url.includes('rlphotovideo.pt')) {
        await incrementNewsletter(send.newsletter_id, 'share_clicks')
      }
    }

    if (type === 'email.bounced') {
      await supabase.from('newsletter_sends').update({ status: 'bounced' }).eq('id', send.id)
      await incrementNewsletter(send.newsletter_id, 'bounced_count')
      await supabase.from('newsletter_subscribers').update({ status: 'bounced' }).eq('id', send.subscriber_id)
    }

    if (type === 'email.complained') {
      await supabase.from('newsletter_subscribers').update({ status: 'complained' }).eq('id', send.subscriber_id)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[webhook-resend]', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function incrementNewsletter(id: string, field: string) {
  const { data } = await supabase
    .from('newsletters')
    .select(field)
    .eq('id', id)
    .single()
  if (!data) return
  const current = (data as any)[field] || 0
  await supabase.from('newsletters').update({ [field]: current + 1 } as any).eq('id', id)
}

// Resend pode usar GET para verificacao do webhook
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'newsletter-webhook' })
}
