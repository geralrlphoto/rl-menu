'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import EventoTarefas from './EventoTarefas'

// ─── Serviços extra ────────────────────────────────────────────────────────────
const SERVICOS_OPCOES = [
  { label: 'PRÉ-WEDDING',     notion: 'Pré-Wedding' },
  { label: 'DRONE',           notion: 'DRONE' },
  { label: 'SDE',             notion: 'SDE' },
  { label: 'TRASH THE DRESS', notion: 'Foto Lembrança' },
  { label: '2.º VIDEÓGRAFO',  notion: '2.ºVIDEOGRAFO' },
  { label: 'ASSISTENTE',      notion: 'ASSISTENTE' },
]

// ─── Datas ─────────────────────────────────────────────────────────────────────
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function formatDate(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d + 'T00:00:00')
  return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()]} ${dt.getFullYear()}`
}

function addCalendarDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function addWorkingDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  let count = 0
  while (count < days) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) count++
  }
  return d.toISOString().split('T')[0]
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type Evento = {
  id: string
  referencia: string
  cliente: string
  data_evento: string
  local: string
  tipo_evento: string[]
  tipo_servico: string[]
  servicos_dia?: string[]
  servico_extra: string[]
  status: string
  fotografo: string[]
  videografo: string[]
  editor_fotos: string
  editor_album: string[]
  editor_video: string[]
  proposta: string
  valor_liquido: number | null
  valor_foto: number | null
  valor_real_foto: number | null
  valor_video: number | null
  valor_extras: number | null
  data_entrega: string | null
  data_entrega_ini: string | null
  data_entrada: string | null
  fotos_enviadas: boolean
  sel_enviado: boolean
  alerta_30du: boolean
  agendamento_email: string
  contratos: string | null
  nome_noiva: string
  nome_noivo: string
  email_noiva: string
  email_noivo: string
  tel_noiva: string
  tel_noivo: string
  morada_noiva: string
  morada_noivo: string
  cc_noiva: string
  cc_noivo: string
  nif_noiva: string
  nif_noivo: string
  servico_foto: string[]
  servico_video: string[]
  nome_disco: string[]
  backup_disco: string[]
  fotos_edicao_estado: string | null
  sel_fotos_estado: string | null
  video_estado: string | null
  album_estado: string | null
  notion_url: string
}

// ─── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="ficha-reveal relative overflow-hidden rounded-2xl border border-white/[0.07] p-6 pl-7 flex flex-col gap-4 transition-all duration-300 hover:border-gold/20"
      style={{ background: 'linear-gradient(158deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.006) 60%, rgba(201,164,92,0.015) 100%)' }}>
      {/* barra dourada lateral */}
      <span className="pointer-events-none absolute left-0 top-6 bottom-6 w-[2px] rounded-full"
        style={{ background: 'linear-gradient(to bottom, rgba(201,164,92,0.7), rgba(201,164,92,0))' }} />
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-[10px] tracking-[0.38em] text-gold uppercase font-semibold">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold" style={{ boxShadow: '0 0 9px rgba(201,164,92,0.7)' }} />
          {title}
        </h2>
        {right && <div>{right}</div>}
      </div>
      {children}
    </section>
  )
}

// ─── Cabeçalho de bloco (divisória premium entre grupos de secções) ──────────
function BlocoHeader({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div className="ficha-bloco ficha-reveal print:hidden">
      <span className="num">{num}</span>
      <span className="txt">{children}</span>
      <span className="line" />
    </div>
  )
}

// ─── Campo texto inline editável ───────────────────────────────────────────────
function EditField({ label, value, field, eventId, type = 'text', large = false, mono = false, suffix, onSaved }: {
  label: string; value: string | number | null; field: string; eventId: string
  type?: 'text' | 'number' | 'email' | 'tel' | 'url' | 'date'; large?: boolean; mono?: boolean
  suffix?: string
  onSaved: (field: string, val: any) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value ?? ''))
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(String(value ?? '')) }, [value])
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  async function save() {
    setEditing(false)
    if (draft === String(value ?? '')) return
    setSaving(true)
    const payload: any = {}
    payload[field] = type === 'number' ? (draft === '' ? null : Number(draft)) : draft
    await fetch(`/api/eventos-notion/${eventId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    onSaved(field, payload[field])
    setSaving(false)
  }

  const displayVal = value !== null && value !== '' && value !== undefined ? String(value) : null

  if (editing) return (
    <div className="flex flex-col gap-0.5">
      {label && <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">{label}</span>}
      <input ref={ref} type={type} value={draft}
        onChange={e => setDraft(e.target.value)} onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(String(value ?? '')); setEditing(false) } }}
        className={`bg-white/5 border border-gold/40 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-gold w-full ${large ? 'text-2xl font-light' : 'text-sm'}`}
      />
    </div>
  )

  return (
    <div className="flex flex-col gap-0.5 group/f">
      {label && <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">{label}</span>}
      <button onClick={() => setEditing(true)}
        className={`text-left hover:bg-white/5 px-2 py-1 -mx-2 rounded-lg transition-colors flex items-center gap-2 ${large ? 'text-2xl font-light text-white' : mono ? 'text-sm tracking-[0.3em] text-gold/70 uppercase font-medium font-mono' : 'text-sm text-white/80 hover:text-white'}`}>
        {displayVal
          ? <span>{displayVal}{suffix ? <span className="text-white/40 ml-1">{suffix}</span> : null}</span>
          : <span className={`italic ${large ? 'text-white/20' : 'text-white/20'}`}>Clica para editar</span>
        }
        {saving
          ? <span className="text-[9px] text-white/20 ml-auto">...</span>
          : <span className="text-[9px] text-white/15 ml-auto opacity-0 group-hover/f:opacity-100 transition-opacity">✎</span>
        }
      </button>
    </div>
  )
}

// ─── Multi-select inline editável ─────────────────────────────────────────────
function EditMultiField({ label, value, field, eventId, referencia, onSaved }: {
  label: string; value: string[]; field: string; eventId: string
  /** Referência do evento — usada para fallback persistente em portais.settings */
  referencia?: string | null
  onSaved: (field: string, val: any) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState((value ?? []).join(', '))
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft((value ?? []).join(', ')) }, [value])
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  async function save() {
    setEditing(false)
    const newVal = draft.split(',').map(s => s.trim()).filter(Boolean)
    if (JSON.stringify(newVal) === JSON.stringify(value ?? [])) return
    setSaving(true)
    // Optimistic — actualiza UI já
    onSaved(field, newVal)
    const payload: any = {}; payload[field] = newVal
    // Persistência paralela: tenta o Notion E o Supabase. Mesmo que o
    // Notion falhe (token, sincronização, etc.), o valor fica gravado
    // em portais.settings[field] e é lido na próxima vez.
    await Promise.allSettled([
      fetch(`/api/eventos-notion/${eventId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
      referencia
        ? fetch('/api/portais', {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referencia,
              updates: { settings: { [field]: newVal } },
            }),
          })
        : Promise.resolve(),
    ])
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-0.5 group/f">
      <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">{label}</span>
      {editing
        ? <input ref={ref} type="text" value={draft} placeholder="Separa por vírgulas"
            onChange={e => setDraft(e.target.value)} onBlur={save}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft((value ?? []).join(', ')); setEditing(false) } }}
            className="bg-white/5 border border-gold/40 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold w-full"
          />
        : <button onClick={() => setEditing(true)}
            className="text-left text-sm text-white/80 hover:text-white px-2 py-1 -mx-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2">
            {(value ?? []).length > 0
              ? <span>{value.join(', ')}</span>
              : <span className="text-white/20 italic">Clica para editar</span>}
            {saving ? <span className="text-[9px] text-white/20 ml-auto">...</span>
              : <span className="text-[9px] text-white/15 ml-auto opacity-0 group-hover/f:opacity-100 transition-opacity">✎</span>}
          </button>
      }
    </div>
  )
}

// ─── Equipa field — salva no Supabase, NÃO no Notion ──────────────────────────
function EditEquipaField({ label, field, multi, eventoId, referencia, local, dataCasamento, initialValue, options, onChanged, unavailableNames }: {
  label: string; field: 'fotografo' | 'videografo' | 'editor_album' | 'editor_video' | 'editor_fotos'; multi: boolean
  eventoId: string; referencia: string; local: string; dataCasamento: string
  initialValue: string[]; options: string[]; onChanged?: (val: string[]) => void
  unavailableNames?: string[]
}) {
  const [value, setValue] = useState<string[]>(initialValue)
  const [open, setOpen]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Load from Supabase on mount — use referencia as primary key (Notion-independent)
  useEffect(() => {
    const qs = referencia ? `ref=${encodeURIComponent(referencia)}` : `evento_id=${eventoId}`
    fetch(`/api/evento-equipa?${qs}`)
      .then(r => r.json())
      .then(d => {
        const loaded = d.equipa ? (d.equipa[field] ?? initialValue) : initialValue
        setValue(loaded)
        // Defer parent state update to avoid React render-phase warning
        setTimeout(() => onChanged?.(loaded), 0)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [referencia, eventoId, field])

  useEffect(() => {
    if (!open || !loaded) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, loaded])

  // Guarda em cada alteração (UX imediata + protege contra fechos inesperados)
  async function persist(next: string[]) {
    setSaving(true)
    try {
      await fetch('/api/evento-equipa', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referencia,          // primary key — Notion-independent
          evento_id: eventoId, // kept for freelancer_casamentos sync
          local,
          data_casamento: dataCasamento || null,
          [field]: next,
        }),
      })
    } finally { setSaving(false) }
  }

  async function toggle(opt: string) {
    let next: string[]
    if (multi) {
      next = value.includes(opt) ? value.filter(x => x !== opt) : [...value, opt]
    } else {
      next = value.includes(opt) ? [] : [opt]
    }
    setValue(next)
    onChanged?.(next)
    await persist(next)
  }

  async function removeOne(name: string) {
    const next = value.filter(x => x !== name)
    setValue(next)
    onChanged?.(next)
    await persist(next)
  }

  const tagCls = (name: string) => {
    const isUnavail = unavailableNames?.includes(name.toUpperCase())
    if (isUnavail) return 'text-[10px] px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-400 border border-red-500/30'
    return multi
      ? 'text-[10px] px-1.5 py-0.5 rounded-md bg-gold/10 text-gold/80 border border-gold/20'
      : 'text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20'
  }

  return (
    <div className="flex flex-col gap-0.5 group/f" ref={ref}>
      <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">{label}</span>
      <div className="relative">
        <button onClick={() => setOpen(o => !o)}
          className="w-full text-left px-2 py-1 -mx-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2 min-h-[28px]">
          {value.length > 0
            ? <span className="flex flex-wrap gap-1">{value.map(v => (
                <span key={v} className={`${tagCls(v)} inline-flex items-center gap-1 group/chip`}>
                  {unavailableNames?.includes(v.toUpperCase()) && <span>⚠</span>}
                  <span>{v}</span>
                  <span
                    role="button"
                    title={`Remover ${v}`}
                    onClick={(ev) => { ev.stopPropagation(); ev.preventDefault(); removeOne(v) }}
                    onMouseDown={(ev) => ev.stopPropagation()}
                    className="ml-0.5 w-3.5 h-3.5 inline-flex items-center justify-center rounded-full text-[9px] leading-none cursor-pointer bg-white/5 hover:bg-red-500/30 hover:text-red-300 transition-colors opacity-60 hover:opacity-100"
                  >
                    ×
                  </span>
                </span>
              ))}</span>
            : <span className="text-white/20 italic text-sm">Clica para editar</span>}
          {saving
            ? <span className="text-[9px] text-white/20 ml-auto">...</span>
            : <span className="text-[9px] text-white/15 ml-auto opacity-0 group-hover/f:opacity-100 transition-opacity">✎</span>}
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 bg-[#111] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[200px]">
            {options.map(opt => (
              <button key={opt} onClick={() => toggle(opt)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.05] transition-colors text-left">
                <span className={`w-3.5 h-3.5 flex-shrink-0 border flex items-center justify-center transition-colors ${multi ? 'rounded' : 'rounded-full'} ${value.includes(opt) ? (multi ? 'bg-gold border-gold' : 'bg-emerald-500 border-emerald-500') : 'border-white/20'}`}>
                  {value.includes(opt) && (multi
                    ? <svg className="w-2 h-2 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    : <span className="w-1.5 h-1.5 rounded-full bg-white" />)}
                </span>
                <span className="text-xs text-white/70">{opt}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dropdown multi-select com opções fixas ────────────────────────────────────
function EditDropdownMulti({ label, value, field, eventId, options, onSaved }: {
  label: string; value: string[]; field: string; eventId: string
  options: string[]; onSaved: (field: string, val: any) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>(value ?? [])
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setDraft(value ?? []) }, [value])

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handleClose()
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open, draft])

  async function handleClose() {
    setOpen(false)
    if (JSON.stringify(draft) === JSON.stringify(value ?? [])) return
    setSaving(true)
    const payload: any = {}; payload[field] = draft
    await fetch(`/api/eventos-notion/${eventId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    onSaved(field, draft); setSaving(false)
  }

  function toggle(opt: string) {
    setDraft(d => d.includes(opt) ? d.filter(x => x !== opt) : [...d, opt])
  }

  return (
    <div className="flex flex-col gap-0.5 group/f" ref={ref}>
      <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">{label}</span>
      <div className="relative">
        <button onClick={() => setOpen(o => !o)}
          className="w-full text-left text-sm text-white/80 hover:text-white px-2 py-1 -mx-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2 min-h-[28px]">
          {draft.length > 0
            ? <span className="flex flex-wrap gap-1">{draft.map(v => (
                <span key={v} className="text-[10px] px-1.5 py-0.5 rounded-md bg-gold/10 text-gold/80 border border-gold/20">{v}</span>
              ))}</span>
            : <span className="text-white/20 italic text-sm">Clica para editar</span>}
          {saving
            ? <span className="text-[9px] text-white/20 ml-auto">...</span>
            : <span className="text-[9px] text-white/15 ml-auto opacity-0 group-hover/f:opacity-100 transition-opacity">✎</span>}
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 bg-[#111] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[200px]">
            {options.map(opt => (
              <button key={opt} onClick={() => toggle(opt)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.05] transition-colors text-left">
                <span className={`w-3.5 h-3.5 rounded flex-shrink-0 border flex items-center justify-center transition-colors ${draft.includes(opt) ? 'bg-gold border-gold' : 'border-white/20'}`}>
                  {draft.includes(opt) && <svg className="w-2 h-2 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                </span>
                <span className="text-xs text-white/70">{opt}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dropdown single-select com opções fixas ───────────────────────────────────
function EditDropdownSingle({ label, value, field, eventId, options, onSaved }: {
  label: string; value: string[]; field: string; eventId: string
  options: string[]; onSaved: (field: string, val: any) => void
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>(value ?? [])
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setDraft(value ?? []) }, [value])

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handleClose()
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open, draft])

  async function handleClose() {
    setOpen(false)
    if (JSON.stringify(draft) === JSON.stringify(value ?? [])) return
    setSaving(true)
    const payload: any = {}; payload[field] = draft
    await fetch(`/api/eventos-notion/${eventId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    onSaved(field, draft); setSaving(false)
  }

  function select(opt: string) {
    const next = draft.includes(opt) ? draft.filter(x => x !== opt) : [...draft, opt]
    setDraft(next)
  }

  return (
    <div className="flex flex-col gap-0.5 group/f" ref={ref}>
      <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">{label}</span>
      <div className="relative">
        <button onClick={() => setOpen(o => !o)}
          className="w-full text-left text-sm text-white/80 hover:text-white px-2 py-1 -mx-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2 min-h-[28px]">
          {draft.length > 0
            ? <span className="flex flex-wrap gap-1">{draft.map(v => (
                <span key={v} className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20">{v}</span>
              ))}</span>
            : <span className="text-white/20 italic text-sm">Clica para editar</span>}
          {saving
            ? <span className="text-[9px] text-white/20 ml-auto">...</span>
            : <span className="text-[9px] text-white/15 ml-auto opacity-0 group-hover/f:opacity-100 transition-opacity">✎</span>}
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 bg-[#111] border border-white/10 rounded-xl shadow-2xl py-1 min-w-[180px]">
            {options.map(opt => (
              <button key={opt} onClick={() => select(opt)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.05] transition-colors text-left">
                <span className={`w-3.5 h-3.5 rounded-full flex-shrink-0 border flex items-center justify-center transition-colors ${draft.includes(opt) ? 'bg-emerald-500 border-emerald-500' : 'border-white/20'}`}>
                  {draft.includes(opt) && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                <span className="text-xs text-white/70">{opt}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Select dropdown editável ──────────────────────────────────────────────────
function EditSelect({ label, value, field, eventId, options, onSaved }: {
  label: string; value: string | null; field: string; eventId: string
  options: string[]; onSaved: (field: string, val: any) => void
}) {
  const [saving, setSaving] = useState(false)

  async function onChange(val: string) {
    setSaving(true)
    const payload: any = {}; payload[field] = val || null
    await fetch(`/api/eventos-notion/${eventId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    onSaved(field, val); setSaving(false)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">{label}</span>
      <div className="relative">
        <select value={value ?? ''} onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-white/[0.04] border border-white/10 hover:border-gold/30 focus:border-gold/50 rounded-xl px-4 py-2.5 text-sm text-white/80 focus:outline-none transition-colors cursor-pointer pr-8">
          <option value="" className="bg-zinc-900">— Selecionar —</option>
          {options.map(o => <option key={o} value={o} className="bg-zinc-900">{o}</option>)}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">▾</span>
        {saving && <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[9px] text-white/20">...</span>}
      </div>
    </div>
  )
}

// ─── Checkbox editável ─────────────────────────────────────────────────────────
function EditCheck({ label, checked, field, eventId, onSaved }: {
  label: string; checked: boolean; field: string; eventId: string
  onSaved: (field: string, val: any) => void
}) {
  const [val, setVal] = useState(checked)
  const [saving, setSaving] = useState(false)
  useEffect(() => { setVal(checked) }, [checked])

  async function toggle() {
    const nv = !val; setVal(nv); setSaving(true)
    const payload: any = {}; payload[field] = nv
    await fetch(`/api/eventos-notion/${eventId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    onSaved(field, nv); setSaving(false)
  }

  return (
    <button onClick={toggle} className="flex items-center gap-2 group/c">
      <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] transition-colors ${val ? 'bg-green-500/30 border border-green-500/50 text-green-400' : 'bg-white/5 border border-white/10 text-white/20 group-hover/c:border-white/30'}`}>
        {val ? '✓' : ''}
      </div>
      <span className={`text-xs transition-colors ${val ? 'text-green-400/80' : 'text-white/30 group-hover/c:text-white/50'}`}>{label}</span>
      {saving && <span className="text-[9px] text-white/20">...</span>}
    </button>
  )
}

// ─── Checklist de serviços (multi_select) ──────────────────────────────────────
const ITEMS_VIDEO = [
  'UM VIDEÓGRAFO','DOIS VIDEÓGRAFOS','REPORTAGEM TODO O EVENTO',
  'VÍDEO ATÉ 25 MINUTOS','QUALIDADE FULL HD','ENTREGA POR LINK',
  'DESLOCAÇÃO','PRÉ-WEDDING','SDE','DRONE','TRASH THE DRESS','RELIVE WEDDING',
]
const ITEMS_FOTO = [
  'UM FOTÓGRAFO','DOIS FOTÓGRAFOS','REPORTAGEM TODO EVENTO',
  'ATÉ 700 FOTOGRAFIAS','ATÉ 850 FOTOGRAFIAS','ATÉ 1000 FOTOGRAFIAS',
  'ENTREGA DIGITAL','DESLOCAÇÃO','PRÉ-WEDDING','TRASH THE DRESS',
  'ÁLBUM 25X25','ÁLBUM 30X30','SNEAK PEAK','FOTO LEMBRANÇA',
]

function ServiceChecklist({ title, items, selected, field, eventId, onSaved }: {
  title: string; items: string[]; selected: string[]; field: string
  eventId: string; onSaved: (field: string, val: any) => void
}) {
  const [active, setActive] = useState<string[]>(selected)
  const [saving, setSaving] = useState(false)
  const [customMode, setCustomMode] = useState(false)
  const [customText, setCustomText] = useState('')
  useEffect(() => { setActive(selected) }, [selected])

  async function persist(newList: string[]) {
    setActive(newList); setSaving(true)
    const payload: any = {}; payload[field] = newList
    await fetch(`/api/eventos-notion/${eventId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    onSaved(field, newList); setSaving(false)
  }

  async function toggle(item: string) {
    const next = active.includes(item) ? active.filter(i => i !== item) : [...active, item]
    await persist(next)
  }

  async function addCustom() {
    const v = customText.trim().toUpperCase()
    if (!v) return
    if (active.includes(v)) { setCustomText(''); setCustomMode(false); return }
    await persist([...active, v])
    setCustomText('')
    setCustomMode(false)
  }

  const available = items.filter(i => !active.includes(i))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[9px] tracking-[0.35em] text-white/30 uppercase">{title}</span>
        {saving && <span className="text-[9px] text-white/20">...</span>}
      </div>

      {/* Tags activas */}
      {active.length > 0 && (
        <div className="flex flex-col gap-1">
          {active.map(item => (
            <button key={item} onClick={() => toggle(item)}
              className="flex items-center justify-between text-[11px] px-3 py-1.5 rounded-lg bg-gold/8 border border-gold/20 text-gold/80 hover:bg-red-500/10 hover:border-red-500/25 hover:text-red-400 transition-colors group w-full text-left">
              {item}
              <span className="opacity-30 group-hover:opacity-100 shrink-0 ml-2">✕</span>
            </button>
          ))}
        </div>
      )}

      {/* Dropdown para adicionar (existentes) */}
      {available.length > 0 && !customMode && (
        <div className="relative">
          <select value="" onChange={e => { if (e.target.value) toggle(e.target.value) }}
            className="w-full appearance-none bg-white/[0.02] border border-white/8 hover:border-white/20 rounded-xl px-3 py-2 text-[11px] text-white/30 focus:outline-none transition-colors cursor-pointer pr-6">
            <option value="" className="bg-zinc-900">+ Adicionar...</option>
            {available.map(i => <option key={i} value={i} className="bg-zinc-900">{i}</option>)}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 text-[10px]">▾</span>
        </div>
      )}

      {/* Adicionar serviço CUSTOM (texto livre) */}
      {!customMode ? (
        <button onClick={() => setCustomMode(true)}
          className="text-[10px] tracking-[0.3em] text-gold/40 hover:text-gold/70 transition-colors uppercase text-left px-1 py-1">
          + Novo Serviço (texto livre)
        </button>
      ) : (
        <div className="flex gap-1.5">
          <input
            autoFocus
            value={customText}
            onChange={e => setCustomText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); addCustom() }
              if (e.key === 'Escape') { setCustomText(''); setCustomMode(false) }
            }}
            placeholder="Escreve e Enter..."
            className="flex-1 bg-white/[0.04] border border-gold/30 rounded-lg px-3 py-1.5 text-[11px] text-white/85 outline-none focus:border-gold/60 placeholder:text-white/20"
          />
          <button onClick={addCustom} disabled={!customText.trim()}
            className="px-3 py-1.5 rounded-lg bg-gold/15 border border-gold/40 text-gold text-[10px] tracking-widest font-bold uppercase hover:bg-gold/25 disabled:opacity-40">
            ✓
          </button>
          <button onClick={() => { setCustomText(''); setCustomMode(false) }}
            className="px-2 py-1.5 rounded-lg border border-white/15 text-white/40 text-[10px] hover:text-white/70">
            ✕
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Cor por estado ────────────────────────────────────────────────────────────
function estadoCfg(val: string) {
  const blue  = ['Em Edição', 'Enviado']
  const green = ['Entregue', 'Aprovado']
  const red   = ['S/SERVIÇO']
  if (green.includes(val))
    return { box: 'bg-green-500/10 border-green-500/25', dot: 'bg-green-400',  lbl: 'text-green-300/70',  date: 'text-green-200/80',  sel: 'bg-green-500/15 border-green-500/30 hover:border-green-400/50 text-green-100/90', arr: 'text-green-400/60' }
  if (blue.includes(val))
    return { box: 'bg-blue-500/10 border-blue-500/25',   dot: 'bg-blue-400',   lbl: 'text-blue-300/70',   date: 'text-blue-200/80',   sel: 'bg-blue-500/15 border-blue-500/30 hover:border-blue-400/50 text-blue-100/90',   arr: 'text-blue-400/60' }
  if (red.includes(val))
    return { box: 'bg-red-500/10 border-red-500/25',     dot: 'bg-red-400',    lbl: 'text-red-300/70',    date: 'text-red-200/80',    sel: 'bg-red-500/15 border-red-500/30 hover:border-red-400/50 text-red-100/90',       arr: 'text-red-400/60' }
  return       { box: 'bg-yellow-500/10 border-yellow-500/25', dot: 'bg-yellow-400', lbl: 'text-yellow-300/70', date: 'text-yellow-200/80', sel: 'bg-yellow-500/15 border-yellow-500/30 hover:border-yellow-400/50 text-yellow-100/90', arr: 'text-yellow-400/60' }
}

// ─── Dropdown de regras do Estado das Entregas (abrir/fechar) ──────────────────
function RegrasEntregasDrop() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg bg-amber-500/[0.06] border border-amber-500/20 mb-1 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-amber-500/[0.04] transition-colors"
      >
        <span className="flex items-center gap-2 text-[11px] tracking-wide text-amber-200/90 font-semibold uppercase">
          <span className="text-amber-300/90 text-[12px] leading-none">ℹ</span>
          Regras automáticas das entregas
        </span>
        <span className={`text-amber-300/70 text-[11px] transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 flex flex-col gap-2 text-[11px] text-amber-200/75 leading-relaxed border-t border-amber-500/15">
          <p>
            <strong>Seleção de Fotos:</strong> assim que o dia do evento passa, aparece no portal dos noivos como <strong>«Em Seleção»</strong> (se ainda estiver em «Aguardar»).
          </p>
          <p>
            <strong>Fotos em Edição (data de entrada + 30 dias úteis):</strong> a <strong>7 dias</strong> do fim do prazo recebes um <strong>alerta no sino</strong> e aparece no card <strong>«PRAZOS FOTOS»</strong> do painel. Só enquanto não estiver «Entregue».
          </p>
          <p>
            <strong>Prazo de Entrega do Vídeo (180 dias úteis):</strong> a <strong>30 dias</strong> do fim do prazo recebes um <strong>alerta no sino</strong> e o vídeo aparece no card <strong>«VÍDEOS PRAZO»</strong> do painel. Só enquanto não estiver «Entregue».
          </p>
          <p>
            <strong>Marcar Pré-Wedding:</strong> com o serviço Pré-Wedding ativado (caixa na secção Marcação), a <strong>35 dias</strong> do evento sem reserva recebes um <strong>alerta no sino</strong> («Alerta — Marcar Pré-Wedding»).
          </p>
          <p>
            <strong>Seleção Fotos Noivos:</strong> ao marcar a Seleção de Fotos como «Entregue», fica registado o dia. Se passarem <strong>30 dias</strong> e os noivos ainda não tiverem escolhido as fotos, recebes um <strong>alerta no sino</strong> («Noivos em Falta — Escolher Fotos»).
          </p>
          <p>
            <strong>Sincronização:</strong> todos os estados editados aqui refletem automaticamente no portal dos noivos.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Linha de estado com dropdown e prazo opcional ─────────────────────────────
// ─── Linha de estado ligada ao portal (Supabase) ──────────────────────────────
function PortalEstadoRow({ label, dateStr, estado, referencia, stateKey, onSaved }: {
  label: string; dateStr?: string | null
  estado: string | null; referencia: string; stateKey: string
  onSaved: (key: string, val: string) => void
}) {
  const OPTIONS = ['Aguardar', 'Em Edição', 'Concluído', 'Entregue', 'S/SERVIÇO']
  const val = estado ?? 'Aguardar'
  const cfg = estadoCfg(val)

  async function onChange(v: string) {
    onSaved(stateKey, v)
    await fetch('/api/portais', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia, updates: { settings: { [stateKey]: v } } }),
    })
  }

  return (
    <div className={`grid grid-cols-[1.5rem_1fr_10rem_8rem] items-center gap-4 px-4 py-3 rounded-xl border transition-all ${cfg.box}`}>
      <div className={`w-2 h-2 rounded-full justify-self-center ${cfg.dot}`} />
      <span className={`text-[10px] tracking-widest uppercase leading-tight ${cfg.lbl}`}>{label}</span>
      <div className="relative">
        <select value={val} onChange={e => onChange(e.target.value)}
          className={`appearance-none border rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-colors cursor-pointer pr-6 w-full ${cfg.sel}`}>
          {OPTIONS.map(o => <option key={o} value={o} className="bg-zinc-900 text-white">{o}</option>)}
        </select>
        <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] ${cfg.arr}`}>▾</span>
      </div>
      <span className={`text-sm font-medium text-right ${dateStr ? cfg.date : 'text-white/10'}`}>
        {dateStr ? formatDate(dateStr) : '—'}
      </span>
    </div>
  )
}

function EstadoRow({ label, dateStr, estado, options, field, eventId, onSaved, href, referencia }: {
  label: string; dateStr?: string | null
  estado: string | null; options: string[]; field: string; eventId: string
  onSaved: (field: string, val: any) => void
  href?: string
  referencia?: string | null
}) {
  const val = estado ?? options[0]
  const cfg = estadoCfg(val)

  async function onChange(v: string) {
    onSaved(field, v)
    await fetch(`/api/eventos-notion/${eventId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: v }),
    })
    // Sincroniza também com as definições do portal dos noivos, que lê
    // estes estados (sel_fotos_estado, video_estado, etc.) de /api/portais.
    if (referencia) {
      const settingsUpdate: Record<string, any> = { [field]: v }
      // Regra: ao marcar Seleção de Fotos como "Entregue", regista o dia.
      // Serve para o alerta de "noivos em falta escolher fotos" (20 dias).
      if (field === 'sel_fotos_estado') {
        settingsUpdate.sel_fotos_entregue_em = v === 'Entregue' ? new Date().toISOString().slice(0, 10) : null
      }
      await fetch('/api/portais', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, updates: { settings: settingsUpdate } }),
      })
    }
  }

  return (
    <div className={`grid grid-cols-[1.5rem_1fr_10rem_8rem] items-center gap-4 px-4 py-3 rounded-xl border transition-all ${cfg.box}`}>
      <div className={`w-2 h-2 rounded-full justify-self-center ${cfg.dot}`} />
      {href ? (
        <Link href={href} className={`text-[10px] tracking-widest uppercase leading-tight hover:underline underline-offset-2 cursor-pointer ${cfg.lbl}`}>{label}</Link>
      ) : (
        <span className={`text-[10px] tracking-widest uppercase leading-tight ${cfg.lbl}`}>{label}</span>
      )}
      <div className="relative">
        <select value={val} onChange={e => onChange(e.target.value)}
          className={`appearance-none border rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-colors cursor-pointer pr-6 w-full ${cfg.sel}`}>
          {options.map(o => <option key={o} value={o} className="bg-zinc-900 text-white">{o}</option>)}
        </select>
        <span className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] ${cfg.arr}`}>▾</span>
      </div>
      <span className={`text-sm font-medium text-right ${dateStr ? cfg.date : 'text-white/10'}`}>
        {dateStr ? formatDate(dateStr) : '—'}
      </span>
    </div>
  )
}

// ─── Notificação aos Noivos — envia título + texto para o portal ──────────────
function NotificacaoNoivosSection({ referencia }: { referencia: string }) {
  const [titulo, setTitulo] = useState('')
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [okMsg, setOkMsg] = useState<false | 'email' | 'portal'>(false)
  const [lista, setLista] = useState<Array<{ id: string; titulo: string; texto: string; ts: string }>>([])

  useEffect(() => {
    fetch(`/api/portais?ref=${encodeURIComponent(referencia)}`)
      .then(r => r.json())
      .then(d => setLista(d.portal?.settings?.noivos_notifications ?? []))
      .catch(() => {})
  }, [referencia])

  async function guardar(next: Array<{ id: string; titulo: string; texto: string; ts: string }>) {
    await fetch('/api/portais', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia, updates: { settings: { noivos_notifications: next } } }),
    })
  }

  async function enviar() {
    if (!titulo.trim() || !texto.trim()) { alert('Preenche o título e o texto.'); return }
    setEnviando(true)
    try {
      // Endpoint guarda em settings.noivos_notifications E envia email à noiva
      const res = await fetch('/api/notificacao-noivos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, titulo: titulo.trim(), texto: texto.trim() }),
      }).then(r => r.json()).catch(() => ({}))
      // Relê a lista atualizada
      const d = await fetch(`/api/portais?ref=${encodeURIComponent(referencia)}`).then(r => r.json())
      setLista(d.portal?.settings?.noivos_notifications ?? [])
      setTitulo(''); setTexto('')
      setOkMsg(res?.emailEnviado ? 'email' : 'portal')
      setTimeout(() => setOkMsg(false), 3500)
    } finally { setEnviando(false) }
  }

  async function apagar(id: string) {
    const next = lista.filter(n => n.id !== id)
    setLista(next)
    await guardar(next)
  }

  return (
    <Section title="Notificação aos Noivos" right={
      <span className="text-[9px] tracking-[0.3em] text-gold uppercase">Vai para o portal dos noivos</span>
    }>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/40">Título</span>
          <input
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Ex: Fotos prontas para selecionar"
            className="w-full bg-white/[0.03] border border-white/12 focus:border-gold/50 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/40">Texto</span>
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={3}
            placeholder="Pequeno texto a mostrar aos noivos no portal…"
            className="w-full bg-white/[0.03] border border-white/12 focus:border-gold/50 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 transition-colors resize-y"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={enviar}
            disabled={enviando}
            className="px-4 py-2 rounded-lg bg-gold text-black text-[11px] font-bold tracking-[0.2em] uppercase hover:bg-gold/90 disabled:opacity-50 transition-all"
            style={{ boxShadow: '0 0 14px -4px rgba(201,164,92,0.55)' }}>
            {enviando ? 'A enviar…' : 'Enviar notificação'}
          </button>
          {okMsg === 'email' && <span className="text-[11px] text-emerald-400 tracking-wide">✓ Enviada para o portal + email à noiva</span>}
          {okMsg === 'portal' && <span className="text-[11px] text-amber-400 tracking-wide">✓ Enviada para o portal (sem email — noiva sem email registado)</span>}
        </div>

        {lista.length > 0 && (
          <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.05]">
            <span className="text-[9px] tracking-[0.3em] uppercase text-white/30">Enviadas ({lista.length})</span>
            {lista.map(n => (
              <div key={n.id} className="flex items-start justify-between gap-3 px-3 py-2 rounded-lg border border-white/[0.06] bg-black/20">
                <div className="min-w-0">
                  <p className="text-[13px] text-gold/90 font-semibold truncate">{n.titulo}</p>
                  <p className="text-[11px] text-white/50 leading-relaxed">{n.texto}</p>
                  <p className="text-[9px] text-white/25 mt-1">{new Date(n.ts).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <button onClick={() => apagar(n.id)}
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-red-400 hover:border-red-400/40 transition-all text-xs"
                  title="Apagar notificação">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  )
}

// ─── Resposta Rápida — responde à conversa mais recente direto da ficha ───────
function RespostaRapidaNoivos({ referencia }: { referencia: string }) {
  const [ultima, setUltima] = useState<{ id: string; titulo: string } | null>(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [ok, setOk] = useState(false)

  async function carregar() {
    try {
      const d = await fetch(`/api/portais?ref=${encodeURIComponent(referencia)}`).then(r => r.json())
      const lista = (d.portal?.settings?.noivos_messages ?? []) as Array<{ id: string; titulo?: string; ts?: string }>
      if (lista.length === 0) { setUltima(null); return }
      const recente = [...lista].sort((a, b) => (b.ts ?? '').localeCompare(a.ts ?? ''))[0]
      setUltima({ id: recente.id, titulo: recente.titulo || 'Mensagem' })
    } catch { /* ignore */ }
  }
  useEffect(() => { carregar() }, [referencia])

  async function enviar() {
    if (!ultima || !texto.trim()) return
    setEnviando(true)
    try {
      await fetch('/api/noivos-message/responder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, messageId: ultima.id, texto: texto.trim() }),
      })
      setTexto(''); setOk(true); setTimeout(() => setOk(false), 3000)
    } finally { setEnviando(false) }
  }

  if (!ultima) return null

  return (
    <div className="rounded-xl border border-gold/25 bg-gold/[0.05] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] tracking-[0.3em] uppercase text-gold/80 font-semibold">Resposta Rápida</span>
        <span className="text-[9px] text-white/35">para: <span className="text-gold/70">{ultima.titulo}</span></span>
      </div>
      <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={2}
        placeholder="Responder à conversa mais recente…"
        className="w-full bg-black/30 border border-white/12 focus:border-gold/50 rounded-lg px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 resize-y" />
      <div className="flex items-center gap-2">
        <button onClick={enviar} disabled={enviando || !texto.trim()}
          className="px-4 py-1.5 rounded-lg bg-gold text-black text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-gold/90 disabled:opacity-50 transition-all">
          {enviando ? 'A enviar…' : 'Enviar resposta'}
        </button>
        {ok && <span className="text-[10px] text-emerald-400 tracking-wide">✓ Enviada — visível no portal</span>}
      </div>
    </div>
  )
}

// ─── Mensagens dos Noivos — recebidas do portal, com resposta do admin ────────
type NoivosMsg = {
  id: string; titulo?: string | null; mensagem: string; ts?: string
  nome_noivos?: string | null; email_noiva?: string | null; lida?: boolean
  respostas?: Array<{ id: string; texto: string; ts: string }>
}
function MensagensNoivosSection({ referencia }: { referencia: string }) {
  const [msgs, setMsgs] = useState<NoivosMsg[]>([])
  const [loading, setLoading] = useState(true)
  const [respostaDe, setRespostaDe] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [query, setQuery] = useState('')
  const [openTemas, setOpenTemas] = useState<Set<string>>(new Set())
  const [seenMap, setSeenMap] = useState<Record<string, string>>({})
  const LS_SEEN = `admin_atend_seen_${referencia}`

  useEffect(() => {
    try { const raw = localStorage.getItem(LS_SEEN); if (raw) setSeenMap(JSON.parse(raw)) } catch { /* ignore */ }
  }, [LS_SEEN])
  function marcarTemaVisto(tema: string, lastTs: string) {
    setSeenMap(prev => { const next = { ...prev, [tema]: lastTs }; try { localStorage.setItem(LS_SEEN, JSON.stringify(next)) } catch {/* */} ; return next })
  }
  // Baseline na 1ª visita: marca todos os temas atuais como vistos (não brilham).
  useEffect(() => {
    if (msgs.length === 0) return
    try {
      if (localStorage.getItem(`${LS_SEEN}_init`)) return
      const base: Record<string, string> = {}
      for (const m of msgs) {
        const tema = (m.titulo || 'Sem assunto').trim()
        const ts = [m.ts ?? '', ...((m.respostas ?? []).map(r => r.ts))].sort().pop() ?? ''
        if (ts > (base[tema] ?? '')) base[tema] = ts
      }
      localStorage.setItem(LS_SEEN, JSON.stringify(base))
      localStorage.setItem(`${LS_SEEN}_init`, '1')
      setSeenMap(base)
    } catch { /* ignore */ }
  }, [msgs, LS_SEEN])

  async function carregar() {
    try {
      const d = await fetch(`/api/portais?ref=${encodeURIComponent(referencia)}`).then(r => r.json())
      const lista = (d.portal?.settings?.noivos_messages ?? []) as NoivosMsg[]
      setMsgs([...lista])
    } catch { /* ignore */ } finally { setLoading(false) }
  }
  useEffect(() => { carregar() }, [referencia])

  async function responder(messageId: string) {
    if (!texto.trim()) return
    setEnviando(true)
    try {
      await fetch('/api/noivos-message/responder', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, messageId, texto: texto.trim() }),
      })
      setTexto(''); setRespostaDe(null)
      const tema = (msgs.find(m => m.id === messageId)?.titulo || 'Sem assunto').trim()
      marcarTemaVisto(tema, new Date().toISOString())
      await carregar()
    } finally { setEnviando(false) }
  }

  const fmtDia = (ts?: string) => { try { return new Date(ts!).toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' }) } catch { return '' } }
  const fmtHora = (ts?: string) => { try { return new Date(ts!).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) } catch { return '' } }
  const dayKey = (ts?: string) => (ts ?? '').slice(0, 10)

  function hl(t: string, qq: string) {
    if (!qq.trim()) return t
    const low = t.toLowerCase(), ql = qq.trim().toLowerCase(); const out: React.ReactNode[] = []
    let i = 0, k = 0
    while (i < t.length) {
      const idx = low.indexOf(ql, i)
      if (idx === -1) { out.push(<span key={k++}>{t.slice(i)}</span>); break }
      if (idx > i) out.push(<span key={k++}>{t.slice(i, idx)}</span>)
      out.push(<mark key={k++} className="bg-gold/50 text-white rounded-sm px-0.5">{t.slice(idx, idx + qq.trim().length)}</mark>)
      i = idx + qq.trim().length
    }
    return out
  }

  const isBat = (referencia ?? '').toUpperCase().startsWith('BAT')
  const chatUrl = `${isBat ? '/portal-batizado' : '/portal-cliente'}/ref/${encodeURIComponent(referencia)}?admin=1`

  // Agrupa por TEMA (titulo) → itens (mensagens + respostas) cronológicos.
  type Item = { id: string; from: 'vocs' | 'rl'; texto: string; ts: string }
  type Tema = { tema: string; items: Item[]; lastTs: string; lastMsgId: string }
  const temas: Tema[] = (() => {
    const map = new Map<string, { items: Item[]; lastMsgId: string; lastMsgTs: string }>()
    for (const m of msgs) {
      const tema = (m.titulo || 'Sem assunto').trim()
      const e = map.get(tema) ?? { items: [], lastMsgId: m.id, lastMsgTs: '' }
      e.items.push({ id: m.id, from: 'vocs', texto: m.mensagem, ts: m.ts ?? '' })
      for (const r of (m.respostas ?? [])) e.items.push({ id: r.id, from: 'rl', texto: r.texto, ts: r.ts })
      if ((m.ts ?? '') >= e.lastMsgTs) { e.lastMsgTs = m.ts ?? ''; e.lastMsgId = m.id }
      map.set(tema, e)
    }
    const out: Tema[] = []
    for (const [tema, e] of map) {
      e.items.sort((a, b) => (a.ts || '').localeCompare(b.ts || ''))
      out.push({ tema, items: e.items, lastTs: e.items[e.items.length - 1]?.ts ?? '', lastMsgId: e.lastMsgId })
    }
    out.sort((a, b) => (b.lastTs || '').localeCompare(a.lastTs || ''))
    return out
  })()

  const q = query.trim().toLowerCase()
  const temasFiltrados = q
    ? temas.map(t => {
        const temaHit = t.tema.toLowerCase().includes(q)
        const items = temaHit ? t.items : t.items.filter(it => it.texto.toLowerCase().includes(q))
        return items.length ? { ...t, items } : null
      }).filter(Boolean) as Tema[]
    : temas
  const totalRes = q ? temasFiltrados.reduce((s, t) => s + t.items.length, 0) : 0
  const isOpen = (tema: string) => q ? true : openTemas.has(tema)
  const isUnread = (t: Tema) => (seenMap[t.tema] ?? '') < (t.lastTs ?? '')
  const toggleTema = (tema: string) => setOpenTemas(prev => {
    const n = new Set(prev)
    if (n.has(tema)) { n.delete(tema) }
    else { n.add(tema); const t = temasFiltrados.find(x => x.tema === tema); if (t) marcarTemaVisto(tema, t.lastTs) }
    return n
  })

  return (
    <Section title="Mensagens dos Noivos" right={
      <div className="flex items-center gap-3">
        <span className="text-[9px] tracking-[0.3em] text-gold/70 uppercase">{msgs.length} mensagem{msgs.length === 1 ? '' : 's'}</span>
        <a href={chatUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold/40 bg-gold/10 text-gold text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-gold/20 transition-all">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          Abrir Chat ↗
        </a>
      </div>
    }>
      {loading ? (
        <p className="text-xs text-white/20 tracking-wider">A carregar…</p>
      ) : msgs.length === 0 ? (
        <p className="text-xs text-white/25 italic">Sem mensagens dos noivos para esta referência.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Pesquisa */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-black/20">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a45c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Procurar por palavra ou assunto…"
              className="flex-1 bg-transparent border-0 outline-none text-[12px] text-white/85 placeholder:text-white/25" />
            {q && <span className="text-[9px] text-gold/70 whitespace-nowrap">{totalRes} resultado{totalRes === 1 ? '' : 's'}</span>}
            {q && <button onClick={() => setQuery('')} className="text-white/30 hover:text-white/60 text-xs">✕</button>}
          </div>

          {temasFiltrados.length === 0 && <p className="text-[11px] text-white/30 italic text-center py-2">Sem resultados para “{query}”.</p>}

          <style>{`@keyframes adminTemaGlow{0%,100%{box-shadow:0 0 0 0 rgba(201,164,92,0);border-color:rgba(255,255,255,.08)}50%{box-shadow:0 0 14px 1px rgba(201,164,92,.45);border-color:rgba(232,199,109,.8)}} .admin-tema-glow{animation:adminTemaGlow 1.8s ease-in-out infinite}`}</style>
          {/* Temas */}
          {temasFiltrados.map(t => {
            const open = isOpen(t.tema)
            const unread = !open && isUnread(t)
            let lastDay = ''
            return (
              <div key={t.tema} className={`rounded-lg border border-white/[0.08] bg-black/20 overflow-hidden ${unread ? 'admin-tema-glow' : ''}`}>
                <button onClick={() => toggleTema(t.tema)} className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/[0.03] transition-colors">
                  <span className={`text-gold/70 text-[9px] transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
                  <span className="flex-1 text-[12px] text-gold/90 font-semibold">{hl(t.tema, q)}</span>
                  {unread && <span className="text-[7px] tracking-[0.14em] uppercase font-bold text-black bg-gold px-1.5 py-0.5 rounded-full">Nova</span>}
                  <span className="text-[8px] tracking-[0.12em] uppercase text-white/30 whitespace-nowrap">{t.items.length} msg · {fmtDia(t.lastTs).replace(/ de \d{4}$/, '')}</span>
                </button>
                {open && (
                  <div className="px-3 pb-3 pt-1 flex flex-col gap-1.5">
                    {t.items.map(it => {
                      const dk = dayKey(it.ts); const showDay = dk !== lastDay; lastDay = dk
                      return (
                        <div key={it.id}>
                          {showDay && <div className="text-center text-[8px] tracking-[0.2em] uppercase text-white/25 my-1">── {fmtDia(it.ts)} ──</div>}
                          <div className={`flex ${it.from === 'vocs' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] px-2.5 py-1.5 rounded-lg border ${it.from === 'vocs' ? 'bg-gold/10 border-gold/25' : 'bg-emerald-500/[0.08] border-emerald-500/25'}`}>
                              <p className={`text-[7px] tracking-[0.18em] uppercase font-bold mb-0.5 ${it.from === 'vocs' ? 'text-gold/80' : 'text-emerald-400/80'}`}>{it.from === 'vocs' ? 'Noivos' : 'RL Photo · Resposta'}</p>
                              <p className="text-[10.5px] text-white/80 leading-snug whitespace-pre-wrap">{hl(it.texto, q)}</p>
                              <p className="text-[7px] text-white/25 mt-0.5 text-right">{fmtHora(it.ts)}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Responder ao tema (responde à última mensagem) */}
                    {respostaDe === t.tema ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <textarea value={texto} onChange={e => setTexto(e.target.value)} rows={2} autoFocus
                          placeholder="Escreve a resposta…"
                          className="w-full bg-white/[0.03] border border-white/12 focus:border-gold/50 rounded-lg px-3 py-2 text-[13px] text-white outline-none placeholder:text-white/20 resize-y" />
                        <div className="flex items-center gap-2">
                          <button onClick={() => responder(t.lastMsgId)} disabled={enviando || !texto.trim()}
                            className="px-3 py-1.5 rounded-lg bg-gold text-black text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-gold/90 disabled:opacity-50 transition-all">
                            {enviando ? 'A enviar…' : 'Enviar resposta'}
                          </button>
                          <button onClick={() => { setRespostaDe(null); setTexto('') }} className="px-3 py-1.5 text-[10px] text-white/35 hover:text-white/60 tracking-widest uppercase">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setRespostaDe(t.tema); setTexto('') }}
                        className="self-start mt-1 px-3 py-1.5 rounded-lg border border-gold/30 bg-gold/10 text-gold text-[10px] font-semibold tracking-[0.2em] uppercase hover:bg-gold/20 transition-all">
                        ↩ Responder
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Section>
  )
}

// ─── Fotos Seleção associadas ao evento ───────────────────────────────────────
function FotosSelecaoRef({ referencia }: { referencia: string }) {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/fotos-selecao-by-ref?ref=${encodeURIComponent(referencia)}`)
      .then(r => r.json())
      .then(d => { setData(d.row ?? null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [referencia])

  if (loading) return <p className="text-xs text-white/20 tracking-wider">A carregar...</p>

  if (!data) return (
    <div className="flex items-center justify-between">
      <p className="text-xs text-white/25 italic">Sem registo de seleção para esta referência.</p>
      <a href="/fotos-selecao" className="text-[10px] text-white/20 hover:text-gold transition-colors tracking-wider">
        Ver todos ›
      </a>
    </div>
  )

  const fields = [
    { label: 'Sessão Noivos',   val: data.sessao_noivos },
    { label: 'Fotos Noiva',     val: data.fotos_noiva },
    { label: 'Fotos Noivo',     val: data.fotos_noivo },
    { label: 'Convidados',      val: data.convidados },
    { label: 'Cerimónia',       val: data.cerimonia },
    { label: 'Bolo e Bouquet',  val: data.bolo_bouquet },
    { label: 'Sala e Animação', val: data.sala_animacao },
    { label: 'Fotos p/Álbum',   val: data.fotos_album },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {fields.map(({ label, val }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-[9px] tracking-[0.3em] text-white/25 uppercase">{label}</span>
            <span className="text-sm text-white/70">{val || <span className="text-white/20 italic">—</span>}</span>
          </div>
        ))}
      </div>
      {data.detalhes && (
        <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
          <span className="text-[9px] tracking-[0.3em] text-white/25 uppercase block mb-1">Detalhes</span>
          <p className="text-xs text-white/60">{data.detalhes}</p>
        </div>
      )}
      <a href="/fotos-selecao" className="text-[10px] text-white/20 hover:text-gold transition-colors tracking-wider self-end">
        Editar em Fotos Seleção ›
      </a>
    </div>
  )
}

// ─── Editor de Tipo de Evento (multi-select com badges) ───────────────────────
const TIPOS_EVENTO_OPTIONS = ['CASAMENTO', 'BATIZADO', 'ANIVERSÁRIO', 'SESSÃO FOTO', 'CORPORATIVO']
const SERVICOS_DIA_OPTIONS = [
  'Making Off Noiva',
  'Making Off Noivo',
  'Cerimónia Civil',
  'Cerimónia Igreja',
  'Cocktail',
  'Banquete',
  'Corte do Bolo',
  'Dança dos Noivos',
  'Festa',
  'Sessão Noivos',
  'Foto Lembrança',
  'Sneak Peak',
]

function TipoEventoEditor({ value, eventId, referencia, onSaved }: {
  value: string[]
  eventId: string
  referencia: string | null
  onSaved: (arr: string[]) => void
}) {
  const [open, setOpen]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [local, setLocal] = useState<string[]>(value ?? [])

  useEffect(() => { setLocal(value ?? []) }, [JSON.stringify(value)])

  async function persist(next: string[]) {
    setSaving(true)
    try {
      // 1) PATCH /api/eventos-notion → atualiza Notion + Supabase eventos_YYYY
      await fetch(`/api/eventos-notion/${eventId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo_evento: next }),
      }).catch(() => null)

      // 2) Se houver referência, propaga para dados_contrato_cps (singular para o contrato)
      //    O contrato lê e.tipo_evento (array) — basta sincronizar para o caso de o admin
      //    voltar atrás e ler de CPS. Mapeia para "casamento" / "batizado" lowercase.
      if (referencia) {
        const t = next.map(x => x.toUpperCase())
        const tipoSingular = t.includes('BATIZADO') ? 'batizado'
                          : t.includes('CASAMENTO') ? 'casamento'
                          : null
        if (tipoSingular) {
          await fetch(`/api/contrato-cps?ref=${encodeURIComponent(referencia)}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tipo_evento: tipoSingular }),
          }).catch(() => null)
        }
      }
      onSaved(next)
    } finally { setSaving(false) }
  }

  async function toggle(opt: string) {
    const next = local.includes(opt) ? local.filter(x => x !== opt) : [...local, opt]
    setLocal(next)
    await persist(next)
  }

  return (
    <div className="relative inline-flex flex-wrap gap-2 items-center">
      {local.length === 0 ? (
        <button onClick={() => setOpen(o => !o)}
          className="text-xs px-3 py-1 rounded-full border border-dashed border-gold/40 text-gold/60 hover:border-gold hover:text-gold hover:bg-gold/5 transition-all">
          + Definir Tipo de Evento
        </button>
      ) : (
        <>
          {local.map(t => (
            <button key={t} onClick={() => toggle(t)}
              title="Clica para remover"
              className="group flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold/80 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-400 transition-all">
              {t}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">×</span>
            </button>
          ))}
          <button onClick={() => setOpen(o => !o)}
            className="text-[10px] px-2 py-1 rounded-full border border-white/15 text-white/40 hover:border-gold/40 hover:text-gold/70 transition-all">
            ✎ Editar
          </button>
        </>
      )}
      {saving && <span className="text-[10px] text-gold/40 animate-pulse">A guardar...</span>}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 z-50 rounded-xl border border-white/15 bg-[#0d0d0e] p-3 min-w-[220px] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
            <p className="text-[10px] tracking-[0.3em] text-gold/60 uppercase mb-2">Tipo de Evento</p>
            <div className="flex flex-col gap-1.5">
              {TIPOS_EVENTO_OPTIONS.map(opt => {
                const checked = local.includes(opt)
                return (
                  <button key={opt} onClick={() => toggle(opt)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all text-left ${checked ? 'bg-gold/15 border border-gold/30 text-gold' : 'hover:bg-white/[0.04] text-white/60 border border-transparent'}`}>
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${checked ? 'border-gold bg-gold/30' : 'border-white/25'}`}>
                      {checked && <span className="text-gold text-[9px]">✓</span>}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── ServicosDiaEditor — multi-select inline para serviços do dia ─────────────
function ServicosDiaEditor({ value, eventId, onSaved }: {
  value: string[]
  eventId: string
  onSaved: (arr: string[]) => void
}) {
  const [open, setOpen]   = useState(false)
  const [saving, setSaving] = useState(false)
  const [local, setLocal] = useState<string[]>(value ?? [])

  useEffect(() => { setLocal(value ?? []) }, [JSON.stringify(value)])

  async function persist(next: string[]) {
    setSaving(true)
    try {
      await fetch(`/api/eventos-notion/${eventId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicos_dia: next }),
      }).catch(() => null)
      onSaved(next)
    } finally { setSaving(false) }
  }

  async function toggle(opt: string) {
    const next = local.includes(opt) ? local.filter(x => x !== opt) : [...local, opt]
    setLocal(next)
    await persist(next)
  }

  return (
    <div className="relative inline-flex flex-wrap gap-2 items-center">
      {local.length === 0 ? (
        <button onClick={() => setOpen(o => !o)}
          className="text-xs px-3 py-1 rounded-full border border-dashed border-gold/40 text-gold/60 hover:border-gold hover:text-gold hover:bg-gold/5 transition-all">
          + Serviços do Dia
        </button>
      ) : (
        <>
          {local.map(t => (
            <button key={t} onClick={() => toggle(t)}
              title="Clica para remover"
              className="group flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold/85 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-400 transition-all tracking-wide">
              {t}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">×</span>
            </button>
          ))}
          <button onClick={() => setOpen(o => !o)}
            className="text-[10px] px-2 py-1 rounded-full border border-white/15 text-white/40 hover:border-gold/40 hover:text-gold/70 transition-all">
            ✎ Editar
          </button>
        </>
      )}
      {saving && <span className="text-[10px] text-gold/40 animate-pulse">A guardar...</span>}

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-2 z-50 rounded-xl border border-white/15 bg-[#0d0d0e] p-3 min-w-[240px] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
            <p className="text-[10px] tracking-[0.3em] text-gold/60 uppercase mb-2">Serviços do Dia</p>
            <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
              {SERVICOS_DIA_OPTIONS.map(opt => {
                const checked = local.includes(opt)
                return (
                  <button key={opt} onClick={() => toggle(opt)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all text-left ${checked ? 'bg-gold/15 border border-gold/30 text-gold' : 'hover:bg-white/[0.04] text-white/60 border border-transparent'}`}>
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${checked ? 'border-gold bg-gold/30' : 'border-white/25'}`}>
                      {checked && <span className="text-gold text-[9px]">✓</span>}
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Briefing enviado — aparece na ficha (Bloco I · Evento & Serviços) ──────────
// O briefing é enviado a partir do portal dos noivos (botão "Enviar Briefing"),
// que guarda o link em evento_equipa.briefing_url. Aqui mostramos esse link na
// ficha do evento, para além de continuar a ir para o portal dos noivos.
// Acrescenta ?freelancer=1 ao URL do briefing → abre em modo equipa, mostrando
// TUDO (incl. secção ACESSO e Notas Privadas reservadas à equipa).
function withBriefingLock(url: string): string {
  if (!url) return ''
  try {
    const u = new URL(url)
    u.searchParams.set('freelancer', '1')
    return u.toString()
  } catch {
    return url + (url.includes('?') ? '&' : '?') + 'freelancer=1'
  }
}

function BriefingNaFicha({ referencia, eventoId }: { referencia?: string | null; eventoId: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const qs = referencia ? `ref=${encodeURIComponent(referencia)}` : `evento_id=${eventoId}`
    fetch(`/api/evento-equipa?${qs}`)
      .then(r => r.json())
      .then(d => { setUrl(d?.equipa?.briefing_url ?? null); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [referencia, eventoId])

  // Fechar com ESC
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const lockedUrl = url ? withBriefingLock(url) : ''

  return (
    <div className="ficha-reveal print:hidden bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mt-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-[11px] tracking-[0.4em] text-gold uppercase font-light">Briefing</h2>
          <p className="text-[10px] text-white/30 mt-1 italic">Enviado a partir do portal dos noivos — disponível aqui na ficha (vista completa da equipa).</p>
        </div>
        {url ? (
          <button onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-[11px] font-semibold tracking-widest uppercase hover:bg-gold/20 transition-all">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/><circle cx="12" cy="12" r="3"/></svg>
            Ver Briefing
          </button>
        ) : (
          <span className="text-[11px] text-white/25 italic">{loaded ? 'Ainda não enviado' : '…'}</span>
        )}
      </div>

      {/* Aba lateral · só o briefing (modo equipa) */}
      {open && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[300] flex justify-end" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative z-10 h-full w-full max-w-3xl flex flex-col bg-[#0b0905] border-l border-gold/30 shadow-[-30px_0_70px_-10px_rgba(0,0,0,0.85)]"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-white/[0.07] shrink-0 bg-[#0e0c08]">
              <p className="text-[12px] tracking-[0.4em] text-gold/80 uppercase">Briefing · Equipa</p>
              <div className="flex items-center gap-2">
                <a href={lockedUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 transition-all tracking-widest uppercase">
                  Separador ↗
                </a>
                <button onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border border-gold/30 text-gold hover:bg-gold/10 transition-all tracking-widest uppercase font-semibold"
                  title="Fechar (Esc)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  Fechar
                </button>
              </div>
            </div>
            {/* Iframe do briefing */}
            <div className="flex-1 overflow-hidden bg-black/40">
              <iframe src={lockedUrl} title="Briefing" className="w-full h-full border-0" />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ─── Upload de contrato PDF ────────────────────────────────────────────────────
function ContratoUpload({ eventId, contratoUrl, onSaved }: {
  eventId: string; contratoUrl: string | null
  onSaved: (field: string, val: any) => void
}) {
  const [url, setUrl] = useState<string | null>(contratoUrl)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setUrl(contratoUrl) }, [contratoUrl])

  async function handleFile(file: File) {
    if (!file) return
    setUploading(true); setError('')
    const form = new FormData()
    form.append('file', file)
    form.append('eventId', eventId)
    const res = await fetch('/api/upload-contrato', { method: 'POST', body: form })
    const data = await res.json()
    if (data.error) { setError(data.error); setUploading(false); return }
    setUrl(data.url)
    onSaved('contratos', data.url)
    setUploading(false)
  }

  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-white/[0.05]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] tracking-[0.3em] text-gold uppercase">Contrato</span>
        <div className="flex items-center gap-2">
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-white/30 hover:text-gold transition-colors tracking-wider">
              Abrir ↗
            </a>
          )}
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="text-[10px] px-3 py-1.5 rounded-lg border border-gold/30 bg-gold/5 text-gold/70 hover:bg-gold/10 hover:text-gold transition-all disabled:opacity-40 tracking-wider">
            {uploading ? 'A carregar...' : url ? '↑ Substituir PDF' : '↑ Carregar PDF'}
          </button>
        </div>
      </div>

      <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />

      {error && <p className="text-xs text-red-400/70">{error}</p>}

      {uploading && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <span className="text-xs text-white/40 tracking-wider">A carregar para o servidor...</span>
        </div>
      )}

      {!uploading && url && (
        <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-white/[0.02]">
          <iframe src={url} className="w-full" style={{ height: '520px' }} title="Contrato PDF" />
        </div>
      )}

      {!uploading && !url && (
        <button onClick={() => inputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-4 py-8 rounded-xl border border-dashed border-white/10 hover:border-gold/30 hover:bg-gold/5 transition-all group">
          <span className="text-2xl text-white/10 group-hover:text-gold/30 transition-colors">📄</span>
          <span className="text-xs text-white/20 group-hover:text-white/40 tracking-wider">Clica para carregar o contrato em PDF</span>
        </button>
      )}
    </div>
  )
}

type Pagamento = {
  id: string
  fase_pagamento: string[]
  metodo_pagamento: string[]
  valor_liquidado: number | null
  data_pagamento: string | null
}

// ─── Portal do Cliente ────────────────────────────────────────────────────────
const MESES_PW = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

const PORTAL_PAGE_ID = '311220116d8a80d29468e817ae7bb79f'

// ─── Contrato CPS recebido → Aprovar + Criar Portal ──────────────────────────
function ContratoCPSAprovacaoSection({ referencia }: { referencia?: string }) {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [password, setPassword] = useState('')
  const [data, setData] = useState<{
    exists: boolean
    contrato?: {
      nome_noivos?: string
      tipo_evento?: string
      aprovado_em?: string | null
      contrato_aprovado_em?: string | null
      created_at?: string
      email_noiva?: string | null
      email_noivo?: string | null
    }
    portalUrl?: string | null
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!referencia) { setLoading(false); return }
    setLoading(true)
    try {
      const r = await fetch(`/api/contrato-cps/aprovar?ref=${encodeURIComponent(referencia)}`)
      const j = await r.json()
      setData(j)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [referencia])

  async function handleAprovar() {
    if (!referencia) return
    const pwd = password.trim()
    if (!pwd) {
      setError('Define a password do portal antes de aprovar.')
      return
    }
    const nomeMostra = data?.contrato?.nome_noivos || referencia
    if (!confirm(`Aprovar contrato e criar portal para ${nomeMostra}?\n\nA password (${pwd}) será enviada por email ao cliente.\n\n(Se o nome/email não estiver no CPS, o sistema vai buscar à ficha do cliente.)`)) return
    setSubmitting(true)
    setError(null)
    try {
      const r = await fetch('/api/contrato-cps/aprovar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, password: pwd }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? 'erro')
      await load()
    } catch (e: any) {
      setError(e.message ?? 'erro a aprovar')
    } finally {
      setSubmitting(false)
    }
  }

  if (!referencia) return null
  if (loading) return null
  if (!data?.exists) return null // ainda não foi preenchido pelo cliente

  const c = data.contrato!
  const isBatizado = c.tipo_evento === 'batizado'
  const contratoAprovado = !!c.contrato_aprovado_em
  const portalAprovado = !!c.aprovado_em

  // ── STATE C: PORTAL JÁ APROVADO ───────────────────────────────────────────
  // Não renderiza aqui — o estado "Portal aprovado" (Editar/Abrir) é mostrado
  // pela secção PortalSection (mais abaixo), evitando duplicação.
  if (portalAprovado) return null

  // ── STATE B: CONTRATO APROVADO → falta criar portal (gold) ────────────────
  if (contratoAprovado) {
    return (
      <div className="mt-4 rounded-xl border border-gold/40 bg-gold/[0.05] p-4">
        <div className="flex items-start gap-4">
          <div className="text-3xl">✓</div>
          <div className="flex-1">
            <p className="text-[10px] tracking-[0.3em] text-gold/80 uppercase mb-1">
              Contrato aprovado — Próximo passo: criar portal
            </p>
            <p className="text-sm text-white/85 mb-1">
              <span className="font-medium">{c.nome_noivos}</span>
              <span className="text-white/40 text-xs ml-2">
                · contrato aprovado {new Date(c.contrato_aprovado_em!).toLocaleString('pt-PT')}
              </span>
            </p>
            <p className="text-xs text-white/50">
              Email: {c.email_noiva || c.email_noivo || '—'}
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gold/20">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <p className="text-[10px] tracking-[0.3em] text-gold/70 uppercase mb-2">
                🔑 Password do portal
                <span className="text-gold/40 normal-case tracking-normal ml-2">(será enviada ao cliente)</span>
              </p>
              <input
                type="text"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(null) }}
                placeholder="Ex.: sofia2026"
                className="w-full bg-black/30 border border-gold/30 rounded px-3 py-2.5 text-sm text-white/90 outline-none focus:border-gold/60 placeholder:text-white/20"
              />
            </div>
            <button onClick={handleAprovar} disabled={submitting || !password.trim()}
              className="px-5 py-3 text-[11px] tracking-[0.3em] uppercase border border-gold/60 bg-gold/15 text-gold hover:bg-gold/25 disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap">
              {submitting ? 'A criar...' : '✓ Criar Portal e Enviar Cliente'}
            </button>
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-400/80">{error}</p>}
      </div>
    )
  }

  // ── STATE A: CPS preenchido, contrato pendente de aprovação (amber) ───────
  return (
    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] p-4">
      <div className="flex items-start gap-4">
        <div className="text-3xl">📋</div>
        <div className="flex-1">
          <p className="text-[10px] tracking-[0.3em] text-amber-400/80 uppercase mb-1">
            Contrato {isBatizado ? 'Batizado' : 'Casamento'} preenchido — Aguarda aprovação
          </p>
          <p className="text-sm text-white/85 mb-1">
            <span className="font-medium">{c.nome_noivos}</span>
            {c.created_at && (
              <span className="text-white/40 text-xs ml-2">
                · recebido {new Date(c.created_at).toLocaleString('pt-PT')}
              </span>
            )}
          </p>
          <p className="text-xs text-white/50 mb-2">
            Email: {c.email_noiva || c.email_noivo || '—'}
          </p>
          <p className="text-xs text-amber-300/70 italic">
            ↓ Vai à secção "Contrato de Prestação de Serviços" mais abaixo, gera, revê e aprova o contrato antes de criar o portal.
          </p>
        </div>
      </div>
    </div>
  )
}

function ContratoStatusSection({ eventoId, referencia }: { eventoId: string; referencia?: string }) {
  const [disponivel, setDisponivel] = useState<boolean | null>(null)
  const [settingsBlockId, setSettingsBlockId] = useState<string | null>(null)
  const [portalSettings, setPortalSettings] = useState<any>(null)
  const [toggling, setToggling] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  // Novo: aprovação do contrato (pré-requisito para criar portal)
  const [contratoAprovadoEm, setContratoAprovadoEm] = useState<string | null>(null)
  const [aprovandoContrato, setAprovandoContrato] = useState(false)
  const [contratoVisto, setContratoVisto] = useState(false)

  useEffect(() => {
    // For ref-based portals, read from Supabase; also check Notion for legacy
    const promises: Promise<any>[] = [
      fetch(`/api/portais-clientes?id=${PORTAL_PAGE_ID}&bust=1`).then(r => r.json()).catch(() => ({})),
    ]
    if (referencia) {
      promises.push(
        fetch(`/api/portais?ref=${encodeURIComponent(referencia)}`).then(r => r.json()).catch(() => ({}))
      )
      // Estado do contrato CPS
      promises.push(
        fetch(`/api/contrato-cps/aprovar?ref=${encodeURIComponent(referencia)}`).then(r => r.json()).catch(() => ({}))
      )
    }
    Promise.all(promises).then((results) => {
      const [notionData, supabaseData, cpsData] = results
      const notionPs = notionData?.settings ?? {}
      const supabasePs = supabaseData?.portal?.settings ?? {}
      // Merge: Supabase takes priority (ref-based portals), Notion as fallback
      const ps = { ...notionPs, ...supabasePs }
      setPortalSettings(ps)
      setSettingsBlockId(notionData?.settingsBlockId ?? null)
      setDisponivel(ps.contratoDisponivel ?? false)
      if (Array.isArray(ps.fases_pendentes_override)) setFasesPendentesOverride(ps.fases_pendentes_override)
      setContratoAprovadoEm(cpsData?.contrato?.contrato_aprovado_em ?? null)
    })
  }, [referencia])

  function handleGerarContrato() {
    window.open(`/eventos-2026/${eventoId}/contrato`, '_blank')
    setContratoVisto(true)
  }

  function handleVerContrato() {
    window.open(`/eventos-2026/${eventoId}/contrato`, '_blank')
    setContratoVisto(true)
    setPreviewing(true)
  }

  async function handleAprovarContrato() {
    if (!referencia) return
    if (!confirm('Aprovar este contrato?\n\nDepois de aprovado, podes criar o portal do cliente no topo da página.')) return
    setAprovandoContrato(true)
    try {
      const r = await fetch('/api/contrato-cps/aprovar-contrato', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, aprovar: true }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error ?? 'erro')
      setContratoAprovadoEm(j.contrato_aprovado_em)
      // Publica AUTOMATICAMENTE o contrato no portal do cliente.
      // PATCH /api/portais cria o row se não existir (não falha).
      if (referencia) {
        const contratoUrl = `/eventos-2026/${eventoId}/contrato`
        await fetch('/api/portais', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referencia, updates: { settings: { contratoDisponivel: true, contratoUrl } } }),
        }).catch(() => {})
        setDisponivel(true)
      }
    } catch (e: any) {
      alert(`Erro ao aprovar contrato: ${e.message}`)
    } finally {
      setAprovandoContrato(false)
    }
  }

  function supabaseHasPortal(): boolean {
    return portalSettings?.referencia === referencia
  }

  async function handleDesaprovarContrato() {
    if (!referencia) return
    if (!confirm('Reverter aprovação do contrato?\n\nO contrato deixará de estar disponível para o cliente no portal.')) return
    setAprovandoContrato(true)
    try {
      await fetch('/api/contrato-cps/aprovar-contrato', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, aprovar: false }),
      })
      // Esconde o contrato no portal do cliente
      await fetch('/api/portais', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, updates: { settings: { contratoDisponivel: false } } }),
      }).catch(() => {})
      setContratoAprovadoEm(null)
      setDisponivel(false)
    } finally {
      setAprovandoContrato(false)
    }
  }

  async function handlePublicarNoPortal() {
    setToggling(true)
    try {
      const contratoUrl = `/eventos-2026/${eventoId}/contrato`
      const newSettings = { ...(portalSettings ?? {}), contratoDisponivel: true, contratoUrl }
      // Save to Notion (legacy portal)
      const res = await fetch('/api/portal-settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: PORTAL_PAGE_ID, settings: newSettings, settingsBlockId }),
      })
      const data = await res.json()
      // Save to Supabase (ref-based portal) — essential for CAS_xxx portals
      if (referencia) {
        await fetch('/api/portais', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referencia, updates: { settings: { contratoDisponivel: true, contratoUrl } } }),
        })
      }
      setDisponivel(true)
      setPreviewing(false)
      setPortalSettings(newSettings)
      if (data.settingsBlockId) setSettingsBlockId(data.settingsBlockId)
    } finally {
      setToggling(false)
    }
  }

  async function handleRetirar() {
    setToggling(true)
    try {
      const newSettings = { ...(portalSettings ?? {}), contratoDisponivel: false }
      // Remove from Notion (legacy portal)
      await fetch('/api/portal-settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: PORTAL_PAGE_ID, settings: newSettings, settingsBlockId }),
      })
      // Remove from Supabase (ref-based portal)
      if (referencia) {
        await fetch('/api/portais', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referencia, updates: { settings: { contratoDisponivel: false } } }),
        })
      }
      setDisponivel(false)
      setPortalSettings(newSettings)
    } finally {
      setToggling(false)
    }
  }

  const contratoAprovado = !!contratoAprovadoEm

  return (
    <div className="pt-2 border-t border-white/[0.05]">
      <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-[10px] tracking-[0.3em] text-gold uppercase">Contrato de Prestação de Serviços</span>
          {contratoAprovado && (
            <span className="text-[9px] tracking-[0.25em] text-emerald-400 uppercase border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 rounded">
              ✓ Aprovado
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!contratoAprovado ? (
            <>
              {/* 1. Gerar Contrato */}
              <button onClick={handleGerarContrato}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/70 text-[10px] font-semibold tracking-wider hover:bg-white/[0.07] hover:text-white/90 transition-all">
                📄 Gerar Contrato
              </button>
              {/* 2. Ver Contrato */}
              <button onClick={handleVerContrato}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/30 text-gold text-[10px] font-semibold tracking-wider hover:bg-gold/20 transition-all">
                👁️ Ver Contrato ↗
              </button>
              {/* 3. Aprovar Contrato */}
              <button onClick={handleAprovarContrato} disabled={aprovandoContrato}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-[10px] font-semibold tracking-wider hover:bg-emerald-500/25 transition-all disabled:opacity-50">
                {aprovandoContrato ? '...' : '✓ Aprovar Contrato'}
              </button>
            </>
          ) : (
            <>
              <span className="text-[10px] text-white/40">
                Aprovado em {new Date(contratoAprovadoEm!).toLocaleString('pt-PT')}
              </span>
              <button onClick={handleVerContrato}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/30 text-gold text-[10px] font-semibold tracking-wider hover:bg-gold/20 transition-all">
                👁️ Ver Contrato ↗
              </button>
              <button onClick={handleDesaprovarContrato} disabled={aprovandoContrato}
                className="px-3 py-1.5 rounded-lg text-[10px] text-white/30 hover:text-white/60 transition-all">
                ↺ Reverter
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── BookingSection (Marcação Sessão/Reunião) — sincroniza com portal ───────
type BookingSlot = { id: string; date: string; time: string; local: string }

function BookingSectionFicha({ referencia }: { referencia?: string }) {
  const [loading, setLoading] = useState(true)
  const [exists, setExists]   = useState(false)
  const [tipo, setTipo]       = useState<'sessao' | 'reuniao'>('sessao')
  const [active, setActive]   = useState(false)
  const [slots, setSlots]     = useState<BookingSlot[]>([])
  const [reservedSlotId, setReservedSlotId] = useState<string | undefined>()
  const [reservedAt, setReservedAt]         = useState<string | undefined>()
  const [temServico, setTemServico]         = useState(false)
  const [draftSlots, setDraftSlots] = useState<BookingSlot[]>([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [notif, setNotif]     = useState<{ tone: 'ok' | 'err'; msg: string } | null>(null)

  const tipoEvento: 'casamento' | 'batizado' = (referencia ?? '').toUpperCase().startsWith('BAT_') ? 'batizado' : 'casamento'

  useEffect(() => {
    if (!referencia) { setLoading(false); return }
    fetch(`/api/portais?ref=${encodeURIComponent(referencia)}`)
      .then(r => r.json())
      .then(d => {
        if (!d.portal) { setExists(false); setLoading(false); return }
        setExists(true)
        const s = d.portal.settings ?? {}
        setTipo(s.bookingType === 'reuniao' ? 'reuniao' : 'sessao')
        setActive(!!s.bookingActive)
        setSlots(Array.isArray(s.bookingSlots) ? s.bookingSlots : [])
        setReservedSlotId(s.bookingReservedSlotId)
        setReservedAt(s.bookingReservedAt)
        setTemServico(!!s.preWeddingServico)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [referencia])

  useEffect(() => { setDraftSlots(slots) }, [JSON.stringify(slots)])
  useEffect(() => {
    if (!notif) return
    const t = setTimeout(() => setNotif(null), 4500)
    return () => clearTimeout(t)
  }, [notif])

  async function persistPatch(patch: Record<string, any>): Promise<boolean> {
    if (!referencia) return false
    setSaving(true)
    // PATCH /api/portais já faz merge: { ...current.settings, ...updates.settings }
    try {
      const res = await fetch('/api/portais', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, updates: { settings: patch } }),
      })
      const j = await res.json().catch(() => ({}))
      setSaving(false)
      return res.ok && j?.ok !== false
    } catch {
      setSaving(false)
      return false
    }
  }

  async function toggleActive() {
    const next = !active
    setActive(next)
    await persistPatch({ bookingActive: next })
    setNotif({ tone: 'ok', msg: next ? 'Secção ativa para o cliente.' : 'Secção desativada — cliente não vê.' })
  }

  async function changeTipo(novo: 'sessao' | 'reuniao') {
    setTipo(novo)
    await persistPatch({ bookingType: novo })
  }

  async function toggleTemServico() {
    const next = !temServico
    setTemServico(next)
    await persistPatch({ preWeddingServico: next })
    setNotif({ tone: 'ok', msg: next ? 'Serviço Pré-Wedding ativado.' : 'Serviço Pré-Wedding desativado.' })
  }

  // Aprova: ativa a secção no portal E notifica os noivos (sino + email card).
  async function aprovarENotificar() {
    if (!referencia) return
    if (slots.filter(s => s.date && s.time).length === 0) {
      setNotif({ tone: 'err', msg: 'Adiciona pelo menos uma data (slot) antes de aprovar.' })
      return
    }
    setSaving(true)
    setActive(true)
    await persistPatch({ bookingActive: true })
    const titulo = tipo === 'reuniao' ? 'Marcar Reunião' : 'Marcar Pré-Wedding'
    const texto = tipo === 'reuniao'
      ? 'Já podem escolher a data e hora da reunião na página Pré-Wedding do vosso portal.'
      : 'Já podem escolher a data, hora e local da vossa sessão pré-wedding na página Pré-Wedding do portal.'
    await fetch('/api/notificacao-noivos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia, titulo, texto }),
    }).catch(() => {})
    setSaving(false)
    setNotif({ tone: 'ok', msg: 'Aprovado — os noivos foram notificados (sino + email).' })
  }

  async function cancelarReserva() {
    setReservedSlotId(undefined); setReservedAt(undefined)
    await persistPatch({ bookingReservedSlotId: null, bookingReservedAt: null })
    setNotif({ tone: 'ok', msg: 'Reserva do cliente cancelada.' })
  }

  function addDraftSlot() {
    setDraftSlots(d => [...d, { id: Date.now().toString(), date: '', time: '', local: '' }])
  }
  function updateDraftSlot(id: string, field: keyof BookingSlot, value: string) {
    setDraftSlots(d => d.map(s => s.id === id ? { ...s, [field]: value } : s))
  }
  function removeDraftSlot(id: string) {
    setDraftSlots(d => d.filter(s => s.id !== id))
  }
  async function saveDraftSlots() {
    const clean = draftSlots.filter(s => s.date && s.time)
    const ok = await persistPatch({ bookingSlots: clean })
    if (!ok) {
      setNotif({ tone: 'err', msg: 'Falha ao guardar os slots. Verifica a ligação e tenta de novo.' })
      return
    }
    // Reconfirma com o servidor para garantir que ficou mesmo guardado
    try {
      const d = await fetch(`/api/portais?ref=${encodeURIComponent(referencia)}`).then(r => r.json())
      const saved = Array.isArray(d.portal?.settings?.bookingSlots) ? d.portal.settings.bookingSlots : clean
      setSlots(saved)
    } catch {
      setSlots(clean)
    }
    setEditing(false)
    setNotif({ tone: 'ok', msg: `${clean.length} slot(s) guardado(s).` })
  }

  function fmtData(d: string) {
    if (!d) return ''
    try {
      return new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch { return d }
  }

  if (!referencia) return null
  if (loading) return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-3">
      <h2 className="text-[10px] tracking-[0.35em] text-gold uppercase">Marcação</h2>
      <p className="text-[11px] text-white/30 italic">A carregar...</p>
    </div>
  )
  if (!exists) return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-3">
      <h2 className="text-[10px] tracking-[0.35em] text-gold uppercase">Marcação</h2>
      <p className="text-[11px] text-white/30 italic">Portal ainda não foi criado. Cria o portal acima para configurar marcações.</p>
    </div>
  )

  const reservedSlot = slots.find(s => s.id === reservedSlotId)
  const portalUrl = tipoEvento === 'batizado'
    ? `/portal-batizado/ref/${encodeURIComponent(referencia)}?admin=1`
    : `/portal-cliente/ref/${encodeURIComponent(referencia)}?admin=1`

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-[10px] tracking-[0.35em] text-gold uppercase">Marcação de Pré-Wedding</h2>
          {/* Checkbox: ativa o serviço (desbloqueia a secção) */}
          <button onClick={toggleTemServico}
            className={`flex items-center gap-2 text-[10px] tracking-widest font-bold uppercase px-3 py-1 rounded-lg border transition-all ${temServico ? 'border-emerald-400/50 text-emerald-300 bg-emerald-400/10' : 'border-white/20 text-white/45 bg-white/[0.02]'}`}>
            <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] ${temServico ? 'border-emerald-400 bg-emerald-400/20 text-emerald-300' : 'border-white/30'}`}>{temServico ? '✓' : ''}</span>
            Tem serviço Pré-Wedding
          </button>
          {saving && <span className="text-[9px] text-gold/40 animate-pulse">A guardar...</span>}
        </div>
        {temServico && (
        <div className="flex items-center gap-2">
          <select value={tipo} onChange={e => changeTipo(e.target.value as 'sessao' | 'reuniao')}
            className="text-[10px] bg-black/40 border border-white/15 text-white/70 rounded px-2 py-1">
            <option value="sessao">Sessão Fotografia</option>
            <option value="reuniao">Reunião</option>
          </select>
          <button onClick={aprovarENotificar}
            className="text-[10px] tracking-widest font-bold uppercase px-3 py-1 rounded-lg border border-gold/50 bg-gold/15 text-gold hover:bg-gold/25 transition-all">
            ✓ Aprovar e Notificar
          </button>
          <button onClick={toggleActive}
            className={`text-[10px] tracking-widest font-bold uppercase px-3 py-1 rounded-lg border transition-all ${active ? 'border-emerald-400/50 text-emerald-300 bg-emerald-400/10' : 'border-white/20 text-white/45 bg-white/[0.02]'}`}>
            {active ? '● Ativo (cliente vê)' : '○ Inativo (oculto)'}
          </button>
          <a href={portalUrl} target="_blank" rel="noopener noreferrer"
            className="text-[10px] tracking-widest font-bold uppercase px-3 py-1 rounded-lg border border-gold/40 bg-gold/10 text-gold hover:bg-gold/20 transition-all">
            Ver no Portal ↗
          </a>
        </div>
        )}
      </div>

      {!temServico && (
        <p className="text-[11px] text-white/30 italic">Este evento não tem serviço de Pré-Wedding. Marca a caixa acima se o serviço estiver contratado para desbloquear a marcação.</p>
      )}

      {notif && (
        <div className={`text-[11px] px-3 py-2 rounded ${notif.tone === 'ok' ? 'border border-emerald-400/25 text-emerald-300/90 bg-emerald-400/5' : 'border border-red-400/25 text-red-300/80 bg-red-400/5'}`}>
          {notif.tone === 'ok' ? '✓ ' : '⚠ '}{notif.msg}
        </div>
      )}

      {/* Reserva atual */}
      {temServico && reservedSlot && (
        <div className="rounded-xl border border-emerald-400/40 bg-emerald-400/[0.06] p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-[9px] tracking-[0.4em] text-emerald-300/70 uppercase mb-1">Cliente reservou</p>
            <p className="text-base font-semibold text-emerald-200">
              {fmtData(reservedSlot.date)} · {reservedSlot.time}{reservedSlot.local ? ' · ' + reservedSlot.local : ''}
            </p>
            {reservedAt && (
              <p className="text-[10px] text-white/30 mt-1">Em {new Date(reservedAt).toLocaleString('pt-PT')}</p>
            )}
          </div>
          <button onClick={cancelarReserva}
            className="text-[10px] tracking-widest uppercase text-red-400/70 hover:text-red-400 border border-red-400/30 hover:border-red-400/50 px-3 py-1.5 rounded-lg">
            Cancelar Reserva
          </button>
        </div>
      )}

      {/* Slots (lista compacta) */}
      {temServico && !editing && (
        <div className="flex flex-col gap-2">
          {slots.length === 0 && (
            <p className="text-[11px] text-white/30 italic">Sem slots configurados.</p>
          )}
          {slots.map(s => {
            const isReserved = s.id === reservedSlotId
            return (
              <div key={s.id} className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border ${isReserved ? 'border-emerald-400/40 bg-emerald-400/[0.05]' : 'border-white/10 bg-white/[0.02]'}`}>
                <div className="text-[12px] text-white/80">
                  <span className="font-semibold">{fmtData(s.date)}</span>
                  <span className="text-white/40 mx-2">·</span>
                  <span>{s.time}</span>
                  {s.local && <><span className="text-white/40 mx-2">·</span><span className="text-white/55">{s.local}</span></>}
                </div>
                {isReserved && <span className="text-[9px] tracking-widest text-emerald-300/70 uppercase">Reservado</span>}
              </div>
            )
          })}
          <div className="flex gap-2 pt-1">
            <button onClick={() => setEditing(true)}
              className="text-[10px] tracking-widest font-bold uppercase px-3 py-1.5 rounded-lg border border-gold/40 text-gold/80 hover:bg-gold/10">
              ✎ Editar Slots
            </button>
          </div>
        </div>
      )}

      {/* Editor */}
      {temServico && editing && (
        <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-3">
          <p className="text-[10px] tracking-[0.3em] text-white/40 uppercase">Editar Slots</p>
          {draftSlots.map(s => (
            <div key={s.id} className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-center">
              <input type="date" value={s.date} onChange={e => updateDraftSlot(s.id, 'date', e.target.value)}
                className="col-span-1 sm:col-span-4 bg-black/40 border border-white/15 rounded px-2 py-1.5 text-xs text-white/80 outline-none focus:border-gold/40" />
              <input type="time" value={s.time} onChange={e => updateDraftSlot(s.id, 'time', e.target.value)}
                className="col-span-1 sm:col-span-3 bg-black/40 border border-white/15 rounded px-2 py-1.5 text-xs text-white/80 outline-none focus:border-gold/40" />
              <input type="text" value={s.local} placeholder="Local"
                onChange={e => updateDraftSlot(s.id, 'local', e.target.value)}
                className="col-span-2 sm:col-span-4 bg-black/40 border border-white/15 rounded px-2 py-1.5 text-xs text-white/80 outline-none focus:border-gold/40 placeholder:text-white/20" />
              <button onClick={() => removeDraftSlot(s.id)}
                className="col-span-2 sm:col-span-1 text-red-400/60 hover:text-red-400 text-[10px] tracking-widest uppercase font-bold border border-red-400/30 hover:border-red-400/50 px-2 py-1 rounded sm:border-0 sm:hover:border-0 sm:p-0 sm:text-lg sm:leading-none">
                <span className="sm:hidden">× Remover</span><span className="hidden sm:inline">×</span>
              </button>
            </div>
          ))}
          <div className="flex gap-2 pt-1 flex-wrap">
            <button onClick={addDraftSlot}
              className="text-[11px] tracking-widest uppercase font-bold px-3 py-1.5 rounded-lg border border-white/20 text-white/70 hover:bg-white/[0.05]">+ Slot</button>
            <button onClick={saveDraftSlots}
              className="text-[11px] tracking-widest uppercase font-bold px-3 py-1.5 rounded-lg border border-emerald-400/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20">✓ Guardar</button>
            <button onClick={() => { setDraftSlots(slots); setEditing(false) }}
              className="text-[11px] tracking-widest uppercase font-bold px-3 py-1.5 rounded-lg border border-white/15 text-white/50 hover:bg-white/[0.05]">Cancelar</button>
          </div>
          <p className="text-[10px] text-white/25 italic">Datas sem hora são descartadas. Slots sincronizam com o portal do cliente.</p>
        </div>
      )}
    </div>
  )
}

// ─── Botão "Reenviar Email" do portal aprovado ────────────────────────────
function ReenviarEmailButton({ referencia }: { referencia: string }) {
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'err'; msg: string } | null>(null)

  async function handleReenviar() {
    if (!confirm(`Reenviar email do portal ao cliente para ${referencia}?\n\nO sistema resolve o email da noiva/noivo da ficha do cliente (CPS, eventos, Notion).`)) return
    setSending(true)
    setFeedback(null)
    try {
      const r = await fetch('/api/contrato-cps/aprovar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia, resend: true }),
      })
      const d = await r.json()
      if (!r.ok || d.error) {
        setFeedback({ tone: 'err', msg: d.error ?? 'Falha ao reenviar email' })
      } else if (d.ok && d.emailSentTo) {
        setFeedback({ tone: 'ok', msg: `Email enviado para ${d.emailSentTo}` })
      } else {
        setFeedback({ tone: 'err', msg: 'Email do cliente não encontrado em CPS / ficha / Notion. Preenche o campo "E-mail da noiva" na ficha.' })
      }
    } catch (e: any) {
      setFeedback({ tone: 'err', msg: e.message })
    } finally {
      setSending(false)
      setTimeout(() => setFeedback(null), 8000)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button onClick={handleReenviar} disabled={sending}
        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-400/30 text-emerald-300/90 font-bold text-xs tracking-widest hover:bg-emerald-400/10 hover:border-emerald-400/60 transition-all uppercase disabled:opacity-50">
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
        {sending ? 'A enviar...' : '📧 Reenviar Email ao Cliente'}
      </button>
      {feedback && (
        <p className={`text-[10px] tracking-wide ${feedback.tone === 'ok' ? 'text-emerald-300/80' : 'text-red-400/80'}`}>
          {feedback.tone === 'ok' ? '✓ ' : '⚠ '}{feedback.msg}
        </p>
      )}
    </div>
  )
}

// ─── Notas privadas do admin (livre, autosalva em evento_notas) ─────────────
function NotasSection({ referencia }: { referencia?: string }) {
  const [nota, setNota] = useState('')
  const [savedNota, setSavedNota] = useState('')
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (!referencia) { setLoaded(true); return }
    fetch(`/api/evento-notas?ref=${encodeURIComponent(referencia)}`)
      .then(r => r.json())
      .then(d => {
        setNota(d.nota ?? '')
        setSavedNota(d.nota ?? '')
        setUpdatedAt(d.updated_at ?? null)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [referencia])

  // Debounced auto-save (1s)
  useEffect(() => {
    if (!loaded || !referencia) return
    if (nota === savedNota) return
    const t = setTimeout(async () => {
      setSaving(true)
      try {
        const res = await fetch('/api/evento-notas', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referencia, nota }),
        })
        if (res.ok) {
          setSavedNota(nota)
          setUpdatedAt(new Date().toISOString())
          setSavedAt(Date.now())
        }
      } finally { setSaving(false) }
    }, 1000)
    return () => clearTimeout(t)
  }, [nota, loaded, savedNota, referencia])

  // Auto-clear "✓ Guardado" pill após 2s
  useEffect(() => {
    if (!savedAt) return
    const t = setTimeout(() => setSavedAt(null), 2200)
    return () => clearTimeout(t)
  }, [savedAt])

  if (!referencia) return null

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-5 flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-[10px] tracking-[0.35em] text-gold uppercase">Notas (privadas)</h2>
        <div className="flex items-center gap-3 text-[10px]">
          {saving && <span className="text-gold/40 animate-pulse">A guardar...</span>}
          {savedAt && !saving && <span className="text-emerald-400/70">✓ Guardado</span>}
          {updatedAt && !saving && !savedAt && (
            <span className="text-white/25">Atualizado: {new Date(updatedAt).toLocaleString('pt-PT')}</span>
          )}
        </div>
      </div>
      <textarea
        value={nota}
        onChange={e => setNota(e.target.value)}
        placeholder={loaded ? "As tuas notas sobre este evento... (auto-guarda)" : "A carregar..."}
        disabled={!loaded}
        rows={5}
        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/85 outline-none focus:border-gold/40 resize-y placeholder:text-white/20 leading-relaxed transition-colors"
      />
      <p className="text-[9px] text-white/20 tracking-wider">Estas notas só são visíveis para o admin. Auto-guarda 1s após parares de escrever.</p>
    </div>
  )
}

function PortalSection({ evento }: { evento: Evento }) {
  const referencia = evento.referencia!
  // Detecta tipo do evento (batizado vs casamento) para usar a rota correta
  const tipoEvento: 'casamento' | 'batizado' = (() => {
    const tiposEvento = (evento.tipo_evento ?? []).map((t: any) =>
      typeof t === 'string' ? t : (t?.name ?? String(t ?? ''))
    )
    if (tiposEvento.map((t: string) => t.toUpperCase()).includes('BATIZADO')) return 'batizado'
    if ((referencia ?? '').toUpperCase().startsWith('BAT_')) return 'batizado'
    return 'casamento'
  })()
  const portalBase = tipoEvento === 'batizado' ? '/portal-batizado' : '/portal-cliente'
  const labelCliente = tipoEvento === 'batizado' ? 'Ver Portal Batizado' : 'Ver Portal do Cliente'

  const [status, setStatus] = useState<'loading' | 'found' | 'not_found' | 'error'>('loading')
  const [creating, setCreating] = useState(false)
  const [pwBooking, setPwBooking] = useState<{ coupleNames: string; date: string; time: string; local: string; reservedAt: string | null } | null>(null)
  const [portalSettings, setPortalSettings] = useState<any>({})
  const [editingPw, setEditingPw] = useState(false)
  const [pwForm, setPwForm] = useState({ date: '', time: '', local: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [portalPassword, setPortalPassword] = useState<string>('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordSaved, setPasswordSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch(`/api/portais?ref=${encodeURIComponent(referencia)}`)
      .then(r => r.json())
      .then(d => {
        if (!d.portal) { setStatus('not_found'); return }
        setStatus('found')
        const ps = d.portal.settings ?? {}
        setPortalSettings(ps)
        // Carregar password admin
        fetch(`/api/portais-password?ref=${encodeURIComponent(referencia)}`)
          .then(r => r.json())
          .then(p => { if (p.password) setPortalPassword(p.password) })
          .catch(() => {})

        const slots: any[] = ps.preWeddingSlots ?? []
        const reservedId: string | null = ps.preWeddingReservedSlotId ?? null
        const slot = reservedId ? slots.find((s: any) => s.id === reservedId) : null
        if (slot) {
          setPwBooking({
            coupleNames: [ps.noiva, ps.noivo].filter(Boolean).join(' & ') || 'Casal',
            date: slot.date,
            time: slot.time,
            local: slot.local,
            reservedAt: ps.preWeddingReservedAt ?? null,
          })
        }
      })
      .catch(() => setStatus('error'))
  }, [referencia])

  async function saveSettings(newSettings: any) {
    await fetch('/api/portais', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia, settings: newSettings }),
    })
    setPortalSettings(newSettings)
  }

  async function handleSavePw() {
    setSavingPw(true)
    try {
      const slots: any[] = portalSettings.preWeddingSlots ?? []
      const reservedId = portalSettings.preWeddingReservedSlotId
      const newSlots = slots.map((s: any) =>
        s.id === reservedId ? { ...s, date: pwForm.date, time: pwForm.time, local: pwForm.local } : s
      )
      const newSettings = { ...portalSettings, preWeddingSlots: newSlots }
      await saveSettings(newSettings)
      setPwBooking(b => b ? { ...b, date: pwForm.date, time: pwForm.time, local: pwForm.local } : b)
      setEditingPw(false)
    } finally { setSavingPw(false) }
  }

  async function handleCancelReservation() {
    if (!confirm('Cancelar a reserva do Pré-Wedding? O cliente poderá escolher uma nova data.')) return
    setSavingPw(true)
    try {
      const newSettings = { ...portalSettings }
      delete newSettings.preWeddingReservedSlotId
      delete newSettings.preWeddingReservedAt
      await saveSettings(newSettings)
      setPwBooking(null)
      setEditingPw(false)
    } finally { setSavingPw(false) }
  }

  async function handleCriarPortal() {
    setCreating(true)
    try {
      const tiposEvento = evento.tipo_evento ?? []
      const tipoPortal = tiposEvento.map((t: any) => typeof t === 'string' ? t.toUpperCase() : String(t?.name ?? t ?? '').toUpperCase()).includes('BATIZADO')
        ? 'batizado'
        : 'casamento'

      const res = await fetch('/api/portais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referencia,
          noiva: evento.nome_noiva ?? '',
          noivo: evento.nome_noivo ?? '',
          data: evento.data_evento ?? null,
          local: evento.local ?? '',
          valorFoto: evento.valor_foto ?? null,
          valorVideo: evento.valor_video ?? null,
          valorExtras: evento.valor_extras ?? null,
          tipoPortal,
        }),
      })
      if (res.ok) {
        setStatus('found')
        const base = tipoPortal === 'batizado' ? '/portal-batizado' : '/portal-cliente'
        window.open(`${base}/ref/${encodeURIComponent(referencia)}`, '_blank')
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleEliminarPortal() {
    setDeleting(true)
    try {
      await fetch(`/api/portais?ref=${encodeURIComponent(referencia)}`, { method: 'DELETE' })
      setStatus('not_found')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
  }

  function fmtPwDate(ds: string) {
    const [y, m, d] = ds.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
    return `${String(d).padStart(2,'0')} ${MESES_PW[m-1]} ${y} · ${dias[dt.getDay()]}`
  }

  const dtu = pwBooking ? Math.round((new Date(pwBooking.date + 'T00:00:00').getTime() - new Date().setHours(0,0,0,0)) / 86400000) : null

  // Quando não há portal, esconde a secção inteira — a criação do portal
  // é feita pela secção nova "Aprovação Contrato CPS" no topo da ficha.
  if (status === 'not_found') return null

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 mb-5">
      <h2 className="text-[10px] tracking-[0.35em] text-gold uppercase mb-4">Portal do Cliente</h2>
      {status === 'loading' && (
        <p className="text-xs text-white/20 animate-pulse">A verificar portal...</p>
      )}
      {status === 'found' && (
        <div className="flex flex-col gap-4">
          {pwBooking && !editingPw && (
            <div className={`flex items-center gap-4 px-4 py-3 rounded-xl border ${dtu !== null && dtu <= 15 ? 'border-red-500/30 bg-red-500/5' : 'border-emerald-500/25 bg-emerald-500/5'}`}>
              <svg className={`w-4 h-4 flex-shrink-0 ${dtu !== null && dtu <= 15 ? 'text-red-400' : 'text-emerald-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] tracking-[0.3em] text-white/25 uppercase mb-0.5">Pré-Wedding Marcado</p>
                <p className="text-sm font-semibold text-white/80">{fmtPwDate(pwBooking.date)}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-white/40">{pwBooking.time}</span>
                  {pwBooking.local && <span className="text-xs text-white/30">📍 {pwBooking.local}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full tracking-widest ${dtu !== null && dtu <= 15 ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                  {dtu === 0 ? 'HOJE' : dtu !== null && dtu < 0 ? 'PASSOU' : dtu !== null && dtu <= 15 ? `${dtu}d` : '✓'}
                </span>
                <button onClick={() => { setPwForm({ date: pwBooking.date, time: pwBooking.time, local: pwBooking.local }); setEditingPw(true) }}
                  className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all" title="Editar">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {editingPw && (
            <div className="border border-white/10 bg-white/[0.02] rounded-xl p-4 space-y-3">
              <p className="text-[9px] tracking-[0.3em] text-gold/70 uppercase mb-2">Editar Pré-Wedding Marcado</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Data</label>
                  <input type="date" value={pwForm.date}
                    onChange={e => setPwForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors" />
                </div>
                <div>
                  <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Hora</label>
                  <input type="time" value={pwForm.time}
                    onChange={e => setPwForm(f => ({ ...f, time: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors" />
                </div>
                <div>
                  <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Local</label>
                  <input type="text" value={pwForm.local} placeholder="ex: Sintra"
                    onChange={e => setPwForm(f => ({ ...f, local: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-2 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button onClick={handleCancelReservation} disabled={savingPw}
                  className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors tracking-widest disabled:opacity-40">
                  ✕ Cancelar reserva
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setEditingPw(false)} disabled={savingPw}
                    className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">
                    Cancelar
                  </button>
                  <button onClick={handleSavePw} disabled={savingPw || !pwForm.date}
                    className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                    {savingPw ? 'A guardar...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <a href={`${portalBase}/ref/${encodeURIComponent(referencia)}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-black font-bold text-xs tracking-widest hover:bg-gold/80 transition-all uppercase">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              {labelCliente} ↗
            </a>
            <button
              onClick={() => {
                sessionStorage.setItem(`portalAdmin_${referencia}`, 'true')
                window.open(`${portalBase}/ref/${encodeURIComponent(referencia)}?admin=1`, '_blank')
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-white/60 font-bold text-xs tracking-widest hover:bg-white/5 hover:text-white transition-all uppercase">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Editar como Admin ↗
            </button>
            <ReenviarEmailButton referencia={referencia} />
          </div>
          {/* Eliminar portal */}
          <div className="mt-1 pt-3 border-t border-white/[0.04]">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-[10px] tracking-[0.3em] text-red-400/40 hover:text-red-400/80 transition-colors uppercase"
              >
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Eliminar Portal
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <p className="text-[10px] text-red-400/70 tracking-wide">Eliminar definitivamente? Esta acção não pode ser revertida.</p>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-[10px] text-white/30 hover:text-white/60 transition-colors tracking-widest uppercase"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarPortal}
                  disabled={deleting}
                  className="text-[10px] text-red-400 hover:text-red-300 font-semibold tracking-widest uppercase transition-colors disabled:opacity-40"
                >
                  {deleting ? 'A eliminar...' : 'Confirmar'}
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-3">
            <span className="text-[9px] tracking-[0.3em] text-white/25 uppercase shrink-0">Password</span>
            <input
              type="text"
              value={portalPassword}
              onChange={e => { setPortalPassword(e.target.value); setPasswordSaved(false) }}
              placeholder="Definir password..."
              className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-gold/70 placeholder-white/20 focus:outline-none focus:border-gold/30 transition-colors w-40"
            />
            <button
              onClick={async () => {
                setSavingPassword(true)
                await fetch('/api/portais', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ referencia, updates: { settings: { portalPassword: portalPassword.trim() || null } } }),
                })
                setSavingPassword(false)
                setPasswordSaved(true)
                setTimeout(() => setPasswordSaved(false), 2000)
              }}
              disabled={savingPassword}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white/40 hover:text-white/70 hover:border-white/25 transition-all disabled:opacity-40"
            >
              {savingPassword ? '...' : passwordSaved ? '✓' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400/50">Erro ao verificar portal.</p>
      )}
    </div>
  )
}

// ─── Foto dos Noivos (redonda) — upload no topo da ficha → portal sidebar ─────
function FotoNoivosUpload({ referencia }: { referencia: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch(`/api/portais?ref=${encodeURIComponent(referencia)}`)
      .then(r => r.json())
      .then(d => setUrl(d.portal?.settings?.casalFotoUrl ?? null))
      .catch(() => {})
  }, [referencia])

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const up = await fetch('/api/upload-image', { method: 'POST', body: fd }).then(r => r.json())
      if (up?.url) {
        await fetch('/api/portais', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ referencia, updates: { settings: { casalFotoUrl: up.url } } }),
        })
        setUrl(up.url)
      }
    } finally { setUploading(false) }
  }

  async function remover() {
    await fetch('/api/portais', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia, updates: { settings: { casalFotoUrl: null } } }),
    })
    setUrl(null)
  }

  return (
    <div className="flex items-center gap-3">
      <label className="relative w-[68px] h-[68px] rounded-full overflow-hidden border-2 border-gold/40 cursor-pointer shrink-0 flex items-center justify-center group"
        style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.22), rgba(20,16,10,0.9))', boxShadow: '0 0 20px -6px rgba(201,164,92,0.5)' }}
        title="Carregar foto dos noivos">
        {url
          ? <img src={url} alt="" className="w-full h-full object-cover" />
          : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c9a45c" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.66-.9l.82-1.2A2 2 0 0110.07 4h3.86a2 2 0 011.66.9l.82 1.2a2 2 0 001.66.9H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><circle cx="12" cy="13" r="3"/></svg>}
        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center text-[8px] text-white/0 group-hover:text-white/90 tracking-widest uppercase">{uploading ? '…' : 'Alterar'}</span>
        <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={uploading} />
      </label>
      <div className="flex flex-col gap-0.5">
        <span className="text-[9px] tracking-[0.3em] uppercase text-gold/60">Foto dos Noivos</span>
        <span className="text-[10px] text-white/35">{uploading ? 'A carregar…' : url ? 'Aparece na barra lateral do portal' : 'Clica para carregar'}</span>
        {url && <button onClick={remover} className="text-[9px] text-red-400/60 hover:text-red-400 tracking-widest uppercase self-start mt-0.5">Remover</button>}
      </div>
    </div>
  )
}

// ─── Drawer genérico de bloco (botão → painel lateral à direita, fecha) ───────
function DrawerBloco({ label, sub, children, width = 820 }: { label: string; sub?: string; children: React.ReactNode; width?: number }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    function onKey(ev: KeyboardEvent) { if (ev.key === 'Escape') setOpen(false) }
    if (open) { document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open])
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="ficha-reveal print:hidden w-full group relative overflow-hidden rounded-2xl border border-white/[0.08] hover:border-gold/30 p-5 flex items-center justify-between gap-4 text-left transition-all"
        style={{ background: 'linear-gradient(158deg, rgba(255,255,255,0.028), rgba(201,164,92,0.02))' }}>
        <span className="pointer-events-none absolute left-0 top-5 bottom-5 w-[2px] rounded-full" style={{ background: 'linear-gradient(to bottom, rgba(201,164,92,0.7), rgba(201,164,92,0))' }} />
        <div className="pl-1.5">
          <p className="flex items-center gap-2.5 text-[10px] tracking-[0.38em] text-gold uppercase font-semibold">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold" style={{ boxShadow: '0 0 9px rgba(201,164,92,0.7)' }} />
            {label}
          </p>
          {sub && <p className="text-[11px] text-white/40 mt-1.5">{sub}</p>}
        </div>
        <span className="shrink-0 flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-gold/80 border border-gold/30 bg-gold/10 rounded-lg px-3 py-2 group-hover:bg-gold/20 transition-all">
          Abrir
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </span>
      </button>

      <div onClick={() => setOpen(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(6,5,3,0.6)', backdropFilter: 'blur(3px)', opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity .3s ease' }} />

      <aside style={{
        position: 'fixed', top: 0, right: 0, height: '100dvh', zIndex: 96,
        width: `min(${width}px, 100vw)`, maxWidth: '100vw',
        background: 'linear-gradient(180deg, #15110b, #0d0a06)',
        borderLeft: '1px solid rgba(201,164,92,0.25)',
        boxShadow: '-30px 0 80px -20px rgba(0,0,0,0.7)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .42s cubic-bezier(.2,.7,.2,1)',
        overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{ position: 'sticky', top: 0, zIndex: 2, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#15110b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <span className="text-[10px] tracking-[0.35em] text-gold uppercase font-semibold">{label}</span>
          <button onClick={() => setOpen(false)} aria-label="Fechar"
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white hover:border-gold/40 transition-all">✕</button>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {open && children}
        </div>
      </aside>
    </>
  )
}

// ─── Drawer Agendamento & Notas (abre da direita, tabs, fecha) ────────────────
function AgendamentoNotasDrawer({ referencia }: { referencia?: string }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'marcacao' | 'notas'>('marcacao')

  useEffect(() => {
    function onKey(ev: KeyboardEvent) { if (ev.key === 'Escape') setOpen(false) }
    if (open) { document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden' }
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Botão (conteúdo do bloco) */}
      <button onClick={() => setOpen(true)}
        className="ficha-reveal print:hidden mt-5 w-full group relative overflow-hidden rounded-2xl border border-white/[0.08] hover:border-gold/30 p-5 flex items-center justify-between gap-4 text-left transition-all"
        style={{ background: 'linear-gradient(158deg, rgba(255,255,255,0.028), rgba(201,164,92,0.02))' }}>
        <span className="pointer-events-none absolute left-0 top-5 bottom-5 w-[2px] rounded-full" style={{ background: 'linear-gradient(to bottom, rgba(201,164,92,0.7), rgba(201,164,92,0))' }} />
        <div className="pl-1.5">
          <p className="flex items-center gap-2.5 text-[10px] tracking-[0.38em] text-gold uppercase font-semibold">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold" style={{ boxShadow: '0 0 9px rgba(201,164,92,0.7)' }} />
            Marcação Pré-Wedding & Notas
          </p>
          <p className="text-[11px] text-white/40 mt-1.5">Abrir painel para gerir a sessão pré-wedding e as notas privadas.</p>
        </div>
        <span className="shrink-0 flex items-center gap-2 text-[11px] tracking-[0.25em] uppercase text-gold/80 border border-gold/30 bg-gold/10 rounded-lg px-3 py-2 group-hover:bg-gold/20 transition-all">
          Abrir
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </span>
      </button>

      {/* Overlay */}
      <div onClick={() => setOpen(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(6,5,3,0.6)', backdropFilter: 'blur(3px)',
          opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity .3s ease' }} />

      {/* Drawer */}
      <aside style={{
        position: 'fixed', top: 0, right: 0, height: '100dvh', zIndex: 96,
        width: 'min(820px, 100vw)', maxWidth: '100vw',
        background: 'linear-gradient(180deg, #15110b, #0d0a06)',
        borderLeft: '1px solid rgba(201,164,92,0.25)',
        boxShadow: '-30px 0 80px -20px rgba(0,0,0,0.7)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform .42s cubic-bezier(.2,.7,.2,1)',
        overflowY: 'auto', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch',
      }}>
        {/* Header do drawer */}
        <div style={{ position: 'sticky', top: 0, zIndex: 2, background: '#15110b', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => setTab('marcacao')}
              className={`text-[10px] tracking-[0.2em] uppercase font-bold px-3 py-2 rounded-lg border transition-all ${tab === 'marcacao' ? 'border-gold/50 text-gold bg-gold/10' : 'border-white/10 text-white/40 hover:text-white/70'}`}>
              Marcação
            </button>
            <button onClick={() => setTab('notas')}
              className={`text-[10px] tracking-[0.2em] uppercase font-bold px-3 py-2 rounded-lg border transition-all ${tab === 'notas' ? 'border-gold/50 text-gold bg-gold/10' : 'border-white/10 text-white/40 hover:text-white/70'}`}>
              Notas
            </button>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Fechar"
            className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white hover:border-gold/40 transition-all">✕</button>
        </div>
        {/* Conteúdo */}
        <div style={{ padding: 20 }}>
          {open && (tab === 'marcacao'
            ? <BookingSectionFicha referencia={referencia} />
            : <NotasSection referencia={referencia} />)}
        </div>
      </aside>
    </>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────
export default function EventoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [navRef, setNavRef] = useState('')
  const [navLoading, setNavLoading] = useState(false)
  const [usedRefs, setUsedRefs] = useState<Set<string>>(new Set())
  const [evento, setEvento] = useState<Evento | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [valorFotografo, setValorFotografo] = useState<number>(0)
  const [valorVideografo, setValorVideografo] = useState<number>(0)
  const [valorEditorVideo, setValorEditorVideo] = useState<number>(0)
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [pagamentosRefreshing, setPagamentosRefreshing] = useState(false)
  const [registarFase, setRegistarFase] = useState<string | null>(null)   // fase a registar manualmente
  const [registarValor, setRegistarValor] = useState('')
  const [registarData, setRegistarData]   = useState(new Date().toISOString().slice(0, 10))
  const [registarMetodo, setRegistarMetodo] = useState('Transferência')
  const [registarSaving, setRegistarSaving] = useState(false)
  const [fasesPendentesOverride, setFasesPendentesOverride] = useState<string[]>([])
  const [editingPagId, setEditingPagId] = useState<string | null>(null)
  const [editingPagValor, setEditingPagValor] = useState('')
  const [editingPagData, setEditingPagData] = useState('')
  const [editingPagMetodo, setEditingPagMetodo] = useState('')
  const [editingPagFase, setEditingPagFase] = useState<string[]>([])
  const [editingPagSaving, setEditingPagSaving] = useState(false)
  const [fotosDataEntrada, setFotosDataEntrada] = useState<string | null>(null)
  const [albumDataPrevista, setAlbumDataPrevista] = useState<string | null>(null)
  const [albumNotionId, setAlbumNotionId] = useState<string | null>(null)
  const [referenciaLoaded, setReferenciaLoaded] = useState<string | null>(null)
  const [portalSelecaoEstado, setPortalSelecaoEstado] = useState<string>('Aguardar')
  const [prazoFotosNoivosEstado, setPrazoFotosNoivosEstado] = useState<string>('Aguardar')
  const [maqueteEnviada, setMaqueteEnviada] = useState<string | null>(null)
  const [selecaoEnviada, setSelecaoEnviada] = useState<string | null>(null)
  // Armazenamento: timestamp ISO de quando o backup foi confirmado pela equipa
  const [armazenamentoBackup, setArmazenamentoBackup] = useState<string | null>(null)
  const [preWeddingEnviada, setPreWeddingEnviada] = useState<string | null>(null)
  const [fotosFinaisEnviada, setFotosFinaisEnviada] = useState<string | null>(null)
  const [galeriasEnviada, setGaleriasEnviada] = useState<string | null>(null)
  const [fotosConvidadosEmailEnviada, setFotosConvidadosEmailEnviada] = useState<string | null>(null)
  const [fotosConvidadosCttEnviada, setFotosConvidadosCttEnviada] = useState<string | null>(null)
  const [fotosConvidadosEmailLista, setFotosConvidadosEmailLista] = useState<string[]>([])
  const [fotosConvidadosCttLista, setFotosConvidadosCttLista] = useState<string[]>([])
  const [fotosConvidadosEmailWorkflow, setFotosConvidadosEmailWorkflow] = useState<string>('')
  const [fotosConvidadosCttWorkflow, setFotosConvidadosCttWorkflow] = useState<string>('')
  const [actionUrls, setActionUrls] = useState<Record<string, string>>({
    selecao: '', prewedding: '', fotos_finais: '', galerias: '', maquete: '',
  })
  const [videoPreWeddingEnviada, setVideoPreWeddingEnviada] = useState<string | null>(null)
  const [weddingFilmEnviada, setWeddingFilmEnviada] = useState<string | null>(null)
  const [sameDayEditEnviada, setSameDayEditEnviada] = useState<string | null>(null)
  const [teaserEnviada, setTeaserEnviada] = useState<string | null>(null)
  const [portalEnviada, setPortalEnviada] = useState<string | null>(null)
  const [videoActionUrls, setVideoActionUrls] = useState<Record<string, string>>({ video_prewedding: '', wedding_film: '', same_day_edit: '', teaser: '' })
  const [notifFotoEnviada, setNotifFotoEnviada] = useState<string | null>(null)
  const [notifVideoEnviada, setNotifVideoEnviada] = useState<string | null>(null)
  // Per-pessoa: { "PATRICIO FERREIRA": "2026-06-04", ... }
  const [notifFotoEnviadaBy, setNotifFotoEnviadaBy] = useState<Record<string, string>>({})
  const [notifVideoEnviadaBy, setNotifVideoEnviadaBy] = useState<Record<string, string>>({})
  const [sendingNotifPerson, setSendingNotifPerson] = useState<Record<string, boolean>>({})
  const [relatoriosVideo, setRelatoriosVideo] = useState<any[]>([])
  const [copiedVideoIdx, setCopiedVideoIdx] = useState<number | null>(null)
  const [sendingNotifFoto, setSendingNotifFoto] = useState(false)
  const [sendingNotifVideo, setSendingNotifVideo] = useState(false)
  const [notifFotoErro, setNotifFotoErro] = useState<string | null>(null)
  const [notifVideoErro, setNotifVideoErro] = useState<string | null>(null)
  const [equipaFoto, setEquipaFoto] = useState<string[]>([])
  const [equipaVideo, setEquipaVideo] = useState<string[]>([])
  const [equipaEditorAlbum, setEquipaEditorAlbum] = useState<string[]>([])
  const [equipaEditorVideo, setEquipaEditorVideo] = useState<string[]>([])
  const [equipaEditorFotos, setEquipaEditorFotos] = useState<string[]>([])
  const [unavailableNames, setUnavailableNames] = useState<string[]>([])
  const [optionsFoto, setOptionsFoto] = useState<string[]>(['ALEXANDRE CAPÃO','PATRICIO FERREIRA','SONIA CARVALHO','RUI GARRIDO','BRUNO DE CARVALHO','PEDRO MARTINS'])
  const [optionsVideo, setOptionsVideo] = useState<string[]>(['RUI GONÇALVES','LUIS SOARES'])
  const [optionsAllTeam, setOptionsAllTeam] = useState<string[]>([])

  function loadPagamentos(ref: string, showRefresh = false) {
    if (showRefresh) setPagamentosRefreshing(true)
    fetch(`/api/pagamentos-by-ref?ref=${encodeURIComponent(ref)}`)
      .then(r => r.json())
      .then(p => {
        if (p.payments) setPagamentos(p.payments)
        if (showRefresh) setPagamentosRefreshing(false)
      })
      .catch(() => { if (showRefresh) setPagamentosRefreshing(false) })
  }

  async function handleRegistarPagamento(e: Evento, fase: string, valorFase: number) {
    if (!e.referencia) return
    setRegistarSaving(true)
    const valor = Number(registarValor) || valorFase
    const data  = registarData || new Date().toISOString().slice(0, 10)
    try {
      const res = await fetch('/api/pagamentos-noivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_noivos:      e.cliente || e.nome_noiva || e.nome_noivo || '',
          referencia:       e.referencia,
          data_casamento:   e.data_evento ?? null,
          data_pagamento:   data,
          fase_pagamento:   [fase],
          metodo_pagamento: [registarMetodo],
          valor_liquidado:  valor,
        }),
      })
      const d = await res.json()
      setRegistarFase(null)
      setRegistarValor('')
      setRegistarData(new Date().toISOString().slice(0, 10))
      setRegistarMetodo('Transferência')

      // Adicionar ao estado local imediatamente (Notion demora a indexar)
      if (d.row) {
        setPagamentos(prev => [...prev, {
          id:               d.row.id,
          fase_pagamento:   [fase],
          metodo_pagamento: [registarMetodo],
          valor_liquidado:  valor,
          data_pagamento:   data,
        }])
      }
      // Re-fetch com delay para deixar o Notion indexar
      setTimeout(() => loadPagamentos(e.referencia!, false), 3000)
    } finally {
      setRegistarSaving(false)
    }
  }

  function openEditPag(pag: any) {
    setEditingPagId(pag.id)
    setEditingPagValor(String(pag.valor_liquidado ?? ''))
    setEditingPagData(pag.data_pagamento ?? new Date().toISOString().slice(0,10))
    setEditingPagMetodo(pag.metodo_pagamento?.[0] ?? 'Transferência')
    setEditingPagFase(pag.fase_pagamento ?? [])
  }

  async function handleAnularFase(label: string, pags: any[], refEvento: string) {
    if (pags.length > 0) {
      // Tem registos → zera os valores
      await Promise.all(pags.map(pag => {
        const apiId = pag.id.startsWith('notion_') ? pag.id.replace('notion_', '') : pag.id
        return fetch(`/api/pagamentos-noivos/${apiId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ valor_liquidado: 0 }),
        })
      }))
      // Atualizar local imediatamente
      setPagamentos(prev => prev.map(p =>
        pags.some(pg => pg.id === p.id) ? { ...p, valor_liquidado: 0 } : p
      ))
      setTimeout(() => loadPagamentos(refEvento, false), 3000)
    } else {
      // Sem registos próprios → guardar override nas settings para forçar pendente
      const novaLista = fasesPendentesOverride.includes(label)
        ? fasesPendentesOverride.filter(f => f !== label)   // já estava → remover (toggle)
        : [...fasesPendentesOverride, label]
      setFasesPendentesOverride(novaLista)
      const newSettings = { ...(portalSettings ?? {}), fases_pendentes_override: novaLista }
      await saveSettings(newSettings)
    }
  }

  async function handleEditPagSave(pag: any, refEvento: string) {
    setEditingPagSaving(true)
    const novoValor  = Number(editingPagValor) || 0
    const novaData   = editingPagData || null
    const novoMetodo = editingPagMetodo ? [editingPagMetodo] : []
    const novaFase   = editingPagFase
    try {
      const apiId = pag.id.startsWith('notion_') ? pag.id.replace('notion_', '') : pag.id
      await fetch(`/api/pagamentos-noivos/${apiId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor_liquidado:  novoValor,
          data_pagamento:   novaData,
          metodo_pagamento: novoMetodo,
          fase_pagamento:   novaFase,
        }),
      })
      setEditingPagId(null)
      // Atualizar estado local imediatamente (não esperar Notion indexar)
      setPagamentos(prev => prev.map(p =>
        p.id === pag.id
          ? { ...p, valor_liquidado: novoValor, data_pagamento: novaData, metodo_pagamento: novoMetodo, fase_pagamento: novaFase }
          : p
      ))
      setTimeout(() => loadPagamentos(refEvento, false), 3000)
    } finally {
      setEditingPagSaving(false)
    }
  }

  // Poll payments every 30 seconds automatically
  useEffect(() => {
    if (!referenciaLoaded) return
    const interval = setInterval(() => {
      loadPagamentos(referenciaLoaded)
    }, 30000)
    return () => clearInterval(interval)
  }, [referenciaLoaded])

  useEffect(() => {
    // Carregar todas as referências em uso
    fetch('/api/eventos-notion')
      .then(r => r.json())
      .then(d => {
        if (d.events) {
          const refs = new Set<string>(d.events.map((e: any) => e.referencia).filter(Boolean))
          setUsedRefs(refs)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    // Carregar freelancers da equipa para os dropdowns (atualiza sempre que há novos membros)
    fetch('/api/freelancers')
      .then(r => r.json())
      .then(d => {
        if (!d.freelancers) return
        const foto = (d.freelancers as any[])
          .filter(f => f.status === 'FOTOGRAFO')
          .map(f => (f.nome as string).toUpperCase())
        const video = (d.freelancers as any[])
          .filter(f => f.status === 'VIDEOGRAFO')
          .map(f => (f.nome as string).toUpperCase())
        const all = (d.freelancers as any[])
          .map(f => (f.nome as string).toUpperCase())
        if (foto.length > 0) setOptionsFoto(foto)
        if (video.length > 0) setOptionsVideo(video)
        if (all.length > 0) setOptionsAllTeam(all)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    // Supabase como fonte primária do evento — garante que evento.referencia
    // está sempre coerente com o que o portal lê (sem depender do Notion).
    // Fallback para /api/eventos-notion se o evento não estiver em Supabase.
    fetch(`/api/eventos-supabase/${id}`)
      .then(r => r.ok ? r.json() : fetch(`/api/eventos-notion/${id}`).then(r2 => r2.json()))
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        const ev = d.event
        setEvento(ev)
        if (ev.fotografo?.length)     setEquipaFoto(ev.fotografo)
        if (ev.videografo?.length)    setEquipaVideo(ev.videografo)
        if (ev.editor_album?.length)  setEquipaEditorAlbum(ev.editor_album)
        if (ev.editor_video?.length)  setEquipaEditorVideo(ev.editor_video)
        if (ev.editor_fotos) setEquipaEditorFotos([ev.editor_fotos])
        setLoading(false)

        if (ev.referencia) {
          setNavRef(ev.referencia)
          setReferenciaLoaded(ev.referencia)
          // Carregar pagamentos
          loadPagamentos(ev.referencia)

          // Carregar relatórios vídeo
          if (ev.referencia) {
            fetch(`/api/relatorios-video?referencia=${encodeURIComponent(ev.referencia)}`)
              .then(r => r.json())
              .then(d => { if (d.relatorios) setRelatoriosVideo(d.relatorios) })
              .catch(() => {})
          }

          // Verificar disponibilidade da equipa para a data do evento
          if (ev.data_evento) {
            fetch(`/api/equipa-disponibilidade-check?referencia=${encodeURIComponent(ev.referencia)}&data=${ev.data_evento}`)
              .then(r => r.json())
              .then(d => { if (d.unavailable) setUnavailableNames(d.unavailable) })
              .catch(() => {})
          }

          // Carregar álbum associado → data prevista + sincronizar estado
          fetch(`/api/albuns-by-ref?ref=${encodeURIComponent(ev.referencia)}`)
            .then(r => r.json())
            .then(a => {
              if (a.id) setAlbumNotionId(a.id)
              if (a.data_prevista_entrega) setAlbumDataPrevista(a.data_prevista_entrega)

              // Mapear status do álbum → estado do evento
              const toEventoEstado: Record<string, string> = {
                'NOVO ÁLBUM':    'Aguardar',
                'EM EDIÇÃO':     'Em Edição',
                'PARA APROVAÇÃO':'Em Aprovação',
                'ALTERAÇÕES':    'Em Edição',
                'APROVADO':      'Aprovado',
                'ENTREGUE':      'Entregue',
              }
              const albumEstadoMapped = a.status ? (toEventoEstado[a.status] ?? null) : null
              // Só avança de estado — nunca reverte um valor definido manualmente
              const ESTADO_ORDER = ['Aguardar', 'Em Edição', 'Em Aprovação', 'Aprovado', 'Entregue']
              const mappedPri  = ESTADO_ORDER.indexOf(albumEstadoMapped ?? '')
              const currentPri = ESTADO_ORDER.indexOf(ev.album_estado ?? '')
              if (albumEstadoMapped && mappedPri > currentPri) {
                // Actualiza UI imediatamente
                setEvento(prev => prev ? { ...prev, album_estado: albumEstadoMapped } : prev)
                // Sincroniza no Notion + Supabase
                fetch(`/api/eventos-notion/${ev.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ album_estado: albumEstadoMapped }),
                })
              }
            })

          // Carregar fotos seleção → obter data_entrada para prazo e auto-estado
          fetch(`/api/fotos-selecao-by-ref?ref=${encodeURIComponent(ev.referencia)}`)
            .then(r => r.json())
            .then(f => {
              const dataEntrada = f.row?.data_entrada ?? null
              setFotosDataEntrada(dataEntrada)
              // Auto: se tem data de entrada e o estado AINDA NÃO foi definido (null/undefined),
              // marcar Enviado pela primeira vez. NÃO sobrescrever 'Aguardar' definido pelo
              // utilizador — caso contrário, escolher 'Aguardar' manualmente seria revertido
              // a cada refresh.
              if (dataEntrada && !ev.fotos_edicao_estado) {
                setEvento(prev => prev ? { ...prev, fotos_edicao_estado: 'Enviado' } : prev)
                fetch(`/api/eventos-notion/${ev.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ fotos_edicao_estado: 'Enviado' }),
                })
              }
            })

          // Carregar estado do portal (Seleção Fotos Noivos + Prazo Fotos Noivos)
          fetch(`/api/portais?ref=${encodeURIComponent(ev.referencia)}`)
            .then(r => r.json())
            .then(p => {
              const s = p?.portal?.settings ?? p?.settings ?? {}
              if (s.selecao_fotos_noivos_estado) setPortalSelecaoEstado(s.selecao_fotos_noivos_estado)
              if (s.prazo_fotos_noivos_estado)   setPrazoFotosNoivosEstado(s.prazo_fotos_noivos_estado)
              if (s.maquete_enviada)          setMaqueteEnviada(s.maquete_enviada)
              if (s.selecao_enviada)          setSelecaoEnviada(s.selecao_enviada)
              if (s.armazenamento_backup)     setArmazenamentoBackup(s.armazenamento_backup)
              // Fallback persistente p/ nome_disco e backup_disco — se o Notion
              // não tiver valor (ou estiver dessincronizado), usar o do settings
              if (Array.isArray(s.nome_disco) && s.nome_disco.length > 0) {
                setEvento(prev => prev && (!prev.nome_disco || prev.nome_disco.length === 0)
                  ? { ...prev, nome_disco: s.nome_disco } : prev)
              }
              if (Array.isArray(s.backup_disco) && s.backup_disco.length > 0) {
                setEvento(prev => prev && (!prev.backup_disco || prev.backup_disco.length === 0)
                  ? { ...prev, backup_disco: s.backup_disco } : prev)
              }
              if (s.prewedding_enviada)       setPreWeddingEnviada(s.prewedding_enviada)
              if (s.fotos_finais_enviada)     setFotosFinaisEnviada(s.fotos_finais_enviada)
              if (s.galerias_enviada)         setGaleriasEnviada(s.galerias_enviada)
              if (s.fotos_convidados_email_enviada) setFotosConvidadosEmailEnviada(s.fotos_convidados_email_enviada)
              if (s.fotos_convidados_ctt_enviada)   setFotosConvidadosCttEnviada(s.fotos_convidados_ctt_enviada)
              if (Array.isArray(s.fotos_convidados_email_lista)) setFotosConvidadosEmailLista(s.fotos_convidados_email_lista)
              if (Array.isArray(s.fotos_convidados_ctt_lista))   setFotosConvidadosCttLista(s.fotos_convidados_ctt_lista)
              if (typeof s.fotos_convidados_email_workflow === 'string') setFotosConvidadosEmailWorkflow(s.fotos_convidados_email_workflow)
              if (typeof s.fotos_convidados_ctt_workflow === 'string')   setFotosConvidadosCttWorkflow(s.fotos_convidados_ctt_workflow)
              if (s.video_prewedding_enviada) setVideoPreWeddingEnviada(s.video_prewedding_enviada)
              if (s.wedding_film_enviada)     setWeddingFilmEnviada(s.wedding_film_enviada)
              if (s.same_day_edit_enviada)    setSameDayEditEnviada(s.same_day_edit_enviada)
              if (s.teaser_enviada)           setTeaserEnviada(s.teaser_enviada)
              if (s.portal_enviada)           setPortalEnviada(s.portal_enviada)
              if (s.notif_foto_enviada)       setNotifFotoEnviada(s.notif_foto_enviada)
              if (s.notif_video_enviada)      setNotifVideoEnviada(s.notif_video_enviada)
              // Notificação por pessoa (novo modelo)
              if (s.notif_foto_enviada_by && typeof s.notif_foto_enviada_by === 'object') {
                setNotifFotoEnviadaBy(s.notif_foto_enviada_by as Record<string, string>)
              } else if (s.notif_foto_enviada && Array.isArray(ev.fotografo)) {
                // Migração: trata o campo legacy como todos os fotógrafos actuais notificados nessa data
                const map: Record<string, string> = {}
                for (const n of ev.fotografo) map[String(n)] = s.notif_foto_enviada
                setNotifFotoEnviadaBy(map)
              }
              if (s.notif_video_enviada_by && typeof s.notif_video_enviada_by === 'object') {
                setNotifVideoEnviadaBy(s.notif_video_enviada_by as Record<string, string>)
              } else if (s.notif_video_enviada && Array.isArray(ev.videografo)) {
                const map: Record<string, string> = {}
                for (const n of ev.videografo) map[String(n)] = s.notif_video_enviada
                setNotifVideoEnviadaBy(map)
              }
              if (s.valor_fotografo  != null) setValorFotografo(s.valor_fotografo)
              if (s.valor_videografo != null) setValorVideografo(s.valor_videografo)
              if (s.valor_editor_video != null) setValorEditorVideo(s.valor_editor_video)
              setVideoActionUrls({ video_prewedding: s.video_prewedding_url ?? '', wedding_film: s.wedding_film_url ?? '', same_day_edit: s.same_day_edit_url ?? '', teaser: s.teaser_url ?? '' })
              // Auto-populate URLs from portal calloutLinks (FOTOGRAFIAS page cards)
              const calloutLinks = s.calloutLinks ?? {}
              let fl: Record<string, string> = {}
              for (const links of Object.values(calloutLinks)) {
                const l = links as Record<string, string>
                if (l['Galeria Fotos p/ Seleção'] || l['Fotos Pré-Wedding'] || l['Fotos Editadas']) {
                  fl = l; break
                }
              }
              setActionUrls({
                selecao:      s.selecao_url      ?? fl['Galeria Fotos p/ Seleção'] ?? '',
                prewedding:   s.prewedding_url   ?? fl['Fotos Pré-Wedding']        ?? '',
                fotos_finais: s.fotos_finais_url ?? fl['Fotos Editadas']            ?? '',
                galerias:     s.galerias_url     ?? fl['Galeria On-line']           ?? '',
                maquete:      s.maquete_url      ?? fl['Maquete Album']             ?? '',
              })
            })
            .catch(() => {})

        }
      })
      .catch(() => { setError('Erro de ligação'); setLoading(false) })
  }, [id])

  function handleSaved(field: string, val: any) {
    setEvento(prev => prev ? { ...prev, [field]: val } : prev)

    // Auto-sync portal settings when key fields change
    const portalFields: Record<string, string> = {
      nome_noiva: 'noiva',
      nome_noivo: 'noivo',
      data_evento: 'data',
      local: 'local',
      valor_foto: 'valorFoto',
      valor_video: 'valorVideo',
      valor_extras: 'valorExtras',
    }
    if (field in portalFields && evento?.referencia) {
      fetch('/api/portais', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referencia: evento.referencia, updates: { [portalFields[field]]: val } }),
      }).catch(() => {})
    }

    // Recalcular e guardar valor_liquido quando valor_video ou valor_extras mudam
    if ((field === 'valor_video' || field === 'valor_extras') && evento) {
      const vVideo  = field === 'valor_video'  ? (val ?? 0) : (evento.valor_video  ?? 0)
      const vExtras = field === 'valor_extras' ? (val ?? 0) : (evento.valor_extras ?? 0)
      const novoLiquido = vVideo + vExtras - valorFotografo - valorVideografo - valorEditorVideo
      fetch(`/api/eventos-notion/${evento.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_liquido: novoLiquido }),
      }).catch(() => {})
      setEvento(prev => prev ? { ...prev, valor_liquido: novoLiquido } : prev)
    }

    // Sincronizar album_estado → álbuns de casamento
    if (field === 'album_estado' && albumNotionId) {
      const toAlbumStatus: Record<string, string> = {
        'Aguardar':       'NOVO ÁLBUM',
        'Em Edição':      'EM EDIÇÃO',
        'Em Aprovação':   'PARA APROVAÇÃO',
        'Aprovado':       'APROVADO',
        'Entregue':       'ENTREGUE',
      }
      const albumStatus = toAlbumStatus[val] ?? 'NOVO ÁLBUM'
      fetch(`/api/albuns-casamento/${albumNotionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: albumStatus }),
      })
    }
  }

  // Recalcula e grava valor_liquido no Supabase sempre que uma despesa muda
  function syncLiquido(overrides: { fotografo?: number; videografo?: number; editorVideo?: number } = {}) {
    if (!evento) return
    const vVideo  = evento.valor_video  ?? 0
    const vExtras = evento.valor_extras ?? 0
    const vFotog  = overrides.fotografo   ?? valorFotografo
    const vVideog = overrides.videografo  ?? valorVideografo
    const vEditor = overrides.editorVideo ?? valorEditorVideo
    const novoLiquido = vVideo + vExtras - vFotog - vVideog - vEditor
    fetch(`/api/eventos-notion/${evento.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ valor_liquido: novoLiquido }),
    }).catch(() => {})
    setEvento(prev => prev ? { ...prev, valor_liquido: novoLiquido } : prev)
  }

  if (loading) return (
    <main className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <div className="text-center py-32 text-white/20 tracking-widest text-xs uppercase">A carregar...</div>
    </main>
  )
  if (error || !evento) return (
    <main className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <Link href="/eventos-2026" className="text-xs tracking-widest text-white/30 hover:text-gold transition-colors">‹ Voltar</Link>
      <div className="text-center py-20 text-red-400/60 text-sm mt-10">{error || 'Evento não encontrado'}</div>
    </main>
  )

  const e = evento

  // Ano do evento → sufixo da referência (ex: 2027 → "27")
  const anoEvento = e.data_evento ? parseInt(e.data_evento.slice(0, 4)) : 2026
  const anoSufixo = String(anoEvento).slice(2)

  // Prazos automáticos
  const prazoSelFotos = e.data_evento ? addCalendarDays(e.data_evento, 30) : null
  const prazoVideo    = e.data_evento ? addWorkingDays(e.data_evento, 180) : null

  return (
    <main id="evento-page" className="min-h-screen px-4 py-10 max-w-3xl mx-auto print:max-w-full print:py-6 print:px-8">
      <style>{`
        @keyframes fichaReveal { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
        .ficha-reveal { animation: fichaReveal .55s cubic-bezier(.2,.7,.2,1) both; }
        @media print { .ficha-reveal { animation: none !important; } }
        /* Cabeçalho de bloco — divisória premium */
        .ficha-bloco { display:flex; align-items:center; gap:14px; margin: 30px 0 4px; }
        .ficha-bloco .num { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22px; color: #c9a45c; line-height:1; opacity:.85; }
        .ficha-bloco .txt { font-size: 10px; letter-spacing: .45em; text-transform: uppercase; color: rgba(201,164,92,.75); font-weight: 600; white-space: nowrap; }
        .ficha-bloco .line { flex:1; height:1px; background: linear-gradient(to right, rgba(201,164,92,.35), rgba(201,164,92,0)); }
      `}</style>
      <Link href={`/eventos-2026?ano=${anoEvento}`} className="print:hidden text-xs tracking-widest text-white/30 hover:text-gold transition-colors">
        ‹ VOLTAR AOS CASAMENTOS
      </Link>

      {/* ── Foto dos Noivos (topo-esquerdo) ── */}
      {e.referencia && (
        <div className="print:hidden mt-5">
          <FotoNoivosUpload referencia={e.referencia} />
        </div>
      )}

      {/* ── Header editável ── */}
      <div className="mt-8 mb-2">
        {/* Dropdown atribuir referência */}
        <div className="print:hidden mb-4 flex flex-col gap-1.5">
          <label className="text-[9px] tracking-[0.35em] uppercase text-gold/50">Atribuir Referência</label>
          <div className="flex items-center gap-2">
            <select
              value={navRef}
              disabled={!!navRef}
              onChange={async ev => {
                const ref = ev.target.value
                if (!ref) return
                setNavRef(ref)
                await fetch(`/api/eventos-notion/${e.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ referencia: ref }),
                })
                setEvento(prev => prev ? { ...prev, referencia: ref } : prev)
                setReferenciaLoaded(ref)
              }}
              className="border rounded-lg px-3 py-1.5 text-xs focus:outline-none transition-colors cursor-pointer"
              style={{
                minWidth: 200,
                background: '#1a1610',
                color: navRef ? '#cc3333' : 'rgba(255,255,255,0.5)',
                borderColor: navRef ? 'rgba(204,51,51,0.5)' : 'rgba(255,255,255,0.1)',
                opacity: 1,
                WebkitTextFillColor: navRef ? '#cc3333' : 'rgba(255,255,255,0.5)',
              }}
            >
              <option value="" style={{ background: '#1a1610', color: 'rgba(255,255,255,0.5)' }}>Selecionar referência...</option>
              {Array.from({ length: 150 }, (_, i) => {
                const n = String(i + 1).padStart(3, '0')
                const ref = `CAS_${n}_${anoSufixo}_RL`
                const isMine = ref === e.referencia
                const isTaken = usedRefs.has(ref) && !isMine
                return (
                  <option
                    key={ref}
                    value={ref}
                    disabled={isTaken}
                    style={{
                      background: '#1a1610',
                      color: isTaken ? '#cc3333' : isMine ? '#c9a96e' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {ref}{isTaken ? ' — Referência já utilizada' : ''}
                  </option>
                )
              })}
            </select>
            {navRef && (
              <button
                onClick={() => setNavRef('')}
                className="w-6 h-6 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/30 transition-all text-xs"
                title="Desbloquear"
              >✕</button>
            )}
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <EditField label="" value={e.referencia} field="referencia" eventId={e.id} onSaved={handleSaved} mono />
            <EditField label="" value={e.cliente} field="cliente" eventId={e.id} large onSaved={handleSaved} />
            <div className="flex gap-2 items-center mt-1 text-white/30 text-sm">
              <EditField label="" value={e.data_evento} field="data_evento" eventId={e.id} type="date" onSaved={handleSaved} />
              <span>·</span>
              <EditField label="" value={e.local} field="local" eventId={e.id} onSaved={handleSaved} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {e.status && (
              <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/60">{e.status}</span>
            )}
            <button
              onClick={() => window.print()}
              className="print:hidden flex items-center gap-1.5 text-xs text-white/30 hover:text-gold transition-colors tracking-widest"
              title="Imprimir / Guardar como PDF"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              PDF
            </button>
            {e.notion_url && (
              <a href={e.notion_url} target="_blank" rel="noopener noreferrer"
                className="print:hidden text-xs text-white/20 hover:text-gold transition-colors tracking-widest">
                Ver no Notion ↗
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 items-center">
          <TipoEventoEditor
            value={e.tipo_evento ?? []}
            eventId={e.id}
            referencia={e.referencia ?? null}
            onSaved={(arr) => handleSaved('tipo_evento', arr)}
          />
          {(e.tipo_servico ?? []).map(t => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400/80">{t}</span>
          ))}
        </div>
        <p className="print:hidden text-[10px] text-white/15 mt-3 tracking-wider">Clica em qualquer campo para editar · guarda automaticamente no Notion</p>
      </div>

      <BlocoHeader num="I">Evento & Serviços</BlocoHeader>

      <DrawerBloco label="Serviços do Dia" sub="O que vai ser fotografado/filmado neste evento.">

      {/* ── Serviços do Dia (secção própria) ───────────────────────────── */}
      <div className="ficha-reveal print:hidden bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[11px] tracking-[0.4em] text-gold uppercase font-light">Serviços do Dia</h2>
            <p className="text-[10px] text-white/30 mt-1 italic">O que vai ser fotografado/filmado neste evento — aparece na ficha do freelancer.</p>
          </div>
        </div>
        <ServicosDiaEditor
          value={e.servicos_dia ?? []}
          eventId={e.id}
          onSaved={(arr) => handleSaved('servicos_dia', arr)}
        />
      </div>

      {/* ── Briefing enviado (a partir do portal dos noivos) ───────────── */}
      <BriefingNaFicha referencia={e.referencia ?? undefined} eventoId={e.id} />

      </DrawerBloco>

      <BlocoHeader num="II">Contrato & Portal</BlocoHeader>

      <DrawerBloco label="Contrato & Portal" sub="Aprovação do contrato CPS, criação/acesso ao portal e contratos.">

      {/* ── Aprovação do Contrato CPS + Criar Portal ── */}
      <div className="ficha-reveal print:hidden">
        <ContratoCPSAprovacaoSection referencia={e.referencia ?? undefined} />
      </div>

      {/* ── Acesso ao Portal do Cliente ── */}
      {e.referencia && (
        <div className="print:hidden mt-5">
          <PortalSection evento={e} />
        </div>
      )}

      {/* ── Contratos (movido do fundo da página para junto do Portal) ── */}
      <div className="print:hidden mt-5 bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4">
        <h2 className="text-[10px] tracking-[0.35em] text-gold uppercase">Contratos</h2>
        <ContratoStatusSection eventoId={e.id} referencia={e.referencia ?? undefined} />
        <ContratoUpload eventId={e.id} contratoUrl={e.contratos} onSaved={handleSaved} />
      </div>

      </DrawerBloco>

      <BlocoHeader num="III">Agendamento & Notas</BlocoHeader>

      {/* ── Marcação + Notas em painel lateral (drawer) ── */}
      <AgendamentoNotasDrawer referencia={e.referencia ?? undefined} />

      <BlocoHeader num="IV">Comercial</BlocoHeader>

      <div className="flex flex-col gap-5">

        <DrawerBloco label="Comercial" sub="Proposta escolhida e valores financeiros.">

        {/* ── Proposta ── */}
        <Section title="Proposta">
          <EditSelect
            label="Proposta Escolhida"
            value={e.proposta}
            field="proposta"
            eventId={e.id}
            options={['PROPOSTA 1', 'PROPOSTA 2', 'PROPOSTA 3']}
            onSaved={handleSaved}
          />
          {/* Serviços incluídos na proposta */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/[0.05]">
            <ServiceChecklist
              title="Serviço de Vídeo"
              items={ITEMS_VIDEO}
              selected={e.servico_video ?? []}
              field="servico_video"
              eventId={e.id}
              onSaved={handleSaved}
            />
            <ServiceChecklist
              title="Serviço de Fotografia"
              items={ITEMS_FOTO}
              selected={e.servico_foto ?? []}
              field="servico_foto"
              eventId={e.id}
              onSaved={handleSaved}
            />
          </div>
        </Section>

        {/* ── Financeiro ── */}
        <Section title="Financeiro">
          {/* Valores do serviço */}
          <div className="grid grid-cols-4 gap-4">
            <EditField label="Valor Fotografia" value={e.valor_foto} field="valor_foto" eventId={e.id} type="number" suffix="€" onSaved={handleSaved} />
            <EditField label="Valor Real Fotografia" value={e.valor_real_foto} field="valor_real_foto" eventId={e.id} type="number" suffix="€" onSaved={handleSaved} />
            <EditField label="Valor Vídeo" value={e.valor_video} field="valor_video" eventId={e.id} type="number" suffix="€" onSaved={handleSaved} />
            <EditField label="Valor Extras" value={e.valor_extras} field="valor_extras" eventId={e.id} type="number" suffix="€" onSaved={handleSaved} />
          </div>

          {/* Despesas */}
          <div className="pt-2 border-t border-white/[0.05]">
            <h3 className="text-[10px] tracking-[0.35em] text-gold uppercase mb-3">Despesas</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">Valor Fotografia</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" value={valorFotografo}
                  onChange={ev => setValorFotografo(Number(ev.target.value))}
                  onBlur={ev => { const val = Number(ev.target.value); if (e.referencia) fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: e.referencia, updates: { settings: { valor_fotografo: val } } }) }); syncLiquido({ fotografo: val }) }}
                  className="bg-white/5 border border-white/10 hover:border-gold/30 focus:border-gold/40 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none w-full"
                />
                <span className="text-white/40 text-sm shrink-0">€</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">Valor Videógrafo</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" value={valorVideografo}
                  onChange={ev => setValorVideografo(Number(ev.target.value))}
                  onBlur={ev => { const val = Number(ev.target.value); if (e.referencia) fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: e.referencia, updates: { settings: { valor_videografo: val } } }) }); syncLiquido({ videografo: val }) }}
                  className="bg-white/5 border border-white/10 hover:border-gold/30 focus:border-gold/40 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none w-full"
                />
                <span className="text-white/40 text-sm shrink-0">€</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">Valor Editor Vídeo</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" value={valorEditorVideo}
                  onChange={ev => setValorEditorVideo(Number(ev.target.value))}
                  onBlur={ev => { const val = Number(ev.target.value); if (e.referencia) fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: e.referencia, updates: { settings: { valor_editor_video: val } } }) }); syncLiquido({ editorVideo: val }) }}
                  className="bg-white/5 border border-white/10 hover:border-gold/30 focus:border-gold/40 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none w-full"
                />
                <span className="text-white/40 text-sm shrink-0">€</span>
              </div>
            </div>
          </div>
          </div>

          {/* Total do Serviço */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div>
              <span className="text-xs tracking-widest text-blue-400/60 uppercase block">Total do Serviço</span>
              <span className="text-[10px] text-white/20">
                {(e.valor_extras ?? 0) > 0
                  ? `Foto + Vídeo + Extras (${(e.valor_extras ?? 0).toLocaleString('pt-PT')}€)`
                  : '(Fotografia + Vídeo)'}
              </span>
            </div>
            <span className="text-blue-400 font-bold text-lg">
              {((e.valor_foto ?? 0) + (e.valor_video ?? 0) + (e.valor_extras ?? 0)).toLocaleString('pt-PT')} €
            </span>
          </div>

          {/* Valor Líquido calculado */}
          <div className="flex items-center justify-between px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div>
              <span className="text-xs tracking-widest text-green-400/60 uppercase block">Valor Líquido a Receber</span>
              <span className="text-[10px] text-white/20">(Vídeo + Extras − Fotografia − Videógrafo − Editor Vídeo)</span>
            </div>
            <span className="text-green-400 font-bold text-lg">
              {((e.valor_video ?? 0) + (e.valor_extras ?? 0) - valorFotografo - valorVideografo - valorEditorVideo).toLocaleString('pt-PT')} €
            </span>
          </div>

          {/* Fases de pagamento — dados reais do Notion */}
          <div className="pt-2 border-t border-white/[0.05]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">Fases de Pagamento</span>
                <button
                  onClick={() => e.referencia && loadPagamentos(e.referencia, true)}
                  title="Atualizar pagamentos"
                  className="print:hidden text-white/20 hover:text-gold transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={pagamentosRefreshing ? 'animate-spin' : ''}>
                    <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                </button>
              </div>
              <a href={`/financas?ref=${encodeURIComponent(e.referencia ?? '')}`} className="print:hidden text-[10px] text-white/20 hover:text-gold transition-colors tracking-wider">
                Ver todos os pagamentos ›
              </a>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {(() => {
                const total = (e.valor_foto ?? 0) + (e.valor_video ?? 0) + (e.valor_extras ?? 0)
                const adj = 400
                const remainder = Math.max(0, total - adj)
                const faseValores: Record<string, number> = {
                  'ADJUDICAÇÃO': adj,
                  'REFORÇO':     Math.round(remainder * 0.8 * 100) / 100,
                  'FINAL':       Math.round(remainder * 0.2 * 100) / 100,
                }
                const MESES_S = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
                const fmtD = (d: string | null) => {
                  if (!d) return null
                  const dt = new Date(d.split('T')[0] + 'T00:00:00')
                  return `${String(dt.getDate()).padStart(2,'0')} ${MESES_S[dt.getMonth()]} ${dt.getFullYear()}`
                }

                const totalPagoGeral = pagamentos.reduce((s, p) => s + (p.valor_liquidado ?? 0), 0)

                // Cascata: o total pago preenche ADJ → REFORÇO → FINAL por ordem
                // Assim um único pagamento multi-fase não conta o valor completo para cada fase
                const cumAdj     = faseValores['ADJUDICAÇÃO']
                const cumReforco = cumAdj + faseValores['REFORÇO']
                const cumFinal   = cumReforco + faseValores['FINAL']
                const faseCum: Record<string, number> = {
                  'ADJUDICAÇÃO': cumAdj,
                  'REFORÇO':     cumReforco,
                  'FINAL':       cumFinal,
                }

                return ['ADJUDICAÇÃO','REFORÇO','FINAL'].map(label => {
                  const valorFase  = faseValores[label]
                  const cumThresh  = faseCum[label]
                  const prevThresh = cumThresh - valorFase

                  // Porção do total pago que pertence a esta fase em cascata
                  const totalPago = Math.max(0, Math.min(totalPagoGeral, cumThresh) - prevThresh)
                  const falta = Math.max(0, valorFase - totalPago)

                  // Liquidado quando o total pago geral cobre a threshold cumulativa desta fase
                  const liquidado = !fasesPendentesOverride.includes(label) && valorFase > 0 && totalPagoGeral >= cumThresh
                  const parcial = totalPago > 0 && !liquidado
                  const pct = valorFase > 0 ? Math.min(100, Math.round((totalPago / valorFase) * 100)) : 0

                  // Registos para mostrar (mantém filtragem por tag para exibição)
                  const pags = pagamentos.filter(p => p.fase_pagamento.includes(label))

                  // Último pagamento para data/método
                  const lastPag = pags[pags.length - 1]
                  const metodos = Array.from(new Set(pags.flatMap((p: any) => p.metodo_pagamento)))

                  const borderCls = liquidado ? 'bg-green-500/8 border-green-500/25'
                    : parcial ? 'bg-orange-500/5 border-orange-500/20'
                    : 'bg-white/[0.02] border-white/[0.06]'

                  const valorCls = liquidado ? 'text-green-400'
                    : parcial ? 'text-orange-400'
                    : 'text-white/50'

                  const statusLabel = liquidado ? 'LIQUIDADO' : parcial ? 'PARCIAL' : 'PENDENTE'
                  const statusCls = liquidado ? 'text-green-400/80 bg-green-500/10'
                    : parcial ? 'text-orange-400/80 bg-orange-500/10'
                    : 'text-white/20 bg-white/5'
                  const dotCls = liquidado ? 'bg-green-400' : parcial ? 'bg-orange-400' : 'bg-white/20'

                  return (
                    <div key={label} className={`flex flex-col gap-2.5 p-4 rounded-xl border transition-all ${borderCls}`}>
                      <span className="text-[9px] tracking-[0.35em] text-white/30 uppercase">{label}</span>

                      {/* Valor esperado da fase */}
                      <span className={`text-lg font-semibold ${valorCls}`}>
                        {valorFase.toLocaleString('pt-PT')} €
                      </span>

                      {/* Barra de progresso */}
                      <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${liquidado ? 'bg-green-400' : parcial ? 'bg-orange-400' : 'bg-white/10'}`}
                          style={{ width: `${pct}%` }} />
                      </div>

                      {/* Badge de estado — clicável quando LIQUIDADO para anular */}
                      {liquidado ? (
                        <button
                          onClick={() => handleAnularFase(label, pags, e.referencia!)}
                          title="Clique para marcar como Por Liquidar"
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit ${statusCls} hover:bg-red-500/15 hover:text-red-400/80 group transition-colors`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${dotCls} group-hover:bg-red-400`} />
                          <span className="text-[9px] tracking-widest group-hover:hidden">{statusLabel}</span>
                          <span className="text-[9px] tracking-widest hidden group-hover:inline">POR LIQUIDAR</span>
                        </button>
                      ) : (
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit ${statusCls}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
                          <span className="text-[9px] tracking-widest">{statusLabel}</span>
                        </div>
                      )}

                      {/* Registos de pagamento — visualização + edição */}
                      <div className="flex flex-col gap-1.5 pt-1 border-t border-white/[0.05]">
                        {pags.map((pag: any) => (
                          <div key={pag.id}>
                            {editingPagId === pag.id ? (
                              /* ── Formulário de edição ── */
                              <div className="flex flex-col gap-1.5 p-2.5 bg-white/[0.03] border border-gold/20 rounded-lg">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[9px] text-gold/50 tracking-widest uppercase">Editar registo</span>
                                  <button onClick={() => setEditingPagId(null)} className="text-white/25 hover:text-white/60 text-xs">✕</button>
                                </div>
                                <div className="flex gap-1.5">
                                  <div className="flex flex-col gap-0.5 flex-1">
                                    <span className="text-[8px] text-white/25 uppercase tracking-wider">Valor (€)</span>
                                    <input type="number" value={editingPagValor} onChange={ev => setEditingPagValor(ev.target.value)} autoFocus
                                      className="w-full bg-white/5 border border-white/10 focus:border-gold/40 rounded px-2 py-1 text-xs text-white/90 focus:outline-none" />
                                  </div>
                                  <div className="flex flex-col gap-0.5 flex-1">
                                    <span className="text-[8px] text-white/25 uppercase tracking-wider">Data</span>
                                    <input type="date" value={editingPagData} onChange={ev => setEditingPagData(ev.target.value)}
                                      className="w-full bg-white/5 border border-white/10 focus:border-gold/40 rounded px-2 py-1 text-xs text-white/60 focus:outline-none" />
                                  </div>
                                </div>
                                <div className="flex gap-1.5">
                                  <div className="flex flex-col gap-0.5 flex-1">
                                    <span className="text-[8px] text-white/25 uppercase tracking-wider">Método</span>
                                    <select value={editingPagMetodo} onChange={ev => setEditingPagMetodo(ev.target.value)}
                                      className="w-full bg-white/5 border border-white/10 focus:border-gold/40 rounded px-2 py-1 text-xs text-white/60 focus:outline-none">
                                      {['Transferência','Multibanco','MBWay','Numerário','Cheque'].map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                  </div>
                                  <div className="flex flex-col gap-0.5 flex-1">
                                    <span className="text-[8px] text-white/25 uppercase tracking-wider">Fase</span>
                                    <select value={editingPagFase[0] ?? label} onChange={ev => setEditingPagFase([ev.target.value])}
                                      className="w-full bg-white/5 border border-white/10 focus:border-gold/40 rounded px-2 py-1 text-xs text-white/60 focus:outline-none">
                                      {['ADJUDICAÇÃO','REFORÇO','FINAL'].map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                  </div>
                                </div>
                                <button onClick={() => handleEditPagSave(pag, e.referencia!)} disabled={editingPagSaving}
                                  className="w-full bg-gold/80 hover:bg-gold text-black text-[10px] font-semibold tracking-wider py-1.5 rounded transition-colors disabled:opacity-50">
                                  {editingPagSaving ? 'A guardar…' : 'Guardar alterações'}
                                </button>
                              </div>
                            ) : (
                              /* ── Linha do registo ── */
                              <button onClick={() => openEditPag(pag)}
                                className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors group text-left">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[9px] text-white/30 leading-tight">
                                    {pag.data_pagamento ? fmtD(pag.data_pagamento) : '—'}
                                  </span>
                                  <span className="text-[9px] text-white/20 leading-tight truncate">
                                    {pag.metodo_pagamento?.join(', ') || '—'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`text-sm font-semibold ${liquidado ? 'text-green-400' : 'text-orange-400'}`}>
                                    {(pag.valor_liquidado ?? 0).toLocaleString('pt-PT')} €
                                  </span>
                                  <svg className="opacity-0 group-hover:opacity-40 transition-opacity" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </div>
                              </button>
                            )}
                          </div>
                        ))}

                        {/* Linha "Falta" quando não liquidado */}
                        {!liquidado && falta > 0 && (
                          <div className="flex items-center justify-between px-2 py-1 border-t border-white/[0.04] mt-0.5">
                            <span className="text-[9px] text-white/25 uppercase tracking-wider">Falta</span>
                            <span className="text-sm font-semibold text-red-400/80">{falta.toLocaleString('pt-PT')} €</span>
                          </div>
                        )}
                      </div>

                      {/* Botão Registar Pagamento (só quando não liquidado) */}
                      {!liquidado && (
                        registarFase === label ? (
                          <div className="mt-2 flex flex-col gap-1.5 pt-2 border-t border-white/[0.06]">
                            <input
                              type="number"
                              value={registarValor}
                              onChange={ev => setRegistarValor(ev.target.value)}
                              placeholder={`${falta > 0 ? falta : valorFase} €`}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/80 focus:outline-none focus:border-gold/40"
                            />
                            <input
                              type="date"
                              value={registarData}
                              onChange={ev => setRegistarData(ev.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/60 focus:outline-none focus:border-gold/40"
                            />
                            <select
                              value={registarMetodo}
                              onChange={ev => setRegistarMetodo(ev.target.value)}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/60 focus:outline-none focus:border-gold/40"
                            >
                              {['Transferência','Multibanco','MBWay','Numerário','Cheque'].map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => handleRegistarPagamento(e, label, falta > 0 ? falta : valorFase)}
                                disabled={registarSaving}
                                className="flex-1 text-[10px] tracking-wider bg-gold/80 hover:bg-gold text-black font-semibold py-1.5 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {registarSaving ? '…' : 'Guardar'}
                              </button>
                              <button
                                onClick={() => setRegistarFase(null)}
                                className="px-2.5 text-[10px] text-white/30 hover:text-white/60 border border-white/10 rounded-lg transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setRegistarFase(label); setRegistarValor(String(falta > 0 ? falta : valorFase)) }}
                            className="mt-1 w-full text-[9px] tracking-[0.2em] text-white/20 hover:text-gold/70 border border-white/[0.06] hover:border-gold/30 rounded-lg py-1.5 transition-all uppercase"
                          >
                            + Registar Pagamento
                          </button>
                        )
                      )}
                    </div>
                  )
                })
              })()}
            </div>

            {/* Resumo total pagamentos */}
            {(() => {
              const total = (e.valor_foto ?? 0) + (e.valor_video ?? 0) + (e.valor_extras ?? 0)
              const totalPagoGeral = pagamentos.reduce((s, p) => s + (p.valor_liquidado ?? 0), 0)
              const faltaTotal = Math.max(0, total - totalPagoGeral)
              if (pagamentos.length === 0 || total === 0) return null
              return (
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border mt-2 ${faltaTotal === 0 ? 'bg-green-500/8 border-green-500/20' : 'bg-orange-500/5 border-orange-500/15'}`}>
                  <span className="text-[10px] tracking-widest text-white/30 uppercase">Total Pago</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${faltaTotal === 0 ? 'text-green-400' : 'text-orange-400'}`}>
                      {totalPagoGeral.toLocaleString('pt-PT')} €
                    </span>
                    <span className="text-white/15 text-xs">de</span>
                    <span className="text-white/40 text-sm font-medium">{total.toLocaleString('pt-PT')} €</span>
                    {faltaTotal > 0 && (
                      <span className="text-[10px] text-orange-400/70 bg-orange-500/10 px-2 py-0.5 rounded-full">
                        falta {faltaTotal.toLocaleString('pt-PT')}€
                      </span>
                    )}
                  </div>
                </div>
              )
            })()}
          </div>

          {/* Contratos foi movido para o topo da ficha (junto do Portal do Cliente) */}
        </Section>

        </DrawerBloco>

        <BlocoHeader num="V">Produção & Entregas</BlocoHeader>

        <DrawerBloco label="Produção & Entregas" sub="Estados de entrega (fotos, vídeo, álbum) e regras automáticas.">

        {/* ── Estado das Entregas ── */}
        <Section title="Estado das Entregas" right={
          <span className="text-[9px] tracking-[0.3em] text-gold uppercase">
            Data de Entrega{e.data_entrega ? `: ${formatDate(e.data_entrega)}` : ''}
          </span>
        }>
          {/* Dropdown de regras (abrir/fechar) */}
          <RegrasEntregasDrop />
          {/* Linhas de estado */}
          <div className="flex flex-col gap-2">
            {prazoSelFotos && (
              <EstadoRow label="Prazo Selecção de Fotos (30 dias)" dateStr={prazoSelFotos}
                estado={e.sel_fotos_estado} options={['Aguardar','Em Seleção','Em Edição','Entregue','S/SERVIÇO']}
                field="sel_fotos_estado" eventId={e.id} onSaved={handleSaved} referencia={e.referencia} />
            )}
            {prazoVideo && (
              <EstadoRow label="Prazo Entrega Vídeo (180 dias úteis)" dateStr={prazoVideo}
                estado={e.video_estado} options={['Aguardar','Em Edição','Entregue','S/SERVIÇO']}
                field="video_estado" eventId={e.id} onSaved={handleSaved} referencia={e.referencia} />
            )}
            <EstadoRow label="Fotos em Edição"
              dateStr={fotosDataEntrada ? addWorkingDays(fotosDataEntrada, 30) : null}
              estado={e.fotos_edicao_estado} options={['Aguardar','Enviado','Em Edição','Entregue','S/SERVIÇO']}
              field="fotos_edicao_estado" eventId={e.id} onSaved={handleSaved} referencia={e.referencia} />
            <EstadoRow label="Álbum"
              dateStr={albumDataPrevista}
              estado={e.album_estado} options={['Aguardar','Em Edição','Em Aprovação','Aprovado','Entregue','S/SERVIÇO']}
              field="album_estado" eventId={e.id} onSaved={handleSaved} referencia={e.referencia}
              href={`/albuns-casamento?ref=${encodeURIComponent(e.referencia)}`} />
            {e.referencia && <>
              <PortalEstadoRow label="Seleção Fotos Noivos"
                dateStr={fotosDataEntrada ? addCalendarDays(fotosDataEntrada, 40) : null}
                estado={portalSelecaoEstado} referencia={e.referencia}
                stateKey="selecao_fotos_noivos_estado"
                onSaved={(_key, val) => setPortalSelecaoEstado(val)} />
            </>}
          </div>

          {/* Link rápido → Seleção dos Noivos */}
          {e.referencia && (
            <Link href={`/fotos-selecao?ref=${encodeURIComponent(e.referencia)}`}
              className="print:hidden flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-gold/20 transition-all group">
              <span className="text-[10px] tracking-widest text-white/30 uppercase group-hover:text-white/50 transition-colors">Seleção de Fotos dos Noivos</span>
              <span className="text-xs text-white/20 group-hover:text-gold transition-colors">›</span>
            </Link>
          )}

          {/* Datas manuais */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <EditField label="Data Início Entrega" value={e.data_entrega_ini} field="data_entrega_ini" eventId={e.id} type="date" onSaved={handleSaved} />
            <EditField label="Data Final Entrega" value={e.data_entrega} field="data_entrega" eventId={e.id} type="date" onSaved={handleSaved} />
          </div>
          {/* Checkboxes */}
          <div className="flex flex-col gap-3 pt-2 border-t border-white/[0.05]">
            <EditCheck label="Seleção de fotos enviada ao cliente" checked={e.sel_enviado} field="sel_enviado" eventId={e.id} onSaved={handleSaved} />
            <EditCheck label="Fotos editadas enviadas ao cliente" checked={e.fotos_enviadas} field="fotos_enviadas" eventId={e.id} onSaved={handleSaved} />
            <EditCheck label="Alerta 30 dias úteis enviado" checked={e.alerta_30du} field="alerta_30du" eventId={e.id} onSaved={handleSaved} />
          </div>
        </Section>

        </DrawerBloco>

        <BlocoHeader num="VI">Comunicação com os Noivos</BlocoHeader>
        {e.referencia && (
          <DrawerBloco label="Comunicação com os Noivos" sub="Notificações enviadas e mensagens dos noivos.">
            <RespostaRapidaNoivos referencia={e.referencia} />
            <NotificacaoNoivosSection referencia={e.referencia} />
            <MensagensNoivosSection referencia={e.referencia} />
          </DrawerBloco>
        )}

        <BlocoHeader num="VII">Equipa & Tarefas</BlocoHeader>

        <DrawerBloco label="Equipa & Tarefas" sub="Equipa atribuída, tarefas do evento e relatório de vídeo.">

        {/* ── Tarefas deste casamento ── */}
        <EventoTarefas eventoId={e.id} />

        {/* ── Equipa ── */}
        <Section title="Equipa">
          <div className="grid grid-cols-2 gap-4">
            <EditEquipaField label="Fotógrafo" field="fotografo" multi={true}
              eventoId={e.id} referencia={e.referencia ?? ''} local={e.local ?? ''} dataCasamento={e.data_evento ?? ''}
              initialValue={e.fotografo ?? []}
              options={optionsFoto}
              onChanged={setEquipaFoto}
              unavailableNames={unavailableNames} />
            <EditEquipaField label="Videógrafo" field="videografo" multi={true}
              eventoId={e.id} referencia={e.referencia ?? ''} local={e.local ?? ''} dataCasamento={e.data_evento ?? ''}
              initialValue={e.videografo ?? []}
              options={optionsVideo}
              unavailableNames={unavailableNames}
              onChanged={setEquipaVideo} />
            <EditEquipaField label="Editor de Fotos" field="editor_fotos" multi={false}
              eventoId={e.id} referencia={e.referencia ?? ''} local={e.local ?? ''} dataCasamento={e.data_evento ?? ''}
              initialValue={e.editor_fotos ? [e.editor_fotos] : []}
              options={optionsAllTeam}
              unavailableNames={unavailableNames}
              onChanged={setEquipaEditorFotos} />
            <EditEquipaField label="Editor de Álbum" field="editor_album" multi={false}
              eventoId={e.id} referencia={e.referencia ?? ''} local={e.local ?? ''} dataCasamento={e.data_evento ?? ''}
              initialValue={e.editor_album ?? []}
              options={optionsAllTeam}
              unavailableNames={unavailableNames}
              onChanged={setEquipaEditorAlbum} />
            <EditEquipaField label="Editor de Vídeo" field="editor_video" multi={false}
              eventoId={e.id} referencia={e.referencia ?? ''} local={e.local ?? ''} dataCasamento={e.data_evento ?? ''}
              initialValue={e.editor_video ?? []}
              options={optionsAllTeam}
              unavailableNames={unavailableNames}
              onChanged={setEquipaEditorVideo} />
            <EditField label="Agendamento Email" value={e.agendamento_email} field="agendamento_email" eventId={e.id} onSaved={handleSaved} />
          </div>

          {/* ── Notificações Equipa (1 botão por pessoa) ── */}
          <div className="print:hidden mt-5 pt-5 border-t border-white/[0.05]">
            <p className="text-[9px] tracking-[0.4em] text-purple-400/60 uppercase mb-4">Notificação</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Notificação Fotógrafo — 1 linha por nome */}
              {(() => {
                const nomes = equipaFoto
                const hasTeam = nomes.length > 0
                return (
                  <div className="flex flex-col gap-2 rounded-xl p-4" style={{ background: 'rgba(160,100,240,0.04)', border: '1px solid rgba(160,100,240,0.15)' }}>
                    <p className="text-[9px] tracking-[0.3em] uppercase text-white/30">Fotógrafo</p>
                    {!hasTeam && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-white/20 flex-1">Pendente</span>
                        <span className="px-3 py-2 rounded-lg text-[10px] font-semibold tracking-[0.15em] uppercase border bg-white/[0.03] text-white/20 border-white/10">🔒 Sem equipa</span>
                      </div>
                    )}
                    {nomes.map((nome) => {
                      const isUnavailable = unavailableNames.includes(nome.toUpperCase())
                      const enviadaEm = notifFotoEnviadaBy[nome] ?? null
                      const sending = sendingNotifPerson[`foto::${nome}`] ?? false
                      return (
                        <div key={nome} className="flex items-center gap-2 py-1.5 border-t border-white/[0.04] first:border-t-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-purple-300/80 truncate">{nome}</p>
                            <p className="text-[10px] font-mono mt-0.5">
                              {enviadaEm
                                ? <span className="text-green-400/70">{new Date(enviadaEm).toLocaleDateString('pt-PT')}</span>
                                : <span className="text-white/20">Pendente</span>
                              }
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {enviadaEm && (
                              <button
                                onClick={async () => {
                                  if (!evento?.referencia) return
                                  const next = { ...notifFotoEnviadaBy }
                                  delete next[nome]
                                  await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { notif_foto_enviada_by: next } } }) })
                                  setNotifFotoEnviadaBy(next)
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/30 transition-all text-xs"
                                title="Repor como Pendente"
                              >✕</button>
                            )}
                            <button
                              disabled={sending || isUnavailable}
                              onClick={async () => {
                                if (!evento?.referencia || sending || isUnavailable) return
                                setSendingNotifPerson(s => ({ ...s, [`foto::${nome}`]: true }))
                                const today = new Date().toISOString().split('T')[0]
                                const emailRes = await fetch('/api/send-freelancer-notification', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ nomes: [nome], tipo: 'fotografo', referencia: evento.referencia, data_evento: evento.data_evento, local: evento.local, nome_noiva: evento.nome_noiva, nome_noivo: evento.nome_noivo }),
                                })
                                const emailData = await emailRes.json()
                                if (emailRes.ok && emailData.ok) {
                                  const next = { ...notifFotoEnviadaBy, [nome]: today }
                                  await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { notif_foto_enviada_by: next } } }) })
                                  setNotifFotoEnviadaBy(next)
                                } else {
                                  setNotifFotoErro(emailData.error ?? 'Erro ao enviar')
                                }
                                setSendingNotifPerson(s => ({ ...s, [`foto::${nome}`]: false }))
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-[0.15em] uppercase border transition-all ${
                                enviadaEm ? 'bg-green-500/15 text-green-400/80 border-green-500/25 hover:bg-green-500/25'
                                : isUnavailable ? 'bg-red-500/10 text-red-400/60 border-red-500/20 cursor-not-allowed'
                                : sending ? 'bg-purple-500/10 text-purple-300/50 border-purple-500/20 cursor-not-allowed'
                                : 'bg-purple-500/15 text-purple-300 border-purple-500/25 hover:bg-purple-500/25'
                              }`}
                            >
                              {sending ? '...' : enviadaEm ? '↻ Reenviar' : isUnavailable ? '🔒' : 'Notificar'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {notifFotoErro && (
                      <p className="text-[9px] text-red-400/70 leading-relaxed mt-1">⚠ {notifFotoErro}. Sem email? Adiciona na página Equipas de Trabalho.</p>
                    )}
                  </div>
                )
              })()}

              {/* Notificação Videógrafo — 1 linha por nome */}
              {(() => {
                const nomes = equipaVideo
                const hasTeam = nomes.length > 0
                return (
                  <div className="flex flex-col gap-2 rounded-xl p-4" style={{ background: 'rgba(160,100,240,0.04)', border: '1px solid rgba(160,100,240,0.15)' }}>
                    <p className="text-[9px] tracking-[0.3em] uppercase text-white/30">Videógrafo</p>
                    {!hasTeam && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-white/20 flex-1">Pendente</span>
                        <span className="px-3 py-2 rounded-lg text-[10px] font-semibold tracking-[0.15em] uppercase border bg-white/[0.03] text-white/20 border-white/10">🔒 Sem equipa</span>
                      </div>
                    )}
                    {nomes.map((nome) => {
                      const isUnavailable = unavailableNames.includes(nome.toUpperCase())
                      const enviadaEm = notifVideoEnviadaBy[nome] ?? null
                      const sending = sendingNotifPerson[`video::${nome}`] ?? false
                      return (
                        <div key={nome} className="flex items-center gap-2 py-1.5 border-t border-white/[0.04] first:border-t-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-purple-300/80 truncate">{nome}</p>
                            <p className="text-[10px] font-mono mt-0.5">
                              {enviadaEm
                                ? <span className="text-green-400/70">{new Date(enviadaEm).toLocaleDateString('pt-PT')}</span>
                                : <span className="text-white/20">Pendente</span>
                              }
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {enviadaEm && (
                              <button
                                onClick={async () => {
                                  if (!evento?.referencia) return
                                  const next = { ...notifVideoEnviadaBy }
                                  delete next[nome]
                                  await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { notif_video_enviada_by: next } } }) })
                                  setNotifVideoEnviadaBy(next)
                                }}
                                className="w-6 h-6 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/30 transition-all text-xs"
                                title="Repor como Pendente"
                              >✕</button>
                            )}
                            <button
                              disabled={sending || isUnavailable}
                              onClick={async () => {
                                if (!evento?.referencia || sending || isUnavailable) return
                                setSendingNotifPerson(s => ({ ...s, [`video::${nome}`]: true }))
                                const today = new Date().toISOString().split('T')[0]
                                const emailRes = await fetch('/api/send-freelancer-notification', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ nomes: [nome], tipo: 'videografo', referencia: evento.referencia, data_evento: evento.data_evento, local: evento.local, nome_noiva: evento.nome_noiva, nome_noivo: evento.nome_noivo }),
                                })
                                const emailData = await emailRes.json()
                                if (emailRes.ok && emailData.ok) {
                                  const next = { ...notifVideoEnviadaBy, [nome]: today }
                                  await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { notif_video_enviada_by: next } } }) })
                                  setNotifVideoEnviadaBy(next)
                                } else {
                                  setNotifVideoErro(emailData.error ?? 'Erro ao enviar')
                                }
                                setSendingNotifPerson(s => ({ ...s, [`video::${nome}`]: false }))
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-[0.15em] uppercase border transition-all ${
                                enviadaEm ? 'bg-green-500/15 text-green-400/80 border-green-500/25 hover:bg-green-500/25'
                                : isUnavailable ? 'bg-red-500/10 text-red-400/60 border-red-500/20 cursor-not-allowed'
                                : sending ? 'bg-purple-500/10 text-purple-300/50 border-purple-500/20 cursor-not-allowed'
                                : 'bg-purple-500/15 text-purple-300 border-purple-500/25 hover:bg-purple-500/25'
                              }`}
                            >
                              {sending ? '...' : enviadaEm ? '↻ Reenviar' : isUnavailable ? '🔒' : 'Notificar'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {notifVideoErro && (
                      <p className="text-[9px] text-red-400/70 leading-relaxed mt-1">⚠ {notifVideoErro}. Sem email? Adiciona na página Equipas de Trabalho.</p>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </Section>

        {/* ── Relatório Vídeo ── */}
        <Section title="Relatório Vídeo"
          right={
            <span className="text-[9px] tracking-widest text-white/20 uppercase">
              {relatoriosVideo.length > 0 ? `${relatoriosVideo.length} recebido${relatoriosVideo.length > 1 ? 's' : ''}` : 'Sem relatórios'}
            </span>
          }
        >
          {relatoriosVideo.length === 0 ? (
            <p className="text-xs text-white/20 italic">Nenhum relatório recebido ainda.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {relatoriosVideo.map((r: any, idx: number) => {
                const dados = r.dados ?? {}
                const dataStr = r.criado_em
                  ? new Date(r.criado_em).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '—'
                return (
                  <details key={idx} className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                    <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors list-none">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-sm text-white/80 font-medium">{r.nome_operador || '—'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-white/30">{dataStr}</span>
                        <button
                          onClick={async (e) => {
                            e.preventDefault()
                            if (!confirm(`Apagar relatório de ${r.nome_operador || 'operador'}?\nO freelancer poderá submeter novamente.`)) return
                            const res = await fetch(`/api/relatorios-video?id=${r.id}`, { method: 'DELETE' })
                            if (res.ok) setRelatoriosVideo(prev => prev.filter((_: any, i: number) => i !== idx))
                          }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors hover:bg-red-500/10"
                          style={{ color: 'rgba(255,255,255,0.2)' }}
                          title="Apagar relatório"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/><path strokeLinecap="round" strokeLinejoin="round" d="M19 6l-1 14H6L5 6m5 0V4h4v2"/>
                          </svg>
                        </button>
                      </div>
                    </summary>
                    <div className="px-4 pb-4 pt-2 flex flex-col gap-2 border-t border-white/[0.05]">
                      {Object.entries(dados).map(([key, val]: [string, any]) => (
                        key !== 'referencia' && key !== 'Nome do Operador' && (
                          <div key={key} className="flex flex-col gap-0.5">
                            <span className="text-[9px] tracking-widest text-white/25 uppercase">{key}</span>
                            <span className="text-xs text-white/60">{String(val ?? '—')}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </details>
                )
              })}
            </div>
          )}
        </Section>

        {/* ── Armazenamento ── */}
        <div
          className="print:hidden rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300"
          style={armazenamentoBackup
            ? {
                background: 'rgba(251, 191, 36, 0.10)',
                border: '1px solid rgba(251, 191, 36, 0.32)',
                boxShadow: '0 0 24px rgba(251, 191, 36, 0.10), 0 0 6px rgba(251, 191, 36, 0.08)',
              }
            : {
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              className="text-[10px] tracking-[0.35em] uppercase transition-colors"
              style={{ color: armazenamentoBackup ? 'rgba(251, 191, 36, 0.95)' : 'rgba(212, 175, 55, 0.80)' }}
            >
              Armazenamento
            </h2>
            <button
              type="button"
              onClick={async () => {
                if (!e.referencia) return
                const next = armazenamentoBackup ? null : new Date().toISOString()
                setArmazenamentoBackup(next)
                try {
                  await fetch('/api/portais', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      referencia: e.referencia,
                      updates: { settings: { armazenamento_backup: next } },
                    }),
                  })
                } catch { /* ignore */ }
              }}
              className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] tracking-[0.18em] uppercase font-semibold transition-all"
              style={armazenamentoBackup
                ? {
                    background: 'rgba(251, 191, 36, 0.18)',
                    border: '1px solid rgba(251, 191, 36, 0.50)',
                    color: 'rgba(251, 191, 36, 1)',
                  }
                : {
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.55)',
                  }}
              title={armazenamentoBackup ? 'Clica para desmarcar' : 'Clica para confirmar backup'}
            >
              {/* Checkbox */}
              <span
                className="w-3.5 h-3.5 shrink-0 border flex items-center justify-center transition-all rounded-[3px]"
                style={armazenamentoBackup
                  ? { borderColor: 'rgba(251, 191, 36, 1)', background: 'rgba(251, 191, 36, 1)' }
                  : { borderColor: 'rgba(255,255,255,0.30)', background: 'transparent' }}
              >
                {armazenamentoBackup && (
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </span>
              {armazenamentoBackup ? 'Backup feito' : 'Marcar Backup feito'}
            </button>
          </div>

          {/* Carimbo da data+hora de quando foi marcado */}
          {armazenamentoBackup && (
            <div
              className="-mt-1 inline-flex items-center gap-1.5 text-[11px]"
              style={{ color: 'rgba(251, 191, 36, 0.80)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <span>
                Confirmado em{' '}
                <strong style={{ color: 'rgba(251, 191, 36, 0.98)' }}>
                  {new Date(armazenamentoBackup).toLocaleString('pt-PT', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </strong>
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <EditMultiField label="Nome do Disco" value={e.nome_disco ?? []} field="nome_disco" eventId={e.id} referencia={e.referencia} onSaved={handleSaved} />
            <EditMultiField label="Backup Disco" value={e.backup_disco ?? []} field="backup_disco" eventId={e.id} referencia={e.referencia} onSaved={handleSaved} />
          </div>
        </div>

        {/* ── Ações Fotografia ── */}
        <div className="print:hidden rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: 'rgba(56,130,246,0.04)', border: '1px solid rgba(56,130,246,0.18)', boxShadow: '0 0 24px rgba(56,130,246,0.08), 0 0 6px rgba(56,130,246,0.06)' }}>
          <h2 className="text-[10px] tracking-[0.35em] uppercase" style={{ color: 'rgba(99,165,255,0.8)' }}>Ações Fotografia</h2>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Fotos p/ Seleção',  state: selecaoEnviada,      setState: setSelecaoEnviada,      key: 'selecao_enviada',      urlKey: 'selecao',      api: '/api/send-selecao-email' },
              { label: 'Fotos Pré-Wedding', state: preWeddingEnviada,   setState: setPreWeddingEnviada,   key: 'prewedding_enviada',   urlKey: 'prewedding',   api: '/api/send-prewedding-email' },
              { label: 'Fotos Finais',      state: fotosFinaisEnviada,  setState: setFotosFinaisEnviada,  key: 'fotos_finais_enviada', urlKey: 'fotos_finais', api: '/api/send-fotos-finais-email' },
              { label: 'Galerias Online',   state: galeriasEnviada,     setState: setGaleriasEnviada,     key: 'galerias_enviada',     urlKey: 'galerias',     api: '/api/send-galerias-email' },
              { label: 'Enviar Maquete',    state: maqueteEnviada,      setState: setMaqueteEnviada,      key: 'maquete_enviada',      urlKey: 'maquete',      api: '/api/send-maquete-email' },
            ].map(({ label, state, setState, key, urlKey, api }, i, arr) => {
              const url = actionUrls[urlKey] ?? ''
              const hasUrl = url.trim().length > 0
              return (
              <div key={key}>
                {/* Row: label + date + send button */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm text-white/70">{label}</p>
                    <p className="text-xs mt-0.5 font-mono">
                      {state
                        ? <span className="text-green-400/70">{new Date(state).toLocaleDateString('pt-PT')}</span>
                        : <span className="text-white/25">Pendente</span>
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {state && (
                      <button
                        onClick={async () => {
                          if (!evento?.referencia) return
                          await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { [key]: null } } }) })
                          setState(null)
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/30 transition-all text-xs"
                        title="Repor como Pendente"
                      >✕</button>
                    )}
                    <button
                      disabled={!hasUrl}
                      onClick={async () => {
                        if (!evento?.referencia || !hasUrl) return
                        const today = new Date().toISOString().split('T')[0]
                        await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { [key]: today, [`${urlKey}_url`]: url } } }) })
                        setState(today)
                        const emailRes = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email_noiva: evento.email_noiva, nome_noiva: evento.nome_noiva, nome_noivo: evento.nome_noivo, url, referencia: evento.referencia }) })
                        if (!emailRes.ok) {
                          const err = await emailRes.json().catch(() => ({}))
                          alert(err?.error ?? 'Erro ao enviar email')
                        }
                      }}
                      className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-[0.2em] uppercase border transition-all ${
                        state ? 'bg-green-500/20 text-green-400 border-green-500/30'
                        : hasUrl ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'
                        : 'bg-white/[0.03] text-white/20 border-white/10 cursor-not-allowed'
                      }`}
                    >
                      {state ? '✓ Enviado' : !hasUrl ? '🔒 Bloqueado' : label}
                    </button>
                  </div>
                </div>
                {/* URL input */}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Cole aqui o URL para desbloquear..."
                    value={url}
                    onChange={e => setActionUrls(prev => ({ ...prev, [urlKey]: e.target.value }))}
                    onBlur={async () => {
                      if (!evento?.referencia) {
                        alert('❌ Este evento não tem referência preenchida em Supabase (eventos_2026.referencia). O URL NÃO foi guardado. Preenche a coluna "referencia" da row deste evento no Supabase e tenta de novo.')
                        return
                      }
                      const res = await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { [`${urlKey}_url`]: url } } }) })
                      if (!res.ok) {
                        const err = await res.json().catch(() => ({}))
                        alert(`❌ Falhou a guardar o URL: ${err?.error ?? res.statusText}`)
                      }
                    }}
                    className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 placeholder-white/20 focus:outline-none focus:border-blue-400/40 transition-colors"
                  />
                  {url && (
                    <button
                      onClick={async () => {
                        if (!evento?.referencia) return
                        const newUrls = { ...actionUrls, [urlKey]: '' }
                        setActionUrls(newUrls)
                        await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { [`${urlKey}_url`]: '' } } }) })
                      }}
                      className="text-white/20 hover:text-white/50 transition-colors text-xs"
                    >✕</button>
                  )}
                </div>
                {i < arr.length - 1 && <div className="h-px bg-white/5 mt-4" />}
              </div>
            )})}
          </div>
        </div>

        {/* ── Fotos Convidados (Email 15d / CTT 30d) ── */}
        <div className="print:hidden rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: 'rgba(56,130,246,0.04)', border: '1px solid rgba(56,130,246,0.18)' }}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[10px] tracking-[0.35em] uppercase" style={{ color: 'rgba(99,165,255,0.8)' }}>Fotos Convidados</h2>
            <a
              href="https://accounts.google.com/v3/signin/accountchooser?continue=https%3A%2F%2Fdrive.google.com%2Fdrive%2Ffolders%2F1cvuMBZHxeA9nA6xC1vb3JjMdXUbevwU1&dsh=S319276986%3A1781711922233136&followup=https%3A%2F%2Fdrive.google.com%2Fdrive%2Ffolders%2F1cvuMBZHxeA9nA6xC1vb3JjMdXUbevwU1&osid=1&passive=1209600&service=wise&flowName=GlifWebSignIn&flowEntry=ServiceLogin&ifkv=AcDsRvzN8h_rmyuhYz1HzfEV5n5NF3Ontyj2K0fORlp7gypQrFtyybatpA-D5g6pnaBc7k5Mv2c3sg"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-[0.2em] uppercase border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Colocar Fotos 70%
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {([
              { label: 'Fotos via Email', prazoDias: 15, prazoLabel: '15 dias após o evento', state: fotosConvidadosEmailEnviada, setState: setFotosConvidadosEmailEnviada, key: 'fotos_convidados_email_enviada', listaKey: 'fotos_convidados_email_lista', lista: fotosConvidadosEmailLista, setLista: setFotosConvidadosEmailLista, workflowKey: 'fotos_convidados_email_workflow', workflow: fotosConvidadosEmailWorkflow, setWorkflow: setFotosConvidadosEmailWorkflow },
              { label: 'Fotos via CTT',   prazoDias: 30, prazoLabel: '30 dias após o evento', state: fotosConvidadosCttEnviada,   setState: setFotosConvidadosCttEnviada,   key: 'fotos_convidados_ctt_enviada',   listaKey: 'fotos_convidados_ctt_lista',   lista: fotosConvidadosCttLista,   setLista: setFotosConvidadosCttLista,   workflowKey: 'fotos_convidados_ctt_workflow',   workflow: fotosConvidadosCttWorkflow,   setWorkflow: setFotosConvidadosCttWorkflow },
            ]).map(({ label, prazoDias, prazoLabel, state, setState, key, listaKey, lista, setLista, workflowKey, workflow, setWorkflow }) => {
              // Aviso de prazo
              let deadline: { daysLeft: number; deadlineStr: string; expired: boolean; critical: boolean } | null = null
              if (!state && e.data_evento) {
                try {
                  const [y, m, d] = String(e.data_evento).slice(0, 10).split('-').map(Number)
                  const dEvento = new Date(y, m - 1, d)
                  if (!isNaN(dEvento.getTime())) {
                    const dl = new Date(dEvento.getTime() + prazoDias * 86400000)
                    const today = new Date(); today.setHours(0, 0, 0, 0)
                    const daysLeft = Math.ceil((dl.getTime() - today.getTime()) / 86400000)
                    deadline = { daysLeft, deadlineStr: dl.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }), expired: daysLeft < 0, critical: daysLeft <= 5 }
                  }
                } catch { /* ignore */ }
              }
              return (
                <div key={key} className="rounded-xl border border-white/[0.06] bg-black/20 p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-white/75 font-semibold">{label}</p>
                    {state && (
                      <button onClick={async () => {
                          if (!evento?.referencia) return
                          await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { [key]: null } } }) })
                          setState(null)
                        }}
                        className="w-6 h-6 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/30 transition-all text-xs"
                        title="Repor como pendente">✕</button>
                    )}
                  </div>
                  <p className="text-[10px] text-white/30 italic">Prazo: {prazoLabel}</p>
                  <p className="text-xs font-mono">
                    {state
                      ? <span className="text-green-400/70">Enviadas em {new Date(state).toLocaleDateString('pt-PT')}</span>
                      : deadline
                        ? deadline.expired
                          ? <span className="text-red-400">Expirou há {Math.abs(deadline.daysLeft)} dia{Math.abs(deadline.daysLeft) === 1 ? '' : 's'} ({deadline.deadlineStr})</span>
                          : deadline.critical
                            ? <span className="text-amber-400">Faltam {deadline.daysLeft} dia{deadline.daysLeft === 1 ? '' : 's'} ({deadline.deadlineStr})</span>
                            : <span className="text-white/50">Até {deadline.deadlineStr} ({deadline.daysLeft} dias)</span>
                        : <span className="text-white/25">Pendente</span>
                    }
                  </p>
                  {(lista.length === 0 && !state) && (
                    <p className="text-[10px] text-amber-300/90 bg-amber-500/[0.06] border border-amber-500/20 rounded-md px-2 py-1.5">
                      ⚠ Adiciona na <strong>Lista</strong> os convidados que adquiriram fotografias para desbloquear o botão.
                    </p>
                  )}
                  <div className="flex gap-2 mt-1">
                    <button
                      disabled={lista.length === 0 && !state}
                      onClick={async () => {
                        if (!evento?.referencia) return
                        if (lista.length === 0 && !state) {
                          alert('Adiciona primeiro o nome dos convidados que adquiriram fotografias na "Lista". Só depois podes marcar como enviadas.')
                          return
                        }
                        const today = new Date().toISOString().split('T')[0]
                        await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { [key]: today } } }) })
                        setState(today)
                      }}
                      className={`flex-1 px-4 py-2 rounded-lg text-[11px] font-semibold tracking-[0.2em] uppercase border transition-all ${
                        state ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : (lista.length === 0) ? 'bg-white/[0.03] text-white/25 border-white/10 cursor-not-allowed'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30'
                      }`}
                    >
                      {state ? '✓ Fotos Enviadas' : (lista.length === 0) ? '🔒 Bloqueado' : 'Marcar Fotos Enviadas'}
                    </button>
                    {evento?.referencia && (
                      <ListaConvidadosAdminButton referencia={evento.referencia} listaKey={listaKey} label={label} lista={lista} onListaChange={setLista} />
                    )}
                    {evento?.referencia && (
                      <WorkflowAdminButton referencia={evento.referencia} workflowKey={workflowKey} label={label} workflow={workflow} onWorkflowChange={setWorkflow} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Ações Vídeo ── */}
        <div className="print:hidden rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: 'rgba(180,140,40,0.04)', border: '1px solid rgba(180,140,40,0.2)', boxShadow: '0 0 24px rgba(180,140,40,0.07), 0 0 6px rgba(180,140,40,0.05)' }}>
          <h2 className="text-[10px] tracking-[0.35em] uppercase" style={{ color: 'rgba(200,165,80,0.75)' }}>Ações Vídeo</h2>
          <div className="flex flex-col gap-4">
            {[
              { label: 'Vídeo Pré-Wedding', state: videoPreWeddingEnviada, setState: setVideoPreWeddingEnviada, key: 'video_prewedding_enviada', urlKey: 'video_prewedding', api: '/api/send-video-prewedding-email' },
              { label: 'Wedding Film', state: weddingFilmEnviada, setState: setWeddingFilmEnviada, key: 'wedding_film_enviada', urlKey: 'wedding_film', api: '/api/send-wedding-film-email' },
              { label: 'Same Day Edit', state: sameDayEditEnviada, setState: setSameDayEditEnviada, key: 'same_day_edit_enviada', urlKey: 'same_day_edit', api: '/api/send-same-day-edit-email' },
              { label: 'Teaser / Trailer', state: teaserEnviada, setState: setTeaserEnviada, key: 'teaser_enviada', urlKey: 'teaser', api: '/api/send-teaser-email' },
            ].map(({ label, state, setState, key, urlKey, api }) => {
              const url = videoActionUrls[urlKey] ?? ''
              const hasUrl = url.trim().length > 0
              return (
                <div key={key}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <p className="text-sm text-white/70">{label}</p>
                      <p className="text-xs mt-0.5 font-mono">
                        {state
                          ? <span className="text-green-400/70">{new Date(state).toLocaleDateString('pt-PT')}</span>
                          : <span className="text-white/25">Pendente</span>
                        }
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {state && (
                        <button
                          onClick={async () => {
                            if (!evento?.referencia) return
                            await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { [key]: null } } }) })
                            setState(null)
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/30 transition-all text-xs"
                          title="Repor como Pendente"
                        >✕</button>
                      )}
                      <button
                        disabled={!hasUrl}
                        onClick={async () => {
                          if (!evento?.referencia || !hasUrl) return
                          const today = new Date().toISOString().split('T')[0]
                          await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { [key]: today, [`${urlKey}_url`]: url } } }) })
                          setState(today)
                          const emailRes = await fetch(api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email_noiva: evento.email_noiva, nome_noiva: evento.nome_noiva, nome_noivo: evento.nome_noivo, url, referencia: evento.referencia }) })
                          if (!emailRes.ok) {
                            const err = await emailRes.json().catch(() => ({}))
                            alert(err?.error ?? 'Erro ao enviar email')
                          }
                        }}
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-[0.2em] uppercase border transition-all ${
                          state ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : hasUrl ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'
                          : 'bg-white/[0.03] text-white/20 border-white/10 cursor-not-allowed'
                        }`}
                      >
                        {state ? '✓ Enviado' : !hasUrl ? '🔒 Bloqueado' : label}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="Cole aqui o URL para desbloquear..."
                      value={url}
                      onChange={e => setVideoActionUrls(prev => ({ ...prev, [urlKey]: e.target.value }))}
                      onBlur={async () => {
                        if (!evento?.referencia) return
                        await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { [`${urlKey}_url`]: url } } }) })
                      }}
                      className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/60 placeholder-white/20 focus:outline-none focus:border-yellow-400/30 transition-colors"
                    />
                    {url && (
                      <button
                        onClick={async () => {
                          if (!evento?.referencia) return
                          setVideoActionUrls(prev => ({ ...prev, [urlKey]: '' }))
                          await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { [`${urlKey}_url`]: '' } } }) })
                        }}
                        className="text-white/20 hover:text-white/50 transition-colors text-xs"
                      >✕</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Outras Ações ── */}
        <div className="print:hidden rounded-2xl p-6 flex flex-col gap-4"
          style={{ background: 'rgba(40,180,100,0.03)', border: '1px solid rgba(40,180,100,0.18)', boxShadow: '0 0 24px rgba(40,180,100,0.07), 0 0 6px rgba(40,180,100,0.05)' }}>
          <h2 className="text-[10px] tracking-[0.35em] uppercase" style={{ color: 'rgba(80,200,130,0.75)' }}>Outras Ações</h2>
          <div className="flex flex-col gap-2">
            {/* Enviar Portal */}
            <div>
              <div className="flex items-center justify-between gap-3 mb-0">
                <div>
                  <p className="text-sm text-white/70">Enviar Portal</p>
                  <p className="text-xs mt-0.5 font-mono">
                    {portalEnviada
                      ? <span className="text-green-400/70">{new Date(portalEnviada).toLocaleDateString('pt-PT')}</span>
                      : <span className="text-white/25">Pendente</span>
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {portalEnviada && (
                    <button
                      onClick={async () => {
                        if (!evento?.referencia) return
                        await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { portal_enviada: null } } }) })
                        setPortalEnviada(null)
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/30 transition-all text-xs"
                      title="Repor como Pendente"
                    >✕</button>
                  )}
                  <button
                    onClick={async () => {
                      if (!evento?.referencia) return
                      const today = new Date().toISOString().split('T')[0]
                      await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { portal_enviada: today } } }) })
                      setPortalEnviada(today)
                      const pwRes = await fetch(`/api/portais-password?ref=${encodeURIComponent(evento.referencia)}`)
                      const pwData = await pwRes.json()
                      const portalEmailRes = await fetch('/api/send-portal-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email_noiva: evento.email_noiva,
                          nome_noiva: evento.nome_noiva,
                          nome_noivo: evento.nome_noivo,
                          referencia: evento.referencia,
                          password: pwData.password ?? '',
                          portal_url: `https://rl-menu-lake.vercel.app/portal-cliente/ref/${encodeURIComponent(evento.referencia)}`,
                        }),
                      })
                      if (!portalEmailRes.ok) {
                        const err = await portalEmailRes.json().catch(() => ({}))
                        alert(err?.error ?? 'Erro ao enviar email do portal')
                      }
                    }}
                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-[0.2em] uppercase border transition-all ${
                      portalEnviada ? 'bg-green-500/20 text-green-400 border-green-500/30'
                      : !evento?.email_noiva ? 'bg-white/[0.03] text-white/20 border-white/10 cursor-not-allowed'
                      : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/25'
                    }`}
                    disabled={!evento?.email_noiva}
                  >
                    {portalEnviada ? '✓ Enviado' : 'Enviar Portal'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        </DrawerBloco>

        <BlocoHeader num="VIII">Dados do Casal</BlocoHeader>

        <DrawerBloco label="Dados do Casal" sub="Dados dos noivos/pais — nomes, contactos, NIF, morada.">

        {/* ── Dados dos Noivos / Pais ── */}
        <Section title="Dados dos Noivos / Pais">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-[9px] tracking-[0.4em] text-gold/40 uppercase border-b border-white/5 pb-1">Noiva / Mãe</span>
              <EditField label="Nome" value={e.nome_noiva} field="nome_noiva" eventId={e.id} onSaved={handleSaved} />
              <EditField label="Email" value={e.email_noiva} field="email_noiva" eventId={e.id} type="email" onSaved={handleSaved} />
              <EditField label="Telemóvel" value={e.tel_noiva} field="tel_noiva" eventId={e.id} type="tel" onSaved={handleSaved} />
              <EditField label="Morada" value={e.morada_noiva} field="morada_noiva" eventId={e.id} onSaved={handleSaved} />
              <EditField label="Nº C. Cidadão" value={e.cc_noiva} field="cc_noiva" eventId={e.id} onSaved={handleSaved} />
              <EditField label="NIF" value={e.nif_noiva} field="nif_noiva" eventId={e.id} onSaved={handleSaved} />
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[9px] tracking-[0.4em] text-gold/40 uppercase border-b border-white/5 pb-1">Noivo / Pai</span>
              <EditField label="Nome" value={e.nome_noivo} field="nome_noivo" eventId={e.id} onSaved={handleSaved} />
              <EditField label="Email" value={e.email_noivo} field="email_noivo" eventId={e.id} type="email" onSaved={handleSaved} />
              <EditField label="Telemóvel" value={e.tel_noivo} field="tel_noivo" eventId={e.id} type="tel" onSaved={handleSaved} />
              <EditField label="Morada" value={e.morada_noivo} field="morada_noivo" eventId={e.id} onSaved={handleSaved} />
              <EditField label="Nº C. Cidadão" value={e.cc_noivo} field="cc_noivo" eventId={e.id} onSaved={handleSaved} />
              <EditField label="NIF" value={e.nif_noivo} field="nif_noivo" eventId={e.id} onSaved={handleSaved} />
            </div>
          </div>
        </Section>

        </DrawerBloco>

      </div>

      <style>{`
        @media print {
          body { background: white !important; }

          #evento-page {
            background: white !important;
            color: #111 !important;
            max-width: 100% !important;
            padding: 1.5cm 1.5cm !important;
            font-size: 12px !important;
          }

          /* Texto branco/claro → escuro */
          #evento-page [class*="text-white"] { color: #333 !important; }
          #evento-page [class*="text-gold"]  { color: #7a5b00 !important; }
          #evento-page [class*="text-green"] { color: #1a7a1a !important; }
          #evento-page [class*="text-blue"]  { color: #1a4d8f !important; }
          #evento-page [class*="text-orange"]{ color: #b35a00 !important; }
          #evento-page [class*="text-red"]   { color: #aa1111 !important; }
          #evento-page [class*="text-amber"] { color: #7a5500 !important; }

          /* Fundos escuros → branco / cinza muito claro */
          #evento-page [class*="bg-white"]   { background: #f9f9f7 !important; }
          #evento-page [class*="bg-gold"]    { background: rgba(122,91,0,0.07) !important; }
          #evento-page [class*="bg-green"]   { background: rgba(26,122,26,0.06) !important; }
          #evento-page [class*="bg-blue"]    { background: rgba(26,77,143,0.06) !important; }
          #evento-page [class*="bg-red"]     { background: rgba(170,17,17,0.06) !important; }
          #evento-page [class*="bg-amber"]   { background: rgba(122,85,0,0.06) !important; }
          #evento-page [class*="bg-zinc"]    { background: #f5f5f3 !important; }
          #evento-page [class*="bg-black"]   { background: #f0f0ee !important; }

          /* Bordas */
          #evento-page [class*="border-white"] { border-color: #ddd !important; }
          #evento-page [class*="border-gold"]  { border-color: #c8a94b !important; }
          #evento-page [class*="border-green"] { border-color: #4cae4c !important; }
          #evento-page [class*="border-blue"]  { border-color: #4a7fd4 !important; }

          /* Divisores */
          #evento-page [class*="bg-gold/15"] { background: #ddd !important; }

          /* Secções — ligeiro fundo */
          #evento-page .rounded-2xl { border: 1px solid #ddd !important; page-break-inside: avoid; }

          /* Botões — mostrar conteúdo como texto simples, sem aparência de botão */
          #evento-page button { background: transparent !important; border: none !important; box-shadow: none !important; padding: 2px 0 !important; cursor: default !important; color: #333 !important; font: inherit !important; display: inline !important; }
          /* Esconder spans de placeholder "Clica para editar" e indicadores de ação */
          #evento-page button em, #evento-page button i, #evento-page button span[class*="italic"] { display: none !important; }
          /* Esconder ícone ✎ e indicador "..." (são sempre o último span com ml-auto) */
          #evento-page button .ml-auto { display: none !important; }
          /* Esconder botões que são puramente de ação (têm só SVG ou texto de ação) */
          #evento-page button:has(svg:only-child) { display: none !important; }
          #evento-page input  { border: none !important; background: transparent !important; padding: 0 !important; color: #333 !important; }
          #evento-page select { display: none !important; }
          #evento-page a[class*="hover"] { color: #333 !important; text-decoration: none !important; }

          /* Evitar quebra de página dentro de secções */
          #evento-page .flex.flex-col.gap-5 > * { page-break-inside: avoid; }

          /* Título da página */
          @page { margin: 1cm; size: A4; }
        }
      `}</style>
    </main>
  )
}

// ─── ListaConvidadosAdminButton — botão "LISTA" + modal (controlado) ────────
function ListaConvidadosAdminButton({
  referencia, listaKey, label, lista, onListaChange,
}: { referencia: string; listaKey: string; label: string; lista: string[]; onListaChange: (next: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  async function guardar(next: string[]) {
    onListaChange(next)
    await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia, updates: { settings: { [listaKey]: next } } }) })
  }

  function adicionar() {
    const t = novoNome.trim()
    if (!t) return
    if (lista.includes(t)) { setNovoNome(''); return }
    guardar([...lista, t])
    setNovoNome('')
  }

  function remover(nome: string) {
    guardar(lista.filter(n => n !== nome))
  }

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`px-4 py-2 rounded-lg text-[11px] font-semibold tracking-[0.2em] uppercase border transition-all ${
          lista.length === 0
            ? 'border-amber-500/40 text-amber-300 bg-amber-500/[0.05] hover:bg-amber-500/[0.12] animate-pulse'
            : 'border-white/15 text-white/60 hover:bg-white/[0.05] hover:text-white/85'
        }`}>
        Lista{lista.length > 0 ? ` (${lista.length})` : ' ⚠'}
      </button>
      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpen(false)}>
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto flex flex-col gap-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-3">
              <div>
                <p className="text-[9px] tracking-[0.4em] uppercase text-blue-300/70">Lista de Convidados</p>
                <h3 className="text-sm text-white/85 font-semibold mt-0.5">{label}</h3>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full border border-white/10 text-white/40 hover:text-white/80 hover:border-white/30">✕</button>
            </div>

            <p className="text-[11px] text-amber-300/90 bg-amber-500/[0.06] border border-amber-500/20 rounded-md px-3 py-2 leading-snug">
              ⚠ Coloca aqui o nome dos convidados que <strong>adquiriram fotografias</strong>. Só depois consegues marcar como enviadas.
            </p>

            {lista.length === 0 ? (
              <p className="text-xs text-white/40 italic py-4 text-center">Ainda não há nomes adicionados.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {lista.map((n, i) => (
                  <li key={`${n}-${i}`} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                    <span className="text-sm text-white/80">{n}</span>
                    <button onClick={() => remover(n)}
                      className="w-5 h-5 flex items-center justify-center rounded-full text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all text-xs">✕</button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
              <input
                type="text"
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionar() } }}
                placeholder="Nome do convidado…"
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/85 placeholder-white/25 focus:outline-none focus:border-blue-400/40"
                autoFocus
              />
              <button onClick={adicionar}
                disabled={!novoNome.trim()}
                className="px-4 py-2 rounded-lg text-[11px] font-semibold tracking-[0.2em] uppercase border bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                + Adicionar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

// ─── Templates predefinidos por canal ───────────────────────────────────────
const WORKFLOW_DEFAULTS_ADMIN: Record<string, string> = {
  fotos_convidados_email_workflow:
    'Enviar todas as fotos sem marca de água com qualidade 70% para fotos.rlphoto@gmail.com.\n\nTodas as fotos por via email são enviadas através do nosso email fotos.rlphoto@gmail.com.',
  fotos_convidados_ctt_workflow: '',
}

// ─── WorkflowAdminButton — botão "+ Workflow" + modal com textarea ──────────
function WorkflowAdminButton({
  referencia, workflowKey, label, workflow, onWorkflowChange,
}: { referencia: string; workflowKey: string; label: string; workflow: string; onWorkflowChange: (next: string) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(workflow)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    if (open) setDraft(workflow || WORKFLOW_DEFAULTS_ADMIN[workflowKey] || '')
  }, [open, workflow, workflowKey])

  async function guardar() {
    setSaving(true)
    try {
      onWorkflowChange(draft)
      await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia, updates: { settings: { [workflowKey]: draft } } }) })
      setOpen(false)
    } finally { setSaving(false) }
  }

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button onClick={() => setOpen(true)}
        title={workflow ? 'Ver / editar workflow' : 'Adicionar workflow de envio'}
        className={`px-4 py-2 rounded-lg text-[11px] font-semibold tracking-[0.2em] uppercase border transition-all ${
          workflow
            ? 'border-[#c9a96e]/40 text-[#c9a96e] bg-[#c9a96e]/[0.06] hover:bg-[#c9a96e]/[0.12]'
            : 'border-white/15 text-white/60 hover:bg-white/[0.05] hover:text-white/85'
        }`}>
        {workflow ? '✓ Workflow' : '+ Workflow'}
      </button>
      {mounted && open && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(14,11,7,0.92)', backdropFilter: 'blur(6px)' }}
          onClick={() => setOpen(false)}>
          <div className="relative max-w-xl w-full max-h-[90vh] overflow-y-auto"
            style={{ background: '#120e09', border: '0.5px solid #4a3a1e', fontFamily: 'Georgia, "Times New Roman", serif' }}
            onClick={e => e.stopPropagation()}>

            {/* Corner ornaments (top) */}
            <div className="absolute top-0 left-0 w-[50px] h-[50px] pointer-events-none" style={{ borderTop: '0.5px solid #3a2a12', borderLeft: '0.5px solid #3a2a12' }} />
            <div className="absolute top-0 right-0 w-[50px] h-[50px] pointer-events-none" style={{ borderTop: '0.5px solid #3a2a12', borderRight: '0.5px solid #3a2a12' }} />

            {/* Close */}
            <button onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#7a6340] hover:text-[#c9a96e] transition-colors text-base z-10"
              title="Fechar (Esc)">✕</button>

            <div className="px-12 pt-12 pb-10 flex flex-col gap-6">
              {/* Header */}
              <div className="text-center">
                <p className="text-[9px] tracking-[0.5em] uppercase mb-3" style={{ color: '#7a6340' }}>Workflow de Envio</p>
                <h2 className="text-[28px] leading-tight" style={{ color: '#f0e8d8', fontWeight: 400 }}>{label.split(' via ')[0]}</h2>
                {label.includes(' via ') && (
                  <p className="text-[22px] italic mt-0.5" style={{ color: '#c9a96e', fontWeight: 300 }}>via {label.split(' via ')[1]}</p>
                )}
                <div className="my-5 text-[12px] tracking-[0.35em]" style={{ color: '#6a5430' }}>&mdash;&nbsp;·&nbsp;&#9670;&nbsp;·&nbsp;&mdash;</div>
              </div>

              {/* Description */}
              <p className="text-[13px] italic leading-relaxed text-center" style={{ color: '#a09070' }}>
                Descreve o procedimento de envio das fotos aos convidados —<br/>passos, contactos e observações.
              </p>

              {/* Textarea */}
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Os passos do envio…"
                rows={10}
                spellCheck={false}
                style={{ fontFamily: 'Georgia, "Times New Roman", serif', background: '#0e0b07', borderColor: '#4a3a1e', color: '#d4c9b0' }}
                className="w-full border px-5 py-4 text-[14px] leading-[1.7] focus:outline-none resize-y min-h-[200px] placeholder:text-[#5a4f3a] placeholder:italic"
                onFocus={e => e.currentTarget.style.borderColor = '#c9a96e'}
                onBlur={e => e.currentTarget.style.borderColor = '#4a3a1e'}
                autoFocus
              />

              {/* Actions */}
              <div className="flex gap-4 pt-2 justify-end items-center">
                <button onClick={() => setOpen(false)}
                  className="px-5 py-3 text-[10px] tracking-[0.4em] uppercase transition-colors"
                  style={{ color: '#7a6340' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#c9a96e'}
                  onMouseLeave={e => e.currentTarget.style.color = '#7a6340'}>
                  Cancelar
                </button>
                <button onClick={guardar} disabled={saving}
                  className="px-8 py-3 text-[10px] tracking-[0.4em] uppercase transition-all disabled:opacity-50 disabled:cursor-wait"
                  style={{ background: 'transparent', color: '#c9a96e', border: '0.5px solid #c9a96e' }}
                  onMouseEnter={e => { if (!saving) { e.currentTarget.style.background = '#c9a96e'; e.currentTarget.style.color = '#0e0b07' } }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c9a96e' }}>
                  {saving ? 'A guardar…' : 'Guardar'}
                </button>
              </div>

              {/* Footer mark */}
              <p className="text-[9px] tracking-[0.5em] uppercase text-center mt-2" style={{ color: '#3a2a12' }}>RL Photo · Video</p>
            </div>

            {/* Corner ornaments (bottom) */}
            <div className="absolute bottom-0 left-0 w-[50px] h-[50px] pointer-events-none" style={{ borderBottom: '0.5px solid #3a2a12', borderLeft: '0.5px solid #3a2a12' }} />
            <div className="absolute bottom-0 right-0 w-[50px] h-[50px] pointer-events-none" style={{ borderBottom: '0.5px solid #3a2a12', borderRight: '0.5px solid #3a2a12' }} />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
