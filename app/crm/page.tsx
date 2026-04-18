'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Contact = {
  id: string
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
}

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

const statusDot: Record<string, string> = {
  'Fechou': 'bg-green-400',
  'Negociação': 'bg-yellow-400',
  'Por Contactar': 'bg-red-400',
  'Contactado': 'bg-blue-400',
  'Reunião Agendada': 'bg-purple-400',
  'NÃO FECHOU': 'bg-gray-400',
  'Agendar Reunião': 'bg-orange-400',
  'Sem resposta': 'bg-gray-400',
  'Encerrado': 'bg-gray-600',
  'Cancelado': 'bg-red-700',
  'Iniciar': 'bg-white/30',
}

const leadColor: Record<string, string> = {
  'Alta': 'text-red-400',
  'Médio': 'text-yellow-400',
  'Baixa': 'text-green-400',
}

const STATUS_GROUPS = [
  { label: 'Por Contactar', color: 'text-red-400', dot: 'bg-red-400', statuses: ['Por Contactar', 'Iniciar', 'Contactado', 'Agendar Reunião'] },
  { label: 'Reunião Agendada', color: 'text-purple-400', dot: 'bg-purple-400', statuses: ['Reunião Agendada'] },
  { label: 'Em Negociação', color: 'text-yellow-400', dot: 'bg-yellow-400', statuses: ['Negociação'] },
  { label: 'Fechou', color: 'text-green-400', dot: 'bg-green-400', statuses: ['Fechou'] },
  { label: 'Não Fechou', color: 'text-gray-400', dot: 'bg-gray-400', statuses: ['NÃO FECHOU'] },
  { label: 'Sem Resposta / Encerrado', color: 'text-gray-500', dot: 'bg-gray-600', statuses: ['Sem resposta', 'Encerrado', 'Cancelado'] },
]

const POR_CONTACTAR_STATUSES = ['Por Contactar', 'Iniciar', 'Contactado', 'Agendar Reunião']
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

/* ── LEAD CARD ── */
function LeadCard({ c, onStatusChange }: { c: Contact; onStatusChange: (id: string, s: string) => void }) {
  const dias = daysSince(c.status_updated_at || c.data_entrada)
  const initials = (c.nome || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="group relative h-56 rounded-2xl overflow-hidden border border-white/8 bg-[#111111] cursor-pointer">

      {/* Fundo com gradiente suave */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent" />

      {/* Conteúdo estático — sempre visível */}
      <div className="relative h-full flex flex-col justify-between p-5">
        {/* Topo: iniciais + lead prioridade */}
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-xs font-semibold tracking-wider">
            {initials}
          </div>
          {c.lead_prioridade && (
            <span className={`text-xs font-semibold tracking-wider ${leadColor[c.lead_prioridade] ?? 'text-white/30'}`}>
              {c.lead_prioridade.toUpperCase()}
            </span>
          )}
        </div>

        {/* Nome */}
        <div>
          <h3 className="text-white font-light text-lg leading-tight tracking-wide line-clamp-2 group-hover:text-gold transition-colors duration-300">
            {c.nome || 'Sem nome'}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className={`w-1.5 h-1.5 rounded-full ${statusDot[c.status] ?? 'bg-white/20'}`} />
            <span className="text-white/40 text-xs tracking-wider">{c.status || '—'}</span>
          </div>
        </div>

        {/* Base: tipo evento + data */}
        <div className="flex items-end justify-between">
          <span className="text-white/25 text-xs">{c.tipo_evento?.replace(/[\[\]"]/g, '') || '—'}</span>
          <span className="text-white/25 text-xs">{c.data_casamento || c.data_entrada || '—'}</span>
        </div>
      </div>

      {/* Hover panel — desliza de baixo para cima */}
      <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-[400ms] ease-out bg-[#0D0D0D]/97 backdrop-blur-sm border-t border-white/10 p-5 flex flex-col gap-3">

        {/* Status dropdown */}
        <select
          value={c.status ?? ''}
          onClick={e => e.stopPropagation()}
          onChange={e => { e.stopPropagation(); onStatusChange(c.id, e.target.value) }}
          className={`w-full text-xs px-3 py-1.5 rounded-full border cursor-pointer focus:outline-none bg-transparent ${statusColor[c.status] ?? 'bg-white/10 text-white/50 border-white/20'}`}
        >
          {STATUSES.map(s => <option key={s} value={s} className="bg-zinc-900 text-white">{s}</option>)}
        </select>

        {/* Info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {c.contato && (
            <div>
              <div className="text-white/30 tracking-wider mb-0.5">CONTACTO</div>
              <div className="text-white/70">{c.contato}</div>
            </div>
          )}
          {c.orcamento && (
            <div>
              <div className="text-white/30 tracking-wider mb-0.5">ORÇAMENTO</div>
              <div className="text-gold font-semibold">{c.orcamento} €</div>
            </div>
          )}
          {c.local_casamento && (
            <div className="col-span-2">
              <div className="text-white/30 tracking-wider mb-0.5">LOCAL</div>
              <div className="text-white/60 truncate">{c.local_casamento}</div>
            </div>
          )}
        </div>

        {/* Dias + Ver ficha */}
        <div className="flex items-center justify-between pt-1">
          {dias > 0 && (
            <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${dias >= 7 ? 'bg-red-500/20 text-red-400' : dias >= 3 ? 'bg-orange-500/20 text-orange-400' : 'text-white/20'}`}>
              {dias}d
            </span>
          )}
          <Link
            href={`/crm/${c.id}`}
            onClick={e => e.stopPropagation()}
            className="ml-auto text-xs tracking-widest text-gold/60 hover:text-gold transition-colors uppercase"
          >
            Ver ficha →
          </Link>
        </div>
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ 'Por Contactar': true })
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

  const toggleGroup = (label: string) => setOpenGroups(p => ({ ...p, [label]: !p[label] }))
  const toggleAlert = (k: string) => setOpenAlerts(p => ({ ...p, [k]: !p[k] }))

  const handleStatusChange = async (id: string, newStatus: string) => {
    const now = new Date().toISOString()
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status: newStatus, status_updated_at: now } : c))
    await supabase.from('crm_contacts').update({ status: newStatus, status_updated_at: now }).eq('id', id)
  }

  useEffect(() => {
    // Carregamento inicial + sync automático com Notion em background
    supabase.from('crm_contacts').select('*').order('data_entrada', { ascending: false })
      .then(({ data }) => { setContacts(data ?? []); setLoading(false) })

    // Sync silencioso com Notion ao abrir o CRM
    fetch('/api/sync-notion', { method: 'POST' }).catch(() => {})

    // Realtime — atualiza automaticamente quando há mudanças
    const channel = supabase
      .channel('crm_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_contacts' }, () => {
        supabase.from('crm_contacts').select('*').order('data_entrada', { ascending: false })
          .then(({ data }) => { if (data) setContacts(data) })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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
          <Link href="/" className="text-xs tracking-[0.3em] text-white/20 hover:text-gold transition-colors uppercase">
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
          <Link href="/crm/stats"
            className="px-5 py-3 border border-white/10 hover:border-gold/40 rounded-xl text-sm text-white/40 hover:text-gold tracking-[0.15em] uppercase transition-all">
            Estatísticas
          </Link>
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

      {/* ── LEADS ── */}
      {loading ? (
        <div className="text-center py-32 text-white/15 tracking-[0.4em] text-xs uppercase">A carregar...</div>
      ) : isFiltering ? (
        filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(c => <LeadCard key={c.id} c={c} onStatusChange={handleStatusChange} />)}
          </div>
        ) : (
          <div className="text-center py-24 text-white/15 tracking-[0.4em] text-xs uppercase">Sem resultados</div>
        )
      ) : (
        <div className="flex flex-col">
          {STATUS_GROUPS.map(group => {
            const groupContacts = contacts.filter(c =>
              group.statuses.includes(c.status) &&
              (yearFilter === 'Todos' || c.data_casamento?.startsWith(yearFilter))
            )
            if (groupContacts.length === 0) return null
            const isOpen = !!openGroups[group.label]
            return (
              <section key={group.label}>
                {/* Título do grupo — estilo tipográfico bold */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="w-full text-left pt-8 pb-4 group"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-4xl md:text-5xl font-bold tracking-tight uppercase text-white transition-opacity group-hover:opacity-70">
                      {group.label}
                    </span>
                    <div className="flex items-center gap-4 pb-1">
                      <span className="text-white/20 text-lg font-light">{groupContacts.length}</span>
                      <span className={`text-white/20 text-sm transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                    </div>
                  </div>
                  <div className="w-full h-px bg-white/10 mt-4" />
                </button>

                {/* Cards grid */}
                {isOpen && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-6 pb-4">
                    {groupContacts.map(c => <LeadCard key={c.id} c={c} onStatusChange={handleStatusChange} />)}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}
