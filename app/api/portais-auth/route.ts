import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// POST { referencia, password } → { ok: boolean }
export async function POST(req: NextRequest) {
  try {
    const { referencia, password } = await req.json()
    if (!referencia || !password) return NextResponse.json({ ok: false })
    const db = createClient(SUPABASE_URL, SUPABASE_KEY)
    const { data } = await db.from('portais').select('settings').ilike('referencia', referencia).maybeSingle()
    const stored = data?.settings?.portalPassword
    if (!stored) return NextResponse.json({ ok: true }) // no password set = open
    return NextResponse.json({ ok: stored === password })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
