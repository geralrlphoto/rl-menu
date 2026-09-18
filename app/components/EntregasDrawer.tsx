'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

export type EntregaAtraso = {
  tipo: string              // "Galeria Online", "Fotos p/ Seleção", "Vídeo"…
  nome: string              // noivos
  ref: string
  dias: number              // atraso: dias de atraso · aviso: dias que faltam
  href: string | null       // ficha do casamento
  estado: 'atraso' | 'aviso'
}

const COR_TIPO: Record<string, string> = {
  'Galeria Online':   '#60a5fa',
  'Fotos p/ Seleção': '#34d399',
  'Fotos Finais':     '#f472b6',
  'Edição de fotos':  '#fbbf24',
  'Vídeo':            '#a78bfa',
}
const VERMELHO = '#f87171'
const LARANJA  = '#fb923c'

// Botão "+" nos cartões Entregas e Vídeos: abre uma gaveta à direita com duas
// secções, Em atraso (vermelho) e a terminar (laranja). Cada linha leva à ficha.
export function EntregasDrawer({ itens, titulo = 'Entregas', avisoTitulo = 'Termina em 5 dias' }: { itens: EntregaAtraso[]; titulo?: string; avisoTitulo?: string }) {
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

  const temAtraso = itens.some(i => i.estado === 'atraso')
  const corBotao = temAtraso ? VERMELHO : LARANJA
  const tipos = Array.from(new Set(itens.map(i => i.tipo)))
  const visiveis = filtro ? itens.filter(i => i.tipo === filtro) : itens
  const atrasos = visiveis.filter(i => i.estado === 'atraso').sort((a, b) => b.dias - a.dias)
  const avisos  = visiveis.filter(i => i.estado === 'aviso').sort((a, b) => a.dias - b.dias)

  const linha = (it: EntregaAtraso, key: string) => {
    const cor = COR_TIPO[it.tipo] ?? '#94a3b8'
    const corDias = it.estado === 'atraso' ? VERMELHO : LARANJA
    const conteudo = (
      <>
        <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ background: cor }} />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: cor }}>{it.tipo}</p>
          <p className="text-[14px] text-white/90 truncate mt-1">{it.nome}</p>
          <p className="text-[10px] text-white/30 mt-0.5 font-mono">{it.ref}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-extralight leading-none" style={{ color: corDias }}>
            {it.estado === 'aviso' && it.dias === 0 ? 'Hoje' : it.dias}
          </p>
          <p className="text-[9px] tracking-[0.2em] uppercase mt-1" style={{ color: `${corDias}80` }}>
            {it.estado === 'atraso'
              ? (it.dias === 1 ? 'dia atraso' : 'dias atraso')
              : it.dias === 0 ? 'último dia' : it.dias === 1 ? 'dia' : 'dias'}
          </p>
        </div>
        {it.href && <span className="text-white/20 group-hover:text-white group-hover:translate-x-0.5 transition-all">→</span>}
      </>
    )
    const cls = 'group relative flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] pl-5 pr-4 py-3.5 transition-all'
    return it.href ? (
      <Link key={key} href={it.href} onClick={() => setAberto(false)} className={`${cls} hover:border-white/20 hover:bg-white/[0.05]`}>
        {conteudo}
      </Link>
    ) : (
      <div key={key} className={cls} title="Sem ficha encontrada para esta referência">{conteudo}</div>
    )
  }

  const seccao = (titulo: string, cor: string, lista: EntregaAtraso[]) =>
    lista.length === 0 ? null : (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 px-1 pt-2">
          <span className="w-2 h-2 rounded-full" style={{ background: cor, boxShadow: `0 0 10px ${cor}` }} />
          <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: cor }}>{titulo} · {lista.length}</span>
          <div className="flex-1 h-px" style={{ background: `${cor}30` }} />
        </div>
        {lista.map((it, i) => linha(it, `${titulo}-${it.ref}-${it.tipo}-${i}`))}
      </div>
    )

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        title="Ver as entregas"
        aria-label="Ver as entregas"
        className="w-8 h-8 rounded-full border flex items-center justify-center text-lg leading-none transition-all hover:text-black hover:scale-105"
        style={{ borderColor: `${corBotao}66`, color: corBotao }}
        onMouseEnter={e => { e.currentTarget.style.background = corBotao }}
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
              borderLeft: `1px solid ${corBotao}40`,
              boxShadow: aberto ? '-30px 0 80px -20px rgba(0,0,0,0.75)' : 'none',
              transform: aberto ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform .42s cubic-bezier(.2,.7,.2,1)',
            }}
            aria-hidden={!aberto}>

            {/* Cabeçalho */}
            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] tracking-[0.4em] uppercase text-white/40">Prioridade</p>
                  <h2 className="font-cormorant text-3xl font-light text-white mt-1">{titulo}</h2>
                  <p className="text-[11px] mt-1">
                    <span style={{ color: VERMELHO }}>{itens.filter(i => i.estado === 'atraso').length} em atraso</span>
                    <span className="text-white/25"> · </span>
                    <span style={{ color: LARANJA }}>{itens.filter(i => i.estado === 'aviso').length} {avisoTitulo.toLowerCase().replace('termina', 'a terminar')}</span>
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

            {/* Listas */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
              {atrasos.length === 0 && avisos.length === 0 && (
                <p className="text-center text-white/25 text-xs tracking-widest uppercase py-16">Tudo em dia</p>
              )}
              {seccao('Em atraso', VERMELHO, atrasos)}
              {seccao(avisoTitulo, LARANJA, avisos)}
            </div>
          </aside>
        </>,
        document.body
      )}
    </>
  )
}
