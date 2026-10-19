// GET /api/cronograma-auto?ref=CAS_… — etapas do cronograma que a app confirma sozinha
// e que não estão nas definições do portal: reunião de preparação marcada, sessão
// pré-wedding marcada (link de marcação) e briefing enviado à equipa.
// Acesso: admin ou os próprios noivos.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAcessoRef } from '@/lib/api-guard'

export async function GET(req: NextRequest) {
  const ref = (req.nextUrl.searchParams.get('ref') ?? '').trim()
  if (!ref) return NextResponse.json({ error: 'ref obrigatória' }, { status: 400 })
  const bloqueio = await exigeAcessoRef(req, ref)
  if (bloqueio) return bloqueio

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: ev } = await sb.from('eventos_2026').select('id').eq('referencia', ref).maybeSingle()

  const [{ data: slots }, { data: equipa }] = await Promise.all([
    ev?.id
      ? sb.from('preparacao_slots').select('tipo').eq('evento_id', ev.id)
      : Promise.resolve({ data: [] as { tipo: string }[] }),
    sb.from('freelancer_casamentos').select('referencia').eq('referencia', ref).not('briefing_url', 'is', null).limit(1),
  ])

  return NextResponse.json({
    reuniaoPreparacao: (slots ?? []).some(s => s.tipo === 'preparacao'),
    preWeddingMarcado: (slots ?? []).some(s => s.tipo === 'prewedding'),
    briefingEquipa: (equipa ?? []).length > 0,
  })
}
