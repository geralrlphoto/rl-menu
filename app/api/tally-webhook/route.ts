import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Mapa fixo: field key do Tally → campo interno
// Keys são estáveis e nunca mudam para o mesmo formulário
const KEY_MAP: Record<string, string> = {
  question_Vzr1dE: 'nome',
  question_PzoBgd: 'data_casamento',
  question_W84BqP: 'local_casamento',
  question_KVXyo7: 'contato',
  question_LP8y01: 'email',
  question_bWaGD6: 'como_chegou',
  question_a2WgzE: 'servicos',
  question_6ZqyPO: 'tipo_cerimonia',
  question_ABk50y: 'tipo_evento',
  question_7NQzE9: '_convidados',
  question_VJE41g: 'orcamento',
  question_bWayz2: '_preocupacoes',
}

// Resolve valores: se tem options, converte IDs → texto
function resolveValue(field: any): string {
  const v = field.value
  if (v === null || v === undefined || v === false) return ''
  if (typeof v === 'string') return v.trim()
  if (typeof v === 'number') return String(v)
  if (Array.isArray(v)) {
    if (v.length === 0) return ''
    const opts: any[] = field.options ?? []
    if (opts.length > 0) {
      return v.map(id => opts.find(o => o.id === id)?.text ?? id).filter(Boolean).join(', ')
    }
    return v.join(', ')
  }
  return ''
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const fields: any[] = body?.data?.fields ?? []

    if (!fields.length) {
      return NextResponse.json({ error: 'Sem campos' }, { status: 400 })
    }

    const today = new Date().toISOString().slice(0, 10)
    const record: Record<string, string> = {
      status:          'Por Contactar',
      lead_prioridade: 'Alta',
      data_entrada:    today,
    }

    for (const field of fields) {
      const dest = KEY_MAP[field.key]
      if (!dest) continue
      const val = resolveValue(field)
      if (val) record[dest] = val
    }

    // Montar mensagem com preocupações + convidados
    const partes = []
    if (record._preocupacoes) partes.push(record._preocupacoes)
    if (record._convidados)   partes.push(`Convidados: ${record._convidados}`)
    if (partes.length) record.mensagem = partes.join('\n')
    delete record._preocupacoes
    delete record._convidados

    if (!record.nome) {
      return NextResponse.json({
        error: 'Nome em falta',
        keys_recebidos: fields.map(f => f.key),
      }, { status: 400 })
    }

    const { error } = await supabase.from('crm_contacts').insert(record)
    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, nome: record.nome })
  } catch (err: any) {
    console.error('[tally-webhook] Erro:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
