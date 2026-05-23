import { NextRequest, NextResponse } from 'next/server'

type Body = {
  to: string                // email do freelancer
  freelancerNome?: string
  noivos?: string
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { to } = body

  if (!to) {
    return NextResponse.json({ ok: false, error: 'Faltam campos obrigatórios (to)' }, { status: 400 })
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, error: 'RESEND_API_KEY não configurada' }, { status: 500 })
  }

  // Email = apenas o card pré-desenhado em /public/novo-projeto-card.png
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050507;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;padding:24px 12px;">
    <tr><td align="center">
      <img src="https://rl-menu-lake.vercel.app/novo-projeto-card.png"
        alt="Novo projeto atribuído · RL Photo.Video"
        width="440"
        style="display:block;width:100%;max-width:440px;height:auto;border:0;outline:none;text-decoration:none;" />
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
      from: 'RL PROD <geral@rlphotovideo.pt>',
      to: [to],
      subject: `Novo projeto atribuído · RL Photo.Video`,
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: data?.message ?? 'Erro ao enviar email' }, { status: 500 })
  }
  return NextResponse.json({ ok: true, id: data.id })
}
