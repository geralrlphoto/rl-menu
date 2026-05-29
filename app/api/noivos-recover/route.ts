import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const RESEND_KEY  = process.env.RESEND_API_KEY
const SITE_BASE   = process.env.NEXT_PUBLIC_SITE_URL || 'https://rl-menu-lake.vercel.app'
const NOTION_TOKEN = process.env.NOTION_TOKEN
// DBs Notion onde vivem as fichas dos noivos. Há uma por ano (ver
// app/api/eventos-notion/route.ts DB_BY_YEAR). Procuramos em ambas.
const NOTION_EVENTOS_DBS = [
  '1ad220116d8a804b839ddc36f1e7ecf1', // 2026
  '2a6220116d8a80b4b439fe091b2ac804', // 2027
]

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── Normalização ────────────────────────────────────────────────────────────
function normEmail(v: string | null | undefined): string {
  return String(v ?? '').trim().toLowerCase()
}
function normPhone(v: string | null | undefined): string {
  // só dígitos — ignora +, espaços, traços, parênteses
  return String(v ?? '').replace(/\D+/g, '')
}
function normNif(v: string | null | undefined): string {
  return String(v ?? '').replace(/\s+/g, '').trim()
}

// Compara phones aceitando 9 dígitos (PT sem indicativo) vs 12 dígitos (com +351)
function phonesEqual(a: string, b: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  // Aceita 9 últimos dígitos como match (caso um tenha indicativo e outro não)
  const tail = (s: string) => s.slice(-9)
  return tail(a) === tail(b) && tail(a).length === 9
}

type CasalRow = {
  referencia: string | null
  tipo_evento: string | string[] | null
  nome_noivos?: string | null
  nome_noiva?: string | null
  nome_noivo?: string | null
  email_noiva?: string | null
  email_noivo?: string | null
  tel_noiva?: string | null
  tel_noivo?: string | null
  nif_noiva?: string | null
  nif_noivo?: string | null
}

function rowMatches(row: CasalRow, email: string, phone: string, nif: string): 'noiva' | 'noivo' | null {
  // Noiva
  if (
    normEmail(row.email_noiva) === email &&
    phonesEqual(normPhone(row.tel_noiva), phone) &&
    normNif(row.nif_noiva) === nif
  ) return 'noiva'
  // Noivo
  if (
    normEmail(row.email_noivo) === email &&
    phonesEqual(normPhone(row.tel_noivo), phone) &&
    normNif(row.nif_noivo) === nif
  ) return 'noivo'
  return null
}

// ── Email de recuperação ────────────────────────────────────────────────────
function buildRecoveryEmail(opts: {
  nome: string
  password: string
  loginUrl: string
}): string {
  const primeiroNome = (opts.nome || 'Olá').split(/[\s&]/)[0] || 'Olá'
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">
        <tr><td style="padding:48px 56px;font-family:Georgia,'Times New Roman',serif;text-align:center;">
          <img src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
            width="80" alt="RL" style="display:block;margin:0 auto 24px;width:80px;opacity:0.9;" />
          <p style="margin:0 0 4px;font-size:28px;font-style:italic;font-weight:300;color:#c9a96e;">Olá, ${primeiroNome}!</p>
          <p style="margin:0 0 18px;font-size:24px;font-weight:400;color:#f0e8d8;">A vossa palavra-passe</p>
          <div style="margin:0 0 22px;color:#6a5430;font-size:12px;letter-spacing:0.35em;">— · ◆ · —</div>
          <p style="margin:0 0 26px;font-size:14px;color:#a09070;line-height:1.8;">
            Confirmámos a vossa identidade.<br>
            Aqui está a palavra-passe do vosso portal:
          </p>

          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;border:0.5px solid #6a5430;width:100%;max-width:340px;background:rgba(201,169,110,0.04);">
            <tr><td style="padding:18px 24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.5em;color:#7a6340;text-transform:uppercase;">🔑 Palavra-passe</p>
              <p style="margin:0;font-size:22px;font-family:'Courier New',monospace;letter-spacing:0.15em;color:#f0e8d8;font-weight:600;">${opts.password}</p>
            </td></tr>
          </table>

          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 16px;">
            <tr>
              <td align="center" style="border-radius:8px;background:#c9a96e;">
                <a href="${opts.loginUrl}" target="_blank"
                  style="display:inline-block;padding:18px 48px;background:#c9a96e;color:#0e0b07;text-decoration:none;font-family:Georgia,'Times New Roman',serif;font-size:14px;letter-spacing:0.4em;font-weight:700;border-radius:8px;border:1px solid #c9a96e;">
                  ENTRAR &nbsp;→
                </a>
              </td>
            </tr>
          </table>

          <p style="margin:24px 0 0;font-size:11px;color:#5a4a30;line-height:1.6;">
            Se não foram vocês que pediram este reset, ignorem este email.<br>
            Em caso de dúvida, falem connosco directamente.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_KEY) return false
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: [to], subject, html,
      }),
    })
    return res.ok
  } catch { return false }
}

// ── Rate limit por IP — guardado em portais.settings de uma row especial ───
const RATE_REF = '__noivos_recover_attempts__'
const MAX_PER_WINDOW = 5
const WINDOW_MS = 30 * 60 * 1000 // 30 min

async function checkRateLimit(ip: string): Promise<{ ok: boolean; remaining: number }> {
  const sb = db()
  const { data } = await sb.from('portais').select('settings').eq('referencia', RATE_REF).maybeSingle()
  const all: Record<string, number[]> = (data?.settings?.attempts ?? {}) as any
  const now = Date.now()
  const recent = (all[ip] ?? []).filter((t: number) => now - t < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    return { ok: false, remaining: 0 }
  }
  recent.push(now)
  all[ip] = recent
  const newSettings = { attempts: all }
  if (data) {
    await sb.from('portais').update({ settings: newSettings }).eq('referencia', RATE_REF)
  } else {
    await sb.from('portais').insert({ referencia: RATE_REF, settings: newSettings })
  }
  return { ok: true, remaining: MAX_PER_WINDOW - recent.length }
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

// ── POST handler ───────────────────────────────────────────────────────────
/**
 * POST { email, telefone, nif } →
 *   200 { ok: true,  sentTo: 'em***@xxx.com' }  — confirmado + email enviado
 *   200 { ok: false, reason: 'no_match' }      — dados não batem
 *   200 { ok: false, reason: 'no_password' }   — bateram mas portal sem password
 *   429 { ok: false, reason: 'rate_limit' }    — muitas tentativas
 *
 * Email é enviado SEMPRE para email_noiva do registo encontrado (não para
 * o email que o utilizador escreveu) — assim mesmo que alguém saiba os 3
 * dados, a password só chega à caixa oficial dos noivos.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as {
    email?: string
    telefone?: string
    nif?: string
  }

  const email = normEmail(body.email)
  const phone = normPhone(body.telefone)
  const nif   = normNif(body.nif)

  if (!email || !phone || !nif) {
    return NextResponse.json({ ok: false, reason: 'missing_fields' }, { status: 400 })
  }

  // Rate-limit antes de qualquer query pesada
  const ip = getClientIp(req)
  const rl = await checkRateLimit(ip)
  if (!rl.ok) {
    return NextResponse.json({ ok: false, reason: 'rate_limit' }, { status: 429 })
  }

  const sb = db()

  // ── 1) Procura nos vários sítios pela ordem que faz sentido ────────────
  //     a) Notion (fonte primária — é onde a ficha do casamento vive)
  //     b) Supabase: dados_contrato_cps + eventos_2026 + eventos_2027
  let matched: { row: CasalRow; via: 'noiva' | 'noivo'; source: string } | null = null
  const debugRows: any[] = []

  // ── a) NOTION (filter direto por email — itera todas as DBs ano a ano) ─
  if (NOTION_TOKEN) {
    for (const dbId of NOTION_EVENTOS_DBS) {
      try {
        for (const notionEmailKey of ['E-mail da noiva', 'E-mail do noivo'] as const) {
          const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${NOTION_TOKEN}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              filter: { property: notionEmailKey, email: { equals: email } },
              page_size: 5,
            }),
            cache: 'no-store',
          })
          if (!res.ok) {
            // captura o erro real para o debug
            const errBody = await res.text().catch(() => '')
            debugRows.push({ src: `notion:${dbId}`, via_col: notionEmailKey, error: `${res.status} ${errBody.slice(0,160)}` })
            continue
          }
          const j = await res.json().catch(() => ({}))
          const pages = j?.results ?? []
          for (const page of pages) {
            const props = page.properties ?? {}
            const getText = (k: string) =>
              props?.[k]?.rich_text?.map((t: any) => t.plain_text).join('') ?? null
            const getEmail = (k: string) => props?.[k]?.email ?? null
            const getPhone = (k: string) => props?.[k]?.phone_number ?? null
            const getTitle = (k: string) =>
              props?.[k]?.title?.map((t: any) => t.plain_text).join('') ?? null
            const getSelect = (k: string) => props?.[k]?.select?.name ?? null
            const getMultiSelect = (k: string) =>
              props?.[k]?.multi_select?.map((s: any) => s.name).join(',') ?? null

            const casal: CasalRow = {
              referencia:  getTitle('REFERÊNCIA DO EVENTO'),
              tipo_evento: getSelect('TIPO DE EVENTO')
                          ?? getMultiSelect('TIPO DE EVENTO')
                          ?? 'casamento',
              nome_noivos: null,
              nome_noiva:  getText('Nome da Noiva'),
              nome_noivo:  getText('nome do noivo'),
              email_noiva: getEmail('E-mail da noiva'),
              email_noivo: getEmail('E-mail do noivo'),
              tel_noiva:   getPhone('Telefone da noiva'),
              tel_noivo:   getPhone('Telefone do noivo'),
              nif_noiva:   getText('N.º Iden.Fiscal Noiva'),
              nif_noivo:   getText('N.º Iden. Fiscal Noivo'),
            }
            debugRows.push({ src: `notion:${dbId.slice(0,8)}`, via_col: notionEmailKey, row: casal })
            const via = rowMatches(casal, email, phone, nif)
            if (via) {
              matched = { row: casal, via, source: `notion:${dbId.slice(0,8)}` }
              break
            }
          }
          if (matched) break
        }
      } catch (e: any) {
        debugRows.push({ src: `notion:${dbId}`, error: String(e?.message ?? e) })
      }
      if (matched) break
    }
  }

  type Source = {
    table: 'dados_contrato_cps' | 'eventos_2026' | 'eventos_2027'
    refField: 'referencia_evento' | 'referencia'
    cols: string
  }
  const sources: Source[] = [
    {
      table: 'dados_contrato_cps',
      refField: 'referencia_evento',
      cols: 'referencia_evento, tipo_evento, nome_noivos, nome_noiva, nome_noivo, email_noiva, email_noivo, tel_noiva, tel_noivo, nif_noiva, nif_noivo',
    },
    {
      table: 'eventos_2026',
      refField: 'referencia',
      cols: 'referencia, tipo_evento, nome_noiva, nome_noivo, email_noiva, email_noivo, tel_noiva, tel_noivo, nif_noiva, nif_noivo',
    },
    {
      table: 'eventos_2027',
      refField: 'referencia',
      cols: 'referencia, tipo_evento, nome_noiva, nome_noivo, email_noiva, email_noivo, tel_noiva, tel_noivo, nif_noiva, nif_noivo',
    },
  ]

  if (!matched) {
    for (const src of sources) {
      for (const col of ['email_noiva', 'email_noivo'] as const) {
        const { data: rows, error } = await sb
          .from(src.table)
          .select(src.cols)
          .ilike(col, email)
        if (error) continue
        for (const r of rows ?? []) {
          const casal: CasalRow = {
            ...(r as any),
            referencia: (r as any)[src.refField] ?? null,
          }
          debugRows.push({ src: src.table, via_col: col, row: casal })
          const via = rowMatches(casal, email, phone, nif)
          if (via) {
            matched = { row: casal, via, source: src.table }
            break
          }
        }
        if (matched) break
      }
      if (matched) break
    }
  }

  if (!matched || !matched.row.referencia) {
    // Em modo debug devolve quais campos não bateram (útil quando o admin
    // a testar quer perceber qual dado falhou). Não revela valores reais.
    if (process.env.NOIVOS_RECOVER_DEBUG === '1') {
      return NextResponse.json({
        ok: false,
        reason: 'no_match',
        debug: {
          email_normalizado: email,
          telefone_normalizado: phone,
          nif_normalizado: nif,
          encontrados_por_email: debugRows.map(d => ({
            tabela: d.src,
            via: d.via_col,
            referencia: d.row.referencia,
            tel_guardado_normalizado: normPhone(d.row.tel_noiva || d.row.tel_noivo),
            nif_guardado_normalizado: normNif(d.row.nif_noiva || d.row.nif_noivo),
            tel_bate: phonesEqual(normPhone(d.row.tel_noiva || d.row.tel_noivo), phone),
            nif_bate: normNif(d.row.nif_noiva || d.row.nif_noivo) === nif,
          })),
        },
      })
    }
    return NextResponse.json({ ok: false, reason: 'no_match' })
  }

  // ── 2) Vai buscar a password do portal ────────────────────────────────
  const { data: portalRow } = await sb
    .from('portais')
    .select('settings')
    .ilike('referencia', matched.row.referencia)
    .maybeSingle()

  const password = String(portalRow?.settings?.portalPassword ?? '').trim()
  if (!password) {
    return NextResponse.json({ ok: false, reason: 'no_password' })
  }

  // ── 3) Envia email SEMPRE ao email_noiva (oficial) ────────────────────
  //      Se não há email_noiva (raro), cai para email_noivo.
  const destEmail = (matched.row.email_noiva ?? matched.row.email_noivo ?? '').trim()
  if (!destEmail) {
    return NextResponse.json({ ok: false, reason: 'no_email_on_file' })
  }

  const nome = matched.row.nome_noivos ||
    [matched.row.nome_noiva, matched.row.nome_noivo].filter(Boolean).join(' & ') ||
    'Olá'

  const loginUrl = `${SITE_BASE}/login-noivos`
  const sent = await sendEmail(
    destEmail,
    '🔑 A vossa palavra-passe do portal',
    buildRecoveryEmail({ nome, password, loginUrl }),
  )

  if (!sent) {
    return NextResponse.json({ ok: false, reason: 'email_failed' })
  }

  // Mascarar email na resposta (não revela o domínio completo do casal)
  const masked = destEmail.replace(/^(.{2})[^@]+(@.+)$/, '$1***$2')
  return NextResponse.json({ ok: true, sentTo: masked })
}
