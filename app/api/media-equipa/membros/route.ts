import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'
import { CATEGORIAS } from '@/app/media/equipa/categorias'

// Equipa fixa da RL PROD (tabela media_equipa), só admin.
// GET devolve os membros e quantos projetos cada um tem (media_equipa_projeto).

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CAMPOS = 'id, nome, categoria, telefone, email, instagram, notas, ativo'
const ok = (c: unknown) => CATEGORIAS.some(x => x.id === c)
const limpo = (v: unknown) => String(v ?? '').trim() || null

export async function GET(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio

  // ?id= → ficha completa de um membro, com os projetos onde foi nomeado
  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    const [{ data: membro, error }, { data: ligacoes }] = await Promise.all([
      supabase.from('media_equipa').select(`${CAMPOS}, foto_url, dados, criado_em`).eq('id', id).single(),
      supabase.from('media_equipa_projeto').select('projeto_ref, funcao, criado_em').eq('membro_id', id).order('criado_em', { ascending: false }),
    ])
    if (error || !membro) return NextResponse.json({ error: 'Membro não encontrado.' }, { status: 404 })
    const refs = [...new Set((ligacoes ?? []).map(l => l.projeto_ref))]
    const { data: portais } = refs.length
      ? await supabase.from('media_portais').select('ref, nome:dados->>nome, filmagem:dados->>dataFilmagem, status:dados->>status').in('ref', refs)
      : { data: [] as { ref: string; nome: string | null; filmagem: string | null; status: string | null }[] }
    const projetos = (ligacoes ?? []).map(l => {
      const p = (portais ?? []).find(x => x.ref === l.projeto_ref)
      return { ref: l.projeto_ref, funcao: l.funcao, nome: p?.nome ?? l.projeto_ref, filmagem: p?.filmagem ?? null, status: p?.status ?? null }
    })
    return NextResponse.json({ membro: { ...membro, projetos } })
  }

  const [{ data: membros, error }, { data: ligacoes }] = await Promise.all([
    supabase.from('media_equipa').select(`${CAMPOS}, foto_url`).order('nome'),
    supabase.from('media_equipa_projeto').select('membro_id, projeto_ref').not('membro_id', 'is', null),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const projetos: Record<string, string[]> = {}
  for (const l of ligacoes ?? []) {
    const lista = (projetos[l.membro_id] ??= [])
    if (!lista.includes(l.projeto_ref)) lista.push(l.projeto_ref)
  }
  return NextResponse.json({ membros: (membros ?? []).map(m => ({ ...m, projetos: projetos[m.id] ?? [] })) })
}

export async function POST(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const b = await req.json()
  if (!limpo(b.nome)) return NextResponse.json({ error: 'Indica o nome.' }, { status: 400 })
  if (!ok(b.categoria)) return NextResponse.json({ error: 'Escolhe a categoria.' }, { status: 400 })
  const { data, error } = await supabase.from('media_equipa')
    .insert({ nome: limpo(b.nome), categoria: b.categoria, telefone: limpo(b.telefone), email: limpo(b.email), instagram: limpo(b.instagram), notas: limpo(b.notas) })
    .select(CAMPOS).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, membro: { ...data, projetos: [] } })
}

export async function PATCH(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const b = await req.json()
  if (!b.id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 })
  const alt: Record<string, unknown> = {}
  if ('nome' in b) { if (!limpo(b.nome)) return NextResponse.json({ error: 'Indica o nome.' }, { status: 400 }); alt.nome = limpo(b.nome) }
  if ('categoria' in b) { if (!ok(b.categoria)) return NextResponse.json({ error: 'Categoria inválida.' }, { status: 400 }); alt.categoria = b.categoria }
  for (const k of ['telefone', 'email', 'instagram', 'notas']) if (k in b) alt[k] = limpo(b[k])
  if ('ativo' in b) alt.ativo = !!b.ativo
  if ('foto_url' in b) alt.foto_url = limpo(b.foto_url)
  if ('dados' in b && b.dados && typeof b.dados === 'object') alt.dados = b.dados
  const { data, error } = await supabase.from('media_equipa').update(alt).eq('id', b.id).select(`${CAMPOS}, foto_url, dados, criado_em`).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, membro: data })
}

export async function DELETE(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 })
  const { error } = await supabase.from('media_equipa').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
