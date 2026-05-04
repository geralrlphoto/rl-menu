import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('media_despesas')
    .select('*')
    .order('data', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ despesas: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, descricao, categoria, valor, projeto_ref, notas } = body

  if (!data || !descricao || !categoria || !valor) {
    return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
  }

  const { data: row, error } = await supabase
    .from('media_despesas')
    .insert({ data, descricao, categoria, valor: Number(valor), projeto_ref: projeto_ref || null, notas: notas || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, despesa: row })
}
