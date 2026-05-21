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

// DELETE /api/calendario-add/reuniao?crm_id=<id>
// Limpa os campos de reunião do contacto CRM E remove o time_block correspondente.
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const crmId = searchParams.get('crm_id')
  if (!crmId) return NextResponse.json({ error: 'crm_id obrigatório' }, { status: 400 })

  const supabase = db()

  // 1. Limpa os campos da reunião (mantém status para o user ajustar manualmente)
  const { error } = await supabase
    .from('crm_contacts')
    .update({
      reuniao_data: null,
      reuniao_hora: null,
      reuniao_tipo: null,
      reuniao_link: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', crmId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 2. Remove o(s) time_block(s) com evento_id = <crm_id>
  await supabase.from('time_blocks').delete().eq('evento_id', crmId)

  return NextResponse.json({ ok: true })
}
