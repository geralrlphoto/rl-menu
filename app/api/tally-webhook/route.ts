import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper: find a field value by label from Tally's fields array
function getField(fields: any[], label: string): string {
  const f = fields.find(f => f.label?.toLowerCase().trim() === label.toLowerCase().trim())
  if (!f) return ''
  const v = f.value
  if (Array.isArray(v)) return v.join(', ')
  return v?.toString() ?? ''
}

function getFieldOptions(fields: any[], label: string): string {
  const f = fields.find(f => f.label?.toLowerCase().trim() === label.toLowerCase().trim())
  if (!f) return ''
  const v = f.value
  // Tally checkboxes return array of option labels
  if (Array.isArray(v)) return v.join(', ')
  if (typeof v === 'string') return v
  return ''
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Tally sends: { eventType: "FORM_RESPONSE", data: { fields: [...] } }
    const fields: any[] = body?.data?.fields ?? []

    if (!fields.length) {
      return NextResponse.json({ error: 'Sem campos' }, { status: 400 })
    }

    const today = new Date().toISOString().slice(0, 10)

    const record = {
      nome:           getField(fields, 'Nome dos Noivos/as'),
      email:          getField(fields, 'E-mail'),
      contato:        getField(fields, 'Contato'),
      data_casamento: getField(fields, 'Data do evento'),
      local_casamento:getField(fields, 'Local do evento'),
      como_chegou:    getFieldOptions(fields, 'Como chegou até nós?'),
      servicos:       getFieldOptions(fields, 'Serviços desejados'),
      tipo_cerimonia: getFieldOptions(fields, 'Tipo de cerimónia'),
      tipo_evento:    getFieldOptions(fields, 'Tipo de Evento'),
      orcamento:      getField(fields, 'Orçamento'),
      mensagem:       [
                        getField(fields, 'Preocupações foto/vídeo'),
                        getField(fields, 'Número de Convidados') ? `Convidados: ${getField(fields, 'Número de Convidados')}` : ''
                      ].filter(Boolean).join('\n'),
      status:         'Por Contactar',
      lead_prioridade:'Alta',
      data_entrada:   today,
    }

    if (!record.nome) {
      return NextResponse.json({ error: 'Nome em falta' }, { status: 400 })
    }

    const { error } = await supabase
      .from('crm_contacts')
      .insert(record)

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, message: 'Lead criada com sucesso' })
  } catch (err: any) {
    console.error('Tally webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
