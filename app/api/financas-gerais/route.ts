import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest) {
  const ano = req.nextUrl.searchParams.get('ano') ?? '2025'
  const sb = supabase()
  const { data, error } = await sb
    .from('financas_gerais')
    .select('*')
    .eq('ano', parseInt(ano))
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const sb = supabase()
  const { data, error } = await sb
    .from('financas_gerais')
    .insert([{
      ano:       body.ano,
      tipo:      body.tipo,
      mes:       body.mes,
      data:      body.data ?? '',
      categoria: body.categoria ?? '',
      valor:     body.valor ?? 0,
      info:      body.info ?? '',
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'No id' }, { status: 400 })

  const sb = supabase()
  const { error } = await sb.from('financas_gerais').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
