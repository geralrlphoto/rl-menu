import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const IMG_URL = 'https://rl-menu-lake.vercel.app/card_alerta_reuniao_desktop.png'

export async function GET(req: NextRequest) {
  // Segurança: só aceita chamadas com o secret correto
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar reuniões que começam entre 25 e 35 minutos a partir de agora
  // e cujo lembrete ainda não foi enviado
  const now = new Date()
  const from = new Date(now.getTime() + 25 * 60 * 1000) // +25 min
  const to   = new Date(now.getTime() + 35 * 60 * 1000) // +35 min

  // Formatar para comparação: "YYYY-MM-DDTHH:MM"
  const fmtDT = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`

  const { data: contacts, error } = await supabase
    .from('crm_contacts')
    .select('id, nome, email, reuniao_data, reuniao_hora, reuniao_tipo, reuniao_link')
    .eq('lembrete_enviado', false)
    .not('email', 'is', null)
    .not('reuniao_data', 'is', null)
    .not('reuniao_hora', 'is', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const fromStr = fmtDT(from)
  const toStr   = fmtDT(to)

  // Filtrar os que estão na janela de 25-35 min
  const targets = (contacts || []).filter(c => {
    const dt = `${c.reuniao_data}T${(c.reuniao_hora || '').slice(0,5)}`
    return dt >= fromStr && dt <= toStr
  })

  if (targets.length === 0) {
    return NextResponse.json({ sent: 0, checked: contacts?.length ?? 0 })
  }

  let sent = 0
  for (const c of targets) {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>
<link href='https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap' rel='stylesheet'>
</head>
<body style='margin:0;padding:0;background:#0c0905;font-family:Georgia,serif;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#0c0905;padding:40px 16px;'>
    <tr><td align='center'>
      <table width='560' cellpadding='0' cellspacing='0' style='max-width:560px;width:100%;background:linear-gradient(160deg,#110d07 0%,#0c0905 60%,#130e08 100%);border:0.5px solid #3a2a12;'>
        <tr><td><table width='100%' cellpadding='0' cellspacing='0'><tr>
          <td style='width:50px;height:50px;border-top:1px solid #C9A84C;border-left:1px solid #C9A84C;'></td>
          <td></td>
          <td style='width:50px;height:50px;border-top:1px solid #C9A84C;border-right:1px solid #C9A84C;'></td>
        </tr></table></td></tr>
        <tr><td style='padding:10px 56px 40px;text-align:center;'>
          <img src='https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png' width='64' alt='RL' style='display:block;margin:0 auto 28px;opacity:0.9;' />
          <table cellpadding='0' cellspacing='0' style='margin:0 auto 20px;'><tr>
            <td style='width:60px;height:60px;border-radius:50%;border:1.5px solid #C9A84C;text-align:center;vertical-align:middle;'><span style='font-size:26px;'>⏰</span></td>
          </tr></table>
          <p style='margin:0 0 6px;font-style:italic;font-weight:300;font-size:22px;color:#C9A84C;'>Olá, Noivos!</p>
          <p style='margin:0;font-weight:400;font-size:32px;color:#f0e8d8;line-height:1.2;'>Falta pouco para</p>
          <p style='margin:0 0 20px;font-style:italic;font-weight:300;font-size:32px;color:#C9A84C;line-height:1.3;'>a nossa reunião.</p>
          <p style='margin:0 0 20px;font-size:12px;letter-spacing:0.4em;color:#5a4420;'>&#8212;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&#8212;</p>
          <p style='margin:0;font-style:italic;font-weight:300;font-size:88px;color:#C9A84C;line-height:1;'>30</p>
          <p style='margin:0 0 24px;font-family:Arial,sans-serif;font-size:9px;letter-spacing:0.55em;color:#C9A84C;text-transform:uppercase;'>Minutos</p>
          <p style='margin:0 0 28px;font-size:15px;color:#9a8060;line-height:1.9;'>Estamos ansiosos por <strong style='color:#c9b88a;'>vos conhecer</strong><br>e ouvir a vossa história.<br>Vemo-nos já de seguida!</p>
          ${c.reuniao_link ? `<a href='${c.reuniao_link}' style='display:inline-block;padding:14px 40px;background:#C9A84C;color:#0d0b07;font-family:Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.2em;text-decoration:none;text-transform:uppercase;'>Juntar à Videochamada →</a>` : ''}
        </td></tr>
        <tr><td><table width='100%' cellpadding='0' cellspacing='0'><tr>
          <td style='width:50px;height:50px;border-bottom:1px solid #C9A84C;border-left:1px solid #C9A84C;'></td>
          <td style='text-align:center;vertical-align:bottom;padding-bottom:18px;'>
            <table cellpadding='0' cellspacing='0' style='width:100%;'><tr>
              <td style='text-align:left;padding-left:10px;'><p style='margin:0;font-size:8px;letter-spacing:0.35em;color:#3a2a12;font-family:Arial,sans-serif;text-transform:uppercase;'>RL PHOTO · VIDEO</p></td>
              <td style='text-align:right;padding-right:10px;'><p style='margin:0;font-size:8px;letter-spacing:0.35em;color:#3a2a12;font-family:Arial,sans-serif;text-transform:uppercase;'>ALERTA REUNIÃO</p></td>
            </tr></table>
          </td>
          <td style='width:50px;height:50px;border-bottom:1px solid #C9A84C;border-right:1px solid #C9A84C;'></td>
        </tr></table></td></tr>
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
        to: [c.email],
        subject: '⏰ A vossa reunião começa em 30 minutos',
        html,
      }),
    })

    if (res.ok) {
      await supabase
        .from('crm_contacts')
        .update({ lembrete_enviado: true })
        .eq('id', c.id)
      sent++
    }
  }

  return NextResponse.json({ sent, targets: targets.length })
}
