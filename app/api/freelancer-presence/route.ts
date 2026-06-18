import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { FL_COOKIE_NAME, makeFlSession, verifyFlSession } from '@/lib/freelancer-session'

export const dynamic = 'force-dynamic'

/**
 * Sistema de presença leve, baseado num registo único na tabela `portais`
 * com referência especial `__freelancer_presence__`. Sem migração de schema.
 *
 * settings shape:
 *   {
 *     last_seen: {
 *       "<freelancer_id>": "2026-05-29T12:34:56.000Z",
 *       ...
 *     }
 *   }
 *
 * GET  → devolve o mapa completo de presenças
 * POST → atualiza last_seen para o id na cookie fl_session (auto)
 *        ou para freelancer_id no body (admin/teste)
 */
const PRESENCE_REF = '__freelancer_presence__'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

async function readPresence() {
  const supabase = db()
  const { data } = await supabase
    .from('portais')
    .select('settings')
    .eq('referencia', PRESENCE_REF)
    .maybeSingle()
  const lastSeen: Record<string, string> = (data?.settings?.last_seen ?? {}) as any
  return lastSeen
}

async function writePresence(freelancerId: string) {
  const supabase = db()
  const now = new Date().toISOString()

  // Lê settings atuais (preserva outras chaves se as houver)
  const { data: existing } = await supabase
    .from('portais')
    .select('settings')
    .eq('referencia', PRESENCE_REF)
    .maybeSingle()
  const settings = (existing?.settings ?? {}) as Record<string, any>
  const last_seen = (settings.last_seen ?? {}) as Record<string, string>
  last_seen[freelancerId] = now
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
    // 1) Preferir o id da sessão (mais seguro: o membro não pode marcar outro)
    let freelancerId: string | null = null
    let sessionEmail: string | null = null
    let sessionStatus: string | undefined = undefined
    const flCookie = req.cookies.get(FL_COOKIE_NAME)?.value
    if (flCookie) {
      const session = await verifyFlSession(flCookie)
      if (session?.id) {
        freelancerId = session.id
        sessionEmail = session.email ?? null
        sessionStatus = session.status ?? undefined
      }
    }
    // 2) Fallback: corpo (útil para admin/debug e quando não há cookie)
    let viaBody = false
    if (!freelancerId) {
      const body = await req.json().catch(() => ({}))
      if (body?.freelancer_id) { freelancerId = String(body.freelancer_id); viaBody = true }
    }
    if (!freelancerId) {
      return NextResponse.json({ ok: false, error: 'no_session' }, { status: 401 })
    }
    const ts = await writePresence(freelancerId)
    const res = NextResponse.json({ ok: true, last_seen: ts })

    // ── Sliding window: renova o cookie fl_session quando o ping veio
    //    de uma sessão válida. Estende o exp por mais TTL_SECONDS.
    //    Se foi via body (admin/debug), não renova nada.
    if (!viaBody && sessionEmail) {
      const token = await makeFlSession({ id: freelancerId, email: sessionEmail, role: 'freelancer', status: sessionStatus })
      res.cookies.set(FL_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        // Sem maxAge — continua session cookie. O JWT exp é que controla.
      })
    }
    return res
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 })
  }
}
