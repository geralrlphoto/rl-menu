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

/* Evento + nome do casal (primeiros nomes do contrato, senão o campo cliente) */
export async function eventoPreparacao(eventoId: string) {
  const sb = sbAdmin()
  const { data: ev } = await sb.from('eventos_2026')
    .select('id, referencia, cliente, data_evento, local')
    .eq('id', eventoId).maybeSingle()
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
