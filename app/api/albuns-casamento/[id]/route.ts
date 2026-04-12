import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const ALLOWED_FIELDS = new Set([
  'nome', 'status', 'data_entrega_fotos', 'prazo_maquete', 'data_aprovacao',
  'prazo_album', 'entrega_album', 'prazo_final_maquete', 'data_prevista_entrega',
  'ref_evento', 'ref_album', 'design', 'num_fotografias', 'numero_fotografias',
  'opcao', 'texto_album', 'texto_caixa',
])

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const update: Record<string, any> = {}
  for (const [field, val] of Object.entries(body)) {
    if (ALLOWED_FIELDS.has(field)) update[field] = val ?? null
  }
  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })

  const { error } = await db()
    .from('albuns_casamento')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await db()
    .from('albuns_casamento')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
