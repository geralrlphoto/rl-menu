import { NextResponse } from 'next/server'

export async function GET() {
  const primeiroNome = 'Rui'
  const tipoTxt = 'Vídeo Institucional'

  const cardHtml = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080d18;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#080d18;">
<tr><td align="center" style="padding:36px 12px 44px;">

  <table width="500" cellpadding="0" cellspacing="0" style="max-width:500px;width:100%;border-radius:12px;overflow:hidden;border:1px solid rgba(180,150,90,0.18);">

    <!-- Corpo principal -->
    <tr><td style="background:radial-gradient(ellipse 100% 85% at 50% 10%,#1c2a4a 0%,#101928 50%,#080d18 100%);padding:52px 52px 48px;text-align:center;">

      <!-- Logo circular com neon -->
      <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
        width="88" height="88" alt="RL Media"
        style="display:block;margin:0 auto 32px;width:88px;height:88px;object-fit:cover;border-radius:50%;border:1.5px solid rgba(200,170,100,0.65);box-shadow:0 0 10px rgba(200,170,100,0.7),0 0 24px rgba(200,170,100,0.35),0 0 50px rgba(200,170,100,0.15);" />

      <!-- Brand -->
      <p style="margin:0 0 36px;font-size:9px;letter-spacing:7px;color:rgba(180,150,90,0.6);text-transform:uppercase;">
        RL MEDIA &nbsp;&middot;&nbsp; AUDIOVISUAL
      </p>

      <!-- Nome — elemento principal -->
      <h1 style="margin:0 0 10px;font-size:52px;font-weight:400;letter-spacing:12px;color:#c4a46a;text-transform:uppercase;line-height:1;font-family:Georgia,'Times New Roman',serif;">
        ${primeiroNome}
      </h1>

      <!-- Tipo de serviço -->
      <p style="margin:0 0 40px;font-size:10px;letter-spacing:5px;color:rgba(180,150,90,0.4);text-transform:uppercase;">
        ${tipoTxt}
      </p>

      <!-- Separador com diamante -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 36px;width:200px;">
        <tr>
          <td style="border-top:1px solid rgba(180,150,90,0.3);vertical-align:middle;">&nbsp;</td>
          <td style="padding:0 12px;color:rgba(180,150,90,0.6);font-size:9px;white-space:nowrap;line-height:1;">&#9670;</td>
          <td style="border-top:1px solid rgba(180,150,90,0.3);vertical-align:middle;">&nbsp;</td>
        </tr>
      </table>

      <!-- Mensagem -->
      <p style="margin:0 0 14px;font-size:17px;font-weight:300;color:rgba(255,255,255,0.80);line-height:1.4;">
        Recebemos o teu pedido.
      </p>
      <p style="margin:0;font-size:13px;font-weight:300;color:rgba(255,255,255,0.33);line-height:1.9;">
        A nossa equipa vai entrar em contacto<br>contigo muito em breve.
      </p>

    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#060a12;border-top:1px solid rgba(180,150,90,0.12);padding:20px 52px;text-align:center;">
      <p style="margin:0;font-size:8px;letter-spacing:6px;color:rgba(180,150,90,0.32);text-transform:uppercase;">
        RL MEDIA &nbsp;&middot;&nbsp; AUDIOVISUAL
      </p>
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
      from: 'RL Media <geral@rlphotovideo.pt>',
      to: 'geral.rlmedia@gmail.com',
      subject: 'RL Media — Recebemos o teu pedido, Rui [TESTE]',
      html: cardHtml,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ ok: false, error: data }, { status: 500 })
  return NextResponse.json({ ok: true, message: 'Card enviado para geral.rlmedia@gmail.com' })
}
