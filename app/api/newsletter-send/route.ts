import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildNewsletterHtml } from '../_lib/newsletterTemplate'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const maxDuration = 60

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.NEWSLETTER_ADMIN_KEY) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { newsletter_id } = await req.json()
    if (!newsletter_id) return NextResponse.json({ error: 'newsletter_id obrigatório' }, { status: 400 })

    const { data: nl, error: nErr } = await supabase
      .from('newsletters')
      .select('*')
      .eq('id', newsletter_id)
      .maybeSingle()

    if (nErr || !nl) return NextResponse.json({ error: 'Newsletter não encontrada' }, { status: 404 })
    if (nl.status === 'sent') return NextResponse.json({ error: 'Já foi enviada' }, { status: 400 })

    const { data: subs, error: sErr } = await supabase
      .from('newsletter_subscribers')
      .select('id, email, nome, confirmation_token')
      .eq('status', 'active')

    if (sErr) throw sErr
    if (!subs || subs.length === 0) {
      await supabase.from('newsletters').update({
        status: 'sent', sent_at: new Date().toISOString(), sent_to_count: 0,
      }).eq('id', newsletter_id)
      return NextResponse.json({ ok: true, sent: 0, total: 0, failed: 0, message: 'Sem subscritores' })
    }

    const html = buildNewsletterHtml(nl)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rl-menu-lake.vercel.app'

    let sent = 0, failed = 0
    const batchSize = 50

    for (let i = 0; i < subs.length; i += batchSize) {
      const batch = subs.slice(i, i + batchSize)
      const emails = batch.map(sub => ({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: [sub.email],
        subject: nl.subject,
        html: html.replace(/\{\{unsubscribe_url\}\}/g, `${baseUrl}/api/newsletter-unsubscribe?token=${sub.confirmation_token}`),
      }))

      try {
        const res = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emails),
        })
        const result = await res.json()
        if (res.ok && result.data) {
          sent += result.data.length
          const sends = result.data.map((r: any, idx: number) => ({
            newsletter_id, subscriber_id: batch[idx].id, resend_id: r.id, status: 'sent',
          }))
          await supabase.from('newsletter_sends').insert(sends)
        } else {
          failed += batch.length
          console.error('[newsletter-send] batch failed:', result)
        }
      } catch (e) {
        failed += batch.length
        console.error('[newsletter-send] batch error:', e)
      }

      if (i + batchSize < subs.length) await new Promise(r => setTimeout(r, 1000))
    }

    await supabase.from('newsletters').update({
      status: 'sent', sent_at: new Date().toISOString(), sent_to_count: sent,
    }).eq('id', newsletter_id)

    return NextResponse.json({ ok: true, sent, failed, total: subs.length })
  } catch (err: any) {
    console.error('[newsletter-send]', err)
    return NextResponse.json({ error: err.message || 'Erro' }, { status: 500 })
  }
}

