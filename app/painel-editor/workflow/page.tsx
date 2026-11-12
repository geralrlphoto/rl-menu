'use client'

// Painel do Editor › Workflow: o fluxo de trabalho do filme com as regras atuais do
// Departamento de Edição de Vídeo (lib/videoEstado.ts):
//   Aguardar → Em Edição → Em Revisão são do editor; Finalizado e Entregue são da RL.
// O estado de cada trabalho vem do evento (o mesmo que o departamento usa), por isso
// esta página está sempre igual ao Departamento de Vídeo e à página Projetos.

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { NotificationBell } from '../_components/NotificationBell'
import { MessagesBell } from '../_components/MessagesBell'
import { BrandLogo } from '../_components/BrandLogo'
import { getEditorId } from '../_data/freelancer-profile'
import { PainelUserCard } from '@/app/components/PainelUserCard'

const OURO = '#C9A84C'

type Estado = 'Aguardar' | 'Em Edição' | 'Em Revisão' | 'Finalizado' | 'Entregue'
type Quem = 'Automático' | 'Tu' | 'RL'

// ── As 5 etapas do filme ─────────────────────────────────────────────────
const ETAPAS: { e: Estado; quem: Quem; titulo: string; texto: string }[] = [
  { e: 'Aguardar', quem: 'Automático', titulo: 'Foste nomeado', texto: 'Recebes o Ticket de Edição e o projeto aparece no painel. O download do material ainda está bloqueado.' },
  { e: 'Em Edição', quem: 'Tu', titulo: 'Estás a editar', texto: 'Mudas tu para Em Edição: o download fica ativo. Volta aqui sempre que a RL pede alterações.' },
  { e: 'Em Revisão', quem: 'Tu', titulo: 'A RL está a rever', texto: 'Só acontece quando envias o link de revisão (Frame.io) no projeto.' },
  { e: 'Finalizado', quem: 'RL', titulo: 'Filme aprovado', texto: 'A RL aprovou e avaliou o filme. Envias a versão final em Entrega do Projeto.' },
  { e: 'Entregue', quem: 'RL', titulo: 'Chegou aos noivos', texto: 'A RL entregou o filme no portal dos noivos. O projeto fica concluído.' },
]

// ── As regras e os métodos de trabalho ───────────────────────────────────
const REGRAS: { t: string; itens: string[] }[] = [
  { t: 'Prazos', itens: [
    'Confirmas o projeto em até 2 dias, abrindo-o no painel.',
    'Teaser / Trailer: objetivo de 4 semanas depois do casamento.',
    'Filme completo: 180 dias úteis depois do casamento. A data está no Ticket de Edição e no projeto.',
    'A 30 dias do prazo, a RL recebe um alerta para acompanhar o filme contigo.',
  ] },
  { t: 'Material', itens: [
    'O link de download e o Relatório Diário da equipa estão no projeto, em Material e Relatório da RL.',
    'O download só abre com o vídeo Em Edição.',
    'Lê o Relatório Diário antes de começares: áudio, drone, máquinas, problemas técnicos e informação do dia.',
  ] },
  { t: 'Revisão', itens: [
    'Para enviar, colas o link Frame.io em Revisão do Vídeo, dentro do projeto.',
    'O vídeo só passa a Em Revisão com o link. Não há outra forma.',
    'Se a RL pedir alterações, o vídeo volta a Em Edição e as notas aparecem no projeto e no sino.',
  ] },
  { t: 'Aprovação e avaliação', itens: [
    'Cada filme aprovado é avaliado pela RL de 1 a 5 em Ritmo, Cor, Áudio e História, com notas para ti.',
    'A avaliação aparece no cartão do projeto e recebes um aviso no sino.',
    'As avaliações contam para o ranking dos editores da RL.',
  ] },
  { t: 'Entrega', itens: [
    'Depois de aprovado, exportas o master em alta qualidade.',
    'Colas o link em Entrega do Projeto (Drive, WeTransfer, Frame.io ou Vimeo).',
    'Guardas o projeto e o master no NAS.',
    'A entrega aos noivos é feita pela RL, no portal deles.',
  ] },
  { t: 'Noivos e pagamento', itens: [
    'Em cada mudança de etapa, os noivos recebem o Ticket do Filme com o ponto em que o filme está.',
    'Cada trabalho cria um pagamento A receber em Pagamentos; passa a Recebido quando a RL paga.',
    'Dúvidas sobre um casamento: usa as mensagens do próprio projeto.',
  ] },
]

const corQuem = (q: Quem) => (q === 'Tu' ? OURO : q === 'RL' ? '#f0e8d8' : '#8a8a8a')
const ROTULO_QUEM: Record<Quem, string> = { 'Tu': 'Mudas tu', 'RL': 'Muda a RL', 'Automático': 'Automático' }

// Fase guardada no painel (freelancers.editor_workflow) → estado do vídeo
function estadoDaFase(fase: string): Estado {
  const s = (fase || '').trim()
  if (!s || s === 'Novo' || s === 'Novo Projeto') return 'Aguardar'
  if (s === 'Entregue') return 'Entregue'
  if (s === 'Finalizado') return 'Finalizado'
  if (s === 'Para Revisão' || s === 'Correções') return 'Em Revisão'
  return 'Em Edição'
}
function isoToPt(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('T')[0].split('-')
  return y && m && d ? `${d}/${m}/${y}` : ''
}
function diasAte(pt: string): number | null {
  const [d, m, y] = (pt || '').split(' ')[0].split('/').map(Number)
  if (!d || !m || !y) return null
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  return Math.round((new Date(y, m - 1, d).getTime() - hoje.getTime()) / 86400000)
}

type Trabalho = {
  key: string; referencia: string | null; eventoId: string | null
  noivos: string; local: string; enviado: string; prazo: string
  estado: Estado; media: number | null
}

function paraTrabalho(j: any, wf: Record<string, string>, i: number): Trabalho | null {
  const o = (j.overrides && typeof j.overrides === 'object') ? j.overrides : {}
  if (o.archived) return null
  const key = j.referencia || j.notifId || String(i)
  const a = j.avaliacao
  const vals = a ? [a.ritmo, a.cor, a.audio, a.historia].filter((v: any) => typeof v === 'number') : []
  return {
    key,
    referencia: j.referencia ?? null,
    eventoId: j.evento_id ?? null,
    noivos: o.noivos || j.noivos || j.local || 'Evento',
    local: o.local || j.local || '',
    enviado: (o.recebido || '').split('—')[0].trim() || isoToPt(j.sentAt || ''),
    prazo: o.entregaPrevista || isoToPt(j.prazoVideo || ''),
    estado: (j.videoEstado as Estado) || estadoDaFase(wf[key] || ''),
    media: vals.length ? Math.round(vals.reduce((x: number, y: number) => x + y, 0) / vals.length * 10) / 10 : null,
  }
}

function Workflow() {
  const [trabalhos, setTrabalhos] = useState<Trabalho[]>([])
  const [carregado, setCarregado] = useState(false)
  const [editorId, setEditorId] = useState<string | null>(null)

  useEffect(() => {
    const id = getEditorId()
    setEditorId(id)
    if (!id) { setCarregado(true); return }
    let cancelado = false
    Promise.all([
      fetch(`/api/painel-editor/projetos?freelancer=${id}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/painel-editor/workflow?freelancer=${id}`).then(r => r.json()).catch(() => ({})),
    ]).then(([p, w]) => {
      if (cancelado) return
      const jobs: any[] = Array.isArray(p?.jobs) ? p.jobs : []
      const wf: Record<string, string> = (w?.workflow && typeof w.workflow === 'object') ? w.workflow : {}
      setTrabalhos(jobs.map((j, i) => paraTrabalho(j, wf, i)).filter((t): t is Trabalho => !!t))
      setCarregado(true)
    })
    return () => { cancelado = true }
  }, [])

  const comId = (href: string) => (editorId ? `${href}${href.includes('?') ? '&' : '?'}freelancer=${editorId}` : href)

  const contagem = useMemo(() => {
    const c = Object.fromEntries(ETAPAS.map(x => [x.e, 0])) as Record<Estado, number>
    trabalhos.forEach(t => { c[t.estado]++ })
    return c
  }, [trabalhos])

  // Por fazer primeiro (prazo mais próximo), entregues no fim
  const ordenados = useMemo(() => [...trabalhos].sort((a, b) => {
    const fa = a.estado === 'Entregue' ? 1 : 0, fb = b.estado === 'Entregue' ? 1 : 0
    if (fa !== fb) return fa - fb
    return (diasAte(a.prazo) ?? 99999) - (diasAte(b.prazo) ?? 99999)
  }), [trabalhos])

  // Aguardar → Em Edição é o único passo que o editor dá aqui; a revisão faz-se
  // no projeto, com o link (regra do departamento).
  function comecarEdicao(t: Trabalho) {
    if (!editorId) return
    setTrabalhos(prev => prev.map(x => x.key === t.key ? { ...x, estado: 'Em Edição' } : x))
    fetch('/api/painel-editor/workflow', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freelancer: editorId, referencia: t.key, stage: 'Em Edição' }),
    }).catch(() => {})
    if (t.referencia) fetch('/api/painel-editor/sync-video-estado', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ freelancer: editorId, referencia: t.referencia, evento_id: t.eventoId, stage: 'Em Edição', local: t.local || t.noivos, data_casamento: null }),
    }).catch(() => {})
  }

  return (
    <div className="min-h-screen text-white relative" style={{ background: '#070707' }}>
      <Sidebar />
      <main className="painel-main relative z-10 pl-[250px]">
        <div className="px-6 sm:px-8 py-6 max-w-[1500px] mx-auto">

          {/* ── CAPA ─────────────────────────────────────────────────── */}
          <section className="relative -mx-6 sm:-mx-8 -mt-6 mb-10 min-h-[440px] lg:min-h-[54vh] flex flex-col overflow-hidden border-b border-[#C9A84C]/15">
            <div className="absolute inset-y-0 right-0 w-full lg:w-[62%]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/email/equipa-camera.jpg" alt="" className="absolute inset-0 w-full h-full object-cover object-center grayscale opacity-35 lg:opacity-55" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
            </div>
            <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
            <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
              Equipa RL · {new Date().getFullYear()}
            </p>

            <div className="painel-hero-linha relative z-20 flex justify-end px-5 sm:px-8 pt-5 min-h-[56px]">
              <div className="painel-acoes painel-acoes-topo flex items-center gap-3 shrink-0">
                <NotificationBell />
                <MessagesBell />
              </div>
            </div>

            <div className="relative flex-1 grid grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_380px] gap-10 items-end pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pb-10 lg:pb-14">
              <div className="min-w-0">
                <Link href={comId('/painel-editor')} className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ O meu painel</Link>
                <p className="text-[13px] sm:text-[17px] font-bold tracking-[0.5em] uppercase text-[#C9A84C] mt-10">RL Photo.Video</p>
                <h1 className="font-bold uppercase text-white leading-[0.88] text-[54px] sm:text-[100px] lg:text-[124px] mt-2">Workflow</h1>
                <div className="flex items-center gap-4 mt-5">
                  <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
                  <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">Como <span className="text-[#C9A84C]">trabalhamos</span></p>
                </div>
                <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-xl">
                  As etapas do filme, quem muda cada uma e as regras do Departamento de Edição de Vídeo. Os teus trabalhos estão sempre no estado em que a RL os vê.
                </p>
              </div>

              <aside className="rounded-[22px] border border-[#C9A84C]/30 bg-[#111111]/80 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(201,168,76,0.5)]">
                <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_#C9A84C]" />
                  Os teus trabalhos
                </p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { l: 'Por começar', v: contagem['Aguardar'] },
                    { l: 'Em edição', v: contagem['Em Edição'], ouro: true },
                    { l: 'Em revisão', v: contagem['Em Revisão'] + contagem['Finalizado'] },
                    { l: 'Entregues', v: contagem['Entregue'] },
                  ].map(x => (
                    <div key={x.l} className="rounded-[14px] border border-white/[0.08] bg-black/30 px-3.5 py-3">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">{x.l}</p>
                      <p className={`font-semibold text-[24px] leading-none mt-1.5 ${x.ouro ? 'text-[#C9A84C]' : 'text-white'}`}>{x.v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-white/40 mt-3">Filme: 180 dias úteis depois do casamento</p>
              </aside>
            </div>
          </section>

          {/* ── AS ETAPAS ────────────────────────────────────────────── */}
          <Titulo>As etapas do filme</Titulo>
          <ol className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 230px), 1fr))' }}>
            {ETAPAS.map((x, i) => (
              <li key={x.e} className="rounded-[18px] border border-white/[0.08] bg-[#111111] p-5 flex flex-col" style={{ borderLeft: `2px solid ${corQuem(x.quem)}` }}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-[34px] leading-none text-[#C9A84C]/80 tabular-nums">0{i + 1}</p>
                  <span className="rounded-full px-2.5 py-0.5 text-[10px] tracking-[0.2em] uppercase"
                    style={{ color: corQuem(x.quem), background: corQuem(x.quem) + '1f', border: `1px solid ${corQuem(x.quem)}55` }}>{ROTULO_QUEM[x.quem]}</span>
                </div>
                <p className="font-bold uppercase text-white text-[20px] mt-4">{x.e}</p>
                <p className="text-[12px] tracking-[0.15em] uppercase text-white/45 mt-0.5">{x.titulo}</p>
                <p className="text-[13px] text-white/60 mt-3 leading-relaxed flex-1">{x.texto}</p>
                <p className="text-[11px] tracking-[0.2em] uppercase text-white/35 mt-4">{contagem[x.e]} {contagem[x.e] === 1 ? 'trabalho' : 'trabalhos'}</p>
              </li>
            ))}
          </ol>
          <p className="text-[13px] text-white/45 mt-4">Em cada mudança de etapa, os noivos recebem o Ticket do Filme. Se a RL pedir alterações, o vídeo volta de Em Revisão para Em Edição.</p>

          {/* ── OS MEUS TRABALHOS ────────────────────────────────────── */}
          <Titulo>Os teus trabalhos</Titulo>
          {!carregado ? (
            <Vazio>A carregar trabalhos…</Vazio>
          ) : ordenados.length === 0 ? (
            <Vazio>Ainda não tens trabalhos da RL.</Vazio>
          ) : (
            <div className="grid gap-3">
              {ordenados.map(t => {
                const dias = t.estado === 'Entregue' ? null : diasAte(t.prazo)
                const atrasado = dias !== null && dias < 0
                const perto = dias !== null && dias >= 0 && dias <= 30
                return (
                  <div key={t.key} className="rounded-[18px] border border-white/[0.08] bg-[#111111] px-5 py-4 grid gap-4 items-center lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto]"
                    style={{ borderLeft: `2px solid ${t.estado === 'Entregue' ? '#3a3a3a' : OURO}` }}>
                    <div className="min-w-0">
                      <p className="font-bold uppercase text-white text-[17px] truncate">{t.noivos}</p>
                      {t.local && <p className="text-[12px] text-white/45 truncate">📍 {t.local}</p>}
                    </div>
                    <Dado l="Etapa" v={t.estado} ouro />
                    <Dado l="Enviado p/ edição" v={t.enviado || '—'} />
                    <div className="min-w-0">
                      <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">Prazo do filme</p>
                      <p className="text-[14px] text-white/85 mt-0.5">{t.prazo || '—'}
                        {dias !== null && (
                          <span className={`ml-2 text-[11px] ${atrasado ? 'text-[#e07a6a]' : perto ? 'text-[#C9A84C]' : 'text-white/40'}`}>
                            {atrasado ? `${-dias} d. em atraso` : dias === 0 ? 'hoje' : `faltam ${dias} d.`}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 lg:justify-end flex-wrap">
                      {t.media !== null && <span className="text-[13px] text-white/80 mr-1">★ {t.media}</span>}
                      {t.estado === 'Aguardar' && (
                        <button onClick={() => comecarEdicao(t)}
                          className="rounded-full border border-[#C9A84C]/70 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/30 px-4 py-2 text-[12px] font-semibold tracking-[0.15em] uppercase text-white transition-all">
                          Começar edição
                        </button>
                      )}
                      <Link href={comId(`/painel-editor/novos-projetos?open=${encodeURIComponent(t.key)}`)}
                        className="rounded-full border border-white/15 hover:border-[#C9A84C]/60 px-4 py-2 text-[12px] font-semibold tracking-[0.15em] uppercase text-white/80 transition-all">
                        {t.estado === 'Em Edição' ? 'Enviar revisão →' : 'Abrir →'}
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── AS REGRAS ────────────────────────────────────────────── */}
          <Titulo>As regras e os métodos de trabalho</Titulo>
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}>
            {REGRAS.map(r => (
              <div key={r.t} className="rounded-[18px] border border-white/[0.08] bg-[#111111] p-5" style={{ borderLeft: `2px solid ${OURO}` }}>
                <p className="font-bold uppercase text-white text-[18px]">{r.t}</p>
                <ul className="mt-3 space-y-2">
                  {r.itens.map((it, i) => (
                    <li key={i} className="flex gap-3 text-[13px] text-white/65 leading-relaxed">
                      <span className="mt-[7px] w-1.5 h-1.5 rounded-full bg-[#C9A84C] shrink-0" />{it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-[13px] text-white/45 mt-6">
            O processo completo, passo a passo, está no <Link href={comId('/painel-editor/guia')} className="text-[#C9A84C] hover:underline">Guia do Portal</Link>.
          </p>

          <p className="text-center text-[10px] tracking-[0.4em] uppercase text-white/15 mt-16 mb-4">RL Photo.Video · Workflow</p>
        </div>
      </main>
    </div>
  )
}

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 mt-14 mb-6">
      <span className="w-10 h-px bg-[#C9A84C]" />
      <h2 className="text-[15px] sm:text-[18px] font-bold tracking-[0.3em] uppercase text-white">{children}</h2>
    </div>
  )
}
function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-dashed border-white/[0.1] bg-[#111111]/60 text-center py-14">
      <p className="text-[13px] tracking-[0.3em] uppercase text-white/35">{children}</p>
    </div>
  )
}
function Dado({ l, v, ouro }: { l: string; v: string; ouro?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] tracking-[0.2em] uppercase text-white/40">{l}</p>
      <p className={`text-[14px] mt-0.5 truncate ${ouro ? 'text-[#C9A84C] font-semibold uppercase tracking-[0.1em]' : 'text-white/85'}`}>{v}</p>
    </div>
  )
}

const NAV_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',           icon: '⌂', href: '/painel-editor' },
  { key: 'novos',       label: 'Projetos',            icon: '+', href: '/painel-editor/novos-projetos' },
  { key: 'pagamentos',  label: 'Pagamentos',          icon: '€', href: '/painel-editor/pagamentos' },
  { key: 'tarefas',     label: 'Tarefas',             icon: '◷', href: '/painel-editor/tarefas' },
  { key: 'calendario',  label: 'Calendário',          icon: '◉', href: '/painel-editor/calendario' },
  { key: 'workflow',    label: 'Workflow',            icon: '☰', href: '/painel-editor/workflow', active: true },
  { key: 'biblioteca',  label: 'Biblioteca',          icon: '♪', href: '/painel-editor/musicas' },
  { key: 'dados',       label: 'Dados Pessoais',      icon: '☻', href: '/painel-editor/dados-pessoais' },
  { key: 'guia',        label: 'Guia do Portal',      icon: '?', href: '/painel-editor/guia' },
]

function Sidebar() {
  return (
    <aside className="painel-sidebar flex fixed top-0 left-0 bottom-0 w-[250px] z-30 flex-col"
      style={{ background: '#0b0b0b', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      <BrandLogo />
      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
        {NAV_ITEMS.map(it => {
          const isActive = !!it.active
          return (
            <Link key={it.key} href={it.href}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all group ${
                isActive ? 'bg-gold/10 border border-gold/30 text-gold' : 'border border-transparent text-white/45 hover:text-white/90 hover:bg-white/[0.03]'
              }`}>
              <span className={`w-5 text-center text-base ${isActive ? 'text-gold' : 'text-white/35 group-hover:text-white/70'}`}>{it.icon}</span>
              <span className="text-[13px] font-medium tracking-wide">{it.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-3 border-t border-white/[0.04]">
        <PainelUserCard />
      </div>
    </aside>
  )
}

export default function WorkflowPage() {
  return (
    <Suspense fallback={null}>
      <Workflow />
    </Suspense>
  )
}
