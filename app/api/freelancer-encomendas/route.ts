import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const COLS = 'id, pedido, nome, email, telefone, noivos, data_casamento, morada, formato, quantidade, subtotal, portes, total, mensagem, fotografias, comprovativo_url, estado, metodo_pagamento, created_at, enviado_para_nome, enviado_em, pago, pago_em'

// GET: encomendas de fotos enviadas a um fotógrafo (?freelancer_id=<id>).
//   Lido pelo portal do membro (botão "Ver Encomendas"). Sem auth admin —
//   id-parametrizado, como as restantes APIs /api/freelancer-*.
export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get('freelancer_id')
  if (!fid) return NextResponse.json({ error: 'freelancer_id required' }, { status: 400 })
  const { data, error } = await db()
    .from('photo_orders')
    .select(COLS)
    .eq('enviado_para_id', fid)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ encomendas: data ?? [] })
}
