import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { FL_COOKIE_MAX_AGE, FL_COOKIE_NAME, makeFlSession, verifyFlSession } from '@/lib/freelancer-session'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * POST body:
 *   { email, password, remember?: boolean }   ← novo fluxo (login page)
 *   { id, password }                          ← legacy (admin "test password" widget)
 *
 * Resposta success: { ok: true, freelancer: { id, nome, email, status, foto_url }, redirect: '/freelancer-view/<id>' }
 * Resposta erro:    { ok: false, reason: 'invalid_credentials' | 'missing_fields' | ... }
 *
 * Em success no fluxo email/password, set cookie `fl_session` (HttpOnly + Secure
 * em prod) com payload { id, email, role: 'freelancer', exp }.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    email?: string
    password?: string
    id?: string
    remember?: boolean
  }
  const { email, password, id, remember } = body
  if (!password || (!email && !id)) {
    return NextResponse.json({ ok: false, reason: 'missing_fields' }, { status: 400 })
  }

  const supabase = db()

  // ── Legacy: { id, password } usado pelo widget admin de teste ─────────
  if (id && !email) {
    const { data, error } = await supabase
      .from('freelancers')
      .select('id, password')
      .eq('id', id)
      .single()
    if (error)        return NextResponse.json({ ok: false, reason: 'db_error', detail: error.message })
    if (!data)        return NextResponse.json({ ok: false, reason: 'not_found' })
    if (!data.password) return NextResponse.json({ ok: false, reason: 'no_password' })
    const stored  = (data.password ?? '').trim().toLowerCase()
    const entered = password.trim().toLowerCase()
    return NextResponse.json({ ok: stored === entered })
  }

  // ── Login por email+password ──────────────────────────────────────────
  const emailNorm = (email ?? '').trim().toLowerCase()
  const { data: row, error: qErr } = await supabase
    .from('freelancers')
    .select('id, nome, email, password, status, foto_url')
    .ilike('email', emailNorm)
    .maybeSingle()

  if (qErr) {
    return NextResponse.json({ ok: false, reason: 'db_error', detail: qErr.message }, { status: 500 })
  }
  // Resposta genérica para email inexistente OU senha errada — evita user-enumeration.
  if (!row || !row.password) {
    return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 401 })
  }
  const stored  = (row.password ?? '').trim().toLowerCase()
  const entered = (password ?? '').trim().toLowerCase()
  if (stored !== entered) {
    return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 401 })
  }

  const token = await makeFlSession({
    id: row.id,
    email: row.email ?? emailNorm,
    role: 'freelancer',
    status: row.status ?? undefined,
  })

  const res = NextResponse.json({
    ok: true,
    freelancer: {
      id: row.id,
      nome: row.nome,
      email: row.email,
      status: row.status,
      foto_url: row.foto_url,
    },
    redirect: `/freelancers/${row.id}?view=freelancer`,
  })
  res.cookies.set(FL_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    // SEMPRE session cookie (sem maxAge) — expira ao fechar o browser.
    // A segurança adicional vem do TTL curto do próprio JWT (30 min) +
    // renovação por heartbeat enquanto o membro está activo.
    path: '/',
  })
  return res
}

/**
 * GET — devolve a sessão atual (ou null) — útil para o cliente saber se já está
 * logado e redirecionar para o portal próprio.
 */
export async function GET(req: NextRequest) {
  const c = req.cookies.get(FL_COOKIE_NAME)?.value
  const session = await verifyFlSession(c)
  if (!session) return NextResponse.json({ ok: false })
  return NextResponse.json({
    ok: true,
    session: { id: session.id, email: session.email, role: session.role, exp: session.exp },
  })
}

/**
 * DELETE — logout. Limpa cookie fl_session.
 */
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(FL_COOKIE_NAME, '', { path: '/', maxAge: 0 })
  return res
}
