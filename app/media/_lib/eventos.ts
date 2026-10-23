import type { SupabaseClient } from '@supabase/supabase-js'

// Eventos do calendário da RL PROD: filmagens, entregas e pagamentos (media_portais)
// + reuniões (media_leads). Usado na página inicial (30 dias) e em /media/calendario (ano).

export type TipoEvento = 'filmagem' | 'entrega' | 'reuniao' | 'pagamento'

export type EventoMedia = {
  dia: string          // YYYY-MM-DD
  tipo: TipoEvento
  titulo: string
  href: string
}

export const TIPOS: Record<TipoEvento, { nome: string; cor: string }> = {
  filmagem:  { nome: 'Filmagem',  cor: '#2e6cf6' },
  entrega:   { nome: 'Entrega',   cor: '#a9c1ff' },
  reuniao:   { nome: 'Reunião',   cor: '#ffffff' },
  pagamento: { nome: 'Pagamento', cor: '#ff4747' },
}

const MESES: Record<string, number> = { jan: 0, fev: 1, feb: 1, mar: 2, abr: 3, apr: 3, mai: 4, may: 4, jun: 5, jul: 6, ago: 7, aug: 7, set: 8, sep: 8, out: 9, oct: 9, nov: 10, dez: 11, dec: 11 }

// As datas vêm como "2026-05-09", "09/05/2026" ou "15 Jul 2025"
export function lerData(v?: string | null): Date | null {
  if (!v) return null
  const t = v.trim()
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3])
  const pt = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (pt) return new Date(+pt[3], +pt[2] - 1, +pt[1])
  const ext = t.match(/^(\d{1,2})\s+([A-Za-zçÇ]{3})[a-zç]*\.?\s+(\d{4})$/)
  const m = ext ? MESES[ext[2].toLowerCase()] : undefined
  if (ext && m !== undefined) return new Date(+ext[3], m, +ext[1])
  return null
}

// "Hoje" em Portugal (o servidor do Vercel corre em UTC)
export function hojeLisboa(): Date {
  const [a, m, d] = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Lisbon' }).split('-').map(Number)
  return new Date(a, m - 1, d)
}

export const chaveDia =(d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export type PortalMedia = { ref: string; nome: string | null; filmagem: string | null; entrega: string | null; pagamentos: any }
export type LeadMedia = { id: string; nome: string | null; empresa: string | null; reuniao_data: string | null }

// Uma leitura de cada tabela; a página inicial reaproveita os portais para os pagamentos em falta
export async function lerFontesMedia(supabase: SupabaseClient) {
  const [{ data: portais }, { data: leads }] = await Promise.all([
    // Só os campos precisos do JSON (poupar egress)
    supabase.from('media_portais').select('ref, nome:dados->>nome, filmagem:dados->>dataFilmagem, entrega:dados->>dataEntrega, pagamentos:dados->pagamentos'),
    supabase.from('media_leads').select('id, nome, empresa, reuniao_data').neq('reuniao_data', ''),
  ])
  return { portais: (portais ?? []) as unknown as PortalMedia[], leads: (leads ?? []) as LeadMedia[] }
}

export function montarEventos(portais: PortalMedia[], leads: LeadMedia[]): EventoMedia[] {
  const eventos: EventoMedia[] = []
  const juntar = (v: string | null | undefined, tipo: TipoEvento, titulo: string, href: string) => {
    const d = lerData(v)
    if (d) eventos.push({ dia: chaveDia(d), tipo, titulo, href })
  }

  for (const p of portais) {
    const nome = p.nome || p.ref || 'Projeto'
    juntar(p.filmagem, 'filmagem', nome, '/media/portal-cliente')
    juntar(p.entrega, 'entrega', nome, '/media/portal-cliente')
    for (const pg of Array.isArray(p.pagamentos) ? p.pagamentos : []) {
      if (pg?.estado !== 'pago') juntar(pg?.data, 'pagamento', `${nome} · ${pg?.descricao || 'Pagamento'}`, '/media/financas')
    }
  }
  for (const l of leads) {
    juntar(l.reuniao_data, 'reuniao', l.empresa || l.nome || 'Lead', '/media/crm/leads')
  }

  return eventos.sort((a, b) => a.dia.localeCompare(b.dia))
}
