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

  // Imagem 1080×1080 exibida a 560px → 560px de altura
  // Posições calculadas (% da imagem original → px a 560px):
  //   Linha DATA:  ~67.5% → 378px topo, 30px altura
  //   Linha HORA:  ~70.3% → 394px topo, 30px altura  (378+30 = 408... let me recalculate more precisely)
  //   Linha MODO:  ~73.1% → 409px topo, 30px altura
  //   Botão:       ~83.5% → 468px topo, 40px altura
  //   Coluna label termina: ~35% de 420px (tabela com 70px padding) = 147px → left:217px

  const val = (top: number, txt: string) =>
    `<div style="position:absolute;top:${top}px;left:217px;right:70px;height:30px;line-height:30px;text-align:right;">
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#e8dfc8;padding-right:18px;">${txt}</span>
    </div>`

  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#030201;">

<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#030201" style="background:#030201;padding:0;">
<tr><td align="center">

  <!-- CONTAINER: imagem + valores sobrepostos com position:absolute -->
  <div style="position:relative;display:block;width:560px;max-width:100%;font-size:0;line-height:0;">

    <!-- IMAGEM: exibida exatamente como está, sem alteração -->
    <img src="${IMAGE_URL}" width="560" alt="Reunião Marcada"
      style="display:block;width:560px;max-width:100%;border:0;" />

    <!-- DATA: valor sobreposto na linha DATA -->
    ${val(378, dataFmt)}

    <!-- HORA: valor sobreposto na linha HORA -->
    ${val(408, reuniao_hora)}

    <!-- MODO: valor sobreposto na linha MODO -->
    ${val(438, modoTxt)}

    <!-- BOTÃO: texto sobreposto no botão vazio da imagem -->
    <div style="position:absolute;top:468px;left:70px;right:70px;height:44px;line-height:44px;text-align:center;">
      <a href="${link}"
        style="font-family:Georgia,'Times New Roman',serif;font-size:17px;font-style:italic;font-weight:400;color:#c9a96e;text-decoration:none;letter-spacing:0.04em;">${btnTxt}</a>
    </div>

  </div>

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
