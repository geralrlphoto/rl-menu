import type { SupabaseClient } from '@supabase/supabase-js'
import type { WaTarefa } from '@/app/components/WaTarefaChip'
import { nomeNoivos, ehBatizado } from '@/lib/crm'

/* Contratos por assinar: eventos de hoje em diante com o contrato disponível no
   portal e ainda sem o contrato assinado registado (enviado pelo portal ou marcado
   à mão pelo admin). Para cada um, a tarefa de WhatsApp: pedir o contrato 2 dias
   depois de o portal ser criado e lembrar 7 dias depois do pedido.
   Usado no cartão Tarefas do /photo e na página /tarefas. */

export const CONTRATO_PEDIR_DIAS = 2
export const CONTRATO_LEMBRETE_DIAS = 7

const lisboaISO = (d: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(d)
const somaDias = (iso: string, n: number) => {
  const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}
const difDias = (a: string, b: string) => Math.round((Date.parse(a + 'T12:00:00Z') - Date.parse(b + 'T12:00:00Z')) / 86400000)

export async function contratosPorAssinar(sb: SupabaseClient): Promise<WaTarefa[]> {
  const hoje = lisboaISO(new Date())
  const { data: portais } = await sb.from('portais')
    .select('referencia, created_at')
    .eq('settings->>contratoDisponivel', 'true')
    .is('settings->>contratoAssinadoEm', null)
    .limit(500)
  const refs = (portais ?? []).map((p: any) => p.referencia).filter(Boolean)
  if (refs.length === 0) return []
  const { data: evs } = await sb.from('eventos_2026')
    .select('id, referencia, cliente, data_evento, tipo_evento, nome_crianca')
    .in('referencia', refs).gte('data_evento', hoje).order('data_evento')
  const ids = (evs ?? []).map((e: any) => e.id)
  if (ids.length === 0) return []
  const [{ data: tels }, { data: env }] = await Promise.all([
    sb.from('dados_contrato_cps').select('referencia_evento, nome_noiva, nome_noivo, tel_noiva, tel_noivo').in('referencia_evento', refs),
    sb.from('eventos_whatsapp_envios').select('evento_id, evento, created_at').in('evento', ['pedir_contrato', 'lembrete_contrato']).in('evento_id', ids),
  ])

  return (evs ?? []).map((ev: any) => {
    const portal = (portais ?? []).find((p: any) => String(p.referencia).toLowerCase() === String(ev.referencia).toLowerCase())
    const envios: Record<string, string> = {}
    for (const x of (env ?? []) as any[]) if (x.evento_id === ev.id) envios[x.evento] = x.created_at
    const c = ((tels ?? []) as any[]).find(t => t.referencia_evento === ev.referencia)
    const devido = envios.pedir_contrato
      ? somaDias(lisboaISO(new Date(envios.pedir_contrato)), CONTRATO_LEMBRETE_DIAS)
      : somaDias(lisboaISO(new Date(portal?.created_at ?? new Date())), CONTRATO_PEDIR_DIAS)
    return {
      tipo: envios.pedir_contrato ? 'lembrete_contrato' : 'contrato',
      contactId: ev.id,
      nome: nomeNoivos(ev.cliente, c?.nome_noiva, c?.nome_noivo),
      contato: c?.tel_noiva || c?.tel_noivo || null,
      batizado: ehBatizado(ev.tipo_evento) ? { crianca: ev.nome_crianca ?? null } : null,
      reuniaoHora: null,
      dataCasamento: ev.data_evento,
      referencia: ev.referencia,
      atrasoDias: Math.max(0, difDias(hoje, devido)),
      futura: false,
      pedidoEm: envios.pedir_contrato ? lisboaISO(new Date(envios.pedir_contrato)) : null,
      lembreteEm: envios.lembrete_contrato ? lisboaISO(new Date(envios.lembrete_contrato)) : null,
    } as WaTarefa
  })
}
