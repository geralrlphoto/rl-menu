'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TimeBlocks from './TimeBlocks'
import { linkPublico } from '@/lib/site-url'
import { whatsappLink } from '@/lib/crm'

// Links fixos usados nas reuniões de CRM (iguais aos da ficha /crm/[id])
const MEET_LINK = 'https://meet.google.com/dih-etvh-xkh'
const MAPS_LINK = 'https://www.google.com/maps/place/RL+Photo.Video+(Casamentos,Batizados,Eventos)/@38.634382,-8.9147077,212m/data=!3m2!1e3!4b1!4m6!3m5!1s0xd19414ebaa9e467:0x1d9b63c70ffe06a!8m2!3d38.634381!4d-8.914064!16s%2Fg%2F11w219lx62?authuser=0&entry=ttu&g_ep=EgoyMDI2MDQxMi4wIKXMDSoASAFQAw%3D%3D'

export type CalEvent = {
  id: string
  referencia: string
  cliente: string
  data_evento: string | null
  local: string | null
  tipo_evento: string[]
  fotografo: string[]
  videografo: string[]
}

export type PreWeddingEvent = {
  id: string
  referencia: string
  nomes: string
  data_evento: string
  hora: string | null
  local: string | null
}

export type TeamEntry = {
  id: string
  freelancer_nome: string
  data_evento: string          // YYYY-MM-DD — the wedding/event date
  data_calendar: string        // YYYY-MM-DD — the date shown on calendar (confirmation date when available)
  local: string | null
  evento_id: string | null
  status: 'confirmado' | 'indisponivel'
  tipo: 'confirmacao' | 'edicao_fotos' | 'edicao_album' | 'edicao_video'
}

export type ReuniaoEvent = {
  id: string
  nome: string
  reuniao_data: string         // YYYY-MM-DD
  reuniao_hora: string | null
  reuniao_tipo: string | null  // Presencial | Videochamada
  reuniao_link: string | null
}

export type TarefaEvent = {
  id: string
  titulo: string
  descricao: string | null
  status: 'NOVA' | 'PENDENTE' | 'CONCLUIDA'
  data_prazo: string           // YYYY-MM-DD
  hora: string | null          // HH:MM or HH:MM:SS
  evento_id: string | null     // Notion event id (optional link)
}

type SelectedItem =
  | { kind: 'event'; data: CalEvent }
  | { kind: 'pw'; data: PreWeddingEvent }
  | { kind: 'team'; data: TeamEntry }
  | { kind: 'reuniao'; data: ReuniaoEvent }
  | { kind: 'tarefa'; data: TarefaEvent }

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const TIPO_LABELS: Record<TeamEntry['tipo'], string> = {
  confirmacao:   '✓',
  edicao_fotos:  '🖼',
  edicao_album:  '📘',
  edicao_video:  '🎬',
}

type FiltroKey = 'casamento' | 'pw' | 'reuniao' | 'tarefa' | 'equipa'

const FILTRO_META: { key: FiltroKey; label: string; cor: string }[] = [
  { key: 'casamento', label: 'Casamentos',  cor: '#C9A84C' },
  { key: 'pw',        label: 'Pré-Wedding', cor: '#4FC3C3' },
  { key: 'reuniao',   label: 'Reuniões',    cor: '#C084FC' },
  { key: 'tarefa',    label: 'Tarefas',     cor: '#60A5FA' },
  { key: 'equipa',    label: 'Equipa',      cor: '#4ADE80' },
]

const TIPO_NOMES: Record<TeamEntry['tipo'], string> = {
  confirmacao:   'confirmação',
  edicao_fotos:  'ed. fotos',
  edicao_album:  'ed. álbum',
  edicao_video:  'ed. vídeo',
}

// YYYY-MM-DD a partir de um Date local (sem passar por UTC)
function isoDe(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Etiqueta de um item dentro da célula do dia
function Pill({ cor, riscado, children }: { cor: string; riscado?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-stretch gap-1.5 rounded-md overflow-hidden"
      style={{ background: cor + '1A', opacity: riscado ? 0.65 : 1 }}>
      <span className="w-[3px] flex-shrink-0" style={{ background: cor }} />
      <span className="py-[3px] pr-1 text-[10px] leading-tight truncate"
        style={{ color: cor, textDecoration: riscado ? 'line-through' : 'none' }}>
        {children}
      </span>
    </div>
  )
}

const TIPO_COLORS: Record<TeamEntry['tipo'], { bg: string; border: string; text: string }> = {
  confirmacao:  { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.28)', text: '#4ADE80' },
  edicao_fotos: { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.28)', text: '#FB923C' },
  edicao_album: { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.28)', text: '#A78BFA' },
  edicao_video: { bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.28)', text: '#60A5FA' },
}

function startsOn(dateStr: string | null | undefined, year: number, month: number, day: number) {
  if (!dateStr) return false
  return dateStr.startsWith(
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  )
}

// ─── Botão + popover para sincronizar com Google Calendar via feed ICS ──────
function GoogleSyncButton() {
  const [open, setOpen]     = useState(false)
  const [copied, setCopied] = useState(false)
  // URL absoluta do feed — Google Calendar precisa de URL pública
  const icsUrl = linkPublico('/api/calendar/ics')
  // Google Calendar — link direto que abre o ecrã de "adicionar agenda por URL"
  const googleAddUrl = `https://calendar.google.com/calendar/u/0/r/settings/addbyurl?cid=${encodeURIComponent(icsUrl.replace(/^https?:\/\//, 'webcal://'))}`

  async function copyToClipboard() {
    try { await navigator.clipboard.writeText(icsUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {/* */}
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#C9A84C]/40 bg-[#C9A84C]/10 text-[#C9A84C] hover:bg-[#C9A84C]/20 hover:border-[#C9A84C]/60 transition-all text-xs tracking-widest uppercase font-semibold">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M16 2v4M8 2v4M3 10h18"/>
        </svg>
        Sincronizar Google
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[min(95vw,420px)] z-50 rounded-xl border border-white/15 bg-[#0d0d0e] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] p-5">
            <p className="text-[10px] tracking-[0.35em] text-[#C9A84C]/80 uppercase font-bold mb-3">Sincronizar com Google Calendar</p>
            <p className="text-[12px] text-white/55 leading-relaxed mb-4">
              O Google atualiza o feed automaticamente (cerca de cada 4–12h). Inclui casamentos, batizados, pré-weddings, reuniões e tarefas.
            </p>

            {/* Botão direto */}
            <a href={googleAddUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-md bg-[#C9A84C] text-black font-bold text-[11px] tracking-widest uppercase hover:bg-[#C9A84C]/85 transition-all mb-3">
              ➕ Adicionar ao Google Calendar
            </a>

            {/* URL do feed (para copiar manualmente) */}
            <p className="text-[10px] tracking-widest text-white/30 uppercase mb-1.5">Ou copia o link do feed:</p>
            <div className="flex gap-2 mb-3">
              <input readOnly value={icsUrl}
                onClick={e => (e.target as HTMLInputElement).select()}
                className="flex-1 bg-black/40 border border-white/15 rounded px-3 py-2 text-[11px] font-mono text-white/70 outline-none" />
              <button onClick={copyToClipboard}
                className="px-3 py-2 rounded border border-white/15 text-white/60 hover:text-white text-[10px] tracking-widest uppercase font-bold">
                {copied ? '✓' : 'Copiar'}
              </button>
            </div>

            <p className="text-[10px] text-white/30 leading-relaxed">
              No Google Calendar → <strong className="text-white/55">⚙ Definições → Adicionar agenda → A partir de URL</strong> → cola o link.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default function CalendarClient({
  events,
  preWeddings,
  teamEntries,
  reunioes,
  tarefas: initialTarefas,
}: {
  events: CalEvent[]
  preWeddings: PreWeddingEvent[]
  teamEntries: TeamEntry[]
  reunioes: ReuniaoEvent[]
  tarefas: TarefaEvent[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const today = new Date()
  const [viewYear, setViewYear]   = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selected, setSelected]   = useState<SelectedItem | null>(null)
  const [tarefas, setTarefas]     = useState<TarefaEvent[]>(initialTarefas)

  // Add-task modal state
  const [addTaskDate, setAddTaskDate]       = useState<string | null>(null)
  const [taskTitulo, setTaskTitulo]         = useState('')
  const [taskHora, setTaskHora]             = useState('')
  const [taskDesc, setTaskDesc]             = useState('')
  const [taskEventoId, setTaskEventoId]     = useState('')
  const [taskSaving, setTaskSaving]         = useState(false)

  // Edit-task modal state (reuses selected)
  const [editingTask, setEditingTask]       = useState(false)
  const [editTitulo, setEditTitulo]         = useState('')
  const [editHora, setEditHora]             = useState('')
  const [editDesc, setEditDesc]             = useState('')
  const [editStatus, setEditStatus]         = useState<TarefaEvent['status']>('NOVA')
  const [editEventoId, setEditEventoId]     = useState('')
  const [editSaving, setEditSaving]         = useState(false)

  // Build a fast lookup of events for chip label and dropdown
  const eventsById = new Map(events.map(e => [e.id, e]))

  // Sort events by absolute date proximity to addTaskDate (or today) so the
  // most-likely options appear at the top of the dropdown.
  function nearbyEvents(refDate: string | null) {
    const ref = refDate ? new Date(refDate + 'T00:00:00').getTime() : Date.now()
    return [...events]
      .filter(e => e.data_evento)
      .sort((a, b) => {
        const da = Math.abs(new Date(a.data_evento + 'T00:00:00').getTime() - ref)
        const db = Math.abs(new Date(b.data_evento + 'T00:00:00').getTime() - ref)
        return da - db
      })
  }

  function openAddTask(year: number, month: number, day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setAddTaskDate(dateStr)
    setTaskTitulo('')
    setTaskHora('')
    setTaskDesc('')
    setTaskEventoId('')
  }

  // ── Chooser modal (Tarefa / Reunião / Pré-Wedding) ─────────────────────
  const [chooserDate, setChooserDate] = useState<string | null>(null)
  function openChooser(year: number, month: number, day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setChooserDate(dateStr)
  }

  // ── Reunião CRM modal ──────────────────────────────────────────────────
  type CrmContacto = { id: string; nome: string; contato: string | null; status: string | null; reuniao_data: string | null; reuniao_hora: string | null }
  const [reuniaoOpen, setReuniaoOpen]       = useState(false)
  const [reuniaoDate, setReuniaoDate]       = useState<string>('')
  const [reuniaoContactos, setReuniaoContactos] = useState<CrmContacto[]>([])
  const [reuniaoCrmId, setReuniaoCrmId]     = useState<string>('')
  const [reuniaoHora, setReuniaoHora]       = useState<string>('15:00')
  const [reuniaoTipo, setReuniaoTipo]       = useState<'Presencial' | 'Videochamada'>('Presencial')
  const [reuniaoLink, setReuniaoLink]       = useState<string>('')
  const [reuniaoSaving, setReuniaoSaving]   = useState(false)
  const [reuniaoLoading, setReuniaoLoading] = useState(false)

  // Contacto escolhido no modal (para nome + número de WhatsApp)
  const reuniaoContacto = reuniaoContactos.find(c => c.id === reuniaoCrmId) ?? null
  const reuniaoWaBase   = whatsappLink(reuniaoContacto?.contato)

  // Troca de tipo: preenche automaticamente o link fixo que usamos nas reuniões
  function changeReuniaoTipo(t: 'Presencial' | 'Videochamada') {
    setReuniaoTipo(t)
    setReuniaoLink(prev => {
      if (t === 'Videochamada') return (!prev || prev === MAPS_LINK) ? MEET_LINK : prev
      return prev === MEET_LINK ? MAPS_LINK : prev
    })
  }

  // Mensagem de aviso da reunião (dia, hora e link), partilhada pelos dois modais
  function msgReuniao(nome: string, dateStr: string, hora: string, tipo: 'Presencial' | 'Videochamada', link: string) {
    const primeiro = (nome ?? '').trim().split(/\s+/)[0] || ''
    const alvo = link || (tipo === 'Videochamada' ? MEET_LINK : MAPS_LINK)
    const linha = tipo === 'Videochamada'
      ? `Videochamada (Google Meet):\n${alvo}`
      : (alvo === MAPS_LINK ? `Local: Estúdio RL Photo.Video\n${MAPS_LINK}` : `Local: ${alvo}`)
    return [
      `Olá${primeiro ? ' ' + primeiro : ''}, tudo bem?`,
      '',
      'Fica confirmada a nossa reunião:',
      '',
      `Data: ${fmtDate(dateStr)}`,
      `Hora: ${hora}`,
      linha,
      '',
      'Qualquer imprevisto é só dizer. Até já!',
      'Rui, RL Photo.Video',
    ].join('\n')
  }

  function reuniaoWaHref(): string | null {
    if (!reuniaoWaBase || !reuniaoDate) return null
    const texto = msgReuniao(reuniaoContacto?.nome ?? '', reuniaoDate, reuniaoHora, reuniaoTipo, reuniaoLink)
    return `${reuniaoWaBase}?text=${encodeURIComponent(texto)}`
  }

  function openReuniao(dateStr: string) {
    setReuniaoDate(dateStr)
    setReuniaoCrmId(''); setReuniaoHora('15:00'); setReuniaoTipo('Presencial'); setReuniaoLink(MAPS_LINK)
    setReuniaoOpen(true)
    setChooserDate(null)
    // Carrega contactos só na primeira vez
    if (reuniaoContactos.length === 0) {
      setReuniaoLoading(true)
      fetch('/api/calendario-add/crm-list', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => { setReuniaoContactos(d.contactos ?? []); setReuniaoLoading(false) })
        .catch(() => setReuniaoLoading(false))
    }
  }

  async function handleSaveReuniao(comWhatsapp = false) {
    if (!reuniaoCrmId || !reuniaoDate || !reuniaoHora) return
    // O separador tem de abrir no clique, senão o browser bloqueia o popup
    const waHref = comWhatsapp ? reuniaoWaHref() : null
    const waTab  = waHref ? window.open('about:blank', '_blank') : null
    setReuniaoSaving(true)
    try {
      const res = await fetch('/api/calendario-add/reuniao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crm_id: reuniaoCrmId,
          data: reuniaoDate,
          hora: reuniaoHora,
          tipo: reuniaoTipo,
          link: reuniaoLink || null,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        setReuniaoOpen(false)
        if (waHref) {
          if (waTab) waTab.location.href = waHref
          else window.open(waHref, '_blank', 'noopener')
        }
        // Salta o TimeBlocks para o dia da reunião + força re-sync
        window.dispatchEvent(new CustomEvent('timeblocks-set-day', { detail: { day: reuniaoDate, resync: true } }))
        startTransition(() => router.refresh())
      } else {
        waTab?.close()
        alert(d.error ?? 'Erro ao guardar reunião')
      }
    } catch (e) {
      waTab?.close()
      throw e
    } finally {
      setReuniaoSaving(false)
    }
  }

  // ── Reunião fora do CRM (guardada como tarefa com hora) ────────────
  const [rlOpen, setRlOpen]         = useState(false)
  const [rlDate, setRlDate]         = useState<string>('')
  const [rlNome, setRlNome]         = useState<string>('')
  const [rlHora, setRlHora]         = useState<string>('15:00')
  const [rlTipo, setRlTipo]         = useState<'Presencial' | 'Videochamada'>('Videochamada')
  const [rlLink, setRlLink]         = useState<string>(MEET_LINK)
  const [rlTelefone, setRlTelefone] = useState<string>('')
  const [rlNota, setRlNota]         = useState<string>('')
  const [rlSaving, setRlSaving]     = useState(false)

  const rlWaBase = whatsappLink(rlTelefone)

  function openReuniaoLivre(dateStr: string) {
    setRlDate(dateStr); setRlNome(''); setRlHora('15:00')
    setRlTipo('Videochamada'); setRlLink(MEET_LINK); setRlTelefone(''); setRlNota('')
    setRlOpen(true)
    setChooserDate(null)
  }

  function changeRlTipo(t: 'Presencial' | 'Videochamada') {
    setRlTipo(t)
    setRlLink(prev => {
      if (t === 'Videochamada') return (!prev || prev === MAPS_LINK) ? MEET_LINK : prev
      return prev === MEET_LINK ? MAPS_LINK : prev
    })
  }

  async function handleSaveReuniaoLivre(comWhatsapp = false) {
    if (!rlDate || !rlNome.trim()) return
    const waHref = (comWhatsapp && rlWaBase)
      ? `${rlWaBase}?text=${encodeURIComponent(msgReuniao(rlNome, rlDate, rlHora, rlTipo, rlLink))}`
      : null
    const waTab = waHref ? window.open('about:blank', '_blank') : null
    setRlSaving(true)
    try {
      const descricao = [
        rlTipo === 'Videochamada' ? 'Videochamada' : 'Presencial',
        rlLink ? `${rlTipo === 'Videochamada' ? 'Link' : 'Local'}: ${rlLink}` : null,
        rlTelefone ? `Contacto: ${rlTelefone}` : null,
        rlNota || null,
      ].filter(Boolean).join('\n')
      const res = await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo:     `Reunião: ${rlNome.trim()}`,
          descricao:  descricao || null,
          data_prazo: rlDate,
          hora:       rlHora || null,
          status:     'NOVA',
          evento_id:  null,
        }),
      })
      const d = await res.json()
      if (d.tarefa) {
        setTarefas(prev => [...prev, {
          id:         d.tarefa.id,
          titulo:     d.tarefa.titulo,
          descricao:  d.tarefa.descricao,
          status:     d.tarefa.status,
          data_prazo: d.tarefa.data_prazo,
          hora:       d.tarefa.hora,
          evento_id:  d.tarefa.evento_id ?? null,
        }])
        setRlOpen(false)
        if (waHref) {
          if (waTab) waTab.location.href = waHref
          else window.open(waHref, '_blank', 'noopener')
        }
        window.dispatchEvent(new CustomEvent('timeblocks-set-day', { detail: { day: rlDate, resync: false } }))
        startTransition(() => router.refresh())
      } else {
        waTab?.close()
        alert('Erro ao guardar a reunião')
      }
    } catch (e) {
      waTab?.close()
      throw e
    } finally {
      setRlSaving(false)
    }
  }

  // ── Pré-Wedding modal ──────────────────────────────────────────────────
  type PortalRow = { referencia: string; noiva: string; noivo: string; cliente: string; data_evento: string | null; has_pw: boolean; pw_date: string | null; pw_time: string | null; sem_portal: boolean }
  type FreelancerRow = { id: string; nome: string; status: string | null }
  const [pwOpen, setPwOpen]       = useState(false)
  const [pwDate, setPwDate]       = useState<string>('')
  const [pwPortais, setPwPortais] = useState<PortalRow[]>([])
  const [pwReferencia, setPwReferencia] = useState<string>('')
  const [pwBusca, setPwBusca]     = useState<string>('')
  const [pwHora, setPwHora]       = useState<string>('14:00')
  const [pwLocal, setPwLocal]     = useState<string>('')
  const [pwSaving, setPwSaving]   = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwFreelancers, setPwFreelancers] = useState<FreelancerRow[]>([])
  const [pwFreelancerId, setPwFreelancerId] = useState<string>('')
  // Períodos de indisponibilidade de TODOS os membros (carregados 1x ao abrir)
  type DisponibPeriodo = { id: string; freelancer_id: string; data_inicio: string; data_fim: string | null; motivo: string | null }
  const [pwIndisponib, setPwIndisponib] = useState<DisponibPeriodo[]>([])

  // Helper: devolve o período que cobre dia + freelancer (ou null)
  function getIndispMatch(freelancerId: string, iso: string): DisponibPeriodo | null {
    if (!freelancerId || !iso) return null
    for (const p of pwIndisponib) {
      if (p.freelancer_id !== freelancerId) continue
      const start = p.data_inicio
      const end = p.data_fim || p.data_inicio
      if (iso >= start && iso <= end) return p
    }
    return null
  }
  const pwIndispMatch = getIndispMatch(pwFreelancerId, pwDate)

  function openPreWedding(dateStr: string) {
    setPwDate(dateStr)
    setPwReferencia(''); setPwBusca(''); setPwHora('14:00'); setPwLocal(''); setPwFreelancerId('')
    setPwOpen(true)
    setChooserDate(null)
    if (pwPortais.length === 0) {
      setPwLoading(true)
      Promise.all([
        fetch('/api/calendario-add/portais-list', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ portais: [] })),
        fetch('/api/freelancers', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ freelancers: [] })),
        fetch('/api/freelancer-disponibilidade', { cache: 'no-store' }).then(r => r.json()).catch(() => ({ periodos: [] })),
      ]).then(([dPortais, dFls, dDisp]) => {
        setPwPortais(dPortais.portais ?? [])
        // Filtra freelancers activos com email definido, ordena por nome
        const list: FreelancerRow[] = (dFls.freelancers ?? [])
          .filter((f: any) => f?.id && f?.nome)
          .map((f: any) => ({ id: f.id, nome: f.nome, status: f.status ?? null }))
          .sort((a: FreelancerRow, b: FreelancerRow) => a.nome.localeCompare(b.nome))
        setPwFreelancers(list)
        setPwIndisponib(dDisp.periodos ?? [])
        setPwLoading(false)
      })
    } else {
      // Re-carrega indisponibilidades sempre (são dinâmicas)
      fetch('/api/freelancer-disponibilidade', { cache: 'no-store' })
        .then(r => r.json())
        .then(d => setPwIndisponib(d.periodos ?? []))
        .catch(() => {})
      if (pwFreelancers.length === 0) {
        fetch('/api/freelancers', { cache: 'no-store' })
          .then(r => r.json())
          .then(d => {
            const list: FreelancerRow[] = (d.freelancers ?? [])
              .filter((f: any) => f?.id && f?.nome)
              .map((f: any) => ({ id: f.id, nome: f.nome, status: f.status ?? null }))
              .sort((a: FreelancerRow, b: FreelancerRow) => a.nome.localeCompare(b.nome))
            setPwFreelancers(list)
          }).catch(() => {})
      }
    }
  }

  async function handleDeletePreWedding(referencia: string, data: string | null) {
    if (!referencia) return
    if (!confirm('Eliminar este pré-wedding?\n\nO bloco correspondente nos Time Blocks também é apagado.')) return
    const res = await fetch(`/api/calendario-add/pre-wedding?referencia=${encodeURIComponent(referencia)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setSelected(null)
      if (data) window.dispatchEvent(new CustomEvent('timeblocks-set-day', { detail: { day: data, resync: true } }))
      startTransition(() => router.refresh())
    } else {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? 'Erro ao eliminar')
    }
  }

  async function handleDeleteReuniao(crmId: string, data: string | null) {
    if (!crmId) return
    if (!confirm('Eliminar esta reunião?\n\nO bloco correspondente nos Time Blocks também é apagado.')) return
    const res = await fetch(`/api/calendario-add/reuniao?crm_id=${encodeURIComponent(crmId)}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setSelected(null)
      if (data) window.dispatchEvent(new CustomEvent('timeblocks-set-day', { detail: { day: data, resync: true } }))
      startTransition(() => router.refresh())
    } else {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? 'Erro ao eliminar')
    }
  }

  async function handleSavePreWedding() {
    if (!pwReferencia || !pwDate) return

    // ── Confirma se o membro escolhido marcou indisponibilidade ──
    const indispMatch = getIndispMatch(pwFreelancerId, pwDate)
    if (indispMatch) {
      const nome = pwFreelancers.find(f => f.id === pwFreelancerId)?.nome ?? 'O membro'
      const periodo = indispMatch.data_inicio === (indispMatch.data_fim || indispMatch.data_inicio)
        ? indispMatch.data_inicio
        : `${indispMatch.data_inicio} → ${indispMatch.data_fim}`
      const motivoSuffix = indispMatch.motivo ? `\nMotivo: ${indispMatch.motivo}` : ''
      const ok = window.confirm(
        `⚠ ${nome} marcou indisponibilidade para ${periodo}.${motivoSuffix}\n\n` +
        `Queres mesmo assim atribuir-lhe este Pré-Wedding?`
      )
      if (!ok) return
    }

    setPwSaving(true)
    try {
      const res = await fetch('/api/calendario-add/pre-wedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referencia: pwReferencia,
          data: pwDate,
          hora: pwHora || null,
          local: pwLocal || null,
          freelancer_id: pwFreelancerId || null,
        }),
      })
      const d = await res.json()
      if (res.ok) {
        setPwOpen(false)
        // Salta o TimeBlocks para o dia do PW + força re-sync
        window.dispatchEvent(new CustomEvent('timeblocks-set-day', { detail: { day: pwDate, resync: true } }))
        startTransition(() => router.refresh())
      } else {
        alert(d.error ?? 'Erro ao guardar pré-wedding')
      }
    } finally {
      setPwSaving(false)
    }
  }

  async function handleCreateTask() {
    if (!addTaskDate || !taskTitulo.trim()) return
    setTaskSaving(true)
    try {
      const res = await fetch('/api/tarefas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo:     taskTitulo,
          descricao:  taskDesc || null,
          data_prazo: addTaskDate,
          hora:       taskHora || null,
          status:     'NOVA',
          evento_id:  taskEventoId || null,
        }),
      })
      const d = await res.json()
      if (d.tarefa) {
        setTarefas(prev => [...prev, {
          id:         d.tarefa.id,
          titulo:     d.tarefa.titulo,
          descricao:  d.tarefa.descricao,
          status:     d.tarefa.status,
          data_prazo: d.tarefa.data_prazo,
          hora:       d.tarefa.hora,
          evento_id:  d.tarefa.evento_id ?? null,
        }])
        // Salta o TimeBlocks para o dia da tarefa
        if (addTaskDate) {
          window.dispatchEvent(new CustomEvent('timeblocks-set-day', { detail: { day: addTaskDate, resync: false } }))
        }
        setAddTaskDate(null)
        startTransition(() => router.refresh())
      }
    } finally {
      setTaskSaving(false)
    }
  }

  function startEditTask(t: TarefaEvent) {
    setEditTitulo(t.titulo)
    setEditHora(t.hora ? t.hora.slice(0, 5) : '')
    setEditDesc(t.descricao ?? '')
    setEditStatus(t.status)
    setEditEventoId(t.evento_id ?? '')
    setEditingTask(true)
  }

  async function handleUpdateTask() {
    if (selected?.kind !== 'tarefa') return
    setEditSaving(true)
    try {
      const res = await fetch(`/api/tarefas/${selected.data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo:    editTitulo,
          descricao: editDesc || null,
          hora:      editHora || null,
          status:    editStatus,
          evento_id: editEventoId || null,
        }),
      })
      if (res.ok) {
        setTarefas(prev => prev.map(t => t.id === selected.data.id
          ? {
              ...t,
              titulo:    editTitulo,
              descricao: editDesc || null,
              hora:      editHora || null,
              status:    editStatus,
              evento_id: editEventoId || null,
            }
          : t
        ))
        setSelected(null)
        setEditingTask(false)
        startTransition(() => router.refresh())
      }
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDeleteTask(id: string) {
    if (!confirm('Eliminar esta tarefa?')) return
    const res = await fetch(`/api/tarefas/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTarefas(prev => prev.filter(t => t.id !== id))
      setSelected(null)
      setEditingTask(false)
      startTransition(() => router.refresh())
    }
  }

  const firstDay    = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate()
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  // Month strip — count all types
  const monthCounts = Array.from({ length: 12 }, (_, i) => {
    const ev = events.filter(e => {
      if (!e.data_evento) return false
      const d = new Date(e.data_evento + 'T00:00:00')
      return d.getFullYear() === viewYear && d.getMonth() === i
    }).length
    const pw = preWeddings.filter(p => {
      const d = new Date(p.data_evento + 'T00:00:00')
      return d.getFullYear() === viewYear && d.getMonth() === i
    }).length
    const te = teamEntries.filter(t => {
      if (t.status !== 'confirmado') return false
      const d = new Date(t.data_calendar + 'T00:00:00')
      return d.getFullYear() === viewYear && d.getMonth() === i
    }).length
    const re = reunioes.filter(r => {
      const d = new Date(r.reuniao_data + 'T00:00:00')
      return d.getFullYear() === viewYear && d.getMonth() === i
    }).length
    const ta = tarefas.filter(t => {
      const d = new Date(t.data_prazo + 'T00:00:00')
      return d.getFullYear() === viewYear && d.getMonth() === i
    }).length
    return ev + pw + te + re + ta
  })

  // ── Filtros por tipo (a legenda antiga passou a ligar/desligar) ────────
  const [filtros, setFiltros] = useState<Record<FiltroKey, boolean>>({
    casamento: true, pw: true, reuniao: true, tarefa: true, equipa: true,
  })

  const prefixoMes = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
  const noMes = (iso: string | null | undefined) => !!iso && iso.startsWith(prefixoMes)
  const contagensMes: Record<FiltroKey, number> = {
    casamento: events.filter(e => noMes(e.data_evento)).length,
    pw:        preWeddings.filter(p => noMes(p.data_evento)).length,
    reuniao:   reunioes.filter(r => noMes(r.reuniao_data)).length,
    tarefa:    tarefas.filter(t => noMes(t.data_prazo)).length,
    equipa:    teamEntries.filter(t => noMes(t.data_calendar)).length,
  }

  // ── Agenda de um dia, já com os filtros aplicados ──────────────────────
  type AgendaItem = { key: string; label: string; cor: string; hora: string | null; sel: SelectedItem }
  function agendaDoDia(iso: string): AgendaItem[] {
    const out: AgendaItem[] = []
    if (filtros.casamento) for (const e of events) {
      if (e.data_evento?.startsWith(iso)) out.push({ key: `ev-${e.id}`, label: e.cliente || e.referencia, cor: '#C9A84C', hora: null, sel: { kind: 'event', data: e } })
    }
    if (filtros.pw) for (const p of preWeddings) {
      if (p.data_evento.startsWith(iso)) out.push({ key: `pw-${p.id}`, label: `Pré-wedding · ${p.nomes}`, cor: '#4FC3C3', hora: p.hora ? p.hora.slice(0, 5) : null, sel: { kind: 'pw', data: p } })
    }
    if (filtros.reuniao) for (const r of reunioes) {
      if (r.reuniao_data.startsWith(iso)) out.push({ key: `re-${r.id}`, label: `Reunião · ${r.nome}`, cor: '#C084FC', hora: r.reuniao_hora ? r.reuniao_hora.slice(0, 5) : null, sel: { kind: 'reuniao', data: r } })
    }
    if (filtros.tarefa) for (const t of tarefas) {
      if (t.data_prazo.startsWith(iso)) out.push({
        key: `ta-${t.id}`, label: t.titulo,
        cor: t.status === 'CONCLUIDA' ? '#86EFAC' : t.status === 'PENDENTE' ? '#FB923C' : '#60A5FA',
        hora: t.hora ? t.hora.slice(0, 5) : null, sel: { kind: 'tarefa', data: t },
      })
    }
    if (filtros.equipa) for (const t of teamEntries) {
      if (t.data_calendar.startsWith(iso)) out.push({
        key: `te-${t.id}`,
        label: `${t.freelancer_nome} · ${t.status === 'indisponivel' ? 'indisponível' : TIPO_NOMES[t.tipo]}`,
        cor: t.status === 'indisponivel' ? '#F87171' : TIPO_COLORS[t.tipo].text,
        hora: null, sel: { kind: 'team', data: t },
      })
    }
    return out.sort((a, b) => (a.hora ?? '99:99').localeCompare(b.hora ?? '99:99'))
  }

  const hojeIso     = isoDe(today)
  const agendaHoje  = agendaDoDia(hojeIso)
  const proximosDias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i + 1)
    const iso = isoDe(d)
    return { iso, itens: agendaDoDia(iso) }
  }).filter(d => d.itens.length > 0)

  // Próximo casamento a contar de hoje
  const proximoCasamento = events
    .filter(e => e.data_evento && e.data_evento.slice(0, 10) >= hojeIso)
    .sort((a, b) => a.data_evento!.localeCompare(b.data_evento!))[0] ?? null
  const diasAteCasamento = proximoCasamento
    ? Math.round(
        (new Date(proximoCasamento.data_evento!.slice(0, 10) + 'T00:00:00').getTime()
          - new Date(hojeIso + 'T00:00:00').getTime()) / 86400000
      )
    : null

  function irParaHoje() {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  // ── Atalhos de teclado: setas mudam de mês, H volta a hoje ─────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const alvo = e.target as HTMLElement | null
      if (alvo && (/^(INPUT|TEXTAREA|SELECT)$/.test(alvo.tagName) || alvo.isContentEditable)) return
      if (selected || chooserDate || addTaskDate || reuniaoOpen || pwOpen || rlOpen) return
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevMonth() }
      else if (e.key === 'ArrowRight') { e.preventDefault(); nextMonth() }
      else if (e.key === 'h' || e.key === 'H') { e.preventDefault(); irParaHoje() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="min-h-screen bg-[#080808] overflow-x-hidden">

      {/* ── Barra de comando (fica colada ao topo) ───────────────────── */}
      <div className="sticky top-0 z-30 backdrop-blur-xl bg-[#080808]/85 border-b border-white/[0.07]">
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-2 sm:gap-4">
          <Link href="/secao/490653af-115b-4a9b-9d88-902c1a60f9c1"
            title="Voltar ao menu"
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg border border-white/10 text-white/40 hover:text-[#C9A84C] hover:border-[#C9A84C]/40 transition-all">
            ‹
          </Link>
          <div className="leading-tight hidden sm:block">
            <div className="text-[9px] tracking-[0.4em] text-white/25 uppercase">RL Photo.Video</div>
            <div className="text-[13px] tracking-[0.35em] text-[#C9A84C] uppercase">Calendário</div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-white/10 overflow-hidden">
              <button onClick={prevMonth} title="Mês anterior"
                className="w-9 h-9 text-white/40 hover:text-[#C9A84C] hover:bg-white/[0.04] transition-all">‹</button>
              <div className="px-2 sm:px-4 text-center min-w-[104px] sm:min-w-[140px]">
                <div className="text-[13px] tracking-[0.25em] uppercase text-white">{MESES[viewMonth]}</div>
                <div className="text-[9px] tracking-[0.3em] text-[#C9A84C]/60">{viewYear}</div>
              </div>
              <button onClick={nextMonth} title="Mês seguinte"
                className="w-9 h-9 text-white/40 hover:text-[#C9A84C] hover:bg-white/[0.04] transition-all">›</button>
            </div>
            <button onClick={irParaHoje}
              className="h-9 px-3 rounded-xl border border-[#C9A84C]/35 bg-[#C9A84C]/10 text-[#C9A84C] text-[10px] tracking-[0.25em] uppercase hover:bg-[#C9A84C]/20 transition-all">
              Hoje
            </button>
            <div className="hidden sm:block"><GoogleSyncButton /></div>
          </div>
        </div>

        {/* Fita dos meses do ano */}
        <div className="max-w-[1500px] mx-auto px-4 sm:px-6 pb-2.5 flex items-center gap-2">
          <button onClick={() => setViewYear(y => y - 1)}
            className="h-7 px-1.5 sm:px-2 flex-shrink-0 rounded-md text-[10px] tracking-widest text-white/25 hover:text-[#C9A84C] transition-colors">
            ‹ {viewYear - 1}
          </button>
          <div className="flex-1 grid grid-cols-6 sm:grid-cols-12 gap-1">
            {MESES.map((m, i) => (
              <button key={i} onClick={() => setViewMonth(i)}
                className={`h-8 rounded-lg text-[10px] tracking-[0.15em] uppercase transition-all ${
                  i === viewMonth
                    ? 'bg-[#C9A84C] text-black font-semibold shadow-[0_0_20px_-4px_rgba(201,168,76,0.6)]'
                    : 'border border-white/[0.07] text-white/35 hover:text-white/80 hover:border-[#C9A84C]/35'
                }`}>
                {m.slice(0, 3)}
                {monthCounts[i] > 0 && (
                  <span className={`ml-1 text-[9px] ${i === viewMonth ? 'text-black/60' : 'text-[#C9A84C]/50'}`}>
                    {monthCounts[i]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <button onClick={() => setViewYear(y => y + 1)}
            className="h-7 px-1.5 sm:px-2 flex-shrink-0 rounded-md text-[10px] tracking-widest text-white/25 hover:text-[#C9A84C] transition-colors">
            {viewYear + 1} ›
          </button>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-5">

        {/* ── Filtros (a antiga legenda, agora a servir para alguma coisa) ── */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-[9px] tracking-[0.3em] text-white/20 uppercase mr-1">Mostrar</span>
          {FILTRO_META.map(f => {
            const on = filtros[f.key]
            return (
              <button key={f.key} onClick={() => setFiltros(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                className="h-7 px-2.5 rounded-lg text-[10px] tracking-wider flex items-center gap-1.5 transition-all"
                style={on
                  ? { background: f.cor + '22', border: `1px solid ${f.cor}55`, color: f.cor }
                  : { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)' }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: on ? f.cor : 'rgba(255,255,255,0.2)' }} />
                {f.label}
                <span className="opacity-50">{contagensMes[f.key]}</span>
              </button>
            )
          })}
          <span className="ml-auto hidden lg:block text-[10px] text-white/20 tracking-wider">
            ← → muda de mês · H volta a hoje
          </span>
        </div>

        <div className="flex flex-col xl:flex-row gap-5 items-start">

          {/* ── Grelha do mês ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0 w-full">
            <div className="rounded-2xl border border-white/[0.07] overflow-hidden bg-white/[0.012]">
              <div className="grid grid-cols-7 border-b border-white/[0.07]">
                {DIAS_SEMANA.map((d, i) => (
                  <div key={d}
                    className={`py-2.5 text-center text-[9px] tracking-[0.3em] uppercase ${
                      i === 0 ? 'text-red-400/35' : i === 6 ? 'text-[#C9A84C]/35' : 'text-white/25'
                    }`}>
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {Array.from({ length: totalCells }, (_, i) => {
                  const col = i % 7
                  let day: number
                  let isCurrentMonth = true

                  if (i < firstDay) {
                    day = daysInPrev - firstDay + i + 1
                    isCurrentMonth = false
                  } else if (i >= firstDay + daysInMonth) {
                    day = i - firstDay - daysInMonth + 1
                    isCurrentMonth = false
                  } else {
                    day = i - firstDay + 1
                  }

                  const dayEvents   = isCurrentMonth && filtros.casamento ? events.filter(e => startsOn(e.data_evento, viewYear, viewMonth, day)) : []
                  const dayPws      = isCurrentMonth && filtros.pw        ? preWeddings.filter(p => startsOn(p.data_evento, viewYear, viewMonth, day)) : []
                  const dayTeam     = isCurrentMonth && filtros.equipa    ? teamEntries.filter(t => startsOn(t.data_calendar, viewYear, viewMonth, day)) : []
                  const dayReunioes = isCurrentMonth && filtros.reuniao   ? reunioes.filter(r => startsOn(r.reuniao_data, viewYear, viewMonth, day)) : []
                  const dayTarefas  = isCurrentMonth && filtros.tarefa    ? tarefas.filter(t => startsOn(t.data_prazo, viewYear, viewMonth, day)) : []

                  const isToday = isCurrentMonth
                    && day === today.getDate()
                    && viewMonth === today.getMonth()
                    && viewYear === today.getFullYear()
                  const isSunday  = col === 0
                  const isWeekend = col === 0 || col === 6
                  const isLastRow = i >= totalCells - 7
                  const isLastCol = col === 6

                  const MAX = 4
                  const allItems = [
                    ...dayEvents.map(e => ({ kind: 'event' as const, e })),
                    ...dayPws.map(p => ({ kind: 'pw' as const, p })),
                    ...dayTeam.map(t => ({ kind: 'team' as const, t })),
                    ...dayReunioes.map(r => ({ kind: 'reuniao' as const, r })),
                    ...dayTarefas.map(t => ({ kind: 'tarefa' as const, t })),
                  ]
                  const visible  = allItems.slice(0, MAX)
                  const overflow = allItems.length - MAX

                  return (
                    <div key={i}
                      onClick={() => { if (isCurrentMonth) openChooser(viewYear, viewMonth, day) }}
                      className={`group relative min-h-[124px] p-2 flex flex-col cursor-pointer transition-colors
                        ${!isLastRow ? 'border-b border-white/[0.05]' : ''}
                        ${!isLastCol ? 'border-r border-white/[0.05]' : ''}
                        ${isCurrentMonth
                          ? (isWeekend ? 'bg-white/[0.022] hover:bg-white/[0.045]' : 'hover:bg-white/[0.035]')
                          : 'bg-black/40'}
                      `}>
                      {isToday && (
                        <>
                          <span className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-[#C9A84C]/45" />
                          <span className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#C9A84C]/[0.10] to-transparent" />
                        </>
                      )}

                      {/* Número do dia */}
                      <div className="relative flex items-center justify-between mb-1.5 flex-shrink-0">
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[11px] tabular-nums
                          ${isToday ? 'bg-[#C9A84C] text-black font-semibold shadow-[0_0_14px_-2px_rgba(201,168,76,0.8)]' : ''}
                          ${!isToday && isCurrentMonth && !isSunday ? 'text-white/55' : ''}
                          ${!isToday && isCurrentMonth && isSunday ? 'text-red-400/55' : ''}
                          ${!isCurrentMonth ? 'text-white/[0.12]' : ''}
                        `}>
                          {day}
                        </div>
                        {isCurrentMonth && (
                          <span className="text-[15px] leading-none text-transparent group-hover:text-[#C9A84C]/60 transition-colors"
                            title="Adicionar neste dia">＋</span>
                        )}
                      </div>

                      <div className="relative flex flex-col gap-1 overflow-hidden flex-1">
                        {visible.map((item) => {
                          if (item.kind === 'event') {
                            const ev = item.e
                            return (
                              <button key={`ev-${ev.id}`} onClick={(e) => { e.stopPropagation(); setSelected({ kind: 'event', data: ev }) }} className="text-left w-full">
                                <Pill cor="#C9A84C">{ev.cliente || ev.referencia}</Pill>
                              </button>
                            )
                          }
                          if (item.kind === 'pw') {
                            const pw = item.p
                            return (
                              <button key={`pw-${pw.id}`} onClick={(e) => { e.stopPropagation(); setSelected({ kind: 'pw', data: pw }) }} className="text-left w-full">
                                <Pill cor="#4FC3C3">📷 {pw.nomes}</Pill>
                              </button>
                            )
                          }
                          if (item.kind === 'reuniao') {
                            const r = item.r
                            return (
                              <button key={`re-${r.id}`} onClick={(e) => { e.stopPropagation(); setSelected({ kind: 'reuniao', data: r }) }} className="text-left w-full">
                                <Pill cor="#C084FC">🤝 {r.nome.split(' ')[0]}</Pill>
                              </button>
                            )
                          }
                          if (item.kind === 'tarefa') {
                            const ta = item.t
                            const linkedEvent = ta.evento_id ? eventsById.get(ta.evento_id) : null
                            const cor = ta.status === 'CONCLUIDA' ? '#86EFAC'
                              : ta.status === 'PENDENTE' ? '#FB923C'
                              : linkedEvent ? '#C9A84C'
                              : '#60A5FA'
                            const horaStr = ta.hora ? ta.hora.slice(0, 5) : null
                            return (
                              <button key={`ta-${ta.id}`} onClick={(e) => { e.stopPropagation(); setSelected({ kind: 'tarefa', data: ta }) }} className="text-left w-full">
                                <Pill cor={cor} riscado={ta.status === 'CONCLUIDA'}>
                                  {linkedEvent ? '🔗 ' : '📝 '}
                                  {horaStr ? <span className="opacity-60 tabular-nums">{horaStr} </span> : null}
                                  {ta.titulo}
                                </Pill>
                              </button>
                            )
                          }
                          const t = item.t
                          const tc = TIPO_COLORS[t.tipo]
                          const isIndis = t.status === 'indisponivel'
                          return (
                            <button key={`te-${t.id}`} onClick={(e) => { e.stopPropagation(); setSelected({ kind: 'team', data: t }) }} className="text-left w-full">
                              <Pill cor={isIndis ? '#F87171' : tc.text}>
                                {isIndis ? '✕' : TIPO_LABELS[t.tipo]} {t.freelancer_nome.split(' ')[0]}
                              </Pill>
                            </button>
                          )
                        })}

                        {overflow > 0 && (
                          <div className="text-[9px] text-white/25 pl-1 group-hover:text-[#C9A84C]/70 transition-colors">
                            +{overflow} mais
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-white/25 tracking-wider">
              <span>Clica num dia para criar tarefa, reunião ou pré-wedding.</span>
              <span className="ml-auto text-white/[0.15]">
                {events.length} eventos · {preWeddings.length} pré-weddings · {teamEntries.filter(t => t.status === 'confirmado').length} confirmações · {tarefas.length} tarefas
              </span>
            </div>
          </div>

          {/* ── Coluna lateral ─────────────────────────────────────── */}
          <aside className="w-full xl:w-[330px] flex-shrink-0 space-y-4">

            {/* Hoje */}
            <div className="rounded-2xl border border-[#C9A84C]/25 bg-gradient-to-b from-[#C9A84C]/[0.07] to-transparent p-4">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[9px] tracking-[0.4em] text-[#C9A84C]/70 uppercase">Hoje</span>
                <span className="text-[10px] text-white/30 tracking-wider">
                  {today.getDate()} {MESES[today.getMonth()].slice(0, 3).toLowerCase()}
                </span>
              </div>
              <div className="text-lg font-light text-white tracking-wide mb-3 capitalize">
                {new Date(hojeIso + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'long' })}
              </div>
              {agendaHoje.length === 0 ? (
                <div className="text-[11px] text-white/25 tracking-wider">Nada marcado para hoje.</div>
              ) : (
                <div className="space-y-1.5">
                  {agendaHoje.map(it => (
                    <button key={it.key} onClick={() => setSelected(it.sel)}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors hover:bg-white/[0.06]"
                      style={{ background: it.cor + '14' }}>
                      <span className="w-0.5 h-7 rounded-full flex-shrink-0" style={{ background: it.cor }} />
                      <span className="text-[10px] tabular-nums text-white/40 w-9 flex-shrink-0">{it.hora ?? '—'}</span>
                      <span className="text-xs text-white/80 truncate">{it.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Próximo casamento */}
            {proximoCasamento && (
              <div className="rounded-2xl border border-white/[0.07] p-4">
                <div className="text-[9px] tracking-[0.4em] text-white/30 uppercase mb-2">Próximo casamento</div>
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-[#C9A84C] truncate">
                      {proximoCasamento.cliente || proximoCasamento.referencia}
                    </div>
                    <div className="text-[10px] text-white/30 tracking-wider mt-0.5">
                      {fmtDate(proximoCasamento.data_evento!.slice(0, 10))}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-light text-white leading-none tabular-nums">{diasAteCasamento}</div>
                    <div className="text-[9px] tracking-[0.2em] text-white/30 uppercase">
                      {diasAteCasamento === 0 ? 'hoje' : diasAteCasamento === 1 ? 'dia' : 'dias'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Próximos 7 dias */}
            <div className="rounded-2xl border border-white/[0.07] p-4">
              <div className="text-[9px] tracking-[0.4em] text-white/30 uppercase mb-3">Próximos 7 dias</div>
              {proximosDias.length === 0 ? (
                <div className="text-[11px] text-white/25 tracking-wider">Semana livre.</div>
              ) : (
                <div className="space-y-3">
                  {proximosDias.map(dia => (
                    <div key={dia.iso}>
                      <div className="text-[10px] tracking-[0.2em] text-white/30 uppercase mb-1.5">
                        {DIAS_SEMANA[new Date(dia.iso + 'T00:00:00').getDay()]} {Number(dia.iso.slice(8, 10))}
                      </div>
                      {dia.itens.map(it => (
                        <button key={it.key} onClick={() => setSelected(it.sel)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-white/[0.04] transition-colors">
                          <span className="w-0.5 h-5 rounded-full flex-shrink-0" style={{ background: it.cor }} />
                          <span className="text-[10px] tabular-nums text-white/35 w-9 flex-shrink-0">{it.hora ?? '—'}</span>
                          <span className="text-[11px] text-white/70 truncate">{it.label}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sm:hidden"><GoogleSyncButton /></div>
          </aside>
        </div>

        {/* Time Blocks */}
        <TimeBlocks events={events} tarefas={tarefas} preWeddings={preWeddings} reunioes={reunioes} />
      </div>


      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelected(null)}>
          <div className="w-full max-w-md bg-[#111] rounded-2xl p-6"
            style={{
              border: `1px solid ${
                selected.kind === 'pw'      ? 'rgba(79,195,195,0.25)' :
                selected.kind === 'reuniao' ? 'rgba(192,132,252,0.30)' :
                selected.kind === 'team'    ? (
                  selected.data.status === 'indisponivel'
                    ? 'rgba(239,68,68,0.25)'
                    : TIPO_COLORS[selected.data.tipo].border
                ) : 'rgba(201,168,76,0.2)'
              }`
            }}
            onClick={e => e.stopPropagation()}>

            {selected.kind === 'event' && (
              <>
                <div className="text-[10px] tracking-[0.4em] text-[#C9A84C]/50 uppercase mb-1">{selected.data.referencia}</div>
                <h2 className="text-xl font-light text-white tracking-wide mb-4">{selected.data.cliente || '—'}</h2>
                <div className="space-y-2 mb-6">
                  {selected.data.data_evento && <Row label="Data">{fmtDate(selected.data.data_evento)}</Row>}
                  {selected.data.local && <Row label="Local">{selected.data.local}</Row>}
                  {selected.data.tipo_evento?.length > 0 && <Row label="Tipo">{selected.data.tipo_evento.join(', ')}</Row>}
                  {selected.data.fotografo?.length > 0 && <Row label="Foto">{selected.data.fotografo.join(', ')}</Row>}
                  {selected.data.videografo?.length > 0 && <Row label="Vídeo">{selected.data.videografo.join(', ')}</Row>}
                </div>
                <ModalActions>
                  <Link href={`/eventos-2026/${selected.data.id}`}
                    className="flex-1 text-center py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                    style={{ background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.30)', color: '#C9A84C' }}>
                    Ver Evento
                  </Link>
                  <CloseBtn onClose={() => setSelected(null)} />
                </ModalActions>
              </>
            )}

            {selected.kind === 'pw' && (
              <>
                <div className="text-[10px] tracking-[0.4em] text-[#4FC3C3]/50 uppercase mb-1">PRÉ-WEDDING · {selected.data.referencia}</div>
                <h2 className="text-xl font-light text-white tracking-wide mb-4">{selected.data.nomes}</h2>
                <div className="space-y-2 mb-6">
                  <Row label="Data">{fmtDate(selected.data.data_evento)}</Row>
                  {selected.data.hora && <Row label="Hora">{selected.data.hora}</Row>}
                  {selected.data.local && <Row label="Local">{selected.data.local}</Row>}
                </div>
                <div className="flex gap-3">
                  <Link href="/pre-wedding"
                    className="flex-1 text-center py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                    style={{ background: 'rgba(79,195,195,0.10)', border: '1px solid rgba(79,195,195,0.30)', color: '#4FC3C3' }}>
                    Ver Pré-Wedding
                  </Link>
                  <button onClick={() => handleDeletePreWedding(selected.data.referencia, selected.data.data_evento)}
                    className="px-4 py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                    style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#F87171' }}>
                    Eliminar
                  </button>
                  <CloseBtn onClose={() => setSelected(null)} />
                </div>
              </>
            )}

            {selected.kind === 'reuniao' && (() => {
              const r = selected.data
              return (
                <>
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-1" style={{ color: 'rgba(192,132,252,0.6)' }}>
                    REUNIÃO CRM · {r.reuniao_tipo || 'Presencial'}
                  </div>
                  <h2 className="text-xl font-light text-white tracking-wide mb-4">{r.nome}</h2>
                  <div className="space-y-2 mb-6">
                    <Row label="Data">{fmtDate(r.reuniao_data)}</Row>
                    {r.reuniao_hora && <Row label="Hora">{r.reuniao_hora}</Row>}
                    <Row label="Tipo">{r.reuniao_tipo || 'Presencial'}</Row>
                    {r.reuniao_link && (
                      <Row label={r.reuniao_tipo === 'Videochamada' ? 'Meet' : 'Local'}>
                        <a href={r.reuniao_link} target="_blank" rel="noopener noreferrer"
                          className={`hover:opacity-80 transition-opacity break-all ${r.reuniao_tipo === 'Videochamada' ? 'text-green-400' : 'text-blue-400'}`}>
                          {r.reuniao_tipo === 'Videochamada' ? r.reuniao_link : '📍 Ver no Google Maps'}
                        </a>
                      </Row>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Link href={`/crm/${r.id}`}
                      className="flex-1 text-center py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                      style={{ background: 'rgba(192,132,252,0.10)', border: '1px solid rgba(192,132,252,0.30)', color: '#C084FC' }}>
                      Ver Ficha CRM
                    </Link>
                    <button onClick={() => handleDeleteReuniao(r.id, r.reuniao_data)}
                      className="px-4 py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                      style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#F87171' }}>
                      Eliminar
                    </button>
                    <CloseBtn onClose={() => setSelected(null)} />
                  </div>
                </>
              )
            })()}

            {selected.kind === 'tarefa' && (() => {
              const ta = selected.data
              const rm = dadosReuniaoTarefa(ta)
              const rmWaBase = whatsappLink(rm.tel)
              const rmWaHref = rmWaBase
                ? `${rmWaBase}?text=${encodeURIComponent(msgReuniao(rm.nome, ta.data_prazo, (ta.hora ?? '').slice(0, 5), rm.tipo, rm.alvo))}`
                : null
              const statusCol = ta.status === 'CONCLUIDA'
                ? { text: '#86EFAC', border: 'rgba(74,222,128,0.30)', bg: 'rgba(74,222,128,0.10)' }
                : ta.status === 'PENDENTE'
                ? { text: '#FB923C', border: 'rgba(251,146,60,0.30)', bg: 'rgba(251,146,60,0.10)' }
                : { text: '#60A5FA', border: 'rgba(96,165,250,0.30)', bg: 'rgba(96,165,250,0.10)' }
              return (
                <>
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-1" style={{ color: statusCol.text + 'B0' }}>
                    📝 TAREFA · {ta.status}
                  </div>

                  {!editingTask ? (
                    <>
                      <h2 className="text-xl font-light text-white tracking-wide mb-4">{ta.titulo}</h2>
                      <div className="space-y-2 mb-6">
                        <Row label="Data">{fmtDate(ta.data_prazo)}</Row>
                        {ta.hora && <Row label="Hora">{ta.hora.slice(0, 5)}</Row>}
                        {ta.evento_id && eventsById.get(ta.evento_id) && (
                          <Row label="Evento">
                            <Link href={`/eventos-2026/${ta.evento_id}`}
                              className="text-[#C9A84C] hover:underline">
                              🔗 {eventsById.get(ta.evento_id)!.cliente || eventsById.get(ta.evento_id)!.referencia}
                            </Link>
                          </Row>
                        )}
                        {ta.descricao && <Row label="Notas"><span className="whitespace-pre-line break-words">{ta.descricao}</span></Row>}
                      </div>

                      {(rm.url || rmWaHref) && (
                        <div className="flex gap-2 mb-3">
                          {rm.url && (
                            <a href={rm.url} target="_blank" rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                              style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.40)', color: '#60A5FA' }}>
                              {rm.tipo === 'Videochamada' ? '💻 Entrar no Meet' : '📍 Ver no Maps'}
                            </a>
                          )}
                          {rmWaHref && (
                            <a href={rmWaHref} target="_blank" rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                              style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.40)', color: '#25D366' }}>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.25 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.1-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z"/>
                              </svg>
                              WhatsApp
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex gap-3">
                        <button onClick={() => startEditTask(ta)}
                          className="flex-1 text-center py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                          style={{ background: statusCol.bg, border: `1px solid ${statusCol.border}`, color: statusCol.text }}>
                          Editar
                        </button>
                        <button onClick={() => handleDeleteTask(ta.id)}
                          className="px-4 py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                          style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', color: '#F87171' }}>
                          Eliminar
                        </button>
                        <CloseBtn onClose={() => setSelected(null)} />
                      </div>
                    </>
                  ) : (
                    <>
                      <input
                        value={editTitulo}
                        onChange={e => setEditTitulo(e.target.value)}
                        placeholder="Título"
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40 mb-3"
                      />
                      <div className="flex gap-2 mb-3">
                        <input
                          type="time"
                          value={editHora}
                          onChange={e => setEditHora(e.target.value)}
                          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40"
                        />
                        <select
                          value={editStatus}
                          onChange={e => setEditStatus(e.target.value as TarefaEvent['status'])}
                          className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40"
                        >
                          <option value="NOVA">Nova</option>
                          <option value="PENDENTE">Pendente</option>
                          <option value="CONCLUIDA">Concluída</option>
                        </select>
                      </div>
                      <select
                        value={editEventoId}
                        onChange={e => setEditEventoId(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40 mb-3"
                      >
                        <option value="">— Sem ligação a evento —</option>
                        {nearbyEvents(ta.data_prazo).map(ev => (
                          <option key={ev.id} value={ev.id}>
                            {ev.data_evento ? ev.data_evento.slice(0, 10) + ' · ' : ''}{ev.cliente || ev.referencia}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                        placeholder="Notas (opcional)"
                        rows={3}
                        className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40 mb-4 resize-none"
                      />
                      <div className="flex gap-3">
                        <button onClick={handleUpdateTask} disabled={editSaving || !editTitulo.trim()}
                          className="flex-1 py-2.5 rounded-xl text-sm tracking-wider transition-colors disabled:opacity-50"
                          style={{ background: statusCol.bg, border: `1px solid ${statusCol.border}`, color: statusCol.text }}>
                          {editSaving ? 'A guardar…' : 'Guardar'}
                        </button>
                        <button onClick={() => setEditingTask(false)}
                          className="px-4 py-2.5 border border-white/10 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </>
                  )}
                </>
              )
            })()}

            {selected.kind === 'team' && (() => {
              const t = selected.data
              const isIndis = t.status === 'indisponivel'
              const c = isIndis
                ? { text: '#F87171', border: 'rgba(239,68,68,0.30)', bg: 'rgba(239,68,68,0.10)' }
                : { text: TIPO_COLORS[t.tipo].text, border: TIPO_COLORS[t.tipo].border, bg: TIPO_COLORS[t.tipo].bg }
              const tipoLabel = t.tipo === 'confirmacao' ? 'CONFIRMAÇÃO DE PRESENÇA'
                : t.tipo === 'edicao_fotos'  ? 'EDIÇÃO DE FOTOS'
                : t.tipo === 'edicao_album'  ? 'EDIÇÃO DE ÁLBUM'
                : 'EDIÇÃO DE VÍDEO'
              return (
                <>
                  <div className="text-[10px] tracking-[0.4em] uppercase mb-1" style={{ color: c.text + '80' }}>
                    {tipoLabel}
                  </div>
                  <h2 className="text-xl font-light text-white tracking-wide mb-1">{t.freelancer_nome}</h2>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs mb-4"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                    {isIndis ? '✕ Indisponível' : '✓ Confirmado'}
                  </div>
                  <div className="space-y-2 mb-6">
                    <Row label="Confirmou em">{fmtDate(t.data_calendar)}</Row>
                    <Row label="Data evento">{fmtDate(t.data_evento)}</Row>
                    {t.local && <Row label="Local">{t.local}</Row>}
                  </div>
                  <ModalActions>
                    <Link href="/freelancers"
                      className="flex-1 text-center py-2.5 rounded-xl text-sm tracking-wider transition-colors"
                      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                      Ver Equipa
                    </Link>
                    <CloseBtn onClose={() => setSelected(null)} />
                  </ModalActions>
                </>
              )
            })()}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {addTaskDate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setAddTaskDate(null)}>
          <div className="w-full max-w-md bg-[#111] rounded-2xl p-6 border border-[#C9A84C]/25"
            onClick={e => e.stopPropagation()}>
            <div className="text-[10px] tracking-[0.4em] text-[#C9A84C]/60 uppercase mb-1">📝 NOVA TAREFA</div>
            <h2 className="text-xl font-light text-white tracking-wide mb-4">{fmtDate(addTaskDate)}</h2>

            <input
              value={taskTitulo}
              onChange={e => setTaskTitulo(e.target.value)}
              placeholder="Título da tarefa"
              autoFocus
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40 mb-3"
              onKeyDown={e => { if (e.key === 'Enter' && taskTitulo.trim() && !taskSaving) handleCreateTask() }}
            />

            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Hora</label>
                <input
                  type="time"
                  value={taskHora}
                  onChange={e => setTaskHora(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Ligar a evento (opcional)</label>
              <select
                value={taskEventoId}
                onChange={e => setTaskEventoId(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40"
              >
                <option value="">— Sem ligação —</option>
                {nearbyEvents(addTaskDate).map(ev => (
                  <option key={ev.id} value={ev.id}>
                    {ev.data_evento ? ev.data_evento.slice(0, 10) + ' · ' : ''}{ev.cliente || ev.referencia}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              value={taskDesc}
              onChange={e => setTaskDesc(e.target.value)}
              placeholder="Notas (opcional)"
              rows={3}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40 mb-4 resize-none"
            />

            <div className="flex gap-3">
              <button onClick={handleCreateTask}
                disabled={taskSaving || !taskTitulo.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm tracking-wider transition-colors disabled:opacity-50"
                style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.40)', color: '#C9A84C' }}>
                {taskSaving ? 'A guardar…' : 'Adicionar Tarefa'}
              </button>
              <button onClick={() => setAddTaskDate(null)}
                className="px-4 py-2.5 border border-white/10 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────── Chooser ────────────────────────── */}
      {chooserDate && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setChooserDate(null)}>
          <div className="w-full max-w-md bg-[#111] rounded-2xl p-6 border border-white/15"
            onClick={e => e.stopPropagation()}>
            <div className="text-[10px] tracking-[0.4em] text-white/40 uppercase mb-1">+ NOVO EVENTO</div>
            <h2 className="text-lg font-light text-white tracking-wide mb-5">{fmtDate(chooserDate)}</h2>

            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => { openAddTask(parseInt(chooserDate.slice(0,4), 10), parseInt(chooserDate.slice(5,7), 10) - 1, parseInt(chooserDate.slice(8,10), 10)); setChooserDate(null) }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-white/[0.04]"
                style={{ background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.25)' }}>
                <span className="text-2xl">📝</span>
                <div className="flex-1">
                  <div className="text-sm text-white">Tarefa</div>
                  <div className="text-[10px] text-white/40 tracking-wider">Pequena tarefa do dia com hora</div>
                </div>
              </button>

              <button
                onClick={() => openReuniao(chooserDate)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-white/[0.04]"
                style={{ background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.25)' }}>
                <span className="text-2xl">🤝</span>
                <div className="flex-1">
                  <div className="text-sm text-white">Reunião CRM</div>
                  <div className="text-[10px] text-white/40 tracking-wider">Agendar reunião num contacto existente</div>
                </div>
              </button>

              <button
                onClick={() => openReuniaoLivre(chooserDate)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-white/[0.04]"
                style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)' }}>
                <span className="text-2xl">💻</span>
                <div className="flex-1">
                  <div className="text-sm text-white">Reunião (fora do CRM)</div>
                  <div className="text-[10px] text-white/40 tracking-wider">Com qualquer pessoa, link Meet e aviso por WhatsApp</div>
                </div>
              </button>

              <button
                onClick={() => openPreWedding(chooserDate)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-white/[0.04]"
                style={{ background: 'rgba(79,195,195,0.08)', border: '1px solid rgba(79,195,195,0.25)' }}>
                <span className="text-2xl">📷</span>
                <div className="flex-1">
                  <div className="text-sm text-white">Pré-Wedding</div>
                  <div className="text-[10px] text-white/40 tracking-wider">Marcar sessão pré-wedding num casamento</div>
                </div>
              </button>
            </div>

            <div className="mt-4 text-[10px] text-white/30 tracking-wider">
              Sai automaticamente para os Time Blocks deste dia.
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────── Reunião modal ────────────────────────── */}
      {reuniaoOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setReuniaoOpen(false)}>
          <div className="w-full max-w-md bg-[#111] rounded-2xl p-6 border max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'rgba(192,132,252,0.30)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-[10px] tracking-[0.4em] uppercase mb-1" style={{ color: '#C084FCB0' }}>🤝 NOVA REUNIÃO CRM</div>
            <h2 className="text-lg font-light text-white tracking-wide mb-4">{fmtDate(reuniaoDate)}</h2>

            <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Contacto</label>
            <select value={reuniaoCrmId} onChange={e => setReuniaoCrmId(e.target.value)}
              disabled={reuniaoLoading}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C084FC]/40 mb-3">
              <option value="">{reuniaoLoading ? 'A carregar contactos…' : '— Escolhe contacto —'}</option>
              {reuniaoContactos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nome}{c.contato ? ` · ${c.contato}` : ''}{c.reuniao_data ? `  (já tem reunião ${c.reuniao_data})` : ''}
                </option>
              ))}
            </select>

            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Hora</label>
                <input type="time" value={reuniaoHora} onChange={e => setReuniaoHora(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C084FC]/40" />
              </div>
              <div className="flex-1">
                <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Tipo</label>
                <select value={reuniaoTipo} onChange={e => changeReuniaoTipo(e.target.value as any)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C084FC]/40">
                  <option value="Presencial">Presencial</option>
                  <option value="Videochamada">Videochamada</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mb-1">
              <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase">
                {reuniaoTipo === 'Videochamada' ? 'Link Meet' : 'Local'}
              </label>
              {reuniaoLink !== (reuniaoTipo === 'Videochamada' ? MEET_LINK : MAPS_LINK) && (
                <button type="button"
                  onClick={() => setReuniaoLink(reuniaoTipo === 'Videochamada' ? MEET_LINK : MAPS_LINK)}
                  className="text-[9px] tracking-[0.2em] uppercase px-2 py-1 rounded-md transition-colors"
                  style={{ background: 'rgba(192,132,252,0.10)', border: '1px solid rgba(192,132,252,0.30)', color: '#C084FC' }}>
                  {reuniaoTipo === 'Videochamada' ? 'Usar Meet RL' : 'Usar estúdio RL'}
                </button>
              )}
            </div>
            <input value={reuniaoLink} onChange={e => setReuniaoLink(e.target.value)}
              placeholder={reuniaoTipo === 'Videochamada' ? 'https://meet.google.com/…' : 'Morada / sala'}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C084FC]/40 mb-4" />

            <div className="flex gap-3">
              <button onClick={() => handleSaveReuniao(false)}
                disabled={reuniaoSaving || !reuniaoCrmId}
                className="flex-1 py-2.5 rounded-xl text-sm tracking-wider transition-colors disabled:opacity-50"
                style={{ background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.45)', color: '#C084FC' }}>
                {reuniaoSaving ? 'A guardar…' : 'Agendar Reunião'}
              </button>
              <button onClick={() => setReuniaoOpen(false)}
                className="px-4 py-2.5 border border-white/10 rounded-xl text-sm text-white/40 hover:text-white/70">
                Cancelar
              </button>
            </div>

            {/* Agendar e avisar o cliente no WhatsApp (dia, hora e link) */}
            <button onClick={() => handleSaveReuniao(true)}
              disabled={reuniaoSaving || !reuniaoCrmId || !reuniaoWaBase}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm tracking-wider transition-colors disabled:opacity-40"
              style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.40)', color: '#25D366' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.25 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.1-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z"/>
              </svg>
              {reuniaoWaBase ? 'Agendar e avisar no WhatsApp' : 'Contacto sem número de WhatsApp'}
            </button>
          </div>
        </div>
      )}

      {/* ────────────── Reunião fora do CRM ────────────── */}
      {rlOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setRlOpen(false)}>
          <div className="w-full max-w-md bg-[#111] rounded-2xl p-6 border max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'rgba(201,168,76,0.30)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-[10px] tracking-[0.4em] uppercase mb-1" style={{ color: 'rgba(201,168,76,0.70)' }}>💻 NOVA REUNIÃO</div>
            <h2 className="text-lg font-light text-white tracking-wide mb-4">{fmtDate(rlDate)}</h2>

            <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Com quem</label>
            <input value={rlNome} onChange={e => setRlNome(e.target.value)}
              placeholder="Nome da pessoa ou empresa"
              autoFocus
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40 mb-3" />

            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Hora</label>
                <input type="time" value={rlHora} onChange={e => setRlHora(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40" />
              </div>
              <div className="flex-1">
                <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Tipo</label>
                <select value={rlTipo} onChange={e => changeRlTipo(e.target.value as any)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C9A84C]/40">
                  <option value="Videochamada">Videochamada</option>
                  <option value="Presencial">Presencial</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mb-1">
              <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase">
                {rlTipo === 'Videochamada' ? 'Link Meet' : 'Local'}
              </label>
              {rlLink !== (rlTipo === 'Videochamada' ? MEET_LINK : MAPS_LINK) && (
                <button type="button"
                  onClick={() => setRlLink(rlTipo === 'Videochamada' ? MEET_LINK : MAPS_LINK)}
                  className="text-[9px] tracking-[0.2em] uppercase px-2 py-1 rounded-md transition-colors"
                  style={{ background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.30)', color: '#C9A84C' }}>
                  {rlTipo === 'Videochamada' ? 'Usar Meet RL' : 'Usar estúdio RL'}
                </button>
              )}
            </div>
            <input value={rlLink} onChange={e => setRlLink(e.target.value)}
              placeholder={rlTipo === 'Videochamada' ? 'https://meet.google.com/…' : 'Morada / sala'}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40 mb-3" />

            <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Número de WhatsApp (opcional)</label>
            <input value={rlTelefone} onChange={e => setRlTelefone(e.target.value)}
              placeholder="912 345 678"
              inputMode="tel"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40 mb-3" />

            <textarea value={rlNota} onChange={e => setRlNota(e.target.value)}
              placeholder="Notas (opcional)"
              rows={2}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9A84C]/40 mb-4 resize-none" />

            <div className="flex gap-3">
              <button onClick={() => handleSaveReuniaoLivre(false)}
                disabled={rlSaving || !rlNome.trim()}
                className="flex-1 py-2.5 rounded-xl text-sm tracking-wider transition-colors disabled:opacity-50"
                style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.45)', color: '#C9A84C' }}>
                {rlSaving ? 'A guardar…' : 'Agendar Reunião'}
              </button>
              <button onClick={() => setRlOpen(false)}
                className="px-4 py-2.5 border border-white/10 rounded-xl text-sm text-white/40 hover:text-white/70">
                Cancelar
              </button>
            </div>

            <button onClick={() => handleSaveReuniaoLivre(true)}
              disabled={rlSaving || !rlNome.trim() || !rlWaBase}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm tracking-wider transition-colors disabled:opacity-40"
              style={{ background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.40)', color: '#25D366' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.17 8.17 0 0 1-1.25-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.25 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.1-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.48-.29Z"/>
              </svg>
              {rlWaBase ? 'Agendar e avisar no WhatsApp' : 'Escreve o número para avisar no WhatsApp'}
            </button>

            <div className="mt-3 text-[10px] text-white/30 tracking-wider">
              Fica guardada como tarefa com hora, visível no calendário e nos Time Blocks.
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────── Pré-Wedding modal ────────────────────────── */}
      {pwOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setPwOpen(false)}>
          <div className="w-full max-w-md bg-[#111] rounded-2xl p-6 border max-h-[90vh] overflow-y-auto"
            style={{ borderColor: 'rgba(79,195,195,0.30)' }}
            onClick={e => e.stopPropagation()}>
            <div className="text-[10px] tracking-[0.4em] uppercase mb-1" style={{ color: '#4FC3C3B0' }}>📷 NOVO PRÉ-WEDDING</div>
            <h2 className="text-lg font-light text-white tracking-wide mb-4">{fmtDate(pwDate)}</h2>

            <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Casamento</label>
            {(() => {
              const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
              const nomesDe = (p: PortalRow) => [p.noiva, p.noivo].filter(Boolean).join(' & ') || p.cliente
              const sel = pwPortais.find(p => p.referencia === pwReferencia)
              if (sel) {
                return (
                  <div className="flex items-center gap-2 w-full bg-black/30 border border-[#4FC3C3]/40 rounded-lg px-3 py-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{nomesDe(sel) || '(sem nome)'}</div>
                      <div className="text-[11px] text-white/40">{sel.referencia}{sel.has_pw ? ` · já tem PW ${sel.pw_date}` : ''}</div>
                    </div>
                    <button type="button" onClick={() => { setPwReferencia(''); setPwBusca('') }}
                      className="text-[11px] text-[#4FC3C3] hover:underline shrink-0">Trocar</button>
                  </div>
                )
              }
              const termos = norm(pwBusca).split(/\s+/).filter(Boolean)
              const lista = pwPortais.filter(p => {
                const alvo = norm(`${p.referencia} ${p.noiva} ${p.noivo} ${p.cliente}`)
                return termos.every(t => alvo.includes(t))
              })
              return (
                <div className="mb-3">
                  <input value={pwBusca} onChange={e => setPwBusca(e.target.value)} autoFocus
                    disabled={pwLoading}
                    placeholder={pwLoading ? 'A carregar portais…' : 'Procurar por nome dos noivos ou referência'}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#4FC3C3]/40" />
                  {!pwLoading && (
                    <div className="mt-1 max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-black/30 divide-y divide-white/5">
                      {lista.length === 0 && <div className="px-3 py-2 text-xs text-white/40">Nenhum casamento encontrado</div>}
                      {lista.map(p => (
                        <button key={p.referencia} type="button" disabled={p.sem_portal}
                          onClick={() => setPwReferencia(p.referencia)}
                          title={p.sem_portal ? 'Este casamento ainda não tem portal. Cria o portal para poder marcar o PW.' : undefined}
                          className="w-full text-left px-3 py-2 hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                          <div className="text-sm text-white truncate">{nomesDe(p) || '(sem nome)'}</div>
                          <div className="text-[11px] text-white/40">
                            {p.referencia}
                            {p.sem_portal ? ' · sem portal' : ''}
                            {p.has_pw ? ` · já tem PW ${p.pw_date}` : ''}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Hora</label>
                <input type="time" value={pwHora} onChange={e => setPwHora(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4FC3C3]/40" />
              </div>
            </div>

            <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">Local (opcional)</label>
            <input value={pwLocal} onChange={e => setPwLocal(e.target.value)}
              placeholder="ex.: Quinta da Aroeira"
              className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#4FC3C3]/40 mb-3" />

            <label className="block text-[9px] tracking-[0.3em] text-white/30 uppercase mb-1">
              Membro da Equipa <span className="opacity-50 normal-case tracking-wide">(notifica e aparece no calendário dele)</span>
            </label>
            <select value={pwFreelancerId} onChange={e => setPwFreelancerId(e.target.value)}
              disabled={pwLoading || pwFreelancers.length === 0}
              className={`w-full bg-black/30 border rounded-lg px-3 py-2 text-sm text-white focus:outline-none mb-2 disabled:opacity-50 transition-colors ${
                pwIndispMatch ? 'border-red-500/55 focus:border-red-500/70' : 'border-white/10 focus:border-[#4FC3C3]/40'
              }`}>
              <option value="">— Sem atribuição —</option>
              {pwFreelancers.map(f => {
                // Indica indisponibilidade no próprio label
                const indisp = getIndispMatch(f.id, pwDate)
                return (
                  <option key={f.id} value={f.id}>
                    {indisp ? '⚠ ' : ''}{f.nome}{f.status ? ` · ${f.status}` : ''}{indisp ? ' (INDISPONÍVEL)' : ''}
                  </option>
                )
              })}
            </select>
            {/* Aviso laranja/vermelho quando o membro escolhido está indisponível */}
            {pwIndispMatch && (
              <div className="mb-4 rounded-lg p-3 flex items-start gap-2.5"
                style={{
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))',
                  border: '1px solid rgba(239,68,68,0.45)',
                  boxShadow: '0 0 14px -4px rgba(239,68,68,0.35)',
                }}>
                <span className="text-[14px] mt-0.5 shrink-0" style={{ color: '#fb7185' }}>⚠</span>
                <div className="min-w-0">
                  <p className="text-[11px] tracking-[0.25em] uppercase font-bold mb-1" style={{ color: '#fb7185' }}>
                    Membro indisponível nesta data
                  </p>
                  <p className="text-[12px] text-white/80 leading-relaxed">
                    {pwFreelancers.find(f => f.id === pwFreelancerId)?.nome ?? 'O membro'} marcou{' '}
                    <strong className="text-white">
                      {pwIndispMatch.data_inicio === (pwIndispMatch.data_fim || pwIndispMatch.data_inicio)
                        ? pwIndispMatch.data_inicio
                        : `${pwIndispMatch.data_inicio} → ${pwIndispMatch.data_fim}`}
                    </strong> como indisponível
                    {pwIndispMatch.motivo ? ` (${pwIndispMatch.motivo})` : ''}.
                  </p>
                  <p className="text-[11px] text-white/45 mt-1 italic">
                    Podes prosseguir mesmo assim — terás de confirmar.
                  </p>
                </div>
              </div>
            )}
            {!pwIndispMatch && <div className="mb-2" />}

            <div className="flex gap-3">
              <button onClick={handleSavePreWedding}
                disabled={pwSaving || !pwReferencia}
                className="flex-1 py-2.5 rounded-xl text-sm tracking-wider transition-colors disabled:opacity-50"
                style={{ background: 'rgba(79,195,195,0.15)', border: '1px solid rgba(79,195,195,0.45)', color: '#4FC3C3' }}>
                {pwSaving ? 'A guardar…' : 'Marcar Pré-Wedding'}
              </button>
              <button onClick={() => setPwOpen(false)}
                className="px-4 py-2.5 border border-white/10 rounded-xl text-sm text-white/40 hover:text-white/70">
                Cancelar
              </button>
            </div>

            <div className="mt-3 text-[10px] text-white/30 tracking-wider">
              ⚠️ Se o casamento já tem um PW marcado, este novo substitui o anterior.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Lê os dados da reunião que o modal guarda na descrição da tarefa
function dadosReuniaoTarefa(ta: TarefaEvent) {
  const d = ta.descricao ?? ''
  // Formato novo (Link:/Local:) com recurso ao formato antigo (URL solto)
  const alvo = (d.match(/^(?:Link|Local):\s*(.+)$/m) ?? [])[1]
    ?? (d.match(/https?:\/\/\S+/) ?? [])[0] ?? ''
  const tel  = (d.match(/^Contacto:\s*(.+)$/m) ?? [])[1] ?? ''
  const tipo: 'Presencial' | 'Videochamada' =
    /meet\.google\.com/.test(alvo) || /^Videochamada/m.test(d) ? 'Videochamada' : 'Presencial'
  const nome = ta.titulo.replace(/^Reunião:\s*/i, '').trim()
  // Morada escrita à mão abre como pesquisa no Maps
  const url = !alvo ? ''
    : /^https?:\/\//.test(alvo) ? alvo
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alvo)}`
  return { alvo: alvo.trim(), url, tel: tel.trim(), tipo, nome }
}

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-PT', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-[10px] tracking-[0.3em] text-white/30 uppercase w-20 pt-0.5 flex-shrink-0">{label}</span>
      <span className="text-sm text-white/70">{children}</span>
    </div>
  )
}

function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-3">{children}</div>
}

function CloseBtn({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose}
      className="px-4 py-2.5 border border-white/10 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors">
      Fechar
    </button>
  )
}
