import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const freelancer_id  = searchParams.get('freelancer_id')
  const casamento_id   = searchParams.get('casamento_id')
  let query = supabase()
    .from('freelancer_mensagens')
    .select('*')
    .order('created_at', { ascending: true })
  if (freelancer_id) query = query.eq('freelancer_id', freelancer_id)
  if (casamento_id)  query = query.eq('casamento_id', casamento_id)
  const { data, error } = await query
  if (error) { console.error('[freelancer-mensagens GET]', error); return NextResponse.json({ mensagens: [] }) }
  return NextResponse.json({ mensagens: data ?? [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { data, error } = await supabase().from('freelancer_mensagens').insert(body).select().single()
  if (error) { console.error('[freelancer-mensagens POST]', error); return NextResponse.json({ error: error.message }, { status: 500 }) }
  return NextResponse.json({ mensagem: data })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data, error } = await supabase().from('freelancer_mensagens').update(rest).eq('id', id).select().single()
  if (error) { console.error('[freelancer-mensagens PATCH]', error); return NextResponse.json({ error: error.message }, { status: 500 }) }
  return NextResponse.json({ mensagem: data })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase().from('freelancer_mensagens').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
