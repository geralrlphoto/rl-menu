import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_ROADMAP_CASAMENTO = [
  {
    id: 'briefing', titulo: 'Briefing', cor: 'blue',
    tarefas: [
      { id: 'b1', titulo: 'Primeiro Contato',    estado: 'nao_iniciada', data: '' },
      { id: 'b2', titulo: 'Formulário Briefing', estado: 'nao_iniciada', data: '' },
      { id: 'b3', titulo: 'Reunião de Briefing', estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'proposta', titulo: 'Proposta', cor: 'cyan',
    tarefas: [
      { id: 'p1', titulo: 'Análise de Requisitos', estado: 'nao_iniciada', data: '' },
      { id: 'p2', titulo: 'Criação da Proposta',   estado: 'nao_iniciada', data: '' },
      { id: 'p3', titulo: 'Apresentação',          estado: 'nao_iniciada', data: '' },
      { id: 'p4', titulo: 'Adjudicação',           estado: 'nao_iniciada', data: '' },
      { id: 'p5', titulo: 'CPS Assinado',          estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'planeamento', titulo: 'Planeamento', cor: 'yellow',
    tarefas: [
      { id: 'pl1', titulo: 'Definição de Datas',       estado: 'nao_iniciada', data: '' },
      { id: 'pl2', titulo: 'Seleção de Staff',          estado: 'nao_iniciada', data: '' },
      { id: 'pl3', titulo: 'Logística e Equipamento',   estado: 'nao_iniciada', data: '' },
      { id: 'pl4', titulo: 'Storytelling / Guião',      estado: 'nao_iniciada', data: '' },
      { id: 'pl5', titulo: 'Vistoria ao Local',         estado: 'nao_iniciada', data: '' },
      { id: 'pl6', titulo: 'Data Captação Confirmada',  estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'pre-producao', titulo: 'Pré-Produção', cor: 'purple',
    tarefas: [
      { id: 'pr1', titulo: 'Briefing de Staff',            estado: 'nao_iniciada', data: '' },
      { id: 'pr2', titulo: 'Organização de Equipamento',   estado: 'nao_iniciada', data: '' },
      { id: 'pr3', titulo: 'Confirmar Datas com Cliente',  estado: 'nao_iniciada', data: '' },
      { id: 'pr4', titulo: 'Preparação de Materiais',      estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'producao', titulo: 'Produção', cor: 'orange',
    tarefas: [
      { id: 'prod1', titulo: 'Captação de Conteúdo',  estado: 'nao_iniciada', data: '' },
      { id: 'prod2', titulo: 'Fotografia de Produto', estado: 'nao_iniciada', data: '' },
      { id: 'prod3', titulo: 'Vídeo Institucional',   estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'pos-producao', titulo: 'Pós-Produção', cor: 'violet',
    tarefas: [
      { id: 'pp1', titulo: 'Arquivo e Organização', estado: 'nao_iniciada', data: '' },
      { id: 'pp2', titulo: 'Edição de Vídeo',        estado: 'nao_iniciada', data: '' },
      { id: 'pp3', titulo: 'Edição de Fotografias',  estado: 'nao_iniciada', data: '' },
      { id: 'pp4', titulo: 'Color Grading',           estado: 'nao_iniciada', data: '' },
      { id: 'pp5', titulo: 'Revisão Interna',         estado: 'nao_iniciada', data: '' },
      { id: 'pp6', titulo: 'Revisão do Cliente',      estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'entrega', titulo: 'Entrega', cor: 'emerald',
    tarefas: [
      { id: 'e1', titulo: 'Exportação Final',       estado: 'nao_iniciada', data: '' },
      { id: 'e2', titulo: 'Entrega de Ficheiros',   estado: 'nao_iniciada', data: '' },
      { id: 'e3', titulo: 'Fatura Final',           estado: 'nao_iniciada', data: '' },
      { id: 'e4', titulo: 'Avaliação / Satisfação', estado: 'nao_iniciada', data: '' },
    ],
  },
]

const DEFAULT_ROADMAP_BATIZADO = [
  {
    id: 'briefing', titulo: 'Briefing', cor: 'blue',
    tarefas: [
      { id: 'b1', titulo: 'Primeiro Contato',    estado: 'nao_iniciada', data: '' },
      { id: 'b2', titulo: 'Formulário Briefing', estado: 'nao_iniciada', data: '' },
      { id: 'b3', titulo: 'Reunião de Briefing', estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'proposta', titulo: 'Proposta', cor: 'cyan',
    tarefas: [
      { id: 'p1', titulo: 'Análise de Requisitos', estado: 'nao_iniciada', data: '' },
      { id: 'p2', titulo: 'Criação da Proposta',   estado: 'nao_iniciada', data: '' },
      { id: 'p3', titulo: 'Apresentação',          estado: 'nao_iniciada', data: '' },
      { id: 'p4', titulo: 'Adjudicação',           estado: 'nao_iniciada', data: '' },
      { id: 'p5', titulo: 'CPS Assinado',          estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'planeamento', titulo: 'Planeamento', cor: 'yellow',
    tarefas: [
      { id: 'pl1', titulo: 'Definição de Data do Batizado', estado: 'nao_iniciada', data: '' },
      { id: 'pl2', titulo: 'Seleção de Fotógrafo/Câmara',   estado: 'nao_iniciada', data: '' },
      { id: 'pl3', titulo: 'Logística e Equipamento',        estado: 'nao_iniciada', data: '' },
      { id: 'pl4', titulo: 'Vistoria ao Local',              estado: 'nao_iniciada', data: '' },
      { id: 'pl5', titulo: 'Data Confirmada',                estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'pre-producao', titulo: 'Pré-Produção', cor: 'purple',
    tarefas: [
      { id: 'pr1', titulo: 'Briefing de Equipa',            estado: 'nao_iniciada', data: '' },
      { id: 'pr2', titulo: 'Organização de Equipamento',    estado: 'nao_iniciada', data: '' },
      { id: 'pr3', titulo: 'Confirmar Datas com Família',   estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'producao', titulo: 'Produção', cor: 'orange',
    tarefas: [
      { id: 'prod1', titulo: 'Captação — Igreja / Cerimónia', estado: 'nao_iniciada', data: '' },
      { id: 'prod2', titulo: 'Captação — Celebração / Festa', estado: 'nao_iniciada', data: '' },
      { id: 'prod3', titulo: 'Captação — Retratos de Família', estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'pos-producao', titulo: 'Pós-Produção', cor: 'violet',
    tarefas: [
      { id: 'pp1', titulo: 'Arquivo e Organização',  estado: 'nao_iniciada', data: '' },
      { id: 'pp2', titulo: 'Edição de Fotografias',  estado: 'nao_iniciada', data: '' },
      { id: 'pp3', titulo: 'Edição de Vídeo',         estado: 'nao_iniciada', data: '' },
      { id: 'pp4', titulo: 'Color Grading',            estado: 'nao_iniciada', data: '' },
      { id: 'pp5', titulo: 'Revisão Interna',          estado: 'nao_iniciada', data: '' },
      { id: 'pp6', titulo: 'Revisão do Cliente',       estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'entrega', titulo: 'Entrega', cor: 'emerald',
    tarefas: [
      { id: 'e1', titulo: 'Exportação Final',       estado: 'nao_iniciada', data: '' },
      { id: 'e2', titulo: 'Entrega de Ficheiros',   estado: 'nao_iniciada', data: '' },
      { id: 'e3', titulo: 'Fatura Final',           estado: 'nao_iniciada', data: '' },
      { id: 'e4', titulo: 'Avaliação / Satisfação', estado: 'nao_iniciada', data: '' },
    ],
  },
]

const DEFAULT_FASES_CASAMENTO = [
  { id: 'primeiro-contato',  nome: 'Primeiro Contato',                       descricao: 'Quando nos contactas e falamos pela primeira vez.',                               estado: 'concluido', data: '' },
  { id: 'briefing-inicial',  nome: 'Briefing Inicial',                        descricao: 'Recolha das informações essenciais sobre o casamento.',                            estado: 'concluido', data: '' },
  { id: 'proposta-base',     nome: 'Proposta Base',                           descricao: 'Elaboração da proposta com base no briefing.',                                     estado: 'concluido', data: '' },
  { id: 'adjudicacao',       nome: 'Adjudicação',                             descricao: 'Confirmação e início do processo.',                                                 estado: 'concluido', data: '' },
  { id: 'elaboracao-cps',    nome: 'Elaboração do CPS',                       descricao: 'Recolha de dados para o contrato de prestação de serviços.',                      estado: 'em_curso',  data: '' },
  { id: 'briefing-completo', nome: 'Briefing Completo',                       descricao: 'Briefing detalhado com todos os requisitos do casamento.',                         estado: 'pendente',  data: '' },
  { id: 'cps',               nome: 'CPS — Contrato de Prestação de Serviços', descricao: 'Contrato a assinar e devolver.',                                                   estado: 'pendente',  data: '' },
  { id: 'planeamento',       nome: 'Planeamento',                             descricao: 'Definição do calendário, logística e coordenação.',                                estado: 'pendente',  data: '' },
  { id: 'pre-wedding',       nome: 'Sessão Pré-Wedding',                      descricao: 'Sessão fotográfica antes do grande dia.',                                          estado: 'pendente',  data: '' },
  { id: 'dia-casamento',     nome: 'Dia do Casamento',                        descricao: 'Captação fotográfica e videográfica do casamento.',                                estado: 'pendente',  data: '' },
  { id: 'pos-producao',      nome: 'Pós-Produção',                            descricao: 'Edição e tratamento das fotografias e vídeos.',                                    estado: 'pendente',  data: '' },
  { id: 'aprovacao',         nome: 'Aprovação',                               descricao: 'Revisão e aprovação pelo casal.',                                                   estado: 'pendente',  data: '' },
  { id: 'entrega',           nome: 'Entrega',                                 descricao: 'Entrega de todas as fotografias e vídeos acordados.',                               estado: 'pendente',  data: '' },
]

const DEFAULT_FASES_BATIZADO = [
  { id: 'primeiro-contato',  nome: 'Primeiro Contato',                       descricao: 'Quando nos contactas e falamos pela primeira vez.',                               estado: 'concluido', data: '' },
  { id: 'briefing-inicial',  nome: 'Briefing Inicial',                        descricao: 'Recolha das informações essenciais sobre o batizado.',                            estado: 'concluido', data: '' },
  { id: 'proposta-base',     nome: 'Proposta Base',                           descricao: 'Elaboração da proposta com base no briefing.',                                     estado: 'concluido', data: '' },
  { id: 'adjudicacao',       nome: 'Adjudicação',                             descricao: 'Confirmação e início do processo.',                                                 estado: 'concluido', data: '' },
  { id: 'elaboracao-cps',    nome: 'Elaboração do CPS',                       descricao: 'Recolha de dados para o contrato de prestação de serviços.',                      estado: 'em_curso',  data: '' },
  { id: 'briefing-completo', nome: 'Briefing Completo',                       descricao: 'Briefing detalhado com todos os detalhes do batizado.',                            estado: 'pendente',  data: '' },
  { id: 'cps',               nome: 'CPS — Contrato de Prestação de Serviços', descricao: 'Contrato a assinar e devolver.',                                                   estado: 'pendente',  data: '' },
  { id: 'planeamento',       nome: 'Planeamento',                             descricao: 'Definição de datas, local e logística.',                                           estado: 'pendente',  data: '' },
  { id: 'dia-batizado',      nome: 'Dia do Batizado',                         descricao: 'Captação fotográfica e videográfica do batizado.',                                 estado: 'pendente',  data: '' },
  { id: 'pos-producao',      nome: 'Pós-Produção',                            descricao: 'Edição e tratamento das fotografias e vídeos.',                                    estado: 'pendente',  data: '' },
  { id: 'aprovacao',         nome: 'Aprovação',                               descricao: 'Revisão e aprovação pela família.',                                                 estado: 'pendente',  data: '' },
  { id: 'entrega',           nome: 'Entrega',                                 descricao: 'Entrega de todas as fotografias e vídeos acordados.',                               estado: 'pendente',  data: '' },
]

export async function POST(req: NextRequest) {
  const auth = req.cookies.get('rl_auth')?.value
  if (auth !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { ref, nome, cliente, tipoPortal } = body

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

  const isBatizado = tipoPortal === 'batizado'

  const dados = {
    ref:          refUp,
    nome:         nome?.trim() || refUp,
    cliente:      cliente?.trim() || nome?.trim() || refUp,
    tipo:         isBatizado ? 'Fotografia & Vídeo de Batizado' : 'Fotografia & Vídeo de Casamento',
    tipoPortal:   isBatizado ? 'batizado' : 'casamento',
    local:        '',
    dataFilmagem: '',
    dataEntrega:  '',
    gestorNome:   'Rui Lima',
    gestorEmail:  'geral.rlmedia@gmail.com',
    gestorTelefone: '+351 910 000 000',
    status:       'Em Produção',
    revisoes:     { usadas: 0, total: 3 },
    fases:        isBatizado ? DEFAULT_FASES_BATIZADO : DEFAULT_FASES_CASAMENTO,
    pagamentos:   [],
    entregas:     [],
    roadmap:         isBatizado ? DEFAULT_ROADMAP_BATIZADO : DEFAULT_ROADMAP_CASAMENTO,
    roadmapImageUrl: isBatizado
      ? 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=1600&q=80'
      : 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80',
  }

  const { error } = await supabase
    .from('media_portais')
    .insert({ ref: refUp, dados, updated_at: new Date().toISOString() })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, ref: refUp })
}
