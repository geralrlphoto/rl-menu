'use client'

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import { FUNDO } from '@/app/media/_lib/estilo'
import { lerData, hojeLisboa, chaveDia } from '@/app/media/_lib/eventos'
import GraficoMensal, { type MesGrafico } from './GraficoMensal'
import FormMovimento from './FormMovimento'
import { normCategoria, nomeCategoria, type Movimento, type TipoMov } from './categorias'

// Finanças da RL PROD: receitas (automáticas, vindas dos pagamentos recebidos de cada
// projeto, e manuais) e despesas, com o balanço = receitas − despesas.

// ─── tipos ───────────────────────────────────────────────────────────────────

type Recebimento = { data: string; valor: number; descricao?: string; validado?: boolean }

type Projeto = {
  ref: string; nome: string; cliente: string; tipo: string
  status: string; dataFilmagem: string; dataEntrega: string
  recebimentos?: Recebimento[]
  totalValor: number; totalPago: number; totalPendente: number; totalAtraso: number
  createdAt: string
}

type Linha = {
  key: string
  auto: boolean
  tipo: TipoMov
  d: Date | null
  descricao: string
  categoria: string
  valor: number
  ref: string | null
  projetoNome: string | null
  validado: boolean
  mov?: Movimento
}

type Tab = 'movimentos' | 'projetos' | 'categorias'
type PeriodoId = 'mes' | '3m' | '12m' | 'ano' | 'tudo'
type Intervalo = { ini: Date; fim: Date } | null

// ─── constantes e utilitários ────────────────────────────────────────────────

const PERIODOS: { id: PeriodoId; nome: string }[] = [
  { id: 'mes',  nome: 'Este mês' },
  { id: '3m',   nome: '3 meses' },
  { id: '12m',  nome: '12 meses' },
  { id: 'ano',  nome: 'Este ano' },
  { id: 'tudo', nome: 'Tudo' },
]

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const SEM_PROJETO = '__sem'

const num = (v: unknown) => { const n = Number(v); return isFinite(n) ? n : 0 }
const fmt = (n: number) => n.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
const fmt0 = (n: number) => n.toLocaleString('pt-PT', { maximumFractionDigits: 0 }) + ' €'
const soma = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((s, x) => s + f(x), 0)
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null)
const dataCurta = (d: Date) => d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })

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
const dentro = (d: Date | null, iv: Intervalo) => !iv || (!!d && d >= iv.ini && d < iv.fim)

// ─── estilos partilhados ─────────────────────────────────────────────────────

const CARTAO = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/70'
const TILE   = 'rounded-2xl border border-white/[0.08] bg-[#0c2236]/70'
const PILLS  = 'flex flex-wrap gap-1 rounded-full border border-white/[0.12] bg-[#00141f]/60 p-1'
const pill   = (on: boolean) => `rounded-full px-3.5 py-1.5 text-[12px] transition-colors ${on ? 'bg-[#2e6cf6] text-white' : 'text-white/55 hover:text-white'}`
const INPUT  = 'rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[13.5px] text-white placeholder:text-white/25 focus:border-[#2e6cf6] focus:outline-none transition-colors [color-scheme:dark]'
const corBal = (n: number) => (n < 0 ? 'text-[#ff4747]' : 'text-[#5a8bff]')
const sinal  = (n: number) => (n < 0 ? '−' : '+') + fmt(Math.abs(n))

// ─── componente principal ────────────────────────────────────────────────────

function FinancasMediaContent() {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [movs, setMovs]         = useState<Movimento[]>([])
  const [loading, setLoading]   = useState(true)
  const [erro, setErro]         = useState('')

  const [periodo, setPeriodo] = useState<PeriodoId>('ano')
  const [tab, setTab]         = useState<Tab>('movimentos')
  const [vistaGrafico, setVistaGrafico] = useState<'12m' | 'ano'>('12m')

  // filtros dos movimentos
  const [fTipo, setFTipo]       = useState<'todos' | TipoMov>('todos')
  const [fProjeto, setFProjeto] = useState('')
  const [fCat, setFCat]         = useState('')
  const [pesquisa, setPesquisa] = useState('')

  // projetos
  const [ordemProj, setOrdemProj] = useState<'balanco' | 'recente'>('balanco')

  // formulário
  const [form, setForm] = useState<{ aberto: boolean; mov: Movimento | null }>({ aberto: false, mov: null })
  const [aApagar, setAApagar] = useState<string | null>(null)

  const hoje = useMemo(() => hojeLisboa(), [])
  const iv = useMemo(() => intervalo(periodo, hoje), [periodo, hoje])

  // ── fetch ──────────────────────────────────────────────────────────────────

  const carregar = useCallback(async () => {
    setErro('')
    try {
      const [rP, rM] = await Promise.all([
        fetch('/api/financas-media'),
        fetch('/api/financas-media/despesas'),
      ])
      const jP = await rP.json()
      const jM = await rM.json()
      if (!rP.ok || !rM.ok) throw new Error()
      setProjetos(jP.projetos ?? [])
      setMovs((jM.despesas ?? []).map((m: Movimento) => ({
        ...m, tipo: m.tipo === 'receita' ? 'receita' : 'despesa', valor: num(m.valor),
      })))
    } catch {
      setErro('Não foi possível carregar as finanças. Tenta outra vez.')
    }
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  const apagar = async (m: Movimento) => {
    const tipoTxt = m.tipo === 'receita' ? 'a receita' : 'a despesa'
    if (!window.confirm(`Apagar ${tipoTxt} "${m.descricao}" (${fmt(m.valor)})?`)) return
    setAApagar(m.id)
    try {
      const r = await fetch(`/api/financas-media/despesas/${m.id}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      setMovs(xs => xs.filter(x => x.id !== m.id))
    } catch {
      window.alert('Não foi possível apagar. Tenta outra vez.')
    }
    setAApagar(null)
  }

  // ── dados derivados ────────────────────────────────────────────────────────

  const projPorRef = useMemo(() => {
    const m = new Map<string, Projeto>()
    for (const p of projetos) m.set(p.ref.toUpperCase(), p)
    return m
  }, [projetos])

  // Livro único: recebimentos dos projetos (automáticos) + movimentos manuais
  const linhas = useMemo<Linha[]>(() => {
    const out: Linha[] = []
    for (const p of projetos) {
      ;(p.recebimentos ?? []).forEach((r, i) => {
        out.push({
          key: `a-${p.ref}-${i}`, auto: true, tipo: 'receita', d: lerData(r.data),
          descricao: r.descricao || 'Pagamento', categoria: 'projeto', valor: num(r.valor),
          ref: p.ref, projetoNome: p.nome || p.ref, validado: r.validado !== false,
        })
      })
    }
    for (const m of movs) {
      const ref = m.projeto_ref ? m.projeto_ref.toUpperCase() : null
      out.push({
        key: `m-${m.id}`, auto: false, tipo: m.tipo, d: lerData(m.data),
        descricao: m.descricao, categoria: normCategoria(m.categoria), valor: m.valor,
        ref, projetoNome: ref ? (projPorRef.get(ref)?.nome || ref) : null, validado: true, mov: m,
      })
    }
    return out.sort((a, b) => (b.d?.getTime() ?? -Infinity) - (a.d?.getTime() ?? -Infinity))
  }, [projetos, movs, projPorRef])

  const noPeriodo = useMemo(() => linhas.filter(l => dentro(l.d, iv)), [linhas, iv])

  const kpi = useMemo(() => {
    const recAuto = soma(noPeriodo.filter(l => l.tipo === 'receita' && l.auto), l => l.valor)
    const recMan  = soma(noPeriodo.filter(l => l.tipo === 'receita' && !l.auto), l => l.valor)
    const desp    = soma(noPeriodo.filter(l => l.tipo === 'despesa'), l => l.valor)
    const receitas = recAuto + recMan
    return {
      receitas, recAuto, recMan, desp, balanco: receitas - desp,
      margem: pct(receitas - desp, receitas),
      porReceber: soma(projetos, p => num(p.totalPendente) + num(p.totalAtraso)),
      atraso: soma(projetos, p => num(p.totalAtraso)),
      nAtraso: projetos.filter(p => num(p.totalAtraso) > 0).length,
    }
  }, [noPeriodo, projetos])

  const meses = useMemo<MesGrafico[]>(() => {
    const a = hoje.getFullYear(), mAtual = hoje.getMonth()
    const lista: Date[] = vistaGrafico === '12m'
      ? Array.from({ length: 12 }, (_, i) => new Date(a, mAtual - 11 + i, 1))
      : Array.from({ length: 12 }, (_, i) => new Date(a, i, 1))
    const porChave = new Map<string, MesGrafico>()
    const out = lista.map(d => {
      const g: MesGrafico = {
        chave: `${d.getFullYear()}-${d.getMonth()}`, rotulo: MESES_CURTOS[d.getMonth()], ano: d.getFullYear(),
        receitas: 0, despesas: 0,
        atual: d.getFullYear() === a && d.getMonth() === mAtual,
        futuro: d > hoje,
      }
      porChave.set(g.chave, g)
      return g
    })
    for (const l of linhas) {
      if (!l.d) continue
      const g = porChave.get(`${l.d.getFullYear()}-${l.d.getMonth()}`)
      if (!g) continue
      if (l.tipo === 'receita') g.receitas += l.valor
      else g.despesas += l.valor
    }
    return out
  }, [linhas, vistaGrafico, hoje])

  // ── movimentos filtrados ───────────────────────────────────────────────────

  const catsPresentes = useMemo(() => {
    const s = new Map<string, string>()
    for (const l of noPeriodo) {
      if (fTipo !== 'todos' && l.tipo !== fTipo) continue
      s.set(l.categoria, nomeCategoria(l.categoria, l.tipo))
    }
    return [...s.entries()].sort((a, b) => a[1].localeCompare(b[1], 'pt'))
  }, [noPeriodo, fTipo])

  const filtradas = useMemo(() => {
    const q = pesquisa.trim().toLowerCase()
    return noPeriodo.filter(l => {
      if (fTipo !== 'todos' && l.tipo !== fTipo) return false
      if (fProjeto === SEM_PROJETO ? !!l.ref : fProjeto && l.ref !== fProjeto) return false
      if (fCat && l.categoria !== fCat) return false
      if (q && !`${l.descricao} ${l.projetoNome ?? ''} ${l.ref ?? ''} ${l.mov?.notas ?? ''}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [noPeriodo, fTipo, fProjeto, fCat, pesquisa])

  const somaFiltradas = useMemo(() => ({
    rec: soma(filtradas.filter(l => l.tipo === 'receita'), l => l.valor),
    desp: soma(filtradas.filter(l => l.tipo === 'despesa'), l => l.valor),
  }), [filtradas])

  // ── por projeto (desde sempre) ─────────────────────────────────────────────

  const resumoProjetos = useMemo(() => {
    const rows = projetos.map(p => {
      const ref = p.ref.toUpperCase()
      const meus = movs.filter(m => (m.projeto_ref ?? '').toUpperCase() === ref)
      const despesas = soma(meus.filter(m => m.tipo === 'despesa'), m => m.valor)
      const equipa = soma(meus.filter(m => m.tipo === 'despesa' && normCategoria(m.categoria) === 'equipa'), m => m.valor)
      const extra = soma(meus.filter(m => m.tipo === 'receita'), m => m.valor)
      const recebido = num(p.totalPago)
      const contratado = num(p.totalValor)
      const balanco = recebido + extra - despesas
      return {
        p, contratado, recebido, despesas, equipa, extra, balanco,
        lucroPrevisto: contratado + extra - despesas,
        margem: pct(balanco, recebido + extra),
        porReceber: num(p.totalPendente) + num(p.totalAtraso),
        atraso: num(p.totalAtraso),
        progresso: contratado > 0 ? Math.min(100, (recebido / contratado) * 100) : 0,
        criado: lerData(p.createdAt)?.getTime() ?? 0,
      }
    })
    rows.sort((a, b) => ordemProj === 'balanco' ? b.balanco - a.balanco : b.criado - a.criado)
    return rows
  }, [projetos, movs, ordemProj])

  const totaisProj = useMemo(() => ({
    contratado: soma(resumoProjetos, r => r.contratado),
    recebido: soma(resumoProjetos, r => r.recebido),
    despesas: soma(resumoProjetos, r => r.despesas),
    extra: soma(resumoProjetos, r => r.extra),
    balanco: soma(resumoProjetos, r => r.balanco),
    porReceber: soma(resumoProjetos, r => r.porReceber),
    atraso: soma(resumoProjetos, r => r.atraso),
  }), [resumoProjetos])

  // ── categorias (no período) ────────────────────────────────────────────────

  const porCategoria = useMemo(() => {
    const agrupar = (tipo: TipoMov, soManuais: boolean) => {
      const m = new Map<string, { total: number; n: number }>()
      for (const l of noPeriodo) {
        if (l.tipo !== tipo || (soManuais && l.auto)) continue
        const g = m.get(l.categoria) ?? { total: 0, n: 0 }
        g.total += l.valor; g.n++
        m.set(l.categoria, g)
      }
      return [...m.entries()].map(([id, g]) => ({ id, nome: nomeCategoria(id, tipo), ...g })).sort((a, b) => b.total - a.total)
    }
    return { despesas: agrupar('despesa', false), receitas: agrupar('receita', true) }
  }, [noPeriodo])

  const opcoesProjetos = useMemo(
    () => [...projetos].sort((a, b) => (a.nome || a.ref).localeCompare(b.nome || b.ref, 'pt')).map(p => ({ ref: p.ref.toUpperCase(), nome: p.nome || p.ref, cliente: p.cliente })),
    [projetos],
  )

  const nomePeriodo = PERIODOS.find(p => p.id === periodo)?.nome.toLowerCase() ?? ''

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <main className="rlp min-h-screen relative text-white">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-8 pb-16">
        <Link href="/media" className="text-[12px] text-white/45 hover:text-white transition-colors">‹ RL Prod</Link>

        {/* cabeçalho */}
        <header className="mt-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">RL Prod · Gestão</p>
            <h1 className="rlp-t text-[52px] sm:text-[72px] leading-[0.9] mt-3">Finanças.</h1>
            <p className="mt-2 text-[15px] text-white/55">Receitas, despesas e balanço</p>
          </div>
          <button onClick={() => setForm({ aberto: true, mov: null })}
            className="self-start sm:self-auto rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-6 py-3 text-[13.5px] font-medium text-white transition-colors">
            + Movimento
          </button>
        </header>

        {/* período */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className={PILLS}>
            {PERIODOS.map(p => (
              <button key={p.id} onClick={() => setPeriodo(p.id)} className={pill(periodo === p.id)}>{p.nome}</button>
            ))}
          </div>
          {iv && (
            <span className="text-[11.5px] text-white/35">
              {dataCurta(iv.ini)} a {dataCurta(new Date(iv.fim.getTime() - 86400000))}
            </span>
          )}
        </div>

        {erro && <p className="mt-6 text-[13px] text-[#ff4747]">{erro}</p>}

        {loading ? (
          <p className="mt-20 text-center rlp-m text-[11px] text-white/40 animate-pulse">A carregar…</p>
        ) : (
          <>
            {/* KPI */}
            <section className="mt-6 grid grid-cols-2 lg:grid-cols-6 gap-2.5">
              <Kpi rotulo="Receitas" valor={fmt0(kpi.receitas)} cor="text-white"
                nota={`${fmt0(kpi.recAuto)} auto · ${fmt0(kpi.recMan)} manual`} />
              <Kpi rotulo="Despesas" valor={fmt0(kpi.desp)} cor="text-white"
                nota={`${noPeriodo.filter(l => l.tipo === 'despesa').length} movimentos`} />
              <Kpi rotulo="Balanço" valor={(kpi.balanco < 0 ? '−' : '') + fmt0(Math.abs(kpi.balanco))} cor={corBal(kpi.balanco)}
                nota="receitas − despesas" destaque />
              <Kpi rotulo="Margem" valor={kpi.margem === null ? 'sem receitas' : `${kpi.margem} %`}
                cor={kpi.margem === null ? 'text-white/40 text-[16px]' : corBal(kpi.margem)} nota="balanço / receitas" />
              <Kpi rotulo="Por receber" valor={fmt0(kpi.porReceber)} cor="text-[#a9c1ff]" nota="todos os projetos" />
              <Kpi rotulo="Em atraso" valor={fmt0(kpi.atraso)} cor={kpi.atraso > 0 ? 'text-[#ff4747]' : 'text-white/60'}
                nota={kpi.nAtraso ? `${kpi.nAtraso} projeto${kpi.nAtraso > 1 ? 's' : ''}` : 'tudo em dia'} alerta={kpi.atraso > 0} />
            </section>

            {/* gráfico */}
            <section className={`${CARTAO} mt-4 px-4 sm:px-7 pt-5 pb-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <p className="rlp-m traco text-[10px] text-white/55">Mês a mês</p>
                <div className={PILLS}>
                  <button onClick={() => setVistaGrafico('12m')} className={pill(vistaGrafico === '12m')}>Últimos 12 meses</button>
                  <button onClick={() => setVistaGrafico('ano')} className={pill(vistaGrafico === 'ano')}>{hoje.getFullYear()}</button>
                </div>
              </div>
              <GraficoMensal meses={meses} fmt={fmt} fmt0={fmt0} />
            </section>

            {/* tabs */}
            <nav className="mt-10 flex gap-6 border-b border-white/[0.1] overflow-x-auto">
              {([
                ['movimentos', 'Movimentos', noPeriodo.length],
                ['projetos', 'Projetos', projetos.length],
                ['categorias', 'Categorias', null],
              ] as [Tab, string, number | null][]).map(([id, nome, n]) => (
                <button key={id} onClick={() => setTab(id)}
                  className={`-mb-px whitespace-nowrap border-b-2 pb-3 rlp-m text-[11px] tracking-[0.22em] transition-colors ${tab === id ? 'border-[#2e6cf6] text-white' : 'border-transparent text-white/45 hover:text-white/80'}`}>
                  {nome}{n !== null && <span className="ml-2 text-white/35">{n}</span>}
                </button>
              ))}
            </nav>

            {/* ── MOVIMENTOS ── */}
            {tab === 'movimentos' && (
              <section className="mt-5">
                <div className="flex flex-col lg:flex-row gap-2.5 lg:items-center">
                  <div className={PILLS}>
                    {([['todos', 'Todos'], ['receita', 'Receitas'], ['despesa', 'Despesas']] as const).map(([id, nome]) => (
                      <button key={id} onClick={() => { setFTipo(id); setFCat('') }} className={pill(fTipo === id)}>{nome}</button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 lg:flex gap-2.5 flex-1">
                    <select value={fProjeto} onChange={e => setFProjeto(e.target.value)} className={`${INPUT} py-2.5 lg:max-w-[220px] min-w-0`}>
                      <option value="">Todos os projetos</option>
                      <option value={SEM_PROJETO}>Sem projeto</option>
                      {opcoesProjetos.map(p => <option key={p.ref} value={p.ref}>{p.nome}</option>)}
                    </select>
                    <select value={fCat} onChange={e => setFCat(e.target.value)} className={`${INPUT} py-2.5 lg:max-w-[190px] min-w-0`}>
                      <option value="">Todas as categorias</option>
                      {catsPresentes.map(([id, nome]) => <option key={id} value={id}>{nome}</option>)}
                    </select>
                    <input value={pesquisa} onChange={e => setPesquisa(e.target.value)} placeholder="Pesquisar…"
                      className={`${INPUT} py-2.5 col-span-2 lg:flex-1 min-w-0`} />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-white/45">
                  <span>{filtradas.length} movimento{filtradas.length === 1 ? '' : 's'} · {nomePeriodo}</span>
                  <span>Receitas <span className="text-[#5a8bff] tabular-nums">+{fmt(somaFiltradas.rec)}</span></span>
                  <span>Despesas <span className="text-white/80 tabular-nums">−{fmt(somaFiltradas.desp)}</span></span>
                  <span>Balanço <span className={`${corBal(somaFiltradas.rec - somaFiltradas.desp)} tabular-nums`}>{sinal(somaFiltradas.rec - somaFiltradas.desp)}</span></span>
                </div>

                <div className={`${CARTAO} mt-3 overflow-hidden`}>
                  {filtradas.length === 0 ? (
                    <p className="px-6 py-14 text-center text-[13.5px] text-white/40">Sem movimentos com estes filtros.</p>
                  ) : (
                    <>
                      <div className="hidden md:grid grid-cols-[96px_1fr_180px_140px_130px_64px] gap-4 px-5 py-3 border-b border-white/[0.08] rlp-m text-[9px] tracking-[0.22em] text-white/35">
                        <span>Data</span><span>Descrição</span><span>Projeto</span><span>Categoria</span><span className="text-right">Valor</span><span />
                      </div>
                      <ul className="divide-y divide-white/[0.06]">
                        {filtradas.map(l => <LinhaMov key={l.key} l={l} aApagar={aApagar === l.mov?.id}
                          onEditar={() => l.mov && setForm({ aberto: true, mov: { ...l.mov, categoria: normCategoria(l.mov.categoria) } })}
                          onApagar={() => l.mov && apagar(l.mov)} />)}
                      </ul>
                    </>
                  )}
                </div>
              </section>
            )}

            {/* ── PROJETOS ── */}
            {tab === 'projetos' && (
              <section className="mt-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[12px] text-white/45">Valores desde o início de cada projeto, sem filtro de período.</p>
                  <div className={PILLS}>
                    <button onClick={() => setOrdemProj('balanco')} className={pill(ordemProj === 'balanco')}>Por balanço</button>
                    <button onClick={() => setOrdemProj('recente')} className={pill(ordemProj === 'recente')}>Recentes</button>
                  </div>
                </div>

                {resumoProjetos.length === 0 ? (
                  <p className={`${CARTAO} mt-3 px-6 py-14 text-center text-[13.5px] text-white/40`}>Ainda não há projetos.</p>
                ) : (
                  <div className="mt-3 grid gap-2.5">
                    {resumoProjetos.map(r => (
                      <article key={r.p.ref} className={`${CARTAO} px-5 py-4`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="min-w-0">
                            <p className="rlp-m text-[9px] tracking-[0.22em] text-white/35">{r.p.ref}{r.p.tipo ? ` · ${r.p.tipo}` : ''}</p>
                            <h3 className="rlp-t text-[22px] leading-tight mt-1 truncate">{r.p.nome || r.p.ref}</h3>
                            {r.p.cliente && <p className="text-[12.5px] text-white/45 truncate">{r.p.cliente}</p>}
                          </div>
                          <div className="sm:text-right shrink-0">
                            <p className="rlp-m text-[9px] tracking-[0.22em] text-white/35">Balanço</p>
                            <p className={`rlp-t text-[26px] leading-none mt-1 tabular-nums ${corBal(r.balanco)}`}>{sinal(r.balanco)}</p>
                            <p className="text-[11.5px] text-white/40 mt-1">margem {r.margem === null ? 'sem receitas' : `${r.margem} %`}</p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <Mini rotulo="Contratado" valor={fmt(r.contratado)} />
                          <Mini rotulo="Recebido" valor={fmt(r.recebido)} cor="text-[#5a8bff]" />
                          <Mini rotulo="Receitas extra" valor={fmt(r.extra)} cor={r.extra > 0 ? 'text-[#5a8bff]' : 'text-white/40'} />
                          <Mini rotulo="Custo total" valor={fmt(r.despesas)} cor={r.despesas > 0 ? 'text-white' : 'text-white/40'} />
                          <Mini rotulo={r.atraso > 0 ? 'Por receber · atraso' : 'Por receber'} valor={fmt(r.porReceber)}
                            cor={r.atraso > 0 ? 'text-[#ff4747]' : 'text-[#a9c1ff]'} />
                        </div>

                        <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
                          <div className="flex-1">
                            <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
                              <div className={`h-full rounded-full ${r.atraso > 0 ? 'bg-[#ff4747]' : 'bg-[#2e6cf6]'}`} style={{ width: `${r.progresso}%` }} />
                            </div>
                            <p className="mt-1.5 text-[11px] text-white/40">
                              {Math.round(r.progresso)} % recebido
                              {r.atraso > 0 && <span className="text-[#ff4747]"> · {fmt(r.atraso)} em atraso</span>}
                              {r.equipa > 0 && <> · equipa {fmt(r.equipa)}</>}
                              {r.contratado > 0 && <> · lucro previsto <span className={r.lucroPrevisto < 0 ? 'text-[#ff4747]' : 'text-white/70'}>{sinal(r.lucroPrevisto)}</span></>}
                            </p>
                          </div>
                          <a href={`/portal-media/${r.p.ref}/pagamentos`} target="_blank" rel="noopener noreferrer"
                            className="shrink-0 text-[12.5px] text-[#5a8bff] hover:text-[#a9c1ff] transition-colors">
                            Abrir Financeiro do projeto ↗
                          </a>
                        </div>
                      </article>
                    ))}

                    {/* totais */}
                    <div className={`${TILE} px-5 py-4`}>
                      <p className="rlp-m traco text-[9.5px] text-[#5a8bff]">Total dos projetos</p>
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-6 gap-2">
                        <Mini rotulo="Contratado" valor={fmt(totaisProj.contratado)} />
                        <Mini rotulo="Recebido" valor={fmt(totaisProj.recebido)} cor="text-[#5a8bff]" />
                        <Mini rotulo="Receitas extra" valor={fmt(totaisProj.extra)} cor="text-[#5a8bff]" />
                        <Mini rotulo="Despesas" valor={fmt(totaisProj.despesas)} />
                        <Mini rotulo="Por receber" valor={fmt(totaisProj.porReceber)} cor={totaisProj.atraso > 0 ? 'text-[#ff4747]' : 'text-[#a9c1ff]'} />
                        <Mini rotulo="Balanço" valor={sinal(totaisProj.balanco)} cor={corBal(totaisProj.balanco)} />
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── CATEGORIAS ── */}
            {tab === 'categorias' && (
              <section className="mt-5 grid lg:grid-cols-2 gap-3">
                <BlocoCategorias titulo="Despesas por categoria" sub={nomePeriodo} itens={porCategoria.despesas}
                  cor="bg-white/40" vazio="Sem despesas neste período." />
                <BlocoCategorias titulo="Receitas manuais por categoria" sub={`${nomePeriodo} · sem os pagamentos automáticos`}
                  itens={porCategoria.receitas} cor="bg-[#2e6cf6]" vazio="Sem receitas manuais neste período." />
              </section>
            )}
          </>
        )}
      </div>

      {form.aberto && (
        <FormMovimento
          inicial={form.mov}
          projetos={opcoesProjetos}
          hoje={chaveDia(hoje)}
          onFechar={() => setForm({ aberto: false, mov: null })}
          onGuardado={() => { setForm({ aberto: false, mov: null }); carregar() }}
        />
      )}
    </main>
  )
}

// ─── peças ───────────────────────────────────────────────────────────────────

function Kpi({ rotulo, valor, nota, cor, destaque, alerta }: {
  rotulo: string; valor: string; nota: string; cor: string; destaque?: boolean; alerta?: boolean
}) {
  return (
    <div className={`rounded-2xl border px-4 py-4 bg-[#0c2236]/70 ${alerta ? 'border-[#ff4747]/40' : destaque ? 'border-[#2e6cf6]/50' : 'border-white/[0.08]'}`}>
      <p className="rlp-m text-[9px] tracking-[0.22em] text-white/45">{rotulo}</p>
      <p className={`rlp-t text-[24px] sm:text-[26px] leading-none mt-2.5 tabular-nums ${cor}`}>{valor}</p>
      <p className="mt-2 text-[11px] text-white/35 truncate">{nota}</p>
    </div>
  )
}

function Mini({ rotulo, valor, cor = 'text-white' }: { rotulo: string; valor: string; cor?: string }) {
  return (
    <div className="rounded-xl bg-[#0c2236]/70 px-3 py-2.5 min-w-0">
      <p className="rlp-m text-[8.5px] tracking-[0.18em] text-white/35 truncate">{rotulo}</p>
      <p className={`mt-1 text-[13.5px] tabular-nums truncate ${cor}`}>{valor}</p>
    </div>
  )
}

function LinhaMov({ l, aApagar, onEditar, onApagar }: { l: Linha; aApagar: boolean; onEditar: () => void; onApagar: () => void }) {
  const valor = (
    <span className={`tabular-nums text-[14px] ${l.tipo === 'receita' ? 'text-[#5a8bff]' : 'text-white/85'}`}>
      {l.tipo === 'receita' ? '+' : '−'}{fmt(l.valor)}
    </span>
  )
  const etiquetas = (
    <>
      {l.auto && <span className="rounded-full border border-[#2e6cf6]/50 bg-[#2e6cf6]/15 px-2 py-0.5 rlp-m text-[8px] tracking-[0.15em] text-[#a9c1ff]">Automático</span>}
      {l.auto && !l.validado && <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10.5px] text-white/55">a confirmar</span>}
    </>
  )
  const acoes = l.auto ? (
    <a href={`/portal-media/${l.ref}/pagamentos`} target="_blank" rel="noopener noreferrer" title="Abrir Financeiro do projeto"
      className="text-[12px] text-[#5a8bff] hover:text-[#a9c1ff] transition-colors">Abrir ↗</a>
  ) : (
    <span className="flex items-center gap-3">
      <button onClick={onEditar} className="text-[12px] text-white/45 hover:text-white transition-colors">Editar</button>
      <button onClick={onApagar} disabled={aApagar} className="text-[12px] text-white/35 hover:text-[#ff4747] transition-colors disabled:opacity-40">
        {aApagar ? '…' : 'Apagar'}
      </button>
    </span>
  )
  const cat = nomeCategoria(l.categoria, l.tipo)
  const dataTxt = l.d ? dataCurta(l.d) : 'sem data'

  return (
    <li className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
      {/* desktop */}
      <div className="hidden md:grid grid-cols-[96px_1fr_180px_140px_130px_64px] gap-4 items-center">
        <span className="text-[12px] text-white/50 tabular-nums">{dataTxt}</span>
        <div className="min-w-0">
          <p className="text-[13.5px] text-white/90 truncate flex items-center gap-2">
            <span className="truncate">{l.descricao}</span>{etiquetas}
          </p>
          {l.mov?.notas && <p className="text-[11.5px] text-white/35 truncate">{l.mov.notas}</p>}
        </div>
        <span className="text-[12.5px] text-white/60 truncate">{l.projetoNome ?? <span className="text-white/25">Sem projeto</span>}</span>
        <span className="text-[12px] text-white/50 truncate">{cat}</span>
        <span className="text-right">{valor}</span>
        <span className="text-right">{acoes}</span>
      </div>

      {/* telemóvel */}
      <div className="md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13.5px] text-white/90">{l.descricao}</p>
            <p className="mt-0.5 text-[11.5px] text-white/40">{dataTxt} · {cat}{l.projetoNome ? ` · ${l.projetoNome}` : ''}</p>
          </div>
          <span className="shrink-0">{valor}</span>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="flex flex-wrap gap-1.5">{etiquetas}</span>
          {acoes}
        </div>
      </div>
    </li>
  )
}

function BlocoCategorias({ titulo, sub, itens, cor, vazio }: {
  titulo: string; sub: string; itens: { id: string; nome: string; total: number; n: number }[]; cor: string; vazio: string
}) {
  const total = soma(itens, i => i.total)
  const max = Math.max(1, ...itens.map(i => i.total))
  return (
    <div className={`${CARTAO} px-5 sm:px-6 py-5`}>
      <p className="rlp-m traco text-[10px] text-white/55">{titulo}</p>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="text-[11.5px] text-white/35">{sub}</span>
        <span className="rlp-t text-[22px] tabular-nums">{fmt0(total)}</span>
      </div>
      {itens.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-white/40">{vazio}</p>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {itens.map(i => (
            <li key={i.id}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="text-white/80 truncate">{i.nome} <span className="text-white/30 text-[11px]">· {i.n}</span></span>
                <span className="tabular-nums text-white/85 shrink-0">{fmt(i.total)}
                  <span className="ml-2 text-[11px] text-white/35">{Math.round((i.total / (total || 1)) * 100)} %</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className={`h-full rounded-full ${cor}`} style={{ width: `${(i.total / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
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
