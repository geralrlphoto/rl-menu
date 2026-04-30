'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Objetivo = { id: string; label: string; target: number; ano: number }
type RealData = {
  faturacao:             number
  casamentos:            number
  leads:                 number
  leadsFechadas:         number
  conversao:             number
  valorMedio:            number
  porFase:               Record<string, number>
  videosEntregues:       number
  videosPendentes:       number
  eventosTotal:          number
  albumsEntregues:       number
  albumsPendentes:       number
  albumsTotal:           number
  portaisCount:          number
  casamentosComPagamento: number
}

/* ── Formatadores ──────────────────────────────────────────────────────────── */
function fmtEur(n: number) {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(n)
}
function fmtN(n: number) { return n.toLocaleString('pt-PT') }

/* ── Config dos sliders ────────────────────────────────────────────────────── */
const SLIDER_CFG: Record<string, { min: number; max: number; step: number }> = {
  faturacao:  { min: 10000, max: 300000, step: 1000 },
  casamentos: { min: 1,     max: 100,    step: 1    },
  leads:      { min: 10,    max: 500,    step: 5    },
}

/* ── Barra de progresso simples ────────────────────────────────────────────── */
function Bar({ pct, color = '#C9A84C', opacity = 1 }: { pct: number; color?: string; opacity?: number }) {
  const c = Math.min(100, Math.max(0, pct))
  return (
    <div className="h-[2px] w-full bg-white/[0.06] rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${c}%`, backgroundColor: color, opacity }} />
    </div>
  )
}

/* ── Secção header ─────────────────────────────────────────────────────────── */
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-px">
      <p className="text-[8px] tracking-[0.55em] text-white/20 uppercase shrink-0">{label}</p>
      <div className="h-px flex-1 bg-white/[0.04]" />
    </div>
  )
}

/* ── Card KPI com slider ────────────────────────────────────────────────────── */
function KpiCard({
  obj, real, format, sub, onSave,
}: {
  obj: Objetivo
  real: number
  format: 'eur' | 'count'
  sub?: string
  onSave: (id: string, target: number, label: string) => void
}) {
  const [editing,   setEditing]   = useState(false)
  const [sliderVal, setSliderVal] = useState(obj.target)

  useEffect(() => { setSliderVal(obj.target) }, [obj.target])

  const cfg = SLIDER_CFG[obj.id] ?? { min: 0, max: Math.max(obj.target * 3, 100), step: 1 }
  const pct = obj.target > 0 ? Math.round((real / obj.target) * 100) : 0

  const barColor = pct >= 100 ? '#4ade80' : pct >= 70 ? '#C9A84C' : pct >= 40 ? '#C9A84C' : '#ef4444'
  const barOpacity = pct >= 100 ? 1 : pct >= 70 ? 1 : pct >= 40 ? 0.65 : 0.45
  const borderColor = pct >= 100 ? '#4ade80' : pct >= 70 ? '#C9A84C' : pct >= 40 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.3)'
  const pctColor = pct >= 100 ? 'text-emerald-400' : pct >= 70 ? 'text-[#C9A84C]' : pct >= 40 ? 'text-amber-400/70' : 'text-red-400/60'

  const displayReal   = format === 'eur' ? fmtEur(real)       : fmtN(real)
  const displayTarget = format === 'eur' ? fmtEur(obj.target) : fmtN(obj.target)
  const displaySlider = format === 'eur' ? fmtEur(sliderVal)  : fmtN(sliderVal)
  const sliderPct     = ((sliderVal - cfg.min) / (cfg.max - cfg.min)) * 100

  function handleRelease() { onSave(obj.id, sliderVal, obj.label); setEditing(false) }

  return (
    <div className="relative border-l-2 border border-white/[0.06] bg-white/[0.015] p-6 flex flex-col gap-5 transition-colors hover:bg-white/[0.025]"
      style={{ borderLeftColor: borderColor }}>

      <div className="flex items-start justify-between gap-2">
        <p className="text-[9px] tracking-[0.45em] text-white/30 uppercase">{obj.label}</p>
        <button onClick={() => { setEditing(e => !e); setSliderVal(obj.target) }}
          className="text-white/20 hover:text-[#C9A84C] transition-colors text-xs leading-none mt-0.5">
          {editing ? '✕' : '✎'}
        </button>
      </div>

      <div>
        <p className="text-[2.2rem] font-extralight tracking-tight text-white leading-none mb-2">{displayReal}</p>
        <p className="text-[10px] text-white/25">
          objetivo: <span className={editing ? 'text-[#C9A84C]' : 'text-white/45'}>{editing ? displaySlider : displayTarget}</span>
        </p>
        {sub && <p className="text-[9px] text-white/20 mt-1">{sub}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1"><Bar pct={pct} color={barColor} opacity={barOpacity} /></div>
        <span className={`text-[11px] font-medium tabular-nums shrink-0 ${pctColor}`}>{pct}%</span>
      </div>

      {editing && (
        <div className="flex flex-col gap-3 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <p className="text-[9px] tracking-[0.4em] text-white/20 uppercase">Definir Objetivo</p>
            <p className="text-[10px] text-[#C9A84C] font-medium tabular-nums">{displaySlider}</p>
          </div>
          <div className="relative flex items-center" style={{ height: '20px' }}>
            <div className="absolute inset-x-0 h-[3px] rounded-full bg-white/[0.08]" />
            <div className="absolute left-0 h-[3px] rounded-full"
              style={{ width: `${sliderPct}%`, background: 'linear-gradient(90deg, #C9A84C60, #C9A84C)' }} />
            <input type="range" min={cfg.min} max={cfg.max} step={cfg.step} value={sliderVal}
              onChange={e => setSliderVal(Number(e.target.value))}
              onMouseUp={handleRelease} onTouchEnd={handleRelease}
              className="absolute inset-x-0 w-full opacity-0 cursor-pointer" style={{ height: '20px' }} />
            <div className="absolute w-4 h-4 rounded-full border-2 border-[#C9A84C] bg-[#080808] shadow-lg pointer-events-none"
              style={{ left: `calc(${sliderPct}% - 8px)` }} />
          </div>
          <div className="flex justify-between text-[9px] text-white/15">
            <span>{format === 'eur' ? fmtEur(cfg.min) : fmtN(cfg.min)}</span>
            <span>{format === 'eur' ? fmtEur(cfg.max) : fmtN(cfg.max)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Card estático (sem slider) ────────────────────────────────────────────── */
function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="border-l-2 border border-white/[0.06] bg-white/[0.015] p-6 flex flex-col gap-2"
      style={{ borderLeftColor: accent ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.06)' }}>
      <p className="text-[9px] tracking-[0.45em] text-white/30 uppercase">{label}</p>
      <p className="text-[2.2rem] font-extralight tracking-tight text-white leading-none">{value}</p>
      {sub && <p className="text-[10px] text-white/25">{sub}</p>}
    </div>
  )
}

/* ── Card de entrega (com barra de progresso %) ────────────────────────────── */
function EntregaCard({ label, entregues, total, cor }: { label: string; entregues: number; total: number; cor?: string }) {
  const pct = total > 0 ? Math.round((entregues / total) * 100) : 0
  const color = cor ?? (pct >= 80 ? '#4ade80' : pct >= 50 ? '#C9A84C' : '#ef4444')
  const borderColor = pct >= 80 ? '#4ade80' : pct >= 50 ? '#C9A84C' : 'rgba(239,68,68,0.3)'

  return (
    <div className="border-l-2 border border-white/[0.06] bg-white/[0.015] p-6 flex flex-col gap-5"
      style={{ borderLeftColor: borderColor }}>
      <p className="text-[9px] tracking-[0.45em] text-white/30 uppercase">{label}</p>
      <div>
        <p className="text-[2.2rem] font-extralight tracking-tight text-white leading-none mb-2">
          {entregues}<span className="text-base text-white/25 ml-1">/ {total}</span>
        </p>
        <p className="text-[10px] text-white/25">{total - entregues} pendente{total - entregues !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1"><Bar pct={pct} color={color} /></div>
        <span className="text-[11px] font-medium tabular-nums shrink-0" style={{ color }}>{pct}%</span>
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

  const fase = real?.porFase ?? {}

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-12 max-w-5xl mx-auto">

      <Link href="/"
        className="inline-flex items-center gap-2 text-[10px] tracking-[0.35em] text-white/30 hover:text-[#C9A84C] transition-colors mb-12 uppercase">
        ‹ Menu
      </Link>

      <header className="mb-12">
        <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">RL PHOTO.VIDEO</p>
        <h1 className="text-3xl font-extralight tracking-[0.2em] text-[#C9A84C] uppercase">Objetivos 2026</h1>
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
        <div className="flex flex-col gap-8">

          {/* ── FINANCEIRO ──────────────────────────────────────────────────── */}
          <div>
            <SectionLabel label="Financeiro" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04]">
              <KpiCard
                obj={getObj('faturacao')}
                real={real?.faturacao ?? 0}
                format="eur"
                sub={`${real?.casamentosComPagamento ?? 0} casamento${(real?.casamentosComPagamento ?? 0) !== 1 ? 's' : ''} com pagamentos registados`}
                onSave={handleSave}
              />
              <StatCard
                label="Valor Médio por Casamento"
                value={fmtEur(real?.valorMedio ?? 0)}
                sub={`baseado em ${real?.casamentosComPagamento ?? 0} casamento${(real?.casamentosComPagamento ?? 0) !== 1 ? 's' : ''}`}
                accent
              />
            </div>

            {/* Breakdown por fase */}
            {Object.keys(fase).length > 0 && (
              <div className="grid grid-cols-3 gap-px bg-white/[0.04] mt-px">
                {['ADJUDICAÇÃO', 'REFORÇO', 'FINAL'].map(f => (
                  <div key={f} className="border border-white/[0.06] bg-white/[0.01] px-5 py-4 flex flex-col gap-1">
                    <p className="text-[8px] tracking-[0.4em] text-white/20 uppercase">{f}</p>
                    <p className="text-lg font-extralight text-white/70">{fmtEur(fase[f] ?? 0)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── CLIENTES ────────────────────────────────────────────────────── */}
          <div>
            <SectionLabel label="Clientes" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04]">
              <KpiCard
                obj={getObj('casamentos')}
                real={real?.casamentos ?? 0}
                format="count"
                sub={`${real?.portaisCount ?? 0} portais activos · ${real?.casamentosComPagamento ?? 0} com pagamento`}
                onSave={handleSave}
              />
              <KpiCard
                obj={getObj('leads')}
                real={real?.leads ?? 0}
                format="count"
                sub={`${real?.leadsFechadas ?? 0} fechadas · ${real?.conversao ?? 0}% conversão`}
                onSave={handleSave}
              />
            </div>
          </div>

          {/* ── ENTREGAS ────────────────────────────────────────────────────── */}
          <div>
            <SectionLabel label="Entregas" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.04]">
              <EntregaCard
                label="Álbuns Entregues"
                entregues={real?.albumsEntregues ?? 0}
                total={real?.albumsTotal ?? 0}
              />
              <EntregaCard
                label="Vídeos Entregues"
                entregues={real?.videosEntregues ?? 0}
                total={real?.eventosTotal ?? 0}
              />
            </div>
          </div>

        </div>
      )}

      <p className="mt-10 text-[9px] tracking-[0.4em] text-white/15 uppercase text-center">
        Dados em tempo real · Supabase + Notion · Clica em ✎ para editar objetivos
      </p>
    </main>
  )
}
