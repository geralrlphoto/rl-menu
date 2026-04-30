'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

type Pedido = {
  id: string
  tipo_pedido: string | null
  data_casamento: string | null
  nome_noivos: string | null
  nome_convidado: string | null
  contato: string | null
  email: string | null
  morada: string | null
  tipo_entrega: string | null
  numero_fotografias: string | null
  mensagem: string | null
  status: string
  created_at: string
}

const STATUS_LIST = ['NOVO', 'EM ANÁLISE', 'RESPONDIDO', 'ENTREGUE']

const STATUS_STYLE: Record<string, { dot: string; badge: string; border: string }> = {
  'NOVO':        { dot: 'bg-blue-400',    badge: 'text-blue-400 bg-blue-400/10 border-blue-400/20',    border: 'border-l-blue-400/60'    },
  'EM ANÁLISE':  { dot: 'bg-amber-400',   badge: 'text-amber-400 bg-amber-400/10 border-amber-400/20',   border: 'border-l-amber-400/60'   },
  'RESPONDIDO':  { dot: 'bg-purple-400',  badge: 'text-purple-400 bg-purple-400/10 border-purple-400/20', border: 'border-l-purple-400/60'  },
  'ENTREGUE':    { dot: 'bg-emerald-400', badge: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', border: 'border-l-emerald-400/60' },
}

function diasPrazo(pedido: Pedido): { dias: number; label: string } | null {
  if (!pedido.created_at) return null
  const isDigital = (pedido.tipo_entrega ?? '').toLowerCase().includes('digital')
  const prazoUteis = isDigital ? 15 : 30
  const criado = new Date(pedido.created_at)
  // Aproximação: dias úteis ≈ dias * 5/7
  const prazoMs = prazoUteis * (7 / 5) * 86400000
  const prazoDate = new Date(criado.getTime() + prazoMs)
  const today = new Date()
  const diff = Math.round((prazoDate.getTime() - today.getTime()) / 86400000)
  return { dias: diff, label: isDigital ? '15 dias úteis' : '30 dias úteis' }
}

function fmt(d: string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const FILTROS = ['TODOS', 'NOVO', 'EM ANÁLISE', 'RESPONDIDO', 'ENTREGUE']

export default function FotosConvidadosPage() {
  const [pedidos,  setPedidos]  = useState<Pedido[]>([])
  const [loading,  setLoading]  = useState(true)
  const [filtro,   setFiltro]   = useState('TODOS')
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res  = await fetch('/api/fotos-convidados')
    const data = await res.json()
    setPedidos(data.pedidos ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function cycleStatus(pedido: Pedido) {
    const idx    = STATUS_LIST.indexOf(pedido.status)
    const next   = STATUS_LIST[(idx + 1) % STATUS_LIST.length]
    setPedidos(prev => prev.map(p => p.id === pedido.id ? { ...p, status: next } : p))
    await fetch('/api/fotos-convidados', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: pedido.id, status: next }),
    })
  }

  const filtrados = pedidos.filter(p => filtro === 'TODOS' || p.status === filtro)
  const counts    = FILTROS.reduce((acc, f) => {
    acc[f] = f === 'TODOS' ? pedidos.length : pedidos.filter(p => p.status === f).length
    return acc
  }, {} as Record<string, number>)

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-12 max-w-4xl mx-auto">

      {/* Voltar */}
      <Link href="/photo"
        className="inline-flex items-center gap-2 text-[10px] tracking-[0.35em] text-white/30 hover:text-[#C9A84C] transition-colors mb-12 uppercase">
        ‹ Menu
      </Link>

      {/* Header */}
      <header className="mb-10">
        <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">Menu Clientes</p>
        <h1 className="text-3xl font-extralight tracking-[0.2em] text-[#C9A84C] uppercase">
          Fotografias Convidados
        </h1>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px w-12 bg-[#C9A84C]/50" />
          <div className="h-px flex-1 bg-white/[0.04]" />
        </div>
      </header>

      {/* Callout */}
      <div className="mb-8 border-l-2 border-l-[#C9A84C]/40 border border-white/[0.06] bg-white/[0.02] px-5 py-4">
        <p className="text-[10px] tracking-[0.1em] text-white/50 leading-relaxed">
          💡 Caso algum convidado solicite informações sobre as suas fotografias, é dado o formulário <span className="text-white/70">«Fotografias Convidados»</span>.
        </p>
      </div>

      {/* Regras */}
      <div className="mb-8 border border-white/[0.06] bg-white/[0.015] px-5 py-5 flex flex-col gap-3">
        <p className="text-[9px] tracking-[0.45em] text-white/25 uppercase mb-1">Regras de Resposta</p>
        {[
          'Os convidados têm de responder ao respectivo formulário',
          'Só respondemos caso o prazo estimado de entrega já tenha sido ultrapassado',
          '📱 Formato digital — 15 dias úteis',
          '🖨️ Formato papel — 30 dias úteis',
        ].map((r, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-[#C9A84C]/40 text-[10px] font-mono mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
            <p className="text-[10px] text-white/45 leading-relaxed">{r}</p>
          </div>
        ))}
      </div>

      {/* Botão Tally */}
      <div className="mb-10">
        <a
          href="https://tally.so/r/w56N86"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-6 py-3 border border-[#C9A84C]/40 text-[#C9A84C]/80 hover:text-[#C9A84C] hover:border-[#C9A84C]/70 transition-all duration-300 text-[10px] tracking-[0.35em] uppercase"
        >
          Abrir Formulário Convidados
          <span className="text-xs">↗</span>
        </a>
      </div>

      {/* Separador */}
      <div className="flex items-center gap-3 mb-6">
        <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase shrink-0">Pedidos Recebidos</p>
        <div className="h-px flex-1 bg-white/[0.04]" />
        <span className="text-[9px] text-white/20">{pedidos.length}</span>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTROS.map(f => {
          const s = STATUS_STYLE[f]
          const active = filtro === f
          return (
            <button key={f} onClick={() => setFiltro(f)}
              className={`flex items-center gap-2 px-3 py-1.5 text-[9px] tracking-[0.3em] uppercase border transition-all duration-200 rounded-sm
                ${active ? 'bg-white/[0.06] border-white/20 text-white/70' : 'border-white/[0.06] text-white/25 hover:text-white/50'}`}>
              {s && <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />}
              {f} <span className="text-white/30">({counts[f]})</span>
            </button>
          )
        })}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16 text-white/20 text-[10px] tracking-[0.5em] uppercase animate-pulse">
          A carregar...
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-white/15 text-[10px] tracking-[0.5em] uppercase">
          Sem pedidos
        </div>
      ) : (
        <div className="flex flex-col gap-px bg-white/[0.04]">
          {filtrados.map(pedido => {
            const st    = STATUS_STYLE[pedido.status] ?? STATUS_STYLE['NOVO']
            const prazo = diasPrazo(pedido)
            const isOpen = expanded === pedido.id

            return (
              <div key={pedido.id}
                className={`border-l-2 border border-white/[0.06] bg-white/[0.015] transition-colors ${st.border}`}>

                {/* Linha principal */}
                <button className="w-full flex items-center gap-4 px-5 py-4 text-left"
                  onClick={() => setExpanded(isOpen ? null : pedido.id)}>

                  {/* Status badge clicável */}
                  <span
                    onClick={e => { e.stopPropagation(); cycleStatus(pedido) }}
                    className={`shrink-0 px-2 py-0.5 text-[8px] tracking-[0.3em] uppercase border rounded-sm cursor-pointer transition-all hover:opacity-70 ${st.badge}`}>
                    {pedido.status}
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/70 font-medium truncate">
                      {pedido.nome_convidado ?? '—'}
                    </p>
                    <p className="text-[9px] text-white/30 truncate mt-0.5">
                      {pedido.nome_noivos ?? '—'} · {pedido.data_casamento ?? '—'} · {pedido.tipo_entrega ?? '—'}
                    </p>
                  </div>

                  {/* Prazo */}
                  {prazo && pedido.status !== 'ENTREGUE' && (
                    <span className={`shrink-0 text-[9px] tabular-nums ${
                      prazo.dias < 0 ? 'text-red-400' : prazo.dias <= 3 ? 'text-amber-400' : 'text-white/20'
                    }`}>
                      {prazo.dias < 0 ? `${Math.abs(prazo.dias)}d atraso` : `${prazo.dias}d`}
                    </span>
                  )}

                  <span className={`text-white/20 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    ↓
                  </span>
                </button>

                {/* Detalhe expandido */}
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-white/[0.04] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { l: 'Tipo de Pedido',      v: pedido.tipo_pedido },
                      { l: 'Data do Casamento',   v: pedido.data_casamento },
                      { l: 'Noivos',              v: pedido.nome_noivos },
                      { l: 'Convidado',           v: pedido.nome_convidado },
                      { l: 'Contato',             v: pedido.contato },
                      { l: 'Email',               v: pedido.email },
                      { l: 'Morada',              v: pedido.morada },
                      { l: 'Tipo de Entrega',     v: pedido.tipo_entrega },
                      { l: 'Nº Fotografias',      v: pedido.numero_fotografias },
                      { l: 'Pedido em',           v: fmt(pedido.created_at) },
                    ].map(({ l, v }) => v ? (
                      <div key={l}>
                        <p className="text-[8px] tracking-[0.4em] text-white/20 uppercase mb-0.5">{l}</p>
                        <p className="text-[11px] text-white/60">{v}</p>
                      </div>
                    ) : null)}
                    {pedido.mensagem && (
                      <div className="sm:col-span-2">
                        <p className="text-[8px] tracking-[0.4em] text-white/20 uppercase mb-0.5">Mensagem</p>
                        <p className="text-[11px] text-white/50 leading-relaxed">{pedido.mensagem}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
