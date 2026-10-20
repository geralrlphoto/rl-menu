import { NextRequest, NextResponse } from 'next/server'
import { exigeAdmin, exigeSessao, exigeAdminOuProprio, sessaoMembro, ehAdmin, naoAutorizado, destinoDaEquipa, cabecalhoInterno } from '@/lib/api-guard'
import { createClient } from '@supabase/supabase-js'
import { aplicarEstadoVideo, estadoDaFase, ESTADOS_DO_EDITOR } from '@/lib/videoEstado'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Fase do editor → estado do vídeo: ver estadoDaFase em lib/videoEstado.ts

// POST: chamado quando o editor muda o estado do vídeo em /novos-projetos.
//   1) Sincroniza video_estado no portal dos noivos (Notion + Supabase).
//   2) Notifica o admin (sino) e regista o dia da mudança (freelancer_notificacoes).
export async function POST(req: NextRequest) {
  const { freelancer, referencia, evento_id, stage, local, data_casamento } =
    await req.json().catch(() => ({}))
  const bloqueio = await exigeAdminOuProprio(req, freelancer)
  if (bloqueio) return bloqueio
  if (!stage) return NextResponse.json({ error: 'stage required' }, { status: 400 })
  if (!referencia && !evento_id) {
    return NextResponse.json({ error: 'referencia or evento_id required' }, { status: 400 })
  }

  const supabase = db()
  const videoEstado = estadoDaFase(stage)
  // Finalizado e Entregue são da RL (Departamento de Edição de Vídeo); o editor só põe Em Edição / Em Revisão
  if (!ehAdmin(req) && !ESTADOS_DO_EDITOR.includes(videoEstado)) {
    return NextResponse.json({ error: 'Finalizado e Entregue são definidos pela RL.' }, { status: 403 })
  }

  // 1-2) Evento, Notion, portal dos noivos e fase no Painel do Editor (lib/videoEstado.ts)
  const { ok: synced, eventId } = await aplicarEstadoVideo(req.nextUrl.origin, {
    referencia: referencia ?? null, evento_id: evento_id ?? null, estado: videoEstado, freelancerId: freelancer ?? null,
  })

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
