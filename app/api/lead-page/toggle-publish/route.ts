import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const MASTER_TOKEN = '85343645-b0d3-4412-ae78-795fd7f8ddf1'

export async function POST(req: NextRequest) {
  const { id, publish } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar token + page_content existente do casal
  const { data: existing } = await supabase
    .from('crm_contacts')
    .select('page_token, page_content')
    .eq('id', id)
    .single()

  const token = existing?.page_token || randomUUID()

  let updatePayload: Record<string, any> = {
    page_publicada: publish,
    page_token: token,
  }

  // Ao publicar: copiar TUDO da maquete, preservar apenas dados específicos do casal
  if (publish) {
    const { data: master } = await supabase
      .from('crm_contacts')
      .select('page_content')
      .eq('page_token', MASTER_TOKEN)
      .maybeSingle()

    if (master?.page_content) {
      const masterPC = master.page_content
      const currentPC = existing?.page_content ?? {}

      // Preservar apenas o que é específico de cada casal:
      // - propostas (os 3 pacotes com preços e serviços escolhidos)
      // - extras_proposta
      // - propostaAtiva (qual proposta está activa)
      const newContent = {
        ...masterPC,                                              // tudo da maquete
        propostas: currentPC.propostas ?? masterPC.propostas,    // propostas do casal
        extras_proposta: currentPC.extras_proposta ?? masterPC.extras_proposta,
        propostaPage: {
          ...masterPC.propostaPage,                              // design todo da maquete
          propostaAtiva: currentPC.propostaPage?.propostaAtiva ?? 0,
        },
      }

      updatePayload.page_content = newContent
    }
  }

  const { error } = await supabase
    .from('crm_contacts')
    .update(updatePayload)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, token })
}
