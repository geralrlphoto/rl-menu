import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Movimentos manuais (despesas e receitas). ?projeto=REF filtra por projeto.
export async function GET(req: NextRequest) {
  const projeto = req.nextUrl.searchParams.get('projeto')
  let q = supabase.from('media_despesas').select('*').order('data', { ascending: false })
  if (projeto) q = q.eq('projeto_ref', projeto.toUpperCase())
  const { data, error } = await q

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ despesas: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, descricao, categoria, valor, projeto_ref, notas } = body
  const tipo = body.tipo === 'receita' ? 'receita' : 'despesa'

  if (!data || !descricao || !categoria || !valor) {
    return NextResponse.json({ error: 'Campos obrigatórios em falta' }, { status: 400 })
  }

  const { data: row, error } = await supabase
    .from('media_despesas')
    .insert({ tipo, data, descricao, categoria, valor: Number(valor), projeto_ref: projeto_ref ? String(projeto_ref).toUpperCase() : null, notas: notas || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, despesa: row })
}
