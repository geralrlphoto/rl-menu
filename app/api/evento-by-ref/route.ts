import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const EVENTOS_DB   = '1ad220116d8a804b839ddc36f1e7ecf1'
const notionH = {
  'Authorization': `Bearer ${NOTION_TOKEN}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
}

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

// Cache em memória por referência — esta rota é chamada em CADA visita de
// portal (e pelo sino admin) e faz 1 query Notion + até 3 leituras Supabase.
// Cachear 90s colapsa as visitas repetidas do mesmo evento sem prejudicar a
// frescura (estados do evento aparecem no portal com <90s de atraso).
declare global {
  // eslint-disable-next-line no-var
  var eventoByRefCache: Map<string, { ts: number; body: any }> | undefined
}
if (!global.eventoByRefCache) global.eventoByRefCache = new Map()
const evCache = global.eventoByRefCache
const EV_TTL = 90_000
const EV_HEADERS = { 'Cache-Control': 'private, max-age=90, stale-while-revalidate=180' }

// Fallback Supabase: usado quando Notion não encontra (eventos criados via
// /contrato-cps onde a página Notion não foi criada) ou quando se quiser
// suplementar dados em falta no Notion.
async function loadFromSupabase(ref: string) {
  const sb = supabase()
  // 1. eventos_YYYY (campos principais + serviços)
  let eventoRow: any = null
  for (const t of ['eventos_2026', 'eventos_2027']) {
    const { data } = await sb.from(t).select('*').eq('referencia', ref).maybeSingle()
    if (data) { eventoRow = data; break }
  }
  if (!eventoRow) return null

  // 2. dados_contrato_cps (dados dos noivos/pais detalhados)
  const { data: cps } = await sb
    .from('dados_contrato_cps')
    .select('*')
    .eq('referencia_evento', ref)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    id:           eventoRow.notion_id ?? eventoRow.id,
    referencia:   eventoRow.referencia ?? '',
    cliente:      eventoRow.cliente ?? cps?.nome_noivos ?? '',
    data_evento:  eventoRow.data_evento ?? cps?.data_casamento ?? null,
    local:        eventoRow.local ?? cps?.local_cerimonia ?? '',
    proposta:     cps?.proposta ?? null,
    servico_foto: eventoRow.servico_foto ?? [],
    servico_video:eventoRow.servico_video ?? [],
    valor_foto:   eventoRow.valor_foto ?? null,
    valor_video:  eventoRow.valor_video ?? null,
    valor_liquido:eventoRow.valor_liquido ?? null,
    nome_noiva:   cps?.nome_noiva ?? null,
    email_noiva:  cps?.email_noiva ?? null,
    nome_noivo:   cps?.nome_noivo ?? null,
    nome_crianca: eventoRow.nome_crianca ?? cps?.nome_crianca ?? null,
    idade_crianca:eventoRow.idade_crianca ?? cps?.idade_crianca ?? null,
    sel_fotos_estado:    eventoRow.sel_fotos_estado ?? null,
    video_estado:        eventoRow.video_estado ?? null,
    fotos_edicao_estado: eventoRow.fotos_edicao_estado ?? null,
    album_estado:        eventoRow.album_estado ?? null,
    data_entrega:        null,
  }
}

function getProp(props: any, key: string, type: string): any {
  const p = props[key]; if (!p) return null
  try {
    if (type === 'title')        return p.title?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'text')         return p.rich_text?.map((t: any) => t.plain_text).join('') ?? ''
    if (type === 'email')        return p.email ?? null
    if (type === 'select')       return p.select?.name ?? null
    if (type === 'multi_select') return p.multi_select?.map((s: any) => s.name) ?? []
    if (type === 'number')       return p.number ?? p.formula?.number ?? null
    if (type === 'date')         return p.date?.start ?? null
  } catch { return null }
  return null
}

export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })

  // 0. Cache em memória (90s) — evita repetir Notion + Supabase por visita.
  const hit = evCache.get(ref)
  if (hit && Date.now() - hit.ts < EV_TTL) {
    return NextResponse.json(hit.body, { headers: EV_HEADERS })
  }

  // 1. Tenta Notion
  let notionEvento: any = null
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${EVENTOS_DB}/query`, {
      method: 'POST', headers: notionH, cache: 'no-store',
      body: JSON.stringify({
        filter: { property: 'REFERÊNCIA DO EVENTO', title: { equals: ref } },
        page_size: 1,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      const page = data.results?.[0]
      if (page) {
        const p = page.properties ?? {}
        notionEvento = {
          id:           page.id,
          referencia:   getProp(p, 'REFERÊNCIA DO EVENTO', 'title'),
          cliente:      getProp(p, 'CLIENTE', 'text'),
          data_evento:  getProp(p, 'DATA DO EVENTO', 'date'),
          local:        getProp(p, 'LOCAL', 'text'),
          proposta:     getProp(p, 'PROPOSTA ESCOLHIDA', 'select'),
          servico_foto: getProp(p, 'serviço de fotografia', 'multi_select'),
          servico_video:getProp(p, 'serviço de video', 'multi_select'),
          valor_foto:   getProp(p, 'VALOR SERVIÇO FOTO', 'number'),
          valor_video:  getProp(p, 'VALOR DO SERVIÇO VÍDEO', 'number'),
          valor_liquido:getProp(p, 'VALOR LIQUIDO A RECEBER', 'number'),
          nome_noiva:        getProp(p, 'Nome da Noiva', 'text'),
          email_noiva:       getProp(p, 'E-mail da noiva', 'email'),
          nome_noivo:        getProp(p, 'nome do noivo', 'text'),
          sel_fotos_estado:  getProp(p, 'ESTADO SEL. FOTOS', 'select'),
          video_estado:      getProp(p, 'ESTADO DO VIDEO', 'select'),
          fotos_edicao_estado: getProp(p, 'FOTOS P/ EDIÇÃO', 'select'),
          album_estado:      getProp(p, 'ESTADO ÁLBUM', 'select'),
          data_entrega:      getProp(p, 'DATA FINAL ENTREGA FOTOS', 'date'),
        }
      }
    }
  } catch (e) {
    console.warn('[evento-by-ref] Notion query failed:', e)
  }

  // 2. Carrega de Supabase (sempre — para suplementar campos em falta)
  const sbEvento = await loadFromSupabase(ref)

  // 3-4. Monta o body (merge Notion + Supabase) e cacheia 90s.
  let body: any
  if (!notionEvento && !sbEvento) {
    body = { found: false }
  } else {
    const evento = notionEvento ?? sbEvento
    if (notionEvento && sbEvento) {
      // Sobrescreve campos vazios do Notion com dados Supabase
      for (const k of Object.keys(sbEvento) as (keyof typeof sbEvento)[]) {
        const v = (notionEvento as any)[k]
        const isEmpty = v == null || v === '' || (Array.isArray(v) && v.length === 0)
        if (isEmpty) (notionEvento as any)[k] = (sbEvento as any)[k]
      }
    }
    body = { found: true, evento }
  }

  evCache.set(ref, { ts: Date.now(), body })
  return NextResponse.json(body, { headers: EV_HEADERS })
}
