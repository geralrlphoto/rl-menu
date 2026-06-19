import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Estado de edição do editor → "ESTADO DO VIDEO" do portal dos noivos.
// Valores aceites na ficha do evento: Aguardar | Em Edição | Entregue | S/SERVIÇO.
function stageToVideoEstado(stage: string): string {
  const s = (stage || '').trim()
  if (s === '' || s === 'Novo' || s === 'Novo Projeto') return 'Aguardar'
  if (s === 'Entregue') return 'Entregue'
  return 'Em Edição'
}

// POST: chamado quando o editor muda o estado do vídeo em /novos-projetos.
//   1) Sincroniza video_estado no portal dos noivos (Notion + Supabase).
//   2) Notifica o admin (sino) e regista o dia da mudança (freelancer_notificacoes).
export async function POST(req: NextRequest) {
  const { freelancer, referencia, evento_id, stage, local, data_casamento } =
    await req.json().catch(() => ({}))
  if (!stage) return NextResponse.json({ error: 'stage required' }, { status: 400 })
  if (!referencia && !evento_id) {
    return NextResponse.json({ error: 'referencia or evento_id required' }, { status: 400 })
  }

  const supabase = db()
  const videoEstado = stageToVideoEstado(stage)

  // 1) Resolver o evento (id Notion + estado atual) por referência OU evento_id.
  let eventId: string | null = evento_id || null
  let currentEstado: string | null = null
  for (const t of ['eventos_2026', 'eventos_2027']) {
    const sel = supabase.from(t).select('notion_id, id, video_estado')
    const { data } = referencia
      ? await sel.eq('referencia', referencia).maybeSingle()
      : await sel.or(`notion_id.eq.${eventId},id.eq.${eventId}`).maybeSingle()
    if (data) {
      eventId = eventId || (data as any).notion_id || (data as any).id
      currentEstado = (data as any).video_estado ?? null
      break
    }
  }

  // Evento sem serviço de vídeo (admin marcou "S/SERVIÇO") → não sincroniza
  // nem notifica: não há entrega de vídeo a refletir no portal dos noivos.
  const norm = (currentEstado || '').trim().toLowerCase().replace(/[-/]/g, '/')
  if (norm === 's/serviço' || norm === 's/servico') {
    return NextResponse.json({ ok: true, skipped: 'sem serviço de vídeo' })
  }

  // 2) Sincroniza via endpoint canónico (escreve Notion + eventos_YYYY + evento_equipa).
  //    Usa a origem do pedido para funcionar tanto em dev como em produção.
  let synced = false
  if (eventId) {
    try {
      const res = await fetch(`${req.nextUrl.origin}/api/eventos-notion/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_estado: videoEstado }),
      })
      synced = res.ok
    } catch { /* tenta fallback abaixo */ }
  }
  // Fallback: garante a escrita em Supabase por referência (caso o sync acima falhe).
  if (!synced && referencia) {
    for (const t of ['eventos_2026', 'eventos_2027']) {
      await supabase.from(t).update({ video_estado: videoEstado }).eq('referencia', referencia)
    }
  }

  // 3) Regista a mudança + notifica o admin (sino).
  const changedAt = new Date().toISOString()
  const meta = JSON.stringify({
    referencia: referencia ?? null,
    evento_id: eventId,
    local: local ?? null,
    data_casamento: data_casamento ?? null,
    stage,
    video_estado: videoEstado,
    changedAt,
  })
  const mensagem = `__META__${meta}__/META__\nEstado do vídeo: ${videoEstado} (${stage}).`
  if (freelancer) {
    await supabase.from('freelancer_notificacoes').insert({
      freelancer_id: freelancer,
      titulo: `🎬 Estado do vídeo: ${videoEstado}`,
      mensagem,
      tipo: 'video_estado_alterado',
      lida: false,
    })
  }

  return NextResponse.json({ ok: true, video_estado: videoEstado, synced, changedAt })
}
