'use client'

// Produção → Departamento de Edição de Vídeo.
// Equipa de editores (freelancers EDITORES), quadro dos casamentos por fase
// (video_estado + editor atribuído + entregas no portal) e o esquema de trabalho.
// Dados: /api/edicao-video. Atribuir editor: PATCH /api/evento-equipa (avisa o editor).

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

// Estados do vídeo e quem os muda (ver lib/videoEstado.ts)
const ESTADOS_INFO = [
  { estado: 'Aguardar',   quem: 'Automático', cor: '#a1a1aa', quando: 'Ao nomear o editor.', onde: 'Quadro, coluna Por atribuir.', noivos: 'veem Aguardar; o download do editor fica bloqueado.' },
  { estado: 'Em Edição',  quem: 'Editor',     cor: '#fb923c', quando: 'O editor começa (ou a RL pede alterações).', onde: 'Painel do Editor.', noivos: 'veem que o filme já está a ser editado.' },
  { estado: 'Em Revisão', quem: 'Editor',     cor: '#93c5fd', quando: 'O editor envia o link de revisão.', onde: 'Painel do Editor › Para Revisão.', noivos: 'veem Em Revisão (a RL está a ver).' },
  { estado: 'Finalizado', quem: 'RL',         cor: '#c4b5fd', quando: 'A RL aprova o filme.', onde: 'Este departamento, cartão Aprovar.', noivos: 'veem Finalizado; o editor recebe o Ticket de Aprovação.' },
  { estado: 'Entregue',   quem: 'RL',         cor: '#4ade80', quando: 'A RL envia o filme aos noivos.', onde: 'Este departamento, cartão Entregar (link).', noivos: 'recebem o email e o filme fica no portal.' },
]

const OURO = '#C9A84C'
const FASES = ['Por atribuir', 'Aguardar', 'Em Edição', 'Em Revisão', 'Finalizado', 'Entregue'] as const
type Fase = typeof FASES[number]
const ATIVAS: Fase[] = ['Aguardar', 'Em Edição', 'Em Revisão', 'Finalizado']
const COR_FASE: Record<Fase, string> = {
  'Por atribuir': '#f87171', 'Aguardar': '#a1a1aa', 'Em Edição': '#fb923c',
  'Em Revisão': '#93c5fd', 'Finalizado': '#c4b5fd', 'Entregue': '#4ade80',
}

type Editor = { id: string; nome: string; foto_url: string | null }
type Projeto = {
  id: number; fichaId: string; referencia: string | null; cliente: string | null; data: string; local: string | null
  fase: Fase | 'Sem registo'; editores: string[]; editorIds: (string | null)[]
  prazo: string; diasPrazo: number; portalId: string | null; entregueEm: string | null
  entregas: { teaser: boolean; sde: boolean; filme: boolean; prewedding: boolean }
  filmeUrl: string | null
  revisao: { link: string | null; status: string | null; feedback: string | null } | null
}

const fmt = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
const primeiro = (n: string) => n.trim().split(/\s+/)[0]

export default function EdicaoVideoPage() {
  const [dados, setDados] = useState<{ editores: Editor[]; projetos: Projeto[] } | null>(null)
  const [erro, setErro] = useState(false)
  const [aGravar, setAGravar] = useState<number | null>(null)

  const carregar = () => {
    fetch('/api/edicao-video').then(r => r.json())
      .then(d => { if (d.ok) setDados({ editores: d.editores, projetos: d.projetos }); else setErro(true) })
      .catch(() => setErro(true))
  }
  useEffect(carregar, [])

  const atribuir = async (p: Projeto, nome: string) => {
    if (!nome) return
    setAGravar(p.id)
    await fetch('/api/evento-equipa', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia: p.referencia, data_casamento: p.data, local: p.local, editor_video: [nome] }),
    }).catch(() => {})
    setAGravar(null)
    carregar()
  }

  // Revisão: aprovar (→ Finalizado, Ticket de Aprovação) ou pedir alterações (→ Em Edição)
  const decidir = async (p: Projeto, status: 'Aprovado' | 'Requer Alterações') => {
    let feedback: string | null = null
    if (status === 'Requer Alterações') {
      feedback = window.prompt('O que é preciso alterar? (vai para o editor)')?.trim() || null
      if (!feedback) return
    } else {
      if (!window.confirm(`Aprovar o filme de ${p.cliente || p.referencia}? O editor recebe o Ticket de Aprovação.`)) return
      feedback = window.prompt('Notas para o editor (opcional)')?.trim() || null
    }
    setAGravar(p.id)
    const r = await fetch('/api/painel-editor/video-revisao', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia: p.referencia, status, feedback }),
    }).catch(() => null)
    setAGravar(null)
    if (!r?.ok) alert('Não foi possível guardar. Tenta outra vez.')
    carregar()
  }

  // Sem link de revisão (casos antigos): a RL marca Finalizado diretamente
  const finalizarSemLink = async (p: Projeto) => {
    if (!window.confirm(`Marcar o filme de ${p.cliente || p.referencia} como Finalizado (aprovado)?`)) return
    setAGravar(p.id)
    const r = await fetch('/api/painel-editor/sync-video-estado', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia: p.referencia, stage: 'Finalizado', data_casamento: p.data, local: p.local }),
    }).catch(() => null)
    setAGravar(null)
    if (!r?.ok) alert('Não foi possível guardar. Tenta outra vez.')
    carregar()
  }

  // Entrega: envia o Wedding Film aos noivos (email + portal) e põe Entregue
  const [links, setLinks] = useState<Record<number, string>>({})
  const entregar = async (p: Projeto) => {
    const url = (links[p.id] ?? p.filmeUrl ?? '').trim()
    if (!/^https?:\/\//i.test(url)) { alert('Cola o link do filme (Vimeo ou YouTube).'); return }
    if (!window.confirm(`Enviar o filme a ${p.cliente || p.referencia}? Os noivos recebem o email e o vídeo fica Entregue.`)) return
    setAGravar(p.id)
    const r = await fetch('/api/edicao-video/entregar', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia: p.referencia, url }),
    }).catch(() => null)
    const d = r ? await r.json().catch(() => ({})) : {}
    setAGravar(null)
    if (!r?.ok) { alert((d as any).error || 'Não foi possível enviar.'); return }
    carregar()
  }

  const projetos = dados?.projetos ?? []
  const porFase = useMemo(() => {
    const m = new Map<Fase, Projeto[]>(FASES.map(f => [f, []]))
    for (const p of projetos) if (p.fase !== 'Sem registo') m.get(p.fase)?.push(p)
    for (const [f, l] of m) l.sort((a, b) => f === 'Entregue' ? (b.entregueEm ?? b.data).localeCompare(a.entregueEm ?? a.data) : a.diasPrazo - b.diasPrazo)
    return m
  }, [projetos])

  const abertos = projetos.filter(p => p.fase !== 'Entregue' && p.fase !== 'Sem registo')
  const semRegisto = projetos.filter(p => p.fase === 'Sem registo').sort((a, b) => b.data.localeCompare(a.data))
  const kpis = [
    { label: 'Por atribuir', valor: porFase.get('Por atribuir')!.length, cor: COR_FASE['Por atribuir'] },
    { label: 'Em edição', valor: porFase.get('Em Edição')!.length + porFase.get('Aguardar')!.length, cor: COR_FASE['Em Edição'] },
    { label: 'Em revisão', valor: porFase.get('Em Revisão')!.length, cor: COR_FASE['Em Revisão'] },
    { label: 'Prazo < 30 dias', valor: abertos.filter(p => p.diasPrazo >= 0 && p.diasPrazo < 30).length, cor: '#fbbf24' },
    { label: 'Atrasados', valor: abertos.filter(p => p.diasPrazo < 0).length, cor: '#f87171' },
  ]

  const cargas = (dados?.editores ?? []).map(e => {
    const meus = abertos.filter(p => p.editorIds.includes(e.id) && ATIVAS.includes(p.fase as Fase))
    const prox = [...meus].sort((a, b) => a.diasPrazo - b.diasPrazo)[0]
    return { e, ativos: meus.length, atrasados: meus.filter(p => p.diasPrazo < 0).length, prox }
  }).sort((a, b) => a.ativos - b.ativos)

  return (
    <main className="min-h-screen bg-[#070707] text-white font-cond overflow-x-clip">
      {/* ── Topo ── */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 70% at 85% 10%, rgba(201,168,76,0.12), transparent 70%)' }} />
        <div className="absolute inset-0 pointer-events-none opacity-60"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '26px 26px', maskImage: 'radial-gradient(ellipse 70% 80% at 70% 20%, #000 20%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 70% 20%, #000 20%, transparent 75%)' }} />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-24 pb-12">
          <p className="text-[13px] font-bold tracking-[0.5em] uppercase" style={{ color: OURO }}>Produção · Departamento</p>
          <h1 className="mt-3 font-bold uppercase leading-[0.9] text-[52px] sm:text-[88px] lg:text-[110px]">Edição de vídeo</h1>
          <div className="mt-5 flex items-center gap-4">
            <span className="w-12 h-px" style={{ background: OURO }} />
            <span className="text-sm tracking-[0.22em] uppercase text-white/60">Editores, casamentos em curso e o nosso esquema de trabalho</span>
          </div>
          <Link href="/edicao-video/fluxo" target="_blank" rel="noopener" className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/45 bg-[#0e0e0e]/90 px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_0_28px_-12px_rgba(201,168,76,0.6)] hover:border-[#C9A84C]/80">
            Fluxo de trabalho <span style={{ color: OURO }}>↗</span>
          </Link>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-5 gap-3">
            {kpis.map(k => (
              <div key={k.label} className="rounded-[18px] border border-white/[0.08] bg-[#111111]/85 backdrop-blur-md px-4 py-3.5" style={{ borderLeft: `2px solid ${k.cor}` }}>
                <p className="text-[10px] tracking-[0.25em] uppercase text-white/45">{k.label}</p>
                <p className="mt-1 text-[34px] font-thin leading-none tabular-nums" style={{ color: k.valor ? k.cor : 'rgba(255,255,255,.35)' }}>{dados ? k.valor : '–'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12 flex flex-col gap-16">
        {erro && <p className="text-red-400 text-sm">Não foi possível carregar os dados. Atualiza a página.</p>}

        {/* ── Equipa ── */}
        <section>
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Equipa de edição</p>
          <h2 className="mt-1 text-3xl sm:text-[34px] font-semibold">Quem está a editar</h2>
          <p className="mt-2 text-sm text-white/45">Ordenados do mais livre para o mais ocupado: o primeiro é o melhor candidato para o próximo casamento.</p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cargas.map(({ e, ativos, atrasados, prox }) => (
              <Link key={e.id} href={`/painel-editor?freelancer=${e.id}`}
                className="group rounded-[22px] border border-white/[0.08] bg-[#111111]/90 p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C9A84C]/45 hover:shadow-[0_0_40px_-18px_rgba(201,168,76,0.6)]"
                style={{ borderLeft: `2px solid ${OURO}` }}>
                <div className="w-14 h-14 rounded-full overflow-hidden flex-none border border-[#C9A84C]/40 bg-[#C9A84C]/10 flex items-center justify-center text-lg" style={{ color: OURO }}>
                  {e.foto_url ? <img src={e.foto_url} alt="" className="w-full h-full object-cover" /> : primeiro(e.nome).charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold truncate">{e.nome}</p>
                  <p className="text-xs text-white/45 mt-0.5">
                    {prox ? <>Próximo prazo: <span className={prox.diasPrazo < 0 ? 'text-red-400' : 'text-white/70'}>{prox.cliente} · {prox.diasPrazo < 0 ? `${-prox.diasPrazo} dias atrasado` : `${prox.diasPrazo} dias`}</span></> : 'Sem projetos ativos'}
                  </p>
                </div>
                <div className="text-right flex-none">
                  <p className="text-[34px] font-thin leading-none tabular-nums" style={{ color: ativos ? OURO : 'rgba(255,255,255,.35)' }}>{ativos}</p>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">ativos</p>
                  {atrasados > 0 && <p className="text-[10px] tracking-[0.15em] uppercase text-red-400 mt-1">{atrasados} atrasado{atrasados > 1 ? 's' : ''}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Quadro por fases ── */}
        <section>
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Quadro de trabalho</p>
          <h2 className="mt-1 text-3xl sm:text-[34px] font-semibold">Casamentos em edição</h2>
          <p className="mt-2 text-sm text-white/45">O editor põe Em Edição (desbloqueia o download) e Em Revisão (envia o link). A RL aprova (Finalizado) e entrega o filme aos noivos (Entregue). O prazo conta 180 dias úteis desde o casamento.</p>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-4 snap-x">
            {FASES.map(f => {
              const lista = porFase.get(f) ?? []
              return (
                <div key={f} className="snap-start flex-none w-[290px] flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.2em] uppercase text-white/75">
                      <i className="w-2 h-2 rounded-full" style={{ background: COR_FASE[f], boxShadow: `0 0 8px ${COR_FASE[f]}` }} />{f}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[12px] font-semibold text-white/70">{lista.length}</span>
                  </div>
                  {!dados && <div className="h-28 rounded-[18px] bg-white/[0.03] animate-pulse" />}
                  {dados && !lista.length && <p className="text-xs text-white/25 px-1">Nada aqui.</p>}
                  {lista.map(p => (
                    <div key={p.id} className="rounded-[18px] border border-white/[0.08] bg-[#111111]/90 p-4 flex flex-col gap-3" style={{ borderLeft: `2px solid ${COR_FASE[f]}` }}>
                      <div>
                        <p className="font-semibold leading-snug">{p.cliente || p.referencia}</p>
                        <p className="text-[11px] text-white/40 mt-0.5">{fmt(p.data)}{p.local ? ` · ${p.local}` : ''}</p>
                      </div>
                      {f !== 'Entregue' && (
                        <p className={`text-[12px] font-semibold tracking-[0.08em] ${p.diasPrazo < 0 ? 'text-red-400' : p.diasPrazo < 30 ? 'text-amber-300' : 'text-white/55'}`}>
                          {p.diasPrazo < 0 ? `Atrasado ${-p.diasPrazo} dias` : `Prazo em ${p.diasPrazo} dias`} · {fmt(p.prazo)}
                        </p>
                      )}
                      {f === 'Por atribuir' ? (
                        <select disabled={aGravar === p.id || !p.referencia} defaultValue="" onChange={e => atribuir(p, e.target.value)}
                          className="w-full rounded-xl border border-[#C9A84C]/40 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#C9A84C]">
                          <option value="" disabled>{aGravar === p.id ? 'A atribuir…' : 'Atribuir editor…'}</option>
                          {cargas.map(({ e, ativos }) => <option key={e.id} value={e.nome}>{e.nome} ({ativos} ativos)</option>)}
                        </select>
                      ) : (
                        <p className="text-[12px] text-white/60">Editor: <span className="text-white">{p.editores.join(', ') || '—'}</span></p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {([['teaser', 'Teaser'], ['sde', 'SDE'], ['prewedding', 'Pré-wedding'], ['filme', 'Filme']] as const).map(([k, l]) => (
                          <span key={k} className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase ${p.entregas[k] ? 'border-[#4ade80]/40 bg-[#4ade80]/10 text-[#4ade80]' : 'border-white/10 text-white/30'}`}>
                            {p.entregas[k] ? '✓ ' : ''}{l}
                          </span>
                        ))}
                      </div>
                      {f === 'Em Revisão' && (
                        <div className="flex flex-col gap-2 rounded-xl border border-[#93c5fd]/25 bg-[#93c5fd]/[0.06] p-3">
                          {p.revisao?.link
                            ? <a href={p.revisao.link} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-[#93c5fd] hover:underline">▶ Ver a versão para revisão</a>
                            : <>
                                <p className="text-[11px] text-white/45">O editor ainda não enviou o link de revisão.</p>
                                <button type="button" disabled={aGravar === p.id} onClick={() => finalizarSemLink(p)}
                                  className="rounded-full border border-[#4ade80]/40 bg-[#4ade80]/[0.08] px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#4ade80] hover:bg-[#4ade80]/20 disabled:opacity-40">✓ Marcar Finalizado</button>
                              </>}
                          {p.revisao?.status === 'Requer Alterações' && p.revisao.feedback && (
                            <p className="text-[11px] text-amber-300/80 whitespace-pre-line">Pedido: {p.revisao.feedback}</p>
                          )}
                          {p.revisao?.link && (
                            <div className="flex gap-2">
                              <button type="button" disabled={aGravar === p.id} onClick={() => decidir(p, 'Aprovado')}
                                className="flex-1 rounded-full border border-[#4ade80]/50 bg-[#4ade80]/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-[#4ade80] hover:bg-[#4ade80]/20 disabled:opacity-40">✓ Aprovar</button>
                              <button type="button" disabled={aGravar === p.id} onClick={() => decidir(p, 'Requer Alterações')}
                                className="flex-1 rounded-full border border-amber-300/40 bg-amber-300/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.1em] uppercase text-amber-300 hover:bg-amber-300/20 disabled:opacity-40">✎ Alterações</button>
                            </div>
                          )}
                        </div>
                      )}
                      {f === 'Finalizado' && (
                        <div className="flex flex-col gap-2 rounded-xl border border-[#C9A84C]/30 bg-[#C9A84C]/[0.06] p-3">
                          <input type="url" placeholder="Link do filme (Vimeo / YouTube)" defaultValue={p.filmeUrl ?? ''}
                            onChange={e => setLinks(l => ({ ...l, [p.id]: e.target.value }))}
                            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[12px] text-white outline-none focus:border-[#C9A84C]/60" />
                          <button type="button" disabled={aGravar === p.id} onClick={() => entregar(p)}
                            className="rounded-full border border-[#C9A84C]/60 bg-[#C9A84C]/15 px-3 py-2 text-[11px] font-semibold tracking-[0.15em] uppercase text-white hover:bg-[#C9A84C]/30 disabled:opacity-40">
                            {aGravar === p.id ? 'A enviar…' : 'Enviar filme aos noivos →'}
                          </button>
                        </div>
                      )}
                      <div className="flex gap-3 text-[11px] font-semibold tracking-[0.15em] uppercase">
                        <Link href={`/eventos-2026/${p.fichaId}`} className="text-[#C9A84C]/80 hover:text-[#C9A84C]">Ficha →</Link>
                        {p.portalId && p.referencia && <Link href={`/portal-cliente/ref/${encodeURIComponent(p.referencia)}`} className="text-white/45 hover:text-white">Portal →</Link>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </section>

        {semRegisto.length > 0 && (
          <details className="rounded-[22px] border border-white/[0.08] bg-[#111111]/70 px-5 py-4 -mt-8">
            <summary className="cursor-pointer text-[12px] font-semibold tracking-[0.2em] uppercase text-white/60">
              Sem registo, prazo já passou ({semRegisto.length})
            </summary>
            <p className="mt-3 text-sm text-white/45">Casamentos com vídeo sem editor nem fase registados e com o prazo ultrapassado. Quase sempre foram entregues antes de haver registo no portal: marca-os como Entregue na ficha (Estado das Entregas) para saírem daqui.</p>
            <ul className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
              {semRegisto.map(p => (
                <li key={p.id} className="flex justify-between gap-3 border-b border-white/[0.05] py-1.5">
                  <Link href={`/eventos-2026/${p.fichaId}`} className="truncate text-white/75 hover:text-[#C9A84C]">{p.cliente || p.referencia}</Link>
                  <span className="text-white/35 flex-none">{fmt(p.data)}</span>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* ── Estados do vídeo: quem muda o quê (regras em lib/videoEstado.ts) ── */}
        <section>
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase" style={{ color: OURO }}>Portal dos noivos</p>
          <h2 className="mt-1 text-3xl sm:text-[34px] font-semibold">Estados do vídeo: quem faz o quê</h2>
          <p className="mt-2 text-sm text-white/45">O estado aparece aos noivos no portal (Estado das Entregas, linha do vídeo). Só este departamento e o Painel do Editor o mudam; a ficha do evento apenas mostra.</p>
          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {ESTADOS_INFO.map((e, i) => (
              <li key={e.estado} className="relative rounded-[22px] border border-white/[0.08] bg-[#111111]/85 backdrop-blur-md p-5" style={{ borderLeft: `2px solid ${e.cor}` }}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-thin tabular-nums text-white/40">{String(i + 1).padStart(2, '0')}</span>
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.2em] uppercase" style={{ color: e.cor, background: `${e.cor}1f`, border: `1px solid ${e.cor}55` }}>{e.quem}</span>
                </div>
                <p className="mt-3 text-[22px] font-semibold leading-tight">{e.estado}</p>
                <p className="mt-2 text-[13px] text-white/70 leading-snug"><span className="text-white/40">Quando: </span>{e.quando}</p>
                <p className="mt-1.5 text-[13px] text-white/70 leading-snug"><span className="text-white/40">Onde: </span>{e.onde}</p>
                <p className="mt-3 pt-3 border-t border-white/[0.06] text-[12.5px] italic leading-snug" style={{ color: '#d8be93' }}>Noivos: {e.noivos}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </main>
  )
}
