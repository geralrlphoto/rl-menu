'use client'

import { useEffect, useMemo, useState } from 'react'
import CampoDataPT from '@/app/media/_components/CampoDataPT'

// Fases da lead RL PROD (Validada cria o projeto em Projetos com o portal pronto a enviar)
const ESTADOS = ['Novo', 'Contactado', 'Reunião marcada', 'Negociação', 'Validada', 'Não validada']

// Cores do rlprod.pt por estado (as mesmas do funil em /media/crm)
const COR_ESTADO: Record<string, string> = {
  'Novo':            '#5a8bff',
  'Contactado':      '#7fa6ff',
  'Reunião marcada': '#2e6cf6',
  'Negociação':      '#a9c1ff',
  'Validada':        '#ffffff',
  'Não validada':    '#ff4747',
}
const estiloEstado = (e: string) => {
  const c = COR_ESTADO[e] ?? '#7c8893'
  return { color: c, borderColor: `${c}66`, background: `${c}14` }
}

// Pipeline = leads em curso (já contactadas e ainda sem decisão)
const PIPELINE = ['Contactado', 'Reunião marcada', 'Negociação']
// Já chegaram à reunião (reunião marcada, negociação ou validada)
const QUALIFICADAS = ['Reunião marcada', 'Negociação', 'Validada']
const PERIODOS = [
  { id: 7,   nome: '7 dias' },
  { id: 30,  nome: '30 dias' },
  { id: 90,  nome: '90 dias' },
  { id: 365, nome: '12 meses' },
]
const DIA = 86400000

// Site e Instagram podem vir escritos à mão ("marca.pt", "@marca", link completo)
const linkSite = (v: string) => /^https?:\/\//i.test(v) ? v : `https://${v}`
const linkInstagram = (v: string) => /^https?:\/\//i.test(v) ? v
  : `https://instagram.com/${v.replace(/^@/, '').replace(/^(www\.)?instagram\.com\//i, '').replace(/\/$/, '')}`

interface Lead {
  id: string
  portal_ref?: string | null
  nome: string
  empresa?: string
  email?: string
  telefone?: string
  tipo?: string
  fonte?: string
  ramo?: string
  website?: string
  instagram?: string
  mensagem?: string
  estado: string
  created_at: string
  page_token?: string
  page_publicada?: boolean
  reuniao_data?: string
  reuniao_hora?: string
  reuniao_tipo?: string
  reuniao_link?: string
  page_confirmacao?: string
  page_views?: number
}

interface PropostaItem {
  titulo: string
  valor: string
  servicos: string[]
}

interface Props {
  leads: Lead[]
  estadoColors?: Record<string, string>
}

const SERVICOS_LISTA = [
  '1 Reunião',
  '2 Reuniões',
  '1 Dia de Captação',
  '2 Dias de Captação',
  '3 Dias de Captação',
  '1 Dia Opcional',
  'Filmagem 4K',
  'Drone',
  'Fotografia',
  '1 Videógrafo',
  '2 Videógrafos',
  '1 Assistente',
  '2 Assistentes',
  'Diretor Criativo',
  '1 Fotógrafo',
  '2 Fotógrafos',
  '1 Editor',
  '1 Vídeo Horizontal 1 Min',
  '1 Vídeo Horizontal 2 Min',
  '1 Vídeo Horizontal 3 Min',
  '1 Vídeo Vertical 59seg',
  '1 Vídeo Vertical 90seg',
  '1 Vídeo Vertical 2min',
  'Direitos Musicais',
  'Cedência de Fotografias Uso Media Social',
  'Voz Off Estúdio',
]

const DEFAULT_PROPOSTAS: PropostaItem[] = [
  { titulo: 'Proposta 1', valor: '', servicos: [] },
  { titulo: 'Proposta 2', valor: '', servicos: [] },
  { titulo: 'Proposta 3', valor: '', servicos: [] },
]

const BASE_URL  = process.env.NEXT_PUBLIC_BASE_URL || 'https://portal.rlphotovideo.pt'
const MEET_LINK = 'https://meet.google.com/dih-etvh-xkh'
// Link por modo da reunião (presencial = morada a indicar)
const linkReuniao = (tipo: string) => tipo === 'Videochamada' ? MEET_LINK : tipo === 'Instalações da empresa' ? MAPS_LINK : ''
const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video+(Casamentos,Batizados,Eventos)/@38.634382,-8.9147077,212m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd19414ebaa9e467:0x1d9b63c70ffe06a!8m2!3d38.634381!4d-8.914064!16s%2Fg%2F11w219lx62?authuser=0&entry=ttu&g_ep=EgoyMDI2MDQxMi4wIKXMDSoASAFQAw%3D%3D'

export default function LeadsClient({ leads: initial }: Props) {
  const [leads,        setLeads]        = useState(initial)
  const [expanded,     setExpanded]     = useState<string | null>(null)
  const [updatingId,   setUpdatingId]   = useState<string | null>(null)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [vista,        setVista]        = useState<'pipeline' | 'lista'>('pipeline')
  const [periodo,      setPeriodo]      = useState(30)
  const [arrastar,     setArrastar]     = useState<string | null>(null)
  const [sobre,        setSobre]        = useState<string | null>(null)

  // Portal form
  const [portalFormId,    setPortalFormId]    = useState<string | null>(null)
  const [portalForm,      setPortalForm]      = useState({ reuniao_data: '', reuniao_hora: '', reuniao_tipo: 'Presencial', reuniao_link: '' })
  const [creatingPortal,  setCreatingPortal]  = useState(false)
  const [copiedId,        setCopiedId]        = useState<string | null>(null)

  // Portal cliente
  const [creatingPortalCliente, setCreatingPortalCliente] = useState<Record<string, boolean>>({})
  const [createdPortalCliente,  setCreatedPortalCliente]  = useState<Record<string, boolean>>({})

  // Formas de pagamento
  const [formasPagamento, setFormasPagamento] = useState<Record<string, { adjudicacao: number; reforcao: number; final: number; guardadoEm?: string }>>({})
  const [savingPagamento, setSavingPagamento] = useState<Record<string, boolean>>({})
  const [savedPagamento,  setSavedPagamento]  = useState<Record<string, boolean>>({})

  async function savePagamento(lead: Lead) {
    if (!lead.page_token) return
    setSavingPagamento(s => ({ ...s, [lead.id]: true }))
    try {
      const guardadoEm = new Date().toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      const fp = { ...(formasPagamento[lead.id] || contentCache[lead.id]?.formas_pagamento || { adjudicacao: 50, reforcao: 0, final: 50 }), guardadoEm }
      const content = { ...(contentCache[lead.id] || {}), formas_pagamento: fp }
      await fetch('/api/media-portal/save-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: lead.page_token, page_content: content }),
      })
      setContentCache(c => ({ ...c, [lead.id]: content }))
      setSavedPagamento(s => ({ ...s, [lead.id]: true }))
      setTimeout(() => setSavedPagamento(s => ({ ...s, [lead.id]: false })), 2500)
    } catch { alert('Erro ao guardar.') }
    finally { setSavingPagamento(s => ({ ...s, [lead.id]: false })) }
  }

  async function criarPortalCliente(lead: Lead) {
    if (!lead.page_token) return
    setCreatingPortalCliente(s => ({ ...s, [lead.id]: true }))
    try {
      const conf    = contentCache[lead.id]?.confirmacao_proposta?.dados || {}
      const props   = contentCache[lead.id]?.propostas || []
      const propIdx = props.findIndex((p: any) => p.titulo === conf.proposta_escolhida)
      const prop    = propIdx >= 0 ? props[propIdx] : null
      const valor   = prop?.valor ? parseFloat(prop.valor.replace(/[^\d.]/g, '')) || 0 : 0
      const servicos: string[] = prop?.servicos || []

      // Construir entregas a partir dos serviços
      const entregasServicos = servicos
        .filter((s: string) => s.toLowerCase().includes('vídeo') || s.toLowerCase().includes('video'))
        .map((s: string) => ({ titulo: s, formato: 'MP4', duracao: '', estado: 'pendente' as const }))

      const ref = lead.page_token.toUpperCase()
      const fp = contentCache[lead.id]?.formas_pagamento || formasPagamento[lead.id] || { adjudicacao: 50, reforcao: 0, final: 50 }
      const fmtVal = (pct: number) => valor > 0 ? ` — ${(valor * pct / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}€` : ''
      const metodoPagamento = [
        fp.adjudicacao > 0 ? `Adjudicação ${fp.adjudicacao}%${fmtVal(fp.adjudicacao)}` : '',
        fp.reforcao    > 0 ? `Reforço ${fp.reforcao}%${fmtVal(fp.reforcao)}`           : '',
        fp.final       > 0 ? `Final ${fp.final}%${fmtVal(fp.final)}`                   : '',
      ].filter(Boolean).join('\n')

      const projeto = {
        ref,
        nome:            lead.empresa || lead.nome,
        cliente:         lead.empresa || lead.nome,
        tipo:            lead.tipo || 'Produção Photography & Video',
        local:           conf.local_evento || '',
        dataFilmagem:    conf.data_evento  || '',
        dataEntrega:     '',
        gestorNome:      'Rui Lima',
        gestorEmail:     'geral@rlphotovideo.pt',
        gestorTelefone:  '+351 912 345 678',
        status:          'Em Produção',
        revisoes:        { usadas: 0, total: 3 },
        fases: [
          { id: 'primeiro-contato',  nome: 'Primeiro Contacto',      descricao: 'Quando nos contactaste e falámos pela primeira vez.',                                         estado: 'concluido' },
          { id: 'briefing-inicial',  nome: 'Briefing Inicial',        descricao: 'Briefing realizado durante a nossa primeira reunião.',                                       estado: 'concluido' },
          { id: 'proposta-base',     nome: 'Proposta',                descricao: 'Enviámos a proposta com base nas informações recolhidas.',                                  estado: 'concluido' },
          { id: 'adjudicacao',       nome: 'Adjudicação',             descricao: 'A proposta foi aprovada e vamos iniciar o processo.',                                        estado: 'concluido' },
          { id: 'elaboracao-cps',    nome: 'Elaboração do CPS',       descricao: 'Recolha de todos os dados para o contrato de prestação de serviços.',                       estado: 'em_curso'  },
          { id: 'cps',               nome: 'CPS — Contrato',          descricao: 'Contrato de Prestação de Serviços a assinar e devolver.',                                    estado: 'pendente'  },
          { id: 'planeamento',       nome: 'Planeamento',             descricao: 'Definição de como e quando tudo vai acontecer.',                                             estado: 'pendente'  },
          { id: 'producao',          nome: 'Produção',                descricao: 'Dia de filmagem em locação.',                                                                estado: 'pendente', data: conf.data_evento || '' },
          { id: 'pos-producao',      nome: 'Pós-Produção',            descricao: 'Edição e criação dos conteúdos captados.',                                                   estado: 'pendente'  },
          { id: 'aprovacao',         nome: 'Aprovação',               descricao: 'Avaliação dos conteúdos e ronda de revisões.',                                               estado: 'pendente'  },
          { id: 'entrega',           nome: 'Entrega Final',           descricao: 'Entrega de todos os conteúdos acordados.',                                                   estado: 'pendente'  },
        ],
        pagamentos: valor > 0 ? [
          { descricao: 'Sinal — 50%',    valor: valor / 2, estado: 'pendente', data: '' },
          { descricao: 'Restante — 50%', valor: valor / 2, estado: 'pendente', data: '' },
        ] : [],
        entregas: entregasServicos.length > 0 ? entregasServicos : [
          { titulo: 'Conteúdos a definir', formato: 'MP4', duracao: '', estado: 'pendente' },
        ],
        briefingItems: [
          ...(conf.empresa      ? [{ label: 'Empresa / Marca',    desc: conf.empresa }]       : []),
          ...(conf.observacoes  ? [{ label: 'Observações',        desc: conf.observacoes }]   : []),
          ...(conf.local_evento ? [{ label: 'Local do Evento',    desc: conf.local_evento }]  : []),
          ...(conf.data_evento  ? [{ label: 'Data do Evento',     desc: conf.data_evento }]   : []),
        ],
        fichaCliente: {
          nome:               conf.nome        || lead.nome        || '',
          empresa:            conf.empresa     || lead.empresa     || '',
          nif:                conf.nif         || '',
          email:              conf.email       || lead.email       || '',
          telefone:           conf.telefone    || lead.telefone    || '',
          morada:             conf.morada      || '',
          representanteLegal: conf.nome        || lead.nome        || '',
          orcamento:          prop?.valor      || '',
          servicosList:       servicos.join('\n'),
          dataEvento:         conf.data_evento || '',
          localEvento:        conf.local_evento|| '',
          observacoes:        conf.observacoes || '',
          metodoPagamento,
        },
        heroImageUrl:   '',
        briefingUrl:    undefined,
        contratoUrl:    undefined,
        cpsFormUrl:     undefined,
        satisfacaoUrl:  undefined,
      }

      // Gravar na tabela media_portais
      const res = await fetch(`/api/media-portal/${ref}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projeto),
      })
      if (!res.ok) throw new Error('save failed')

      // Marcar portal_cliente.ativo no lead para persistir o estado
      const currentContent = contentCache[lead.id] || {}
      await fetch('/api/media-portal/save-content', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: lead.page_token,
          page_content: { ...currentContent, portal_cliente: { ativo: true, ref } },
        }),
      })

      setCreatedPortalCliente(s => ({ ...s, [lead.id]: true }))
    } catch { alert('Erro ao criar portal. Tenta novamente.') }
    finally { setCreatingPortalCliente(s => ({ ...s, [lead.id]: false })) }
  }

  // Propostas
  const [contentCache,    setContentCache]    = useState<Record<string, any>>({})
  const [propostas,       setPropostas]       = useState<Record<string, PropostaItem[]>>({})
  const [propostasLoading,setPropostasLoading]= useState<Record<string, boolean>>({})
  const [propostaOpen,    setPropostaOpen]    = useState<Record<string, number | null>>({}) // leadId → 0|1|2|null
  const [savingProposta,  setSavingProposta]  = useState<Record<string, boolean>>({})
  const [savedProposta,   setSavedProposta]   = useState<Record<string, boolean>>({})

  const filtered = filtroEstado === 'Todos' ? leads : leads.filter(l => l.estado === filtroEstado)

  // ── Propostas: carregar conteúdo ──────────────────────────────────────────
  async function loadContent(lead: Lead) {
    if (!lead.page_token || contentCache[lead.id] !== undefined) return
    setPropostasLoading(s => ({ ...s, [lead.id]: true }))
    try {
      const res  = await fetch(`/api/media-portal/view?token=${lead.page_token}`)
      const data = await res.json()
      const content = data.lead?.page_content || {}
      setContentCache(c => ({ ...c, [lead.id]: content }))
      setPropostas(p => ({
        ...p,
        [lead.id]: content.propostas || DEFAULT_PROPOSTAS.map(p => ({ ...p })),
      }))
    } finally {
      setPropostasLoading(s => ({ ...s, [lead.id]: false }))
    }
  }

  // ── Propostas: guardar + redirecionar ────────────────────────────────────
  async function saveProposta(lead: Lead, idx: number) {
    if (!lead.page_token) return
    const key = `${lead.id}_${idx}`
    setSavingProposta(s => ({ ...s, [key]: true }))
    try {
      const content = { ...(contentCache[lead.id] || {}), propostas: propostas[lead.id] }
      const res = await fetch('/api/media-portal/save-content', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token: lead.page_token, page_content: content }),
      })
      if (!res.ok) throw new Error('save failed')
      setContentCache(c => ({ ...c, [lead.id]: content }))
      setSavedProposta(s => ({ ...s, [key]: true }))
      // redirecionar para proposta criativa em novo tab
      window.open(`${BASE_URL}/rm/${lead.page_token}/proposta`, '_blank')
      setTimeout(() => setSavedProposta(s => ({ ...s, [key]: false })), 3000)
    } catch {
      alert('Erro ao guardar. Tenta novamente.')
    } finally {
      setSavingProposta(s => ({ ...s, [key]: false }))
    }
  }

  // ── Propostas: helpers de edição ─────────────────────────────────────────
  function updateProposta(leadId: string, idx: number, patch: Partial<PropostaItem>) {
    setPropostas(p => {
      const arr = [...(p[leadId] || DEFAULT_PROPOSTAS.map(x => ({ ...x })))]
      arr[idx]  = { ...arr[idx], ...patch }
      return { ...p, [leadId]: arr }
    })
  }

  // ── Portal ────────────────────────────────────────────────────────────────
  async function deleteLead(id: string) {
    setDeletingId(id)
    await fetch('/api/media-leads', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setLeads(ls => ls.filter(l => l.id !== id))
    setExpanded(null)
    setDeletingId(null)
  }

  // Aviso depois de qualificar: o projeto já está em Projetos com o portal pronto a enviar
  const [avisoPortal, setAvisoPortal] = useState<{ ref: string; nome: string } | null>(null)

  async function updateEstado(id: string, estado: string) {
    setUpdatingId(id)
    const r = await fetch('/api/media-leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, estado }) })
    const d = await r.json().catch(() => ({}))
    setLeads(ls => ls.map(l => l.id === id ? { ...l, estado, portal_ref: d.portal_ref ?? l.portal_ref } : l))
    if (estado === 'Validada' && d.portal_ref) {
      const lead = leads.find(l => l.id === id)
      setAvisoPortal({ ref: d.portal_ref, nome: lead?.empresa || lead?.nome || 'Projeto' })
    }
    // Reunião marcada: abre logo os dados da reunião para enviar o portal ao cliente
    if (estado === 'Reunião marcada') {
      const lead = leads.find(l => l.id === id)
      if (lead) {
        const tipo = lead.reuniao_tipo || 'Instalações da empresa'
        setPortalForm({ reuniao_data: lead.reuniao_data || '', reuniao_hora: lead.reuniao_hora || '', reuniao_tipo: tipo, reuniao_link: lead.reuniao_link || linkReuniao(tipo) })
        abrirNaLista(lead)
        setPortalFormId(lead.id)
      }
    }
    setUpdatingId(null)
  }

  async function criarPortal(lead: Lead) {
    setCreatingPortal(true)
    try {
      const res  = await fetch('/api/media-portal/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: lead.id, ...portalForm }) })
      const data = await res.json()
      if (data.ok) {
        if (!['Reunião marcada', 'Negociação', 'Validada', 'Não validada'].includes(lead.estado)) {
          fetch('/api/media-leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: lead.id, estado: 'Reunião marcada' }) })
          lead = { ...lead, estado: 'Reunião marcada' }
        }
        setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, estado: lead.estado, page_token: data.token, page_publicada: true, reuniao_data: portalForm.reuniao_data || undefined, reuniao_hora: portalForm.reuniao_hora || undefined, reuniao_tipo: portalForm.reuniao_tipo, reuniao_link: portalForm.reuniao_link || undefined } : l))
        setPortalFormId(null)
      }
    } catch { /* silent */ }
    setCreatingPortal(false)
  }

  function abrirNaLista(lead: Lead) {
    setVista('lista'); setFiltroEstado('Todos'); setExpanded(lead.id); loadContent(lead)
    setTimeout(() => document.getElementById(`lead-${lead.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  // Vindo da pesquisa rápida (?lead=id): abre essa lead na lista
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('lead')
    const lead = id ? initial.find(l => l.id === id) : undefined
    if (lead) abrirNaLista(lead)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Estatísticas (recalculadas sempre que um estado muda) ─────────────────
  const stats = useMemo(() => {
    const agora = Date.now()
    const t = (l: Lead) => new Date(l.created_at).getTime()
    const noPeriodo = leads.filter(l => agora - t(l) < periodo * DIA)
    const anterior  = leads.filter(l => agora - t(l) >= periodo * DIA && agora - t(l) < 2 * periodo * DIA)
    const variacao  = anterior.length ? Math.round(((noPeriodo.length - anterior.length) / anterior.length) * 100) : null
    const contar = (lista: Lead[], est: string[]) => lista.filter(l => est.includes(l.estado)).length
    const decididas = contar(leads, ['Validada', 'Não validada'])

    // Entradas por semana, últimas 12 semanas (segunda a domingo)
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
    const segunda = new Date(hoje); segunda.setDate(hoje.getDate() - ((hoje.getDay() + 6) % 7))
    const semanas = Array.from({ length: 12 }, (_, i) => {
      const ini = new Date(segunda); ini.setDate(segunda.getDate() - (11 - i) * 7)
      const fim = ini.getTime() + 7 * DIA
      const daSemana = leads.filter(l => t(l) >= ini.getTime() && t(l) < fim)
      return { ini, n: daSemana.length, qual: contar(daSemana, QUALIFICADAS) }
    })

    const agrupar = (campo: 'fonte' | 'tipo' | 'ramo') => {
      const m = new Map<string, number>()
      for (const l of noPeriodo) { const k = (l[campo] || 'Sem indicação').trim(); m.set(k, (m.get(k) ?? 0) + 1) }
      return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    }

    return {
      entradas: noPeriodo.length, variacao,
      qualificadas: contar(noPeriodo, QUALIFICADAS),
      taxaQual: noPeriodo.length ? Math.round((contar(noPeriodo, QUALIFICADAS) / noPeriodo.length) * 100) : 0,
      pipeline: contar(leads, PIPELINE),
      porTratar: contar(leads, ['Novo']),
      convertidas: contar(leads, ['Validada']),
      taxaConv: decididas ? Math.round((contar(leads, ['Validada']) / decididas) * 100) : 0,
      semanas, maxSemana: Math.max(1, ...semanas.map(s => s.n)),
      origens: agrupar('fonte'), servicos: agrupar('tipo'),
    }
  }, [leads, periodo])

  function copyLink(token: string) {
    navigator.clipboard.writeText(`${BASE_URL}/rm/${token}`)
    setCopiedId(token)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const labelCls = "text-[11px] tracking-[0.3em] text-white/40 uppercase"
  const inputCls = "w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/25 focus:outline-none px-4 py-3 text-[14px] text-white/70 placeholder:text-white/25 transition-colors [color-scheme:dark]"

  const kpi = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/70 px-5 py-4'
  const Barras = ({ titulo, dados }: { titulo: string; dados: [string, number][] }) => {
    const max = Math.max(1, ...dados.map(d => d[1]))
    return (
      <div className={kpi}>
        <p className="rlp-m text-[10px] text-[#5a8bff] mb-4">{titulo}</p>
        {dados.length === 0 && <p className="text-[13px] text-white/40">Sem entradas no período.</p>}
        <div className="space-y-2.5">
          {dados.map(([k, n]) => (
            <div key={k}>
              <div className="flex justify-between text-[12.5px]"><span className="text-white/75 truncate pr-2">{k}</span><span className="text-white/90 font-medium">{n}</span></div>
              <div className="mt-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-[#2e6cf6] transition-all duration-700" style={{ width: `${(n / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {avisoPortal && (
        <div className="fixed bottom-5 right-5 z-[80] max-w-sm rounded-2xl border border-[#2e6cf6]/60 bg-[#00141f]/95 backdrop-blur-md p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <p className="rlp-m text-[9.5px] text-[#a9c1ff]">Lead validada</p>
            <button type="button" onClick={() => setAvisoPortal(null)} aria-label="Fechar" className="text-white/40 hover:text-white">✕</button>
          </div>
          <p className="rlp-t mt-1 text-[20px] leading-tight">{avisoPortal.nome}</p>
          <p className="mt-1 text-[13px] text-white/60">O projeto já está em Projetos (Novos projetos) com o portal pronto a enviar.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/media/portal-cliente?ver=novos" className="rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-4 py-2 text-[12.5px] font-medium">Ver em Projetos</a>
            <a href={`/portal-media/${avisoPortal.ref}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/[0.16] px-4 py-2 text-[12.5px] text-white/80 hover:text-white">Abrir portal ↗</a>
          </div>
        </div>
      )}
      {/* ── Estatísticas ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Estatísticas</p>
        <div className="flex gap-1 rounded-full border border-white/[0.12] bg-[#00141f]/60 p-1">
          {PERIODOS.map(p => (
            <button key={p.id} onClick={() => setPeriodo(p.id)}
              className={`rounded-full px-3.5 py-1.5 text-[12px] transition-colors ${periodo === p.id ? 'bg-[#2e6cf6] text-white' : 'text-white/55 hover:text-white'}`}>
              {p.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className={kpi}>
          <p className="rlp-m text-[9.5px] text-white/45">Novas entradas</p>
          <p className="rlp-t mt-2 text-[40px] leading-none text-white">{stats.entradas}</p>
          <p className={`mt-2 text-[12px] ${stats.variacao === null ? 'text-white/35' : stats.variacao >= 0 ? 'text-[#5a8bff]' : 'text-[#ff4747]'}`}>
            {stats.variacao === null ? 'sem período anterior para comparar' : `${stats.variacao >= 0 ? '▲' : '▼'} ${Math.abs(stats.variacao)}% vs período anterior`}
          </p>
        </div>
        <div className={kpi}>
          <p className="rlp-m text-[9.5px] text-white/45">Com reunião</p>
          <p className="rlp-t mt-2 text-[40px] leading-none text-[#5a8bff]">{stats.qualificadas}</p>
          <p className="mt-2 text-[12px] text-white/45">{stats.taxaQual}% das entradas do período</p>
        </div>
        <button onClick={() => setVista('pipeline')} className={`${kpi} text-left hover:border-[#2e6cf6]/70 transition-colors`}>
          <p className="rlp-m text-[9.5px] text-white/45">Em pipeline</p>
          <p className="rlp-t mt-2 text-[40px] leading-none text-white">{stats.pipeline}</p>
          <p className="mt-2 text-[12px] text-white/45">{stats.porTratar} ainda por contactar</p>
        </button>
        <div className={kpi}>
          <p className="rlp-m text-[9.5px] text-white/45">Validadas</p>
          <p className="rlp-t mt-2 text-[40px] leading-none text-white">{stats.convertidas}</p>
          <p className="mt-2 text-[12px] text-white/45">{stats.taxaConv}% das leads já decididas</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr] gap-3">
        {/* Entradas por semana */}
        <div className={kpi}>
          <div className="flex items-center justify-between mb-4">
            <p className="rlp-m text-[10px] text-[#5a8bff]">Entradas por semana</p>
            <span className="flex items-center gap-3 text-[11px] text-white/45">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-[#2e6cf6]/45" />Entradas</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-[#5a8bff]" />Com reunião</span>
            </span>
          </div>
          <div className="flex items-end gap-1.5 h-[130px]">
            {stats.semanas.map((w, i) => (
              <div key={i} className="group relative flex-1 h-full flex flex-col justify-end">
                <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-[#00141f] border border-white/15 px-2 py-1 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {w.ini.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}: {w.n} · {w.qual} qual.
                </span>
                <div className="relative w-full rounded-t-md bg-[#2e6cf6]/45 transition-all duration-700" style={{ height: `${Math.max(w.n ? 6 : 2, (w.n / stats.maxSemana) * 100)}%` }}>
                  <div className="absolute bottom-0 inset-x-0 rounded-t-md bg-[#5a8bff]" style={{ height: w.n ? `${(w.qual / w.n) * 100}%` : 0 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[10.5px] text-white/35">
            <span>{stats.semanas[0].ini.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</span>
            <span>esta semana</span>
          </div>
        </div>
        <Barras titulo="De onde vêm" dados={stats.origens} />
        <Barras titulo="Serviços pedidos" dados={stats.servicos} />
      </div>

      {/* ── Pipeline / Lista ─────────────────────────────────────────────── */}
      <div className="mt-10 flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex gap-1 rounded-full border border-white/[0.12] bg-[#00141f]/60 p-1">
          {(['pipeline', 'lista'] as const).map(v => (
            <button key={v} onClick={() => setVista(v)}
              className={`rounded-full px-5 py-2 text-[13px] capitalize transition-colors ${vista === v ? 'bg-[#2e6cf6] text-white' : 'text-white/55 hover:text-white'}`}>
              {v}
            </button>
          ))}
        </div>
        {vista === 'pipeline' && <p className="text-[12px] text-white/40">Arrasta um cartão para outra coluna para mudar o estado.</p>}
      </div>

      {vista === 'pipeline' && (
        <div className="-mx-6 sm:-mx-10 px-6 sm:px-10 flex gap-3 overflow-x-auto pb-4 snap-x">
          {ESTADOS.map(est => {
            const col = leads.filter(l => l.estado === est)
            const cor = COR_ESTADO[est]
            return (
              <div key={est}
                onDragOver={e => { e.preventDefault(); setSobre(est) }}
                onDragLeave={() => setSobre(s => s === est ? null : s)}
                onDrop={e => {
                  e.preventDefault(); setSobre(null)
                  const id = arrastar; setArrastar(null)
                  const lead = leads.find(l => l.id === id)
                  if (lead && lead.estado !== est) updateEstado(lead.id, est)
                }}
                className="snap-start shrink-0 w-[250px] rounded-2xl border bg-[#00141f]/70 p-3 transition-colors"
                style={{ borderColor: sobre === est ? cor : 'rgba(255,255,255,0.09)', background: sobre === est ? `${cor}12` : undefined }}>
                <div className="flex items-center justify-between px-1.5 pb-3 mb-2 border-b border-white/[0.07]">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: cor }} />
                    <span className="rlp-t text-[16px] tracking-[0.03em]">{est}</span>
                  </span>
                  <span className="text-[12px] text-white/50">{col.length}</span>
                </div>
                <div className="flex flex-col gap-2 min-h-[80px]">
                  {col.map(l => (
                    <div key={l.id} draggable
                      onDragStart={() => setArrastar(l.id)} onDragEnd={() => { setArrastar(null); setSobre(null) }}
                      onClick={() => abrirNaLista(l)}
                      className={`cursor-grab active:cursor-grabbing rounded-xl border border-white/[0.08] bg-[#0c2236]/80 hover:border-white/25 px-3 py-2.5 transition-all ${arrastar === l.id ? 'opacity-40' : ''} ${updatingId === l.id ? 'animate-pulse' : ''}`}>
                      <p className="text-[13.5px] text-white/90 truncate">{l.empresa || l.nome}</p>
                      {l.empresa && <p className="text-[11.5px] text-white/45 truncate">{l.nome}</p>}
                      <div className="mt-1.5 flex items-center justify-between gap-2 text-[10.5px] text-white/40">
                        <span className="truncate">{l.tipo || l.ramo || '—'}</span>
                        <span className="shrink-0">{new Date(l.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}</span>
                      </div>
                    </div>
                  ))}
                  {col.length === 0 && <p className="px-1.5 py-4 text-center text-[11.5px] text-white/25">Larga aqui</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {vista === 'lista' && (<>
      {/* Filtro */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {['Todos', ...ESTADOS].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)}
            className={`rounded-full text-[12px] px-4 py-2 border transition-all duration-200 ${
              filtroEstado === e ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white' : 'border-white/[0.12] text-white/55 hover:border-white/30 hover:text-white'
            }`}>
            {e}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {filtered.map(lead => (
          <div key={lead.id} id={`lead-${lead.id}`} className="scroll-mt-24 rounded-xl overflow-hidden border border-white/[0.1] hover:border-white/25 bg-[#00141f]/75 transition-all duration-300">

            {/* Row */}
            <div className="flex items-center gap-5 px-6 py-5 cursor-pointer"
              onClick={() => {
                const next = expanded === lead.id ? null : lead.id
                setExpanded(next)
                if (next) loadContent(lead)
              }}>
              <span className="rlp-m shrink-0 text-[9.5px] px-3 py-1.5 border rounded-full" style={estiloEstado(lead.estado)}>
                {lead.estado}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-4">
                  <p className="text-[15px] tracking-[0.08em] text-white/80 font-medium truncate">{lead.nome}</p>
                  {lead.empresa && <p className="text-[13px] text-white/40 truncate hidden sm:block">{lead.empresa}</p>}
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  {lead.tipo && <span className="text-[11px] tracking-[0.15em] text-white/30 uppercase">{lead.tipo}</span>}
                  {lead.fonte && (<><span className="text-white/15">·</span><span className="text-[11px] tracking-[0.15em] text-white/30 uppercase">{lead.fonte}</span></>)}
                  {lead.page_token && (<><span className="text-white/15">·</span><span className="text-[11px] tracking-[0.15em] text-[#5a8bff]/50 uppercase">Portal Ativo</span></>)}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] text-white/30 font-mono">{formatDate(lead.created_at)}</p>
                <p className="text-[11px] text-white/25 mt-1.5">{expanded === lead.id ? '▲' : '▼'}</p>
              </div>
            </div>

            {/* Detalhe */}
            {expanded === lead.id && (
              <div className="border-t border-white/[0.06] px-6 py-6 flex flex-col gap-6">

                {/* Contacto */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                  {lead.email && (<div><p className={labelCls}>Email</p><a href={`mailto:${lead.email}`} className="text-[13px] text-white/60 hover:text-white/85 transition-colors mt-2 block">{lead.email}</a></div>)}
                  {lead.telefone && (<div><p className={labelCls}>Telefone</p><a href={`tel:${lead.telefone}`} className="text-[13px] text-white/60 hover:text-white/85 transition-colors mt-2 block">{lead.telefone}</a></div>)}
                  {lead.tipo && (<div><p className={labelCls}>Serviço</p><p className="text-[13px] text-white/60 mt-2">{lead.tipo}</p></div>)}
                  {lead.fonte && (<div><p className={labelCls}>Origem</p><p className="text-[13px] text-white/60 mt-2">{lead.fonte}</p></div>)}
                  {lead.ramo && (<div><p className={labelCls}>Ramo</p><p className="text-[13px] text-white/60 mt-2">{lead.ramo}</p></div>)}
                  {lead.website && (<div><p className={labelCls}>Site</p><a href={linkSite(lead.website)} target="_blank" rel="noopener noreferrer" className="text-[13px] text-white/60 hover:text-white/85 transition-colors mt-2 block truncate">{lead.website} ↗</a></div>)}
                  {lead.instagram && (<div><p className={labelCls}>Instagram</p><a href={linkInstagram(lead.instagram)} target="_blank" rel="noopener noreferrer" className="text-[13px] text-white/60 hover:text-white/85 transition-colors mt-2 block truncate">{lead.instagram} ↗</a></div>)}
                </div>

                {/* Mensagem */}
                {lead.mensagem && (
                  <div>
                    <p className={labelCls + ' mb-2'}>Mensagem</p>
                    <p className="text-[14px] text-white/50 leading-relaxed bg-white/[0.02] border border-white/[0.06] px-5 py-4">{lead.mensagem}</p>
                  </div>
                )}

                {/* Estado */}
                <div>
                  <p className={labelCls + ' mb-3'}>Atualizar Estado</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {ESTADOS.map(e => (
                      <button key={e} disabled={lead.estado === e || updatingId === lead.id} onClick={() => updateEstado(lead.id, e)}
                        style={lead.estado === e ? estiloEstado(e) : undefined}
                        className={`text-[11px] tracking-[0.2em] uppercase px-4 py-2 border rounded-full transition-all duration-200 ${lead.estado === e ? 'cursor-default' : 'border-white/[0.09] text-white/30 hover:border-white/25 hover:text-white/55 disabled:opacity-30'}`}>
                        {e}
                      </button>
                    ))}
                    {updatingId === lead.id && <span className="text-[11px] text-white/30 tracking-widest">A guardar...</span>}
                  </div>
                </div>

                {/* ── CONFIRMAÇÃO DE PROPOSTA ── */}
                {lead.page_token && contentCache[lead.id]?.confirmacao_proposta && (() => {
                  const conf = contentCache[lead.id].confirmacao_proposta
                  const d    = conf.dados || {}
                  const isAceite = conf.acao === 'aceite'
                  return (
                    <div className="border-t border-white/[0.05] pt-5">
                      <div className="flex items-center gap-3 mb-4">
                        <p className={labelCls}>Confirmação de Proposta</p>
                        <span className={`text-[11px] tracking-[0.2em] uppercase px-3 py-1 border ${isAceite ? 'border-[#5a8bff]/40 text-[#5a8bff]/70' : 'border-red-400/30 text-red-400/50'}`}>
                          {isAceite ? '✓ Aceite' : '✕ Rejeitada'}
                        </span>
                      </div>
                      {isAceite && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 bg-white/[0.02] border border-white/[0.06] px-5 py-4">
                          {d.proposta_escolhida && <div><p className={labelCls}>Proposta Escolhida</p><p className="text-[14px] text-[#5a8bff]/80 font-medium mt-1">{d.proposta_escolhida}</p></div>}
                          {d.nome              && <div><p className={labelCls}>Nome</p><p className="text-[13px] text-white/65 mt-1">{d.nome}</p></div>}
                          {d.email             && <div><p className={labelCls}>Email</p><p className="text-[13px] text-white/65 mt-1">{d.email}</p></div>}
                          {d.telefone          && <div><p className={labelCls}>Telefone</p><p className="text-[13px] text-white/65 mt-1">{d.telefone}</p></div>}
                          {d.empresa           && <div><p className={labelCls}>Empresa</p><p className="text-[13px] text-white/65 mt-1">{d.empresa}</p></div>}
                          {d.nif               && <div><p className={labelCls}>NIF</p><p className="text-[13px] text-white/65 mt-1">{d.nif}</p></div>}
                          {d.morada            && <div><p className={labelCls}>Morada</p><p className="text-[13px] text-white/65 mt-1">{d.morada}</p></div>}
                          {d.data_evento       && <div><p className={labelCls}>Data do Evento</p><p className="text-[13px] text-white/65 mt-1">{d.data_evento}</p></div>}
                          {d.local_evento      && <div><p className={labelCls}>Local do Evento</p><p className="text-[13px] text-white/65 mt-1">{d.local_evento}</p></div>}
                          {d.observacoes       && <div className="col-span-2 sm:col-span-3"><p className={labelCls}>Observações</p><p className="text-[13px] text-white/60 mt-1 leading-relaxed">{d.observacoes}</p></div>}
                          <div className="col-span-2 sm:col-span-3 border-t border-white/[0.05] pt-3 mt-1">
                            <p className="text-[11px] text-white/20 font-mono">{new Date(conf.timestamp).toLocaleString('pt-PT')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* ── FORMAS DE PAGAMENTO ── */}
                {lead.page_token && contentCache[lead.id]?.confirmacao_proposta?.acao === 'aceite' && (() => {
                  const conf     = contentCache[lead.id].confirmacao_proposta.dados || {}
                  const props    = contentCache[lead.id]?.propostas || []
                  const propIdx  = props.findIndex((p: any) => p.titulo === conf.proposta_escolhida)
                  const prop     = propIdx >= 0 ? props[propIdx] : null
                  const valorNum = parseFloat((prop?.valor || '').replace(/[^\d.,]/g, '').replace(',', '.')) || 0
                  const fp       = formasPagamento[lead.id] ?? (contentCache[lead.id]?.formas_pagamento ?? { adjudicacao: 50, reforcao: 0, final: 50 })
                  const total    = (fp.adjudicacao || 0) + (fp.reforcao || 0) + (fp.final || 0)
                  const calcVal  = (pct: number) =>
                    valorNum > 0 ? (valorNum * pct / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2 }) + '€' : '—'

                  return (
                    <div className="border-t border-white/[0.05] pt-5">
                      <p className={labelCls + ' mb-4'}>Formas de Pagamento</p>
                      <div className="border border-white/[0.09] bg-white/[0.01] p-5 flex flex-col gap-4">
                        {([
                          { key: 'adjudicacao', label: 'Adjudicação' },
                          { key: 'reforcao',    label: 'Reforço'     },
                          { key: 'final',       label: 'Final'       },
                        ] as const).map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-4">
                            <span className="text-[12px] tracking-[0.2em] text-white/40 uppercase w-28 shrink-0">{label}</span>
                            <select
                              value={fp[key] ?? 0}
                              onChange={e => setFormasPagamento(s => ({
                                ...s,
                                [lead.id]: { ...(s[lead.id] ?? fp), [key]: parseInt(e.target.value) },
                              }))}
                              className="bg-white/[0.03] border border-white/[0.08] text-white/70 text-[13px] px-3 py-2 [color-scheme:dark] focus:outline-none focus:border-white/25"
                            >
                              {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(p => (
                                <option key={p} value={p}>{p}%</option>
                              ))}
                            </select>
                            <span className="text-[14px] font-mono text-white/60 w-28 text-right">{calcVal(fp[key] ?? 0)}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                          <span className={`text-[11px] tracking-[0.2em] uppercase ${total === 100 ? 'text-[#5a8bff]/60' : 'text-[#a9c1ff]/60'}`}>
                            Total: {total}% {total === 100 ? '✓' : `· faltam ${100 - total}%`}
                          </span>
                          {valorNum > 0 && (
                            <span className="text-[13px] font-mono text-white/40">{valorNum.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}€</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => savePagamento(lead)}
                            disabled={savingPagamento[lead.id]}
                            className={`flex-1 py-3 text-[12px] tracking-[0.35em] uppercase border transition-all disabled:opacity-40 ${
                              savedPagamento[lead.id]
                                ? 'border-[#5a8bff]/50 text-[#5a8bff]/70 bg-[#5a8bff]/[0.05]'
                                : 'border-white/20 text-white/50 hover:border-white/35 hover:text-white/75 bg-white/[0.02] hover:bg-white/[0.06]'
                            }`}
                          >
                            {savedPagamento[lead.id] ? '✓ Guardado' : savingPagamento[lead.id] ? 'A guardar...' : 'Guardar Pagamentos'}
                          </button>
                          {(fp.guardadoEm || savedPagamento[lead.id]) && (
                            <span className="text-[10px] font-mono text-white/25 shrink-0">
                              {savedPagamento[lead.id]
                                ? new Date().toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                : fp.guardadoEm}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* ── PROPOSTAS CRIATIVAS ── */}
                {lead.page_token && (
                  <div className="border-t border-white/[0.05] pt-5">
                    <p className={labelCls + ' mb-4'}>Propostas Criativas</p>

                    {propostasLoading[lead.id] ? (
                      <p className="text-[12px] text-white/30 tracking-widest animate-pulse">A carregar...</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {(propostas[lead.id] || DEFAULT_PROPOSTAS).map((prop, idx) => {
                          const isOpen = propostaOpen[lead.id] === idx
                          const key      = `${lead.id}_${idx}`
                          const isSaving = savingProposta[key]
                          const isSaved  = savedProposta[key]

                          return (
                            <div key={idx} className="border border-white/[0.09] bg-white/[0.01]">

                              {/* Cabeçalho accordeão */}
                              <button
                                className="w-full flex items-center justify-between px-5 py-4 text-left"
                                onClick={() => setPropostaOpen(s => ({ ...s, [lead.id]: isOpen ? null : idx }))}
                              >
                                <div className="flex items-center gap-4">
                                  <span className="text-[13px] tracking-[0.3em] text-white/65 uppercase font-medium">{prop.titulo}</span>
                                  {prop.servicos.length > 0 && (
                                    <span className="text-[11px] text-white/35 tracking-wide">{prop.servicos.length} serviço{prop.servicos.length !== 1 ? 's' : ''}</span>
                                  )}
                                  {prop.valor && (
                                    <span className="text-[13px] text-[#5a8bff]/60 font-mono">{prop.valor}</span>
                                  )}
                                </div>
                                <span className="text-[12px] text-white/30">{isOpen ? '▲' : '▼'}</span>
                              </button>

                              {/* Corpo */}
                              {isOpen && (
                                <div className="border-t border-white/[0.06] px-5 py-5 flex flex-col gap-6">

                                  {/* Serviços — toggle grid */}
                                  <div>
                                    <p className={labelCls + ' mb-3'}>Serviços</p>
                                    <div className="flex flex-wrap gap-2">
                                      {SERVICOS_LISTA.map(s => {
                                        const active = prop.servicos.includes(s)
                                        return (
                                          <button
                                            key={s}
                                            onClick={() => {
                                              const cur = prop.servicos
                                              updateProposta(lead.id, idx, {
                                                servicos: active
                                                  ? cur.filter(x => x !== s)
                                                  : [...cur, s],
                                              })
                                            }}
                                            className={`text-[11px] tracking-[0.15em] uppercase px-3 py-2 border transition-all duration-150 ${
                                              active
                                                ? 'border-white/45 text-white/85 bg-white/[0.09]'
                                                : 'border-white/[0.10] text-white/35 hover:border-white/25 hover:text-white/55'
                                            }`}
                                          >
                                            {active && <span className="mr-1.5 text-[#5a8bff]/80">✓</span>}
                                            {s}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>

                                  {/* Valor */}
                                  <div>
                                    <p className={labelCls + ' mb-2'}>Valor / Investimento</p>
                                    <input
                                      className={inputCls}
                                      placeholder="Ex: 2.500€"
                                      value={prop.valor}
                                      onChange={e => updateProposta(lead.id, idx, { valor: e.target.value })}
                                    />
                                  </div>

                                  {/* Guardar */}
                                  <button
                                    onClick={() => saveProposta(lead, idx)}
                                    disabled={isSaving}
                                    className={`w-full py-3.5 text-[12px] tracking-[0.4em] uppercase font-medium transition-all border disabled:opacity-40 ${
                                      isSaved
                                        ? 'border-[#5a8bff]/50 text-[#5a8bff]/80 bg-[#5a8bff]/[0.07]'
                                        : 'border-white/30 text-white/70 bg-white/[0.05] hover:bg-white/[0.10] hover:border-white/50 hover:text-white/90'
                                    }`}>
                                    {isSaved
                                      ? '✓ Guardado — A abrir Proposta Criativa...'
                                      : isSaving
                                      ? 'A guardar...'
                                      : `Guardar e Ver ${prop.titulo} →`}
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ── PORTAL ── */}
                <div className="border-t border-white/[0.05] pt-5">
                  <p className={labelCls + ' mb-4'}>Portal de Reunião</p>
                  {lead.page_token ? (
                    <div className="flex flex-col gap-4">
                      {(lead.reuniao_data || lead.reuniao_hora || lead.reuniao_tipo) && (
                        <div className="flex items-center gap-5 flex-wrap text-[12px] text-white/40 font-mono">
                          {lead.reuniao_data && <span>{lead.reuniao_data}</span>}
                          {lead.reuniao_hora && <span>{lead.reuniao_hora.slice(0,5)}</span>}
                          {lead.reuniao_tipo && <span>{lead.reuniao_tipo}</span>}
                          {lead.page_confirmacao === 'confirmada' && <span className="text-[#5a8bff]/60">✓ Confirmada</span>}
                          {lead.page_confirmacao === 'alteracao_pedida' && <span className="text-[#a9c1ff]/60">⏳ Alteração pedida</span>}
                          {lead.page_views ? <span className="text-white/25">{lead.page_views} visualizações</span> : null}
                        </div>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <a href={`/rm/${lead.page_token}`} target="_blank" rel="noopener noreferrer"
                          className="text-[12px] tracking-[0.25em] text-white/45 hover:text-white/70 border border-white/[0.10] hover:border-white/25 px-4 py-2.5 uppercase transition-all">
                          Ver Portal →
                        </a>
                        <a href={`/rm/${lead.page_token}/proposta`} target="_blank" rel="noopener noreferrer"
                          className="text-[12px] tracking-[0.25em] text-[#a9c1ff]/60 hover:text-[#a9c1ff]/90 border border-[#a9c1ff]/25 hover:border-[#a9c1ff]/55 px-4 py-2.5 uppercase transition-all">
                          Editar Proposta ✎
                        </a>
                        {contentCache[lead.id]?.portal_cliente?.ativo || createdPortalCliente[lead.id] ? (
                          <a href={`/portal-media/${lead.page_token}`} target="_blank" rel="noopener noreferrer"
                            className="text-[12px] tracking-[0.25em] text-[#a9c1ff]/65 hover:text-[#a9c1ff]/95 border border-[#a9c1ff]/30 hover:border-[#a9c1ff]/60 px-4 py-2.5 uppercase transition-all">
                            Ver Portal Cliente →
                          </a>
                        ) : (
                          <button
                            onClick={() => criarPortalCliente(lead)}
                            disabled={creatingPortalCliente[lead.id]}
                            className="text-[12px] tracking-[0.25em] text-[#a9c1ff]/50 hover:text-[#a9c1ff]/80 border border-[#a9c1ff]/20 hover:border-[#a9c1ff]/45 px-4 py-2.5 uppercase transition-all disabled:opacity-40">
                            {creatingPortalCliente[lead.id] ? 'A criar...' : '+ Criar Portal Cliente'}
                          </button>
                        )}
                        <button onClick={() => copyLink(lead.page_token!)}
                          className="text-[12px] tracking-[0.25em] text-white/35 hover:text-white/60 border border-white/[0.10] hover:border-white/20 px-4 py-2.5 uppercase transition-all">
                          {copiedId === lead.page_token ? '✓ Copiado' : 'Copiar Link'}
                        </button>
                        <button onClick={() => { const tipo = lead.reuniao_tipo || 'Instalações da empresa'; setPortalForm({ reuniao_data: lead.reuniao_data || '', reuniao_hora: lead.reuniao_hora || '', reuniao_tipo: tipo, reuniao_link: lead.reuniao_link || linkReuniao(tipo) }); setPortalFormId(portalFormId === lead.id ? null : lead.id) }}
                          className="text-[12px] tracking-[0.25em] text-white/35 hover:text-white/60 border border-white/[0.10] hover:border-white/20 px-4 py-2.5 uppercase transition-all">
                          Editar Reunião
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setPortalForm({ reuniao_data: '', reuniao_hora: '', reuniao_tipo: 'Instalações da empresa', reuniao_link: MAPS_LINK }); setPortalFormId(portalFormId === lead.id ? null : lead.id) }}
                      className="text-[12px] tracking-[0.25em] text-white/40 hover:text-white/65 border border-white/[0.10] hover:border-white/25 px-5 py-3 uppercase transition-all">
                      + Criar Portal de Reunião
                    </button>
                  )}

                  {portalFormId === lead.id && (
                    <div className="mt-5 border border-white/[0.09] bg-white/[0.02] p-5 flex flex-col gap-5">
                      <p className="text-[11px] tracking-[0.4em] text-white/35 uppercase">{lead.page_token ? 'Atualizar Reunião' : 'Dados da Reunião'}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className={labelCls + ' mb-2 block'}>Data</label><CampoDataPT value={portalForm.reuniao_data} onChange={v => setPortalForm(f => ({ ...f, reuniao_data: v }))} className={inputCls + ' w-full'} /></div>
                        <div><label className={labelCls + ' mb-2 block'}>Hora</label><input type="time" value={portalForm.reuniao_hora} onChange={e => setPortalForm(f => ({ ...f, reuniao_hora: e.target.value }))} className={inputCls} /></div>
                      </div>
                      <div>
                        <label className={labelCls + ' mb-2 block'}>Modo</label>
                        <div className="flex gap-3">
                          {['Videochamada', 'Presencial', 'Instalações da empresa'].map(tipo => (
                            <button key={tipo} onClick={() => setPortalForm(f => ({ ...f, reuniao_tipo: tipo, reuniao_link: linkReuniao(tipo) }))}
                              className={`flex-1 py-3 text-[12px] tracking-[0.2em] uppercase border transition-all ${portalForm.reuniao_tipo === tipo ? 'border-white/30 text-white/70 bg-white/[0.05]' : 'border-white/[0.09] text-white/30 hover:border-white/20'}`}>
                              {tipo}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div><label className={labelCls + ' mb-2 block'}>{portalForm.reuniao_tipo === 'Videochamada' ? 'Link Google Meet' : portalForm.reuniao_tipo === 'Presencial' ? 'Local (link do Google Maps)' : 'Link Google Maps da RL PROD'}</label><input type="url" value={portalForm.reuniao_link} placeholder="https://..." onChange={e => setPortalForm(f => ({ ...f, reuniao_link: e.target.value }))} className={inputCls} /></div>
                      <div className="flex items-center gap-3 pt-1">
                        <button onClick={() => criarPortal(lead)} disabled={creatingPortal}
                          className="flex-1 py-3 border border-white/25 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/35 text-[12px] tracking-[0.35em] text-white/60 hover:text-white/80 uppercase transition-all disabled:opacity-30">
                          {creatingPortal ? 'A enviar...' : lead.page_token ? '✓ Atualizar e reenviar' : '✓ Enviar portal da reunião'}
                        </button>
                        <button onClick={() => setPortalFormId(null)} className="px-5 py-3 border border-white/[0.09] text-[12px] tracking-[0.25em] text-white/30 hover:text-white/55 uppercase transition-all">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Apagar */}
                <div className="flex justify-end pt-2 border-t border-white/[0.05]">
                  {deletingId === lead.id ? (
                    <span className="text-[11px] text-white/30 tracking-widest">A apagar...</span>
                  ) : (
                    <button onClick={() => { if (confirm(`Apagar lead de ${lead.nome}?`)) deleteLead(lead.id) }}
                      className="text-[11px] tracking-[0.3em] uppercase text-red-400/45 hover:text-red-400/75 transition-colors">
                      Apagar Lead
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      </>)}
    </div>
  )
}
