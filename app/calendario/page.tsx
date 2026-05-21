import { createClient } from '@supabase/supabase-js'
import CalendarClient, {
  type CalEvent,
  type PreWeddingEvent,
  type TeamEntry,
  type ReuniaoEvent,
  type TarefaEvent,
} from './CalendarClient'

export const dynamic = 'force-dynamic'

// Best-effort multi-format parser for jsonb / text / text[] arrays returned by Supabase
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

export default async function CalendarioPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── 1. Wedding events — SUPABASE-ONLY (mesma fonte que /casamentos) ───────
  //
  // The table `eventos_2026` despite the name keeps events from multiple years
  // (the /api/eventos-supabase endpoint just filters by year on top). We load
  // ALL years here so the calendar dropdown shows everything chronologically.
  //
  // We keep `notion_id` as the CalEvent.id (with fallback to row.id when the
  // notion_id is empty) so that tarefas.evento_id and time_blocks.evento_id
  // values created before the switch keep matching.
  //
  // NOTE: Supabase's default row limit is 1000. /casamentos hits the API once
  // per year (so it's automatically chunked), but here we load everything in
  // one shot. We use a paged loop with `range` to be safe against the cap.
  const eventosRaw: any[] = []
  const PAGE = 1000
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('eventos_2026')
      .select('*')
      .order('data_evento', { ascending: true, nullsFirst: false })
      .range(from, from + PAGE - 1)
    if (error) { console.error('[calendario] eventos_2026 fetch error:', error.message); break }
    if (!data || data.length === 0) break
    eventosRaw.push(...data)
    if (data.length < PAGE) break
  }

  const events: CalEvent[] = eventosRaw.map((row: any) => ({
    id:          row.notion_id || row.id,
    referencia:  row.referencia ?? '',
    cliente:     row.cliente ?? '',
    data_evento: row.data_evento ?? null,
    local:       row.local ?? null,
    tipo_evento: parseArr(row.tipo_evento),
    fotografo:   parseArr(row.fotografo),
    videografo:  parseArr(row.videografo),
  }))

  // ── 2. Pre-wedding reservations ───────────────────────────────────────────
  const { data: portais } = await supabase
    .from('portais')
    .select('referencia, noiva, noivo, settings')

  const preWeddings: PreWeddingEvent[] = []
  for (const portal of portais ?? []) {
    const s = portal.settings ?? {}
    const slots: any[]              = s.preWeddingSlots ?? []
    const reservedId: string | null = s.preWeddingReservedSlotId ?? null
    if (!reservedId) continue
    const slot = slots.find((sl: any) => sl.id === reservedId)
    if (!slot?.date) continue
    const noiva: string = s.noiva ?? portal.noiva ?? ''
    const noivo: string = s.noivo ?? portal.noivo ?? ''
    const nomes = [noiva, noivo].filter(Boolean).join(' & ') || portal.referencia
    preWeddings.push({
      id:          `pw_${portal.referencia}`,
      referencia:  portal.referencia,
      nomes,
      data_evento: slot.date,
      hora:        slot.time ?? null,
      local:       slot.local ?? null,
    })
  }

  // ── 3. Team confirmations (freelancer_casamentos) ─────────────────────────
  // Use direct REST fetch to bypass any JS-client schema-cache issues with new columns
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey   = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const fcRes = await fetch(
    `${supabaseUrl}/rest/v1/freelancer_casamentos` +
    `?select=id,data_casamento,local,evento_id,data_confirmada,indisponivel,` +
    `data_confirmada_videografo,indisponivel_videografo,` +
    `confirmado_em,indisponivel_em,confirmado_videografo_em,indisponivel_videografo_em,` +
    `freelancer_id,freelancers!inner(nome)` +
    `&or=(data_confirmada.eq.true,indisponivel.eq.true,data_confirmada_videografo.eq.true,indisponivel_videografo.eq.true)`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  )
  const confirmacoes: any[] = fcRes.ok ? await fcRes.json() : []

  const teamEntries: TeamEntry[] = confirmacoes
    .filter((c: any) => c.data_casamento)
    .flatMap((c: any) => {
      const nome = c.freelancers?.nome ?? 'Freelancer'
      const entries: TeamEntry[] = []

      // fotógrafo confirmado
      if (c.data_confirmada || c.indisponivel) {
        const tsRaw: string | null = c.data_confirmada
          ? c.confirmado_em ?? null
          : c.indisponivel_em ?? null
        // Use timestamp date if available, otherwise fall back to event date
        const calDate = tsRaw
          ? tsRaw.split('T')[0]
          : c.data_casamento
        entries.push({
          id:              `${c.id}_foto`,
          freelancer_nome: nome,
          data_evento:     c.data_casamento,
          data_calendar:   calDate,
          local:           c.local ?? null,
          evento_id:       c.evento_id ?? null,
          status:          c.data_confirmada ? 'confirmado' : 'indisponivel',
          tipo:            'confirmacao' as const,
        })
      }

      // videógrafo confirmado
      if (c.data_confirmada_videografo || c.indisponivel_videografo) {
        const tsRaw: string | null = c.data_confirmada_videografo
          ? c.confirmado_videografo_em ?? null
          : c.indisponivel_videografo_em ?? null
        const calDate = tsRaw
          ? tsRaw.split('T')[0]
          : c.data_casamento
        entries.push({
          id:              `${c.id}_video`,
          freelancer_nome: nome,
          data_evento:     c.data_casamento,
          data_calendar:   calDate,
          local:           c.local ?? null,
          evento_id:       c.evento_id ?? null,
          status:          c.data_confirmada_videografo ? 'confirmado' : 'indisponivel',
          tipo:            'confirmacao' as const,
        })
      }

      return entries
    })

  // ── 4. CRM Reuniões ───────────────────────────────────────────────────────
  const { data: reunioesRaw } = await supabase
    .from('crm_contacts')
    .select('id, nome, reuniao_data, reuniao_hora, reuniao_tipo, reuniao_link')
    .not('reuniao_data', 'is', null)
    .order('reuniao_data', { ascending: true })

  const reunioes: ReuniaoEvent[] = (reunioesRaw ?? []).map((r: any) => ({
    id:           r.id,
    nome:         r.nome ?? '—',
    reuniao_data: r.reuniao_data,
    reuniao_hora: r.reuniao_hora ?? null,
    reuniao_tipo: r.reuniao_tipo ?? null,
    reuniao_link: r.reuniao_link ?? null,
  }))

  // ── 4b. Tarefas (calendar tasks) ──────────────────────────────────────────
  const { data: tarefasRaw } = await supabase
    .from('tarefas')
    .select('id, titulo, descricao, status, data_prazo, hora, evento_id')
    .not('data_prazo', 'is', null)
    .order('data_prazo', { ascending: true })

  const tarefas: TarefaEvent[] = (tarefasRaw ?? []).map((t: any) => ({
    id:         t.id,
    titulo:     t.titulo ?? '',
    descricao:  t.descricao ?? null,
    status:     (t.status ?? 'NOVA') as TarefaEvent['status'],
    data_prazo: t.data_prazo,
    hora:       t.hora ?? null,
    evento_id:  t.evento_id ?? null,
  }))

  // ── 5. Editing activity logs (FUTURE) ─────────────────────────────────────
  // When "Edição de Fotos / Álbum / Vídeo" features are built, create a
  // `freelancer_activity_log` table with columns:
  //   id, created_at, freelancer_id, freelancer_nome, data_evento,
  //   local, evento_id, tipo ('edicao_fotos'|'edicao_album'|'edicao_video'),
  //   status ('iniciado'|'concluido')
  // Then uncomment and add these to teamEntries:
  //
  // const { data: editLogs } = await supabase
  //   .from('freelancer_activity_log')
  //   .select('*')
  // const editEntries: TeamEntry[] = (editLogs ?? []).map(...)
  // teamEntries.push(...editEntries)

  return (
    <CalendarClient
      events={events}
      preWeddings={preWeddings}
      teamEntries={teamEntries}
      reunioes={reunioes}
      tarefas={tarefas}
    />
  )
}
