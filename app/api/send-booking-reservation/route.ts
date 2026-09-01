import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/send-booking-reservation
// Body: { referencia, tipoEvento: 'casamento'|'batizado', bookingType: 'sessao'|'reuniao', date, time, local }
//
// Disparado quando cliente reserva um slot na secção Marcação do portal.
// Envia card dourado ao admin com a reserva.

const RESEND_KEY  = process.env.RESEND_API_KEY!
const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const SITE_BASE   = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function resolveNomeCliente(referencia: string) {
  const sb = db()
  const { data: contrato } = await sb
    .from('dados_contrato_cps')
    .select('nome_noivos, nome_noiva, nome_noivo, nome_crianca')
    .eq('referencia_evento', referencia)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (contrato) {
    return contrato.nome_noivos
      || [contrato.nome_noiva, contrato.nome_noivo].filter(Boolean).join(' & ')
      || contrato.nome_crianca
      || referencia
  }
  const { data: portal } = await sb
    .from('portais')
    .select('noiva, noivo, settings')
    .eq('referencia', referencia)
    .maybeSingle()
  if (portal) {
    return [portal.noiva, portal.noivo].filter(Boolean).join(' & ')
      || portal.settings?.nomeCrianca
      || referencia
  }
  return referencia
}

function fmtData(d: string) {
  if (!d) return ''
  try {
    return new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', {
      day: '2-digit', month: 'long', year: 'numeric',
    })
  } catch { return d }
}

function buildHtml(opts: {
  nome: string
  referencia: string
  tipoEvento: 'casamento' | 'batizado'
  bookingType: 'sessao' | 'reuniao'
  date: string
  time: string
  local: string
  portalUrl: string
}): string {
  const eyebrow = opts.bookingType === 'reuniao' ? 'Nova reunião marcada' : 'Nova sessão fotografia marcada'
  const lead    = opts.bookingType === 'reuniao' ? 'reservou uma reunião.' : 'reservou uma sessão de fotografia.'
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">
        <tr><td style="padding:48px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">
          <img src="https://portal.rlphotovideo.pt/logo_rl_gold.png"
            width="80" alt="RL" style="display:block;margin:0 auto 24px;width:80px;opacity:0.9;" />

          <p style="margin:0 0 8px;font-size:11px;letter-spacing:0.5em;color:#c9a96e;text-transform:uppercase;">${eyebrow}</p>
          <p style="margin:0 0 24px;font-size:28px;color:#f0e8d8;font-style:italic;">${opts.nome}</p>
          <p style="margin:0 0 24px;font-size:14px;color:#a09070;">${lead}</p>

          <div style="margin:0 0 24px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">— · ◆ · —</div>

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:420px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:22px 28px;text-align:center;">
              <p style="margin:0;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Data</p>
              <p style="margin:4px 0 14px;font-size:20px;color:#f0e8d8;font-weight:600;">${fmtData(opts.date)}</p>
              <p style="margin:0;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Hora</p>
              <p style="margin:4px 0 14px;font-size:18px;color:#f0e8d8;">${opts.time}</p>
              ${opts.local ? `<p style="margin:0;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Local</p>
              <p style="margin:4px 0 0;font-size:16px;color:#f0e8d8;">${opts.local}</p>` : ''}
            </td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">Referência</p>
          <p style="margin:0 0 28px;font-size:14px;font-family:'Courier New',monospace;color:#c9b88a;">${opts.referencia}</p>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;">
            <tr>
              <td align="center" style="border-radius:8px;background:#c9a96e;">
                <a href="${opts.portalUrl}" target="_blank"
                  style="display:inline-block;padding:16px 40px;background:#c9a96e;color:#0e0b07;text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:0.4em;font-weight:700;border-radius:8px;mso-padding-alt:0;border:1px solid #c9a96e;">
                  VER PORTAL &nbsp;→
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:32px 0 0;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;">
            RL PHOTO &middot; VIDEO
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

async function sendEmail(to: string, subject: string, html: string) {
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: [to], subject, html,
      }),
    })
    return res.ok
  } catch { return false }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const referencia  = String(body.referencia ?? '').trim()
    const tipoEvento  = body.tipoEvento === 'batizado' ? 'batizado' : 'casamento'
    const bookingType = body.bookingType === 'reuniao' ? 'reuniao' : 'sessao'
    const date  = String(body.date ?? '').trim()
    const time  = String(body.time ?? '').trim()
    const local = String(body.local ?? '').trim()

    if (!referencia || !date || !time) {
      return NextResponse.json({ error: 'referencia/date/time obrigatórios' }, { status: 400 })
    }

    const nome = await resolveNomeCliente(referencia)
    const portalUrl = tipoEvento === 'batizado'
      ? `${SITE_BASE}/portal-batizado/ref/${encodeURIComponent(referencia)}?admin=1`
      : `${SITE_BASE}/portal-cliente/ref/${encodeURIComponent(referencia)}?admin=1`

    const subject = bookingType === 'reuniao'
      ? `📅 Reunião marcada — ${nome}`
      : `📷 Sessão marcada — ${nome}`

    const ok = await sendEmail(
      ADMIN_EMAIL,
      subject,
      buildHtml({ nome, referencia, tipoEvento, bookingType, date, time, local, portalUrl }),
    )

    if (!ok) return NextResponse.json({ error: 'Falha ao enviar email' }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[send-booking-reservation]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
