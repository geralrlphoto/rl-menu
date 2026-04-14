import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET /api/equipa-disponibilidade-check?referencia=X&data=Y
// Returns { unavailable: string[] } — uppercase names of unavailable freelancers
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const referencia = searchParams.get('referencia')
  const data = searchParams.get('data') // YYYY-MM-DD

  if (!referencia || !data) {
    return NextResponse.json({ unavailable: [] })
  }

  const sb = supabase()
  const unavailableIds = new Set<string>()

  // 1 — Freelancers que marcaram indisponível no próprio evento (casamento)
  const { data: casamentos } = await sb
    .from('freelancer_casamentos')
    .select('freelancer_id, indisponivel, indisponivel_videografo')
    .eq('referencia', referencia)

  for (const c of casamentos ?? []) {
    if (c.indisponivel || c.indisponivel_videografo) {
      unavailableIds.add(c.freelancer_id)
    }
  }

  // 2 — Freelancers com período de indisponibilidade que cobre a data do evento
  const { data: periodos } = await sb
    .from('freelancer_disponibilidade')
    .select('freelancer_id, data_inicio, data_fim')
    .lte('data_inicio', data)
    .gte('data_fim', data)

  for (const p of periodos ?? []) {
    unavailableIds.add(p.freelancer_id)
  }

  if (unavailableIds.size === 0) {
    return NextResponse.json({ unavailable: [] })
  }

  // 3 — Converter IDs → nomes (uppercase)
  const { data: freelancers } = await sb
    .from('freelancers')
    .select('id, nome')
    .in('id', Array.from(unavailableIds))

  const unavailable = (freelancers ?? []).map(f => (f.nome as string).toUpperCase())

  return NextResponse.json({ unavailable })
}
