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
}

interface Props {
  leads: Lead[]
  estadoColors: Record<string, string>
}

export default function LeadsClient({ leads: initial, estadoColors }: Props) {
  const [leads, setLeads] = useState(initial)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState('Todos')

  const filtered = filtroEstado === 'Todos' ? leads : leads.filter(l => l.estado === filtroEstado)

  async function updateEstado(id: string, estado: string) {
    setUpdatingId(id)
    await fetch('/api/media-leads', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, estado }),
    })
    setLeads(ls => ls.map(l => l.id === id ? { ...l, estado } : l))
    setUpdatingId(null)
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const labelCls = "text-[8px] tracking-[0.4em] text-white/20 uppercase"

  return (
    <div>
      {/* Filtro por estado */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {['Todos', ...ESTADOS].map(e => (
          <button key={e} onClick={() => setFiltroEstado(e)}
            className={`text-[8px] tracking-[0.35em] uppercase px-3 py-1.5 border transition-all duration-200 ${
              filtroEstado === e
                ? 'border-white/30 text-white/60 bg-white/[0.06]'
                : 'border-white/[0.07] text-white/20 hover:border-white/20 hover:text-white/40'
            }`}>
            {e}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2">
        {filtered.map(lead => (
          <div key={lead.id}
            className="border border-white/[0.07] hover:border-white/14 bg-white/[0.02] transition-all duration-300">

            {/* Row principal */}
            <div className="flex items-center gap-4 px-5 py-4 cursor-pointer"
              onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}>

              {/* Estado badge */}
              <span className={`shrink-0 text-[8px] tracking-[0.3em] uppercase px-2 py-1 border ${estadoColors[lead.estado] ?? 'border-white/10 text-white/25'}`}>
                {lead.estado}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className="text-[12px] tracking-[0.15em] text-white/70 font-medium truncate">{lead.nome}</p>
                  {lead.empresa && <p className="text-[10px] text-white/30 truncate hidden sm:block">{lead.empresa}</p>}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {lead.tipo && <span className="text-[8px] tracking-[0.2em] text-white/20 uppercase">{lead.tipo}</span>}
                  {lead.fonte && (
                    <>
                      <span className="text-white/10">·</span>
                      <span className="text-[8px] tracking-[0.2em] text-white/20 uppercase">{lead.fonte}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Data + expand */}
              <div className="shrink-0 text-right">
                <p className="text-[9px] text-white/20 font-mono">{formatDate(lead.created_at)}</p>
                <p className="text-[8px] text-white/12 mt-1">{expanded === lead.id ? '▲' : '▼'}</p>
              </div>
            </div>

            {/* Detalhe expandido */}
            {expanded === lead.id && (
              <div className="border-t border-white/[0.05] px-5 py-5 flex flex-col gap-5">

                {/* Contacto */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {lead.email && (
                    <div>
                      <p className={labelCls}>Email</p>
                      <a href={`mailto:${lead.email}`} className="text-[11px] text-white/50 hover:text-white/75 transition-colors mt-1 block">{lead.email}</a>
                    </div>
                  )}
                  {lead.telefone && (
                    <div>
                      <p className={labelCls}>Telefone</p>
                      <a href={`tel:${lead.telefone}`} className="text-[11px] text-white/50 hover:text-white/75 transition-colors mt-1 block">{lead.telefone}</a>
                    </div>
                  )}
                  {lead.tipo && (
                    <div>
                      <p className={labelCls}>Serviço</p>
                      <p className="text-[11px] text-white/50 mt-1">{lead.tipo}</p>
                    </div>
                  )}
                  {lead.fonte && (
                    <div>
                      <p className={labelCls}>Origem</p>
                      <p className="text-[11px] text-white/50 mt-1">{lead.fonte}</p>
                    </div>
                  )}
                </div>

                {/* Mensagem */}
                {lead.mensagem && (
                  <div>
                    <p className={labelCls + ' mb-2'}>Mensagem</p>
                    <p className="text-[12px] text-white/40 leading-relaxed bg-white/[0.02] border border-white/[0.05] px-4 py-3">
                      {lead.mensagem}
                    </p>
                  </div>
                )}

                {/* Mudar estado */}
                <div>
                  <p className={labelCls + ' mb-2'}>Atualizar Estado</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {ESTADOS.map(e => (
                      <button key={e}
                        disabled={lead.estado === e || updatingId === lead.id}
                        onClick={() => updateEstado(lead.id, e)}
                        className={`text-[8px] tracking-[0.3em] uppercase px-3 py-1.5 border transition-all duration-200
                          ${lead.estado === e
                            ? `${estadoColors[e]} cursor-default`
                            : 'border-white/[0.07] text-white/20 hover:border-white/20 hover:text-white/45 disabled:opacity-30'
                          }`}>
                        {e}
                      </button>
                    ))}
                    {updatingId === lead.id && (
                      <span className="text-[8px] text-white/20 tracking-widest">A guardar...</span>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
