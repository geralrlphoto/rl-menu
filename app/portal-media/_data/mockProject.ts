export type FaseEstado = 'concluido' | 'em_curso' | 'pendente'

export interface Fase {
  id: string
  nome: string
  descricao: string
  estado: FaseEstado
  data?: string
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
  contratoUrl?: string
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
      { id: 'briefing',      nome: 'Briefing',       descricao: 'Recolha de objetivos, referências e dados da marca', estado: 'concluido',  data: '10 Mai 2025' },
      { id: 'pre-producao',  nome: 'Pré-Produção',   descricao: 'Guião, storyboard, planeamento técnico e logístico', estado: 'em_curso',   data: 'Jun 2025' },
      { id: 'filmagem',      nome: 'Filmagem',        descricao: 'Dia(s) de rodagem conforme cronograma acordado',     estado: 'pendente',   data: '15 Jul 2025' },
      { id: 'pos-producao',  nome: 'Pós-Produção',   descricao: 'Edição, correção de cor, som e motion graphics',     estado: 'pendente',   data: 'Ago 2025' },
      { id: 'revisoes',      nome: 'Revisões',        descricao: 'Ciclos de feedback e ajustes conforme contrato',     estado: 'pendente',   data: 'Set 2025' },
      { id: 'entrega-final', nome: 'Entrega Final',   descricao: 'Envio dos ficheiros finais em todos os formatos',    estado: 'pendente',   data: '25 Set 2025' },
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
    contratoUrl: undefined,
  },
}

export function getProjeto(ref: string): Projeto | null {
  return PROJETOS[ref.toUpperCase()] ?? null
}
