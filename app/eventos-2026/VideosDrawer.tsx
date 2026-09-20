'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

// Botão 🎬 Vídeos no topo de /eventos-2026: abre uma gaveta à direita com os
// vídeos em edição e os já entregues, na temporada que está a ser vista.
//   Em curso  → video_estado 'Em Edição' | 'Em Revisão' | 'Finalizado'
//   Entregues → video_estado 'Entregue'
// Ficam de fora 'Aguardar' (ainda não arrancou) e 'S/SERVIÇO' (sem vídeo).

export type VideoEvento = {
  id: string
  notion_id?: string
  referencia: string
  cliente: string
  data_evento: string
  local: string
  tipo_servico?: string[]
  valor_liquido: number | null
  valor_video?: number | null
  video_estado: string | null
}

const LARANJA = '#fb923c'
const VERDE   = '#4ade80'
const VERMELHO = '#f87171'

const EM_CURSO = ['Em Edição', 'Em Revisão', 'Finalizado']

// Prazo de entrega do vídeo: data do evento + 180 dias úteis (mesma regra do
// sino do admin e do painel do editor).
function prazoVideo(dataEvento: string): Date | null {
  const d = new Date(dataEvento + 'T00:00:00')
  if (isNaN(d.getTime())) return null
  let count = 0
  while (count < 180) {
    d.setDate(d.getDate() + 1)
    const dia = d.getDay()
    if (dia !== 0 && dia !== 6) count++
  }
  return d
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function dataCurta(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  if (isNaN(d.getTime())) return '—'
  return `${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}
function diasAte(d: Date) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - hoje.getTime()) / 86400000)
}

function temVideo(e: VideoEvento) {
  const servicos = (e.tipo_servico ?? []).join(' ').toUpperCase()
  return /V.DEO/.test(servicos) || (e.valor_video ?? 0) > 0 || (e.valor_liquido ?? 0) > 0
}

export function VideosDrawer({ eventos, ano }: { eventos: VideoEvento[]; ano: number }) {
  const [aberto, setAberto] = useState(false)
  const [montado, setMontado] = useState(false)

  useEffect(() => { setMontado(true) }, [])

  useEffect(() => {
    if (!aberto) return
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setAberto(false) }
    document.addEventListener('keydown', onKey)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = antes }
  }, [aberto])

  const comVideo = eventos.filter(temVideo)
  const emCurso = comVideo
    .filter(e => EM_CURSO.includes(String(e.video_estado ?? '')))
    .sort((a, b) => (a.data_evento ?? '').localeCompare(b.data_evento ?? ''))
  const entregues = comVideo
    .filter(e => e.video_estado === 'Entregue')
    .sort((a, b) => (b.data_evento ?? '').localeCompare(a.data_evento ?? ''))

  const linha = (e: VideoEvento, estado: 'curso' | 'entregue') => {
    const cor = estado === 'curso' ? LARANJA : VERDE
    const prazo = estado === 'curso' && e.data_evento ? prazoVideo(e.data_evento) : null
    const dias = prazo ? diasAte(prazo) : null
    const corPrazo = dias === null ? cor : dias < 0 ? VERMELHO : dias <= 30 ? VERMELHO : LARANJA
    return (
      <Link
        key={`${estado}-${e.id}`}
        href={`/eventos-2026/${e.notion_id ?? e.id}`}
        onClick={() => setAberto(false)}
        className="group relative flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] pl-5 pr-4 py-3.5 transition-all hover:border-white/20 hover:bg-white/[0.05]">
        <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ background: cor }} />
        <div className="min-w-0 flex-1">
          <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: cor }}>{e.video_estado}</p>
          <p className="text-[14px] text-white/90 truncate mt-1">{e.cliente || e.referencia || '—'}</p>
          <p className="text-[10px] text-white/30 mt-0.5 font-mono">
            {e.referencia || 's/referência'} · {dataCurta(e.data_evento)}
          </p>
        </div>
        {estado === 'curso' && dias !== null ? (
          <div className="text-right shrink-0">
            <p className="text-2xl font-extralight leading-none" style={{ color: corPrazo }}>
              {dias < 0 ? `+${Math.abs(dias)}` : dias}
            </p>
            <p className="text-[9px] tracking-[0.2em] uppercase mt-1" style={{ color: `${corPrazo}99` }}>
              {dias < 0 ? 'dias atraso' : dias === 1 ? 'dia p/ prazo' : 'dias p/ prazo'}
            </p>
          </div>
        ) : (
          <span className="text-[10px] tracking-[0.2em] uppercase shrink-0" style={{ color: `${VERDE}cc` }}>entregue</span>
        )}
        <span className="text-white/20 group-hover:text-white group-hover:translate-x-0.5 transition-all">→</span>
      </Link>
    )
  }

  const seccao = (titulo: string, cor: string, lista: VideoEvento[], estado: 'curso' | 'entregue') => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 px-1 pt-2">
        <span className="w-2 h-2 rounded-full" style={{ background: cor, boxShadow: `0 0 10px ${cor}` }} />
        <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: cor }}>{titulo} · {lista.length}</span>
        <div className="flex-1 h-px" style={{ background: `${cor}30` }} />
      </div>
      {lista.length === 0
        ? <p className="text-white/25 text-[11px] italic px-1 py-2">Nenhum vídeo nesta fase.</p>
        : lista.map(e => linha(e, estado))}
    </div>
  )

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        title="Ver vídeos em edição e entregues"
        aria-label="Ver vídeos em edição e entregues"
        className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md text-white/80 font-bold text-xs tracking-widest uppercase hover:border-gold/60 hover:text-gold transition-all">
        <span className="text-sm leading-none">🎬</span>
        Vídeos
        {emCurso.length > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] tabular-nums"
            style={{ background: `${LARANJA}22`, color: LARANJA, border: `1px solid ${LARANJA}55` }}>
            {emCurso.length}
          </span>
        )}
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
              borderLeft: `1px solid ${LARANJA}40`,
              boxShadow: aberto ? '-30px 0 80px -20px rgba(0,0,0,0.75)' : 'none',
              transform: aberto ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform .42s cubic-bezier(.2,.7,.2,1)',
            }}
            aria-hidden={!aberto}>

            {/* Cabeçalho */}
            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[9px] tracking-[0.4em] uppercase text-white/40">Temporada {ano}</p>
                  <h2 className="font-cormorant text-3xl font-light text-white mt-1">Vídeos</h2>
                  <p className="text-[11px] mt-1">
                    <span style={{ color: LARANJA }}>{emCurso.length} em edição</span>
                    <span className="text-white/25"> · </span>
                    <span style={{ color: VERDE }}>{entregues.length} entregues</span>
                  </p>
                </div>
                <button onClick={() => setAberto(false)} aria-label="Fechar"
                  className="w-9 h-9 rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/30 transition-all flex items-center justify-center">
                  ✕
                </button>
              </div>
              <p className="text-[10px] text-white/30 mt-3 italic">
                Prazo de entrega: data do evento + 180 dias úteis
              </p>
            </div>

            {/* Listas */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-5">
              {emCurso.length === 0 && entregues.length === 0 ? (
                <p className="text-center text-white/25 text-xs tracking-widest uppercase py-16">
                  Sem vídeos em edição ou entregues
                </p>
              ) : (
                <>
                  {seccao('Em edição', LARANJA, emCurso, 'curso')}
                  {seccao('Entregues', VERDE, entregues, 'entregue')}
                </>
              )}
            </div>
          </aside>
        </>,
        document.body
      )}
    </>
  )
}
