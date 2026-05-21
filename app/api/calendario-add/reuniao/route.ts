import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// POST /api/calendario-add/reuniao — define / atualiza reunião num contacto CRM
// Body: { crm_id: string, data: 'YYYY-MM-DD', hora: 'HH:MM', tipo?: 'Presencial' | 'Videochamada', link?: string }
export async function POST(req: Request) {
  const body = await req.json()
  const { crm_id, data, hora, tipo, link } = body

  if (!crm_id || !data || !hora) {
    return NextResponse.json({ error: 'crm_id, data e hora são obrigatórios' }, { status: 400 })
  }

  const { error } = await db()
    .from('crm_contacts')
    .update({
      reuniao_data: data,
      reuniao_hora: hora,
      reuniao_tipo: tipo ?? 'Presencial',
      reuniao_link: link ?? null,
      status: 'Reunião Agendada',
      updated_at: new Date().toISOString(),
    })
    .eq('id', crm_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
