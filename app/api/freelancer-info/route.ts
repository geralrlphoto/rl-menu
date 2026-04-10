import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET(req: NextRequest) {
  const fid = req.nextUrl.searchParams.get('freelancer_id')
  if (!fid) return NextResponse.json({ error: 'freelancer_id required' }, { status: 400 })
  const { data, error } = await db().from('freelancer_info').select('*').eq('freelancer_id', fid).order('order_index')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ info: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { data, error } = await db().from('freelancer_info').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, info: data })
}

export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await db().from('freelancer_info').update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await db().from('freelancer_info').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
