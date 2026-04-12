import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  if (!ref) return NextResponse.json({ id: null, data_prevista_entrega: null, status: null })

  const { data } = await db()
    .from('albuns_casamento')
    .select('id, nome, status, num_fotografias, data_entrega_fotos, data_aprovacao, data_prevista_entrega')
    .eq('ref_evento', ref)
    .maybeSingle()

  if (!data) return NextResponse.json({ id: null, status: null, nome: null, num_fotografias: null, data_entrega_fotos: null, data_aprovacao: null, data_prevista_entrega: null })

  return NextResponse.json({
    id:                  data.id,
    nome:                data.nome ?? null,
    status:              data.status ?? null,
    num_fotografias:     data.num_fotografias ?? null,
    data_entrega_fotos:  data.data_entrega_fotos ?? null,
    data_aprovacao:      data.data_aprovacao ?? null,
    data_prevista_entrega: data.data_prevista_entrega ?? null,
  })
}
