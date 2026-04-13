'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type NovoFreelancer = {
  id: string
  nome: string
  funcao: string | null
  tipo_eventos: string[]
  zona: string | null
  telefone: string | null
  valor_servico: string | null
  valor_drone: string | null
  valor_edicao: string | null
  servicos_feitos: number | null
  drone: string | null
  faz_edicao: string | null
  link_trailer: string | null
  link_video: string | null
  avaliacao: string[]
  mensagem: string | null
}

const FUNCAO_STYLE: Record<string, string> = {
  FOTOGRAFO:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  VIDEOGRAFO: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  ASSISTENTE: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
  EDITORES:   'bg-orange-500/15 text-orange-400 border-orange-500/30',
}

function funcaoStyle(f: string | null) {
  return FUNCAO_STYLE[f ?? ''] ?? 'bg-white/10 text-white/50 border-white/20'
}

function AvaliacaoStars({ avaliacao }: { avaliacao: string[] }) {
  const val = parseInt(avaliacao[0] ?? '0')
  if (!val) return <span className="text-white/20 text-xs">—</span>
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" fill={i < val ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"
          className={`w-3 h-3 ${i < val ? 'text-gold' : 'text-white/15'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
      <span className="text-white/40 text-[10px] ml-1">{val}/5</span>
    </div>
  )
}

export default function NovosFreelancersPage() {
  const [list, setList] = useState<NovoFreelancer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterFuncao, setFilterFuncao] = useState('Todos')
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/freelancers-novos')
      .then(r => r.json())
      .then(d => { setList(d.rows ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const funcoes = ['Todos', ...Array.from(new Set(list.map(f => f.funcao).filter(Boolean) as string[]))]

  const filtered = list.filter(f => {
    const matchSearch = !search ||
      f.nome?.toLowerCase().includes(search.toLowerCase()) ||
      f.zona?.toLowerCase().includes(search.toLowerCase()) ||
      f.mensagem?.toLowerCase().includes(search.toLowerCase())
    const matchFuncao = filterFuncao === 'Todos' || f.funcao === filterFuncao
    return matchSearch && matchFuncao
  })

  return (
    <main className="min-h-screen px-4 sm:px-8 py-8 max-w-[960px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/freelancers" className="text-[10px] tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors">
            ← Equipas de Trabalho
          </Link>
          <h1 className="text-xl font-bold tracking-widest text-gold uppercase mt-1">Novos Freelancers</h1>
          <div className="mt-2 h-px w-12 bg-gold/40" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gold">{list.length}</p>
          <p className="text-[10px] text-white/30 tracking-widest uppercase">Candidatos</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar nome, zona, mensagem..."
          className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"
        />
        <div className="flex gap-2 flex-wrap">
          {funcoes.map(f => (
            <button key={f} onClick={() => setFilterFuncao(f)}
              className={`px-3 py-2 rounded-xl text-[10px] font-semibold tracking-widest uppercase border transition-all ${
                filterFuncao === f
                  ? 'bg-gold/15 border-gold/40 text-gold'
                  : 'bg-white/[0.02] border-white/10 text-white/30 hover:text-white/60'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-24 text-white/20 text-xs tracking-widest uppercase">A carregar...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-white/20 text-xs tracking-widest uppercase">Sem resultados</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(f => (
            <div key={f.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/10 transition-all">

              {/* Linha principal */}
              <button onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                className="w-full text-left px-5 py-4 flex items-center gap-4">

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white/40">
                    {(f.nome || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                </div>

                {/* Nome + função */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white/80 tracking-wide">{f.nome || '—'}</span>
                    {f.funcao && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold tracking-widest uppercase ${funcaoStyle(f.funcao)}`}>
                        {f.funcao}
                      </span>
                    )}
                    {f.tipo_eventos?.map(t => (
                      <span key={t} className="text-[9px] px-2 py-0.5 rounded-full border border-white/10 text-white/30 tracking-wider uppercase">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {f.zona && <span className="text-[10px] text-white/30">📍 {f.zona}</span>}
                    {f.valor_servico && <span className="text-[10px] text-white/30">💶 {f.valor_servico}</span>}
                    {f.telefone && <span className="text-[10px] text-white/30">📞 {f.telefone}</span>}
                  </div>
                </div>

                {/* Avaliação + chevron */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <AvaliacaoStars avaliacao={f.avaliacao} />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`w-4 h-4 text-white/20 transition-transform ${expanded === f.id ? 'rotate-180' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </button>

              {/* Detalhes expandidos */}
              {expanded === f.id && (
                <div className="px-5 pb-5 border-t border-white/[0.05] pt-4 space-y-4">

                  {/* Valores */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      ['Valor por Serviço', f.valor_servico],
                      ['Valor Drone',       f.valor_drone],
                      ['Valor Edição 20m',  f.valor_edicao],
                      ['Serviços Feitos',   f.servicos_feitos != null ? String(f.servicos_feitos) : null],
                    ].map(([label, val]) => val ? (
                      <div key={label as string} className="bg-white/[0.03] rounded-xl p-3">
                        <p className="text-[9px] text-white/30 tracking-widest uppercase mb-1">{label as string}</p>
                        <p className="text-sm font-semibold text-white/70">{val as string}</p>
                      </div>
                    ) : null)}
                  </div>

                  {/* Flags */}
                  <div className="flex gap-2 flex-wrap">
                    {f.drone && (
                      <span className="text-[10px] px-3 py-1 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">
                        🚁 Drone: {f.drone}
                      </span>
                    )}
                    {f.faz_edicao && (
                      <span className="text-[10px] px-3 py-1 rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400">
                        ✂️ Edição Vídeo: {f.faz_edicao}
                      </span>
                    )}
                  </div>

                  {/* Links */}
                  <div className="flex gap-2 flex-wrap">
                    {f.link_trailer && (
                      <a href={f.link_trailer} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] px-3 py-1.5 rounded-lg border border-gold/20 bg-gold/5 text-gold hover:bg-gold/10 transition-all tracking-wider">
                        ▶ Ver Trailer
                      </a>
                    )}
                    {f.link_video && (
                      <a href={f.link_video} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-white/50 hover:text-white/70 transition-all tracking-wider">
                        🎬 Vídeo Completo
                      </a>
                    )}
                    {f.telefone && (
                      <a href={`tel:${f.telefone}`}
                        className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-white/50 hover:text-white/70 transition-all tracking-wider">
                        📞 {f.telefone}
                      </a>
                    )}
                  </div>

                  {/* Mensagem */}
                  {f.mensagem && (
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                      <p className="text-[9px] text-white/30 tracking-widest uppercase mb-2">Mensagem</p>
                      <p className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap">{f.mensagem}</p>
                    </div>
                  )}

                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
