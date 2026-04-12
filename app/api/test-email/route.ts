import { NextResponse } from 'next/server'

export async function GET() {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev',
      to: ['ruimngpro@gmail.com'],
      subject: 'RL PHOTO.VIDEO · Teste de Email',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #000; color: #fff;">
          <p style="font-size: 10px; letter-spacing: 0.5em; color: #666; text-transform: uppercase; margin: 0 0 24px;">RL PHOTO.VIDEO</p>
          <h1 style="font-size: 22px; font-weight: 300; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 16px;">Email de Teste</h1>
          <p style="font-size: 14px; color: #aaa; line-height: 1.6;">O sistema de notificações por email está a funcionar corretamente.</p>
        </div>
      `,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
