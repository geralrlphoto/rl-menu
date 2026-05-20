import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const data = searchParams.get('data')   // YYYY-MM-DD

  let q = db().from('time_blocks').select('*').order('ordem', { ascending: true })
  if (data) q = q.eq('data', data)

  const { data: rows, error } = await q
  if (error) return NextResponse.json({ blocks: [], error: error.message }, { status: 500 })
  return NextResponse.json({ blocks: rows ?? [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { data, categoria, titulo, cor, duracao_minutos, ordem } = body

  if (!data || !categoria || !titulo || !cor || !duracao_minutos) {
    return NextResponse.json({ error: 'campos obrigatórios em falta' }, { status: 400 })
  }

  const { data: row, error } = await db()
    .from('time_blocks')
    .insert({
      data,
      categoria,
      titulo: String(titulo).trim(),
      cor,
      duracao_minutos: Number(duracao_minutos),
      ordem: ordem ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ block: row })
}
