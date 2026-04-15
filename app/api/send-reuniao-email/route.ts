import { NextRequest, NextResponse } from 'next/server'

const LOGO = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png'

function fmtData(d: string) {
  // YYYY-MM-DD → DD / MM / AAAA
  const [y, m, day] = d.split('-')
  return `${day} / ${m} / ${y}`
}

export async function POST(req: NextRequest) {
  const { email, nome, reuniao_data, reuniao_hora, reuniao_tipo, reuniao_link } = await req.json().catch(() => ({}))

  if (!email || !reuniao_data || !reuniao_hora) {
    return NextResponse.json({ error: 'email, reuniao_data e reuniao_hora são obrigatórios' }, { status: 400 })
  }

  const dataFmt  = fmtData(reuniao_data)
  const isVideo  = reuniao_tipo === 'Videochamada'
  const localTxt = isVideo ? 'Videochamada · Google Meet' : 'Estúdio RL Photo.Video'
  const link     = reuniao_link || '#'
  const nomes    = nome || 'Noivos'

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0805;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0805;padding:48px 16px 32px;">
  <tr><td align="center">

    <!-- Outer frame with corner accents -->
    <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;">
      <!-- Top corners -->
      <tr>
        <td width="36" height="36" style="border-top:1px solid #9a7c3a;border-left:1px solid #9a7c3a;"></td>
        <td style="border-top:1px solid #9a7c3a;"></td>
        <td width="36" height="36" style="border-top:1px solid #9a7c3a;border-right:1px solid #9a7c3a;"></td>
      </tr>
      <!-- Content -->
      <tr>
        <td width="36" style="border-left:1px solid #9a7c3a;"></td>
        <td style="padding:40px 32px;font-family:Georgia,'Times New Roman',serif;text-align:center;background:#0a0805;">

          <!-- Logo -->
          <div style="margin:0 auto 28px;width:72px;height:72px;border-radius:50%;border:1.5px solid #c9a96e;overflow:hidden;background:#0a0805;">
            <img src="${LOGO}" width="72" height="72" alt="RL Photo Video" style="display:block;border-radius:50%;" />
          </div>

          <!-- Calendar pill -->
          <div style="margin:0 auto 28px;display:inline-block;background:#161008;border:1px solid #2e2416;border-radius:40px;padding:10px 22px;">
            <span style="font-size:24px;">&#128197;</span>
          </div>

          <!-- Olá, Noivos! -->
          <p style="margin:0 0 10px;font-size:22px;font-style:italic;font-weight:400;color:#c9a96e;letter-spacing:0.02em;">
            Olá, Noivos!
          </p>

          <!-- A vossa reunião -->
          <h1 style="margin:0;font-size:46px;font-weight:400;color:#ffffff;line-height:1.1;letter-spacing:-0.01em;font-family:Georgia,'Times New Roman',serif;">
            A vossa reunião
          </h1>

          <!-- está marcada. -->
          <h1 style="margin:0 0 28px;font-size:46px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.1;font-family:Georgia,'Times New Roman',serif;">
            está marcada.
          </h1>

          <!-- Divider -->
          <p style="margin:0 0 24px;color:#6a5630;font-size:13px;letter-spacing:0.35em;font-family:Arial,sans-serif;">
            &mdash;&nbsp;·&nbsp;·&nbsp;·&nbsp;&mdash;
          </p>

          <!-- Subtitle -->
          <p style="margin:0 0 36px;font-size:15px;color:#b0a090;line-height:1.8;font-family:Georgia,'Times New Roman',serif;">
            Mal podemos esperar para<br>
            <strong style="color:#e8dfc8;font-weight:600;">conhecer a vossa história</strong>.
          </p>

          <!-- Info box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2e2416;margin:0 0 36px;">
            <tr>
              <td width="90" align="left" style="padding:18px 22px;border-bottom:1px solid #2e2416;border-right:1px solid #2e2416;font-size:9px;letter-spacing:0.4em;color:#7a6030;text-transform:uppercase;font-family:Arial,sans-serif;vertical-align:middle;white-space:nowrap;">DATA</td>
              <td align="right" style="padding:18px 22px;border-bottom:1px solid #2e2416;font-size:16px;color:#e8dfc8;font-family:Georgia,'Times New Roman',serif;text-align:right;vertical-align:middle;">${dataFmt}</td>
            </tr>
            <tr>
              <td width="90" align="left" style="padding:18px 22px;border-bottom:1px solid #2e2416;border-right:1px solid #2e2416;font-size:9px;letter-spacing:0.4em;color:#7a6030;text-transform:uppercase;font-family:Arial,sans-serif;vertical-align:middle;white-space:nowrap;">HORA</td>
              <td align="right" style="padding:18px 22px;border-bottom:1px solid #2e2416;font-size:16px;color:#e8dfc8;font-family:Georgia,'Times New Roman',serif;text-align:right;vertical-align:middle;">${reuniao_hora}</td>
            </tr>
            <tr>
              <td width="90" align="left" style="padding:18px 22px;border-right:1px solid #2e2416;font-size:9px;letter-spacing:0.4em;color:#7a6030;text-transform:uppercase;font-family:Arial,sans-serif;vertical-align:middle;white-space:nowrap;">LOCAL</td>
              <td align="right" style="padding:18px 22px;font-size:16px;color:#e8dfc8;font-family:Georgia,'Times New Roman',serif;text-align:right;vertical-align:middle;">${localTxt}</td>
            </tr>
          </table>

          <!-- Button -->
          <a href="${link}" style="display:inline-block;border:1px solid #c9a96e;padding:17px 52px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-style:italic;font-weight:400;color:#c9a96e;text-decoration:none;letter-spacing:0.04em;">
            Aceder à Reunião
          </a>

        </td>
        <td width="36" style="border-right:1px solid #9a7c3a;"></td>
      </tr>
      <!-- Bottom corners -->
      <tr>
        <td width="36" height="36" style="border-bottom:1px solid #9a7c3a;border-left:1px solid #9a7c3a;"></td>
        <td style="border-bottom:1px solid #9a7c3a;"></td>
        <td width="36" height="36" style="border-bottom:1px solid #9a7c3a;border-right:1px solid #9a7c3a;"></td>
      </tr>
    </table>

    <!-- Footer -->
    <table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;margin-top:18px;padding:0 36px;">
      <tr>
        <td style="font-size:9px;letter-spacing:0.45em;color:#3a3020;text-transform:uppercase;font-family:Arial,sans-serif;">RL PHOTO &middot; VIDEO</td>
        <td style="text-align:right;font-size:9px;letter-spacing:0.45em;color:#3a3020;text-transform:uppercase;font-family:Arial,sans-serif;">Reunião Marcada</td>
      </tr>
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
      to: [email],
      subject: `A vossa reunião está marcada · ${dataFmt} às ${reuniao_hora}`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
