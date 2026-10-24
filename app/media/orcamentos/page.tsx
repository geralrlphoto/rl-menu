'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FUNDO } from '@/app/media/_lib/estilo'
import OrcamentoForm from './OrcamentoForm'
import {
  COBERTURAS, COR_ESTADO, ESTADOS, ICONE_COBERTURA, LS_KEY,
  diasParaValidade, estiloEstado, fmtData, fmtEur, fmtIntervaloEvento, fmtRange, isExpired, migrate, pill, valorMax,
  type Cobertura, type Estado, type Orcamento,
} from './dados'

/* ─────────────────────────────────────────────────────────────────────────── *
 *  RL PROD · Orçamentos (B2B / Empresas)
 *  Estrutura: Orçamento → 1..3 Propostas → serviços do catálogo fixo.
 *  Dados em localStorage (ver dados.ts).
 * ─────────────────────────────────────────────────────────────────────────── */

type Ordem = 'recentes' | 'validade' | 'valor' | 'evento'
const ORDENS: { id: Ordem; nome: string }[] = [
  { id: 'recentes', nome: 'Mais recentes' },
  { id: 'validade', nome: 'Validade' },
  { id: 'valor',    nome: 'Valor' },
  { id: 'evento',   nome: 'Data do evento' },
]
const AVISO_DIAS = 7 // pendentes que expiram nos próximos N dias

const IcoPdf = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" />
  </svg>
)
const IcoEditar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.4-9.4a2 2 0 112.8 2.8L11.8 15H9v-2.8l8.6-8.6z" />
  </svg>
)
const IcoApagar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 002 2h8a2 2 0 002-2l1-12M9 7V4h6v3" />
  </svg>
)
const IcoCalendario = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
)

const BTN_ICONE = 'w-9 h-9 rounded-full border border-white/[0.12] text-white/55 hover:text-white hover:border-[#2e6cf6] hover:bg-[#2e6cf6]/[0.1] transition-colors flex items-center justify-center'

export default function OrcamentosPage() {
  const [hydrated, setHydrated]     = useState(false)
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [search, setSearch]         = useState('')
  const [filter, setFilter]         = useState<'Todos' | Estado>('Todos')
  const [coberturaFilter, setCoberturaFilter] = useState<'Todas' | Cobertura>('Todas')
  const [ordem, setOrdem]           = useState<Ordem>('recentes')
  const [showForm, setShowForm]     = useState(false)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      const list = raw ? migrate(JSON.parse(raw)) : []
      setOrcamentos(list.map(o =>
        o.estado === 'Pendente' && isExpired(o) ? { ...o, estado: 'Expirado' as Estado } : o
      ))
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem(LS_KEY, JSON.stringify(orcamentos)) } catch { /* ignore */ }
  }, [orcamentos, hydrated])

  /* ─── Estatísticas (só com os dados já guardados) ─── */
  const stats = useMemo(() => {
    const porEstado = Object.fromEntries(ESTADOS.map(e => [e, orcamentos.filter(o => o.estado === e)])) as Record<Estado, Orcamento[]>
    const soma = (l: Orcamento[]) => l.reduce((s, o) => s + valorMax(o), 0)
    const comValor = orcamentos.filter(o => valorMax(o) > 0)
    const decididos = porEstado.Aprovado.length + porEstado.Rejeitado.length + porEstado.Expirado.length
    const aExpirar = porEstado.Pendente
      .map(o => ({ o, dias: diasParaValidade(o) }))
      .filter((x): x is { o: Orcamento; dias: number } => x.dias !== null && x.dias >= 0 && x.dias <= AVISO_DIAS)
      .sort((a, b) => a.dias - b.dias)
    return {
      porEstado,
      total: orcamentos.length,
      volumeTotal: soma(orcamentos),
      emAberto: soma(porEstado.Pendente),
      aprovado: soma(porEstado.Aprovado),
      medio: comValor.length ? soma(comValor) / comValor.length : 0,
      taxa: decididos ? Math.round((porEstado.Aprovado.length / decididos) * 100) : null,
      decididos,
      aExpirar,
    }
  }, [orcamentos])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const evento = (o: Orcamento) => o.data_inicio || o.data_fim || '9999-12-31'
    return orcamentos
      .filter(o => filter === 'Todos' || o.estado === filter)
      .filter(o => coberturaFilter === 'Todas' || o.cobertura === coberturaFilter)
      .filter(o => !q || `${o.cliente} ${o.contacto ?? ''} ${o.email ?? ''} ${o.cobertura ?? ''} ${o.resumo ?? ''} ${o.notas ?? ''} ${o.propostas.map(p => p.titulo + ' ' + (p.descricao ?? '') + ' ' + p.servicos.map(s => s.nome).join(' ')).join(' ')}`.toLowerCase().includes(q))
      .sort((a, b) => {
        if (ordem === 'valor')    return valorMax(b) - valorMax(a)
        if (ordem === 'validade') return (a.validade || '9999-12-31').localeCompare(b.validade || '9999-12-31')
        if (ordem === 'evento')   return evento(a).localeCompare(evento(b))
        return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      })
  }, [orcamentos, search, filter, coberturaFilter, ordem])

  const filtrado = filtered.length !== orcamentos.length
  const somaFiltrada = filtered.reduce((s, o) => s + valorMax(o), 0)

  function upsert(o: Orcamento) {
    setOrcamentos(prev => {
      const ix = prev.findIndex(x => x.id === o.id)
      if (ix === -1) return [o, ...prev]
      const next = prev.slice(); next[ix] = o; return next
    })
  }
  function remove(id: string) {
    if (!confirm('Eliminar este orçamento?')) return
    setOrcamentos(prev => prev.filter(o => o.id !== id))
  }
  function changeEstado(id: string, estado: Estado) {
    setOrcamentos(prev => prev.map(o => o.id === id ? { ...o, estado } : o))
  }
  function novo() { setEditingId(null); setShowForm(true) }
  function editar(id: string) { setEditingId(id); setShowForm(true) }
  function limparFiltros() { setSearch(''); setFilter('Todos'); setCoberturaFilter('Todas') }

  const editing = editingId ? orcamentos.find(o => o.id === editingId) ?? null : null
  const kpi = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/70 px-5 py-4'

  return (
    <main className="rlp min-h-screen relative text-white">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-8 pb-16">
        <Link href="/media" className="text-[12px] text-white/45 hover:text-white transition-colors">‹ RL Prod</Link>

        {/* ── Cabeçalho ───────────────────────────────────────────────── */}
        <header className="mt-8 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <p className="rlp-m traco text-[11px] text-[#5a8bff]">Orçamentos · Empresas</p>
            <h1 className="rlp-t mt-4 text-[48px] sm:text-[68px] leading-[0.95]">
              Cada proposta,<br /><span className="text-[#5a8bff]">num só sítio.</span>
            </h1>
            <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-white/60">
              Orçamentos para clientes corporate a partir do catálogo de serviços RL PROD. Até 3 alternativas por orçamento, com PDF pronto a enviar.
            </p>
          </div>
          <button onClick={novo}
            className="rlp-t self-start lg:self-auto inline-flex items-center gap-3 rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-7 py-3.5 text-[18px] tracking-[0.06em] text-white transition-colors"
            style={{ boxShadow: '0 10px 30px -10px rgba(46,108,246,0.7)' }}>
            <span aria-hidden className="text-[22px] leading-none">+</span> Novo orçamento
          </button>
        </header>

        {/* ── Estatísticas ────────────────────────────────────────────── */}
        <section className="mt-12">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff] mb-4">Estatísticas</p>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className={`${kpi} col-span-2 lg:col-span-1`}>
              <p className="rlp-m text-[9.5px] text-white/45">Total em orçamentos</p>
              <p className="rlp-t mt-2 text-[34px] leading-none tabular-nums">{fmtEur(stats.volumeTotal)}</p>
              <p className="mt-2 text-[12px] text-white/40">{stats.total} orçamento{stats.total === 1 ? '' : 's'} · valor máx. de cada</p>
            </div>
            <div className={kpi}>
              <p className="rlp-m text-[9.5px] text-white/45">Em aberto</p>
              <p className="rlp-t mt-2 text-[34px] leading-none tabular-nums text-[#5a8bff]">{fmtEur(stats.emAberto)}</p>
              <p className="mt-2 text-[12px] text-white/40">{stats.porEstado.Pendente.length} pendente{stats.porEstado.Pendente.length === 1 ? '' : 's'}</p>
            </div>
            <div className={kpi}>
              <p className="rlp-m text-[9.5px] text-white/45">Aprovado</p>
              <p className="rlp-t mt-2 text-[34px] leading-none tabular-nums">{fmtEur(stats.aprovado)}</p>
              <p className="mt-2 text-[12px] text-white/40">{stats.porEstado.Aprovado.length} aprovado{stats.porEstado.Aprovado.length === 1 ? '' : 's'}</p>
            </div>
            <div className={kpi}>
              <p className="rlp-m text-[9.5px] text-white/45">Valor médio</p>
              <p className="rlp-t mt-2 text-[34px] leading-none tabular-nums">{fmtEur(stats.medio)}</p>
              <p className="mt-2 text-[12px] text-white/40">por orçamento</p>
            </div>
            <div className={kpi}>
              <p className="rlp-m text-[9.5px] text-white/45">Taxa de aceitação</p>
              <p className="rlp-t mt-2 text-[34px] leading-none tabular-nums text-[#a9c1ff]">{stats.taxa === null ? 'n/d' : `${stats.taxa}%`}</p>
              <p className="mt-2 text-[12px] text-white/40">{stats.decididos ? `de ${stats.decididos} com resposta` : 'sem respostas ainda'}</p>
            </div>
          </div>

          {/* Distribuição por estado */}
          {stats.total > 0 && (
            <div className="mt-3 rounded-2xl border border-white/[0.1] bg-[#00141f]/70 px-5 py-4">
              <div className="flex h-2 rounded-full overflow-hidden bg-white/[0.06]">
                {ESTADOS.map(e => {
                  const n = stats.porEstado[e].length
                  return n ? <div key={e} title={`${e}: ${n}`} style={{ width: `${(n / stats.total) * 100}%`, background: COR_ESTADO[e] }} /> : null
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                {ESTADOS.map(e => (
                  <button key={e} onClick={() => setFilter(filter === e ? 'Todos' : e)}
                    className={`flex items-center gap-2 text-[12.5px] transition-colors ${filter === e ? 'text-white' : 'text-white/55 hover:text-white'}`}>
                    <span className="w-2 h-2 rounded-full" style={{ background: COR_ESTADO[e] }} />
                    {e} <span className="text-white/90 font-medium tabular-nums">{stats.porEstado[e].length}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Aviso: pendentes a expirar */}
          {stats.aExpirar.length > 0 && (
            <div className="mt-3 rounded-2xl border border-[#ff4747]/40 bg-[#ff4747]/[0.06] px-5 py-4">
              <p className="rlp-m text-[9.5px] text-[#ff8a8a]">
                {stats.aExpirar.length} pendente{stats.aExpirar.length === 1 ? '' : 's'} a expirar nos próximos {AVISO_DIAS} dias
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {stats.aExpirar.map(({ o, dias }) => (
                  <button key={o.id} onClick={() => setExpandedId(o.id)}
                    className="rounded-full border border-[#ff4747]/40 px-3.5 py-1.5 text-[12.5px] text-white/85 hover:text-white hover:border-[#ff4747] transition-colors">
                    {o.cliente} <span className="text-[#ff8a8a]">· {dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `${dias} dias`}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Filtros ─────────────────────────────────────────────────── */}
        <section className="mt-12">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/35">
                <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
              </svg>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Procurar empresa, contacto, serviço…"
                className="w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 pl-11 pr-10 py-3 text-[14.5px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6]" />
              {search && (
                <button onClick={() => setSearch('')} aria-label="Limpar pesquisa"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full text-white/45 hover:text-white">✕</button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="rlp-m text-[9.5px] text-white/40">Ordenar</span>
              <select value={ordem} onChange={e => setOrdem(e.target.value as Ordem)}
                className="rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#2e6cf6] cursor-pointer [color-scheme:dark]">
                {ORDENS.map(o => <option key={o.id} value={o.id} className="bg-[#00141f] text-white">{o.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rlp-m text-[9.5px] text-white/40 mr-1 w-[86px]">Estado</span>
            {(['Todos', ...ESTADOS] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} className={pill(filter === f)}>
                {f} <span className={filter === f ? 'text-white/75' : 'text-white/35'}>
                  {f === 'Todos' ? stats.total : stats.porEstado[f].length}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rlp-m text-[9.5px] text-white/40 mr-1 w-[86px]">Cobertura</span>
            {(['Todas', ...COBERTURAS] as const).map(c => (
              <button key={c} onClick={() => setCoberturaFilter(c)} className={pill(coberturaFilter === c)}>
                {c !== 'Todas' && <span className="mr-1.5">{ICONE_COBERTURA[c]}</span>}{c}
              </button>
            ))}
          </div>

          {filtrado && orcamentos.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[12.5px] text-white/50">
              <span>
                A mostrar <span className="text-white">{filtered.length}</span> de {orcamentos.length} · <span className="text-white tabular-nums">{fmtEur(somaFiltrada)}</span>
              </span>
              <button onClick={limparFiltros} className="text-[#5a8bff] hover:text-[#a9c1ff] transition-colors">Limpar filtros</button>
            </div>
          )}
        </section>

        {/* ── Lista ───────────────────────────────────────────────────── */}
        <section className="mt-6">
          {!hydrated ? (
            <p className="rlp-m text-[10px] text-white/40 py-10 text-center">A carregar…</p>
          ) : filtered.length === 0 ? (
            <EmptyState onCreate={novo} onClear={limparFiltros} hasAny={orcamentos.length > 0} />
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map(o => {
                const aberto = expandedId === o.id
                const dias = o.estado === 'Pendente' ? diasParaValidade(o) : null
                const urgente = dias !== null && dias >= 0 && dias <= AVISO_DIAS
                return (
                  <div key={o.id}
                    className={`rounded-2xl overflow-hidden border bg-[#00141f]/75 transition-colors ${aberto ? 'border-[#2e6cf6]/60' : 'border-white/[0.1] hover:border-white/25'}`}>

                    {/* Linha */}
                    <div className="grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)_minmax(0,1fr)_auto] gap-x-5 gap-y-3 items-center px-5 sm:px-6 py-5 cursor-pointer"
                      onClick={() => setExpandedId(aberto ? null : o.id)}>

                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="rlp-t text-[21px] leading-tight truncate">{o.cliente}</p>
                          {o.cobertura && (
                            <span className="inline-flex items-center gap-1.5 text-[11.5px] text-[#a9c1ff] px-2.5 py-0.5 rounded-full border border-[#5a8bff]/30 bg-[#2e6cf6]/[0.08]">
                              <span>{ICONE_COBERTURA[o.cobertura]}</span>{o.cobertura}
                            </span>
                          )}
                        </div>
                        {(o.contacto || o.email) && (
                          <p className="text-[12.5px] text-white/45 truncate mt-1">{[o.contacto, o.email].filter(Boolean).join(' · ')}</p>
                        )}
                        {(o.data_inicio || o.data_fim) && (
                          <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] text-[#5a8bff]">
                            <IcoCalendario /> {fmtIntervaloEvento(o.data_inicio, o.data_fim)}
                          </p>
                        )}
                      </div>

                      <div className="md:text-right order-3 md:order-none">
                        <p className="rlp-t text-[22px] leading-none tabular-nums">{fmtRange(o.propostas)}</p>
                        <p className="rlp-m text-[9px] text-white/40 mt-1.5">
                          {o.propostas.length} proposta{o.propostas.length === 1 ? '' : 's'}
                        </p>
                      </div>

                      <div className="order-4 md:order-none">
                        <p className="rlp-m text-[9px] text-white/40">Validade</p>
                        <p className={`mt-1 text-[13px] ${urgente ? 'text-[#ff8a8a]' : 'text-white/70'}`}>
                          {fmtData(o.validade)}
                          {urgente && <span className="ml-1.5">· {dias === 0 ? 'hoje' : `${dias} d`}</span>}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 justify-end order-2 md:order-none" onClick={e => e.stopPropagation()}>
                        <select value={o.estado} onChange={e => changeEstado(o.id, e.target.value as Estado)}
                          aria-label="Estado"
                          className="rlp-m appearance-none text-[9.5px] px-3.5 py-2 rounded-full border cursor-pointer focus:outline-none [color-scheme:dark]"
                          style={estiloEstado(o.estado)}>
                          {ESTADOS.map(s => <option key={s} value={s} className="bg-[#00141f] text-white">{s}</option>)}
                        </select>
                        <a href={`/media/orcamentos/${o.id}/pdf`} target="_blank" rel="noopener noreferrer"
                          title="Exportar PDF" className={`${BTN_ICONE} hidden sm:flex`}><IcoPdf /></a>
                        <span className={`hidden sm:inline-block text-white/35 transition-transform ${aberto ? 'rotate-180' : ''}`}>▾</span>
                      </div>
                    </div>

                    {/* Detalhe */}
                    {aberto && (
                      <div className="border-t border-white/[0.08] bg-[#0c2236]/60 px-5 sm:px-6 py-5">
                        {o.resumo && (
                          <div className="mb-5 max-w-3xl">
                            <p className="rlp-m text-[9.5px] text-[#5a8bff] mb-1.5">Resumo do serviço</p>
                            <p className="text-[14px] text-white/75 leading-relaxed whitespace-pre-wrap">{o.resumo}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {o.propostas.map((p, i) => (
                            <div key={p.id} className="rounded-xl border border-white/[0.1] bg-[#00141f]/70 p-4">
                              <div className="flex items-baseline justify-between gap-3 mb-2">
                                <p className="rlp-m text-[9.5px] text-white/45">Proposta {i + 1}</p>
                                <p className="rlp-t text-[20px] tabular-nums">{fmtEur(p.valor)}</p>
                              </div>
                              <p className="text-[14.5px] text-white font-medium mb-3">{p.titulo}</p>
                              {p.servicos.length > 0 && (
                                <ul className="space-y-1.5 mb-2">
                                  {p.servicos.map(s => (
                                    <li key={s.catalogId} className="text-[12.5px] text-white/60 flex items-start gap-2">
                                      <span className="text-[#5a8bff] leading-tight">●</span>
                                      <span>{s.nome}{s.duracao ? ` · ${s.duracao}` : ''}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {p.descricao && <p className="text-[12px] text-white/45 leading-relaxed whitespace-pre-wrap italic">{p.descricao}</p>}
                            </div>
                          ))}
                        </div>

                        {o.notas && (
                          <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#00141f]/50 p-4">
                            <p className="rlp-m text-[9.5px] text-white/45 mb-1.5">Notas internas</p>
                            <p className="text-[13px] text-white/65 leading-relaxed whitespace-pre-wrap">{o.notas}</p>
                          </div>
                        )}

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          <a href={`/media/orcamentos/${o.id}/pdf`} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-5 py-2.5 text-[13.5px] text-white transition-colors">
                            <IcoPdf /> Exportar PDF
                          </a>
                          <button onClick={() => editar(o.id)}
                            className="inline-flex items-center gap-2 rounded-md border border-white/25 hover:border-white/50 px-5 py-2.5 text-[13.5px] text-white/85 hover:text-white transition-colors">
                            <IcoEditar /> Editar
                          </button>
                          <button onClick={() => remove(o.id)} title="Eliminar"
                            className={`${BTN_ICONE} ml-auto hover:!text-[#ff4747] hover:!border-[#ff4747]/60 hover:!bg-[#ff4747]/[0.08]`}>
                            <IcoApagar />
                          </button>
                          <span className="w-full text-[11.5px] text-white/30 mt-1">Criado a {fmtData(o.criado_em)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <p className="rlp-m mt-10 text-[9px] text-white/25 text-center">Dados guardados localmente neste browser</p>
      </div>

      {showForm && (
        <OrcamentoForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditingId(null) }}
          onSave={o => { upsert(o); setShowForm(false); setEditingId(null); setExpandedId(o.id) }}
        />
      )}
    </main>
  )
}

function EmptyState({ onCreate, onClear, hasAny }: { onCreate: () => void; onClear: () => void; hasAny: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.15] bg-[#00141f]/60 p-12 text-center">
      <p className="rlp-m traco text-[10px] text-[#5a8bff]">{hasAny ? 'Sem resultados' : 'Começar'}</p>
      <h3 className="rlp-t mt-3 text-[30px] leading-tight">
        {hasAny ? 'Nenhum orçamento corresponde aos filtros' : 'Ainda não há orçamentos'}
      </h3>
      <p className="mt-2 text-[14px] text-white/50 max-w-md mx-auto leading-relaxed">
        {hasAny
          ? 'Ajusta a pesquisa, o estado ou a cobertura.'
          : 'Cria o primeiro orçamento corporate. Fica tudo guardado e organizado num só lugar.'}
      </p>
      <div className="mt-6">
        {hasAny ? (
          <button onClick={onClear} className="rounded-md border border-white/25 hover:border-white/50 px-6 py-3 text-[14px] transition-colors">
            Limpar filtros
          </button>
        ) : (
          <button onClick={onCreate}
            className="rlp-t inline-flex items-center gap-3 rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-7 py-3.5 text-[18px] tracking-[0.06em] text-white transition-colors">
            <span aria-hidden className="text-[22px] leading-none">+</span> Novo orçamento
          </button>
        )}
      </div>
    </div>
  )
}
