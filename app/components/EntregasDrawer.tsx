'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

export type EntregaAtraso = {
  tipo: string          // "Galeria Online", "Seleção de fotos", "Vídeo"…
  nome: string          // noivos
  ref: string
  dias: number          // atraso: dias de atraso · aviso: dias que faltam
  href: string | null   // ficha do casamento
}

const COR_TIPO: Record<string, string> = {
  'Galeria Online':   '#60a5fa',
  'Fotos p/ Seleção': '#34d399',
  'Fotos Finais':     '#f472b6',
  'Seleção de fotos': '#fbbf24',
  'Edição de fotos':  '#fb923c',
  'Vídeo':            '#a78bfa',
}

// Botão "+" nos cartões de prioridade: abre uma gaveta à direita com a lista,
// e cada linha leva diretamente à ficha do casamento.
//   modo 'atraso' → vermelho, dias em atraso, mais antigos primeiro
//   modo 'aviso'  → laranja, dias que faltam, mais próximos primeiro
export function EntregasDrawer({ itens, titulo = 'Entregas em atraso', modo = 'atraso' }: { itens: EntregaAtraso[]; titulo?: string; modo?: 'atraso' | 'aviso' }) {
  const aviso = modo === 'aviso'
  const corModo = aviso ? '#fb923c' : '#f87171'
  const [aberto, setAberto] = useState(false)
  const [montado, setMontado] = useState(false)
  const [filtro, setFiltro] = useState<string | null>(null)

  useEffect(() => { setMontado(true) }, [])

  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('keydown', onKey)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = antes }
  }, [aberto])

  const tipos = Array.from(new Set(itens.map(i => i.tipo)))
  const lista = (filtro ? itens.filter(i => i.tipo === filtro) : itens).slice()
    .sort((a, b) => aviso ? a.dias - b.dias : b.dias - a.dias)

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        title={`Ver: ${titulo}`}
        aria-label={`Ver: ${titulo}`}
        className="w-8 h-8 rounded-full border flex items-center justify-center text-lg leading-none transition-all hover:text-black hover:scale-105"
        style={{ borderColor: `${corModo}66`, color: corModo }}
        onMouseEnter={e => { e.currentTarget.style.background = corModo }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
        +
      </button>

      {montado && createPortal(
        <>
          <div onClick={() => setAberto(false)}
            className="fixed inset-0 z-[90] transition-opacity duration-300"
            style={{ background: 'rgba(5,4,3,0.6)', backdropFilter: 'blur(3px)', opacity: aberto ? 1 : 0, pointerEvents: aberto ? 'auto' : 'none' }} />

          <aside
            className="fixed top-0 right-0 z-[91] h-[100dvh] flex flex-col"
            style={{
              width: 'min(460px, 100vw)',
              background: 'linear-gradient(180deg, #14100d, #0b0907)',
              borderLeft: `1px solid ${corModo}40`,
              boxShadow: aberto ? '-30px 0 80px -20px rgba(0,0,0,0.75)' : 'none',
              transform: aberto ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform .42s cubic-bezier(.2,.7,.2,1)',
            }}
            aria-hidden={!aberto}>

            {/* Cabeçalho */}
            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] tracking-[0.4em] uppercase" style={{ color: `${corModo}b3` }}>{aviso ? 'Aviso' : 'Prioridade'}</p>
                  <h2 className="font-cormorant text-3xl font-light text-white mt-1">{titulo}</h2>
                  <p className="text-[11px] text-white/35 mt-1">
                    {itens.length === 0 ? 'Tudo em dia' : `${itens.length} entrega${itens.length !== 1 ? 's' : ''} · ${aviso ? 'mais próximas primeiro' : 'mais antigas primeiro'}`}
                  </p>
                </div>
                <button onClick={() => setAberto(false)} aria-label="Fechar"
                  className="w-9 h-9 rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all flex items-center justify-center">
                  ✕
                </button>
              </div>

              {/* Filtro por tipo */}
              {tipos.length > 1 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  <button onClick={() => setFiltro(null)}
                    className="px-3 py-1 rounded-full text-[9px] tracking-[0.2em] uppercase border transition-all"
                    style={{ borderColor: filtro === null ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)', color: filtro === null ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                    Todas · {itens.length}
                  </button>
                  {tipos.map(t => {
                    const on = filtro === t
                    const cor = COR_TIPO[t] ?? '#94a3b8'
                    return (
                      <button key={t} onClick={() => setFiltro(on ? null : t)}
                        className="px-3 py-1 rounded-full text-[9px] tracking-[0.2em] uppercase border transition-all"
                        style={{ borderColor: on ? cor : 'rgba(255,255,255,0.08)', color: on ? cor : 'rgba(255,255,255,0.4)', background: on ? `${cor}14` : 'transparent' }}>
                        {t} · {itens.filter(i => i.tipo === t).length}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Lista */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
              {lista.length === 0 && (
                <p className="text-center text-white/25 text-xs tracking-widest uppercase py-16">{aviso ? 'Nada a terminar' : 'Nada em atraso'}</p>
              )}
              {lista.map((it, i) => {
                const cor = COR_TIPO[it.tipo] ?? '#94a3b8'
                const conteudo = (
                  <>
                    <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ background: cor }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: cor }}>{it.tipo}</p>
                      <p className="text-[14px] text-white/90 truncate mt-1">{it.nome}</p>
                      <p className="text-[10px] text-white/30 mt-0.5 font-mono">{it.ref}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-2xl font-extralight leading-none" style={{ color: corModo }}>{aviso && it.dias === 0 ? 'Hoje' : it.dias}</p>
                      <p className="text-[9px] tracking-[0.2em] uppercase mt-1" style={{ color: `${corModo}80` }}>
                        {aviso ? (it.dias === 0 ? 'último dia' : it.dias === 1 ? 'dia' : 'dias') : 'dias'}
                      </p>
                    </div>
                    {it.href && (
                      <span className="text-white/20 group-hover:text-white group-hover:translate-x-0.5 transition-all">→</span>
                    )}
                  </>
                )
                const cls = 'group relative flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] pl-5 pr-4 py-3.5 transition-all'
                return it.href ? (
                  <Link key={`${it.ref}-${it.tipo}-${i}`} href={it.href} onClick={() => setAberto(false)}
                    className={`${cls} hover:border-white/20 hover:bg-white/[0.05]`}>
                    {conteudo}
                  </Link>
                ) : (
                  <div key={`${it.ref}-${it.tipo}-${i}`} className={cls} title="Sem ficha encontrada para esta referência">
                    {conteudo}
                  </div>
                )
              })}
            </div>
          </aside>
        </>,
        document.body
      )}
    </>
  )
}
