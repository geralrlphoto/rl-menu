import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { email_noiva, nome_noiva, nome_noivo, url } = await req.json().catch(() => ({}))

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
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [email_noiva],
      subject: 'As vossas fotos estão prontas para seleção',
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

              <!-- Greeting -->
              <p style="margin:0 0 24px;font-size:17px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                Olá, ${nomes}!
              </p>

              <!-- Main heading -->
              <h1 style="margin:0;font-size:40px;font-weight:400;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">
                As vossas fotos
              </h1>
              <h1 style="margin:0 0 20px;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.15;">
                estão prontas.
              </h1>

              <!-- Subtitle -->
              <p style="margin:0 0 32px;font-size:14px;color:#b0a080;letter-spacing:0.01em;">
                Esperamos que esteja tudo bem convosco.
              </p>

              <!-- Divider -->
              <div style="margin:0 0 32px;color:#7a6340;font-size:14px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;◆&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <!-- Body text -->
              <p style="margin:0 0 14px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                As <strong style="color:#ffffff;">fotos para seleção</strong> já estão disponíveis.
              </p>
              <p style="margin:0 0 36px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                Consultem o vosso <strong style="color:#ffffff;">Portal dos Noivos</strong><br>para escolherem as vossas favoritas.
              </p>

              <!-- CTA Box -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 48px;border:1px solid #7a6340;width:100%;max-width:400px;">
                <tr>
                  <td style="padding:24px 32px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                      NO VOSSO PORTAL
                    </p>
                    <p style="margin:0;font-size:20px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                      Fotografias &rarr; Galeria Fotos p/ Seleção
                    </p>
                  </td>
                </tr>
              </table>


              <!-- Footer -->
              <p style="margin:0;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">
                RL PHOTO &middot; VIDEO
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
