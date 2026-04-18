import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const MASTER_TOKEN = '85343645-b0d3-4412-ae78-795fd7f8ddf1'

// Design fields inside propostaPage that come from master (NOT couple-specific)
const PROPOSTA_DESIGN_KEYS = ['subtitle', 'intro', 'about', 'relive', 'grandeDia', 'packages', 'ctaText', 'typography']

// Top-level content fields that come from master
const TOP_LEVEL_DESIGN_KEYS = ['video', 'about', 'testimonials', 'banner', 'portfolio']

export async function POST(req: NextRequest) {
  const { id, publish } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Buscar token + page_content existente
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

  // Ao publicar: copiar design da maquete
  if (publish) {
    const { data: master } = await supabase
      .from('crm_contacts')
      .select('page_content')
      .eq('page_token', MASTER_TOKEN)
      .maybeSingle()

    if (master?.page_content) {
      const masterPC = master.page_content
      const currentPC = existing?.page_content ?? {}
      const currentPP = currentPC.propostaPage ?? {}

      // Patch propostaPage: design from master, propostaAtiva preserved
      const designPatch: Record<string, any> = {}
      for (const key of PROPOSTA_DESIGN_KEYS) {
        if (masterPC.propostaPage?.[key] !== undefined) {
          designPatch[key] = masterPC.propostaPage[key]
        }
      }
      const newPropostaPage = {
        ...currentPP,
        ...designPatch,
        propostaAtiva: currentPP.propostaAtiva ?? 0,
      }

      // Patch top-level design fields
      const topPatch: Record<string, any> = {}
      for (const key of TOP_LEVEL_DESIGN_KEYS) {
        if (masterPC[key] !== undefined) {
          topPatch[key] = masterPC[key]
        }
      }

      const newContent = {
        ...currentPC,
        ...topPatch,
        propostaPage: newPropostaPage,
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
