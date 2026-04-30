import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const ALBUNS_DB   = '306220116d8a808e9fc0d77766504e52'
const EVENTOS_DB  = '1ad220116d8a804b839ddc36f1e7ecf1'
const notionH = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
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
    portaisResult,
    eventosRes,
    albumsRes,
  ] = await Promise.all([
    supabase.from('objetivos').select('*').eq('ano', ANO),

    supabase
      .from('pagamentos_noivos')
      .select('valor_liquidado, referencia, fase_pagamento, data_pagamento')
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

    // Portais com referência 2026
    supabase
      .from('portais')
      .select('referencia')
      .ilike('referencia', '%_26_%'),

    // Notion — eventos 2026
    fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
      method: 'POST', headers: notionH, cache: 'no-store',
      body: JSON.stringify({
        filter: { and: [
          { property: 'DATA DO EVENTO', date: { on_or_after: anoStart } },
          { property: 'DATA DO EVENTO', date: { on_or_before: anoEnd } },
        ]},
        sorts: [{ property: 'DATA DO EVENTO', direction: 'ascending' }],
        page_size: 100,
      }),
    }).then(r => r.json()).catch(() => ({ results: [] })),

    // Notion — todos os álbuns
    fetch(`https://api.notion.com/v1/databases/${ALBUNS_DB}/query`, {
      method: 'POST', headers: notionH, cache: 'no-store',
      body: JSON.stringify({ page_size: 100 }),
    }).then(r => r.json()).catch(() => ({ results: [] })),
  ])

  /* ── Objetivos (com defaults) ──────────────────────────────────────────── */
  const objetivosDB = objetivosResult.data ?? []
  const objetivos   = DEFAULT_OBJETIVOS.map(def => {
    const found = objetivosDB.find((o: any) => o.id === def.id)
    return found ? { ...def, ...found } : def
  })

  /* ── Pagamentos ────────────────────────────────────────────────────────── */
  const pagamentos    = pagamentosResult.data ?? []
  const faturacaoReal = pagamentos.reduce((s, p) => s + (p.valor_liquidado ?? 0), 0)
  const refsUnicas    = new Set(pagamentos.map(p => p.referencia).filter(Boolean))

  // Breakdown por fase
  const porFase: Record<string, number> = {}
  for (const p of pagamentos) {
    const fase = (p.fase_pagamento ?? 'OUTRO').toUpperCase()
    // Normalizar nome da fase
    const key = fase.includes('ADJ') ? 'ADJUDICAÇÃO'
              : fase.includes('REFOR') ? 'REFORÇO'
              : fase.includes('FINAL') ? 'FINAL'
              : 'OUTRO'
    porFase[key] = (porFase[key] ?? 0) + (p.valor_liquidado ?? 0)
  }

  /* ── Leads / CRM ───────────────────────────────────────────────────────── */
  const leadsTotal    = leadsTotalResult.count  ?? 0
  const leadsFechadas = leadsFechadasResult.count ?? 0
  const conversao     = leadsTotal > 0 ? Math.round((leadsFechadas / leadsTotal) * 100) : 0

  /* ── Portais 2026 ──────────────────────────────────────────────────────── */
  const portaisCount = portaisResult.data?.length ?? 0

  /* ── Notion: Eventos 2026 ──────────────────────────────────────────────── */
  const eventos2026    = eventosRes.results ?? []
  const eventosTotal   = eventos2026.length
  const videosEntregues = eventos2026.filter((e: any) =>
    e.properties?.['ESTADO DO VIDEO']?.select?.name === 'ENTREGUE'
  ).length
  const videosPendentes = eventosTotal - videosEntregues

  /* ── Notion: Álbuns ────────────────────────────────────────────────────── */
  const todosAlbuns     = albumsRes.results ?? []
  const albumsTotal     = todosAlbuns.length
  const albumsEntregues = todosAlbuns.filter((a: any) =>
    a.properties?.['Status']?.status?.name === 'Entregue'
  ).length
  const albumsPendentes = albumsTotal - albumsEntregues

  /* ── Casamentos real: prioridade → portais → eventos Notion → pagamentos ─ */
  const casamentosReal = portaisCount > 0
    ? portaisCount
    : eventosTotal > 0
    ? eventosTotal
    : refsUnicas.size

  const valorMedio = refsUnicas.size > 0
    ? Math.round(faturacaoReal / refsUnicas.size)
    : 0

  return NextResponse.json({
    objetivos,
    real: {
      faturacao:            faturacaoReal,
      casamentos:           casamentosReal,
      leads:                leadsTotal,
      leadsFechadas,
      conversao,
      valorMedio,
      porFase,
      videosEntregues,
      videosPendentes,
      eventosTotal,
      albumsEntregues,
      albumsPendentes,
      albumsTotal,
      portaisCount,
      casamentosComPagamento: refsUnicas.size,
    },
  })
}

export async function PATCH(req: Request) {
  const { id, target, label, ano = 2026 } = await req.json()
  const supabase = db()

  const { error } = await supabase.from('objetivos').upsert({
    id, label, target, ano,
    updated_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
