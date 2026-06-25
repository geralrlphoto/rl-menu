import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// POST: o editor envia o link da ENTREGA FINAL do projeto.
//   → guarda em video_revisoes (entrega_link) e notifica o admin (sino).
//   Fica registado na ficha do cliente (Produção & Entregas).
export async function POST(req: NextRequest) {
  const { referencia, evento_id, freelancer, link, noivos, local } = await req.json().catch(() => ({}))
  if (!referencia || !link) {
    return NextResponse.json({ error: 'referencia e link obrigatórios' }, { status: 400 })
  }
  const supabase = db()

  // Upsert só dos campos de entrega — não toca no estado da revisão.
  const { error } = await supabase.from('video_revisoes').upsert({
    referencia,
    evento_id: evento_id ?? null,
    freelancer_id: freelancer ?? null,
    entrega_link: link,
    entrega_em: new Date().toISOString(),
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
      titulo: '📦 Entrega do projeto',
      mensagem: `__META__${meta}__/META__\nO editor enviou o link de entrega do projeto.\n${link}`,
      tipo: 'entrega_projeto',
      lida: false,
    })
  }

  return NextResponse.json({ ok: true })
}
