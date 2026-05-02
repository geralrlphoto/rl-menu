'use client'

import { useState } from 'react'

const ESTADOS = ['Novo', 'Em Contacto', 'Qualificado', 'Proposta Env.', 'Perdido', 'Convertido']

interface Lead {
  id: string
  nome: string
  empresa?: string
  email?: string
  telefone?: string
  tipo?: string
  fonte?: string
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
  estadoColors: Record<string, string>
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

const BASE_URL  = process.env.NEXT_PUBLIC_BASE_URL || 'https://rl-menu-lake.vercel.app'
const MEET_LINK = 'https://meet.google.com/dih-etvh-xkh'
const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video+(Casamentos,Batizados,Eventos)/@38.634382,-8.9147077,212m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd19414ebaa9e467:0x1d9b63c70ffe06a!8m2!3d38.634381!4d-8.914064!16s%2Fg%2F11w219lx62?authuser=0&entry=ttu&g_ep=EgoyMDI2MDQxMi4wIKXMDSoASAFQAw%3D%3D'

export default function LeadsClient({ leads: initial, estadoColors }: Props) {
  const [leads,        setLeads]        = useState(initial)
  const [expanded,     setExpanded]     = useState<string | null>(null)
  const [updatingId,   setUpdatingId]   = useState<string | null>(null)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('Todos')

  // Portal form
  const [portalFormId,    setPortalFormId]    = useState<string | null>(null)
  const [portalForm,      setPortalForm]      = useState({ reuniao_data: '', reuniao_hora: '', reuniao_tipo: 'Presencial', reuniao_link: '' })
  const [creatingPortal,  setCreatingPortal]  = useState(false)
  const [copiedId,        setCopiedId]        = useState<string | null>(null)

  // Portal cliente
  const [creatingPortalCliente, setCreatingPortalCliente] = useState<Record<string, boolean>>({})
  const [createdPortalCliente,  setCreatedPortalCliente]  = useState<Record<string, boolean>>({})

  // Formas de pagamento
  const [formasPagamento, setFormasPagamento] = useState<Record<string, { adjudicacao: number; reforcao: number; final: number }>>({})
  const [savingPagamento, setSavingPagamento] = useState<Record<string, boolean>>({})
  const [savedPagamento,  setSavedPagamento]  = useState<Record<string, boolean>>({})

  async function savePagamento(lead: Lead) {
    if (!lead.page_token) return
    setSavingPagamento(s => ({ ...s, [lead.id]: true }))
    try {
      const fp = formasPagamento[lead.id] || contentCache[lead.id]?.formas_pagamento || { adjudicacao: 50, reforcao: 0, final: 50 }
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
        tipo:            lead.tipo || 'Produção Audiovisual',
        local:           conf.local_evento || '',
        dataFilmagem:    conf.data_evento  || '',
        dataEntrega:     '',
        gestorNome:      'Rui Lima',
        gestorEmail:     'geral@rlmedia.pt',
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

  async function updateEstado(id: string, estado: string) {
    setUpdatingId(id)
    await fetch('/api/media-leads', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, estado }) })
    setLeads(ls => ls.map(l => l.id === id ? { ...l, estado } : l))
    setUpdatingId(null)
  }

  async function criarPortal(lead: Lead) {
    setCreatingPortal(true)
    try {
      const res  = await fetch('/api/media-portal/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lead_id: lead.id, ...portalForm }) })
      const data = await res.json()
      if (data.ok) {
        setLeads(ls => ls.map(l => l.id === lead.id ? { ...l, page_token: data.token, page_publicada: true, reuniao_data: portalForm.reuniao_data || undefined, reuniao_hora: portalForm.reuniao_hora || undefined, reuniao_tipo: portalForm.reuniao_tipo, reuniao_link: portalForm.reuniao_link || undefined } : l))
        setPortalFormId(null)
      }
    } catch { /* silent */ }
    setCreatingPortal(false)
  }

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

  return (
    <div>
      {/* Filtro */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {['Todos', ...ESTADOS].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)}
            className={`text-[11px] tracking-[0.2em] uppercase px-4 py-2 border transition-all duration-200 ${
              filtroEstado === e ? 'border-white/35 text-white/70 bg-white/[0.07]' : 'border-white/[0.10] text-white/35 hover:border-white/25 hover:text-white/55'
            }`}>
            {e}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3">
        {filtered.map(lead => (
          <div key={lead.id} className="border border-white/[0.09] hover:border-white/20 bg-white/[0.02] transition-all duration-300">

            {/* Row */}
            <div className="flex items-center gap-5 px-6 py-5 cursor-pointer"
              onClick={() => {
                const next = expanded === lead.id ? null : lead.id
                setExpanded(next)
                if (next) loadContent(lead)
              }}>
              <span className={`shrink-0 text-[10px] tracking-[0.25em] uppercase px-3 py-1.5 border ${estadoColors[lead.estado] ?? 'border-white/10 text-white/30'}`}>
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
                  {lead.page_token && (<><span className="text-white/15">·</span><span className="text-[11px] tracking-[0.15em] text-emerald-400/50 uppercase">Portal Ativo</span></>)}
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
                        className={`text-[11px] tracking-[0.2em] uppercase px-4 py-2 border transition-all duration-200 ${lead.estado === e ? `${estadoColors[e]} cursor-default` : 'border-white/[0.09] text-white/30 hover:border-white/25 hover:text-white/55 disabled:opacity-30'}`}>
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
                        <span className={`text-[11px] tracking-[0.2em] uppercase px-3 py-1 border ${isAceite ? 'border-emerald-400/40 text-emerald-400/70' : 'border-red-400/30 text-red-400/50'}`}>
                          {isAceite ? '✓ Aceite' : '✕ Rejeitada'}
                        </span>
                      </div>
                      {isAceite && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 bg-white/[0.02] border border-white/[0.06] px-5 py-4">
                          {d.proposta_escolhida && <div><p className={labelCls}>Proposta Escolhida</p><p className="text-[14px] text-emerald-400/80 font-medium mt-1">{d.proposta_escolhida}</p></div>}
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
                          <span className={`text-[11px] tracking-[0.2em] uppercase ${total === 100 ? 'text-emerald-400/60' : 'text-amber-400/60'}`}>
                            Total: {total}% {total === 100 ? '✓' : `· faltam ${100 - total}%`}
                          </span>
                          {valorNum > 0 && (
                            <span className="text-[13px] font-mono text-white/40">{valorNum.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}€</span>
                          )}
                        </div>
                        <button
                          onClick={() => savePagamento(lead)}
                          disabled={savingPagamento[lead.id]}
                          className={`py-3 text-[12px] tracking-[0.35em] uppercase border transition-all disabled:opacity-40 ${
                            savedPagamento[lead.id]
                              ? 'border-emerald-400/50 text-emerald-400/70 bg-emerald-400/[0.05]'
                              : 'border-white/20 text-white/50 hover:border-white/35 hover:text-white/75 bg-white/[0.02] hover:bg-white/[0.06]'
                          }`}
                        >
                          {savedPagamento[lead.id] ? '✓ Guardado' : savingPagamento[lead.id] ? 'A guardar...' : 'Guardar Pagamentos'}
                        </button>
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
                                    <span className="text-[13px] text-emerald-400/60 font-mono">{prop.valor}</span>
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
                                            {active && <span className="mr-1.5 text-emerald-400/80">✓</span>}
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
                                        ? 'border-emerald-400/50 text-emerald-400/80 bg-emerald-400/[0.07]'
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
                          {lead.page_confirmacao === 'confirmada' && <span className="text-emerald-400/60">✓ Confirmada</span>}
                          {lead.page_confirmacao === 'alteracao_pedida' && <span className="text-amber-400/60">⏳ Alteração pedida</span>}
                          {lead.page_views ? <span className="text-white/25">{lead.page_views} visualizações</span> : null}
                        </div>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <a href={`/rm/${lead.page_token}`} target="_blank" rel="noopener noreferrer"
                          className="text-[12px] tracking-[0.25em] text-white/45 hover:text-white/70 border border-white/[0.10] hover:border-white/25 px-4 py-2.5 uppercase transition-all">
                          Ver Portal →
                        </a>
                        <a href={`/rm/${lead.page_token}/proposta`} target="_blank" rel="noopener noreferrer"
                          className="text-[12px] tracking-[0.25em] text-amber-400/60 hover:text-amber-400/90 border border-amber-400/25 hover:border-amber-400/55 px-4 py-2.5 uppercase transition-all">
                          Editar Proposta ✎
                        </a>
                        {contentCache[lead.id]?.portal_cliente?.ativo || createdPortalCliente[lead.id] ? (
                          <a href={`/portal-media/${lead.page_token}`} target="_blank" rel="noopener noreferrer"
                            className="text-[12px] tracking-[0.25em] text-sky-400/65 hover:text-sky-400/95 border border-sky-400/30 hover:border-sky-400/60 px-4 py-2.5 uppercase transition-all">
                            Ver Portal Cliente →
                          </a>
                        ) : (
                          <button
                            onClick={() => criarPortalCliente(lead)}
                            disabled={creatingPortalCliente[lead.id]}
                            className="text-[12px] tracking-[0.25em] text-sky-400/50 hover:text-sky-400/80 border border-sky-400/20 hover:border-sky-400/45 px-4 py-2.5 uppercase transition-all disabled:opacity-40">
                            {creatingPortalCliente[lead.id] ? 'A criar...' : '+ Criar Portal Cliente'}
                          </button>
                        )}
                        <button onClick={() => copyLink(lead.page_token!)}
                          className="text-[12px] tracking-[0.25em] text-white/35 hover:text-white/60 border border-white/[0.10] hover:border-white/20 px-4 py-2.5 uppercase transition-all">
                          {copiedId === lead.page_token ? '✓ Copiado' : 'Copiar Link'}
                        </button>
                        <button onClick={() => { const tipo = lead.reuniao_tipo || 'Presencial'; setPortalForm({ reuniao_data: lead.reuniao_data || '', reuniao_hora: lead.reuniao_hora || '', reuniao_tipo: tipo, reuniao_link: lead.reuniao_link || (tipo === 'Videochamada' ? MEET_LINK : MAPS_LINK) }); setPortalFormId(portalFormId === lead.id ? null : lead.id) }}
                          className="text-[12px] tracking-[0.25em] text-white/35 hover:text-white/60 border border-white/[0.10] hover:border-white/20 px-4 py-2.5 uppercase transition-all">
                          Editar Reunião
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setPortalForm({ reuniao_data: '', reuniao_hora: '', reuniao_tipo: 'Presencial', reuniao_link: MAPS_LINK }); setPortalFormId(portalFormId === lead.id ? null : lead.id) }}
                      className="text-[12px] tracking-[0.25em] text-white/40 hover:text-white/65 border border-white/[0.10] hover:border-white/25 px-5 py-3 uppercase transition-all">
                      + Criar Portal de Reunião
                    </button>
                  )}

                  {portalFormId === lead.id && (
                    <div className="mt-5 border border-white/[0.09] bg-white/[0.02] p-5 flex flex-col gap-5">
                      <p className="text-[11px] tracking-[0.4em] text-white/35 uppercase">{lead.page_token ? 'Atualizar Reunião' : 'Dados da Reunião'}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div><label className={labelCls + ' mb-2 block'}>Data</label><input type="date" value={portalForm.reuniao_data} onChange={e => setPortalForm(f => ({ ...f, reuniao_data: e.target.value }))} className={inputCls} /></div>
                        <div><label className={labelCls + ' mb-2 block'}>Hora</label><input type="time" value={portalForm.reuniao_hora} onChange={e => setPortalForm(f => ({ ...f, reuniao_hora: e.target.value }))} className={inputCls} /></div>
                      </div>
                      <div>
                        <label className={labelCls + ' mb-2 block'}>Modo</label>
                        <div className="flex gap-3">
                          {['Presencial', 'Videochamada'].map(tipo => (
                            <button key={tipo} onClick={() => setPortalForm(f => ({ ...f, reuniao_tipo: tipo, reuniao_link: tipo === 'Videochamada' ? MEET_LINK : MAPS_LINK }))}
                              className={`flex-1 py-3 text-[12px] tracking-[0.2em] uppercase border transition-all ${portalForm.reuniao_tipo === tipo ? 'border-white/30 text-white/70 bg-white/[0.05]' : 'border-white/[0.09] text-white/30 hover:border-white/20'}`}>
                              {tipo}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div><label className={labelCls + ' mb-2 block'}>{portalForm.reuniao_tipo === 'Videochamada' ? 'Link Google Meet' : 'Link Google Maps'}</label><input type="url" value={portalForm.reuniao_link} placeholder="https://..." onChange={e => setPortalForm(f => ({ ...f, reuniao_link: e.target.value }))} className={inputCls} /></div>
                      <div className="flex items-center gap-3 pt-1">
                        <button onClick={() => criarPortal(lead)} disabled={creatingPortal}
                          className="flex-1 py-3 border border-white/25 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/35 text-[12px] tracking-[0.35em] text-white/60 hover:text-white/80 uppercase transition-all disabled:opacity-30">
                          {creatingPortal ? 'A criar...' : lead.page_token ? '✓ Atualizar' : '✓ Criar Portal'}
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
    </div>
  )
}
