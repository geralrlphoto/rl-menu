import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { clienteAdmin } from '@/lib/podcast/dados'
import { gerarSlug } from '@/lib/podcast/tipos'

/* ============================================================
   POST /api/podcast-episodios/por-numero  { numero, titulo? }

   Devolve o episódio com aquele número, criando-o se ainda não
   existir. Serve o painel do plano: os 12 episódios estão escritos no
   design, mas o convidado e os potenciais precisam de uma linha na
   base de dados a que se agarrar. A linha nasce em rascunho, portanto
   não aparece publicamente.
   ============================================================ */

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado

  const body = await req.json().catch(() => ({} as any))
  const numero = Number(body.numero)
  if (!Number.isInteger(numero) || numero < 1) {
    return NextResponse.json({ error: 'numero inválido' }, { status: 400 })
  }

  const sb = clienteAdmin()

  const { data: existente, error } = await sb
    .from('podcast_episodios')
    .select('*')
    .eq('numero', numero)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (existente) return NextResponse.json({ episodio: existente, criado: false })

  const titulo = String(body.titulo ?? '').trim() || `Episódio ${numero}`
  const { data: novo, error: erroCriar } = await sb
    .from('podcast_episodios')
    .insert({
      numero,
      titulo,
      slug: gerarSlug(numero, titulo),
      descricao_curta: titulo,
      data_publicacao: new Date().toISOString(),
      estado: 'rascunho',
    })
    .select()
    .single()

  if (erroCriar) return NextResponse.json({ error: erroCriar.message }, { status: 500 })
  return NextResponse.json({ episodio: novo, criado: true })
}
