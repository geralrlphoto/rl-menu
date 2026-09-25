// Reunião de preparação do dia: disponibilidade comum (preparacao_slots) e
// dados do casal. Usado pelas rotas /api/preparacao* e pelo /photo.
import { createClient } from '@supabase/supabase-js'
import { nomeNoivos, ehBatizado } from '@/lib/crm'

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export const FORMATOS = ['Presencial', 'Videochamada'] as const
// "Outro dia e horário": horas que os noivos podem escolher fora da disponibilidade (só dias úteis)
export const HORAS_OUTRO = ['10:00', '11:00', '12:00', '17:00', '18:00', '19:00', '20:00']

export type OpcaoHorario = { data: string; hora: string }

/* Valida o pedido de "outro horário": 1 a 2 opções, em dias úteis diferentes,
   de amanhã até à véspera do evento e só nas horas de HORAS_OUTRO. */
export function validarPedido(pedido: unknown, dataEvento: string | null, batizado = false): { opcoes: OpcaoHorario[] } | { erro: string } {
  if (!Array.isArray(pedido) || pedido.length < 1 || pedido.length > 2) return { erro: 'Escolham uma ou duas opções.' }
  const opcoes: OpcaoHorario[] = []
  for (const o of pedido) {
    const data = String(o?.data ?? ''), hora = String(o?.hora ?? '')
    const d = /^\d{4}-\d{2}-\d{2}$/.test(data) ? new Date(data + 'T12:00:00Z') : null
    if (!d || isNaN(d.getTime()) || !HORAS_OUTRO.includes(hora)) return { erro: 'Escolham um dia e uma hora válidos.' }
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) return { erro: 'Ao fim de semana não é possível. Escolham um dia útil, por favor.' }
    if (data <= hojeLisboa()) return { erro: 'Escolham um dia a partir de amanhã, por favor.' }
    if (dataEvento && data >= dataEvento) return { erro: `Escolham um dia antes ${batizado ? 'do batizado' : 'do casamento'}, por favor.` }
    if (opcoes.some(x => x.data === data)) return { erro: 'As duas opções têm de ser em dias diferentes.' }
    opcoes.push({ data, hora })
  }
  return { opcoes: opcoes.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)) }
}

/* Admin confirma uma opção do pedido: usa o horário se existir livre (senão cria-o já
   reservado) e liberta a marcação anterior do casal. */
export async function reservarOpcao(eventoId: string, o: OpcaoHorario): Promise<{ erro?: string }> {
  const sb = sbAdmin()
  const { data: existente } = await sb.from('preparacao_slots').select('id, evento_id')
    .eq('tipo', 'preparacao').eq('data', o.data).eq('hora', o.hora).maybeSingle()
  if (existente?.evento_id === eventoId) return {}
  if (existente?.evento_id) return { erro: 'Esse horário já está ocupado por outro casal.' }
  const { data: anterior } = await sb.from('preparacao_slots').select('id').eq('tipo', 'preparacao').eq('evento_id', eventoId).maybeSingle()
  if (anterior) await sb.from('preparacao_slots').update({ evento_id: null, formato: null, reservado_em: null }).eq('id', anterior.id)
  const reserva = { evento_id: eventoId, formato: 'Videochamada', reservado_em: new Date().toISOString() }
  const { error } = existente
    ? await sb.from('preparacao_slots').update(reserva).eq('id', existente.id).is('evento_id', null)
    : await sb.from('preparacao_slots').insert({ tipo: 'preparacao', data: o.data, hora: o.hora, ...reserva })
  if (error) {
    if (anterior) await sb.from('preparacao_slots').update(reserva).eq('id', anterior.id).is('evento_id', null)
    return { erro: 'Não foi possível marcar.' }
  }
  return {}
}

/* Simulação: /preparacao/demo mostra um casal fictício. Nada é gravado nem enviado por email. */
export const DEMO_ID = 'demo'
export function demoPreparacao() {
  const dia = (n: number) => { const d = new Date(hojeLisboa() + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d }
  const ymd = (d: Date) => d.toISOString().slice(0, 10)
  // Alguns horários "publicados" nos próximos dias úteis
  const slots: { id: string; data: string; hora: string }[] = []
  for (let n = 1; slots.length < 9 && n < 30; n++) {
    const d = dia(n)
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6 || n % 2) continue
    for (const hora of ['18:00', '19:00', '20:00']) slots.push({ id: `demo-${ymd(d)}-${hora}`, data: ymd(d), hora })
  }
  return { nome: 'Ana e Pedro', dataEvento: ymd(dia(45)), local: 'Quinta de Simulação', slots }
}

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
      .select('*')
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
  return {
    id: ev.id as string, referencia: ev.referencia, cliente: ev.cliente, data_evento: ev.data_evento, local: ev.local,
    local_cerimonia: (ev.local_cerimonia ?? null) as string | null, hora_inicio: (ev.hora_inicio ?? null) as string | null,
    nome: nomeNoivos(ev.cliente, c?.nome_noiva, c?.nome_noivo),
    batizado: ehBatizado(ev.tipo_evento),
    crianca: ((ev.nome_crianca ?? '') as string).trim().split(/\s+/)[0] || null,
    nome_crianca_completo: ((ev.nome_crianca ?? '') as string).trim() || null,
  }
}

/* "YYYY-MM-DD HH:MM" na hora de Lisboa */
export function agoraLisboa(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Lisbon', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date())
}

/* Duração considerada para a reunião antes de o link expirar */
const REUNIAO_MIN = 60

/* O link dos noivos expira quando a reunião acaba (hora marcada + 1h) ou, sem
   reunião marcada, no dia do evento. "Reativar link" na ficha abre-o de novo. */
export function estadoLink(
  dataEvento: string | null | undefined,
  reserva: { data: string; hora: string } | null,
  reativadoAte: string | null | undefined,
): { expirado: boolean; expiraEm: string | null } {
  if (reativadoAte && new Date(reativadoAte).getTime() > Date.now()) return { expirado: false, expiraEm: null }
  const agora = agoraLisboa()
  let limite: string | null = null
  if (reserva) {
    const [h, m] = reserva.hora.split(':').map(Number)
    const d = new Date(`${reserva.data}T00:00:00Z`); d.setUTCMinutes(h * 60 + m + REUNIAO_MIN)
    limite = d.toISOString().slice(0, 16).replace('T', ' ')
  } else if (dataEvento) {
    limite = `${String(dataEvento).slice(0, 10)} 00:00`
  }
  return { expirado: !!limite && agora >= limite, expiraEm: limite }
}

export function fmtDataLonga(iso: string): string {
  try {
    return new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  } catch { return iso }
}
