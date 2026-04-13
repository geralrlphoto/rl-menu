import { createClient } from '@supabase/supabase-js'
import CalendarClient, {
  type CalEvent,
  type PreWeddingEvent,
  type TeamEntry,
} from './CalendarClient'

export const dynamic = 'force-dynamic'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const EVENTOS_DB   = '1ad220116d8a804b839ddc36f1e7ecf1'

function getProp(props: any, key: string, type: string): any {
  const p = props[key]
  if (!p) return null
  try {
    if (type === 'title')        return p.title?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'text')         return p.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'date')         return p.date?.start ?? null
    if (type === 'multi_select') return p.multi_select?.map((s: any) => s.name) ?? []
  } catch { return null }
  return null
}

export default async function CalendarioPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // ── 1. Fetch wedding events from Notion ───────────────────────────────────
  const allPages: any[] = []
  let cursor: string | null = null

  do {
    const body: any = {
      page_size: 100,
      sorts: [{ property: 'DATA DO EVENTO', direction: 'ascending' }],
    }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    if (!res.ok) break
    const data = await res.json()
    allPages.push(...data.results)
    cursor = data.has_more ? data.next_cursor : null
  } while (cursor)

  const events: CalEvent[] = allPages
    .map((page: any) => {
      const p = page.properties ?? {}
      return {
        id:          page.id,
        referencia:  getProp(p, 'REFERÊNCIA DO EVENTO', 'title') ?? '',
        cliente:     getProp(p, 'CLIENTE', 'text') ?? '',
        data_evento: getProp(p, 'DATA DO EVENTO', 'date'),
        local:       getProp(p, 'LOCAL', 'text'),
        tipo_evento: getProp(p, 'TIPO DE EVENTO', 'multi_select') ?? [],
        fotografo:   getProp(p, 'FOTOGRAFO', 'multi_select') ?? [],
        videografo:  getProp(p, 'VÍDEOGRAFO ', 'multi_select') ?? [],
      }
    })
    .filter(e => e.data_evento !== null)

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
  const { data: confirmacoes } = await supabase
    .from('freelancer_casamentos')
    .select(`
      id,
      data_casamento,
      local,
      evento_id,
      data_confirmada,
      indisponivel,
      data_confirmada_videografo,
      indisponivel_videografo,
      confirmado_em,
      indisponivel_em,
      confirmado_videografo_em,
      indisponivel_videografo_em,
      freelancer_id,
      freelancers!inner ( nome )
    `)
    .or('data_confirmada.eq.true,indisponivel.eq.true,data_confirmada_videografo.eq.true,indisponivel_videografo.eq.true')

  const teamEntries: TeamEntry[] = (confirmacoes ?? [])
    .filter(c => c.data_casamento)
    .flatMap(c => {
      const nome = (c.freelancers as any)?.nome ?? 'Freelancer'
      const entries: TeamEntry[] = []

      // fotógrafo confirmado
      if (c.data_confirmada || c.indisponivel) {
        const tsRaw: string | null = c.data_confirmada
          ? (c as any).confirmado_em ?? null
          : (c as any).indisponivel_em ?? null
        // Use timestamp date if available, otherwise fall back to event date
        const calDate = tsRaw
          ? tsRaw.split('T')[0]
          : c.data_casamento as string
        entries.push({
          id:              `${c.id}_foto`,
          freelancer_nome: nome,
          data_evento:     c.data_casamento as string,
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
          ? (c as any).confirmado_videografo_em ?? null
          : (c as any).indisponivel_videografo_em ?? null
        const calDate = tsRaw
          ? tsRaw.split('T')[0]
          : c.data_casamento as string
        entries.push({
          id:              `${c.id}_video`,
          freelancer_nome: nome,
          data_evento:     c.data_casamento as string,
          data_calendar:   calDate,
          local:           c.local ?? null,
          evento_id:       c.evento_id ?? null,
          status:          c.data_confirmada_videografo ? 'confirmado' : 'indisponivel',
          tipo:            'confirmacao' as const,
        })
      }

      return entries
    })

  // ── 4. Editing activity logs (FUTURE) ─────────────────────────────────────
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
    />
  )
}
