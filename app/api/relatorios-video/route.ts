import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/relatorios-video?referencia=CAS_036_26_RL
export async function GET(req: NextRequest) {
  const referencia = req.nextUrl.searchParams.get('referencia')

  if (!referencia) {
    return NextResponse.json({ relatorios: [] })
  }

  const { data, error } = await supabase
    .from('relatorios_video')
    .select('*')
    .eq('referencia', referencia)
    .order('criado_em', { ascending: false })

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ relatorios: [], error: error.message }, { status: 500 })
  }

  return NextResponse.json({ relatorios: data ?? [] })
}

// POST /api/relatorios-video — submissão do formulário in-site
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { referencia, nome_operador, dados } = body

  if (!referencia) {
    return NextResponse.json({ error: 'referencia obrigatória' }, { status: 400 })
  }

  const { error } = await supabase.from('relatorios_video').insert({
    referencia,
    nome_operador: nome_operador || null,
    dados: dados ?? {},
  })

  if (error) {
    console.error('Supabase error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
