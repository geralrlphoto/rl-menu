import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const RESEND_KEY = process.env.RESEND_API_KEY
const SITE_URL = 'https://rl-menu-lake.vercel.app'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * POST { referencia, titulo, texto }
 *
 * 1) Append em portais.settings.noivos_notifications[]
 * 2) Envia email à noiva (settings.emailNoiva ou dados_contrato_cps.email_noiva)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const referencia = String(body?.referencia ?? '').trim()
    const titulo = String(body?.titulo ?? '').trim()
    const texto = String(body?.texto ?? '').trim()

    if (!referencia) return NextResponse.json({ ok: false, error: 'referencia required' }, { status: 400 })
    if (!titulo || !texto) return NextResponse.json({ ok: false, error: 'titulo e texto required' }, { status: 400 })

    const supabase = db()

    // 1) Append à lista em portais.settings
    const { data: portalRow } = await supabase
      .from('portais')
      .select('settings')
      .ilike('referencia', referencia)
      .maybeSingle()

    const settings = (portalRow?.settings ?? {}) as Record<string, any>
    const lista = Array.isArray(settings.noivos_notifications) ? settings.noivos_notifications : []
    const nova = { id: `n_${Date.now()}`, titulo, texto, ts: new Date().toISOString() }
    const newSettings = { ...settings, noivos_notifications: [nova, ...lista] }

    if (portalRow) {
      await supabase.from('portais').update({ settings: newSettings }).ilike('referencia', referencia)
    } else {
      await supabase.from('portais').insert({ referencia, settings: newSettings })
    }

    // 2) Descobrir email da noiva
    let emailNoiva: string | null = settings.emailNoiva ?? null
    let nomeNoivos: string | null = [settings.noiva, settings.noivo].filter(Boolean).join(' & ') || null
    if (!emailNoiva) {
      const { data: cps } = await supabase
        .from('dados_contrato_cps')
        .select('email_noiva, nome_noiva, nome_noivo')
        .eq('referencia_evento', referencia)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle()
      emailNoiva = cps?.email_noiva ?? null
      if (!nomeNoivos) nomeNoivos = [cps?.nome_noiva, cps?.nome_noivo].filter(Boolean).join(' & ') || null
    }

    // 3) Enviar email
    let emailEnviado = false
    if (RESEND_KEY && emailNoiva) {
      try {
        const isBatizado = referencia.toUpperCase().startsWith('BAT')
        const portalUrl = `${SITE_URL}/${isBatizado ? 'portal-batizado' : 'portal-cliente'}/ref/${encodeURIComponent(referencia)}`
        const html = buildEmail({ titulo, texto, nomeNoivos, portalUrl })
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'RL Photo.Video <geral@rlphotovideo.pt>',
            to: [emailNoiva],
            subject: `🔔 ${titulo}`,
            html,
          }),
        })
        emailEnviado = res.ok
      } catch { /* silencioso — fica gravado na mesma */ }
    }

    return NextResponse.json({ ok: true, id: nova.id, emailEnviado, emailNoiva: emailNoiva ?? null })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'erro' }, { status: 500 })
  }
}

function buildEmail(opts: { titulo: string; texto: string; nomeNoivos: string | null; portalUrl: string }): string {
  const safe = (s: string) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#120e09;border:0.5px solid #4a3a1e;">
        <tr><td style="padding:48px 56px;font-family:Georgia,'Times New Roman',serif;color:#efe7d6;">
          <p style="margin:0 0 10px;font-size:10px;letter-spacing:.5em;color:#c9a96e;text-transform:uppercase;">Nova Notificação</p>
          ${opts.nomeNoivos ? `<h1 style="margin:0 0 18px;font-size:26px;font-weight:400;color:#f0e8d8;line-height:1.2;">${safe(opts.nomeNoivos)}</h1>` : ''}
          <p style="margin:0 0 6px;font-size:19px;font-style:italic;color:#d7bd87;line-height:1.3;">${safe(opts.titulo)}</p>
          <div style="border-top:0.5px solid #4a3a1e;margin-top:18px;padding-top:20px;font-size:15px;line-height:1.75;color:#c3b8a3;">
            ${safe(opts.texto)}
          </div>
          <table cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td style="background:#c9a45c;border-radius:8px;">
            <a href="${opts.portalUrl}" style="display:inline-block;padding:13px 28px;font-family:Georgia,serif;font-size:12px;letter-spacing:.25em;text-transform:uppercase;color:#1a1306;text-decoration:none;font-weight:bold;">Consultar Portal</a>
          </td></tr></table>
          <p style="margin:26px 0 0;font-size:11px;color:#8c8170;letter-spacing:.05em;">RL Photo.Video · Wedding Moments</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}
