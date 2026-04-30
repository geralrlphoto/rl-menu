import { NextResponse } from 'next/server'

export async function GET() {
  const primeiroNome = 'Rui'
  const tipoTxt = 'Vídeo Institucional'

  const cardHtml = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020204;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#020204;">
<tr><td align="center" style="padding:48px 16px 56px;">

  <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">

    <!-- Accent top -->
    <tr><td height="1" style="background:linear-gradient(90deg,#020204 0%,rgba(255,255,255,0.45) 50%,#020204 100%);font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- Card -->
    <tr><td style="background:#0c0c16;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06);padding:64px 60px 60px;text-align:center;">

      <!-- Logo -->
      <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
        width="60" height="60" alt="RL Media"
        style="display:block;margin:0 auto 44px;width:60px;height:60px;object-fit:contain;opacity:0.9;" />

      <!-- Eyebrow -->
      <p style="margin:0 0 44px;font-size:9px;letter-spacing:7px;color:rgba(255,255,255,0.18);text-transform:uppercase;">
        RL MEDIA &nbsp;&middot;&nbsp; AUDIOVISUAL
      </p>

      <!-- Nome do cliente -->
      <h1 style="margin:0 0 10px;font-size:40px;font-weight:200;letter-spacing:9px;color:rgba(255,255,255,0.92);text-transform:uppercase;line-height:1.05;">
        ${primeiroNome}
      </h1>

      <!-- Tipo de serviço -->
      <p style="margin:0 0 52px;font-size:10px;letter-spacing:4px;color:rgba(255,255,255,0.2);text-transform:uppercase;">
        ${tipoTxt}
      </p>

      <!-- Linha fina -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto 48px;">
        <tr><td width="56" height="1" style="background:rgba(255,255,255,0.1);font-size:0;line-height:0;">&nbsp;</td></tr>
      </table>

      <!-- Mensagem principal -->
      <p style="margin:0 0 14px;font-size:17px;font-weight:300;color:rgba(255,255,255,0.58);line-height:1.5;">
        Recebemos o teu pedido.
      </p>

      <!-- Submensagem -->
      <p style="margin:0;font-size:13px;font-weight:300;color:rgba(255,255,255,0.26);line-height:1.9;">
        A nossa equipa vai entrar em contacto<br>contigo muito em breve.
      </p>

    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#07070e;border:1px solid rgba(255,255,255,0.05);border-top:none;padding:22px 60px;text-align:center;">
      <p style="margin:0;font-size:9px;letter-spacing:5px;color:rgba(255,255,255,0.12);text-transform:uppercase;">
        RL Media &nbsp;&middot;&nbsp; Audiovisual
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
