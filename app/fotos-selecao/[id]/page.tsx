'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Row = {
  id: string
  nome_noivos: string | null
  referencia: string | null
  date: string | null
  data_entrada: string | null
  sessao_noivos: string | null
  fotos_noiva: string | null
  fotos_noivo: string | null
  convidados: string | null
  cerimonia: string | null
  bolo_bouquet: string | null
  sala_animacao: string | null
  fotos_album: string | null
  detalhes: string | null
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  try {
    const dt = new Date(d)
    return dt.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return d }
}

export default function FotosSelecaoFichaPage() {
  const { id } = useParams<{ id: string }>()
  const [row, setRow] = useState<Row | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/fotos-selecao/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.row) setRow(d.row as Row)
        else setError('Ficha não encontrada')
      })
      .catch(() => setError('Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center bg-[#0B0B0B]">
      <p className="text-white/20 text-[14px] tracking-widest uppercase">A carregar...</p>
    </main>
  )

  if (error || !row) return (
    <main className="min-h-screen flex items-center justify-center bg-[#0B0B0B]">
      <p className="text-red-400/50 text-[14px]">{error ?? 'Ficha não encontrada'}</p>
    </main>
  )

  const counts: Array<{ label: string; value: string | null }> = [
    { label: 'Sessão Noivos',  value: row.sessao_noivos },
    { label: 'Fotos da Noiva', value: row.fotos_noiva },
    { label: 'Fotos do Noivo', value: row.fotos_noivo },
    { label: 'Convidados',     value: row.convidados },
    { label: 'Cerimónia',      value: row.cerimonia },
    { label: 'Bolo & Bouquet', value: row.bolo_bouquet },
    { label: 'Sala & Animação',value: row.sala_animacao },
    { label: 'Fotos p/ Álbum', value: row.fotos_album },
  ]

  const totalFotos = counts.reduce((acc, c) => {
    const n = Number(c.value)
    return acc + (Number.isFinite(n) ? n : 0)
  }, 0)

  return (
    <main className="min-h-screen text-white" style={{ background: '#0B0B0B' }}>
      {/* Atmosfera dourada subtil */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 80% 20%, rgba(201,164,92,0.05), transparent 65%)' }} />

      <div className="relative z-10 max-w-3xl mx-auto px-5 py-10 sm:py-14">
        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.5em] text-gold/60 uppercase font-light mb-2">Seleção de Fotos · Editor</p>
          <h1 className="text-3xl sm:text-4xl font-light text-white tracking-[0.12em] uppercase mb-1" style={{ fontFamily: 'Georgia, serif' }}>
            {row.nome_noivos || '—'}
          </h1>
          {row.referencia && (
            <p className="text-[12px] text-white/35 tracking-widest">{row.referencia}</p>
          )}
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Data do Evento</p>
            <p className="text-[15px] text-white/85 font-medium">{fmtDate(row.date)}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Data de Entrada</p>
            <p className="text-[15px] text-white/85 font-medium">{fmtDate(row.data_entrada)}</p>
          </div>
        </div>

        {/* Hero — Total */}
        <div className="mb-6 rounded-2xl border border-gold/30 p-5 sm:p-6"
          style={{
            background: 'linear-gradient(135deg, rgba(201,164,92,0.10), rgba(201,164,92,0.02))',
            boxShadow: '0 0 24px -8px rgba(201,164,92,0.3), inset 0 0 0 1px rgba(201,164,92,0.10)',
          }}>
          <p className="text-[10px] tracking-[0.4em] text-gold/70 uppercase mb-2">Total de Fotos para Edição</p>
          <p className="text-5xl sm:text-6xl font-light text-gold tabular-nums" style={{ fontFamily: 'Georgia, serif' }}>
            {totalFotos.toLocaleString('pt-PT')}
          </p>
        </div>

        {/* Contagens */}
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.4em] text-white/35 uppercase mb-3">Contagem de Fotos</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {counts.map(c => (
              <div key={c.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[9px] tracking-[0.25em] text-white/30 uppercase mb-1.5 leading-tight">{c.label}</p>
                <p className="text-2xl text-white/90 font-light tabular-nums leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                  {c.value || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Detalhes (texto livre dos noivos) */}
        {row.detalhes && (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <p className="text-[10px] tracking-[0.4em] text-white/35 uppercase mb-3">Detalhes & Observações</p>
            <p className="text-[14px] text-white/75 leading-relaxed whitespace-pre-wrap">{row.detalhes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-white/[0.05] text-center">
          <p className="text-[10px] tracking-[0.5em] text-white/20 uppercase">RL Photo · Video</p>
        </div>
      </div>
    </main>
  )
}
