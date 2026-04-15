import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Procura campo por label — tenta várias variantes
function getField(fields: any[], ...labels: string[]): string {
  for (const label of labels) {
    const f = fields.find(f => f.label?.toLowerCase().trim() === label.toLowerCase().trim())
    if (f && f.value !== null && f.value !== undefined) {
      const v = f.value
      if (Array.isArray(v)) return v.join(', ')
      const s = v?.toString().trim() ?? ''
      if (s) return s
    }
  }
  return ''
}

// Procura campo cujo label começa por algum dos prefixos fornecidos
function getFieldStartsWith(fields: any[], ...prefixes: string[]): string {
  for (const prefix of prefixes) {
    const f = fields.find(f => f.label?.toLowerCase().trim().startsWith(prefix.toLowerCase().trim()))
    if (f && f.value !== null && f.value !== undefined) {
      const v = f.value
      if (Array.isArray(v)) return v.join(', ')
      const s = v?.toString().trim() ?? ''
      if (s) return s
    }
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

    const record = {
      // Nome — label completo ou prefixo
      nome: getField(fields,
        'Nome dos Noivos/as (nome dos pais - batizado)',
        'Nome dos Noivos/as',
        'Nome dos Noivos',
        'Nome'
      ),
      email: getField(fields, 'E-mail', 'Email'),
      contato: getField(fields, 'Contato', 'Contacto', 'Telefone'),
      data_casamento: getField(fields, 'Data do evento', 'Data do Casamento', 'Data do casamento'),
      // Local — label completo ou prefixo
      local_casamento: getField(fields,
        'Local do evento (cerimonia + quinta)',
        'Local do evento',
        'Local do Casamento',
        'Local'
      ),
      como_chegou: getField(fields, 'Como chegou até nós?', 'Como chegou até nos?', 'Como Chegou'),
      // Serviços — label completo ou prefixo
      servicos: getFieldStartsWith(fields,
        'Serviços que gostariam de ter',
        'Serviços desejados',
        'Serviços'
      ),
      tipo_cerimonia: getField(fields, 'Tipo de cerimónia', 'Tipo de Cerimónia', 'Tipo de cerimonia'),
      // Tipo de Evento — com ou sem ?
      tipo_evento: getField(fields, 'Tipo de Evento?', 'Tipo de Evento', 'Tipo de evento'),
      // Orçamento — label completo ou prefixo
      orcamento: getFieldStartsWith(fields,
        'Qual o vosso orçamento',
        'Orçamento',
        'Orcamento'
      ),
      mensagem: [
        getFieldStartsWith(fields, 'Alguma preocupação', 'Preocupações foto/vídeo', 'Preocupacoes'),
        getField(fields, 'Número de Convidados (sensivelmente)', 'Número de Convidados')
          ? `Convidados: ${getField(fields, 'Número de Convidados (sensivelmente)', 'Número de Convidados')}`
          : ''
      ].filter(Boolean).join('\n'),
      status:         'Por Contactar',
      lead_prioridade:'Alta',
      data_entrada:   today,
    }

    if (!record.nome) {
      // Log para debug — mostra os labels recebidos
      console.error('[tally-webhook] Nome em falta. Labels recebidos:', fields.map(f => f.label))
      return NextResponse.json({ error: 'Nome em falta', labels: fields.map(f => f.label) }, { status: 400 })
    }

    const { error } = await supabase
      .from('crm_contacts')
      .insert(record)

    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, message: 'Lead criada com sucesso', nome: record.nome })
  } catch (err: any) {
    console.error('Tally webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
