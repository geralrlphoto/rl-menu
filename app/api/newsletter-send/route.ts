import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const html = buildEmailHtml(nl)
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

function esc(s: string) {
  return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function buildEmailHtml(d: any) {
  const sections = (d.sections || []).map((s: any) => `
    <tr><td style="padding:24px 0 8px;">
      <p style="margin:0;font-size:11px;color:#8a7450;letter-spacing:2px;font-family:Arial,sans-serif;">${esc(s.num)}</p>
      <h2 style="margin:4px 0 12px;font-size:22px;font-weight:400;color:#c9a96e;font-family:Georgia,serif;">${esc(s.title)}</h2>
      <p style="margin:0;font-size:14px;line-height:1.8;color:#b3a082;font-family:Arial,sans-serif;">${esc(s.body)}</p>
    </td></tr>
  `).join('')

  const hero = d.hero_image_url ? `<tr><td style="padding:0;"><img src="${esc(d.hero_image_url)}" alt="" style="width:100%;display:block;height:auto;" /></td></tr>` : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
<div style="display:none;max-height:0;overflow:hidden;">${esc(d.preview_text || '')}</div>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#110e08;border:1px solid #7a6340;">
  <tr><td style="padding:40px 40px 24px;text-align:center;border-bottom:1px solid #2a2217;">
    <div style="display:inline-block;width:56px;height:56px;border-radius:50%;border:1px solid #7a6340;line-height:56px;">
      <span style="font-size:18px;font-style:italic;color:#c9a96e;font-family:Georgia,serif;">RL</span>
    </div>
    <p style="margin:14px 0 0;font-size:10px;letter-spacing:3px;color:#8a7450;font-family:Arial,sans-serif;">RL PHOTO &amp; VIDEO</p>
  </td></tr>
  ${hero}
  <tr><td style="padding:40px 40px 0;">
    <h1 style="margin:0;font-size:28px;font-weight:400;color:#fff;line-height:1.25;font-family:Georgia,serif;">${esc(d.subject)}</h1>
    ${d.intro ? `<p style="margin:20px 0 0;font-size:15px;line-height:1.7;color:#c9a96e;font-style:italic;font-family:Georgia,serif;">${esc(d.intro)}</p>` : ''}
  </td></tr>
  <tr><td style="padding:8px 40px 32px;"><table width="100%" cellpadding="0" cellspacing="0">${sections}</table></td></tr>
  ${d.cta_url && d.cta_label ? `<tr><td style="padding:0 40px 48px;text-align:center;">
    <a href="${esc(d.cta_url)}" style="display:inline-block;padding:16px 40px;background:#c9a96e;color:#0e0b06;text-decoration:none;font-family:Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">${esc(d.cta_label)}</a>
  </td></tr>` : ''}
  <tr><td style="padding:24px 40px;background:#0a0804;text-align:center;border-top:1px solid #2a2217;">
    <p style="margin:0;font-size:10px;color:#6a5a3e;font-family:Arial,sans-serif;line-height:1.7;">
      RL PHOTO &amp; VIDEO · rlphotovideo.pt<br>
      <a href="{{unsubscribe_url}}" style="color:#8a7450;">Cancelar subscrição</a>
    </p>
  </td></tr>
</table></td></tr></table></body></html>`
}
