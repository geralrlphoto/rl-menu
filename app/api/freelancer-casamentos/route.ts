import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get('freelancer_id')
  if (!fid) return NextResponse.json({ error: 'freelancer_id required' }, { status: 400 })
  const { data, error } = await db().from('freelancer_casamentos').select('*').eq('freelancer_id', fid).order('data_casamento')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ casamentos: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  // Tentar primeiro com servicos_dia (e referencia se passada); se falhar, retry sem essas colunas opcionais
  const { servicos_dia, referencia, ...core } = body
  const supabase = db()
  let { data, error } = await supabase.from('freelancer_casamentos').insert({ ...core, servicos_dia, referencia }).select().single()
  if (error && /column .* (servicos_dia|referencia)/i.test(error.message)) {
    // Retry sem as colunas opcionais
    const res2 = await supabase.from('freelancer_casamentos').insert(core).select().single()
    data = res2.data; error = res2.error
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, casamento: data })
}

export async function PATCH(req: NextRequest) {
  const { id, confirmado_em, indisponivel_em, confirmado_videografo_em, indisponivel_videografo_em, servicos_dia, referencia, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = db()

  // 1 — save core fields (always works)
  const { error } = await supabase.from('freelancer_casamentos').update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 2 — save timestamps separately (silently ignored if columns don't exist yet)
  const tsFields: Record<string, string> = {}
  if (confirmado_em)              tsFields.confirmado_em              = confirmado_em
  if (indisponivel_em)            tsFields.indisponivel_em            = indisponivel_em
  if (confirmado_videografo_em)   tsFields.confirmado_videografo_em   = confirmado_videografo_em
  if (indisponivel_videografo_em) tsFields.indisponivel_videografo_em = indisponivel_videografo_em

  if (Object.keys(tsFields).length > 0) {
    await supabase.from('freelancer_casamentos').update(tsFields).eq('id', id).then(() => {}).catch(() => {})
  }

  // 3 — save optional fields (servicos_dia, referencia) — silently ignored if columns don't exist yet
  const optFields: Record<string, any> = {}
  if (servicos_dia !== undefined) optFields.servicos_dia = servicos_dia
  if (referencia !== undefined)   optFields.referencia   = referencia
  if (Object.keys(optFields).length > 0) {
    await supabase.from('freelancer_casamentos').update(optFields).eq('id', id).then(() => {}).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await db().from('freelancer_casamentos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
