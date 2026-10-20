import { createClient } from '@supabase/supabase-js'

// Referência da seleção de fotos: tem de existir e tem de ser dos noivos que
// enviam (pelo menos um nome em comum com o cliente do evento). Usado pelo
// formulário (/api/selecao-fotos-evento) e pela submissão (/api/selecao-fotos-submit).

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const nomes = (t: string | null | undefined) =>
  new Set(norm(t ?? '').split(/[^a-z]+/).filter(w => w.length > 2 && !['casamento', 'batizado'].includes(w)))

export async function encontrarEventoSelecao(ref: string | null | undefined) {
  const r = (ref ?? '').trim()
  if (!/^[A-Z]{3}_\w+$/i.test(r)) return null
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  for (const t of ['eventos_2026', 'eventos_2027']) {
    const { data } = await sb.from(t).select('referencia, cliente, data_evento').ilike('referencia', r).maybeSingle()
    if (data?.referencia) return { referencia: data.referencia as string, nome: (data.cliente ?? '') as string, data: (data.data_evento ?? null) as string | null }
  }
  return null
}

/** Os nomes indicados pelos noivos batem com o casamento desta referência? */
export function nomesBatem(nomeIndicado: string | null | undefined, nomeEvento: string | null | undefined) {
  const a = nomes(nomeIndicado), b = nomes(nomeEvento)
  return [...a].some(n => b.has(n))
}

/**
 * Quantas fotografias o pacote inclui ("ATÉ 700 FOTOGRAFIAS"): na proposta aceite no
 * CRM (portais.settings.propostaToken), como o portal dos noivos, senão nos serviços
 * de fotografia da ficha. null quando não se sabe.
 */
export async function limiteFotosPacote(referencia: string): Promise<number | null> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const achar = (lista: unknown[]) => {
    for (const x of lista) { const m = String(x ?? '').match(/at[ée]\s*(\d{2,5})\s*foto/i); if (m) return Number(m[1]) }
    return null
  }
  const { data: pt } = await sb.from('portais').select('settings->propostaToken').eq('referencia', referencia).maybeSingle()
  const token = (pt as any)?.propostaToken
  if (token) {
    const { data: c } = await sb.from('crm_contacts').select('page_content').eq('page_token', token).maybeSingle()
    const pc = typeof c?.page_content === 'string' ? JSON.parse(c.page_content || '{}') : (c?.page_content || {})
    const prop = pc.propostaAceite?.nome ? pc.propostaAceite : (pc.propostas ?? [])[pc.propostaPage?.propostaAtiva ?? 0]
    const n = prop ? achar(prop.servicos_foto ?? []) : null
    if (n) return n
  }
  for (const t of ['eventos_2026', 'eventos_2027']) {
    const { data } = await sb.from(t).select('servico_foto').eq('referencia', referencia).maybeSingle()
    if (data) return achar(Array.isArray(data.servico_foto) ? data.servico_foto : [])
  }
  return null
}
