// Categorias da equipa RL PROD (mesmos ids da coluna media_equipa.categoria)
export const CATEGORIAS = [
  { id: 'videografo',       nome: 'Videógrafos',      singular: 'Videógrafo' },
  { id: 'diretor-criativo', nome: 'Diretor Criativo', singular: 'Diretor Criativo' },
  { id: 'fotografo',        nome: 'Fotógrafos',       singular: 'Fotógrafo' },
  { id: 'editor',           nome: 'Editores',         singular: 'Editor' },
  { id: 'assistente',       nome: 'Assistentes',      singular: 'Assistente' },
] as const

export type CategoriaId = typeof CATEGORIAS[number]['id']

export type MembroEquipa = {
  id: string
  nome: string
  categoria: CategoriaId
  telefone?: string | null
  email?: string | null
  instagram?: string | null
  notas?: string | null
  ativo: boolean
  foto_url?: string | null
}

// Ficha do membro (media_equipa.dados), preenchida pela RL PROD
export type FichaDados = {
  nomeCompleto?: string
  nascimento?: string
  localizacao?: string
  website?: string
  idiomas?: string
  sobre?: string
  experiencia?: string
  estilo?: string
  especialidades?: { nome: string; nivel: number }[]
  equipamento?: string
  diasTrabalho?: string
  horario?: string
  comunicacao?: string
  disponibilidade?: string
  valorDia?: string
  valorMeioDia?: string
  metodoPagamento?: string
  iban?: string
  titular?: string
  nif?: string
  morada?: string
  urgenciaNome?: string
  urgenciaRelacao?: string
  urgenciaTelefone?: string
}

export const singular = (id: string) => CATEGORIAS.find(c => c.id === id)?.singular ?? id
