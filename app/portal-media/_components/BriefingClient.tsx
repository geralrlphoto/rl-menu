'use client'
/* ============================================================
   BriefingClient: identidade rlprod.pt (classes rlp / rlp-t / rlp-m
   do layout, fundo vem do layout).
   - Cabeçalho com resumo de sessões + "Resumo" (print) e Agendar/Pedir
   - Secções numeradas: Próxima sessão (countdown), O que é o Briefing,
     Histórico de sessões (expansíveis), Estado da fase
   - Modal de agendamento (admin agenda, cliente pede)

   Lógica preservada: saveData, confirmSchedule, aprovar/recusar,
   update, eliminar, notificar, handleSave, AdminBar. Edição,
   Notificar e Eliminar só aparecem para isAdmin.
   ============================================================ */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Projeto, BriefingSessao } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import HeroUploadBlock from './HeroUploadBlock'
import CampoDataPT from '@/app/media/_components/CampoDataPT'

/** Link Google Meet partilhado da RL PROD (mesmo do /api/send-reuniao-email) */
const MEET_LINK = 'https://meet.google.com/dih-etvh-xkh'
/** Link Maps p/ a morada do atelier */
const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video/@38.7071885,-9.1450227,17z'

const MONTHS = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ']
const MONTHS_LONG = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

interface Props { projeto: Projeto; isAdmin: boolean }

export default function BriefingClient({ projeto: initial, isAdmin }: Props) {
  const [sessoes, setSessoes] = useState<BriefingSessao[]>(initial.briefingSessoes ?? [])
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [heroUrl, setHeroUrl] = useState(initial.briefingImageUrl ?? '')
  const [notifying, setNotifying] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  /* Modal de agendamento de nova sessão (admin) */
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [schedDate, setSchedDate]       = useState('')
  const [schedTime, setSchedTime]       = useState('')
  const [schedTitle, setSchedTitle]     = useState('')
  const [schedTipo, setSchedTipo]       = useState<'videochamada' | 'presencial'>('videochamada')
  const [schedLocal, setSchedLocal]     = useState('')
  const [schedSaving, setSchedSaving]   = useState(false)

  /* ── Persistência ─────────────────────────────────────────── */
  const saveData = async (updated?: BriefingSessao[]) => {
    await fetch(`/api/media-portal/${initial.ref}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        briefingSessoes: updated ?? sessoes,
        briefingImageUrl: heroUrl,
      }),
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try { await saveData() } catch {}
    setSaving(false)
    setIsEditing(false)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2500)
  }

  const cancel = () => {
    setSessoes(initial.briefingSessoes ?? [])
    setHeroUrl(initial.briefingImageUrl ?? '')
    setIsEditing(false)
  }

  /* ── Sessões CRUD ────────────────────────────────────────── */
  /** Abre o modal de agendamento de uma nova sessão. Default da
   *  data = hoje; sugere "Sessão de briefing #N" como título. */
  const openSchedule = () => {
    const today = new Date().toISOString().split('T')[0]
    setSchedDate(today)
    setSchedTime('15:00')
    setSchedTitle(isAdmin
      ? `Sessão de briefing #${sessoes.length + 1}`
      : `Pedido de sessão #${sessoes.length + 1}`)
    setSchedTipo('videochamada')
    setSchedLocal('')
    setScheduleOpen(true)
  }

  const closeSchedule = () => {
    if (schedSaving) return
    setScheduleOpen(false)
  }

  /** Cria a sessão com a data + hora escolhidas e persiste imediatamente
   *  no Supabase via PATCH.
   *  - Admin: cria como 'agendada' (confirmada).
   *  - Cliente: cria como 'pendente' + dispara notificação ao admin. */
  const confirmSchedule = async () => {
    if (!schedDate || !schedTitle.trim()) return
    setSchedSaving(true)
    const estado: BriefingSessao['estado'] = isAdmin ? 'agendada' : 'pendente'
    const nova: BriefingSessao = {
      id: Date.now().toString(),
      titulo: schedTitle.trim(),
      data: schedDate,
      hora: schedTime || undefined,
      resumo: '',
      objetivos: [],
      tom: [],
      notas: '',
      estado,
      pedidoPor: isAdmin ? 'admin' : 'cliente',
      tipo: schedTipo,
      local: schedTipo === 'presencial' ? (schedLocal.trim() || undefined) : undefined,
    }
    const updated = [nova, ...sessoes]
    setSessoes(updated)
    try { await saveData(updated) } catch {}

    // Cliente: dispara notificação ao admin
    if (!isAdmin) {
      const horaTxt = schedTime ? ` · ${schedTime.replace(':', 'h')}` : ''
      const tipoTxt = schedTipo === 'presencial'
        ? ` · Presencial${schedLocal.trim() ? ` (${schedLocal.trim()})` : ''}`
        : ' · Videochamada'
      fetch(`/api/media-portal/${initial.ref}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'briefing-pedido',
          title: 'Pedido de sessão de briefing',
          body: `${schedTitle.trim()} — ${fmtFullDate(schedDate)}${horaTxt}${tipoTxt}`,
          meta: {
            sessaoId: nova.id,
            data: schedDate,
            hora: schedTime || null,
            titulo: schedTitle.trim(),
            tipo: schedTipo,
            local: schedLocal.trim() || null,
          },
        }),
      }).catch(() => {})
    }

    setSchedSaving(false)
    setScheduleOpen(false)
  }

  /** Admin: confirma um pedido pendente do cliente. */
  const aprovarPedido = async (id: string) => {
    const updated = sessoes.map(s => s.id === id ? { ...s, estado: 'agendada' as const } : s)
    setSessoes(updated)
    try { await saveData(updated) } catch {}
  }
  /** Admin: recusa um pedido pendente (elimina a sessão). */
  const recusarPedido = async (id: string) => {
    const updated = sessoes.filter(s => s.id !== id)
    setSessoes(updated)
    try { await saveData(updated) } catch {}
  }

  /** Deriva estado visível: usa o campo se existir, senão deriva
   *  de data+hora (futura=agendada, passada=realizada). */
  const estadoSessao = (s: BriefingSessao): 'pendente' | 'agendada' | 'realizada' => {
    if (s.estado === 'pendente') return 'pendente'
    if (!s.data) return 'realizada'
    const [Y, M, D] = s.data.split('-').map(Number)
    const [hh, mm] = (s.hora ?? '23:59').split(':').map(Number)
    const dt = new Date(Y, (M ?? 1) - 1, D ?? 1, hh ?? 23, mm ?? 59)
    return dt.getTime() >= Date.now() ? 'agendada' : 'realizada'
  }

  const update = (id: string, field: keyof BriefingSessao, value: any) =>
    setSessoes(s => s.map(ses => ses.id === id ? { ...ses, [field]: value } : ses))

  const eliminar = async (id: string) => {
    const updated = sessoes.filter(s => s.id !== id)
    setSessoes(updated)
    setConfirmDelete(null)
    try { await saveData(updated) } catch {}
  }

  const notificar = async (id: string) => {
    const sessao = sessoes.find(s => s.id === id)
    if (!sessao) return
    const emailCliente = initial.fichaCliente?.email
    if (!emailCliente) {
      alert('Sem email do cliente definido. Adiciona o email na secção Contrato & CPS.')
      return
    }
    setNotifying(id)
    try {
      await fetch('/api/media-portal/notify-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailCliente,
          ref: initial.ref,
          nomeProjeto: initial.nome,
          cliente: initial.cliente,
          sessaoTitulo: sessao.titulo,
          sessaoData: sessao.data,
        }),
      })
      const agora = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
      const updated = sessoes.map(s => s.id === id ? { ...s, notificacaoEnviada: agora } : s)
      setSessoes(updated)
      await saveData(updated)
    } catch {}
    setNotifying(null)
  }

  /* ── Próxima sessão (qualquer estado futuro, incluindo pendentes) ── */
  const proximaSessao = useMemo(() => {
    const agora = new Date()
    const futuras = sessoes
      .filter(s => s.data)
      .map(s => {
        const [Y, M, D] = s.data.split('-').map(Number)
        const [hh, mm] = (s.hora ?? '00:00').split(':').map(Number)
        const _dt = new Date(Y, (M ?? 1) - 1, D ?? 1, hh ?? 0, mm ?? 0)
        return { ...s, _dt }
      })
      .filter(s => s._dt.getTime() >= agora.getTime())
      // ordenar: agendadas (confirmadas) primeiro; depois pendentes
      .sort((a, b) => {
        const aP = a.estado === 'pendente' ? 1 : 0
        const bP = b.estado === 'pendente' ? 1 : 0
        if (aP !== bP) return aP - bP
        return a._dt.getTime() - b._dt.getTime()
      })
    return futuras[0] ?? null
  }, [sessoes])

  /* Contagem de pedidos pendentes (mostrar aviso ao admin) */
  const pedidosPendentes = useMemo(
    () => sessoes.filter(s => s.estado === 'pendente'),
    [sessoes]
  )

  /* ── Countdown live para a próxima sessão agendada ─────── */
  const [now, setNow] = useState<number>(() => Date.now())
  useEffect(() => {
    if (!proximaSessao) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [proximaSessao])

  const countdown = useMemo(() => {
    if (!proximaSessao) return null
    const [Y, M, D] = proximaSessao.data.split('-').map(Number)
    const [hh, mm] = (proximaSessao.hora ?? '00:00').split(':').map(Number)
    const target = new Date(Y, (M ?? 1) - 1, D ?? 1, hh ?? 0, mm ?? 0).getTime()
    let diff = Math.max(0, target - now)
    const dias  = Math.floor(diff / 86400000); diff -= dias * 86400000
    const horas = Math.floor(diff / 3600000);  diff -= horas * 3600000
    const mins  = Math.floor(diff / 60000);    diff -= mins * 60000
    const segs  = Math.floor(diff / 1000)
    const totalMs = target - now
    return { dias, horas, mins, segs, isPast: totalMs <= 0 }
  }, [proximaSessao, now])

  /* ── Estado da fase (statusbar) ────────────────────────── */
  const estadoFase = useMemo(() => {
    const f = (initial.fases ?? []).find(x => /briefing/i.test(x.nome))
    if (!f) return { label: 'Aguardar', color: 'wait' as const }
    if (f.estado === 'concluido') return { label: 'Concluído', color: 'done' as const }
    if (f.estado === 'em_curso')  return { label: 'Em curso',  color: 'doing' as const }
    return { label: 'Aguardar', color: 'wait' as const }
  }, [initial.fases])

  /* ── Print "Resumo" ─────────────────────────────────── */
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      // expandir todas as sessões para o print mostrar tudo
      setOpenId('__ALL__')
      setTimeout(() => window.print(), 100)
    }
  }

  /* ── Helpers UI ──────────────────────────────────────── */
  const fmtDayMonth = (iso: string) => {
    if (!iso) return { day: '--', mon: '' }
    const d = new Date(iso + 'T00:00:00')
    return {
      day: String(d.getDate()).padStart(2, '0'),
      mon: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
    }
  }
  const fmtFullDate = (iso: string) => {
    if (!iso) return ''
    const d = new Date(iso + 'T00:00:00')
    return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
  }

  /* Mostrar sessões: mais recentes primeiro */
  const sortedSessoes = useMemo(
    () => [...sessoes].sort((a, b) => (b.data || '').localeCompare(a.data || '')),
    [sessoes]
  )

  /* Contagens para o resumo do topo */
  const contagem = useMemo(() => {
    let pendentes = 0, agendadas = 0, realizadas = 0
    for (const s of sessoes) {
      const e = estadoSessao(s)
      if (e === 'pendente') pendentes++
      else if (e === 'agendada') agendadas++
      else realizadas++
    }
    return { pendentes, agendadas, realizadas }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessoes, now])

  /* Numeração das secções (a próxima sessão só aparece quando existe) */
  const temHero = !!(proximaSessao && countdown)
  const nSec = (i: number) => String(i + (temHero ? 1 : 0)).padStart(2, '0')

  /* ── Classes partilhadas (identidade rlprod.pt) ─────────── */
  const cardCls = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/70'
  const inputCls = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[15px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6] transition-colors'
  const labelCls = 'rlp-m block text-[10.5px] text-white/55 mb-2.5'
  const btnPrimary = 'inline-flex items-center justify-center gap-2 rounded-md bg-[#2e6cf6] hover:bg-[#3d79ff] px-5 py-3 text-[14px] font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const btnGhost = 'inline-flex items-center justify-center gap-2 rounded-md border border-white/20 hover:border-white/45 px-4 py-2.5 text-[13px] text-white/75 hover:text-white transition-colors disabled:cursor-default'
  const btnText = 'rlp-m text-[10px] text-white/50 hover:text-white transition-colors px-2 py-2'

  return (
    <div className="rlp relative text-white">
      <div className="print:hidden">
        <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 pb-32">

        {/* Crumb */}
        <p className="rlp-m text-[10.5px] text-white/45">
          <Link href={`/portal-media/${initial.ref}`} className="hover:text-white transition-colors">‹ Portal · {initial.nome}</Link>
        </p>

        {/* Header */}
        <header className="mt-8 sm:mt-10">
          <p className="rlp-m traco text-[11px] text-[#5a8bff]">RL PROD · {initial.nome}</p>
          <h1 className="rlp-t mt-4 text-[52px] sm:text-[80px] leading-[0.95]">
            Briefing<span className="text-[#5a8bff]">.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[15px] sm:text-[17px] leading-relaxed text-white/65">
            As sessões em que alinhamos objetivos, tom e referências do teu projeto. Fica tudo registado aqui.
          </p>

          {/* Resumo + ações */}
          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="rlp-m flex flex-wrap gap-x-6 gap-y-2 text-[10.5px] text-white/55">
              <span><b className="rlp-t text-[22px] tracking-normal text-white mr-1.5 align-[-2px]">{sessoes.length}</b> Sessões</span>
              <span><span className="text-white/35">●</span> {contagem.realizadas} Registadas</span>
              <span><span className="text-[#2e6cf6]">●</span> {contagem.agendadas} Agendadas</span>
              {contagem.pendentes > 0 && <span><span className="text-[#a9c1ff]">●</span> {contagem.pendentes} Pendentes</span>}
            </div>
            <div className="flex flex-col gap-2.5 sm:flex-row print:hidden">
              <button onClick={handlePrint} className={btnGhost} title="Imprimir / PDF">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v12m0 0 4-4m-4 4-4-4M4 19h16"/>
                </svg>
                Resumo
              </button>
              <button onClick={openSchedule} className={btnPrimary}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                {isAdmin ? 'Agendar Sessão' : 'Pedir Sessão'}
              </button>
            </div>
          </div>
        </header>

        <div className="mt-10 h-px bg-white/[0.1]" />

        {/* Aviso admin: pedidos pendentes OU info permanente */}
        {isAdmin && (
          <div className={`mt-8 flex items-start gap-3.5 rounded-2xl border px-5 py-4 print:hidden ${pedidosPendentes.length > 0 ? 'border-[#2e6cf6]/60 bg-[#2e6cf6]/[0.12]' : 'border-white/[0.1] bg-[#00141f]/70'}`}>
            <span className={`mt-0.5 ${pedidosPendentes.length > 0 ? 'text-[#5a8bff]' : 'text-white/45'}`}>
              {pedidosPendentes.length > 0 ? <IconClock s={18} /> : (
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5" />
                  <circle cx="12" cy="16" r="0.6" fill="currentColor" />
                </svg>
              )}
            </span>
            <div>
              <p className={`rlp-m text-[10.5px] ${pedidosPendentes.length > 0 ? 'text-[#5a8bff]' : 'text-white/55'}`}>
                {pedidosPendentes.length > 0
                  ? (pedidosPendentes.length === 1 ? 'Pedido pendente' : 'Pedidos pendentes')
                  : 'Pedidos do cliente'}
              </p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-white/70">
                {pedidosPendentes.length > 0
                  ? (pedidosPendentes.length === 1
                    ? 'O cliente pediu uma sessão. Confirma a disponibilidade na lista abaixo.'
                    : `${pedidosPendentes.length} pedidos do cliente aguardam confirmação.`)
                  : <>Os clientes podem pedir sessões a partir do botão <b className="text-white">Pedir Sessão</b>. Aparecem aqui como <b className="text-white">Pendente</b> e podes Confirmar ou Recusar.</>}
              </p>
            </div>
          </div>
        )}

        <div className="mt-12 flex flex-col gap-14 sm:gap-16">

          {/* ── 01 Próxima sessão c/ countdown live ── */}
          {proximaSessao && countdown && (
            <section>
              <SecHead n="01" t="Próxima sessão" />
              <div className="relative overflow-hidden rounded-2xl border border-[#2e6cf6]/50 bg-[#0c2236]/80 p-5 sm:p-8">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rlp-m inline-flex items-center gap-2 text-[10.5px] text-[#5a8bff]">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2e6cf6] opacity-60 motion-reduce:animate-none" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2e6cf6]" />
                    </span>
                    {estadoSessao(proximaSessao) === 'pendente' ? 'Pedido de sessão' : 'Sessão agendada'}
                  </span>
                  {proximaSessao.tipo && <TipoTag tipo={proximaSessao.tipo} />}
                </div>

                <h3 className="rlp-t mt-4 text-[28px] sm:text-[38px] leading-[1.02]">{proximaSessao.titulo}</h3>
                <p className="mt-2 text-[15px] text-white/65">
                  {fmtFullDate(proximaSessao.data)}
                  {proximaSessao.hora && <span className="text-white"> · {proximaSessao.hora.replace(':', 'h')}</span>}
                  {proximaSessao.tipo === 'presencial' && proximaSessao.local && (
                    <span> · {proximaSessao.local}</span>
                  )}
                </p>

                {/* Countdown live */}
                <div className="mt-6 grid grid-cols-4 gap-2 sm:gap-3 max-w-md">
                  {[
                    { v: countdown.dias, l: 'Dias' },
                    { v: countdown.horas, l: 'Horas' },
                    { v: countdown.mins, l: 'Min' },
                    { v: countdown.segs, l: 'Seg' },
                  ].map(({ v, l }) => (
                    <div key={l} className="rounded-md border border-white/[0.1] bg-[#00141f]/70 px-2 py-3 text-center">
                      <span className="rlp-t block text-[28px] sm:text-[36px] leading-none tabular-nums">{String(v).padStart(2, '0')}</span>
                      <span className="rlp-m mt-2 block text-[9px] text-white/45">{l}</span>
                    </div>
                  ))}
                </div>

                {/* CTA: estado derivado (sessões antigas sem campo estado
                    caem em 'agendada' quando a data está no futuro) e
                    tipo por defeito = 'videochamada'. */}
                {(() => {
                  const est = estadoSessao(proximaSessao)
                  const tipo = proximaSessao.tipo ?? 'videochamada'
                  if (est === 'agendada' && tipo === 'videochamada') {
                    return (
                      <a href={MEET_LINK} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} mt-7 w-full sm:w-auto`}>
                        <IconVideo s={16} />
                        Entrar na Reunião
                        <span aria-hidden>→</span>
                      </a>
                    )
                  }
                  if (est === 'agendada' && tipo === 'presencial') {
                    return (
                      <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer" className={`${btnPrimary} mt-7 w-full sm:w-auto`}>
                        <IconPin s={16} />
                        Ver Localização
                        <span aria-hidden>→</span>
                      </a>
                    )
                  }
                  if (est === 'pendente') {
                    return (
                      <p className="mt-7 flex items-start gap-2.5 text-[14px] leading-relaxed text-[#a9c1ff]">
                        <span className="mt-0.5"><IconClock /></span>
                        Pedido a aguardar confirmação. O link da reunião fica disponível assim que for aceite.
                      </p>
                    )
                  }
                  return null
                })()}
              </div>
            </section>
          )}

          {/* ── O que é o Briefing ── */}
          <section>
            <SecHead n={nSec(1)} t="O que é o Briefing?" />
            <div className={`${cardCls} p-5 sm:p-8`}>
              <p className="text-[15px] sm:text-[16px] leading-relaxed text-white/70">
                O briefing é a base de tudo o que fazemos juntos. É o momento em que nos sentamos contigo, presencialmente ou à distância, para perceber exatamente o que precisas, o que sentes e o que esperas do projeto.
              </p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08]">
                {[
                  { n: '01', t: 'Primeira sessão',  d: 'Recolhemos os objetivos, o tom, as referências visuais e tudo o que define a tua visão para o projeto.' },
                  { n: '02', t: 'Sessões seguintes', d: 'À medida que o projeto avança, podemos fazer sessões adicionais para afinar detalhes, validar decisões ou ajustar o rumo.' },
                  { n: '03', t: 'Resumo registado',  d: 'Cada sessão fica registada aqui com data e resumo. Tens sempre acesso ao histórico completo do que foi discutido.' },
                  { n: '04', t: 'Notificação',       d: 'Sempre que adicionarmos um novo registo de briefing, recebes uma notificação por email para ficares a par.' },
                ].map(({ n, t, d }) => (
                  <div key={n} className="bg-[#00141f] p-4 sm:p-5">
                    <span className="rlp-m text-[10px] text-[#5a8bff]">{n}</span>
                    <p className="rlp-t mt-2 text-[17px] leading-tight">{t}</p>
                    <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55">{d}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Histórico de sessões ── */}
          <section>
            <SecHead
              n={nSec(2)}
              t="Histórico de sessões"
              sub={sessoes.length > 0 ? 'Toca numa sessão para ver os detalhes' : undefined}
            />

            {sortedSessoes.length === 0 ? (
              <div className={`${cardCls} flex flex-col items-center px-6 py-12 text-center`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.12] text-white/45">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="3" width="14" height="18" rx="2.5"/>
                    <path d="M9 8h6M9 12h6M9 16h3"/>
                  </svg>
                </span>
                <p className="rlp-t mt-4 text-[20px]">Sem briefings registados</p>
                {isAdmin && (
                  <p className="mt-2 text-[14px] text-white/55">Clica em <b className="text-white">Agendar Sessão</b> para adicionar o primeiro briefing.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sortedSessoes.map((sessao) => {
                  const isOpen = openId === sessao.id || openId === '__ALL__'
                  const { day, mon } = fmtDayMonth(sessao.data)
                  const objetivos = sessao.objetivos ?? []
                  const tom = sessao.tom ?? []
                  const notas = sessao.notas ?? ''
                  const estado = estadoSessao(sessao)
                  const mostrarDetalhe = isOpen || isEditing

                  return (
                    <div
                      key={sessao.id}
                      className={`rounded-2xl border bg-[#00141f]/70 transition-colors ${
                        estado === 'pendente' ? 'border-[#a9c1ff]/35'
                          : isOpen ? 'border-[#2e6cf6]/60'
                          : 'border-white/[0.1] hover:border-white/25'
                      } ${isEditing ? '' : 'cursor-pointer'}`}
                      onClick={() => !isEditing && setOpenId(p => p === sessao.id ? null : sessao.id)}
                      onKeyDown={e => {
                        if (isEditing) return
                        if (e.target !== e.currentTarget) return
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenId(p => p === sessao.id ? null : sessao.id) }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={mostrarDetalhe}
                    >
                      <div className="flex gap-4 sm:gap-6 p-4 sm:p-6">
                        {/* Data lateral */}
                        <div className="w-14 sm:w-16 shrink-0 border-r border-white/[0.08] pr-4 sm:pr-6">
                          <div className={`rlp-t text-[34px] sm:text-[40px] leading-none ${estado === 'agendada' ? 'text-[#5a8bff]' : 'text-white'}`}>{day}</div>
                          <div className="rlp-m mt-1.5 text-[8.5px] tracking-[0.2em] text-white/45">{mon}</div>
                          {sessao.hora && (
                            <div className="rlp-m mt-1 text-[9px] tracking-[0.2em] text-[#a9c1ff]">{sessao.hora.replace(':', 'h')}</div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {isEditing ? (
                              <input
                                value={sessao.titulo}
                                onChange={e => update(sessao.id, 'titulo', e.target.value)}
                                onClick={e => e.stopPropagation()}
                                className={`${inputCls} rlp-t !text-[18px]`}
                                placeholder="Título da sessão"
                              />
                            ) : (
                              <p className="rlp-t mr-1 text-[19px] sm:text-[21px] leading-tight">{sessao.titulo}</p>
                            )}
                            {sessao.tipo && (
                              <TipoTag tipo={sessao.tipo} title={sessao.tipo === 'presencial' && sessao.local ? sessao.local : undefined} />
                            )}
                            <span className={`rlp-m inline-flex items-center rounded-full border px-2.5 py-1 text-[9.5px] ${
                              estado === 'pendente' ? 'border-[#a9c1ff]/40 text-[#a9c1ff]'
                                : estado === 'agendada' ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white'
                                : 'border-white/15 text-white/55'
                            }`}>
                              {estado === 'pendente'  ? 'Pendente'
                                : estado === 'agendada' ? 'Agendada'
                                : 'Registado'}
                            </span>
                          </div>

                          {isEditing ? (
                            <textarea
                              value={sessao.resumo}
                              onChange={e => update(sessao.id, 'resumo', e.target.value)}
                              onClick={e => e.stopPropagation()}
                              rows={2}
                              className={`${inputCls} mt-3 resize-y`}
                              placeholder="Descrição curta da reunião…"
                            />
                          ) : (
                            <p className={`mt-2 text-[14px] leading-relaxed ${sessao.resumo ? 'text-white/65' : 'text-white/35 italic'}`}>
                              {sessao.resumo || 'Sem descrição registada.'}
                            </p>
                          )}
                          {sessao.tipo === 'presencial' && sessao.local && (
                            <p className="mt-2 flex items-center gap-1.5 text-[13px] text-white/55">
                              <IconPin />
                              {sessao.local}
                            </p>
                          )}

                          {/* Detalhe expansível */}
                          {mostrarDetalhe && (
                            <div className="mt-5 border-t border-white/[0.08] pt-5">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                  <p className={labelCls}>Objetivos</p>
                                  {isEditing ? (
                                    <textarea
                                      value={(objetivos).join('\n')}
                                      onChange={e => update(sessao.id, 'objetivos', e.target.value.split('\n').filter(Boolean))}
                                      onClick={e => e.stopPropagation()}
                                      rows={3}
                                      className={`${inputCls} resize-y`}
                                      placeholder="Um objetivo por linha"
                                    />
                                  ) : objetivos.length > 0 ? (
                                    <ul className="flex flex-col gap-1.5">
                                      {objetivos.map((o, i) => (
                                        <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-white/75">
                                          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-[#2e6cf6]" />
                                          {o}
                                        </li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-[14px] italic text-white/35">Sem objetivos registados</p>
                                  )}
                                </div>
                                <div>
                                  <p className={labelCls}>Tom</p>
                                  {isEditing ? (
                                    <input
                                      value={(tom).join(', ')}
                                      onChange={e => update(sessao.id, 'tom', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                                      onClick={e => e.stopPropagation()}
                                      className={inputCls}
                                      placeholder="Cinematográfico, Próximo, Autêntico"
                                    />
                                  ) : tom.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {tom.map((t, i) => (
                                        <span key={i} className="rounded-full border border-white/[0.15] px-3 py-1 text-[13px] text-white/80">{t}</span>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-[14px] italic text-white/35">Sem tom definido</p>
                                  )}
                                </div>
                                <div className="sm:col-span-2">
                                  <p className={labelCls}>Notas</p>
                                  {isEditing ? (
                                    <textarea
                                      value={notas}
                                      onChange={e => update(sessao.id, 'notas', e.target.value)}
                                      onClick={e => e.stopPropagation()}
                                      rows={3}
                                      className={`${inputCls} resize-y`}
                                      placeholder="Notas finais da sessão…"
                                    />
                                  ) : notas ? (
                                    <p className="whitespace-pre-line text-[14px] leading-relaxed text-white/75">{notas}</p>
                                  ) : (
                                    <p className="text-[14px] italic text-white/35">Sem notas registadas</p>
                                  )}
                                </div>
                              </div>

                              {/* Entrar na Reunião / Ver Localização (visível a todos quando agendada) */}
                              {estado === 'agendada' && (
                                <div className="mt-5 print:hidden">
                                  {(sessao.tipo ?? 'videochamada') === 'videochamada' ? (
                                    <a href={MEET_LINK} target="_blank" rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className={`${btnPrimary} w-full sm:w-auto !py-2.5 !text-[13px]`}>
                                      <IconVideo s={14} />
                                      Entrar na Reunião
                                    </a>
                                  ) : (
                                    <a href={MAPS_LINK} target="_blank" rel="noopener noreferrer"
                                      onClick={e => e.stopPropagation()}
                                      className={`${btnGhost} w-full sm:w-auto`}>
                                      <IconPin s={14} />
                                      Ver Localização
                                    </a>
                                  )}
                                </div>
                              )}

                              {/* Admin: aprovar/recusar pendentes */}
                              {isAdmin && estado === 'pendente' && (
                                <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#a9c1ff]/25 bg-[#0c2236]/70 p-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
                                  <span className="flex items-center gap-2 text-[13.5px] text-[#a9c1ff]">
                                    <IconClock />
                                    Pedido do cliente. Aguarda a tua confirmação.
                                  </span>
                                  <span className="flex gap-2">
                                    <button onClick={e => { e.stopPropagation(); aprovarPedido(sessao.id) }} className={`${btnPrimary} flex-1 sm:flex-none !py-2.5 !text-[13px]`}>
                                      ✓ Confirmar
                                    </button>
                                    <button onClick={e => { e.stopPropagation(); recusarPedido(sessao.id) }} className="flex-1 sm:flex-none rounded-md border border-[#ff4747]/50 px-4 py-2.5 text-[13px] text-[#ff4747] hover:bg-[#ff4747]/10 transition-colors">
                                      Recusar
                                    </button>
                                  </span>
                                </div>
                              )}
                              {/* Admin: notificar + eliminar */}
                              {isAdmin && estado !== 'pendente' && (
                                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-4 print:hidden">
                                  <button
                                    onClick={e => { e.stopPropagation(); !sessao.notificacaoEnviada && notificar(sessao.id) }}
                                    disabled={!!sessao.notificacaoEnviada || notifying === sessao.id}
                                    className={sessao.notificacaoEnviada
                                      ? 'inline-flex items-center gap-2 rounded-md border border-[#2e6cf6]/40 bg-[#2e6cf6]/10 px-4 py-2.5 text-[13px] text-[#a9c1ff] cursor-default'
                                      : btnGhost}
                                  >
                                    {notifying === sessao.id
                                      ? 'A enviar…'
                                      : sessao.notificacaoEnviada
                                        ? `✓ Notificado ${sessao.notificacaoEnviada}`
                                        : 'Notificar Cliente'}
                                  </button>
                                  {confirmDelete === sessao.id ? (
                                    <span className="flex flex-wrap items-center gap-2">
                                      <span className="text-[13px] text-white/60">Tens a certeza?</span>
                                      <button onClick={e => { e.stopPropagation(); eliminar(sessao.id) }} className="rounded-md bg-[#ff4747] px-4 py-2.5 text-[13px] font-medium text-white hover:opacity-90">Eliminar</button>
                                      <button onClick={e => { e.stopPropagation(); setConfirmDelete(null) }} className={btnText}>Cancelar</button>
                                    </span>
                                  ) : (
                                    <button onClick={e => { e.stopPropagation(); setConfirmDelete(sessao.id) }} className="rlp-m px-2 py-2 text-[10px] text-white/45 hover:text-[#ff4747] transition-colors">
                                      Eliminar Sessão
                                    </button>
                                  )}
                                </div>
                              )}

                              {/* Cliente: o próprio pedido está pendente */}
                              {!isAdmin && estado === 'pendente' && (
                                <p className="mt-5 flex items-start gap-2 rounded-xl border border-[#a9c1ff]/25 bg-[#0c2236]/70 p-4 text-[13.5px] leading-relaxed text-[#a9c1ff]">
                                  <span className="mt-0.5"><IconClock /></span>
                                  <span>O teu pedido está <b className="text-white">pendente de confirmação</b> pela nossa equipa.</span>
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        {!isEditing && (
                          <span className={`mt-1 h-5 w-5 shrink-0 text-white/40 transition-transform print:hidden ${isOpen ? 'rotate-180 text-[#5a8bff]' : ''}`}>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* ── Estado da fase de Briefing ── */}
          <section>
            <SecHead n={nSec(3)} t="Estado da fase" />
            <div className={`${cardCls} flex items-center gap-4 px-5 py-4 sm:px-6 sm:py-5`}>
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {estadoFase.color === 'doing' && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5a8bff] opacity-60 motion-reduce:animate-none" />
                )}
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                  estadoFase.color === 'done' ? 'bg-[#2e6cf6]'
                    : estadoFase.color === 'doing' ? 'bg-[#5a8bff]'
                    : 'bg-[#7c8893]'
                }`} />
              </span>
              <div className="flex-1">
                <p className="rlp-m text-[10px] text-white/45">Briefing</p>
                <p className={`rlp-t mt-1 text-[20px] leading-none ${estadoFase.color === 'wait' ? 'text-white/70' : 'text-white'}`}>{estadoFase.label}</p>
              </div>
              {isAdmin && (
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-white/[0.12] text-white/55 hover:border-[#2e6cf6] hover:text-white transition-colors print:hidden"
                  aria-label="Editar estado"
                  onClick={() => setIsEditing(true)}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 5l5 5M4 20l1-4L16 5l3 3L8 19l-4 1Z"/>
                  </svg>
                </button>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-white/[0.1] pt-8 text-center">
          <p className="rlp-t text-[20px] sm:text-[24px]">More than a product, <span className="text-[#5a8bff]">an experience.</span></p>
          <p className="rlp-m mt-3 text-[10px] text-white/40">RL PROD · Photography &amp; Video</p>
        </footer>
      </div>

      {/* Feedback de gravação (admin) */}
      {isAdmin && (saving || savedFlash) && (
        <div className="rlp-m fixed bottom-20 right-6 z-50 rounded-md border border-[#2e6cf6]/50 bg-[#0c2236] px-4 py-2.5 text-[10.5px] text-[#a9c1ff] print:hidden" role="status">
          {saving ? 'A guardar…' : '✓ Alterações guardadas'}
        </div>
      )}

      {isAdmin && (
        <div className="print:hidden">
          <AdminBar isEditing={isEditing} saving={saving}
            onToggle={() => setIsEditing(true)} onSave={handleSave} onCancel={cancel} />
        </div>
      )}

      {/* ── Modal: Agendar / Pedir sessão ─────────────────────── */}
      {scheduleOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#00141f]/80 sm:items-center sm:p-6 print:hidden" onClick={closeSchedule}>
          <div
            className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl border border-white/[0.1] bg-[#0c2236] p-5 pb-6 sm:max-w-lg sm:rounded-2xl sm:p-8"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-md border border-white/[0.12] text-white/60 hover:border-white/40 hover:text-white transition-colors"
              onClick={closeSchedule}
              aria-label="Fechar"
              type="button"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <p className="rlp-m traco text-[10.5px] text-[#5a8bff]">{isAdmin ? 'Nova sessão' : 'Pedido de sessão'}</p>
            <h3 className="rlp-t mt-3 pr-10 text-[30px] sm:text-[36px] leading-[1]">
              {isAdmin
                ? <>Agendar <span className="text-[#5a8bff]">sessão de briefing</span></>
                : <>Pedir <span className="text-[#5a8bff]">sessão de briefing</span></>}
            </h3>
            <p className="mt-3 text-[14px] leading-relaxed text-white/60">
              {isAdmin
                ? 'Escolhe o dia, a hora e o título da próxima sessão. Fica imediatamente registada no histórico.'
                : 'Indica a tua preferência de dia e hora. O pedido fica pendente da disponibilidade da nossa equipa. Assim que confirmarmos, recebes uma notificação.'}
            </p>

            {!isAdmin && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-[#a9c1ff]/25 bg-[#00141f]/60 p-4 text-[13.5px] leading-relaxed text-[#a9c1ff]">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5" /><circle cx="12" cy="16" r="0.6" fill="currentColor" />
                </svg>
                <span>O pedido fica <b className="text-white">pendente de confirmação</b>. A nossa equipa valida a disponibilidade e responde com a data final.</span>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block">
                <span className={labelCls}>Data <span className="text-[#ff4747]">*</span></span>
                <CampoDataPT
                  value={schedDate}
                  onChange={setSchedDate}
                  className={`${inputCls} w-full`}
                />
              </label>
              <label className="block">
                <span className={labelCls}>Hora</span>
                <input
                  type="time"
                  value={schedTime}
                  onChange={e => setSchedTime(e.target.value)}
                  className={`${inputCls} [color-scheme:dark]`}
                  step={900}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className={labelCls}>Título <span className="text-[#ff4747]">*</span></span>
                <input
                  type="text"
                  value={schedTitle}
                  onChange={e => setSchedTitle(e.target.value)}
                  className={inputCls}
                  placeholder="Ex.: Sessão de afinação"
                  maxLength={80}
                />
              </label>

              {/* Tipo: Videochamada / Presencial */}
              <div className="sm:col-span-2">
                <span className={labelCls}>Formato da reunião</span>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Formato da reunião">
                  {([
                    { v: 'videochamada' as const, l: 'Videochamada', ic: <IconVideo s={15} /> },
                    { v: 'presencial' as const, l: 'Presencial', ic: <IconPin s={15} /> },
                  ]).map(o => (
                    <button
                      key={o.v}
                      type="button"
                      role="radio"
                      aria-checked={schedTipo === o.v}
                      onClick={() => setSchedTipo(o.v)}
                      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] transition-colors ${
                        schedTipo === o.v
                          ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white'
                          : 'border-white/[0.15] text-white/70 hover:border-white/40 hover:text-white'
                      }`}
                    >
                      {o.ic}
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              {schedTipo === 'presencial' && (
                <label className="block sm:col-span-2">
                  <span className={labelCls}>Local</span>
                  <input
                    type="text"
                    value={schedLocal}
                    onChange={e => setSchedLocal(e.target.value)}
                    className={inputCls}
                    placeholder="Ex.: Estúdio RL PROD, Lisboa"
                    maxLength={120}
                  />
                </label>
              )}
            </div>

            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                className={`${btnText} py-3`}
                onClick={closeSchedule}
                disabled={schedSaving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={`${btnPrimary} w-full sm:w-auto`}
                onClick={confirmSchedule}
                disabled={schedSaving || !schedDate || !schedTitle.trim()}
              >
                {schedSaving
                  ? (isAdmin ? 'A agendar…' : 'A enviar pedido…')
                  : (isAdmin ? 'Agendar Sessão' : 'Enviar Pedido')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Peças visuais (fora do componente para não remontarem a cada segundo do countdown) ── */
const IconVideo = ({ s = 12 }: { s?: number }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <rect x="3" y="6" width="12" height="12" rx="2" />
    <path d="M15 10l6-3v10l-6-3z" />
  </svg>
)
const IconPin = ({ s = 12 }: { s?: number }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13Z" />
    <circle cx="12" cy="9" r="2.6" />
  </svg>
)
const IconClock = ({ s = 14 }: { s?: number }) => (
  <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)
const TipoTag = ({ tipo, title }: { tipo: 'videochamada' | 'presencial'; title?: string }) => (
  <span title={title} className="rlp-m inline-flex items-center gap-1.5 rounded-full border border-[#a9c1ff]/30 px-2.5 py-1 text-[9.5px] text-[#a9c1ff]">
    {tipo === 'videochamada' ? <IconVideo /> : <IconPin />}
    {tipo === 'videochamada' ? 'Videochamada' : 'Presencial'}
  </span>
)
const SecHead = ({ n, t, sub }: { n: string; t: string; sub?: string }) => (
  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-5 sm:mb-6">
    <span className="rlp-t text-[36px] sm:text-[44px] leading-none text-[#2e6cf6]">{n}</span>
    <h2 className="rlp-t text-[22px] sm:text-[24px] leading-none">{t}</h2>
    {sub && <span className="rlp-m w-full sm:w-auto sm:ml-auto text-[10px] text-white/40">{sub}</span>}
  </div>
)
