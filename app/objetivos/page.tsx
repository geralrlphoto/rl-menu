'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Objetivo = { id: string; label: string; target: number; ano: number }
type RealData = {
  faturacao:     number
  casamentos:    number
  leads:         number
  leadsFechadas: number
  conversao:     number
  valorMedio:    number
}

/* ── Formatadores ──────────────────────────────────────────────────────────── */
function fmtEur(n: number) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n)
}
function fmtN(n: number) { return n.toLocaleString('pt-PT') }

/* ── Barra de progresso ────────────────────────────────────────────────────── */
function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct))
  const color =
    pct >= 100 ? '#4ade80' :
    pct >= 70  ? '#C9A84C' :
    pct >= 40  ? '#C9A84C' :
                 '#ef4444'
  const opacity = pct >= 100 ? 1 : pct >= 70 ? 1 : pct >= 40 ? 0.65 : 0.5

  return (
    <div className="h-[2px] w-full bg-white/[0.06] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${clamped}%`, backgroundColor: color, opacity }}
      />
    </div>
  )
}

/* ── Card KPI editável ─────────────────────────────────────────────────────── */
function KpiCard({
  obj, real, format, onSave,
}: {
  obj: Objetivo
  real: number
  format: 'eur' | 'count'
  onSave: (id: string, target: number, label: string) => void
}) {
  const [editing,  setEditing]  = useState(false)
  const [inputVal, setInputVal] = useState(String(obj.target))

  const pct = obj.target > 0 ? Math.round((real / obj.target) * 100) : 0

  const borderColor =
    pct >= 100 ? '#4ade80' :
    pct >= 70  ? '#C9A84C' :
    pct >= 40  ? 'rgba(245,158,11,0.45)' :
                 'rgba(239,68,68,0.35)'

  const pctColor =
    pct >= 100 ? 'text-emerald-400' :
    pct >= 70  ? 'text-[#C9A84C]'   :
    pct >= 40  ? 'text-amber-400/70' :
                 'text-red-400/60'

  const displayReal   = format === 'eur' ? fmtEur(real)       : fmtN(real)
  const displayTarget = format === 'eur' ? fmtEur(obj.target) : fmtN(obj.target)

  function save() {
    const n = Number(inputVal.replace(/[^0-9.]/g, ''))
    if (!isNaN(n) && n > 0) onSave(obj.id, n, obj.label)
    setEditing(false)
  }

  return (
    <div
      className="relative border-l-2 border border-white/[0.06] bg-white/[0.015] p-6 flex flex-col gap-5 transition-colors hover:bg-white/[0.025]"
      style={{ borderLeftColor: borderColor }}
    >
      {/* Label + botão editar */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-[9px] tracking-[0.45em] text-white/30 uppercase">{obj.label}</p>
        <button
          onClick={() => { setEditing(e => !e); setInputVal(String(obj.target)) }}
          className="text-white/20 hover:text-[#C9A84C] transition-colors text-xs leading-none mt-0.5"
          title="Editar objetivo"
        >
          {editing ? '✕' : '✎'}
        </button>
      </div>

      {/* Valor real */}
      <div>
        <p className="text-[2.2rem] font-extralight tracking-tight text-white leading-none mb-2">
          {displayReal}
        </p>
        <p className="text-[10px] text-white/25 flex items-center gap-1.5 flex-wrap">
          objetivo:{' '}
          {editing ? (
            <>
              <input
                autoFocus
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
                className="w-28 bg-white/10 border border-[#C9A84C]/30 text-white text-[10px] px-2 py-0.5 rounded outline-none focus:border-[#C9A84C]/60"
              />
              <button onClick={save} className="text-[#C9A84C] text-[10px] hover:text-[#C9A84C]/70">✓</button>
            </>
          ) : (
            <span className="text-white/45">{displayTarget}</span>
          )}
        </p>
      </div>

      {/* Barra + % */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar pct={pct} />
        </div>
        <span className={`text-[11px] font-medium tabular-nums shrink-0 ${pctColor}`}>
          {pct}%
        </span>
      </div>
    </div>
  )
}

/* ── Página principal ──────────────────────────────────────────────────────── */
export default function ObjetivosPage() {
  const [objetivos, setObjetivos] = useState<Objetivo[]>([])
  const [real,      setReal]      = useState<RealData | null>(null)
  const [loading,   setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/objetivos')
      const data = await res.json()
      setObjetivos(data.objetivos ?? [])
      setReal(data.real ?? null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleSave(id: string, target: number, label: string) {
    // Optimistic update
    setObjetivos(prev => prev.map(o => o.id === id ? { ...o, target } : o))
    await fetch('/api/objetivos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, target, label, ano: 2026 }),
    })
  }

  function getObj(id: string): Objetivo {
    return objetivos.find(o => o.id === id) ?? { id, label: '', target: 0, ano: 2026 }
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-12 max-w-5xl mx-auto">

      {/* Voltar */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[10px] tracking-[0.35em] text-white/30 hover:text-[#C9A84C] transition-colors mb-12 uppercase"
      >
        ‹ Menu
      </Link>

      {/* Header */}
      <header className="mb-12">
        <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">RL PHOTO.VIDEO</p>
        <h1 className="text-3xl font-extralight tracking-[0.2em] text-[#C9A84C] uppercase">
          Objetivos 2026
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px w-12 bg-[#C9A84C]/50" />
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>
      </header>

      {loading ? (
        <div className="text-center py-24 text-white/20 text-[10px] tracking-[0.5em] uppercase animate-pulse">
          A carregar...
        </div>
      ) : (
        <div className="flex flex-col gap-px">

          {/* ── Grid 2×2 — KPIs principais ─────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04]">

            <KpiCard
              obj={getObj('faturacao')}
              real={real?.faturacao ?? 0}
              format="eur"
              onSave={handleSave}
            />

            <KpiCard
              obj={getObj('casamentos')}
              real={real?.casamentos ?? 0}
              format="count"
              onSave={handleSave}
            />

            <KpiCard
              obj={getObj('leads')}
              real={real?.leads ?? 0}
              format="count"
              onSave={handleSave}
            />

            {/* Taxa de conversão — sem target editável */}
            <div className="border-l-2 border border-white/[0.06] bg-white/[0.015] p-6 flex flex-col gap-5"
              style={{ borderLeftColor: 'rgba(255,255,255,0.08)' }}>
              <p className="text-[9px] tracking-[0.45em] text-white/30 uppercase">Taxa de Conversão</p>
              <div>
                <p className="text-[2.2rem] font-extralight tracking-tight text-white leading-none mb-2">
                  {real?.conversao ?? 0}%
                </p>
                <p className="text-[10px] text-white/25">
                  {real?.leadsFechadas ?? 0} fechadas de {real?.leads ?? 0} leads
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <ProgressBar pct={real?.conversao ?? 0} />
                </div>
                <span className="text-[11px] font-medium tabular-nums text-white/30 shrink-0">
                  —
                </span>
              </div>
            </div>
          </div>

          {/* ── Valor médio — largura total ─────────────────────────────────── */}
          <div
            className="border-l-2 border border-white/[0.06] bg-white/[0.015] p-6 flex items-center justify-between gap-6"
            style={{ borderLeftColor: 'rgba(201,168,76,0.2)' }}
          >
            <div className="flex flex-col gap-3">
              <p className="text-[9px] tracking-[0.45em] text-white/30 uppercase">Valor Médio por Casamento</p>
              <p className="text-[2.2rem] font-extralight tracking-tight text-white leading-none">
                {fmtEur(real?.valorMedio ?? 0)}
              </p>
              <p className="text-[10px] text-white/25">
                calculado a partir de {real?.casamentos ?? 0} casamento{(real?.casamentos ?? 0) !== 1 ? 's' : ''} com pagamentos registados
              </p>
            </div>
            {/* Mini indicador visual */}
            <div className="shrink-0 text-right hidden sm:block">
              <p className="text-[9px] tracking-[0.4em] text-white/15 uppercase mb-1">Faturação</p>
              <p className="text-lg font-extralight text-white/40">{fmtEur(real?.faturacao ?? 0)}</p>
              <p className="text-[9px] text-white/15 mt-1">
                {real?.casamentos ?? 0} eventos
              </p>
            </div>
          </div>

        </div>
      )}

      {/* Nota de rodapé */}
      <p className="mt-8 text-[9px] tracking-[0.4em] text-white/15 uppercase text-center">
        Dados em tempo real · 2026 · Clica em ✎ para editar objetivos
      </p>
    </main>
  )
}
