import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

/* ============================================================
   /api/podcast-episodios
   Episódios do podcast "Antes do Sim". É back-office: só admin.
   ============================================================ */

export const dynamic = 'force-dynamic'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const ESTADOS = ['ideia', 'guião', 'gravado', 'editado', 'publicado'] as const

const CAMPOS = ['numero', 'titulo', 'tema', 'convidado', 'notas', 'estado', 'link', 'data_publicacao'] as const

/** Aceita só os campos conhecidos e normaliza vazios para null. */
function limpar(body: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const k of CAMPOS) {
    if (body[k] === undefined) continue
    const v = body[k]
    if (k === 'numero') { out[k] = v === '' || v === null ? null : Number(v); continue }
    if (typeof v === 'string') { out[k] = v.trim() === '' ? null : v.trim(); continue }
    out[k] = v
  }
  return out
}

// GET → todos os episódios, do mais recente para o mais antigo
export async function GET(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const { data, error } = await supabase()
    .from('podcast_episodios')
    .select('*')
    .order('numero', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ episodios: data ?? [] })
}

// POST { titulo, ... } → cria um episódio
export async function POST(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const body = await req.json().catch(() => ({}))
  const campos = limpar(body)
  if (!campos.titulo) return NextResponse.json({ error: 'titulo obrigatório' }, { status: 400 })

  // Número seguinte, quando não vem indicado.
  if (campos.numero == null) {
    const { data: ultimo } = await supabase()
      .from('podcast_episodios')
      .select('numero')
      .order('numero', { ascending: false, nullsFirst: false })
      .limit(1)
      .maybeSingle()
    campos.numero = (ultimo?.numero ?? 0) + 1
  }

  const { data, error } = await supabase()
    .from('podcast_episodios')
    .insert(campos)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, episodio: data })
}

// PATCH { id, ...campos } → altera um episódio
export async function PATCH(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const body = await req.json().catch(() => ({}))
  const id = body.id
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const campos = limpar(body)
  if (campos.estado && !(ESTADOS as readonly string[]).includes(campos.estado)) {
    return NextResponse.json({ error: 'estado inválido' }, { status: 400 })
  }
  if (Object.keys(campos).length === 0) return NextResponse.json({ ok: true, ignorado: true })

  const { data, error } = await supabase()
    .from('podcast_episodios')
    .update({ ...campos, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, episodio: data })
}

// DELETE ?id=… → elimina um episódio
export async function DELETE(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await supabase().from('podcast_episodios').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
