'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Pesquisa rápida da RL PROD: Ctrl+K (ou o botão da barra) abre uma caixa que
// procura leads, portais de cliente, páginas e ações. O índice vem de
// /api/media-pesquisa e só é pedido quando a caixa abre pela primeira vez.

type Item = { tipo: 'Ação' | 'Página' | 'Lead' | 'Portal'; titulo: string; sub?: string; href: string }

const FIXOS: Item[] = [
  { tipo: 'Ação',   titulo: 'Registar lead',          sub: 'Sem email ao cliente',        href: '/media/crm/nova-lead?interno=1' },
  { tipo: 'Ação',   titulo: 'Chamar o agente de prospeção', sub: 'Empresas à procura de foto e vídeo', href: '/media/crm/agente' },
  { tipo: 'Ação',   titulo: 'Novo orçamento',          href: '/media/orcamentos' },
  { tipo: 'Página', titulo: 'Início',                  href: '/media' },
  { tipo: 'Página', titulo: 'CRM',                     href: '/media/crm' },
  { tipo: 'Página', titulo: 'Leads e pipeline',        href: '/media/crm/leads' },
  { tipo: 'Página', titulo: 'Calendário do ano',       href: '/media/calendario' },
  { tipo: 'Página', titulo: 'Finanças',                href: '/media/financas' },
  { tipo: 'Página', titulo: 'Portal Cliente',          href: '/media/portal-cliente' },
  { tipo: 'Página', titulo: 'Orçamentos',              href: '/media/orcamentos' },
  { tipo: 'Página', titulo: 'Proposta Criativa',       href: '/media/proposta-criativa' },
  { tipo: 'Página', titulo: 'Ficha de Cliente',        href: '/media/ficha-cliente' },
  { tipo: 'Página', titulo: 'Equipa',                  href: '/media/equipa' },
  { tipo: 'Página', titulo: 'Recursos Humanos',        href: '/media/recursos-humanos' },
  { tipo: 'Página', titulo: 'Formulário do cliente',   sub: 'Público, envia email',        href: '/media/crm/nova-lead' },
]

const semAcentos = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function PesquisaRapida() {
  const router = useRouter()
  const [aberta, setAberta] = useState(false)
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const [indice, setIndice] = useState<Item[] | null>(null)
  const campo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setAberta(a => !a) }
      if (e.key === 'Escape') setAberta(false)
    }
    window.addEventListener('keydown', tecla)
    return () => window.removeEventListener('keydown', tecla)
  }, [])

  useEffect(() => {
    if (!aberta) return
    setQ(''); setSel(0)
    setTimeout(() => campo.current?.focus(), 10)
    if (indice) return
    fetch('/api/media-pesquisa').then(r => r.ok ? r.json() : { leads: [], portais: [] }).then(d => {
      setIndice([
        ...(d.leads ?? []).map((l: any) => ({
          tipo: 'Lead' as const, titulo: l.empresa || l.nome || 'Lead',
          sub: [l.empresa ? l.nome : null, l.estado, l.ramo].filter(Boolean).join(' · '),
          href: `/media/crm/leads?lead=${l.id}`,
        })),
        ...(d.portais ?? []).map((p: any) => ({
          tipo: 'Portal' as const, titulo: p.nome || p.cliente || p.ref,
          sub: [p.ref, p.status].filter(Boolean).join(' · '),
          href: `/portal-media/${p.ref}`,
        })),
      ])
    }).catch(() => setIndice([]))
  }, [aberta, indice])

  const resultados = useMemo(() => {
    const todos = [...FIXOS, ...(indice ?? [])]
    const termo = semAcentos(q.trim())
    if (!termo) return FIXOS
    return todos.filter(i => semAcentos(`${i.titulo} ${i.sub ?? ''}`).includes(termo)).slice(0, 12)
  }, [q, indice])

  function ir(i: Item) {
    setAberta(false)
    if (i.tipo === 'Portal') window.open(i.href, '_blank')
    else router.push(i.href)
  }

  return (
    <>
      <button onClick={() => setAberta(true)} title="Pesquisar (Ctrl+K)"
        className="flex items-center gap-2 rounded-full border border-white/[0.12] px-3 py-1.5 text-[12px] text-white/55 hover:text-white hover:border-white/30 transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
        <span className="hidden lg:inline">Pesquisar</span> <span className="rlp-m hidden lg:inline text-[9px] text-white/35 tracking-[0.1em]">Ctrl K</span>
      </button>

      {aberta && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center bg-[#000d17]/70 px-4 pt-[12vh]" onClick={() => setAberta(false)}>
          <div className="rlp w-full max-w-xl rounded-2xl border border-white/[0.14] bg-[#00141f] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/[0.08] px-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#5a8bff]"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
              <input ref={campo} value={q} onChange={e => { setQ(e.target.value); setSel(0) }}
                onKeyDown={e => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, resultados.length - 1)) }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
                  if (e.key === 'Enter' && resultados[sel]) ir(resultados[sel])
                }}
                placeholder="Procurar leads, portais, páginas…"
                className="flex-1 bg-transparent py-4 text-[15px] text-white placeholder:text-white/35 focus:outline-none" />
              <span className="rlp-m text-[9px] text-white/35">Esc</span>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {resultados.map((i, n) => (
                <li key={`${i.tipo}-${i.href}-${n}`}>
                  <button onMouseEnter={() => setSel(n)} onClick={() => ir(i)}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left ${n === sel ? 'bg-[#2e6cf6]/20' : ''}`}>
                    <span className="rlp-m w-14 shrink-0 text-[9px] text-[#5a8bff]">{i.tipo}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] text-white/90">{i.titulo}</span>
                      {i.sub && <span className="block truncate text-[11.5px] text-white/45">{i.sub}</span>}
                    </span>
                    {n === sel && <span className="text-[12px] text-white/40">↵</span>}
                  </button>
                </li>
              ))}
              {resultados.length === 0 && <li className="px-3 py-6 text-center text-[13px] text-white/45">Nada encontrado.</li>}
              {q && indice === null && <li className="px-3 py-2 text-[12px] text-white/35">A carregar leads e portais…</li>}
            </ul>
          </div>
        </div>
      )}
    </>
  )
}
