'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { Disco, Pasta } from './tipos'

const OURO = '#C9A84C'
const MESES = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO']
const TIPOS = [
  { k: 0, nome: 'fotos', cor: '#e7d3a6' },
  { k: 1, nome: 'RAW', cor: '#fb923c' },
  { k: 2, nome: 'vídeos', cor: '#7dd3fc' },
  { k: 3, nome: 'áudio', cor: '#c4b5fd' },
  { k: 4, nome: 'outros', cor: 'rgba(255,255,255,.55)' },
]

const semAcentos = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const nomeDe = (p: string) => p.slice(p.lastIndexOf('/') + 1)
const paiDe = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '')
const num = (n: number) => n.toLocaleString('pt-PT')

function tamanho(b: number) {
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  while (b >= 1000 && i < u.length - 1) { b /= 1000; i++ }
  return `${b.toLocaleString('pt-PT', { maximumFractionDigits: b < 10 && i > 0 ? 1 : 0 })} ${u[i]}`
}

// Meses pela ordem do calendário, o resto por ordem alfabética
function ordem(a: string, b: string) {
  const ma = MESES.indexOf(nomeDe(a).toUpperCase()), mb = MESES.indexOf(nomeDe(b).toUpperCase())
  if (ma >= 0 || mb >= 0) return (ma < 0 ? 99 : ma) - (mb < 0 ? 99 : mb)
  return nomeDe(a).localeCompare(nomeDe(b), 'pt', { numeric: true, sensitivity: 'base' })
}

function Contagens({ n }: { n: Pasta['n'] }) {
  const itens = TIPOS.filter(t => n[t.k] > 0)
  if (!itens.length) return <span className="text-white/30">vazia</span>
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-0.5">
      {itens.map(t => (
        <span key={t.k} className="tabular-nums"><span style={{ color: t.cor }}>{num(n[t.k])}</span> <span className="text-white/40">{t.nome}</span></span>
      ))}
    </span>
  )
}

function Copiar({ texto }: { texto: string }) {
  const [ok, setOk] = useState(false)
  return (
    <button type="button" title={texto}
      onClick={e => { e.stopPropagation(); navigator.clipboard?.writeText(texto).then(() => { setOk(true); setTimeout(() => setOk(false), 1500) }) }}
      className="shrink-0 rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.15em] uppercase text-white/45 hover:border-[#C9A84C]/60 hover:text-white">
      {ok ? 'Copiado ✓' : 'Copiar caminho'}
    </button>
  )
}

const caminhoWindows = (d: Disco, p: string) => `${d.letra}:\\${p.replace(/\//g, '\\')}`

export default function Armazenamento({ discos }: { discos: Disco[] }) {
  const [q, setQ] = useState('')
  const [abertas, setAbertas] = useState<Set<string>>(new Set())

  // Filhos de cada pasta, por disco (chave "disco|caminho do pai")
  const filhos = useMemo(() => {
    const m = new Map<string, Pasta[]>()
    for (const d of discos) for (const p of d.pastas) {
      const k = `${d.disco}|${paiDe(p.p)}`
      if (!m.has(k)) m.set(k, [])
      m.get(k)!.push(p)
    }
    m.forEach(l => l.sort((a, b) => ordem(a.p, b.p)))
    return m
  }, [discos])

  const termos = semAcentos(q.trim()).split(/\s+/).filter(Boolean)
  const resultados = useMemo(() => {
    if (!termos.length) return null
    const bate = (p: string) => { const s = semAcentos(p); return termos.every(t => s.includes(t)) }
    const out: { d: Disco; p: string; pasta?: Pasta; b: number }[] = []
    for (const d of discos) {
      // pastas cujo nome tem um dos termos e o caminho tem todos (evita listar tudo o que está dentro)
      for (const p of d.pastas) if (!p.lr && bate(p.p) && termos.some(t => semAcentos(nomeDe(p.p)).includes(t))) out.push({ d, p: p.p, pasta: p, b: p.b })
      for (const f of d.ficheiros) if (bate(f.p) && termos.some(t => semAcentos(nomeDe(f.p)).includes(t))) out.push({ d, p: f.p, b: f.b })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discos, termos.join(' ')])

  function alternar(k: string) {
    setAbertas(s => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n })
  }

  function Linhas({ d, pai, nivel }: { d: Disco; pai: string; nivel: number }) {
    const lista = (filhos.get(`${d.disco}|${pai}`) ?? []).filter(p => !p.lr)
    return (
      <>
        {lista.map(p => {
          const k = `${d.disco}|${p.p}`
          const temFilhos = (filhos.get(k) ?? []).some(x => !x.lr)
          const aberta = abertas.has(k)
          return (
            <div key={k}>
              <div onClick={() => temFilhos && alternar(k)}
                className={`group flex items-center gap-3 border-b border-white/[0.05] py-2.5 pr-2 ${temFilhos ? 'cursor-pointer hover:bg-white/[0.03]' : ''}`}
                style={{ paddingLeft: 8 + nivel * 22 }}>
                <span className="w-4 shrink-0 text-center text-[12px]" style={{ color: OURO }}>{temFilhos ? (aberta ? '▾' : '▸') : '·'}</span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate ${nivel === 0 ? 'text-[17px] font-semibold' : 'text-[15px]'}`}>{nomeDe(p.p)}</p>
                  <div className="text-[12px]"><Contagens n={p.n} /></div>
                </div>
                <span className="shrink-0 text-[13px] tabular-nums text-white/55">{tamanho(p.b)}</span>
                <span className="hidden sm:inline-flex opacity-0 group-hover:opacity-100"><Copiar texto={caminhoWindows(d, p.p)} /></span>
              </div>
              {aberta && <Linhas d={d} pai={p.p} nivel={nivel + 1} />}
            </div>
          )
        })}
      </>
    )
  }

  return (
    <main className="min-h-screen bg-[#070707] text-white font-cond overflow-x-clip">
      {/* ── Topo ── */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 70% at 85% 10%, rgba(201,168,76,0.12), transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-60"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '26px 26px', maskImage: 'radial-gradient(ellipse 70% 80% at 70% 20%, #000 20%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 70% 20%, #000 20%, transparent 75%)' }} />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-12">
          <Link href="/photo" className="text-[12px] tracking-[0.2em] uppercase text-white/45 hover:text-white">‹ Menu</Link>
          <p className="mt-6 text-[13px] font-bold tracking-[0.5em] uppercase" style={{ color: OURO }}>Gestão · Organização</p>
          <h1 className="mt-3 font-bold uppercase leading-[0.9] text-[46px] sm:text-[88px] lg:text-[110px] break-words">Armazenamento</h1>
          <div className="mt-5 flex items-center gap-4">
            <span className="w-12 h-px shrink-0" style={{ background: OURO }} />
            <span className="text-sm tracking-[0.22em] uppercase text-white/60">Tudo o que está guardado em cada disco</span>
          </div>

          {/* Discos */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {discos.map(d => {
              const usado = d.tamanho - d.livre
              const pct = Math.round((usado / d.tamanho) * 100)
              const raiz = (filhos.get(`${d.disco}|`) ?? [])
              const n = raiz.reduce((a, p) => a.map((v, i) => v + p.n[i]) as Pasta['n'], [0, 0, 0, 0, 0] as Pasta['n'])
              const cor = pct >= 95 ? '#f87171' : pct >= 85 ? '#fbbf24' : OURO
              return (
                <div key={d.disco} className="rounded-[22px] border border-white/[0.08] bg-[#111111]/85 backdrop-blur-md p-5" style={{ borderLeft: `2px solid ${cor}` }}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[22px] font-semibold leading-tight">{d.disco}</p>
                    <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: OURO, background: `${OURO}1f`, border: `1px solid ${OURO}55` }}>Disco {d.letra}</span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-white/[0.07] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: cor }} />
                  </div>
                  <div className="mt-2 flex justify-between text-[13px] tabular-nums">
                    <span><span style={{ color: cor }}>{pct}%</span> <span className="text-white/45">usado · {tamanho(usado)} de {tamanho(d.tamanho)}</span></span>
                    <span className="text-white/45">{tamanho(d.livre)} livres</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/[0.06] text-[13px]"><Contagens n={n} /></div>
                  <p className="mt-2 text-[11px] tracking-[0.15em] uppercase text-white/35">Lido a {new Date(d.atualizado).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Procurar</p>
        <h2 className="mt-1 text-3xl sm:text-[34px] font-semibold">Onde está guardado</h2>
        <p className="mt-2 text-sm text-white/45">Escreve o nome dos noivos, a referência, o mês ou o nome de um ficheiro. Aparecem as pastas e os ficheiros de todos os discos.</p>
        <div className="relative mt-6">
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Ex.: Bruna Mauro, OUTUBRO, .drp…" autoFocus
            className="w-full rounded-full border border-white/10 bg-[#111111] px-6 py-4 text-[17px] text-white outline-none placeholder:text-white/30 focus:border-[#C9A84C]/70 focus:shadow-[0_0_28px_-12px_rgba(201,168,76,0.6)]" />
          {q && <button type="button" onClick={() => setQ('')} className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-sm">Limpar</button>}
        </div>

        {resultados ? (
          <section className="mt-8">
            <p className="text-[12px] tracking-[0.2em] uppercase text-white/45">{resultados.length ? `${num(resultados.length)} resultado${resultados.length > 1 ? 's' : ''}` : 'Nada encontrado'}</p>
            <ul className="mt-3 flex flex-col gap-2">
              {resultados.slice(0, 300).map(r => (
                <li key={`${r.d.disco}|${r.p}`} className="rounded-[16px] border border-white/[0.08] bg-[#111111]/85 px-4 py-3" style={{ borderLeft: `2px solid ${r.pasta ? OURO : '#7dd3fc'}` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold break-words">
                        <span className="mr-2 text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: r.pasta ? OURO : '#7dd3fc' }}>{r.pasta ? 'Pasta' : 'Ficheiro'}</span>
                        {nomeDe(r.p)}
                      </p>
                      <p className="mt-0.5 text-[12px] text-white/40 break-words">{r.d.disco} › {paiDe(r.p).split('/').filter(Boolean).join(' › ') || 'raiz'}</p>
                      {r.pasta && <div className="mt-1 text-[12px]"><Contagens n={r.pasta.n} /></div>}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[13px] tabular-nums text-white/55">{tamanho(r.b)}</span>
                      <Copiar texto={caminhoWindows(r.d, r.p)} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            {resultados.length > 300 && <p className="mt-3 text-[12px] text-white/40">A mostrar os primeiros 300. Escreve mais uma palavra para afinar.</p>}
          </section>
        ) : (
          <section className="mt-10 flex flex-col gap-10">
            {discos.map(d => (
              <div key={d.disco}>
                <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Disco {d.letra}</p>
                <h3 className="mt-1 text-2xl font-semibold">{d.disco}</h3>
                <div className="mt-4 rounded-[22px] border border-white/[0.08] bg-[#111111]/85 px-2 sm:px-4 py-2">
                  <Linhas d={d} pai="" nivel={0} />
                </div>
              </div>
            ))}
          </section>
        )}

        <p className="mt-12 text-[12px] text-white/35 leading-relaxed">
          A lista é uma fotografia do disco no momento em que foi lido. Para atualizar, liga o disco ao PC e corre <span className="text-white/60">python scripts/indexar-disco.py J</span> na pasta rl-menu (troca o J pela letra do disco). Os JPG, RAW e vídeos aparecem só contados em cada pasta.
        </p>
      </div>
    </main>
  )
}
