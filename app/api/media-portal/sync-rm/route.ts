import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const MASTER_TOKEN = 'rm-master-rlprod'

// Campos de design que sincronizam do mestre — dados do cliente ficam intactos
const SYNC_FIELDS = ['page_content']

// Campos do cliente que NUNCA são sobrescritos
const PRESERVE_FIELDS = [
  'nome', 'empresa', 'email', 'telefone', 'tipo', 'fonte', 'mensagem',
  'estado', 'reuniao_data', 'reuniao_hora', 'reuniao_tipo', 'reuniao_link',
  'page_confirmacao', 'page_views', 'page_last_viewed',
]

export async function POST(req: NextRequest) {
  const auth = req.cookies.get('rl_auth')?.value
  if (auth !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Buscar maquete mestre
  const { data: master } = await supabase
    .from('media_leads')
    .select('page_content')
    .eq('page_token', MASTER_TOKEN)
    .single()

  if (!master?.page_content) {
    return NextResponse.json({ error: 'Maquete não encontrada' }, { status: 404 })
  }

  const masterContent = master.page_content

  // 2. Buscar todos os outros portais
  const { data: portais } = await supabase
    .from('media_leads')
    .select('id, page_token, page_content')
    .neq('page_token', MASTER_TOKEN)
    .not('page_token', 'is', null)

  let updated = 0
  for (const portal of portais ?? []) {
    const clientContent = portal.page_content ?? {}

    // Sincronizar page_content do mestre, preservando dados específicos do cliente
    // dentro do page_content (ex: propostas específicas do cliente)
    const newContent = {
      ...masterContent,
      // Preservar propostas e dados personalizados do cliente se existirem
      propostas: clientContent.propostas ?? masterContent.propostas,
      proposta: {
        ...masterContent.proposta,
        // Preservar pacote ativo e password do cliente
        propostaAtiva: clientContent.proposta?.propostaAtiva ?? 0,
        password: clientContent.proposta?.password ?? '',
      },
    }

    const { error } = await supabase
      .from('media_leads')
      .update({ page_content: newContent })
      .eq('id', portal.id)

    if (!error) updated++
  }

  return NextResponse.json({ ok: true, updated })
}
