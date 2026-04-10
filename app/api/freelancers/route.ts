import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET() {
  const { data, error } = await supabase()
    .from('freelancers')
    .select('*')
    .order('order_index')
    .order('nome')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ freelancers: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { nome, status, contato, email, nome_sos, contato_sos, order_index } = body
  if (!nome) return NextResponse.json({ error: 'nome required' }, { status: 400 })
  const { data, error } = await supabase()
    .from('freelancers')
    .insert({ nome, status: status ?? null, contato: contato ?? null, email: email ?? null, nome_sos: nome_sos ?? null, contato_sos: contato_sos ?? null, order_index: order_index ?? 0, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, freelancer: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase()
    .from('freelancers')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase().from('freelancers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
