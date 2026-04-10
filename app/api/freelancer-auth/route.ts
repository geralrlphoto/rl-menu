import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const { id, password } = await req.json()
  if (!id || !password) return NextResponse.json({ ok: false, reason: 'missing_fields' })
  const { data, error } = await db().from('freelancers').select('id, password').eq('id', id).single()
  if (error) return NextResponse.json({ ok: false, reason: 'db_error', detail: error.message })
  if (!data) return NextResponse.json({ ok: false, reason: 'not_found' })
  if (!data.password) return NextResponse.json({ ok: false, reason: 'no_password' })
  return NextResponse.json({ ok: data.password.trim() === password.trim() })
}
