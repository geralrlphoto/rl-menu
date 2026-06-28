import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const COLS = 'id, pedido, nome, email, telefone, noivos, data_casamento, morada, formato, quantidade, subtotal, portes, total, mensagem, fotografias, comprovativo_url, referencia, estado, origem, responsavel, metodo_pagamento, mbway_conta, created_at, enviado_para_id, enviado_para_nome, enviado_em'

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

// PATCH: atualiza a referência do casamento e/ou o estado de um pedido,
//   ou envia um grupo de encomendas ({ ids }) a um fotógrafo ({ enviado_para_id }).
export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { id, ids, referencia, estado, enviado_para_id, enviado_para_nome } = body
  const supabase = db()

  // Envio em grupo a um fotógrafo (ou anular envio com enviado_para_id vazio).
  if (Array.isArray(ids) && ids.length > 0 && enviado_para_id !== undefined) {
    const fid = (typeof enviado_para_id === 'string' && enviado_para_id.trim()) ? enviado_para_id.trim() : null
    const updates = {
      enviado_para_id: fid,
      enviado_para_nome: fid ? ((enviado_para_nome ?? '').trim() || null) : null,
      enviado_em: fid ? new Date().toISOString() : null,
    }
    const { error } = await supabase.from('photo_orders').update(updates).in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, ...updates, count: ids.length })
  }

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const updates: Record<string, any> = {}
  if (referencia !== undefined) updates.referencia = (typeof referencia === 'string' && referencia.trim()) ? referencia.trim() : null
  if (estado !== undefined) updates.estado = (estado === 'Entregue') ? 'Entregue' : 'Aguardar'
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'nada a atualizar' }, { status: 400 })
  const { error } = await supabase.from('photo_orders').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, ...updates })
}

// DELETE: apaga uma encomenda ({ id }) ou várias de uma vez ({ ids: [...] }),
//   usado para apagar todas as encomendas de um casamento.
export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const ids: string[] = Array.isArray(body?.ids)
    ? body.ids.filter((x: any) => typeof x === 'string' && x)
    : (body?.id ? [body.id] : [])
  if (ids.length === 0) return NextResponse.json({ error: 'id(s) required' }, { status: 400 })
  const supabase = db()
  const { error } = await supabase.from('photo_orders').delete().in('id', ids)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, deleted: ids.length })
}
