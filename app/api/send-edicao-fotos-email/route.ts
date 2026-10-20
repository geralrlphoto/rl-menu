import { NextRequest, NextResponse } from 'next/server'
import { nomesBilhete } from '@/lib/bilheteNoivos'
import { eventoParaEquipa } from '@/lib/cardEquipa'
import { emailEdicaoFotos } from '@/lib/emailsFreelancers'
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
  const { freelancer_id, nome_noivos, referencia } = await req.json().catch(() => ({}))

  if (!freelancer_id) {
    return NextResponse.json({ error: 'freelancer_id obrigatório' }, { status: 400 })
  }

  const { data: freelancer, error } = await supabase()
    .from('freelancers')
    .select('id, nome, email')
    .eq('id', freelancer_id)
    .single()

  if (error || !freelancer?.email) {
    return NextResponse.json({ error: 'Freelancer não encontrado ou sem email' }, { status: 404 })
  }

  const portalUrl = `${PORTAL_BASE}/${freelancer_id}`
  const ev = await eventoParaEquipa(referencia)
  const subject = nome_noivos
    ? `Nova edição de fotos · ${nome_noivos}`
    : `Nova edição de fotos atribuída a ti`

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
      html: emailEdicaoFotos({ portalUrl, nome: freelancer.nome, noivos: nomesBilhete(nome_noivos) || nome_noivos, referencia, data: ev.data, local: ev.local }),
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    console.error('[send-edicao-fotos-email]', data)
    return NextResponse.json({ error: data.message ?? 'Erro ao enviar email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data.id })
}
