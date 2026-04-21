import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Vercel Cron — corre todos os dias às 8h.
// Avisa o admin 1 dia antes de cada envio agendado.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Calcular data de amanhã
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  // Newsletter agendada para amanhã, ainda não enviada
  const { data: upcoming } = await supabase
    .from('newsletters')
    .select('*')
    .in('status', ['draft', 'approved'])
    .eq('scheduled_for', tomorrowStr)

  if (!upcoming || upcoming.length === 0) {
    return NextResponse.json({ ok: true, message: 'Nenhuma newsletter para amanhã' })
  }

  const adminEmail = process.env.NEWSLETTER_ADMIN_EMAIL || 'geral@rlphotovideo.pt'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rl-menu-lake.vercel.app'

  // Enviar uma notificação por newsletter (normalmente há só 1)
  for (const n of upcoming) {
    const isComplete = n.intro && Array.isArray(n.sections) && n.sections.length > 0
    const fmtDate = new Date(n.scheduled_for + 'T00:00:00').toLocaleDateString('pt-PT', {
      weekday: 'long', day: '2-digit', month: 'long',
    })

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Newsletter amanhã</title></head>
<body style="margin:0;padding:0;background:#0c0907;font-family:'Montserrat',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0c0907;padding:40px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#1a1410;border:1px solid rgba(201,168,76,0.2);">
  <tr><td style="padding:40px;text-align:center;">
    <p style="margin:0 0 8px;font-size:10px;letter-spacing:4px;color:#c9a84c;text-transform:uppercase;">
      🔔 Amanhã
    </p>
    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:30px;font-weight:400;color:#f5f0e8;line-height:1.2;">
      Newsletter <em style="color:#c9a84c;">para enviar amanhã</em>
    </h1>
    <p style="margin:0 0 32px;font-size:13px;color:#a09585;">
      ${fmtDate}
    </p>
  </td></tr>

  <tr><td style="padding:0 40px 32px;">
    <div style="background:rgba(201,168,76,0.06);border-left:3px solid #c9a84c;padding:24px;">
      <p style="margin:0 0 6px;font-size:10px;letter-spacing:3px;color:#c9a84c;text-transform:uppercase;">
        ${n.category || ''}
      </p>
      <h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:22px;font-weight:400;color:#f5f0e8;line-height:1.3;">
        ${escapeHtml(n.title || '')}
      </h2>
      <p style="margin:0 0 14px;font-size:13px;color:#a09585;line-height:1.6;">
        ${escapeHtml(n.subject || '')}
      </p>
      <p style="margin:0;font-size:12px;font-weight:600;color:${isComplete ? '#3ca374' : '#f0b429'};">
        ${isComplete ? '✓ Conteúdo completo — pronta a aprovar' : '⚠ Conteúdo por completar'}
      </p>
    </div>
  </td></tr>

  <tr><td style="padding:0 40px 40px;text-align:center;">
    <table cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
      <td style="background:#c9a84c;padding:16px 40px;">
        <a href="${baseUrl}/newsletter-admin/${n.id}" style="display:block;color:#0c0907;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;">
          Rever e Aprovar
        </a>
      </td>
    </tr></table>
    <p style="margin:20px 0 0;font-size:11px;color:#6a5a3e;">
      Se não aprovares, não será enviada automaticamente.
    </p>
  </td></tr>

  <tr><td style="padding:20px 40px;text-align:center;background:rgba(12,9,7,0.5);border-top:1px solid rgba(201,168,76,0.1);">
    <p style="margin:0;font-size:10px;color:#8a7450;letter-spacing:2px;">RL PHOTO &amp; VIDEO · Lembrete automático</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: [adminEmail],
        subject: `🔔 Newsletter para enviar amanhã: ${n.title}`,
        html,
      }),
    })
  }

  return NextResponse.json({ ok: true, notified: upcoming.length })
}

function escapeHtml(s: string): string {
  return (s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}
