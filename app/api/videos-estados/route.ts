import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lista enxuta dos vídeos por estado, de TODOS os anos — usada pela gaveta
// 🎬 Vídeos em /eventos-2026.
//   Só devolve as colunas necessárias e só os eventos em edição ou entregues
//   (o resto fica de fora) para manter o egress baixo: esta rota é chamada
//   uma vez, quando a gaveta abre pela primeira vez.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const ESTADOS = ['Em Edição', 'Em Revisão', 'Finalizado', 'Entregue']

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('eventos_2026')
      .select('id, notion_id, referencia, cliente, data_evento, local, video_estado')
      .in('video_estado', ESTADOS)
      .order('data_evento', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const videos = (data ?? []).map((row: any) => ({
      id:           row.id,
      notion_id:    row.notion_id ?? undefined,
      referencia:   row.referencia ?? '',
      cliente:      row.cliente ?? '',
      data_evento:  row.data_evento ?? '',
      local:        row.local ?? '',
      video_estado: row.video_estado ?? null,
    }))

    return NextResponse.json({ videos, total: videos.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
