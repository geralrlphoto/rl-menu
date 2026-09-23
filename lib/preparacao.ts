// Reunião de preparação do dia: disponibilidade comum (preparacao_slots) e
// dados do casal. Usado pelas rotas /api/preparacao* e pelo /photo.
import { createClient } from '@supabase/supabase-js'
import { nomeNoivos } from '@/lib/crm'

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const FORMATOS = ['Presencial', 'Videochamada'] as const

export function sbAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export function hojeLisboa(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date())
}

/* Evento + nome do casal (primeiros nomes do contrato, senão o campo cliente).
   Aceita o id interno ou o id do Notion (a ficha /eventos-2026/<id> usa o do Notion)
   e devolve sempre o id interno em `id`. */
export async function eventoPreparacao(eventoId: string) {
  const sb = sbAdmin()
  let ev: any = null
  for (const tabela of ['eventos_2026', 'eventos_2027']) {
    const { data } = await sb.from(tabela)
      .select('id, referencia, cliente, data_evento, local')
      .or(`id.eq.${eventoId},notion_id.eq.${eventoId}`).limit(1).maybeSingle()
    if (data) { ev = data; break }
  }
  if (!ev) return null
  let c: any = null
  if (ev.referencia) {
    const { data } = await sb.from('dados_contrato_cps')
      .select('nome_noiva, nome_noivo').eq('referencia_evento', ev.referencia)
      .order('id', { ascending: false }).limit(1).maybeSingle()
    c = data
  }
  return { ...ev, nome: nomeNoivos(ev.cliente, c?.nome_noiva, c?.nome_noivo) }
}

export function fmtDataLonga(iso: string): string {
  try {
    return new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  } catch { return iso }
}
