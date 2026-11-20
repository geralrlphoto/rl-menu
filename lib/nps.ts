// NPS (/nps) de quem fechou e de quem não fechou: 8 perguntas, a última é a recomendação de 0 a 10.
// Se a nota for 7 ou mais, abre a caixa para indicarem outros noivos (nome e contacto).
// As perguntas vivem aqui para a página, a API (/api/nps) e a ficha do CRM usarem a mesma lista.

export type PerguntaNps =
  | { id: string; tipo: 'escala'; titulo: string; legendas: [string, string, string] }
  | { id: string; tipo: 'multipla'; titulo: string; opcoes: string[] }
  | { id: string; tipo: 'texto'; titulo: string; max: number }
  | { id: string; tipo: 'nps'; titulo: string }

export type RespostasNps = Record<string, number | string | string[] | undefined>
export type Indicacao = { nome: string; contacto: string }

export const NOTA_INDICAR = 7 // a partir desta nota pergunta pelos noivos a indicar
export const MAX_TEXTO = 2000

export const PERGUNTAS_NPS: PerguntaNps[] = [
  { id: 'abordagem', tipo: 'escala', titulo: 'Como avaliam o nosso *primeiro contacto*?', legendas: ['Fraco', 'Bom', 'Excelente'] },
  { id: 'rapidez', tipo: 'escala', titulo: 'A *rapidez* das nossas respostas foi…', legendas: ['Lenta', 'Boa', 'Excelente'] },
  { id: 'reuniao', tipo: 'escala', titulo: 'Como avaliam a nossa *reunião*?', legendas: ['Fraca', 'Boa', 'Excelente'] },
  { id: 'portal', tipo: 'escala', titulo: 'O que acharam do *portal* da reunião?', legendas: ['Fraco', 'Bom', 'Excelente'] },
  { id: 'proposta', tipo: 'escala', titulo: 'A nossa *proposta* foi clara e completa?', legendas: ['Pouco', 'Sim', 'Muito'] },
  { id: 'gostaram', tipo: 'multipla', titulo: 'O que mais *gostaram* em nós?',
    opcoes: ['O nosso trabalho', 'A simpatia e a proximidade', 'A reunião', 'O portal', 'A proposta', 'O valor', 'Outro'] },
  { id: 'melhorar', tipo: 'texto', titulo: 'O que podemos *melhorar*?', max: MAX_TEXTO },
  { id: 'recomendar', tipo: 'nps', titulo: 'De 0 a 10, quanto nos recomendariam a *outros noivos*?' },
]

export const tituloSimplesNps = (t: string) => t.replace(/\*/g, '')

/** Valida as respostas vindas do browser. Devolve null se algo não bater certo ou faltar a nota. */
export function limparRespostasNps(bruto: unknown): { respostas: RespostasNps; nota: number } | null {
  if (!bruto || typeof bruto !== 'object') return null
  const r = bruto as Record<string, unknown>
  const out: RespostasNps = {}
  for (const p of PERGUNTAS_NPS) {
    const v = r[p.id]
    if (v === undefined || v === null || v === '') continue
    if (p.tipo === 'escala' || p.tipo === 'nps') {
      const max = p.tipo === 'nps' ? 10 : 5, min = p.tipo === 'nps' ? 0 : 1
      if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) return null
      out[p.id] = v
    } else if (p.tipo === 'multipla') {
      if (!Array.isArray(v) || v.some(x => typeof x !== 'string' || !p.opcoes.includes(x))) return null
      if (v.length) out[p.id] = [...new Set(v as string[])]
    } else {
      if (typeof v !== 'string') return null
      const t = v.trim().slice(0, p.max)
      if (t) out[p.id] = t
    }
  }
  if (typeof out.recomendar !== 'number') return null
  return { respostas: out, nota: out.recomendar }
}

/** Texto legível de uma resposta (ficha do CRM). */
export function respostaTextoNps(p: PerguntaNps, v: RespostasNps[string]): string {
  if (v === undefined) return '-'
  if (p.tipo === 'escala') return `${v} / 5`
  if (p.tipo === 'nps') return `${v} / 10`
  return Array.isArray(v) ? v.join(', ') : String(v)
}
