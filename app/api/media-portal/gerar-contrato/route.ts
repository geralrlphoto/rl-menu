import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { ref, ...ficha } = body

  if (!ref) return NextResponse.json({ error: 'Ref obrigatória' }, { status: 400 })

  const refUp = ref.toUpperCase()
  const agora = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })

  // Ler dados existentes
  const { data: existing } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', refUp)
    .single()

  const dadosExistentes = existing?.dados ?? {}

  const novoDados = {
    ...dadosExistentes,
    ficha: { ...ficha, ref: refUp },
    contrato: {
      gerado: true,
      geradoEm: agora,
      ref: ficha.contratoRef || `CPS-${new Date().getFullYear()}-${refUp}`,
      estado: ficha.contratoEstado || 'Por Elaborar',
      url: `/media/contrato/${refUp}`,
      portalUrl: `/portal-media/${refUp}/contrato`,
    },
  }

  const { error } = await supabase
    .from('media_portais')
    .upsert(
      { ref: refUp, dados: novoDados, updated_at: new Date().toISOString() },
      { onConflict: 'ref' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    contratoUrl: `/media/contrato/${refUp}`,
    portalUrl: `/portal-media/${refUp}/contrato`,
  })
}
