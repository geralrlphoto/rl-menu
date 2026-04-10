import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest) {
  const evento_id = req.nextUrl.searchParams.get('evento_id')
  if (!evento_id) return NextResponse.json({ error: 'evento_id required' }, { status: 400 })

  const { data, error } = await db()
    .from('evento_equipa')
    .select('*')
    .eq('evento_id', evento_id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ equipa: data ?? null })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { evento_id, referencia, local, data_casamento, fotografo, videografo } = body

  if (!evento_id) return NextResponse.json({ error: 'evento_id required' }, { status: 400 })

  const supabase = db()

  // Get existing record to detect changes
  const { data: existing } = await supabase
    .from('evento_equipa')
    .select('*')
    .eq('evento_id', evento_id)
    .maybeSingle()

  const oldFoto: string[] = existing?.fotografo ?? []
  const oldVideo: string[] = existing?.videografo ?? []
  const newFoto: string[] = fotografo !== undefined ? fotografo : oldFoto
  const newVideo: string[] = videografo !== undefined ? videografo : oldVideo

  // Upsert evento_equipa
  const upsertData: any = { evento_id }
  if (referencia !== undefined) upsertData.referencia = referencia
  if (local !== undefined) upsertData.local = local
  if (data_casamento !== undefined) upsertData.data_casamento = data_casamento || null
  if (fotografo !== undefined) upsertData.fotografo = newFoto
  if (videografo !== undefined) upsertData.videografo = newVideo

  const { error: upsertError } = await supabase
    .from('evento_equipa')
    .upsert(upsertData, { onConflict: 'evento_id' })

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

  // ── Sync freelancer_casamentos when fotografo changes ──────────────────────
  if (fotografo !== undefined) {
    const removed = oldFoto.filter(n => !newFoto.includes(n))
    const added   = newFoto.filter(n => !oldFoto.includes(n))

    // Remove casamentos for deselected photographers
    for (const name of removed) {
      const { data: fl } = await supabase
        .from('freelancers').select('id').ilike('nome', name).maybeSingle()
      if (fl) {
        await supabase.from('freelancer_casamentos')
          .delete().eq('freelancer_id', fl.id).eq('evento_id', evento_id)
      }
    }

    // Add casamentos for newly selected photographers
    for (const name of added) {
      const { data: fl } = await supabase
        .from('freelancers').select('id').ilike('nome', name).maybeSingle()
      if (fl) {
        const { data: exists } = await supabase
          .from('freelancer_casamentos').select('id')
          .eq('freelancer_id', fl.id).eq('evento_id', evento_id).maybeSingle()

        if (!exists) {
          await supabase.from('freelancer_casamentos').insert({
            freelancer_id: fl.id,
            evento_id,
            local: local ?? '',
            data_casamento: data_casamento || null,
            equipa_foto: newFoto,
            videografo: newVideo[0] ?? null,
            briefing_url: null,
            order_index: 999,
          })
        }
      }
    }

    // Update equipa_foto and videografo on all casamentos tied to this event
    const { data: allC } = await supabase
      .from('freelancer_casamentos').select('id').eq('evento_id', evento_id)
    if (allC?.length) {
      for (const c of allC) {
        await supabase.from('freelancer_casamentos')
          .update({ equipa_foto: newFoto, videografo: newVideo[0] ?? null })
          .eq('id', c.id)
      }
    }
  }

  // ── Sync videografo change on all existing casamentos for this event ────────
  if (videografo !== undefined && JSON.stringify(newVideo) !== JSON.stringify(oldVideo)) {
    await supabase.from('freelancer_casamentos')
      .update({ videografo: newVideo[0] ?? null })
      .eq('evento_id', evento_id)
  }

  return NextResponse.json({ ok: true, fotografo: newFoto, videografo: newVideo })
}
