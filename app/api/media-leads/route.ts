import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('media_leads')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const { data, error } = await supabase
    .from('media_leads')
    .insert([{
      nome:       body.nome,
      empresa:    body.empresa || null,
      email:      body.email || null,
      telefone:   body.telefone || null,
      tipo:       body.tipo || null,
      fonte:      body.fonte || null,
      mensagem:   body.mensagem || null,
      estado:     body.estado || 'Novo',
      created_at: new Date().toISOString(),
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, lead: data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...updates } = body

  const { error } = await supabase
    .from('media_leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
