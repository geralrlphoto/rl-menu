import { NextRequest, NextResponse } from 'next/server'
import { emailNotificacaoFreelancer } from '@/lib/emailsFreelancers'
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
  const { freelancer_id, titulo } = await req.json().catch(() => ({}))

  if (!freelancer_id || !titulo) {
    return NextResponse.json({ error: 'freelancer_id e titulo são obrigatórios' }, { status: 400 })
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

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'RL Photo.Video <geral@rlphotovideo.pt>',
      to: [freelancer.email],
      subject: `Tens uma nova notificação — ${titulo}`,
      html: emailNotificacaoFreelancer({ portalUrl, nome: freelancer.nome, status: (freelancer as any).status, titulo }),
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('[send-notif-freelancer-email]', data)
    return NextResponse.json({ error: data.message ?? 'Erro ao enviar email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
