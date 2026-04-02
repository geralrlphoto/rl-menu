'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

type Contact = {
  id: string
  status: string
  como_chegou: string
  lead_prioridade: string
  tipo_evento: string
  orcamento: string
}

const STATUS_COLORS: Record<string, string> = {
  'Fechou': '#4ade80',
  'Negociação': '#facc15',
  'Por Contactar': '#f87171',
  'Contactado': '#60a5fa',
  'Reunião Agendada': '#c084fc',
  'NÃO FECHOU': '#9ca3af',
  'Agendar Reunião': '#fb923c',
  'Sem resposta': '#6b7280',
  'Encerrado': '#4b5563',
  'Cancelado': '#991b1b',
  'Iniciar': '#ffffff33',
}

const COMO_COLORS = [
  '#C9A84C', '#a07c3a', '#e6c46a', '#f5dfa0',
  '#8a6a2e', '#d4a853', '#7a5c22', '#c49040',
  '#ffe0a0', '#b8882e',
]

const clean = (v: string) => (v || '').replace(/[\[\]"]/g, '').trim() || 'Não indicado'

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-white/50 text-xs tracking-wider mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
          <span className="text-white/70">{p.name}:</span>
          <span className="text-white font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-white font-semibold">{payload[0].name}</p>
      <p className="text-gold">{payload[0].value} leads</p>
    </div>
  )
}

export default function StatsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('crm_contacts').select('id,status,como_chegou,lead_prioridade,tipo_evento,orcamento')
      .then(({ data }) => { setContacts(data ?? []); setLoading(false) })
  }, [])

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-white/20 tracking-[0.4em] text-xs uppercase">A carregar...</p>
    </main>
  )

  /* ── Dados: Como Chegou ── */
  const comoChegouMap: Record<string, number> = {}
  contacts.forEach(c => {
    const k = clean(c.como_chegou)
    comoChegouMap[k] = (comoChegouMap[k] || 0) + 1
  })
  const comoChegouData = Object.entries(comoChegouMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  /* ── Dados: Status ── */
  const statusMap: Record<string, number> = {}
  contacts.forEach(c => {
    const k = c.status || 'Sem status'
    statusMap[k] = (statusMap[k] || 0) + 1
  })
  const statusData = Object.entries(statusMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  /* ── Dados: Como Chegou × Status (stacked) ── */
  const allStatuses = Object.keys(statusMap)
  const stackedMap: Record<string, Record<string, number>> = {}
  contacts.forEach(c => {
    const fonte = clean(c.como_chegou)
    if (!stackedMap[fonte]) stackedMap[fonte] = {}
    const s = c.status || 'Sem status'
    stackedMap[fonte][s] = (stackedMap[fonte][s] || 0) + 1
  })
  const stackedData = Object.entries(stackedMap)
    .sort((a, b) => Object.values(b[1]).reduce((s, v) => s + v, 0) - Object.values(a[1]).reduce((s, v) => s + v, 0))
    .map(([name, vals]) => ({ name, ...vals }))

  /* ── Dados: Lead Prioridade ── */
  const prioMap: Record<string, number> = {}
  contacts.forEach(c => { const k = c.lead_prioridade || 'Não def.'; prioMap[k] = (prioMap[k] || 0) + 1 })
  const prioData = Object.entries(prioMap).map(([name, value]) => ({ name, value }))
  const PRIO_COLORS = { 'Alta': '#f87171', 'Médio': '#facc15', 'Baixa': '#4ade80', 'Não def.': '#6b7280' }

  /* ── Orçamento total por fonte ── */
  const orcMap: Record<string, number> = {}
  contacts.forEach(c => {
    const fonte = clean(c.como_chegou)
    const val = parseFloat((c.orcamento || '').replace(/[^\d.,]/g, '').replace(',', '.'))
    if (!isNaN(val)) orcMap[fonte] = (orcMap[fonte] || 0) + val
  })
  const orcData = Object.entries(orcMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  const totalOrc = contacts.reduce((s, c) => {
    const v = parseFloat((c.orcamento || '').replace(/[^\d.,]/g, '').replace(',', '.'))
    return s + (isNaN(v) ? 0 : v)
  }, 0)

  return (
    <main className="min-h-screen px-6 py-10 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between mb-12">
        <div>
          <Link href="/crm" className="text-xs tracking-[0.3em] text-white/20 hover:text-gold transition-colors uppercase">
            ‹ CRM
          </Link>
          <h1 className="text-5xl font-extralight tracking-[0.2em] text-white uppercase mt-3">Estatísticas</h1>
          <p className="text-white/20 text-xs tracking-[0.3em] mt-2 uppercase">{contacts.length} leads · Pipeline total: {totalOrc > 0 ? totalOrc.toLocaleString('pt-PT') + ' €' : '—'}</p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
        {[
          { label: 'Total Leads', value: contacts.length, color: 'text-white' },
          { label: 'Fecharam', value: contacts.filter(c => c.status === 'Fechou').length, color: 'text-green-400' },
          { label: 'Em Negociação', value: contacts.filter(c => c.status === 'Negociação').length, color: 'text-yellow-400' },
          { label: 'Pipeline €', value: totalOrc > 0 ? totalOrc.toLocaleString('pt-PT') + ' €' : '—', color: 'text-gold' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <p className="text-white/25 text-xs tracking-[0.3em] uppercase mb-3">{kpi.label}</p>
            <p className={`text-3xl font-extralight tracking-wide ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* ── Row 1: Como Chegou + Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Como Chegou — barras */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
          <h2 className="text-xs tracking-[0.35em] uppercase text-white/30 mb-6">Como Chegaram</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={comoChegouData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: '#ffffff30', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#ffffff60', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} name="Leads">
                {comoChegouData.map((_, i) => (
                  <Cell key={i} fill={COMO_COLORS[i % COMO_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status — pie */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
          <h2 className="text-xs tracking-[0.35em] uppercase text-white/30 mb-6">Distribuição por Status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] ?? '#6b7280'} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend
                formatter={(value) => <span style={{ color: '#ffffff60', fontSize: 11 }}>{value}</span>}
                iconType="circle" iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 2: Como Chegou × Status (stacked) ── */}
      <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-6">
        <h2 className="text-xs tracking-[0.35em] uppercase text-white/30 mb-6">Como Chegou × Status</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={stackedData} margin={{ left: 0, right: 20, bottom: 40 }}>
            <XAxis dataKey="name" tick={{ fill: '#ffffff50', fontSize: 10 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
            <YAxis tick={{ fill: '#ffffff30', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
            {allStatuses.map(s => (
              <Bar key={s} dataKey={s} stackId="a" fill={STATUS_COLORS[s] ?? '#6b7280'} name={s} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Row 3: Prioridade + Orçamento por fonte ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* Lead Prioridade */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
          <h2 className="text-xs tracking-[0.35em] uppercase text-white/30 mb-6">Lead Prioridade</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={prioData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} paddingAngle={3}>
                {prioData.map((entry, i) => (
                  <Cell key={i} fill={(PRIO_COLORS as any)[entry.name] ?? '#6b7280'} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend formatter={(v) => <span style={{ color: '#ffffff60', fontSize: 11 }}>{v}</span>} iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Orçamento por fonte */}
        {orcData.length > 0 && (
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
            <h2 className="text-xs tracking-[0.35em] uppercase text-white/30 mb-6">Orçamento por Fonte (€)</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={orcData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <XAxis type="number" tick={{ fill: '#ffffff30', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#ffffff60', fontSize: 10 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} name="€">
                  {orcData.map((_, i) => <Cell key={i} fill={COMO_COLORS[i % COMO_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

    </main>
  )
}
