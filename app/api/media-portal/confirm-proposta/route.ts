import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { token, acao, dados } = body as {
    token: string
    acao: 'aceite' | 'rejeitada'
    dados?: Record<string, string>
  }

  if (!token || !acao) return NextResponse.json({ error: 'token and acao required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar lead atual
  const { data: lead, error: fetchErr } = await supabase
    .from('media_leads')
    .select('id, page_content, nome, email, telefone, empresa')
    .eq('page_token', token)
    .single()

  if (fetchErr || !lead) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Guardar confirmação no page_content
  const confirmacao_proposta = {
    acao,
    timestamp: new Date().toISOString(),
    dados: dados || {},
  }

  const newContent = {
    ...(lead.page_content || {}),
    confirmacao_proposta,
  }

  // Atualizar campos do lead com dados do cliente (só preenche campos vazios)
  const updates: Record<string, any> = {
    page_content: newContent,
    updated_at:   new Date().toISOString(),
    estado:       acao === 'aceite' ? 'Convertido' : 'Perdido',
  }

  if (dados) {
    if (dados.nome      && !lead.nome)     updates.nome     = dados.nome
    if (dados.email     && !lead.email)    updates.email    = dados.email
    if (dados.telefone  && !lead.telefone) updates.telefone = dados.telefone
    if (dados.empresa   && !lead.empresa)  updates.empresa  = dados.empresa
  }

  const { error: updateErr } = await supabase
    .from('media_leads')
    .update(updates)
    .eq('id', lead.id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
