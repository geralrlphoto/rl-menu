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

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://rl-menu-lake.vercel.app'

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

  // ── Propostas: guardar ────────────────────────────────────────────────────
  async function saveProposta(lead: Lead, idx: number) {
    if (!lead.page_token) return
    const key = `${lead.id}_${idx}`
    setSavingProposta(s => ({ ...s, [key]: true }))
    const content  = { ...(contentCache[lead.id] || {}), propostas: propostas[lead.id] }
    await fetch('/api/media-portal/save-content', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token: lead.page_token, page_content: content }),
    })
    setContentCache(c => ({ ...c, [lead.id]: content }))
    setSavingProposta(s => ({ ...s, [key]: false }))
    setSavedProposta(s => ({ ...s, [key]: true }))
    setTimeout(() => setSavedProposta(s => ({ ...s, [key]: false })), 2000)
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

  const labelCls = "text-[8px] tracking-[0.4em] text-white/20 uppercase"
  const inputCls = "w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/20 focus:outline-none px-3 py-2 text-[11px] text-white/60 placeholder:text-white/15 transition-colors [color-scheme:dark]"

  return (
    <div>
      {/* Filtro */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {['Todos', ...ESTADOS].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)}
            className={`text-[8px] tracking-[0.35em] uppercase px-3 py-1.5 border transition-all duration-200 ${
              filtroEstado === e ? 'border-white/30 text-white/60 bg-white/[0.06]' : 'border-white/[0.07] text-white/20 hover:border-white/20 hover:text-white/40'
            }`}>
            {e}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {filtered.map(lead => (
          <div key={lead.id} className="border border-white/[0.07] hover:border-white/14 bg-white/[0.02] transition-all duration-300">

            {/* Row */}
            <div className="flex items-center gap-4 px-5 py-4 cursor-pointer"
              onClick={() => {
                const next = expanded === lead.id ? null : lead.id
                setExpanded(next)
                if (next) loadContent(lead)
              }}>
              <span className={`shrink-0 text-[8px] tracking-[0.3em] uppercase px-2 py-1 border ${estadoColors[lead.estado] ?? 'border-white/10 text-white/25'}`}>
                {lead.estado}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className="text-[12px] tracking-[0.15em] text-white/70 font-medium truncate">{lead.nome}</p>
                  {lead.empresa && <p className="text-[10px] text-white/30 truncate hidden sm:block">{lead.empresa}</p>}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {lead.tipo && <span className="text-[8px] tracking-[0.2em] text-white/20 uppercase">{lead.tipo}</span>}
                  {lead.fonte && (<><span className="text-white/10">·</span><span className="text-[8px] tracking-[0.2em] text-white/20 uppercase">{lead.fonte}</span></>)}
                  {lead.page_token && (<><span className="text-white/10">·</span><span className="text-[8px] tracking-[0.2em] text-emerald-400/40 uppercase">Portal Ativo</span></>)}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[9px] text-white/20 font-mono">{formatDate(lead.created_at)}</p>
                <p className="text-[8px] text-white/12 mt-1">{expanded === lead.id ? '▲' : '▼'}</p>
              </div>
            </div>

            {/* Detalhe */}
            {expanded === lead.id && (
              <div className="border-t border-white/[0.05] px-5 py-5 flex flex-col gap-5">

                {/* Contacto */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {lead.email && (<div><p className={labelCls}>Email</p><a href={`mailto:${lead.email}`} className="text-[11px] text-white/50 hover:text-white/75 transition-colors mt-1 block">{lead.email}</a></div>)}
                  {lead.telefone && (<div><p className={labelCls}>Telefone</p><a href={`tel:${lead.telefone}`} className="text-[11px] text-white/50 hover:text-white/75 transition-colors mt-1 block">{lead.telefone}</a></div>)}
                  {lead.tipo && (<div><p className={labelCls}>Serviço</p><p className="text-[11px] text-white/50 mt-1">{lead.tipo}</p></div>)}
                  {lead.fonte && (<div><p className={labelCls}>Origem</p><p className="text-[11px] text-white/50 mt-1">{lead.fonte}</p></div>)}
                </div>

                {/* Mensagem */}
                {lead.mensagem && (
                  <div>
                    <p className={labelCls + ' mb-2'}>Mensagem</p>
                    <p className="text-[12px] text-white/40 leading-relaxed bg-white/[0.02] border border-white/[0.05] px-4 py-3">{lead.mensagem}</p>
                  </div>
                )}

                {/* Estado */}
                <div>
                  <p className={labelCls + ' mb-2'}>Atualizar Estado</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {ESTADOS.map(e => (
                      <button key={e} disabled={lead.estado === e || updatingId === lead.id} onClick={() => updateEstado(lead.id, e)}
                        className={`text-[8px] tracking-[0.3em] uppercase px-3 py-1.5 border transition-all duration-200 ${lead.estado === e ? `${estadoColors[e]} cursor-default` : 'border-white/[0.07] text-white/20 hover:border-white/20 hover:text-white/45 disabled:opacity-30'}`}>
                        {e}
                      </button>
                    ))}
                    {updatingId === lead.id && <span className="text-[8px] text-white/20 tracking-widest">A guardar...</span>}
                  </div>
                </div>

                {/* ── PROPOSTAS CRIATIVAS ── */}
                {lead.page_token && (
                  <div className="border-t border-white/[0.04] pt-4">
                    <p className={labelCls + ' mb-3'}>Propostas Criativas</p>

                    {propostasLoading[lead.id] ? (
                      <p className="text-[9px] text-white/20 tracking-widest animate-pulse">A carregar...</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {(propostas[lead.id] || DEFAULT_PROPOSTAS).map((prop, idx) => {
                          const isOpen = propostaOpen[lead.id] === idx
                          const key      = `${lead.id}_${idx}`
                          const isSaving = savingProposta[key]
                          const isSaved  = savedProposta[key]

                          return (
                            <div key={idx} className="border border-white/[0.07] bg-white/[0.01]">

                              {/* Cabeçalho accordeão */}
                              <button
                                className="w-full flex items-center justify-between px-4 py-3 text-left"
                                onClick={() => setPropostaOpen(s => ({ ...s, [lead.id]: isOpen ? null : idx }))}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-[9px] tracking-[0.45em] text-white/55 uppercase font-medium">{prop.titulo}</span>
                                  {prop.servicos.length > 0 && (
                                    <span className="text-[8px] text-white/25 tracking-wide">{prop.servicos.length} serviço{prop.servicos.length !== 1 ? 's' : ''}</span>
                                  )}
                                  {prop.valor && (
                                    <span className="text-[9px] text-emerald-400/50 font-mono">{prop.valor}</span>
                                  )}
                                </div>
                                <span className="text-[9px] text-white/20">{isOpen ? '▲' : '▼'}</span>
                              </button>

                              {/* Corpo */}
                              {isOpen && (
                                <div className="border-t border-white/[0.05] px-4 py-4 flex flex-col gap-5">

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
                                            className={`text-[9px] tracking-[0.25em] uppercase px-3 py-1.5 border transition-all duration-150 ${
                                              active
                                                ? 'border-white/40 text-white/80 bg-white/[0.08]'
                                                : 'border-white/[0.08] text-white/25 hover:border-white/20 hover:text-white/45'
                                            }`}
                                          >
                                            {active && <span className="mr-1.5 text-emerald-400/70">✓</span>}
                                            {s}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>

                                  {/* Valor */}
                                  <div>
                                    <p className={labelCls + ' mb-1.5'}>Valor / Investimento</p>
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
                                    className={`w-full py-2.5 text-[9px] tracking-[0.45em] uppercase transition-all border disabled:opacity-40 ${
                                      isSaved
                                        ? 'border-emerald-400/40 text-emerald-400/60 bg-emerald-400/[0.04]'
                                        : 'border-white/15 hover:border-white/30 text-white/40 hover:text-white/65 bg-white/[0.02] hover:bg-white/[0.05]'
                                    }`}>
                                    {isSaved ? '✓ Guardado' : isSaving ? 'A guardar...' : `✓ Guardar ${prop.titulo}`}
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
                <div className="border-t border-white/[0.04] pt-4">
                  <p className={labelCls + ' mb-3'}>Portal de Reunião</p>
                  {lead.page_token ? (
                    <div className="flex flex-col gap-3">
                      {(lead.reuniao_data || lead.reuniao_hora || lead.reuniao_tipo) && (
                        <div className="flex items-center gap-4 flex-wrap text-[10px] text-white/30 font-mono">
                          {lead.reuniao_data && <span>{lead.reuniao_data}</span>}
                          {lead.reuniao_hora && <span>{lead.reuniao_hora.slice(0,5)}</span>}
                          {lead.reuniao_tipo && <span>{lead.reuniao_tipo}</span>}
                          {lead.page_confirmacao === 'confirmada' && <span className="text-emerald-400/50">✓ Confirmada</span>}
                          {lead.page_confirmacao === 'alteracao_pedida' && <span className="text-amber-400/50">⏳ Alteração pedida</span>}
                          {lead.page_views ? <span className="text-white/15">{lead.page_views} visualizações</span> : null}
                        </div>
                      )}
                      <div className="flex items-center gap-2 flex-wrap">
                        <a href={`/rm/${lead.page_token}`} target="_blank" rel="noopener noreferrer"
                          className="text-[9px] tracking-[0.35em] text-white/30 hover:text-white/60 border border-white/[0.07] hover:border-white/20 px-3 py-1.5 uppercase transition-all">
                          Ver Portal →
                        </a>
                        <a href={`/rm/${lead.page_token}/proposta`} target="_blank" rel="noopener noreferrer"
                          className="text-[9px] tracking-[0.35em] text-amber-400/50 hover:text-amber-400/80 border border-amber-400/20 hover:border-amber-400/45 px-3 py-1.5 uppercase transition-all">
                          Editar Proposta ✎
                        </a>
                        <button onClick={() => copyLink(lead.page_token!)}
                          className="text-[9px] tracking-[0.35em] text-white/20 hover:text-white/50 border border-white/[0.07] hover:border-white/15 px-3 py-1.5 uppercase transition-all">
                          {copiedId === lead.page_token ? '✓ Copiado' : 'Copiar Link'}
                        </button>
                        <button onClick={() => { setPortalForm({ reuniao_data: lead.reuniao_data || '', reuniao_hora: lead.reuniao_hora || '', reuniao_tipo: lead.reuniao_tipo || 'Presencial', reuniao_link: lead.reuniao_link || '' }); setPortalFormId(portalFormId === lead.id ? null : lead.id) }}
                          className="text-[9px] tracking-[0.35em] text-white/20 hover:text-white/50 border border-white/[0.07] hover:border-white/15 px-3 py-1.5 uppercase transition-all">
                          Editar Reunião
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setPortalForm({ reuniao_data: '', reuniao_hora: '', reuniao_tipo: 'Presencial', reuniao_link: '' }); setPortalFormId(portalFormId === lead.id ? null : lead.id) }}
                      className="text-[9px] tracking-[0.4em] text-white/30 hover:text-white/60 border border-white/[0.08] hover:border-white/20 px-4 py-2 uppercase transition-all">
                      + Criar Portal de Reunião
                    </button>
                  )}

                  {portalFormId === lead.id && (
                    <div className="mt-4 border border-white/[0.07] bg-white/[0.02] p-4 flex flex-col gap-4">
                      <p className="text-[8px] tracking-[0.5em] text-white/20 uppercase">{lead.page_token ? 'Atualizar Reunião' : 'Dados da Reunião'}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className={labelCls + ' mb-1.5 block'}>Data</label><input type="date" value={portalForm.reuniao_data} onChange={e => setPortalForm(f => ({ ...f, reuniao_data: e.target.value }))} className={inputCls} /></div>
                        <div><label className={labelCls + ' mb-1.5 block'}>Hora</label><input type="time" value={portalForm.reuniao_hora} onChange={e => setPortalForm(f => ({ ...f, reuniao_hora: e.target.value }))} className={inputCls} /></div>
                      </div>
                      <div>
                        <label className={labelCls + ' mb-1.5 block'}>Modo</label>
                        <div className="flex gap-2">
                          {['Presencial', 'Videochamada'].map(tipo => (
                            <button key={tipo} onClick={() => setPortalForm(f => ({ ...f, reuniao_tipo: tipo }))}
                              className={`flex-1 py-2 text-[9px] tracking-[0.3em] uppercase border transition-all ${portalForm.reuniao_tipo === tipo ? 'border-white/25 text-white/60 bg-white/[0.04]' : 'border-white/[0.07] text-white/20 hover:border-white/15'}`}>
                              {tipo}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div><label className={labelCls + ' mb-1.5 block'}>Link</label><input type="url" value={portalForm.reuniao_link} placeholder="https://..." onChange={e => setPortalForm(f => ({ ...f, reuniao_link: e.target.value }))} className={inputCls} /></div>
                      <div className="flex items-center gap-2 pt-1">
                        <button onClick={() => criarPortal(lead)} disabled={creatingPortal}
                          className="flex-1 py-2.5 border border-white/20 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/30 text-[9px] tracking-[0.45em] text-white/50 hover:text-white/70 uppercase transition-all disabled:opacity-30">
                          {creatingPortal ? 'A criar...' : lead.page_token ? '✓ Atualizar' : '✓ Criar Portal'}
                        </button>
                        <button onClick={() => setPortalFormId(null)} className="px-4 py-2.5 border border-white/[0.07] text-[9px] tracking-[0.35em] text-white/20 hover:text-white/40 uppercase transition-all">Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Apagar */}
                <div className="flex justify-end pt-2 border-t border-white/[0.04]">
                  {deletingId === lead.id ? (
                    <span className="text-[8px] text-white/20 tracking-widest">A apagar...</span>
                  ) : (
                    <button onClick={() => { if (confirm(`Apagar lead de ${lead.nome}?`)) deleteLead(lead.id) }}
                      className="text-[8px] tracking-[0.35em] uppercase text-red-400/40 hover:text-red-400/70 transition-colors">
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
