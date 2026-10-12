'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Legend } from 'recharts'
import RelatorioReuniao, { ANALISE_COLS, DIMENSOES, NotaAnel, fmtData, type Analise } from './RelatorioReuniao'

type Lead = { id: string; nome: string | null; status: string | null }
type Filtro = 'Todos' | 'Fechou' | 'Não fechou' | 'Em aberto'

const NAO_FECHOU = ['NÃO FECHOU', 'Encerrado', 'Cancelado', 'Sem resposta']
function grupo(status: string | null | undefined): Exclude<Filtro, 'Todos'> {
  if (status === 'Fechou') return 'Fechou'
  if (status && NAO_FECHOU.includes(status)) return 'Não fechou'
  return 'Em aberto'
}
const COR_GRUPO: Record<string, string> = {
  Fechou: 'text-green-400 border-green-500/30 bg-green-500/10',
  'Não fechou': 'text-red-300 border-red-500/30 bg-red-500/10',
  'Em aberto': 'text-yellow-200 border-yellow-500/30 bg-yellow-500/10',
}

function media(nums: number[]) {
  return nums.length ? Math.round((nums.reduce((s, n) => s + n, 0) / nums.length) * 10) / 10 : null
}

function KPI({ label, value, sub, color = 'text-white' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
      <p className="text-white/25 text-[10px] tracking-[0.3em] uppercase mb-3">{label}</p>
      <p className={`text-3xl font-extralight ${color}`}>{value}</p>
      {sub && <p className="text-white/25 text-[10px] mt-1 tracking-wider">{sub}</p>}
    </div>
  )
}

export default function AnalisesPage() {
  const [analises, setAnalises] = useState<Analise[]>([])
  const [leads, setLeads] = useState<Record<string, Lead>>({})
  const [loading, setLoading] = useState(true)
  const [selId, setSelId] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('Todos')
  const [categoria, setCategoria] = useState<string | null>(null)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('crm_analises_reuniao').select(ANALISE_COLS)
        .order('data_reuniao', { ascending: false }).limit(300)
      const lista = (data ?? []) as Analise[]
      const ids = Array.from(new Set(lista.map(a => a.contact_id)))
      if (ids.length) {
        const { data: ls } = await supabase.from('crm_contacts').select('id,nome,status').in('id', ids)
        setLeads(Object.fromEntries((ls ?? []).map(l => [l.id, l])))
      }
      setAnalises(lista)
      const pedido = new URLSearchParams(window.location.search).get('id')
      setSelId(pedido && lista.some(a => a.id === pedido) ? pedido : lista[0]?.id ?? null)
      setLoading(false)
    })()
  }, [])

  // Fraquezas recorrentes por categoria (todas as reuniões)
  const categorias = useMemo(() => {
    const m: Record<string, { total: number; altas: number }> = {}
    analises.forEach(a => (a.pontos_fracos ?? []).forEach(p => {
      const k = p.categoria || 'Outros'
      m[k] = m[k] || { total: 0, altas: 0 }
      m[k].total++
      if (p.gravidade === 'alta') m[k].altas++
    }))
    return Object.entries(m).sort((x, y) => y[1].total - x[1].total)
  }, [analises])
  const maxCat = categorias[0]?.[1].total ?? 1

  const filtradas = useMemo(() => analises.filter(a => {
    const lead = leads[a.contact_id]
    if (filtro !== 'Todos' && grupo(lead?.status) !== filtro) return false
    if (categoria && !(a.pontos_fracos ?? []).some(p => (p.categoria || 'Outros') === categoria)) return false
    if (busca && !(lead?.nome ?? '').toLowerCase().includes(busca.toLowerCase())) return false
    return true
  }), [analises, leads, filtro, categoria, busca])

  const sel = analises.find(a => a.id === selId) ?? null
  const notaMedia = media(analises.map(a => Number(a.nota)).filter(n => !isNaN(n)))
  const medias = Object.fromEntries(DIMENSOES.map(d => [d.key, media(analises.map(a => a.scores?.[d.key]).filter((n): n is number => typeof n === 'number'))]))
  const pior = DIMENSOES.filter(d => medias[d.key] != null).sort((x, y) => (medias[x.key] ?? 0) - (medias[y.key] ?? 0))[0]
  const encerradas = analises.filter(a => grupo(leads[a.contact_id]?.status) !== 'Em aberto')
  const fecharam = encerradas.filter(a => grupo(leads[a.contact_id]?.status) === 'Fechou').length
  const radarData = DIMENSOES.map(d => ({ dim: d.label, media: medias[d.key] ?? 0, sel: sel?.scores?.[d.key] ?? 0 }))

  if (loading) {
    return <main className="min-h-screen flex items-center justify-center text-white/30 text-sm tracking-widest">A carregar análises…</main>
  }

  return (
    <main className="min-h-screen px-4 sm:px-6 py-10 max-w-[1400px] mx-auto">
      <div className="mb-8">
        <Link href="/crm" className="text-xs tracking-[0.3em] text-white/20 hover:text-gold transition-colors uppercase">‹ CRM</Link>
        <h1 className="text-4xl sm:text-5xl font-extralight tracking-[0.2em] text-white uppercase mt-3">Análise de Reuniões</h1>
        <p className="text-white/30 text-sm mt-2">Avaliação crítica de cada reunião com noivos: o que funcionou, o que fez perder a venda e o que mudar.</p>
      </div>

      {analises.length === 0 ? (
        <p className="text-white/40 text-sm">Ainda não há reuniões analisadas.</p>
      ) : (<>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <KPI label="Reuniões analisadas" value={String(analises.length)} />
          <KPI label="Nota média" value={notaMedia != null ? notaMedia.toLocaleString('pt-PT') : '—'} sub="de 0 a 10" color={notaMedia != null && notaMedia >= 7.5 ? 'text-green-400' : notaMedia != null && notaMedia >= 5 ? 'text-yellow-300' : 'text-red-400'} />
          <KPI label="Taxa de fecho" value={encerradas.length ? `${Math.round((fecharam / encerradas.length) * 100)}%` : '—'} sub={`${fecharam} de ${encerradas.length} encerradas`} color="text-gold" />
          <KPI label="Ponto mais fraco" value={pior?.label ?? '—'} sub={pior ? `média ${medias[pior.key]?.toLocaleString('pt-PT')} / 10` : undefined} color="text-red-400" />
        </div>

        <div className="grid lg:grid-cols-2 gap-3 mb-6">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <p className="text-white/25 text-[10px] tracking-[0.3em] uppercase mb-1">Perfil de vendedor</p>
            <p className="text-white/40 text-xs mb-2">Média de todas as reuniões{sel ? ' vs reunião selecionada' : ''}</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="dim" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                  <Radar name="Média" dataKey="media" stroke="#C9A84C" fill="#C9A84C" fillOpacity={0.25} />
                  {sel && <Radar name={leads[sel.contact_id]?.nome ?? 'Selecionada'} dataKey="sel" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.15} />}
                  <Legend wrapperStyle={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
            <p className="text-white/25 text-[10px] tracking-[0.3em] uppercase mb-1">Fraquezas recorrentes</p>
            <p className="text-white/40 text-xs mb-4">Clica numa área para ver só as reuniões onde falhou</p>
            <div className="flex flex-col gap-3">
              {categorias.map(([k, v]) => (
                <button key={k} onClick={() => setCategoria(categoria === k ? null : k)}
                  className={`text-left rounded-xl px-3 py-2 border transition-all ${categoria === k ? 'border-gold/50 bg-gold/10' : 'border-transparent hover:bg-white/5'}`}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className={categoria === k ? 'text-gold' : 'text-white/70'}>{k}</span>
                    <span className="text-white/40">{v.total} {v.total === 1 ? 'falha' : 'falhas'}{v.altas ? ` · ${v.altas} graves` : ''}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/8 overflow-hidden flex">
                    <div className="h-full bg-red-400" style={{ width: `${(v.altas / maxCat) * 100}%` }} />
                    <div className="h-full bg-yellow-400/70" style={{ width: `${((v.total - v.altas) / maxCat) * 100}%` }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {(['Todos', 'Fechou', 'Não fechou', 'Em aberto'] as Filtro[]).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg border transition-all ${filtro === f ? 'border-gold/60 text-gold bg-gold/10' : 'border-white/10 text-white/40 hover:text-white/70'}`}>
              {f}
            </button>
          ))}
          {categoria && (
            <button onClick={() => setCategoria(null)} className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg border border-gold/40 text-gold">
              {categoria} ✕
            </button>
          )}
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Procurar noivos…"
            className="ml-auto w-full sm:w-56 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-gold/50" />
        </div>

        <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">
          <div className="flex flex-col gap-2">
            {filtradas.length === 0 && <p className="text-white/30 text-sm px-2">Nenhuma reunião com estes filtros.</p>}
            {filtradas.map(a => {
              const lead = leads[a.contact_id]
              const g = grupo(lead?.status)
              const ativo = a.id === selId
              return (
                <div key={a.id}>
                  <button onClick={() => setSelId(ativo ? null : a.id)}
                    className={`w-full text-left flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all ${ativo ? 'border-gold/50 bg-gold/[0.07]' : 'border-white/8 bg-white/3 hover:border-white/20'}`}>
                    <NotaAnel nota={a.nota} size={46} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{lead?.nome ?? 'Lead apagada'}</p>
                      <p className="text-white/35 text-[11px] mt-0.5">{fmtData(a.data_reuniao)} · {(a.pontos_fracos ?? []).filter(p => p.gravidade === 'alta').length} falhas graves</p>
                    </div>
                    <span className={`text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 rounded-full border shrink-0 ${COR_GRUPO[g]}`}>{g}</span>
                  </button>
                  {/* Em ecrã pequeno o relatório abre logo por baixo do cartão */}
                  {ativo && (
                    <div className="lg:hidden mt-2 bg-white/3 border border-white/8 rounded-2xl p-5">
                      <RelatorioReuniao a={a} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="hidden lg:block sticky top-6">
            {sel ? (
              <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xs tracking-[0.3em] text-gold uppercase">{leads[sel.contact_id]?.nome ?? 'Reunião'}</h2>
                  <Link href={`/crm/${sel.contact_id}`} className="text-[10px] tracking-[0.2em] uppercase text-white/40 hover:text-gold transition-colors">Abrir ficha →</Link>
                </div>
                <RelatorioReuniao key={sel.id} a={sel} />
              </div>
            ) : (
              <p className="text-white/30 text-sm">Escolhe uma reunião para ver o relatório.</p>
            )}
          </div>
        </div>
      </>)}
    </main>
  )
}
