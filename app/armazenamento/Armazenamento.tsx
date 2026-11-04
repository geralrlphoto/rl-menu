'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
const caminhoLegivel = (p: string) => (p ? p.split('/').join(' › ') : 'Raiz do disco')

/* Repetidos de um disco: pares de pastas com ficheiros iguais e a lista dos ficheiros,
   do que ocupa mais espaço para o que ocupa menos. */
function VistaRepetidos({ d }: { d: Disco }) {
  const r = d.repetidos
  const [verPastas, setVerPastas] = useState(30)
  const [verFich, setVerFich] = useState(50)
  if (!r) return <p className="px-2 py-4 text-sm text-white/45">Os repetidos aparecem depois de o disco ser lido outra vez. Carrega em Atualizar no card.</p>
  if (!r.n) return <p className="px-2 py-4 text-sm text-white/55">Não há nada repetido neste disco.</p>
  const ROSA = '#f9a8d4'
  return (
    <div className="flex flex-col gap-8 py-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { l: 'Espaço ocupado por cópias', v: tamanho(r.bytes) },
          { l: 'Cópias a mais', v: num(r.n) },
          { l: 'Ficheiros repetidos', v: num(r.grupos) },
        ].map(k => (
          <div key={k.l} className="rounded-[18px] border border-white/[0.08] bg-black/30 px-4 py-3.5" style={{ borderLeft: `2px solid ${ROSA}` }}>
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/45">{k.l}</p>
            <p className="mt-1 text-[30px] font-thin leading-none tabular-nums" style={{ color: ROSA }}>{k.v}</p>
          </div>
        ))}
      </div>
      <p className="-mt-4 text-[12px] text-white/40">Conta como repetido um ficheiro com o mesmo nome e o mesmo tamanho exato em mais de uma pasta deste disco (só ficheiros com mais de 100 KB). Confirma sempre antes de apagar.</p>

      <section>
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Pastas com ficheiros iguais</p>
        <ul className="mt-3 flex flex-col gap-2">
          {r.pastas.slice(0, verPastas).map(p => {
            const inteira = p.n === p.ta || p.n === p.tb
            return (
              <li key={`${p.a}|${p.b}`} className="rounded-[16px] border border-white/[0.08] bg-black/30 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] tabular-nums">
                    <span style={{ color: ROSA }}>{num(p.n)}</span> <span className="text-white/45">ficheiros iguais · </span>
                    <span className="text-white/80">{tamanho(p.bytes)}</span>
                  </span>
                  {inteira && <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: ROSA, background: `${ROSA}1f`, border: `1px solid ${ROSA}55` }}>Pasta copiada inteira</span>}
                </div>
                {[{ c: p.a, t: p.ta }, { c: p.b, t: p.tb }].map(x => (
                  <div key={x.c} className="mt-2 flex items-start justify-between gap-3">
                    <p className="min-w-0 text-[14px] break-words">{caminhoLegivel(x.c)} <span className="text-[12px] text-white/35">({num(x.t)} ficheiros)</span></p>
                    <Copiar texto={caminhoWindows(d, x.c)} />
                  </div>
                ))}
              </li>
            )
          })}
        </ul>
        {r.pastas.length > verPastas && <button type="button" onClick={() => setVerPastas(v => v + 30)} className="mt-3 text-[12px] tracking-[0.2em] uppercase text-white/50 hover:text-white">Ver mais pastas ({num(r.pastas.length - verPastas)})</button>}
      </section>

      <section>
        <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Ficheiros repetidos</p>
        <ul className="mt-3 flex flex-col gap-2">
          {r.ficheiros.slice(0, verFich).map(f => (
            <li key={`${f.n}|${f.b}`} className="rounded-[16px] border border-white/[0.08] bg-black/30 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[15px] font-semibold break-all">{f.n}</p>
                <span className="text-[13px] tabular-nums text-white/55">{tamanho(f.b)} · <span style={{ color: ROSA }}>{f.p.length}×</span></span>
              </div>
              {f.p.map(c => (
                <div key={c} className="mt-1.5 flex items-start justify-between gap-3">
                  <p className="min-w-0 text-[13px] text-white/60 break-words">{caminhoLegivel(c)}</p>
                  <Copiar texto={caminhoWindows(d, c ? `${c}/${f.n}` : f.n)} />
                </div>
              ))}
            </li>
          ))}
        </ul>
        {r.ficheiros.length > verFich && <button type="button" onClick={() => setVerFich(v => v + 50)} className="mt-3 text-[12px] tracking-[0.2em] uppercase text-white/50 hover:text-white">Ver mais ficheiros ({num(r.ficheiros.length - verFich)})</button>}
        {r.grupos > r.ficheiros.length && <p className="mt-2 text-[12px] text-white/35">A lista mostra os {num(r.ficheiros.length)} que ocupam mais espaço.</p>}
      </section>
    </div>
  )
}

/* Casamentos sem backup: junta os eventos de todos os discos cujo conteúdo não existe
   (ou só existe em parte) noutro disco. Fechado por defeito; o resumo fica à vista. */
const VERMELHO = '#f87171'
const AMARELO = '#fbbf24'
function SemBackup({ discos }: { discos: Disco[] }) {
  const [aberto, setAberto] = useState(false)
  const [filtro, setFiltro] = useState<'sem' | 'parcial'>('sem')
  const todos = discos.flatMap(d => (d.backups ?? []).map(e => ({ ...e, d })))
  if (!discos.some(d => d.backups)) return null
  const sem = todos.filter(e => e.estado === 'sem')
  const parcial = todos.filter(e => e.estado === 'parcial')
  const lista = (filtro === 'sem' ? sem : parcial).sort((a, b) => a.pct - b.pct || b.b - a.b)
  const gb = (l: typeof todos) => tamanho(l.reduce((s, e) => s + e.b, 0))
  const calculado = discos.map(d => d.backups_em).filter(Boolean).sort().pop()

  return (
    <div className="mt-8">
      <button type="button" onClick={() => setAberto(a => !a)}
        className="w-full text-left rounded-[22px] border bg-[#111111]/85 backdrop-blur-md p-5 transition-colors hover:border-white/[0.2]"
        style={{ borderColor: sem.length ? `${VERMELHO}55` : 'rgba(255,255,255,.08)', borderLeft: `2px solid ${sem.length ? VERMELHO : '#4ade80'}` }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: sem.length ? VERMELHO : '#4ade80' }}>Cópias de segurança</p>
            <p className="mt-1 text-[22px] font-semibold leading-tight">
              {sem.length ? `${num(sem.length)} casamento${sem.length > 1 ? 's' : ''} sem backup` : 'Todos os casamentos têm backup'}
            </p>
            <p className="mt-1 text-[13px] text-white/50 tabular-nums">
              {sem.length > 0 && <><span style={{ color: VERMELHO }}>{gb(sem)}</span> só num disco · </>}
              {parcial.length > 0 && <><span style={{ color: AMARELO }}>{num(parcial.length)}</span> com backup incompleto · </>}
              {num(todos.length - sem.length - parcial.length)} com backup
            </p>
          </div>
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-white/45">{aberto ? 'Fechar ▴' : 'Ver a lista ▾'}</span>
        </div>
      </button>

      {aberto && (
        <div className="mt-3 rounded-[22px] border border-white/[0.08] bg-[#111111]/85 p-3 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {([{ k: 'sem', t: `Sem backup · ${num(sem.length)}`, c: VERMELHO }, { k: 'parcial', t: `Backup incompleto · ${num(parcial.length)}`, c: AMARELO }] as const).map(t => (
              <button key={t.k} type="button" onClick={() => setFiltro(t.k)}
                className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors ${filtro === t.k ? 'text-white' : 'border-white/10 text-white/55 hover:text-white'}`}
                style={filtro === t.k ? { borderColor: `${t.c}99`, background: `${t.c}1f` } : undefined}>
                {t.t}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-white/40">
            Compara o conteúdo de cada casamento (ficheiros com o mesmo nome e tamanho) com todos os outros discos, mesmo os que não estão ligados.
            Sem backup = menos de 5% está noutro disco; incompleto = entre 5% e 94%.{calculado ? ` Calculado a ${quando(calculado)}.` : ''}
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {lista.map(e => {
              const cor = e.estado === 'sem' ? VERMELHO : AMARELO
              return (
                <li key={`${e.d.disco}|${e.p}`} className="rounded-[16px] border border-white/[0.08] bg-black/30 px-4 py-3" style={{ borderLeft: `2px solid ${cor}` }}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold break-words">{nomeDe(e.p)}</p>
                      <p className="mt-0.5 text-[12px] text-white/40 break-words">
                        <span className="font-semibold" style={{ color: OURO }}>{e.d.disco}</span>
                        {paiDe(e.p) ? ` › ${paiDe(e.p).split('/').join(' › ')}` : ''}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[13px] tabular-nums text-white/60">{tamanho(e.b)}</span>
                      <Copiar texto={caminhoWindows(e.d, e.p)} />
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-3">
                    <div className="h-1.5 flex-1 rounded-full bg-white/[0.07] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(e.pct, 1)}%`, background: cor }} />
                    </div>
                    <span className="w-24 text-right text-[12px] tabular-nums" style={{ color: cor }}>{e.pct}% com cópia</span>
                  </div>
                  {e.onde.filter(o => o.pct > 0).length > 0 && (
                    <p className="mt-1.5 text-[12px] text-white/45">Cópia em: {e.onde.filter(o => o.pct > 0).map(o => `${o.d} (${o.pct}%)`).join(' · ')}</p>
                  )}
                </li>
              )
            })}
            {!lista.length && <li className="px-2 py-3 text-sm text-white/50">Nada nesta lista.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}

const pendente = (d:{ pedido_em?: string | null; atualizado: string }) =>
  !!d.pedido_em && (!d.atualizado || Date.parse(d.pedido_em) > Date.parse(d.atualizado))

const quando = (iso: string) => new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

/* Botão Atualizar: deixa o pedido e vai vendo (só com a página à vista, de 20 em 20 s,
   no máximo 15 min) até o robô do PC gravar a lista nova; depois recarrega os dados. */
function BotaoAtualizar({ d }: { d: Disco }) {
  const router = useRouter()
  const [aEspera, setAEspera] = useState(pendente(d))
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (!aEspera) return
    const fim = Date.now() + 15 * 60_000
    const id = setInterval(async () => {
      if (document.hidden) return
      if (Date.now() > fim) { clearInterval(id); setAEspera(false); setErro('O robô não respondeu. O PC está ligado?'); return }
      try {
        const r = await fetch('/api/armazenamento', { cache: 'no-store' }).then(x => x.json())
        const x = (r.discos ?? []).find((k: { disco: string }) => k.disco === d.disco)
        if (x && !pendente(x)) { clearInterval(id); setAEspera(false); router.refresh() }
      } catch { /* tenta na volta seguinte */ }
    }, 20_000)
    return () => clearInterval(id)
  }, [aEspera, d.disco, router])

  async function pedir() {
    setErro('')
    const r = await fetch('/api/armazenamento', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ disco: d.disco }) })
    if (r.ok) setAEspera(true)
    else setErro('Não foi possível pedir. Tenta outra vez.')
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3" onClick={e => e.stopPropagation()}>
      <button type="button" onClick={pedir} disabled={aEspera}
        className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/45 bg-[#0e0e0e]/90 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_0_28px_-12px_rgba(201,168,76,0.6)] hover:border-[#C9A84C]/80 disabled:opacity-70 disabled:cursor-wait">
        <span className={aEspera ? 'animate-spin' : ''} style={{ color: OURO }}>↻</span>
        {aEspera ? 'A atualizar…' : 'Atualizar'}
      </button>
      {aEspera && <span className="text-[12px] text-white/45">{d.ligado ? 'O PC lê o disco em 1 a 3 minutos.' : 'Fica à espera que o disco seja ligado ao PC.'}</span>}
      {erro && <span className="text-[12px] text-red-400">{erro}</span>}
    </div>
  )
}

export default function Armazenamento({ discos: lidos }: { discos: Disco[] | null }) {
  const discos = lidos ?? []
  const [q, setQ] = useState('')
  const [abertas, setAbertas] = useState<Set<string>>(new Set())
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const [vista, setVista] = useState<'conteudo' | 'repetidos'>('conteudo')
  const discoEscolhido = discos.find(d => d.disco === escolhido) ?? null

  function escolher(nome: string) {
    const novo = escolhido === nome ? null : nome
    setEscolhido(novo)
    if (novo) setTimeout(() => document.getElementById('conteudo-disco')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

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

          {lidos === null && <p className="mt-10 text-sm text-red-400">Não foi possível carregar os discos. Atualiza a página.</p>}
          {lidos && !discos.length && <p className="mt-10 text-sm text-white/50">Ainda não há discos lidos. Liga um disco ao PC: aparece aqui em poucos minutos, pronto para carregares em Atualizar.</p>}
          {/* Discos */}
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {discos.map(d => {
              const usado = d.tamanho - d.livre
              const pct = Math.round((usado / d.tamanho) * 100)
              const raiz = (filhos.get(`${d.disco}|`) ?? [])
              const n = raiz.reduce((a, p) => a.map((v, i) => v + p.n[i]) as Pasta['n'], [0, 0, 0, 0, 0] as Pasta['n'])
              const cor = pct >= 95 ? '#f87171' : pct >= 85 ? '#fbbf24' : OURO
              const ativo = escolhido === d.disco
              return (
                <div key={d.disco} role="button" tabIndex={0} aria-pressed={ativo}
                  onClick={() => escolher(d.disco)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); escolher(d.disco) } }}
                  className={`cursor-pointer rounded-[22px] border backdrop-blur-md p-5 transition-all duration-200 ${ativo ? 'border-[#C9A84C]/70 bg-[#16140f]/90 shadow-[0_0_40px_-16px_rgba(201,168,76,0.7)]' : 'border-white/[0.08] bg-[#111111]/85 hover:border-white/[0.2]'}`}
                  style={{ borderLeft: `2px solid ${cor}` }}>
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
                  {d.repetidos && (
                    <p className="mt-1.5 text-[13px] tabular-nums">
                      {d.repetidos.n
                        ? <><span style={{ color: '#f9a8d4' }}>{tamanho(d.repetidos.bytes)}</span> <span className="text-white/45">em repetidos · {num(d.repetidos.n)} cópias a mais</span></>
                        : <span className="text-white/45">Sem repetidos</span>}
                    </p>
                  )}
                  {d.backups && (() => {
                    const s = d.backups.filter(e => e.estado === 'sem').length
                    return (
                      <p className="mt-1 text-[13px] tabular-nums">
                        {s
                          ? <><span style={{ color: VERMELHO }}>{num(s)}</span> <span className="text-white/45">casamento{s > 1 ? 's' : ''} sem backup</span></>
                          : <span className="text-white/45">Todos os casamentos com backup</span>}
                      </p>
                    )
                  })()}
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] tracking-[0.15em] uppercase text-white/35">
                    <span>{d.atualizado ? `Lido a ${quando(d.atualizado)}` : 'Ainda não lido'}</span>
                    <span className="inline-flex items-center gap-1.5" style={{ color: d.ligado ? '#4ade80' : 'rgba(255,255,255,.35)' }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: d.ligado ? '#4ade80' : 'rgba(255,255,255,.3)' }} />
                      {d.ligado ? 'Ligado ao PC' : 'Não ligado'}
                    </span>
                  </p>
                  <BotaoAtualizar d={d} />
                  <p className="mt-3 text-[11px] font-semibold tracking-[0.2em] uppercase" style={{ color: ativo ? OURO : 'rgba(255,255,255,.4)' }}>
                    {ativo ? 'Fechar conteúdo ▴' : 'Ver o que tem dentro ▾'}
                  </p>
                </div>
              )
            })}
          </div>

          <SemBackup discos={discos} />

          {/* Conteúdo do disco escolhido: pastas de topo fechadas, abre-se uma a uma */}
          {discoEscolhido && (
            <div id="conteudo-disco" className="mt-8 scroll-mt-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Disco {discoEscolhido.letra} · Conteúdo</p>
                  <h3 className="mt-1 text-2xl sm:text-3xl font-semibold">{discoEscolhido.disco}</h3>
                </div>
                <button type="button" onClick={() => setEscolhido(null)} className="text-[12px] tracking-[0.2em] uppercase text-white/45 hover:text-white">Fechar ✕</button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {([
                  { k: 'conteudo', t: 'Conteúdo' },
                  { k: 'repetidos', t: discoEscolhido.repetidos ? `Repetidos · ${tamanho(discoEscolhido.repetidos.bytes)}` : 'Repetidos' },
                ] as const).map(t => (
                  <button key={t.k} type="button" onClick={() => setVista(t.k)}
                    className={`rounded-full border px-4 py-1.5 text-[13px] font-semibold transition-colors ${vista === t.k ? 'border-[#C9A84C]/70 bg-[#C9A84C]/15 text-white' : 'border-white/10 text-white/55 hover:text-white hover:border-white/25'}`}>
                    {t.t}
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-[22px] border border-white/[0.08] bg-[#111111]/85 px-2 sm:px-4 py-2">
                {!discoEscolhido.pastas.length
                  ? <p className="px-2 py-4 text-sm text-white/45">Este disco ainda não foi lido. Carrega em Atualizar no card.</p>
                  : vista === 'conteudo'
                    ? <Linhas d={discoEscolhido} pai="" nivel={0} />
                    : <VistaRepetidos key={discoEscolhido.disco} d={discoEscolhido} />}
              </div>
            </div>
          )}
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
        ) : null}

        <p className="mt-12 text-[12px] text-white/35 leading-relaxed">
          A lista é uma fotografia do disco no momento em que foi lido. Para a pôr em dia, carrega em Atualizar com o disco ligado ao PC (o PC tem de estar ligado). Nada é lido sem carregares no botão: um disco novo ligado ao PC aparece aqui como &quot;Ainda não lido&quot;. Os JPG, RAW e vídeos aparecem só contados em cada pasta.
        </p>
      </div>
    </main>
  )
}
