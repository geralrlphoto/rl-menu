import { NextResponse } from 'next/server'

export async function GET() {
  const primeiroNome = 'Rui'
  const tipoTxt = 'Vídeo Institucional'

  const cardHtml = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050507;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;padding:40px 16px;">
  <tr><td align="center">
    <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#0a0a12;border:1px solid rgba(255,255,255,0.09);">

      <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(255,255,255,0.22),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>

      <tr><td style="padding:52px 48px 44px;text-align:center;">

        <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
          width="72" alt="RL Media"
          style="display:block;margin:0 auto 36px;width:72px;height:72px;object-fit:contain;" />

        <p style="margin:0 0 6px;font-size:8px;letter-spacing:6px;color:rgba(255,255,255,0.18);text-transform:uppercase;">RL Media &middot; Audiovisual</p>

        <table cellpadding="0" cellspacing="0" style="margin:16px auto 28px;width:32px;"><tr><td height="1" style="background:rgba(255,255,255,0.12);font-size:0;line-height:0;">&nbsp;</td></tr></table>

        <p style="margin:0 0 6px;font-size:9px;letter-spacing:5px;color:rgba(255,255,255,0.22);text-transform:uppercase;">${tipoTxt}</p>
        <h1 style="margin:0 0 32px;font-size:28px;font-weight:200;letter-spacing:5px;color:rgba(255,255,255,0.88);text-transform:uppercase;">${primeiroNome}</h1>

        <p style="margin:0 0 10px;font-size:14px;color:rgba(255,255,255,0.55);line-height:1.9;font-weight:300;">
          Recebemos o teu pedido com sucesso.
        </p>
        <p style="margin:0 0 40px;font-size:12px;color:rgba(255,255,255,0.28);line-height:2;font-weight:300;">
          A nossa equipa irá analisar a tua mensagem<br>
          e entrar em contacto muito em breve.
        </p>

        <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;width:100%;"><tr>
          <td width="40%" height="1" style="background:rgba(255,255,255,0.06);font-size:0;">&nbsp;</td>
          <td width="8" style="padding:0 8px;color:rgba(255,255,255,0.15);font-size:6px;text-align:center;">◆</td>
          <td width="40%" height="1" style="background:rgba(255,255,255,0.06);font-size:0;">&nbsp;</td>
        </tr></table>

        <p style="margin:0;font-size:9px;letter-spacing:3px;color:rgba(255,255,255,0.18);text-transform:uppercase;">
          geral.rlmedia@gmail.com
        </p>

      </td></tr>

      <tr><td height="1" style="background:linear-gradient(90deg,#050507,rgba(255,255,255,0.08),#050507);font-size:0;line-height:0;">&nbsp;</td></tr>

      <tr><td style="padding:18px 48px;text-align:center;">
        <p style="margin:0;font-size:8px;letter-spacing:5px;color:rgba(255,255,255,0.1);text-transform:uppercase;">
          RL Media &middot; Audiovisual
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
