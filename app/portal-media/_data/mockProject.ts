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
  briefingUrl?: string
  briefingItems?: BriefingItem[]
  contratoUrl?: string
  cpsFormUrl?: string
  satisfacaoUrl?: string
  fichaCliente?: FichaCliente
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
    gestorEmail: 'rl@rlmedia.pt',
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
  },
}

export function getProjeto(ref: string): Projeto | null {
  return PROJETOS[ref.toUpperCase()] ?? null
}
