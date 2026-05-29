import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NV_COOKIE_NAME, verifyNvSession } from '@/lib/noivos-session'

export const dynamic = 'force-dynamic'

/**
 * Presença dos NOIVOS — análoga a /api/freelancer-presence.
 *
 * Armazena last_seen por `referencia` numa row única em `portais` com
 * `referencia = __noivos_presence__` (sem migrações de schema).
 *
 * GET  → mapa { last_seen: { '<ref>': '<iso>', ... }, now }
 *        + lista de nomes/data dos casamentos com noivos online (extra
 *        para o admin dashboard).
 * POST → atualiza last_seen para a referencia da sessão actual (cookie
 *        nv_session). Sem sessão devolve 401.
 */
const PRESENCE_REF = '__noivos_presence__'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function readPresence(): Promise<Record<string, string>> {
  const supabase = db()
  const { data } = await supabase
    .from('portais')
    .select('settings')
    .eq('referencia', PRESENCE_REF)
    .maybeSingle()
  return (data?.settings?.last_seen ?? {}) as Record<string, string>
}

async function writePresence(referencia: string): Promise<string> {
  const supabase = db()
  const now = new Date().toISOString()
  const { data: existing } = await supabase
    .from('portais')
    .select('settings')
    .eq('referencia', PRESENCE_REF)
    .maybeSingle()
  const settings = (existing?.settings ?? {}) as Record<string, any>
  const last_seen = (settings.last_seen ?? {}) as Record<string, string>
  last_seen[referencia] = now
  const newSettings = { ...settings, last_seen }
  if (existing) {
    await supabase.from('portais').update({ settings: newSettings }).eq('referencia', PRESENCE_REF)
  } else {
    await supabase.from('portais').insert({ referencia: PRESENCE_REF, settings: newSettings })
  }
  return now
}

export async function GET() {
  try {
    const lastSeen = await readPresence()
    return NextResponse.json({ last_seen: lastSeen, now: new Date().toISOString() })
  } catch (err: any) {
    return NextResponse.json({ last_seen: {}, error: err?.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const flCookie = req.cookies.get(NV_COOKIE_NAME)?.value
    const session = await verifyNvSession(flCookie)
    if (!session?.referencia) {
      return NextResponse.json({ ok: false, error: 'no_session' }, { status: 401 })
    }
    const ts = await writePresence(session.referencia)
    return NextResponse.json({ ok: true, last_seen: ts, referencia: session.referencia })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 })
  }
}
