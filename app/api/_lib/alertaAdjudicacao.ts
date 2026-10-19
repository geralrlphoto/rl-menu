// Alerta no calendário: a 2 dias do casamento (ou batizado) sem adjudicação
// confirmada, cria para hoje a tarefa "Adjudicação em falta: <noivos>".
// Corre todos os dias dentro do /api/newsletter-cron (sem gastar outro cron).
import { createClient } from '@supabase/supabase-js'
import { adjudicacaoPaga } from '@/lib/portalBloqueio'

const DIAS_ANTES = 2

const db = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const hojeLisboa = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date())

function somaDias(iso: string, n: number) {
  const d = new Date(iso + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

// CAS_026_26_RL e CAS_26_26_RL são a mesma referência (igual a /api/pagamentos-by-ref)
function variantes(ref: string) {
  const v = new Set([ref])
  v.add(ref.replace(/_(\d{2})_RL/, (_, a) => `_0${a}_RL`))
  v.add(ref.replace(/_0(\d{2})_RL/, (_, a) => `_${a}_RL`))
  return [...v]
}

export async function runAlertaAdjudicacao() {
  const sb = db()
  const hoje = hojeLisboa()
  const dia = somaDias(hoje, DIAS_ANTES)

  const { data: eventos } = await sb.from('eventos_2026')
    .select('id, referencia, cliente, data_evento, local, status')
    .eq('data_evento', dia)

  let criadas = 0
  for (const ev of eventos ?? []) {
    if (!ev.referencia || /cancel/i.test(String(ev.status ?? ''))) continue

    // Só contam os pagamentos que já confirmámos em /financas
    const { data: pags } = await sb.from('pagamentos_noivos')
      .select('fase_pagamento, valor_liquidado')
      .in('referencia', variantes(ev.referencia))
      .eq('confirmado', true)
    if (adjudicacaoPaga(pags ?? [])) continue

    const titulo = `Adjudicação em falta: ${ev.cliente || ev.referencia}`
    const { data: existe } = await sb.from('tarefas').select('id').eq('titulo', titulo).eq('data_prazo', hoje).limit(1)
    if (existe?.length) continue

    const dataFmt = new Date(dia + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    await sb.from('tarefas').insert({
      titulo,
      descricao: [
        `O casamento é daqui a ${DIAS_ANTES} dias (${dataFmt}${ev.local ? `, ${ev.local}` : ''}) e ainda não há adjudicação confirmada.`,
        `Referência: ${ev.referencia}`,
        'Confirmem o pagamento em /financas ou falem com os noivos.',
      ].join('\n'),
      data_prazo: hoje,
      hora: '09:00',
      status: 'NOVA',
      evento_id: ev.id,
    })
    criadas++
  }
  return { dia, eventos: eventos?.length ?? 0, criadas }
}
