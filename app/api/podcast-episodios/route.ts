import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { clienteAdmin } from '@/lib/podcast/dados'
import { gerarSlug } from '@/lib/podcast/tipos'

/* ============================================================
   /api/podcast-episodios
   Gestão dos episódios a partir do back-office. Só admin.

   Escreve com a service role de propósito: a área de administração
   precisa de ver e mexer nos rascunhos, que o RLS esconde de toda
   a gente.
   ============================================================ */

export const dynamic = 'force-dynamic'

const CAMPOS = [
  'numero', 'temporada', 'slug', 'titulo', 'subtitulo', 'descricao_curta',
  'notas_md', 'guiao_md', 'duracao_segundos', 'data_publicacao', 'estado', 'capa_url',
  'youtube_id', 'spotify_url', 'apple_url', 'audio_url', 'transcricao',
  'gravacao_data', 'gravacao_hora', 'gravacao_local',
] as const

const ESTADOS = ['rascunho', 'agendado', 'publicado']

function limpar(body: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const k of CAMPOS) {
    if (body[k] === undefined) continue
    const v = body[k]
    if (k === 'numero' || k === 'temporada' || k === 'duracao_segundos') {
      out[k] = v === '' || v === null ? null : Number(v)
      continue
    }
    if (typeof v === 'string') { out[k] = v.trim() === '' ? null : v.trim(); continue }
    out[k] = v
  }
  return out
}

// GET → todos os episódios, incluindo rascunhos
export async function GET(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const { data, error } = await clienteAdmin()
    .from('podcast_episodios')
    .select('*')
    .order('numero', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ episodios: data ?? [] })
}

// POST → cria um episódio; o slug é gerado do número e do título
export async function POST(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const body = await req.json().catch(() => ({}))
  const campos = limpar(body)
  if (!campos.titulo) return NextResponse.json({ error: 'titulo obrigatório' }, { status: 400 })

  const sb = clienteAdmin()

  if (campos.numero == null) {
    const { data: ultimo } = await sb
      .from('podcast_episodios')
      .select('numero')
      .order('numero', { ascending: false })
      .limit(1)
      .maybeSingle()
    campos.numero = (ultimo?.numero ?? 0) + 1
  }

  if (!campos.slug) campos.slug = gerarSlug(campos.numero, campos.titulo)
  if (!campos.descricao_curta) campos.descricao_curta = campos.titulo
  if (!campos.data_publicacao) campos.data_publicacao = new Date().toISOString()
  if (!campos.estado) campos.estado = 'rascunho'

  const { data, error } = await sb.from('podcast_episodios').insert(campos).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, episodio: data })
}

// PATCH → altera um episódio. O slug não muda depois de publicado.
export async function PATCH(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const body = await req.json().catch(() => ({}))
  const id = body.id
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const campos = limpar(body)
  if (campos.estado && !ESTADOS.includes(campos.estado)) {
    return NextResponse.json({ error: 'estado inválido' }, { status: 400 })
  }
  if (Object.keys(campos).length === 0) return NextResponse.json({ ok: true, ignorado: true })

  const sb = clienteAdmin()

  if (campos.slug !== undefined) {
    const { data: atual } = await sb
      .from('podcast_episodios').select('estado').eq('id', id).maybeSingle()
    if (atual?.estado === 'publicado') {
      return NextResponse.json(
        { error: 'o endereço de um episódio publicado não pode mudar' },
        { status: 409 },
      )
    }
  }

  const { data, error } = await sb
    .from('podcast_episodios')
    .update({ ...campos, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, episodio: data })
}

// DELETE ?id=… → elimina um episódio (capítulos e ligações caem com ele)
export async function DELETE(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const { error } = await clienteAdmin().from('podcast_episodios').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
