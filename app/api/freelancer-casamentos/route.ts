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
  const { data, error } = await db().from('freelancer_casamentos').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, casamento: data })
}

export async function PATCH(req: NextRequest) {
  const { id, confirmado_em, indisponivel_em, confirmado_videografo_em, indisponivel_videografo_em, ...fields } = await req.json()
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

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await db().from('freelancer_casamentos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
