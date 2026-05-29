import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

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
  if (body.status === 'CONCLUIDA') {
    updated.respondido_em = new Date().toISOString()
  } else if (body.status && body.status !== 'CONCLUIDA') {
    delete updated.respondido_em
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

  const allowed = ['titulo', 'descricao', 'status', 'data_prazo', 'hora', 'evento_id']
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const [k, v] of Object.entries(body)) {
    if (allowed.includes(k)) updates[k] = v
  }

  const { error } = await db().from('tarefas').update(updates).eq('id', id)
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
