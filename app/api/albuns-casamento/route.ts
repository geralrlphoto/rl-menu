import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET() {
  const { data, error } = await db()
    .from('albuns_casamento')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data ?? [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { nome, ref_evento, num_fotografias, data_entrega_fotos, check_existing } = body

  const supabase = db()

  // Check for existing entry — if found, update fields and return
  if (check_existing && ref_evento) {
    const { data: existing } = await supabase
      .from('albuns_casamento')
      .select('id')
      .eq('ref_evento', ref_evento)
      .maybeSingle()
    if (existing) {
      const updateFields: Record<string, any> = {}
      if (nome) updateFields.nome = nome
      if (num_fotografias) updateFields.num_fotografias = num_fotografias
      if (data_entrega_fotos) updateFields.data_entrega_fotos = data_entrega_fotos
      if (Object.keys(updateFields).length > 0) {
        await supabase.from('albuns_casamento')
          .update(updateFields)
          .eq('id', existing.id)
      }
      const { data: row } = await supabase
        .from('albuns_casamento')
        .select('*')
        .eq('id', existing.id)
        .maybeSingle()
      return NextResponse.json({ row, already_exists: true })
    }
  }

  const { data, error } = await supabase
    .from('albuns_casamento')
    .insert({
      nome: nome || 'Novo Álbum',
      status: 'NOVO ÁLBUM',
      ref_evento: ref_evento ?? null,
      num_fotografias: num_fotografias ?? null,
      data_entrega_fotos: data_entrega_fotos ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ row: data })
}
