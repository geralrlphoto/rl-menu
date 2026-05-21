import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const allowed = ['label', 'cor', 'duracao_default_minutos', 'ordem']
  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  for (const [k, v] of Object.entries(body)) {
    if (allowed.includes(k)) updates[k] = v
  }
  const { error } = await db().from('time_block_categorias').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = db()

  // Block deletion of fixo categorias
  const { data: cat } = await supabase
    .from('time_block_categorias').select('fixo, key').eq('id', id).maybeSingle()
  if (cat?.fixo) {
    return NextResponse.json({ error: 'Esta categoria não pode ser eliminada (é um preset fixo).' }, { status: 400 })
  }

  const { error } = await supabase.from('time_block_categorias').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
