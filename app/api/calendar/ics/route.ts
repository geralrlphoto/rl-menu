import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/calendar/ics
// Devolve um feed iCalendar (RFC 5545) com:
//   - Casamentos / batizados (eventos_2026)
//   - Pré-weddings reservados (portais.settings.preWeddingReservedSlotId)
//   - Reuniões reservadas (portais.settings.bookingReservedSlotId quando type='reuniao'
//                          e crm_contacts.reuniao_data + reuniao_hora)
//   - Tarefas com data_prazo (tarefas)
//
// Para subscrever no Google Calendar: Outras agendas → Adicionar via URL →
// cola https://portal.rlphotovideo.pt/api/calendar/ics
// Google sincroniza automaticamente (cada ~12h).

export const dynamic = 'force-dynamic'

function parseArr(v: any): string[] {
  if (Array.isArray(v)) return v.map(String)
  if (typeof v === 'string') {
    const s = v.trim()
    if (!s) return []
    if (s.startsWith('[')) {
      try { const p = JSON.parse(s); return Array.isArray(p) ? p.map(String) : [] } catch { return [s] }
    }
    return s.split(',').map(x => x.trim()).filter(Boolean)
  }
  return []
}

// ─── ICS helpers ───────────────────────────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, '0') }
function fmtDateOnly(d: string) {
  // d = "2026-05-23" → "20260523"
  return d.replace(/-/g, '')
}
function fmtDateUTC(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}
function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`
}
// Escapa texto ICS (vírgulas, ponto-vírgulas, barras invertidas, newlines)
function esc(s: string) {
  return (s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}
// Quebra linhas a 75 octetos (RFC 5545)
function fold(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  let i = 0
  while (i < line.length) {
    parts.push((i === 0 ? '' : ' ') + line.slice(i, i + 73))
    i += 73
  }
  return parts.join('\r\n')
}
function vevent(opts: {
  uid: string
  summary: string
  description?: string
  location?: string
  allDay?: boolean
  dateStart: string  // "YYYY-MM-DD" se allDay, ISO Date string se !allDay
  dateEnd?: string   // exclusivo para allDay; opcional para timed
  durationMin?: number // se !allDay e sem dateEnd
}): string {
  const lines: string[] = []
  lines.push('BEGIN:VEVENT')
  lines.push(`UID:${opts.uid}`)
  lines.push(`DTSTAMP:${fmtDateUTC(new Date())}`)
  if (opts.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${fmtDateOnly(opts.dateStart)}`)
    lines.push(`DTEND;VALUE=DATE:${opts.dateEnd ? fmtDateOnly(opts.dateEnd) : addDays(opts.dateStart, 1)}`)
  } else {
    const start = new Date(opts.dateStart)
    lines.push(`DTSTART:${fmtDateUTC(start)}`)
    if (opts.dateEnd) {
      lines.push(`DTEND:${fmtDateUTC(new Date(opts.dateEnd))}`)
    } else if (opts.durationMin) {
      lines.push(`DURATION:PT${opts.durationMin}M`)
    }
  }
  lines.push(`SUMMARY:${esc(opts.summary)}`)
  if (opts.description) lines.push(`DESCRIPTION:${esc(opts.description)}`)
  if (opts.location)    lines.push(`LOCATION:${esc(opts.location)}`)
  lines.push('END:VEVENT')
  return lines.map(fold).join('\r\n')
}

export async function GET(_req: NextRequest) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const veventos: string[] = []

  // ── 1. eventos_2026 (casamentos + batizados) ─────────────────────────────
  try {
    const eventos: any[] = []
    for (let from = 0; ; from += 1000) {
      const { data } = await sb.from('eventos_2026').select('*').range(from, from + 999)
      if (!data || data.length === 0) break
      eventos.push(...data)
      if (data.length < 1000) break
    }
    for (const e of eventos) {
      if (!e.data_evento) continue
      const tipos = parseArr(e.tipo_evento).join(', ') || 'EVENTO'
      const foto  = parseArr(e.fotografo).join(', ')
      const video = parseArr(e.videografo).join(', ')
      const ref   = e.referencia || ''
      const cli   = e.cliente || ''
      const summaryParts = [ref, cli].filter(Boolean).join(' · ')
      const descParts: string[] = []
      if (tipos) descParts.push(`Tipo: ${tipos}`)
      if (foto)  descParts.push(`Fotógrafo: ${foto}`)
      if (video) descParts.push(`Videógrafo: ${video}`)
      veventos.push(vevent({
        uid: `evento-${e.id || e.notion_id || ref}@rlphotovideo`,
        summary: summaryParts || ref || 'Evento',
        description: descParts.join('\n'),
        location: e.local || undefined,
        allDay: true,
        dateStart: e.data_evento,
      }))
    }
  } catch (err) { console.warn('[ics] eventos failed:', (err as any)?.message) }

  // ── 2. Pré-weddings reservados (portais.settings) ────────────────────────
  try {
    const { data: portais } = await sb.from('portais').select('referencia, noiva, noivo, settings, local')
    for (const p of portais ?? []) {
      const s = p.settings ?? {}
      const slots: any[] = s.preWeddingSlots ?? []
      const reservedId = s.preWeddingReservedSlotId
      if (!reservedId) continue
      const slot = slots.find((x: any) => x.id === reservedId)
      if (!slot?.date) continue
      const nome = [p.noiva, p.noivo].filter(Boolean).join(' & ') || s.nomeCrianca || p.referencia
      const tipo = s.tipoPortal === 'batizado' ? 'Sessão Família' : 'Pré-Wedding'
      const dt = slot.time ? `${slot.date}T${slot.time}:00` : slot.date
      veventos.push(vevent({
        uid: `prewedding-${p.referencia}-${reservedId}@rlphotovideo`,
        summary: `${tipo} · ${nome}`,
        description: `Referência: ${p.referencia}`,
        location: slot.local || undefined,
        allDay: !slot.time,
        dateStart: dt,
        durationMin: slot.time ? 120 : undefined,
      }))

      // ── 2b. Booking section (sessão / reunião nova) ─────────────────────
      const bookingSlots: any[] = s.bookingSlots ?? []
      const bookingResId = s.bookingReservedSlotId
      if (bookingResId) {
        const bSlot = bookingSlots.find((x: any) => x.id === bookingResId)
        if (bSlot?.date) {
          const bTipo = s.bookingType === 'reuniao' ? 'Reunião' : 'Sessão Fotografia'
          const bDt   = bSlot.time ? `${bSlot.date}T${bSlot.time}:00` : bSlot.date
          veventos.push(vevent({
            uid: `booking-${p.referencia}-${bookingResId}@rlphotovideo`,
            summary: `${bTipo} · ${nome}`,
            description: `Referência: ${p.referencia}`,
            location: bSlot.local || undefined,
            allDay: !bSlot.time,
            dateStart: bDt,
            durationMin: bSlot.time ? 60 : undefined,
          }))
        }
      }
    }
  } catch (err) { console.warn('[ics] portais failed:', (err as any)?.message) }

  // ── 3. Reuniões CRM (crm_contacts.reuniao_data) ──────────────────────────
  try {
    const { data: leads } = await sb
      .from('crm_contacts')
      .select('id, nome, email, contato, reuniao_data, reuniao_hora, reuniao_link, reuniao_tipo, tipo_evento, local_casamento')
      .not('reuniao_data', 'is', null)
    for (const lead of leads ?? []) {
      const dt = lead.reuniao_hora ? `${lead.reuniao_data}T${lead.reuniao_hora}:00` : lead.reuniao_data
      const descParts: string[] = []
      if (lead.email)    descParts.push(`Email: ${lead.email}`)
      if (lead.contato)  descParts.push(`Telefone: ${lead.contato}`)
      if (lead.tipo_evento) descParts.push(`Tipo: ${lead.tipo_evento}`)
      if (lead.reuniao_link) descParts.push(`Link: ${lead.reuniao_link}`)
      veventos.push(vevent({
        uid: `reuniao-${lead.id}@rlphotovideo`,
        summary: `Reunião · ${lead.nome || 'Lead'}`,
        description: descParts.join('\n'),
        location: lead.reuniao_link || lead.local_casamento || undefined,
        allDay: !lead.reuniao_hora,
        dateStart: dt,
        durationMin: lead.reuniao_hora ? 60 : undefined,
      }))
    }
  } catch (err) { console.warn('[ics] crm reunioes failed:', (err as any)?.message) }

  // ── 4. Tarefas com data_prazo ────────────────────────────────────────────
  try {
    const { data: tarefas } = await sb
      .from('tarefas')
      .select('id, titulo, descricao, data_prazo, status')
      .not('data_prazo', 'is', null)
    for (const t of tarefas ?? []) {
      if (t.status === 'CONCLUIDA') continue
      veventos.push(vevent({
        uid: `tarefa-${t.id}@rlphotovideo`,
        summary: `📋 ${t.titulo}`,
        description: t.descricao || '',
        allDay: true,
        dateStart: t.data_prazo,
      }))
    }
  } catch (err) { console.warn('[ics] tarefas failed:', (err as any)?.message) }

  // ── Compor ICS ────────────────────────────────────────────────────────────
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RL Photo Video//Calendário//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'NAME:RL Photo · Video',
    'X-WR-CALNAME:RL Photo · Video',
    'X-WR-CALDESC:Casamentos, batizados, pré-weddings, reuniões e tarefas',
    'X-WR-TIMEZONE:Europe/Lisbon',
    'REFRESH-INTERVAL;VALUE=DURATION:PT4H',
    'X-PUBLISHED-TTL:PT4H',
    ...veventos,
    'END:VCALENDAR',
  ].join('\r\n')

  return new NextResponse(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Content-Disposition': 'inline; filename="rl-photo-video.ics"',
    },
  })
}
