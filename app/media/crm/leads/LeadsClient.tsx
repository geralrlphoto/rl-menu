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
