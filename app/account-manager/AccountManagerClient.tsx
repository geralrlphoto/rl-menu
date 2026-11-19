'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Nivel = 'alto' | 'medio' | 'baixo'
type Alerta = { area: string; titulo: string; detalhe: string; dias: number | null; nivel: Nivel; link: string | null }
type Encomenda = {
  id: string; pedido: string | null; convidado: string | null; telefone: string | null; noivos: string | null; data_casamento: string | null
  formato: string | null; quantidade: number | null; total: number | null; estado: string; dias: number; problema: string; responsavel: string | null; nivel: Nivel
}
type PedidoConv = { id: string; convidado: string | null; noivos: string | null; data_casamento: string | null; entrega: string | null; fotos: string | null; status: string; dias: number }
type Equipa = {
  referencia: string | null; cliente: string; data: string; local: string | null; dias: number; tipo: string
  precisaFoto: number; precisaVideo: number; fotografos: string[]; videografos: string[]; confirmados: string[]; indisponiveis: string[]
  falta: string[]; receita: number; custo: number | null; margem: number | null; link: string
}
type Prioridade = { titulo: string; detalhe?: string; link?: string; nivel?: Nivel }
type Dados = {
  hoje: string; atualizado: string
  resumo: { alto: number; medio: number; fotosConvidados: number; semValoresEquipa: boolean; fontesEmFalta: string[] }
  urgentes: Alerta[]
  fotosConvidados: { encomendas: Encomenda[]; pedidos: PedidoConv[]; galeriasAtrasadas: { cliente: string; data: string; dias: number; link: string }[] }
  equipas: Equipa[]
  objetivos: { id: string; label: string; target: number; atual: number | null; fonte: string }[]
  nota: { created_at: string; resumo: string; prioridades: Prioridade[] } | null
}

const OURO = '#C9A84C'
const COR_NIVEL: Record<Nivel, { txt: string; borda: string; fundo: string; nome: string }> = {
  alto: { txt: '#fca5a5', borda: 'rgba(248,113,113,0.45)', fundo: 'rgba(239,68,68,0.10)', nome: 'Urgente' },
  medio: { txt: '#fcd34d', borda: 'rgba(252,211,77,0.4)', fundo: 'rgba(252,211,77,0.08)', nome: 'Atenção' },
  baixo: { txt: 'rgba(255,255,255,0.65)', borda: 'rgba(255,255,255,0.15)', fundo: 'rgba(255,255,255,0.03)', nome: 'A seguir' },
}

const euro = (n: number) => n.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const dataPT = (iso: string) => new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
const horaPT = (iso: string) => new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

const cartao = 'rounded-[20px] border border-white/[0.1] bg-[#0e0e0e]/70'
const pilula = 'inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-[15px] transition-all disabled:opacity-50'

function Chip({ nivel, children }: { nivel: Nivel; children: React.ReactNode }) {
  const c = COR_NIVEL[nivel]
  return <span className="shrink-0 rounded-full border px-2.5 py-0.5 text-[12.5px] font-semibold" style={{ color: c.txt, borderColor: c.borda, background: c.fundo }}>{children}</span>
}

function Titulo({ sobre, titulo, children }: { sobre: string; titulo: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">{sobre}</p>
        <h2 className="font-semibold text-white text-[28px] leading-tight mt-1">{titulo}</h2>
      </div>
      {children}
    </div>
  )
}

export default function AccountManagerClient() {
  const [dados, setDados] = useState<Dados | null>(null)
  const [aCarregar, setACarregar] = useState(false)
  const [erro, setErro] = useState('')
  const [area, setArea] = useState<string>('Todas')
  const [copiado, setCopiado] = useState(false)

  const atualizar = useCallback(async () => {
    setACarregar(true)
    setErro('')
    try {
      const r = await fetch('/api/account-manager', { cache: 'no-store' })
      const j = await r.json()
      if (!r.ok || !j.ok) throw new Error(j.error ?? 'erro')
      setDados(j)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'erro')
    }
    setACarregar(false)
  }, [])

  useEffect(() => { atualizar() }, [atualizar])

  async function pedirAnalise() {
    try { await navigator.clipboard.writeText('ponto de situação') } catch { /* sem clipboard */ }
    setCopiado(true)
    setTimeout(() => setCopiado(false), 6000)
  }

  const areas = useMemo(() => ['Todas', ...new Set((dados?.urgentes ?? []).map(u => u.area))], [dados])
  const visiveis = (dados?.urgentes ?? []).filter(u => area === 'Todas' || u.area === area)

  return (
    <>
      {/* ── Topo, como o do CRM e do /freelancers ─────────────────────────── */}
      <section className="relative min-h-[520px] lg:min-h-[66vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
          <img src="/quinta-da-ria-aerea.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-center grayscale opacity-40 lg:opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Projetos · Equipas · Objetivos
        </p>

        <div className="relative flex-1 flex flex-col pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-16 lg:pt-8 pb-10 lg:pb-14">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Link href="/freelancers" className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ Voltar à Equipa</Link>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={pedirAnalise}
                className={`${pilula} text-white/80 border border-white/[0.16] hover:border-white/35 bg-[#0e0e0e]/80 backdrop-blur-md`}>
                {copiado ? 'Copiado: cola no Claude Code' : 'Pedir análise ao Claude'}
              </button>
              <button onClick={atualizar} disabled={aCarregar}
                className={`${pilula} bg-[#0e0e0e]/90 backdrop-blur-md text-white border border-[#C9A84C]/45 hover:border-[#C9A84C]/80 shadow-[0_0_28px_-12px_rgba(201,168,76,0.6)]`}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke={OURO} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={aCarregar ? 'animate-spin' : ''} aria-hidden>
                  <path d="M4 4v6h6M20 20v-6h-6M5.5 15a7 7 0 0011.9 2.5L20 14M18.5 9A7 7 0 006.6 6.5L4 10" />
                </svg>
                {aCarregar ? 'A atualizar…' : 'Atualizar'}
              </button>
            </div>
          </div>
          {copiado && (
            <p className="self-end mt-3 max-w-sm text-right text-[14px] text-white/60">
              Copiei &quot;ponto de situação&quot;. Cola no Claude Code: eu reviso tudo e deixo aqui as prioridades e as mensagens prontas.
            </p>
          )}

          <div className="mt-auto pt-14">
            <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
            <h1 className="font-bold uppercase text-white leading-[0.88] text-[48px] sm:text-[96px] lg:text-[124px] mt-2">Account<br />Manager</h1>
            <div className="flex items-center gap-4 mt-5">
              <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
              <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                Projetos · Equipas · <span className="text-[#C9A84C]">Objetivos</span>
              </p>
            </div>
            <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-2xl">
              Tudo o que precisa de ti hoje, num só sítio: prazos, fotos dos convidados, equipas dos casamentos e objetivos do ano.
              {dados && <> Atualizado {horaPT(dados.atualizado)}.</>}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-5 sm:px-10 lg:px-14 pt-6 pb-24 space-y-14">
        {erro && <p className="text-red-400">Erro: {erro}</p>}
        {!dados && !erro && <p className="text-white/40">A preparar o ponto de situação…</p>}

        {dados && (
          <>
            {/* ── Números do dia ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { n: dados.resumo.alto, t: 'Urgentes', c: COR_NIVEL.alto.txt },
                { n: dados.resumo.medio, t: 'Pedem atenção', c: COR_NIVEL.medio.txt },
                { n: dados.resumo.fotosConvidados, t: 'Fotos dos convidados', c: OURO },
                { n: dados.equipas.filter(e => e.falta.length).length, t: 'Eventos sem equipa completa', c: 'rgba(255,255,255,0.85)' },
              ].map(k => (
                <div key={k.t} className={`${cartao} px-5 py-4`}>
                  <p className="font-bold text-[40px] leading-none" style={{ color: k.c }}>{k.n}</p>
                  <p className="text-[14px] text-white/50 mt-2">{k.t}</p>
                </div>
              ))}
            </div>
            {dados.resumo.fontesEmFalta.length > 0 && (
              <p className="text-[14px] text-amber-300">Não consegui ler: {dados.resumo.fontesEmFalta.join(', ')}. Carrega em Atualizar outra vez.</p>
            )}

            {/* ── Análise do Claude ─────────────────────────────────────── */}
            <section>
              <Titulo sobre="Análise do Account Manager" titulo="Prioridades">
                {dados.nota && <span className="text-[14px] text-white/40">Escrita {horaPT(dados.nota.created_at)}</span>}
              </Titulo>
              {dados.nota ? (
                <div className={`${cartao} p-6 sm:p-7`} style={{ borderColor: 'rgba(201,168,76,0.3)' }}>
                  <p className="whitespace-pre-line text-[17px] font-light leading-relaxed text-white/80">{dados.nota.resumo}</p>
                  {dados.nota.prioridades?.length > 0 && (
                    <ol className="mt-6 space-y-3">
                      {dados.nota.prioridades.map((p, i) => (
                        <li key={i} className="flex gap-4 items-start">
                          <span className="font-bold text-[26px] leading-none w-8 shrink-0" style={{ color: 'transparent', WebkitTextStroke: '1px rgba(216,190,147,.6)' }}>{String(i + 1).padStart(2, '0')}</span>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-[17px] text-white flex flex-wrap items-center gap-2">
                              {p.titulo} {p.nivel && <Chip nivel={p.nivel}>{COR_NIVEL[p.nivel].nome}</Chip>}
                            </p>
                            {p.detalhe && <p className="text-[15px] text-white/55 mt-0.5">{p.detalhe}</p>}
                          </div>
                          {p.link && <Link href={p.link} className="text-[14px] font-semibold text-[#C9A84C]/85 hover:text-[#C9A84C] shrink-0">Abrir →</Link>}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ) : (
                <p className="text-white/45 text-[16px]">Ainda sem análise. Carrega em &quot;Pedir análise ao Claude&quot; e cola no Claude Code.</p>
              )}
            </section>

            {/* ── Urgente agora ────────────────────────────────────────── */}
            <section>
              <Titulo sobre="Calculado pela app" titulo="O que precisa de ti">
                <div className="flex flex-wrap gap-2">
                  {areas.map(a => (
                    <button key={a} onClick={() => setArea(a)} className="rounded-full border px-3.5 py-1.5 text-[13.5px] font-semibold transition-colors"
                      style={area === a ? { color: '#0b0b0b', background: OURO, borderColor: OURO } : { color: 'rgba(255,255,255,0.65)', background: 'rgba(201,168,76,0.06)', borderColor: 'rgba(201,168,76,0.25)' }}>
                      {a}
                    </button>
                  ))}
                </div>
              </Titulo>
              {visiveis.length === 0 ? (
                <p className="text-white/45 text-[16px]">Nada em atraso nem a vencer. Bom trabalho.</p>
              ) : (
                <div className={`${cartao} divide-y divide-white/[0.06]`}>
                  {visiveis.map((u, i) => {
                    const linha = (
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-1 px-5 py-3.5">
                        <Chip nivel={u.nivel}>{COR_NIVEL[u.nivel].nome}</Chip>
                        <span className="text-[12.5px] tracking-[0.12em] uppercase text-white/40 w-[150px] shrink-0">{u.area}</span>
                        <span className="font-semibold text-[16px] text-white min-w-0 flex-1 truncate">{u.titulo}</span>
                        <span className="text-[14px] text-white/55 shrink-0">{u.detalhe}</span>
                        {u.link && <span className="text-[#C9A84C]/70 shrink-0">→</span>}
                      </div>
                    )
                    return u.link
                      ? <Link key={i} href={u.link} className="block hover:bg-white/[0.03] transition-colors">{linha}</Link>
                      : <div key={i}>{linha}</div>
                  })}
                </div>
              )}
            </section>

            {/* ── Fotos dos convidados (cuidado especial) ─────────────────── */}
            <section>
              <Titulo sobre="Cuidado especial" titulo="Fotos dos convidados">
                <Link href="/fotos-convidados" className="text-[14px] font-semibold text-[#C9A84C]/85 hover:text-[#C9A84C]">Abrir Fotos dos Convidados →</Link>
              </Titulo>
              <div className="grid lg:grid-cols-3 gap-4">
                <div className={`${cartao} p-5 lg:col-span-2`}>
                  <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/40 mb-3">Encomendas por fechar ({dados.fotosConvidados.encomendas.length})</p>
                  {dados.fotosConvidados.encomendas.length === 0 ? <p className="text-white/45">Todas entregues.</p> : (
                    <div className="space-y-2.5">
                      {dados.fotosConvidados.encomendas.map(e => (
                        <div key={e.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-[14px] border border-white/[0.06] bg-black/30 px-4 py-3">
                          <Chip nivel={e.nivel}>há {e.dias} dias</Chip>
                          <span className="font-semibold text-[16px]">{e.convidado ?? 'Convidado'}</span>
                          <span className="text-[14px] text-white/45">{e.noivos ?? ''}{e.data_casamento ? ` · ${e.data_casamento}` : ''}</span>
                          <span className="ml-auto text-[14px] text-white/70">{e.problema || e.estado}</span>
                          <span className="w-full text-[13px] text-white/35">
                            {e.pedido ?? ''} · {e.quantidade ?? '?'} fotos {e.formato ?? ''}{e.total ? ` · ${euro(Number(e.total))}` : ''}{e.responsavel ? ` · ${e.responsavel}` : ''}{e.telefone ? ` · ${e.telefone}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className={`${cartao} p-5`}>
                    <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/40 mb-3">Galerias para convidados em atraso</p>
                    {dados.fotosConvidados.galeriasAtrasadas.length === 0 ? <p className="text-white/45">Nenhuma. Prazo de 7 dias cumprido.</p> : (
                      <ul className="space-y-2">
                        {dados.fotosConvidados.galeriasAtrasadas.map(g => (
                          <li key={g.link}><Link href={g.link} className="flex justify-between gap-3 hover:text-[#C9A84C]"><span className="font-semibold">{g.cliente}</span><span className="text-red-300 text-[14px]">+{g.dias} dias</span></Link></li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className={`${cartao} p-5`}>
                    <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-white/40 mb-3">Pedidos pelo formulário</p>
                    {dados.fotosConvidados.pedidos.length === 0 ? <p className="text-white/45">Nenhum por responder.</p> : (
                      <ul className="space-y-2">
                        {dados.fotosConvidados.pedidos.map(p => (
                          <li key={p.id} className="flex justify-between gap-3">
                            <span><span className="font-semibold">{p.convidado ?? 'Convidado'}</span> <span className="text-white/45 text-[14px]">{p.noivos ?? ''}</span></span>
                            <span className="text-[14px] text-white/55 shrink-0">{p.status} · {p.dias} d</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* ── Equipas dos próximos eventos ────────────────────────────── */}
            <section>
              <Titulo sobre="Gestão de equipas" titulo="Próximos eventos" />
              {dados.resumo.semValoresEquipa && (
                <p className="mb-4 text-[15px] text-white/55 max-w-3xl">
                  Ainda não há valores da equipa registados (quanto paga cada fotógrafo e videógrafo por casamento). Preenche-os na ficha de cada membro em{' '}
                  <Link href="/freelancers" className="text-[#C9A84C] hover:underline">Equipa</Link> para eu calcular o custo e a margem de cada casamento.
                </p>
              )}
              {dados.equipas.length === 0 ? <p className="text-white/45">Sem eventos marcados.</p> : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dados.equipas.map(e => (
                    <Link key={e.link} href={e.link} className={`${cartao} am-cartao p-5 block`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[19px] leading-tight truncate">{e.cliente}</p>
                          <p className="text-[14px] text-white/45 mt-0.5 truncate">{dataPT(e.data)}{e.local ? ` · ${e.local}` : ''}</p>
                        </div>
                        <Chip nivel={e.falta.length ? (e.dias <= 21 ? 'alto' : 'medio') : 'baixo'}>{e.dias === 0 ? 'Hoje' : `${e.dias} d`}</Chip>
                      </div>
                      <div className="mt-4 space-y-1.5 text-[14.5px]">
                        {e.precisaFoto > 0 && <p><span className="text-white/40">Foto ({e.precisaFoto}):</span> {e.fotografos.length ? e.fotografos.join(', ') : <span className="text-red-300">por atribuir</span>}</p>}
                        {e.precisaVideo > 0 && <p><span className="text-white/40">Vídeo ({e.precisaVideo}):</span> {e.videografos.length ? e.videografos.join(', ') : <span className="text-red-300">por atribuir</span>}</p>}
                        {e.confirmados.length > 0 && <p className="text-emerald-300/80">Confirmados: {e.confirmados.join(', ')}</p>}
                        {e.indisponiveis.length > 0 && <p className="text-red-300">Indisponíveis: {e.indisponiveis.join(', ')}</p>}
                        {e.falta.length > 0 && <p className="text-amber-300">Falta {e.falta.join(' e ')}</p>}
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/[0.06] flex justify-between text-[14px]">
                        <span className="text-white/45">Receita {e.receita ? euro(e.receita) : '—'}</span>
                        <span style={{ color: e.margem === null ? 'rgba(255,255,255,0.35)' : e.margem >= 0 ? '#86efac' : '#fca5a5' }}>
                          {e.margem === null ? 'Margem por calcular' : `Margem ${euro(e.margem)}`}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {/* ── Objetivos do ano ────────────────────────────────────────── */}
            <section>
              <Titulo sobre={`Objetivos ${dados.hoje.slice(0, 4)}`} titulo="Onde estamos">
                <Link href="/objetivos" className="text-[14px] font-semibold text-[#C9A84C]/85 hover:text-[#C9A84C]">Abrir Objetivos →</Link>
              </Titulo>
              <div className="grid sm:grid-cols-2 gap-4">
                {dados.objetivos.map(o => {
                  const pct = o.atual !== null && o.target ? Math.min(100, Math.round((o.atual / o.target) * 100)) : null
                  const valor = (n: number) => (/fatura/i.test(o.id) ? euro(n) : String(n))
                  return (
                    <div key={o.id} className={`${cartao} p-5`}>
                      <div className="flex justify-between items-baseline gap-3">
                        <p className="font-semibold text-[18px]">{o.label}</p>
                        <p className="text-[15px] text-white/60">{o.atual !== null ? valor(o.atual) : '—'} <span className="text-white/35">/ {valor(o.target)}</span></p>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct ?? 0}%`, background: `linear-gradient(90deg, ${OURO}, #e8d9b0)` }} />
                      </div>
                      <p className="mt-2 text-[13px] text-white/35">{pct !== null ? `${pct}% · ` : ''}{o.fonte}</p>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>

      <style>{`
        .am-cartao { transition: border-color .4s ease, box-shadow .4s ease, transform .4s cubic-bezier(.19,1,.22,1); }
        .am-cartao:hover { transform: translateY(-3px); border-color: rgba(216,190,147,.45); box-shadow: 0 0 50px -20px rgba(216,190,147,.55); }
      `}</style>
    </>
  )
}
