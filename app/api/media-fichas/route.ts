import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

// Fichas de cliente da RL PROD. Os campos da ficha vão inteiros em `dados`;
// `ref` e `nome` ficam à parte para a lista de fichas guardadas.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const { data, error } = await supabase.from('media_fichas').select('id, dados, atualizado_em').eq('id', id).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Lista leve: só o que aparece na escolha de fichas
  const { data, error } = await supabase
    .from('media_fichas')
    .select('id, ref, nome, empresa:dados->>empresa, estado:dados->>estado, atualizado_em')
    .order('atualizado_em', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const { id, dados } = await req.json() as { id?: string | null; dados: Record<string, string> }
  if (!dados?.nome?.trim()) return NextResponse.json({ error: 'Nome do cliente é obrigatório.' }, { status: 400 })

  const linha = { ref: dados.ref?.trim() || null, nome: dados.nome.trim(), dados, atualizado_em: new Date().toISOString() }
  const { data, error } = id
    ? await supabase.from('media_fichas').update(linha).eq('id', id).select('id, atualizado_em').single()
    : await supabase.from('media_fichas').insert(linha).select('id, atualizado_em').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, ...data })
}

export async function DELETE(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 })
  const { error } = await supabase.from('media_fichas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
