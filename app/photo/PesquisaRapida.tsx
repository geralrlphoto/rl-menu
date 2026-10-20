'use client'

// Pesquisa rápida do /photo: Ctrl+K (ou ⌘K) ou o botão "Procurar".
// Escreve um nome ou referência e salta para a ficha do evento, a ficha do CRM ou uma página.

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Resultado = { grupo: string; titulo: string; sub: string; href: string }

const PAGINAS: Array<{ titulo: string; href: string }> = [
  { titulo: 'CRM', href: '/crm' },
  { titulo: 'Calendário', href: '/calendario' },
  { titulo: 'Finanças', href: '/financas' },
  { titulo: 'Casamentos', href: '/casamentos' },
  { titulo: 'Eventos 2026', href: '/eventos-2026' },
  { titulo: 'Relatório Diário', href: '/relatorio-diario' },
  { titulo: 'Freelancers', href: '/freelancers' },
  { titulo: 'Álbuns', href: '/edicao-fotografia/albuns' },
  { titulo: 'Portais Clientes', href: '/portais-clientes' },
  { titulo: 'Fotografia', href: '/edicao-fotografia' },
  { titulo: 'Tarefas', href: '/tarefas' },
]

const semAcentos = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const fmtData = (iso?: string | null) => {
  if (!iso) return ''
  const [a, m, d] = iso.slice(0, 10).split('-')
  return `${Number(d)} ${MESES[Number(m) - 1]} ${a}`
}

export default function PesquisaRapida() {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [q, setQ] = useState('')
  const [remotos, setRemotos] = useState<Resultado[]>([])
  const [aProcurar, setAProcurar] = useState(false)
  const [sel, setSel] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Ctrl+K / ⌘K abre; Esc fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setAberto(v => !v) }
      else if (e.key === 'Escape') setAberto(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!aberto) { setQ(''); setRemotos([]); return }
    setTimeout(() => inputRef.current?.focus(), 30)
    const antes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = antes }
  }, [aberto])

  // Pede à API só a partir de 2 letras, com uma pausa para não pedir a cada tecla
  useEffect(() => {
    const termo = q.trim()
    if (termo.length < 2) { setRemotos([]); setAProcurar(false); return }
    setAProcurar(true)
    const ctrl = new AbortController()
    const id = setTimeout(() => {
      fetch(`/api/pesquisa-rapida?q=${encodeURIComponent(termo)}`, { signal: ctrl.signal })
        .then(r => r.json())
        .then(d => {
          setRemotos([
            ...(d.eventos ?? []).map((e: any) => ({
              grupo: 'Eventos', titulo: (e.cliente ?? '').trim() || e.referencia,
              sub: [e.referencia, fmtData(e.data_evento)].filter(Boolean).join(' · '), href: `/eventos-2026/${e.id}`,
            })),
            ...(d.crm ?? []).map((c: any) => ({
              grupo: 'CRM', titulo: (c.nome ?? '').trim() || 'Sem nome',
              sub: [c.status, fmtData(c.data_casamento)].filter(Boolean).join(' · '), href: `/crm/${c.id}`,
            })),
          ])
        })
        .catch(() => {})
        .finally(() => setAProcurar(false))
    }, 250)
    return () => { clearTimeout(id); ctrl.abort() }
  }, [q])

  const termo = semAcentos(q.trim())
  const paginas: Resultado[] = PAGINAS
    .filter(p => !termo || semAcentos(p.titulo).includes(termo))
    .slice(0, termo ? 4 : 6)
    .map(p => ({ grupo: 'Páginas', titulo: p.titulo, sub: p.href, href: p.href }))
  const lista = [...remotos, ...paginas]

  useEffect(() => { setSel(0) }, [q, remotos.length])

  function ir(r?: Resultado) {
    if (!r) return
    setAberto(false)
    router.push(r.href)
  }

  function onKeyInput(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(lista.length - 1, s + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(0, s - 1)) }
    else if (e.key === 'Enter') { e.preventDefault(); ir(lista[sel]) }
  }

  return (
    <>
      <button onClick={() => setAberto(true)}
        className="inline-flex items-center gap-2 rounded-full bg-[#0e0e0e]/90 backdrop-blur-md font-cond font-semibold text-[15px] text-white px-5 py-2.5 transition-all border border-white/[0.14] hover:border-white/30">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-4 h-4 text-[#C9A84C]" aria-hidden>
          <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
        </svg>
        Procurar
        <kbd className="hidden sm:inline rounded-md border border-white/10 px-1.5 py-px font-cond text-[10px] font-normal text-white/40">Ctrl K</kbd>
      </button>

      {aberto && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          onClick={() => setAberto(false)}>
          <div onClick={e => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-[22px] border border-[#C9A84C]/30 bg-[#141414] shadow-[0_0_80px_-20px_rgba(201,168,76,0.45)]">
            <div className="flex items-center gap-3 px-5 border-b border-white/[0.08]">
              <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.8" strokeLinecap="round" className="w-5 h-5 shrink-0" aria-hidden>
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
              </svg>
              <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} onKeyDown={onKeyInput}
                placeholder="Nome dos noivos, referência ou página…"
                className="flex-1 bg-transparent py-4 font-cond text-[18px] text-white placeholder-white/30 focus:outline-none" />
              {aProcurar && <span className="w-4 h-4 rounded-full border-2 border-[#C9A84C]/30 border-t-[#C9A84C] animate-spin" />}
              <kbd className="rounded-md border border-white/15 px-1.5 py-0.5 font-cond text-[11px] text-white/40">Esc</kbd>
            </div>

            <div className="max-h-[55vh] overflow-y-auto py-2">
              {lista.length === 0 && (
                <p className="px-5 py-6 font-cond text-[14px] text-white/35">
                  {aProcurar ? 'A procurar…' : 'Nada encontrado.'}
                </p>
              )}
              {lista.map((r, i) => (
                <div key={`${r.grupo}-${r.href}`}>
                  {(i === 0 || lista[i - 1].grupo !== r.grupo) && (
                    <p className="px-5 pt-3 pb-1.5 font-cond text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]/80">{r.grupo}</p>
                  )}
                  <button onClick={() => ir(r)} onMouseEnter={() => setSel(i)}
                    className="w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors"
                    style={{ background: i === sel ? 'rgba(201,168,76,0.10)' : 'transparent' }}>
                    <span className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-cond text-[13px] font-semibold text-[#C9A84C] bg-[#C9A84C]/10">
                      {r.titulo.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-cond text-[16px] text-white truncate">{r.titulo}</span>
                      <span className="block font-cond text-[12px] text-white/40 truncate">{r.sub}</span>
                    </span>
                    {i === sel && <span className="font-cond text-[12px] text-[#C9A84C]">Enter ↵</span>}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
