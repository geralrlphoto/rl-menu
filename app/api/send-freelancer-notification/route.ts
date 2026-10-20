import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { emailNovidadesFreelancer } from '@/lib/emailsFreelancers'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(req: NextRequest) {
  const { nomes, tipo, referencia, data_evento, local, nome_noiva, nome_noivo } = await req.json().catch(() => ({}))

  if (!nomes?.length) return NextResponse.json({ error: 'nomes required' }, { status: 400 })

  // Fetch all freelancers and match by name case-insensitively
  const { data: allFreelancers, error } = await supabase()
    .from('freelancers')
    .select('id, nome, email')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const nomesLower = nomes.map((n: string) => n.toLowerCase().trim())
  const targets = (allFreelancers ?? []).filter(f =>
    f.email && nomesLower.includes((f.nome ?? '').toLowerCase().trim())
  )

  if (!targets.length) return NextResponse.json({
    error: 'Nenhum email encontrado para os freelancers selecionados',
    nomes_procurados: nomes,
    nomes_na_bd: (allFreelancers ?? []).map(f => f.nome)
  }, { status: 404 })

  const results = []
  for (const freelancer of targets) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RL Photo.Video <geral@rlphotovideo.pt>',
        to: [freelancer.email!],
        subject: `Tens novidades no portal — ${referencia ?? 'Novo Evento'}`,
        html: emailNovidadesFreelancer(freelancer.id),
      }),
    })

    const data = await res.json()
    results.push({ nome: freelancer.nome, email: freelancer.email, status: res.status, ok: res.ok, id: data.id, resendError: res.ok ? undefined : (data.message ?? data.name ?? JSON.stringify(data)) })
  }

  const allOk = results.every(r => r.ok)
  return NextResponse.json({ ok: allOk, results })
}
