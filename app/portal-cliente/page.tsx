'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Portal = {
  id: string
  notion_url: string
  nome: string
  tipo_evento: string | null
  status: string | null
  data_casamento: string | null
  local: string | null
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function fmt(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d + 'T00:00:00')
  if (isNaN(dt.getTime())) return '—'
  return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()]} ${dt.getFullYear()}`
}

const STATUS_CLS: Record<string, string> = {
  'Não iniciada': 'bg-red-500/15 border-red-500/30 text-red-400',
  'Em andamento': 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
  'Completa':     'bg-green-500/15 border-green-500/30 text-green-400',
}
const STATUS_DOT: Record<string, string> = {
  'Não iniciada': 'bg-red-400',
  'Em andamento': 'bg-yellow-400',
  'Completa':     'bg-green-400',
}
const TIPO_CLS: Record<string, string> = {
  'Casamento':  'bg-gold/10 border-gold/30 text-gold/80',
  'Batizado':   'bg-blue-500/10 border-blue-500/30 text-blue-400',
  'Corporativo':'bg-purple-500/10 border-purple-500/30 text-purple-400',
}

export default function PortalClientePage() {
  const [portais, setPortais] = useState<Portal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [tipoFilter, setTipoFilter] = useState('Todos')

  useEffect(() => {
    fetch('/api/portais-clientes')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setPortais(d.portais ?? [])
        setLoading(false)
      })
      .catch(() => { setError('Erro ao carregar'); setLoading(false) })
  }, [])

  const filtered = portais.filter(p => {
    const matchSearch = !search ||
      p.nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.local?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'Todos' || p.status === statusFilter
    const matchTipo = tipoFilter === 'Todos' || p.tipo_evento === tipoFilter
    return matchSearch && matchStatus && matchTipo
  })

  const statuses = ['Todos', ...Array.from(new Set(portais.map(p => p.status).filter(Boolean) as string[]))]
  const tipos = ['Todos', ...Array.from(new Set(portais.map(p => p.tipo_evento).filter(Boolean) as string[]))]

  const total = portais.length
  const emAndamento = portais.filter(p => p.status === 'Em andamento').length
  const completos   = portais.filter(p => p.status === 'Completa').length
  const naoIniciados = portais.filter(p => p.status === 'Não iniciada').length

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[1200px] mx-auto">

      <Link href="/" className="inline-flex items-center gap-2 text-xs tracking-widest text-white/40 hover:text-gold transition-colors mb-8">
        ‹ VOLTAR AO MENU
      </Link>

      <header className="mb-8">
        <p className="text-xs tracking-[0.4em] text-white/30 uppercase mb-1">RL PHOTO.VIDEO</p>
        <h1 className="text-2xl sm:text-3xl font-light tracking-widest text-gold uppercase">Portal dos Noivos</h1>
        <div className="mt-3 h-px w-16 bg-gold/40" />
      </header>

      {/* Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total',          value: total,        color: 'text-white/70' },
            { label: 'Em Andamento',   value: emAndamento,  color: 'text-yellow-400' },
            { label: 'Completos',      value: completos,    color: 'text-green-400' },
            { label: 'Não Iniciados',  value: naoIniciados, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl px-4 py-4">
              <span className={`text-2xl font-bold block ${s.color}`}>{s.value}</span>
              <span className="text-[10px] tracking-widest text-white/30 uppercase">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <input
          type="text"
          placeholder="Pesquisar noivos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/40 w-full sm:w-64"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-gold/40">
          {statuses.map(s => <option key={s} value={s} className="bg-zinc-900">{s}</option>)}
        </select>
        <select value={tipoFilter} onChange={e => setTipoFilter(e.target.value)}
          className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-gold/40">
          {tipos.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
        </select>
        {(search || statusFilter !== 'Todos' || tipoFilter !== 'Todos') && (
          <button onClick={() => { setSearch(''); setStatusFilter('Todos'); setTipoFilter('Todos') }}
            className="px-4 py-2.5 text-xs text-white/30 hover:text-white/60 tracking-widest uppercase transition-colors">
            Limpar
          </button>
        )}
      </div>

      {loading && <div className="text-center py-24 text-white/20 text-xs tracking-widest uppercase">A carregar...</div>}
      {error   && <div className="text-center py-24 text-red-400/60 text-sm">{error}</div>}

      {!loading && !error && (
        <>
          <p className="text-xs text-white/20 tracking-wider mb-4">{filtered.length} portal{filtered.length !== 1 ? 'is' : ''}</p>

          {filtered.length === 0 ? (
            <div className="text-center py-24 text-white/15 text-xs tracking-widest uppercase">Sem resultados</div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(p => (
                <div key={p.id} className="bg-white/[0.02] border border-white/[0.07] hover:border-gold/25 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 transition-all flex items-center gap-4">

                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[p.status ?? ''] ?? 'bg-white/20'}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-white tracking-wide truncate mb-1.5">{p.nome ?? '—'}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {p.tipo_evento && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold tracking-wider ${TIPO_CLS[p.tipo_evento] ?? 'bg-white/10 border-white/20 text-white/50'}`}>
                          {p.tipo_evento}
                        </span>
                      )}
                      {p.status && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold tracking-wider ${STATUS_CLS[p.status] ?? 'bg-white/10 border-white/20 text-white/50'}`}>
                          {p.status}
                        </span>
                      )}
                      {p.data_casamento && (
                        <span className="text-[11px] text-white/35 tracking-wider">{fmt(p.data_casamento)}</span>
                      )}
                      {p.local && (
                        <span className="text-[11px] text-white/25 truncate hidden sm:inline">{p.local}</span>
                      )}
                    </div>
                  </div>

                  {/* Abrir portal */}
                  <a href={p.notion_url} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-gold/10 hover:bg-gold/20 border border-gold/30 hover:border-gold/60 rounded-xl text-[11px] sm:text-xs text-gold/80 hover:text-gold tracking-wider uppercase transition-all">
                    <span className="hidden sm:inline">Abrir Portal</span>
                    <span>↗</span>
                  </a>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}
