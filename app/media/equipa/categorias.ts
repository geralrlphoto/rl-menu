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
}

export const singular = (id: string) => CATEGORIAS.find(c => c.id === id)?.singular ?? id
