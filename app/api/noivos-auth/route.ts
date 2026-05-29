import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  NV_COOKIE_NAME,
  NV_COOKIE_MAX_AGE,
  makeNvSession,
  verifyNvSession,
  portalPathFor,
} from '@/lib/noivos-session'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Auth dos NOIVOS — usa o sistema EXISTENTE de password de portal:
 *
 *   1) Procura o email em `dados_contrato_cps` (email_noiva OR email_noivo).
 *      → obtém referencia_evento + tipo_evento.
 *   2) Busca a row em `portais` com essa referencia → settings.portalPassword.
 *   3) Compara passwords (case-insensitive, trim).
 *   4) Set cookie `nv_session` + redirect para
 *      /portal-cliente/ref/<REF> (casamento) ou /portal-batizado/ref/<REF>.
 *
 * Sem migrações de schema. A password é definida no widget admin existente
 * em /eventos-2026/[id] ("Definir password..." → portais.settings.portalPassword).
 *
 * POST { email, password, remember? } →
 *   200 { ok: true, redirect: '/portal-cliente/ref/<REF>' } + cookie
 *   401 { ok: false, reason: 'invalid_credentials' }
 *   404 { ok: false, reason: 'no_portal' } — email existe mas ainda não há
 *        portal criado / aprovado para este casal.
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
  const emailNorm = String(email).trim().toLowerCase()

  // ── 1) Encontrar contrato pelo email (noiva ou noivo) ──────────────────
  //     Faz duas queries (uma por coluna) e usa a primeira que devolver row.
  //     Usa ilike para case-insensitive.
  let contrato: {
    referencia_evento: string | null
    tipo_evento: string | null
    nome_noivos: string | null
    email_noiva: string | null
    email_noivo: string | null
  } | null = null

  const { data: byNoiva } = await supabase
    .from('dados_contrato_cps')
    .select('referencia_evento, tipo_evento, nome_noivos, email_noiva, email_noivo')
    .ilike('email_noiva', emailNorm)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (byNoiva) contrato = byNoiva as any

  if (!contrato) {
    const { data: byNoivo } = await supabase
      .from('dados_contrato_cps')
      .select('referencia_evento, tipo_evento, nome_noivos, email_noiva, email_noivo')
      .ilike('email_noivo', emailNorm)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (byNoivo) contrato = byNoivo as any
  }

  if (!contrato || !contrato.referencia_evento) {
    // genérico para evitar user-enumeration
    return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 401 })
  }

  const referencia = contrato.referencia_evento
  const tipo: 'casamento' | 'batizado' =
    contrato.tipo_evento === 'batizado' ? 'batizado' : 'casamento'

  // ── 2) Verifica a password no portal correspondente ────────────────────
  const { data: portalRow } = await supabase
    .from('portais')
    .select('settings')
    .ilike('referencia', referencia)
    .maybeSingle()

  const storedRaw = portalRow?.settings?.portalPassword ?? ''
  const stored  = String(storedRaw).trim().toLowerCase()
  const entered = String(password).trim().toLowerCase()

  if (!stored) {
    // Portal ainda sem password (ou portal não criado). Mensagem específica
    // para o cliente saber que tem de falar com a equipa RL.
    return NextResponse.json({ ok: false, reason: 'no_portal' }, { status: 404 })
  }
  if (stored !== entered) {
    return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 401 })
  }

  // ── 3) Sessão + cookie + redirect ──────────────────────────────────────
  const token = await makeNvSession({
    referencia,
    email: emailNorm,
    tipo,
    role: 'noivos',
  })

  const redirect = portalPathFor(referencia, tipo)

  const res = NextResponse.json({
    ok: true,
    noivos: {
      referencia,
      nome_noivos: contrato.nome_noivos,
      email: emailNorm,
      tipo,
    },
    redirect,
  })

  // remember=true → 90 dias persistentes; senão session cookie (morre ao
  // fechar o browser; o JWT continua válido se reabrirem rápido).
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
      referencia: session.referencia,
      email: session.email,
      tipo: session.tipo,
      role: session.role,
      exp: session.exp,
      redirect: portalPathFor(session.referencia, session.tipo),
    },
  })
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(NV_COOKIE_NAME, '', { path: '/', maxAge: 0 })
  return res
}
