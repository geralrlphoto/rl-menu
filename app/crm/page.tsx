'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import './crm-tiles.css'
import {
  DROP_STATUS, colunaDe, daysSince, estadoAcao, parseOrcamento, type ColunaKey,
} from '@/lib/crm'
import { EncerrarModal, KanbanCard, LeadDrawer, StatusSelect, type Contact } from './CrmBoard'

// Colunas que a LISTA do CRM usa — exclui de propósito o `page_content`
// (propostas, ~3 KB/linha) e as notas, que só são precisas na ficha/painel.
const LIST_COLUMNS =
  'id,notion_id,nome,contato,email,status,lead_prioridade,tipo_evento,data_casamento,data_entrada,local_casamento,orcamento,como_chegou,servicos,status_updated_at,data_fecho,proxima_acao,proxima_acao_data,motivo_nao_fechou,reuniao_data,reuniao_hora,page_token,page_tipo:page_content->>tipo'

const COLUNAS: { key: ColunaKey; label: string; accent: string }[] = [
  { key: 'nova', label: 'Nova Entrada', accent: 'bg-red-400' },
  { key: 'reuniao', label: 'Reunião Agendada', accent: 'bg-purple-400' },
  { key: 'follow', label: 'Follow Up', accent: 'bg-yellow-400' },
  { key: 'encerrada', label: 'Encerrada', accent: 'bg-green-400' },
]
const ENCERRADA_PAGE = 20
// Ano (data do casamento) usado na taxa de fecho anual do topo
const ANO_TAXA_FECHO = '2027'

function sumOrcamento(contacts: Contact[]): number {
  return contacts.reduce((sum, c) => sum + parseOrcamento(c.orcamento), 0)
}

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
    <div className={`rounded-xl border ${borderColor} overflow-hidden`}>
      {contacts.map((c, i) => (
        <div key={c.id} className={`flex flex-col gap-1.5 px-4 py-3 ${i > 0 ? `border-t ${borderColor}/30` : ''} ${rowHover} transition-colors`}>
          <button onClick={() => onOpen(c.id)} className="text-left text-white text-sm font-medium hover:text-gold transition-colors truncate">
            {c.nome || '—'}
          </button>
          <div className="flex items-center justify-between gap-2">
            <StatusSelect value={c.status} onChange={s => onStatusChange(c.id, s)} className="flex-shrink-0" />
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
  const cls = `crm-tile${primary ? ' is-primary' : ''}`
  const inner = (
    <>
      <span className="crm-tile-sweep" />
      <span className="crm-tile-num">{String(num).padStart(2, '0')}</span>
      <span className="crm-tile-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[icon]} />
        </svg>
      </span>
      <span className="crm-tile-name">{label}</span>
      <span className={`crm-tile-arrow${external ? ' is-external' : ''}`}>{external ? '↗' : '→'}</span>
    </>
  )
  if (href) {
    return external
      ? <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
      : <Link href={href} className={cls}>{inner}</Link>
  }
  return <button type="button" onClick={onClick} disabled={disabled} className={cls}>{inner}</button>
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
  const [waEnviados, setWaEnviados] = useState<Record<string, string[]>>({})

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
    if (!(colunaDe(existing.status) === 'follow' && colunaDe(newStatus) === 'follow')) {
      updatePayload.status_updated_at = now
    }
    // Regista data_fecho apenas quando muda para Fechou e ainda não tem
    if (newStatus === 'Fechou' && !existing.data_fecho) updatePayload.data_fecho = now
    if (newStatus === 'NÃO FECHOU') updatePayload.motivo_nao_fechou = motivo ?? null
    // Lead encerrada deixa de ter próxima ação pendente
    if (colunaDe(newStatus) === 'encerrada') { updatePayload.proxima_acao = null; updatePayload.proxima_acao_data = null }
    if (colunaDe(newStatus) === 'follow') setUltimaMudanca(m => ({ ...m, [id]: now }))
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
  const followIdsKey = contacts.filter(c => colunaDe(c.status) === 'follow').map(c => c.id).sort().join(',')
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

  // Mensagens de WhatsApp já enviadas (para bloquear os botões): só Nova Entrada e Reunião
  const waIdsKey = contacts.filter(c => ['nova', 'reuniao'].includes(colunaDe(c.status))).map(c => c.id).sort().join(',')
  useEffect(() => {
    if (!waIdsKey) return
    supabase.from('crm_status_history').select('contact_id,evento')
      .in('contact_id', waIdsKey.split(',')).like('evento', 'WhatsApp%')
      .then(({ data }) => {
        const m: Record<string, string[]> = {}
        for (const h of data ?? []) (m[h.contact_id] ||= []).push(h.evento)
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
  const valorFollow = sumOrcamento(contacts.filter(c => colunaDe(c.status) === 'follow'))
  const temposFecho = contacts
    .filter(c => c.status === 'Fechou' && c.data_fecho && c.data_entrada)
    .map(c => Math.round((new Date(c.data_fecho).getTime() - new Date(c.data_entrada).getTime()) / 86400000))
    .filter(d => d >= 0)
  const mediaDiasFecho = temposFecho.length > 0 ? Math.round(temposFecho.reduce((a, b) => a + b, 0) / temposFecho.length) : null
  const contagemReuniao = contacts.filter(c => colunaDe(c.status) === 'reuniao').length
  const contagemFollow = contacts.filter(c => colunaDe(c.status) === 'follow').length
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

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[1400px] mx-auto">

      {/* ── CABEÇALHO (banner com foto) ── */}
      <section className="relative rounded-3xl overflow-hidden border border-white/10 mb-6 min-h-[440px] sm:min-h-[400px] flex flex-col">
        <img src="/crm-hero.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_35%]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

        <div className="relative flex-1 flex flex-col px-5 sm:px-10 pt-5 sm:pt-7 pb-5 sm:pb-7">
          <Link href="/photo" className="self-start text-xs tracking-[0.3em] text-white/50 hover:text-gold transition-colors uppercase">
            ‹ Menu
          </Link>

          <div className="flex-1 flex flex-col justify-center py-8 max-w-xl">
            <p className="text-[10px] tracking-[0.45em] uppercase text-white/45">RL Photo.Video · Gestão de Leads</p>
            <h1 className="font-cormorant font-light text-gold text-6xl sm:text-7xl tracking-[0.12em] leading-none mt-3">CRM</h1>
            <div className="w-20 h-px bg-gold/70 my-5" />
            <p className="font-cormorant italic text-white/80 text-lg sm:text-xl leading-snug">
              {loading ? 'A carregar leads…' : `${contacts.length} leads · ${contagemReuniao} com reunião agendada · ${contagemFollow} em follow up`}
            </p>
          </div>

          {!loading && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 [&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
          <Kpi label="Taxa de fecho (mês)" value={taxaMes !== null ? `${taxaMes}%` : '—'}
            sub={encerradasMes.length > 0 ? `${fecharamMes} de ${encerradasMes.length} encerradas` : 'Nenhuma encerrada este mês'} color="text-green-400" />
          <Kpi label={`Taxa de fecho · Casamentos ${ANO_TAXA_FECHO}`} value={taxaAno !== null ? `${taxaAno}%` : '—'}
            sub={encerradasAno.length > 0 ? `${fecharamAno} de ${encerradasAno.length} encerradas` : `Nenhuma lead de ${ANO_TAXA_FECHO} encerrada`} color="text-green-300" />
          <Kpi label="Valor em Follow Up" value={valorFollow > 0 ? `${valorFollow.toLocaleString('pt-PT')} €` : '—'} color="text-gold" />
          <Kpi label="Média até fechar" value={mediaDiasFecho !== null ? `${mediaDiasFecho} dias` : '—'} sub="Da entrada ao fecho" color="text-yellow-300" />
          <Kpi label="Ações atrasadas" value={acoesAtrasadas}
            sub={soAtrasadas ? 'A mostrar só estas. Clica para ver todas' : acoesAtrasadas > 0 ? 'Clica para ver só estas' : 'Tudo em dia'}
            color={acoesAtrasadas > 0 ? 'text-red-400' : 'text-white/60'}
            onClick={acoesAtrasadas > 0 || soAtrasadas ? () => setSoAtrasadas(v => !v) : undefined} active={soAtrasadas} />
            </div>
          )}
        </div>
      </section>

      {/* ── AÇÕES ── */}
      <div className="mb-8 sm:mb-10">
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2.5 sm:gap-3">
          <ActionTile num={1} label="Nova Lead" icon="mais" href="/crm/nova" primary />
          <ActionTile num={2} label="Follow Up" icon="relogio" href="/crm/follow-up" />
          <ActionTile num={3} label="Estatísticas" icon="grafico" href="/crm/stats" />
          <ActionTile num={4} label="Portais" icon="portais" href="/crm/portais" />
          <ActionTile num={5} label="Maquete Casamento" icon="aneis" href="/r/85343645-b0d3-4412-ae78-795fd7f8ddf1" />
          <ActionTile num={6} label="Maquete Batizado" icon="estrela" href="/b/batizado-maquete" />
          <ActionTile num={7} label="Form. Noivos" icon="formulario" href="/nova-lead" external />
          <ActionTile num={8} label="Form. Batizado" icon="formulario" href="/batizado" external />
          <ActionTile num={9} label={syncing ? 'A sincronizar' : 'Sync Notion'} icon="sync" onClick={handleSync} disabled={syncing} />
        </div>
        {syncMsg && <p className="text-xs text-green-400/80 text-right mt-2">{syncMsg}</p>}
      </div>


      {/* ── PAINEL REQUER ATENÇÃO ── */}
      {!loading && hasAlerts && (
        <section className="mb-10">
          <button onClick={toggleAtencao} className="w-full flex items-center gap-4 group">
            <span className="text-xs tracking-[0.4em] uppercase text-white/30 font-light group-hover:text-white/60 transition-colors">Requer Atenção</span>
            <span className="text-[11px] text-white/20">{leadsQuente.length} quentes · {leadsMorno.length} mornas · {leadsFrio.length} frias</span>
            <div className="flex-1 h-px bg-white/5" />
            <span className={`text-white/25 text-xs transition-transform duration-200 ${atencaoAberta ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {atencaoAberta && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">


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
                  ? <MiniTable contacts={leadsQuente} onStatusChange={handleStatusChange} onOpen={setDrawerId} borderColor="border-red-500/20" headerColor="text-red-400/50" rowHover="hover:bg-red-500/5" />
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
                  ? <MiniTable contacts={leadsMorno} onStatusChange={handleStatusChange} onOpen={setDrawerId} borderColor="border-orange-500/20" headerColor="text-orange-400/50" rowHover="hover:bg-orange-500/5" />
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
                  ? <MiniTable contacts={leadsFrio} onStatusChange={handleStatusChange} onOpen={setDrawerId} borderColor="border-blue-500/20" headerColor="text-blue-400/50" rowHover="hover:bg-blue-500/5" />
                  : <div className="text-center py-6 text-white/15 text-xs tracking-widest border border-blue-500/10 rounded-xl">Sem leads</div>
              )}
            </div>

          </div>
          )}
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
        {soAtrasadas && (
          <button onClick={() => setSoAtrasadas(false)}
            className="px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-400 tracking-wider">
            Só ações atrasadas ×
          </button>
        )}
        {isFiltering && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('Todos'); setYearFilter('Todos'); setSoAtrasadas(false) }}
            className="px-4 py-2.5 text-xs text-white/30 hover:text-white/60 tracking-widest uppercase transition-colors"
          >
            Limpar
          </button>
        )}
      </div>
      <p className="hidden md:block -mt-6 mb-4 text-[11px] text-white/20">Arrasta os cartões entre colunas. Clica num cartão para abrir a ficha rápida.</p>


      {/* ── QUADRO (4 colunas) ── */}
      {loading ? (
        <div className="text-center py-32 text-white/15 tracking-[0.4em] text-xs uppercase">A carregar...</div>
      ) : (
        <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0 pb-4">
          <div className="grid grid-cols-[repeat(4,minmax(270px,1fr))] gap-4 items-start">
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
              return (
                <section
                  key={col.key}
                  onDragOver={e => { if (!draggingId) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dropCol !== col.key) setDropCol(col.key) }}
                  onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropCol(d => d === col.key ? null : d) }}
                  onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain'); setDropCol(null); setDraggingId(null); if (id) handleDrop(col.key, id) }}
                  className={`rounded-2xl border p-3 flex flex-col gap-3 min-h-[240px] transition-colors ${isTarget ? 'border-gold/50 bg-gold/[0.05]' : 'border-white/5 bg-white/[0.02]'}`}
                >
                  <div className="flex items-center justify-between px-1 pt-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.accent}`} />
                      <h2 className="text-xs tracking-[0.25em] uppercase font-semibold text-white/80">{col.label}</h2>
                    </div>
                    <span className="text-xs text-white/30">{total}</span>
                  </div>
                  <div className="flex items-center justify-between px-1 -mt-1 text-[11px] text-white/25 min-h-[16px]">
                    <span>{sumOrcamento(items) > 0 ? `${sumOrcamento(items).toLocaleString('pt-PT')} €` : ''}</span>
                    {col.key === 'encerrada' && total > 0 && <span>{fecharam} fecharam · {total - fecharam} não</span>}
                  </div>
                  {isTarget && (
                    <div className="rounded-xl border border-dashed border-gold/40 py-4 text-center text-[11px] tracking-widest uppercase text-gold/70">
                      {col.key === 'encerrada' ? 'Largar para encerrar' : `Mover para ${col.label}`}
                    </div>
                  )}
                  {visiveis.length === 0 && !isTarget ? (
                    <div className="text-center py-8 text-white/15 text-xs tracking-widest">Sem leads</div>
                  ) : (
                    visiveis.map(c => (
                      <KanbanCard
                        key={c.id}
                        c={c}
                        coluna={col.key}
                        diasNoPasso={daysSince(ultimaMudanca[c.id] || c.status_updated_at || c.data_entrada)}
                        enviados={waEnviados[c.id] ?? []}
                        onEnviado={ev => setWaEnviados(prev => ({ ...prev, [c.id]: [...(prev[c.id] ?? []), ev] }))}
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