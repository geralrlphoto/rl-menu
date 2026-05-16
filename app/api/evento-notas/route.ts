import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Tabela `evento_notas` (criar uma vez no Supabase):
//
//   create table if not exists evento_notas (
//     referencia text primary key,
//     nota text,
//     updated_at timestamptz default now()
//   );
//
// GET    ?ref=CAS_001_26_RL      → { nota, updated_at }
// PUT    body: { referencia, nota } → upsert (admin guarda nota livre)

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })
  const { data, error } = await db()
    .from('evento_notas')
    .select('nota, updated_at')
    .eq('referencia', ref)
    .maybeSingle()
  if (error) {
    if (/relation .* does not exist/.test(error.message)) {
      return NextResponse.json({ nota: '', _warning: 'Tabela evento_notas ainda não criada.' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ nota: data?.nota ?? '', updated_at: data?.updated_at ?? null })
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const referencia = String(body.referencia ?? '').trim()
    const nota       = body.nota == null ? '' : String(body.nota)
    if (!referencia) return NextResponse.json({ error: 'referencia obrigatória' }, { status: 400 })

    const { error } = await db()
      .from('evento_notas')
      .upsert({ referencia, nota, updated_at: new Date().toISOString() }, { onConflict: 'referencia' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
