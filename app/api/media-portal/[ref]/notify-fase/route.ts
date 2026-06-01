/* ============================================================
   /api/media-portal/[ref]/notify-fase  (POST)
   Stub do endpoint que notifica o cliente sobre uma mudança/estado
   de fase no Workflow v2. Por agora apenas grava em
   media_portais.dados.notify_fase_log[] o trigger para auditoria.
   Quando integrarmos Resend/Email, este endpoint envia o email.
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

  const phase = {
    n: String(body?.phaseNumber ?? ''),
    name: String(body?.phaseName ?? ''),
    state: String(body?.phaseState ?? ''),
    date: body?.phaseDate ?? null,
  }
  if (!phase.n || !phase.name) {
    return NextResponse.json({ ok: false, error: 'phase data em falta' }, { status: 400 })
  }

  // Append ao log de notificações em media_portais.dados.notify_fase_log
  const sb = db()
  const { data: row } = await sb
    .from('media_portais')
    .select('dados')
    .eq('ref', ref.toUpperCase())
    .maybeSingle()

  const dados = (row?.dados ?? {}) as Record<string, any>
  const log: any[] = Array.isArray(dados.notify_fase_log) ? dados.notify_fase_log : []
  log.push({
    at: new Date().toISOString(),
    phase,
  })
  // Manter no máximo as últimas 100 notificações
  while (log.length > 100) log.shift()

  try {
    await sb.from('media_portais')
      .update({ dados: { ...dados, notify_fase_log: log } })
      .eq('ref', ref.toUpperCase())
  } catch {
    // Se a row não existir, ignora — não impede o stub de devolver ok
  }

  // TODO: integrar envio de email (Resend) quando confirmarmos template e
  // o budget de I/O do Supabase recuperar.
  console.log(`[notify-fase] ref=${ref} phase=${phase.n} ${phase.name} (${phase.state})`)

  return NextResponse.json({ ok: true, logged: true })
}
