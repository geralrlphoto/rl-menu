import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { clienteAdmin } from '@/lib/podcast/dados'

/* ============================================================
   /api/podcast-potenciais
   Lista de quem podes convidar para um episódio. Só admin.

   Não confundir com podcast_candidaturas, que é quem se propõe
   sozinho pelo formulário público. Esta lista és tu a fazê-la.
   ============================================================ */

export const dynamic = 'force-dynamic'

const ESTADOS = ['a contactar', 'contactado', 'aceitou', 'recusou']
const CAMPOS = ['nome', 'empresa', 'contacto', 'notas', 'estado', 'ordem'] as const

function limpar(body: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const k of CAMPOS) {
    if (body[k] === undefined) continue
    const v = body[k]
    if (k === 'ordem') { out[k] = Number(v) || 1; continue }
    out[k] = typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v
  }
  return out
}

// GET ?episodio=<id>
export async function GET(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const episodio = new URL(req.url).searchParams.get('episodio')
  if (!episodio) return NextResponse.json({ error: 'episodio obrigatório' }, { status: 400 })

  const { data, error } = await clienteAdmin()
    .from('podcast_potenciais')
    .select('*')
    .eq('episodio_id', episodio)
    .order('ordem')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ potenciais: data ?? [] })
}

// POST { episodio, nome, ... }
export async function POST(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const body = await req.json().catch(() => ({}))
  const episodio = body.episodio
  const campos = limpar(body)
  if (!episodio) return NextResponse.json({ error: 'episodio obrigatório' }, { status: 400 })
  if (!campos.nome) return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 })
  if (campos.estado && !ESTADOS.includes(campos.estado)) {
    return NextResponse.json({ error: 'estado inválido' }, { status: 400 })
  }

  const sb = clienteAdmin()
  const { count } = await sb
    .from('podcast_potenciais')
    .select('*', { count: 'exact', head: true })
    .eq('episodio_id', episodio)

  const { data, error } = await sb
    .from('podcast_potenciais')
    .insert({ ...campos, episodio_id: episodio, ordem: campos.ordem ?? (count ?? 0) + 1 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, potencial: data })
}

// PATCH { id, ...campos }
export async function PATCH(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const body = await req.json().catch(() => ({}))
  if (!body.id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const campos = limpar(body)
  if (campos.estado && !ESTADOS.includes(campos.estado)) {
    return NextResponse.json({ error: 'estado inválido' }, { status: 400 })
  }
  if (Object.keys(campos).length === 0) return NextResponse.json({ ok: true, ignorado: true })

  const { data, error } = await clienteAdmin()
    .from('podcast_potenciais')
    .update(campos)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, potencial: data })
}

// DELETE ?id=…
export async function DELETE(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await clienteAdmin().from('podcast_potenciais').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
