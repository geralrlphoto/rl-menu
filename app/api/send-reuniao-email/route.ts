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

  const dataFmt = fmtData(reuniao_data)
  const isVideo = reuniao_tipo === 'Videochamada'
  const modoTxt = isVideo ? 'Videochamada' : 'Presencial'
  const btnTxt  = isVideo ? 'Fazer Reunião' : 'Ver Localização'
  const link    = isVideo ? MEET_LINK : MAPS_LINK

  // Card 1080×1080 exibido a 560×560px.
  // Linha de espaçamento para chegar à secção retangular: 372px
  // 3 linhas (DATA/HORA/MODO) × 30px = 90px → até 462px
  // Gap: 10px → 472px
  // Botão: 44px → 516px
  // Rodapé: 44px → 560px total
  // Coluna esquerda (padding + label): 218px
  // Padding direito: 70px

  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030201;">

<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#030201">
<tr><td align="center">

  <table width="560" cellpadding="0" cellspacing="0" bgcolor="#030201"
    style="width:560px;max-width:100%;
           background-image:url(${IMAGE_URL});
           background-size:560px 560px;
           background-repeat:no-repeat;
           background-position:top left;">

    <!-- ESPAÇO SUPERIOR: topo do card até à secção retangular -->
    <tr><td colspan="2" height="372" style="font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- DATA -->
    <tr>
      <td width="218" height="30" style="padding-left:70px;vertical-align:middle;
          font-family:Georgia,'Times New Roman',serif;font-size:13px;
          color:#e8dfc8;letter-spacing:0.08em;line-height:30px;">Data</td>
      <td height="30" style="padding-right:70px;text-align:right;vertical-align:middle;
          font-family:Georgia,'Times New Roman',serif;font-size:15px;
          color:#e8dfc8;line-height:30px;">${dataFmt}</td>
    </tr>

    <!-- HORA -->
    <tr>
      <td width="218" height="30" style="padding-left:70px;vertical-align:middle;
          font-family:Georgia,'Times New Roman',serif;font-size:13px;
          color:#e8dfc8;letter-spacing:0.08em;line-height:30px;">Hora</td>
      <td height="30" style="padding-right:70px;text-align:right;vertical-align:middle;
          font-family:Georgia,'Times New Roman',serif;font-size:15px;
          color:#e8dfc8;line-height:30px;">${reuniao_hora}</td>
    </tr>

    <!-- MODO -->
    <tr>
      <td width="218" height="30" style="padding-left:70px;vertical-align:middle;
          font-family:Georgia,'Times New Roman',serif;font-size:13px;
          color:#e8dfc8;letter-spacing:0.08em;line-height:30px;">Modo</td>
      <td height="30" style="padding-right:70px;text-align:right;vertical-align:middle;
          font-family:Georgia,'Times New Roman',serif;font-size:15px;
          color:#e8dfc8;line-height:30px;">${modoTxt}</td>
    </tr>

    <!-- GAP antes do botão -->
    <tr><td colspan="2" height="10" style="font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- BOTÃO -->
    <tr>
      <td colspan="2" height="44" align="center"
        style="text-align:center;vertical-align:middle;padding:0 70px;">
        <a href="${link}"
          style="font-family:Georgia,'Times New Roman',serif;font-size:17px;
                 font-style:italic;font-weight:400;color:#c9a96e;
                 text-decoration:none;letter-spacing:0.04em;">${btnTxt}</a>
      </td>
    </tr>

    <!-- ESPAÇO INFERIOR: rodapé do card -->
    <tr><td colspan="2" height="44" style="font-size:0;line-height:0;">&nbsp;</td></tr>

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
