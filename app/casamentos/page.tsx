'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const ANOS = [
  { ano: 2025, img: '/newsletter/casamento-07.jpg' },
  { ano: 2026, img: '/casamentos-2026.jpg' },
  { ano: 2027, img: '/casamentos-2027.jpg' },
  { ano: 2028, img: '/casamentos-2028.png' },
]

type Stats = { count: number; total: number; foto: number; video: number }

export default function CasamentosPage() {
  const [stats, setStats] = useState<Record<number, Stats>>({})

  useEffect(() => {
    Promise.all(
      [2025, 2026, 2027, 2028].map(ano =>
        fetch(`/api/eventos-supabase?ano=${ano}`)
          .then(r => r.json())
          .then(d => {
            const events: any[] = d.events ?? []
            // Contar apenas eventos do tipo CASAMENTO (coerente com /eventos-2026)
            const casamentosCount = events.filter((e: any) => (e.tipo_evento ?? []).includes('CASAMENTO')).length
            // Total = soma de TODOS os eventos (coerente com /eventos-2026)
            const totais = d.totais ?? { foto: 0, video: 0, geral: 0 }
            return { ano, count: casamentosCount, total: totais.geral, foto: totais.foto, video: totais.video }
          })
          .catch(() => ({ ano, count: 0, total: 0, foto: 0, video: 0 }))
      )
    ).then(results => {
      const s: Record<number, Stats> = {}
      for (const r of results) s[r.ano] = { count: r.count, total: r.total, foto: r.foto, video: r.video }
      setStats(s)
    })
  }, [])

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-12 max-w-5xl mx-auto">
      <div className="mb-12">
        <Link href="/" className="text-xs tracking-[0.3em] text-white/20 hover:text-gold transition-colors uppercase">‹ Menu</Link>
        <h1 className="text-4xl sm:text-6xl font-extralight tracking-[0.15em] text-white uppercase mt-3">Casamentos</h1>
        <p className="text-white/20 text-xs tracking-[0.3em] mt-2 uppercase">Seleciona o ano</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {ANOS.map(({ ano, img }) => {
          const s = stats[ano]
          return (
            <Link key={ano} href={`/eventos-2026?ano=${ano}`}
              className="group relative overflow-hidden rounded-2xl aspect-[3/4] flex flex-col justify-between cursor-pointer"
              style={{ textDecoration: 'none' }}>

              {/* Imagem de fundo */}
              <div className="absolute inset-0">
                <img src={img} alt={String(ano)}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
              </div>

              {/* Conteúdo */}
              <div className="relative z-10 p-5 flex flex-col h-full justify-between">

                {/* Topo */}
                <div className="flex items-center gap-2">
                  <span className="text-[9px] tracking-[0.35em] uppercase px-2.5 py-1 rounded-full border border-gold/40 text-gold/80 bg-gold/10">
                    RL PHOTO · VIDEO
                  </span>
                </div>

                {/* Base */}
                <div className="space-y-4">
                  {/* Ano */}
                  <div>
                    <p className="text-[11px] tracking-[0.4em] text-white/40 uppercase mb-1">Casamentos</p>
                    <p className="text-6xl font-extralight text-white tracking-wider leading-none">{ano}</p>
                  </div>

                  {/* Divisor */}
                  <div className="w-full h-px bg-white/10" />

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Eventos</p>
                      <p className="text-xl font-light text-white">
                        {s ? s.count : <span className="text-white/20 text-sm">—</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Total</p>
                      <p className="text-xl font-light text-white">
                        {s && s.total > 0
                          ? `${s.total.toLocaleString('pt-PT')} €`
                          : <span className="text-white/20 text-sm">—</span>}
                      </p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] tracking-[0.3em] text-white/40 uppercase group-hover:text-gold transition-colors">Ver casamentos</span>
                    <span className="text-white/30 group-hover:text-gold transition-colors text-lg">›</span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </main>
  )
}
