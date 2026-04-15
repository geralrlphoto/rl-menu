import { NextRequest, NextResponse } from 'next/server'

const IMAGE_URL = 'https://rl-menu-lake.vercel.app/card_reuniao_marcada.png'
const MEET_LINK = 'https://meet.google.com/dih-etvh-xkh'
const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video/@38.7071885,-9.1450227,17z'

function fmtData(d: string) {
  const [y, m, day] = d.split('-')
  return `${day} / ${m} / ${y}`
}

export async function POST(req: NextRequest) {
  const { email, reuniao_data, reuniao_hora, reuniao_tipo } = await req.json().catch(() => ({}))

  if (!email || !reuniao_data || !reuniao_hora) {
    return NextResponse.json({ error: 'email, reuniao_data e reuniao_hora são obrigatórios' }, { status: 400 })
  }

  const dataFmt  = fmtData(reuniao_data)
  const isVideo  = reuniao_tipo === 'Videochamada'
  const modoTxt  = isVideo ? 'Videochamada' : 'Presencial'
  const btnTxt   = isVideo ? 'Fazer Reunião' : 'Ver Localização'
  const link     = isVideo ? MEET_LINK : MAPS_LINK

  // Imagem 1080×1080 exibida a 560px → 560px de altura
  // Tabela DATA/HORA/MODO começa a ~372px do topo
  // Cada linha ~30px → 3 linhas = 90px
  // Botão começa a ~474px (~12px gap após tabela)
  // Rodapé da imagem a ~515px

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

    <!-- espaço superior: logo + heading + subtítulo -->
    <tr><td height="372" style="font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- VALORES: sobrepostos sobre as linhas DATA / HORA / MODO da imagem -->
    <tr>
      <td style="padding:0 70px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="148" height="30" style="font-size:0;line-height:0;">&nbsp;</td>
            <td align="right" height="30"
              style="text-align:right;padding:0 18px;font-size:15px;color:#e8dfc8;font-family:Georgia,'Times New Roman',serif;vertical-align:middle;">${dataFmt}</td>
          </tr>
          <tr>
            <td width="148" height="30" style="font-size:0;line-height:0;">&nbsp;</td>
            <td align="right" height="30"
              style="text-align:right;padding:0 18px;font-size:15px;color:#e8dfc8;font-family:Georgia,'Times New Roman',serif;vertical-align:middle;">${reuniao_hora}</td>
          </tr>
          <tr>
            <td width="148" height="30" style="font-size:0;line-height:0;">&nbsp;</td>
            <td align="right" height="30"
              style="text-align:right;padding:0 18px;font-size:15px;color:#e8dfc8;font-family:Georgia,'Times New Roman',serif;vertical-align:middle;">${modoTxt}</td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- gap -->
    <tr><td height="14" style="font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- BOTÃO: sobreposto sobre o botão vazio da imagem -->
    <tr>
      <td style="padding:0 70px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" height="40">
              <a href="${link}"
                style="display:block;padding:10px 40px;font-family:Georgia,'Times New Roman',serif;font-size:17px;font-style:italic;font-weight:400;color:#c9a96e;text-decoration:none;letter-spacing:0.04em;">${btnTxt}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- espaço inferior: rodapé da imagem -->
    <tr><td height="44" style="font-size:0;line-height:0;">&nbsp;</td></tr>

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
