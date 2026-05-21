import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/calendario-add/portais-list — lista dos portais (casamentos)
// para escolher onde marcar um pré-wedding.
// Devolve { portais: [{ referencia, noiva, noivo, has_pw, pw_date }] }
export async function GET() {
  const { data, error } = await db()
    .from('portais')
    .select('referencia, noiva, noivo, settings')

  if (error) return NextResponse.json({ portais: [], error: error.message }, { status: 500 })

  const portais = (data ?? []).map((p: any) => {
    const s = p.settings ?? {}
    const slots: any[] = Array.isArray(s.preWeddingSlots) ? s.preWeddingSlots : []
    const reservedId = s.preWeddingReservedSlotId ?? null
    const reservedSlot = reservedId ? slots.find((sl: any) => sl.id === reservedId) : null
    return {
      referencia: p.referencia,
      noiva: p.noiva ?? s.noiva ?? '',
      noivo: p.noivo ?? s.noivo ?? '',
      has_pw: !!reservedSlot,
      pw_date: reservedSlot?.date ?? null,
      pw_time: reservedSlot?.time ?? null,
    }
  }).sort((a, b) => (a.referencia || '').localeCompare(b.referencia || ''))

  return NextResponse.json({ portais })
}
