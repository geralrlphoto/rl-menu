'use client'

import { useEffect, useMemo, useRef, useState, Suspense } from 'react'
import Link from 'next/link'
import { FUNDO } from '@/app/media/_lib/estilo'
import { lerData, hojeLisboa } from '@/app/media/_lib/eventos'
import GraficoMensal, { type MesGrafico } from './GraficoMensal'

// ─── tipos ───────────────────────────────────────────────────────────────────

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

type Prestacao = {
  key: string; ref: string; nome: string; cliente: string
  descricao: string; valor: number; estado: string; data: string
  d: Date | null; vencida: boolean
}

type Tab = 'projetos' | 'despesas'
type FiltroProj = 'todos' | 'atraso' | 'aberto' | 'pagos'
type OrdemProj = 'recente' | 'valor' | 'falta'
type PeriodoId = 'mes' | '3m' | '12m' | 'ano' | 'tudo'
type Intervalo = { ini: Date; fim: Date } | null

// ─── constantes ──────────────────────────────────────────────────────────────

const CATEGORIAS = [
  { id: 'freelancer',  label: 'Freelancer',  color: '#2e6cf6' },
  { id: 'equipamento', label: 'Equipamento', color: '#5a8bff' },
  { id: 'software',    label: 'Software',    color: '#a9c1ff' },
  { id: 'deslocacao',  label: 'Deslocação',  color: '#ffffff' },
  { id: 'marketing',   label: 'Marketing',   color: '#7fa6ff' },
  { id: 'outro',       label: 'Outro',       color: '#7c8893' },
]
const CAT_MAP = Object.fromEntries(CATEGORIAS.map(c => [c.id, c]))

const ESTADO_PILL: Record<string, { label: string; cls: string }> = {
  pago:      { label: 'Pago',      cls: 'border-[#2e6cf6]/50 bg-[#2e6cf6]/15 text-[#a9c1ff]' },
  pendente:  { label: 'Pendente',  cls: 'border-white/15 bg-white/[0.04] text-white/60' },
  em_atraso: { label: 'Em atraso', cls: 'border-[#ff4747]/50 bg-[#ff4747]/10 text-[#ff4747]' },
}

const PERIODOS: { id: PeriodoId; nome: string }[] = [
  { id: 'mes',  nome: 'Este mês' },
  { id: '3m',   nome: '3 meses' },
  { id: '12m',  nome: '12 meses' },
  { id: 'ano',  nome: 'Este ano' },
  { id: 'tudo', nome: 'Tudo' },
]

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const DIA = 86400000

const EMPTY_FORM = { data: '', descricao: '', categoria: 'outro', valor: '', projeto_ref: '', notas: '' }

// ─── utilitários ─────────────────────────────────────────────────────────────

function fmt(n: number) {
  return n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}
function fmt0(n: number) {
  return n.toLocaleString('pt-PT', { maximumFractionDigits: 0 }) + ' €'
}
const soma = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0)

function intervalo(id: PeriodoId, hoje: Date): Intervalo {
  const a = hoje.getFullYear(), m = hoje.getMonth()
  switch (id) {
    case 'mes': return { ini: new Date(a, m, 1),      fim: new Date(a, m + 1, 1) }
    case '3m':  return { ini: new Date(a, m - 2, 1),  fim: new Date(a, m + 1, 1) }
    case '12m': return { ini: new Date(a, m - 11, 1), fim: new Date(a, m + 1, 1) }
    case 'ano': return { ini: new Date(a, 0, 1),      fim: new Date(a + 1, 0, 1) }
    default:    return null
  }
}

// Mesmo número de meses, imediatamente antes
function anterior(iv: Intervalo): Intervalo {
  if (!iv) return null
  const n = (iv.fim.getFullYear() - iv.ini.getFullYear()) * 12 + iv.fim.getMonth() - iv.ini.getMonth()
  return { ini: new Date(iv.ini.getFullYear(), iv.ini.getMonth() - n, 1), fim: iv.ini }
}

const dentro = (d: Date | null, iv: Intervalo) => !iv || (!!d && d >= iv.ini && d < iv.fim)

const dataCurta = (d: Date) => d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })

function quando(d: Date | null, hoje: Date) {
  if (!d) return 'sem data'
  const dias = Math.round((d.getTime() - hoje.getTime()) / DIA)
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  if (dias === -1) return 'ontem'
  if (dias > 0) return `daqui a ${dias} dias`
  return `há ${-dias} dias`
}

// ─── estilos partilhados ─────────────────────────────────────────────────────

const CARTAO   = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/70'
const PILLS    = 'flex flex-wrap gap-1 rounded-full border border-white/[0.12] bg-[#00141f]/60 p-1'
const pill     = (on: boolean) => `rounded-full px-3.5 py-1.5 text-[12px] transition-colors ${on ? 'bg-[#2e6cf6] text-white' : 'text-white/55 hover:text-white'}`
const LABEL    = 'rlp-m text-[9.5px] text-white/45 block mb-1.5'
const INPUT    = 'w-full rounded-xl bg-[#00141f]/80 border border-white/[0.1] focus:border-[#2e6cf6]/70 focus:outline-none px-3.5 py-2.5 text-[13.5px] text-white/85 placeholder:text-white/25 transition-colors [color-scheme:dark]'
const BTN_AZUL = 'rounded-full bg-[#2e6cf6] hover:bg-[#3d79ff] px-6 py-3 text-[13.5px] font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
const BTN_LINHA = 'rounded-full border border-white/25 hover:border-white/50 px-5 py-3 text-[13.5px] text-white/85 hover:text-white transition-colors'

// ─── componente principal ────────────────────────────────────────────────────

function FinancasMediaContent() {
  const [tab, setTab]           = useState<Tab>('projetos')
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [loading, setLoading]   = useState(true)

  const [periodo, setPeriodo]   = useState<PeriodoId>('tudo')

  // form despesa
  const [showForm, setShowForm]     = useState(false)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [filtroCat, setFiltroCat]   = useState<string>('todas')

  // projetos
  const [expandedRef, setExpandedRef] = useState<string | null>(null)
  const [filtroProj, setFiltroProj]   = useState<FiltroProj>('todos')
  const [ordemProj, setOrdemProj]     = useState<OrdemProj>('recente')
  const [pesquisa, setPesquisa]       = useState('')

  const formRef  = useRef<HTMLDivElement>(null)
  const listaRef = useRef<HTMLDivElement>(null)

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
      setDespesas(dData.despesas ?? [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  // ── despesa: guardar / apagar / editar ─────────────────────────────────────

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

  const deleteDespesa = async (d: Despesa) => {
    if (!window.confirm(`Apagar a despesa "${d.descricao}" (${fmt(Number(d.valor))})?`)) return
    setDeletingId(d.id)
    await fetch(`/api/financas-media/despesas/${d.id}`, { method: 'DELETE' })
    setDespesas(ds => ds.filter(x => x.id !== d.id))
    setDeletingId(null)
  }

  const irParaForm = () => setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)

  const startEdit = (d: Despesa) => {
    setForm({
      data: d.data, descricao: d.descricao, categoria: d.categoria,
      valor: String(d.valor), projeto_ref: d.projeto_ref ?? '', notas: d.notas ?? '',
    })
    setEditingId(d.id)
    setShowForm(true)
    irParaForm()
  }

  const novaDespesa = () => {
    setTab('despesas')
    setEditingId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
    irParaForm()
  }

  const fecharForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM) }

  const verProjetos = (f: FiltroProj) => {
    setTab('projetos')
    setFiltroProj(f)
    setTimeout(() => listaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  // ── cálculos ───────────────────────────────────────────────────────────────

  const hoje = useMemo(() => hojeLisboa(), [])
  const iv   = useMemo(() => intervalo(periodo, hoje), [periodo, hoje])

  const prestacoes: Prestacao[] = useMemo(() => projetos.flatMap(p => p.pagamentos.map((pg, i) => {
    const d = lerData(pg.data)
    return {
      key: `${p.ref}-${i}`, ref: p.ref, nome: p.nome, cliente: p.cliente,
      descricao: pg.descricao, valor: Number(pg.valor) || 0, estado: pg.estado, data: pg.data, d,
      vencida: pg.estado === 'em_atraso' || (pg.estado === 'pendente' && !!d && d < hoje),
    }
  })), [projetos, hoje])

  const despesasD = useMemo(() => despesas.map(d => ({ ...d, d: lerData(d.data) })), [despesas])

  const totaisDe = (intv: Intervalo) => {
    const ps = prestacoes.filter(x => dentro(x.d, intv))
    const ds = despesasD.filter(x => dentro(x.d, intv))
    const recebido = soma(ps.filter(x => x.estado === 'pago'), x => x.valor)
    const desp = soma(ds, x => Number(x.valor))
    return {
      faturado:   soma(ps, x => x.valor),
      recebido,
      porReceber: soma(ps.filter(x => x.estado !== 'pago' && !x.vencida), x => x.valor),
      despesas:   desp,
      margem:     recebido - desp,
      nPrest:     ps.filter(x => x.estado !== 'pago' && !x.vencida).length,
    }
  }

  const t    = totaisDe(iv)
  const tAnt = iv ? totaisDe(anterior(iv)) : null
  const variacao = (a: number, b: number | undefined) => (b === undefined || b === 0 ? null : Math.round(((a - b) / Math.abs(b)) * 100))

  // Atraso não depende do período: é um alerta
  const vencidas   = useMemo(() => prestacoes.filter(x => x.vencida)
    .sort((a, b) => (a.d?.getTime() ?? Infinity) - (b.d?.getTime() ?? Infinity)), [prestacoes])
  const totalAtraso = soma(vencidas, x => x.valor)
  const proximas   = useMemo(() => prestacoes.filter(x => x.estado !== 'pago' && !x.vencida && x.d)
    .sort((a, b) => a.d!.getTime() - b.d!.getTime()), [prestacoes])
  const semData    = prestacoes.filter(x => !x.d && x.estado !== 'pago').length

  const totalDespesas = soma(despesas, d => Number(d.valor))

  // Gráfico: 12 meses para trás + 3 para a frente
  const meses: MesGrafico[] = useMemo(() => {
    const a = hoje.getFullYear(), m = hoje.getMonth()
    return Array.from({ length: 15 }, (_, i) => {
      const ini = new Date(a, m - 11 + i, 1)
      const fim = new Date(a, m - 10 + i, 1)
      const mi = { ini, fim }
      const ps = prestacoes.filter(x => dentro(x.d, mi))
      return {
        chave: `${ini.getFullYear()}-${ini.getMonth()}`,
        rotulo: MESES_CURTOS[ini.getMonth()],
        ano: ini.getFullYear(),
        recebido:   soma(ps.filter(x => x.estado === 'pago'), x => x.valor),
        porReceber: soma(ps.filter(x => x.estado !== 'pago' && !x.vencida), x => x.valor),
        atraso:     soma(ps.filter(x => x.vencida), x => x.valor),
        despesas:   soma(despesasD.filter(x => dentro(x.d, mi)), x => Number(x.valor)),
        atual: i === 11,
        futuro: i > 11,
        noPeriodo: !iv || (ini >= iv.ini && ini < iv.fim),
      }
    })
  }, [prestacoes, despesasD, hoje, iv])
  const ultimos12 = meses.slice(0, 12)
  const rec12 = soma(ultimos12, m => m.recebido)
  const desp12 = soma(ultimos12, m => m.despesas)

  // Projetos com estado calculado
  const projetosInfo = useMemo(() => projetos.map(p => {
    const minhas = prestacoes.filter(x => x.ref === p.ref)
    const vencido = soma(minhas.filter(x => x.vencida), x => x.valor)
    const falta = p.totalValor - p.totalPago
    const proxima = minhas.filter(x => x.estado !== 'pago' && !x.vencida && x.d).sort((a, b) => a.d!.getTime() - b.d!.getTime())[0]
    const estado: 'pago' | 'atraso' | 'aberto' | 'vazio' =
      p.totalValor <= 0 ? 'vazio' : vencido > 0 ? 'atraso' : falta <= 0 ? 'pago' : 'aberto'
    return { p, vencido, falta, proxima, estado, pct: p.totalValor > 0 ? Math.min(100, (p.totalPago / p.totalValor) * 100) : 0 }
  }), [projetos, prestacoes])

  const contagem = {
    todos:  projetosInfo.length,
    atraso: projetosInfo.filter(x => x.estado === 'atraso').length,
    aberto: projetosInfo.filter(x => x.estado === 'aberto' || x.estado === 'atraso').length,
    pagos:  projetosInfo.filter(x => x.estado === 'pago').length,
  }

  const projetosVisiveis = useMemo(() => {
    const q = pesquisa.trim().toLowerCase()
    let lista = projetosInfo.filter(x =>
      filtroProj === 'todos' ? true
      : filtroProj === 'atraso' ? x.estado === 'atraso'
      : filtroProj === 'aberto' ? x.estado === 'aberto' || x.estado === 'atraso'
      : x.estado === 'pago')
    if (q) lista = lista.filter(x => [x.p.nome, x.p.cliente, x.p.ref, x.p.tipo].some(v => (v ?? '').toLowerCase().includes(q)))
    if (ordemProj === 'valor') lista = [...lista].sort((a, b) => b.p.totalValor - a.p.totalValor)
    if (ordemProj === 'falta') lista = [...lista].sort((a, b) => (b.vencido - a.vencido) || (b.falta - a.falta))
    return lista
  }, [projetosInfo, filtroProj, ordemProj, pesquisa])

  // Despesas do período + categoria
  const despesasPeriodo = useMemo(() => despesasD.filter(x => dentro(x.d, iv)), [despesasD, iv])
  const despesasVisiveis = useMemo(() => despesasPeriodo
    .filter(x => filtroCat === 'todas' || x.categoria === filtroCat)
    .sort((a, b) => (b.d?.getTime() ?? 0) - (a.d?.getTime() ?? 0)), [despesasPeriodo, filtroCat])
  const totalVisiveis = soma(despesasVisiveis, x => Number(x.valor))
  const porCategoria = CATEGORIAS.map(c => {
    const ds = despesasPeriodo.filter(d => d.categoria === c.id)
    return { ...c, total: soma(ds, d => Number(d.valor)), n: ds.length }
  }).filter(c => c.n > 0).sort((a, b) => b.total - a.total)
  const maxCat = Math.max(1, ...porCategoria.map(c => c.total))
  const nomeProjeto = (ref: string | null) => (ref ? projetos.find(p => p.ref === ref)?.nome || ref : '')

  const nomePeriodo = PERIODOS.find(p => p.id === periodo)!.nome.toLowerCase()

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const vRec = variacao(t.recebido, tAnt?.recebido)
  const pctRecebido = t.faturado > 0 ? Math.round((t.recebido / t.faturado) * 100) : 0
  const pctMargem = t.recebido > 0 ? Math.round((t.margem / t.recebido) * 100) : null

  const KPI_CLS = `${CARTAO} px-5 py-4 text-left`

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <main className="rlp min-h-screen relative text-white">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-8 pb-16">

        <Link href="/media" className="text-[12px] text-white/45 hover:text-white transition-colors">‹ RL Prod</Link>

        {/* ── cabeçalho ── */}
        <div className="mt-6 mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="rlp-m traco text-[11px] text-[#5a8bff]">RL Prod · Financeiro</p>
            <h1 className="rlp-t mt-3 text-[48px] sm:text-[64px] leading-[0.95]">
              Finanças<span className="text-[#5a8bff]">.</span>
            </h1>
            <p className="mt-3 text-[14px] text-white/55">
              {loading ? 'A carregar…' : `${projetos.length} projetos · ${prestacoes.length} prestações · ${despesas.length} despesas lançadas`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={fetchAll} disabled={loading} className={`${BTN_LINHA} disabled:opacity-40`}>
              {loading ? 'A atualizar…' : '↻ Atualizar'}
            </button>
            <button onClick={novaDespesa} className={BTN_AZUL} style={{ boxShadow: '0 10px 30px -10px rgba(46,108,246,0.7)' }}>
              + Nova despesa
            </button>
          </div>
        </div>

        {/* ── período + KPIs ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Resumo</p>
          <div className={PILLS}>
            {PERIODOS.map(p => (
              <button key={p.id} onClick={() => setPeriodo(p.id)} className={pill(periodo === p.id)}>{p.nome}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className={KPI_CLS}>
            <p className="rlp-m text-[9.5px] text-white/45">Faturado</p>
            <p className="rlp-t mt-2 text-[28px] leading-none text-white">{fmt0(t.faturado)}</p>
            <p className="mt-2 text-[11.5px] text-white/40">prestações com data no período</p>
          </div>
          <div className={KPI_CLS}>
            <p className="rlp-m text-[9.5px] text-white/45">Recebido</p>
            <p className="rlp-t mt-2 text-[28px] leading-none text-[#5a8bff]">{fmt0(t.recebido)}</p>
            <div className="mt-2 h-1 rounded-full bg-white/[0.08] overflow-hidden">
              <div className="h-full rounded-full bg-[#2e6cf6] transition-all duration-700" style={{ width: `${pctRecebido}%` }} />
            </div>
            <p className={`mt-1.5 text-[11.5px] ${vRec === null ? 'text-white/40' : vRec >= 0 ? 'text-[#5a8bff]' : 'text-[#ff4747]'}`}>
              {vRec === null ? `${pctRecebido}% do faturado` : `${vRec >= 0 ? '▲' : '▼'} ${Math.abs(vRec)}% vs período anterior`}
            </p>
          </div>
          <button onClick={() => verProjetos('aberto')} className={`${KPI_CLS} hover:border-[#2e6cf6]/70 transition-colors`}>
            <p className="rlp-m text-[9.5px] text-white/45">Por receber</p>
            <p className="rlp-t mt-2 text-[28px] leading-none text-white">{fmt0(t.porReceber)}</p>
            <p className="mt-2 text-[11.5px] text-white/40">{t.nPrest === 1 ? '1 prestação a vencer' : `${t.nPrest} prestações a vencer`}</p>
          </button>
          <button onClick={() => verProjetos('atraso')}
            className={`${KPI_CLS} transition-colors ${totalAtraso > 0 ? 'border-[#ff4747]/45 hover:border-[#ff4747]/80' : 'hover:border-[#2e6cf6]/70'}`}>
            <p className={`rlp-m text-[9.5px] ${totalAtraso > 0 ? 'text-[#ff4747]' : 'text-white/45'}`}>Em atraso</p>
            <p className={`rlp-t mt-2 text-[28px] leading-none ${totalAtraso > 0 ? 'text-[#ff4747]' : 'text-white'}`}>{fmt0(totalAtraso)}</p>
            <p className="mt-2 text-[11.5px] text-white/40">
              {vencidas.length === 0 ? 'nada em atraso' : vencidas.length === 1 ? '1 prestação, sempre visível' : `${vencidas.length} prestações, sempre visíveis`}
            </p>
          </button>
          <button onClick={() => setTab('despesas')} className={`${KPI_CLS} hover:border-[#2e6cf6]/70 transition-colors`}>
            <p className="rlp-m text-[9.5px] text-white/45">Despesas</p>
            <p className="rlp-t mt-2 text-[28px] leading-none text-[#a9c1ff]">{fmt0(t.despesas)}</p>
            <p className="mt-2 text-[11.5px] text-white/40">{despesasPeriodo.length === 1 ? '1 despesa' : `${despesasPeriodo.length} despesas`}</p>
          </button>
          <div className={KPI_CLS}>
            <p className="rlp-m text-[9.5px] text-white/45">Margem</p>
            <p className={`rlp-t mt-2 text-[28px] leading-none ${t.margem < 0 ? 'text-[#ff4747]' : 'text-white'}`}>{fmt0(t.margem)}</p>
            <p className="mt-2 text-[11.5px] text-white/40">
              {pctMargem === null ? 'recebido menos despesas' : `${pctMargem}% do recebido`}
            </p>
          </div>
        </div>

        {periodo !== 'tudo' && semData > 0 && (
          <p className="mt-3 text-[12px] text-white/40">
            {semData === 1 ? '1 prestação por pagar não tem data' : `${semData} prestações por pagar não têm data`} e só conta em “Tudo”.
          </p>
        )}

        {/* ── gráfico + a acompanhar ── */}
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3">
          <div className={`${CARTAO} px-5 sm:px-6 py-5`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-6">
              <div>
                <p className="rlp-m text-[10px] text-[#5a8bff]">Mês a mês</p>
                <h2 className="rlp-t mt-1 text-[20px]">Recebido vs despesas</h2>
              </div>
              <p className="text-[12px] text-white/45">
                Últimos 12 meses: <span className="text-white/85">{fmt0(rec12)}</span> recebidos,{' '}
                <span className="text-white/85">{fmt0(desp12)}</span> em despesas
              </p>
            </div>
            <GraficoMensal meses={meses} fmt={fmt0} />
          </div>

          <div className={`${CARTAO} px-5 sm:px-6 py-5 flex flex-col`}>
            <div className="flex items-baseline justify-between gap-2 mb-4">
              <div>
                <p className="rlp-m text-[10px] text-[#5a8bff]">A acompanhar</p>
                <h2 className="rlp-t mt-1 text-[20px]">Pagamentos</h2>
              </div>
              <span className="text-[11.5px] text-white/40">{vencidas.length} em atraso · {proximas.length} a vencer</span>
            </div>
            <ul className="space-y-2 overflow-y-auto max-h-[300px] pr-1 -mr-1">
              {vencidas.length === 0 && proximas.length === 0 && (
                <li className="text-[13px] text-white/40">Nada por receber. Tudo em dia.</li>
              )}
              {[...vencidas, ...proximas.slice(0, 6)].map(x => (
                <li key={x.key}>
                  <Link href={`/portal-media/${x.ref}/pagamentos`}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                      x.vencida ? 'border-[#ff4747]/30 bg-[#ff4747]/[0.05] hover:border-[#ff4747]/60' : 'border-white/[0.08] bg-white/[0.025] hover:border-[#2e6cf6]/60'}`}>
                    <span className={`w-11 shrink-0 text-center leading-none ${x.vencida ? 'text-[#ff4747]' : 'text-[#5a8bff]'}`}>
                      {x.d ? (
                        <>
                          <span className="rlp-t block text-[20px]">{x.d.getDate()}</span>
                          <span className="rlp-m block text-[8.5px] mt-0.5 tracking-[0.15em]">{MESES_CURTOS[x.d.getMonth()]}</span>
                        </>
                      ) : <span className="rlp-m text-[8.5px] tracking-[0.15em]">s/ data</span>}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate text-[13px] text-white/90">{x.nome || x.ref}</span>
                      <span className="block truncate text-[11px] text-white/45">{x.descricao || 'Prestação'} · {quando(x.d, hoje)}</span>
                    </span>
                    <span className={`shrink-0 text-[13px] font-medium ${x.vencida ? 'text-[#ff4747]' : 'text-white/85'}`}>{fmt0(x.valor)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {proximas.length > 6 && (
              <button onClick={() => verProjetos('aberto')} className="mt-3 self-start text-[11.5px] text-[#5a8bff] hover:underline">
                + {proximas.length - 6} a vencer mais tarde
              </button>
            )}
          </div>
        </div>

        {/* ── separadores ── */}
        <div ref={listaRef} className="mt-12 mb-5 flex flex-wrap items-center justify-between gap-3 scroll-mt-6">
          <div className="flex gap-1 rounded-full border border-white/[0.12] bg-[#00141f]/60 p-1">
            {([['projetos', `Projetos · ${projetos.length}`], ['despesas', `Despesas · ${despesas.length}`]] as [Tab, string][]).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`rounded-full px-5 py-2 text-[13px] transition-colors ${tab === id ? 'bg-[#2e6cf6] text-white' : 'text-white/55 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'despesas' && (
            <button onClick={() => (showForm && !editingId ? fecharForm() : novaDespesa())} className={BTN_LINHA}>
              {showForm && !editingId ? '✕ Cancelar' : '+ Nova despesa'}
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PROJETOS                                                          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'projetos' && (
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className={PILLS}>
                {([
                  ['todos', 'Todos', contagem.todos],
                  ['atraso', 'Em atraso', contagem.atraso],
                  ['aberto', 'Por receber', contagem.aberto],
                  ['pagos', 'Pagos', contagem.pagos],
                ] as [FiltroProj, string, number][]).map(([id, label, n]) => (
                  <button key={id} onClick={() => setFiltroProj(id)} className={pill(filtroProj === id)}>
                    {label} <span className={filtroProj === id ? 'text-white/70' : id === 'atraso' && n > 0 ? 'text-[#ff4747]' : 'text-white/35'}>{n}</span>
                  </button>
                ))}
              </div>
              <input value={pesquisa} onChange={e => setPesquisa(e.target.value)} placeholder="Procurar projeto ou cliente"
                className="flex-1 min-w-[180px] rounded-full bg-[#00141f]/60 border border-white/[0.12] focus:border-[#2e6cf6]/70 focus:outline-none px-4 py-2 text-[13px] text-white/85 placeholder:text-white/30" />
              <select value={ordemProj} onChange={e => setOrdemProj(e.target.value as OrdemProj)}
                className="rounded-full bg-[#00141f] border border-white/[0.12] focus:outline-none px-4 py-2 text-[13px] text-white/75 [color-scheme:dark]">
                <option value="recente">Mais recentes</option>
                <option value="valor">Maior valor</option>
                <option value="falta">Mais em falta</option>
              </select>
            </div>

            <div className="space-y-2.5">
              {projetosVisiveis.length === 0 && !loading && (
                <div className={`${CARTAO} px-8 py-14 text-center`}>
                  <p className="rlp-m text-[11px] text-white/40">{projetos.length === 0 ? 'Nenhum projeto encontrado' : 'Nenhum projeto neste filtro'}</p>
                </div>
              )}

              {projetosVisiveis.map(({ p, vencido, falta, proxima, estado, pct }) => {
                const isOpen = expandedRef === p.ref
                const badge = estado === 'pago' ? { t: 'Pago', c: 'border-[#2e6cf6]/50 bg-[#2e6cf6]/15 text-[#a9c1ff]' }
                  : estado === 'atraso' ? { t: 'Em atraso', c: 'border-[#ff4747]/50 bg-[#ff4747]/10 text-[#ff4747]' }
                  : estado === 'vazio' ? { t: 'Sem prestações', c: 'border-white/15 text-white/45' }
                  : { t: 'Parcial', c: 'border-white/20 bg-white/[0.04] text-white/70' }
                return (
                  <div key={p.ref}
                    className={`${CARTAO} overflow-hidden transition-colors ${isOpen ? 'border-[#2e6cf6]/50' : estado === 'atraso' ? 'border-[#ff4747]/25' : 'hover:border-white/20'}`}>
                    <button onClick={() => setExpandedRef(isOpen ? null : p.ref)}
                      className="w-full px-5 sm:px-6 py-4 grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] items-center gap-x-6 gap-y-3 text-left">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className={`rlp-m shrink-0 text-[8.5px] tracking-[0.2em] px-2.5 py-1 border rounded-full ${badge.c}`}>{badge.t}</span>
                          <p className="truncate text-[15px] text-white/90">{p.nome}</p>
                        </div>
                        <p className="mt-1 truncate text-[12px] text-white/45">
                          {[p.cliente, p.tipo, p.ref].filter(Boolean).join(' · ')}
                        </p>
                      </div>

                      {/* progresso pago */}
                      <div className="col-span-2 md:col-span-1 order-last md:order-none min-w-0">
                        <div className="flex justify-between text-[11.5px] mb-1.5">
                          <span className="text-white/60">{fmt0(p.totalPago)} <span className="text-white/35">de {fmt0(p.totalValor)}</span></span>
                          <span className={estado === 'pago' ? 'text-[#5a8bff]' : 'text-white/60'}>{Math.round(pct)}%</span>
                        </div>
                        <div className="relative h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                          <div className="absolute inset-y-0 left-0 rounded-full bg-[#2e6cf6] transition-all duration-700" style={{ width: `${pct}%` }} />
                          {vencido > 0 && p.totalValor > 0 && (
                            <div className="absolute inset-y-0 rounded-full bg-[#ff4747]/70"
                              style={{ left: `${pct}%`, width: `${Math.min(100 - pct, (vencido / p.totalValor) * 100)}%` }} />
                          )}
                        </div>
                        {proxima && (
                          <p className="mt-1.5 text-[11px] text-white/40">Próxima: {fmt0(proxima.valor)} {quando(proxima.d, hoje)}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="rlp-m text-[8.5px] text-white/40">Em falta</p>
                          <p className={`mt-1 text-[15px] ${vencido > 0 ? 'text-[#ff4747]' : falta > 0 ? 'text-white/90' : 'text-white/35'}`}>{fmt0(Math.max(0, falta))}</p>
                        </div>
                        <span className={`text-white/35 text-[12px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-5 pt-1 border-t border-white/[0.07]">
                        <div className="flex flex-wrap gap-2 py-4">
                          {p.dataFilmagem && <span className="rounded-full border border-white/[0.1] px-3 py-1 text-[11.5px] text-white/60">Filmagem: {p.dataFilmagem}</span>}
                          {p.dataEntrega  && <span className="rounded-full border border-white/[0.1] px-3 py-1 text-[11.5px] text-white/60">Entrega: {p.dataEntrega}</span>}
                          {p.status       && <span className="rounded-full border border-[#2e6cf6]/40 px-3 py-1 text-[11.5px] text-[#a9c1ff]">{p.status}</span>}
                        </div>

                        <div className="space-y-1.5">
                          {p.pagamentos.length === 0 && <p className="text-[12.5px] text-white/40">Sem pagamentos definidos.</p>}
                          {p.pagamentos.map((pg, i) => {
                            const d = lerData(pg.data)
                            const atrasada = pg.estado === 'em_atraso' || (pg.estado === 'pendente' && !!d && d < hoje)
                            const e = atrasada ? ESTADO_PILL.em_atraso : ESTADO_PILL[pg.estado]
                            return (
                              <div key={i}
                                className={`grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_140px_110px_100px] items-center gap-x-4 gap-y-1 rounded-xl border px-4 py-2.5 ${atrasada ? 'border-[#ff4747]/25 bg-[#ff4747]/[0.04]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                                <span className="text-[13px] text-white/80 truncate">{pg.descricao || 'Prestação'}</span>
                                <span className="text-[12px] text-white/45 sm:order-none order-last">
                                  {d ? dataCurta(d) : pg.data || 'Sem data'}
                                  {pg.estado !== 'pago' && d && <span className={`block text-[10.5px] ${atrasada ? 'text-[#ff4747]/80' : 'text-white/35'}`}>{quando(d, hoje)}</span>}
                                </span>
                                <span className="text-[13px] text-white/85 text-right sm:text-left">{fmt(Number(pg.valor))}</span>
                                <span className="justify-self-end sm:justify-self-start">
                                  <span className={`rlp-m text-[8.5px] tracking-[0.18em] px-2.5 py-1 border rounded-full ${e?.cls ?? 'border-white/10 text-white/40'}`}>
                                    {e?.label ?? pg.estado}
                                  </span>
                                </span>
                              </div>
                            )
                          })}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12.5px]">
                          <span className="text-white/50">
                            Total pago <span className="text-[#5a8bff]">{fmt(p.totalPago)}</span>
                            {falta > 0 && <> · em falta <span className={vencido > 0 ? 'text-[#ff4747]' : 'text-white/85'}>{fmt(falta)}</span></>}
                          </span>
                          <Link href={`/portal-media/${p.ref}/pagamentos`}
                            className="rounded-full border border-white/20 hover:border-[#2e6cf6]/70 px-4 py-1.5 text-[12px] text-white/75 hover:text-white transition-colors">
                            Ver portal →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* DESPESAS                                                          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {tab === 'despesas' && (
          <div className="space-y-4">

            {showForm && (
              <div ref={formRef} className="rounded-2xl border border-[#2e6cf6]/50 bg-[#0c2236]/90 px-5 sm:px-6 py-6">
                <div className="flex items-baseline justify-between gap-3 mb-5">
                  <div>
                    <p className="rlp-m text-[10px] text-[#5a8bff]">{editingId ? 'Editar' : 'Lançar'}</p>
                    <h2 className="rlp-t mt-1 text-[22px]">{editingId ? 'Editar despesa' : 'Nova despesa'}</h2>
                  </div>
                  <button onClick={fecharForm} className="text-[12px] text-white/45 hover:text-white">✕ Fechar</button>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className={LABEL}>Data *</label>
                    <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} className={INPUT} />
                  </div>
                  <div className="lg:col-span-2">
                    <label className={LABEL}>Descrição *</label>
                    <input type="text" placeholder="Ex: Freelancer edição vídeo" value={form.descricao}
                      onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} className={INPUT} />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3">
                    <label className={LABEL}>Categoria *</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIAS.map(c => (
                        <button key={c.id} type="button" onClick={() => setForm(f => ({ ...f, categoria: c.id }))}
                          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] transition-colors ${
                            form.categoria === c.id ? 'border-[#2e6cf6] bg-[#2e6cf6]/20 text-white' : 'border-white/[0.12] text-white/60 hover:text-white hover:border-white/30'}`}>
                          <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={LABEL}>Valor (€) *</label>
                    <input type="number" step="0.01" placeholder="0.00" value={form.valor}
                      onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Projeto (opcional)</label>
                    <select value={form.projeto_ref} onChange={e => setForm(f => ({ ...f, projeto_ref: e.target.value }))} className={INPUT}>
                      <option value="">Sem projeto</option>
                      {projetos.map(p => <option key={p.ref} value={p.ref}>{p.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Notas (opcional)</label>
                    <input type="text" placeholder="Notas adicionais" value={form.notas}
                      onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} className={INPUT} />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button onClick={saveDespesa} disabled={saving || !form.data || !form.descricao || !form.valor} className={BTN_AZUL}>
                    {saving ? 'A guardar…' : editingId ? 'Guardar alterações' : 'Adicionar despesa'}
                  </button>
                  <button onClick={fecharForm} className="text-[12.5px] text-white/45 hover:text-white transition-colors">Cancelar</button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.2fr] gap-3 items-start">
              {/* por categoria */}
              <div className={`${CARTAO} px-5 py-5`}>
                <p className="rlp-m text-[10px] text-[#5a8bff]">Por categoria</p>
                <p className="mt-1 text-[12px] text-white/40">{periodo === 'tudo' ? 'Todas as despesas' : `Período: ${nomePeriodo}`}</p>
                <div className="mt-4 space-y-1">
                  {porCategoria.length === 0 && <p className="text-[13px] text-white/40">Sem despesas no período.</p>}
                  {porCategoria.map(c => {
                    const on = filtroCat === c.id
                    return (
                      <button key={c.id} onClick={() => setFiltroCat(on ? 'todas' : c.id)}
                        className={`w-full text-left rounded-xl px-2.5 py-2 transition-colors ${on ? 'bg-[#2e6cf6]/15' : 'hover:bg-white/[0.04]'}`}>
                        <div className="flex items-center justify-between gap-2 text-[12.5px]">
                          <span className="flex items-center gap-2 text-white/80">
                            <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />{c.label}
                            <span className="text-white/35 text-[11px]">{c.n}</span>
                          </span>
                          <span className="text-white/90">{fmt0(c.total)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(c.total / maxCat) * 100}%`, background: c.color, opacity: 0.8 }} />
                        </div>
                      </button>
                    )
                  })}
                </div>
                {filtroCat !== 'todas' && (
                  <button onClick={() => setFiltroCat('todas')} className="mt-3 text-[11.5px] text-[#5a8bff] hover:underline">Mostrar todas as categorias</button>
                )}
                <div className="mt-4 pt-3 border-t border-white/[0.08] flex justify-between text-[12px]">
                  <span className="text-white/45">Total de sempre</span>
                  <span className="text-white/80">{fmt(totalDespesas)}</span>
                </div>
              </div>

              {/* lista */}
              <div className={`${CARTAO} overflow-hidden`}>
                <div className="px-5 py-3.5 border-b border-white/[0.07] flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12.5px] text-white/55">
                    {despesasVisiveis.length === 1 ? '1 despesa' : `${despesasVisiveis.length} despesas`}
                    {filtroCat !== 'todas' && ` em ${CAT_MAP[filtroCat]?.label ?? filtroCat}`}
                    {periodo !== 'tudo' && ` · ${nomePeriodo}`}
                  </p>
                  <p className="text-[13px] text-[#a9c1ff]">{fmt(totalVisiveis)}</p>
                </div>

                {despesasVisiveis.length === 0 ? (
                  <div className="px-8 py-14 text-center">
                    <p className="rlp-m text-[11px] text-white/40">{despesas.length === 0 ? 'Nenhuma despesa lançada' : 'Nenhuma despesa neste filtro'}</p>
                    {despesas.length === 0 && (
                      <button onClick={novaDespesa} className="mt-3 text-[13px] text-[#5a8bff] hover:underline">+ Lançar a primeira despesa</button>
                    )}
                  </div>
                ) : (
                  <ul className="divide-y divide-white/[0.06]">
                    {despesasVisiveis.map(d => {
                      const cat = CAT_MAP[d.categoria]
                      return (
                        <li key={d.id}
                          className={`group flex items-center gap-4 px-5 py-3 transition-colors ${editingId === d.id ? 'bg-[#2e6cf6]/10' : 'hover:bg-white/[0.025]'}`}>
                          <span className="w-11 shrink-0 text-center leading-none text-[#5a8bff]">
                            {d.d ? (
                              <>
                                <span className="rlp-t block text-[19px]">{d.d.getDate()}</span>
                                <span className="rlp-m block text-[8.5px] mt-0.5 tracking-[0.15em]">{MESES_CURTOS[d.d.getMonth()]} {String(d.d.getFullYear()).slice(2)}</span>
                              </>
                            ) : <span className="text-[11px] text-white/40">{d.data}</span>}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block truncate text-[13.5px] text-white/90">{d.descricao}</span>
                            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-white/45">
                              <span className="inline-flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat?.color ?? '#7c8893' }} />
                                {cat?.label ?? d.categoria}
                              </span>
                              {d.projeto_ref && <span className="truncate">· {nomeProjeto(d.projeto_ref)}</span>}
                              {d.notas && <span className="truncate text-white/35">· {d.notas}</span>}
                            </span>
                          </span>
                          <span className="shrink-0 text-[14px] text-white/90">− {fmt(Number(d.valor))}</span>
                          <span className="shrink-0 flex items-center gap-1 sm:opacity-40 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(d)} title="Editar"
                              className="w-8 h-8 rounded-full border border-white/[0.12] hover:border-[#2e6cf6]/70 text-[12px] text-white/60 hover:text-white transition-colors">✎</button>
                            <button onClick={() => deleteDespesa(d)} disabled={deletingId === d.id} title="Apagar"
                              className="w-8 h-8 rounded-full border border-white/[0.12] hover:border-[#ff4747]/70 text-[12px] text-white/60 hover:text-[#ff4747] transition-colors disabled:opacity-30">
                              {deletingId === d.id ? '…' : '✕'}
                            </button>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}

// ─── export ──────────────────────────────────────────────────────────────────

export default function FinancasMediaPage() {
  return (
    <Suspense fallback={
      <main className="rlp min-h-screen relative text-white">
        <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />
        <p className="relative z-10 pt-32 text-center rlp-m text-[11px] text-white/40 animate-pulse">A carregar…</p>
      </main>
    }>
      <FinancasMediaContent />
    </Suspense>
  )
}
