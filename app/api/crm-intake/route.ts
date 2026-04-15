import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  return NextResponse.json({ ok: true, version: 'v1', endpoint: 'crm-intake' })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const fields: any[] = body?.data?.fields ?? []

    const byKey = (key: string): string => {
      const f = fields.find((f: any) => f.key === key)
      if (!f || f.value === null || f.value === undefined) return ''
      const v = f.value
      if (Array.isArray(v)) {
        const opts: any[] = f.options ?? []
        if (opts.length > 0) {
          return v.map((id: string) => opts.find((o: any) => o.id === id)?.text ?? '').filter(Boolean).join(', ')
        }
        return v.join(', ')
      }
      return String(v).trim()
    }

    const nome = byKey('question_Vzr1dE')

    if (!nome) {
      return NextResponse.json({
        error: 'Nome em falta',
        fields_count: fields.length,
        keys: fields.map((f: any) => f.key),
      }, { status: 400 })
    }

    const preocupacoes = byKey('question_bWayz2')
    const convidados   = byKey('question_7NQzE9')
    const mensagem     = [preocupacoes, convidados ? `Convidados: ${convidados}` : ''].filter(Boolean).join('\n')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase.from('crm_contacts').insert({
      nome,
      email:           byKey('question_LP8y01'),
      contato:         byKey('question_KVXyo7'),
      data_casamento:  byKey('question_PzoBgd'),
      local_casamento: byKey('question_W84BqP'),
      como_chegou:     byKey('question_bWaGD6'),
      servicos:        byKey('question_a2WgzE'),
      tipo_cerimonia:  byKey('question_6ZqyPO'),
      tipo_evento:     byKey('question_ABk50y'),
      orcamento:       byKey('question_VJE41g'),
      mensagem,
      status:          'Por Contactar',
      lead_prioridade: 'Alta',
      data_entrada:    new Date().toISOString().slice(0, 10),
    })

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true, nome })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
