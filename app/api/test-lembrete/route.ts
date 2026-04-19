import { NextResponse } from 'next/server'

export async function GET() {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<link href='https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Montserrat:wght@300;400;500&display=swap' rel='stylesheet'>
</head>
<body style='margin:0;padding:0;background:#0c0905;font-family:Georgia,serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#0c0905;padding:40px 16px;'>
    <tr><td align='center'>
      <table width='560' cellpadding='0' cellspacing='0' style='max-width:560px;width:100%;background:linear-gradient(160deg,#110d07 0%,#0c0905 60%,#130e08 100%);border:0.5px solid #3a2a12;position:relative;'>

        <!-- Cantos topo -->
        <tr><td style='padding:0;'>
          <table width='100%' cellpadding='0' cellspacing='0'><tr>
            <td style='width:50px;height:50px;border-top:1px solid #C9A84C;border-left:1px solid #C9A84C;'></td>
            <td></td>
            <td style='width:50px;height:50px;border-top:1px solid #C9A84C;border-right:1px solid #C9A84C;'></td>
          </tr></table>
        </td></tr>

        <!-- Conteúdo -->
        <tr><td style='padding:10px 56px 40px;text-align:center;'>

          <!-- Logo -->
          <img src='https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png'
            width='64' alt='RL Photo Video'
            style='display:block;margin:0 auto 28px;width:64px;height:auto;opacity:0.9;' />

          <!-- Ícone relógio -->
          <table cellpadding='0' cellspacing='0' style='margin:0 auto 20px;'>
            <tr><td style='width:60px;height:60px;border-radius:50%;border:1.5px solid #C9A84C;text-align:center;vertical-align:middle;'>
              <span style='font-size:26px;'>⏰</span>
            </td></tr>
          </table>

          <!-- Olá Noivos -->
          <p style='margin:0 0 6px;font-family:Georgia,serif;font-style:italic;font-weight:300;font-size:22px;color:#C9A84C;'>Olá, Noivos!</p>

          <!-- Título -->
          <p style='margin:0;font-family:Georgia,serif;font-weight:400;font-size:32px;color:#f0e8d8;line-height:1.2;'>Falta pouco para</p>
          <p style='margin:0 0 20px;font-family:Georgia,serif;font-style:italic;font-weight:300;font-size:32px;color:#C9A84C;line-height:1.3;'>a nossa reunião.</p>

          <!-- Divisor -->
          <p style='margin:0 0 20px;font-size:12px;letter-spacing:0.4em;color:#5a4420;'>&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</p>

          <!-- 30 minutos -->
          <p style='margin:0;font-family:Georgia,serif;font-style:italic;font-weight:300;font-size:88px;color:#C9A84C;line-height:1;'>30</p>
          <p style='margin:0 0 24px;font-family:Arial,sans-serif;font-weight:400;font-size:9px;letter-spacing:0.55em;color:#C9A84C;text-transform:uppercase;'>Minutos</p>

          <!-- Mensagem -->
          <p style='margin:0;font-family:Georgia,serif;font-size:15px;color:#9a8060;line-height:1.9;'>
            Estamos ansiosos por <strong style='color:#c9b88a;font-weight:500;'>vos conhecer</strong><br>
            e ouvir a vossa história.<br>
            Vemo-nos já de seguida!
          </p>

        </td></tr>

        <!-- Cantos fundo -->
        <tr><td style='padding:0;'>
          <table width='100%' cellpadding='0' cellspacing='0'><tr>
            <td style='width:50px;height:50px;border-bottom:1px solid #C9A84C;border-left:1px solid #C9A84C;'></td>
            <td style='text-align:center;vertical-align:bottom;padding-bottom:18px;'>
              <table cellpadding='0' cellspacing='0' style='margin:0 auto;width:100%;'><tr>
                <td style='text-align:left;padding-left:10px;'><p style='margin:0;font-size:8px;letter-spacing:0.35em;color:#3a2a12;font-family:Arial,sans-serif;text-transform:uppercase;'>RL PHOTO &middot; VIDEO</p></td>
                <td style='text-align:right;padding-right:10px;'><p style='margin:0;font-size:8px;letter-spacing:0.35em;color:#3a2a12;font-family:Arial,sans-serif;text-transform:uppercase;'>ALERTA REUNI&Atilde;O</p></td>
              </tr></table>
            </td>
            <td style='width:50px;height:50px;border-bottom:1px solid #C9A84C;border-right:1px solid #C9A84C;'></td>
          </tr></table>
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
