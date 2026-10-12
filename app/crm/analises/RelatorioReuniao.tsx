'use client'

import { useState } from 'react'

// Relatório crítico de uma reunião com noivos (tabela crm_analises_reuniao).
// Usado na ficha do CRM (/crm/[id]) e no painel /crm/analises.

export type Ponto = { titulo: string; detalhe?: string; momento?: string; categoria?: string; gravidade?: 'alta' | 'média' | 'baixa' }
export type Analise = {
  id: string
  contact_id: string
  data_reuniao: string | null
  duracao_min: number | null
  nota: number | null
  veredicto: string | null
  resumo: string | null
  perfil: Record<string, string>
  scores: Record<string, number>
  pontos_fortes: Ponto[]
  pontos_fracos: Ponto[]
  melhorar: Ponto[]
  proximos_passos: string[]
  created_at: string
}

export const ANALISE_COLS =
  'id,contact_id,data_reuniao,duracao_min,nota,veredicto,resumo,perfil,scores,pontos_fortes,pontos_fracos,melhorar,proximos_passos,created_at'

export const DIMENSOES: { key: string; label: string }[] = [
  { key: 'rapport', label: 'Ligação' },
  { key: 'descoberta', label: 'Descoberta' },
  { key: 'apresentacao', label: 'Apresentação' },
  { key: 'objecoes', label: 'Objeções' },
  { key: 'fecho', label: 'Fecho' },
]

const PERFIL_LABELS: Record<string, string> = {
  casal: 'O casal', evento: 'Evento', valores: 'O que valorizam', orcamento: 'Orçamento', concorrencia: 'Concorrência',
}

export function corNota(n: number | null | undefined) {
  if (n == null) return '#6b7280'
  if (n >= 7.5) return '#4ade80'
  if (n >= 5) return '#facc15'
  return '#f87171'
}

export function fmtData(d: string | null) {
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  return `${dd}/${m}/${y}`
}

export function NotaAnel({ nota, size = 64 }: { nota: number | null; size?: number }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(10, nota ?? 0)) / 10
  const cor = corNota(nota)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={cor} strokeWidth="4" fill="none" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: 'stroke-dashoffset .8s ease' }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-light text-white" style={{ fontSize: size * 0.28 }}>
        {nota != null ? Number(nota).toLocaleString('pt-PT', { maximumFractionDigits: 1 }) : '—'}
      </span>
    </div>
  )
}

function Barras({ scores }: { scores: Record<string, number> }) {
  return (
    <div className="flex flex-col gap-2.5">
      {DIMENSOES.map(d => {
        const v = scores?.[d.key]
        return (
          <div key={d.key} className="flex items-center gap-3">
            <span className="w-24 text-[10px] tracking-[0.2em] uppercase text-white/40 shrink-0">{d.label}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(v ?? 0) * 10}%`, background: corNota(v), transition: 'width .8s ease' }} />
            </div>
            <span className="w-6 text-right text-xs text-white/70">{v ?? '—'}</span>
          </div>
        )
      })}
    </div>
  )
}

const GRAV: Record<string, string> = {
  alta: 'bg-red-500/15 text-red-300 border-red-500/30',
  'média': 'bg-yellow-500/15 text-yellow-200 border-yellow-500/30',
  baixa: 'bg-white/5 text-white/50 border-white/15',
}

function ListaPontos({ itens, tipo }: { itens: Ponto[]; tipo: 'forte' | 'fraco' | 'melhorar' }) {
  const [aberto, setAberto] = useState<number | null>(null)
  const cor = tipo === 'forte' ? 'text-green-400' : tipo === 'fraco' ? 'text-red-400' : 'text-gold'
  const simbolo = tipo === 'forte' ? '+' : tipo === 'fraco' ? '−' : '→'
  if (!itens?.length) return <p className="text-sm text-white/30">Nada registado.</p>
  return (
    <ul className="flex flex-col gap-2">
      {itens.map((p, i) => (
        <li key={i}>
          <button onClick={() => setAberto(aberto === i ? null : i)}
            className="w-full text-left bg-white/[0.03] hover:bg-white/[0.06] border border-white/8 rounded-xl px-4 py-3 transition-colors">
            <div className="flex items-start gap-3">
              <span className={`${cor} text-lg leading-5 shrink-0`}>{simbolo}</span>
              <span className="flex-1 text-sm text-white/90">{p.titulo}</span>
              {p.gravidade && <span className={`text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 rounded-full border shrink-0 ${GRAV[p.gravidade] ?? GRAV.baixa}`}>{p.gravidade}</span>}
              {p.momento && <span className="text-[10px] font-mono text-white/30 shrink-0 mt-0.5">{p.momento}</span>}
            </div>
            {aberto === i && p.detalhe && (
              <p className="mt-2 ml-7 text-[13px] leading-relaxed text-white/55">{p.detalhe}</p>
            )}
          </button>
        </li>
      ))}
    </ul>
  )
}

const TABS = [
  { key: 'fracos', label: 'Pontos fracos' },
  { key: 'fortes', label: 'Pontos fortes' },
  { key: 'melhorar', label: 'A melhorar' },
  { key: 'perfil', label: 'Perfil do casal' },
] as const

export default function RelatorioReuniao({ a }: { a: Analise }) {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('fracos')
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row gap-5 sm:items-center">
        <NotaAnel nota={a.nota} size={84} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/35">
            Reunião {fmtData(a.data_reuniao)}{a.duracao_min ? ` · ${a.duracao_min} min` : ''}
          </p>
          {a.veredicto && <p className="font-cormorant italic text-white/85 text-lg sm:text-xl leading-snug mt-1">{a.veredicto}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_280px] gap-5">
        {a.resumo && <p className="text-sm leading-relaxed text-white/60">{a.resumo}</p>}
        <Barras scores={a.scores} />
      </div>

      <div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {TABS.map(t => {
            const n = t.key === 'fracos' ? a.pontos_fracos?.length : t.key === 'fortes' ? a.pontos_fortes?.length : t.key === 'melhorar' ? a.melhorar?.length : null
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-lg border transition-all ${tab === t.key ? 'border-gold/60 text-gold bg-gold/10' : 'border-white/10 text-white/40 hover:text-white/70'}`}>
                {t.label}{n != null ? ` · ${n}` : ''}
              </button>
            )
          })}
        </div>
        {tab === 'fracos' && <ListaPontos itens={a.pontos_fracos} tipo="fraco" />}
        {tab === 'fortes' && <ListaPontos itens={a.pontos_fortes} tipo="forte" />}
        {tab === 'melhorar' && <ListaPontos itens={a.melhorar} tipo="melhorar" />}
        {tab === 'perfil' && (
          <dl className="grid sm:grid-cols-2 gap-3">
            {Object.entries(a.perfil || {}).map(([k, v]) => (
              <div key={k} className="bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3">
                <dt className="text-[10px] tracking-[0.25em] uppercase text-gold/70 mb-1">{PERFIL_LABELS[k] ?? k}</dt>
                <dd className="text-[13px] leading-relaxed text-white/70">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      {a.proximos_passos?.length > 0 && (
        <div className="border-t border-white/8 pt-4">
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/35 mb-2">Próximos passos</p>
          <ol className="flex flex-col gap-1.5">
            {a.proximos_passos.map((p, i) => (
              <li key={i} className="flex gap-3 text-sm text-white/70">
                <span className="text-gold/70 font-mono text-xs mt-0.5">{String(i + 1).padStart(2, '0')}</span>{p}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
