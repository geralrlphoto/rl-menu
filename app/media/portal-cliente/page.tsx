import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { getProjeto, type Projeto } from '@/app/portal-media/_data/mockProject'
import { FUNDO } from '@/app/media/_lib/estilo'
import { lerData, hojeLisboa } from '@/app/media/_lib/eventos'
import PortalSenhaInput from './PortalSenhaInput'
import ValorProjetoInput from './ValorProjetoInput'
import NovoPortalMediaButton from './NovoPortalMediaButton'

export const dynamic = 'force-dynamic'

// Só os caminhos do JSON que a lista usa (egress: nada de chat, imagens, briefing…)
const SELECT = [
  'ref',
  'nome:dados->>nome',
  'cliente:dados->>cliente',
  'tipo:dados->>tipo',
  'status:dados->>status',
  'dataFilmagem:dados->>dataFilmagem',
  'dataEntrega:dados->>dataEntrega',
  'senha:dados->>senha',
  'portalEnviadoEm:dados->>portalEnviadoEm',
  'email:dados->fichaCliente->>email',
  'telefoneCliente:dados->fichaCliente->>telefone',
  'fases:dados->fases',
  'pagamentos:dados->pagamentos',
  'entregas:dados->entregas',
].join(', ')

type Linha = {
  ref: string
  nome?: string | null
  cliente?: string | null
  tipo?: string | null
  status?: string | null
  dataFilmagem?: string | null
  dataEntrega?: string | null
  senha?: string | null
  portalEnviadoEm?: string | null
  email?: string | null
  telefoneCliente?: string | null
  fases?: Projeto['fases'] | null
  pagamentos?: Projeto['pagamentos'] | null
  entregas?: Projeto['entregas'] | null
}

type Item = Projeto & { portalEnviadoEm?: string }

// ─── helpers ──────────────────────────────────────────────────────────────────
type Grupo = 'producao' | 'concluido' | 'pausa' | 'outro'

function grupoStatus(status?: string): Grupo {
  const s = (status || '').toLowerCase()
  if (s.includes('produ')) return 'producao'
  if (s.includes('conclu')) return 'concluido'
  if (s.includes('pausa')) return 'pausa'
  return 'outro'
}

const ESTILO_GRUPO: Record<Grupo, { cor: string; fundo: string; borda: string }> = {
  producao:  { cor: '#ffffff', fundo: 'rgba(46,108,246,0.9)',  borda: 'rgba(46,108,246,0.9)' },
  concluido: { cor: '#a9c1ff', fundo: 'rgba(169,193,255,0.08)', borda: 'rgba(169,193,255,0.35)' },
  pausa:     { cor: '#7c8893', fundo: 'rgba(124,136,147,0.08)', borda: 'rgba(124,136,147,0.4)' },
  outro:     { cor: '#5a8bff', fundo: 'rgba(90,139,255,0.08)',  borda: 'rgba(90,139,255,0.35)' },
}

function faseAtual(p: Projeto): string | null {
  const emCurso = p.fases?.find(f => f.estado === 'em_curso')
  if (emCurso) return emCurso.nome
  const proxima = p.fases?.find(f => f.estado === 'pendente')
  if (proxima) return proxima.nome
  const concl = p.fases?.filter(f => f.estado === 'concluido') || []
  return concl.length ? concl[concl.length - 1].nome : null
}

const euro = (v: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)

function relativo(d: Date, hoje: Date): string {
  const dias = Math.round((d.getTime() - hoje.getTime()) / 86400000)
  if (dias === 0) return 'hoje'
  if (dias === 1) return 'amanhã'
  if (dias === -1) return 'ontem'
  return dias > 0 ? `daqui a ${dias} dias` : `há ${-dias} dias`
}

function resumo(p: Item, hoje: Date) {
  const fases = p.fases || []
  const fasesFeitas = fases.filter(f => f.estado === 'concluido').length
  const pag = p.pagamentos || []
  const totalPag = pag.reduce((s, x) => s + (Number(x.valor) || 0), 0)
  const pago = pag.filter(x => x.estado === 'pago').reduce((s, x) => s + (Number(x.valor) || 0), 0)
  const atraso = pag.filter(x => x.estado === 'em_atraso')
  const entregas = p.entregas || []
  const entregasPend = entregas.filter(e => e.estado !== 'disponivel').length
  const grupo = grupoStatus(p.status)

  const filmagem = lerData(p.dataFilmagem)
  const entrega = lerData(p.dataEntrega)
  const entregaAtrasada = !!entrega && entrega < hoje && grupo !== 'concluido' && entregasPend > 0

  // Próxima data relevante: a mais próxima de hoje para a frente
  const futuras = [
    filmagem && filmagem >= hoje ? { k: 'Filmagem', d: filmagem } : null,
    entrega && entrega >= hoje ? { k: 'Entrega', d: entrega } : null,
  ].filter(Boolean) as { k: string; d: Date }[]
  futuras.sort((a, b) => a.d.getTime() - b.d.getTime())

  return {
    grupo, fasesFeitas, fasesTotal: fases.length, fase: faseAtual(p),
    totalPag, pago, porReceber: totalPag - pago,
    atraso: atraso.length, valorAtraso: atraso.reduce((s, x) => s + (Number(x.valor) || 0), 0),
    entregasTotal: entregas.length, entregasPend,
    proxima: futuras[0] ?? null, entregaAtrasada,
  }
}

const FILTROS: { id: string; label: string }[] = [
  { id: 'todos',     label: 'Todos' },
  { id: 'producao',  label: 'Em produção' },
  { id: 'concluido', label: 'Concluídos' },
  { id: 'pausa',     label: 'Em pausa' },
  { id: 'atraso',    label: 'Pagamentos em atraso' },
]

// Separadores: Novos (portal ainda não enviado ao cliente), Ativos (enviado, a decorrer)
// e Fechados (projeto concluído)
const SEPARADORES = [
  { id: 'novos',    label: 'Novos projetos',    sub: 'Ainda não enviados ao cliente' },
  { id: 'ativos',   label: 'Projetos ativos',   sub: 'Com o cliente, a decorrer' },
  { id: 'fechados', label: 'Projetos fechados', sub: 'Concluídos' },
] as const
type Separador = typeof SEPARADORES[number]['id']

// ─── página ───────────────────────────────────────────────────────────────────
export default async function PortalClientePage({ searchParams }: { searchParams: Promise<{ estado?: string; ver?: string }> }) {
  const { estado: estadoParam, ver: verParam } = await searchParams
  const filtro = FILTROS.some(f => f.id === estadoParam) ? estadoParam! : 'todos'

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('media_portais')
    .select(SELECT)
    .order('updated_at', { ascending: false })
  const rows = (data || []) as unknown as Linha[]

  const supabaseRefs = new Set(rows.map(r => r.ref.toUpperCase()))

  // Mapa ref → senha e portalEnviadoEm (tal como estão no Supabase)
  const senhaMap: Record<string, string | undefined> = {}
  const enviadoEmMap: Record<string, string | undefined> = {}
  const telMap: Record<string, string | undefined> = {}
  rows.forEach(r => {
    senhaMap[r.ref.toUpperCase()] = r.senha ?? undefined
    enviadoEmMap[r.ref.toUpperCase()] = r.portalEnviadoEm ?? undefined
    telMap[r.ref.toUpperCase()] = r.telefoneCliente ?? undefined
  })

  const mockProjetos: Item[] = []
  const oleobio = getProjeto('OLEOBIO')
  if (oleobio && !supabaseRefs.has('OLEOBIO')) mockProjetos.push(oleobio)

  const supabaseProjetos: Item[] = rows.map(r => {
    // Sem as chaves vazias, para o mock (se existir) preencher o que falta
    const { email, ...resto } = r
    const dados = Object.fromEntries(Object.entries(resto).filter(([, v]) => v !== null && v !== undefined)) as Partial<Item>
    const mock = getProjeto(r.ref)
    const base = (mock ? { ...mock, ...dados } : dados) as Item
    const emailFinal = email ?? mock?.fichaCliente?.email
    return emailFinal ? { ...base, fichaCliente: { ...(base.fichaCliente || {}), email: emailFinal } } : base
  })

  const todos: Item[] = [...supabaseProjetos, ...mockProjetos]
  const hoje = hojeLisboa()
  const lista = todos.map(p => {
    const r = resumo(p, hoje)
    const enviado = enviadoEmMap[p.ref?.toUpperCase()] ?? p.portalEnviadoEm
    const sep: Separador = r.grupo === 'concluido' ? 'fechados' : enviado ? 'ativos' : 'novos'
    return { p, r, sep }
  })
  const porSep: Record<Separador, number> = {
    novos: lista.filter(x => x.sep === 'novos').length,
    ativos: lista.filter(x => x.sep === 'ativos').length,
    fechados: lista.filter(x => x.sep === 'fechados').length,
  }
  const separador: Separador = SEPARADORES.some(x => x.id === verParam) ? verParam as Separador : 'ativos'
  const doSep = lista.filter(x => x.sep === separador)
  const ligacao = (sep: Separador, est?: string) => {
    const q = new URLSearchParams()
    if (sep !== 'ativos') q.set('ver', sep)
    if (est && est !== 'todos') q.set('estado', est)
    const t = q.toString()
    return `/media/portal-cliente${t ? `?${t}` : ''}`
  }

  // ── Resumo geral ──
  const ativos = lista.filter(({ p }) => enviadoEmMap[p.ref?.toUpperCase()] ?? p.portalEnviadoEm).length
  const emProducao = lista.filter(x => x.r.grupo === 'producao').length
  const entregasPend = lista.reduce((s, x) => s + x.r.entregasPend, 0)
  const porReceber = lista.reduce((s, x) => s + x.r.porReceber, 0)
  const comAtraso = lista.filter(x => x.r.atraso > 0).length
  const valorAtraso = lista.reduce((s, x) => s + x.r.valorAtraso, 0)

  // Os filtros finos contam dentro do separador escolhido
  const contagem: Record<string, number> = {
    todos: doSep.length,
    producao: doSep.filter(x => x.r.grupo === 'producao').length,
    concluido: separador === 'fechados' ? 0 : doSep.filter(x => x.r.grupo === 'concluido').length,
    pausa: doSep.filter(x => x.r.grupo === 'pausa').length,
    atraso: doSep.filter(x => x.r.atraso > 0).length,
  }

  const visiveis = doSep.filter(x =>
    filtro === 'todos' ? true : filtro === 'atraso' ? x.r.atraso > 0 : x.r.grupo === filtro)

  return (
    <main className="rlp min-h-screen relative text-white">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-10 pt-8 pb-16">

        <Link href="/media" className="text-[12px] text-white/45 hover:text-white transition-colors">‹ RL Prod</Link>

        {/* Cabeçalho */}
        <div className="mt-6 mb-8 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="rlp-m traco text-[11px] text-[#5a8bff]">RL Prod · Projetos e portais</p>
            <h1 className="rlp-t mt-3 text-[48px] sm:text-[64px] leading-[0.95]">
              Projetos<span className="text-[#5a8bff]">.</span>
            </h1>
            <p className="mt-3 text-[14px] text-white/55">
              {todos.length} {todos.length === 1 ? 'projeto' : 'projetos'}, do arranque à entrega final.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/media/portal-cliente/acesso"
              className="inline-flex items-center gap-2 rounded-full border border-white/25 hover:border-white/50 px-5 py-3 text-[13.5px] text-white/85 hover:text-white transition-colors">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Acesso ao portal
            </Link>
            <NovoPortalMediaButton />
          </div>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { k: 'Portais ativos', v: String(ativos), sub: `de ${todos.length} enviados ao cliente`, cor: '#ffffff' },
            { k: 'Em produção', v: String(emProducao), sub: 'projetos a decorrer', cor: '#5a8bff' },
            { k: 'Entregas pendentes', v: String(entregasPend), sub: 'ainda por disponibilizar', cor: '#ffffff' },
            { k: 'Valor por receber', v: euro(porReceber), sub: comAtraso ? `${euro(valorAtraso)} em atraso` : 'nada em atraso', cor: '#a9c1ff', alerta: comAtraso > 0 },
          ].map(c => (
            <div key={c.k} className="rounded-2xl border border-white/[0.1] bg-[#00141f]/70 p-5">
              <p className="rlp-m text-[10px] text-white/45">{c.k}</p>
              <p className="rlp-t mt-2 text-[34px] sm:text-[40px] leading-none" style={{ color: c.cor }}>{c.v}</p>
              <p className={`mt-2 text-[12px] ${c.alerta ? 'text-[#ff4747]' : 'text-white/45'}`}>{c.sub}</p>
            </div>
          ))}
        </div>

        {/* Separadores */}
        <nav className="mt-10 grid grid-cols-3 gap-2" aria-label="Separadores de projetos">
          {SEPARADORES.map(t => {
            const ativo = separador === t.id
            return (
              <Link key={t.id} href={ligacao(t.id)} scroll={false}
                className={`rounded-2xl border px-4 py-3.5 sm:px-5 sm:py-4 transition-colors ${ativo ? 'border-[#2e6cf6] bg-[#2e6cf6]/20' : 'border-white/[0.1] bg-[#00141f]/60 hover:border-white/30'}`}>
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`rlp-t text-[17px] sm:text-[22px] leading-tight ${ativo ? 'text-white' : 'text-white/75'}`}>{t.label}</span>
                  <span className={`rlp-t text-[22px] sm:text-[28px] leading-none ${ativo ? 'text-[#a9c1ff]' : 'text-white/40'}`}>{porSep[t.id]}</span>
                </span>
                <span className="mt-1 hidden sm:block text-[12px] text-white/45">{t.sub}</span>
              </Link>
            )
          })}
        </nav>

        {/* Filtros dentro do separador */}
        <div className="mt-6 mb-5 flex flex-wrap items-center justify-between gap-4">
          <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">{SEPARADORES.find(t => t.id === separador)!.label}</p>
          <div className="flex flex-wrap gap-1 rounded-full border border-white/[0.12] bg-[#00141f]/60 p-1">
            {FILTROS.filter(f => f.id === 'todos' || f.id === filtro || contagem[f.id] > 0).filter(f => !(separador === 'fechados' && f.id === 'concluido')).map(f => {
              const ativo = filtro === f.id
              const alerta = f.id === 'atraso'
              return (
                <Link key={f.id} href={ligacao(separador, f.id)}
                  scroll={false}
                  className={`rounded-full px-3.5 py-1.5 text-[12px] transition-colors ${
                    ativo ? (alerta ? 'bg-[#ff4747] text-white' : 'bg-[#2e6cf6] text-white')
                      : alerta ? 'text-[#ff4747]/80 hover:text-[#ff4747]' : 'text-white/55 hover:text-white'}`}>
                  {f.label} <span className="opacity-60">{contagem[f.id]}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Cartões */}
        {visiveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 rounded-2xl border border-white/[0.1] bg-[#00141f]/60">
            <p className="rlp-m text-[11px] text-white/40">{doSep.length === 0 ? (separador === 'novos' ? 'Sem projetos novos' : separador === 'fechados' ? 'Sem projetos fechados' : 'Sem projetos ativos') : 'Sem projetos neste filtro'}</p>
            {doSep.length > 0 && <Link href={ligacao(separador)} className="text-[14px] text-[#5a8bff] hover:underline">Ver todos</Link>}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {visiveis.map(({ p: portal, r }) => {
              const href = `/portal-media/${portal.ref}`
              const refU = portal.ref?.toUpperCase()
              const enviado = enviadoEmMap[refU] ?? portal.portalEnviadoEm
              const est = ESTILO_GRUPO[r.grupo]
              const pctFases = r.fasesTotal ? Math.round((r.fasesFeitas / r.fasesTotal) * 100) : 0
              const pctPago = r.totalPag ? Math.round((r.pago / r.totalPag) * 100) : 0
              const alerta = r.atraso > 0 || r.entregaAtrasada
              return (
                <article key={portal.ref}
                  className={`group flex flex-col rounded-2xl border bg-[#00141f]/70 hover:bg-[#0c2236]/80 transition-colors p-5 sm:p-6 ${
                    alerta ? 'border-[#ff4747]/40' : 'border-white/[0.1] hover:border-[#2e6cf6]/60'}`}>

                  {/* Topo */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="rlp-m text-[9.5px] text-white/40 truncate">
                        {portal.ref}{portal.tipo ? ` · ${portal.tipo}` : ''}
                      </p>
                      <h2 className="rlp-t mt-1.5 text-[24px] sm:text-[26px] leading-[1.05] truncate">
                        {portal.nome || portal.ref}
                      </h2>
                      {portal.cliente && <p className="mt-1 text-[13px] text-white/55 truncate">{portal.cliente}</p>}
                      {portal.fichaCliente?.email && (
                        <a href={`mailto:${portal.fichaCliente.email}`}
                          className="mt-0.5 inline-block text-[12.5px] text-[#a9c1ff] hover:text-white transition-colors truncate max-w-full">
                          {portal.fichaCliente.email}
                        </a>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      {portal.status && (
                        <span className="rlp-m text-[9px] px-3 py-1.5 rounded-full border"
                          style={{ color: est.cor, background: est.fundo, borderColor: est.borda }}>
                          {portal.status}
                        </span>
                      )}
                      {enviado && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-[#5a8bff]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#5a8bff] animate-pulse" /> Ativo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progresso das fases */}
                  <div className="mt-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[13px] text-white/85 truncate">
                        <span className="rlp-m text-[9.5px] text-white/40 mr-2">Fase</span>
                        {r.fase ?? 'Sem fases definidas'}
                      </p>
                      <span className="shrink-0 text-[12px] text-white/50">
                        {r.fasesFeitas}/{r.fasesTotal} <span className="text-[#5a8bff]">{pctFases}%</span>
                      </span>
                    </div>
                    {r.fasesTotal > 0 && (
                      <div className="mt-2 flex gap-1">
                        {(portal.fases || []).map((f, i) => (
                          <span key={f.id ?? i} title={f.nome}
                            className={`h-1.5 flex-1 rounded-full ${
                              f.estado === 'concluido' ? 'bg-[#2e6cf6]'
                                : f.estado === 'em_curso' ? 'bg-[#5a8bff]/50 animate-pulse'
                                : 'bg-white/[0.08]'}`} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Datas, pagamentos, entregas */}
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 min-w-0">
                      <p className="rlp-m text-[9px] text-white/40 truncate">{r.proxima ? r.proxima.k : 'Entrega'}</p>
                      {r.proxima ? (
                        <>
                          <p className="mt-1 text-[13px] text-white/90 truncate">
                            {r.proxima.d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}
                          </p>
                          <p className="text-[11px] text-[#5a8bff] truncate">{relativo(r.proxima.d, hoje)}</p>
                        </>
                      ) : (
                        <>
                          <p className="mt-1 text-[13px] text-white/90 truncate">{portal.dataEntrega || 'Por definir'}</p>
                          <p className={`text-[11px] truncate ${r.entregaAtrasada ? 'text-[#ff4747]' : 'text-white/40'}`}>
                            {r.entregaAtrasada ? 'Prazo ultrapassado' : 'sem datas próximas'}
                          </p>
                        </>
                      )}
                    </div>

                    <div className={`rounded-xl border px-3 py-2.5 min-w-0 ${r.atraso ? 'border-[#ff4747]/40 bg-[#ff4747]/[0.06]' : 'border-white/[0.06] bg-white/[0.03]'}`}>
                      <p className="rlp-m text-[9px] text-white/40 truncate">Pago</p>
                      <p className="mt-1 text-[13px] text-white/90 truncate">{r.totalPag ? `${pctPago}%` : 'Sem plano'}</p>
                      {r.totalPag > 0 && (
                        <div className="mt-1.5 h-1 rounded-full bg-white/[0.08] overflow-hidden">
                          <div className="h-full rounded-full bg-[#2e6cf6]" style={{ width: `${pctPago}%` }} />
                        </div>
                      )}
                      {r.atraso > 0 ? (
                        <p className="mt-1 text-[11px] text-[#ff4747] truncate">{r.atraso} em atraso</p>
                      ) : r.porReceber > 0 ? (
                        <p className="mt-1 text-[11px] text-white/40 truncate">{euro(r.porReceber)} por receber</p>
                      ) : null}
                    </div>

                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 min-w-0">
                      <p className="rlp-m text-[9px] text-white/40 truncate">Entregas</p>
                      <p className="mt-1 text-[13px] text-white/90 truncate">
                        {r.entregasTotal ? `${r.entregasTotal - r.entregasPend}/${r.entregasTotal}` : 'Nenhuma'}
                      </p>
                      <p className="text-[11px] text-white/40 truncate">
                        {r.entregasTotal ? (r.entregasPend ? `${r.entregasPend} por entregar` : 'tudo entregue') : 'por definir'}
                      </p>
                    </div>
                  </div>

                  {/* Valor do projeto: cria/ajusta o plano de pagamentos */}
                  <ValorProjetoInput portalRef={portal.ref} valorInicial={r.totalPag} />

                  {/* Ações */}
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Link href={href} target="_blank"
                      className="inline-flex items-center gap-2 rounded-full bg-[#2e6cf6] hover:bg-[#3d79ff] px-5 py-2.5 text-[13px] font-medium text-white transition-colors">
                      Abrir portal <span aria-hidden>→</span>
                    </Link>
                    <Link href={`${href}/card`} target="_blank"
                      className="inline-flex items-center gap-2 rounded-full border border-white/25 hover:border-white/50 px-4 py-2.5 text-[13px] text-white/80 hover:text-white transition-colors">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
                      </svg>
                      Card
                    </Link>
                  </div>

                  {/* Senha e envio */}
                  <div className="mt-5 pt-4 border-t border-white/[0.08]">
                    <PortalSenhaInput
                      portalRef={portal.ref}
                      senhaInicial={senhaMap[refU] ?? portal.senha}
                      portalEnviadoEm={enviado}
                      telefone={telMap[refU] ?? portal.fichaCliente?.telefone}
                      nomeCliente={portal.fichaCliente?.nome || portal.cliente || portal.nome}
                    />
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Novo portal */}
        <div className="mt-8 rounded-2xl border border-dashed border-white/[0.15] bg-[#00141f]/50 px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="rlp-t text-[18px]">Novo portal</p>
            <p className="mt-0.5 text-[13px] text-white/50">Criar à mão ou a partir de uma lead do CRM.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/media/crm/leads" className="text-[13px] text-[#5a8bff] hover:underline">Ir para o CRM →</Link>
            <NovoPortalMediaButton />
          </div>
        </div>

      </div>
    </main>
  )
}
