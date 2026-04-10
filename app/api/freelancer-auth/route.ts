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
  if (!id || !password) return NextResponse.json({ ok: false })
  const { data } = await db().from('freelancers').select('password').eq('id', id).single()
  if (!data?.password) return NextResponse.json({ ok: false, reason: 'no_password' })
  return NextResponse.json({ ok: data.password.trim() === password.trim() })
}
