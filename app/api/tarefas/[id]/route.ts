import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const RESEND_KEY = process.env.RESEND_API_KEY

// Tarefas virtuais de mensagens dos noivos: id = "noivos_msg::<REF>::<MSG_ID>"
async function patchNoivosMsg(virtualId: string, body: any) {
  const supabase = db()
  const parts = virtualId.split('::')
  if (parts.length < 3) return { ok: false, error: 'invalid_id' }
  const [, ref, msgId] = parts
  const { data: portal } = await supabase
    .from('portais')
    .select('settings')
    .ilike('referencia', ref)
    .maybeSingle()
  if (!portal) return { ok: false, error: 'portal_not_found' }
  const settings = (portal.settings ?? {}) as Record<string, any>
  const msgs = Array.isArray(settings.noivos_messages) ? settings.noivos_messages : []
  const idx = msgs.findIndex((m: any) => m?.id === msgId)
  if (idx < 0) return { ok: false, error: 'msg_not_found' }
  const updated = { ...msgs[idx] }

  // Resposta do admin — envia email aos noivos e marca como respondido
  const resposta = String(body?.resposta ?? '').trim()
  if (resposta) {
    updated.resposta = resposta
    updated.respondido_em = new Date().toISOString()
    // Envia email à noiva
    if (RESEND_KEY && updated.email_noiva) {
      try {
        const html = buildNoivaReplyEmail({
          nome_noivos: updated.nome_noivos,
          titulo: updated.titulo,
          mensagem_original: updated.mensagem,
          resposta,
        })
        const subj = updated.titulo
          ? `RE: ${updated.titulo}`
          : 'Resposta da RL Photo · Video'
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'RL Photo.Video <geral@rlphotovideo.pt>',
            to: [updated.email_noiva],
            subject: subj,
            html,
          }),
        })
      } catch { /* silencioso — fica gravada na mesma */ }
    }
  }

  if (body.status === 'CONCLUIDA') {
    updated.respondido_em = updated.respondido_em ?? new Date().toISOString()
  } else if (body.status && body.status !== 'CONCLUIDA' && !resposta) {
    delete updated.respondido_em
    delete updated.resposta
  }
  const newMsgs = [...msgs]
  newMsgs[idx] = updated
  await supabase
    .from('portais')
    .update({ settings: { ...settings, noivos_messages: newMsgs } })
    .ilike('referencia', ref)
  return { ok: true }
}

function buildNoivaReplyEmail(opts: {
  nome_noivos?: string | null
  titulo?: string | null
  mensagem_original?: string | null
  resposta: string
}): string {
  const safe = (s: string | null | undefined) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
  const primeiro = (opts.nome_noivos ?? '').split(/[\s&]/)[0] || 'Olá'
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#120e09;border:0.5px solid #4a3a1e;">
        <tr><td style="padding:48px 56px;font-family:Georgia,'Times New Roman',serif;color:#efe7d6;">
          <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
            width="80" alt="RL" style="display:block;margin:0 auto 24px;width:80px;opacity:.9" />
          <p style="margin:0 0 4px;font-size:24px;font-style:italic;font-weight:300;color:#c9a96e;text-align:center;">Olá, ${safe(primeiro)}!</p>
          <p style="margin:0 0 18px;font-size:32px;font-weight:400;color:#f0e8d8;text-align:center;line-height:1.15;">Resposta da nossa equipa</p>
          <div style="text-align:center;margin:0 0 28px;color:#6a5430;font-size:12px;letter-spacing:.35em;">— · ◆ · —</div>

          ${opts.titulo ? `
            <p style="margin:0 0 4px;font-size:10px;letter-spacing:.4em;color:#7a6340;text-transform:uppercase;">Assunto</p>
            <p style="margin:0 0 22px;font-size:16px;font-style:italic;color:#d7bd87;line-height:1.3;">${safe(opts.titulo)}</p>
          ` : ''}

          <div style="border-left:2px solid rgba(200,168,102,.4);padding:0 0 0 18px;margin:0 0 28px;font-size:14px;line-height:1.7;color:#c3b8a3;">
            ${safe(opts.resposta)}
          </div>

          ${opts.mensagem_original ? `
            <p style="margin:24px 0 6px;font-size:10px;letter-spacing:.4em;color:#5f574b;text-transform:uppercase;">A vossa mensagem original</p>
            <div style="font-size:13px;line-height:1.65;color:#8c8170;font-style:italic;border-top:0.5px solid #3a2a12;padding-top:14px;">
              ${safe(opts.mensagem_original)}
            </div>
          ` : ''}

          <p style="margin:32px 0 0;font-size:12px;color:#7a6340;text-align:center;letter-spacing:.04em;">
            Com os melhores cumprimentos,<br>
            <strong style="color:#c9b88a;">RL Photo · Video</strong>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

async function deleteNoivosMsg(virtualId: string) {
  const supabase = db()
  const parts = virtualId.split('::')
  if (parts.length < 3) return { ok: false, error: 'invalid_id' }
  const [, ref, msgId] = parts
  const { data: portal } = await supabase
    .from('portais')
    .select('settings')
    .ilike('referencia', ref)
    .maybeSingle()
  if (!portal) return { ok: false, error: 'portal_not_found' }
  const settings = (portal.settings ?? {}) as Record<string, any>
  const msgs = Array.isArray(settings.noivos_messages) ? settings.noivos_messages : []
  const newMsgs = msgs.filter((m: any) => m?.id !== msgId)
  await supabase
    .from('portais')
    .update({ settings: { ...settings, noivos_messages: newMsgs } })
    .ilike('referencia', ref)
  return { ok: true }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  if (id.startsWith('noivos_msg::')) {
    const r = await patchNoivosMsg(id, body)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  const allowed = ['titulo', 'descricao', 'status', 'data_prazo', 'hora', 'evento_id', 'assigned_to']
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const [k, v] of Object.entries(body)) {
    if (allowed.includes(k)) updates[k] = v
  }

  let { error } = await db().from('tarefas').update(updates).eq('id', id)
  // Se a coluna assigned_to ainda não existe (migration por correr), tentar
  // novamente sem esse campo. Os updates ficam guardados na mesma; apenas o
  // registo de envios não persiste até o user correr o ALTER TABLE.
  if (error && 'assigned_to' in updates && /assigned_to/i.test(error.message ?? '')) {
    const { assigned_to: _omitido, ...rest } = updates
    const retry = await db().from('tarefas').update(rest).eq('id', id)
    error = retry.error
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (id.startsWith('noivos_msg::')) {
    const r = await deleteNoivosMsg(id)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  const { error } = await db().from('tarefas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
