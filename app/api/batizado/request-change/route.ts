import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const IMG_BASE    = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images'

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({}))
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const pageId = `batizado_${token}`

  const { data: row } = await supabase
    .from('portal_template_settings')
    .select('settings')
    .eq('page_id', pageId)
    .single()

  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Marcar alteração pedida
  const updatedSettings = { ...(row.settings || {}), page_confirmacao: 'alteracao_pedida' }
  await supabase
    .from('portal_template_settings')
    .update({ settings: updatedSettings, updated_at: new Date().toISOString() })
    .eq('page_id', pageId)

  const nome     = row.settings?.content?.evento?.nome || 'Família'
  const reuniao  = row.settings?.content?.reuniao || {}
  let dataFmt    = reuniao.data || '—'
  try {
    if (reuniao.data) {
      const d = new Date(reuniao.data + 'T00:00:00')
      dataFmt = d.toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    }
  } catch { /* keep raw */ }
  const hora_r = (reuniao.hora || '').slice(0, 5) || '—'
  const modo_r = reuniao.tipo || 'Presencial'

  const html = `<!DOCTYPE html>
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
          <img src="https://rl-menu-lake.vercel.app/logo_rl_gold.png" width="80" alt="RL"
            style="display:block;margin:0 auto 24px;width:80px;height:auto;opacity:0.9;" />
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;width:52px;height:52px;border-radius:50%;border:1.5px solid #e8a020;">
            <tr><td align="center" valign="middle">
              <span style="font-size:22px;color:#e8a020;">&#8635;</span>
            </td></tr>
          </table>
          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Olá, Rui!</p>
          <p style="margin:0;font-size:38px;font-weight:400;color:#f0e8d8;line-height:1.1;">Pedido de</p>
          <p style="margin:0 0 24px;font-size:38px;font-weight:400;font-style:italic;color:#e8a020;line-height:1.2;">alteração de reunião.</p>
          <div style="margin:0 0 24px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>
          <p style="margin:0 0 24px;font-size:15px;color:#a09070;line-height:1.8;">
            A família <strong style="color:#c9b88a;">${nome}</strong><br>
            solicitou uma <strong style="color:#e8a020;">alteração à reunião marcada.</strong>
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:380px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:24px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Família</p>
              <p style="margin:0 0 20px;font-size:24px;font-style:italic;font-weight:400;color:#c9a96e;">${nome}</p>
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Reunião atual</p>
              <p style="margin:0 0 6px;font-size:14px;color:#d4c9b0;">${dataFmt}</p>
              <p style="margin:0 0 6px;font-size:14px;color:#d4c9b0;">${hora_r} &nbsp;·&nbsp; ${modo_r}</p>
            </td></tr>
          </table>
          <p style="margin:0;font-size:14px;color:#a09070;line-height:1.8;">
            Contacta a família para agendar<br>uma nova data de reunião.
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

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [ADMIN_EMAIL],
      subject: `🔄 Pedido de alteração de reunião (Batizado) — ${nome}`,
      html,
    }),
  }).catch(() => {})

  return NextResponse.json({ success: true })
}
