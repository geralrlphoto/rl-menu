'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FUNDO } from '@/app/media/_lib/estilo'

// Pesquisa por setor: lista empresas de um setor nos distritos escolhidos,
// com score, contactos, redes sociais e opção de guardar no CRM

// ─── tipos ────────────────────────────────────────────────────────────────────

type Contacto = { nome: string; email: string; cargo: string }

type Prospect = {
  empresa: string; website: string; domain: string
  descricao: string; distrito: string; sector: string
  faturacaoEstimada: string
  numFuncionarios: number | null
  contacto: Contacto | null
  todosContatos: Contacto[]
  analise: string
  instagramUrl: string | null
  facebookUrl: string | null
  tiktokUrl: string | null
  interesseVideo: boolean
  premios: string[]
  eventosRecentes: string[]
  isHiringMarketing: boolean
  score: number
}

// ─── constantes ───────────────────────────────────────────────────────────────

const SECTORES = [
  { id: 'imobiliário',   label: 'Imobiliário',        query: 'imobiliária mediação imobiliária' },
  { id: 'restauração',   label: 'Restauração',         query: 'restaurante hotel restauração' },
  { id: 'hotelaria',     label: 'Hotelaria',           query: 'hotel spa resort turismo' },
  { id: 'construção',    label: 'Construção',           query: 'construção civil obras engenharia' },
  { id: 'moda',          label: 'Moda & Vestuário',    query: 'moda vestuário boutique roupa' },
  { id: 'saúde',         label: 'Saúde & Clínicas',   query: 'clínica médica saúde dentista' },
  { id: 'tecnologia',    label: 'Tecnologia',          query: 'tecnologia software startup digital' },
  { id: 'retalho',       label: 'Retalho & Comércio',  query: 'loja comércio retalho produto' },
  { id: 'indústria',     label: 'Indústria',           query: 'indústria fábrica produção industrial' },
  { id: 'eventos',       label: 'Eventos & Catering',  query: 'eventos catering wedding planner' },
  { id: 'alimentar',     label: 'Indústria Alimentar', query: 'alimentar produção alimentar marca' },
  { id: 'serviços',      label: 'Serviços B2B',        query: 'consultoria serviços empresariais' },
]

const DISTRITOS = ['Lisboa', 'Setúbal', 'Évora']

const corScore = (s: number) => (s >= 70 ? '#2e6cf6' : s >= 40 ? '#5a8bff' : '#7c8893')

const chip = (ativo: boolean) =>
  `rounded-full border px-4 py-2 text-[13px] transition-colors ${ativo ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white' : 'border-white/[0.14] bg-white/[0.03] text-white/70 hover:border-[#5a8bff]/70 hover:text-white'}`

const sinal = 'rlp-m rounded-full border border-[#5a8bff]/50 bg-[#2e6cf6]/[0.1] px-3 py-1 text-[9.5px] text-[#a9c1ff]'

// ─── componente ───────────────────────────────────────────────────────────────

export default function ProspeccaoPage() {
  const [sector, setSector]       = useState('')
  const [distritos, setDistritos] = useState<string[]>(['Lisboa', 'Setúbal', 'Évora'])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading]     = useState(false)
  const [erro, setErro]           = useState('')
  const [expandido, setExpandido] = useState<number | null>(null)
  const [salvando, setSalvando]   = useState<number | null>(null)
  const [salvos, setSalvos]       = useState<Set<number>>(new Set())

  const toggleDistrito = (d: string) =>
    setDistritos(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])

  const pesquisar = async () => {
    if (!sector) { setErro('Escolhe um setor.'); return }
    if (!distritos.length) { setErro('Escolhe pelo menos um distrito.'); return }

    setLoading(true)
    setErro('')
    setProspects([])
    setExpandido(null)
    setSalvos(new Set())

    const sectoreInfo = SECTORES.find(s => s.id === sector)

    try {
      const res = await fetch('/api/media-prospeccao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sector:    sectoreInfo?.label ?? sector,
          distritos,
          tipoQuery: sectoreInfo?.query ?? sector,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setProspects(data.prospects ?? [])
      if (!data.prospects?.length) setErro('Nenhuma empresa encontrada. Experimenta outro setor ou distrito.')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro na pesquisa.')
    }
    setLoading(false)
  }

  const salvarNoCRM = async (idx: number) => {
    const p = prospects[idx]
    setSalvando(idx)
    try {
      await fetch('/api/media-prospeccao/salvar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          empresa:           p.empresa,
          contacto:          p.contacto?.nome ?? '',
          email:             p.contacto?.email ?? '',
          sector:            p.sector,
          distrito:          p.distrito,
          website:           p.website,
          faturacaoEstimada: p.faturacaoEstimada,
          analise:           p.analise,
        }),
      })
      setSalvos(s => new Set([...s, idx]))
    } catch {}
    setSalvando(null)
  }

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <main className="rlp min-h-screen relative text-white">
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 pt-8 pb-20">
        <Link href="/media/crm" className="text-[12px] text-white/45 hover:text-white transition-colors">‹ CRM</Link>

        <p className="rlp-m traco mt-6 text-[11px] text-[#5a8bff]">Prospeção · Lista de empresas</p>
        <h1 className="rlp-t mt-3 text-[48px] sm:text-[68px] leading-[0.95]">Pesquisa por setor</h1>
        <p className="mt-4 max-w-2xl text-[15px] text-white/65 leading-relaxed">
          Lista empresas de um setor nos distritos que escolheres, com uma pontuação de potencial, contactos e redes sociais. Serve para montar listas de contactos a frio.
        </p>
        <Link href="/media/crm/agente"
          className="mt-5 inline-flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-[#2e6cf6]/40 bg-[#2e6cf6]/[0.08] px-4 py-3 text-[13.5px] text-white/80 hover:border-[#5a8bff] hover:text-white transition-colors">
          <span>Procuras empresas que estão ativamente à procura de fotografia ou vídeo?</span>
          <span className="text-[#5a8bff]">Usar o Agente IA →</span>
        </Link>

        {/* ── Pedido ─────────────────────────────────────────────────────── */}
        <section className="mt-10 rounded-2xl border border-white/[0.1] bg-[#00141f]/70 p-6">
          <p className="rlp-m text-[10px] text-white/50 mb-3">Setor</p>
          <div className="flex flex-wrap gap-2">
            {SECTORES.map(s => (
              <button key={s.id} onClick={() => setSector(s.id)} className={chip(sector === s.id)}>{s.label}</button>
            ))}
          </div>

          <p className="rlp-m text-[10px] text-white/50 mt-6 mb-3">Distritos</p>
          <div className="flex flex-wrap gap-2">
            {DISTRITOS.map(d => (
              <button key={d} onClick={() => toggleDistrito(d)} className={chip(distritos.includes(d))}>{d}</button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button onClick={pesquisar} disabled={loading || !sector}
              className="rlp-t rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-8 py-3.5 text-[19px] tracking-[0.05em] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ boxShadow: sector ? '0 10px 30px -10px rgba(46,108,246,0.7)' : 'none' }}>
              {loading ? 'A pesquisar…' : 'Pesquisar empresas →'}
            </button>
            <span className="text-[12.5px] text-white/45">
              {sector ? 'Demora 15 a 30 segundos.' : 'Escolhe primeiro um setor.'}
            </span>
          </div>
          {loading && (
            <div className="mt-5 flex items-center gap-3 text-[14px] text-[#a9c1ff]">
              <span className="w-2 h-2 rounded-full bg-[#5a8bff] animate-pulse" />A pesquisar e a analisar empresas…
            </div>
          )}
          {erro && <p className="mt-4 rounded-md border border-[#ff4747]/40 bg-[#ff4747]/[0.08] px-4 py-3 text-[14px] text-[#ff8a8a]">{erro}</p>}
        </section>

        {/* ── Resultados ─────────────────────────────────────────────────── */}
        {prospects.length > 0 && !loading && (
          <section className="mt-12">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">Resultado</p>
                <h2 className="rlp-t mt-2 text-[30px]">
                  {prospects.length} {prospects.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}
                </h2>
              </div>
              {salvos.size > 0 && (
                <Link href="/media/crm/leads" className="text-[12.5px] text-[#5a8bff] hover:text-white transition-colors">
                  {salvos.size} {salvos.size === 1 ? 'guardada' : 'guardadas'} no CRM · Ver →
                </Link>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {prospects.map((p, idx) => {
                const isOpen  = expandido === idx
                const isSalvo = salvos.has(idx)
                const cor     = corScore(p.score)
                const analise = p.analise?.trim()

                return (
                  <article key={idx} className={`rounded-2xl border bg-[#00141f]/75 overflow-hidden ${isSalvo ? 'border-[#5a8bff]/50' : 'border-white/[0.1]'}`}>
                    <button onClick={() => setExpandido(isOpen ? null : idx)} className="w-full text-left px-6 py-5 flex flex-wrap items-center gap-4">
                      <span className="w-14 text-center">
                        <span className="block rlp-t text-[34px] leading-none" style={{ color: cor }}>{p.score}</span>
                        <span className="block rlp-m text-[8.5px] text-white/40 mt-1">Score</span>
                      </span>
                      <span className="flex-1 min-w-[200px]">
                        <span className="block rlp-t text-[22px] leading-tight">{p.empresa || p.domain}</span>
                        <span className="block text-[12.5px] text-white/50">{p.sector} · {p.distrito}</span>
                      </span>
                      {isSalvo && <span className="rlp-m rounded-full border border-[#5a8bff]/60 px-3 py-1.5 text-[9.5px] text-[#a9c1ff]">No CRM</span>}
                      <span className="text-white/40 text-[12px]">{isOpen ? '▲' : '▼'}</span>
                    </button>
                    <div className="h-1 bg-white/[0.05]"><div className="h-full" style={{ width: `${Math.max(0, Math.min(100, p.score))}%`, background: cor }} /></div>

                    {/* Resumo sempre visível */}
                    <div className="px-6 pt-4 pb-5">
                      {p.descricao && <p className="text-[13.5px] text-white/65 leading-relaxed line-clamp-2">{p.descricao}</p>}

                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12.5px]">
                        {p.website && (
                          <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-[#5a8bff] hover:text-white transition-colors">{p.domain} ↗</a>
                        )}
                        {p.faturacaoEstimada && <span className="text-white/55">Faturação est.: {p.faturacaoEstimada}</span>}
                        {!!p.numFuncionarios && <span className="text-white/55">{p.numFuncionarios} funcionários</span>}
                        {p.contacto
                          ? <span className="text-white/75">{p.contacto.nome}{p.contacto.cargo && ` · ${p.contacto.cargo}`}</span>
                          : <span className="text-white/35">Sem contacto direto</span>}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12.5px]">
                        {p.instagramUrl
                          ? <a href={p.instagramUrl} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white">Instagram ↗</a>
                          : <span className="text-white/30">Sem Instagram</span>}
                        {p.facebookUrl && <a href={p.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white">Facebook ↗</a>}
                        {p.tiktokUrl && <a href={p.tiktokUrl} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white">TikTok ↗</a>}
                        {p.interesseVideo && <span className={sinal}>Interesse em vídeo</span>}
                        {p.isHiringMarketing && <span className={sinal}>A contratar marketing</span>}
                        {p.premios?.length > 0 && <span className={sinal}>Empresa premiada</span>}
                        {p.eventosRecentes?.length > 0 && <span className={sinal}>Evento recente</span>}
                        {!isSalvo && !isOpen && (
                          <button onClick={() => salvarNoCRM(idx)} disabled={salvando === idx}
                            className="ml-auto rounded-md border border-[#2e6cf6]/60 px-4 py-1.5 text-[12.5px] text-[#a9c1ff] hover:bg-[#2e6cf6] hover:text-white transition-colors disabled:opacity-60">
                            {salvando === idx ? 'A guardar…' : '+ CRM'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Detalhe */}
                    {isOpen && (
                      <div className="border-t border-white/[0.08] px-6 py-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                        <div className="space-y-5">
                          {analise && (
                            <div>
                              <p className="rlp-m text-[9.5px] text-[#5a8bff] mb-1.5">Análise</p>
                              <p className="text-[14px] text-white/80 leading-relaxed whitespace-pre-line">{analise}</p>
                            </div>
                          )}

                          {(p.premios?.length > 0 || p.eventosRecentes?.length > 0) && (
                            <div>
                              <p className="rlp-m text-[9.5px] text-[#5a8bff] mb-2">Sinais</p>
                              <ul className="space-y-1.5">
                                {p.premios?.map((pr, i) => <li key={`p${i}`} className="text-[13.5px] text-white/75 leading-snug">Prémio · {pr}</li>)}
                                {p.eventosRecentes?.map((ev, i) => <li key={`e${i}`} className="text-[13.5px] text-white/75 leading-snug">Evento · {ev}</li>)}
                              </ul>
                            </div>
                          )}

                          <div>
                            <p className="rlp-m text-[9.5px] text-[#5a8bff] mb-2">Contactos encontrados</p>
                            {p.todosContatos.length > 0 ? (
                              <div className="space-y-2">
                                {p.todosContatos.map((c, ci) => (
                                  <div key={ci} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-white/[0.1] bg-[#0c2236]/70 px-4 py-3">
                                    <div className="flex-1 min-w-[140px]">
                                      <p className="text-[14px] text-white/85">{c.nome || 'Sem nome'}</p>
                                      {c.cargo && <p className="text-[12px] text-white/50">{c.cargo}</p>}
                                    </div>
                                    <a href={`mailto:${c.email}`} className="text-[13px] text-[#5a8bff] hover:text-white transition-colors break-all">{c.email}</a>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[13.5px] text-white/55">
                                Nenhum email direto encontrado. Procura manualmente em{' '}
                                <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-[#5a8bff] hover:text-white">{p.domain}</a>.
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-xl border border-white/[0.1] bg-[#0c2236]/70 p-4 grid grid-cols-2 gap-4">
                            <div>
                              <p className="rlp-m text-[9.5px] text-white/45 mb-1">Distrito</p>
                              <p className="text-[13.5px] text-white/85">{p.distrito}</p>
                            </div>
                            <div>
                              <p className="rlp-m text-[9.5px] text-white/45 mb-1">Setor</p>
                              <p className="text-[13.5px] text-white/85">{p.sector}</p>
                            </div>
                            <div>
                              <p className="rlp-m text-[9.5px] text-white/45 mb-1">Faturação est.</p>
                              <p className="text-[13.5px] text-white/85">{p.faturacaoEstimada || 'Sem dados'}</p>
                            </div>
                            <div>
                              <p className="rlp-m text-[9.5px] text-white/45 mb-1">Funcionários</p>
                              <p className="text-[13.5px] text-white/85">{p.numFuncionarios ?? 'Sem dados'}</p>
                            </div>
                          </div>

                          {isSalvo ? (
                            <Link href="/media/crm/leads"
                              className="block w-full rounded-md border border-[#5a8bff]/60 px-5 py-3 text-center text-[14px] font-medium text-[#a9c1ff] hover:text-white transition-colors">
                              Guardada no CRM · Ver →
                            </Link>
                          ) : (
                            <button onClick={() => salvarNoCRM(idx)} disabled={salvando === idx}
                              className="w-full rounded-md bg-white px-5 py-3 text-[14px] font-medium text-[#00141f] hover:bg-white/90 transition-colors disabled:opacity-60 disabled:cursor-default">
                              {salvando === idx ? 'A guardar…' : '+ Guardar no CRM'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
