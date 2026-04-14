'use client'

import { useState } from 'react'
import Link from 'next/link'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const DIAS_SEMANA = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado']

function formatDate(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d + 'T00:00:00')
  return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()]} ${dt.getFullYear()}`
}

function formatDateShort(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d + 'T00:00:00')
  return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()].slice(0,3)}`
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')} ${MESES[d.getMonth()].slice(0,3)} · ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function DiasBadge({ dias }: { dias: number }) {
  const cls = dias < 0
    ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : dias === 0 ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    : dias <= 3  ? 'bg-red-500/15 text-red-300 border-red-500/25'
    : dias <= 7  ? 'bg-amber-500/15 text-amber-400 border-amber-500/25'
    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  const label = dias < 0 ? `${Math.abs(dias)}d atraso` : dias === 0 ? 'HOJE' : dias === 1 ? 'Amanhã' : `${dias}d`
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls} shrink-0`}>{label}</span>
  )
}

function Section({ title, count, color, icon, children, empty }: {
  title: string; count: number; color: string; icon: string
  children: React.ReactNode; empty: string
}) {
  const [open, setOpen] = useState(true)
  return (
    <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className={`text-sm font-bold tracking-[0.2em] uppercase ${color}`}>{title}</span>
          {count > 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${color} bg-current/10`}
              style={{ borderColor: 'currentColor', opacity: 0.8 }}>
              {count}
            </span>
          )}
        </div>
        <span className={`text-white/20 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-3 flex flex-col gap-2">
          {count === 0
            ? <p className="text-white/20 text-xs tracking-widest py-4 text-center">{empty}</p>
            : children
          }
        </div>
      )}
    </div>
  )
}

function Row({ left, right, sub }: { left: string; right?: React.ReactNode; sub?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.05]">
      <div className="min-w-0">
        <p className="text-sm text-white/80 truncate">{left}</p>
        {sub && <p className="text-[10px] text-white/30 truncate mt-0.5">{sub}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

export default function RelatorioDiarioPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const now = new Date()
  const hoje = `${DIAS_SEMANA[now.getDay()]}, ${String(now.getDate()).padStart(2,'0')} ${MESES[now.getMonth()]} ${now.getFullYear()}`

  async function gerar() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/relatorio-diario', { cache: 'no-store' })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      setData(json)
    } catch (e: any) {
      setError('Erro de ligação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10 max-w-3xl mx-auto">

      {/* Back */}
      <Link href="/" className="text-[10px] tracking-[0.4em] text-white/20 hover:text-white/50 uppercase transition-colors">
        ‹ MENU
      </Link>

      {/* Hero */}
      <div className="mt-8 mb-10">
        <p className="text-[10px] tracking-[0.5em] text-white/15 uppercase mb-3">RL PHOTO · VIDEO</p>
        <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-white uppercase leading-[0.9]">
          RELATÓRIO<br />
          <span style={{ color: '#00D4AA' }}>DIÁRIO</span>
        </h1>
        <p className="text-white/25 text-sm mt-4 tracking-wider">{hoje}</p>
        {data && (
          <p className="text-white/15 text-[10px] mt-1 tracking-widest">
            Gerado às {formatDateTime(data.gerado_em)}
          </p>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={gerar}
        disabled={loading}
        className="flex items-center gap-3 px-8 py-4 rounded-full font-black text-sm tracking-[0.25em] uppercase transition-all duration-300 hover:scale-105 disabled:opacity-60 disabled:scale-100 mb-10"
        style={{
          background: loading ? '#007a63' : '#00D4AA',
          color: '#000',
          boxShadow: loading ? 'none' : '0 0 40px rgba(0,212,170,0.35)',
        }}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            A GERAR...
          </>
        ) : (
          <>
            GERAR RELATÓRIO
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
            </svg>
          </>
        )}
      </button>

      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Resumo rápido */}
      {data && (
        <>
          <div className="grid grid-cols-4 gap-2 mb-8">
            {[
              { label: 'Eventos', val: data.resumo.eventos_proximos, color: '#C9A84C' },
              { label: 'Leads', val: data.resumo.leads_urgentes, color: '#f87171' },
              { label: 'Portais', val: data.resumo.portal_atividade, color: '#00D4AA' },
              { label: 'Prazos', val: data.resumo.prazos_fotos + data.resumo.prazos_videos + data.resumo.albuns_aprovacao, color: '#fb923c' },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3 text-center">
                <p className="text-2xl font-black" style={{ color }}>{val}</p>
                <p className="text-[9px] tracking-widest text-white/30 uppercase mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">

            {/* ── EVENTOS PRÓXIMOS ── */}
            <Section title="Eventos Próximos" count={data.eventos.length} color="text-[#C9A84C]" icon="📅" empty="Sem eventos nos próximos 14 dias">
              {data.eventos.map((e: any) => (
                <Link key={e.id} href={`/eventos-2026/${e.id}`}>
                  <Row
                    left={e.cliente !== '—' ? e.cliente : e.referencia}
                    sub={[formatDateShort(e.data_evento), e.local !== '—' ? e.local : null, e.fotografo?.join(', ')].filter(Boolean).join(' · ')}
                    right={<DiasBadge dias={e.dias} />}
                  />
                </Link>
              ))}
            </Section>

            {/* ── LEADS CRM — URGENTES ── */}
            <Section title="Leads Urgentes" count={data.leads_urgentes.length + data.leads_morno.length} color="text-red-400" icon="🔥" empty="Sem leads urgentes">
              {data.leads_urgentes.map((l: any) => (
                <Link key={l.id} href={`/crm/${l.id}`}>
                  <Row
                    left={l.nome || '—'}
                    sub={[l.tipo_evento, l.como_chegou].filter(Boolean).join(' · ')}
                    right={<span className="text-[10px] font-bold text-red-400 bg-red-500/15 border border-red-500/25 px-2 py-0.5 rounded-full">🔥 Quente</span>}
                  />
                </Link>
              ))}
              {data.leads_morno.map((l: any) => (
                <Link key={l.id} href={`/crm/${l.id}`}>
                  <Row
                    left={l.nome || '—'}
                    sub={[l.tipo_evento, l.como_chegou].filter(Boolean).join(' · ')}
                    right={<span className="text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full">🌡 Morno</span>}
                  />
                </Link>
              ))}
            </Section>

            {/* ── PORTAIS NOIVOS — ATIVIDADE RECENTE ── */}
            <Section
              title="Portais — Atividade"
              count={data.portal_atividade.filter((a: any) => a.categoria === 'noivos').length}
              color="text-[#00D4AA]"
              icon="💌"
              empty="Sem atividade nos portais dos noivos nos últimos 7 dias"
            >
              {data.portal_atividade
                .filter((a: any) => a.categoria === 'noivos')
                .map((a: any, i: number) => (
                  <Row
                    key={i}
                    left={a.label}
                    sub={`${a.nomes} · ${a.referencia}`}
                    right={
                      <span className="text-[10px] text-white/30">
                        {a.diasAtras === 0 ? 'Hoje' : a.diasAtras === 1 ? 'Ontem' : `${a.diasAtras}d atrás`}
                      </span>
                    }
                  />
                ))}
            </Section>

            {/* ── EQUIPA — ATIVIDADE RECENTE ── */}
            <Section
              title="Equipa — Notificações"
              count={data.portal_atividade.filter((a: any) => a.categoria === 'equipa').length}
              color="text-purple-400"
              icon="👥"
              empty="Sem notificações à equipa nos últimos 7 dias"
            >
              {data.portal_atividade
                .filter((a: any) => a.categoria === 'equipa')
                .map((a: any, i: number) => (
                  <Row
                    key={i}
                    left={a.label}
                    sub={`${a.nomes} · ${a.referencia}`}
                    right={
                      <span className="text-[10px] text-white/30">
                        {a.diasAtras === 0 ? 'Hoje' : a.diasAtras === 1 ? 'Ontem' : `${a.diasAtras}d atrás`}
                      </span>
                    }
                  />
                ))}
            </Section>

            {/* ── PRAZOS FOTOS ── */}
            <Section title="Prazos Fotos" count={data.fotos_alerta.length} color="text-blue-400" icon="📸" empty="Todos os prazos de fotos em dia">
              {data.fotos_alerta.map((f: any, i: number) => (
                <Row
                  key={i}
                  left={f.nome}
                  sub={`${f.tipo} · ${f.ref}`}
                  right={<DiasBadge dias={f.dias} />}
                />
              ))}
            </Section>

            {/* ── PRAZOS VÍDEO ── */}
            <Section title="Prazos Vídeo" count={data.videos_alerta.length} color="text-amber-400" icon="🎬" empty="Todos os prazos de vídeo em dia">
              {data.videos_alerta.map((v: any, i: number) => (
                <Row
                  key={i}
                  left={v.cliente}
                  sub={v.ref}
                  right={<DiasBadge dias={v.dias} />}
                />
              ))}
            </Section>

            {/* ── ÁLBUNS — PRAZO ── */}
            <Section
              title="Álbuns — Prazos"
              count={data.albuns.length + data.albuns_aprovacao.length}
              color="text-emerald-400"
              icon="📗"
              empty="Sem álbuns com prazo próximo"
            >
              {data.albuns.map((a: any, i: number) => (
                <Row
                  key={i}
                  left={a.nome}
                  sub={`${a.ref}${a.data ? ` · ${formatDateShort(a.data)}` : ''}`}
                  right={<DiasBadge dias={a.dias} />}
                />
              ))}
              {data.albuns_aprovacao.map((a: any, i: number) => (
                <Row
                  key={`aprov-${i}`}
                  left={a.nome}
                  sub={a.ref}
                  right={<span className="text-[10px] font-bold text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/25 px-2 py-0.5 rounded-full">✓ Para Aprovação</span>}
                />
              ))}
            </Section>

            {/* ── PAGAMENTOS RECENTES ── */}
            <Section title="Pagamentos Recentes" count={data.pagamentos_recentes.length} color="text-green-400" icon="💶" empty="Sem pagamentos registados nos últimos 7 dias">
              {data.pagamentos_recentes.map((p: any, i: number) => (
                <Row
                  key={i}
                  left={`${p.referencia} · ${p.fase_pagamento}`}
                  sub={p.data_pagamento ? formatDate(p.data_pagamento) : '—'}
                  right={
                    p.valor_liquidado
                      ? <span className="text-green-400 font-bold text-sm">{Number(p.valor_liquidado).toLocaleString('pt-PT')} €</span>
                      : <span className="text-white/25 text-xs">Pendente</span>
                  }
                />
              ))}
            </Section>

          </div>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-[10px] tracking-[0.4em] text-white/15 uppercase">
              RL PHOTO · VIDEO · Relatório gerado às {formatDateTime(data.gerado_em)}
            </p>
          </div>
        </>
      )}

      {/* Estado inicial — sem dados ainda */}
      {!data && !loading && (
        <div className="text-center py-20">
          <p className="text-white/10 text-xs tracking-[0.4em] uppercase">
            Carrega em "Gerar Relatório" para ver<br />o resumo do dia
          </p>
        </div>
      )}

    </main>
  )
}
