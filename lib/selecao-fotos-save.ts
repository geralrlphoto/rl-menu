import { createClient } from '@supabase/supabase-js'

// Gravação de uma seleção de fotos — Supabase + Notion.
// Usada pelo webhook do Tally (/api/webhook-tally-selecao) e pelo formulário
// próprio (/api/selecao-fotos-submit), para os dois seguirem o mesmo fluxo.

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const NOTION_DB_ID = '30d220116d8a80cf8568e19df7af1d7b' // "FOTOS P/SELEÇÃO" database

export type SelecaoFotos = {
  nome_noivos: string
  referencia: string | null
  date: string | null
  data_entrada: string
  preparacao: string | null
  sessao_noivos: string | null
  fotos_noiva: string | null
  fotos_noivo: string | null
  convidados: string | null
  cerimonia: string | null
  bolo_bouquet: string | null
  sala_animacao: string | null
  fotos_album: string | null
  detalhes: string | null
}

// Colunas com números de fotografias (detalhes é texto livre, fica de fora).
const COLUNAS_FOTOS = [
  'preparacao', 'sessao_noivos', 'fotos_noiva', 'fotos_noivo', 'convidados',
  'cerimonia', 'bolo_bouquet', 'sala_animacao', 'fotos_album',
] as const

// Os números chegam separados por vírgula, ponto e vírgula ou linha; ficam
// sempre guardados separados por "; ".
export function normalizarNumeros(valor: string | null): string | null {
  if (!valor) return valor
  const partes = valor.split(/[;,\r\n]+/).map(v => v.trim()).filter(Boolean)
  return partes.length ? partes.join('; ') : null
}

export function normalizarSelecao(data: SelecaoFotos): SelecaoFotos {
  const out: SelecaoFotos = { ...data }
  for (const col of COLUNAS_FOTOS) {
    out[col] = normalizarNumeros(out[col])
  }
  return out
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function rt(text: string | null) {
  // Notion rich_text property value
  return { rich_text: [{ text: { content: text ?? '' } }] }
}

export async function saveToNotion(data: SelecaoFotos) {
  const properties: Record<string, any> = {
    'NOME DOS NOIVOS':      { title: [{ text: { content: data.nome_noivos } }] },
    'REFERÊNCIA DO EVENTO': rt(data.referencia),
    'PREPARAÇÃO':           rt(data.preparacao),
    'SESSÃO NOIVOS':        rt(data.sessao_noivos),
    'FOTOS DA NOIVA':       rt(data.fotos_noiva),
    'FOTOS DO NOIVO':       rt(data.fotos_noivo),
    'CONVIDADOS':           rt(data.convidados),
    'CERIMÓNIA':            rt(data.cerimonia),
    'BOLO E BOUQUET':       rt(data.bolo_bouquet),
    'SALA E ANIMAÇÃO':      rt(data.sala_animacao),
    'FOTOS P/ÁLBUM':        rt(data.fotos_album),
    'DETALHES':             rt(data.detalhes),
  }

  if (data.date) {
    properties['Date'] = { date: { start: data.date } }
  }
  properties['Data  de Entrada'] = { date: { start: data.data_entrada } }

  async function criar(props: Record<string, any>) {
    return fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ parent: { database_id: NOTION_DB_ID }, properties: props }),
    })
  }

  let res = await criar(properties)

  // A base do Notion pode ainda não ter a propriedade PREPARAÇÃO (usada só no
  // batizado). Nesse caso o Notion recusa a página inteira — repete sem ela.
  if (!res.ok) {
    const err = await res.text()
    if (err.includes('PREPARAÇÃO') || err.includes('is not a property that exists')) {
      const { 'PREPARAÇÃO': _fora, ...resto } = properties
      console.warn('[selecao-fotos] Notion sem a propriedade PREPARAÇÃO — a gravar sem essa secção')
      res = await criar(resto)
    } else {
      console.error('[selecao-fotos] Notion error:', err)
      return
    }
  }

  if (!res.ok) {
    console.error('[selecao-fotos] Notion error:', await res.text())
  } else {
    const page = await res.json()
    console.log('[selecao-fotos] Notion page created:', page.id)
  }
}

// Grava no Supabase e, sem bloquear, cria a página no Notion.
export async function saveSelecao(entrada: SelecaoFotos, tag = 'selecao-fotos') {
  const mapped = normalizarSelecao(entrada)

  const { data: saved, error } = await db()
    .from('fotos_selecao')
    .insert(mapped)
    .select()
    .single()

  if (error) {
    console.error(`[${tag}] Supabase error:`, error)
    return { id: null as string | null, error: error.message }
  }
  console.log(`[${tag}] Supabase row saved:`, saved?.id, saved?.nome_noivos)

  saveToNotion(mapped).catch(e =>
    console.error(`[${tag}] Notion save failed:`, e)
  )

  // Começa a contar o prazo das Fotos Finais (30 dias) no casamento certo
  await marcarSelecaoRecebida(mapped).catch(e => console.error(`[${tag}] selecao_recebida:`, e))

  return { id: saved?.id as string | null, error: null as string | null }
}

const semAcentos = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const nomesDe = (t: string | null | undefined) =>
  new Set(semAcentos(String(t ?? '')).split(/[^a-z]+/).filter(p => p.length >= 3 && !['casamento', 'batizado'].includes(p)))

/**
 * Encontra o casamento desta seleção. Os noivos raramente escrevem bem a
 * referência ("Prestação de Serviços", "CAS_2208_26"), por isso:
 *  1) referência válida que exista nos eventos;
 *  2) senão, a data do casamento: um só evento nesse dia, ou o único cujo
 *     cliente partilha um nome com os noivos.
 * Sem certeza devolve null (fica para preencher à mão na ficha).
 */
export async function encontrarEventoDaSelecao(s: Pick<SelecaoFotos, 'referencia' | 'date' | 'nome_noivos'>): Promise<string | null> {
  const sb = db()
  const tabelas = ['eventos_2026', 'eventos_2027']
  const ref = String(s.referencia ?? '').trim()
  if (/^[A-Z]{3}_\d+_\d+_RL$/i.test(ref)) {
    for (const t of tabelas) {
      const { data } = await sb.from(t).select('referencia').ilike('referencia', ref).maybeSingle()
      if (data?.referencia) return data.referencia
    }
  }
  if (!s.date || !/^\d{4}-\d{2}-\d{2}$/.test(s.date)) return null
  const candidatos: Array<{ referencia: string; cliente: string | null }> = []
  for (const t of tabelas) {
    const { data } = await sb.from(t).select('referencia, cliente').eq('data_evento', s.date)
    for (const e of data ?? []) if (e.referencia) candidatos.push(e)
  }
  if (candidatos.length === 1) return candidatos[0].referencia
  const meus = nomesDe(s.nome_noivos)
  const comNome = candidatos.filter(c => [...nomesDe(c.cliente)].some(n => meus.has(n)))
  return comNome.length === 1 ? comNome[0].referencia : null
}

/* Grava a data de entrada da seleção no portal do casamento (só se ainda não houver) */
async function marcarSelecaoRecebida(s: SelecaoFotos) {
  const ref = await encontrarEventoDaSelecao(s)
  if (!ref) return
  const sb = db()
  const { data: portal } = await sb.from('portais').select('referencia, settings').ilike('referencia', ref).maybeSingle()
  if (!portal) return
  const settings = (portal.settings ?? {}) as Record<string, unknown>
  if (settings.selecao_recebida) return
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(s.data_entrada) ? s.data_entrada : new Date().toISOString().slice(0, 10)
  await sb.from('portais').update({ settings: { ...settings, selecao_recebida: dia }, updated_at: new Date().toISOString() }).eq('referencia', portal.referencia)
  try {
    const { revalidateTag, revalidatePath } = await import('next/cache')
    revalidateTag('photo-portais', { expire: 0 })
    revalidatePath('/photo')
  } catch { /* fora de um pedido Next */ }
}
