'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

type Pagamento = {
  id: string
  nome_noivos: string
  referencia: string
  data_casamento: string | null
  data_pagamento: string | null
  fase_pagamento: string[]
  metodo_pagamento: string[]
  valor_liquidado: number | null
  atualizado: boolean
  confirmado: boolean
  confirmado_em: string | null
  criado_em: string | null
  comprovativo_url: string | null
  notas: string | null
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function fmt(d: string | null) {
  if (!d) return '—'
  const dateOnly = d.split('T')[0]  // remove time component if present
  const dt = new Date(dateOnly + 'T00:00:00')
  if (isNaN(dt.getTime())) return '—'
  return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()]} ${dt.getFullYear()}`
}

const METODO_OPTS = ['NUMERÁRIO', 'TRANSFERENCIA', 'MBWAY']
const FASE_OPTS   = ['ADJUDICAÇÃO', 'REFORÇO', 'FINAL']

const METODO_CLS: Record<string, string> = {
  'NUMERÁRIO':    'bg-green-500/15 border-green-500/30 text-green-400',
  'TRANSFERENCIA':'bg-blue-500/15 border-blue-500/30 text-blue-400',
  'MBWAY':        'bg-red-500/15 border-red-500/30 text-red-400',
}
const FASE_CLS: Record<string, string> = {
  'ADJUDICAÇÃO': 'bg-orange-500/15 border-orange-500/30 text-orange-400',
  'REFORÇO':     'bg-yellow-500/15 border-yellow-500/30 text-yellow-400',
  'FINAL':       'bg-gold/15 border-gold/30 text-gold',
}

async function patchRow(id: string, field: string, value: any): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/pagamentos-noivos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    const data = await res.json()
    if (!res.ok || data.error) return { ok: false, error: data.error ?? `HTTP ${res.status}` }
    return { ok: true }
  } catch (e: any) {
    return { ok: false, error: e.message }
  }
}

// ── Célula de texto/número/data editável ──────────────────────────────────────
function EditCell({ value, field, rowId, onSaved, type = 'text', className = '' }: {
  value: string | number | null; field: string; rowId: string
  onSaved: (field: string, val: any) => void
  type?: 'text' | 'number' | 'date'; className?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? ''))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(String(value ?? '')) }, [value])
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  async function save() {
    setEditing(false)
    if (draft === String(value ?? '')) return
    setSaving(true)
    setSaveError(false)
    const parsed = type === 'number' ? (draft === '' ? null : Number(draft)) : (draft || null)
    const result = await patchRow(rowId, field, parsed)
    if (result.ok) {
      onSaved(field, parsed)
    } else {
      // revert draft to original value on failure
      setDraft(String(value ?? ''))
      setSaveError(true)
      setTimeout(() => setSaveError(false), 3000)
    }
    setSaving(false)
  }

  if (editing) return (
    <input ref={ref} type={type} value={draft}
      onChange={e => setDraft(e.target.value)} onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(String(value ?? '')); setEditing(false) } }}
      className={`bg-white/8 border border-gold/40 rounded px-2 py-0.5 text-white text-sm focus:outline-none focus:border-gold w-full min-w-[100px] ${className}`}
    />
  )

  return (
    <button onClick={() => setEditing(true)}
      className={`text-left group/c flex items-center gap-1.5 hover:bg-white/5 rounded px-1 -mx-1 transition-colors w-full ${saveError ? 'ring-1 ring-red-500/40 rounded' : ''} ${className}`}>
      <span className={saving ? 'opacity-40' : saveError ? 'text-red-400' : ''}>
        {type === 'date'
          ? fmt(value as string | null)
          : (value !== null && value !== '' ? String(value) : <span className="text-white/20 italic text-xs">—</span>)}
      </span>
      {saveError && <span className="text-[9px] text-red-400/70 shrink-0">✕ erro</span>}
      {!saving && !saveError && <span className="text-[9px] text-white/15 opacity-0 group-hover/c:opacity-100 shrink-0">✎</span>}
      {saving  && <span className="text-[9px] text-white/20">...</span>}
    </button>
  )
}

// ── Célula multi-select editável ───────────────────────────────────────────────
function MultiCell({ value, field, rowId, options, colorMap, onSaved }: {
  value: string[]; field: string; rowId: string
  options: string[]; colorMap: Record<string, string>
  onSaved: (field: string, val: any) => void
}) {
  const [saving, setSaving] = useState(false)

  async function toggle(opt: string) {
    const next = value.includes(opt) ? value.filter(v => v !== opt) : [...value, opt]
    setSaving(true)
    const result = await patchRow(rowId, field, next)
    if (result.ok) onSaved(field, next)
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1">
        {value.map(v => (
          <button key={v} onClick={() => toggle(v)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors hover:opacity-60 ${colorMap[v] ?? 'bg-white/10 border-white/20 text-white/50'}`}>
            {v} <span className="opacity-50">✕</span>
          </button>
        ))}
        {saving && <span className="text-[9px] text-white/20">...</span>}
      </div>
      {options.filter(o => !value.includes(o)).length > 0 && (
        <select value="" onChange={e => { if (e.target.value) toggle(e.target.value) }}
          className="appearance-none bg-white/[0.02] border border-white/8 rounded px-2 py-0.5 text-[10px] text-white/30 focus:outline-none cursor-pointer w-full max-w-[140px]">
          <option value="" className="bg-zinc-900">+ Adicionar</option>
          {options.filter(o => !value.includes(o)).map(o => (
            <option key={o} value={o} className="bg-zinc-900">{o}</option>
          ))}
        </select>
      )}
    </div>
  )
}

// ── Célula checkbox ────────────────────────────────────────────────────────────
function CheckCell({ value, field, rowId, onSaved }: {
  value: boolean; field: string; rowId: string
  onSaved: (field: string, val: any) => void
}) {
  const [val, setVal] = useState(value)
  const [saving, setSaving] = useState(false)
  useEffect(() => { setVal(value) }, [value])

  async function toggle() {
    const next = !val; setVal(next); setSaving(true)
    const result = await patchRow(rowId, field, next)
    if (result.ok) {
      onSaved(field, next)
    } else {
      setVal(val) // revert on failure
    }
    setSaving(false)
  }

  return (
    <button onClick={toggle} className="flex items-center gap-1.5 group/ck">
      <div className={`w-5 h-5 rounded flex items-center justify-center text-[11px] transition-colors
        ${val ? 'bg-green-500/25 border border-green-500/40 text-green-400' : 'bg-white/5 border border-white/15 text-transparent group-hover/ck:border-white/30'}`}>
        ✓
      </div>
      {saving && <span className="text-[9px] text-white/20">...</span>}
    </button>
  )
}

// ── Página principal ───────────────────────────────────────────────────────────
// Novo design (como /photo e /eventos): duas tabelas, "Por confirmar" (novas
// entradas) e "Confirmados". Um pagamento só passa a confirmado quando o
// confirmamos aqui. Filtros por nome, referência, mês e ano (do pagamento ou
// do casamento).
const G = '#d8be93' // dourado suave
const eur = (n: number) => `${n.toLocaleString('pt-PT', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`
const MESES_LONGOS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

type DataBase = 'pagamento' | 'casamento'

function FinancasPageInner() {
  const [rows, setRows] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [openingFicha, setOpeningFicha] = useState<string | null>(null)
  const [aConfirmar, setAConfirmar] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [base, setBase] = useState<DataBase>('pagamento')
  const [ano, setAno] = useState<string>('')
  const [mes, setMes] = useState<number | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const refFilter = searchParams.get('ref') ?? ''

  async function openFicha(referencia: string) {
    if (!referencia) return
    setOpeningFicha(referencia)
    const d = await fetch(`/api/eventos-by-ref?ref=${encodeURIComponent(referencia)}`).then(r => r.json())
    setOpeningFicha(null)
    if (d.id) router.push(`/eventos-2026/${d.id}`)
    else alert(`Evento com referência "${referencia}" não encontrado.`)
  }

  const loadRows = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const d = await fetch('/api/pagamentos-noivos').then(r => r.json())
      if (d.error) { setError(d.error); return }
      setRows(d.rows) // substitui sempre, nunca duplica
    } catch { setError('Erro de ligação') }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { loadRows() }, [loadRows])

  const dataDe = (r: Pagamento) => (base === 'pagamento' ? r.data_pagamento : r.data_casamento) ?? ''
  const anos = Array.from(new Set(rows.map(r => dataDe(r).slice(0, 4)).filter(Boolean))).sort().reverse()

  const q = search.trim().toLowerCase()
  const filteredRows = rows.filter(r => {
    if (refFilter && r.referencia?.toLowerCase() !== refFilter.toLowerCase()) return false
    const d = dataDe(r)
    if (ano && d.slice(0, 4) !== ano) return false
    if (mes !== null && Number(d.slice(5, 7)) !== mes + 1) return false
    if (!q) return true
    const campos = [
      r.nome_noivos, r.referencia,
      fmt(r.data_casamento), fmt(r.data_pagamento), r.data_casamento, r.data_pagamento,
      ...(r.fase_pagamento ?? []), ...(r.metodo_pagamento ?? []),
      r.valor_liquidado != null ? String(r.valor_liquidado) : '',
    ]
    return campos.some(c => (c ?? '').toString().toLowerCase().includes(q))
  })

  const porConfirmar = filteredRows.filter(r => !r.confirmado)
    .sort((a, b) => (b.criado_em ?? '').localeCompare(a.criado_em ?? ''))
  const confirmados = filteredRows.filter(r => r.confirmado)
    .sort((a, b) => (b.data_pagamento ?? '').localeCompare(a.data_pagamento ?? ''))
  const soma = (l: Pagamento[]) => l.reduce((s, r) => s + Number(r.valor_liquidado ?? 0), 0)
  const filtrosAtivos = !!(q || ano || mes !== null)

  function handleSaved(rowId: string, field: string, val: any) {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: val } : r))
  }

  async function confirmar(row: Pagamento, valor: boolean) {
    setAConfirmar(row.id)
    const r = await patchRow(row.id, 'confirmado', valor)
    if (r.ok) setRows(prev => prev.map(x => x.id === row.id ? { ...x, confirmado: valor, confirmado_em: valor ? new Date().toISOString() : null } : x))
    setAConfirmar(null)
  }

  async function addRow() {
    setAdding(true)
    const d = await fetch('/api/pagamentos-noivos', { method: 'POST' }).then(r => r.json())
    if (d.row) setRows(prev => [...prev, { ...d.row, confirmado: false, criado_em: new Date().toISOString() }])
    setAdding(false)
  }

  async function deleteRow(id: string) {
    await fetch(`/api/pagamentos-noivos/${id}`, { method: 'DELETE' })
    setRows(prev => prev.filter(r => r.id !== id))
    setConfirmDelete(null)
  }

  const periodo = ano || mes !== null
    ? `${mes !== null ? MESES_LONGOS[mes] + ' ' : ''}${ano || ''}`.trim()
    : 'Todos os meses'

  // ── tabela (as duas secções usam a mesma) ──
  function Tabela({ lista, tipo }: { lista: Pagamento[]; tipo: 'pendente' | 'confirmado' }) {
    if (lista.length === 0) return (
      <div className="rounded-[22px] border border-dashed border-[#d8be93]/25 py-14 text-center font-cond text-[15px] text-white/40">
        {tipo === 'pendente' ? 'Sem pagamentos por confirmar.' : 'Sem pagamentos confirmados neste período.'}
      </div>
    )
    return (
      <div className="overflow-x-auto rounded-[22px] border border-[#d8be93]/[0.18] bg-[#111111]/90"
        style={{ borderLeft: `2px solid rgba(216,190,147,${tipo === 'pendente' ? '.85' : '.4'})` }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.07]">
              {['Noivos', 'Referência', 'Casamento', 'Pagamento', 'Fase', 'Método', 'Valor', tipo === 'pendente' ? 'Comprovativo' : 'Confirmado', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left font-cond text-[11px] font-medium tracking-[0.16em] uppercase text-white/40 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.map(row => (
              <tr key={row.id} className="border-b border-white/[0.05] last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-cond font-semibold text-[15px] text-white/90 min-w-[160px]">
                  <EditCell value={row.nome_noivos} field="nome_noivos" rowId={row.id} onSaved={(f, v) => handleSaved(row.id, f, v)} />
                </td>
                <td className="px-4 py-3 min-w-[160px]">
                  <div className="flex items-center gap-2">
                    <EditCell value={row.referencia} field="referencia" rowId={row.id} onSaved={(f, v) => handleSaved(row.id, f, v)} className="text-[#d8be93]/80 text-xs tracking-wider font-mono" />
                    {row.referencia && (
                      <button onClick={() => openFicha(row.referencia)} disabled={openingFicha === row.referencia} title="Abrir Ficha de Cliente"
                        className="shrink-0 text-white/25 hover:text-[#d8be93] transition-colors text-xs disabled:opacity-40">
                        {openingFicha === row.referencia ? '...' : '↗'}
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-white/55 min-w-[130px] font-cond">
                  <EditCell value={row.data_casamento} field="data_casamento" rowId={row.id} type="date" onSaved={(f, v) => handleSaved(row.id, f, v)} />
                </td>
                <td className="px-4 py-3 text-white/55 min-w-[130px] font-cond">
                  <EditCell value={row.data_pagamento} field="data_pagamento" rowId={row.id} type="date" onSaved={(f, v) => handleSaved(row.id, f, v)} />
                </td>
                <td className="px-4 py-3 min-w-[160px]">
                  <MultiCell value={row.fase_pagamento} field="fase_pagamento" rowId={row.id} options={FASE_OPTS} colorMap={FASE_CLS} onSaved={(f, v) => handleSaved(row.id, f, v)} />
                </td>
                <td className="px-4 py-3 min-w-[170px]">
                  <MultiCell value={row.metodo_pagamento} field="metodo_pagamento" rowId={row.id} options={METODO_OPTS} colorMap={METODO_CLS} onSaved={(f, v) => handleSaved(row.id, f, v)} />
                </td>
                <td className="px-4 py-3 min-w-[110px] font-cond">
                  <EditCell value={row.valor_liquidado} field="valor_liquidado" rowId={row.id} type="number" onSaved={(f, v) => handleSaved(row.id, f, v)} className="text-[#d8be93] font-semibold text-[15px]" />
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {tipo === 'pendente' ? (
                    <div className="flex items-center gap-3">
                      {row.comprovativo_url
                        ? <a href={row.comprovativo_url} target="_blank" rel="noopener noreferrer" className="font-cond text-[13px] text-white/55 hover:text-[#d8be93] underline underline-offset-4 decoration-white/20">Ver ↗</a>
                        : <span className="font-cond text-[13px] text-white/25">sem ficheiro</span>}
                      <button onClick={() => confirmar(row, true)} disabled={aConfirmar === row.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#d8be93]/60 bg-[#d8be93]/15 hover:bg-[#d8be93]/30 px-4 py-1.5 font-cond font-semibold text-[13px] text-[#d8be93] transition-all disabled:opacity-40 shadow-[0_0_24px_-12px_rgba(216,190,147,0.7)]">
                        {aConfirmar === row.id ? '...' : '✓ Confirmar'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-green-400/30 bg-green-400/10 px-3 py-1 font-cond text-[12.5px] text-green-300">
                        ✓ {row.confirmado_em ? fmt(row.confirmado_em) : 'Confirmado'}
                      </span>
                      <button onClick={() => confirmar(row, false)} disabled={aConfirmar === row.id}
                        className="font-cond text-[12px] text-white/30 hover:text-red-300 transition-colors disabled:opacity-40">
                        {aConfirmar === row.id ? '...' : 'Anular'}
                      </button>
                    </div>
                  )}
                </td>
                <td className="px-3 py-3">
                  {confirmDelete === row.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => deleteRow(row.id)} className="text-[11px] px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30 transition-colors">Sim</button>
                      <button onClick={() => setConfirmDelete(null)} className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/45 hover:bg-white/10 transition-colors">Não</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDelete(row.id)} title="Apagar" className="text-white/20 hover:text-red-400 transition-colors text-base px-1">🗑</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const pill = (on: boolean) => `shrink-0 rounded-full border px-3.5 py-1.5 font-cond text-[13.5px] font-medium transition-all ${on
    ? 'border-[#d8be93]/60 bg-[#d8be93]/15 text-[#d8be93]'
    : 'border-white/[0.10] text-white/55 hover:border-[#d8be93]/35 hover:text-white'}`

  return (
    <main className="min-h-screen bg-[#0b0b0b] px-3 sm:px-6 pt-16 pb-12 lg:pt-8 max-w-[1240px] mx-auto">
      {/* ── topo ── */}
      <section className="relative overflow-hidden rounded-[28px] border border-[#d8be93]/20 bg-[#0b0b0b] px-5 sm:px-10 py-8 sm:py-10">
        <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(100deg, rgba(11,11,11,.97) 0%, rgba(11,11,11,.8) 60%, rgba(11,11,11,.6) 100%)' }} />
        <div aria-hidden className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(rgba(216,190,147,0.18) 1px, transparent 1px)', backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at 80% 40%, #000 0%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at 80% 40%, #000 0%, transparent 70%)',
        }} />
        <div aria-hidden className="absolute -right-24 -top-32 w-[420px] h-[420px]" style={{ background: 'radial-gradient(closest-side, rgba(216,190,147,0.16), transparent 70%)' }} />

        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/photo" className="font-cond text-[14px] text-white/50 hover:text-[#d8be93] transition-colors">‹ Menu</Link>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/registar-pagamento"
                className="inline-flex items-center gap-2 rounded-full bg-[#0e0e0e]/90 backdrop-blur-md font-cond font-semibold text-[14px] text-white px-4 py-2 border border-white/[0.14] hover:border-white/30 transition-all">
                ＋ Registar pagamento
              </Link>
              <button onClick={() => loadRows(true)} disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-full bg-[#0e0e0e]/90 font-cond font-semibold text-[14px] text-white/80 px-4 py-2 border border-white/[0.14] hover:border-white/30 transition-all disabled:opacity-40">
                <span className={refreshing ? 'animate-spin' : ''}>↻</span>{refreshing ? 'A atualizar…' : 'Atualizar'}
              </button>
              <button onClick={addRow} disabled={adding}
                className="inline-flex items-center gap-2 rounded-full bg-[#0e0e0e]/90 font-cond font-semibold text-[14px] text-white px-4 py-2 border border-[#d8be93]/50 hover:border-[#d8be93]/85 shadow-[0_0_28px_-12px_rgba(216,190,147,0.6)] transition-all disabled:opacity-40">
                {adding ? '...' : '+ Novo registo'}
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-14 items-center">
            <div>
              <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#d8be93]">RL Photo.Video · Finanças</p>
              <h1 className="font-cond font-bold text-white text-[40px] sm:text-[60px] leading-[1.02] tracking-[-0.01em] mt-3">
                Pagamentos dos <span className="text-[#d8be93]">noivos</span>
              </h1>
              <p className="font-cond text-[16px] text-white/50 mt-3 max-w-[48ch]">
                As novas entradas ficam por confirmar até as confirmarmos aqui. Só os pagamentos confirmados contam no portal dos noivos.
              </p>
            </div>

            <aside className="rounded-[22px] border border-[#d8be93]/30 bg-[#111111]/80 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(216,190,147,0.5)]">
              <p className="flex items-center gap-2 font-cond text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d8be93] shadow-[0_0_8px_#d8be93]" />{periodo}
              </p>
              <div className="grid grid-cols-2 mt-2">
                {[
                  ['Por confirmar', String(porConfirmar.length), 'novas entradas', true],
                  ['Valor por confirmar', eur(soma(porConfirmar)), 'a validar', false],
                  ['Confirmados', String(confirmados.length), 'pagamentos', false],
                  ['Valor confirmado', eur(soma(confirmados)), 'recebido', true],
                ].map(([l, v, sub, dourado], k) => (
                  <div key={String(l)} className={`py-3 ${k % 2 === 0 ? 'pr-4 border-r border-white/[0.07]' : 'pl-4'} ${k < 2 ? 'border-b border-white/[0.07]' : ''}`}>
                    <p className="font-cond text-[11px] text-white/50">{l}</p>
                    <p className={`font-cond font-semibold text-[21px] leading-none mt-1.5 ${dourado ? 'text-[#d8be93]' : 'text-white'}`}>{v}</p>
                    <p className="font-cond text-[10.5px] text-white/30 mt-1">{sub}</p>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </section>

      {loading && <div className="text-center py-24 font-cond text-white/35">A carregar…</div>}
      {error && <div className="text-center py-24 font-cond text-red-300/70">{error}</div>}

      {!loading && !error && (
        <>
          {/* ── filtros ── */}
          <div className="sticky top-0 z-20 -mx-3 sm:-mx-6 px-3 sm:px-6 py-4 mt-6 bg-[#0b0b0b]/90 backdrop-blur-md border-b border-[#d8be93]/10">
            {refFilter && (
              <div className="flex items-center gap-3 mb-3 px-4 py-2 rounded-full border border-[#d8be93]/25 bg-[#d8be93]/10 w-fit">
                <span className="font-cond text-[13px] text-[#d8be93]">Referência: {refFilter}</span>
                <button onClick={() => router.push('/financas')} className="font-cond text-[12px] text-white/40 hover:text-white">✕ Limpar</button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[240px] max-w-[440px]">
                <svg viewBox="0 0 24 24" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#d8be93]" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Escape') setSearch('') }}
                  placeholder="Nome dos noivos, referência, data…"
                  className="w-full rounded-full border border-white/[0.10] bg-white/[0.03] pl-10 pr-9 py-2 font-cond text-[14px] text-white placeholder-white/30 focus:outline-none focus:border-[#d8be93]/45" />
                {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white text-xs">✕</button>}
              </div>

              {/* que data contam o mês e o ano */}
              <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1">
                {(['pagamento', 'casamento'] as DataBase[]).map(b => (
                  <button key={b} onClick={() => setBase(b)}
                    className={`rounded-full px-3 py-1 font-cond text-[13px] transition-all ${base === b ? 'bg-[#d8be93]/20 text-[#d8be93]' : 'text-white/50 hover:text-white'}`}>
                    Data do {b}
                  </button>
                ))}
              </div>

              <select value={ano} onChange={e => setAno(e.target.value)}
                className="rounded-full border border-white/[0.10] bg-[#111111] px-4 py-2 font-cond text-[14px] text-white/80 focus:outline-none focus:border-[#d8be93]/45">
                <option value="">Todos os anos</option>
                {anos.map(a => <option key={a} value={a}>{a}</option>)}
              </select>

              {filtrosAtivos && (
                <button onClick={() => { setSearch(''); setAno(''); setMes(null) }} className="font-cond text-[13px] text-white/45 hover:text-[#d8be93]">Limpar filtros</button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
              <button onClick={() => setMes(null)} className={pill(mes === null)}>Todos os meses</button>
              {MESES.map((m, k) => <button key={m} onClick={() => setMes(mes === k ? null : k)} className={pill(mes === k)}>{m}</button>)}
            </div>
          </div>

          {/* ── 1. novas entradas ── */}
          <section className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
              <div>
                <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#d8be93]">Novas entradas</p>
                <h2 className="font-cond font-semibold text-white text-[28px] sm:text-[34px] leading-tight mt-1">Por confirmar</h2>
              </div>
              <span className="rounded-full border border-[#d8be93]/25 bg-[#d8be93]/10 px-3 py-1 font-cond text-[13px] text-[#d8be93]">
                {porConfirmar.length} · {eur(soma(porConfirmar))}
              </span>
            </div>
            {Tabela({ lista: porConfirmar, tipo: 'pendente' })}
          </section>

          {/* ── 2. confirmados ── */}
          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
              <div>
                <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#d8be93]">Validados por nós</p>
                <h2 className="font-cond font-semibold text-white text-[28px] sm:text-[34px] leading-tight mt-1">Pagamentos confirmados</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-cond text-[13px] text-white/70">
                {confirmados.length} · {eur(soma(confirmados))}
              </span>
            </div>
            {Tabela({ lista: confirmados, tipo: 'confirmado' })}
          </section>

          <p className="mt-8 font-cond text-[13px] text-white/30">Toquem em qualquer campo para o editar.</p>
        </>
      )}
    </main>
  )
}

export default function FinancasPage() {
  return <Suspense><FinancasPageInner /></Suspense>
}
