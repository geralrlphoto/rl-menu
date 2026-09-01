import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'

export async function GET(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: ['ruimngpro@gmail.com'],
      subject: 'Teste Email Freelancer',
      html: '<p>Teste a funcionar</p>',
    }),
  })

  const data = await res.json()
  return NextResponse.json({ status: res.status, data })
}
