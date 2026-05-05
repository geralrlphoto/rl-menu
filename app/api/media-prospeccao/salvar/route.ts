import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { empresa, contacto, email, sector, distrito, website, faturacaoEstimada, analise } = body

  const { data, error } = await supabase
    .from('media_leads')
    .insert({
      nome:     contacto || 'Contacto por identificar',
      empresa:  empresa ?? '',
      email:    email ?? '',
      telefone: '',
      tipo:     'Prospeção — ' + (sector ?? ''),
      fonte:    'Agente IA',
      mensagem: `📍 ${distrito} | 🌐 ${website}\n💰 Faturação estimada: ${faturacaoEstimada}\n\n${analise}`,
      estado:   'Novo',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, lead: data })
}
