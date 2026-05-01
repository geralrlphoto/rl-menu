import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
function fmtData(d: string) {
  if (!d) return ''
  try {
    const dt = new Date(d + 'T00:00:00')
    return `${String(dt.getDate()).padStart(2,'0')} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`
  } catch { return d }
}

export async function POST(req: NextRequest) {
  const auth = req.cookies.get('rl_auth')?.value
  if (auth !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { lead_id, reuniao_data, reuniao_hora, reuniao_tipo, reuniao_link } = body
  if (!lead_id) return NextResponse.json({ error: 'lead_id required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar dados completos da lead
  const { data: lead } = await supabase
    .from('media_leads')
    .select('*')
    .eq('id', lead_id)
    .single()

  if (!lead) return NextResponse.json({ error: 'lead not found' }, { status: 404 })

  // Reutilizar token existente ou gerar novo
  const isNew  = !lead.page_token
  const token  = lead.page_token || crypto.randomBytes(12).toString('hex')

  const { error } = await supabase
    .from('media_leads')
    .update({
      page_token:    token,
      page_publicada: true,
      reuniao_data:  reuniao_data  || null,
      reuniao_hora:  reuniao_hora  || null,
      reuniao_tipo:  reuniao_tipo  || 'Presencial',
      reuniao_link:  reuniao_link  || null,
      updated_at:    new Date().toISOString(),
    })
    .eq('id', lead_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Enviar email de notificação ao cliente ─────────────────────────────
  if (lead.email?.trim()) {
    try {
      const portalUrl    = `https://rl-menu-lake.vercel.app/rm/${token}`
      const primeiroNome = String(lead.nome).split(' ')[0]
      const dataFmt      = reuniao_data ? fmtData(reuniao_data) : null
      const horaFmt      = reuniao_hora ? String(reuniao_hora).slice(0, 5) : null
      const tipoTxt      = reuniao_tipo || 'Presencial'
      const tipoIcon     = tipoTxt === 'Videochamada' ? '🎥' : '📍'

      const detalhesTr = [
        dataFmt ? `
            <tr>
              <td style="font-size:8px;letter-spacing:5px;color:rgba(180,150,90,0.4);text-transform:uppercase;padding-bottom:10px;">Data</td>
              <td style="font-size:13px;font-weight:300;color:rgba(255,255,255,0.65);text-align:right;letter-spacing:1px;">${dataFmt}</td>
            </tr>
            <tr><td colspan="2" style="border-top:1px solid rgba(180,150,90,0.1);padding:0;font-size:0;">&nbsp;</td></tr>` : '',
        horaFmt ? `
            <tr>
              <td style="font-size:8px;letter-spacing:5px;color:rgba(180,150,90,0.4);text-transform:uppercase;padding-top:10px;padding-bottom:10px;">Hora</td>
              <td style="font-size:13px;font-weight:300;color:rgba(255,255,255,0.65);text-align:right;letter-spacing:2px;font-family:monospace;">${horaFmt}</td>
            </tr>
            <tr><td colspan="2" style="border-top:1px solid rgba(180,150,90,0.1);padding:0;font-size:0;">&nbsp;</td></tr>` : '',
        `<tr>
              <td style="font-size:8px;letter-spacing:5px;color:rgba(180,150,90,0.4);text-transform:uppercase;padding-top:10px;">Modo</td>
              <td style="font-size:13px;font-weight:300;color:rgba(255,255,255,0.65);text-align:right;letter-spacing:1px;">${tipoIcon} ${tipoTxt}</td>
            </tr>`,
      ].filter(Boolean).join('')

      const cardHtml = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080d18;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#080d18;">
<tr><td align="center" style="padding:36px 12px 44px;">

  <table width="500" cellpadding="0" cellspacing="0" style="max-width:500px;width:100%;border-radius:12px;overflow:hidden;border:1px solid rgba(180,150,90,0.18);">

    <!-- Corpo principal -->
    <tr><td style="background:radial-gradient(ellipse 100% 85% at 50% 10%,#1c2a4a 0%,#101928 50%,#080d18 100%);padding:52px 52px 44px;text-align:center;">

      <!-- Logo circular com neon -->
      <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
        width="88" height="88" alt="RL Media"
        style="display:block;margin:0 auto 32px;width:88px;height:88px;object-fit:cover;border-radius:50%;border:1.5px solid rgba(200,170,100,0.65);box-shadow:0 0 10px rgba(200,170,100,0.7),0 0 24px rgba(200,170,100,0.35),0 0 50px rgba(200,170,100,0.15);" />

      <!-- Brand -->
      <p style="margin:0 0 36px;font-size:9px;letter-spacing:7px;color:rgba(180,150,90,0.6);text-transform:uppercase;">
        RL MEDIA &nbsp;&middot;&nbsp; AUDIOVISUAL
      </p>

      <!-- Nome -->
      <h1 style="margin:0 0 10px;font-size:52px;font-weight:400;letter-spacing:12px;color:#c4a46a;text-transform:uppercase;line-height:1;font-family:Georgia,'Times New Roman',serif;">
        ${primeiroNome}
      </h1>

      <!-- Subtítulo -->
      <p style="margin:0 0 40px;font-size:10px;letter-spacing:5px;color:rgba(180,150,90,0.4);text-transform:uppercase;">
        Reunião Marcada
      </p>

      <!-- Separador com diamante -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;width:200px;">
        <tr>
          <td style="border-top:1px solid rgba(180,150,90,0.3);vertical-align:middle;">&nbsp;</td>
          <td style="padding:0 12px;color:rgba(180,150,90,0.6);font-size:9px;white-space:nowrap;line-height:1;">&#9670;</td>
          <td style="border-top:1px solid rgba(180,150,90,0.3);vertical-align:middle;">&nbsp;</td>
        </tr>
      </table>

      <!-- Mensagem -->
      <p style="margin:0 0 28px;font-size:17px;font-weight:300;color:rgba(255,255,255,0.80);line-height:1.4;">
        A tua reunião está marcada.
      </p>

      <!-- Card detalhes da reunião -->
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:32px;border:1px solid rgba(180,150,90,0.2);">
        <tr><td style="background:rgba(0,0,0,0.25);padding:20px 24px;">
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            ${detalhesTr}
          </table>
        </td></tr>
      </table>

      <!-- Botão CTA -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
        <tr>
          <td style="background:rgba(180,150,90,0.12);border:1px solid rgba(180,150,90,0.45);">
            <a href="${portalUrl}"
              style="display:block;padding:16px 40px;font-size:9px;letter-spacing:6px;color:#c4a46a;text-decoration:none;text-transform:uppercase;white-space:nowrap;">
              Confirmar Reunião →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:11px;font-weight:300;color:rgba(255,255,255,0.25);line-height:1.8;">
        Clica no botão acima para confirmar<br>ou pedir uma alteração de data.
      </p>

    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#060a12;border-top:1px solid rgba(180,150,90,0.12);padding:20px 52px;text-align:center;">
      <p style="margin:0;font-size:8px;letter-spacing:6px;color:rgba(180,150,90,0.32);text-transform:uppercase;">
        RL MEDIA &nbsp;&middot;&nbsp; AUDIOVISUAL
      </p>
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
          from: 'RL Media <geral@rlphotovideo.pt>',
          to: [lead.email.trim()],
          subject: isNew
            ? `RL Media — Reunião marcada${dataFmt ? `, ${dataFmt}` : ''}`
            : `RL Media — Reunião atualizada${dataFmt ? `, ${dataFmt}` : ''}`,
          html: cardHtml,
        }),
      })
    } catch (_e) { /* não bloqueia */ }
  }

  return NextResponse.json({ ok: true, token, emailSent: !!lead.email?.trim() })
}
