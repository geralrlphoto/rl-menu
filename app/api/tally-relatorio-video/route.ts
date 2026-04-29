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

    // Log do payload completo para debug
    console.log('Tally webhook payload:', JSON.stringify(body, null, 2))

    // Estrutura do Tally webhook:
    // body.data.fields = array de { key, label, type, value }
    // Hidden fields têm type === 'HIDDEN_FIELDS' e value é um objecto { chave: valor }
    const fields: { key?: string; label: string; type?: string; value: any }[] = body?.data?.fields ?? []

    // Extrair hidden fields (Tally agrupa-os num único entry com type HIDDEN_FIELDS)
    const hiddenEntry = fields.find(f => f.type === 'HIDDEN_FIELDS')
    const hiddenFields: Record<string, string> = {}
    if (hiddenEntry && typeof hiddenEntry.value === 'object' && !Array.isArray(hiddenEntry.value)) {
      for (const [k, v] of Object.entries(hiddenEntry.value as Record<string, any>)) {
        hiddenFields[k] = String(v ?? '')
      }
    }
    console.log('Hidden fields extraídos:', hiddenFields)

    // Helper: procura em hidden fields (case-insensitive)
    function getHidden(key: string): string {
      if (hiddenFields[key] !== undefined) return hiddenFields[key]
      const lk = key.toLowerCase()
      for (const [k, v] of Object.entries(hiddenFields)) {
        if (k.toLowerCase() === lk) return v
      }
      return ''
    }

    // Helper: procura nos campos normais por label
    function get(label: string): string {
      const f = fields.find(f =>
        f.type !== 'HIDDEN_FIELDS' &&
        f.label.toLowerCase().includes(label.toLowerCase())
      )
      if (!f) return ''
      if (Array.isArray(f.value)) return f.value.join(', ')
      return String(f.value ?? '')
    }

    // Referência e operador — primeiro tenta hidden fields, depois campos normais
    const referencia    = getHidden('referencia') || getHidden('referência') || getHidden('Referencia') || get('referencia') || get('referência') || ''
    const nome_operador = getHidden('Nome do Operador') || getHidden('nome_operador') || getHidden('Nome do operador') || get('operador') || get('nome') || ''

    console.log('referencia:', referencia, '| nome_operador:', nome_operador)

    // Guarda todos os campos normais em dados (jsonb)
    const dados: Record<string, any> = { ...hiddenFields }
    for (const f of fields) {
      if (f.type === 'HIDDEN_FIELDS') continue
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

    console.log('Relatório guardado com sucesso. referencia:', referencia)
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
