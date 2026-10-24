import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exigeAdmin } from '@/lib/api-guard'
import { singular } from '@/app/media/equipa/categorias'
import { contasPagamento } from '@/app/portal-media/_data/contasPagamento'
import { lerData, chaveDia, hojeLisboa } from '@/app/media/_lib/eventos'

// Equipa nomeada em cada projeto da RL PROD (só admin; o cliente nunca vê).
// Tabela media_equipa_projeto: projeto_ref, nome, funcao, contacto, notas,
// valor (pago à pessoa por este trabalho), pago, despesa_id.
// O valor entra sozinho como despesa do projeto (media_despesas, categoria "equipa"),
// por isso aparece no Financeiro do portal e em /media/financas.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const CAMPOS = 'id, nome, funcao, contacto, notas, membro_id, valor, pago, pago_em, despesa_id'
const num = (v: unknown) => { const n = Number(String(v ?? '').replace(',', '.')); return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0 }

// Data da despesa: dia da filmagem do projeto (ou hoje, se não houver)
async function dataDoProjeto(ref: string) {
  const { data } = await supabase.from('media_portais').select('filmagem:dados->>dataFilmagem').eq('ref', ref).maybeSingle()
  const d = lerData((data as { filmagem?: string } | null)?.filmagem)
  return chaveDia(d ?? hojeLisboa())
}

// Cria, atualiza ou apaga a despesa ligada a uma pessoa da equipa do projeto
async function sincronizarDespesa(linha: { id: string; nome: string; funcao: string; valor: number; pago: boolean; despesa_id: string | null }, ref: string) {
  const descricao = `Equipa · ${linha.nome}${linha.funcao ? ` (${linha.funcao})` : ''}`
  const notas = linha.pago ? 'Equipa do projeto · pago' : 'Equipa do projeto · por pagar'

  if (linha.valor <= 0) {
    if (linha.despesa_id) await supabase.from('media_despesas').delete().eq('id', linha.despesa_id)
    if (linha.despesa_id) await supabase.from('media_equipa_projeto').update({ despesa_id: null }).eq('id', linha.id)
    return null
  }
  if (linha.despesa_id) {
    const { data } = await supabase.from('media_despesas').update({ valor: linha.valor, descricao, notas }).eq('id', linha.despesa_id).select('id')
    if (data && data.length) return linha.despesa_id
  }
  // Não havia despesa (ou foi apagada nas Finanças): cria uma nova
  const { data: nova } = await supabase.from('media_despesas')
    .insert({ tipo: 'despesa', categoria: 'equipa', data: await dataDoProjeto(ref), descricao, valor: linha.valor, projeto_ref: ref, notas })
    .select('id').single()
  if (nova) await supabase.from('media_equipa_projeto').update({ despesa_id: nova.id }).eq('id', linha.id)
  return nova?.id ?? null
}

// ?projeto=REF → equipa do projeto, o staff ativo da RL PROD e as contas do projeto
export async function GET(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const projeto = (req.nextUrl.searchParams.get('projeto') ?? '').toUpperCase()

  const [{ data: equipa, error }, { data: membros }, { data: portal }, { data: movs }] = await Promise.all([
    supabase.from('media_equipa_projeto').select(CAMPOS).eq('projeto_ref', projeto).order('criado_em'),
    supabase.from('media_equipa').select('id, nome, categoria, telefone, email, foto_url, valorDia:dados->>valorDia').eq('ativo', true).order('nome'),
    supabase.from('media_portais').select('pagamentos:dados->pagamentos, registosPagamento:dados->registosPagamento').eq('ref', projeto).maybeSingle(),
    supabase.from('media_despesas').select('id, tipo, valor').eq('projeto_ref', projeto),
  ])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Staff da RL PROD, para nomear com um clique
  const pessoas = (membros ?? []).map(m => ({
    id: m.id, nome: m.nome, categoria: m.categoria, funcao: singular(m.categoria),
    contacto: m.telefone || m.email || null, foto_url: m.foto_url, valorDia: num(m.valorDia),
  }))

  // Contas do projeto: valor do contrato, recebido, custo da equipa, outras despesas
  const p = (portal ?? {}) as { pagamentos?: never[]; registosPagamento?: never[] }
  const contas = contasPagamento({ pagamentos: p.pagamentos ?? [], registosPagamento: p.registosPagamento ?? [] })
  const idsEquipa = new Set((equipa ?? []).map(e => e.despesa_id).filter(Boolean))
  const custoEquipa = (equipa ?? []).reduce((s, e) => s + Number(e.valor || 0), 0)
  const outrasDespesas = (movs ?? []).filter(m => m.tipo !== 'receita' && !idsEquipa.has(m.id)).reduce((s, m) => s + Number(m.valor), 0)
  const receitasExtra = (movs ?? []).filter(m => m.tipo === 'receita').reduce((s, m) => s + Number(m.valor), 0)
  const financeiro = {
    valorProjeto: contas.total, recebido: contas.pago, receitasExtra,
    custoEquipa, outrasDespesas, custoTotal: custoEquipa + outrasDespesas,
  }

  return NextResponse.json({ equipa: equipa ?? [], pessoas, financeiro })
}

export async function POST(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const { projeto_ref, nome, funcao, contacto, notas, membro_id, valor } = await req.json()
  if (!projeto_ref || !String(nome ?? '').trim()) {
    return NextResponse.json({ error: 'Indica o nome da pessoa.' }, { status: 400 })
  }
  const ref = String(projeto_ref).toUpperCase()
  const { data, error } = await supabase
    .from('media_equipa_projeto')
    .insert({
      projeto_ref: ref,
      nome: String(nome).trim(),
      funcao: String(funcao ?? '').trim(),
      contacto: String(contacto ?? '').trim() || null,
      notas: String(notas ?? '').trim() || null,
      membro_id: membro_id || null,
      valor: num(valor),
    })
    .select(CAMPOS)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const despesa_id = await sincronizarDespesa({ ...data, valor: Number(data.valor) }, ref)
  return NextResponse.json({ ok: true, membro: { ...data, despesa_id } })
}

// Muda o valor do trabalho e/ou se já foi pago; a despesa acompanha
export async function PATCH(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const b = await req.json()
  if (!b.id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 })
  const alt: Record<string, unknown> = {}
  if ('valor' in b) alt.valor = num(b.valor)
  if ('pago' in b) { alt.pago = !!b.pago; alt.pago_em = b.pago ? chaveDia(hojeLisboa()) : null }
  if ('funcao' in b) alt.funcao = String(b.funcao ?? '').trim()
  if ('notas' in b) alt.notas = String(b.notas ?? '').trim() || null
  const { data, error } = await supabase.from('media_equipa_projeto').update(alt).eq('id', b.id).select(`${CAMPOS}, projeto_ref`).single()
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Não encontrado.' }, { status: 500 })
  const despesa_id = await sincronizarDespesa({ ...data, valor: Number(data.valor) }, data.projeto_ref)
  return NextResponse.json({ ok: true, membro: { ...data, despesa_id } })
}

export async function DELETE(req: NextRequest) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta o id.' }, { status: 400 })
  const { data: linha } = await supabase.from('media_equipa_projeto').select('despesa_id').eq('id', id).maybeSingle()
  const { error } = await supabase.from('media_equipa_projeto').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Sai do projeto: a despesa automática sai com ele
  if (linha?.despesa_id) await supabase.from('media_despesas').delete().eq('id', linha.despesa_id)
  return NextResponse.json({ ok: true })
}
