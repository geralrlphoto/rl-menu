import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const RESEND_KEY  = process.env.RESEND_API_KEY
const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * POST { referencia, mensagem, nome_noivos?, email_noiva? }
 *
 * Recebe uma mensagem dos noivos e:
 *   1) Append em portais.settings.noivos_messages[] (sem migração)
 *   2) Envia email ao admin com o conteúdo
 *
 * A mensagem aparece nas notificações admin via /api/admin-notifications
 * (que lê o mesmo campo).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const referencia   = String(body?.referencia ?? '').trim()
    const titulo       = String(body?.titulo ?? '').trim()
    const mensagem     = String(body?.mensagem ?? '').trim()
    const nome_noivos  = String(body?.nome_noivos ?? '').trim() || null
    const email_noiva  = String(body?.email_noiva ?? '').trim() || null

    if (!referencia) return NextResponse.json({ ok: false, error: 'referencia required' }, { status: 400 })
    if (!mensagem)   return NextResponse.json({ ok: false, error: 'mensagem required' }, { status: 400 })
    if (mensagem.length > 2000) {
      return NextResponse.json({ ok: false, error: 'mensagem demasiado longa (máx 2000 caracteres)' }, { status: 400 })
    }

    const supabase = db()

    // 1) Append à lista de mensagens em portais.settings
    const { data: portalRow } = await supabase
      .from('portais')
      .select('settings')
      .ilike('referencia', referencia)
      .maybeSingle()

    const settings = (portalRow?.settings ?? {}) as Record<string, any>
    const messages = Array.isArray(settings.noivos_messages) ? settings.noivos_messages : []
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      ts: new Date().toISOString(),
      titulo: titulo || null,
      mensagem,
      nome_noivos,
      email_noiva,
      lida: false,
    }
    const newMessages = [...messages, newMessage]
    const newSettings = { ...settings, noivos_messages: newMessages }

    if (portalRow) {
      await supabase.from('portais').update({ settings: newSettings }).ilike('referencia', referencia)
    } else {
      // Cria row se ainda não existe (raro mas seguro)
      await supabase.from('portais').insert({ referencia, settings: newSettings })
    }

    // 2) Email ao admin
    if (RESEND_KEY) {
      try {
        const html = buildAdminEmail({ referencia, titulo, mensagem, nome_noivos, email_noiva })
        const assuntoEmail = titulo
          ? `💬 ${titulo} · ${referencia}`
          : `💬 Nova mensagem dos noivos · ${referencia}`
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'RL Photo.Video <geral@rlphotovideo.pt>',
            to: [ADMIN_EMAIL],
            subject: assuntoEmail,
            html,
            reply_to: email_noiva || undefined,
          }),
        })
      } catch { /* silencioso — fica gravado em settings na mesma */ }
    }

    return NextResponse.json({ ok: true, id: newMessage.id })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'erro' }, { status: 500 })
  }
}

function buildAdminEmail(opts: {
  referencia: string
  titulo: string
  mensagem: string
  nome_noivos: string | null
  email_noiva: string | null
}): string {
  const safe = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#120e09;border:0.5px solid #4a3a1e;">
        <tr><td style="padding:48px 56px;font-family:Georgia,'Times New Roman',serif;color:#efe7d6;">
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:.5em;color:#c9a96e;text-transform:uppercase;">Mensagem dos Noivos</p>
          <h1 style="margin:6px 0 14px;font-size:30px;font-weight:400;color:#f0e8d8;line-height:1.2;">${safe(opts.nome_noivos ?? 'Casal')}</h1>
          ${opts.titulo ? `
            <p style="margin:0 0 4px;font-size:10px;letter-spacing:.4em;color:#7a6340;text-transform:uppercase;">Assunto</p>
            <p style="margin:0 0 18px;font-size:18px;font-family:Georgia,serif;font-style:italic;color:#d7bd87;line-height:1.3;">${safe(opts.titulo)}</p>
          ` : ''}
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:.4em;color:#7a6340;text-transform:uppercase;">Referência</p>
          <p style="margin:0 0 22px;font-size:13px;font-family:'Courier New',monospace;color:#c9b88a;">${safe(opts.referencia)}</p>

          <div style="border-top:0.5px solid #4a3a1e;padding-top:22px;font-size:15px;line-height:1.75;color:#c3b8a3;">
            ${safe(opts.mensagem)}
          </div>

          ${opts.email_noiva ? `
            <p style="margin:24px 0 0;font-size:12px;color:#8c8170;">
              Responde directamente a este email — chega à noiva (${safe(opts.email_noiva)}).
            </p>
          ` : ''}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}
