import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const IMG_BASE    = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images'

function buildEmail(nome: string, action: 'confirmar' | 'rejeitar'): string {
  const confirmou = action === 'confirmar'
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

          <img src="${IMG_BASE}/logo_rl_gold.png" width="80" alt="RL Photo Video"
            style="display:block;margin:0 auto 24px;width:80px;height:auto;opacity:0.9;" />

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;width:52px;height:52px;border-radius:50%;border:1.5px solid ${confirmou ? '#c9a96e' : '#ef4444'};"><tr><td align="center" valign="middle">
            <span style="font-size:22px;color:${confirmou ? '#c9a96e' : '#ef4444'};">${confirmou ? '&#10003;' : '&#10005;'}</span>
          </td></tr></table>

          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Olá, Rui!</p>

          <p style="margin:0;font-size:38px;font-weight:400;color:#f0e8d8;line-height:1.1;">${confirmou ? 'Proposta' : 'Proposta'}</p>
          <p style="margin:0 0 24px;font-size:38px;font-weight:400;font-style:italic;color:${confirmou ? '#c9a96e' : '#ef4444'};line-height:1.2;">${confirmou ? 'confirmada.' : 'rejeitada.'}</p>

          <div style="margin:0 0 24px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:380px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:22px 32px;text-align:center;">
              <p style="margin:0 0 8px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">${confirmou ? 'Confirmado por' : 'Rejeitado por'}</p>
              <p style="margin:0;font-size:26px;font-style:italic;font-weight:400;color:#c9a96e;line-height:1.2;">${nome}</p>
            </td></tr>
          </table>

          <p style="margin:0;font-size:15px;color:#a09070;line-height:1.8;">
            ${confirmou
              ? 'Os noivos <strong style="color:#c9b88a;font-weight:500;">confirmaram a proposta</strong><br>e foram enviados para o formulário do contrato.'
              : 'Os noivos <strong style="color:#ef4444;font-weight:500;">rejeitaram a proposta.</strong><br>A sua página foi despublicada automaticamente.'}
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
  const { token, action } = await req.json().catch(() => ({}))
  if (!token || !['confirmar', 'rejeitar'].includes(action)) {
    return NextResponse.json({ error: 'token e action obrigatórios' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar o contacto pelo token
  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('id, nome, status, data_fecho')
    .eq('page_token', token)
    .maybeSingle()

  if (!contact) return NextResponse.json({ error: 'Contacto não encontrado' }, { status: 404 })

  const now = new Date().toISOString()
  const updatePayload: Record<string, any> = {
    page_publicada: false,
    status: action === 'confirmar' ? 'Fechou' : 'NÃO FECHOU',
    status_updated_at: now,
    proposta_resposta: action,
  }
  if (action === 'confirmar' && !contact.data_fecho) {
    updatePayload.data_fecho = now
  }

  const { error } = await supabase
    .from('crm_contacts')
    .update(updatePayload)
    .eq('id', contact.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Enviar email ao admin
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [ADMIN_EMAIL],
      subject: action === 'confirmar'
        ? `✓ Proposta confirmada — ${contact.nome ?? 'Noivos'}`
        : `✕ Proposta rejeitada — ${contact.nome ?? 'Noivos'}`,
      html: buildEmail(contact.nome ?? 'Noivos', action),
    }),
  })
  const emailData = await emailRes.json().catch(() => ({}))

  return NextResponse.json({ ok: true, email: emailData })
}
