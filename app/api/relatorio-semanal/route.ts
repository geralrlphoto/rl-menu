import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Weekly report — runs every Friday at 19:00 (Vercel Cron) and also supports
 * manual GET / POST so you can preview the email any time.
 *
 * Aggregates the last 7 days (Mon → Sun ending today, inclusive) of:
 *  - time_blocks  → real vs planeado, por categoria, por casamento
 *  - tarefas      → concluídas esta semana + pendentes
 *
 * Sends the rendered HTML to RELATORIO_EMAIL (fallback: ruimngpro@gmail.com).
 */

export const maxDuration = 60

const SITE_BASE   = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'
const RESEND_KEY  = process.env.RESEND_API_KEY!
const TO_EMAIL    = process.env.RELATORIO_EMAIL || 'geral.rlphoto@gmail.com'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtTotal(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}m`
  return `${m}m`
}

function fmtDateLong(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtDateShort(s: string) {
  const d = new Date(s + 'T00:00:00')
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${String(d.getDate()).padStart(2,'0')} ${meses[d.getMonth()]}`
}

async function buildReport(start: string, end: string) {
  const supabase = db()

  // ── 1. Time blocks da semana ──────────────────────────────────────────────
  const { data: blocks } = await supabase
    .from('time_blocks')
    .select('id, data, categoria, titulo, cor, hora_inicio, hora_fim, duracao_minutos, evento_id, tempo_real_segundos, timer_state')
    .gte('data', start)
    .lte('data', end)
    .order('data', { ascending: true })

  let totalPlanSec = 0
  let totalRealSec = 0
  const byCategoria = new Map<string, { titulo: string; cor: string; planSec: number; realSec: number }>()
  const byEvento    = new Map<string, { cor: string; planSec: number; realSec: number; blocos: number }>()
  const byDay       = new Map<string, { planSec: number; realSec: number; blocos: number }>()

  for (const b of (blocks ?? [])) {
    const plan = Math.max(0, (Number(b.duracao_minutos) || 0) * 60)
    const real = Math.max(0, Number(b.tempo_real_segundos) || 0)
    totalPlanSec += plan
    totalRealSec += real

    const cat = byCategoria.get(b.categoria) ?? { titulo: b.titulo, cor: b.cor, planSec: 0, realSec: 0 }
    cat.planSec += plan; cat.realSec += real
    cat.titulo = b.titulo; cat.cor = b.cor
    byCategoria.set(b.categoria, cat)

    if (b.evento_id) {
      const ev = byEvento.get(b.evento_id) ?? { cor: b.cor, planSec: 0, realSec: 0, blocos: 0 }
      ev.planSec += plan; ev.realSec += real; ev.blocos += 1
      ev.cor = b.cor
      byEvento.set(b.evento_id, ev)
    }

    const day = byDay.get(b.data) ?? { planSec: 0, realSec: 0, blocos: 0 }
    day.planSec += plan; day.realSec += real; day.blocos += 1
    byDay.set(b.data, day)
  }

  // ── 2. Lookup nomes dos casamentos ────────────────────────────────────────
  const eventoIds = Array.from(byEvento.keys())
  const eventosLookup = new Map<string, { referencia: string; cliente: string; data_evento: string | null }>()
  if (eventoIds.length > 0) {
    // Try by notion_id first, then by id
    const { data: byNotion } = await supabase
      .from('eventos_2026')
      .select('id, notion_id, referencia, cliente, data_evento')
      .in('notion_id', eventoIds)
    for (const r of (byNotion ?? [])) {
      eventosLookup.set(r.notion_id, { referencia: r.referencia ?? '', cliente: r.cliente ?? '', data_evento: r.data_evento ?? null })
    }
    // Anything not found via notion_id, try id
    const missing = eventoIds.filter(id => !eventosLookup.has(id))
    if (missing.length > 0) {
      const { data: byId } = await supabase
        .from('eventos_2026')
        .select('id, referencia, cliente, data_evento')
        .in('id', missing)
      for (const r of (byId ?? [])) {
        eventosLookup.set(r.id, { referencia: r.referencia ?? '', cliente: r.cliente ?? '', data_evento: r.data_evento ?? null })
      }
    }
  }

  // ── 3. Tarefas concluídas e pendentes ─────────────────────────────────────
  const { data: tarefas } = await supabase
    .from('tarefas')
    .select('id, titulo, status, data_prazo, hora, updated_at, evento_id')

  const concluidasSemana = (tarefas ?? []).filter(t =>
    t.status === 'CONCLUIDA' &&
    t.updated_at && t.updated_at.slice(0, 10) >= start && t.updated_at.slice(0, 10) <= end
  )
  const pendentes = (tarefas ?? []).filter(t => t.status !== 'CONCLUIDA')

  // Aggregate stats
  const pct = totalPlanSec > 0 ? Math.round((totalRealSec / totalPlanSec) * 100) : 0
  const diaMaisProdutivo = Array.from(byDay.entries())
    .sort((a, b) => b[1].realSec - a[1].realSec)[0]
  const casamentoMaisTrabalhado = Array.from(byEvento.entries())
    .sort((a, b) => b[1].realSec - a[1].realSec)[0]

  return {
    start, end,
    totalPlanSec, totalRealSec, pct,
    blocksCount: (blocks ?? []).length,
    byCategoria: Array.from(byCategoria.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => b.realSec - a.realSec),
    byEvento: Array.from(byEvento.entries())
      .map(([id, v]) => ({ id, ...v, info: eventosLookup.get(id) }))
      .sort((a, b) => b.realSec - a.realSec),
    byDay: Array.from(byDay.entries())
      .map(([data, v]) => ({ data, ...v }))
      .sort((a, b) => a.data.localeCompare(b.data)),
    diaMaisProdutivo: diaMaisProdutivo ? { data: diaMaisProdutivo[0], real: diaMaisProdutivo[1].realSec } : null,
    casamentoMaisTrabalhado: casamentoMaisTrabalhado
      ? {
          id: casamentoMaisTrabalhado[0],
          info: eventosLookup.get(casamentoMaisTrabalhado[0]),
          real: casamentoMaisTrabalhado[1].realSec,
        }
      : null,
    concluidasSemana,
    pendentes,
  }
}

function buildHtml(r: Awaited<ReturnType<typeof buildReport>>): string {
  const pctColor = r.pct >= 80 ? '#86EFAC' : r.pct >= 50 ? '#FB923C' : '#F87171'

  const linha = (label: string, valor: string, cor = '#f0e8d8') =>
    `<tr><td style="padding:6px 0;font-size:13px;color:#a09070;">${label}</td>
      <td style="padding:6px 0;font-size:13px;color:${cor};text-align:right;font-family:'Courier New',monospace;">${valor}</td></tr>`

  const categoriasHtml = r.byCategoria.map(c => {
    const pct = c.planSec > 0 ? Math.min(100, Math.round((c.realSec / c.planSec) * 100)) : 0
    return `
      <tr><td colspan="2" style="padding:10px 0 4px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="font-size:12px;color:#f0e8d8;">
            <span style="display:inline-block;width:10px;height:10px;background:${c.cor};border-radius:2px;vertical-align:middle;margin-right:8px;"></span>
            ${c.titulo}
          </td>
          <td style="font-size:12px;color:#a09070;text-align:right;font-family:'Courier New',monospace;">
            <span style="color:#f0e8d8;">${fmtTotal(c.realSec)}</span> <span style="color:#5a4a30;">/ ${fmtTotal(c.planSec)}</span> &middot; ${pct}%
          </td>
        </tr></table>
        <div style="height:4px;background:rgba(255,255,255,0.05);margin-top:4px;border-radius:2px;overflow:hidden;">
          <div style="width:${pct}%;height:100%;background:${c.cor};"></div>
        </div>
      </td></tr>`
  }).join('')

  const casamentosHtml = r.byEvento.map(c => {
    const label = c.info?.referencia && c.info?.cliente
      ? `${c.info.referencia} · ${c.info.cliente}`
      : (c.info?.cliente || c.info?.referencia || 'Casamento')
    const evDate = c.info?.data_evento ? ` <span style="color:#5a4a30;">(${fmtDateShort(c.info.data_evento)})</span>` : ''
    return `<tr>
      <td style="padding:8px 0;font-size:13px;color:#f0e8d8;border-bottom:1px solid rgba(201,168,76,0.10);">
        <span style="display:inline-block;width:3px;height:14px;background:${c.cor};vertical-align:middle;margin-right:10px;"></span>
        ${label}${evDate}
      </td>
      <td style="padding:8px 0;font-size:13px;color:#c9a84c;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid rgba(201,168,76,0.10);">
        ${fmtTotal(c.realSec)}
        <div style="font-size:10px;color:#5a4a30;letter-spacing:2px;">${c.blocos} sessão${c.blocos === 1 ? '' : 'ões'}</div>
      </td>
    </tr>`
  }).join('') || '<tr><td colspan="2" style="padding:10px 0;font-size:12px;color:#5a4a30;font-style:italic;">Sem casamentos trabalhados nesta semana.</td></tr>'

  const concluidasHtml = r.concluidasSemana.length > 0
    ? r.concluidasSemana.slice(0, 10).map(t =>
        `<tr><td style="padding:5px 0;font-size:12px;color:#7dd3a4;border-bottom:1px solid rgba(125,211,164,0.10);">
          ✓ <span style="text-decoration:line-through;color:#7dd3a4cc;">${t.titulo}</span>
        </td></tr>`
      ).join('')
    : '<tr><td style="padding:10px 0;font-size:12px;color:#5a4a30;font-style:italic;">Sem tarefas concluídas esta semana.</td></tr>'

  const pendentesHtml = r.pendentes.length > 0
    ? r.pendentes.slice(0, 10).map(t => {
        const dt = t.data_prazo ? `<span style="color:#5a4a30;font-size:11px;margin-left:6px;">${fmtDateShort(t.data_prazo)}</span>` : ''
        return `<tr><td style="padding:5px 0;font-size:12px;color:#f0e8d8;border-bottom:1px solid rgba(201,168,76,0.08);">
          <span style="color:#c9a84c;">●</span> ${t.titulo}${dt}
        </td></tr>`
      }).join('')
    : '<tr><td style="padding:10px 0;font-size:12px;color:#5a4a30;font-style:italic;">Sem tarefas pendentes 🎉</td></tr>'

  const destaqueHtml = (r.casamentoMaisTrabalhado || r.diaMaisProdutivo) ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;background:rgba(201,168,76,0.05);border:1px solid rgba(201,168,76,0.20);border-radius:4px;">
      <tr><td style="padding:18px 24px;">
        <p style="margin:0 0 10px;font-size:9px;letter-spacing:0.4em;color:#c9a84c;text-transform:uppercase;">Destaques</p>
        ${r.casamentoMaisTrabalhado ? `<p style="margin:4px 0;font-size:13px;color:#f0e8d8;">
          💍 Mais trabalhado: <strong style="color:#c9a84c;">${r.casamentoMaisTrabalhado.info?.referencia || '—'} · ${r.casamentoMaisTrabalhado.info?.cliente || '—'}</strong>
          <span style="color:#a09070;">(${fmtTotal(r.casamentoMaisTrabalhado.real)})</span>
        </p>` : ''}
        ${r.diaMaisProdutivo ? `<p style="margin:4px 0;font-size:13px;color:#f0e8d8;">
          🔥 Dia mais produtivo: <strong style="color:#c9a84c;">${fmtDateLong(r.diaMaisProdutivo.data)}</strong>
          <span style="color:#a09070;">(${fmtTotal(r.diaMaisProdutivo.real)})</span>
        </p>` : ''}
      </td></tr>
    </table>
  ` : ''

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Relatório semanal</title></head>
<body style="margin:0;padding:0;background:#0e0b07;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0e0b07;padding:40px 16px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#120e09;border:0.5px solid #4a3a1e;">
        <tr><td style="padding:48px 48px 32px;font-family:Georgia,'Times New Roman',serif;">

          <!-- Cabeçalho -->
          <p style="margin:0 0 6px;font-size:9px;letter-spacing:0.5em;color:#c9a96e;text-transform:uppercase;">Relatório Semanal</p>
          <h1 style="margin:0 0 4px;font-size:28px;font-weight:300;color:#f0e8d8;letter-spacing:0.05em;">RL <span style="color:#c9a84c;">PHOTO</span>.VIDEO</h1>
          <p style="margin:0 0 24px;font-size:12px;color:#a09070;letter-spacing:0.1em;">${fmtDateLong(r.start)} → ${fmtDateLong(r.end)}</p>

          <div style="height:1px;background:linear-gradient(to right, transparent, #c9a84c, transparent);margin:0 0 32px;"></div>

          <!-- Cards principais -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="50%" style="padding-right:8px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
                  <tr><td style="padding:18px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Real / Planeado</p>
                    <p style="margin:0;font-size:24px;color:#f0e8d8;font-family:'Courier New',monospace;">${fmtTotal(r.totalRealSec)}</p>
                    <p style="margin:0;font-size:11px;color:#5a4a30;">de ${fmtTotal(r.totalPlanSec)}</p>
                  </td></tr>
                </table>
              </td>
              <td width="50%" style="padding-left:8px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);">
                  <tr><td style="padding:18px;text-align:center;">
                    <p style="margin:0 0 4px;font-size:9px;letter-spacing:0.4em;color:#7a6340;text-transform:uppercase;">Cumprido</p>
                    <p style="margin:0;font-size:24px;color:${pctColor};font-family:'Courier New',monospace;">${r.pct}%</p>
                    <p style="margin:0;font-size:11px;color:#5a4a30;">${r.blocksCount} bloco${r.blocksCount === 1 ? '' : 's'}</p>
                  </td></tr>
                </table>
              </td>
            </tr>
          </table>

          ${destaqueHtml}

          <!-- Por categoria -->
          <p style="margin:32px 0 4px;font-size:9px;letter-spacing:0.4em;color:#c9a84c;text-transform:uppercase;">Por categoria</p>
          <table width="100%" cellpadding="0" cellspacing="0">${categoriasHtml || '<tr><td style="padding:10px 0;font-size:12px;color:#5a4a30;font-style:italic;">Sem dados.</td></tr>'}</table>

          <!-- Por casamento -->
          <p style="margin:32px 0 4px;font-size:9px;letter-spacing:0.4em;color:#c9a84c;text-transform:uppercase;">Por casamento</p>
          <table width="100%" cellpadding="0" cellspacing="0">${casamentosHtml}</table>

          <!-- Tarefas -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
            <tr>
              <td width="50%" valign="top" style="padding-right:12px;">
                <p style="margin:0 0 8px;font-size:9px;letter-spacing:0.4em;color:#7dd3a4;text-transform:uppercase;">✓ Concluídas</p>
                <table width="100%" cellpadding="0" cellspacing="0">${concluidasHtml}</table>
              </td>
              <td width="50%" valign="top" style="padding-left:12px;">
                <p style="margin:0 0 8px;font-size:9px;letter-spacing:0.4em;color:#c9a84c;text-transform:uppercase;">● Pendentes</p>
                <table width="100%" cellpadding="0" cellspacing="0">${pendentesHtml}</table>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:40px;">
            <tr><td align="center">
              <a href="${SITE_BASE}/calendario"
                style="display:inline-block;padding:14px 36px;background:#c9a96e;color:#0e0b07;text-decoration:none;font-family:Georgia,serif;font-size:11px;letter-spacing:0.4em;font-weight:700;border-radius:6px;border:1px solid #c9a96e;">
                ABRIR CALENDÁRIO &nbsp;→
              </a>
            </td></tr>
          </table>

          <p style="margin:32px 0 0;font-size:9px;letter-spacing:0.35em;color:#5a4f3a;text-transform:uppercase;text-align:center;">
            RL PHOTO &middot; VIDEO &middot; Relatório automático
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [to], subject, html,
    }),
  })
  return res.ok
}

// Compute Monday → Sunday of the week containing `today`
function weekRange(today: Date): { start: string; end: string } {
  const day = today.getDay()              // 0=Sun, 1=Mon … 6=Sat
  const diffToMonday = (day + 6) % 7      // 0 se Mon, 1 se Tue, ... 6 se Sun
  const monday = new Date(today); monday.setDate(today.getDate() - diffToMonday)
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6)
  return { start: ymd(monday), end: ymd(sunday) }
}

async function runReport(): Promise<{ ok: boolean; sent: boolean; preview?: string; error?: string }> {
  try {
    const { start, end } = weekRange(new Date())
    const report = await buildReport(start, end)
    const html   = buildHtml(report)
    const subject = `📊 Relatório semanal · ${fmtDateShort(start)} → ${fmtDateShort(end)} · ${fmtTotal(report.totalRealSec)} trabalhadas`
    const ok = await sendEmail(TO_EMAIL, subject, html)
    return { ok: true, sent: ok, preview: html }
  } catch (err: any) {
    return { ok: false, sent: false, error: err.message }
  }
}

export async function GET(req: NextRequest) {
  // Vercel Cron uses Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization')
  const isCron = process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`

  // Allow manual preview via ?preview=1 (returns HTML, doesn't send email)
  const url = new URL(req.url)
  if (url.searchParams.get('preview') === '1') {
    const { start, end } = weekRange(new Date())
    const report = await buildReport(start, end)
    const html = buildHtml(report)
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
  }

  // Require cron auth (or local dev) for actual send
  if (!isCron && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await runReport()
  return NextResponse.json(result)
}

export async function POST() {
  const result = await runReport()
  return NextResponse.json(result)
}
