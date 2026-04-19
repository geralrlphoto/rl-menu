import { NextResponse } from 'next/server'

export async function GET() {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>
<body style='margin:0;padding:0;background:#0e0b07;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#0e0b07;padding:40px 16px;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;'>
        <tr><td>
          <img src='https://rl-menu-lake.vercel.app/card_alerta_reuniao_desktop.png'
            alt='Alerta Reuniao - Falta 30 minutos'
            width='600'
            style='display:block;width:100%;height:auto;border:none;' />
        </td></tr>
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
      to: ['ruimngpro@gmail.com'],
      subject: '⏰ A vossa reunião começa em 30 minutos',
      html,
    }),
  })

  const data = await res.json()
  return NextResponse.json(data)
}
