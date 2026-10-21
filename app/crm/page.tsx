'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import './crm-tiles.css'
import PropostaPicker from './PropostaPicker'
import {
  DROP_STATUS, colunaDe, daysSince, estadoAcao, parseOrcamento, fmtOrcamento, EVENTO_ABRIU_LINK, type ColunaKey,
} from '@/lib/crm'
import { EncerrarModal, KanbanCard, LeadDrawer, StatusSelect, type Contact } from './CrmBoard'

// Colunas que a LISTA do CRM usa — exclui de propósito o `page_content`
// (propostas, ~3 KB/linha) e as notas, que só são precisas na ficha/painel.
const LIST_COLUMNS =
  'id,notion_id,nome,contato,email,status,lead_prioridade,tipo_evento,data_casamento,data_entrada,local_casamento,orcamento,como_chegou,servicos,status_updated_at,data_fecho,proxima_acao,proxima_acao_data,motivo_nao_fechou,reuniao_data,reuniao_hora,page_token,page_views,page_last_viewed,valor_proposto,valor_fechado,consentimento_marketing,page_tipo:page_content->>tipo'

const COLUNAS: { key: ColunaKey; label: string; accent: string }[] = [
  { key: 'nova', label: 'Nova Entrada', accent: 'bg-red-400' },
  { key: 'reuniao', label: 'Reunião Agendada', accent: 'bg-purple-400' },
  { key: 'proposta', label: 'Proposta Enviada', accent: 'bg-gold' },
  { key: 'follow', label: 'Follow Up', accent: 'bg-yellow-400' },
  { key: 'encerrada', label: 'Encerrada', accent: 'bg-green-400' },
]
const ENCERRADA_PAGE = 20
// Ano (data do casamento) usado na taxa de fecho anual do topo
const ANO_TAXA_FECHO = '2027'

// Valor de uma lead: o valor proposto quando já existe; senão, a faixa de orçamento que indicaram
function valorLead(c: Contact): number {
  return Number(c.valor_proposto) > 0 ? Number(c.valor_proposto) : parseOrcamento(c.orcamento)
}
function sumOrcamento(contacts: Contact[]): number {
  return contacts.reduce((sum, c) => sum + valorLead(c), 0)
}
// Proposta enviada e follow up contam juntos para os dias e para os lembretes
const emFollowUp = (status?: string | null) => ['follow', 'proposta'].includes(colunaDe(status))

/* ── MINI TABLE (Requer Atenção) ── */
function MiniTable({ contacts, onStatusChange, onOpen, borderColor, rowHover }: {
  contacts: Contact[]
  onStatusChange: (id: string, status: string) => void
  onOpen: (id: string) => void
  borderColor: string
  headerColor: string
  rowHover: string
}) {
  const total = sumOrcamento(contacts)

  return (
    <div className={`rounded-[16px] border ${borderColor} overflow-hidden bg-[#111111]/80`}>
      {contacts.map((c, i) => (
        <div key={c.id} className={`flex flex-col gap-1.5 px-4 py-3 ${i > 0 ? `border-t ${borderColor}/30` : ''} ${rowHover} transition-colors`}>
          <button onClick={() => onOpen(c.id)} className="text-left text-white text-sm font-medium hover:text-gold transition-colors truncate">
            {c.nome || '—'}
          </button>
          <div className="flex items-center justify-between gap-2">
            <StatusSelect value={c.status} onChange={s => onStatusChange(c.id, s)} className="flex-shrink-0" />
            <span className="text-white/70 text-xs font-medium whitespace-nowrap">
              {c.orcamento ? fmtOrcamento(c.orcamento) : '—'}
            </span>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between px-4 py-3 bg-[#C9A84C]/12 border-t border-[#C9A84C]/25">
        <span className="text-xs tracking-widest uppercase text-[#C9A84C]/75 font-semibold">Total</span>
        <span className="text-[#C9A84C] font-bold text-sm">{total > 0 ? `${total.toLocaleString('pt-PT')} €` : '—'}</span>
      </div>
    </div>
  )
}

/* ── BOTÃO QUADRADO DA BARRA DE AÇÕES ── */
const ICONS: Record<string, string> = {
  sync: 'M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0011.9 2.5L20 14M18.5 9A7 7 0 006.6 6.5L4 10',
  aneis: 'M9 21a6 6 0 100-12 6 6 0 000 12zM15 15a6 6 0 100-12 6 6 0 000 12z',
  estrela: 'M12 3l1.9 5.6H20l-4.9 3.6 1.9 5.8L12 14.4 7 18l1.9-5.8L4 8.6h6.1L12 3z',
  grafico: 'M4 20h16M7 16V10M12 16V5M17 16v-4',
  portais: 'M4 5a1 1 0 011-1h5v7H4V5zM14 4h5a1 1 0 011 1v4h-6V4zM14 13h6v6a1 1 0 01-1 1h-5v-7zM4 15h6v5H5a1 1 0 01-1-1v-4z',
  relogio: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  formulario: 'M9 4h6a1 1 0 011 1v1H8V5a1 1 0 011-1zM8 6H6a1 1 0 00-1 1v13a1 1 0 001 1h12a1 1 0 001-1V7a1 1 0 00-1-1h-2M9 12h6M9 16h4',
  mais: 'M12 5v14M5 12h14',
  analise: 'M12 3a3 3 0 00-3 3v5a3 3 0 006 0V6a3 3 0 00-3-3zM6 11a6 6 0 0012 0M12 17v4M9 21h6',
}

function ActionTile({ num, label, icon, href, onClick, external, primary, disabled }: {
  num: number
  label: string
  icon: keyof typeof ICONS
  href?: string
  onClick?: () => void
  external?: boolean
  primary?: boolean
  disabled?: boolean
}) {
  // Cartão horizontal: ícone num círculo dourado, número, nome e seta (estilo novo do painel)
  const cls = 'group relative w-full flex items-center gap-3.5 rounded-[18px] border bg-[#111111]/90 px-4 py-3.5 text-left font-cond transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C9A84C]/45 hover:shadow-[0_0_30px_-16px_rgba(201,168,76,0.6)] disabled:opacity-50 disabled:cursor-wait'
  const estilo = {
    borderColor: primary ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.14)',
    borderLeft: `2px solid rgba(201,168,76,${primary ? 0.9 : 0.35})`,
    boxShadow: primary ? '0 0 30px -18px rgba(201,168,76,0.7)' : undefined,
  }
  const inner = (
    <>
      <span className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-[#C9A84C] transition-transform duration-300 group-hover:scale-110"
        style={{ background: `rgba(201,168,76,${primary ? 0.2 : 0.1})` }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-[18px] h-[18px]">
          <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[icon]} />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] tracking-[0.15em] text-[#C9A84C]/60">{String(num).padStart(2, '0')}</span>
        <span className="block text-[16px] font-semibold leading-tight text-white truncate">{label}</span>
      </span>
      <span className="shrink-0 text-white/25 transition-all group-hover:text-[#C9A84C] group-hover:translate-x-0.5">{external ? '↗' : '→'}</span>
    </>
  )
  if (href) {
    return external
      ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls} style={estilo}>{inner}</a>
      : <Link href={href} className={cls} style={estilo}>{inner}</Link>
  }
  return <button type="button" onClick={onClick} disabled={disabled} className={cls} style={estilo}>{inner}</button>
}


function Kpi({ label, value, sub, color = 'text-white', onClick, active }: {
  label: string; value: string | number; sub?: string; color?: string; onClick?: () => void; active?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick}
      className={`text-left rounded-2xl border px-4 sm:px-5 py-3 sm:py-4 backdrop-blur-md transition-colors ${active ? 'border-red-500/50 bg-red-500/20' : 'border-white/10 bg-black/40'} ${onClick ? 'hover:border-white/30 cursor-pointer' : ''}`}>
      <p className="text-white/50 text-[9px] sm:text-[10px] tracking-[0.25em] uppercase mb-1.5 sm:mb-2">{label}</p>
      <p className={`text-xl sm:text-2xl font-light ${color}`}>{value}</p>
      {sub && <p className="text-white/45 text-[10px] sm:text-[11px] mt-1">{sub}</p>}
    </Tag>
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
  const [soAtrasadas, setSoAtrasadas] = useState(false)
  const [atencaoAberta, setAtencaoAberta] = useState(false)
  const [drawerId, setDrawerId] = useState<string | null>(null)
  const [encerrar, setEncerrar] = useState<{ id: string; inicial: 'escolher' | 'nao' } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropCol, setDropCol] = useState<ColunaKey | null>(null)
  // Última mudança de status (vinda do histórico) das leads em Follow Up
  const [ultimaMudanca, setUltimaMudanca] = useState<Record<string, string>>({})
  const [waEnviados, setWaEnviados] = useState<Record<string, Record<string, string>>>({})
  // Quantos eventos já há em cada data (para dizer logo se a data da lead está livre)
  const [ocupacaoPorData, setOcupacaoPorData] = useState<Record<string, number>>({})
  useEffect(() => {
    const hoje = new Date().toISOString().slice(0, 10)
    supabase.from('eventos_2026').select('data_evento').gte('data_evento', hoje).limit(1000)
      .then(({ data }) => {
        const m: Record<string, number> = {}
        for (const e of (data ?? []) as Array<{ data_evento: string | null }>) {
          const d = String(e.data_evento ?? '').slice(0, 10)
          if (d) m[d] = (m[d] ?? 0) + 1
        }
        setOcupacaoPorData(m)
      })
  }, [])

  useEffect(() => {
    try { setAtencaoAberta(localStorage.getItem('crm_atencao_aberta') === '1') } catch {}
  }, [])
  const toggleAtencao = () => setAtencaoAberta(v => {
    try { localStorage.setItem('crm_atencao_aberta', v ? '0' : '1') } catch {}
    return !v
  })

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

  const applyStatus = async (id: string, newStatus: string, motivo?: string | null) => {
    const now = new Date().toISOString()
    const existing = contacts.find(c => c.id === id)
    if (!existing || existing.status === newStatus) return
    const updatePayload: Partial<Contact> = { status: newStatus }
    // Dentro da coluna Follow Up (Negociação → Follow Up 1/2/3) os dias continuam a contar
    if (!(emFollowUp(existing.status) && emFollowUp(newStatus))) {
      updatePayload.status_updated_at = now
    }
    // Regista data_fecho apenas quando muda para Fechou e ainda não tem
    if (newStatus === 'Fechou' && !existing.data_fecho) updatePayload.data_fecho = now
    if (newStatus === 'NÃO FECHOU') updatePayload.motivo_nao_fechou = motivo ?? null
    // Lead encerrada deixa de ter próxima ação pendente
    if (colunaDe(newStatus) === 'encerrada') { updatePayload.proxima_acao = null; updatePayload.proxima_acao_data = null }
    if (emFollowUp(newStatus)) setUltimaMudanca(m => ({ ...m, [id]: now }))
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updatePayload } : c))
    await supabase.from('crm_contacts').update(updatePayload).eq('id', id)
  }

  // Mudança pedida no menu: Não fechou pede sempre o motivo
  const handleStatusChange = (id: string, newStatus: string) => {
    if (newStatus === 'NÃO FECHOU') setEncerrar({ id, inicial: 'nao' })
    else applyStatus(id, newStatus)
  }

  const handleDrop = (col: ColunaKey, id: string) => {
    const c = contacts.find(x => x.id === id)
    if (!c || colunaDe(c.status) === col) return
    if (col === 'encerrada') setEncerrar({ id, inicial: 'escolher' })
    else applyStatus(id, DROP_STATUS[col])
  }

  const patchContact = useCallback(async (id: string, patch: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
    await supabase.from('crm_contacts').update(patch).eq('id', id)
  }, [])

  const closeDrawer = useCallback(() => setDrawerId(null), [])
  const cancelEncerrar = useCallback(() => setEncerrar(null), [])

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

  // Só as leads em Follow Up precisam do histórico (para o aviso "parado")
  const followIdsKey = contacts.filter(c => emFollowUp(c.status)).map(c => c.id).sort().join(',')
  useEffect(() => {
    if (!followIdsKey) return
    supabase.from('crm_status_history').select('contact_id,created_at')
      .in('contact_id', followIdsKey.split(',')).is('evento', null).order('created_at', { ascending: false })
      .then(({ data }) => {
        const m: Record<string, string> = {}
        for (const h of data ?? []) if (!m[h.contact_id]) m[h.contact_id] = h.created_at
        setUltimaMudanca(prev => ({ ...prev, ...m }))
      })
  }, [followIdsKey])

  // Mensagens de WhatsApp já enviadas (para bloquear os botões): Nova Entrada, Reunião e Follow Up
  const waIdsKey = contacts.filter(c => ['nova', 'reuniao', 'proposta', 'follow'].includes(colunaDe(c.status))).map(c => c.id).sort().join(',')
  useEffect(() => {
    if (!waIdsKey) return
    supabase.from('crm_status_history').select('contact_id,evento,created_at')
      .in('contact_id', waIdsKey.split(',')).or(`evento.like.WhatsApp%,evento.eq."${EVENTO_ABRIU_LINK}"`)
      .then(({ data }) => {
        const m: Record<string, Record<string, string>> = {}
        for (const h of data ?? []) (m[h.contact_id] ||= {})[h.evento] = h.created_at
        setWaEnviados(prev => ({ ...prev, ...m }))
      })
  }, [waIdsKey])


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
  const activeLeads = contacts.filter(c => colunaDe(c.status) !== 'encerrada')

  // Temperatura baseada em data_entrada
  const leadsQuente = activeLeads.filter(c => daysSince(c.data_entrada) <= 3)
  const leadsMorno  = activeLeads.filter(c => { const d = daysSince(c.data_entrada); return d >= 4 && d <= 10 })
  const leadsFrio   = activeLeads.filter(c => daysSince(c.data_entrada) > 10)

  // ── Números do topo ──
  const mesAtual = new Date().toISOString().slice(0, 7)
  const encerradasMes = contacts.filter(c =>
    (c.status === 'Fechou' || c.status === 'NÃO FECHOU') &&
    (c.data_fecho || c.status_updated_at || '').slice(0, 7) === mesAtual
  )
  const fecharamMes = encerradasMes.filter(c => c.status === 'Fechou').length
  const taxaMes = encerradasMes.length > 0 ? Math.round((fecharamMes / encerradasMes.length) * 100) : null
  // Taxa anual pela data do casamento (época), não pela data de fecho
  const encerradasAno = contacts.filter(c =>
    (c.status === 'Fechou' || c.status === 'NÃO FECHOU') &&
    (c.data_casamento || '').startsWith(ANO_TAXA_FECHO)
  )
  const fecharamAno = encerradasAno.filter(c => c.status === 'Fechou').length
  const taxaAno = encerradasAno.length > 0 ? Math.round((fecharamAno / encerradasAno.length) * 100) : null
  const valorFollow = sumOrcamento(contacts.filter(c => emFollowUp(c.status)))
  const temposFecho = contacts
    .filter(c => c.status === 'Fechou' && c.data_fecho && c.data_entrada)
    .map(c => Math.round((new Date(c.data_fecho).getTime() - new Date(c.data_entrada).getTime()) / 86400000))
    .filter(d => d >= 0)
  const mediaDiasFecho = temposFecho.length > 0 ? Math.round(temposFecho.reduce((a, b) => a + b, 0) / temposFecho.length) : null
  const contagemReuniao = contacts.filter(c => colunaDe(c.status) === 'reuniao').length
  const contagemFollow = contacts.filter(c => emFollowUp(c.status)).length
  const acoesAtrasadas =activeLeads.filter(c => estadoAcao(c.proxima_acao_data) === 'atrasada').length

  const filtered = (() => {
    let r = contacts
    if (search) r = r.filter(c =>
      c.nome?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.contato?.toLowerCase().includes(search.toLowerCase())
    )
    if (statusFilter !== 'Todos') r = r.filter(c => c.status === statusFilter)
    if (yearFilter !== 'Todos') r = r.filter(c => c.data_casamento?.startsWith(yearFilter))
    if (soAtrasadas) r = r.filter(c => colunaDe(c.status) !== 'encerrada' && estadoAcao(c.proxima_acao_data) === 'atrasada')
    return r
  })()

  const statuses = ['Todos', ...Array.from(new Set(contacts.map(c => c.status).filter(Boolean)))]
  // Anos baseados na data de casamento, mais anos fixos futuros
  const yearsFromData = Array.from(new Set(contacts.map(c => c.data_casamento?.slice(0,4)).filter(Boolean)))
  const fixedYears = ['2025','2026','2027','2028','2029']
  const years = ['Todos', ...Array.from(new Set([...yearsFromData, ...fixedYears])).sort((a,b) => Number(a)-Number(b))]
  const isFiltering = search !== '' || statusFilter !== 'Todos' || yearFilter !== 'Todos' || soAtrasadas
  const hasAlerts = leadsQuente.length > 0 || leadsMorno.length > 0 || leadsFrio.length > 0
  const drawerContact = drawerId ? contacts.find(c => c.id === drawerId) ?? null : null
  const encerrarContact = encerrar ? contacts.find(c => c.id === encerrar.id) ?? null : null

  // Temperaturas das leads em tons de dourado (mais forte = mais recente)
  const TEMPERATURAS = [
    { k: 'quente', nome: 'Quente', dias: '0–3 dias', leads: leadsQuente, a: 0.95 },
    { k: 'morno', nome: 'Morno', dias: '4–10 dias', leads: leadsMorno, a: 0.65 },
    { k: 'frio', nome: 'Frio', dias: '+10 dias', leads: leadsFrio, a: 0.4 },
  ]
  const ouro = (a: number) => `rgba(201,168,76,${a})`
  const campoFiltro = 'rounded-full border border-white/[0.10] bg-white/[0.03] px-4 py-2.5 font-cond text-[14px] text-white focus:outline-none focus:border-[#C9A84C]/45'

  return (
    <main className="min-h-screen overflow-x-clip font-cond bg-[#070707]">

      {/* ── CAPA (foto local da Vercel: não gasta egress do Supabase) ── */}
      <section className="relative min-h-[640px] lg:min-h-[86vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/crm-hero.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_35%] grayscale opacity-40 lg:opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Gestão de leads · {new Date().getFullYear()}
        </p>
        <span className="hidden lg:block absolute left-[34%] top-[26%] w-2.5 h-2.5 rounded-full bg-[#C9A84C]" />
        <span className="hidden lg:block absolute left-[33.2%] top-[31%] w-11 h-11 rounded-full border border-[#C9A84C]/45" />

        <div className="relative flex-1 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_340px] gap-10 items-end pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-16 lg:pt-8 pb-12 lg:pb-16">
          <div className="min-w-0 flex flex-col h-full">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <Link href="/photo" className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ Menu principal</Link>
              {!loading && <PropostaPicker />}
            </div>

            <div className="mt-auto pt-16">
              <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
              <h1 className="font-bold uppercase text-white leading-[0.88] text-[72px] sm:text-[130px] lg:text-[160px] mt-2">CRM</h1>
              <div className="flex items-center gap-4 mt-5">
                <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
                <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                  Nova entrada · Reunião · <span className="text-[#C9A84C]">Follow up</span>
                </p>
              </div>
              <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-xl">
                {loading ? 'A carregar leads…' : `${contacts.length} leads · ${contagemReuniao} com reunião agendada · ${contagemFollow} em follow up`}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <Link href="/crm/nova"
                  className="inline-flex items-center gap-2.5 border border-[#C9A84C]/70 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/30 px-7 py-3.5 text-[15px] font-semibold tracking-[0.18em] uppercase text-white transition-all shadow-[0_0_34px_-12px_rgba(201,168,76,0.7)]">
                  Nova lead
                  <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.4" strokeLinecap="round" className="w-4 h-4" aria-hidden><path d="M12 5v14M5 12h14" /></svg>
                </Link>
                <Link href="/crm/follow-up"
                  className="inline-flex items-center gap-2 border border-white/15 hover:border-white/35 bg-black/30 px-6 py-3.5 text-[15px] font-semibold tracking-[0.18em] uppercase text-white/85 transition-all">
                  / Follow up
                </Link>
              </div>
            </div>
          </div>

          {/* Números do pipeline */}
          {!loading && (
            <aside className="rounded-[22px] border border-[#C9A84C]/30 bg-[#111111]/80 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(201,168,76,0.5)]">
              <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_#C9A84C]" />
                Pipeline
              </p>
              <div className="grid grid-cols-2 mt-3">
                {[
                  { l: 'Taxa de fecho · mês', v: taxaMes !== null ? `${taxaMes}%` : '—', s: encerradasMes.length > 0 ? `${fecharamMes} de ${encerradasMes.length} encerradas` : 'Nenhuma este mês' },
                  { l: `Taxa · casamentos ${ANO_TAXA_FECHO}`, v: taxaAno !== null ? `${taxaAno}%` : '—', s: encerradasAno.length > 0 ? `${fecharamAno} de ${encerradasAno.length}` : 'Sem encerradas' },
                  { l: 'Valor em follow up', v: valorFollow > 0 ? `${valorFollow.toLocaleString('pt-PT')} €` : '—', s: `${contagemFollow} leads`, ouro: true },
                  { l: 'Média até fechar', v: mediaDiasFecho !== null ? `${mediaDiasFecho} dias` : '—', s: 'da entrada ao fecho' },
                ].map((x, i) => (
                  <div key={x.l} className={`py-3 min-w-0 ${i % 2 === 0 ? 'pr-3 border-r border-white/[0.07]' : 'pl-3'} ${i < 2 ? 'border-b border-white/[0.07]' : ''}`}>
                    <p className="text-[11px] text-white/50 truncate">{x.l}</p>
                    <p className={`font-semibold text-[21px] leading-none mt-1.5 truncate ${x.ouro ? 'text-[#C9A84C]' : 'text-white'}`}>{x.v}</p>
                    <p className="text-[10.5px] text-white/30 mt-1 truncate">{x.s}</p>
                  </div>
                ))}
              </div>
              {/* Ações atrasadas: clica para filtrar o quadro */}
              <button onClick={acoesAtrasadas > 0 || soAtrasadas ? () => setSoAtrasadas(v => !v) : undefined}
                className={`mt-3 w-full flex items-center justify-between gap-3 rounded-[14px] border px-3.5 py-2.5 text-left transition-all ${soAtrasadas ? 'border-[#C9A84C]/70 bg-[#C9A84C]/15' : 'border-white/[0.08] bg-black/30 hover:border-[#C9A84C]/40'}`}>
                <span>
                  <span className="block text-[11px] text-white/50">Ações atrasadas</span>
                  <span className="block text-[11px] text-white/30">{soAtrasadas ? 'A mostrar só estas · clica para ver todas' : acoesAtrasadas > 0 ? 'Clica para ver só estas' : 'Tudo em dia'}</span>
                </span>
                <span className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-semibold text-[17px]"
                  style={{ color: acoesAtrasadas > 0 ? '#C9A84C' : 'rgba(255,255,255,0.4)', background: ouro(acoesAtrasadas > 0 ? 0.15 : 0.05) }}>
                  {acoesAtrasadas}
                </span>
              </button>
            </aside>
          )}
        </div>
      </section>

      <div className="crm-ouro max-w-[1400px] mx-auto px-3 sm:px-6 pt-10 pb-12">

        {/* ── ATALHOS ── */}
        <div className="mb-10">
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Atalhos</p>
          <h2 className="font-semibold text-white text-[28px] leading-tight mt-1 mb-4">Ferramentas do CRM</h2>
          <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <ActionTile num={1} label="Nova Lead" icon="mais" href="/crm/nova" primary />
            <ActionTile num={2} label="Follow Up" icon="relogio" href="/crm/follow-up" />
            <ActionTile num={3} label="Estatísticas" icon="grafico" href="/crm/stats" />
            <ActionTile num={4} label="Portais" icon="portais" href="/crm/portais" />
            <ActionTile num={5} label="Maquete Casamento" icon="aneis" href="/r/85343645-b0d3-4412-ae78-795fd7f8ddf1" />
            <ActionTile num={6} label="Maquete Batizado" icon="estrela" href="/b/batizado-maquete" />
            <ActionTile num={7} label="Form. Noivos" icon="formulario" href="/nova-lead" external />
            <ActionTile num={8} label="Form. Batizado" icon="formulario" href="/batizado" external />
            <ActionTile num={9} label={syncing ? 'A sincronizar' : 'Sync Notion'} icon="sync" onClick={handleSync} disabled={syncing} />
            <ActionTile num={10} label="Análise Reuniões" icon="analise" href="/crm/analises" />
          </div>
          {syncMsg && <p className="text-[13px] text-[#C9A84C] text-right mt-2">{syncMsg}</p>}
        </div>

        {/* ── REQUER ATENÇÃO ── */}
        {!loading && hasAlerts && (
          <section className="mb-10">
            <button onClick={toggleAtencao} className="w-full flex flex-wrap items-end gap-3 text-left group">
              <div>
                <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Pipeline</p>
                <h2 className="font-semibold text-white text-[28px] leading-tight mt-1">Requer atenção</h2>
              </div>
              <span className="mb-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-0.5 text-[13px] text-[#C9A84C]">
                {leadsQuente.length} quentes · {leadsMorno.length} mornas · {leadsFrio.length} frias
              </span>
              <div className="flex-1 h-px bg-[#C9A84C]/12 mb-4 min-w-[20px]" />
              <span className="mb-2 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/40 group-hover:text-[#C9A84C] group-hover:border-[#C9A84C]/40 transition-all">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 transition-transform duration-300" style={{ transform: atencaoAberta ? 'rotate(180deg)' : 'none' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </button>

            {atencaoAberta && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
                {TEMPERATURAS.map(t => (
                  <div key={t.k}>
                    <button onClick={() => toggleAlert(t.k)} className="w-full text-left mb-3">
                      <div className="rounded-[22px] border bg-[#111111]/90 px-5 py-4 transition-all hover:-translate-y-0.5"
                        style={{ borderColor: ouro(0.2), borderLeft: `2px solid ${ouro(t.a)}` }}>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: ouro(t.a), boxShadow: `0 0 8px ${ouro(t.a)}` }} />
                            <span className="text-[15px] tracking-[0.15em] uppercase font-semibold" style={{ color: ouro(t.a) }}>{t.nome}</span>
                            <span className="text-[12px] text-white/35">{t.dias}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] rounded-full px-2.5 py-0.5" style={{ color: ouro(t.a), background: ouro(0.12) }}>{t.leads.length} leads</span>
                            <span className={`text-white/30 text-[11px] transition-transform duration-200 ${openAlerts[t.k] ? 'rotate-180' : ''}`}>▼</span>
                          </div>
                        </div>
                        <div className="text-[30px] font-bold leading-none text-white">
                          {sumOrcamento(t.leads) > 0 ? `${sumOrcamento(t.leads).toLocaleString('pt-PT')} €` : '—'}
                        </div>
                        <div className="text-[11px] text-white/35 tracking-[0.15em] uppercase mt-1.5">Em pipeline</div>
                      </div>
                    </button>
                    {openAlerts[t.k] && (
                      t.leads.length > 0
                        ? <MiniTable contacts={t.leads} onStatusChange={handleStatusChange} onOpen={setDrawerId} borderColor="border-[#C9A84C]/20" headerColor="text-[#C9A84C]/60" rowHover="hover:bg-[#C9A84C]/[0.05]" />
                        : <div className="text-center py-6 text-white/25 text-[13px] border border-[#C9A84C]/10 rounded-[16px]">Sem leads</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── FILTROS ── */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          <div className="relative w-full sm:w-64">
            <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" aria-hidden>
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
            </svg>
            <input type="text" placeholder="Procurar lead…" value={search} onChange={e => setSearch(e.target.value)}
              className={`${campoFiltro} w-full pl-10 placeholder-white/30`} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${campoFiltro} text-white/80 [color-scheme:dark]`}>
            {statuses.map(s => <option key={s} value={s} className="bg-zinc-900">{s === 'Todos' ? 'Todos os estados' : s}</option>)}
          </select>
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)} className={`${campoFiltro} text-white/80 [color-scheme:dark]`}>
            {years.map(y => <option key={y} value={y} className="bg-zinc-900">{y === 'Todos' ? 'Todos os anos' : y}</option>)}
          </select>
          {soAtrasadas && (
            <button onClick={() => setSoAtrasadas(false)}
              className="rounded-full border border-[#C9A84C]/50 bg-[#C9A84C]/12 px-3.5 py-2 text-[13px] text-[#C9A84C]">
              Só ações atrasadas ×
            </button>
          )}
          {isFiltering && (
            <button onClick={() => { setSearch(''); setStatusFilter('Todos'); setYearFilter('Todos'); setSoAtrasadas(false) }}
              className="px-3 py-2 text-[13px] text-white/40 hover:text-[#C9A84C] transition-colors">
              Limpar
            </button>
          )}
        </div>
        <p className="hidden md:block mb-5 text-[12px] text-white/30">Arrasta os cartões entre colunas. Clica num cartão para abrir a ficha rápida.</p>

        {/* ── QUADRO (4 colunas) ── */}
        {loading ? (
          <div className="text-center py-32 text-white/30 text-[15px]">A carregar…</div>
        ) : (
          <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-4">
            <div className="grid grid-cols-[repeat(5,minmax(260px,1fr))] gap-4 items-start">
              {COLUNAS.map(col => {
                let items = filtered.filter(c => colunaDe(c.status) === col.key)
                if (col.key === 'follow') {
                  // Há mais tempo em follow up primeiro
                  items = [...items].sort((a, b) => daysSince(b.status_updated_at || b.data_entrada) - daysSince(a.status_updated_at || a.data_entrada))
                } else if (col.key !== 'nova') {
                  items = [...items].sort((a, b) => (b.status_updated_at || b.data_entrada || '').localeCompare(a.status_updated_at || a.data_entrada || ''))
                }
                const total = items.length
                const visiveis = col.key === 'encerrada' ? items.slice(0, encerradaLimit) : items
                const fecharam = col.key === 'encerrada' ? items.filter(c => c.status === 'Fechou').length : 0
                const draggedCol = draggingId ? colunaDe(contacts.find(c => c.id === draggingId)?.status) : null
                const isTarget = !!draggingId && dropCol === col.key && draggedCol !== col.key
                const intensidade = { nova: 0.95, reuniao: 0.8, proposta: 0.65, follow: 0.5, encerrada: 0.32 }[col.key]
                return (
                  <section
                    key={col.key}
                    onDragOver={e => { if (!draggingId) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dropCol !== col.key) setDropCol(col.key) }}
                    onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropCol(d => d === col.key ? null : d) }}
                    onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); setDropCol(null); setDraggingId(null); if (id) handleDrop(col.key, id) }}
                    className={`rounded-[22px] border p-3 flex flex-col gap-3 min-h-[240px] transition-colors ${isTarget ? 'border-[#C9A84C]/55 bg-[#C9A84C]/[0.06]' : 'border-[#C9A84C]/[0.12] bg-[#111111]/80'}`}
                    style={{ borderTop: `2px solid ${ouro(intensidade)}` }}
                  >
                    <div className="flex items-center justify-between px-1 pt-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: ouro(intensidade), boxShadow: `0 0 8px ${ouro(intensidade)}` }} />
                        <h2 className="text-[15px] tracking-[0.12em] uppercase font-semibold text-white">{col.label}</h2>
                      </div>
                      <span className="rounded-full px-2.5 py-0.5 text-[12px] text-[#C9A84C]" style={{ background: ouro(0.12) }}>{total}</span>
                    </div>
                    <div className="flex items-center justify-between px-1 -mt-1 text-[12px] text-white/40 min-h-[16px]">
                      <span>{sumOrcamento(items) > 0 ? `${sumOrcamento(items).toLocaleString('pt-PT')} €` : ''}</span>
                      {col.key === 'encerrada' && total > 0 && <span>{fecharam} fecharam · {total - fecharam} não</span>}
                    </div>
                    {isTarget && (
                      <div className="rounded-[16px] border border-dashed border-[#C9A84C]/45 py-4 text-center text-[12px] tracking-[0.15em] uppercase text-[#C9A84C]">
                        {col.key === 'encerrada' ? 'Largar para encerrar' : `Mover para ${col.label}`}
                      </div>
                    )}
                    {visiveis.length === 0 && !isTarget ? (
                      <div className="text-center py-8 text-white/25 text-[13px]">Sem leads</div>
                    ) : (
                      visiveis.map(c => (
                        <KanbanCard
                          key={c.id}
                          c={c}
                          coluna={col.key}
                          diasNoPasso={daysSince(ultimaMudanca[c.id] || c.status_updated_at || c.data_entrada)}
                        ocupacao={c.data_casamento ? (ocupacaoPorData[c.data_casamento] ?? 0) : null}
                          enviados={waEnviados[c.id] ?? {}}
                          onEnviado={ev => setWaEnviados(prev => ({ ...prev, [c.id]: { ...(prev[c.id] ?? {}), [ev]: new Date().toISOString() } }))}
                          onPortal={token => setContacts(prev => prev.map(x => x.id === c.id ? { ...x, page_token: token } : x))}
                          onOpen={() => setDrawerId(c.id)}
                          onStatusChange={handleStatusChange}
                          dragging={draggingId === c.id}
                          onDragStart={() => setDraggingId(c.id)}
                          onDragEnd={() => { setDraggingId(null); setDropCol(null) }}
                        />
                      ))
                    )}
                    {col.key === 'encerrada' && total > encerradaLimit && (
                      <button
                        onClick={() => setEncerradaLimit(l => l + ENCERRADA_PAGE)}
                        className="py-2 text-[13px] text-white/40 hover:text-[#C9A84C] transition-colors"
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
      </div>

      {drawerContact && (
        <LeadDrawer c={drawerContact} onClose={closeDrawer} onStatusChange={handleStatusChange} onPatch={patchContact} />
      )}

      {encerrar && encerrarContact && (
        <EncerrarModal
          nome={encerrarContact.nome}
          inicial={encerrar.inicial}
          onCancel={cancelEncerrar}
          onConfirm={(status, motivo) => { applyStatus(encerrar.id, status, motivo); setEncerrar(null) }}
        />
      )}
    </main>
  )
}