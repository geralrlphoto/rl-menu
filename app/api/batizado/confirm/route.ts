import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const IMG_BASE    = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images'

function buildEmail(nome: string, data: string, hora: string, local: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">

        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td></td>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:8px 56px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

          <img src="https://rl-menu-lake.vercel.app/logo_rl_gold.png" width="80" alt="RL Photo Video"
            style="display:block;margin:0 auto 24px;width:80px;height:auto;opacity:0.9;" />

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;width:52px;height:52px;border-radius:50%;border:1.5px solid #c9a96e;"><tr><td align="center" valign="middle">
            <span style="font-size:22px;color:#c9a96e;">&#10003;</span>
          </td></tr></table>

          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Olá, Rui!</p>

          <p style="margin:0;font-size:38px;font-weight:400;color:#f0e8d8;line-height:1.1;">Reunião</p>
          <p style="margin:0 0 24px;font-size:38px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">confirmada.</p>

          <div style="margin:0 0 24px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:380px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:22px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Confirmado por</p>
              <p style="margin:0 0 16px;font-size:26px;font-style:italic;font-weight:400;color:#c9a96e;line-height:1.2;">${nome || 'Família'}</p>
              ${data ? `<p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Batizado</p>
              <p style="margin:0 0 12px;font-size:15px;font-weight:300;color:#c9b88a;">${data}${hora ? ' · ' + hora : ''}</p>` : ''}
              ${local ? `<p style="margin:0;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">${local}</p>` : ''}
            </td></tr>
          </table>

          <p style="margin:0;font-size:15px;color:#a09070;line-height:1.8;">
            A família <strong style="color:#c9b88a;font-weight:500;">confirmou a reunião</strong><br>através do portal de batizado.
          </p>

        </td></tr>

        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td style="text-align:center;vertical-align:bottom;padding-bottom:20px;">
              <p style="margin:0;font-size:9px;letter-spacing:0.4em;color:#3a2a12;text-transform:uppercase;">RL PHOTO &middot; VIDEO</p>
            </td>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const pageId = `batizado_${token}`

  // Fetch existing settings
  const { data: row } = await supabase
    .from('portal_template_settings')
    .select('settings')
    .eq('page_id', pageId)
    .single()

  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })

  const updatedSettings = { ...(row.settings || {}), page_confirmacao: 'confirmada' }

  const { error } = await supabase
    .from('portal_template_settings')
    .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
    .eq('page_id', pageId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build email context from content.evento
  const evento = row.settings?.content?.evento || {}
  let nome   = evento.nome || ''
  let dataFmt  = evento.data || ''
  let horaFmt  = evento.hora || ''
  let localFmt = evento.local || ''
  try {
    if (evento.data) {
      const d = new Date(evento.data + 'T12:00:00')
      dataFmt = d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    }
  } catch { /* keep raw */ }

  // Fallback ao CRM via page_token — quando o admin não preencheu evento.nome
  // no editor, o nome do cliente está em crm_contacts.nome (mesmo token).
  if (!nome || !dataFmt) {
    const { data: lead } = await supabase
      .from('crm_contacts')
      .select('nome, reuniao_data, reuniao_hora, local_casamento')
      .eq('page_token', token)
      .maybeSingle()
    if (lead) {
      if (!nome && lead.nome) nome = lead.nome
      if (!dataFmt && lead.reuniao_data) {
        try {
          const d = new Date(lead.reuniao_data + 'T12:00:00')
          dataFmt = d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
        } catch { dataFmt = lead.reuniao_data }
      }
      if (!horaFmt && lead.reuniao_hora) horaFmt = lead.reuniao_hora
      if (!localFmt && lead.local_casamento) localFmt = lead.local_casamento
    }
    // Marca também a página_confirmacao no CRM (estava a ficar dessincronizado)
    await supabase
      .from('crm_contacts')
      .update({ page_confirmacao: 'confirmada' })
      .eq('page_token', token)
  } else {
    await supabase
      .from('crm_contacts')
      .update({ page_confirmacao: 'confirmada' })
      .eq('page_token', token)
  }

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [ADMIN_EMAIL],
      subject: `✓ Reunião confirmada (Batizado) — ${nome || 'Família'}`,
      html: buildEmail(nome, dataFmt, horaFmt, localFmt),
    }),
  }).catch(() => {})

  return NextResponse.json({ success: true })
}
