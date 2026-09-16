'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Contact = {
  id: string
  notion_id?: string | null
  nome: string
  contato: string
  email: string
  status: string
  lead_prioridade: string
  tipo_evento: string
  data_casamento: string
  data_entrada: string
  local_casamento: string
  orcamento: string
  como_chegou: string
  servicos: string
  status_updated_at: string
  data_fecho: string
}

// Colunas que a LISTA do CRM usa — exclui de propósito o `page_content`
// (propostas, ~3 KB/linha) que só é preciso na ficha /crm/[id]. Puxar só
// isto em vez de `select *` corta ~75% do egress por abertura do CRM.
const LIST_COLUMNS =
  'id,notion_id,nome,contato,email,status,lead_prioridade,tipo_evento,data_casamento,data_entrada,local_casamento,orcamento,como_chegou,servicos,status_updated_at,data_fecho'

const statusColor: Record<string, string> = {
  'Fechou': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Negociação': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Por Contactar': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Contactado': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Reunião Agendada': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'NÃO FECHOU': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  'Agendar Reunião': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'Sem resposta': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Encerrado': 'bg-gray-700/20 text-gray-500 border-gray-700/30',
  'Cancelado': 'bg-red-900/20 text-red-600 border-red-900/30',
  'Iniciar': 'bg-white/10 text-white/50 border-white/20',
}

// Colunas do quadro. Nova Entrada apanha tudo o que não cai nas outras
// (Por Contactar, Iniciar, Contactado, Agendar Reunião, sem status).
type ColunaKey = 'nova' | 'reuniao' | 'follow' | 'encerrada'
const REUNIAO_STATUSES = ['Reunião Agendada']
const FOLLOW_STATUSES = ['Negociação']
const ENCERRADA_STATUSES = ['Fechou', 'NÃO FECHOU', 'Sem resposta', 'Encerrado', 'Cancelado']
const COLUNAS: { key: ColunaKey; label: string; accent: string }[] = [
  { key: 'nova', label: 'Nova Entrada', accent: 'bg-red-400' },
  { key: 'reuniao', label: 'Reunião Agendada', accent: 'bg-purple-400' },
  { key: 'follow', label: 'Follow Up', accent: 'bg-yellow-400' },
  { key: 'encerrada', label: 'Encerrada', accent: 'bg-green-400' },
]
const ENCERRADA_PAGE = 20

function colunaDe(status: string): ColunaKey {
  if (REUNIAO_STATUSES.includes(status)) return 'reuniao'
  if (FOLLOW_STATUSES.includes(status)) return 'follow'
  if (ENCERRADA_STATUSES.includes(status)) return 'encerrada'
  return 'nova'
}

const STATUSES = ['Por Contactar','Iniciar','Contactado','Agendar Reunião','Reunião Agendada','Negociação','Fechou','NÃO FECHOU','Sem resposta','Encerrado','Cancelado']

function daysSince(dateStr: string): number {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 0
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
}

function sumOrcamento(contacts: Contact[]): number {
  return contacts.reduce((sum, c) => {
    const val = parseFloat((c.orcamento ?? '').toString().replace(/[^\d.,]/g, '').replace(',', '.'))
    return sum + (isNaN(val) ? 0 : val)
  }, 0)
}

/* ── KANBAN CARD ── */
function KanbanCard({ c, coluna, onStatusChange }: { c: Contact; coluna: ColunaKey; onStatusChange: (id: string, s: string) => void }) {
  const dias = daysSince(c.status_updated_at || c.data_entrada)
  const fechou = c.status === 'Fechou'

  return (
    <div className="rounded-xl border border-white/8 bg-[#111111] hover:border-gold/30 transition-colors p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/crm/${c.id}`} className="text-white text-sm font-medium leading-snug hover:text-gold transition-colors line-clamp-2">
          {c.nome || 'Sem nome'}
        </Link>
        {coluna === 'follow' && (
          <span
            title="Dias em negociação"
            className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-md ${dias >= 14 ? 'bg-red-500/20 text-red-400' : dias >= 7 ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/15 text-yellow-400'}`}
          >
            {dias}d
          </span>
        )}
        {coluna === 'encerrada' && (
          <span className={`flex-shrink-0 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md ${fechou ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/40'}`}>
            {fechou ? 'Fechou' : 'Não fechou'}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-white/35">
        <span className="truncate">{c.tipo_evento?.replace(/[\[\]"]/g, '') || '—'}</span>
        <span className="flex-shrink-0">{c.data_casamento || c.data_entrada || '—'}</span>
      </div>

      {coluna === 'follow' && (
        <div className="text-[11px] text-white/30">
          Em negociação há <span className="text-white/60">{dias} {dias === 1 ? 'dia' : 'dias'}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <select
          value={c.status ?? ''}
          onChange={e => onStatusChange(c.id, e.target.value)}
          className={`text-xs px-2 py-1 rounded-full border cursor-pointer focus:outline-none bg-transparent min-w-0 ${statusColor[c.status] ?? 'bg-white/10 text-white/50 border-white/20'}`}
        >
          {STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900 text-white">{s}</option>)}
        </select>
        {c.orcamento && <span className="text-gold text-xs font-semibold whitespace-nowrap">{c.orcamento} €</span>}
      </div>
    </div>
  )
}

/* ── MINI TABLE (Requer Atenção) ── */
function MiniTable({ contacts, onStatusChange, borderColor, rowHover }: {
  contacts: Contact[]
  onStatusChange: (id: string, status: string) => void
  borderColor: string
  headerColor: string
  rowHover: string
}) {
  const total = contacts.reduce((sum, c) => {
    const val = parseFloat((c.orcamento ?? '').toString().replace(/[^\d.,]/g, '').replace(',', '.'))
    return sum + (isNaN(val) ? 0 : val)
  }, 0)

  return (
    <div className={`rounded-xl border ${borderColor} overflow-hidden`}>
      {contacts.map((c, i) => (
        <div key={c.id} className={`flex flex-col gap-1.5 px-4 py-3 ${i > 0 ? `border-t ${borderColor}/30` : ''} ${rowHover} transition-colors`}>
          <Link href={`/crm/${c.id}`} className="text-white text-sm font-medium hover:text-gold transition-colors truncate">
            {c.nome || '—'}
          </Link>
          <div className="flex items-center justify-between gap-2">
            <select
              value={c.status ?? ''}
              onChange={e => onStatusChange(c.id, e.target.value)}
              className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none bg-transparent flex-shrink-0 ${statusColor[c.status] ?? 'bg-white/10 text-white/50 border-white/20'}`}
            >
              {STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900 text-white">{s}</option>)}
            </select>
            <span className="text-white/70 text-xs font-medium whitespace-nowrap">
              {c.orcamento ? `${c.orcamento} €` : '—'}
            </span>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between px-4 py-3 bg-green-500/20 border-t border-green-500/30">
        <span className="text-xs tracking-widest uppercase text-green-400/70 font-semibold">Total</span>
        <span className="text-green-400 font-bold text-sm">{total > 0 ? `${total.toLocaleString('pt-PT')} €` : '—'}</span>
      </div>
    </div>
  )
}

/* ── MAIN PAGE ── */
export default function CRMPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [loading, setLoading] = useState(true)
  const [encerradaLimit, setEncerradaLimit] = useState(ENCERRADA_PAGE)
  const [openAlerts, setOpenAlerts] = useState<Record<string, boolean>>({ quente: true, morno: true, frio: true })
  const [yearFilter, setYearFilter] = useState('Todos')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg('')
    try {
      const res = await fetch('/api/sync-notion', { method: 'POST' })
      const data = await res.json()
      setSyncMsg(data.error ? `Erro: ${data.error}` : `✓ ${data.message}`)
    } catch {
      setSyncMsg('Erro de ligação')
    }
    setSyncing(false)
    setTimeout(() => setSyncMsg(''), 4000)
  }

  const toggleAlert = (k: string) => setOpenAlerts(p => ({ ...p, [k]: !p[k] }))

  const handleStatusChange = async (id: string, newStatus: string) => {
    const now = new Date().toISOString()
    const existing = contacts.find(c => c.id === id)
    const updatePayload: Record<string, string> = { status: newStatus, status_updated_at: now }
    // Regista data_fecho apenas quando muda para Fechou e ainda não tem
    if (newStatus === 'Fechou' && !existing?.data_fecho) updatePayload.data_fecho = now
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updatePayload } : c))
    await supabase.from('crm_contacts').update(updatePayload).eq('id', id)
  }

  // Deduplica por notion_id E por nome+data_casamento para eliminar duplicados mesmo sem notion_id
  function dedupeContacts(data: Contact[]): Contact[] {
    const seenNotionId = new Set<string>()
    const seenName = new Set<string>()
    return data.filter(c => {
      if (c.notion_id) {
        if (seenNotionId.has(c.notion_id)) return false
        seenNotionId.add(c.notion_id)
      }
      const nameKey = `${(c.nome ?? '').toLowerCase().trim()}|${c.data_casamento ?? ''}`
      if (nameKey !== '|' && seenName.has(nameKey)) return false
      seenName.add(nameKey)
      return true
    })
  }

  useEffect(() => {
    // Carregamento inicial dos contactos (do Supabase).
    supabase.from('crm_contacts').select(LIST_COLUMNS).order('data_entrada', { ascending: false })
      .then(({ data }) => { setContacts(dedupeContacts(data ?? [])); setLoading(false) })

    // Sync automático com o Notion DESLIGADO — os leads entram agora pelo
    // formulário /nova-lead, Tally e criação manual (escrevem direto no
    // Supabase). O botão "Sincronizar" continua disponível como fallback manual.

    // Realtime — atualiza automaticamente quando há mudanças.
    // Debounce: uma sincronização Notion faz upsert de muitas rows de uma vez,
    // e antes cada evento disparava um SELECT * à tabela toda (rajada de egress).
    // Agora colapsamos a rajada num único refetch 1,5s após o último evento e
    // só quando o separador está visível.
    let refetchTimer: ReturnType<typeof setTimeout> | null = null
    const scheduleRefetch = () => {
      if (document.hidden) return
      if (refetchTimer) clearTimeout(refetchTimer)
      refetchTimer = setTimeout(() => {
        supabase.from('crm_contacts').select(LIST_COLUMNS).order('data_entrada', { ascending: false })
          .then(({ data }) => { if (data) setContacts(dedupeContacts(data)) })
      }, 1500)
    }
    const channel = supabase
      .channel('crm_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_contacts' }, scheduleRefetch)
      .subscribe()

    return () => {
      if (refetchTimer) clearTimeout(refetchTimer)
      supabase.removeChannel(channel)
    }
  }, [])

  // Leads activas no pipeline (excluir fechadas/encerradas)
  const CLOSED = ['Fechou', 'NÃO FECHOU', 'Encerrado', 'Cancelado', 'Sem resposta']
  const activeLeads = contacts.filter(c => !CLOSED.includes(c.status))

  // Temperatura baseada em data_entrada
  const leadsQuente = activeLeads.filter(c => daysSince(c.data_entrada) <= 3)
  const leadsMorno  = activeLeads.filter(c => { const d = daysSince(c.data_entrada); return d >= 4 && d <= 10 })
  const leadsFrio   = activeLeads.filter(c => daysSince(c.data_entrada) > 10)

  const filtered = (() => {
    let r = contacts
    if (search) r = r.filter(c =>
      c.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.contato?.toLowerCase().includes(search.toLowerCase())
    )
    if (statusFilter !== 'Todos') r = r.filter(c => c.status === statusFilter)
    if (yearFilter !== 'Todos') r = r.filter(c => c.data_casamento?.startsWith(yearFilter))
    return r
  })()

  const statuses = ['Todos', ...Array.from(new Set(contacts.map(c => c.status).filter(Boolean)))]
  // Anos baseados na data de casamento, mais anos fixos futuros
  const yearsFromData = Array.from(new Set(contacts.map(c => c.data_casamento?.slice(0,4)).filter(Boolean)))
  const fixedYears = ['2025','2026','2027','2028','2029']
  const years = ['Todos', ...Array.from(new Set([...yearsFromData, ...fixedYears])).sort((a,b) => Number(a)-Number(b))]
  const isFiltering = search !== '' || statusFilter !== 'Todos' || yearFilter !== 'Todos'
  const hasAlerts = leadsQuente.length > 0 || leadsMorno.length > 0 || leadsFrio.length > 0

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[1400px] mx-auto">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
        <div>
          <Link href="/photo" className="text-xs tracking-[0.3em] text-white/20 hover:text-gold transition-colors uppercase">
            ‹ Menu
          </Link>
          <h1 className="text-3xl sm:text-5xl font-extralight tracking-[0.15em] sm:tracking-[0.2em] text-white uppercase mt-3">CRM</h1>
          <p className="text-white/20 text-xs tracking-[0.3em] mt-2 uppercase">{contacts.length} Leads</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex flex-col items-end gap-1">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-5 py-3 border border-white/10 hover:border-green-500/40 rounded-xl text-sm text-white/40 hover:text-green-400 tracking-[0.15em] uppercase transition-all disabled:opacity-40"
            >
              {syncing ? 'A sincronizar...' : '↻ Sync Notion'}
            </button>
            {syncMsg && <span className="text-xs text-green-400/70">{syncMsg}</span>}
          </div>
          <a href="/r/85343645-b0d3-4412-ae78-795fd7f8ddf1"
            className="px-5 py-3 border border-gold/20 hover:border-gold/60 rounded-xl text-sm text-gold/50 hover:text-gold tracking-[0.15em] uppercase transition-all">
            ✦ Maquete Casamento
          </a>
          <a href="/b/batizado-maquete"
            className="px-5 py-3 border border-gold/20 hover:border-gold/60 rounded-xl text-sm text-gold/50 hover:text-gold tracking-[0.15em] uppercase transition-all">
            ✦ Maquete Batizado
          </a>
          <Link href="/crm/stats"
            className="px-5 py-3 border border-white/10 hover:border-gold/40 rounded-xl text-sm text-white/40 hover:text-gold tracking-[0.15em] uppercase transition-all">
            Estatísticas
          </Link>
          <Link href="/crm/portais"
            className="px-5 py-3 border border-white/10 hover:border-gold/40 rounded-xl text-sm text-white/40 hover:text-gold tracking-[0.15em] uppercase transition-all">
            Portais
          </Link>
          <Link href="/crm/follow-up"
            className="px-5 py-3 border border-white/10 hover:border-gold/40 rounded-xl text-sm text-white/40 hover:text-gold tracking-[0.15em] uppercase transition-all">
            Follow Up
          </Link>
          <a href="/nova-lead" target="_blank" rel="noopener noreferrer"
            className="px-5 py-3 border border-gold/20 hover:border-gold/60 rounded-xl text-sm text-gold/50 hover:text-gold tracking-[0.15em] uppercase transition-all flex items-center gap-2">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            Form. Noivos
          </a>
          <a href="/batizado" target="_blank" rel="noopener noreferrer"
            className="px-5 py-3 border border-gold/20 hover:border-gold/60 rounded-xl text-sm text-gold/50 hover:text-gold tracking-[0.15em] uppercase transition-all flex items-center gap-2">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
            Form. Batizado
          </a>
          <Link href="/crm/nova"
            className="px-6 py-3 bg-gold/90 hover:bg-gold rounded-xl text-sm font-semibold text-black tracking-[0.15em] uppercase transition-all">
            + Nova Lead
          </Link>
        </div>
      </div>

      {/* ── PAINEL REQUER ATENÇÃO ── */}
      {!loading && hasAlerts && (
        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-xs tracking-[0.4em] uppercase text-white/20 font-light">Requer Atenção</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* 🔴 QUENTE — 0 a 3 dias */}
            <div>
              <button onClick={() => toggleAlert('quente')} className="w-full text-left mb-3">
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 hover:bg-red-500/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🔥</span>
                      <span className="text-sm tracking-[0.25em] uppercase font-semibold text-red-400">Quente</span>
                      <span className="text-xs text-white/20 font-normal">0–3 dias</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-red-500/15 border border-red-500/25 text-red-400 px-2 py-0.5 rounded-full">{leadsQuente.length} leads</span>
                      <span className={`text-white/20 text-xs transition-transform duration-200 ${openAlerts.quente ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-red-300 tracking-tight">
                    {sumOrcamento(leadsQuente) > 0 ? `${sumOrcamento(leadsQuente).toLocaleString('pt-PT')} €` : '—'}
                  </div>
                  <div className="text-xs text-red-400/40 tracking-widest uppercase mt-1">Em pipeline</div>
                </div>
              </button>
              {openAlerts.quente && (
                leadsQuente.length > 0
                  ? <MiniTable contacts={leadsQuente} onStatusChange={handleStatusChange} borderColor="border-red-500/20" headerColor="text-red-400/50" rowHover="hover:bg-red-500/5" />
                  : <div className="text-center py-6 text-white/15 text-xs tracking-widest border border-red-500/10 rounded-xl">Sem leads</div>
              )}
            </div>

            {/* 🟠 MORNO — 4 a 10 dias */}
            <div>
              <button onClick={() => toggleAlert('morno')} className="w-full text-left mb-3">
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 px-5 py-4 hover:bg-orange-500/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🌡</span>
                      <span className="text-sm tracking-[0.25em] uppercase font-semibold text-orange-400">Morno</span>
                      <span className="text-xs text-white/20 font-normal">4–10 dias</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-orange-500/15 border border-orange-500/25 text-orange-400 px-2 py-0.5 rounded-full">{leadsMorno.length} leads</span>
                      <span className={`text-white/20 text-xs transition-transform duration-200 ${openAlerts.morno ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-orange-300 tracking-tight">
                    {sumOrcamento(leadsMorno) > 0 ? `${sumOrcamento(leadsMorno).toLocaleString('pt-PT')} €` : '—'}
                  </div>
                  <div className="text-xs text-orange-400/40 tracking-widest uppercase mt-1">Em pipeline</div>
                </div>
              </button>
              {openAlerts.morno && (
                leadsMorno.length > 0
                  ? <MiniTable contacts={leadsMorno} onStatusChange={handleStatusChange} borderColor="border-orange-500/20" headerColor="text-orange-400/50" rowHover="hover:bg-orange-500/5" />
                  : <div className="text-center py-6 text-white/15 text-xs tracking-widest border border-orange-500/10 rounded-xl">Sem leads</div>
              )}
            </div>

            {/* 🔵 FRIO — +10 dias */}
            <div>
              <button onClick={() => toggleAlert('frio')} className="w-full text-left mb-3">
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-5 py-4 hover:bg-blue-500/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">❄️</span>
                      <span className="text-sm tracking-[0.25em] uppercase font-semibold text-blue-400">Frio</span>
                      <span className="text-xs text-white/20 font-normal">+10 dias</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-500/15 border border-blue-500/25 text-blue-400 px-2 py-0.5 rounded-full">{leadsFrio.length} leads</span>
                      <span className={`text-white/20 text-xs transition-transform duration-200 ${openAlerts.frio ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-300 tracking-tight">
                    {sumOrcamento(leadsFrio) > 0 ? `${sumOrcamento(leadsFrio).toLocaleString('pt-PT')} €` : '—'}
                  </div>
                  <div className="text-xs text-blue-400/40 tracking-widest uppercase mt-1">Em pipeline</div>
                </div>
              </button>
              {openAlerts.frio && (
                leadsFrio.length > 0
                  ? <MiniTable contacts={leadsFrio} onStatusChange={handleStatusChange} borderColor="border-blue-500/20" headerColor="text-blue-400/50" rowHover="hover:bg-blue-500/5" />
                  : <div className="text-center py-6 text-white/15 text-xs tracking-widest border border-blue-500/10 rounded-xl">Sem leads</div>
              )}
            </div>

          </div>
          <div className="h-px bg-white/5 mt-8" />
        </section>
      )}

      {/* ── FILTROS ── */}
      <div className="flex flex-wrap gap-3 mb-10">
        <input
          type="text"
          placeholder="Pesquisar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/40 w-full sm:w-64 tracking-wide"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-gold/40 tracking-wide"
        >
          {statuses.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
        </select>
        <select
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
          className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-gold/40 tracking-wide"
        >
          {years.map(y => <option key={y} value={y} className="bg-zinc-900">{y === 'Todos' ? 'Todos os anos' : y}</option>)}
        </select>
        {isFiltering && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('Todos'); setYearFilter('Todos') }}
            className="px-4 py-2.5 text-xs text-white/30 hover:text-white/60 tracking-widest uppercase transition-colors"
          >
            Limpar
          </button>
        )}
      </div>

      {/* ── QUADRO (4 colunas) ── */}
      {loading ? (
        <div className="text-center py-32 text-white/15 tracking-[0.4em] text-xs uppercase">A carregar...</div>
      ) : (
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-4">
          <div className="grid grid-cols-[repeat(4,minmax(260px,1fr))] gap-4 items-start">
            {COLUNAS.map(col => {
              let items = filtered.filter(c => colunaDe(c.status) === col.key)
              if (col.key === 'follow') {
                // Há mais tempo em negociação primeiro
                items = [...items].sort((a, b) => daysSince(b.status_updated_at || b.data_entrada) - daysSince(a.status_updated_at || a.data_entrada))
              } else if (col.key !== 'nova') {
                items = [...items].sort((a, b) => (b.status_updated_at || b.data_entrada || '').localeCompare(a.status_updated_at || a.data_entrada || ''))
              }
              const total = items.length
              const visiveis = col.key === 'encerrada' ? items.slice(0, encerradaLimit) : items
              const fecharam = col.key === 'encerrada' ? items.filter(c => c.status === 'Fechou').length : 0
              return (
                <section key={col.key} className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 flex flex-col gap-3 min-h-[200px]">
                  <div className="flex items-center justify-between px-1 pt-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.accent}`} />
                      <h2 className="text-xs tracking-[0.25em] uppercase font-semibold text-white/80">{col.label}</h2>
                    </div>
                    <span className="text-xs text-white/30">{total}</span>
                  </div>
                  <div className="flex items-center justify-between px-1 -mt-1 text-[11px] text-white/25">
                    <span>{sumOrcamento(items) > 0 ? `${sumOrcamento(items).toLocaleString('pt-PT')} €` : ' '}</span>
                    {col.key === 'encerrada' && total > 0 && <span>{fecharam} fecharam · {total - fecharam} não</span>}
                  </div>
                  {visiveis.length === 0 ? (
                    <div className="text-center py-8 text-white/15 text-xs tracking-widest">Sem leads</div>
                  ) : (
                    visiveis.map(c => <KanbanCard key={c.id} c={c} coluna={col.key} onStatusChange={handleStatusChange} />)
                  )}
                  {col.key === 'encerrada' && total > encerradaLimit && (
                    <button
                      onClick={() => setEncerradaLimit(l => l + ENCERRADA_PAGE)}
                      className="py-2 text-xs tracking-widest uppercase text-white/30 hover:text-gold transition-colors"
                    >
                      Ver mais ({total - encerradaLimit})
                    </button>
                  )}
                </section>
              )
            })}
          </div>
        </div>
      )}
    </main>
  )
}
