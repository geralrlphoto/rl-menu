import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Token da maquete mestre para herdar conteúdo padrão
const MASTER_TOKEN = 'rm-master-rlprod'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'token required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: lead } = await supabase
    .from('media_leads')
    .select('*')
    .eq('page_token', token)
    .single()

  // Lead existe — registar visita e devolver
  if (lead) {
    await supabase.from('media_leads').update({
      page_views: (lead.page_views || 0) + 1,
      page_last_viewed: new Date().toISOString(),
    }).eq('id', lead.id)
    return NextResponse.json({ lead })
  }

  // Lead não existe — auto-criar com conteúdo da maquete mestre (se existir)
  const { data: master } = await supabase
    .from('media_leads')
    .select('page_content')
    .eq('page_token', MASTER_TOKEN)
    .single()

  const { data: newLead, error: insertErr } = await supabase
    .from('media_leads')
    .insert({
      nome: 'Novo Portal',
      estado: 'Novo',
      page_token: token,
      page_content: master?.page_content ?? null,
      page_views: 1,
      page_last_viewed: new Date().toISOString(),
    })
    .select('*')
    .single()

  if (insertErr || !newLead) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json({ lead: newLead })
}
