import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const { data, error } = await db()
    .from('fotos_convidados')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ pedidos: [] })
  return NextResponse.json({ pedidos: data ?? [] })
}

export async function PATCH(req: Request) {
  const { id, status } = await req.json()
  const { error } = await db()
    .from('fotos_convidados')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
