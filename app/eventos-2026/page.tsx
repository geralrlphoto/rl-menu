'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Evento = {
  id: string
  referencia: string
  cliente: string
  data_evento: string
  local: string
  tipo_evento: string[]
  tipo_servico: string[]
  servico_extra: string[]
  status: string
  fotografo: string[]
  videografo: string[]
  valor_liquido: number | null
  valor_foto: number | null
  valor_video: number | null
  data_entrega: string | null
  fotos_enviadas: boolean
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MESES_FULL = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function daysUntil(d: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const event = new Date(d + 'T00:00:00')
  return Math.round((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const tipoColor: Record<string, string> = {
  'CASAMENTO': 'bg-gold/15 text-gold border-gold/30',
  'BATIZADO': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'ANIVERSÁRIO': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'SESSÃO FOTO': 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  'CORPORATIVO': 'bg-gray-500/15 text-gray-400 border-gray-500/30',
}

function formatDate(d: string) {
  if (!d) return '—'
  const dt = new Date(d + 'T00:00:00')
  return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()]}`
}

function getDayOfWeek(d: string) {
  if (!d) return ''
  const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
  return days[new Date(d + 'T00:00:00').getDay()]
}

function groupByMonth(events: Evento[]) {
  const groups: Record<string, Evento[]> = {}
  events.forEach(e => {
    if (!e.data_evento) return
    const key = e.data_evento.slice(0, 7)
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  })
  return groups
}

export default function Eventos2026() {
  const [events, setEvents] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('Todos')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault(); e.stopPropagation()
    if (!confirm('Eliminar este evento? Esta ação não pode ser desfeita.')) return
    setDeletingId(id)
    await fetch(`/api/eventos-notion/${id}`, { method: 'DELETE' })
    setEvents(prev => prev.filter(ev => ev.id !== id))
    setDeletingId(null)
  }

  useEffect(() => {
    fetch('/api/eventos-notion')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error)
        else setEvents(d.events ?? [])
        setLoading(false)
      })
      .catch(() => { setError('Erro de ligação'); setLoading(false) })
  }, [])

  const filtered = events.filter(e => {
    const matchSearch = !search ||
      e.cliente?.toLowerCase().includes(search.toLowerCase()) ||
      e.local?.toLowerCase().includes(search.toLowerCase()) ||
      e.referencia?.toLowerCase().includes(search.toLowerCase())
    const matchTipo = tipoFilter === 'Todos' || e.tipo_evento?.includes(tipoFilter)
    return matchSearch && matchTipo
  })

  const grouped = groupByMonth(filtered)
  const totalValor = events.reduce((s, e) => s + (e.valor_liquido ?? 0), 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcoming = events
    .filter(e => e.data_evento && new Date(e.data_evento + 'T00:00:00') >= today)
    .slice(0, 3)

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[1200px] mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <Link href="/" className="text-xs tracking-[0.3em] text-white/20 hover:text-gold transition-colors uppercase">‹ Menu</Link>
          <h1 className="text-3xl sm:text-5xl font-extralight tracking-[0.15em] sm:tracking-[0.2em] text-white uppercase mt-3">Eventos 2026</h1>
          <p className="text-white/20 text-xs tracking-[0.3em] mt-2 uppercase">{events.length} eventos · {totalValor.toLocaleString('pt-PT')} € total</p>
        </div>
      </div>

      {/* Próximos eventos */}
      {!loading && !error && upcoming.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {upcoming.map((e, i) => {
            const days = daysUntil(e.data_evento)
            const dt = new Date(e.data_evento + 'T00:00:00')
            const isToday = days === 0
            const isPast = days < 0
            return (
              <Link key={e.id} href={`/eventos-2026/${e.id}`}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] hover:border-gold/30 bg-white/[0.02] hover:bg-white/[0.04] p-5 flex flex-col gap-3 transition-all">
                {/* Dias restantes */}
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-5xl font-bold leading-none tabular-nums ${isToday ? 'text-gold' : isPast ? 'text-white/20' : i === 0 ? 'text-gold' : 'text-white/60'}`}>
                    {isToday ? '0' : Math.abs(days)}
                  </span>
                  <span className={`text-xs tracking-widest uppercase ${isToday ? 'text-gold/60' : 'text-white/25'}`}>
                    {isToday ? 'HOJE' : isPast ? 'dias atrás' : days === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
                {/* Info */}
                <div>
                  <div className="text-white text-sm font-medium truncate">{e.cliente || e.referencia}</div>
                  <div className="text-white/30 text-xs mt-0.5">
                    {String(dt.getDate()).padStart(2,'0')} {MESES_FULL[dt.getMonth()]} · {e.local || '—'}
                  </div>
                </div>
                {/* Tipos */}
                <div className="flex flex-wrap gap-1">
                  {(e.tipo_evento ?? []).map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full border bg-gold/10 border-gold/20 text-gold/60">{t}</span>
                  ))}
                </div>
                {/* Número do evento */}
                {i === 0 && !isToday && (
                  <div className="absolute top-4 right-4 text-[9px] tracking-[0.3em] text-white/15 uppercase">PRÓXIMO</div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-10">
        <input
          type="text"
          placeholder="Pesquisar cliente ou local..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/40 w-full sm:w-72"
        />
        <select
          value={tipoFilter}
          onChange={e => setTipoFilter(e.target.value)}
          className="bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-gold/40"
        >
          {['Todos','CASAMENTO','BATIZADO','ANIVERSÁRIO','SESSÃO FOTO','CORPORATIVO'].map(t => (
            <option key={t} value={t} className="bg-zinc-900">{t}</option>
          ))}
        </select>
        {(search || tipoFilter !== 'Todos') && (
          <button onClick={() => { setSearch(''); setTipoFilter('Todos') }}
            className="px-4 py-2.5 text-xs text-white/30 hover:text-white/60 tracking-widest uppercase transition-colors">
            Limpar
          </button>
        )}
      </div>

      {loading && <div className="text-center py-32 text-white/20 tracking-widest text-xs uppercase">A carregar eventos...</div>}
      {error && <div className="text-center py-20 text-red-400/60 text-sm">{error}<br/><span className="text-white/20 text-xs mt-2 block">Partilha a base de dados EVENTOS 2026 com a integração RL Sync no Notion.</span></div>}

      {!loading && !error && (
        <div className="flex flex-col gap-12">
          {Object.entries(grouped).map(([monthKey, monthEvents]) => {
            const [year, month] = monthKey.split('-')
            const mesNome = MESES[parseInt(month) - 1]

            return (
              <section key={monthKey}>
                {/* Cabeçalho do mês */}
                <div className="flex items-baseline gap-4 mb-5 pt-4">
                  <span className="text-4xl font-bold text-white uppercase">{mesNome}</span>
                  <span className="text-white/20 text-lg">{year}</span>
                  <span className="text-white/15 text-sm">{monthEvents.length} eventos</span>
                  <div className="flex-1 h-px bg-white/8 ml-2" />
                </div>

                {/* Lista de eventos do mês */}
                <div className="flex flex-col gap-2">
                  {monthEvents.map(e => (
                    <Link key={e.id} href={`/eventos-2026/${e.id}`} className="group flex items-center gap-3 sm:gap-5 px-3 sm:px-5 py-3 sm:py-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-gold/20 rounded-xl transition-all cursor-pointer relative">

                      {/* Data */}
                      <div className="w-16 shrink-0 text-center">
                        <div className="text-2xl font-bold text-white leading-none">{new Date(e.data_evento + 'T00:00:00').getDate()}</div>
                        <div className="text-[10px] tracking-widest text-white/30 uppercase mt-0.5">{getDayOfWeek(e.data_evento)}</div>
                      </div>

                      <div className="w-px h-10 bg-white/8 shrink-0" />

                      {/* Cliente */}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm truncate">{e.cliente || e.referencia || '—'}</div>
                        <div className="text-white/30 text-xs truncate mt-0.5">{e.local || '—'}</div>
                      </div>

                      {/* Tipo */}
                      <div className="hidden sm:flex gap-1.5 shrink-0">
                        {(e.tipo_evento ?? []).map(t => (
                          <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full border ${tipoColor[t] ?? 'bg-white/10 text-white/40 border-white/20'}`}>
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Fotógrafo */}
                      {e.fotografo?.length > 0 && (
                        <div className="hidden md:block text-xs text-white/30 shrink-0 max-w-[120px] truncate">
                          {e.fotografo.join(', ')}
                        </div>
                      )}

                      {/* Fotos enviadas */}
                      <div className="shrink-0 hidden sm:block">
                        {e.fotos_enviadas
                          ? <span className="text-[10px] text-green-400/70 tracking-wider">✓ ENTREGUE</span>
                          : <span className="text-[10px] text-white/15 tracking-wider">PENDENTE</span>
                        }
                      </div>

                      {/* Valor */}
                      {e.valor_liquido && (
                        <div className="hidden sm:block text-gold text-sm font-semibold shrink-0 w-20 text-right">
                          {e.valor_liquido.toLocaleString('pt-PT')} €
                        </div>
                      )}

                      {/* Botão eliminar */}
                      <button
                        onClick={ev => handleDelete(ev, e.id)}
                        disabled={deletingId === e.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1.5 rounded-lg hover:bg-red-500/15 text-white/20 hover:text-red-400 shrink-0"
                      >
                        {deletingId === e.id
                          ? <span className="text-[10px] text-white/30">...</span>
                          : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                        }
                      </button>
                    </Link>
                  ))}
                </div>

                {/* Total do mês */}
                <div className="flex justify-end mt-3">
                  <span className="text-xs text-white/20 tracking-widest">
                    Total: <span className="text-white/40 font-medium">
                      {monthEvents.reduce((s, e) => s + (e.valor_liquido ?? 0), 0).toLocaleString('pt-PT')} €
                    </span>
                  </span>
                </div>
              </section>
            )
          })}
        </div>
      )}
    </main>
  )
}
