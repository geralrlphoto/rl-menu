/* ============================================================
   /api/media-portal/[ref]/notify  (POST)
   Endpoint genérico de notificação. Recebe { type, title, body, meta? }
   e regista em media_portais.dados.notify_log[] (lista circular,
   máx 100 entradas, ordenada do mais antigo para o mais novo).
   Coexiste com notify_fase_log (escrito pelo /notify-fase do
   Workflow v2) — o /notifications faz merge dos dois logs.
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

export async function POST(req: NextRequest, { params }: Params) {
  const { ref } = await params
  let body: any = {}
  try { body = await req.json() } catch { /* noop */ }

  const entry = {
    at: new Date().toISOString(),
    type: String(body?.type ?? 'generic').slice(0, 60),
    title: String(body?.title ?? '').slice(0, 200),
    body: String(body?.body ?? '').slice(0, 1000),
    meta: body?.meta ?? null,
  }
  if (!entry.title && !entry.body) {
    return NextResponse.json({ ok: false, error: 'title/body em falta' }, { status: 400 })
  }

  const sb = db()
  try {
    const { data: row } = await sb
      .from('media_portais')
      .select('dados')
      .eq('ref', ref.toUpperCase())
      .maybeSingle()

    const dados = (row?.dados ?? {}) as Record<string, any>
    const log: any[] = Array.isArray(dados.notify_log) ? dados.notify_log : []
    log.push(entry)
    while (log.length > 100) log.shift()

    await sb.from('media_portais')
      .update({ dados: { ...dados, notify_log: log } })
      .eq('ref', ref.toUpperCase())
  } catch {
    // Tolerante a falhas de Supabase — não bloqueia o save do roadmap
  }

  return NextResponse.json({ ok: true, logged: true })
}
