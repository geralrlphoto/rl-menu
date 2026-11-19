import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { clienteAdmin } from '@/lib/podcast/dados'

/* ============================================================
   /api/podcast-convites
   Convites pessoais do podcast: cada pessoa tem um link secreto
   (/podcast/convite/<token>) com o convite feito para ela.
   Gestão só admin. A resposta da pessoa entra por
   /api/podcast/convite (pública).
   ============================================================ */

export const dynamic = 'force-dynamic'

const CAMPOS = ['nome', 'marca', 'telefone', 'email', 'nota', 'gravacao_data', 'gravacao_hora', 'gravacao_local', 'convidado_id', 'resposta'] as const

function limpar(body: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const k of CAMPOS) {
    if (body[k] === undefined) continue
    const v = body[k]
    out[k] = typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v
  }
  if (out.resposta !== undefined && out.resposta !== null && !['aceitou', 'recusou'].includes(out.resposta)) delete out.resposta
  return out
}

const SELECT = 'id, token, episodio_id, nome, marca, telefone, email, nota, gravacao_data, gravacao_hora, gravacao_local, convidado_id, visto_em, resposta, resposta_em, created_at'

// POST { episodio, nome, telefone?, email?, nota? } → cria o convite
export async function POST(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado
  const body = await req.json().catch(() => ({}))
  const campos = limpar(body)
  if (!body.episodio) return NextResponse.json({ error: 'episodio obrigatório' }, { status: 400 })
  if (!campos.nome) return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 })
  const { data, error } = await clienteAdmin()
    .from('podcast_convites').insert({ ...campos, episodio_id: body.episodio }).select(SELECT).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, convite: data })
}

// PATCH { id, ...campos }
export async function PATCH(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado
  const body = await req.json().catch(() => ({}))
  if (!body.id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const campos = limpar(body)
  if ('resposta' in campos) campos.resposta_em = campos.resposta ? new Date().toISOString() : null
  const { data, error } = await clienteAdmin()
    .from('podcast_convites').update(campos).eq('id', body.id).select(SELECT).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, convite: data })
}

// DELETE ?id=<id>
export async function DELETE(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const { error } = await clienteAdmin().from('podcast_convites').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
