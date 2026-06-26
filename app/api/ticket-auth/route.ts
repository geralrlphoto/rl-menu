import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const KEY = 'ticket_password'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
function isAdmin(req: NextRequest) {
  return req.cookies.get('rl_auth')?.value === process.env.AUTH_SECRET
}
async function getPassword(supabase: ReturnType<typeof db>) {
  const { data } = await supabase.from('app_config').select('value').eq('key', KEY).maybeSingle()
  return (data?.value ?? '').trim()
}

// GET: devolve a password atual — só para admin (para "ver/alterar").
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const supabase = db()
  const password = await getPassword(supabase)
  return NextResponse.json({ password, hasPassword: !!password })
}

// POST: { action: 'check' | 'save' | 'delete', password? }
export async function POST(req: NextRequest) {
  const { action, password } = await req.json().catch(() => ({}))
  const supabase = db()

  if (action === 'check') {
    const stored = await getPassword(supabase)
    return NextResponse.json({ ok: !stored || (password ?? '').trim() === stored })
  }

  // save / delete — só admin
  if (!isAdmin(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  if (action === 'save') {
    const pw = (password ?? '').trim()
    if (!pw) return NextResponse.json({ error: 'password vazia' }, { status: 400 })
    const { error } = await supabase.from('app_config').upsert({ key: KEY, value: pw, updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }
  if (action === 'delete') {
    await supabase.from('app_config').delete().eq('key', KEY)
    return NextResponse.json({ ok: true })
  }
  return NextResponse.json({ error: 'ação inválida' }, { status: 400 })
}
