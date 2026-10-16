'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { WhatsAppMembro } from './WhatsAppMembro'

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
    const btn = 'w-8 h-8 rounded-full border text-[12px] leading-none flex items-center justify-center transition-all hover:scale-110 disabled:opacity-40'
    const conteudo = (
      <>
        <div className="shrink-0 flex flex-col items-center w-14">
          <span className="w-12 h-12 rounded-full flex items-center justify-center font-cond font-semibold leading-none"
            style={{ color: corDias, background: `${corDias}1f`, fontSize: it.estado === 'aviso' && it.dias === 0 ? 14 : 20 }}>
            {it.estado === 'aviso' && it.dias === 0 ? 'Hoje' : it.dias}
          </span>
          <span className="font-cond text-[11px] mt-1.5 whitespace-nowrap" style={{ color: `${corDias}cc` }}>
            {it.estado === 'atraso'
              ? (it.dias === 1 ? 'dia atraso' : 'dias atraso')
              : it.dias === 0 ? 'último dia' : it.dias === 1 ? 'dia' : 'dias'}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-cond text-[11px] font-medium tracking-[0.18em] uppercase" style={{ color: cor }}>{it.tipo}</p>
          <p className="font-cond font-medium text-[20px] leading-tight text-white truncate mt-1">{it.nome}</p>
          <p className="font-cond text-[12px] text-white/35 mt-0.5">{it.ref}</p>
        </div>
        {it.href && <span className="text-white/25 group-hover:text-[#C9A84C] group-hover:translate-x-0.5 transition-all">→</span>}
      </>
    )
    const linhaCls = 'flex items-center gap-4 pl-4 pr-5 pt-4 pb-2'
    const prazoTxt = it.estado === 'atraso'
      ? `está com ${it.dias} ${it.dias === 1 ? 'dia' : 'dias'} de atraso`
      : it.dias === 0 ? 'termina hoje' : `termina daqui a ${it.dias} ${it.dias === 1 ? 'dia' : 'dias'}`
    // Tom informal: "Olha as fotos p/ Seleção de …"
    const artigo = /^fotos/i.test(it.tipo) ? 'as' : /^v[ií]deo/i.test(it.tipo) ? 'o' : 'a'
    const tipoTxt = it.tipo.charAt(0).toLowerCase() + it.tipo.slice(1)
    const mensagem = `Olá boas tudo bem?\n\nOlha ${artigo} ${tipoTxt} de ${it.nome}${it.ref ? ` (${it.ref})` : ''}: ${prazoTxt}.\n\nConsegues tratar disto? Obrigado.`
    return (
      // O cartão não é o link: os botões não podem viver dentro de uma âncora.
      <div key={key} className="group relative rounded-[22px] border border-white/[0.08] bg-[#141414] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/[0.18] overflow-hidden"
        style={{ borderLeft: `2px solid ${cor}` }}>
        {it.href ? (
          <Link href={it.href} onClick={() => setAberto(false)} className={linhaCls}>{conteudo}</Link>
        ) : (
          <div className={linhaCls} title="Sem ficha encontrada para esta referência">{conteudo}</div>
        )}
        <div className="flex items-center justify-end gap-2 pl-5 pr-4 pb-3">
          <WhatsAppMembro mensagem={mensagem} titulo={it.tipo} />
          {comAcoes && (<>
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
          </>)}
        </div>
      </div>
    )
  }

  const seccao = (titulo: string, cor: string, lista: EntregaAtraso[]) =>
    lista.length === 0 ? null : (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3 px-1 pt-2 pb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: cor, boxShadow: `0 0 10px ${cor}` }} />
          <span className="font-cond text-[12px] font-semibold tracking-[0.14em] uppercase" style={{ color: cor }}>{titulo}</span>
          <span className="rounded-full px-2 py-0.5 font-cond text-[11px] font-semibold" style={{ color: cor, background: `${cor}1f` }}>{lista.length}</span>
          <div className="flex-1 h-px bg-white/[0.08]" />
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
                  <h2 className="font-cond font-bold text-[40px] leading-none text-white mt-2">{titulo}</h2>
                  <div className="flex flex-wrap gap-2 mt-4 font-cond text-[13px]">
                    <span className="rounded-full px-3 py-1" style={{ color: VERMELHO, background: `${VERMELHO}1a` }}>{porResolver.filter(i => i.estado === 'atraso').length} em atraso</span>
                    <span className="rounded-full px-3 py-1" style={{ color: LARANJA, background: `${LARANJA}1a` }}>{porResolver.filter(i => i.estado === 'aviso').length} {avisoTitulo.toLowerCase().replace('termina', 'a terminar')}</span>
                  </div>
                </div>
                <button onClick={() => setAberto(false)} aria-label="Fechar"
                  className="w-10 h-10 rounded-full border border-white/10 bg-white/[0.04] text-white/50 hover:text-white hover:border-white/30 hover:rotate-90 transition-all duration-300 flex items-center justify-center">
                  ✕
                </button>
              </div>

              {/* Filtro por tipo */}
              {tipos.length > 1 && (
                <div className="relative flex flex-wrap gap-1.5 mt-4">
                  <button onClick={() => setFiltro(null)}
                    className="px-3 py-1.5 rounded-full font-cond text-[12px] border transition-all"
                    style={{ borderColor: filtro === null ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.08)', color: filtro === null ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                    Todas · {porResolver.length}
                  </button>
                  {tipos.map(t => {
                    const on = filtro === t
                    const cor = COR_TIPO[t] ?? '#94a3b8'
                    return (
                      <button key={t} onClick={() => setFiltro(on ? null : t)}
                        className="px-3 py-1.5 rounded-full font-cond text-[12px] border transition-all"
                        style={{ borderColor: on ? cor : 'rgba(255,255,255,0.08)', color: on ? cor : 'rgba(255,255,255,0.4)', background: on ? `${cor}14` : 'transparent' }}>
                        {t} · {porResolver.filter(i => i.tipo === t).length}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Listas */}
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
              {atrasos.length === 0 && avisos.length === 0 && (
                <p className="text-center font-cond text-[16px] text-white/35 py-16">Tudo em dia</p>
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
