import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ehAdmin, exigeAcessoRef } from '@/lib/api-guard'

export const dynamic = 'force-dynamic'

/* Chat do Atendimento (noivos ↔ staff RL), tabela noivos_chat. Só texto.
   Para poupar egress: sem polling; o cliente pede só as mensagens novas
   (?depois=<último id>) e apenas as colunas que mostra. */

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const COLUNAS = 'id,autor,staff_id,staff_nome,staff_funcao,texto,criado_em'

/** GET ?ref=CAS_xxx&depois=<id>: mensagens desta referência (as novas, se vier `depois`) */
export async function GET(req: NextRequest) {
  const ref = (req.nextUrl.searchParams.get('ref') ?? '').trim()
  if (!ref) return NextResponse.json({ error: 'ref em falta' }, { status: 400 })
  const negado = await exigeAcessoRef(req, ref)
  if (negado) return negado
  const depois = Number(req.nextUrl.searchParams.get('depois') ?? 0) || 0
  const { data, error } = await db().from('noivos_chat').select(COLUNAS)
    .ilike('referencia', ref).gt('id', depois).order('id', { ascending: true }).limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mensagens: data ?? [] })
}

/** POST { referencia, texto, staff_id? }: com staff_id fala a RL (só admin); sem ele, os noivos */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const referencia = String(body?.referencia ?? '').trim()
  const texto = String(body?.texto ?? '').trim().slice(0, 2000)
  const staffId = body?.staff_id ? String(body.staff_id) : null
  if (!referencia || !texto) return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
  const negado = await exigeAcessoRef(req, referencia)
  if (negado) return negado

  const sb = db()
  let linha: Record<string, unknown> = { referencia, autor: 'noivos', texto }
  if (staffId) {
    if (!ehAdmin(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    const { data: s } = await sb.from('staff').select('id,nome,funcao').eq('id', staffId).maybeSingle()
    if (!s) return NextResponse.json({ error: 'Membro do staff não encontrado' }, { status: 400 })
    linha = { referencia, autor: 'staff', staff_id: s.id, staff_nome: s.nome, staff_funcao: s.funcao, texto }
  }
  const { data, error } = await sb.from('noivos_chat').insert(linha).select(COLUNAS).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ mensagem: data })
}
