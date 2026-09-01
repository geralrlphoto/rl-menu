import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const RESEND_KEY = process.env.RESEND_API_KEY
const SITE_URL = 'https://portal.rlphotovideo.pt'

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
  // Email = apenas o card "Notificação Noivos", clicável para o portal.
  const cardUrl = `${SITE_URL}/notificacao-noivos.png`
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:24px 16px;">
    <tr><td align="center">
      <a href="${opts.portalUrl}" style="text-decoration:none;">
        <img src="${cardUrl}" alt="Nova Notificação — Consultar Portal" width="360" style="display:block;width:100%;max-width:360px;height:auto;border:0;" />
      </a>
    </td></tr>
  </table>
</body></html>`
}
