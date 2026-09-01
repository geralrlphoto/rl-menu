import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'

const IMG_BASE = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images'

export async function GET(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const primeiroNome = 'Rui'
  const dataFmt      = '15 de Maio de 2026'
  const horaFmt      = '10:00'
  const tipoTxt      = 'Videochamada'
  const portalUrl    = 'https://portal.rlphotovideo.pt/rm/exemplo-token-123'

  const cardHtml = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">

        <!-- Corner ornaments (top) -->
        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td></td>
            <td style="width:50px;height:50px;border-top:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
          </tr></table>
        </td></tr>

        <tr><td style="padding:8px 56px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

          <!-- Logo -->
          <img src="https://portal.rlphotovideo.pt/logo_rl_gold.png"
            width="80" alt="RL Photo Video"
            style="display:block;margin:0 auto 24px;width:80px;height:auto;opacity:0.9;" />

          <!-- Check circle -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;width:52px;height:52px;border-radius:50%;border:1.5px solid #c9a96e;"><tr><td align="center" valign="middle">
            <span style="font-size:22px;color:#c9a96e;">&#10003;</span>
          </td></tr></table>

          <!-- Saudação -->
          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;line-height:1.2;">Olá, ${primeiroNome}!</p>

          <!-- Título principal -->
          <p style="margin:0;font-size:42px;font-weight:400;color:#f0e8d8;line-height:1.1;">Tens uma</p>
          <p style="margin:0 0 24px;font-size:42px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">reunião marcada.</p>

          <!-- Divider -->
          <div style="margin:0 0 24px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</div>

          <!-- Caixa detalhes da reunião -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:380px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:24px 32px;text-align:center;">

              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Data</p>
              <p style="margin:0 0 16px;font-size:18px;font-weight:400;color:#c9a96e;line-height:1.3;">${dataFmt}</p>

              <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;width:60%;border-top:0.5px solid #3a2a12;"><tr><td></td></tr></table>

              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Hora</p>
              <p style="margin:0 0 16px;font-size:26px;font-style:italic;font-weight:400;color:#c9a96e;line-height:1.2;">${horaFmt}</p>

              <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;width:60%;border-top:0.5px solid #3a2a12;"><tr><td></td></tr></table>

              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Modo</p>
              <p style="margin:0;font-size:13px;color:#d4c9b0;">${tipoTxt}</p>

            </td></tr>
          </table>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
            <tr>
              <td style="background:rgba(201,169,110,0.08);border:0.5px solid #6a5430;">
                <a href="${portalUrl}"
                  style="display:block;padding:16px 44px;font-size:9px;letter-spacing:0.5em;color:#c9a96e;text-decoration:none;text-transform:uppercase;white-space:nowrap;font-family:Georgia,'Times New Roman',serif;">
                  Ver Reunião &rarr;
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:0;font-size:13px;color:#7a6340;line-height:1.8;">
            Clica no botão acima para confirmar<br>ou pedir uma alteração de data.
          </p>

        </td></tr>

        <!-- Corner ornaments (bottom) -->
        <tr><td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-left:0.5px solid #3a2a12;"></td>
            <td style="text-align:center;vertical-align:bottom;padding-bottom:20px;">
              <p style="margin:0;font-size:9px;letter-spacing:0.4em;color:#3a2a12;text-transform:uppercase;font-family:Georgia,'Times New Roman',serif;">Notifica&ccedil;&atilde;o Admin</p>
            </td>
            <td style="width:50px;height:50px;border-bottom:0.5px solid #3a2a12;border-right:0.5px solid #3a2a12;"></td>
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
      from: 'RL PROD <geral@rlphotovideo.pt>',
      to: 'geral.rlmedia@gmail.com',
      subject: 'RL PROD — Reunião marcada, 15 de Maio de 2026 [TESTE]',
      html: cardHtml,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ ok: false, error: data }, { status: 500 })
  return NextResponse.json({ ok: true, message: 'Card enviado para geral.rlmedia@gmail.com' })
}

