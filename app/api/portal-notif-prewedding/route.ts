import { NextRequest, NextResponse } from 'next/server'

const CARD_URL = 'https://rl-menu-lake.vercel.app/card_prewedding_marcar_mobile.png'

export async function POST(req: NextRequest) {
  const { emailNoiva } = await req.json().catch(() => ({}))
  if (!emailNoiva) {
    return NextResponse.json({ error: 'emailNoiva obrigatório' }, { status: 400 })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [emailNoiva],
      subject: 'O seu Pré-Wedding — RL Photo.Video',
      html: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#000000;"><img src="${CARD_URL}" alt="Pré-Wedding" style="display:block;width:100%;max-width:100%;height:auto;" /></body></html>`,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) return NextResponse.json({ error: data }, { status: 500 })
  return NextResponse.json({ ok: true, email: data })
}
