import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

export async function GET(req: NextRequest) {
  try {
    const anoParam = req.nextUrl.searchParams.get('ano')
    const ano = anoParam ? parseInt(anoParam) : 2026

    // Todos os eventos ficam na tabela eventos_2026 — filtra por ano via data_evento
    const { data, error } = await supabase
      .from('eventos_2026')
      .select('*')
      .gte('data_evento', `${ano}-01-01`)
      .lte('data_evento', `${ano}-12-31`)
      .order('data_evento', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Normalizar os campos jsonb/string/array vindos do Supabase
    const events = (data ?? []).map((row: any) => {
      const parseArr = (v: any): string[] => {
        if (Array.isArray(v)) return v
        if (typeof v === 'string') {
          const s = v.trim()
          if (!s) return []
          if (s.startsWith('[')) {
            try { const p = JSON.parse(s); return Array.isArray(p) ? p : [] } catch { return [s] }
          }
          // plain-string: "CASAMENTO" ou "CASAMENTO, BATIZADO"
          return s.split(',').map(x => x.trim()).filter(Boolean)
        }
        return []
      }
      return {
        id: row.id,
        notion_id: row.notion_id,
        referencia: row.referencia ?? '',
        cliente: row.cliente ?? '',
        data_evento: row.data_evento ?? '',
        local: row.local ?? '',
        tipo_evento: parseArr(row.tipo_evento),
        tipo_servico: parseArr(row.tipo_servico),
        status: row.status ?? '',
        fotografo: parseArr(row.fotografo),
        valor_foto: row.valor_foto,
        valor_real_foto: row.valor_real_foto ?? null,
        valor_video: row.valor_liquido, // mapping pedido: valor_video = valor_liquido
        valor_liquido: row.valor_liquido,
        fotos_enviadas: row.fotos_enviadas ?? false,
      }
    })

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
