import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ehAdmin, exigeAdmin, exigeAdminOuProprio } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const freelancer_id = searchParams.get('freelancer_id')
  // Sem id é a lista toda: só admin. Com id, o próprio também.
  const barrado = freelancer_id ? await exigeAdminOuProprio(req, freelancer_id) : exigeAdmin(req)
  if (barrado) return barrado
  let query = supabase()
    .from('freelancer_pagamentos')
    .select('*')
    .order('data_prevista', { ascending: true, nullsFirst: false })
  if (freelancer_id) query = query.eq('freelancer_id', freelancer_id)
  const { data, error } = await query
  if (error) { console.error('[freelancer-pagamentos GET]', error); return NextResponse.json({ pagamentos: [] }) }
  return NextResponse.json({ pagamentos: data ?? [] })
}

// Criar pagamentos é do admin (a criação automática passa pelo servidor).
export async function POST(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado
  const body = await req.json()
  const { data, error } = await supabase().from('freelancer_pagamentos').insert(body).select().single()
  if (error) { console.error('[freelancer-pagamentos POST]', error); return NextResponse.json({ error: error.message }, { status: 500 }) }
  return NextResponse.json({ pagamento: data })
}

// PATCH — admin altera tudo; o membro só marca como recebido um pagamento seu.
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...rest } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (!ehAdmin(req)) {
    const { data: linha } = await supabase()
      .from('freelancer_pagamentos').select('freelancer_id').eq('id', id).maybeSingle()
    const barrado = await exigeAdminOuProprio(req, linha?.freelancer_id ?? null)
    if (barrado) return barrado
    const permitidos = ['status', 'data_pago']
    for (const k of Object.keys(rest)) {
      if (!permitidos.includes(k)) {
        return NextResponse.json({ error: `campo nao permitido: ${k}` }, { status: 403 })
      }
    }
  }
  const { data, error } = await supabase().from('freelancer_pagamentos').update(rest).eq('id', id).select().single()
  if (error) { console.error('[freelancer-pagamentos PATCH]', error); return NextResponse.json({ error: error.message }, { status: 500 }) }
  return NextResponse.json({ pagamento: data })
}

// Apagar pagamentos é do admin.
export async function DELETE(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase().from('freelancer_pagamentos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
