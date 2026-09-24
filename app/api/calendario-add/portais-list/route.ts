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
// Inclui também os casamentos de eventos_2026 que ainda não têm portal
// (sem_portal: true), para se ver que existem; não podem receber PW.
// Devolve { portais: [{ referencia, noiva, noivo, cliente, data_evento, has_pw, pw_date, pw_time, sem_portal }] }
export async function GET() {
  const supabase = db()
  const [portaisRes, eventosRes] = await Promise.all([
    supabase
      .from('portais')
      .select('referencia, noiva, noivo, s_noiva:settings->noiva, s_noivo:settings->noivo, slots:settings->preWeddingSlots, reserved:settings->preWeddingReservedSlotId'),
    supabase
      .from('eventos_2026')
      .select('referencia, cliente, data_evento, tipo_evento'),
  ])

  if (portaisRes.error) return NextResponse.json({ portais: [], error: portaisRes.error.message }, { status: 500 })

  const eventos = new Map<string, { cliente: string; data_evento: string | null; tipo: string }>()
  for (const e of (eventosRes.data ?? []) as any[]) {
    if (!e.referencia) continue
    eventos.set(e.referencia, { cliente: (e.cliente ?? '').trim(), data_evento: e.data_evento ?? null, tipo: String(e.tipo_evento ?? '') })
  }

  const portais = (portaisRes.data ?? []).map((p: any) => {
    const slots: any[] = Array.isArray(p.slots) ? p.slots : []
    const reservedSlot = p.reserved ? slots.find((sl: any) => sl.id === p.reserved) : null
    const ev = eventos.get(p.referencia)
    return {
      referencia: p.referencia,
      noiva: p.noiva ?? p.s_noiva ?? '',
      noivo: p.noivo ?? p.s_noivo ?? '',
      cliente: ev?.cliente ?? '',
      data_evento: ev?.data_evento ?? null,
      has_pw: !!reservedSlot,
      pw_date: reservedSlot?.date ?? null,
      pw_time: reservedSlot?.time ?? null,
      sem_portal: false,
    }
  })

  const comPortal = new Set(portais.map(p => p.referencia))
  const hoje = new Date().toISOString().slice(0, 10)
  for (const [referencia, ev] of eventos) {
    if (comPortal.has(referencia)) continue
    if (!ev.tipo.toUpperCase().includes('CASAMENTO')) continue
    if (ev.data_evento && ev.data_evento < hoje) continue
    portais.push({
      referencia, noiva: '', noivo: '', cliente: ev.cliente, data_evento: ev.data_evento,
      has_pw: false, pw_date: null, pw_time: null, sem_portal: true,
    })
  }

  portais.sort((a, b) => (a.referencia || '').localeCompare(b.referencia || ''))
  return NextResponse.json({ portais })
}
