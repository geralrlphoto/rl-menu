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
<head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'></head>
<body style='margin:0;padding:0;background:#0e0b07;'>
  <table width='100%' cellpadding='0' cellspacing='0' style='background:#0e0b07;padding:40px 16px;'>
    <tr><td align='center'>
      <table width='600' cellpadding='0' cellspacing='0' style='max-width:600px;width:100%;'>
        <tr><td>
          <img src='${IMG_URL}'
            alt='A vossa reunião começa em 30 minutos'
            width='600'
            style='display:block;width:100%;height:auto;border:none;' />
        </td></tr>
        ${c.reuniao_link ? `
        <tr><td align='center' style='padding:24px 0 8px;'>
          <a href='${c.reuniao_link}'
            style='display:inline-block;padding:14px 40px;background:#C9A84C;color:#0d0b07;font-family:Montserrat,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:0.15em;text-decoration:none;text-transform:uppercase;'>
            Juntar à Videochamada →
          </a>
        </td></tr>` : ''}
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
