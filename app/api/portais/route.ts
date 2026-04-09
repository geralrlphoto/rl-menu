import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { referencia, noiva, noivo, data, local, valorFoto, valorVideo, valorExtras } = body
    if (!referencia) return NextResponse.json({ error: 'referencia required' }, { status: 400 })

    const db = supabase()
    const row = {
      referencia,
      noiva: noiva ?? null,
      noivo: noivo ?? null,
      data: data ?? null,
      data_formatada: formatDate(data),
      local: local ?? null,
      settings: {
        referencia,
        noiva: noiva ?? '',
        noivo: noivo ?? '',
        data: data ?? '',
        dataFormatada: formatDate(data),
        local: local ?? '',
        valorFoto: valorFoto ?? null,
        valorVideo: valorVideo ?? null,
        valorExtras: valorExtras ?? null,
        hiddenNav: [],
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

// PUT { photoSettings: { heroImageUrl?, galleryUrls?, subpageHeaderUrl? } }
// Sincroniza campos de foto em TODOS os portais
export async function PUT(req: NextRequest) {
  try {
    const { photoSettings } = await req.json()
    if (!photoSettings) return NextResponse.json({ error: 'photoSettings required' }, { status: 400 })
    const db = supabase()
    const { data: all, error: fetchErr } = await db.from('portais').select('referencia, settings')
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    for (const portal of (all ?? [])) {
      const newSettings = { ...(portal.settings ?? {}), ...photoSettings }
      await db.from('portais')
        .update({ settings: newSettings, updated_at: new Date().toISOString() })
        .ilike('referencia', portal.referencia)
    }
    return NextResponse.json({ ok: true, updated: all?.length ?? 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH { referencia, updates: { noiva?, noivo?, data?, local?, valorFoto?, valorVideo?, settings? } }
export async function PATCH(req: NextRequest) {
  try {
    const { referencia, updates } = await req.json()
    if (!referencia) return NextResponse.json({ error: 'referencia required' }, { status: 400 })

    const db = supabase()

    // Get current row
    const { data: current, error: fetchErr } = await db
      .from('portais').select('*').ilike('referencia', referencia).maybeSingle()
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    if (!current) return NextResponse.json({ found: false })

    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    const settingsPatch: Record<string, any> = { ...(current.settings ?? {}) }

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

    const { error } = await db.from('portais').update(patch).ilike('referencia', referencia)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
