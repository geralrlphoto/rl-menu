'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

type Contact = {
  id: string
  status: string
  como_chegou: string
  lead_prioridade: string
  tipo_evento: string
  orcamento: string
  data_entrada: string
  status_updated_at: string
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

const COMO_COLORS = ['#C9A84C','#a07c3a','#e6c46a','#f5dfa0','#8a6a2e','#d4a853','#7a5c22','#c49040','#ffe0a0','#b8882e']
const PRIO_COLORS: Record<string, string> = { 'Alta': '#f87171', 'Médio': '#facc15', 'Baixa': '#4ade80', 'Não def.': '#6b7280' }

const clean = (v: string) => (v || '').replace(/[\[\]"]/g, '').trim() || 'Não indicado'

const parseOrc = (v: string) => {
  const n = parseFloat((v || '').replace(/[^\d.,]/g, '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

const MONTH_LABELS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

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
  const [yearFilter, setYearFilter] = useState('Todos')

  useEffect(() => {
    supabase.from('crm_contacts')
      .select('id,status,como_chegou,lead_prioridade,tipo_evento,orcamento,data_entrada,status_updated_at')
      .then(({ data }) => { setContacts(data ?? []); setLoading(false) })
  }, [])

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-white/20 tracking-[0.4em] text-xs uppercase">A carregar...</p>
    </main>
  )

  /* ── Anos disponíveis ── */
  const allYears = Array.from(new Set(contacts.map(c => c.data_entrada?.slice(0,4)).filter(Boolean))).sort()
  const years = ['Todos', ...allYears]

  /* ── Filtro por ano (data_entrada) ── */
  const filtered = yearFilter === 'Todos' ? contacts : contacts.filter(c => c.data_entrada?.startsWith(yearFilter))

  /* ── KPIs ── */
  const total = filtered.length
  const fechados = filtered.filter(c => c.status === 'Fechou')
  const taxaFecho = total > 0 ? Math.round((fechados.length / total) * 100) : 0
  const valorFechado = fechados.reduce((s, c) => s + parseOrc(c.orcamento), 0)
  const valorMedio = fechados.filter(c => parseOrc(c.orcamento) > 0).length > 0
    ? valorFechado / fechados.filter(c => parseOrc(c.orcamento) > 0).length
    : 0
  const CLOSED_S = ['Fechou','NÃO FECHOU','Encerrado','Cancelado','Sem resposta']
  const pipelineAtivo = filtered.filter(c => !CLOSED_S.includes(c.status)).reduce((s, c) => s + parseOrc(c.orcamento), 0)

  /* ── Leads & Fechos por Mês ── */
  // Group by entry month; fechos by status_updated_at month
  const monthlyMap: Record<string, { leads: number; fechos: number; valor: number }> = {}
  filtered.forEach(c => {
    if (!c.data_entrada) return
    const key = c.data_entrada.slice(0, 7) // "YYYY-MM"
    if (!monthlyMap[key]) monthlyMap[key] = { leads: 0, fechos: 0, valor: 0 }
    monthlyMap[key].leads++
  })
  fechados.forEach(c => {
    // Use status_updated_at as close month if available, else data_entrada
    const dateStr = c.status_updated_at || c.data_entrada
    if (!dateStr) return
    const key = dateStr.slice(0, 7)
    if (!monthlyMap[key]) monthlyMap[key] = { leads: 0, fechos: 0, valor: 0 }
    monthlyMap[key].fechos++
    monthlyMap[key].valor += parseOrc(c.orcamento)
  })

  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => {
      const [yr, mo] = key.split('-')
      const label = `${MONTH_LABELS[parseInt(mo) - 1]} ${yr.slice(2)}`
      const taxa = v.leads > 0 ? Math.round((v.fechos / v.leads) * 100) : 0
      return { key, label, ...v, taxa }
    })

  /* ── Como Chegou ── */
  const comoMap: Record<string, { leads: number; fechos: number }> = {}
  filtered.forEach(c => {
    const k = clean(c.como_chegou)
    if (!comoMap[k]) comoMap[k] = { leads: 0, fechos: 0 }
    comoMap[k].leads++
    if (c.status === 'Fechou') comoMap[k].fechos++
  })
  const comoData = Object.entries(comoMap)
    .sort((a, b) => b[1].leads - a[1].leads)
    .map(([name, v]) => ({
      name,
      leads: v.leads,
      fechos: v.fechos,
      taxa: v.leads > 0 ? Math.round((v.fechos / v.leads) * 100) : 0,
    }))

  /* ── Status ── */
  const statusMap: Record<string, number> = {}
  filtered.forEach(c => { const k = c.status || 'Sem status'; statusMap[k] = (statusMap[k] || 0) + 1 })
  const statusData = Object.entries(statusMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))

  /* ── Lead Prioridade ── */
  const prioMap: Record<string, number> = {}
  filtered.forEach(c => { const k = c.lead_prioridade || 'Não def.'; prioMap[k] = (prioMap[k] || 0) + 1 })
  const prioData = Object.entries(prioMap).map(([name, value]) => ({ name, value }))

  return (
    <main className="min-h-screen px-4 sm:px-6 py-10 max-w-[1400px] mx-auto">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
        <div>
          <Link href="/crm" className="text-xs tracking-[0.3em] text-white/20 hover:text-gold transition-colors uppercase">
            ‹ CRM
          </Link>
          <h1 className="text-4xl sm:text-5xl font-extralight tracking-[0.2em] text-white uppercase mt-3">Estatísticas</h1>
          <p className="text-white/20 text-xs tracking-[0.3em] mt-2 uppercase">{total} leads analisadas</p>
        </div>
        {/* Filtro por ano */}
        <select
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 focus:outline-none focus:border-gold/40 tracking-wide"
        >
          {years.map(y => <option key={y} value={y} className="bg-zinc-900">{y === 'Todos' ? 'Todos os anos' : y}</option>)}
        </select>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-14">
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <p className="text-white/25 text-[10px] tracking-[0.3em] uppercase mb-3">Total Leads</p>
          <p className="text-3xl font-extralight text-white">{total}</p>
        </div>
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <p className="text-white/25 text-[10px] tracking-[0.3em] uppercase mb-3">Fecharam</p>
          <p className="text-3xl font-extralight text-green-400">{fechados.length}</p>
        </div>
        <div className="bg-white/3 border border-green-500/15 rounded-2xl p-5">
          <p className="text-white/25 text-[10px] tracking-[0.3em] uppercase mb-3">Taxa de Fecho</p>
          <p className="text-3xl font-extralight text-green-300">{taxaFecho}%</p>
        </div>
        <div className="bg-white/3 border border-gold/15 rounded-2xl p-5">
          <p className="text-white/25 text-[10px] tracking-[0.3em] uppercase mb-3">Valor Fechado</p>
          <p className="text-2xl font-extralight text-gold">{valorFechado > 0 ? valorFechado.toLocaleString('pt-PT') + ' €' : '—'}</p>
        </div>
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <p className="text-white/25 text-[10px] tracking-[0.3em] uppercase mb-3">Valor Médio</p>
          <p className="text-2xl font-extralight text-white/80">{valorMedio > 0 ? Math.round(valorMedio).toLocaleString('pt-PT') + ' €' : '—'}</p>
        </div>
        <div className="bg-white/3 border border-blue-500/15 rounded-2xl p-5">
          <p className="text-white/25 text-[10px] tracking-[0.3em] uppercase mb-3">Pipeline Ativo</p>
          <p className="text-2xl font-extralight text-blue-300">{pipelineAtivo > 0 ? pipelineAtivo.toLocaleString('pt-PT') + ' €' : '—'}</p>
        </div>
      </div>

      {/* ── LEADS & FECHOS POR MÊS ── */}
      {monthlyData.length > 0 && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-6">
          <h2 className="text-xs tracking-[0.35em] uppercase text-white/30 mb-6">Leads & Fechos por Mês</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ left: 0, right: 10, bottom: 20 }}>
              <XAxis dataKey="label" tick={{ fill: '#ffffff50', fontSize: 11 }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: '#ffffff30', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff05' }} />
              <Bar dataKey="leads" name="Leads" fill="#60a5fa" radius={[4,4,0,0]} />
              <Bar dataKey="fechos" name="Fechos" fill="#4ade80" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── TABELA MENSAL ── */}
      {monthlyData.length > 0 && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-6 overflow-x-auto">
          <h2 className="text-xs tracking-[0.35em] uppercase text-white/30 mb-6">Detalhe Mensal</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] tracking-[0.3em] uppercase text-white/25 border-b border-white/5">
                <th className="pb-3 font-normal">Mês</th>
                <th className="pb-3 font-normal text-right">Leads</th>
                <th className="pb-3 font-normal text-right">Fechados</th>
                <th className="pb-3 font-normal text-right">Taxa</th>
                <th className="pb-3 font-normal text-right">Valor €</th>
              </tr>
            </thead>
            <tbody>
              {[...monthlyData].reverse().map(row => (
                <tr key={row.key} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="py-3 text-white/60">{row.label}</td>
                  <td className="py-3 text-right text-white/80">{row.leads}</td>
                  <td className="py-3 text-right text-green-400 font-semibold">{row.fechos || '—'}</td>
                  <td className="py-3 text-right">
                    <span className={`text-sm font-bold ${row.taxa >= 50 ? 'text-green-400' : row.taxa >= 25 ? 'text-yellow-400' : 'text-white/30'}`}>
                      {row.taxa > 0 ? `${row.taxa}%` : '—'}
                    </span>
                  </td>
                  <td className="py-3 text-right text-gold">{row.valor > 0 ? row.valor.toLocaleString('pt-PT') + ' €' : '—'}</td>
                </tr>
              ))}
              {/* Totais */}
              <tr className="border-t border-white/10 bg-white/3">
                <td className="py-3 text-white/40 text-xs tracking-widest uppercase font-semibold">Total</td>
                <td className="py-3 text-right text-white font-bold">{total}</td>
                <td className="py-3 text-right text-green-400 font-bold">{fechados.length}</td>
                <td className="py-3 text-right text-green-300 font-bold">{taxaFecho}%</td>
                <td className="py-3 text-right text-gold font-bold">{valorFechado > 0 ? valorFechado.toLocaleString('pt-PT') + ' €' : '—'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── FONTE DE LEADS + TAXA POR FONTE ── */}
      {comoData.length > 0 && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-6 mb-6">
          <h2 className="text-xs tracking-[0.35em] uppercase text-white/30 mb-6">Fonte de Leads</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gráfico de barras agrupadas: leads vs fechos */}
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={comoData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" tick={{ fill: '#ffffff30', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#ffffff60', fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff08' }} />
                <Bar dataKey="leads" name="Leads" fill="#60a5fa" radius={[0,4,4,0]} />
                <Bar dataKey="fechos" name="Fechos" fill="#4ade80" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
            {/* Tabela taxa por fonte */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] tracking-[0.3em] uppercase text-white/25 border-b border-white/5">
                    <th className="pb-3 font-normal">Fonte</th>
                    <th className="pb-3 font-normal text-right">Leads</th>
                    <th className="pb-3 font-normal text-right">Fechos</th>
                    <th className="pb-3 font-normal text-right">Taxa</th>
                  </tr>
                </thead>
                <tbody>
                  {comoData.map(row => (
                    <tr key={row.name} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                      <td className="py-2.5 text-white/60 truncate max-w-[140px]">{row.name}</td>
                      <td className="py-2.5 text-right text-white/70">{row.leads}</td>
                      <td className="py-2.5 text-right text-green-400 font-semibold">{row.fechos || '—'}</td>
                      <td className="py-2.5 text-right">
                        <span className={`font-bold ${row.taxa >= 50 ? 'text-green-400' : row.taxa >= 25 ? 'text-yellow-400' : 'text-white/30'}`}>
                          {row.taxa > 0 ? `${row.taxa}%` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── STATUS + PRIORIDADE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
          <h2 className="text-xs tracking-[0.35em] uppercase text-white/30 mb-6">Distribuição por Status</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={48} paddingAngle={2}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.name] ?? '#6b7280'} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend formatter={v => <span style={{ color: '#ffffff60', fontSize: 11 }}>{v}</span>} iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
          <h2 className="text-xs tracking-[0.35em] uppercase text-white/30 mb-6">Lead Prioridade</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={prioData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={95} innerRadius={48} paddingAngle={3}>
                {prioData.map((entry, i) => (
                  <Cell key={i} fill={PRIO_COLORS[entry.name] ?? '#6b7280'} />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip />} />
              <Legend formatter={v => <span style={{ color: '#ffffff60', fontSize: 11 }}>{v}</span>} iconType="circle" iconSize={8} />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

    </main>
  )
}
