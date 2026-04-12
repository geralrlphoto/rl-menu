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

  // ── Sync videografo on all existing casamentos + ensure videografo has own record ──
  if (videografo !== undefined) {
    const videoChanged = JSON.stringify(newVideo) !== JSON.stringify(oldVideo)

    // Update videografo field on all existing photographer casamentos for this event
    await supabase.from('freelancer_casamentos')
      .update({ videografo: newVideo[0] ?? null })
      .eq('evento_id', evento_id)

    // If videografo changed, remove old videografo's own casamento record
    if (videoChanged && oldVideo[0]) {
      const { data: oldVfl } = await supabase
        .from('freelancers').select('id').ilike('nome', oldVideo[0]).maybeSingle()
      if (oldVfl) {
        await supabase.from('freelancer_casamentos')
          .delete().eq('freelancer_id', oldVfl.id).eq('evento_id', evento_id)
      }
    }

    // Ensure current videografo has their own casamento record (create if missing)
    if (newVideo[0]) {
      const { data: newVfl } = await supabase
        .from('freelancers').select('id').ilike('nome', newVideo[0]).maybeSingle()
      if (newVfl) {
        const { data: exists } = await supabase
          .from('freelancer_casamentos').select('id')
          .eq('freelancer_id', newVfl.id).eq('evento_id', evento_id).maybeSingle()
        if (!exists) {
          await supabase.from('freelancer_casamentos').insert({
            freelancer_id: newVfl.id,
            evento_id,
            local: local ?? '',
            data_casamento: data_casamento || null,
            equipa_foto: newFoto,
            videografo: newVideo[0],
            briefing_url: null,
            order_index: 999,
          })
        }
      }
    }
  }

  return NextResponse.json({ ok: true, fotografo: newFoto, videografo: newVideo })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { referencia, briefing_url, evento_id, local, data_casamento } = body

  if (!briefing_url) return NextResponse.json({ error: 'briefing_url required' }, { status: 400 })
  if (!referencia && !evento_id) return NextResponse.json({ error: 'referencia or evento_id required' }, { status: 400 })

  const supabase = db()

  // Resolve evento_id from referencia if not provided
  let resolvedEventoId = evento_id ?? null
  if (!resolvedEventoId && referencia) {
    const { data: eq } = await supabase
      .from('evento_equipa')
      .select('evento_id')
      .eq('referencia', referencia)
      .maybeSingle()
    resolvedEventoId = eq?.evento_id ?? null
  }

  // Upsert evento_equipa with briefing_url
  if (resolvedEventoId) {
    await supabase.from('evento_equipa')
      .upsert({ evento_id: resolvedEventoId, briefing_url }, { onConflict: 'evento_id' })

    // Update all freelancer_casamentos tied to this evento_id
    await supabase.from('freelancer_casamentos')
      .update({ briefing_url })
      .eq('evento_id', resolvedEventoId)
  }

  // Also match Notion-imported records (evento_id IS NULL) by local + data_casamento
  if (local && data_casamento) {
    await supabase.from('freelancer_casamentos')
      .update({ briefing_url })
      .eq('local', local)
      .eq('data_casamento', data_casamento)
      .is('evento_id', null)
  }

  return NextResponse.json({ ok: true })
}
