import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { clienteAdmin } from '@/lib/podcast/dados'

/* ============================================================
   /api/podcast-convidados
   Ficha do convidado de um episódio. Só admin.

   Um convidado é uma linha em podcast_convidados, ligada ao episódio
   por podcast_episodio_convidados. Um episódio pode ter mais do que um
   (o episódio dos casais, por exemplo).
   ============================================================ */

export const dynamic = 'force-dynamic'

const CAMPOS = ['nome', 'email', 'telefone', 'instagram', 'profissao', 'empresa', 'bio', 'notas', 'foto_url', 'website'] as const

function limpar(body: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const k of CAMPOS) {
    if (body[k] === undefined) continue
    const v = body[k]
    out[k] = typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v
  }
  return out
}

/** "Ana Mendes" → "ana-mendes". O slug identifica o convidado no URL. */
function gerarSlug(nome: string): string {
  return (nome ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60) || `convidado-${Date.now()}`
}

// GET ?episodio=<id> → convidados ligados a esse episódio
export async function GET(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const episodio = new URL(req.url).searchParams.get('episodio')
  if (!episodio) return NextResponse.json({ error: 'episodio obrigatório' }, { status: 400 })

  const { data, error } = await clienteAdmin()
    .from('podcast_episodio_convidados')
    .select('ordem, podcast_convidados (*)')
    .eq('episodio_id', episodio)
    .order('ordem')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const convidados = (data ?? []).map((l: any) => l.podcast_convidados).filter(Boolean)
  return NextResponse.json({ convidados })
}

// POST { episodio, nome, ... } → cria a ficha e liga-a ao episódio
export async function POST(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const body = await req.json().catch(() => ({}))
  const episodio = body.episodio
  const campos = limpar(body)
  if (!episodio) return NextResponse.json({ error: 'episodio obrigatório' }, { status: 400 })
  if (!campos.nome) return NextResponse.json({ error: 'nome obrigatório' }, { status: 400 })

  const sb = clienteAdmin()

  // O slug é único: se já existir, junta-se um sufixo.
  let slug = gerarSlug(campos.nome)
  const { data: existe } = await sb.from('podcast_convidados').select('id').eq('slug', slug).maybeSingle()
  if (existe) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

  const { data: convidado, error } = await sb
    .from('podcast_convidados')
    .insert({ ...campos, slug })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { count } = await sb
    .from('podcast_episodio_convidados')
    .select('*', { count: 'exact', head: true })
    .eq('episodio_id', episodio)

  const { error: erroLigacao } = await sb
    .from('podcast_episodio_convidados')
    .insert({ episodio_id: episodio, convidado_id: convidado.id, ordem: (count ?? 0) + 1 })
  if (erroLigacao) return NextResponse.json({ error: erroLigacao.message }, { status: 500 })

  return NextResponse.json({ ok: true, convidado })
}

// PATCH { id, ...campos } → altera a ficha
export async function PATCH(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const body = await req.json().catch(() => ({}))
  if (!body.id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const campos = limpar(body)
  if (Object.keys(campos).length === 0) return NextResponse.json({ ok: true, ignorado: true })

  const { data, error } = await clienteAdmin()
    .from('podcast_convidados')
    .update(campos)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, convidado: data })
}

// DELETE ?id=… → apaga a ficha (a ligação ao episódio cai com ela)
export async function DELETE(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await clienteAdmin().from('podcast_convidados').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
