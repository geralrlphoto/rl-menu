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
  const freelancer_id = searchParams.get('freelancer_id')
  let query = supabase()
    .from('freelancer_notificacoes')
    .select('*')
    .order('created_at', { ascending: false })
  if (freelancer_id) query = query.eq('freelancer_id', freelancer_id)
  const { data, error } = await query
  if (error) { console.error('[freelancer-notificacoes GET]', error); return NextResponse.json({ notificacoes: [] }) }
  return NextResponse.json({ notificacoes: data ?? [] })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { data, error } = await supabase().from('freelancer_notificacoes').insert(body).select().single()
  if (error) { console.error('[freelancer-notificacoes POST]', error); return NextResponse.json({ error: error.message }, { status: 500 }) }
  return NextResponse.json({ notificacao: data })
}

export async function PATCH(req: Request) {
  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data, error } = await supabase().from('freelancer_notificacoes').update(rest).eq('id', id).select().single()
  if (error) { console.error('[freelancer-notificacoes PATCH]', error); return NextResponse.json({ error: error.message }, { status: 500 }) }
  return NextResponse.json({ notificacao: data })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase().from('freelancer_notificacoes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
