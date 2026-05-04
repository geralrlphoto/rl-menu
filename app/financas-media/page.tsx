'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts'

// ─── types ───────────────────────────────────────────────────────────────────

type Pagamento = { descricao: string; valor: number; estado: string; data: string }

type Projeto = {
  ref: string; nome: string; cliente: string; tipo: string
  status: string; dataFilmagem: string; dataEntrega: string
  pagamentos: Pagamento[]
  totalValor: number; totalPago: number; totalPendente: number; totalAtraso: number
  createdAt: string
}

type Despesa = {
  id: string; data: string; descricao: string; categoria: string
  valor: number; projeto_ref: string | null; notas: string | null; created_at: string
}

type Tab = 'geral' | 'projetos' | 'despesas' | 'graficos'

// ─── constantes ──────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { id: 'freelancer',  label: 'Freelancer',   color: '#8b5cf6' },
  { id: 'equipamento', label: 'Equipamento',  color: '#06b6d4' },
  { id: 'software',    label: 'Software',     color: '#3b82f6' },
  { id: 'deslocacao',  label: 'Deslocação',   color: '#f59e0b' },
  { id: 'marketing',   label: 'Marketing',    color: '#ec4899' },
  { id: 'outro',       label: 'Outro',        color: '#6b7280' },
]

const CAT_MAP = Object.fromEntries(CATEGORIAS.map(c => [c.id, c]))

const ESTADO_CLS: Record<string, string> = {
  pago:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  pendente:  'bg-amber-500/15 text-amber-400 border-amber-500/25',
  em_atraso: 'bg-red-500/15 text-red-400 border-red-500/25',
}

function fmt(n: number) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

// ─── tooltip personalizado ────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0e1118] border border-white/10 rounded-lg px-4 py-3 shadow-xl">
      {label && <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase mb-2">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[12px] font-light" style={{ color: p.color ?? p.fill }}>
          {p.name}: <span className="font-medium">{fmt(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

// ─── kpi card ────────────────────────────────────────────────────────────────

function KPI({ label, value, sub, color = 'white' }: { label: string; value: string; sub?: string; color?: string }) {
  const colorMap: Record<string, string> = {
    white:   'text-white/80',
    green:   'text-emerald-400',
    amber:   'text-amber-400',
    red:     'text-red-400',
    blue:    'text-blue-400',
    purple:  'text-purple-400',
  }
  return (
    <div className="border border-white/[0.07] bg-white/[0.02] px-5 py-5 flex flex-col gap-1">
      <p className="text-[9px] tracking-[0.45em] text-white/25 uppercase">{label}</p>
      <p className={`text-[22px] font-extralight tracking-[0.05em] ${colorMap[color]}`}>{value}</p>
      {sub && <p className="text-[10px] text-white/20">{sub}</p>}
    </div>
  )
}

// ─── form despesa ─────────────────────────────────────────────────────────────

const EMPTY_FORM = { data: '', descricao: '', categoria: 'outro', valor: '', projeto_ref: '', notas: '' }

// ─── componente principal ─────────────────────────────────────────────────────

function FinancasMediaContent() {
  const [tab, setTab]           = useState<Tab>('geral')
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading]   = useState(true)
  const [totais, setTotais]     = useState({ faturado: 0, recebido: 0, pendente: 0, atraso: 0 })

  // form despesa
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId]   = useState<string | null>(null)

  // projeto expandido
  const [expandedRef, setExpandedRef] = useState<string | null>(null)

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [rRes, dRes] = await Promise.all([
        fetch('/api/financas-media'),
        fetch('/api/financas-media/despesas'),
      ])
      const rData = await rRes.json()
      const dData = await dRes.json()
      setProjetos(rData.projetos ?? [])
      setTotais(rData.totais ?? { faturado: 0, recebido: 0, pendente: 0, atraso: 0 })
      setDespesas(dData.despesas ?? [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  // ── cálculos globais ───────────────────────────────────────────────────────

  const totalDespesas = despesas.reduce((s, d) => s + Number(d.valor), 0)
  const lucro         = totais.recebido - totalDespesas

  // ── despesa: guardar ───────────────────────────────────────────────────────

  const saveDespesa = async () => {
    if (!form.data || !form.descricao || !form.valor) return
    setSaving(true)
    try {
      if (editingId) {
        await fetch(`/api/financas-media/despesas/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, valor: Number(form.valor) }),
        })
        setEditingId(null)
      } else {
        await fetch('/api/financas-media/despesas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, valor: Number(form.valor) }),
        })
      }
      setForm(EMPTY_FORM)
      setShowForm(false)
      fetchAll()
    } catch {}
    setSaving(false)
  }

  const deleteDespesa = async (id: string) => {
    setDeletingId(id)
    await fetch(`/api/financas-media/despesas/${id}`, { method: 'DELETE' })
    setDespesas(d => d.filter(x => x.id !== id))
    setDeletingId(null)
  }

  const startEdit = (d: Despesa) => {
    setForm({
      data: d.data, descricao: d.descricao, categoria: d.categoria,
      valor: String(d.valor), projeto_ref: d.projeto_ref ?? '', notas: d.notas ?? '',
    })
    setEditingId(d.id)
    setShowForm(true)
  }

  // ── dados para gráficos ───────────────────────────────────────────────────

  const barData = projetos.map(p => ({
    name: p.nome.length > 10 ? p.nome.slice(0, 10) + '…' : p.nome,
    Faturado: p.totalValor,
    Recebido: p.totalPago,
    Pendente: p.totalPendente,
  }))

  const catData = CATEGORIAS.map(cat => ({
    name:  cat.label,
    value: despesas.filter(d => d.categoria === cat.id).reduce((s, d) => s + Number(d.valor), 0),
    color: cat.color,
  })).filter(c => c.value > 0)

  const pieData = [
    { name: 'Recebido',  value: totais.recebido,  color: '#10b981' },
    { name: 'Pendente',  value: totais.pendente,  color: '#f59e0b' },
    { name: 'Despesas',  value: totalDespesas,    color: '#ef4444' },
  ].filter(d => d.value > 0)

  // ── tabs ──────────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string }[] = [
    { id: 'geral',     label: 'Visão Geral' },
    { id: 'projetos',  label: 'Projetos' },
    { id: 'despesas',  label: 'Despesas' },
    { id: 'graficos',  label: 'Gráficos' },
  ]

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      {/* Grid overlay */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,160,0,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,160,0,0.03) 1px,transparent 1px)',
        backgroundSize: '56px 56px',
      }} />

      <div className="relative z-10 max-w-6xl mx-auto px-5 sm:px-10 py-10">

        {/* ── cabeçalho ── */}
        <div className="mb-10">
          <Link href="/media" className="inline-flex items-center gap-2 text-[9px] tracking-[0.45em]
            text-white/20 hover:text-white/50 uppercase transition-colors mb-8 group">
            <span className="group-hover:-translate-x-1 transition-transform">‹</span>
            RL Media
          </Link>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[8px] tracking-[0.6em] text-amber-400/40 uppercase mb-1">RL Media · Financeiro</p>
              <h1 className="text-3xl font-extralight tracking-[0.35em] text-white/85 uppercase">Finanças</h1>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-px w-10 bg-amber-400/40" />
                <div className="h-px flex-1 bg-white/[0.04]" />
              </div>
            </div>
            {loading && (
              <span className="text-[10px] tracking-[0.35em] text-white/20 uppercase animate-pulse">A carregar...</span>
            )}
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          <KPI label="Projetos"     value={String(projetos.length)}  color="white" />
          <KPI label="Faturado"     value={fmt(totais.faturado)}     color="white" />
          <KPI label="Recebido"     value={fmt(totais.recebido)}     color="green" />
          <KPI label="Pendente"     value={fmt(totais.pendente)}     color="amber" />
          <KPI label="Despesas"     value={fmt(totalDespesas)}       color="red" />
          <KPI label="Lucro Líquido" value={fmt(lucro)}
            color={lucro >= 0 ? 'green' : 'red'}
            sub={lucro >= 0 ? 'Recebido − Despesas' : 'Atenção ao saldo'} />
        </div>

        {/* ── tabs ── */}
        <div className="flex gap-1 mb-8 border-b border-white/[0.06] pb-0">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 text-[10px] tracking-[0.35em] uppercase transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-amber-400/60 text-amber-400/80'
                  : 'border-transparent text-white/30 hover:text-white/55'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: VISÃO GERAL                                                  */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'geral' && (
          <div className="space-y-8">

            {/* Distribuição geral */}
            <div className="border border-white/[0.07] bg-white/[0.015] px-6 py-6">
              <p className="text-[9px] tracking-[0.5em] text-white/30 uppercase mb-6">Distribuição Financeira</p>
              <div className="grid sm:grid-cols-2 gap-6">

                {/* Donut Geral */}
                <div>
                  <p className="text-[9px] tracking-[0.35em] text-white/20 uppercase mb-4 text-center">Receita vs Despesas</p>
                  {pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                          dataKey="value" paddingAngle={3}>
                          {pieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} opacity={0.85} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8}
                          formatter={(v) => <span className="text-[10px] text-white/50">{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center">
                      <p className="text-[11px] text-white/15">Sem dados</p>
                    </div>
                  )}
                </div>

                {/* Donut Despesas por categoria */}
                <div>
                  <p className="text-[9px] tracking-[0.35em] text-white/20 uppercase mb-4 text-center">Despesas por Categoria</p>
                  {catData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={catData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                          dataKey="value" paddingAngle={3}>
                          {catData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} opacity={0.85} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8}
                          formatter={(v) => <span className="text-[10px] text-white/50">{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center">
                      <p className="text-[11px] text-white/15">Sem despesas lançadas</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resumo por estado */}
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: 'Total Recebido',  value: totais.recebido,  bg: 'border-emerald-400/15 bg-emerald-400/[0.03]', txt: 'text-emerald-400' },
                { label: 'Total Pendente',  value: totais.pendente,  bg: 'border-amber-400/15 bg-amber-400/[0.03]',   txt: 'text-amber-400' },
                { label: 'Total em Atraso', value: totais.atraso,    bg: 'border-red-400/15 bg-red-400/[0.03]',       txt: 'text-red-400' },
              ].map(item => (
                <div key={item.label} className={`border ${item.bg} px-6 py-5`}>
                  <p className="text-[9px] tracking-[0.4em] text-white/25 uppercase mb-2">{item.label}</p>
                  <p className={`text-2xl font-extralight ${item.txt}`}>{fmt(item.value)}</p>
                </div>
              ))}
            </div>

            {/* Top projetos */}
            <div className="border border-white/[0.07] bg-white/[0.015]">
              <div className="px-6 py-4 border-b border-white/[0.05]">
                <p className="text-[9px] tracking-[0.5em] text-white/30 uppercase">Top Projetos por Valor</p>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {[...projetos].sort((a, b) => b.totalValor - a.totalValor).slice(0, 5).map(p => (
                  <div key={p.ref} className="px-6 py-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[12px] font-light text-white/70">{p.nome}</p>
                      <p className="text-[10px] text-white/25">{p.cliente}</p>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] text-white/20 mb-0.5">Faturado</p>
                        <p className="text-[13px] font-light text-white/60">{fmt(p.totalValor)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-white/20 mb-0.5">Recebido</p>
                        <p className="text-[13px] font-light text-emerald-400/70">{fmt(p.totalPago)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {projetos.length === 0 && (
                  <p className="px-6 py-8 text-[12px] text-white/20 text-center">Sem projetos</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: PROJETOS                                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'projetos' && (
          <div className="space-y-3">
            {projetos.length === 0 && !loading && (
              <div className="border border-white/[0.06] px-8 py-16 text-center">
                <p className="text-[11px] text-white/20">Nenhum projeto encontrado</p>
              </div>
            )}
            {projetos.map(p => {
              const isOpen = expandedRef === p.ref
              const pct = p.totalValor > 0 ? (p.totalPago / p.totalValor) * 100 : 0
              return (
                <div key={p.ref} className="border border-white/[0.07] bg-white/[0.015] overflow-hidden">
                  {/* Header row */}
                  <button onClick={() => setExpandedRef(isOpen ? null : p.ref)}
                    className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors text-left">
                    <div className="flex items-center gap-4 min-w-0">
                      <span className={`text-[9px] font-mono px-2 py-0.5 border ${
                        p.totalPendente === 0 && p.totalValor > 0
                          ? 'border-emerald-400/25 text-emerald-400/60 bg-emerald-400/[0.05]'
                          : p.totalAtraso > 0
                          ? 'border-red-400/25 text-red-400/60 bg-red-400/[0.05]'
                          : 'border-amber-400/25 text-amber-400/60 bg-amber-400/[0.05]'
                      }`}>
                        {p.totalPendente === 0 && p.totalValor > 0 ? '✓ PAGO' : p.totalAtraso > 0 ? '⚠ ATRASO' : '◷ PARCIAL'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-light text-white/75 truncate">{p.nome}</p>
                        <p className="text-[10px] text-white/25 truncate">{p.cliente} · {p.tipo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="hidden sm:block text-right">
                        <p className="text-[9px] text-white/20 mb-0.5">Faturado</p>
                        <p className="text-[13px] font-light text-white/55">{fmt(p.totalValor)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-white/20 mb-0.5">Recebido</p>
                        <p className="text-[13px] font-light text-emerald-400/70">{fmt(p.totalPago)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-white/20 mb-0.5">Pendente</p>
                        <p className={`text-[13px] font-light ${p.totalPendente > 0 ? 'text-amber-400/70' : 'text-white/20'}`}>
                          {fmt(p.totalPendente)}
                        </p>
                      </div>
                      <span className="text-white/20 text-sm">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Barra progresso */}
                  <div className="h-px mx-6 bg-white/[0.04] relative overflow-hidden">
                    <div className="absolute left-0 top-0 h-full bg-emerald-400/50 transition-all"
                      style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>

                  {/* Detalhe */}
                  {isOpen && (
                    <div className="px-6 py-5 border-t border-white/[0.04] bg-white/[0.01]">
                      <div className="grid sm:grid-cols-3 gap-2 mb-4 text-[10px] text-white/30">
                        {p.dataFilmagem && <span>📅 Filmagem: {p.dataFilmagem}</span>}
                        {p.dataEntrega  && <span>📦 Entrega: {p.dataEntrega}</span>}
                        {p.status       && <span>● {p.status}</span>}
                      </div>
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/[0.05]">
                            {['Descrição','Data','Valor','Estado'].map(h => (
                              <th key={h} className="pb-2 text-[9px] tracking-[0.35em] text-white/20 uppercase font-normal pr-4">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {p.pagamentos.map((pg, i) => (
                            <tr key={i} className="border-b border-white/[0.03] last:border-0">
                              <td className="py-2.5 text-[12px] font-light text-white/55 pr-4">{pg.descricao}</td>
                              <td className="py-2.5 text-[11px] text-white/30 pr-4">{pg.data || '—'}</td>
                              <td className="py-2.5 text-[12px] font-light text-white/60 pr-4">{fmt(Number(pg.valor))}</td>
                              <td className="py-2.5">
                                <span className={`text-[9px] px-2 py-0.5 border rounded-sm ${ESTADO_CLS[pg.estado] ?? 'border-white/10 text-white/25'}`}>
                                  {pg.estado}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {p.pagamentos.length === 0 && (
                            <tr><td colSpan={4} className="py-4 text-[11px] text-white/15">Sem pagamentos definidos</td></tr>
                          )}
                        </tbody>
                      </table>
                      <div className="mt-4 flex items-center justify-between text-[11px] font-light">
                        <span className="text-white/25">Total pago: <span className="text-emerald-400/70">{fmt(p.totalPago)}</span></span>
                        <Link href={`/portal-media/${p.ref}/pagamentos`}
                          className="text-white/25 hover:text-white/50 transition-colors tracking-[0.2em] text-[9px] uppercase">
                          Ver portal →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: DESPESAS                                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'despesas' && (
          <div className="space-y-6">

            {/* Botão adicionar */}
            <div className="flex items-center justify-between">
              <p className="text-[9px] tracking-[0.4em] text-white/25 uppercase">
                {despesas.length} despesas · Total {fmt(totalDespesas)}
              </p>
              <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(EMPTY_FORM) }}
                className="border border-white/20 bg-white/[0.04] hover:bg-white/[0.08] px-5 py-2
                           text-[9px] tracking-[0.4em] text-white/60 hover:text-white uppercase transition-all">
                {showForm && !editingId ? '✕ Cancelar' : '+ Nova Despesa'}
              </button>
            </div>

            {/* Form */}
            {showForm && (
              <div className="border border-amber-400/20 bg-amber-400/[0.02] px-6 py-6">
                <p className="text-[9px] tracking-[0.5em] text-amber-400/50 uppercase mb-5">
                  {editingId ? 'Editar Despesa' : 'Nova Despesa'}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">

                  <div>
                    <label className="text-[9px] tracking-[0.35em] text-white/25 uppercase block mb-1.5">Data *</label>
                    <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                      className="w-full bg-black/30 border border-white/[0.08] px-3 py-2 text-[12px] text-white/70
                                 focus:outline-none focus:border-white/20 transition-colors" />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="text-[9px] tracking-[0.35em] text-white/25 uppercase block mb-1.5">Descrição *</label>
                    <input type="text" placeholder="Ex: Freelancer edição vídeo..." value={form.descricao}
                      onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                      className="w-full bg-black/30 border border-white/[0.08] px-3 py-2 text-[12px] text-white/70
                                 placeholder:text-white/15 focus:outline-none focus:border-white/20 transition-colors" />
                  </div>

                  <div>
                    <label className="text-[9px] tracking-[0.35em] text-white/25 uppercase block mb-1.5">Categoria *</label>
                    <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                      className="w-full bg-black/30 border border-white/[0.08] px-3 py-2 text-[12px] text-white/70
                                 focus:outline-none focus:border-white/20 transition-colors">
                      {CATEGORIAS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[9px] tracking-[0.35em] text-white/25 uppercase block mb-1.5">Valor (€) *</label>
                    <input type="number" step="0.01" placeholder="0.00" value={form.valor}
                      onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                      className="w-full bg-black/30 border border-white/[0.08] px-3 py-2 text-[12px] text-white/70
                                 placeholder:text-white/15 focus:outline-none focus:border-white/20 transition-colors" />
                  </div>

                  <div>
                    <label className="text-[9px] tracking-[0.35em] text-white/25 uppercase block mb-1.5">Projeto (opcional)</label>
                    <select value={form.projeto_ref} onChange={e => setForm(f => ({ ...f, projeto_ref: e.target.value }))}
                      className="w-full bg-black/30 border border-white/[0.08] px-3 py-2 text-[12px] text-white/70
                                 focus:outline-none focus:border-white/20 transition-colors">
                      <option value="">— Sem projeto —</option>
                      {projetos.map(p => <option key={p.ref} value={p.ref}>{p.nome}</option>)}
                    </select>
                  </div>

                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className="text-[9px] tracking-[0.35em] text-white/25 uppercase block mb-1.5">Notas (opcional)</label>
                    <input type="text" placeholder="Notas adicionais..." value={form.notas}
                      onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                      className="w-full bg-black/30 border border-white/[0.08] px-3 py-2 text-[12px] text-white/70
                                 placeholder:text-white/15 focus:outline-none focus:border-white/20 transition-colors" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={saveDespesa} disabled={saving || !form.data || !form.descricao || !form.valor}
                    className="border border-white/25 bg-white/[0.05] hover:bg-white/[0.12] px-8 py-2.5
                               text-[9px] tracking-[0.4em] text-white/70 hover:text-white uppercase
                               transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                    {saving ? '⏳ A guardar...' : editingId ? 'Guardar Alterações' : 'Adicionar'}
                  </button>
                  <button onClick={() => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }}
                    className="text-[10px] text-white/25 hover:text-white/50 transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Tabela despesas */}
            <div className="border border-white/[0.07] bg-white/[0.015] overflow-hidden">
              {despesas.length === 0 ? (
                <div className="px-8 py-16 text-center">
                  <p className="text-[11px] text-white/15">Nenhuma despesa lançada</p>
                  <p className="text-[10px] text-white/10 mt-1">Clica em "+ Nova Despesa" para começar</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {['Data','Descrição','Categoria','Projeto','Valor',''].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[9px] tracking-[0.35em] text-white/20 uppercase font-normal">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {despesas.map(d => (
                      <tr key={d.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.01] transition-colors group">
                        <td className="px-4 py-3 text-[11px] text-white/40 whitespace-nowrap">
                          {new Date(d.data + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[12px] font-light text-white/65">{d.descricao}</p>
                          {d.notas && <p className="text-[10px] text-white/25 mt-0.5">{d.notas}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-[10px] text-white/45">
                            <span className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: CAT_MAP[d.categoria]?.color ?? '#6b7280' }} />
                            {CAT_MAP[d.categoria]?.label ?? d.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-white/30">
                          {d.projeto_ref || '—'}
                        </td>
                        <td className="px-4 py-3 text-[13px] font-light text-red-400/70 whitespace-nowrap">
                          − {fmt(Number(d.valor))}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(d)}
                              className="text-[10px] text-white/30 hover:text-white/60 transition-colors">✎</button>
                            <button onClick={() => deleteDespesa(d.id)} disabled={deletingId === d.id}
                              className="text-[10px] text-red-400/40 hover:text-red-400/70 transition-colors disabled:opacity-30">
                              {deletingId === d.id ? '...' : '✕'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/[0.08] bg-white/[0.02]">
                      <td colSpan={4} className="px-4 py-3 text-[9px] tracking-[0.35em] text-white/25 uppercase">Total Despesas</td>
                      <td className="px-4 py-3 text-[14px] font-light text-red-400/80">{fmt(totalDespesas)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* TAB: GRÁFICOS                                                      */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'graficos' && (
          <div className="space-y-8">

            {/* Barras por projeto */}
            <div className="border border-white/[0.07] bg-white/[0.015] px-6 py-6">
              <p className="text-[9px] tracking-[0.5em] text-white/30 uppercase mb-6">Receita por Projeto</p>
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} axisLine={false} tickLine={false}
                      tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8}
                      formatter={(v) => <span className="text-[10px] text-white/45">{v}</span>} />
                    <Bar dataKey="Faturado" fill="rgba(255,255,255,0.15)" radius={[2,2,0,0]} />
                    <Bar dataKey="Recebido" fill="#10b981"              radius={[2,2,0,0]} opacity={0.8} />
                    <Bar dataKey="Pendente" fill="#f59e0b"              radius={[2,2,0,0]} opacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-[11px] text-white/15">Sem projetos para mostrar</p>
                </div>
              )}
            </div>

            {/* Donut + Resumo lado a lado */}
            <div className="grid sm:grid-cols-2 gap-6">

              {/* Despesas por categoria */}
              <div className="border border-white/[0.07] bg-white/[0.015] px-6 py-6">
                <p className="text-[9px] tracking-[0.5em] text-white/30 uppercase mb-6">Despesas por Categoria</p>
                {catData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={catData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                        dataKey="value" paddingAngle={4}>
                        {catData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.85} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8}
                        formatter={(v) => <span className="text-[10px] text-white/45">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center">
                    <p className="text-[11px] text-white/15">Sem despesas para mostrar</p>
                  </div>
                )}
              </div>

              {/* Resumo numérico */}
              <div className="border border-white/[0.07] bg-white/[0.015] px-6 py-6">
                <p className="text-[9px] tracking-[0.5em] text-white/30 uppercase mb-6">Resumo Financeiro</p>
                <div className="space-y-4">
                  {[
                    { label: 'Total Faturado',  value: totais.faturado,  color: 'text-white/60' },
                    { label: 'Total Recebido',  value: totais.recebido,  color: 'text-emerald-400' },
                    { label: 'Total Pendente',  value: totais.pendente,  color: 'text-amber-400' },
                    { label: 'Total em Atraso', value: totais.atraso,    color: 'text-red-400' },
                    { label: 'Total Despesas',  value: totalDespesas,    color: 'text-red-400/70' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between gap-4 border-b border-white/[0.04] pb-4 last:border-0 last:pb-0">
                      <p className="text-[11px] font-light text-white/35">{item.label}</p>
                      <p className={`text-[14px] font-extralight ${item.color}`}>{fmt(item.value)}</p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-4 border-t border-white/[0.10] pt-4 mt-2">
                    <p className="text-[11px] font-medium text-white/50 uppercase tracking-widest">Lucro Líquido</p>
                    <p className={`text-[18px] font-extralight ${lucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmt(lucro)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Categorias detalhe */}
            {catData.length > 0 && (
              <div className="border border-white/[0.07] bg-white/[0.015]">
                <div className="px-6 py-4 border-b border-white/[0.05]">
                  <p className="text-[9px] tracking-[0.5em] text-white/30 uppercase">Detalhe por Categoria</p>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {CATEGORIAS.map(cat => {
                    const total = despesas.filter(d => d.categoria === cat.id).reduce((s, d) => s + Number(d.valor), 0)
                    const count = despesas.filter(d => d.categoria === cat.id).length
                    if (count === 0) return null
                    const pct = totalDespesas > 0 ? (total / totalDespesas) * 100 : 0
                    return (
                      <div key={cat.id} className="px-6 py-4 flex items-center gap-4">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                        <p className="text-[12px] font-light text-white/55 flex-1">{cat.label}</p>
                        <p className="text-[11px] text-white/30">{count} {count === 1 ? 'item' : 'itens'}</p>
                        <div className="w-24 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color, opacity: 0.7 }} />
                        </div>
                        <p className="text-[12px] font-light text-white/55 w-28 text-right">{fmt(total)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}

// ─── export ───────────────────────────────────────────────────────────────────

export default function FinancasMediaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <p className="text-[10px] tracking-[0.5em] text-white/20 uppercase animate-pulse">A carregar...</p>
      </div>
    }>
      <FinancasMediaContent />
    </Suspense>
  )
}
