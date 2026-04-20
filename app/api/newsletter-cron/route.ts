import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Vercel Cron - corre todas as quintas às 8h
// Procura newsletters agendadas para os próximos 7 dias e avisa o admin por email
export async function GET(req: NextRequest) {
  // Vercel Cron autentica via header
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const in7Days = new Date(); in7Days.setDate(in7Days.getDate() + 7)
  const todayStr = today.toISOString().split('T')[0]
  const in7DaysStr = in7Days.toISOString().split('T')[0]

  // Newsletters agendadas nos próximos 7 dias, ainda não enviadas
  const { data: upcoming } = await supabase
    .from('newsletters')
    .select('*')
    .in('status', ['draft', 'approved'])
    .gte('scheduled_for', todayStr)
    .lte('scheduled_for', in7DaysStr)
    .order('scheduled_for', { ascending: true })

  if (!upcoming || upcoming.length === 0) {
    return NextResponse.json({ ok: true, message: 'Sem newsletters próximas' })
  }

  // Enviar lembrete por email ao admin
  const adminEmail = process.env.NEWSLETTER_ADMIN_EMAIL || 'geral@rlphotovideo.pt'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rl-menu-lake.vercel.app'

  const list = upcoming.map(n => {
    const isComplete = n.intro && Array.isArray(n.sections) && n.sections.length > 0
    const d = new Date(n.scheduled_for + 'T00:00:00')
    const days = Math.round((d.getTime() - today.getTime()) / 86400000)
    return { ...n, isComplete, days }
  })

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0e0b06;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#110e08;border:1px solid #7a6340;">
<tr><td style="padding:40px;">
<p style="margin:0 0 8px;font-size:10px;letter-spacing:3px;color:#8a7450;">LEMBRETE SEMANAL</p>
<h1 style="margin:0 0 24px;font-size:24px;font-weight:400;color:#fff;font-family:Georgia,serif;">
  ${upcoming.length} newsletter${upcoming.length > 1 ? 's' : ''} <em style="color:#c9a96e;">nos próximos 7 dias</em>
</h1>
${list.map(n => `
<div style="padding:16px;border:1px solid #2a2217;margin-bottom:12px;">
  <div style="font-size:10px;color:#c9a96e;letter-spacing:2px;margin-bottom:4px;">
    ${n.days === 0 ? 'HOJE' : n.days === 1 ? 'AMANHÃ' : `EM ${n.days} DIAS`} · ${n.scheduled_for}
  </div>
  <div style="font-size:15px;color:#fff;font-family:Georgia,serif;margin-bottom:6px;">${n.title}</div>
  <div style="font-size:11px;color:${n.isComplete ? '#3ca374' : '#f0b429'};">
    ${n.isComplete ? '✓ Conteúdo completo — pronta a aprovar' : '⚠ Conteúdo por completar'}
  </div>
</div>`).join('')}
<a href="${baseUrl}/newsletter-admin" style="display:inline-block;margin-top:16px;padding:14px 32px;background:#c9a96e;color:#0e0b06;text-decoration:none;font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">
  Abrir Admin
</a>
</td></tr></table></td></tr></table></body></html>`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [adminEmail],
      subject: `Newsletter: ${upcoming.length} agendada${upcoming.length > 1 ? 's' : ''} nos próximos 7 dias`,
      html,
    }),
  })

  return NextResponse.json({ ok: true, count: upcoming.length })
}
