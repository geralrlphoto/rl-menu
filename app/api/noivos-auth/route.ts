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

  // ── 1) Encontrar referência do evento pelo email do casal ──────────────
  //     Procura por ordem:
  //       a) dados_contrato_cps (email_noiva ou email_noivo)
  //       b) eventos_2026 / eventos_2027 (email_noiva ou email_noivo)
  //         ← este é o caso quando o CPS ainda não foi preenchido mas
  //           a ficha do evento já tem os dados dos noivos.
  let referencia: string | null = null
  let tipoEventoRaw: string | string[] | null = null
  let nomeNoivos: string | null = null

  // a) dados_contrato_cps · email_noiva
  {
    const { data } = await supabase
      .from('dados_contrato_cps')
      .select('referencia_evento, tipo_evento, nome_noivos')
      .ilike('email_noiva', emailNorm)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data?.referencia_evento) {
      referencia    = data.referencia_evento
      tipoEventoRaw = data.tipo_evento
      nomeNoivos    = data.nome_noivos
    }
  }
  // a) dados_contrato_cps · email_noivo
  if (!referencia) {
    const { data } = await supabase
      .from('dados_contrato_cps')
      .select('referencia_evento, tipo_evento, nome_noivos')
      .ilike('email_noivo', emailNorm)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data?.referencia_evento) {
      referencia    = data.referencia_evento
      tipoEventoRaw = data.tipo_evento
      nomeNoivos    = data.nome_noivos
    }
  }
  // b) Fallback: tabelas eventos_2026 / eventos_2027 (a "ficha")
  if (!referencia) {
    for (const tbl of ['eventos_2026', 'eventos_2027'] as const) {
      const { data: byNoiva } = await supabase
        .from(tbl)
        .select('referencia, tipo_evento, nome_noiva, nome_noivo')
        .ilike('email_noiva', emailNorm)
        .limit(1)
        .maybeSingle()
      if (byNoiva?.referencia) {
        referencia    = byNoiva.referencia
        tipoEventoRaw = (byNoiva as any).tipo_evento
        nomeNoivos    = [byNoiva.nome_noiva, byNoiva.nome_noivo].filter(Boolean).join(' & ') || null
        break
      }
      const { data: byNoivo } = await supabase
        .from(tbl)
        .select('referencia, tipo_evento, nome_noiva, nome_noivo')
        .ilike('email_noivo', emailNorm)
        .limit(1)
        .maybeSingle()
      if (byNoivo?.referencia) {
        referencia    = byNoivo.referencia
        tipoEventoRaw = (byNoivo as any).tipo_evento
        nomeNoivos    = [byNoivo.nome_noiva, byNoivo.nome_noivo].filter(Boolean).join(' & ') || null
        break
      }
    }
  }

  if (!referencia) {
    // genérico para evitar user-enumeration
    return NextResponse.json({ ok: false, reason: 'invalid_credentials' }, { status: 401 })
  }

  // Normaliza tipo_evento — pode ser string ou array (em eventos_2026 vem
  // como array tipo ["casamento"] ou ["batizado"]).
  const tipoStr = Array.isArray(tipoEventoRaw)
    ? tipoEventoRaw.map(t => String(t).toLowerCase()).join(',')
    : String(tipoEventoRaw ?? '').toLowerCase()
  const tipo: 'casamento' | 'batizado' = /batizado/.test(tipoStr) ? 'batizado' : 'casamento'

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
      nome_noivos: nomeNoivos,
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
