import { NextRequest, NextResponse } from 'next/server'
import { resolveEmailNoiva } from '../_lib/emailNoiva'

export async function POST(req: NextRequest) {
  const { email_noiva, nome_noiva, nome_noivo, referencia, password, portal_url } = await req.json().catch(() => ({}))

  const resolvedEmail = await resolveEmailNoiva(email_noiva, referencia)
  if (!resolvedEmail) {
    return NextResponse.json({ error: 'Email da noiva não encontrado. Preenche o email na ficha do evento.' }, { status: 400 })
  }

  const nomes = [nome_noiva, nome_noivo].filter(Boolean).join(' & ') || 'Noivos'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [resolvedEmail],
      subject: 'O vosso Portal dos Noivos está pronto',
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0e0b06;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b06;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;border:1px solid #7a6340;background:#110e08;">
          <tr>
            <td style="padding:56px 48px 48px;font-family:Georgia,'Times New Roman',serif;text-align:center;">

              <!-- Logo -->
              <div style="margin:0 0 28px;display:inline-block;width:64px;height:64px;border-radius:50%;border:1px solid #7a6340;line-height:64px;text-align:center;">
                <span style="font-size:20px;font-style:italic;color:#c9a96e;">RL</span>
              </div>

              <p style="margin:0 0 20px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                BEM-VINDOS
              </p>

              <h1 style="margin:0;font-size:44px;font-weight:400;color:#ffffff;line-height:1.1;">
                Portal dos
              </h1>
              <h1 style="margin:0 0 16px;font-size:44px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">
                Noivos
              </h1>
              <p style="margin:0 0 28px;font-size:18px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                a vossa jornada começa aqui.
              </p>

              <div style="margin:0 0 32px;color:#7a6340;font-size:14px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;◆&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <p style="margin:0 0 12px;font-size:15px;color:#d4c9b0;line-height:1.8;text-align:center;">
                Este é o vosso <strong style="color:#ffffff;">espaço exclusivo</strong>.<br>
                Aqui vão encontrar tudo sobre<br>
                o vosso casamento: <strong style="color:#ffffff;">fotos, vídeos,<br>
                cronograma e muito mais</strong>.
              </p>

              ${referencia || password ? `
              <table cellpadding="0" cellspacing="0" style="margin:28px auto;border:1px solid #7a6340;width:100%;max-width:320px;">
                <tr>
                  <td style="padding:18px 24px;text-align:center;">
                    ${referencia ? `<p style="margin:0 0 6px;font-size:9px;letter-spacing:0.35em;color:#8a7450;text-transform:uppercase;">Referência</p>
                    <p style="margin:0 ${password ? '0 14px' : '0'};font-size:14px;font-family:monospace;color:#c9a96e;letter-spacing:0.1em;">${referencia}</p>` : ''}
                    ${password ? `<p style="margin:0 0 6px;font-size:9px;letter-spacing:0.35em;color:#8a7450;text-transform:uppercase;">Password</p>
                    <p style="margin:0;font-size:16px;font-family:monospace;color:#ffffff;letter-spacing:0.15em;">${password}</p>` : ''}
                  </td>
                </tr>
              </table>` : ''}

              <table cellpadding="0" cellspacing="0" style="margin:0 auto 48px;border:1px solid #7a6340;width:100%;max-width:380px;">
                <tr>
                  <td style="padding:24px 32px;text-align:center;">
                    ${portal_url
                      ? `<a href="${portal_url}" style="font-size:22px;font-style:italic;color:#c9a96e;text-decoration:none;letter-spacing:0.02em;">Aceder ao Portal</a>`
                      : `<p style="margin:0;font-size:22px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">Aceder ao Portal</p>`
                    }
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">
                RL PHOTO &middot; VIDEO
              </p>
              <p style="margin:0;font-size:9px;letter-spacing:0.2em;color:#4a4030;text-transform:uppercase;">
                Wedding Moments
              </p>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data }, { status: 500 })
  return NextResponse.json({ ok: true, id: data.id })
}
