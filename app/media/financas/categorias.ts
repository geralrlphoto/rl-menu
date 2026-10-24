// Tipos e categorias dos movimentos manuais das finanças da RL PROD.

export type TipoMov = 'despesa' | 'receita'

export type Movimento = {
  id: string
  tipo: TipoMov
  data: string
  descricao: string
  categoria: string
  valor: number
  projeto_ref: string | null
  notas: string | null
  created_at: string
}

export const CATS_DESPESA = [
  { id: 'equipamento', nome: 'Equipamento' },
  { id: 'deslocacao',  nome: 'Deslocações' },
  { id: 'equipa',      nome: 'Equipa/Freelancers' },
  { id: 'software',    nome: 'Software' },
  { id: 'marketing',   nome: 'Marketing' },
  { id: 'aluguer',     nome: 'Aluguer' },
  { id: 'alimentacao', nome: 'Alimentação' },
  { id: 'outro',       nome: 'Outros' },
]

export const CATS_RECEITA = [
  { id: 'projeto',   nome: 'Projeto' },
  { id: 'extra',     nome: 'Extra' },
  { id: 'reembolso', nome: 'Reembolso' },
  { id: 'outro',     nome: 'Outros' },
]

// Categorias antigas que ainda existem nas linhas guardadas
const ANTIGAS: Record<string, string> = { freelancer: 'equipa' }

export function normCategoria(c: string | null | undefined): string {
  const k = (c || 'outro').toLowerCase().trim()
  return ANTIGAS[k] ?? k
}

export function nomeCategoria(c: string, tipo: TipoMov): string {
  const lista = tipo === 'despesa' ? CATS_DESPESA : CATS_RECEITA
  const f = lista.find(x => x.id === c) ?? [...CATS_DESPESA, ...CATS_RECEITA].find(x => x.id === c)
  if (f) return f.nome
  return c ? c.charAt(0).toUpperCase() + c.slice(1) : 'Outros'
}
