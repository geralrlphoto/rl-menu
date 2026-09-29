// Bloco "Preparem a reunião" dos portais da reunião (/r casamento, /b batizado).
// Não se fala de valores: perguntamos pelos momentos, pelo que valorizam e em que
// ponto estão. A fase e o prazo de decisão ajustam a prioridade da lead
// (QUENTE / MORNA / FRIA) um nível para cima ou para baixo.
import { qualificarLead, type Qualificacao } from '@/lib/crm'

export type Tipo = 'casamento' | 'batizado'
export type Respostas = {
  fase?: string
  decisao?: string
  momentos?: string[]
  valorizam?: string[]
  historia?: string
}

export const MOMENTOS: Record<Tipo, string[]> = {
  casamento: ['Os preparativos', 'O primeiro olhar', 'A entrada na cerimónia', 'Os votos e as alianças', 'A saída dos noivos', 'Os retratos a dois', 'Os discursos', 'A primeira dança', 'A festa', 'Detalhes e decoração', 'Família e avós'],
  batizado: ['A preparação em casa', 'A chegada à igreja', 'A cerimónia', 'O momento da água', 'Padrinhos e família', 'Retratos do bebé', 'O bolo', 'A festa', 'Detalhes e decoração'],
}
export const VALORIZAM = ['Emoção natural', 'Fotos de família', 'Um filme para rever', 'Um álbum para tocar', 'Discrição no dia', 'Direção e poses']
export const MAX_VALORIZAM = 2

export const FASES: Record<Tipo, { v: string; t: string }[]> = {
  casamento: [
    { v: 'local', t: 'Já temos local e data' },
    { v: 'fornecedores', t: 'A escolher fornecedores' },
    { v: 'explorar', t: 'Ainda a explorar' },
  ],
  batizado: [
    { v: 'local', t: 'Já temos igreja e data' },
    { v: 'fornecedores', t: 'A tratar dos pormenores' },
    { v: 'explorar', t: 'Ainda a explorar' },
  ],
}
export const DECISOES = [
  { v: 'logo', t: 'Logo após a reunião' },
  { v: 'mes', t: 'Durante este mês' },
  { v: 'sem_pressa', t: 'Sem pressa' },
]

const NIVEIS: Qualificacao[] = ['FRIA', 'MORNA', 'QUENTE']
const ehQualificacao = (v: unknown): v is Qualificacao => typeof v === 'string' && (NIVEIS as string[]).includes(v)

/* Base: a prioridade atual se já for QUENTE/MORNA/FRIA; senão (valores antigos
   "Alta"/"Médio"/vazio) calcula-se pelo orçamento e data, como no /nova-lead. */
export function prioridadeBase(atual: unknown, orcamento: string | null, dataCasamento: string | null): Qualificacao {
  return ehQualificacao(atual) ? atual : qualificarLead(orcamento, dataCasamento)
}

/* Sinais: local/igreja já reservados e decidir logo ou este mês sobem;
   ainda a explorar e sem pressa descem. Dois sinais no mesmo sentido mudam um nível. */
export function ajustarPrioridade(base: Qualificacao, r: Respostas): { nivel: Qualificacao; sinal: number } {
  let sinal = 0
  if (r.fase === 'local') sinal++
  if (r.fase === 'explorar') sinal--
  if (r.decisao === 'logo' || r.decisao === 'mes') sinal++
  if (r.decisao === 'sem_pressa') sinal--
  const i = NIVEIS.indexOf(base)
  const passo = sinal >= 2 ? 1 : sinal <= -2 ? -1 : 0
  return { nivel: NIVEIS[Math.max(0, Math.min(2, i + passo))], sinal }
}

/* Aceita só opções conhecidas (o pedido vem de uma página pública). */
export function limparRespostas(b: any, tipo: Tipo): Respostas {
  const lista = (v: unknown, ok: string[], max: number) =>
    Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && ok.includes(x)))].slice(0, max) : []
  return {
    fase: FASES[tipo].some(f => f.v === b?.fase) ? b.fase : undefined,
    decisao: DECISOES.some(d => d.v === b?.decisao) ? b.decisao : undefined,
    momentos: lista(b?.momentos, MOMENTOS[tipo], MOMENTOS[tipo].length),
    valorizam: lista(b?.valorizam, VALORIZAM, MAX_VALORIZAM),
    historia: typeof b?.historia === 'string' && b.historia.trim() ? b.historia.trim().slice(0, 800) : undefined,
  }
}

export function rotuloFase(tipo: Tipo, v?: string) { return FASES[tipo].find(f => f.v === v)?.t ?? '' }
export function rotuloDecisao(v?: string) { return DECISOES.find(d => d.v === v)?.t ?? '' }
