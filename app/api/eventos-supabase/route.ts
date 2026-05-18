import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// SUPABASE-ONLY. Não vai ao Notion buscar nada.
// Toda a leitura é direta de:
//   - eventos_2026 (campos principais do evento)
//   - evento_equipa (fotografo + videografo) ← preferido sobre eventos_2026.fotografo

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

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

export async function GET(req: NextRequest) {
  try {
    const anoParam = req.nextUrl.searchParams.get('ano')
    const ano = anoParam ? parseInt(anoParam) : 2026

    // Carrega Supabase apenas
    const [supabaseRes, equipaRes] = await Promise.all([
      supabase
        .from('eventos_2026')
        .select('*')
        .gte('data_evento', `${ano}-01-01`)
        .lte('data_evento', `${ano}-12-31`)
        .order('data_evento', { ascending: true }),
      supabase
        .from('evento_equipa')
        .select('evento_id, referencia, fotografo, videografo'),
    ])
    if (supabaseRes.error) {
      return NextResponse.json({ error: supabaseRes.error.message }, { status: 500 })
    }

    // Mapa para lookup rápido da equipa
    const equipaByEvento = new Map<string, any>()
    const equipaByRef = new Map<string, any>()
    ;(equipaRes.data ?? []).forEach((row: any) => {
      if (row.evento_id)  equipaByEvento.set(row.evento_id, row)
      if (row.referencia) equipaByRef.set(row.referencia.toUpperCase(), row)
    })

    const events = (supabaseRes.data ?? []).map((row: any) => {
      const referencia = row.referencia ?? ''
      // Equipa: evento_equipa > eventos_2026 cache
      const equipaRow = (row.notion_id && equipaByEvento.get(row.notion_id))
                     || (row.id && equipaByEvento.get(row.id))
                     || (referencia && equipaByRef.get(referencia.toUpperCase()))
                     || null
      const fotografo: string[]  = equipaRow?.fotografo?.length  ? equipaRow.fotografo  : parseArr(row.fotografo)
      const videografo: string[] = equipaRow?.videografo?.length ? equipaRow.videografo : parseArr(row.videografo)

      return {
        id:                row.id,
        notion_id:         row.notion_id,
        referencia,
        cliente:           row.cliente ?? '',
        data_evento:       row.data_evento ?? '',
        local:             row.local ?? '',
        tipo_evento:       parseArr(row.tipo_evento),
        tipo_servico:      parseArr(row.tipo_servico),
        status:            row.status ?? '',
        fotografo,
        videografo,
        editor_fotos:      row.editor_fotos ?? null,
        // Valores monetários — coluna própria em eventos_2026
        valor_foto:        row.valor_foto,
        valor_real_foto:   row.valor_real_foto ?? null,
        valor_video:       row.valor_video ?? null,
        valor_liquido:     row.valor_liquido ?? null,
        fotos_enviadas:    row.fotos_enviadas ?? false,
        // Estado das Entregas
        sel_fotos_estado:    row.sel_fotos_estado ?? null,
        video_estado:        row.video_estado ?? null,
        fotos_edicao_estado: row.fotos_edicao_estado ?? null,
        album_estado:        row.album_estado ?? null,
      }
    })

    // Totais — soma APENAS o que está em eventos_2026 (Supabase, sem Notion)
    // Vídeo: usa valor_video (bruto) — coluna própria.
    // Fotografia: valor_real_foto (se existir, é o valor real) senão valor_foto.
    const totais = events.reduce(
      (acc, e) => {
        acc.totalFoto  += Number(e.valor_real_foto ?? e.valor_foto) || 0
        acc.totalVideo += Number(e.valor_video) || 0
        return acc
      },
      { totalFoto: 0, totalVideo: 0 }
    )

    return NextResponse.json({
      events,
      total: events.length,
      totais: {
        foto:  totais.totalFoto,
        video: totais.totalVideo,
        geral: totais.totalFoto + totais.totalVideo,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
