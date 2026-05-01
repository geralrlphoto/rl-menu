import { NextResponse } from 'next/server'

export async function GET() {
  const primeiroNome = 'Rui'
  const dataFmt      = '15 de Maio de 2026'
  const horaFmt      = '10:00'
  const tipoTxt      = 'Videochamada'
  const tipoIcon     = '🎥'
  const portalUrl    = 'https://rl-menu-lake.vercel.app/rm/exemplo-token-123'

  const reuniaoBlock = `
    <table cellpadding="0" cellspacing="0" style="width:100%;margin:28px 0;">
      <tr>
        <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:20px 24px;">
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:12px;">
            <tr>
              <td style="font-size:8px;letter-spacing:6px;color:rgba(255,255,255,0.2);text-transform:uppercase;padding-bottom:4px;">Data</td>
              <td style="font-size:13px;color:rgba(255,255,255,0.65);text-align:right;font-weight:300;letter-spacing:1px;">${dataFmt}</td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:12px;">
            <tr>
              <td style="font-size:8px;letter-spacing:6px;color:rgba(255,255,255,0.2);text-transform:uppercase;padding-bottom:4px;">Hora</td>
              <td style="font-size:13px;color:rgba(255,255,255,0.65);text-align:right;font-weight:300;letter-spacing:1px;font-family:monospace;">${horaFmt}</td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="font-size:8px;letter-spacing:6px;color:rgba(255,255,255,0.2);text-transform:uppercase;padding-bottom:4px;">Modo</td>
              <td style="font-size:13px;color:rgba(255,255,255,0.65);text-align:right;font-weight:300;letter-spacing:1px;">${tipoIcon} ${tipoTxt}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`

  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#050507;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#050507;">
<tr><td align="center" style="padding:40px 16px 48px;">

  <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;border:1px solid rgba(255,255,255,0.07);">

    <!-- Header -->
    <tr><td style="background:#050507;border-bottom:1px solid rgba(255,255,255,0.05);padding:28px 36px 24px;">
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td>
            <p style="margin:0 0 4px;font-size:8px;letter-spacing:7px;color:rgba(255,255,255,0.2);text-transform:uppercase;">RL Media</p>
            <p style="margin:0;font-size:8px;letter-spacing:5px;color:rgba(255,255,255,0.1);text-transform:uppercase;">Audiovisual</p>
          </td>
          <td align="right">
            <img src="https://rl-menu-lake.vercel.app/logo_marca_advocacia__8_-removebg-preview.png"
              width="40" height="40" alt="RL Media"
              style="display:block;width:40px;height:40px;object-fit:cover;border-radius:50%;border:1px solid rgba(255,255,255,0.12);opacity:0.7;" />
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- Body -->
    <tr><td style="background:#060609;padding:36px 36px 32px;">

      <p style="margin:0 0 6px;font-size:8px;letter-spacing:6px;color:rgba(255,255,255,0.2);text-transform:uppercase;">Para ${primeiroNome}</p>
      <h1 style="margin:0 0 16px;font-size:28px;font-weight:200;letter-spacing:6px;color:rgba(255,255,255,0.80);text-transform:uppercase;line-height:1.2;">
        Reunião<br>Marcada
      </h1>

      <div style="width:40px;height:1px;background:rgba(255,255,255,0.15);margin-bottom:24px;"></div>

      <p style="margin:0 0 8px;font-size:13px;font-weight:300;color:rgba(255,255,255,0.40);line-height:1.7;">
        Ficámos a aguardar pela vossa reunião.<br>
        Podem confirmar a data diretamente no portal.
      </p>

      ${reuniaoBlock}

      <!-- Botão CTA -->
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>
          <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.18);">
            <a href="${portalUrl}"
              style="display:block;padding:16px 36px;font-size:9px;letter-spacing:6px;color:rgba(255,255,255,0.65);text-decoration:none;text-transform:uppercase;white-space:nowrap;">
              Confirmar Reunião →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:24px 0 0;font-size:10px;color:rgba(255,255,255,0.12);text-align:center;letter-spacing:2px;">
        ${portalUrl}
      </p>

    </td></tr>

    <!-- Footer -->
    <tr><td style="background:#050507;border-top:1px solid rgba(255,255,255,0.05);padding:16px 36px;">
      <p style="margin:0;font-size:8px;letter-spacing:5px;color:rgba(255,255,255,0.12);text-transform:uppercase;text-align:center;">
        RL Media · Audiovisual · Notificação automática
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
      subject: 'RL Media — Reunião marcada, 15 de Maio de 2026 [TESTE]',
      html,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ ok: false, error: data }, { status: 500 })
  return NextResponse.json({ ok: true, message: 'Card enviado para geral.rlmedia@gmail.com' })
}
