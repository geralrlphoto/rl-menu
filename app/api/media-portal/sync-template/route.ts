import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { MEDIA_MASTER_REF } from '@/app/portal-media/_data/mockProject'

// Campos de design/template que sincronizam do mestre para todos os portais
const SYNC_FIELDS = [
  'heroImageUrl', 'heroLogoUrl',
  'gestorNome', 'gestorEmail', 'gestorTelefone',
  'pagamentosImageUrl', 'contratoImageUrl', 'briefingImageUrl',
  'entregasImageUrl', 'workflowImageUrl', 'atendimentoImageUrl',
  'satisfacaoImageUrl', 'revisoesImageUrl', 'roadmapImageUrl', 'reproducaoImageUrl',
  'briefingItems', 'cpsFormUrl', 'satisfacaoUrl', 'contaBancaria',
] as const

export async function POST(req: NextRequest) {
  const auth = req.cookies.get('rl_auth')?.value
  if (auth !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Buscar dados da maquete mestre
  const { data: master, error: masterErr } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', MEDIA_MASTER_REF)
    .single()

  if (masterErr || !master?.dados) {
    return NextResponse.json({ error: 'Maquete não encontrada' }, { status: 404 })
  }

  const masterDados = master.dados

  // 2. Buscar todos os outros portais (excluindo a maquete)
  const { data: portais, error: portaisErr } = await supabase
    .from('media_portais')
    .select('ref, dados')
    .neq('ref', MEDIA_MASTER_REF)

  if (portaisErr) {
    return NextResponse.json({ error: portaisErr.message }, { status: 500 })
  }

  // 3. Sincronizar cada portal
  let updated = 0
  for (const portal of portais ?? []) {
    const clientDados = portal.dados ?? {}

    // Extrair campos de template do mestre
    const templateFields: Record<string, unknown> = {}
    for (const field of SYNC_FIELDS) {
      if (masterDados[field] !== undefined) {
        templateFields[field] = masterDados[field]
      }
    }

    // Sincronizar estrutura das fases mas preservar estado e data por cliente
    let fasesSync = clientDados.fases
    if (masterDados.fases && Array.isArray(masterDados.fases)) {
      fasesSync = masterDados.fases.map((mf: any) => {
        const cf = (clientDados.fases ?? []).find((f: any) => f.id === mf.id)
        return {
          ...mf,
          estado: cf?.estado ?? mf.estado,
          data:   cf?.data   ?? mf.data,
          notificacaoEnviada: cf?.notificacaoEnviada,
        }
      })
    }

    const newDados = {
      ...clientDados,     // preservar tudo do cliente
      ...templateFields,  // sobrescrever com campos de template
      fases: fasesSync,   // fases: estrutura do mestre + estados do cliente
    }

    const { error } = await supabase
      .from('media_portais')
      .update({ dados: newDados, updated_at: new Date().toISOString() })
      .eq('ref', portal.ref)

    if (!error) updated++
  }

  return NextResponse.json({ ok: true, updated })
}
