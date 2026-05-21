import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/calendario-add/pre-wedding — adiciona um slot de pré-wedding ao
// portal e marca-o como reservado (ficando visível no calendário e nos
// time blocks).
// Body: { referencia: string, data: 'YYYY-MM-DD', hora?: 'HH:MM', local?: string }
export async function POST(req: Request) {
  const body = await req.json()
  const { referencia, data, hora, local } = body

  if (!referencia || !data) {
    return NextResponse.json({ error: 'referencia e data são obrigatórios' }, { status: 400 })
  }

  const supabase = db()

  // Carrega settings atuais
  const { data: row, error: fetchErr } = await supabase
    .from('portais')
    .select('settings')
    .eq('referencia', referencia)
    .single()

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Portal não encontrado para esta referência' }, { status: 404 })
  }

  const settings = row.settings ?? {}
  const slots: any[] = Array.isArray(settings.preWeddingSlots) ? [...settings.preWeddingSlots] : []

  // Cria novo slot (ou reusa se já houver um com a mesma data/hora)
  const id = `slot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const newSlot = {
    id,
    date: data,
    time: hora ?? null,
    local: local ?? null,
    label: `${data}${hora ? ' às ' + hora : ''}${local ? ' · ' + local : ''}`,
  }
  slots.push(newSlot)

  const newSettings = {
    ...settings,
    preWeddingSlots: slots,
    preWeddingReservedSlotId: id,
  }

  const { error: updErr } = await supabase
    .from('portais')
    .update({ settings: newSettings })
    .eq('referencia', referencia)

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
  return NextResponse.json({ ok: true, slot: newSlot })
}
