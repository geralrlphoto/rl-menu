'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { WhatsAppMembro } from './WhatsAppMembro'

type Tarefa = {
  id: string
  titulo: string
  descricao: string | null
  status: 'NOVA' | 'PENDENTE' | 'RESPONDIDA' | 'CONCLUIDA'
  data_prazo: string | null
  created_at: string
  _is_noivos_msg?: boolean
}

const VIOLETA = '#a78bfa'
const VERMELHO = '#f87171'
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function hojeISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date())
}
function diasAte(iso: string) {
  return Math.round((new Date(iso + 'T12:00:00Z').getTime() - new Date(hojeISO() + 'T12:00:00Z').getTime()) / 86400000)
}
function fmt(iso: string) {
  const d = new Date(iso + 'T12:00:00Z')
  return `${String(d.getUTCDate()).padStart(2, '0')} ${MESES[d.getUTCMonth()]}`
}

// Cartão Tarefas do /photo: número de tarefas por fazer, "+" abre uma gaveta
// à direita com a lista, onde também se criam tarefas e se dão por concluídas.
// Mesma fonte que /tarefas (inclui as mensagens dos noivos por responder).
export function TarefasCard() {
  const [tarefas, setTarefas] = useState<Tarefa[] | null>(null)
  const [aberto, setAberto] = useState(false)
  const [montado, setMontado] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [prazo, setPrazo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [comNotas, setComNotas] = useState(false)
  const [aGravar, setAGravar] = useState(false)
  const [aFechar, setAFechar] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMontado(true)
    fetch('/api/tarefas')
      .then(r => r.json())
      .then(d => setTarefas(Array.isArray(d?.tarefas) ? d.tarefas : []))
      .catch(() => setTarefas([]))
  }, [])

  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('keydown', onKey)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    setTimeout(() => inputRef.current?.focus(), 350)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = antes }
  }, [aberto])

  const abertas = (tarefas ?? []).filter(t => t.status !== 'CONCLUIDA')
  const atrasadas = abertas.filter(t => t.data_prazo && diasAte(t.data_prazo) < 0)
  // Atrasadas primeiro, depois por prazo mais próximo; sem prazo no fim
  const ordenadas = [...abertas].sort((a, b) => {
    if (!a.data_prazo && !b.data_prazo) return b.created_at.localeCompare(a.created_at)
    if (!a.data_prazo) return 1
    if (!b.data_prazo) return -1
    return a.data_prazo.localeCompare(b.data_prazo)
  })

  async function adicionar() {
    if (!titulo.trim() || aGravar) return
    setAGravar(true)
    try {
      const res = await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descricao: descricao || null, status: 'NOVA', data_prazo: prazo || null }),
      })
      const d = await res.json()
      if (d?.tarefa) {
        setTarefas(prev => [d.tarefa, ...(prev ?? [])])
        setTitulo(''); setPrazo(''); setDescricao(''); setComNotas(false)
        inputRef.current?.focus()
      } else {
        alert(d?.error ?? 'Não foi possível criar a tarefa')
      }
    } finally { setAGravar(false) }
  }

  async function concluir(t: Tarefa) {
    setAFechar(t.id)
    try {
      const res = await fetch(`/api/tarefas/${encodeURIComponent(t.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONCLUIDA' }),
      })
      if (res.ok) setTarefas(prev => (prev ?? []).map(x => x.id === t.id ? { ...x, status: 'CONCLUIDA' } : x))
    } finally { setAFechar(null) }
  }

  const n = abertas.length
  const temAtraso = atrasadas.length > 0

  return (
    <div className="relative">
      <Link href="/tarefas"
        className="group block h-full rounded-[22px] border border-white/[0.08] bg-[#141414]/90 backdrop-blur-md pl-5 pr-12 py-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.16]"
        style={{ borderLeft: `2px solid ${n > 0 ? VIOLETA : 'rgba(201,168,76,0.35)'}` }}>
        <div className="flex items-center gap-3.5">
          <span className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-cond font-semibold text-lg"
            style={{ color: n > 0 ? VIOLETA : 'rgba(201,168,76,0.75)', background: n > 0 ? `${VIOLETA}1f` : 'rgba(201,168,76,0.08)' }}>
            {tarefas === null ? '·' : n}
          </span>
          <span className="font-cond font-medium text-white text-[21px] leading-tight">Tarefas</span>
        </div>
        <p className="font-cond text-[14px] text-white/50 leading-snug mt-3 pl-[54px]">{tarefas === null ? 'A carregar…' : n === 0 ? 'Tudo feito' : 'Por fazer'}</p>
        {temAtraso && (
          <p className="font-cond text-[13px] font-medium mt-1.5 pl-[54px]" style={{ color: VERMELHO }}>
            {atrasadas.length} com prazo passado
          </p>
        )}
      </Link>

      {/* + fora do Link: abre a gaveta com a lista e o formulário */}
      <div className="absolute top-4 right-4">
        <button onClick={() => setAberto(true)} title="Ver e adicionar tarefas" aria-label="Ver e adicionar tarefas"
          className="w-8 h-8 rounded-full border flex items-center justify-center text-lg leading-none transition-all hover:text-black hover:scale-105"
          style={{ borderColor: `${VIOLETA}66`, color: VIOLETA }}
          onMouseEnter={e => { e.currentTarget.style.background = VIOLETA }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
          +
        </button>
      </div>

      {montado && createPortal(
        <>
          <div onClick={() => setAberto(false)}
            className="fixed inset-0 z-[90] transition-opacity duration-300"
            style={{ background: 'rgba(5,4,3,0.6)', backdropFilter: 'blur(3px)', opacity: aberto ? 1 : 0, pointerEvents: aberto ? 'auto' : 'none' }} />

          <aside className="fixed top-0 right-0 z-[91] h-[100dvh] flex flex-col"
            style={{
              width: 'min(460px, 100vw)',
              background: '#0b0b0b',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              boxShadow: aberto ? '-30px 0 80px -20px rgba(0,0,0,0.75)' : 'none',
              transform: aberto ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform .42s cubic-bezier(.2,.7,.2,1)',
            }}
            aria-hidden={!aberto}>

            {/* Cabeçalho */}
            <div className="relative px-6 pt-7 pb-5 border-b border-white/[0.08] overflow-hidden">
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(90% 120% at 0% 0%, rgba(201,168,76,0.10), transparent 60%)' }} />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Prioridade</p>
                  <h2 className="font-cond font-bold text-[40px] leading-none text-white mt-2">Tarefas</h2>
                  <div className="flex flex-wrap gap-2 mt-4 font-cond text-[13px]">
                    <span className="rounded-full px-3 py-1" style={{ color: VIOLETA, background: `${VIOLETA}1a` }}>{n} por fazer</span>
                    {temAtraso && <span className="rounded-full px-3 py-1" style={{ color: VERMELHO, background: `${VERMELHO}1a` }}>{atrasadas.length} com prazo passado</span>}
                  </div>
                </div>
                <button onClick={() => setAberto(false)} aria-label="Fechar"
                  className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:border-white/30 hover:rotate-90 transition-all duration-300 flex items-center justify-center">
                  ✕
                </button>
              </div>

              {/* Nova tarefa */}
              <form onSubmit={e => { e.preventDefault(); adicionar() }}
                className="relative mt-5 rounded-[18px] border border-white/[0.08] bg-[#141414] p-4 flex flex-col gap-3"
                style={{ borderLeft: `2px solid ${VIOLETA}` }}>
                <input ref={inputRef} value={titulo} onChange={e => setTitulo(e.target.value)}
                  placeholder="Nova tarefa…"
                  className="w-full bg-transparent font-cond text-[17px] text-white placeholder-white/30 focus:outline-none" />
                {comNotas && (
                  <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2}
                    placeholder="Notas (opcional)"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1.5 text-[12px] text-white/80 placeholder-white/25 focus:outline-none focus:border-white/25 resize-none" />
                )}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 font-cond text-[12px] text-white/45">
                    Prazo
                    <input type="date" value={prazo} onChange={e => setPrazo(e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-full px-3 py-1 text-[11px] text-white/75 focus:outline-none [color-scheme:dark]" />
                  </label>
                  {!comNotas && (
                    <button type="button" onClick={() => setComNotas(true)}
                      className="font-cond text-[12px] text-white/40 hover:text-white/75 transition-colors">
                      + notas
                    </button>
                  )}
                  <button type="submit" disabled={!titulo.trim() || aGravar}
                    className="ml-auto px-5 py-2 rounded-full font-cond text-[14px] font-medium text-black transition-all hover:brightness-110 disabled:opacity-35"
                    style={{ background: VIOLETA }}>
                    {aGravar ? 'A gravar…' : 'Adicionar'}
                  </button>
                </div>
              </form>
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
              {tarefas === null && <p className="text-center font-cond text-[16px] text-white/35 py-16">A carregar…</p>}
              {tarefas !== null && ordenadas.length === 0 && (
                <p className="text-center font-cond text-[16px] text-white/35 py-16">Nada por fazer</p>
              )}
              {ordenadas.map(t => {
                const d = t.data_prazo ? diasAte(t.data_prazo) : null
                const corPrazo = d === null ? 'rgba(255,255,255,0.3)' : d < 0 ? VERMELHO : d <= 2 ? '#fb923c' : 'rgba(255,255,255,0.45)'
                return (
                  <div key={t.id} className="group relative flex items-center gap-3.5 rounded-[20px] border border-white/[0.08] bg-[#141414] pl-4 pr-4 py-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.18]"
                    style={{ borderLeft: `2px solid ${d !== null && d < 0 ? VERMELHO : VIOLETA}` }}>
                    {/* Concluir — só tarefas normais; as mensagens dos noivos respondem-se em /tarefas */}
                    {t._is_noivos_msg ? (
                      <span className="w-9 h-9 rounded-full bg-white/[0.05] flex items-center justify-center text-[13px] text-white/50 shrink-0" title="Mensagem dos noivos">💬</span>
                    ) : (
                      <button onClick={() => concluir(t)} disabled={aFechar === t.id}
                        title="Marcar como concluída"
                        className="w-9 h-9 rounded-full border shrink-0 flex items-center justify-center text-[13px] transition-all hover:scale-110 disabled:opacity-40"
                        style={{ borderColor: `${VIOLETA}66`, color: VIOLETA, background: `${VIOLETA}14` }}
                        onMouseEnter={e => { e.currentTarget.style.background = VIOLETA; e.currentTarget.style.color = '#000' }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${VIOLETA}14`; e.currentTarget.style.color = VIOLETA }}>
                        {aFechar === t.id ? '…' : '✓'}
                      </button>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-cond text-[17px] text-white leading-snug">{t.titulo}</p>
                      {t.descricao && !t._is_noivos_msg && (
                        <p className="font-cond text-[13px] text-white/40 mt-1 line-clamp-2 whitespace-pre-line">{t.descricao}</p>
                      )}
                    </div>
                    {!t._is_noivos_msg && (
                      <WhatsAppMembro titulo="Tarefa"
                        mensagem={`Olá boas tudo bem?\n\nOlha, tenho esta tarefa para ti: ${t.titulo}${t.descricao ? `\n${t.descricao}` : ''}${t.data_prazo ? `\nPrazo: ${fmt(t.data_prazo)}` : ''}\n\nObrigado.`} />
                    )}
                    <div className="text-right shrink-0">
                      {t.data_prazo ? (
                        <>
                          <p className="font-cond text-[14px] font-medium" style={{ color: corPrazo }}>{fmt(t.data_prazo)}</p>
                          <p className="font-cond text-[11px] mt-0.5" style={{ color: corPrazo }}>
                            {d! < 0 ? `${Math.abs(d!)}d atraso` : d === 0 ? 'hoje' : `${d}d`}
                          </p>
                        </>
                      ) : (
                        <p className="font-cond text-[12px] text-white/30">sem prazo</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-6 py-4 border-t border-white/[0.08]">
              <Link href="/tarefas" onClick={() => setAberto(false)}
                className="font-cond text-[14px] text-white/50 hover:text-[#C9A84C] transition-colors">
                Abrir página das tarefas →
              </Link>
            </div>
          </aside>
        </>,
        document.body
      )}
    </div>
  )
}
