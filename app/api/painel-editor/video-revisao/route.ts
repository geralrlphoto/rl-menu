import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET: estado da revisão de vídeo de um evento (para a ficha do admin).
export async function GET(req: NextRequest) {
  const referencia = req.nextUrl.searchParams.get('referencia')
  if (!referencia) return NextResponse.json({ error: 'referencia required' }, { status: 400 })
  const supabase = db()
  const { data } = await supabase.from('video_revisoes').select('*').eq('referencia', referencia).maybeSingle()
  return NextResponse.json({ revisao: data ?? null })
}

// POST: o editor envia o link do vídeo (Frame.io) para revisão.
//   → guarda link + estado "Em Revisão" e notifica o admin (sino).
export async function POST(req: NextRequest) {
  const { referencia, evento_id, freelancer, link, noivos, local } = await req.json().catch(() => ({}))
  if (!referencia || !link) {
    return NextResponse.json({ error: 'referencia e link obrigatórios' }, { status: 400 })
  }
  const supabase = db()

  const { error } = await supabase.from('video_revisoes').upsert({
    referencia,
    evento_id: evento_id ?? null,
    freelancer_id: freelancer ?? null,
    link,
    status: 'Em Revisão',
    feedback: null,
    noivos: noivos ?? null,
    local: local ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'referencia' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notifica o admin (sino) — derivado em /api/admin-notifications.
  if (freelancer) {
    const meta = JSON.stringify({ referencia, evento_id: evento_id ?? null, link, local: local ?? null, noivos: noivos ?? null })
    await supabase.from('freelancer_notificacoes').insert({
      freelancer_id: freelancer,
      titulo: '🎬 Vídeo para revisão',
      mensagem: `__META__${meta}__/META__\nO editor enviou o vídeo para revisão.\n${link}`,
      tipo: 'video_revisao_enviada',
      lida: false,
    })
  }

  return NextResponse.json({ ok: true, status: 'Em Revisão' })
}

// PATCH: o admin aprova ou pede alterações na ficha do evento.
//   → atualiza estado e notifica o editor (sino do painel do editor).
export async function PATCH(req: NextRequest) {
  const { referencia, status, feedback } = await req.json().catch(() => ({}))
  if (!referencia || !status) {
    return NextResponse.json({ error: 'referencia e status obrigatórios' }, { status: 400 })
  }
  if (status !== 'Aprovado' && status !== 'Requer Alterações') {
    return NextResponse.json({ error: 'status inválido' }, { status: 400 })
  }
  const supabase = db()

  const { data: cur } = await supabase.from('video_revisoes').select('*').eq('referencia', referencia).maybeSingle()
  if (!cur) return NextResponse.json({ error: 'revisão não encontrada' }, { status: 404 })

  await supabase.from('video_revisoes').update({
    status,
    feedback: feedback ?? null,
    updated_at: new Date().toISOString(),
  }).eq('referencia', referencia)

  // Notifica o editor (sino do painel) — vídeo aprovado / requer alterações.
  if (cur.freelancer_id) {
    const aprovado = status === 'Aprovado'
    const meta = JSON.stringify({ referencia, status, link: cur.link, feedback: feedback ?? null, local: cur.local, noivos: cur.noivos })
    await supabase.from('freelancer_notificacoes').insert({
      freelancer_id: cur.freelancer_id,
      titulo: aprovado ? '✅ Vídeo aprovado' : '✎ Vídeo — rever alterações',
      mensagem: `__META__${meta}__/META__\n${aprovado ? 'O teu vídeo foi aprovado.' : 'O admin pediu alterações ao vídeo.'}${feedback ? `\n${feedback}` : ''}`,
      tipo: aprovado ? 'video_aprovado' : 'video_alteracoes',
      lida: false,
    })
  }

  return NextResponse.json({ ok: true, status })
}
