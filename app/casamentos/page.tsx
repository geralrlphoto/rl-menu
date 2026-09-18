'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const ANOS = [
  { ano: 2025, img: '/newsletter/casamento-07.jpg' },
  { ano: 2026, img: '/casamentos-2026.jpg' },
  { ano: 2027, img: '/casamentos-2027.jpg' },
  { ano: 2028, img: '/casamentos-2028.webp' },
]

const ANO_DESTAQUE = 2026

type Proximo = { cliente: string; data: string; dias: number }
type Stats = {
  count: number       // casamentos
  eventos: number     // todos os eventos do ano
  total: number
  foto: number
  video: number
  realizados: number
  proximo: Proximo | null
}

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function diasAte(d: string) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  return Math.round((new Date(d + 'T00:00:00').getTime() - hoje.getTime()) / 86400000)
}

export default function CasamentosPage() {
  const [stats, setStats] = useState<Record<number, Stats>>({})
  const [aberto, setAberto] = useState<number>(ANO_DESTAQUE)

  useEffect(() => {
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0)

    Promise.all(
      ANOS.map(({ ano }) =>
        fetch(`/api/eventos-supabase?ano=${ano}`)
          .then(r => r.json())
          .then(d => {
            const events: any[] = d.events ?? []
            const comData = events.filter(e => e.data_evento)
            const futuros = comData
              .filter(e => new Date(e.data_evento + 'T00:00:00') >= hoje)
              .sort((a, b) => a.data_evento.localeCompare(b.data_evento))
            const p = futuros[0]
            const totais = d.totais ?? { foto: 0, video: 0, geral: 0 }
            return {
              ano,
              count: events.filter(e => (e.tipo_evento ?? []).includes('CASAMENTO')).length,
              eventos: events.length,
              total: totais.geral, foto: totais.foto, video: totais.video,
              realizados: comData.filter(e => new Date(e.data_evento + 'T00:00:00') < hoje).length,
              proximo: p ? { cliente: p.cliente ?? '', data: p.data_evento, dias: diasAte(p.data_evento) } : null,
            }
          })
          .catch(() => ({ ano, count: 0, eventos: 0, total: 0, foto: 0, video: 0, realizados: 0, proximo: null }))
      )
    ).then(res => {
      const s: Record<number, Stats> = {}
      for (const r of res) s[r.ano] = r
      setStats(s)
    })
  }, [])

  const destaque = stats[ANO_DESTAQUE]
  const totalGeral = Object.values(stats).reduce((acc, s) => acc + s.total, 0)
  const totalCasamentos = Object.values(stats).reduce((acc, s) => acc + s.count, 0)
  const proximoGlobal = Object.values(stats)
    .map(s => s.proximo).filter(Boolean)
    .sort((a, b) => a!.dias - b!.dias)[0] ?? null

  return (
    <main className="min-h-screen bg-[#0a0908]">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[78vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src="/eventos-hero-2026.webp" alt=""
            className="w-full h-full object-cover object-[center_35%]" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(100deg, rgba(8,7,5,0.95) 0%, rgba(8,7,5,0.72) 45%, rgba(8,7,5,0.25) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0a0908 2%, transparent 45%)' }} />
        </div>

        <div className="relative w-full max-w-6xl mx-auto px-6 sm:px-10 pb-14 pt-24">
          <Link href="/photo"
            className="inline-block text-[10px] tracking-[0.42em] text-white/40 hover:text-gold transition-colors uppercase mb-10">
            ‹ Menu
          </Link>

          <p className="text-[10px] tracking-[0.5em] uppercase text-gold/70">RL Photo · Video</p>
          <h1 className="font-cormorant font-light text-white text-6xl sm:text-8xl leading-[0.95] tracking-[0.04em] mt-4">
            Casamentos
          </h1>
          <div className="w-24 h-px bg-gold/70 my-6" />

          <p className="font-cormorant italic text-white/70 text-lg sm:text-xl max-w-xl leading-snug">
            {totalCasamentos > 0
              ? `${totalCasamentos} casamentos registados · ${totalGeral.toLocaleString('pt-PT')} € em quatro temporadas`
              : 'A carregar as temporadas…'}
          </p>

          {/* Próximo evento — o número que interessa hoje */}
          {proximoGlobal && (
            <div className="mt-8 inline-flex items-center gap-5 rounded-2xl border border-gold/25 bg-black/40 backdrop-blur-md px-6 py-4">
              <div className="text-center">
                <p className="text-4xl font-extralight text-gold leading-none">{proximoGlobal.dias}</p>
                <p className="text-[9px] tracking-[0.3em] uppercase text-gold/50 mt-1">
                  {proximoGlobal.dias === 1 ? 'dia' : 'dias'}
                </p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-[9px] tracking-[0.35em] uppercase text-white/35 mb-1">Próximo casamento</p>
                <p className="text-white/90 text-sm tracking-wide uppercase">{proximoGlobal.cliente}</p>
                <p className="text-white/40 text-[11px] mt-0.5">
                  {new Date(proximoGlobal.data + 'T00:00:00').getDate()} {MESES[new Date(proximoGlobal.data + 'T00:00:00').getMonth()]}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── TEMPORADAS ───────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 pb-20 -mt-4">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-[10px] tracking-[0.45em] uppercase text-white/30">Temporadas</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-[9px] tracking-[0.3em] uppercase text-white/20 hidden sm:block">
            passa o rato para abrir
          </span>
        </div>

        {/* Acordeão: o ano em foco ocupa o espaço, os outros ficam em coluna estreita */}
        <div className="hidden sm:flex gap-3 h-[460px]">
          {ANOS.map(({ ano, img }) => {
            const s = stats[ano]
            const ativo = aberto === ano
            const progresso = s && s.eventos > 0 ? (s.realizados / s.eventos) * 100 : 0
            return (
              <Link
                key={ano}
                href={`/eventos-2026?ano=${ano}`}
                onMouseEnter={() => setAberto(ano)}
                onFocus={() => setAberto(ano)}
                className="group relative rounded-3xl overflow-hidden border"
                style={{
                  flex: ativo ? '4 1 0%' : '1 1 0%',
                  transition: 'flex .55s cubic-bezier(.2,.7,.2,1), border-color .4s ease',
                  borderColor: ativo ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <img src={img} alt={String(ano)}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    filter: ativo ? 'saturate(1.05)' : 'grayscale(0.55) brightness(0.65)',
                    transform: ativo ? 'scale(1.03)' : 'scale(1)',
                    transition: 'filter .55s ease, transform .9s ease',
                  }} />
                <div className="absolute inset-0"
                  style={{ background: ativo
                    ? 'linear-gradient(to top, rgba(6,5,4,0.94) 12%, rgba(6,5,4,0.35) 55%, rgba(6,5,4,0.15) 100%)'
                    : 'linear-gradient(to top, rgba(6,5,4,0.9), rgba(6,5,4,0.55))' }} />

                {/* Ano na vertical quando fechado */}
                {!ativo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-cormorant text-white/80 text-4xl tracking-[0.2em]"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                      {ano}
                    </span>
                  </div>
                )}

                {/* Conteúdo quando aberto */}
                <div className="relative h-full flex flex-col justify-end p-7"
                  style={{ opacity: ativo ? 1 : 0, transition: 'opacity .4s ease .1s', pointerEvents: ativo ? 'auto' : 'none' }}>
                  <span className="absolute top-6 left-7 text-[9px] tracking-[0.35em] uppercase px-3 py-1 rounded-full border border-gold/40 text-gold/85 bg-black/30 backdrop-blur-sm whitespace-nowrap">
                    Temporada
                  </span>

                  <p className="font-cormorant text-gold text-7xl leading-none tracking-[0.04em]">{ano}</p>
                  <div className="w-16 h-px bg-gold/60 my-5" />

                  <div className="grid grid-cols-3 gap-4 mb-5">
                    {[
                      { l: 'Casamentos', v: s ? String(s.count) : '—' },
                      { l: 'Realizados', v: s ? `${s.realizados}/${s.eventos}` : '—' },
                      { l: 'Faturação', v: s && s.total > 0 ? `${s.total.toLocaleString('pt-PT')} €` : '—' },
                    ].map(({ l, v }) => (
                      <div key={l} className="min-w-0">
                        <p className="text-[8.5px] tracking-[0.3em] uppercase text-white/35 mb-1.5 truncate">{l}</p>
                        <p className="text-lg font-light text-white truncate">{v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="h-[3px] rounded-full bg-white/10 overflow-hidden mb-5">
                    <div className="h-full rounded-full bg-gold/80"
                      style={{ width: `${progresso}%`, transition: 'width .8s ease' }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] tracking-[0.35em] uppercase text-white/50 group-hover:text-gold transition-colors">
                      {s?.proximo ? `Próximo em ${s.proximo.dias} dias` : 'Ver temporada'}
                    </span>
                    <span className="w-9 h-9 rounded-full border border-gold/35 text-gold flex items-center justify-center group-hover:bg-gold group-hover:text-black transition-all">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Telemóvel: cartões empilhados */}
        <div className="sm:hidden flex flex-col gap-4">
          {ANOS.map(({ ano, img }) => {
            const s = stats[ano]
            return (
              <Link key={ano} href={`/eventos-2026?ano=${ano}`}
                className="relative rounded-2xl overflow-hidden border border-white/10 h-44 flex items-end">
                <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,5,4,0.95), rgba(6,5,4,0.3))' }} />
                <div className="relative w-full p-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="font-cormorant text-gold text-4xl leading-none">{ano}</p>
                    <p className="text-[10px] text-white/45 mt-2 tracking-wider uppercase">
                      {s ? `${s.count} casamentos · ${s.realizados}/${s.eventos} feitos` : '—'}
                    </p>
                  </div>
                  <span className="text-white/60 text-lg">›</span>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Resumo global */}
        {destaque && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-10">
            {[
              { l: 'Fotografia', v: `${destaque.foto.toLocaleString('pt-PT')} €`, s: `Temporada ${ANO_DESTAQUE}` },
              { l: 'Vídeo', v: `${destaque.video.toLocaleString('pt-PT')} €`, s: `Temporada ${ANO_DESTAQUE}` },
              { l: 'Total da temporada', v: `${destaque.total.toLocaleString('pt-PT')} €`, s: `${destaque.eventos} eventos`, gold: true },
              { l: 'Quatro temporadas', v: `${totalGeral.toLocaleString('pt-PT')} €`, s: `${totalCasamentos} casamentos` },
            ].map(({ l, v, s, gold }) => (
              <div key={l} className="rounded-2xl border px-5 py-4"
                style={{
                  borderColor: gold ? 'rgba(201,168,76,0.35)' : 'rgba(255,255,255,0.08)',
                  background: gold ? 'rgba(201,168,76,0.05)' : 'rgba(255,255,255,0.02)',
                }}>
                <p className="text-[9px] tracking-[0.3em] uppercase mb-2"
                  style={{ color: gold ? 'rgba(201,168,76,0.75)' : 'rgba(255,255,255,0.35)' }}>{l}</p>
                <p className="text-xl font-light" style={{ color: gold ? '#e8c76d' : '#fff' }}>{v}</p>
                <p className="text-[10px] text-white/30 mt-1">{s}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
