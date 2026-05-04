import { NextRequest, NextResponse } from 'next/server'

const IMG_BASE  = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images'
const MEET_LINK = 'https://meet.google.com/dih-etvh-xkh'
const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video/@38.7071885,-9.1450227,17z'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtData(d: string) {
  const [y, m, day] = d.split('-')
  return `${day} de ${MESES[parseInt(m,10)-1]} de ${y}`
}

export async function POST(req: NextRequest) {
  const { email, nome, reuniao_data, reuniao_hora, reuniao_tipo, page_token } = await req.json().catch(() => ({}))

  if (!email || !reuniao_data || !reuniao_hora) {
    return NextResponse.json({ error: 'email, reuniao_data e reuniao_hora são obrigatórios' }, { status: 400 })
  }

  const dataFmt  = fmtData(reuniao_data)
  const isVideo  = reuniao_tipo === 'Videochamada'
  const modoTxt  = isVideo ? 'Videochamada' : 'Presencial'
  const pageLink = page_token
    ? `https://rl-menu-lake.vercel.app/r/${page_token}`
    : (isVideo ? MEET_LINK : MAPS_LINK)
  const saudacao = nome ? `Olá, ${nome}!` : 'Olá!'

  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">

        <!-- Corner ornaments (top) -->
        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td></td>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:8px 56px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

          <!-- Logo -->
          <img src="${IMG_BASE}/logo_rl_gold.png"
            width="80" alt="RL Photo Video"
            style="display:block;margin:0 auto 24px;width:80px;height:auto;opacity:0.9;" />

          <!-- Check circle -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;width:52px;height:52px;border-radius:50%;border:1.5px solid #c9a96e;"><tr><td align="center" valign="middle">
            <span style="font-size:22px;color:#c9a96e;">&#10003;</span>
          </td></tr></table>

          <!-- Saudação -->
          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">${saudacao}</p>

          <!-- Título principal -->
          <p style="margin:0;font-size:42px;font-weight:400;color:#f0e8d8;line-height:1.1;">Tens uma</p>
          <p style="margin:0 0 24px;font-size:42px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">reuni&atilde;o marcada.</p>

          <!-- Divider -->
          <div style="margin:0 0 24px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

          <!-- Caixa detalhes -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:380px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:24px 32px;text-align:center;">

              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Data</p>
              <p style="margin:0 0 16px;font-size:18px;font-weight:400;color:#c9a96e;line-height:1.3;">${dataFmt}</p>

              <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;width:60%;border-top:0.5px solid #3a2a12;"><tr><td></td></tr></table>

              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Hora</p>
              <p style="margin:0 0 16px;font-size:26px;font-style:italic;font-weight:400;color:#c9a96e;line-height:1.2;">${reuniao_hora}</p>

              <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;width:60%;border-top:0.5px solid #3a2a12;"><tr><td></td></tr></table>

              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Modo</p>
              <p style="margin:0;font-size:13px;color:#d4c9b0;">${modoTxt}</p>

            </td></tr>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
            <tr>
              <td style="background:rgba(201,169,110,0.08);border:0.5px solid #6a5430;">
                <a href="${pageLink}"
                  style="display:block;padding:16px 44px;font-size:9px;letter-spacing:0.5em;color:#c9a96e;text-decoration:none;text-transform:uppercase;white-space:nowrap;font-family:Georgia,'Times New Roman',serif;">
                  Ver Reuni&atilde;o &rarr;
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0;font-size:13px;color:#7a6340;line-height:1.8;">
            Clica no bot&atilde;o acima para acederes<br>a todos os detalhes da reuni&atilde;o.
          </p>

        </td></tr>

        <!-- Corner ornaments (bottom) -->
        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td style="text-align:center;vertical-align:bottom;padding-bottom:20px;">
              <p style="margin:0;font-size:9px;letter-spacing:0.4em;color:#3a2a12;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">RL PHOTO &middot; VIDEO</p>
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
      to: [email],
      subject: `Tens uma reunião marcada · ${dataFmt} às ${reuniao_hora}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
