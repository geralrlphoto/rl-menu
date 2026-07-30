import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST { id } → (re)pedir a criação da pasta de impressão de uma encomenda de
//   papel. Repõe impressao_preparada_em a null (e limpa qualquer erro) para o
//   robô local a apanhar na próxima passagem e recriar a subpasta
//   "Impressão\<pedido> - <nome>". Útil quando a pasta não foi criada por falha
//   nalguma foto: depois de corrigir, pede-se de novo só para esta encomenda.
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  const id = String(b.id ?? '').trim()
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  // Só faz sentido em papel; confirma o formato antes de mexer.
  const sb = db()
  const { data: cur, error: selErr } = await sb.from('photo_orders').select('formato').eq('id', id).single()
  if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 })
  if (String(cur?.formato ?? '').toLowerCase() !== 'papel') {
    return NextResponse.json({ error: 'Esta encomenda não é de papel.' }, { status: 400 })
  }
  const { error } = await sb
    .from('photo_orders')
    .update({ impressao_preparada_em: null, envio_erro: null })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
