export type FaseEstado = 'concluido' | 'em_curso' | 'pendente'

export interface Fase {
  id: string
  nome: string
  descricao: string
  estado: FaseEstado
  data?: string
  notificacaoEnviada?: string
}

export interface Pagamento {
  descricao: string
  valor: number
  estado: 'pago' | 'pendente' | 'em_atraso'
  data: string
}

export interface Entrega {
  titulo: string
  formato: string
  duracao: string
  linkUrl?: string
  estado: 'disponivel' | 'pendente'
}

export interface BriefingItem {
  label: string
  desc: string
}

export interface BriefingSessao {
  id: string
  titulo: string
  data: string
  resumo: string
  notificacaoEnviada?: string
}

export interface FichaCliente {
  nome?: string
  empresa?: string
  nif?: string
  email?: string
  telefone?: string
  morada?: string
  representanteLegal?: string
  orcamento?: string
  servicosList?: string
  dataEvento?: string
  localEvento?: string
  observacoes?: string
  metodoPagamento?: string
}

export interface ContaBancaria {
  prazo?: string
  metodo?: string
  titular?: string
  iban?: string
  email?: string
}

export interface RegistoPagamento {
  data: string
  valor: number
  fase?: string
  metodo?: string
  empresa?: string
  comprativoUrl?: string
}

export interface ChatMensagem {
  id: string
  texto: string
  autor: string
  isAdmin: boolean
  criadoEm: string
}

export type TarefaEstado = 'concluido' | 'em_andamento' | 'nao_iniciada' | 'aguardar' | 'enviado'

export interface RoadmapTarefa {
  id: string
  titulo: string
  estado: TarefaEstado
  data?: string
}

export interface RoadmapColuna {
  id: string
  titulo: string
  cor: string
  tarefas: RoadmapTarefa[]
}

export interface Projeto {
  ref: string
  nome: string
  cliente: string
  tipo: string
  local: string
  dataFilmagem: string
  dataEntrega: string
  gestorNome: string
  gestorEmail: string
  gestorTelefone: string
  status: string
  revisoes: { usadas: number; total: number }
  fases: Fase[]
  pagamentos: Pagamento[]
  entregas: Entrega[]
  heroImageUrl?: string
  heroLogoUrl?: string
  pagamentosImageUrl?: string
  contratoImageUrl?: string
  briefingImageUrl?: string
  entregasImageUrl?: string
  workflowImageUrl?: string
  atendimentoImageUrl?: string
  satisfacaoImageUrl?: string
  revisoesImageUrl?: string
  briefingUrl?: string
  briefingItems?: BriefingItem[]
  briefingSessoes?: BriefingSessao[]
  contratoUrl?: string
  cpsFormUrl?: string
  satisfacaoUrl?: string
  fichaCliente?: FichaCliente
  contaBancaria?: ContaBancaria
  registosPagamento?: RegistoPagamento[]
  roadmap?: RoadmapColuna[]
  roadmapImageUrl?: string
  chatMensagens?: ChatMensagem[]
}

const PROJETOS: Record<string, Projeto> = {
  OLEOBIO: {
    ref: 'OLEOBIO',
    nome: 'OLEOBIO',
    cliente: 'Oleobio, Lda',
    tipo: 'Produção Audiovisual',
    local: 'Lisboa',
    dataFilmagem: '15 Jul 2025',
    dataEntrega: '25 Set 2025',
    gestorNome: 'Rui Lima',
    gestorEmail: 'geral.rlmedia@gmail.com',
    gestorTelefone: '+351 910 000 000',
    status: 'Em Produção',
    revisoes: { usadas: 0, total: 3 },
    fases: [
      { id: 'primeiro-contato',    nome: 'Primeiro Contato',                      descricao: 'Quando nos contatas e falamos pela primeira vez.',                                                                                          estado: 'concluido', data: '' },
      { id: 'briefing-inicial',    nome: 'Briefing Inicial',                      descricao: 'Este briefing pode ser realizado através do link ou mesmo durante a nossa primeira reunião.',                                               estado: 'concluido', data: '' },
      { id: 'proposta-base',       nome: 'Proposta Base',                         descricao: 'Fazemos-te uma proposta com base nas informações que fomos recolhendo.',                                                                     estado: 'concluido', data: '' },
      { id: 'adjudicacao',         nome: 'Adjudicação',                           descricao: 'A proposta foi do vosso agrado, então vamos iniciar o processo.',                                                                            estado: 'concluido', data: '' },
      { id: 'elaboracao-cps',      nome: 'Elaboração do CPS',                     descricao: 'Após o serviço estar adjudicado vamos recolher todos os dados para realizar este passo.',                                                   estado: 'concluido', data: '' },
      { id: 'briefing-completo',   nome: 'Briefing Completo',                     descricao: 'Vamos entregar-te um briefing mais completo e detalhado.',                                                                                   estado: 'em_curso',  data: '' },
      { id: 'cps',                 nome: 'CPS — Contrato de Prestação de Serviços', descricao: 'Por vezes juntamos o briefing com o CPS assim evita-se mais um documento. O CPS tem que ser assinado e devolvido.',                       estado: 'pendente',  data: '' },
      { id: 'planeamento',         nome: 'Planeamento',                           descricao: 'Vamos definir como e quando tudo vai acontecer.',                                                                                            estado: 'pendente',  data: '' },
      { id: 'producao',            nome: 'Produção',                              descricao: 'Chegou o dia de irmos para o terreno fazer acontecer.',                                                                                      estado: 'pendente',  data: '15 Jul 2025' },
      { id: 'pos-producao',        nome: 'Pós-Produção',                          descricao: 'Nesta fase vamos começar a editar e a criar o que foi planeado.',                                                                            estado: 'pendente',  data: 'Ago 2025' },
      { id: 'aprovacao',           nome: 'Aprovação',                             descricao: 'Uma das fases mais esperadas de todo o processo — a tua avaliação.',                                                                         estado: 'pendente',  data: 'Set 2025' },
      { id: 'entrega',             nome: 'Entrega',                               descricao: 'Vamos entregar todos os conteúdos que foram acordados.',                                                                                     estado: 'pendente',  data: '25 Set 2025' },
    ],
    pagamentos: [
      { descricao: 'Sinal — 50%',     valor: 1500, estado: 'pago',     data: '10 Mai 2025' },
      { descricao: 'Restante — 50%',  valor: 1500, estado: 'pendente', data: '25 Set 2025' },
    ],
    entregas: [
      { titulo: 'Vídeo Principal',     formato: 'MP4 · 16:9 · 4K',     duracao: '2–3 min', estado: 'pendente' },
      { titulo: 'Versão Instagram',    formato: 'MP4 · 1:1 · HD',      duracao: '60 seg',  estado: 'pendente' },
      { titulo: 'Versão Stories',      formato: 'MP4 · 9:16 · HD',     duracao: '30 seg',  estado: 'pendente' },
      { titulo: 'Teaser / Highlight',  formato: 'MP4 · 16:9 · HD',     duracao: '30 seg',  estado: 'pendente' },
    ],
    heroImageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80',
    briefingUrl: undefined,
    briefingItems: [
      { label: 'Objetivos do Projeto', desc: 'Vídeo institucional para comunicação digital e presença online da marca Oleobio.' },
      { label: 'Tom e Estilo',          desc: 'Clean, moderno, profissional. Transmitir confiança e qualidade do produto.' },
      { label: 'Público-alvo',          desc: 'Empresas B2B no sector alimentar, retalhistas e distribuidores.' },
      { label: 'Referências Visuais',   desc: '3 referências partilhadas e aprovadas em reunião de 10 Mai 2025.' },
      { label: 'Assets da Marca',       desc: 'Logótipo, guia de cores e fontes entregues em 12 Mai 2025.' },
    ],
    contratoUrl: undefined,
    cpsFormUrl: undefined,
    satisfacaoUrl: undefined,
    roadmap: [
      {
        id: 'briefing', titulo: 'Briefing', cor: 'blue',
        tarefas: [
          { id: 'b1', titulo: 'Primeiro Contato',      estado: 'concluido',    data: '2025-09-26' },
          { id: 'b2', titulo: 'Formulário Briefing',   estado: 'concluido',    data: '2025-09-26' },
          { id: 'b3', titulo: 'Reunião de Briefing',   estado: 'concluido',    data: '2025-09-30' },
        ],
      },
      {
        id: 'proposta', titulo: 'Proposta', cor: 'cyan',
        tarefas: [
          { id: 'p1', titulo: 'Análise de Requisitos', estado: 'concluido',    data: '2025-10-02' },
          { id: 'p2', titulo: 'Criação da Proposta',   estado: 'concluido',    data: '2025-10-04' },
          { id: 'p3', titulo: 'Apresentação',          estado: 'concluido',    data: '2025-10-05' },
          { id: 'p4', titulo: 'Adjudicação',           estado: 'concluido',    data: '' },
          { id: 'p5', titulo: 'CPS Assinado',          estado: 'enviado',      data: '2025-10-07' },
        ],
      },
      {
        id: 'planeamento', titulo: 'Planeamento', cor: 'yellow',
        tarefas: [
          { id: 'pl1', titulo: 'Definição de Datas',        estado: 'concluido',    data: '2025-10-10' },
          { id: 'pl2', titulo: 'Seleção de Staff',          estado: 'concluido',    data: '' },
          { id: 'pl3', titulo: 'Logística e Equipamento',   estado: 'concluido',    data: '' },
          { id: 'pl4', titulo: 'Storytelling / Guião',      estado: 'concluido',    data: '' },
          { id: 'pl5', titulo: 'Vistoria ao Local',         estado: 'concluido',    data: '2025-10-28' },
          { id: 'pl6', titulo: 'Data Captação Confirmada',  estado: 'em_andamento', data: '2025-12-05' },
        ],
      },
      {
        id: 'pre-producao', titulo: 'Pré-Produção', cor: 'purple',
        tarefas: [
          { id: 'pr1', titulo: 'Briefing de Staff',              estado: 'concluido',    data: '' },
          { id: 'pr2', titulo: 'Organização de Equipamento',     estado: 'concluido',    data: '' },
          { id: 'pr3', titulo: 'Confirmar Datas com Cliente',    estado: 'concluido',    data: '' },
          { id: 'pr4', titulo: 'Preparação de Materiais',        estado: 'em_andamento', data: '' },
        ],
      },
      {
        id: 'producao', titulo: 'Produção', cor: 'orange',
        tarefas: [
          { id: 'prod1', titulo: 'Captação de Conteúdo', estado: 'nao_iniciada', data: '2025-12-05' },
          { id: 'prod2', titulo: 'Fotografia de Produto', estado: 'nao_iniciada', data: '2025-12-05' },
          { id: 'prod3', titulo: 'Vídeo Institucional',   estado: 'nao_iniciada', data: '2025-12-05' },
        ],
      },
      {
        id: 'pos-producao', titulo: 'Pós-Produção', cor: 'violet',
        tarefas: [
          { id: 'pp1', titulo: 'Arquivo e Organização',  estado: 'nao_iniciada', data: '' },
          { id: 'pp2', titulo: 'Edição de Vídeo',        estado: 'nao_iniciada', data: '' },
          { id: 'pp3', titulo: 'Edição de Fotografias',  estado: 'nao_iniciada', data: '' },
          { id: 'pp4', titulo: 'Color Grading',          estado: 'nao_iniciada', data: '' },
          { id: 'pp5', titulo: 'Revisão Interna',        estado: 'nao_iniciada', data: '' },
          { id: 'pp6', titulo: 'Revisão do Cliente',     estado: 'nao_iniciada', data: '' },
        ],
      },
      {
        id: 'entrega', titulo: 'Entrega', cor: 'emerald',
        tarefas: [
          { id: 'e1', titulo: 'Exportação Final',        estado: 'nao_iniciada', data: '' },
          { id: 'e2', titulo: 'Entrega de Ficheiros',    estado: 'nao_iniciada', data: '2026-02-28' },
          { id: 'e3', titulo: 'Fatura Final',            estado: 'nao_iniciada', data: '' },
          { id: 'e4', titulo: 'Avaliação / Satisfação',  estado: 'nao_iniciada', data: '' },
        ],
      },
    ],
  },
}

export function getProjeto(ref: string): Projeto | null {
  return PROJETOS[ref.toUpperCase()] ?? null
}
