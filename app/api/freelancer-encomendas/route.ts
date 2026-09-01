import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeSessao, exigeAdmin } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const COLS = 'id, pedido, nome, email, telefone, noivos, data_casamento, morada, formato, quantidade, subtotal, portes, total, mensagem, fotografias, comprovativo_url, estado, origem, metodo_pagamento, created_at, enviado_para_nome, enviado_em'

// GET: encomendas de fotos enviadas a um fotógrafo (?freelancer_id=<id>).
//   Lido pelo portal do membro (botão "Ver Encomendas"). Sem auth admin —
//   id-parametrizado, como as restantes APIs /api/freelancer-*.
export async function GET(req: NextRequest) {
  const barrado = await exigeSessao(req)
  if (barrado) return barrado

  const fid = req.nextUrl.searchParams.get('freelancer_id')
  if (!fid) return NextResponse.json({ error: 'freelancer_id required' }, { status: 400 })
  // Mostra encomendas enviadas a este fotógrafo, quer como destinatário único
  // (enviado_para_id), quer quando faz parte de um envio a vários (enviado_para_ids).
  const { data, error } = await db()
    .from('photo_orders')
    .select(COLS)
    .or(`enviado_para_id.eq.${fid},enviado_para_ids.cs.{${fid}}`)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ encomendas: data ?? [] })
}

// PATCH: o fotógrafo atualiza o estado de uma encomenda que lhe foi enviada
//   ({ id, estado, freelancer_id }). A alteração só é permitida nas encomendas
//   com enviado_para_id = freelancer_id (não toca em encomendas de outros).
//   Fica no mesmo photo_orders.estado, por isso sincroniza com a página admin.
export async function PATCH(req: NextRequest) {
  const barrado = await exigeSessao(req)
  if (barrado) return barrado

  const { id, estado, freelancer_id } = await req.json().catch(() => ({}))
  if (!id || !freelancer_id) return NextResponse.json({ error: 'id e freelancer_id obrigatórios' }, { status: 400 })
  const novoEstado = estado === 'Entregue' ? 'Entregue' : 'Aguardar'
  const { error } = await db()
    .from('photo_orders')
    .update({ estado: novoEstado })
    .eq('id', id)
    .eq('enviado_para_id', freelancer_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, estado: novoEstado })
}
