/* ============================================================
   Promessas numa resposta de WhatsApp enviada.
   "amanhã envio", "para a semana voltamos a enviar", "até sexta",
   "dia 25", "em 3 dias"… viram uma tarefa com prazo em /tarefas,
   para nenhum cliente ficar à espera esquecido.
   Devolve a primeira promessa do texto (frase + prazo AAAA-MM-DD) ou null.
   ============================================================ */

export type Promessa = { frase: string; prazo: string }

const DIAS_SEMANA: Record<string, number> = {
  domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6,
}
const MESES: Record<string, number> = {
  janeiro: 0, fevereiro: 1, marco: 2, abril: 3, maio: 4, junho: 5, julho: 6,
  agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
}
const NUMEROS: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, dez: 10, quinze: 15 }

/** Hoje em Lisboa, à meia-noite UTC (só interessa o dia). */
function hojeLisboa(agora: Date): Date {
  return new Date(agora.toLocaleDateString('en-CA', { timeZone: 'Europe/Lisbon' }) + 'T00:00:00Z')
}
const somar = (d: Date, n: number) => new Date(d.getTime() + n * 86_400_000)
const iso = (d: Date) => d.toISOString().slice(0, 10)
/** Próximo dia da semana (hoje não conta). */
function proximo(d: Date, dia: number): Date {
  const falta = ((dia - d.getUTCDay()) + 7) % 7 || 7
  return somar(d, falta)
}
const semAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const num = (s: string) => (/^\d+$/.test(s) ? Number(s) : NUMEROS[s] ?? NaN)

type Regra = { re: RegExp; prazo: (m: RegExpMatchArray, hoje: Date) => Date | null }

const REGRAS: Regra[] = [
  { re: /depois de amanha/, prazo: (_, h) => somar(h, 2) },
  { re: /\bamanha\b/, prazo: (_, h) => somar(h, 1) },
  { re: /\bainda hoje\b|\bate ao fim do dia\b|\bhoje mesmo\b/, prazo: (_, h) => h },
  { re: /\b(?:para a|na proxima|proxima|na) semana(?! passada)(?: que vem)?\b|\bsemana que vem\b/, prazo: (_, h) => somar(proximo(h, 1), 4) },
  { re: /\b(?:esta semana|ate ao fim da semana|ate final da semana)\b/, prazo: (_, h) => (h.getUTCDay() === 5 ? h : proximo(h, 5)) },
  { re: /\b(?:ate (?:a |ao )?|na |no |nesta |neste |proxima |proximo )(segunda|terca|quarta|quinta|sexta|sabado|domingo)/, prazo: (m, h) => proximo(h, DIAS_SEMANA[m[1]]) },
  { re: /\b(?:em|dentro de|daqui a|nos proximos) (\d+|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|dez|quinze) dias?\b/, prazo: (m, h) => (isNaN(num(m[1])) ? null : somar(h, num(m[1]))) },
  { re: /\b(?:em|dentro de|daqui a|nas proximas) (\d+|uma|duas|tres|quatro) semanas?\b/, prazo: (m, h) => (isNaN(num(m[1])) ? null : somar(h, 7 * num(m[1]))) },
  { re: /\b(?:ate (?:ao )?|no |o )?dia (\d{1,2})(?: de (janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro))?\b/, prazo: (m, h) => {
      const dia = Number(m[1])
      if (dia < 1 || dia > 31) return null
      const ano = h.getUTCFullYear()
      let mes = m[2] ? MESES[m[2]] : h.getUTCMonth()
      let d = new Date(Date.UTC(ano, mes, dia))
      if (d < h) { // já passou: mês seguinte (ou ano seguinte, se o mês foi dito)
        if (m[2]) d = new Date(Date.UTC(ano + 1, mes, dia))
        else { mes += 1; d = new Date(Date.UTC(ano, mes, dia)) }
      }
      return d
    } },
  { re: /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/, prazo: (m, h) => {
      const dia = Number(m[1]); const mes = Number(m[2]) - 1
      if (dia < 1 || dia > 31 || mes < 0 || mes > 11) return null
      let ano = m[3] ? Number(m[3].length === 2 ? '20' + m[3] : m[3]) : h.getUTCFullYear()
      let d = new Date(Date.UTC(ano, mes, dia))
      if (!m[3] && d < h) d = new Date(Date.UTC(++ano, mes, dia))
      return d
    } },
]

/** Frase (até ao ponto) onde está a posição i do texto original. */
function fraseEm(texto: string, i: number): string {
  const ini = Math.max(texto.lastIndexOf('.', i - 1), texto.lastIndexOf('!', i - 1), texto.lastIndexOf('?', i - 1), texto.lastIndexOf('\n', i - 1)) + 1
  const fins = ['.', '!', '?', '\n'].map(c => texto.indexOf(c, i)).filter(x => x >= 0)
  const fim = fins.length ? Math.min(...fins) + 1 : texto.length
  return texto.slice(ini, fim).trim()
}

export function encontrarPromessa(texto: string, agora = new Date()): Promessa | null {
  const t = semAcentos(texto) // mesmo comprimento que o original (só tira marcas combinadas)
  const hoje = hojeLisboa(agora)
  let melhor: { i: number; prazo: Date } | null = null
  for (const r of REGRAS) {
    const m = t.match(r.re)
    if (!m || m.index === undefined) continue
    const prazo = r.prazo(m, hoje)
    if (!prazo || isNaN(prazo.getTime())) continue
    if (!melhor || m.index < melhor.i) melhor = { i: m.index, prazo }
  }
  if (!melhor) return null
  // semAcentos pode encurtar o texto (ç, ã…) só se vierem decompostos; para a frase usamos o original
  return { frase: fraseEm(texto, Math.min(melhor.i, texto.length - 1)), prazo: iso(melhor.prazo) }
}
