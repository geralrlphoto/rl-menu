'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'

// Botão 🎬 Vídeos no topo de /eventos-2026: abre uma gaveta à direita com os
// vídeos em edição e os já entregues de TODOS os anos (não só a temporada que
// está a ser vista), separados por ano dentro de cada secção.
//   Em curso  → video_estado 'Em Edição' | 'Em Revisão' | 'Finalizado'
//   Entregues → video_estado 'Entregue'
// Ficam de fora 'Aguardar' (ainda não arrancou) e 'S/SERVIÇO' (sem vídeo).
// Os dados vêm de /api/videos-estados (só as colunas necessárias, já filtrado
// por estado — pedido uma única vez por carregamento da página).
// O ✕ de cada linha tira-a da lista. É uma preferência de visualização do
// browser (localStorage), não mexe no estado do evento; o rodapé mostra
// quantos estão ocultos e repõe-nos todos.

export type VideoEvento = {
  id: string
  notion_id?: string
  referencia: string
  cliente: string
  data_evento: string
  local: string
  video_estado: string | null
}

const LARANJA  = '#fb923c'
const VERDE    = '#4ade80'
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
function anoDe(iso: string): string {
  const a = (iso ?? '').slice(0, 4)
  return /^\d{4}$/.test(a) ? a : 's/data'
}
function diasAte(d: Date) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - hoje.getTime()) / 86400000)
}

// Agrupa por ano, do mais recente para o mais antigo
function porAno(lista: VideoEvento[], crescente: boolean) {
  const grupos = new Map<string, VideoEvento[]>()
  for (const v of lista) {
    const ano = anoDe(v.data_evento)
    if (!grupos.has(ano)) grupos.set(ano, [])
    grupos.get(ano)!.push(v)
  }
  return Array.from(grupos.entries()).sort((a, b) =>
    crescente ? a[0].localeCompare(b[0]) : b[0].localeCompare(a[0]))
}

const OCULTOS_KEY = 'videos_drawer_ocultos'

export function VideosDrawer() {
  const [aberto, setAberto] = useState(false)
  const [montado, setMontado] = useState(false)
  const [videos, setVideos] = useState<VideoEvento[]>([])
  const [carregando, setCarregando] = useState(true)
  // Linhas que o admin tirou da lista — só neste browser
  const [ocultos, setOcultos] = useState<string[]>([])

  useEffect(() => {
    setMontado(true)
    try {
      const guardado = localStorage.getItem(OCULTOS_KEY)
      if (guardado) {
        const arr = JSON.parse(guardado)
        if (Array.isArray(arr)) setOcultos(arr.filter((x: any) => typeof x === 'string'))
      }
    } catch { /* localStorage indisponível — segue sem ocultos */ }
  }, [])

  function guardarOcultos(next: string[]) {
    setOcultos(next)
    try { localStorage.setItem(OCULTOS_KEY, JSON.stringify(next)) } catch { /* ignora */ }
  }
  function ocultar(id: string) { guardarOcultos(Array.from(new Set([...ocultos, id]))) }
  function reporTodos() { guardarOcultos([]) }

  useEffect(() => {
    fetch('/api/videos-estados')
      .then(r => r.json())
      .then(d => setVideos(d.videos ?? []))
      .catch(() => {/* silencioso */})
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => {
    if (!aberto) return
    const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Escape') setAberto(false) }
    document.addEventListener('keydown', onKey)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = antes }
  }, [aberto])

  const visiveis = videos.filter(v => !ocultos.includes(v.id))
  // Em curso: o casamento mais antigo primeiro (é o mais urgente)
  const emCurso = visiveis
    .filter(v => EM_CURSO.includes(String(v.video_estado ?? '')))
    .sort((a, b) => (a.data_evento ?? '').localeCompare(b.data_evento ?? ''))
  // Entregues: o mais recente primeiro
  const entregues = visiveis
    .filter(v => v.video_estado === 'Entregue')
    .sort((a, b) => (b.data_evento ?? '').localeCompare(a.data_evento ?? ''))

  const anos = Array.from(new Set(visiveis.map(v => anoDe(v.data_evento)))).sort((a, b) => b.localeCompare(a))
  const nOcultos = videos.filter(v => ocultos.includes(v.id)).length

  const linha = (e: VideoEvento, estado: 'curso' | 'entregue') => {
    const cor = estado === 'curso' ? LARANJA : VERDE
    const prazo = estado === 'curso' && e.data_evento ? prazoVideo(e.data_evento) : null
    const dias = prazo ? diasAte(prazo) : null
    const corPrazo = dias === null ? cor : dias <= 30 ? VERMELHO : LARANJA
    return (
      // O ✕ fica fora do <Link> (âncora não pode conter botões) e só aparece
      // ao passar o rato ou com foco de teclado.
      <div key={`${estado}-${e.id}`} className="group relative">
        <Link
          href={`/eventos-2026/${e.notion_id ?? e.id}`}
          onClick={() => setAberto(false)}
          className="relative flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] pl-5 pr-11 py-3.5 transition-all hover:border-white/20 hover:bg-white/[0.05]">
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
        </Link>
        <button
          onClick={() => ocultar(e.id)}
          title="Tirar da lista"
          aria-label={`Tirar ${e.cliente || e.referencia || 'este vídeo'} da lista`}
          className="absolute top-1/2 right-3 -translate-y-1/2 w-6 h-6 rounded-full border border-white/10 bg-black/40 text-white/35 text-[11px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 hover:border-white/40 hover:text-white transition-all">
          ✕
        </button>
      </div>
    )
  }

  // Separador de ano dentro de cada secção
  const separadorAno = (ano: string, n: number, cor: string) => (
    <div className="flex items-center gap-3 px-1 pt-3 pb-0.5">
      <span className="font-cormorant text-xl font-light leading-none" style={{ color: `${cor}dd` }}>{ano}</span>
      <div className="flex-1 h-px" style={{ background: `${cor}1f` }} />
      <span className="text-[9px] tracking-[0.2em] uppercase text-white/25 tabular-nums">{n} {n === 1 ? 'vídeo' : 'vídeos'}</span>
    </div>
  )

  const seccao = (titulo: string, cor: string, lista: VideoEvento[], estado: 'curso' | 'entregue') => (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 px-1 pt-2">
        <span className="w-2 h-2 rounded-full" style={{ background: cor, boxShadow: `0 0 10px ${cor}` }} />
        <span className="text-[10px] tracking-[0.3em] uppercase" style={{ color: cor }}>{titulo} · {lista.length}</span>
        <div className="flex-1 h-px" style={{ background: `${cor}30` }} />
      </div>
      {lista.length === 0
        ? <p className="text-white/25 text-[11px] italic px-1 py-2">Nenhum vídeo nesta fase.</p>
        : porAno(lista, estado === 'curso').map(([ano, doAno]) => (
            <div key={`${titulo}-${ano}`} className="flex flex-col gap-2">
              {separadorAno(ano, doAno.length, cor)}
              {doAno.map(v => linha(v, estado))}
            </div>
          ))}
    </div>
  )

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        title="Ver vídeos em edição e entregues (todos os anos)"
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
                  <p className="text-[9px] tracking-[0.4em] uppercase text-white/40">
                    {anos.length > 0 ? `Todas as temporadas · ${anos[anos.length - 1]}–${anos[0]}` : 'Todas as temporadas'}
                  </p>
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
              {carregando ? (
                <p className="text-center text-white/25 text-xs tracking-widest uppercase py-16">A carregar…</p>
              ) : emCurso.length === 0 && entregues.length === 0 ? (
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

            {/* Rodapé — linhas tiradas da lista */}
            {nOcultos > 0 && (
              <div className="px-6 py-3 border-t border-white/[0.06] flex items-center justify-between gap-3">
                <p className="text-[10px] tracking-[0.2em] uppercase text-white/30">
                  {nOcultos} fora da lista
                </p>
                <button onClick={reporTodos}
                  className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-full border border-white/12 text-white/50 hover:text-white hover:border-white/35 transition-all">
                  Repor todos
                </button>
              </div>
            )}
          </aside>
        </>,
        document.body
      )}
    </>
  )
}
