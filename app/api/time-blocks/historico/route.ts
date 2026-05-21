import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/**
 * GET /api/time-blocks/historico
 *
 * Returns aggregated time-block stats per evento_id. Optionally filtered by
 * date range via `?since=YYYY-MM-DD` and `?until=YYYY-MM-DD`.
 *
 * Response:
 *   {
 *     items: [
 *       {
 *         evento_id: string,
 *         total_segundos: number,
 *         sessoes: number,         // number of blocks linked to this event
 *         dias: number,            // distinct days
 *         ultima_data: string,     // YYYY-MM-DD
 *         blocks: [ ...block rows for detail view ]
 *       },
 *       ...
 *     ]
 *   }
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const since = searchParams.get('since')
  const until = searchParams.get('until')

  let q = db()
    .from('time_blocks')
    .select('id, data, categoria, titulo, cor, hora_inicio, hora_fim, duracao_minutos, evento_id, tempo_real_segundos, timer_state')
    .not('evento_id', 'is', null)
    .order('data', { ascending: false })

  if (since) q = q.gte('data', since)
  if (until) q = q.lte('data', until)

  const { data: rows, error } = await q
  if (error) return NextResponse.json({ items: [], error: error.message }, { status: 500 })

  const grouped = new Map<string, any>()
  for (const r of rows ?? []) {
    const key = r.evento_id as string
    if (!grouped.has(key)) {
      grouped.set(key, {
        evento_id: key,
        total_segundos: 0,
        sessoes: 0,
        dias: new Set<string>(),
        ultima_data: r.data,
        blocks: [] as any[],
      })
    }
    const g = grouped.get(key)
    g.total_segundos += r.tempo_real_segundos ?? 0
    g.sessoes += 1
    g.dias.add(r.data)
    if (r.data > g.ultima_data) g.ultima_data = r.data
    g.blocks.push(r)
  }

  const items = Array.from(grouped.values())
    .map(g => ({ ...g, dias: g.dias.size }))
    .sort((a, b) => b.total_segundos - a.total_segundos)

  return NextResponse.json({ items })
}
