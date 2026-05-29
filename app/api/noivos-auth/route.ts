import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NV_COOKIE_NAME, NV_COOKIE_MAX_AGE, makeNvSession, verifyNvSession } from '@/lib/noivos-session'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Auth endpoint para NOIVOS (clientes de casamento).
 *
 * Lookup em `crm_contacts` por `email` → match com `page_content.noivos_password`.
 * (Sem migração de schema — a password é guardada no JSONB `page_content`,
 * adicionada via admin no CRM.)
 *
 * POST { email, password, remember? } →
 *   200 { ok: true, redirect: '/r/<page_token>' } + cookie `nv_session`
 *   401 { ok: false, reason: 'invalid_credentials' }
 *
 * GET → devolve a sessão actual (ou null).
 * DELETE → logout.
 */

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    email?: string
    password?: string
    remember?: boolean
  }
  const { email, password, remember } = body
  if (!email || !password) {
    return NextResponse.json({ ok: false, reason: 'missing_fields' }, { status: 400 })
  }

  const supabase = db()
  const emailNorm = email.trim().toLowerCase()

  // Procura noiva/noivo por e-mail (case-insensitive). Aceita match parcial
  // em qualquer um dos noivos (campo `email` no crm_contacts).
  const { data: row, error: qErr } = await supabase
    .from('crm_contacts')
    .select('id, nome, email, page_token, page_content')
    .ilike('email', emailNorm)
    .maybeSingle()

  if (qErr) {
    return NextResponse.json({ ok: false, reason: 'db_error', detail: qErr.message }, { status: 500 })
  }
  if (!row || !row.page_token) {
    return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 401 })
  }

  // Password está no JSONB page_content.noivos_password (set via CRM).
  const pageContent = (typeof row.page_content === 'string'
    ? JSON.parse(row.page_content || '{}')
    : (row.page_content || {})) as Record<string, any>
  const storedRaw = pageContent?.noivos_password ?? ''
  const stored  = String(storedRaw).trim().toLowerCase()
  const entered = String(password).trim().toLowerCase()

  if (!stored || stored !== entered) {
    return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 401 })
  }

  const token = await makeNvSession({
    id: row.id,
    email: row.email ?? emailNorm,
    token: row.page_token,
    role: 'noivos',
  })

  const res = NextResponse.json({
    ok: true,
    noivos: {
      id: row.id,
      nome: row.nome,
      email: row.email,
      page_token: row.page_token,
    },
    redirect: `/r/${row.page_token}`,
  })

  // Cookie: se `remember` é true → 90 dias; senão session cookie (morre ao
  // fechar browser, mas JWT exp ainda dura 90 dias caso reabra rápido).
  res.cookies.set(NV_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(remember ? { maxAge: NV_COOKIE_MAX_AGE } : {}),
  })

  return res
}

export async function GET(req: NextRequest) {
  const c = req.cookies.get(NV_COOKIE_NAME)?.value
  const session = await verifyNvSession(c)
  if (!session) return NextResponse.json({ ok: false })
  return NextResponse.json({
    ok: true,
    session: {
      id: session.id,
      email: session.email,
      token: session.token,
      role: session.role,
      exp: session.exp,
    },
  })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(NV_COOKIE_NAME, '', { path: '/', maxAge: 0 })
  return res
}
