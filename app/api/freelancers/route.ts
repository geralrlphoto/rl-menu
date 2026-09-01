import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ehAdmin, sessaoMembro, exigeAdmin, exigeAdminOuProprio, apenasCamposPublicos, CAMPOS_PROPRIOS } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

function supabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// GET — admin vê tudo; um membro vê os campos públicos dos colegas (para
// listas) e a sua própria ficha sem a password. Sem sessão não vê nada: esta
// rota devolvia a equipa inteira COM as passwords a quem soubesse o URL.
export async function GET(req: NextRequest) {
  const admin = ehAdmin(req)
  const sessao = admin ? null : await sessaoMembro(req)
  if (!admin && !sessao) return NextResponse.json({ error: 'nao_autorizado' }, { status: 401 })

  const { data, error } = await supabase()
    .from('freelancers')
    .select('*')
    .order('order_index')
    .order('nome')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (admin) return NextResponse.json({ freelancers: data ?? [] })

  const freelancers = (data ?? []).map((f: any) => {
    if (f.id !== sessao!.id) return apenasCamposPublicos(f)
    const { password: _pw, ...resto } = f
    return resto
  })
  return NextResponse.json({ freelancers })
}

// Criar membros é do admin.
export async function POST(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado
  const body = await req.json()
  const { nome, status, contato, email, nome_sos, contato_sos, order_index } = body
  if (!nome) return NextResponse.json({ error: 'nome required' }, { status: 400 })
  const { data, error } = await supabase()
    .from('freelancers')
    .insert({ nome, status: status ?? null, contato: contato ?? null, email: email ?? null, nome_sos: nome_sos ?? null, contato_sos: contato_sos ?? null, order_index: order_index ?? 0, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, freelancer: data })
}

// PATCH — admin altera tudo; o membro só a sua própria ficha e só os campos
// de identidade (nome, email, contacto, foto, perfil). Nunca a password nem o
// estado, e nunca a ficha de outra pessoa.
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = ehAdmin(req)
  if (!admin) {
    const barrado = await exigeAdminOuProprio(req, id)
    if (barrado) return barrado
    for (const k of Object.keys(fields)) {
      if (!(CAMPOS_PROPRIOS as readonly string[]).includes(k)) {
        return NextResponse.json({ error: `campo nao permitido: ${k}` }, { status: 403 })
      }
    }
  }

  const { error } = await supabase()
    .from('freelancers')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// Apagar membros é do admin.
export async function DELETE(req: NextRequest) {
  const barrado = exigeAdmin(req)
  if (barrado) return barrado
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabase().from('freelancers').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
