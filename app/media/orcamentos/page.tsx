'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

/* ─────────────────────────────────────────────────────────────────────────── *
 *  RL PROD · Orçamentos
 *
 *  Persistência local (localStorage) — versão inicial. Quando o fluxo
 *  estiver maduro promovemos para `orcamentos` em Supabase.
 *
 *  Estrutura:
 *    Orçamento (cabeçalho do dossier de proposta) →
 *      tem 1 a 3 Propostas (alternativas que o cliente pode escolher)
 * ─────────────────────────────────────────────────────────────────────────── */

type Estado    = 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Expirado'
type Cobertura = 'Fotografia' | 'Vídeo' | 'Fotografia e Vídeo'

type Proposta = {
  id: string
  titulo: string
  valor: number
  descricao: string | null
}

type Orcamento = {
  id: string
  cliente: string
  cobertura: Cobertura | null
  resumo: string | null
  propostas: Proposta[]          // 1..3
  validade: string | null        // YYYY-MM-DD
  estado: Estado
  notas: string | null
  criado_em: string              // ISO
}

const LS_KEY = 'rl_orcamentos_v1'
const ESTADOS:    Estado[]    = ['Pendente', 'Aprovado', 'Rejeitado', 'Expirado']
const COBERTURAS: Cobertura[] = ['Fotografia', 'Vídeo', 'Fotografia e Vídeo']

const ESTADO_CLS: Record<Estado, string> = {
  Pendente:  'bg-blue-500/10 text-blue-300 border-blue-500/30',
  Aprovado:  'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Rejeitado: 'bg-red-500/10 text-red-300 border-red-500/30',
  Expirado:  'bg-white/[0.04] text-white/40 border-white/[0.08]',
}

const COBERTURA_META: Record<Cobertura, { icon: string; cls: string }> = {
  'Fotografia':          { icon: '◐', cls: 'border-amber-500/30 text-amber-200 bg-amber-500/[0.06]' },
  'Vídeo':               { icon: '▶', cls: 'border-violet-500/30 text-violet-200 bg-violet-500/[0.06]' },
  'Fotografia e Vídeo':  { icon: '◑', cls: 'border-emerald-500/30 text-emerald-200 bg-emerald-500/[0.06]' },
}

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function fmtEur(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0)
}
function fmtData(iso: string | null) {
  if (!iso) return '—'
  try {
    const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'))
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return iso }
}
function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}
function isExpired(o: Orcamento) {
  if (!o.validade) return false
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const v = new Date(o.validade + 'T00:00:00')
  return v.getTime() < today.getTime()
}
function valoresAprovadosMax(o: Orcamento): number {
  if (!o.propostas?.length) return 0
  return o.propostas.reduce((m, p) => p.valor > m ? p.valor : m, 0)
}
function valorRange(o: Orcamento): { min: number; max: number } {
  const valores = (o.propostas ?? []).map(p => p.valor || 0)
  if (valores.length === 0) return { min: 0, max: 0 }
  return { min: Math.min(...valores), max: Math.max(...valores) }
}

/** Migra registos antigos (formato v0 com campos `servico` / `valor` planos) */
function migrate(raw: any[]): Orcamento[] {
  return (raw ?? []).map((r: any) => {
    if (Array.isArray(r.propostas)) {
      // já novo
      return {
        id: r.id ?? uid(),
        cliente: r.cliente ?? '',
        cobertura: r.cobertura ?? null,
        resumo: r.resumo ?? null,
        propostas: r.propostas.map((p: any) => ({
          id: p.id ?? uid(),
          titulo: p.titulo ?? 'Proposta',
          valor: typeof p.valor === 'number' ? p.valor : parseFloat(p.valor) || 0,
          descricao: p.descricao ?? null,
        })),
        validade: r.validade ?? null,
        estado: (r.estado as Estado) ?? 'Pendente',
        notas: r.notas ?? null,
        criado_em: r.criado_em ?? new Date().toISOString(),
      }
    }
    // formato v0 — converter `servico`+`valor` numa proposta única
    return {
      id: r.id ?? uid(),
      cliente: r.cliente ?? '',
      cobertura: null,
      resumo: r.servico ?? null,
      propostas: [{
        id: uid(),
        titulo: r.servico || 'Proposta única',
        valor: typeof r.valor === 'number' ? r.valor : parseFloat(r.valor) || 0,
        descricao: null,
      }],
      validade: r.validade ?? null,
      estado: (r.estado as Estado) ?? 'Pendente',
      notas: r.notas ?? null,
      criado_em: r.criado_em ?? new Date().toISOString(),
    }
  })
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function OrcamentosPage() {
  const [hydrated, setHydrated]   = useState(false)
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState<'Todos' | Estado>('Todos')
  const [coberturaFilter, setCoberturaFilter] = useState<'Todas' | Cobertura>('Todas')
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      const list = raw ? migrate(JSON.parse(raw)) : []
      const next = list.map(o =>
        o.estado === 'Pendente' && isExpired(o) ? { ...o, estado: 'Expirado' as Estado } : o
      )
      setOrcamentos(next)
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  // persist
  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem(LS_KEY, JSON.stringify(orcamentos)) } catch { /* ignore */ }
  }, [orcamentos, hydrated])

  // KPIs
  const total      = orcamentos.length
  const pendentes  = orcamentos.filter(o => o.estado === 'Pendente').length
  const aprovados  = orcamentos.filter(o => o.estado === 'Aprovado').length
  const valorTotal = orcamentos.filter(o => o.estado === 'Aprovado').reduce((s, o) => s + valoresAprovadosMax(o), 0)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orcamentos
      .filter(o => filter === 'Todos' || o.estado === filter)
      .filter(o => coberturaFilter === 'Todas' || o.cobertura === coberturaFilter)
      .filter(o => !q || `${o.cliente} ${o.cobertura ?? ''} ${o.resumo ?? ''} ${o.notas ?? ''} ${o.propostas.map(p => p.titulo + ' ' + (p.descricao ?? '')).join(' ')}`.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
  }, [orcamentos, search, filter, coberturaFilter])

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

  const editing = editingId ? orcamentos.find(o => o.id === editingId) ?? null : null

  return (
    <main className="min-h-screen text-white relative overflow-hidden" style={{ background: '#050507' }}>
      {/* grid bg */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }} />
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(180,200,255,0.05) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-[1280px] mx-auto px-6 sm:px-10 py-10">

        {/* Top nav */}
        <div className="flex items-center justify-between mb-10">
          <Link href="/media"
            className="text-[10px] tracking-[0.5em] uppercase text-white/35 hover:text-white/85 transition-colors flex items-center gap-2">
            <span className="text-base leading-none">‹</span> RL PROD · Menu
          </Link>
          <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase">Gestão Interna</p>
        </div>

        {/* Hero */}
        <header className="mb-8">
          <p className="text-[10px] tracking-[0.55em] uppercase text-white/40 mb-3">Photography & Video</p>
          <h1 className="text-5xl sm:text-6xl font-extralight tracking-tight leading-[1.05]"
            style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
            Orçamentos<br />
            <em className="text-white/55 italic">Gestão de Propostas.</em>
          </h1>
          <p className="text-[13px] text-white/45 mt-4 max-w-xl leading-relaxed">
            Centraliza pedidos, acompanha o estado de cada proposta (até 3 alternativas por cliente) e converte em projeto quando aprovado.
          </p>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          <Kpi label="Total Orçamentos" value={total.toString()}      sub="Histórico completo"     accent="text-white" />
          <Kpi label="Pendentes"        value={pendentes.toString()}  sub="A aguardar resposta"    accent="text-blue-300" />
          <Kpi label="Aprovados"        value={aprovados.toString()}  sub="Convertidos em projeto" accent="text-emerald-300" />
          <Kpi label="Volume Aprovado"  value={fmtEur(valorTotal)}    sub={`${aprovados} orçamento${aprovados === 1 ? '' : 's'} · valor máx.`} accent="text-white" />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 py-2 flex-1 min-w-[220px] max-w-md focus-within:border-white/25 transition-colors">
            <span className="text-white/35 text-[12px]">⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Procurar cliente, cobertura, proposta…"
              className="bg-transparent outline-none flex-1 text-[13px] text-white/85 placeholder:text-white/25" />
          </div>

          <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] p-1">
            {(['Todos', ...ESTADOS] as const).map(f => (
              <button key={f} onClick={() => setFilter(f as any)}
                className={`text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full transition-all ${
                  filter === f ? 'bg-white text-black font-bold' : 'text-white/55 hover:text-white'
                }`}>
                {f}
              </button>
            ))}
          </div>

          <button onClick={() => { setEditingId(null); setShowForm(true) }}
            className="ml-auto inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-white text-black text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-white/85 transition-all"
            style={{ boxShadow: '0 0 22px -6px rgba(255,255,255,0.45)' }}>
            <span className="text-base leading-none">+</span> Novo Orçamento
          </button>
        </div>

        {/* Cobertura filter row */}
        <div className="flex items-center gap-2 mb-7 flex-wrap">
          <span className="text-[9px] tracking-[0.4em] uppercase text-white/30">Cobertura</span>
          {(['Todas', ...COBERTURAS] as const).map(c => {
            const active = coberturaFilter === c
            return (
              <button key={c} onClick={() => setCoberturaFilter(c as any)}
                className={`text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border transition-all ${
                  active
                    ? c === 'Todas'
                      ? 'bg-white text-black border-white font-bold'
                      : `${COBERTURA_META[c as Cobertura].cls} font-bold`
                    : 'border-white/[0.08] text-white/45 hover:text-white hover:border-white/25'
                }`}>
                {c !== 'Todas' && <span className="mr-1">{COBERTURA_META[c as Cobertura].icon}</span>}{c}
              </button>
            )
          })}
        </div>

        {/* Lista */}
        {filtered.length === 0 ? (
          <EmptyState onCreate={() => { setEditingId(null); setShowForm(true) }} hasAny={orcamentos.length > 0} />
        ) : (
          <div className="rounded-2xl border border-white/[0.07] overflow-hidden bg-white/[0.015]">
            {/* table header */}
            <div className="hidden md:grid grid-cols-[2fr_1.4fr_1.4fr_1fr_1.1fr_80px] gap-4 px-5 py-3 border-b border-white/[0.05] bg-white/[0.02]">
              <Th>Cliente</Th>
              <Th>Cobertura</Th>
              <Th right>Propostas · Valor</Th>
              <Th>Validade</Th>
              <Th>Estado</Th>
              <Th></Th>
            </div>
            {filtered.map(o => {
              const range = valorRange(o)
              const sameValor = range.min === range.max
              return (
                <div key={o.id}>
                  <div className="grid grid-cols-2 md:grid-cols-[2fr_1.4fr_1.4fr_1fr_1.1fr_80px] gap-4 px-5 py-4 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors items-center cursor-pointer"
                    onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                    {/* Cliente */}
                    <div className="col-span-2 md:col-span-1 min-w-0">
                      <p className="text-[14px] text-white truncate">{o.cliente}</p>
                      {o.resumo && <p className="text-[11px] text-white/35 truncate mt-0.5">{o.resumo}</p>}
                    </div>

                    {/* Cobertura */}
                    <div>
                      {o.cobertura ? (
                        <span className={`inline-flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-bold px-2.5 py-1 rounded-full border ${COBERTURA_META[o.cobertura].cls}`}>
                          <span>{COBERTURA_META[o.cobertura].icon}</span>{o.cobertura}
                        </span>
                      ) : <span className="text-[11px] text-white/30">—</span>}
                    </div>

                    {/* Propostas · Valor */}
                    <div className="md:text-right">
                      <p className="text-[14px] text-white/90 font-medium tabular-nums">
                        {sameValor ? fmtEur(range.max) : `${fmtEur(range.min)} – ${fmtEur(range.max)}`}
                      </p>
                      <p className="text-[10px] text-white/35 tracking-widest uppercase mt-0.5">
                        {o.propostas.length} proposta{o.propostas.length === 1 ? '' : 's'}
                      </p>
                    </div>

                    {/* Validade */}
                    <div className="text-[12px] text-white/55">{fmtData(o.validade)}</div>

                    {/* Estado */}
                    <div onClick={e => e.stopPropagation()}>
                      <select value={o.estado} onChange={e => changeEstado(o.id, e.target.value as Estado)}
                        className={`appearance-none w-full text-[10px] tracking-widest uppercase font-bold px-2.5 py-1.5 rounded-md border outline-none cursor-pointer transition-all [color-scheme:dark] ${ESTADO_CLS[o.estado]}`}>
                        {ESTADOS.map(s => <option key={s} value={s} className="bg-zinc-900 text-white">{s}</option>)}
                      </select>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => { setEditingId(o.id); setShowForm(true) }}
                        className="w-8 h-8 rounded-md border border-white/[0.08] hover:border-white/30 hover:bg-white/[0.04] text-white/55 hover:text-white transition-all flex items-center justify-center text-[12px]"
                        title="Editar">✎</button>
                      <button onClick={() => remove(o.id)}
                        className="w-8 h-8 rounded-md border border-white/[0.08] hover:border-red-500/40 hover:bg-red-500/[0.06] text-white/40 hover:text-red-400 transition-all flex items-center justify-center text-[12px]"
                        title="Eliminar">🗑</button>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedId === o.id && (
                    <div className="px-5 pb-5 pt-1 bg-black/30 border-b border-white/[0.04]">
                      {o.resumo && (
                        <div className="mb-3">
                          <p className="text-[9px] tracking-[0.4em] uppercase text-white/30 mb-1">Resumo do Serviço</p>
                          <p className="text-[13px] text-white/75 leading-relaxed whitespace-pre-wrap">{o.resumo}</p>
                        </div>
                      )}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {o.propostas.map((p, i) => (
                          <div key={p.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[9px] tracking-[0.4em] uppercase text-white/35">Proposta {i + 1}</p>
                              <p className="text-[14px] text-white font-medium tabular-nums">{fmtEur(p.valor)}</p>
                            </div>
                            <p className="text-[13px] text-white/85 mb-1 font-medium">{p.titulo}</p>
                            {p.descricao && <p className="text-[11px] text-white/45 leading-relaxed whitespace-pre-wrap">{p.descricao}</p>}
                          </div>
                        ))}
                      </div>
                      {o.notas && (
                        <div className="mt-3 rounded-xl border border-white/[0.05] bg-white/[0.015] p-3">
                          <p className="text-[9px] tracking-[0.4em] uppercase text-white/30 mb-1">Notas</p>
                          <p className="text-[12px] text-white/65 leading-relaxed whitespace-pre-wrap">{o.notas}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <p className="mt-8 text-[10px] tracking-widest uppercase text-white/20 text-center">
          ◌ Dados guardados localmente neste browser · iteração inicial
        </p>
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

/* ─── Components ──────────────────────────────────────────────────────────── */

function Kpi({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-5">
      <p className="text-[10px] tracking-[0.4em] uppercase text-white/35 mb-2">{label}</p>
      <p className={`text-3xl sm:text-4xl font-extralight leading-none tabular-nums ${accent}`}
        style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{value}</p>
      <p className="text-[11px] text-white/35 mt-3 tracking-wide">{sub}</p>
    </div>
  )
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <p className={`text-[9px] tracking-[0.4em] uppercase text-white/35 ${right ? 'text-right' : ''}`}>
      {children}
    </p>
  )
}

function EmptyState({ onCreate, hasAny }: { onCreate: () => void; hasAny: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/[0.08] p-14 text-center bg-white/[0.01]">
      <div className="inline-flex w-14 h-14 rounded-2xl border border-white/[0.08] items-center justify-center text-2xl text-white/30 mb-4">
        ◊
      </div>
      <h3 className="text-2xl font-extralight tracking-tight text-white/85 mb-1.5"
        style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
        {hasAny ? 'Nenhum orçamento corresponde aos filtros' : 'Ainda não há orçamentos'}
      </h3>
      <p className="text-[12px] text-white/40 mb-6 max-w-md mx-auto leading-relaxed">
        {hasAny
          ? 'Tenta ajustar a pesquisa, o estado ou a cobertura.'
          : 'Cria o teu primeiro orçamento para começar a acompanhar propostas. Tudo fica guardado e organizado num só lugar.'}
      </p>
      {!hasAny && (
        <button onClick={onCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-black text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-white/85 transition-all"
          style={{ boxShadow: '0 0 24px -6px rgba(255,255,255,0.4)' }}>
          <span className="text-base leading-none">+</span> Novo Orçamento
        </button>
      )}
    </div>
  )
}

/* ─── Form ────────────────────────────────────────────────────────────────── */

function emptyProposta(): Proposta {
  return { id: uid(), titulo: '', valor: 0, descricao: null }
}

function OrcamentoForm({
  initial,
  onClose,
  onSave,
}: {
  initial: Orcamento | null
  onClose: () => void
  onSave: (o: Orcamento) => void
}) {
  const [cliente, setCliente]     = useState(initial?.cliente ?? '')
  const [cobertura, setCobertura] = useState<Cobertura | null>(initial?.cobertura ?? null)
  const [resumo, setResumo]       = useState(initial?.resumo ?? '')
  const [validade, setValidade]   = useState(initial?.validade ?? '')
  const [estado, setEstado]       = useState<Estado>(initial?.estado ?? 'Pendente')
  const [notas, setNotas]         = useState(initial?.notas ?? '')
  const [propostas, setPropostas] = useState<Proposta[]>(
    initial?.propostas && initial.propostas.length > 0
      ? initial.propostas
      : [emptyProposta()]
  )

  function addProposta() {
    setPropostas(prev => prev.length >= 3 ? prev : [...prev, emptyProposta()])
  }
  function removeProposta(id: string) {
    setPropostas(prev => prev.length <= 1 ? prev : prev.filter(p => p.id !== id))
  }
  function updateProposta(id: string, patch: Partial<Proposta>) {
    setPropostas(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cliente.trim()) { alert('Indica o cliente.'); return }
    if (!cobertura) { alert('Escolhe a cobertura (Fotografia, Vídeo ou ambos).'); return }
    if (propostas.some(p => !p.titulo.trim())) { alert('Cada proposta precisa de um título.'); return }

    const o: Orcamento = {
      id:        initial?.id ?? uid(),
      cliente:   cliente.trim(),
      cobertura,
      resumo:    resumo.trim() || null,
      propostas: propostas.map(p => ({
        ...p,
        titulo: p.titulo.trim(),
        valor: typeof p.valor === 'number' ? p.valor : parseFloat(String(p.valor).replace(',', '.')) || 0,
        descricao: p.descricao?.trim() || null,
      })),
      validade:  validade || null,
      estado,
      notas:     notas.trim() || null,
      criado_em: initial?.criado_em ?? new Date().toISOString(),
    }
    onSave(o)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
      <form onSubmit={handleSubmit}
        onClick={e => e.stopPropagation()}
        className="relative z-10 w-full max-w-2xl rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl my-8"
        style={{ background: 'linear-gradient(180deg, #0c0d10, #050507)' }}>
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-white/35 to-transparent" />

        {/* header */}
        <div className="px-7 pt-6 pb-3 border-b border-white/[0.05] flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] tracking-[0.5em] uppercase text-white/35 mb-1">Orçamento</p>
            <h2 className="text-2xl font-extralight tracking-tight text-white"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {initial ? 'Editar orçamento' : 'Novo orçamento'}
            </h2>
          </div>
          <button type="button" onClick={onClose}
            className="w-8 h-8 rounded-full border border-white/[0.1] text-white/35 hover:text-white hover:border-white/30 transition-all flex items-center justify-center">
            ✕
          </button>
        </div>

        <div className="px-7 py-5 space-y-5 max-h-[75vh] overflow-y-auto">
          <Field label="Cliente">
            <input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nome dos noivos ou empresa"
              className={inputCls} autoFocus />
          </Field>

          {/* Cobertura — 3 botões */}
          <Field label="Cobertura">
            <div className="grid grid-cols-3 gap-2">
              {COBERTURAS.map(c => {
                const meta = COBERTURA_META[c]
                const active = cobertura === c
                return (
                  <button key={c} type="button" onClick={() => setCobertura(c)}
                    className={`relative overflow-hidden rounded-xl border px-3 py-3.5 text-left transition-all ${
                      active
                        ? `${meta.cls} ring-1 ring-current`
                        : 'border-white/[0.08] bg-white/[0.02] text-white/55 hover:text-white hover:border-white/25'
                    }`}>
                    <p className="text-lg leading-none mb-1.5">{meta.icon}</p>
                    <p className="text-[11px] tracking-widest uppercase font-bold">{c}</p>
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Resumo do Serviço">
            <textarea value={resumo} onChange={e => setResumo(e.target.value)} rows={2}
              placeholder="Pequena descrição do que está incluído (ex: cobertura completa do dia, edição online, álbum 30x30)…"
              className={inputCls + ' resize-none'} />
          </Field>

          {/* Propostas */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-[10px] tracking-[0.4em] uppercase text-white/45">Propostas <span className="text-white/30 normal-case tracking-wide">(até 3)</span></span>
              <button type="button" onClick={addProposta} disabled={propostas.length >= 3}
                className={`text-[10px] tracking-widest uppercase px-3 py-1 rounded-full border transition-all ${
                  propostas.length >= 3
                    ? 'border-white/[0.05] text-white/20 cursor-not-allowed'
                    : 'border-white/[0.12] text-white/65 hover:text-white hover:border-white/35'
                }`}>
                + Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {propostas.map((p, i) => (
                <div key={p.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[9px] tracking-[0.4em] uppercase text-white/40">Proposta {i + 1}</p>
                    {propostas.length > 1 && (
                      <button type="button" onClick={() => removeProposta(p.id)}
                        className="text-[10px] tracking-widest uppercase text-white/35 hover:text-red-400 transition-colors">
                        Remover
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1.6fr_1fr] gap-3 mb-3">
                    <input value={p.titulo}
                      onChange={e => updateProposta(p.id, { titulo: e.target.value })}
                      placeholder={i === 0 ? 'Ex: Pacote Essencial' : i === 1 ? 'Ex: Pacote Premium' : 'Ex: Pacote Luxe'}
                      className={inputCls} />
                    <input type="number" inputMode="decimal" min="0" step="0.01"
                      value={p.valor || ''}
                      onChange={e => updateProposta(p.id, { valor: parseFloat(e.target.value) || 0 })}
                      placeholder="Valor €"
                      className={inputCls + ' tabular-nums'} />
                  </div>
                  <textarea value={p.descricao ?? ''}
                    onChange={e => updateProposta(p.id, { descricao: e.target.value })}
                    placeholder="O que inclui esta proposta (ex: 8h de cobertura, 2 fotógrafos, álbum, etc.)"
                    rows={2}
                    className={inputCls + ' resize-none'} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Validade">
              <input type="date" value={validade} onChange={e => setValidade(e.target.value)}
                className={inputCls + ' [color-scheme:dark]'} />
            </Field>
            <Field label="Estado">
              <select value={estado} onChange={e => setEstado(e.target.value as Estado)}
                className={inputCls + ' cursor-pointer [color-scheme:dark]'}>
                {ESTADOS.map(s => <option key={s} value={s} className="bg-zinc-900 text-white">{s}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Notas (internas)">
            <textarea value={notas} onChange={e => setNotas(e.target.value)} rows={2}
              placeholder="Apontamentos sobre o cliente, conversa, follow-ups…"
              className={inputCls + ' resize-none'} />
          </Field>
        </div>

        <div className="px-7 py-4 border-t border-white/[0.05] flex items-center justify-end gap-2 bg-black/30">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-lg border border-white/[0.1] text-white/55 text-[11px] tracking-widest uppercase hover:text-white hover:border-white/30 transition-all">
            Cancelar
          </button>
          <button type="submit"
            className="px-5 py-2 rounded-lg bg-white text-black text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-white/85 transition-all"
            style={{ boxShadow: '0 0 18px -4px rgba(255,255,255,0.4)' }}>
            {initial ? 'Guardar' : 'Criar Orçamento'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputCls = 'w-full bg-white/[0.03] border border-white/[0.08] focus:border-white/35 focus:bg-white/[0.05] rounded-lg px-3 py-2.5 text-[13px] text-white outline-none placeholder:text-white/25 transition-all'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] tracking-[0.4em] uppercase text-white/45 block mb-1.5">{label}</span>
      {children}
    </label>
  )
}
