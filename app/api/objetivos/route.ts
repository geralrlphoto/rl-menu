import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const DEFAULT_OBJETIVOS = [
  { id: 'faturacao',  label: 'Faturação Anual', target: 80000, ano: 2026 },
  { id: 'casamentos', label: 'Casamentos',       target: 30,    ano: 2026 },
  { id: 'leads',      label: 'Leads Recebidas',  target: 120,   ano: 2026 },
]

export async function GET() {
  const supabase = db()
  const ANO      = 2026
  const anoStart = `${ANO}-01-01`
  const anoEnd   = `${ANO}-12-31`

  const [
    objetivosResult,
    pagamentosResult,
    leadsTotalResult,
    leadsFechadasResult,
  ] = await Promise.all([
    supabase.from('objetivos').select('*').eq('ano', ANO),

    supabase
      .from('pagamentos_noivos')
      .select('valor_liquidado, referencia')
      .gte('data_casamento', anoStart)
      .lte('data_casamento', anoEnd),

    supabase
      .from('crm_contacts')
      .select('*', { count: 'exact', head: true })
      .gte('data_entrada', anoStart)
      .lte('data_entrada', anoEnd),

    supabase
      .from('crm_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Fechou')
      .gte('data_entrada', anoStart)
      .lte('data_entrada', anoEnd),
  ])

  // Merge objetivos da BD com defaults
  const objetivosDB = objetivosResult.data ?? []
  const objetivos = DEFAULT_OBJETIVOS.map(def => {
    const found = objetivosDB.find((o: any) => o.id === def.id)
    return found ? { ...def, ...found } : def
  })

  // Dados reais
  const pagamentos     = pagamentosResult.data ?? []
  const faturacaoReal  = pagamentos.reduce((s, p) => s + (p.valor_liquidado ?? 0), 0)
  const casamentosReal = new Set(pagamentos.map(p => p.referencia).filter(Boolean)).size
  const leadsReal      = leadsTotalResult.count ?? 0
  const fechadasReal   = leadsFechadasResult.count ?? 0
  const conversaoReal  = leadsReal > 0 ? Math.round((fechadasReal / leadsReal) * 100) : 0
  const valorMedio     = casamentosReal > 0 ? Math.round(faturacaoReal / casamentosReal) : 0

  return NextResponse.json({
    objetivos,
    real: {
      faturacao:     faturacaoReal,
      casamentos:    casamentosReal,
      leads:         leadsReal,
      leadsFechadas: fechadasReal,
      conversao:     conversaoReal,
      valorMedio,
    },
  })
}

export async function PATCH(req: Request) {
  const { id, target, label, ano = 2026 } = await req.json()
  const supabase = db()

  const { error } = await supabase.from('objetivos').upsert({
    id,
    label,
    target,
    ano,
    updated_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
