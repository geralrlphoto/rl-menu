import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Public endpoint — returns ONLY proposal service data (no personal/financial info)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ found: false }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: contact } = await supabase
    .from('crm_contacts')
    .select('page_content')
    .eq('page_token', token)
    .single()

  if (!contact) return NextResponse.json({ found: false })

  const pc = typeof contact.page_content === 'string'
    ? JSON.parse(contact.page_content || '{}')
    : (contact.page_content || {})

  const propostas: Array<{ nome: string; servicos_foto: string[]; servicos_video: string[]; valor: string }> =
    pc.propostas || []
  const extras: Array<{ nome: string; valor: string }> = pc.extras_proposta || []

  const propostaAtiva: number = pc.propostaPage?.propostaAtiva ?? 0
  const proposta = propostas[propostaAtiva]

  if (!proposta) return NextResponse.json({ found: false })

  return NextResponse.json({
    found: true,
    propostaAtiva,
    proposta: {
      nome: proposta.nome,
      servicos_foto: proposta.servicos_foto || [],
      servicos_video: proposta.servicos_video || [],
    },
    // Only extras names (no prices — client-facing)
    extras: extras.map(e => ({ nome: e.nome })),
  })
}
