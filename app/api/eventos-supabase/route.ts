import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const NOTION_TOKEN = process.env.NOTION_TOKEN

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const NOTION_DB_BY_YEAR: Record<number, string> = {
  2025: '198220116d8a8020ae0ef315dea8e1af',
  2026: '1ad220116d8a804b839ddc36f1e7ecf1',
  2027: 'a9c8db8c0a6141ee839c1d0e5ad97915',
}

function getProp(props: any, key: string, type: string): any {
  const p = props[key]
  if (!p) return null
  try {
    if (type === 'title') return p.title?.map((t: any) => t.plain_text).join('') || null
    if (type === 'text') return p.rich_text?.map((t: any) => t.plain_text).join('') || null
    if (type === 'date') return p.date?.start ?? null
    if (type === 'status') return p.status?.name ?? null
    if (type === 'select') return p.select?.name ?? null
    if (type === 'multi_select') return p.multi_select?.map((s: any) => s.name) ?? []
    if (type === 'number') return p.number ?? p.formula?.number ?? null
    if (type === 'checkbox') return p.checkbox ?? false
  } catch { return null }
  return null
}

// Notion = fonte de verdade. Carrega todas as páginas da DB do ano e
// devolve um mapa notion_id → { campos-chave }.
async function fetchNotionEventsMap(ano: number): Promise<Map<string, any>> {
  const m = new Map<string, any>()
  const DB = NOTION_DB_BY_YEAR[ano]
  if (!DB || !NOTION_TOKEN) return m
  try {
    const allPages: any[] = []
    let cursor: string | null = null
    do {
      const body: any = { page_size: 100 }
      if (cursor) body.start_cursor = cursor
      const r = await fetch(`https://api.notion.com/v1/databases/${DB}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      })
      if (!r.ok) break
      const d = await r.json()
      allPages.push(...(d.results ?? []))
      cursor = d.has_more ? d.next_cursor : null
    } while (cursor)
    for (const page of allPages) {
      const p = page.properties ?? {}
      m.set(page.id, {
        referencia:   getProp(p, 'REFERÊNCIA DO EVENTO', 'title') ?? '',
        cliente:      getProp(p, 'CLIENTE', 'text') ?? '',
        local:        getProp(p, 'LOCAL', 'text') ?? '',
        data_evento:  getProp(p, 'DATA DO EVENTO', 'date'),
        status:       getProp(p, 'Status', 'status') ?? null,
        tipo_evento:  getProp(p, 'TIPO DE EVENTO', 'multi_select') ?? [],
        tipo_servico: getProp(p, 'TIPO DE SERVIÇO', 'multi_select') ?? [],
        fotografo:    getProp(p, 'FOTOGRAFO', 'multi_select') ?? [],
        videografo:   getProp(p, 'VÍDEOGRAFO ', 'multi_select') ?? [],
        editor_fotos: getProp(p, 'EDITOR DE FOTOS', 'select'),
        valor_foto:   getProp(p, 'VALOR SERVIÇO FOTO', 'number'),
        valor_liquido:getProp(p, 'VALOR LIQUIDO A RECEBER', 'number'),
      })
    }
  } catch (err) {
    console.warn('[eventos-supabase] Notion fetch failed:', (err as any)?.message)
  }
  return m
}

export async function GET(req: NextRequest) {
  try {
    const anoParam = req.nextUrl.searchParams.get('ano')
    const ano = anoParam ? parseInt(anoParam) : 2026

    // Carrega em paralelo:
    //   Supabase eventos_2026 (cache de campos do Notion)
    //   Notion (source of truth de campos do calendário)
    //   evento_equipa (fonte autoritativa para fotografo/videografo)
    const [supabaseRes, notionMap, equipaRes] = await Promise.all([
      supabase
        .from('eventos_2026')
        .select('*')
        .gte('data_evento', `${ano}-01-01`)
        .lte('data_evento', `${ano}-12-31`)
        .order('data_evento', { ascending: true }),
      fetchNotionEventsMap(ano),
      supabase
        .from('evento_equipa')
        .select('evento_id, referencia, fotografo, videografo, editor_fotos'),
    ])
    if (supabaseRes.error) {
      return NextResponse.json({ error: supabaseRes.error.message }, { status: 500 })
    }
    // Mapa evento_id/referencia → equipa
    const equipaByEvento = new Map<string, any>()
    const equipaByRef = new Map<string, any>()
    ;(equipaRes.data ?? []).forEach((row: any) => {
      if (row.evento_id)  equipaByEvento.set(row.evento_id, row)
      if (row.referencia) equipaByRef.set(row.referencia.toUpperCase(), row)
    })

    // Lista de mismatches para sincronizar Supabase em background
    const mismatches: Array<{ id: string; updates: Record<string, any> }> = []

    const parseArr = (v: any): string[] => {
      if (Array.isArray(v)) return v
      if (typeof v === 'string') {
        const s = v.trim()
        if (!s) return []
        if (s.startsWith('[')) {
          try { const p = JSON.parse(s); return Array.isArray(p) ? p : [] } catch { return [s] }
        }
        return s.split(',').map(x => x.trim()).filter(Boolean)
      }
      return []
    }

    // Normalizar Supabase + sobrescrever com Notion (quando disponível)
    const events = (supabaseRes.data ?? []).map((row: any) => {
      const fromNotion = row.notion_id ? notionMap.get(row.notion_id) : null
      // Notion ganha para campos que ele controla
      const referencia  = fromNotion?.referencia  ?? row.referencia ?? ''
      const cliente     = fromNotion?.cliente     ?? row.cliente ?? ''
      const local       = fromNotion?.local       ?? row.local ?? ''
      const status      = fromNotion?.status      ?? row.status ?? ''
      const data_evento = fromNotion?.data_evento ?? row.data_evento ?? ''
      const tipo_evento = (fromNotion?.tipo_evento?.length ? fromNotion.tipo_evento : parseArr(row.tipo_evento)) as string[]
      const tipo_servico= (fromNotion?.tipo_servico?.length ? fromNotion.tipo_servico : parseArr(row.tipo_servico)) as string[]
      // Equipa: evento_equipa (Supabase) > Notion > eventos_2026 (cache antigo)
      const equipaRow = (row.notion_id && equipaByEvento.get(row.notion_id))
                     || (row.id && equipaByEvento.get(row.id))
                     || (referencia && equipaByRef.get(referencia.toUpperCase()))
                     || null
      const fotografo: string[] = (equipaRow?.fotografo?.length ? equipaRow.fotografo
                          : fromNotion?.fotografo?.length ? fromNotion.fotografo
                          : parseArr(row.fotografo))
      const videografo: string[] = (equipaRow?.videografo?.length ? equipaRow.videografo
                          : fromNotion?.videografo?.length ? fromNotion.videografo
                          : parseArr(row.videografo))
      const editor_fotos: string | null = equipaRow?.editor_fotos
                          ?? fromNotion?.editor_fotos
                          ?? row.editor_fotos
                          ?? null

      // Detecta mismatch nos campos-chave e regista para sync de background
      if (fromNotion) {
        const upd: Record<string, any> = {}
        if (referencia !== (row.referencia ?? '')) upd.referencia = referencia
        if (cliente !== (row.cliente ?? '')) upd.cliente = cliente
        if (local !== (row.local ?? '')) upd.local = local
        if (data_evento !== (row.data_evento ?? '')) upd.data_evento = data_evento
        if (Object.keys(upd).length > 0) mismatches.push({ id: row.id, updates: upd })
      }

      return {
        id: row.id,
        notion_id: row.notion_id,
        referencia,
        cliente,
        data_evento,
        local,
        tipo_evento,
        tipo_servico,
        status,
        fotografo,
        videografo,
        editor_fotos,
        valor_foto:        row.valor_foto,
        valor_real_foto:   row.valor_real_foto ?? null,
        valor_video:       row.valor_liquido,
        valor_liquido:     row.valor_liquido,
        fotos_enviadas:    row.fotos_enviadas ?? false,
        sel_fotos_estado:  row.sel_fotos_estado ?? null,
        video_estado:      row.video_estado ?? null,
        fotos_edicao_estado: row.fotos_edicao_estado ?? null,
        album_estado:      row.album_estado ?? null,
      }
    })

    // Background sync: corrige Supabase para refletir Notion (fire-and-forget)
    if (mismatches.length > 0) {
      Promise.all(mismatches.map(m =>
        supabase.from('eventos_2026').update(m.updates).eq('id', m.id)
      )).catch(err => console.warn('[eventos-supabase] background sync failed:', err))
    }

    // Totais
    const totais = events.reduce(
      (acc, e) => {
        acc.totalFoto += Number(e.valor_real_foto ?? e.valor_foto) || 0
        acc.totalVideo += Number(e.valor_video) || 0
        return acc
      },
      { totalFoto: 0, totalVideo: 0 }
    )

    return NextResponse.json({
      events,
      total: events.length,
      notion_synced: notionMap.size > 0,
      mismatches_fixed: mismatches.length,
      totais: {
        foto: totais.totalFoto,
        video: totais.totalVideo,
        geral: totais.totalFoto + totais.totalVideo,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
