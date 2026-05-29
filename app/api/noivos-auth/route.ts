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
  // b) Fallback: tabelas eventos_2026 / eventos_2027 (a "ficha") — Supabase
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

  // c) Fallback: NOTION (a ficha real vive aqui — duas DBs por ano)
  if (!referencia && process.env.NOTION_TOKEN) {
    const NOTION_EVENTOS_DBS = [
      '1ad220116d8a804b839ddc36f1e7ecf1', // 2026
      '2a6220116d8a80b4b439fe091b2ac804', // 2027
    ]
    for (const dbId of NOTION_EVENTOS_DBS) {
      for (const notionEmailKey of ['E-mail da noiva', 'E-mail do noivo'] as const) {
        try {
          const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filter: { property: notionEmailKey, email: { equals: emailNorm } },
              page_size: 1,
            }),
            cache: 'no-store',
          })
          if (!res.ok) continue
          const j = await res.json().catch(() => ({}))
          const page = j?.results?.[0]
          if (!page) continue
          const props = page.properties ?? {}
          const getText = (k: string) =>
            props?.[k]?.rich_text?.map((t: any) => t.plain_text).join('') ?? null
          const getTitle = (k: string) =>
            props?.[k]?.title?.map((t: any) => t.plain_text).join('') ?? null
          const getSelect = (k: string) => props?.[k]?.select?.name ?? null
          const getMultiSelect = (k: string) =>
            props?.[k]?.multi_select?.map((s: any) => s.name) ?? null

          const ref = getTitle('REFERÊNCIA DO EVENTO')
          if (ref) {
            referencia    = ref
            tipoEventoRaw = getSelect('TIPO DE EVENTO') ?? getMultiSelect('TIPO DE EVENTO') ?? 'casamento'
            const nNoiva  = getText('Nome da Noiva')
            const nNoivo  = getText('nome do noivo')
            nomeNoivos    = [nNoiva, nNoivo].filter(Boolean).join(' & ') || null
            break
          }
        } catch { /* tenta o próximo */ }
      }
      if (referencia) break
    }
  }

  if (!referencia) {
    // genérico para evitar user-enumeration. Com NOIVOS_AUTH_DEBUG=1
    // a resposta inclui qual passo da cadeia retornou vazio.
    if (process.env.NOIVOS_AUTH_DEBUG === '1') {
      return NextResponse.json({
        ok: false, reason: 'invalid_credentials',
        debug: {
          step: 'email_not_found',
          email_normalizado: emailNorm,
          notion_token_set: !!process.env.NOTION_TOKEN,
        },
      }, { status: 401 })
    }
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

  if (process.env.NOIVOS_AUTH_DEBUG === '1') {
    console.log('[noivos-auth] match', {
      referencia, tipo, has_portal_row: !!portalRow,
      portalPassword_set: !!storedRaw, stored_lc_len: stored.length,
      entered_lc_len: entered.length,
    })
  }

  if (!stored) {
    if (process.env.NOIVOS_AUTH_DEBUG === '1') {
      return NextResponse.json({
        ok: false, reason: 'no_password',
        debug: {
          step: 'portal_no_password',
          referencia, has_portal_row: !!portalRow,
        },
      }, { status: 404 })
    }
    // Portal ainda sem password (ou portal não criado). Mensagem específica
    // para o cliente saber que tem de falar com a equipa RL.
    return NextResponse.json({ ok: false, reason: 'no_portal' }, { status: 404 })
  }
  if (stored !== entered) {
    if (process.env.NOIVOS_AUTH_DEBUG === '1') {
      return NextResponse.json({
        ok: false, reason: 'invalid_credentials',
        debug: {
          step: 'password_mismatch',
          referencia,
          stored_len: stored.length,
          entered_len: entered.length,
          stored_first2: stored.slice(0, 2),
          entered_first2: entered.slice(0, 2),
        },
      }, { status: 401 })
    }
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

  // SEMPRE session cookie (sem maxAge) — morre ao fechar o browser.
  // Segurança extra: JWT exp curto (10 min) + renovação automática
  // pelo heartbeat enquanto os noivos estão no portal.
  // O parâmetro `remember` é ignorado por design.
  res.cookies.set(NV_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  return res
}

export async function GET(req: NextRequest) {
  const c = req.cookies.get(NV_COOKIE_NAME)?.value
  const session = await verifyNvSession(c)
  if (!session) return NextResponse.json({ ok: false })

  // Sliding window: cada GET válido renova o cookie por mais 10 min.
  // O portal-cliente chama isto a cada ~3 min via heartbeat enquanto
  // o utilizador está activo.
  const renewed = await makeNvSession({
    referencia: session.referencia,
    email: session.email,
    tipo: session.tipo,
    role: session.role,
  })
  const res = NextResponse.json({
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
  res.cookies.set(NV_COOKIE_NAME, renewed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    // Sem maxAge — session cookie.
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(NV_COOKIE_NAME, '', { path: '/', maxAge: 0 })
  return res
}
