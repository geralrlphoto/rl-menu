/* ============================================================
   /api/media-portal/[ref]/notifications  (GET)
   Devolve a lista de notificações do portal, lendo
   media_portais.dados.notify_fase_log (escrita pelo
   /notify-fase do Workflow v2).
   Tolerante a erros de Supabase: devolve [] em vez de 500.
   ============================================================ */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type Params = { params: Promise<{ ref: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { ref } = await params
  try {
    const { data: row } = await db()
      .from('media_portais')
      .select('dados')
      .eq('ref', ref.toUpperCase())
      .maybeSingle()
    const dados = (row?.dados ?? {}) as Record<string, any>
    // Merge dos dois logs: notify_fase_log (Workflow v2) + notify_log (genérico)
    const faseLog: any[] = Array.isArray(dados.notify_fase_log) ? dados.notify_fase_log : []
    const genericLog: any[] = Array.isArray(dados.notify_log) ? dados.notify_log : []
    // Normaliza notify_fase_log para o mesmo shape: { at, type, title, body, meta }
    const faseAsGeneric = faseLog.map((n: any) => ({
      at: n?.at,
      type: 'fase',
      title: n?.phase?.name ? `Fase ${n.phase.n ?? ''} · ${n.phase.name}`.trim() : 'Atualização da fase',
      body: n?.phase?.state ? `Estado: ${n.phase.state}` : '',
      meta: { phase: n?.phase ?? null },
    }))
    const merged = [...faseAsGeneric, ...genericLog]
    const sorted = merged.sort((a, b) => String(b?.at ?? '').localeCompare(String(a?.at ?? '')))
    return NextResponse.json({ ok: true, notifications: sorted.slice(0, 50) })
  } catch {
    return NextResponse.json({ ok: true, notifications: [] })
  }
}
