import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const COLS = 'id, pedido, nome, email, telefone, noivos, data_casamento, morada, formato, quantidade, subtotal, portes, total, mensagem, fotografias, comprovativo_url, referencia, estado, created_at'

// GET: lista pedidos de fotos (admin). ?referencia=<ref> filtra por casamento.
export async function GET(req: NextRequest) {
  const referencia = req.nextUrl.searchParams.get('referencia')
  const supabase = db()
  let query = supabase.from('photo_orders').select(COLS).order('created_at', { ascending: false })
  if (referencia) query = query.eq('referencia', referencia)
  const { data, error } = await query.limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ pedidos: data ?? [] })
}

// PATCH: atualiza a referência do casamento e/ou o estado de um pedido.
export async function PATCH(req: NextRequest) {
  const { id, referencia, estado } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const supabase = db()
  const updates: Record<string, any> = {}
  if (referencia !== undefined) updates.referencia = (typeof referencia === 'string' && referencia.trim()) ? referencia.trim() : null
  if (estado !== undefined) updates.estado = (estado === 'Entregue') ? 'Entregue' : 'Aguardar'
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'nada a atualizar' }, { status: 400 })
  const { error } = await supabase.from('photo_orders').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, ...updates })
}
