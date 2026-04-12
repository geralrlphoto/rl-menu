import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email_noiva, nome_noiva, nome_noivo } = await req.json().catch(() => ({}))

  if (!email_noiva) {
    return NextResponse.json({ error: 'email_noiva required' }, { status: 400 })
  }

  const nomes = [nome_noiva, nome_noivo].filter(Boolean).join(' & ') || 'Noivos'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <noreply@rlphotovideo.pt>',
      to: [email_noiva],
      subject: 'A vossa maquete do álbum está pronta',
      html: `
        <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 48px 32px; background: #000; color: #fff;">
          <p style="font-size: 10px; letter-spacing: 0.5em; color: #888; text-transform: uppercase; margin: 0 0 32px;">RL PHOTO.VIDEO</p>
          <h1 style="font-size: 22px; font-weight: 300; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 28px; color: #fff;">Maquete do Álbum</h1>
          <p style="font-size: 15px; color: #bbb; line-height: 1.8; margin: 0 0 16px;">Olá ${nomes},</p>
          <p style="font-size: 15px; color: #bbb; line-height: 1.8; margin: 0 0 16px;">Espero que esteja tudo bem.</p>
          <p style="font-size: 15px; color: #bbb; line-height: 1.8; margin: 0 0 32px;">A vossa maquete do álbum já está pronta para aprovação, consultem o vosso portal — <strong style="color: #fff;">FOTOGRAFIAS → VER MAQUETE</strong></p>
          <p style="font-size: 10px; color: #555; letter-spacing: 0.3em; text-transform: uppercase; margin: 48px 0 0;">RL Photo.Video · rlphotovideo.pt</p>
        </div>
      `,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
