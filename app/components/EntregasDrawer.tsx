'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export type EntregaAtraso = {
  tipo: string              // "Galeria Online", "Fotos p/ Seleção", "Vídeo"…
  nome: string              // noivos
  ref: string
  dias: number              // atraso: dias de atraso · aviso: dias que faltam
  href: string | null       // ficha do casamento
  estado: 'atraso' | 'aviso'
  // Chave das Ações Fotografia desta entrega. Quando existe (e há
  // referência), a linha ganha os botões de marcar entregue / desligar alerta,
  // que escrevem em portais.settings tal como a ficha do evento.
  acao?: 'galerias' | 'selecao' | 'fotos_finais' | 'wedding_film'
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
const VERDE    = '#4ade80'

// Botão "+" nos cartões Entregas e Vídeos: abre uma gaveta à direita com duas
// secções, Em atraso (vermelho) e a terminar (laranja). Cada linha leva à ficha.
export function EntregasDrawer({ itens, titulo = 'Entregas', avisoTitulo = 'Termina em 5 dias' }: { itens: EntregaAtraso[]; titulo?: string; avisoTitulo?: string }) {
  const [aberto, setAberto] = useState(false)
  const [montado, setMontado] = useState(false)
  const [filtro, setFiltro] = useState<string | null>(null)
  // Linhas já resolvidas nesta sessão (some logo, sem esperar pelo refresh)
  const [feitos, setFeitos] = useState<string[]>([])
  const [aGravar, setAGravar] = useState<Record<string, boolean>>({})
  const router = useRouter()

  useEffect(() => { setMontado(true) }, [])

  const chave = (it: EntregaAtraso) => `${it.tipo}-${it.ref}`

  // Marca a entrega como feita (data de hoje) ou desliga o alerta de prazo.
  // É o mesmo campo que os botões das Ações Fotografia da ficha gravam, por
  // isso a ficha e o painel /photo ficam logo de acordo.
  async function agir(it: EntregaAtraso, accao: 'entregue' | 'silenciar') {
    if (!it.acao || !it.ref) return
    const hoje = new Date().toISOString().slice(0, 10)
    const settings = accao === 'entregue'
      ? { [`${it.acao}_enviada`]: hoje }
      : { [`${it.acao}_alerta_off`]: true }
    const pergunta = accao === 'entregue'
      ? `Marcar "${it.tipo}" de ${it.nome} como entregue?\n\nNão envia email aos noivos: serve para registar uma entrega que já fizeste.`
      : `Desligar o alerta de "${it.tipo}" de ${it.nome}?\n\nSai desta lista e deixa de contar como atraso. Podes voltá-lo a ligar na ficha do evento.`
    if (!confirm(pergunta)) return
    const k = chave(it)
    setAGravar(prev => ({ ...prev, [k]: true }))
    try {
      const res = await fetch('/api/portais', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia: it.ref, updates: { settings } }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setFeitos(prev => [...prev, k])
      router.refresh()
    } catch {
      alert('Não consegui gravar. Tenta outra vez.')
    } finally {
      setAGravar(prev => { const { [k]: _, ...resto } = prev; return resto })
    }
  }

  useEffect(() => {
    if (!aberto) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(false) }
    document.addEventListener('keydown', onKey)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = antes }
  }, [aberto])

  const porResolver = itens.filter(i => !feitos.includes(chave(i)))
  const temAtraso = porResolver.some(i => i.estado === 'atraso')
  const corBotao = temAtraso ? VERMELHO : LARANJA
  const tipos = Array.from(new Set(porResolver.map(i => i.tipo)))
  const visiveis = filtro ? porResolver.filter(i => i.tipo === filtro) : porResolver
  const atrasos = visiveis.filter(i => i.estado === 'atraso').sort((a, b) => b.dias - a.dias)
  const avisos  = visiveis.filter(i => i.estado === 'aviso').sort((a, b) => a.dias - b.dias)

  const linha = (it: EntregaAtraso, key: string) => {
    const cor = COR_TIPO[it.tipo] ?? '#94a3b8'
    const corDias = it.estado === 'atraso' ? VERMELHO : LARANJA
    const gravando = !!aGravar[chave(it)]
    const comAcoes = !!it.acao && !!it.ref
    const btn = 'w-7 h-6 rounded-full border text-[11px] leading-none flex items-center justify-center transition-all disabled:opacity-40'
    const conteudo = (
      <>
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
    const linhaCls = `flex items-center gap-4 pl-5 pr-4 ${comAcoes ? 'pt-3.5 pb-2' : 'py-3.5'}`
    return (
      // O cartão não é o link: os botões não podem viver dentro de uma âncora.
      <div key={key} className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] transition-all hover:border-white/20 hover:bg-white/[0.05] overflow-hidden">
        <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ background: cor }} />
        {it.href ? (
          <Link href={it.href} onClick={() => setAberto(false)} className={linhaCls}>{conteudo}</Link>
        ) : (
          <div className={linhaCls} title="Sem ficha encontrada para esta referência">{conteudo}</div>
        )}
        {comAcoes && (
          <div className="flex items-center justify-end gap-1.5 pl-5 pr-3 pb-2.5">
            <button
              onClick={() => agir(it, 'entregue')}
              disabled={gravando}
              title="Marcar esta entrega como feita (grava a data de hoje, não envia email)"
              aria-label="Marcar como entregue"
              className={`${btn} hover:brightness-125`}
              style={{ borderColor: `${VERDE}55`, background: `${VERDE}14`, color: VERDE }}>
              {gravando ? '…' : '✓'}
            </button>
            <button
              onClick={() => agir(it, 'silenciar')}
              disabled={gravando}
              title="Desligar o alerta de prazo: sai da lista e deixa de contar como atraso"
              aria-label="Desligar alerta"
              className={`${btn} border-white/10 bg-black/40 text-white/30 hover:border-white/40 hover:text-white`}>
              {gravando ? '…' : '✕'}
            </button>
          </div>
        )}
      </div>
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
                    <span style={{ color: VERMELHO }}>{porResolver.filter(i => i.estado === 'atraso').length} em atraso</span>
                    <span className="text-white/25"> · </span>
                    <span style={{ color: LARANJA }}>{porResolver.filter(i => i.estado === 'aviso').length} {avisoTitulo.toLowerCase().replace('termina', 'a terminar')}</span>
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
                    Todas · {porResolver.length}
                  </button>
                  {tipos.map(t => {
                    const on = filtro === t
                    const cor = COR_TIPO[t] ?? '#94a3b8'
                    return (
                      <button key={t} onClick={() => setFiltro(on ? null : t)}
                        className="px-3 py-1 rounded-full text-[9px] tracking-[0.2em] uppercase border transition-all"
                        style={{ borderColor: on ? cor : 'rgba(255,255,255,0.08)', color: on ? cor : 'rgba(255,255,255,0.4)', background: on ? `${cor}14` : 'transparent' }}>
                        {t} · {porResolver.filter(i => i.tipo === t).length}
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
