import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/calendario-add/crm-list — lista resumida dos contactos CRM para
// picker de reunião. Devolve { contactos: [{ id, nome, contato, status, reuniao_data }] }
export async function GET() {
  const { data, error } = await db()
    .from('crm_contacts')
    .select('id, nome, contato, status, reuniao_data, reuniao_hora')
    .order('nome', { ascending: true })

  if (error) return NextResponse.json({ contactos: [], error: error.message }, { status: 500 })
  return NextResponse.json({ contactos: data ?? [] })
}
