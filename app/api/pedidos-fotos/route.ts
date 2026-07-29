import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const COLS = 'id, pedido, nome, email, telefone, noivos, data_casamento, morada, formato, quantidade, subtotal, portes, total, mensagem, fotografias, comprovativo_url, referencia, estado, origem, responsavel, metodo_pagamento, mbway_conta, created_at, enviado_para_id, enviado_para_nome, enviado_em, fotos_enviadas_em, impressao_preparada_em'

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
  const { id, ids, referencia, estado, enviado_para_id, enviado_para_nome, fields } = body
  const supabase = db()

  // Edição completa dos dados de uma encomenda ({ id, fields }). Recalcula
  // subtotal/portes/total a partir de quantidade/formato (5€/foto, 4€ portes
  // só em papel com menos de 5 fotos).
  if (id && fields && typeof fields === 'object') {
    const f = fields
    const upd: Record<string, any> = {}
    const txt = ['nome', 'email', 'telefone', 'noivos', 'data_casamento', 'morada', 'mensagem', 'responsavel', 'metodo_pagamento', 'fotografias']
    for (const k of txt) if (f[k] !== undefined) upd[k] = (typeof f[k] === 'string' ? f[k].trim() : f[k]) || null
    if (f.formato !== undefined) upd.formato = String(f.formato).toLowerCase() === 'papel' ? 'papel' : 'digital'
    if (f.quantidade !== undefined) upd.quantidade = Math.max(0, parseInt(f.quantidade, 10) || 0)
    if (upd.quantidade !== undefined || upd.formato !== undefined) {
      const { data: cur } = await supabase.from('photo_orders').select('quantidade, formato').eq('id', id).single()
      const q = upd.quantidade !== undefined ? upd.quantidade : (cur?.quantidade ?? 0)
      const fmt = upd.formato !== undefined ? upd.formato : (cur?.formato ?? 'digital')
      const subtotal = q * 5
      const portes = (fmt === 'papel' && q < 5) ? 4 : 0
      upd.subtotal = subtotal; upd.portes = portes; upd.total = subtotal + portes
    }
    if (Object.keys(upd).length === 0) return NextResponse.json({ error: 'nada a atualizar' }, { status: 400 })
    const { error } = await supabase.from('photo_orders').update(upd).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, ...upd })
  }

  // Envio em grupo a VÁRIOS fotógrafos ({ ids, enviado_para_ids: [...] }).
  // Cada encomenda fica visível no portal de todos os fotógrafos indicados.
  if (Array.isArray(ids) && ids.length > 0 && Array.isArray(body.enviado_para_ids)) {
    const fids: string[] = body.enviado_para_ids.map((s: any) => String(s).trim()).filter(Boolean)
    const nome = (enviado_para_nome ?? '').trim() || null
    const updates = {
      enviado_para_ids: fids.length ? fids : null,
      enviado_para_id: fids[0] ?? null, // compat com fluxos/consultas antigas
      enviado_para_nome: fids.length ? nome : null,
      enviado_em: fids.length ? new Date().toISOString() : null,
    }
    const { error } = await supabase.from('photo_orders').update(updates).in('id', ids)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, ...updates, count: ids.length })
  }

  // Envio em grupo a um fotógrafo (ou anular envio com enviado_para_id vazio).
  if (Array.isArray(ids) && ids.length > 0 && enviado_para_id !== undefined) {
    const fid = (typeof enviado_para_id === 'string' && enviado_para_id.trim()) ? enviado_para_id.trim() : null
    const updates = {
      enviado_para_id: fid,
      enviado_para_ids: fid ? [fid] : null,
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
