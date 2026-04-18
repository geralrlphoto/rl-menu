import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Webhook Tally → Supabase eventos_2026/2027
 *
 * Cria um registo em eventos_2026 (ou 2027) sempre que o form Tally
 * "Mais Informações" é submetido, de forma independente da integração
 * Tally → Notion (que continua a funcionar em paralelo).
 *
 * Configurar no Tally:
 *   Form "Mais Informações" → Integrations → Add Webhook
 *   URL: https://rl-menu-lake.vercel.app/api/webhook-tally-evento
 */
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'webhook-tally-evento' })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const fields: any[] = body?.data?.fields ?? []

    const byKey = (key: string): string => {
      const f = fields.find((x: any) => x.key === key)
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

    // Mapping dos keys do form "Mais Informações" (mesmo que /api/crm-intake)
    const nome       = byKey('question_Vzr1dE')  // Nome
    const email      = byKey('question_LP8y01')  // Email
    const contato    = byKey('question_KVXyo7')  // Telefone
    const dataCas    = byKey('question_PzoBgd')  // Data do casamento
    const localCas   = byKey('question_W84BqP')  // Local
    const tipoCer    = byKey('question_6ZqyPO')  // Tipo cerimónia
    const tipoEv     = byKey('question_ABk50y')  // Tipo de evento
    const servicos   = byKey('question_a2WgzE')  // Serviços

    if (!nome) {
      return NextResponse.json({
        error: 'Nome em falta',
        fields_count: fields.length,
      }, { status: 400 })
    }

    // Escolher tabela conforme o ano da data
    const ano = dataCas ? parseInt(dataCas.slice(0, 4)) : 2026
    const TABLE_BY_YEAR: Record<number, string> = {
      2026: 'eventos_2026',
      // 2027: 'eventos_2027',
    }
    const table = TABLE_BY_YEAR[ano]
    if (!table) {
      return NextResponse.json({
        warning: `Ano ${ano} sem tabela no Supabase, registo ignorado`,
        ano,
      }, { status: 200 })
    }

    // Normalizar tipo_evento → array para colunas multi-select
    const tipoEventoArr: string[] = []
    if (tipoEv) tipoEv.split(',').map(s => s.trim()).filter(Boolean).forEach(t => tipoEventoArr.push(t.toUpperCase()))
    // Se não veio tipo_evento mas veio tipo_cerimonia, inferir CASAMENTO por defeito
    if (tipoEventoArr.length === 0) tipoEventoArr.push('CASAMENTO')

    const tipoServicoArr: string[] = []
    if (servicos) servicos.split(',').map(s => s.trim()).filter(Boolean).forEach(s => tipoServicoArr.push(s))

    // Gerar referência automática: CAS_NNN_YY_RL
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { count } = await supabase.from(table).select('*', { count: 'exact', head: true })
    const proximoNum = String((count ?? 0) + 1).padStart(3, '0')
    const anoSufixo = String(ano).slice(2)
    const referencia = `CAS_${proximoNum}_${anoSufixo}_RL`

    const row: any = {
      referencia,
      cliente: nome,
      data_evento: dataCas || null,
      local: localCas || '',
      status: 'Não iniciada',
      fotos_enviadas: false,
      tipo_evento: JSON.stringify(tipoEventoArr),
      tipo_servico: tipoServicoArr.length ? tipoServicoArr : null,
      fotografo: JSON.stringify([]),
      valor_foto: null,
      valor_liquido: null,
    }

    const { data, error } = await supabase.from(table).insert(row).select().single()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      id: data.id,
      referencia,
      cliente: nome,
      data_evento: dataCas,
      table,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
