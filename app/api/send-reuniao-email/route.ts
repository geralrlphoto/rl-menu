import { NextRequest, NextResponse } from 'next/server'

const IMAGE_URL = 'https://rl-menu-lake.vercel.app/card_reuniao_marcada.png'

function fmtData(d: string) {
  const [y, m, day] = d.split('-')
  return `${day} / ${m} / ${y}`
}

export async function POST(req: NextRequest) {
  const { email, reuniao_data, reuniao_hora, reuniao_tipo, reuniao_link } = await req.json().catch(() => ({}))

  if (!email || !reuniao_data || !reuniao_hora) {
    return NextResponse.json({ error: 'email, reuniao_data e reuniao_hora são obrigatórios' }, { status: 400 })
  }

  const dataFmt  = fmtData(reuniao_data)
  const isVideo  = reuniao_tipo === 'Videochamada'
  const localTxt = isVideo ? 'Videochamada · Google Meet' : 'Estúdio RL Photo.Video'
  const link     = reuniao_link || '#'

  // Image is 1080×1080. Displayed at 560px wide → 560px tall (square).
  // Info box in image starts at ~57% from top  = 319px
  // Each row height in image ~7.3%             =  41px  (×3 = 123px)
  // Gap between info box and button  ~1.3%     =   7px
  // Button height in image ~9.8%               =  55px
  // Bottom spacer (footer area)                =  56px
  // Total: 319 + 123 + 7 + 55 + 56 = 560px ✓

  const cellBg = '#0e0906'
  const row = (label: string, value: string, border: boolean) => {
    const b = border ? 'border-bottom:1px solid #2e2416;' : ''
    return `<tr>
      <td align="left" width="90" valign="middle" bgcolor="${cellBg}" style="background-color:${cellBg};text-align:left;padding:11px 18px;${b}border-right:1px solid #2e2416;font-size:9px;letter-spacing:0.4em;color:#7a6030;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;white-space:nowrap;">${label}</td>
      <td align="right" valign="middle" bgcolor="${cellBg}" style="background-color:${cellBg};text-align:right;padding:11px 18px;${b}font-size:16px;color:#e8dfc8;font-family:Georgia,'Times New Roman',serif;">${value}</td>
    </tr>`
  }

  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050302;">

<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#050302" style="background:#050302;padding:20px 16px;">
<tr><td align="center">

  <table width="560" cellpadding="0" cellspacing="0" bgcolor="#080503"
    style="max-width:560px;width:100%;background-image:url(${IMAGE_URL});background-size:100% auto;background-repeat:no-repeat;background-position:top center;">

    <!-- top spacer: logo + heading + subtitle area of the image -->
    <tr><td height="319" style="font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- INFO BOX OVERLAY — cobre os placeholders da imagem -->
    <tr>
      <td style="padding:0 41px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2a1e0e;">
          ${row('DATA',  dataFmt,     true)}
          ${row('HORA',  reuniao_hora, true)}
          ${row('LOCAL', localTxt,    false)}
        </table>
      </td>
    </tr>

    <!-- gap -->
    <tr><td height="7" style="font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- BUTTON OVERLAY -->
    <tr>
      <td style="padding:0 41px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" bgcolor="${cellBg}" style="background-color:${cellBg};border:1px solid #c9a96e;">
              <a href="${link}" style="display:block;padding:18px 40px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-style:italic;font-weight:400;color:#c9a96e;text-decoration:none;letter-spacing:0.04em;">Aceder à Reunião</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- bottom spacer: footer area of the image -->
    <tr><td height="56" style="font-size:0;line-height:0;">&nbsp;</td></tr>

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
      subject: `A vossa reunião está marcada · ${dataFmt} às ${reuniao_hora}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
