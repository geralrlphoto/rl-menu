'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── tipos ────────────────────────────────────────────────────────────────────

type Contacto = { nome: string; email: string; cargo: string }

type Prospect = {
  empresa: string; website: string; domain: string
  descricao: string; distrito: string; sector: string
  faturacaoEstimada: string
  contacto: Contacto | null
  todosContatos: Contacto[]
  analise: string
  instagramUrl: string | null
  interesseVideo: boolean
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
  const [progresso, setProgresso] = useState('')

  const toggleDistrito = (d: string) =>
    setDistritos(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])

  const pesquisar = async () => {
    if (!sector) { setErro('Seleciona um sector'); return }
    if (!distritos.length) { setErro('Seleciona pelo menos um distrito'); return }

    setLoading(true)
    setErro('')
    setProspects([])
    setExpandido(null)
    setSalvos(new Set())

    const sectoreInfo = SECTORES.find(s => s.id === sector)

    setProgresso('🔍 A pesquisar empresas...')
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
      setProgresso('')
      setProspects(data.prospects ?? [])
      if (!data.prospects?.length) setErro('Nenhuma empresa encontrada. Tenta outro sector ou distrito.')
    } catch (e: any) {
      setErro(e.message ?? 'Erro na pesquisa')
      setProgresso('')
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
    <main className="min-h-screen bg-[#09090b] text-white">
      {/* Grid */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: 'linear-gradient(rgba(120,80,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(120,80,255,0.03) 1px,transparent 1px)',
        backgroundSize: '56px 56px',
      }} />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-10 py-10">

        {/* Cabeçalho */}
        <div className="mb-10">
          <Link href="/media/crm" className="inline-flex items-center gap-2 text-[9px] tracking-[0.45em]
            text-white/20 hover:text-white/50 uppercase transition-colors mb-8 group">
            <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
            CRM RL Media
          </Link>
          <p className="text-[8px] tracking-[0.6em] text-violet-400/50 uppercase mb-1">RL Media · Agente IA</p>
          <h1 className="text-3xl font-extralight tracking-[0.35em] text-white/85 uppercase">Prospeção</h1>
          <p className="text-[12px] font-light text-white/25 mt-2">
            Encontra automaticamente empresas com potencial para investir em fotografia e vídeo.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-px w-10 bg-violet-400/40" />
            <div className="h-px flex-1 bg-white/[0.04]" />
          </div>
        </div>

        {/* Formulário de pesquisa */}
        <div className="border border-white/[0.08] bg-white/[0.02] px-6 py-7 mb-10">
          <p className="text-[9px] tracking-[0.5em] text-white/25 uppercase mb-6">Configurar Pesquisa</p>

          {/* Sector */}
          <div className="mb-6">
            <p className="text-[9px] tracking-[0.4em] text-white/30 uppercase mb-3">Sector de Actividade</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {SECTORES.map(s => (
                <button key={s.id} onClick={() => setSector(s.id)}
                  className={`px-3 py-2.5 text-left text-[11px] font-light border transition-all ${
                    sector === s.id
                      ? 'border-violet-400/50 bg-violet-400/[0.08] text-violet-300'
                      : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:border-white/15 hover:text-white/60'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Distritos */}
          <div className="mb-8">
            <p className="text-[9px] tracking-[0.4em] text-white/30 uppercase mb-3">Distritos</p>
            <div className="flex gap-3 flex-wrap">
              {DISTRITOS.map(d => (
                <button key={d} onClick={() => toggleDistrito(d)}
                  className={`px-5 py-2 text-[11px] border transition-all ${
                    distritos.includes(d)
                      ? 'border-violet-400/50 bg-violet-400/[0.08] text-violet-300'
                      : 'border-white/[0.06] bg-white/[0.02] text-white/40 hover:border-white/15 hover:text-white/60'
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {erro && <p className="text-[11px] text-red-400/70 mb-4">⚠ {erro}</p>}

          <button onClick={pesquisar} disabled={loading || !sector}
            className="border border-violet-400/40 bg-violet-400/[0.07] hover:bg-violet-400/[0.15]
                       px-10 py-3.5 text-[9px] tracking-[0.5em] text-violet-300 uppercase
                       transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ boxShadow: sector ? '0 0 20px rgba(139,92,246,0.1)' : 'none' }}>
            {loading ? '⏳ A pesquisar...' : '◈ Iniciar Prospeção'}
          </button>
        </div>

        {/* Progresso */}
        {loading && progresso && (
          <div className="border border-violet-400/15 bg-violet-400/[0.03] px-6 py-4 mb-6">
            <p className="text-[12px] font-light text-violet-300/70 animate-pulse">{progresso}</p>
            <p className="text-[10px] text-white/20 mt-1">A analisar empresas com IA — pode demorar 15-30 segundos...</p>
          </div>
        )}

        {/* Resultados */}
        {prospects.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-[9px] tracking-[0.45em] text-white/30 uppercase">
                {prospects.length} empresa{prospects.length !== 1 ? 's' : ''} encontrada{prospects.length !== 1 ? 's' : ''}
              </p>
              <p className="text-[10px] text-white/20">
                {salvos.size > 0 && `${salvos.size} guardada${salvos.size !== 1 ? 's' : ''} no CRM`}
              </p>
            </div>

            <div className="space-y-4">
              {prospects.map((p, idx) => {
                const isOpen  = expandido === idx
                const isSalvo = salvos.has(idx)

                return (
                  <div key={idx} className={`border overflow-hidden transition-all ${
                    isSalvo ? 'border-emerald-400/20 bg-emerald-400/[0.01]' : 'border-white/[0.07] bg-white/[0.015]'
                  }`}>

                    {/* Linha principal */}
                    <div className="px-6 py-5 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <p className="text-[15px] font-light text-white/80">{p.empresa || p.domain}</p>
                          <span className="text-[9px] px-2 py-0.5 border border-violet-400/25 text-violet-400/60 bg-violet-400/[0.05]">
                            {p.sector}
                          </span>
                          <span className="text-[9px] px-2 py-0.5 border border-white/10 text-white/30">
                            📍 {p.distrito}
                          </span>
                        </div>

                        <p className="text-[11px] text-white/30 mb-3 line-clamp-2">{p.descricao}</p>

                        <div className="flex items-center gap-5 flex-wrap">
                          {/* Website */}
                          <a href={p.website} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-violet-400/50 hover:text-violet-400/80 transition-colors">
                            🌐 {p.domain}
                          </a>
                          {/* Faturação */}
                          <span className="text-[10px] text-amber-400/50">
                            💰 {p.faturacaoEstimada}
                          </span>
                          {/* Contacto */}
                          {p.contacto ? (
                            <span className="text-[10px] text-emerald-400/60">
                              ✉ {p.contacto.nome} · {p.contacto.cargo}
                            </span>
                          ) : (
                            <span className="text-[10px] text-white/20">✉ Sem contacto direto encontrado</span>
                          )}
                          {/* Instagram */}
                          {p.instagramUrl ? (
                            <a href={p.instagramUrl} target="_blank" rel="noopener noreferrer"
                              className="text-[10px] text-pink-400/70 hover:text-pink-400 transition-colors">
                              📸 Instagram ↗
                            </a>
                          ) : (
                            <span className="text-[10px] text-white/15">📸 Sem Instagram</span>
                          )}
                          {/* Interesse em vídeo */}
                          {p.interesseVideo && (
                            <span className="text-[10px] text-cyan-400/70 border border-cyan-400/25 px-2 py-0.5">
                              🎬 Interesse em vídeo/foto
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Acções */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {isSalvo ? (
                          <span className="text-[9px] tracking-[0.3em] text-emerald-400/70 uppercase">✓ No CRM</span>
                        ) : (
                          <button onClick={() => salvarNoCRM(idx)} disabled={salvando === idx}
                            className="border border-emerald-400/30 bg-emerald-400/[0.05] hover:bg-emerald-400/[0.12]
                                       px-4 py-2 text-[9px] tracking-[0.35em] text-emerald-400/70
                                       hover:text-emerald-400 uppercase transition-all disabled:opacity-40">
                            {salvando === idx ? '...' : '+ CRM'}
                          </button>
                        )}
                        <button onClick={() => setExpandido(isOpen ? null : idx)}
                          className="text-[10px] text-white/20 hover:text-white/50 transition-colors">
                          {isOpen ? '▲ Fechar' : '▼ Ver relatório'}
                        </button>
                      </div>
                    </div>

                    {/* Detalhe expandido */}
                    {isOpen && (
                      <div className="border-t border-white/[0.05] px-6 py-6 bg-white/[0.01] space-y-6">

                        {/* Relatório IA */}
                        {p.analise && (
                          <div>
                            <p className="text-[9px] tracking-[0.45em] text-violet-400/50 uppercase mb-3">
                              ◈ Análise RL Media
                            </p>
                            <div className="border border-violet-400/10 bg-violet-400/[0.03] px-5 py-5">
                              <p className="text-[12px] font-light text-white/55 leading-relaxed whitespace-pre-line">
                                {p.analise}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Contactos */}
                        {p.todosContatos.length > 0 && (
                          <div>
                            <p className="text-[9px] tracking-[0.45em] text-white/25 uppercase mb-3">
                              Contactos Encontrados
                            </p>
                            <div className="space-y-2">
                              {p.todosContatos.map((c, ci) => (
                                <div key={ci} className="flex items-center gap-4 border border-white/[0.05] px-4 py-3">
                                  <div className="flex-1">
                                    <p className="text-[12px] font-light text-white/65">{c.nome || '—'}</p>
                                    <p className="text-[10px] text-white/30">{c.cargo}</p>
                                  </div>
                                  <a href={`mailto:${c.email}`}
                                    className="text-[11px] text-violet-400/60 hover:text-violet-400 transition-colors font-mono">
                                    {c.email}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {p.todosContatos.length === 0 && (
                          <div className="border border-white/[0.05] px-5 py-4">
                            <p className="text-[11px] text-white/20">
                              Nenhum email direto encontrado via Hunter.io.
                              Pesquisa manualmente em <a href={p.website} target="_blank"
                                className="text-violet-400/50 hover:text-violet-400">{p.domain}</a>
                            </p>
                          </div>
                        )}

                        {/* Acção CRM */}
                        <div className="flex items-center justify-between pt-2">
                          <p className="text-[10px] text-white/20">
                            Distrito: {p.distrito} · Sector: {p.sector} · Faturação est.: {p.faturacaoEstimada}
                          </p>
                          {!isSalvo && (
                            <button onClick={() => salvarNoCRM(idx)} disabled={salvando === idx}
                              className="border border-emerald-400/30 bg-emerald-400/[0.05] hover:bg-emerald-400/[0.12]
                                         px-6 py-2.5 text-[9px] tracking-[0.4em] text-emerald-400/70
                                         hover:text-emerald-400 uppercase transition-all">
                              {salvando === idx ? '⏳ A guardar...' : '+ Guardar no CRM'}
                            </button>
                          )}
                          {isSalvo && (
                            <Link href="/media/crm/leads"
                              className="text-[10px] text-emerald-400/60 hover:text-emerald-400 transition-colors">
                              Ver no CRM →
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

      </div>
    </main>
  )
}
