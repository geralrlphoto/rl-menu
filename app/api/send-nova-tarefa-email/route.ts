import { NextRequest, NextResponse } from 'next/server'
import { emailNovaTarefa } from '@/lib/emailsFreelancers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const PORTAL_BASE = 'https://portal.rlphotovideo.pt/freelancer-view'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const { freelancer_id, titulo, descricao, prazo, prioridade } = await req.json().catch(() => ({}))

  if (!freelancer_id) {
    return NextResponse.json({ error: 'freelancer_id obrigatório' }, { status: 400 })
  }

  const { data: freelancer, error } = await supabase()
    .from('freelancers')
    .select('id, nome, email, status')
    .eq('id', freelancer_id)
    .single()

  if (error || !freelancer?.email) {
    return NextResponse.json({ error: 'Freelancer não encontrado ou sem email' }, { status: 404 })
  }

  const portalUrl = `${PORTAL_BASE}/${freelancer_id}`
  const subject = titulo
    ? `Nova tarefa atribuída · ${titulo}`
    : 'Nova tarefa atribuída a ti'

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [freelancer.email],
      subject,
      html: emailNovaTarefa({ url: portalUrl, nome: freelancer.nome, status: (freelancer as any).status, titulo, descricao, prazo, prioridade }),
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('[send-nova-tarefa-email]', data)
    return NextResponse.json({ error: data.message ?? 'Erro ao enviar email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
