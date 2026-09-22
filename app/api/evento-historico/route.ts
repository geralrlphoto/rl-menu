import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Histórico de ações de um evento. As entradas chegam por gatilhos na base de
// dados: umas sabem o id do evento (eventos_2026, links do freelancer), outras
// só sabem a referência (portal dos noivos, pagamentos). Lê as duas.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventoId = searchParams.get('evento_id')
  const ref = searchParams.get('ref')
  if (!eventoId && !ref) return NextResponse.json({ historico: [] })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let q = supabase
    .from('evento_historico')
    .select('id,tipo,titulo,detalhe,created_at')
    .order('created_at', { ascending: false })
    .limit(150)

  // A sintaxe do .or() não aceita vírgulas nem aspas no valor
  const refSeguro = ref && /^[\w.\- ]+$/.test(ref) ? ref : null

  if (eventoId && refSeguro) q = q.or(`evento_id.eq.${eventoId},referencia.eq.${refSeguro}`)
  else if (eventoId) q = q.eq('evento_id', eventoId)
  else if (refSeguro) q = q.eq('referencia', refSeguro)
  else return NextResponse.json({ historico: [] })

  const { data, error } = await q
  if (error) return NextResponse.json({ historico: [], error: error.message }, { status: 500 })
  return NextResponse.json({ historico: data ?? [] })
}
