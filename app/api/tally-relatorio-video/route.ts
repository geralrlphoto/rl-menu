import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Tally envia um POST com Content-Type: application/json
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Estrutura do Tally webhook:
    // body.data.fields = array de { label, value }
    const fields: { label: string; value: any }[] = body?.data?.fields ?? []

    // Helper para extrair valor por label
    function get(label: string): string {
      const f = fields.find(f =>
        f.label.toLowerCase().includes(label.toLowerCase())
      )
      if (!f) return ''
      if (Array.isArray(f.value)) return f.value.join(', ')
      return String(f.value ?? '')
    }

    const referencia    = get('referencia') || get('referência') || ''
    const nome_operador = get('operador') || get('nome') || ''

    // Guarda tudo em dados (jsonb) para não perder nenhuma resposta
    const dados: Record<string, any> = {}
    for (const f of fields) {
      dados[f.label] = Array.isArray(f.value) ? f.value.join(', ') : f.value
    }

    const { error } = await supabase.from('relatorios_video').insert({
      referencia:    referencia || null,
      nome_operador: nome_operador || null,
      dados,
    })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

// GET para testar se a route está viva
export async function GET() {
  return NextResponse.json({ status: 'Tally webhook activo ✓' })
}
