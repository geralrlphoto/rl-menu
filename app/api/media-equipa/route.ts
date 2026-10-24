import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'

// Equipa nomeada em cada projeto da RL PROD (só admin; o cliente nunca vê).
// Tabela media_equipa_projeto: projeto_ref, nome, funcao, contacto, notas.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ?projeto=REF → equipa do projeto + pessoas já usadas noutros projetos (sugestões)
export async function GET(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const projeto = (req.nextUrl.searchParams.get('projeto') ?? '').toUpperCase()

  const [{ data: equipa, error }, { data: todos }] = await Promise.all([
    supabase.from('media_equipa_projeto').select('id, nome, funcao, contacto, notas').eq('projeto_ref', projeto).order('criado_em'),
    supabase.from('media_equipa_projeto').select('nome, funcao, contacto').order('criado_em', { ascending: false }).limit(300),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Uma sugestão por nome (a mais recente)
  const vistos = new Set<string>()
  const pessoas = (todos ?? []).filter(p => {
    const k = p.nome.trim().toLowerCase()
    if (vistos.has(k)) return false
    vistos.add(k)
    return true
  })
  return NextResponse.json({ equipa: equipa ?? [], pessoas })
}

export async function POST(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const { projeto_ref, nome, funcao, contacto, notas } = await req.json()
  if (!projeto_ref || !String(nome ?? '').trim()) {
    return NextResponse.json({ error: 'Indica o nome da pessoa.' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('media_equipa_projeto')
    .insert({
      projeto_ref: String(projeto_ref).toUpperCase(),
      nome: String(nome).trim(),
      funcao: String(funcao ?? '').trim(),
      contacto: String(contacto ?? '').trim() || null,
      notas: String(notas ?? '').trim() || null,
    })
    .select('id, nome, funcao, contacto, notas')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, membro: data })
}

export async function DELETE(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 })
  const { error } = await supabase.from('media_equipa_projeto').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
