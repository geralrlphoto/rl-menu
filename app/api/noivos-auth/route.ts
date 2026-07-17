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

  // ── 1) Recolhe TODOS os candidatos (referência + tipo + nome) pelo email
  //      O email pode estar em várias fichas (testes, recasamentos, etc).
  //      Vamos tentar a password em cada candidato e ganha o que bater.
  type Candidate = {
    referencia: string
    tipoEventoRaw: string | string[] | null
    nomeNoivos: string | null
    source: string
  }
  const candidates: Candidate[] = []
  const seen = new Set<string>()
  const pushCandidate = (c: Candidate) => {
    const key = c.referencia.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      candidates.push(c)
    }
  }

  // a) dados_contrato_cps (noiva + noivo)
  for (const col of ['email_noiva', 'email_noivo'] as const) {
    const { data } = await supabase
      .from('dados_contrato_cps')
      .select('referencia_evento, tipo_evento, nome_noivos')
      .ilike(col, emailNorm)
      .order('id', { ascending: false })
    for (const row of data ?? []) {
      if (row?.referencia_evento) pushCandidate({
        referencia:    row.referencia_evento,
        tipoEventoRaw: row.tipo_evento,
        nomeNoivos:    row.nome_noivos,
        source:        `cps:${col}`,
      })
    }
  }

  // b) eventos_2026 / eventos_2027 (Supabase — raramente preenchido)
  for (const tbl of ['eventos_2026', 'eventos_2027'] as const) {
    for (const col of ['email_noiva', 'email_noivo'] as const) {
      const { data } = await supabase
        .from(tbl)
        .select('referencia, tipo_evento, nome_noiva, nome_noivo')
        .ilike(col, emailNorm)
      for (const row of data ?? []) {
        if (row?.referencia) pushCandidate({
          referencia:    row.referencia,
          tipoEventoRaw: (row as any).tipo_evento,
          nomeNoivos:    [row.nome_noiva, row.nome_noivo].filter(Boolean).join(' & ') || null,
          source:        `${tbl}:${col}`,
        })
      }
    }
  }

  // c) NOTION (duas DBs por ano — fonte primária das fichas)
  if (process.env.NOTION_TOKEN) {
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
              page_size: 20,
            }),
            cache: 'no-store',
          })
          if (!res.ok) continue
          const j = await res.json().catch(() => ({}))
          const pages = j?.results ?? []
          for (const page of pages) {
            const props = page.properties ?? {}
            const getText = (k: string) =>
              props?.[k]?.rich_text?.map((t: any) => t.plain_text).join('') ?? null
            const getTitle = (k: string) =>
              props?.[k]?.title?.map((t: any) => t.plain_text).join('') ?? null
            const getSelect = (k: string) => props?.[k]?.select?.name ?? null
            const getMultiSelect = (k: string) =>
              props?.[k]?.multi_select?.map((s: any) => s.name) ?? null

            const ref = getTitle('REFERÊNCIA DO EVENTO')
            if (!ref) continue
            const nNoiva = getText('Nome da Noiva')
            const nNoivo = getText('nome do noivo')
            pushCandidate({
              referencia:    ref,
              tipoEventoRaw: getSelect('TIPO DE EVENTO') ?? getMultiSelect('TIPO DE EVENTO') ?? 'casamento',
              nomeNoivos:    [nNoiva, nNoivo].filter(Boolean).join(' & ') || null,
              source:        `notion:${dbId.slice(0,8)}:${notionEmailKey}`,
            })
          }
        } catch { /* próximo */ }
      }
    }
  }

  if (candidates.length === 0) {
    return NextResponse.json({
      ok: false, reason: 'invalid_credentials',
      debug: {
        step: 'email_not_found',
        email_normalizado: emailNorm,
        notion_token_set: !!process.env.NOTION_TOKEN,
        notion_token_first8: process.env.NOTION_TOKEN?.slice(0, 8) ?? null,
      },
    }, { status: 401 })
  }

  // ── 2) Tenta a password em TODOS os candidatos ─────────────────────────
  const entered = String(password).trim().toLowerCase()
  const attempts: Array<{
    referencia: string
    source: string
    has_portal: boolean
    stored_len: number
    matched: boolean
  }> = []

  let matchedCandidate: Candidate | null = null
  let matchedPortalStored: string | null = null

  for (const cand of candidates) {
    const { data: portalRow } = await supabase
      .from('portais')
      .select('portalPassword:settings->>portalPassword')
      .ilike('referencia', cand.referencia)
      .maybeSingle()
    const storedRaw = (portalRow as any)?.portalPassword ?? ''
    const stored = String(storedRaw).trim().toLowerCase()
    const isMatch = !!stored && stored === entered
    attempts.push({
      referencia: cand.referencia,
      source: cand.source,
      has_portal: !!portalRow,
      stored_len: stored.length,
      matched: isMatch,
    })
    if (isMatch) {
      matchedCandidate = cand
      matchedPortalStored = stored
      break
    }
  }

  if (!matchedCandidate) {
    return NextResponse.json({
      ok: false, reason: 'invalid_credentials',
      debug: {
        step: 'password_mismatch_all',
        candidates_tried: candidates.length,
        entered_len: entered.length,
        attempts,
      },
    }, { status: 401 })
  }

  const { referencia, tipoEventoRaw, nomeNoivos } = matchedCandidate

  // Normaliza tipo_evento — pode ser string ou array (em eventos_2026 vem
  // como array tipo ["casamento"] ou ["batizado"]).
  const tipoStr = Array.isArray(tipoEventoRaw)
    ? tipoEventoRaw.map(t => String(t).toLowerCase()).join(',')
    : String(tipoEventoRaw ?? '').toLowerCase()
  const tipo: 'casamento' | 'batizado' = /batizado/.test(tipoStr) ? 'batizado' : 'casamento'

  console.log('[noivos-auth] match', {
    referencia, tipo, source: matchedCandidate.source,
    candidates_tried: candidates.length,
  })

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
