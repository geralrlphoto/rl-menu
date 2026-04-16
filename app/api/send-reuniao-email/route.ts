import { NextRequest, NextResponse } from 'next/server'

const IMAGE_URL = 'https://rl-menu-lake.vercel.app/card_reuniao_marcada.png'
const MEET_LINK = 'https://meet.google.com/dih-etvh-xkh'
const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video/@38.7071885,-9.1450227,17z'

function fmtData(d: string) {
  const [y, m, day] = d.split('-')
  return `${day} / ${m} / ${y}`
}

export async function POST(req: NextRequest) {
  const { email, reuniao_data, reuniao_hora, reuniao_tipo, page_token } = await req.json().catch(() => ({}))

  if (!email || !reuniao_data || !reuniao_hora) {
    return NextResponse.json({ error: 'email, reuniao_data e reuniao_hora são obrigatórios' }, { status: 400 })
  }

  const dataFmt = fmtData(reuniao_data)
  const isVideo = reuniao_tipo === 'Videochamada'
  const modoTxt = isVideo ? 'Videochamada' : 'Presencial'
  const btnTxt  = 'A vossa página'
  const link    = page_token
    ? `https://rl-menu-lake.vercel.app/r/${page_token}`
    : (isVideo ? MEET_LINK : MAPS_LINK)

  // Card 1080×1080 → exibido a 560×560px (quadrado 1:1).
  // Proporções dos espaçadores relativamente à largura (560px = 100%):
  //   sp-top : 372px = 66.43%
  //   sp-row : 30px  =  5.36%   (DATA / HORA / MODO)
  //   sp-gap : 10px  =  1.79%
  //   sp-btn : 44px  =  7.86%
  //   sp-bot : 44px  =  7.86%
  //   Total  : 560px = 100%  ✓
  // No mobile estes % são convertidos em vw para escalar com o ecrã.

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    @media screen and (max-width:560px) {
      .card-wrap  { width:100% !important; background-size:100% auto !important; }
      .sp-top     { height:66.4vw  !important; }
      .sp-row     { height:5.4vw   !important; line-height:5.4vw  !important; }
      .sp-gap     { height:1.8vw   !important; }
      .sp-btn     { height:7.9vw   !important; line-height:7.9vw  !important; }
      .sp-bot     { height:7.9vw   !important; }
      .lbl-cell   { width:38.9vw   !important; padding-left:12.5vw !important;
                    font-size:2.3vw !important; line-height:5.4vw  !important; }
      .val-cell   { padding-right:12.5vw !important;
                    font-size:2.7vw  !important; line-height:5.4vw !important; }
      .btn-cell   { padding:0 12.5vw !important;
                    font-size:3vw    !important; line-height:7.9vw !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#030201;">

<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#030201">
<tr><td align="center">

  <table class="card-wrap" width="560" cellpadding="0" cellspacing="0" bgcolor="#030201"
    style="width:560px;max-width:100%;
           background-image:url(${IMAGE_URL});
           background-size:560px 560px;
           background-repeat:no-repeat;
           background-position:top left;">

    <!-- ESPAÇO SUPERIOR: topo do card até à secção retangular -->
    <tr>
      <td colspan="2" class="sp-top" height="372"
        style="font-size:0;line-height:0;">&nbsp;</td>
    </tr>

    <!-- DATA -->
    <tr>
      <td class="lbl-cell" width="218" height="30"
        style="padding-left:70px;vertical-align:middle;
               font-family:Georgia,'Times New Roman',serif;font-size:13px;
               color:#e8dfc8;letter-spacing:0.08em;line-height:30px;">Data</td>
      <td class="val-cell sp-row" height="30"
        style="padding-right:70px;text-align:right;vertical-align:middle;
               font-family:Georgia,'Times New Roman',serif;font-size:15px;
               color:#e8dfc8;line-height:30px;">${dataFmt}</td>
    </tr>

    <!-- HORA -->
    <tr>
      <td class="lbl-cell" width="218" height="30"
        style="padding-left:70px;vertical-align:middle;
               font-family:Georgia,'Times New Roman',serif;font-size:13px;
               color:#e8dfc8;letter-spacing:0.08em;line-height:30px;">Hora</td>
      <td class="val-cell sp-row" height="30"
        style="padding-right:70px;text-align:right;vertical-align:middle;
               font-family:Georgia,'Times New Roman',serif;font-size:15px;
               color:#e8dfc8;line-height:30px;">${reuniao_hora}</td>
    </tr>

    <!-- MODO -->
    <tr>
      <td class="lbl-cell" width="218" height="30"
        style="padding-left:70px;vertical-align:middle;
               font-family:Georgia,'Times New Roman',serif;font-size:13px;
               color:#e8dfc8;letter-spacing:0.08em;line-height:30px;">Modo</td>
      <td class="val-cell sp-row" height="30"
        style="padding-right:70px;text-align:right;vertical-align:middle;
               font-family:Georgia,'Times New Roman',serif;font-size:15px;
               color:#e8dfc8;line-height:30px;">${modoTxt}</td>
    </tr>

    <!-- GAP antes do botão -->
    <tr>
      <td colspan="2" class="sp-gap" height="10"
        style="font-size:0;line-height:0;">&nbsp;</td>
    </tr>

    <!-- BOTÃO -->
    <tr>
      <td colspan="2" class="btn-cell sp-btn" height="44" align="center"
        style="text-align:center;vertical-align:middle;padding:0 70px;">
        <a href="${link}"
          style="font-family:Georgia,'Times New Roman',serif;font-size:17px;
                 font-style:italic;font-weight:400;color:#c9a96e;
                 text-decoration:none;letter-spacing:0.04em;">${btnTxt}</a>
      </td>
    </tr>

    <!-- ESPAÇO INFERIOR: rodapé do card -->
    <tr>
      <td colspan="2" class="sp-bot" height="44"
        style="font-size:0;line-height:0;">&nbsp;</td>
    </tr>

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
