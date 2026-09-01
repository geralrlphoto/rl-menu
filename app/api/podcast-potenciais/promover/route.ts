import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { clienteAdmin } from '@/lib/podcast/dados'

/* ============================================================
   POST /api/podcast-potenciais/promover  { id }

   Alguém que aceitou deixa de ser um potencial: passa a ser o
   convidado do episódio. Leva consigo o que já tinhas escrito, o
   nome, a empresa e os contactos, e as notas passam a notas internas
   da ficha. A linha antiga é apagada, para não ficar em dois sítios.
   ============================================================ */

export const dynamic = 'force-dynamic'

function gerarSlug(nome: string): string {
  return (nome ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 60) || `convidado-${Date.now()}`
}

export async function POST(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const { id } = await req.json().catch(() => ({} as any))
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })

  const sb = clienteAdmin()

  const { data: potencial, error } = await sb
    .from('podcast_potenciais')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!potencial) return NextResponse.json({ error: 'não encontrado' }, { status: 404 })

  let slug = gerarSlug(potencial.nome)
  const { data: existe } = await sb.from('podcast_convidados').select('id').eq('slug', slug).maybeSingle()
  if (existe) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

  const { data: convidado, error: erroCriar } = await sb
    .from('podcast_convidados')
    .insert({
      nome: potencial.nome,
      slug,
      empresa: potencial.empresa,
      email: potencial.email,
      telefone: potencial.contacto,
      instagram: potencial.instagram,
      notas: potencial.notas,
    })
    .select()
    .single()

  if (erroCriar) return NextResponse.json({ error: erroCriar.message }, { status: 500 })

  const { count } = await sb
    .from('podcast_episodio_convidados')
    .select('*', { count: 'exact', head: true })
    .eq('episodio_id', potencial.episodio_id)

  const { error: erroLigacao } = await sb
    .from('podcast_episodio_convidados')
    .insert({
      episodio_id: potencial.episodio_id,
      convidado_id: convidado.id,
      ordem: (count ?? 0) + 1,
    })

  if (erroLigacao) {
    // Sem ligação o convidado ficaria órfão: desfaz-se para não deixar lixo.
    await sb.from('podcast_convidados').delete().eq('id', convidado.id)
    return NextResponse.json({ error: erroLigacao.message }, { status: 500 })
  }

  await sb.from('podcast_potenciais').delete().eq('id', id)

  return NextResponse.json({ ok: true, convidado })
}
