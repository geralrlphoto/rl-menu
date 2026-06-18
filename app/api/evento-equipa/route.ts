import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET(req: NextRequest) {
  const ref       = req.nextUrl.searchParams.get('ref')
  const evento_id = req.nextUrl.searchParams.get('evento_id')

  if (!ref && !evento_id) return NextResponse.json({ error: 'ref or evento_id required' }, { status: 400 })

  const supabase = db()
  let data: any = null
  let error: any = null

  if (ref) {
    // Primary: fetch by referencia (Notion-independent)
    const result = await supabase
      .from('evento_equipa')
      .select('*')
      .eq('referencia', ref)
      .maybeSingle()
    data = result.data
    error = result.error
  } else {
    const result = await supabase
      .from('evento_equipa')
      .select('*')
      .eq('evento_id', evento_id!)
      .maybeSingle()
    data = result.data
    error = result.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ equipa: data ?? null })
}

// Helper — cria notificação no portal do freelancer (idempotente por nome+role+evento)
async function notifyAddedMembers(
  supabase: any,
  names: string[],
  role: string,
  local: string | null,
  data_casamento: string | null,
  referencia: string | null,
) {
  if (!names?.length) return
  // Formato amigável da data (DD/MM/YYYY ou nada)
  let dateLabel = ''
  if (data_casamento) {
    try {
      const dateStr = String(data_casamento).slice(0, 10)
      const [y, m, d] = dateStr.split('-').map(Number)
      if ([y, m, d].every(n => Number.isFinite(n))) {
        const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
        dateLabel = `${String(d).padStart(2,'0')} ${MESES[m-1]} ${y}`
      }
    } catch {/* keep empty */}
  }
  const localStr = local ? String(local).trim() : ''
  for (const name of names) {
    if (!name || !name.trim()) continue
    const { data: fl } = await supabase.from('freelancers').select('id, nome').ilike('nome', name).maybeSingle()
    if (!fl) continue
    // Idempotência básica: evita duplicar a mesma notificação (mesmo título recente)
    const titulo = `✨ Nova atribuição · ${role}`
    // Incluímos __META__ com info necessária para os botões Confirmar/Indisponível
    // (referencia, role, local, data) sem afetar o que o utilizador vê — o parser
    // de mensagem na UI esconde o bloco META.
    const meta = JSON.stringify({
      atribuicao: { referencia: referencia ?? null, role, local: localStr || null, data_casamento: data_casamento ?? null },
      freelancerId: fl.id,
      freelancerNome: fl.nome ?? name,
    })
    const bodyText = localStr
      ? `Foste atribuído como ${role} no casamento em ${localStr}${dateLabel ? ` (${dateLabel})` : ''}.`
      : `Foste atribuído como ${role}${dateLabel ? ` para o evento de ${dateLabel}` : ''}.`
    const mensagem = `__META__${meta}__/META__\n${bodyText}`
    // Verifica se já existe uma notificação idêntica para este freelancer (por título + referência)
    // Usa LIKE no META para identificar duplicação por referência
    const { data: existing } = await supabase
      .from('freelancer_notificacoes')
      .select('id, lida')
      .eq('freelancer_id', fl.id)
      .eq('titulo', titulo)
      .ilike('mensagem', `%"referencia":"${referencia ?? ''}"%`)
      .maybeSingle()
    if (existing) continue  // já criada — não duplica
    await supabase.from('freelancer_notificacoes').insert({
      freelancer_id: fl.id,
      titulo,
      mensagem,
      tipo: 'atribuicao_equipa',
      lida: false,
    })
  }
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { evento_id, referencia, local, data_casamento, fotografo, videografo, editor_album, editor_video, editor_fotos } = body

  if (!evento_id && !referencia) return NextResponse.json({ error: 'evento_id or referencia required' }, { status: 400 })

  const supabase = db()

  // Get existing record — prefer referencia lookup (Notion-independent)
  let existing: any = null
  if (referencia) {
    const { data } = await supabase.from('evento_equipa').select('*').eq('referencia', referencia).maybeSingle()
    existing = data
  }
  if (!existing && evento_id) {
    const { data } = await supabase.from('evento_equipa').select('*').eq('evento_id', evento_id).maybeSingle()
    existing = data
  }

  const oldFoto: string[] = existing?.fotografo ?? []
  const oldVideo: string[] = existing?.videografo ?? []
  const oldEditorAlbum: string[] = Array.isArray(existing?.editor_album) ? existing.editor_album : (existing?.editor_album ? [existing.editor_album] : [])
  const oldEditorVideo: string[] = Array.isArray(existing?.editor_video) ? existing.editor_video : (existing?.editor_video ? [existing.editor_video] : [])
  const oldEditorFotos: string[] = Array.isArray(existing?.editor_fotos) ? existing.editor_fotos : (existing?.editor_fotos ? [existing.editor_fotos] : [])
  const newFoto: string[] = fotografo !== undefined ? fotografo : oldFoto
  const newVideo: string[] = videografo !== undefined ? videografo : oldVideo

  // Build upsert payload
  const upsertData: any = {}
  if (evento_id) upsertData.evento_id = evento_id
  if (referencia !== undefined) upsertData.referencia = referencia
  if (local !== undefined) upsertData.local = local
  if (data_casamento !== undefined) upsertData.data_casamento = data_casamento || null
  if (fotografo !== undefined) upsertData.fotografo = newFoto
  if (videografo !== undefined) upsertData.videografo = newVideo
  if (editor_album !== undefined) upsertData.editor_album = editor_album
  if (editor_video !== undefined) upsertData.editor_video = editor_video
  if (editor_fotos !== undefined) upsertData.editor_fotos = editor_fotos

  let upsertError: any = null
  async function doSave(payload: any) {
    if (existing) {
      const key = existing.evento_id ? { evento_id: existing.evento_id } : { referencia: existing.referencia }
      const col = Object.keys(key)[0] as string
      const val = Object.values(key)[0] as string
      const { error } = await supabase.from('evento_equipa').update(payload).eq(col, val)
      return error
    } else {
      if (!payload.evento_id) payload.evento_id = `ref_${referencia}`
      const { error } = await supabase.from('evento_equipa').insert(payload)
      return error
    }
  }
  upsertError = await doSave(upsertData)
  // Retry sem colunas opcionais se falhar por coluna inexistente (editor_album/video/fotos como text[])
  if (upsertError && /column .* (editor_album|editor_video|editor_fotos)/i.test(upsertError.message ?? '')) {
    const { editor_album: _ea, editor_video: _ev, editor_fotos: _ef, ...core } = upsertData
    upsertError = await doSave(core)
  }

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

  // ── Sync freelancer_casamentos when fotografo changes ──────────────────────
  if (fotografo !== undefined) {
    const removed = oldFoto.filter(n => !newFoto.includes(n))
    const added   = newFoto.filter(n => !oldFoto.includes(n))

    // Buscar briefing_url existente para incluir em novos registos
    let existingBriefingUrl: string | null = null
    if (evento_id) {
      const { data: eq } = await supabase
        .from('evento_equipa').select('briefing_url').eq('evento_id', evento_id).maybeSingle()
      existingBriefingUrl = eq?.briefing_url ?? null
    }
    if (!existingBriefingUrl && referencia) {
      const { data: eq } = await supabase
        .from('evento_equipa').select('briefing_url').eq('referencia', referencia).maybeSingle()
      existingBriefingUrl = eq?.briefing_url ?? null
    }

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
            referencia: referencia ?? null,
            local: local ?? '',
            data_casamento: data_casamento || null,
            equipa_foto: newFoto,
            videografo: newVideo[0] ?? null,
            briefing_url: existingBriefingUrl,  // herda briefing já enviado
            order_index: 999,
          })
        } else {
          // ensure referencia is synced even on existing records
          if (referencia) {
            await supabase.from('freelancer_casamentos')
              .update({ referencia })
              .eq('freelancer_id', fl.id).eq('evento_id', evento_id)
          }
        }
      }
    }

    // Update equipa_foto and videografo on all casamentos tied to this event
    const { data: allC } = await supabase
      .from('freelancer_casamentos').select('id').eq('evento_id', evento_id)
    if (allC?.length) {
      for (const c of allC) {
        await supabase.from('freelancer_casamentos')
          .update({ equipa_foto: newFoto, videografo: newVideo[0] ?? null, ...(referencia ? { referencia } : {}) })
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
          // Buscar briefing_url existente para o videógrafo também herdar
          let vBriefingUrl: string | null = null
          if (evento_id) {
            const { data: eq } = await supabase
              .from('evento_equipa').select('briefing_url').eq('evento_id', evento_id).maybeSingle()
            vBriefingUrl = eq?.briefing_url ?? null
          }
          await supabase.from('freelancer_casamentos').insert({
            freelancer_id: newVfl.id,
            evento_id,
            referencia: referencia ?? null,
            local: local ?? '',
            data_casamento: data_casamento || null,
            equipa_foto: newFoto,
            videografo: newVideo[0],
            briefing_url: vBriefingUrl,  // herda briefing já enviado
            order_index: 999,
          })
        } else {
          // ensure referencia is synced on existing record
          if (referencia) {
            await supabase.from('freelancer_casamentos')
              .update({ referencia, equipa_foto: newFoto, videografo: newVideo[0] })
              .eq('freelancer_id', newVfl.id).eq('evento_id', evento_id)
          }
        }
      }
    }
  }

  // ── Notificações para membros recém-adicionados ─────────────────────
  // Por cada papel: encontra os nomes adicionados (diff old vs new) e cria
  // entrada em freelancer_notificacoes (sino do portal do freelancer).
  try {
    if (fotografo !== undefined) {
      const added = newFoto.filter(n => !oldFoto.includes(n))
      await notifyAddedMembers(supabase, added, 'Fotógrafo', local ?? null, data_casamento ?? null, referencia ?? null)
    }
    if (videografo !== undefined) {
      const added = newVideo.filter(n => !oldVideo.includes(n))
      await notifyAddedMembers(supabase, added, 'Videógrafo', local ?? null, data_casamento ?? null, referencia ?? null)
    }
    if (editor_fotos !== undefined) {
      const newEditorFotos: string[] = Array.isArray(editor_fotos) ? editor_fotos : (editor_fotos ? [editor_fotos] : [])
      const added = newEditorFotos.filter(n => !oldEditorFotos.includes(n))
      await notifyAddedMembers(supabase, added, 'Editor de Fotos', local ?? null, data_casamento ?? null, referencia ?? null)
    }
    if (editor_album !== undefined) {
      const newEditorAlbum: string[] = Array.isArray(editor_album) ? editor_album : (editor_album ? [editor_album] : [])
      const added = newEditorAlbum.filter(n => !oldEditorAlbum.includes(n))
      await notifyAddedMembers(supabase, added, 'Editor de Álbum', local ?? null, data_casamento ?? null, referencia ?? null)
    }
    if (editor_video !== undefined) {
      const newEditorVideo: string[] = Array.isArray(editor_video) ? editor_video : (editor_video ? [editor_video] : [])
      const added = newEditorVideo.filter(n => !oldEditorVideo.includes(n))
      await notifyAddedMembers(supabase, added, 'Editor de Vídeo', local ?? null, data_casamento ?? null, referencia ?? null)
    }
  } catch (err) {
    // Não falha o upsert se a tabela freelancer_notificacoes não existir
    console.error('[evento-equipa PATCH] notificacoes:', err)
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

  // Upsert evento_equipa com briefing_url (guarda sempre o URL)
  const upsertPayload: any = { briefing_url }
  if (resolvedEventoId) upsertPayload.evento_id = resolvedEventoId
  if (referencia)       upsertPayload.referencia = referencia

  if (resolvedEventoId) {
    await supabase.from('evento_equipa')
      .upsert(upsertPayload, { onConflict: 'evento_id' })
    // Atualizar por evento_id
    await supabase.from('freelancer_casamentos')
      .update({ briefing_url })
      .eq('evento_id', resolvedEventoId)
  }

  // Atualizar por referencia (o mais fiável — cobre registos criados pelo novo sistema)
  if (referencia) {
    await supabase.from('freelancer_casamentos')
      .update({ briefing_url })
      .eq('referencia', referencia)
  }

  // Atualizar por local + data (registos antigos do Notion sem referencia nem evento_id)
  if (local && data_casamento) {
    await supabase.from('freelancer_casamentos')
      .update({ briefing_url })
      .ilike('local', local)
      .eq('data_casamento', data_casamento)
  }

  // ── Briefing: NÃO enviar notificação nem email ──
  //    Por decisão do admin, "Enviar Briefing" apenas guarda o link
  //    (briefing_url em evento_equipa + freelancer_casamentos). O briefing
  //    fica visível na ficha do evento e no portal dos noivos, mas o
  //    freelancer já não recebe notificação no sino nem email.

  return NextResponse.json({ ok: true })
}

// Apaga o briefing (limpa briefing_url) na ficha do evento e nos casamentos
// dos freelancers — usado pelo botão "Apagar" na secção Briefing da ficha.
export async function DELETE(req: NextRequest) {
  const referencia = req.nextUrl.searchParams.get('ref')
  const evento_id  = req.nextUrl.searchParams.get('evento_id')

  if (!referencia && !evento_id) {
    return NextResponse.json({ error: 'ref or evento_id required' }, { status: 400 })
  }

  const supabase = db()

  // Resolve evento_id a partir da referência, se necessário
  let resolvedEventoId = evento_id ?? null
  if (!resolvedEventoId && referencia) {
    const { data: eq } = await supabase
      .from('evento_equipa')
      .select('evento_id')
      .eq('referencia', referencia)
      .maybeSingle()
    resolvedEventoId = eq?.evento_id ?? null
  }

  if (resolvedEventoId) {
    await supabase.from('evento_equipa')
      .update({ briefing_url: null })
      .eq('evento_id', resolvedEventoId)
    await supabase.from('freelancer_casamentos')
      .update({ briefing_url: null })
      .eq('evento_id', resolvedEventoId)
  }
  if (referencia) {
    await supabase.from('evento_equipa')
      .update({ briefing_url: null })
      .eq('referencia', referencia)
    await supabase.from('freelancer_casamentos')
      .update({ briefing_url: null })
      .eq('referencia', referencia)
  }

  return NextResponse.json({ ok: true })
}
