import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const IMG_BASE    = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images'
const ADMIN_URL   = 'https://rl-menu-lake.vercel.app'

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({}))
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar dados do contacto
  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('*')
    .eq('page_token', token)
    .single()

  if (!contact) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  // Marcar alteração pedida
  await supabase
    .from('crm_contacts')
    .update({ page_confirmacao: 'alteracao_pedida' })
    .eq('page_token', token)

  const nome      = contact.nome || 'Lead'
  const data_r    = contact.reuniao_data
    ? new Date(contact.reuniao_data + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '—'
  const hora_r    = (contact.reuniao_hora || '').slice(0, 5) || '—'
  const modo_r    = contact.reuniao_tipo || 'Presencial'
  const crmLink   = `${ADMIN_URL}/crm/${contact.id}`

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">

        <!-- Ornamentos topo -->
        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td></td>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:8px 56px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

          <!-- Logo -->
          <img src="${IMG_BASE}/logo_rl_gold.png" width="80" alt="RL"
            style="display:block;margin:0 auto 24px;width:80px;height:auto;opacity:0.9;" />

          <!-- Ícone alerta -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;width:52px;height:52px;border-radius:50%;border:1.5px solid #e8a020;">
            <tr><td align="center" valign="middle">
              <span style="font-size:22px;color:#e8a020;">&#8635;</span>
            </td></tr>
          </table>

          <!-- Saudação -->
          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Olá, Rui!</p>

          <!-- Título -->
          <p style="margin:0;font-size:38px;font-weight:400;color:#f0e8d8;line-height:1.1;">Pedido de</p>
          <p style="margin:0 0 24px;font-size:38px;font-weight:400;font-style:italic;color:#e8a020;line-height:1.2;">alteração de reunião.</p>

          <!-- Divisor -->
          <div style="margin:0 0 24px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

          <p style="margin:0 0 24px;font-size:15px;color:#a09070;line-height:1.8;">
            O/A cliente <strong style="color:#c9b88a;">${nome}</strong><br>
            solicitou uma <strong style="color:#e8a020;">alteração à reunião marcada.</strong>
          </p>

          <!-- Caixa com detalhes -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:380px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:24px 32px;text-align:center;">
              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Cliente</p>
              <p style="margin:0 0 20px;font-size:24px;font-style:italic;font-weight:400;color:#c9a96e;">${nome}</p>

              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Reunião atual</p>
              <p style="margin:0 0 6px;font-size:14px;color:#d4c9b0;">${data_r}</p>
              <p style="margin:0 0 6px;font-size:14px;color:#d4c9b0;">${hora_r} &nbsp;·&nbsp; ${modo_r}</p>
            </td></tr>
          </table>

          <!-- CTA -->
          <a href="${crmLink}" style="display:inline-block;margin-bottom:24px;padding:14px 32px;background:rgba(232,160,32,0.12);border:0.5px solid #e8a020;color:#e8a020;text-decoration:none;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">
            Ver Ficha do Cliente
          </a>

          <p style="margin:0;font-size:14px;color:#a09070;line-height:1.8;">
            Contacta o cliente para agendar<br>uma nova data de reunião.
          </p>

        </td></tr>

        <!-- Ornamentos base -->
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

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [ADMIN_EMAIL],
      subject: `🔄 Pedido de alteração de reunião — ${nome}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[request-change-email] Resend error:', err)
    return NextResponse.json({ error: 'email_failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
