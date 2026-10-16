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
  // Faturação = valor de vídeo (o que é cobrado pelo serviço RL); a fotografia
  // é cobrada ao cliente mas segue para o fotógrafo.
  const totalGeral = Object.values(stats).reduce((acc, s) => acc + s.video, 0)
  const totalCasamentos = Object.values(stats).reduce((acc, s) => acc + s.count, 0)
  const proximoGlobal = Object.values(stats)
    .map(s => s.proximo).filter(Boolean)
    .sort((a, b) => a!.dias - b!.dias)[0] ?? null

  return (
    <main className="min-h-screen bg-[#070707] overflow-x-clip font-cond">

      {/* ── CAPA (fotos locais da Vercel: não gastam egress do Supabase) ───── */}
      <section className="relative min-h-[640px] lg:min-h-[86vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/eventos-hero-2026.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_35%] grayscale opacity-40 lg:opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>

        {/* Traço dourado: alianças entrelaçadas e mira de focagem */}
        <svg className="pointer-events-none absolute right-[6%] top-[14%] w-[440px] max-w-[62vw] opacity-55" viewBox="0 0 440 300" fill="none" stroke="#C9A84C" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
          <ellipse cx="170" cy="170" rx="70" ry="66" opacity="0.75" />
          <ellipse cx="170" cy="170" rx="58" ry="54" opacity="0.4" />
          <ellipse cx="255" cy="170" rx="70" ry="66" opacity="0.75" />
          <ellipse cx="255" cy="170" rx="58" ry="54" opacity="0.4" />
          <path d="M240 102 l14 -26 l14 26 l-14 10 z" opacity="0.8" />
          <circle cx="380" cy="60" r="12" opacity="0.8" />
          <path d="M380 42 v8 M380 70 v8 M362 60 h8 M390 60 h8" opacity="0.8" />
          <path d="M30 40 C 80 10, 130 20, 150 60" opacity="0.4" />
        </svg>

        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Palmela · Portugal · Desde 2025
        </p>
        <span className="hidden lg:block absolute left-[34%] top-[26%] w-2.5 h-2.5 rounded-full bg-[#C9A84C]" />
        <span className="hidden lg:block absolute left-[33.2%] top-[31%] w-11 h-11 rounded-full border border-[#C9A84C]/45" />

        <div className="relative flex-1 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_320px] gap-10 items-end pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-16 lg:pt-8 pb-12 lg:pb-16">
          <div className="min-w-0 flex flex-col h-full">
            <Link href="/photo" className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors self-start">‹ Menu principal</Link>

            <div className="mt-auto pt-20">
              <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
              <h1 className="font-bold uppercase text-white leading-[0.88] text-[50px] sm:text-[88px] lg:text-[80px] xl:text-[128px] 2xl:text-[150px] mt-2 whitespace-nowrap">
                Casamentos
              </h1>
              <div className="flex items-center gap-4 mt-5">
                <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
                <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                  {ANOS.map((a, i) => (
                    <span key={a.ano}>{i > 0 && ' · '}<span className={a.ano === ANO_DESTAQUE ? 'text-[#C9A84C]' : ''}>{a.ano}</span></span>
                  ))}
                </p>
              </div>
              <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-xl">
                {totalCasamentos > 0
                  ? `${totalCasamentos} casamentos registados em quatro temporadas. Escolhe uma temporada para ver os eventos.`
                  : 'A carregar as temporadas…'}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <Link href={`/eventos-2026?ano=${ANO_DESTAQUE}`}
                  className="inline-flex items-center gap-2.5 border border-[#C9A84C]/70 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/30 px-7 py-3.5 text-[15px] font-semibold tracking-[0.18em] uppercase text-white transition-all shadow-[0_0_34px_-12px_rgba(201,168,76,0.7)]">
                  Temporada {ANO_DESTAQUE}
                  <span className="text-[#C9A84C]">→</span>
                </Link>
                <Link href="/calendario"
                  className="inline-flex items-center gap-2 border border-white/15 hover:border-white/35 bg-black/30 px-6 py-3.5 text-[15px] font-semibold tracking-[0.18em] uppercase text-white/85 transition-all">
                  / Calendário
                </Link>
              </div>
            </div>
          </div>

          {/* Números e próximo casamento */}
          <aside className="rounded-[22px] border border-[#C9A84C]/30 bg-[#111111]/80 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(201,168,76,0.5)]">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_#C9A84C]" />
              Temporada {ANO_DESTAQUE}
            </p>
            <div className="grid grid-cols-2 mt-3">
              {[
                { l: 'Casamentos', v: destaque ? String(destaque.count) : '—' },
                { l: 'Realizados', v: destaque ? `${destaque.realizados}/${destaque.eventos}` : '—' },
                { l: 'Faturação vídeo', v: destaque ? `${destaque.video.toLocaleString('pt-PT')} €` : '—', ouro: true },
                { l: 'Em fotografia', v: destaque ? `${destaque.foto.toLocaleString('pt-PT')} €` : '—' },
              ].map((x, i) => (
                <div key={x.l} className={`py-3 ${i % 2 === 0 ? 'pr-4 border-r border-white/[0.07]' : 'pl-4'} ${i < 2 ? 'border-b border-white/[0.07]' : ''}`}>
                  <p className="text-[11px] text-white/50">{x.l}</p>
                  <p className={`font-semibold text-[21px] leading-none mt-1.5 ${x.ouro ? 'text-[#C9A84C]' : 'text-white'}`}>{x.v}</p>
                </div>
              ))}
            </div>
            {proximoGlobal && (
              <div className="mt-4 flex items-center gap-3.5 rounded-[16px] border border-white/[0.08] bg-black/30 px-3.5 py-3">
                <span className="w-12 h-12 shrink-0 rounded-full flex flex-col items-center justify-center bg-[#C9A84C]/14 text-[#C9A84C]" style={{ background: 'rgba(201,168,76,0.14)' }}>
                  <span className="font-semibold text-[18px] leading-none">{proximoGlobal.dias === 0 ? 'Hoje' : proximoGlobal.dias}</span>
                  {proximoGlobal.dias > 0 && <span className="text-[9px] text-[#C9A84C]/70 mt-0.5">{proximoGlobal.dias === 1 ? 'dia' : 'dias'}</span>}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium tracking-[0.18em] uppercase text-[#C9A84C]/80">Próximo casamento</p>
                  <p className="font-semibold text-[15px] text-white truncate">{proximoGlobal.cliente}</p>
                  <p className="text-[12px] text-white/40">
                    {new Date(proximoGlobal.data + 'T00:00:00').getDate()} {MESES[new Date(proximoGlobal.data + 'T00:00:00').getMonth()]}
                  </p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>

      {/* ── TEMPORADAS ───────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-10 pt-6 pb-20">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Temporadas</p>
            <h2 className="font-semibold text-white text-[30px] sm:text-[34px] leading-tight mt-1">Escolhe o ano</h2>
          </div>
          <span className="hidden sm:block text-[13px] text-white/30">Passa o rato para abrir</span>
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
                className="group relative rounded-[24px] overflow-hidden border"
                style={{
                  flex: ativo ? '4 1 0%' : '1 1 0%',
                  transition: 'flex .55s cubic-bezier(.2,.7,.2,1), border-color .4s ease, box-shadow .4s ease',
                  borderColor: ativo ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.12)',
                  boxShadow: ativo ? '0 0 50px -20px rgba(201,168,76,0.6)' : 'none',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt={String(ano)}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    filter: ativo ? 'grayscale(0.2) brightness(0.9)' : 'grayscale(1) brightness(0.55)',
                    transform: ativo ? 'scale(1.03)' : 'scale(1)',
                    transition: 'filter .55s ease, transform .9s ease',
                  }} />
                <div className="absolute inset-0"
                  style={{ background: ativo
                    ? 'linear-gradient(to top, rgba(7,7,7,0.95) 15%, rgba(7,7,7,0.35) 55%, rgba(7,7,7,0.1) 100%)'
                    : 'linear-gradient(to top, rgba(7,7,7,0.9), rgba(7,7,7,0.55))' }} />

                {!ativo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-white/75 text-[38px] tracking-[0.15em]"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                      {ano}
                    </span>
                  </div>
                )}

                <div className="relative h-full flex flex-col justify-end p-7"
                  style={{ opacity: ativo ? 1 : 0, transition: 'opacity .4s ease .1s', pointerEvents: ativo ? 'auto' : 'none' }}>
                  <span className="absolute top-6 left-7 text-[11px] font-medium tracking-[0.2em] uppercase px-3 py-1 rounded-full border border-[#C9A84C]/45 text-[#C9A84C] bg-black/40 backdrop-blur-sm whitespace-nowrap">
                    Temporada
                  </span>

                  <p className="font-bold text-white text-[84px] leading-none">{ano}</p>
                  <div className="w-16 h-px bg-[#C9A84C] my-5" />

                  <div className="grid grid-cols-3 gap-4 mb-5">
                    {[
                      { l: 'Casamentos', v: s ? String(s.count) : '—' },
                      { l: 'Realizados', v: s ? `${s.realizados}/${s.eventos}` : '—' },
                      { l: 'Faturação', v: s && s.video > 0 ? `${s.video.toLocaleString('pt-PT')} €` : '—' },
                    ].map(({ l, v }) => (
                      <div key={l} className="min-w-0">
                        <p className="text-[11px] tracking-[0.12em] uppercase text-white/45 mb-1 truncate">{l}</p>
                        <p className="text-[22px] font-semibold text-white truncate">{v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-5">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#C9A84C]/50 to-[#C9A84C]"
                      style={{ width: `${progresso}%`, transition: 'width .8s ease' }} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-white/60 group-hover:text-[#C9A84C] transition-colors">
                      {!s?.proximo ? 'Ver temporada'
                        : s.proximo.dias === 0 ? 'Casamento hoje'
                        : s.proximo.dias === 1 ? 'Próximo amanhã'
                        : `Próximo em ${s.proximo.dias} dias`}
                    </span>
                    <span className="w-10 h-10 rounded-full border border-[#C9A84C]/45 text-[#C9A84C] flex items-center justify-center group-hover:bg-[#C9A84C]/25 transition-all">
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
            const progresso = s && s.eventos > 0 ? (s.realizados / s.eventos) * 100 : 0
            return (
              <Link key={ano} href={`/eventos-2026?ano=${ano}`}
                className="relative rounded-[22px] overflow-hidden border h-48 flex items-end"
                style={{ borderColor: ano === ANO_DESTAQUE ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.15)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover grayscale-[60%]" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,7,7,0.95), rgba(7,7,7,0.3))' }} />
                <div className="relative w-full p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-white text-[44px] leading-none">{ano}</p>
                      <p className="text-[13px] text-white/55 mt-2">
                        {s ? `${s.count} casamentos · ${s.realizados}/${s.eventos} feitos` : 'A carregar…'}
                      </p>
                    </div>
                    <span className="w-10 h-10 shrink-0 rounded-full border border-[#C9A84C]/45 text-[#C9A84C] flex items-center justify-center">→</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden mt-3">
                    <div className="h-full rounded-full bg-[#C9A84C]" style={{ width: `${progresso}%` }} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Resumo global */}
        {destaque && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {[
              { l: 'Faturação vídeo', v: `${destaque.video.toLocaleString('pt-PT')} €`, s: `Temporada ${ANO_DESTAQUE}`, ouro: true },
              { l: 'Cobrado em fotografia', v: `${destaque.foto.toLocaleString('pt-PT')} €`, s: 'Segue para o fotógrafo' },
              { l: 'Eventos da temporada', v: String(destaque.eventos), s: `${destaque.realizados} já realizados` },
              { l: 'Quatro temporadas', v: `${totalGeral.toLocaleString('pt-PT')} €`, s: `${totalCasamentos} casamentos` },
            ].map(({ l, v, s, ouro }) => (
              <div key={l} className="rounded-[20px] border bg-[#111111]/90 px-5 py-4"
                style={{ borderColor: ouro ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.14)', borderLeft: `2px solid rgba(201,168,76,${ouro ? 0.9 : 0.4})` }}>
                <p className="text-[11px] tracking-[0.12em] uppercase mb-2 text-[#C9A84C]/80">{l}</p>
                <p className={`text-[24px] font-semibold leading-none ${ouro ? 'text-[#C9A84C]' : 'text-white'}`}>{v}</p>
                <p className="text-[12px] text-white/35 mt-1.5">{s}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
