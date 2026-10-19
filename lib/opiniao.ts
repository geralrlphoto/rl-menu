// Formulário de opinião dos casais que não fecharam (/opiniao).
// As perguntas vivem aqui para a página e a API (/api/opiniao) usarem a mesma lista.

export type Pergunta =
  | { id: string; tipo: 'escala'; titulo: string; legendas: [string, string, string]; mostrarSe?: (r: Respostas) => boolean }
  | { id: string; tipo: 'unica' | 'multipla'; titulo: string; opcoes: string[]; mostrarSe?: (r: Respostas) => boolean }
  | { id: string; tipo: 'texto'; titulo: string; max: number; mostrarSe?: (r: Respostas) => boolean }

export type Resposta = number | string | string[]
export type Respostas = Record<string, Resposta | undefined>

export const MAX_SUGESTAO = 2000

export const PERGUNTAS: Pergunta[] = [
  { id: 'reuniao', tipo: 'escala', titulo: 'Como avaliam a nossa *reunião*?', legendas: ['Fraca', 'Boa', 'Excelente'] },
  { id: 'gostaram', tipo: 'multipla', titulo: 'O que mais *gostaram* em nós?',
    opcoes: ['O nosso trabalho', 'A reunião', 'A simpatia e a proximidade', 'A proposta', 'O portal da reunião', 'Outro'] },
  { id: 'valor', tipo: 'unica', titulo: 'O nosso *valor*, face ao que esperavam, era…',
    opcoes: ['Muito abaixo', 'Um pouco abaixo', 'Justo', 'Um pouco acima', 'Muito acima'] },
  { id: 'decisao', tipo: 'multipla', titulo: 'O que pesou mais na vossa *decisão*?',
    opcoes: ['O preço', 'A data já não estava disponível', 'Preferimos outro estilo', 'Decidimos não ter foto ou vídeo', 'Ainda estamos a decidir', 'Outro motivo'] },
  { id: 'outro', tipo: 'unica', titulo: 'Escolheram outro *fotógrafo* ou videógrafo?', opcoes: ['Sim', 'Não', 'Ainda não decidimos'] },
  { id: 'porque_outro', tipo: 'multipla', titulo: 'O que vos fez *escolher* outro?',
    opcoes: ['Preço mais baixo', 'Estilo diferente', 'Recomendação de alguém', 'Incluía mais serviços', 'Já o conhecíamos', 'Outro motivo'],
    mostrarSe: r => r.outro === 'Sim' },
  { id: 'recomendar', tipo: 'escala', titulo: 'Depois de nos conhecerem, ficaram com vontade de nos *recomendar*?', legendas: ['Não', 'Talvez', 'Sem dúvida'] },
  { id: 'sugestao', tipo: 'texto', titulo: 'Querem deixar-nos alguma *sugestão*?', max: MAX_SUGESTAO },
]

export const perguntasVisiveis = (r: Respostas) => PERGUNTAS.filter(p => !p.mostrarSe || p.mostrarSe(r))

/** Título sem os asteriscos que marcam a palavra em itálico dourado. */
export const tituloSimples = (t: string) => t.replace(/\*/g, '')

/** Valida e limpa as respostas vindas do browser. Devolve null se algo não bater certo. */
export function limparRespostas(bruto: unknown): Respostas | null {
  if (!bruto || typeof bruto !== 'object') return null
  const r = bruto as Record<string, unknown>
  const out: Respostas = {}
  for (const p of PERGUNTAS) {
    const v = r[p.id]
    if (v === undefined || v === null || v === '') continue
    if (p.tipo === 'escala') {
      if (typeof v !== 'number' || !Number.isInteger(v) || v < 1 || v > 5) return null
      out[p.id] = v
    } else if (p.tipo === 'unica') {
      if (typeof v !== 'string' || !p.opcoes.includes(v)) return null
      out[p.id] = v
    } else if (p.tipo === 'multipla') {
      if (!Array.isArray(v) || v.some(x => typeof x !== 'string' || !p.opcoes.includes(x))) return null
      if (v.length) out[p.id] = [...new Set(v as string[])]
    } else if (p.tipo === 'texto') {
      if (typeof v !== 'string') return null
      const t = v.trim().slice(0, p.max)
      if (t) out[p.id] = t
    }
  }
  // Pergunta condicional respondida sem a condição: descarta
  for (const p of PERGUNTAS) if (p.mostrarSe && !p.mostrarSe(out)) delete out[p.id]
  return Object.keys(out).length ? out : null
}

/** Texto legível de uma resposta (email e ficha do CRM). */
export function respostaTexto(p: Pergunta, v: Resposta | undefined): string {
  if (v === undefined) return '—'
  if (p.tipo === 'escala') {
    const leg = v === 1 ? p.legendas[0] : v === 3 ? p.legendas[1] : v === 5 ? p.legendas[2] : ''
    return `${v} / 5${leg ? ` (${leg})` : ''}`
  }
  return Array.isArray(v) ? v.join(', ') : String(v)
}

/** Motivo do CRM (MOTIVOS_NAO_FECHOU) a partir das respostas, ou null. */
export function motivoDasRespostas(r: Respostas): string | null {
  const d = Array.isArray(r.decisao) ? r.decisao : []
  if (d.includes('O preço')) return 'Preço'
  if (d.includes('A data já não estava disponível')) return 'Data ocupada'
  if (d.includes('Preferimos outro estilo') || r.outro === 'Sim') return 'Escolheram outro fornecedor'
  if (d.includes('Decidimos não ter foto ou vídeo')) return 'Desistiram do serviço'
  if (d.length) return 'Outro'
  return null
}
