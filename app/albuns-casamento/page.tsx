'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type Album = {
  id: string
  nome: string
  status: string | null
  data_entrega_fotos: string | null
  prazo_maquete: string | null
  data_aprovacao: string | null
  prazo_album: string | null
  entrega_album: string | null
  prazo_final_maquete: string | null
  data_prevista_entrega: string | null
  ref_evento: string | null
  ref_album: string | null
  design: string | null
  num_fotografias: string | null
  numero_fotografias: string | null
  opcao: string | null
  texto_album: string | null
  texto_caixa: string | null
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function fmt(d: string | null) {
  if (!d) return null
  const dt = new Date(d.split('T')[0] + 'T00:00:00')
  if (isNaN(dt.getTime())) return null
  return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()]} ${dt.getFullYear()}`
}

const STATUS_OPTIONS = ['NOVO ÁLBUM','EM EDIÇÃO','PARA APROVAÇÃO','ALTERAÇÕES','APROVADO','ENTREGUE']
const OPCAO_OPTIONS  = ['SEM CAIXA','COM CAIXA']

function statusCfg(s: string | null) {
  switch (s) {
    case 'EM EDIÇÃO':      return { bg: 'bg-blue-500/15',   border: 'border-blue-500/40',   text: 'text-blue-300',   dot: 'bg-blue-400',   glow: 'shadow-blue-500/20',   bar: 'bg-blue-500' }
    case 'PARA APROVAÇÃO': return { bg: 'bg-amber-500/15',  border: 'border-amber-500/40',  text: 'text-amber-300',  dot: 'bg-amber-400',  glow: 'shadow-amber-500/20',  bar: 'bg-amber-500' }
    case 'ALTERAÇÕES':     return { bg: 'bg-red-500/15',    border: 'border-red-500/40',    text: 'text-red-300',    dot: 'bg-red-400',    glow: 'shadow-red-500/20',    bar: 'bg-red-500' }
    case 'APROVADO':       return { bg: 'bg-emerald-500/15',border: 'border-emerald-500/40',text: 'text-emerald-300',dot: 'bg-emerald-400',glow: 'shadow-emerald-500/20',bar: 'bg-emerald-500' }
    case 'ENTREGUE':       return { bg: 'bg-purple-500/15', border: 'border-purple-500/40', text: 'text-purple-300', dot: 'bg-purple-400', glow: 'shadow-purple-500/20', bar: 'bg-purple-500' }
    default:               return { bg: 'bg-white/5',       border: 'border-white/15',      text: 'text-white/40',   dot: 'bg-white/25',   glow: 'shadow-white/5',       bar: 'bg-white/20' }
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

async function patchAlbum(id: string, field: string, value: any) {
  await fetch(`/api/albuns-casamento/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: value }),
  })
}

// Mapeia status do álbum → estado do evento
function toEventoEstado(s: string): string {
  switch (s) {
    case 'EM EDIÇÃO':      return 'Em Edição'
    case 'PARA APROVAÇÃO': return 'Em Aprovação'
    case 'APROVADO':       return 'Aprovado'
    case 'ENTREGUE':       return 'Entregue'
    case 'ALTERAÇÕES':     return 'Em Edição'
    default:               return 'Aguardar'   // NOVO ÁLBUM
  }
}

async function syncEventoEstado(refEvento: string, estado: string) {
  const r = await fetch(`/api/eventos-by-ref?ref=${encodeURIComponent(refEvento)}`)
  const d = await r.json()
  if (!d.id) return
  await fetch(`/api/eventos-notion/${d.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ album_estado: toEventoEstado(estado) }),
  })
}

// ── Célula editável ───────────────────────────────────────────────────────────
function EditCell({ value, field, rowId, onSaved, type = 'text', placeholder = '—' }: {
  value: string | null; field: string; rowId: string
  onSaved: (field: string, val: any) => void
  type?: 'text' | 'date'; placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value ?? '')
  const [saving, setSaving]   = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(value ?? '') }, [value])
  useEffect(() => { if (editing) ref.current?.focus() }, [editing])

  async function save() {
    setEditing(false)
    if (draft === (value ?? '')) return
    setSaving(true)
    await patchAlbum(rowId, field, draft || null)
    onSaved(field, draft || null)
    setSaving(false)
  }

  if (editing) return (
    <input ref={ref} type={type} value={draft}
      onChange={e => setDraft(e.target.value)} onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(value ?? ''); setEditing(false) } }}
      className="bg-zinc-800 border border-gold/40 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-gold w-full [color-scheme:dark]"
    />
  )

  return (
    <button onClick={() => setEditing(true)} className="text-left w-full group/e flex items-center gap-1.5 hover:bg-white/5 rounded px-1 -mx-1 py-0.5 transition-colors">
      <span className={saving ? 'opacity-40' : ''}>
        {type === 'date'
          ? <span className="text-white/70 text-sm">{fmt(value) ?? <span className="text-white/20 italic text-xs">{placeholder}</span>}</span>
          : value
            ? <span className="text-white/80 text-sm">{value}</span>
            : <span className="text-white/20 italic text-xs">{placeholder}</span>
        }
      </span>
      <span className="text-[9px] text-white/15 opacity-0 group-hover/e:opacity-100 shrink-0">✎</span>
    </button>
  )
}

// ── Status dropdown ───────────────────────────────────────────────────────────
function StatusSelect({ value, rowId, refEvento, onSaved }: {
  value: string | null; rowId: string; refEvento?: string | null
  onSaved: (f: string, v: any) => void
}) {
  const [saving, setSaving] = useState(false)
  const cfg = statusCfg(value)
  async function onChange(v: string) {
    setSaving(true)
    // 1. Actualiza status no álbum
    await patchAlbum(rowId, 'status', v)
    onSaved('status', v)

    // 2. Se APROVADO → auto-preenche datas
    if (v === 'APROVADO') {
      const todayStr = today()
      const prazoStr = addDays(todayStr, 25)
      await Promise.all([
        patchAlbum(rowId, 'data_aprovacao', todayStr),
        patchAlbum(rowId, 'data_prevista_entrega', prazoStr),
      ])
      onSaved('data_aprovacao', todayStr)
      onSaved('data_prevista_entrega', prazoStr)
    }

    // 3. Sincroniza estado na ficha do evento (se tiver REF. EVENTO)
    if (refEvento) {
      syncEventoEstado(refEvento, v)
    }

    setSaving(false)
  }
  return (
    <div className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl border w-48 ${cfg.bg} ${cfg.border} shadow-lg ${cfg.glow}`}>
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot} ${!saving ? 'animate-pulse' : ''}`} />
      <select value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={saving}
        className={`appearance-none bg-transparent text-xs font-semibold tracking-widest focus:outline-none cursor-pointer pr-4 w-full ${cfg.text} uppercase`}>
        <option value="" className="bg-zinc-900 text-white">— Estado —</option>
        {STATUS_OPTIONS.map(o => <option key={o} value={o} className="bg-zinc-900 text-white font-normal">{o}</option>)}
      </select>
      <span className={`pointer-events-none text-[9px] absolute right-2 top-1/2 -translate-y-1/2 ${cfg.text}`}>▾</span>
    </div>
  )
}

// ── Modal Ficha ───────────────────────────────────────────────────────────────
function FichaModal({ row, onClose, onSaved }: {
  row: Album; onClose: () => void; onSaved: (field: string, val: any) => void
}) {
  const cfg = statusCfg(row.status)

  function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] tracking-[0.35em] text-white/25 uppercase">{label}</span>
        {children}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" />
      <div className="relative z-10 bg-[#111] border border-white/[0.08] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Barra de cor no topo */}
        <div className={`h-0.5 w-full ${cfg.bar}`} />

        {/* Header */}
        <div className="px-8 pt-7 pb-5 border-b border-white/[0.05]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">Álbum de Casamento</p>
              <h2 className="text-2xl font-light tracking-[0.15em] text-white uppercase">{row.nome || '—'}</h2>
              {row.ref_album && <p className="text-xs text-white/30 mt-1 tracking-widest">{row.ref_album}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusSelect value={row.status} rowId={row.id} refEvento={row.ref_evento} onSaved={onSaved} />
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all text-sm">✕</button>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="px-8 py-6 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">

          {/* REF. EVENTO em destaque */}
          <div className="bg-gold/5 border border-gold/20 rounded-2xl p-4">
            <span className="text-[9px] tracking-[0.4em] text-gold/40 uppercase block mb-1.5">Referência do Evento</span>
            <EditCell value={row.ref_evento} field="ref_evento" rowId={row.id} onSaved={onSaved} placeholder="Ex: CAS_034_26_KP" />
          </div>

          {/* Linha 1: Nome + REF Álbum */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome">
              <EditCell value={row.nome} field="nome" rowId={row.id} onSaved={onSaved} placeholder="Nome do álbum" />
            </Field>
            <Field label="REF. Álbum">
              <EditCell value={row.ref_album} field="ref_album" rowId={row.id} onSaved={onSaved} placeholder="Referência" />
            </Field>
          </div>

          {/* Datas — grid 3 col */}
          <div>
            <p className="text-[9px] tracking-[0.35em] text-white/20 uppercase mb-3">Datas</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Entrega de Fotos',     field: 'data_entrega_fotos',    value: row.data_entrega_fotos },
                { label: 'Prazo Maquete',         field: 'prazo_maquete',         value: row.prazo_maquete },
                { label: 'Prazo Final Maquete',   field: null,                    value: row.prazo_final_maquete },
                { label: 'Data Aprovação Álbum',  field: 'data_aprovacao',        value: row.data_aprovacao },
                { label: 'Prazo Álbum',           field: 'prazo_album',           value: row.prazo_album },
                { label: 'Data Prevista Entrega', field: 'data_prevista_entrega', value: row.data_prevista_entrega },
                { label: 'Entrega de Álbum',      field: null,                    value: row.entrega_album },
              ].map(({ label, field, value }) => (
                <div key={label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
                  <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase block mb-1">{label}</span>
                  {field
                    ? <EditCell value={value} field={field} rowId={row.id} type="date" onSaved={onSaved} />
                    : <span className="text-sm text-white/50">{fmt(value) ?? '—'}</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* Opção */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Opção (Caixa)">
              <select value={row.opcao ?? ''} onChange={async e => { const v = e.target.value||null; await patchAlbum(row.id,'opcao',v); onSaved('opcao',v) }}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/60 focus:outline-none focus:border-gold/40">
                <option value="" className="bg-zinc-900">— Opção —</option>
                {OPCAO_OPTIONS.map(o => <option key={o} value={o} className="bg-zinc-900">{o}</option>)}
              </select>
            </Field>
            <Field label="Design">
              <EditCell value={row.design} field="design" rowId={row.id} onSaved={onSaved} placeholder="—" />
            </Field>
          </div>

          {/* Fotografias */}
          <Field label="N.º de Fotografias">
            <EditCell value={row.num_fotografias} field="num_fotografias" rowId={row.id} onSaved={onSaved} placeholder="—" />
          </Field>

          {/* Textos */}
          <Field label="Texto para Álbum">
            <EditCell value={row.texto_album} field="texto_album" rowId={row.id} onSaved={onSaved} placeholder="—" />
          </Field>
          <Field label="Texto para Caixa">
            <EditCell value={row.texto_caixa} field="texto_caixa" rowId={row.id} onSaved={onSaved} placeholder="—" />
          </Field>
        </div>
      </div>
    </div>
  )
}

// ── Card individual ───────────────────────────────────────────────────────────
function AlbumCard({ row, onOpen, onDelete, confirmDelete, setConfirmDelete, handleSaved }: {
  row: Album
  onOpen: () => void
  onDelete: () => void
  confirmDelete: boolean
  setConfirmDelete: (v: boolean) => void
  handleSaved: (field: string, val: any) => void
}) {
  const cfg = statusCfg(row.status)

  return (
    <div className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl overflow-hidden transition-all duration-300">
      {/* Barra colorida lateral */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${cfg.bar}`} />

      <div className="pl-5 pr-4 py-4 flex items-center gap-4">
        {/* Nome + ref */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-light tracking-wider text-white/90 truncate uppercase">{row.nome}</p>
          {row.ref_evento && (
            <p className="text-[10px] text-gold/50 tracking-widest mt-0.5 font-mono">{row.ref_evento}</p>
          )}
        </div>

        {/* Status */}
        <div className="shrink-0">
          <StatusSelect value={row.status} rowId={row.id} refEvento={row.ref_evento} onSaved={handleSaved} />
        </div>

        {/* Ações */}
        <div className="shrink-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onOpen}
            className="w-8 h-8 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white hover:border-white/25 hover:bg-white/10 transition-all text-sm">
            👁
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button onClick={onDelete}
                className="text-[10px] px-2.5 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors">
                Sim
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="text-[10px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:bg-white/10 transition-colors">
                Não
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)}
              className="w-8 h-8 flex items-center justify-center rounded-xl text-white/15 hover:text-red-400 transition-colors text-sm">
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
function AlbunsCasamentoPageInner() {
  const [rows, setRows]               = useState<Album[]>([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [adding, setAdding]           = useState(false)
  const [error, setError]             = useState('')
  const searchParams = useSearchParams()
  const [search, setSearch]           = useState(searchParams.get('ref') ?? '')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [fichaOpen, setFichaOpen]     = useState<Album | null>(null)

  const loadRows = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const d = await fetch('/api/albuns-casamento').then(r => r.json())
      if (d.error) { setError(d.error); return }
      setRows(d.rows)
    } catch { setError('Erro de ligação') }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { loadRows() }, [loadRows])

  function handleSaved(rowId: string, field: string, val: any) {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: val } : r))
    setFichaOpen(prev => prev?.id === rowId ? { ...prev, [field]: val } : prev)
  }

  async function addRow() {
    setAdding(true)
    const d = await fetch('/api/albuns-casamento', { method: 'POST' }).then(r => r.json())
    if (d.row) setRows(prev => [d.row, ...prev])
    setAdding(false)
  }

  async function deleteRow(id: string) {
    await fetch(`/api/albuns-casamento/${id}`, { method: 'DELETE' })
    setRows(prev => prev.filter(r => r.id !== id))
    setConfirmDelete(null)
    if (fichaOpen?.id === id) setFichaOpen(null)
  }

  const filtered = rows.filter(r => !search || r.nome?.toLowerCase().includes(search.toLowerCase()))

  // Agrupar por status
  const order = ['EM EDIÇÃO','PARA APROVAÇÃO','ALTERAÇÕES','APROVADO','NOVO ÁLBUM','ENTREGUE']
  const grouped = order.reduce((acc, s) => {
    const items = filtered.filter(r => (r.status ?? 'NOVO ÁLBUM') === s)
    if (items.length) acc.push({ status: s, items })
    return acc
  }, [] as { status: string; items: Album[] }[])
  const ungrouped = filtered.filter(r => !order.includes(r.status ?? 'NOVO ÁLBUM'))
  if (ungrouped.length) grouped.push({ status: 'Outros', items: ungrouped })

  return (
    <main className="min-h-screen px-4 py-12 max-w-5xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] text-white/30 hover:text-gold transition-colors mb-12 uppercase">
        ‹ Voltar ao Menu
      </Link>

      {/* Header */}
      <div className="mb-10 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">RL Photo.Video</p>
          <h1 className="text-3xl font-light tracking-[0.2em] text-white uppercase">Álbuns de Casamento</h1>
          <div className="mt-4 h-px w-12 bg-gold/50" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar..."
            className="bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white/60 focus:outline-none focus:border-gold/30 w-48 placeholder:text-white/15 transition-colors" />
          <button onClick={() => loadRows(true)} disabled={refreshing}
            className="flex items-center gap-2 text-[11px] tracking-widest text-white/30 hover:text-white/70 px-4 py-2.5 rounded-xl border border-white/[0.08] hover:border-white/20 transition-all disabled:opacity-30 uppercase">
            <span className={refreshing ? 'animate-spin inline-block' : 'inline-block'}>↻</span>
            {refreshing ? 'A atualizar...' : 'Atualizar'}
          </button>
          <button onClick={addRow} disabled={adding}
            className="flex items-center gap-2 text-[11px] tracking-widest text-gold/70 hover:text-gold px-4 py-2.5 rounded-xl border border-gold/20 hover:border-gold/50 bg-gold/5 hover:bg-gold/10 transition-all disabled:opacity-30 uppercase">
            {adding ? '...' : '+ Novo Álbum'}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-3">
            <div className="w-6 h-6 border border-gold/30 border-t-gold/80 rounded-full animate-spin" />
            <span className="text-[10px] tracking-[0.4em] text-white/20 uppercase">A carregar</span>
          </div>
        </div>
      )}
      {error && <div className="text-center py-24 text-red-400/60 text-sm">{error}</div>}

      {!loading && !error && (
        <>
          <p className="text-[10px] text-white/15 tracking-[0.3em] uppercase mb-6">{filtered.length} álbuns</p>

          <div className="flex flex-col gap-8">
            {grouped.map(({ status, items }) => {
              const cfg = statusCfg(status)
              return (
                <div key={status}>
                  {/* Cabeçalho do grupo */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    <span className={`text-[10px] tracking-[0.4em] uppercase font-medium ${cfg.text}`}>{status}</span>
                    <span className="text-[10px] text-white/15 tracking-widest">({items.length})</span>
                    <div className="flex-1 h-px bg-white/[0.04]" />
                  </div>
                  {/* Cards */}
                  <div className="flex flex-col gap-1.5">
                    {items.map(row => (
                      <AlbumCard
                        key={row.id}
                        row={row}
                        onOpen={() => setFichaOpen(row)}
                        onDelete={() => deleteRow(row.id)}
                        confirmDelete={confirmDelete === row.id}
                        setConfirmDelete={v => setConfirmDelete(v ? row.id : null)}
                        handleSaved={(f, v) => handleSaved(row.id, f, v)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div className="text-center py-24 text-white/15 text-[10px] tracking-[0.5em] uppercase">
                {search ? 'Nenhum resultado' : 'Sem registos'}
              </div>
            )}
          </div>
        </>
      )}

      {fichaOpen && (
        <FichaModal
          row={fichaOpen}
          onClose={() => setFichaOpen(null)}
          onSaved={(f, v) => handleSaved(fichaOpen.id, f, v)}
        />
      )}
    </main>
  )
}

export default function AlbunsCasamentoPage() {
  return (
    <Suspense>
      <AlbunsCasamentoPageInner />
    </Suspense>
  )
}
