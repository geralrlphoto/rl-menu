import { NextRequest, NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { emailReuniaoMarcada } from '@/lib/emailsNoivos'

const MEET_LINK = 'https://meet.google.com/dih-etvh-xkh'
const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video/@38.7071885,-9.1450227,17z'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtData(d: string) {
  const [y, m, day] = d.split('-')
  return `${day} de ${MESES[parseInt(m,10)-1]} de ${y}`
}

export async function POST(req: NextRequest) {
  const bloqueio = exigeAdmin(req) // só o admin envia (destinatário vem do pedido)
  if (bloqueio) return bloqueio
  const { email, nome, reuniao_data, reuniao_hora, reuniao_tipo, page_token, page_tipo } = await req.json().catch(() => ({}))

  if (!email || !reuniao_data || !reuniao_hora) {
    return NextResponse.json({ error: 'email, reuniao_data e reuniao_hora são obrigatórios' }, { status: 400 })
  }

  const dataFmt  = fmtData(reuniao_data)
  const isVideo  = reuniao_tipo === 'Videochamada'
  const modoTxt  = isVideo ? 'Videochamada' : 'Presencial'
  const prefix   = page_tipo === 'batizado' ? 'b' : 'r'
  const pageLink = page_token
    ? `https://portal.rlphotovideo.pt/${prefix}/${page_token}`
    : (isVideo ? MEET_LINK : MAPS_LINK)
  const html = emailReuniaoMarcada({ nome, dataFmt, hora: reuniao_hora, modo: modoTxt, link: pageLink, batizado: page_tipo === 'batizado' })

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
