import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MASTER_TOKEN = '85343645-b0d3-4412-ae78-795fd7f8ddf1'

export async function POST(req: NextRequest) {
  const auth = req.cookies.get('rl_auth')?.value
  if (auth !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Buscar page_content da maquete
  const { data: master, error: masterErr } = await supabase
    .from('crm_contacts')
    .select('page_content')
    .eq('page_token', MASTER_TOKEN)
    .maybeSingle()

  if (masterErr) return NextResponse.json({ error: masterErr.message }, { status: 500 })
  if (!master?.page_content) return NextResponse.json({ error: 'Master not found' }, { status: 404 })

  const masterPC = master.page_content

  // 2. Buscar todos os outros contactos com page_token
  const { data: contacts, error: contactsErr } = await supabase
    .from('crm_contacts')
    .select('page_token, page_content')
    .not('page_token', 'is', null)
    .neq('page_token', MASTER_TOKEN)

  if (contactsErr) return NextResponse.json({ error: contactsErr.message }, { status: 500 })

  let updated = 0
  for (const contact of (contacts ?? [])) {
    const currentPC = contact.page_content ?? {}

    // Copiar TUDO da maquete, preservar apenas dados específicos do casal
    const newContent = {
      ...masterPC,
      propostas: currentPC.propostas ?? masterPC.propostas,
      extras_proposta: currentPC.extras_proposta ?? masterPC.extras_proposta,
      propostaPage: {
        ...masterPC.propostaPage,
        propostaAtiva: currentPC.propostaPage?.propostaAtiva ?? 0,
      },
    }

    const { error } = await supabase
      .from('crm_contacts')
      .update({ page_content: newContent })
      .eq('page_token', contact.page_token)

    if (!error) updated++
  }

  return NextResponse.json({ ok: true, updated })
}
