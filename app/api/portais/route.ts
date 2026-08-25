import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function formatDate(d: string | null | undefined): string {
  if (!d) return ''
  try {
    const dt = new Date(d + 'T00:00:00')
    return `${String(dt.getDate()).padStart(2,'0')} de ${MESES[dt.getMonth()]} de ${dt.getFullYear()}`
  } catch { return d }
}

function supabase() {
  return createClient(SUPABASE_URL, SUPABASE_KEY)
}

// GET ?ref=CAS_034_26_KP  → single portal
// GET (no ref)            → all portals
export async function GET(req: NextRequest) {
  const ref = req.nextUrl.searchParams.get('ref')
  const db = supabase()
  if (ref) {
    const { data, error } = await db.from('portais').select('*').ilike('referencia', ref).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (data?.settings) {
      const hasPassword = !!(data.settings.portalPassword)
      const settings = { ...data.settings }
      delete settings.portalPassword
      return NextResponse.json({ portal: { ...data, settings, hasPassword } })
    }
    return NextResponse.json({ portal: data })
  }
  // Modo leve: só os campos que os ecrãs admin (ex.: "Noivos online") precisam,
  // sem puxar o `settings` completo (blocos de conteúdo) de cada portal.
  // Poupa egress — o `select *` da tabela toda é a query mais pesada do projeto.
  if (req.nextUrl.searchParams.get('light')) {
    const { data, error } = await db
      .from('portais')
      .select('referencia, noiva, noivo, data, tipoPortal:settings->>tipoPortal, dataFormatada:settings->>dataFormatada')
      .order('referencia')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ portais: data ?? [] })
  }

  // Modo compacto: usado pela lista /eventos-2026 — só precisa de saber que
  // portais existem, se o backup foi confirmado e que ações de fotografia já
  // foram enviadas. Evita puxar o `settings` inteiro de cada portal.
  if (req.nextUrl.searchParams.get('compact')) {
    const { data, error } = await db
      .from('portais')
      .select('referencia, armazenamento_backup:settings->>armazenamento_backup, selecao_enviada:settings->>selecao_enviada, fotos_finais_enviada:settings->>fotos_finais_enviada, galerias_enviada:settings->>galerias_enviada')
      .order('referencia')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const portais = (data ?? []).map((p: any) => ({
      referencia: p.referencia,
      settings: {
        armazenamento_backup: p.armazenamento_backup,
        selecao_enviada:      p.selecao_enviada,
        fotos_finais_enviada: p.fotos_finais_enviada,
        galerias_enviada:     p.galerias_enviada,
      },
    }))
    return NextResponse.json({ portais })
  }

  const { data, error } = await db.from('portais').select('*').order('referencia')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const portais = (data ?? []).map(portal => {
    if (portal.settings) {
      const hasPassword = !!(portal.settings.portalPassword)
      const settings = { ...portal.settings }
      delete settings.portalPassword
      return { ...portal, settings, hasPassword }
    }
    return portal
  })
  return NextResponse.json({ portais })
}

// POST { referencia, noiva, noivo, data, local, valorFoto?, valorVideo?, valorExtras? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { referencia, noiva, noivo, data, local, valorFoto, valorVideo, valorExtras, tipoPortal } = body
    if (!referencia) return NextResponse.json({ error: 'referencia required' }, { status: 400 })

    const db = supabase()

    // Preserva as definições já existentes do portal (password, hiddenNav,
    // notificações, conteúdos, datas de entrega, etc.). Sem isto, (re)criar um
    // portal com este upsert apagava tudo — nomeadamente a password do portal,
    // que deixava de aparecer no login dos noivos e no card enviado ao cliente.
    const { data: existing } = await db
      .from('portais').select('settings').ilike('referencia', referencia).maybeSingle()
    const base = (existing?.settings ?? {}) as Record<string, any>

    const row = {
      referencia,
      noiva: noiva ?? null,
      noivo: noivo ?? null,
      data: data ?? null,
      data_formatada: formatDate(data),
      local: local ?? null,
      settings: {
        ...base, // mantém password e restantes definições já guardadas
        referencia,
        noiva: noiva ?? '',
        noivo: noivo ?? '',
        data: data ?? '',
        dataFormatada: formatDate(data),
        local: local ?? '',
        valorFoto: valorFoto ?? base.valorFoto ?? null,
        valorVideo: valorVideo ?? base.valorVideo ?? null,
        valorExtras: valorExtras ?? base.valorExtras ?? null,
        tipoPortal: tipoPortal ?? base.tipoPortal ?? 'casamento',
        hiddenNav: base.hiddenNav ?? [],
      },
      updated_at: new Date().toISOString(),
    }

    const { data: inserted, error } = await db
      .from('portais')
      .upsert(row, { onConflict: 'referencia' })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, portal: inserted })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// DELETE ?ref=CAS_034_26_KP  → eliminar portal definitivamente
export async function DELETE(req: NextRequest) {
  try {
    const ref = req.nextUrl.searchParams.get('ref')
    if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })
    const db = supabase()
    const { error } = await db.from('portais').delete().ilike('referencia', ref)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    // Repõe o estado "portal por criar": limpa a marca de criação do portal no
    // CPS (aprovado_em), mantendo a aprovação do contrato (contrato_aprovado_em).
    // Sem isto, a ficha continuava a achar o portal aprovado e escondia o botão
    // "Criar Portal", ficando sem forma de o recriar.
    await db.from('dados_contrato_cps').update({ aprovado_em: null }).ilike('referencia_evento', ref)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PUT { photoSettings: { heroImageUrl?, galleryUrls?, subpageHeaderUrl? }, tipoPortal?: 'casamento' | 'batizado' }
// Sincroniza campos de foto nos portais do tipo indicado (omitir = todos)
export async function PUT(req: NextRequest) {
  try {
    const { photoSettings, tipoPortal } = await req.json()
    if (!photoSettings) return NextResponse.json({ error: 'photoSettings required' }, { status: 400 })
    const db = supabase()
    const { data: all, error: fetchErr } = await db.from('portais').select('referencia, settings')
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    let updated = 0
    for (const portal of (all ?? [])) {
      // Filter by tipoPortal when specified
      if (tipoPortal) {
        const portalTipo = portal.settings?.tipoPortal ?? 'casamento'
        if (portalTipo !== tipoPortal) continue
      }
      const newSettings = { ...(portal.settings ?? {}), ...photoSettings }
      await db.from('portais')
        .update({ settings: newSettings, updated_at: new Date().toISOString() })
        .ilike('referencia', portal.referencia)
      updated++
    }
    return NextResponse.json({ ok: true, updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH { referencia, updates?: { noiva?, noivo?, data?, local?, valorFoto?, valorVideo?, settings? }, settings?: object }
// Also accepts top-level `settings` to replace full settings object directly
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { referencia, updates: _updates, settings: topSettings } = body
    // Allow passing settings directly at top level (shorthand for updates.settings)
    const updates = _updates ?? (topSettings ? { settings: topSettings } : {})
    if (!referencia) return NextResponse.json({ error: 'referencia required' }, { status: 400 })

    const db = supabase()

    // Get current row (may not exist for references without portal yet)
    const { data: current, error: fetchErr } = await db
      .from('portais').select('*').ilike('referencia', referencia).maybeSingle()
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })

    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    const settingsPatch: Record<string, any> = { ...(current?.settings ?? {}) }

    if (updates.noiva !== undefined) { patch.noiva = updates.noiva; settingsPatch.noiva = updates.noiva }
    if (updates.noivo !== undefined) { patch.noivo = updates.noivo; settingsPatch.noivo = updates.noivo }
    if (updates.data !== undefined) {
      patch.data = updates.data
      patch.data_formatada = formatDate(updates.data)
      settingsPatch.data = updates.data
      settingsPatch.dataFormatada = formatDate(updates.data)
    }
    if (updates.local !== undefined) { patch.local = updates.local; settingsPatch.local = updates.local }
    if (updates.valorFoto !== undefined) settingsPatch.valorFoto = updates.valorFoto
    if (updates.valorVideo !== undefined) settingsPatch.valorVideo = updates.valorVideo
    if (updates.valorExtras !== undefined) settingsPatch.valorExtras = updates.valorExtras
    if (updates.settings !== undefined) Object.assign(settingsPatch, updates.settings)

    patch.settings = settingsPatch

    if (current) {
      // Update existing row
      const { error } = await db.from('portais').update(patch).ilike('referencia', referencia)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      // No portal yet — create minimal row so settings can be stored
      const { error } = await db.from('portais').insert({ referencia, ...patch })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
