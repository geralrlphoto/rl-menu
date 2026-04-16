import { NextRequest, NextResponse } from 'next/server'

const CARD_URL  = 'https://rl-menu-lake.vercel.app/card_reuniao_desktop.png'
const MEET_LINK = 'https://meet.google.com/dih-etvh-xkh'
const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video/@38.7071885,-9.1450227,17z'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtData(d: string) {
  const [y, m, day] = d.split('-')
  return `${day} de ${MESES[parseInt(m,10)-1]} de ${y}`
}

export async function POST(req: NextRequest) {
  const { email, reuniao_data, reuniao_hora, reuniao_tipo, page_token } = await req.json().catch(() => ({}))

  if (!email || !reuniao_data || !reuniao_hora) {
    return NextResponse.json({ error: 'email, reuniao_data e reuniao_hora são obrigatórios' }, { status: 400 })
  }

  const dataFmt = fmtData(reuniao_data)
  const isVideo = reuniao_tipo === 'Videochamada'
  const modoTxt = isVideo ? 'Videochamada' : 'Presencial'
  const pageLink = page_token
    ? `https://rl-menu-lake.vercel.app/r/${page_token}`
    : (isVideo ? MEET_LINK : MAPS_LINK)

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#030201;">

<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#030201">
<tr><td align="center" style="padding:0;">

  <!-- CARD: imagem clicável que leva à página do cliente -->
  <table width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">
    <tr>
      <td align="center" style="padding:0;">
        <a href="${pageLink}" target="_blank" style="display:block;text-decoration:none;">
          <img src="${CARD_URL}" width="600" alt="A vossa reunião está marcada"
            style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
        </a>
      </td>
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
