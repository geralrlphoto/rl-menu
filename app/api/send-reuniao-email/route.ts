import { NextRequest, NextResponse } from 'next/server'

const LOGO = 'https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png'

function fmtData(d: string) {
  const [y, m, day] = d.split('-')
  return `${day} / ${m} / ${y}`
}

function infoRow(label: string, value: string, borderBottom: boolean) {
  const bottom = borderBottom ? 'border-bottom:1px solid #2e2416;' : ''
  return `
  <tr>
    <td width="100" valign="middle" style="padding:18px 24px;${bottom}font-size:9px;letter-spacing:0.4em;color:#7a6030;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;white-space:nowrap;">${label}</td>
    <td valign="middle" style="padding:18px 24px;${bottom}border-left:1px solid #2e2416;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td align="right" style="font-size:16px;color:#e8dfc8;font-family:Georgia,'Times New Roman',serif;text-align:right;">${value}</td>
      </tr></table>
    </td>
  </tr>`
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

  const html = `<!DOCTYPE html>
<html lang="pt">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#080603;">

<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#080603" style="background:#080603;padding:48px 16px 32px;">
<tr><td align="center">

  <!-- CORNER FRAME -->
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
    <tr>
      <td width="32" height="32" style="border-top:1px solid #8a6c2a;border-left:1px solid #8a6c2a;"></td>
      <td style="border-top:1px solid #8a6c2a;"></td>
      <td width="32" height="32" style="border-top:1px solid #8a6c2a;border-right:1px solid #8a6c2a;"></td>
    </tr>
    <tr>
      <td width="32" style="border-left:1px solid #8a6c2a;"></td>
      <td align="center" style="padding:36px 28px 44px;background:#080603;">

        <!-- LOGO -->
        <div style="margin:0 auto 24px;width:76px;height:76px;border-radius:50%;border:1.5px solid #c9a96e;overflow:hidden;">
          <img src="${LOGO}" width="76" height="76" alt="RL" style="display:block;border-radius:50%;width:76px;height:76px;" />
        </div>

        <!-- CALENDAR PILL -->
        <div style="display:inline-block;margin:0 0 24px;padding:9px 20px;background:#100c06;border:1px solid #2a1e0e;border-radius:40px;font-size:22px;line-height:1;">&#128197;</div>

        <!-- OLÁ NOIVOS -->
        <p style="margin:0 0 8px;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-style:italic;font-weight:400;color:#c9a96e;text-align:center;">Olá, Noivos!</p>

        <!-- A VOSSA REUNIÃO -->
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:48px;font-weight:400;color:#ffffff;line-height:1.1;text-align:center;letter-spacing:-0.01em;">A vossa reunião</p>

        <!-- ESTÁ MARCADA -->
        <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-size:48px;font-weight:400;font-style:italic;color:#c9a96e;line-height:1.1;text-align:center;">está marcada.</p>

        <!-- DIVIDER -->
        <p style="margin:0 0 22px;font-family:Arial,sans-serif;font-size:12px;color:#6a5228;letter-spacing:0.4em;text-align:center;">&mdash;&nbsp;&middot;&nbsp;&middot;&nbsp;&middot;&nbsp;&mdash;</p>

        <!-- SUBTITLE -->
        <p style="margin:0 0 32px;font-family:Georgia,'Times New Roman',serif;font-size:15px;color:#a09080;line-height:1.8;text-align:center;">
          Mal podemos esperar para<br>
          <strong style="color:#e0d5c0;font-weight:600;">conhecer a vossa história</strong>.
        </p>

        <!-- INFO BOX -->
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #2a1e0e;margin:0 0 32px;">
          ${infoRow('DATA', dataFmt, true)}
          ${infoRow('HORA', reuniao_hora, true)}
          ${infoRow('LOCAL', localTxt, false)}
        </table>

        <!-- BUTTON -->
        <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
          <tr>
            <td align="center" style="border:1px solid #c9a96e;">
              <a href="${link}" style="display:block;padding:16px 56px;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-style:italic;font-weight:400;color:#c9a96e;text-decoration:none;letter-spacing:0.04em;white-space:nowrap;">Aceder à Reunião</a>
            </td>
          </tr>
        </table>

      </td>
      <td width="32" style="border-right:1px solid #8a6c2a;"></td>
    </tr>
    <tr>
      <td width="32" height="32" style="border-bottom:1px solid #8a6c2a;border-left:1px solid #8a6c2a;"></td>
      <td style="border-bottom:1px solid #8a6c2a;"></td>
      <td width="32" height="32" style="border-bottom:1px solid #8a6c2a;border-right:1px solid #8a6c2a;"></td>
    </tr>
  </table>

  <!-- FOOTER -->
  <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;margin-top:16px;">
    <tr>
      <td align="left" style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:0.5em;color:#302818;text-transform:uppercase;padding:0 32px;">RL PHOTO &middot; VIDEO</td>
      <td align="right" style="font-family:Arial,sans-serif;font-size:9px;letter-spacing:0.5em;color:#302818;text-transform:uppercase;padding:0 32px;">Reunião Marcada</td>
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
