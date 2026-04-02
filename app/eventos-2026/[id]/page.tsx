'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
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
function EditField({ label, value, field, eventId, type = 'text', large = false, suffix, onSaved }: {
  label: string; value: string | number | null; field: string; eventId: string
  type?: 'text' | 'number' | 'email' | 'tel' | 'url' | 'date'; large?: boolean
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
        className={`text-left hover:bg-white/5 px-2 py-1 -mx-2 rounded-lg transition-colors flex items-center gap-2 ${large ? 'text-2xl font-light text-white' : 'text-sm text-white/80 hover:text-white'}`}>
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
  if (green.includes(val))
    return { box: 'bg-green-500/10 border-green-500/25', dot: 'bg-green-400',  lbl: 'text-green-300/70',  date: 'text-green-200/80',  sel: 'bg-green-500/15 border-green-500/30 hover:border-green-400/50 text-green-100/90', arr: 'text-green-400/60' }
  if (blue.includes(val))
    return { box: 'bg-blue-500/10 border-blue-500/25',   dot: 'bg-blue-400',   lbl: 'text-blue-300/70',   date: 'text-blue-200/80',   sel: 'bg-blue-500/15 border-blue-500/30 hover:border-blue-400/50 text-blue-100/90',   arr: 'text-blue-400/60' }
  return       { box: 'bg-yellow-500/10 border-yellow-500/25', dot: 'bg-yellow-400', lbl: 'text-yellow-300/70', date: 'text-yellow-200/80', sel: 'bg-yellow-500/15 border-yellow-500/30 hover:border-yellow-400/50 text-yellow-100/90', arr: 'text-yellow-400/60' }
}

// ─── Linha de estado com dropdown e prazo opcional ─────────────────────────────
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

// ─── Página principal ──────────────────────────────────────────────────────────
export default function EventoPage() {
  const { id } = useParams<{ id: string }>()
  const [evento, setEvento] = useState<Evento | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [valorVideografo, setValorVideografo] = useState<number>(0)
  const [valorEditorVideo, setValorEditorVideo] = useState<number>(0)
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [fotosDataEntrada, setFotosDataEntrada] = useState<string | null>(null)
  const [albumDataPrevista, setAlbumDataPrevista] = useState<string | null>(null)
  const [albumNotionId, setAlbumNotionId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/eventos-notion/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); setLoading(false); return }
        const ev = d.event
        setEvento(ev)
        setLoading(false)

        if (ev.referencia) {
          // Carregar pagamentos
          fetch(`/api/pagamentos-by-ref?ref=${encodeURIComponent(ev.referencia)}`)
            .then(r => r.json())
            .then(p => { if (p.payments) setPagamentos(p.payments) })

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
        }
      })
      .catch(() => { setError('Erro de ligação'); setLoading(false) })
  }, [id])

  function handleSaved(field: string, val: any) {
    setEvento(prev => prev ? { ...prev, [field]: val } : prev)

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

  // Prazos automáticos
  const prazoSelFotos = e.data_evento ? addCalendarDays(e.data_evento, 30) : null
  const prazoVideo    = e.data_evento ? addWorkingDays(e.data_evento, 180) : null

  return (
    <main className="min-h-screen px-4 py-10 max-w-3xl mx-auto">
      <Link href="/eventos-2026" className="text-xs tracking-widest text-white/30 hover:text-gold transition-colors">
        ‹ VOLTAR AOS EVENTOS
      </Link>

      {/* ── Header editável ── */}
      <div className="mt-8 mb-2">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-sm tracking-[0.3em] text-gold/70 uppercase mb-1 font-medium">{e.referencia || 'Sem referência'}</p>
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
            {e.notion_url && (
              <a href={e.notion_url} target="_blank" rel="noopener noreferrer"
                className="text-xs text-white/20 hover:text-gold transition-colors tracking-widest">
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
        <p className="text-[10px] text-white/15 mt-3 tracking-wider">Clica em qualquer campo para editar · guarda automaticamente no Notion</p>
      </div>

      <div className="h-px bg-gold/15 my-7" />

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
          <div className="grid grid-cols-3 gap-4">
            <EditField label="Valor Fotografia" value={e.valor_foto} field="valor_foto" eventId={e.id} type="number" suffix="€" onSaved={handleSaved} />
            <EditField label="Valor Vídeo" value={e.valor_video} field="valor_video" eventId={e.id} type="number" suffix="€" onSaved={handleSaved} />
            <EditField label="Valor Extras" value={e.valor_extras} field="valor_extras" eventId={e.id} type="number" suffix="€" onSaved={handleSaved} />
          </div>

          {/* Despesas */}
          <div className="pt-2 border-t border-white/[0.05]">
            <h3 className="text-[10px] tracking-[0.35em] text-gold uppercase mb-3">Despesas</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">Valor Videógrafo</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" value={valorVideografo}
                  onChange={ev => setValorVideografo(Number(ev.target.value))}
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
              <span className="text-[10px] text-white/20">(Vídeo + Extras − Videógrafo − Editor Vídeo)</span>
            </div>
            <span className="text-green-400 font-bold text-lg">
              {((e.valor_video ?? 0) + (e.valor_extras ?? 0) - valorVideografo - valorEditorVideo).toLocaleString('pt-PT')} €
            </span>
          </div>

          {/* Fases de pagamento — dados reais do Notion */}
          <div className="pt-2 border-t border-white/[0.05]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] tracking-[0.3em] text-white/25 uppercase">Fases de Pagamento</span>
              <a href="/financas" className="text-[10px] text-white/20 hover:text-gold transition-colors tracking-wider">
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

                return ['ADJUDICAÇÃO','REFORÇO','FINAL'].map(label => {
                  // Todos os pagamentos para esta fase (pode haver vários parciais)
                  const pags = pagamentos.filter(p => p.fase_pagamento.includes(label))
                  const totalPago = pags.reduce((s, p) => s + (p.valor_liquidado ?? 0), 0)
                  const valorFase = faseValores[label]
                  const falta = Math.max(0, valorFase - totalPago)
                  const liquidado = totalPago >= valorFase && valorFase > 0
                  const parcial = totalPago > 0 && !liquidado
                  const pct = valorFase > 0 ? Math.min(100, Math.round((totalPago / valorFase) * 100)) : 0

                  // Último pagamento para data/método
                  const lastPag = pags[pags.length - 1]
                  const metodos = [...new Set(pags.flatMap(p => p.metodo_pagamento))]

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
                estado={e.sel_fotos_estado} options={['Aguardar','Em Edição','Entregue']}
                field="sel_fotos_estado" eventId={e.id} onSaved={handleSaved} />
            )}
            {prazoVideo && (
              <EstadoRow label="Prazo Entrega Vídeo (180 dias úteis)" dateStr={prazoVideo}
                estado={e.video_estado} options={['Aguardar','Em Edição','Entregue']}
                field="video_estado" eventId={e.id} onSaved={handleSaved} />
            )}
            <EstadoRow label="Fotos para Edição"
              dateStr={fotosDataEntrada ? addWorkingDays(fotosDataEntrada, 30) : null}
              estado={e.fotos_edicao_estado} options={['Aguardar','Enviado','Em Edição','Entregue']}
              field="fotos_edicao_estado" eventId={e.id} onSaved={handleSaved} />
            <EstadoRow label="Álbum"
              dateStr={albumDataPrevista}
              estado={e.album_estado} options={['Aguardar','Em Edição','Em Aprovação','Aprovado','Entregue']}
              field="album_estado" eventId={e.id} onSaved={handleSaved}
              href={`/albuns-casamento?ref=${encodeURIComponent(e.referencia)}`} />
          </div>

          {/* Link rápido → Seleção dos Noivos */}
          {e.referencia && (
            <Link href={`/fotos-selecao?ref=${encodeURIComponent(e.referencia)}`}
              className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-gold/20 transition-all group">
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
            <EditMultiField label="Fotógrafo" value={e.fotografo ?? []} field="fotografo" eventId={e.id} onSaved={handleSaved} />
            <EditMultiField label="Videógrafo" value={e.videografo ?? []} field="videografo" eventId={e.id} onSaved={handleSaved} />
            <EditField label="Editor de Fotos" value={e.editor_fotos} field="editor_fotos" eventId={e.id} onSaved={handleSaved} />
            <EditField label="Agendamento Email" value={e.agendamento_email} field="agendamento_email" eventId={e.id} onSaved={handleSaved} />
          </div>
        </Section>

        {/* ── Armazenamento ── */}
        <Section title="Armazenamento">
          <div className="grid grid-cols-2 gap-4">
            <EditMultiField label="Nome do Disco" value={e.nome_disco ?? []} field="nome_disco" eventId={e.id} onSaved={handleSaved} />
            <EditMultiField label="Backup Disco" value={e.backup_disco ?? []} field="backup_disco" eventId={e.id} onSaved={handleSaved} />
          </div>
        </Section>

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
    </main>
  )
}
