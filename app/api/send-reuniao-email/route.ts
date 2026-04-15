import { NextRequest, NextResponse } from 'next/server'

// Imagem de fundo: card design sem placeholders, espaço vazio no meio para os dados
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

  // Imagem 1080×1080 → exibida a 560px de largura → altura = 560px
  // O espaço vazio (abaixo do subtítulo, acima do rodapé) começa ~57% = 320px
  // Espaço disponível até ao rodapé: ~560 - 320 - 40(footer) = 200px
  // Info box (3 linhas ~38px) = ~116px  |  gap 12px  |  botão ~56px  = ~184px ✓
  const bg = '#0c0806'

  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030201;">

<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#030201" style="background:#030201;">
<tr><td align="center">

  <table width="560" cellpadding="0" cellspacing="0" bgcolor="#0c0806"
    style="max-width:560px;width:100%;
           background-image:url(${IMAGE_URL});
           background-size:100% auto;
           background-repeat:no-repeat;
           background-position:top center;">

    <!-- ESPAÇO SUPERIOR: logo + heading + subtítulo da imagem -->
    <tr><td height="320" style="font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- DATA / HORA / LOCAL -->
    <tr>
      <td style="padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2a1e0e;">
          <tr>
            <td align="left" width="90" valign="middle" bgcolor="${bg}"
              style="background-color:${bg};text-align:left;padding:11px 18px;border-bottom:1px solid #2e2416;border-right:1px solid #2e2416;font-size:9px;letter-spacing:0.4em;color:#7a6030;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;white-space:nowrap;">DATA</td>
            <td align="right" valign="middle" bgcolor="${bg}"
              style="background-color:${bg};text-align:right;padding:11px 18px;border-bottom:1px solid #2e2416;font-size:16px;color:#e8dfc8;font-family:Georgia,'Times New Roman',serif;">${dataFmt}</td>
          </tr>
          <tr>
            <td align="left" width="90" valign="middle" bgcolor="${bg}"
              style="background-color:${bg};text-align:left;padding:11px 18px;border-bottom:1px solid #2e2416;border-right:1px solid #2e2416;font-size:9px;letter-spacing:0.4em;color:#7a6030;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;white-space:nowrap;">HORA</td>
            <td align="right" valign="middle" bgcolor="${bg}"
              style="background-color:${bg};text-align:right;padding:11px 18px;border-bottom:1px solid #2e2416;font-size:16px;color:#e8dfc8;font-family:Georgia,'Times New Roman',serif;">${reuniao_hora}</td>
          </tr>
          <tr>
            <td align="left" width="90" valign="middle" bgcolor="${bg}"
              style="background-color:${bg};text-align:left;padding:11px 18px;border-right:1px solid #2e2416;font-size:9px;letter-spacing:0.4em;color:#7a6030;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;white-space:nowrap;">LOCAL</td>
            <td align="right" valign="middle" bgcolor="${bg}"
              style="background-color:${bg};text-align:right;padding:11px 18px;font-size:16px;color:#e8dfc8;font-family:Georgia,'Times New Roman',serif;">${localTxt}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- gap -->
    <tr><td height="12" style="font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- BOTÃO -->
    <tr>
      <td style="padding:0 40px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" bgcolor="${bg}" style="background-color:${bg};border:1px solid #c9a96e;">
              <a href="${link}"
                style="display:block;padding:17px 40px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-style:italic;font-weight:400;color:#c9a96e;text-decoration:none;letter-spacing:0.04em;">Aceder à Reunião</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- ESPAÇO INFERIOR: rodapé da imagem -->
    <tr><td height="42" style="font-size:0;line-height:0;">&nbsp;</td></tr>

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
