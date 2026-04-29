'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

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
  servico_extra: string[]
  status: string
  fotografo: string[]
  videografo: string[]
  editor_fotos: string
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
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] tracking-[0.35em] text-gold uppercase">{title}</h2>
        {right && <div>{right}</div>}
      </div>
      {children}
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
function EditMultiField({ label, value, field, eventId, onSaved }: {
  label: string; value: string[]; field: string; eventId: string
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
    const payload: any = {}; payload[field] = newVal
    await fetch(`/api/eventos-notion/${eventId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    onSaved(field, newVal); setSaving(false)
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
  label: string; field: 'fotografo' | 'videografo'; multi: boolean
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
      if (ref.current && !ref.current.contains(e.target as Node)) handleClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, loaded, value])

  async function handleClose() {
    setOpen(false)
    setSaving(true)
    await fetch('/api/evento-equipa', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referencia,          // primary key — Notion-independent
        evento_id: eventoId, // kept for freelancer_casamentos sync
        local,
        data_casamento: dataCasamento || null,
        [field]: value,
      }),
    })
    setSaving(false)
  }

  function toggle(opt: string) {
    if (multi) {
      setValue(v => {
        const next = v.includes(opt) ? v.filter(x => x !== opt) : [...v, opt]
        onChanged?.(next)
        return next
      })
    } else {
      setValue(v => {
        const next = v.includes(opt) ? v.filter(x => x !== opt) : [opt]
        onChanged?.(next)
        return next
      })
    }
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
                <span key={v} className={tagCls(v)}>
                  {unavailableNames?.includes(v.toUpperCase()) && <span className="mr-1">⚠</span>}{v}
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
  useEffect(() => { setActive(selected) }, [selected])

  async function toggle(item: string) {
    const newList = active.includes(item) ? active.filter(i => i !== item) : [...active, item]
    setActive(newList); setSaving(true)
    const payload: any = {}; payload[field] = newList
    await fetch(`/api/eventos-notion/${eventId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    onSaved(field, newList); setSaving(false)
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

      {/* Dropdown para adicionar */}
      {available.length > 0 && (
        <div className="relative">
          <select value="" onChange={e => { if (e.target.value) toggle(e.target.value) }}
            className="w-full appearance-none bg-white/[0.02] border border-white/8 hover:border-white/20 rounded-xl px-3 py-2 text-[11px] text-white/30 focus:outline-none transition-colors cursor-pointer pr-6">
            <option value="" className="bg-zinc-900">+ Adicionar...</option>
            {available.map(i => <option key={i} value={i} className="bg-zinc-900">{i}</option>)}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/20 text-[10px]">▾</span>
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

function EstadoRow({ label, dateStr, estado, options, field, eventId, onSaved, href }: {
  label: string; dateStr?: string | null
  estado: string | null; options: string[]; field: string; eventId: string
  onSaved: (field: string, val: any) => void
  href?: string
}) {
  const val = estado ?? options[0]
  const cfg = estadoCfg(val)

  async function onChange(v: string) {
    onSaved(field, v)
    await fetch(`/api/eventos-notion/${eventId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: v }),
    })
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

function ContratoStatusSection({ eventoId, referencia }: { eventoId: string; referencia?: string }) {
  const [disponivel, setDisponivel] = useState<boolean | null>(null)
  const [settingsBlockId, setSettingsBlockId] = useState<string | null>(null)
  const [portalSettings, setPortalSettings] = useState<any>(null)
  const [toggling, setToggling] = useState(false)
  const [previewing, setPreviewing] = useState(false)

  useEffect(() => {
    // For ref-based portals, read from Supabase; also check Notion for legacy
    const promises: Promise<any>[] = [
      fetch(`/api/portais-clientes?id=${PORTAL_PAGE_ID}&bust=1`).then(r => r.json()).catch(() => ({})),
    ]
    if (referencia) {
      promises.push(
        fetch(`/api/portais?ref=${encodeURIComponent(referencia)}`).then(r => r.json()).catch(() => ({}))
      )
    }
    Promise.all(promises).then(([notionData, supabaseData]) => {
      const notionPs = notionData?.settings ?? {}
      const supabasePs = supabaseData?.portal?.settings ?? {}
      // Merge: Supabase takes priority (ref-based portals), Notion as fallback
      const ps = { ...notionPs, ...supabasePs }
      setPortalSettings(ps)
      setSettingsBlockId(notionData?.settingsBlockId ?? null)
      setDisponivel(ps.contratoDisponivel ?? false)
    })
  }, [referencia])

  function handleVerContrato() {
    window.open(`/eventos-2026/${eventoId}/contrato`, '_blank')
    setPreviewing(true)
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

  return (
    <div className="pt-2 border-t border-white/[0.05]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] tracking-[0.3em] text-gold uppercase">Contrato de Prestação de Serviços</span>
        <div className="flex items-center gap-2">
          {disponivel && (
            <button onClick={handleRetirar} disabled={toggling}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold tracking-wider border bg-green-500/10 border-green-500/30 text-green-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all disabled:opacity-50">
              {toggling ? '...' : '✓ No Portal — Retirar'}
            </button>
          )}
          {disponivel ? (
            <a href={`/eventos-2026/${eventoId}/contrato`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/30 text-gold text-[10px] font-semibold tracking-wider hover:bg-gold/20 transition-all">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Ver Contrato ↗
            </a>
          ) : previewing ? (
            <div className="flex items-center gap-2">
              <button onClick={() => window.open(`/eventos-2026/${eventoId}/contrato`, '_blank')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-white/50 text-[10px] font-semibold tracking-wider hover:bg-white/[0.07] transition-all">
                Rever ↗
              </button>
              <button onClick={handlePublicarNoPortal} disabled={toggling}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-500/40 text-green-400 text-[10px] font-semibold tracking-wider hover:bg-green-500/25 transition-all disabled:opacity-50">
                {toggling ? 'A publicar...' : '✓ Publicar no Portal'}
              </button>
              <button onClick={() => setPreviewing(false)}
                className="px-2 py-1.5 rounded-lg text-white/20 hover:text-white/50 text-[10px] transition-all">
                ✕
              </button>
            </div>
          ) : (
            <button onClick={handleVerContrato}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/30 text-gold text-[10px] font-semibold tracking-wider hover:bg-gold/20 transition-all">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Criar Contrato ↗
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PortalSection({ evento }: { evento: Evento }) {
  const referencia = evento.referencia!
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
        }),
      })
      if (res.ok) {
        setStatus('found')
        window.open(`/portal-cliente/ref/${encodeURIComponent(referencia)}`, '_blank')
      }
    } finally {
      setCreating(false)
    }
  }

  function fmtPwDate(ds: string) {
    const [y, m, d] = ds.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
    return `${String(d).padStart(2,'0')} ${MESES_PW[m-1]} ${y} · ${dias[dt.getDay()]}`
  }

  const dtu = pwBooking ? Math.round((new Date(pwBooking.date + 'T00:00:00').getTime() - new Date().setHours(0,0,0,0)) / 86400000) : null

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
            <a href={`/portal-cliente/ref/${encodeURIComponent(referencia)}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-black font-bold text-xs tracking-widest hover:bg-gold/80 transition-all uppercase">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
              Ver Portal do Cliente ↗
            </a>
            <button
              onClick={() => {
                sessionStorage.setItem(`portalAdmin_${referencia}`, 'true')
                window.open(`/portal-cliente/ref/${encodeURIComponent(referencia)}`, '_blank')
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-white/60 font-bold text-xs tracking-widest hover:bg-white/5 hover:text-white transition-all uppercase">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              Editar como Admin ↗
            </button>
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
      {status === 'not_found' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p className="text-xs text-white/30">Nenhum portal com a referência <span className="text-gold/60 font-mono">{referencia}</span></p>
          <button onClick={handleCriarPortal} disabled={creating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gold/30 text-gold/70 font-medium text-xs tracking-widest hover:bg-gold/10 transition-all uppercase whitespace-nowrap disabled:opacity-50">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            {creating ? 'A criar...' : 'Criar Portal do Cliente'}
          </button>
        </div>
      )}
      {status === 'error' && (
        <p className="text-xs text-red-400/50">Erro ao verificar portal.</p>
      )}
    </div>
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
  const [fotosDataEntrada, setFotosDataEntrada] = useState<string | null>(null)
  const [albumDataPrevista, setAlbumDataPrevista] = useState<string | null>(null)
  const [albumNotionId, setAlbumNotionId] = useState<string | null>(null)
  const [referenciaLoaded, setReferenciaLoaded] = useState<string | null>(null)
  const [portalSelecaoEstado, setPortalSelecaoEstado] = useState<string>('Aguardar')
  const [prazoFotosNoivosEstado, setPrazoFotosNoivosEstado] = useState<string>('Aguardar')
  const [maqueteEnviada, setMaqueteEnviada] = useState<string | null>(null)
  const [selecaoEnviada, setSelecaoEnviada] = useState<string | null>(null)
  const [preWeddingEnviada, setPreWeddingEnviada] = useState<string | null>(null)
  const [fotosFinaisEnviada, setFotosFinaisEnviada] = useState<string | null>(null)
  const [galeriasEnviada, setGaleriasEnviada] = useState<string | null>(null)
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
  const [relatoriosVideo, setRelatoriosVideo] = useState<any[]>([])
  const [copiedVideoIdx, setCopiedVideoIdx] = useState<number | null>(null)
  const [sendingNotifFoto, setSendingNotifFoto] = useState(false)
  const [sendingNotifVideo, setSendingNotifVideo] = useState(false)
  const [notifFotoErro, setNotifFotoErro] = useState<string | null>(null)
  const [notifVideoErro, setNotifVideoErro] = useState<string | null>(null)
  const [equipaFoto, setEquipaFoto] = useState<string[]>([])
  const [equipaVideo, setEquipaVideo] = useState<string[]>([])
  const [unavailableNames, setUnavailableNames] = useState<string[]>([])
  const [optionsFoto, setOptionsFoto] = useState<string[]>(['ALEXANDRE CAPÃO','PATRICIO FERREIRA','SONIA CARVALHO','RUI GARRIDO','BRUNO DE CARVALHO','PEDRO MARTINS'])
  const [optionsVideo, setOptionsVideo] = useState<string[]>(['RUI GONÇALVES','LUIS SOARES'])

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
        if (foto.length > 0) setOptionsFoto(foto)
        if (video.length > 0) setOptionsVideo(video)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`/api/eventos-notion/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        const ev = d.event
        setEvento(ev)
        if (ev.fotografo?.length)  setEquipaFoto(ev.fotografo)
        if (ev.videografo?.length) setEquipaVideo(ev.videografo)
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
              if (albumEstadoMapped && albumEstadoMapped !== ev.album_estado) {
                // Actualiza UI imediatamente
                setEvento(prev => prev ? { ...prev, album_estado: albumEstadoMapped } : prev)
                // Sincroniza no Notion
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
              // Auto: se tem data de entrada e estado ainda é Aguardar → marcar Enviado
              if (dataEntrada && (!ev.fotos_edicao_estado || ev.fotos_edicao_estado === 'Aguardar')) {
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
              if (s.prewedding_enviada)       setPreWeddingEnviada(s.prewedding_enviada)
              if (s.fotos_finais_enviada)     setFotosFinaisEnviada(s.fotos_finais_enviada)
              if (s.galerias_enviada)         setGaleriasEnviada(s.galerias_enviada)
              if (s.video_prewedding_enviada) setVideoPreWeddingEnviada(s.video_prewedding_enviada)
              if (s.wedding_film_enviada)     setWeddingFilmEnviada(s.wedding_film_enviada)
              if (s.same_day_edit_enviada)    setSameDayEditEnviada(s.same_day_edit_enviada)
              if (s.teaser_enviada)           setTeaserEnviada(s.teaser_enviada)
              if (s.portal_enviada)           setPortalEnviada(s.portal_enviada)
              if (s.notif_foto_enviada)       setNotifFotoEnviada(s.notif_foto_enviada)
              if (s.notif_video_enviada)      setNotifVideoEnviada(s.notif_video_enviada)
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
      <Link href={`/eventos-2026?ano=${anoEvento}`} className="print:hidden text-xs tracking-widest text-white/30 hover:text-gold transition-colors">
        ‹ VOLTAR AOS CASAMENTOS
      </Link>

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

        <div className="flex flex-wrap gap-2 mt-4">
          {(e.tipo_evento ?? []).map(t => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold/80">{t}</span>
          ))}
          {(e.tipo_servico ?? []).map(t => (
            <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-400/80">{t}</span>
          ))}
        </div>
        <p className="print:hidden text-[10px] text-white/15 mt-3 tracking-wider">Clica em qualquer campo para editar · guarda automaticamente no Notion</p>
      </div>

      <div className="h-px bg-gold/15 my-7" />

      {/* ── Portal do Cliente ── */}
      <div className="print:hidden">{e.referencia && <PortalSection evento={e} />}</div>

      <div className="flex flex-col gap-5">

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
              <span className="text-[10px] text-white/20">(Fotografia + Vídeo)</span>
            </div>
            <span className="text-blue-400 font-bold text-lg">
              {((e.valor_foto ?? 0) + (e.valor_video ?? 0)).toLocaleString('pt-PT')} €
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

                // Se a soma total de todos os pagamentos cobrir o valor total → todas as fases liquidadas
                const totalPagoGeral = pagamentos.reduce((s, p) => s + (p.valor_liquidado ?? 0), 0)
                const tudoLiquidado = total > 0 && totalPagoGeral >= total

                return ['ADJUDICAÇÃO','REFORÇO','FINAL'].map(label => {
                  // Todos os pagamentos para esta fase (pode haver vários parciais)
                  const pags = pagamentos.filter(p => p.fase_pagamento.includes(label))
                  const totalPago = pags.reduce((s, p) => s + (p.valor_liquidado ?? 0), 0)
                  const valorFase = faseValores[label]
                  const falta = Math.max(0, valorFase - totalPago)
                  const liquidado = tudoLiquidado || (totalPago >= valorFase && valorFase > 0)
                  const parcial = totalPago > 0 && !liquidado
                  const pct = valorFase > 0 ? Math.min(100, Math.round((totalPago / valorFase) * 100)) : 0

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

                      {/* Badge de estado */}
                      <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit ${statusCls}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
                        <span className="text-[9px] tracking-widest">{statusLabel}</span>
                      </div>

                      {/* Detalhes */}
                      <div className="flex flex-col gap-0.5 pt-1 border-t border-white/[0.05]">
                        {totalPago > 0 && (
                          <span className="text-[10px] text-white/40">
                            Pago: <span className={`font-medium ${liquidado ? 'text-green-400' : 'text-orange-400'}`}>{totalPago.toLocaleString('pt-PT')} €</span>
                          </span>
                        )}
                        {!liquidado && falta > 0 && (
                          <span className="text-[10px] text-white/30">
                            Falta: <span className="text-white/50 font-medium">{falta.toLocaleString('pt-PT')} €</span>
                          </span>
                        )}
                        {lastPag?.data_pagamento && (
                          <span className="text-[10px] text-white/25">{fmtD(lastPag.data_pagamento)}</span>
                        )}
                        {metodos.length > 0 && (
                          <span className="text-[10px] text-white/20">{metodos.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>

          {/* Criar Contrato */}
          <ContratoStatusSection eventoId={e.id} referencia={e.referencia ?? undefined} />

          {/* Contrato PDF */}
          <ContratoUpload eventId={e.id} contratoUrl={e.contratos} onSaved={handleSaved} />
        </Section>

        {/* ── Estado das Entregas ── */}
        <Section title="Estado das Entregas" right={
          <span className="text-[9px] tracking-[0.3em] text-gold uppercase">
            Data de Entrega{e.data_entrega ? `: ${formatDate(e.data_entrega)}` : ''}
          </span>
        }>
          {/* Linhas de estado */}
          <div className="flex flex-col gap-2">
            {prazoSelFotos && (
              <EstadoRow label="Prazo Seleção de Fotos (30 dias)" dateStr={prazoSelFotos}
                estado={e.sel_fotos_estado} options={['Aguardar','Em Edição','Entregue','S/SERVIÇO']}
                field="sel_fotos_estado" eventId={e.id} onSaved={handleSaved} />
            )}
            {prazoVideo && (
              <EstadoRow label="Prazo Entrega Vídeo (180 dias úteis)" dateStr={prazoVideo}
                estado={e.video_estado} options={['Aguardar','Em Edição','Entregue','S/SERVIÇO']}
                field="video_estado" eventId={e.id} onSaved={handleSaved} />
            )}
            <EstadoRow label="Fotos para Edição"
              dateStr={fotosDataEntrada ? addWorkingDays(fotosDataEntrada, 30) : null}
              estado={e.fotos_edicao_estado} options={['Aguardar','Enviado','Em Edição','Entregue','S/SERVIÇO']}
              field="fotos_edicao_estado" eventId={e.id} onSaved={handleSaved} />
            <EstadoRow label="Álbum"
              dateStr={albumDataPrevista}
              estado={e.album_estado} options={['Aguardar','Em Edição','Em Aprovação','Aprovado','Entregue','S/SERVIÇO']}
              field="album_estado" eventId={e.id} onSaved={handleSaved}
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

        {/* ── Equipa ── */}
        <Section title="Equipa">
          <div className="grid grid-cols-2 gap-4">
            <EditEquipaField label="Fotógrafo" field="fotografo" multi={true}
              eventoId={e.id} referencia={e.referencia ?? ''} local={e.local ?? ''} dataCasamento={e.data_evento ?? ''}
              initialValue={e.fotografo ?? []}
              options={optionsFoto}
              onChanged={setEquipaFoto}
              unavailableNames={unavailableNames} />
            <EditEquipaField label="Videógrafo" field="videografo" multi={false}
              eventoId={e.id} referencia={e.referencia ?? ''} local={e.local ?? ''} dataCasamento={e.data_evento ?? ''}
              initialValue={e.videografo ?? []}
              options={optionsVideo}
              unavailableNames={unavailableNames}
              onChanged={setEquipaVideo} />
            <EditField label="Editor de Fotos" value={e.editor_fotos} field="editor_fotos" eventId={e.id} onSaved={handleSaved} />
            <EditField label="Agendamento Email" value={e.agendamento_email} field="agendamento_email" eventId={e.id} onSaved={handleSaved} />
          </div>

          {/* ── Notificações Equipa ── */}
          <div className="print:hidden mt-5 pt-5 border-t border-white/[0.05]">
            <p className="text-[9px] tracking-[0.4em] text-purple-400/60 uppercase mb-4">Notificação</p>
            <div className="grid grid-cols-2 gap-4">
              {/* Notificação Fotógrafo */}
              {(() => {
                const nomes = equipaFoto
                const hasTeam = nomes.length > 0
                const allUnavailable = hasTeam && nomes.every(n => unavailableNames.includes(n.toUpperCase()))
                return (
                  <div className="flex flex-col gap-2 rounded-xl p-4" style={{ background: 'rgba(160,100,240,0.04)', border: '1px solid rgba(160,100,240,0.15)' }}>
                    <p className="text-[9px] tracking-[0.3em] uppercase text-white/30">Fotógrafo</p>
                    {nomes.length > 0 && (
                      <p className="text-[11px] text-purple-300/60 truncate">{nomes.join(', ')}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1">
                        <p className="text-[10px] font-mono">
                          {notifFotoEnviada
                            ? <span className="text-green-400/70">{new Date(notifFotoEnviada).toLocaleDateString('pt-PT')}</span>
                            : <span className="text-white/20">Pendente</span>
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {notifFotoEnviada && (
                          <button
                            onClick={async () => {
                              if (!evento?.referencia) return
                              await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { notif_foto_enviada: null } } }) })
                              setNotifFotoEnviada(null)
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/30 transition-all text-xs"
                            title="Repor como Pendente"
                          >✕</button>
                        )}
                        <button
                          disabled={!hasTeam || sendingNotifFoto || allUnavailable}
                          onClick={async () => {
                            if (!hasTeam || !evento?.referencia || sendingNotifFoto || allUnavailable) return
                            setSendingNotifFoto(true)
                            setNotifFotoErro(null)
                            const today = new Date().toISOString().split('T')[0]
                            const emailRes = await fetch('/api/send-freelancer-notification', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ nomes, tipo: 'fotografo', referencia: evento.referencia, data_evento: evento.data_evento, local: evento.local, nome_noiva: evento.nome_noiva, nome_noivo: evento.nome_noivo }),
                            })
                            const emailData = await emailRes.json()
                            if (emailRes.ok && emailData.ok) {
                              await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { notif_foto_enviada: today } } }) })
                              setNotifFotoEnviada(today)
                            } else {
                              setNotifFotoErro(emailData.error ?? 'Erro ao enviar')
                            }
                            setSendingNotifFoto(false)
                          }}
                          className={`px-3 py-2 rounded-lg text-[10px] font-semibold tracking-[0.15em] uppercase border transition-all ${
                            notifFotoEnviada ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : !hasTeam ? 'bg-white/[0.03] text-white/20 border-white/10 cursor-not-allowed'
                            : allUnavailable ? 'bg-red-500/10 text-red-400/60 border-red-500/20 cursor-not-allowed'
                            : sendingNotifFoto ? 'bg-purple-500/10 text-purple-300/50 border-purple-500/20 cursor-not-allowed'
                            : notifFotoErro ? 'bg-red-500/15 text-red-300 border-red-500/25 hover:bg-red-500/25'
                            : 'bg-purple-500/15 text-purple-300 border-purple-500/25 hover:bg-purple-500/25'
                          }`}
                        >
                          {sendingNotifFoto ? '...' : notifFotoEnviada ? '✓ Enviado' : !hasTeam ? '🔒 Sem equipa' : allUnavailable ? '🔒 Indisponível' : notifFotoErro ? '⚠ Sem email' : 'Notificar'}
                        </button>
                      </div>
                    </div>
                    {notifFotoErro && (
                      <p className="text-[9px] text-red-400/70 leading-relaxed">Sem email — adiciona na página Equipas de Trabalho</p>
                    )}
                  </div>
                )
              })()}

              {/* Notificação Videógrafo */}
              {(() => {
                const nomes = equipaVideo
                const hasTeam = nomes.length > 0
                const allUnavailable = hasTeam && nomes.every(n => unavailableNames.includes(n.toUpperCase()))
                return (
                  <div className="flex flex-col gap-2 rounded-xl p-4" style={{ background: 'rgba(160,100,240,0.04)', border: '1px solid rgba(160,100,240,0.15)' }}>
                    <p className="text-[9px] tracking-[0.3em] uppercase text-white/30">Videógrafo</p>
                    {nomes.length > 0 && (
                      <p className="text-[11px] text-purple-300/60 truncate">{nomes.join(', ')}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1">
                        <p className="text-[10px] font-mono">
                          {notifVideoEnviada
                            ? <span className="text-green-400/70">{new Date(notifVideoEnviada).toLocaleDateString('pt-PT')}</span>
                            : <span className="text-white/20">Pendente</span>
                          }
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {notifVideoEnviada && (
                          <button
                            onClick={async () => {
                              if (!evento?.referencia) return
                              await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { notif_video_enviada: null } } }) })
                              setNotifVideoEnviada(null)
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white/60 hover:border-white/30 transition-all text-xs"
                            title="Repor como Pendente"
                          >✕</button>
                        )}
                        <button
                          disabled={!hasTeam || sendingNotifVideo || allUnavailable}
                          onClick={async () => {
                            if (!hasTeam || !evento?.referencia || sendingNotifVideo || allUnavailable) return
                            setSendingNotifVideo(true)
                            setNotifVideoErro(null)
                            const today = new Date().toISOString().split('T')[0]
                            const emailRes = await fetch('/api/send-freelancer-notification', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ nomes, tipo: 'videografo', referencia: evento.referencia, data_evento: evento.data_evento, local: evento.local, nome_noiva: evento.nome_noiva, nome_noivo: evento.nome_noivo }),
                            })
                            const emailData = await emailRes.json()
                            if (emailRes.ok && emailData.ok) {
                              await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { notif_video_enviada: today } } }) })
                              setNotifVideoEnviada(today)
                            } else {
                              setNotifVideoErro(emailData.error ?? 'Erro ao enviar')
                            }
                            setSendingNotifVideo(false)
                          }}
                          className={`px-3 py-2 rounded-lg text-[10px] font-semibold tracking-[0.15em] uppercase border transition-all ${
                            notifVideoEnviada ? 'bg-green-500/20 text-green-400 border-green-500/30'
                            : !hasTeam ? 'bg-white/[0.03] text-white/20 border-white/10 cursor-not-allowed'
                            : allUnavailable ? 'bg-red-500/10 text-red-400/60 border-red-500/20 cursor-not-allowed'
                            : sendingNotifVideo ? 'bg-purple-500/10 text-purple-300/50 border-purple-500/20 cursor-not-allowed'
                            : notifVideoErro ? 'bg-red-500/15 text-red-300 border-red-500/25 hover:bg-red-500/25'
                            : 'bg-purple-500/15 text-purple-300 border-purple-500/25 hover:bg-purple-500/25'
                          }`}
                        >
                          {sendingNotifVideo ? '...' : notifVideoEnviada ? '✓ Enviado' : !hasTeam ? '🔒 Sem equipa' : allUnavailable ? '🔒 Indisponível' : notifVideoErro ? '⚠ Sem email' : 'Notificar'}
                        </button>
                      </div>
                    </div>
                    {notifVideoErro && (
                      <p className="text-[9px] text-red-400/70 leading-relaxed">Sem email — adiciona na página Equipas de Trabalho</p>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
        </Section>

        {/* ── Relatório Vídeo ── */}
        {(() => {
          const videografos: string[] = equipaVideo.length > 0 ? equipaVideo : (e.videografo ?? [])
          const tallyBase = 'https://tally.so/r/np88GE'
          const ref = e.referencia ?? ''

          function tallyLink(nomeOperador: string) {
            const params = new URLSearchParams({
              referencia: ref,
              'Nome do Operador': nomeOperador,
            })
            return `${tallyBase}?${params.toString()}`
          }

          function copyLink(idx: number, nome: string) {
            navigator.clipboard.writeText(tallyLink(nome))
            setCopiedVideoIdx(idx)
            setTimeout(() => setCopiedVideoIdx(null), 2000)
          }

          return (
            <Section title="Relatório Vídeo"
              right={
                <span className="text-[9px] tracking-widest text-white/20 uppercase">
                  {relatoriosVideo.length > 0 ? `${relatoriosVideo.length} recebido${relatoriosVideo.length > 1 ? 's' : ''}` : 'Sem relatórios'}
                </span>
              }
            >
              {/* Links por videógrafo */}
              {videografos.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Enviar link do relatório</p>
                  {videografos.map((nome, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-2.5">
                      <span className="text-sm text-white/70 font-medium">{nome}</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={tallyLink(nome)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9px] px-2.5 py-1 rounded-lg border border-white/10 text-white/30 hover:text-white/60 hover:border-white/25 transition-all tracking-widest uppercase"
                        >
                          ↗ Abrir
                        </a>
                        <button
                          onClick={() => copyLink(idx, nome)}
                          className={`text-[9px] px-2.5 py-1 rounded-lg border transition-all tracking-widest uppercase ${
                            copiedVideoIdx === idx
                              ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                              : 'border-white/10 text-white/30 hover:text-white/60 hover:border-white/25'
                          }`}
                        >
                          {copiedVideoIdx === idx ? '✓ Copiado' : '🔗 Copiar link'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/20 italic">Nenhum videógrafo atribuído a este evento.</p>
              )}

              {/* Relatórios recebidos */}
              {relatoriosVideo.length > 0 && (
                <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/[0.05]">
                  <p className="text-[10px] text-white/30 tracking-widest uppercase mb-1">Relatórios recebidos</p>
                  {relatoriosVideo.map((r: any, idx: number) => {
                    const dados = r.dados ?? {}
                    const dataStr = r.criado_em
                      ? new Date(r.criado_em).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : '—'
                    return (
                      <details key={idx} className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors list-none">
                          <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <span className="text-sm text-white/80 font-medium">{r.nome_operador || '—'}</span>
                          </div>
                          <span className="text-[10px] text-white/30">{dataStr}</span>
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
          )
        })()}

        {/* ── Armazenamento ── */}
        <Section title="Armazenamento">
          <div className="grid grid-cols-2 gap-4">
            <EditMultiField label="Nome do Disco" value={e.nome_disco ?? []} field="nome_disco" eventId={e.id} onSaved={handleSaved} />
            <EditMultiField label="Backup Disco" value={e.backup_disco ?? []} field="backup_disco" eventId={e.id} onSaved={handleSaved} />
          </div>
        </Section>

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
                      if (!evento?.referencia) return
                      await fetch('/api/portais', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ referencia: evento.referencia, updates: { settings: { [`${urlKey}_url`]: url } } }) })
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

        {/* ── Dados dos Noivos ── */}
        <Section title="Dados dos Noivos">
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-3">
              <span className="text-[9px] tracking-[0.4em] text-gold/40 uppercase border-b border-white/5 pb-1">Noiva</span>
              <EditField label="Nome" value={e.nome_noiva} field="nome_noiva" eventId={e.id} onSaved={handleSaved} />
              <EditField label="Email" value={e.email_noiva} field="email_noiva" eventId={e.id} type="email" onSaved={handleSaved} />
              <EditField label="Telemóvel" value={e.tel_noiva} field="tel_noiva" eventId={e.id} type="tel" onSaved={handleSaved} />
              <EditField label="Morada" value={e.morada_noiva} field="morada_noiva" eventId={e.id} onSaved={handleSaved} />
              <EditField label="Nº C. Cidadão" value={e.cc_noiva} field="cc_noiva" eventId={e.id} onSaved={handleSaved} />
              <EditField label="NIF" value={e.nif_noiva} field="nif_noiva" eventId={e.id} onSaved={handleSaved} />
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[9px] tracking-[0.4em] text-gold/40 uppercase border-b border-white/5 pb-1">Noivo</span>
              <EditField label="Nome" value={e.nome_noivo} field="nome_noivo" eventId={e.id} onSaved={handleSaved} />
              <EditField label="Email" value={e.email_noivo} field="email_noivo" eventId={e.id} type="email" onSaved={handleSaved} />
              <EditField label="Telemóvel" value={e.tel_noivo} field="tel_noivo" eventId={e.id} type="tel" onSaved={handleSaved} />
              <EditField label="Morada" value={e.morada_noivo} field="morada_noivo" eventId={e.id} onSaved={handleSaved} />
              <EditField label="Nº C. Cidadão" value={e.cc_noivo} field="cc_noivo" eventId={e.id} onSaved={handleSaved} />
              <EditField label="NIF" value={e.nif_noivo} field="nif_noivo" eventId={e.id} onSaved={handleSaved} />
            </div>
          </div>
        </Section>

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
