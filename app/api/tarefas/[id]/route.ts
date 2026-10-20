import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { emailRespostaNoivos } from '@/lib/emailsNoivos'
import { SITE_URL } from '@/lib/site-url'
import { portalPathFor } from '@/lib/noivos-session'

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
        const batizado = String(ref).toUpperCase().startsWith('BAT')
        const html = emailRespostaNoivos({
          nomes: updated.nome_noivos,
          titulo: updated.titulo,
          mensagemOriginal: updated.mensagem,
          resposta,
          data: settings.data ?? null,
          batizado,
          portalUrl: `${SITE_URL}${portalPathFor(ref, batizado ? 'batizado' : 'casamento')}`,
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
  revalidateTag('photo-reunioes-tarefa', { expire: 0 })
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
  revalidateTag('photo-reunioes-tarefa', { expire: 0 })
  return NextResponse.json({ ok: true })
}
