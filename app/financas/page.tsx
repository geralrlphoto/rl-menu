'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'

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

async function patchRow(id: string, field: string, value: any) {
  await fetch(`/api/pagamentos-noivos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: value }),
  })
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
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(String(value ?? '')) }, [value])
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  async function save() {
    setEditing(false)
    if (draft === String(value ?? '')) return
    setSaving(true)
    const parsed = type === 'number' ? (draft === '' ? null : Number(draft)) : (draft || null)
    await patchRow(rowId, field, parsed)
    onSaved(field, parsed)
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
      className={`text-left group/c flex items-center gap-1.5 hover:bg-white/5 rounded px-1 -mx-1 transition-colors w-full ${className}`}>
      <span className={saving ? 'opacity-40' : ''}>
        {type === 'date'
          ? fmt(value as string | null)
          : (value !== null && value !== '' ? String(value) : <span className="text-white/20 italic text-xs">—</span>)}
      </span>
      {!saving && <span className="text-[9px] text-white/15 opacity-0 group-hover/c:opacity-100 shrink-0">✎</span>}
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
    await patchRow(rowId, field, next)
    onSaved(field, next)
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
    await patchRow(rowId, field, next)
    onSaved(field, next)
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
export default function FinancasPage() {
  const [rows, setRows] = useState<Pagamento[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

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

  function handleSaved(rowId: string, field: string, val: any) {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: val } : r))
  }

  async function addRow() {
    setAdding(true)
    const d = await fetch('/api/pagamentos-noivos', { method: 'POST' }).then(r => r.json())
    if (d.row) setRows(prev => [...prev, d.row])
    setAdding(false)
  }

  async function deleteRow(id: string) {
    await fetch(`/api/pagamentos-noivos/${id}`, { method: 'DELETE' })
    setRows(prev => prev.filter(r => r.id !== id))
    setConfirmDelete(null)
  }

  return (
    <main className="min-h-screen px-4 py-12 max-w-[1400px] mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-xs tracking-widest text-white/40 hover:text-gold transition-colors mb-10">
        ‹ VOLTAR AO MENU
      </Link>

      <header className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs tracking-[0.4em] text-white/30 uppercase mb-1">RL PHOTO.VIDEO</p>
          <h1 className="text-2xl font-light tracking-widest text-gold uppercase">Pagamentos Noivos</h1>
          <div className="mt-3 h-px w-16 bg-gold/40" />
        </div>
        <div className="flex items-center gap-2">
          {/* Atualizar */}
          <button onClick={() => loadRows(true)} disabled={refreshing}
            className="flex items-center gap-1.5 text-xs tracking-widest text-white/40 hover:text-white px-3 py-2 rounded-lg border border-white/10 hover:border-white/25 transition-all disabled:opacity-40">
            <span className={refreshing ? 'animate-spin' : ''}>↻</span>
            {refreshing ? 'A atualizar...' : 'Atualizar'}
          </button>
          {/* Novo registo */}
          <button onClick={addRow} disabled={adding}
            className="flex items-center gap-1.5 text-xs tracking-widest text-gold/80 hover:text-gold px-3 py-2 rounded-lg border border-gold/30 hover:border-gold/60 bg-gold/5 hover:bg-gold/10 transition-all disabled:opacity-40">
            {adding ? '...' : '+ Novo Registo'}
          </button>
        </div>
      </header>

      {loading && <div className="text-center py-24 text-white/20 text-xs tracking-widest uppercase">A carregar...</div>}
      {error   && <div className="text-center py-24 text-red-400/60 text-sm">{error}</div>}

      {!loading && !error && (
        <>
          <p className="text-xs text-white/20 tracking-wider mb-4">
            {rows.length} registos · <span className="text-white/15">clica em qualquer campo para editar</span>
          </p>
          <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['NOME DOS NOIVOS','REFERÊNCIA','DATA CASAMENTO','DATA PAGAMENTO','FASE','MÉTODO','VALOR (€)','ATUALIZADO',''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] tracking-[0.3em] text-white/25 uppercase font-normal whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.id}
                    className={`border-b border-white/[0.04] hover:bg-white/[0.015] transition-colors ${i % 2 === 1 ? 'bg-white/[0.008]' : ''}`}>

                    <td className="px-4 py-3 font-medium text-white/90 min-w-[160px]">
                      <EditCell value={row.nome_noivos} field="nome_noivos" rowId={row.id}
                        onSaved={(f,v) => handleSaved(row.id, f, v)} />
                    </td>
                    <td className="px-4 py-3 min-w-[130px]">
                      <EditCell value={row.referencia} field="referencia" rowId={row.id}
                        onSaved={(f,v) => handleSaved(row.id, f, v)} className="text-gold/60 text-xs tracking-wider" />
                    </td>
                    <td className="px-4 py-3 text-white/50 min-w-[140px]">
                      <EditCell value={row.data_casamento} field="data_casamento" rowId={row.id} type="date"
                        onSaved={(f,v) => handleSaved(row.id, f, v)} />
                    </td>
                    <td className="px-4 py-3 text-white/50 min-w-[140px]">
                      <EditCell value={row.data_pagamento} field="data_pagamento" rowId={row.id} type="date"
                        onSaved={(f,v) => handleSaved(row.id, f, v)} />
                    </td>
                    <td className="px-4 py-3 min-w-[170px]">
                      <MultiCell value={row.fase_pagamento} field="fase_pagamento" rowId={row.id}
                        options={FASE_OPTS} colorMap={FASE_CLS}
                        onSaved={(f,v) => handleSaved(row.id, f, v)} />
                    </td>
                    <td className="px-4 py-3 min-w-[180px]">
                      <MultiCell value={row.metodo_pagamento} field="metodo_pagamento" rowId={row.id}
                        options={METODO_OPTS} colorMap={METODO_CLS}
                        onSaved={(f,v) => handleSaved(row.id, f, v)} />
                    </td>
                    <td className="px-4 py-3 min-w-[110px]">
                      <EditCell value={row.valor_liquidado} field="valor_liquidado" rowId={row.id} type="number"
                        onSaved={(f,v) => handleSaved(row.id, f, v)} className="text-white/70 font-medium" />
                    </td>
                    <td className="px-4 py-3">
                      <CheckCell value={row.atualizado} field="atualizado" rowId={row.id}
                        onSaved={(f,v) => handleSaved(row.id, f, v)} />
                    </td>
                    {/* Apagar */}
                    <td className="px-3 py-3">
                      {confirmDelete === row.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => deleteRow(row.id)}
                            className="text-[10px] px-2 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors">
                            Sim
                          </button>
                          <button onClick={() => setConfirmDelete(null)}
                            className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 transition-colors">
                            Não
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(row.id)}
                          className="text-white/15 hover:text-red-400 transition-colors text-base px-1">
                          🗑
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}
