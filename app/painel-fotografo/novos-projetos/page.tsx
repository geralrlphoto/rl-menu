'use client'

// Painel do Fotógrafo › Os meus casamentos: os casamentos em que o fotógrafo está na
// equipa, com a fase e o prazo do Departamento de Fotografia (lib/fotografiaFluxo.ts):
// sneak peek 48 h → galeria online 7 dias → fotos p/ seleção 30 dias → seleção dos
// noivos → edição 30 dias → entregue. As fases mudam no Departamento (RL); aqui só se vê.
// Desenho como o /freelancers e o /tickets.

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getFotografoId } from '../_data/freelancer-profile'

type Casamento = {
  referencia: string
  noivos: string | null
  data: string
  local: string | null
  funcoes: string[]
  fase: string
  faseTitulo: string
  prazo: string | null
  album: string | null
}

const OURO = '#C9A84C'
const COR_FASE: Record<string, string> = {
  agendado: '#8a8a8a', sneakpeek: '#e8a33d', galerias: '#e8a33d', selecao: '#e8a33d',
  escolha: '#6aa7ff', edicao: '#c084fc', entregue: '#34d399',
}
const ORDEM = ['sneakpeek', 'galerias', 'selecao', 'escolha', 'edicao', 'agendado', 'entregue']
const FILTROS = [
  { k: 'todos', t: 'Todos' },
  { k: 'curso', t: 'Em curso' },
  { k: 'agendado', t: 'Por realizar' },
  { k: 'entregue', t: 'Entregues' },
]

const hoje = () => new Date().toISOString().slice(0, 10)
const dias = (iso: string) => Math.round((new Date(iso + 'T12:00:00Z').getTime() - new Date(hoje() + 'T12:00:00Z').getTime()) / 86400000)
const dataPt = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

function OsMeusCasamentos() {
  const params = useSearchParams()
  const [lista, setLista] = useState<Casamento[] | null>(null)
  const [erro, setErro] = useState('')
  const [filtro, setFiltro] = useState('curso')

  useEffect(() => {
    const id = getFotografoId(params?.get('freelancer'))
    if (!id) { setLista([]); return }
    fetch(`/api/painel-fotografo/casamentos?freelancer=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => { if (d.error) setErro(d.error); setLista(Array.isArray(d.casamentos) ? d.casamentos : []) })
      .catch(() => { setErro('Não foi possível carregar os casamentos.'); setLista([]) })
  }, [params])

  const contas = useMemo(() => {
    const l = lista ?? []
    return {
      curso: l.filter(c => c.fase !== 'agendado' && c.fase !== 'entregue').length,
      agendado: l.filter(c => c.fase === 'agendado').length,
      entregue: l.filter(c => c.fase === 'entregue').length,
      atrasados: l.filter(c => c.prazo && c.fase !== 'entregue' && dias(c.prazo) < 0).length,
    }
  }, [lista])

  const visiveis = useMemo(() => (lista ?? [])
    .filter(c => filtro === 'todos' || (filtro === 'curso' ? c.fase !== 'agendado' && c.fase !== 'entregue' : c.fase === filtro))
    .sort((a, b) => ORDEM.indexOf(a.fase) - ORDEM.indexOf(b.fase) || (a.prazo ?? a.data).localeCompare(b.prazo ?? b.data)), [lista, filtro])

  return (
    <main className="min-h-screen bg-[#070707] overflow-x-clip font-cond text-white">
      {/* ── CAPA ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[460px] lg:min-h-[56vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/email/equipa-camera.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center grayscale opacity-60 lg:opacity-80" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />

        <div className="relative flex-1 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_330px] gap-10 items-end pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-14 lg:pt-8 pb-12 lg:pb-16">
          <div className="min-w-0 flex flex-col h-full">
            <a href="/painel-fotografo" className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ O meu painel</a>
            <div className="mt-auto pt-16">
              <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
              <h1 className="font-bold uppercase text-white leading-[0.88] text-[52px] sm:text-[88px] xl:text-[112px] mt-2">Os meus<br />casamentos</h1>
              <div className="flex items-center gap-4 mt-5">
                <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
                <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">Departamento de <span className="text-[#C9A84C]">Fotografia</span></p>
              </div>
              <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-2xl">
                Sneak peek em 48 horas, galeria online em 7 dias, fotos para seleção em 30 dias e edição 30 dias depois de chegar a seleção dos noivos.
              </p>
            </div>
          </div>

          <aside className="rounded-[22px] border border-[#C9A84C]/30 bg-[#111111]/80 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(201,168,76,0.5)]">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_#C9A84C]" />
              Os meus números
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                { l: 'Em curso', v: contas.curso, ouro: true },
                { l: 'Atrasados', v: contas.atrasados, vermelho: contas.atrasados > 0 },
                { l: 'Por realizar', v: contas.agendado },
                { l: 'Entregues', v: contas.entregue },
              ].map(x => (
                <div key={x.l} className="rounded-[14px] border border-white/[0.08] bg-black/30 px-3.5 py-3">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">{x.l}</p>
                  <p className={`font-semibold text-[24px] leading-none mt-1.5 ${x.vermelho ? 'text-red-400' : x.ouro ? 'text-[#C9A84C]' : 'text-white'}`}>{lista ? x.v : '·'}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <div className="px-5 sm:px-16 lg:px-24 pb-24">
        <nav className="flex flex-wrap gap-2 mb-8">
          {FILTROS.map(f => {
            const on = filtro === f.k
            return (
              <button key={f.k} onClick={() => setFiltro(f.k)}
                className="px-4 py-2 rounded-full text-[13px] font-semibold tracking-[0.12em] uppercase transition-all"
                style={on
                  ? { border: '1px solid rgba(201,168,76,.7)', background: 'rgba(201,168,76,.15)', color: OURO, boxShadow: '0 0 18px -6px rgba(201,168,76,.6)' }
                  : { border: '1px solid rgba(255,255,255,.12)', color: 'rgba(255,255,255,.6)' }}>
                {f.t}
              </button>
            )
          })}
        </nav>

        {erro && <p className="text-red-400 text-[14px] mb-6">{erro}</p>}
        {!lista && <p className="text-white/40 text-[14px] tracking-[0.2em] uppercase">A carregar…</p>}
        {lista && visiveis.length === 0 && !erro && (
          <p className="text-white/40 text-[15px]">Sem casamentos neste filtro.</p>
        )}

        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 360px), 1fr))' }}>
          {visiveis.map(c => {
            const cor = COR_FASE[c.fase] ?? OURO
            const falta = c.prazo && c.fase !== 'entregue' ? dias(c.prazo) : null
            return (
              <article key={c.referencia}
                className="rounded-[22px] border border-white/[0.08] bg-[#111111]/90 p-5 transition-all duration-300 hover:border-[#C9A84C]/45 hover:shadow-[0_0_50px_-20px_rgba(201,168,76,0.6)] hover:-translate-y-1"
                style={{ borderLeft: `2px solid ${cor}` }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold uppercase text-white text-[20px] leading-tight truncate">{c.noivos || c.referencia}</p>
                    <p className="text-[13px] text-white/50 mt-1 truncate">{dataPt(c.data)}{c.local ? ` · ${c.local}` : ''}</p>
                  </div>
                  <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] tracking-[0.2em] uppercase"
                    style={{ color: cor, background: cor + '1f', border: `1px solid ${cor}55` }}>
                    {c.faseTitulo}
                  </span>
                </div>

                {falta !== null && (
                  <p className={`mt-4 text-[13px] ${falta < 0 ? 'text-red-400' : falta <= 3 ? 'text-amber-300' : 'text-white/60'}`}>
                    Prazo {dataPt(c.prazo!)} · {falta < 0 ? `${-falta} ${-falta === 1 ? 'dia' : 'dias'} em atraso` : falta === 0 ? 'hoje' : `faltam ${falta} ${falta === 1 ? 'dia' : 'dias'}`}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {c.funcoes.map(f => (
                    <span key={f} className="rounded-full border border-[#C9A84C]/50 bg-[#C9A84C]/10 px-3 py-1 text-[11px] tracking-[0.12em] uppercase text-[#C9A84C]">{f}</span>
                  ))}
                  {c.album && (
                    <span className="rounded-full border border-white/15 px-3 py-1 text-[11px] tracking-[0.12em] uppercase text-white/60">Álbum · {c.album}</span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OsMeusCasamentos />
    </Suspense>
  )
}
