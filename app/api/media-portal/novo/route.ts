import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_FASES = [
  { id: 'primeiro-contato',  nome: 'Primeiro Contato',                       descricao: 'Quando nos contactas e falamos pela primeira vez.',                                        estado: 'concluido', data: '' },
  { id: 'briefing-inicial',  nome: 'Briefing Inicial',                        descricao: 'Recolha das informações essenciais sobre o projeto.',                                      estado: 'concluido', data: '' },
  { id: 'proposta-base',     nome: 'Proposta Base',                           descricao: 'Elaboração da proposta com base no briefing.',                                             estado: 'concluido', data: '' },
  { id: 'adjudicacao',       nome: 'Adjudicação',                             descricao: 'Confirmação e início do processo.',                                                         estado: 'concluido', data: '' },
  { id: 'elaboracao-cps',    nome: 'Elaboração do CPS',                       descricao: 'Recolha de dados para o contrato de prestação de serviços.',                              estado: 'em_curso',  data: '' },
  { id: 'briefing-completo', nome: 'Briefing Completo',                       descricao: 'Briefing detalhado com todos os requisitos do projeto.',                                   estado: 'pendente',  data: '' },
  { id: 'cps',               nome: 'CPS — Contrato de Prestação de Serviços', descricao: 'Contrato a assinar e devolver.',                                                           estado: 'pendente',  data: '' },
  { id: 'planeamento',       nome: 'Planeamento',                             descricao: 'Definição do calendário e logística.',                                                      estado: 'pendente',  data: '' },
  { id: 'producao',          nome: 'Produção',                                descricao: 'Captação de conteúdo no terreno.',                                                          estado: 'pendente',  data: '' },
  { id: 'pos-producao',      nome: 'Pós-Produção',                            descricao: 'Edição e tratamento dos conteúdos.',                                                       estado: 'pendente',  data: '' },
  { id: 'aprovacao',         nome: 'Aprovação',                               descricao: 'Revisão e aprovação pelo cliente.',                                                         estado: 'pendente',  data: '' },
  { id: 'entrega',           nome: 'Entrega',                                 descricao: 'Entrega de todos os conteúdos acordados.',                                                  estado: 'pendente',  data: '' },
]

export async function POST(req: NextRequest) {
  const auth = req.cookies.get('rl_auth')?.value
  if (auth !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { ref, nome, cliente, tipo } = body

  if (!ref) return NextResponse.json({ error: 'ref obrigatório' }, { status: 400 })

  const refUp = String(ref).toUpperCase().trim().replace(/\s+/g, '_')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verificar se já existe
  const { data: existing } = await supabase
    .from('media_portais')
    .select('ref')
    .eq('ref', refUp)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Já existe um portal com esta referência' }, { status: 409 })
  }

  const dados = {
    ref:          refUp,
    nome:         nome?.trim() || refUp,
    cliente:      cliente?.trim() || nome?.trim() || refUp,
    tipo:         tipo?.trim() || 'Produção Photography & Video',
    local:        '',
    dataFilmagem: '',
    dataEntrega:  '',
    gestorNome:   'Rui Lima',
    gestorEmail:  'geral.rlmedia@gmail.com',
    gestorTelefone: '+351 910 000 000',
    status:       'Em Produção',
    revisoes:     { usadas: 0, total: 3 },
    fases:        DEFAULT_FASES,
    pagamentos:   [],
    entregas:     [],
  }

  const { error } = await supabase
    .from('media_portais')
    .insert({ ref: refUp, dados, updated_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, ref: refUp })
}
