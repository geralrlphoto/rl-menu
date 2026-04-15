import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Resolve IDs para texto usando o array de options do campo
function resolveOptions(field: any): string {
  if (!field) return ''
  const values: string[] = Array.isArray(field.value) ? field.value : [field.value].filter(Boolean)
  if (!values.length) return ''
  const options: any[] = field.options ?? []
  if (options.length > 0) {
    return values
      .map(id => options.find(o => o.id === id)?.text ?? id)
      .filter(Boolean)
      .join(', ')
  }
  return values.join(', ')
}

// Procura campo pelo label (ignora espaços e capitalização)
function findField(fields: any[], ...labels: string[]): any {
  for (const label of labels) {
    const f = fields.find(f => f.label?.toLowerCase().trim() === label.toLowerCase().trim())
    if (f) return f
    // Fallback: label começa com o prefixo
    const fp = fields.find(f => f.label?.toLowerCase().trim().startsWith(label.toLowerCase().trim()))
    if (fp) return fp
  }
  return null
}

function getText(fields: any[], ...labels: string[]): string {
  const f = findField(fields, ...labels)
  if (!f) return ''
  const v = f.value
  if (v === null || v === undefined) return ''
  if (Array.isArray(v)) {
    // Se tem options, resolve IDs → texto
    if (f.options?.length) return resolveOptions(f)
    return v.join(', ')
  }
  return String(v).trim()
}

function getOptions(fields: any[], ...labels: string[]): string {
  const f = findField(fields, ...labels)
  if (!f) return ''
  return resolveOptions(f)
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
      nome:            getText(fields, 'Nome dos Noivos/as (nome dos pais - batizado)', 'Nome dos Noivos/as', 'Nome dos Noivos', 'Nome'),
      email:           getText(fields, 'E-mail', 'Email'),
      contato:         getText(fields, 'Contato', 'Contacto', 'Telefone'),
      data_casamento:  getText(fields, 'Data do evento', 'Data do Casamento'),
      local_casamento: getText(fields, 'Local do evento (cerimonia + quinta)', 'Local do evento', 'Local do Casamento', 'Local'),
      como_chegou:     getOptions(fields, 'Como chegou até nós?', 'Como chegou até nos?', 'Como Chegou'),
      servicos:        getOptions(fields, 'Serviços que gostariam de ter no vosso Casamento', 'Serviços desejados', 'Serviços'),
      tipo_cerimonia:  getOptions(fields, 'Tipo de cerimónia', 'Tipo de Cerimónia'),
      tipo_evento:     getOptions(fields, 'Tipo de Evento?', 'Tipo de Evento'),
      orcamento:       getText(fields, 'Qual o vosso orçamento para o serviço (sensivelmente)?', 'Orçamento'),
      mensagem: [
        getText(fields, 'Alguma preocupação ou algo que não gostam em foto/vídeo?', 'Preocupações foto/vídeo'),
        getText(fields, 'Número de Convidados (sensivelmente)', 'Número de Convidados')
          ? `Convidados: ${getText(fields, 'Número de Convidados (sensivelmente)', 'Número de Convidados')}`
          : ''
      ].filter(Boolean).join('\n'),
      status:          'Por Contactar',
      lead_prioridade: 'Alta',
      data_entrada:    today,
    }

    if (!record.nome) {
      console.error('[tally-webhook] Nome em falta. Labels:', fields.map(f => f.label))
      return NextResponse.json({ error: 'Nome em falta', labels: fields.map(f => f.label) }, { status: 400 })
    }

    const { error } = await supabase.from('crm_contacts').insert(record)
    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true, nome: record.nome })
  } catch (err: any) {
    console.error('[tally-webhook] Erro:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
