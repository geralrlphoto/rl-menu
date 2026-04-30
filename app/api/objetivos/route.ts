import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const ALBUNS_DB  = '306220116d8a808e9fc0d77766504e52'
const EVENTOS_DB = '1ad220116d8a804b839ddc36f1e7ecf1'

function notionHeaders() {
  return {
    'Authorization': `Bearer ${process.env.NOTION_TOKEN}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  }
}

async function notionQuery(dbId: string, body: object) {
  try {
    const r = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
      method: 'POST',
      headers: notionHeaders() as Record<string, string>,
      body: JSON.stringify(body),
      cache: 'no-store',
    })
    if (!r.ok) return []
    const d = await r.json()
    return d.results ?? []
  } catch {
    return []
  }
}

const DEFAULT_OBJETIVOS = [
  { id: 'faturacao',  label: 'Faturação Anual', target: 80000, ano: 2026 },
  { id: 'casamentos', label: 'Casamentos',       target: 30,    ano: 2026 },
  { id: 'leads',      label: 'Leads Recebidas',  target: 120,   ano: 2026 },
]

export async function GET() {
  try {
    const supabase = db()
    const ANO      = 2026
    const anoStart = `${ANO}-01-01`
    const anoEnd   = `${ANO}-12-31`

    /* ── Supabase (paralelo) ─────────────────────────────────────────────── */
    const [
      objetivosResult,
      pagamentosResult,
      leadsTotalResult,
      leadsFechadasResult,
      portaisResult,
    ] = await Promise.all([
      supabase.from('objetivos').select('*').eq('ano', ANO),

      supabase
        .from('pagamentos_noivos')
        .select('valor_liquidado, referencia, fase_pagamento')
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

      supabase
        .from('portais')
        .select('referencia')
        .ilike('referencia', '%_26_%'),
    ])

    /* ── Notion (separado para não crashar se falhar) ────────────────────── */
    const [eventos2026, todosAlbuns] = await Promise.all([
      notionQuery(EVENTOS_DB, {
        filter: { and: [
          { property: 'DATA DO EVENTO', date: { on_or_after:  anoStart } },
          { property: 'DATA DO EVENTO', date: { on_or_before: anoEnd   } },
        ]},
        page_size: 100,
      }),
      notionQuery(ALBUNS_DB, { page_size: 100 }),
    ])

    /* ── Objetivos com defaults ──────────────────────────────────────────── */
    const objetivosDB = objetivosResult.data ?? []
    const objetivos   = DEFAULT_OBJETIVOS.map(def => {
      const found = objetivosDB.find((o: any) => o.id === def.id)
      return found ? { ...def, target: Number(found.target) } : def
    })

    /* ── Pagamentos ──────────────────────────────────────────────────────── */
    const pagamentos    = pagamentosResult.data ?? []
    const faturacaoReal = pagamentos.reduce((s, p) => s + Number(p.valor_liquidado ?? 0), 0)
    const refsUnicas    = new Set(pagamentos.map(p => p.referencia).filter(Boolean))

    const porFase: Record<string, number> = {}
    for (const p of pagamentos) {
      const f = (p.fase_pagamento ?? '').toUpperCase()
      const key = f.includes('ADJ') ? 'ADJUDICAÇÃO'
                : f.includes('REFOR') ? 'REFORÇO'
                : f.includes('FINAL') ? 'FINAL'
                : 'OUTRO'
      porFase[key] = (porFase[key] ?? 0) + Number(p.valor_liquidado ?? 0)
    }

    /* ── Leads ───────────────────────────────────────────────────────────── */
    const leadsTotal    = leadsTotalResult.count    ?? 0
    const leadsFechadas = leadsFechadasResult.count ?? 0
    const conversao     = leadsTotal > 0 ? Math.round((leadsFechadas / leadsTotal) * 100) : 0

    /* ── Portais 2026 ────────────────────────────────────────────────────── */
    const portaisCount = portaisResult.data?.length ?? 0

    /* ── Notion: Eventos ─────────────────────────────────────────────────── */
    const eventosTotal    = eventos2026.length
    const videosEntregues = eventos2026.filter((e: any) =>
      e.properties?.['ESTADO DO VIDEO']?.select?.name === 'ENTREGUE'
    ).length

    /* ── Notion: Álbuns ──────────────────────────────────────────────────── */
    const albumsTotal     = todosAlbuns.length
    const albumsEntregues = todosAlbuns.filter((a: any) =>
      a.properties?.['Status']?.status?.name === 'Entregue'
    ).length

    /* ── Casamentos real ─────────────────────────────────────────────────── */
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
        faturacao:              faturacaoReal,
        casamentos:             casamentosReal,
        leads:                  leadsTotal,
        leadsFechadas,
        conversao,
        valorMedio,
        porFase,
        videosEntregues,
        videosPendentes:        eventosTotal - videosEntregues,
        eventosTotal,
        albumsEntregues,
        albumsPendentes:        albumsTotal - albumsEntregues,
        albumsTotal,
        portaisCount,
        casamentosComPagamento: refsUnicas.size,
      },
    })
  } catch (err: any) {
    console.error('[objetivos GET]', err)
    return NextResponse.json({ error: err?.message ?? 'erro interno', objetivos: DEFAULT_OBJETIVOS, real: null }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, target, label, ano = 2026 } = await req.json()
    const supabase = db()
    const { error } = await supabase.from('objetivos').upsert({
      id, label, target: Number(target), ano,
      updated_at: new Date().toISOString(),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'erro' }, { status: 500 })
  }
}
