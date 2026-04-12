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
      subject: 'O vosso Teaser está pronto',
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

              <p style="margin:0 0 24px;font-size:17px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                Olá, ${nomes}!
              </p>

              <h1 style="margin:0;font-size:40px;font-weight:400;color:#ffffff;line-height:1.15;letter-spacing:-0.01em;">
                O vosso
              </h1>
              <h1 style="margin:0;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.2;">
                Teaser está
              </h1>
              <h1 style="margin:0 0 20px;font-size:40px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.15;">
                pronto.
              </h1>

              <p style="margin:0 0 32px;font-size:14px;color:#b0a080;letter-spacing:0.01em;">
                Esperamos que esteja tudo bem convosco.
              </p>

              <div style="margin:0 0 32px;color:#7a6340;font-size:14px;letter-spacing:0.3em;">
                &#8212;&nbsp;&nbsp;·&nbsp;◆&nbsp;·&nbsp;&nbsp;&#8212;
              </div>

              <p style="margin:0 0 14px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                O <strong style="color:#ffffff;">trailer do vosso casamento</strong><br>já está disponível para verem.
              </p>
              <p style="margin:0 0 36px;font-size:15px;color:#d4c9b0;line-height:1.7;text-align:center;">
                Um <strong style="color:#ffffff;">aperitivo da magia</strong> que foi<br>o vosso dia. Acedam ao vosso <strong style="color:#ffffff;">Portal</strong>.
              </p>

              <table cellpadding="0" cellspacing="0" style="margin:0 auto 48px;border:1px solid #7a6340;width:100%;max-width:380px;">
                <tr>
                  <td style="padding:24px 32px;text-align:center;">
                    <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.4em;color:#8a7450;text-transform:uppercase;">
                      NO VOSSO PORTAL
                    </p>
                    <p style="margin:0;font-size:22px;font-style:italic;color:#c9a96e;letter-spacing:0.02em;">
                      O Nosso Filme &rarr; Teaser / Trailer
                    </p>
                  </td>
                </tr>
              </table>

              ${url ? `<table cellpadding="0" cellspacing="0" style="margin:-16px auto 32px;"><tr><td style="text-align:center;"><a href="${url}" style="font-size:13px;font-style:italic;color:#c9a96e;text-decoration:none;border-bottom:1px solid #7a6340;letter-spacing:0.02em;padding-bottom:2px;">Aceder diretamente &rarr;</a></td></tr></table>` : ''}

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
