'use client'

/* ============================================================
   DashboardClient: página inicial do Portal do Cliente RL PROD.
   Identidade do rlprod.pt (Saira Condensed, JetBrains Mono, azul #2E6CF6),
   fundo e letras vêm do layout. Hero + projeto + próximo passo + números +
   fase atual (o admin escolhe a fase) + pagamentos + workflow + menu +
   mosaico interno (só admin).
   ============================================================ */

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import type { Projeto } from '@/app/portal-media/_data/mockProject'

function detectActivePhase(projeto: Projeto): number {
  const emCurso = (projeto.fases ?? []).findIndex(f => f.estado === 'em_curso')
  if (emCurso >= 0) return emCurso
  const concluidas = (projeto.fases ?? []).filter(f => f.estado === 'concluido').length
  return Math.max(0, concluidas)
}

const MENU_ITEMS = [
  { num: '01', icon: 'workflow', name: 'Workflow',         desc: 'Fases do projeto',        slug: 'workflow' },
  { num: '02', icon: 'map',      name: 'Road Map',         desc: 'Planeamento e tarefas',   slug: 'roadmap' },
  { num: '03', icon: 'briefing', name: 'Briefing',         desc: 'Objetivos e referências', slug: 'briefing' },
  { num: '04', icon: 'doc',      name: 'Contrato & Dados', desc: 'Documentos e dados',      slug: 'contrato' },
  { num: '05', icon: 'pay',      name: 'Pagamentos',       desc: 'Estado financeiro',       slug: 'pagamentos' },
  { num: '06', icon: 'deliver',  name: 'Entregas',         desc: 'Ficheiros e revisões',    slug: 'entregas' },
  { num: '07', icon: 'support',  name: 'Atendimento',      desc: 'Equipa e contactos',      slug: 'atendimento' },
  { num: '08', icon: 'star',     name: 'Satisfação',       desc: 'Avaliação do projeto',    slug: 'satisfacao' },
] as const

const CARD = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/70'
const fmtEur = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export default function DashboardClient({ projeto, isAdmin }: { projeto: Projeto; isAdmin: boolean }) {
  const totalFases = (projeto.fases ?? []).length || 5
  const [active, setActive] = useState(detectActivePhase(projeto))

  // Escolha da fase pelo admin, guardada neste browser (como antes)
  useEffect(() => {
    if (!isAdmin) return
    try {
      const v = localStorage.getItem(`pcd-phase-${projeto.ref}`)
      if (v !== null) setActive(parseInt(v, 10))
    } catch { /* noop */ }
  }, [projeto.ref, isAdmin])

  const handleStepClick = (i: number) => {
    if (!isAdmin) return
    setActive(i)
    try { localStorage.setItem(`pcd-phase-${projeto.ref}`, String(i)) } catch { /* noop */ }
  }

  const fase = projeto.fases?.[active]
  const phaseName = fase?.nome ?? `Fase ${active + 1}`
  const proximaFase = projeto.fases?.[active + 1]?.nome ?? null
  const phasePct = Math.round(((active + 1) / totalFases) * 100)

  const pagamentos = projeto.pagamentos ?? []
  const valorTotal = pagamentos.reduce((s, p) => s + (p.valor ?? 0), 0)
  const valorPago = pagamentos.filter(p => p.estado === 'pago').reduce((s, p) => s + (p.valor ?? 0), 0)
  const valorPendente = valorTotal - valorPago
  const pctPago = valorTotal > 0 ? Math.round((valorPago / valorTotal) * 100) : 0
  const proxPagamento = pagamentos.find(p => p.estado !== 'pago')
  const emAtraso = pagamentos.some(p => (p.estado as string) === 'em_atraso')

  const local = projeto.local?.trim() ? projeto.local : null
  const filmagem = projeto.dataFilmagem?.trim() ? projeto.dataFilmagem : null
  const revUsadas = projeto.revisoes?.usadas ?? 0
  const revTotal = projeto.revisoes?.total ?? 3
  const entrega = projeto.dataEntrega?.trim() ? projeto.dataEntrega : null
  const base = `/portal-media/${projeto.ref}`

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-16">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative mt-4 sm:mt-6 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0c2236] aspect-[16/9] sm:aspect-[21/9]">
        {projeto.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={projeto.heroImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-rl-prod-branco.png" alt="" className="w-20 h-20 object-contain opacity-30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#00141f] via-[#00141f]/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8">
          <p className="rlp-m traco text-[10px] sm:text-[11px] text-[#5a8bff]">Portal do cliente · Produção de fotografia e vídeo</p>
          <h1 className="rlp-t mt-2 text-[34px] sm:text-[58px] leading-[0.95] break-words">{projeto.nome ?? projeto.cliente ?? 'O seu projeto'}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rlp-m inline-flex items-center gap-2 rounded-full border border-[#2e6cf6]/60 bg-[#2e6cf6]/[0.15] px-3 py-1.5 text-[9.5px] text-[#a9c1ff]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5a8bff] animate-pulse" />{projeto.status ?? 'Em produção'}
            </span>
            {projeto.cliente && projeto.cliente !== projeto.nome && <span className="text-[13px] text-white/60">{projeto.cliente}</span>}
          </div>
        </div>
      </section>

      {/* ── Próximo passo ────────────────────────────────────────── */}
      <section className={`${CARD} mt-4 p-5 sm:p-6 grid gap-4 sm:grid-cols-[1fr_auto] items-center`}>
        <div>
          <p className="rlp-m text-[9.5px] text-[#5a8bff]">Onde estamos</p>
          <p className="rlp-t mt-1.5 text-[24px] sm:text-[28px] leading-tight">{phaseName}</p>
          <p className="mt-1 text-[14px] text-white/60">
            {fase?.descricao || 'A equipa RL PROD está a trabalhar nesta fase.'}
            {proximaFase && <> A seguir: <span className="text-white/85">{proximaFase}</span>.</>}
          </p>
        </div>
        <Link href={`${base}/atendimento`}
          className="rlp-t inline-flex items-center justify-center gap-2 rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-6 py-3 text-[17px] tracking-[0.05em] transition-colors"
          style={{ boxShadow: '0 10px 30px -10px rgba(46,108,246,0.7)' }}>
          Falar com a equipa →
        </Link>
      </section>

      {/* ── Números ──────────────────────────────────────────────── */}
      <section className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { k: 'Local', v: local, vazio: 'Por definir' },
          { k: 'Filmagem', v: filmagem, vazio: 'Sem data' },
          { k: 'Revisões', v: `${revUsadas} de ${revTotal}`, vazio: '' },
          { k: 'Entrega final', v: entrega, vazio: 'Sem data' },
        ].map(s => (
          <div key={s.k} className={`${CARD} px-5 py-4`}>
            <p className="rlp-m text-[9.5px] text-white/45">{s.k}</p>
            <p className={`mt-2 text-[17px] sm:text-[19px] font-medium truncate ${s.v ? 'text-white' : 'text-white/35 italic'}`}>{s.v ?? s.vazio}</p>
          </div>
        ))}
      </section>

      {/* ── Fase atual ───────────────────────────────────────────── */}
      <section className={`${CARD} mt-4 p-5 sm:p-6`}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="rlp-m traco text-[10px] text-[#5a8bff]">Fase atual</p>
            <p className="rlp-t mt-1.5 text-[22px]">{phaseName}</p>
          </div>
          <span className="rlp-t text-[40px] leading-none text-[#5a8bff]">{phasePct}%</span>
        </div>
        {isAdmin && <p className="mt-2 text-[12px] text-white/45">Clica numa fase para definir a fase atual.</p>}

        <div className="mt-5 -mx-1 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-1.5 px-1">
            {Array.from({ length: totalFases }).map((_, i) => {
              const nome = projeto.fases?.[i]?.nome ?? `Fase ${i + 1}`
              const feito = i < active
              const atual = i === active
              return (
                <button key={i} type="button" onClick={() => handleStepClick(i)} disabled={!isAdmin}
                  className={`w-[92px] sm:w-[104px] shrink-0 rounded-xl border px-2.5 py-2.5 text-left transition-colors ${atual ? 'border-[#2e6cf6] bg-[#2e6cf6]/[0.15]' : feito ? 'border-[#2e6cf6]/30 bg-[#0c2236]/60' : 'border-white/[0.07] bg-transparent'} ${isAdmin ? 'cursor-pointer hover:border-[#5a8bff]' : 'cursor-default'}`}>
                  <span className={`rlp-t block text-[15px] ${atual ? 'text-[#5a8bff]' : feito ? 'text-[#2e6cf6]' : 'text-white/30'}`}>
                    {feito ? '✓' : String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={`block mt-1 text-[11px] leading-tight ${atual ? 'text-white' : feito ? 'text-white/70' : 'text-white/40'}`}>{nome}</span>
                </button>
              )
            })}
          </div>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
          <div className="h-full rounded-full bg-[#2e6cf6] transition-all duration-700" style={{ width: `${phasePct}%` }} />
        </div>
      </section>

      {/* ── Pagamentos + Workflow ────────────────────────────────── */}
      <section className="mt-4 grid gap-3 md:grid-cols-2">
        <Link href={`${base}/pagamentos`} className={`${CARD} group p-5 sm:p-6 hover:border-[#2e6cf6]/60 transition-colors`}>
          <div className="flex items-center justify-between">
            <p className="rlp-m traco text-[10px] text-[#5a8bff]">Pagamentos</p>
            <span className="text-[12px] text-white/45 group-hover:text-[#5a8bff]">Ver tudo →</span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <span className="rlp-t text-[44px] leading-none">{pctPago}<span className="text-[22px] text-white/45">%</span></span>
            <span className="text-right text-[12.5px] text-white/55">pago de {fmtEur(valorTotal)}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/[0.07] overflow-hidden">
            <div className="h-full rounded-full bg-[#2e6cf6]" style={{ width: `${pctPago}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-[13px]">
            <div className="rounded-xl bg-[#0c2236]/70 px-3 py-2.5">
              <p className="rlp-m text-[9px] text-white/45">Pago</p>
              <p className="mt-1 text-white">{fmtEur(valorPago)}</p>
            </div>
            <div className="rounded-xl bg-[#0c2236]/70 px-3 py-2.5">
              <p className="rlp-m text-[9px] text-white/45">Em falta</p>
              <p className={`mt-1 ${emAtraso ? 'text-[#ff4747]' : 'text-white'}`}>{fmtEur(valorPendente)}</p>
            </div>
          </div>
          {proxPagamento && (
            <p className="mt-3 text-[12.5px] text-white/55">
              Próximo: <span className="text-white/85">{proxPagamento.descricao}</span>{proxPagamento.data ? ` · ${proxPagamento.data}` : ''}
            </p>
          )}
        </Link>

        <Link href={`${base}/workflow`} className={`${CARD} group p-5 sm:p-6 hover:border-[#2e6cf6]/60 transition-colors`}>
          <div className="flex items-center justify-between">
            <p className="rlp-m traco text-[10px] text-[#5a8bff]">Workflow</p>
            <span className="text-[12px] text-white/45 group-hover:text-[#5a8bff]">Ver tudo →</span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <span className="rlp-t text-[44px] leading-none">{active + 1}<span className="text-[22px] text-white/45"> / {totalFases}</span></span>
            <span className="text-right text-[12.5px] text-white/55">fases</span>
          </div>
          <div className="mt-4 flex items-center">
            {Array.from({ length: totalFases }).map((_, i) => (
              <span key={i} className="flex items-center flex-1 last:flex-none">
                <span className={`w-2.5 h-2.5 shrink-0 rounded-full ${i < active ? 'bg-[#2e6cf6]' : i === active ? 'bg-[#5a8bff] ring-4 ring-[#5a8bff]/20' : 'bg-white/15'}`} />
                {i < totalFases - 1 && <span className={`h-px flex-1 ${i < active ? 'bg-[#2e6cf6]' : 'bg-white/10'}`} />}
              </span>
            ))}
          </div>
          <p className="mt-4 text-[13px] text-white/60">Fase atual: <span className="text-white/90">{phaseName}</span></p>
        </Link>
      </section>

      {/* ── Menu ─────────────────────────────────────────────────── */}
      <p className="rlp-m traco mt-10 mb-3 text-[10.5px] text-[#5a8bff]">O seu portal</p>
      <nav className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {MENU_ITEMS.map(item => (
          <Link key={item.slug} href={`${base}/${item.slug}`}
            className={`${CARD} group p-4 sm:p-5 hover:border-[#2e6cf6]/70 hover:-translate-y-0.5 transition-all`}>
            <div className="flex items-start justify-between">
              <span className="w-10 h-10 rounded-full flex items-center justify-center border border-[#2e6cf6]/40 bg-[#2e6cf6]/[0.1] text-[#5a8bff] group-hover:bg-[#2e6cf6] group-hover:text-white transition-colors">
                <MenuIcon name={item.icon} />
              </span>
              <span className="rlp-m text-[9.5px] text-white/30">{item.num}</span>
            </div>
            <p className="rlp-t mt-4 text-[18px] tracking-[0.02em] leading-tight">{item.name}</p>
            <p className="mt-0.5 text-[12.5px] text-white/50">{item.desc}</p>
          </Link>
        ))}
      </nav>

      {isAdmin && (
        <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link href={`${base}/reproducao`}
            className="relative rounded-2xl border border-dashed border-[#a9c1ff]/40 bg-[#0c2236]/60 p-4 sm:p-5 hover:border-[#a9c1ff] transition-colors">
            <span className="rlp-m absolute top-3 right-3 rounded-full border border-[#a9c1ff]/60 px-2 py-0.5 text-[8.5px] text-[#a9c1ff]">Interno</span>
            <span className="w-10 h-10 rounded-full flex items-center justify-center border border-[#a9c1ff]/40 text-[#a9c1ff]"><IcFilm /></span>
            <p className="rlp-t mt-4 text-[18px] leading-tight">Reprodução</p>
            <p className="mt-0.5 text-[12.5px] text-white/50">Storytelling · Storyboard · Moodboard</p>
          </Link>
        </div>
      )}

      {/* ── Boas-vindas (curto, no fim) ──────────────────────────── */}
      <section className={`${CARD} mt-10 p-5 sm:p-6`}>
        <p className="rlp-m traco text-[10px] text-[#5a8bff]">Bem-vindo</p>
        <p className="mt-3 text-[14.5px] leading-relaxed text-white/70 max-w-3xl">
          Aqui encontra tudo sobre o andamento do seu projeto: as fases e o que vem a seguir, os pagamentos, os documentos, as entregas e o contacto direto com a equipa. Este portal existe para garantir <span className="text-white">transparência, confiança e proximidade</span> durante todo o processo. Obrigado pela confiança na RL PROD.
        </p>
      </section>
    </div>
  )
}

/* ── Ícones (SVG inline) ─────────────────────────────────────── */
function S(children: ReactNode, sw: number = 1.7, w: number = 18) {
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  )
}

const IcFilm = () => S(<><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M3 9h18M3 15h18M8 4v16M16 4v16" /></>, 1.6, 18)

function MenuIcon({ name }: { name: string }) {
  switch (name) {
    case 'workflow': return S(<><circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="12" r="2.5" /><path d="M8.4 6.8 15.6 11M8.4 17.2 15.6 13" /></>, 1.6)
    case 'map':      return S(<><path d="M9 4 4 6.5v13l5-2.5 6 2.5 5-2.5v-13L15 6.5 9 4Z" /><path d="M9 4v13M15 6.5v13" /></>, 1.6)
    case 'briefing': return S(<><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M9 8h6M9 12h6M9 16h3" /></>, 1.6)
    case 'doc':      return S(<><path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4h4M9 13h6M9 17h6" /></>, 1.6)
    case 'pay':      return S(<><rect x="3" y="6" width="18" height="12" rx="2.5" /><path d="M3 10h18" /><path d="M7 14.5h3" /></>, 1.6)
    case 'deliver':  return S(<><path d="M3.5 8 12 4l8.5 4-8.5 4-8.5-4Z" /><path d="M3.5 8v8L12 20l8.5-4V8M12 12v8" /></>, 1.6)
    case 'support':  return S(<><path d="M4.5 13a7.5 7.5 0 0 1 15 0" /><rect x="3" y="13" width="3.5" height="6" rx="1.5" /><rect x="17.5" y="13" width="3.5" height="6" rx="1.5" /><path d="M19 19v.5a2.5 2.5 0 0 1-2.5 2.5H12" /></>, 1.6)
    case 'star':     return S(<path d="M12 3.5 14.6 9l6 .7-4.5 4.1 1.3 5.9L12 16.7 6.6 19.7l1.3-5.9L3.4 9.7l6-.7L12 3.5Z" />, 1.6)
    default:         return null
  }
}
