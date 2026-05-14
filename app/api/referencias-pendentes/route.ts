import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Tabela `referencias_pendentes` (criar uma vez):
//
//   create table if not exists referencias_pendentes (
//     referencia text primary key,
//     nota text,
//     created_at timestamptz default now()
//   );
//
// GET    → { pendentes: ['CAS_037_26_RL', ...] }
// POST   { referencia, nota? } → marca como pendente (upsert)
// DELETE ?ref=CAS_037_26_RL    → remove

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET() {
  const { data, error } = await db()
    .from('referencias_pendentes')
    .select('referencia, nota, created_at')
    .order('referencia')
  if (error) {
    // Devolve lista vazia em vez de 500 (caso tabela ainda não exista)
    if (/relation .* does not exist/.test(error.message)) {
      return NextResponse.json({ pendentes: [], _warning: 'Tabela referencias_pendentes ainda não foi criada — corre o SQL no Supabase.' })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ pendentes: data ?? [] })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const referencia = String(body.referencia ?? '').trim().toUpperCase()
    const nota = body.nota != null ? String(body.nota).trim() : null
    if (!referencia) return NextResponse.json({ error: 'referencia obrigatória' }, { status: 400 })
    const { error } = await db()
      .from('referencias_pendentes')
      .upsert({ referencia, nota }, { onConflict: 'referencia' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })
  const { error } = await db()
    .from('referencias_pendentes')
    .delete()
    .eq('referencia', ref.toUpperCase())
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
