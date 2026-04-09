import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET /api/contrato-clausulas?eventoId=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const eventoId = searchParams.get('eventoId')
  if (!eventoId) return NextResponse.json({ error: 'eventoId em falta' }, { status: 400 })

  const { data, error } = await supabase
    .from('contrato_clausulas')
    .select('clausulas')
    .eq('evento_id', eventoId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clausulas: data?.clausulas ?? null })
}

// POST /api/contrato-clausulas  { eventoId, clausulas }
export async function POST(req: Request) {
  const { eventoId, clausulas } = await req.json()
  if (!eventoId || !clausulas) return NextResponse.json({ error: 'Dados em falta' }, { status: 400 })

  const { error } = await supabase
    .from('contrato_clausulas')
    .upsert({ evento_id: eventoId, clausulas, updated_at: new Date().toISOString() }, { onConflict: 'evento_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
