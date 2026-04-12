'use client'

import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

type FotoSelecao = {
  id: string
  nome_noivos: string
  referencia: string
  date: string | null
  data_entrada: string | null
  sessao_noivos: string
  fotos_noiva: string
  fotos_noivo: string
  convidados: string
  cerimonia: string
  bolo_bouquet: string
  sala_animacao: string
  fotos_album: string
  detalhes: string
}

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function fmt(d: string | null) {
  if (!d) return null
  const dt = new Date(d.split('T')[0] + 'T00:00:00')
  if (isNaN(dt.getTime())) return null
  return `${String(dt.getDate()).padStart(2,'0')} ${MESES[dt.getMonth()]} ${dt.getFullYear()}`
}

async function patchRow(id: string, field: string, value: any) {
  await fetch(`/api/fotos-selecao/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [field]: value }),
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
    await patchRow(rowId, field, draft || null)
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

// ── Print / PDF ───────────────────────────────────────────────────────────────
const FICHA_SECTIONS = [
  { label: 'Sessão Noivos',  field: 'sessao_noivos' as const },
  { label: 'Fotos da Noiva', field: 'fotos_noiva' as const },
  { label: 'Fotos do Noivo', field: 'fotos_noivo' as const },
  { label: 'Convidados',     field: 'convidados' as const },
  { label: 'Cerimónia',      field: 'cerimonia' as const },
  { label: 'Bolo e Bouquet', field: 'bolo_bouquet' as const },
  { label: 'Sala e Animação',field: 'sala_animacao' as const },
  { label: 'Fotos p/Álbum',  field: 'fotos_album' as const },
]

function printFicha(row: FotoSelecao) {
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) return
  w.document.write(`
    <!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>Ficha Seleção — ${row.nome_noivos}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #111; padding: 40px; }
      .header { border-bottom: 2px solid #C9A84C; padding-bottom: 16px; margin-bottom: 24px; }
      .brand { font-size: 10px; letter-spacing: 4px; color: #999; text-transform: uppercase; margin-bottom: 4px; }
      .title { font-size: 24px; font-weight: 300; letter-spacing: 4px; text-transform: uppercase; color: #111; }
      .meta { display: flex; gap: 24px; margin-top: 8px; font-size: 12px; color: #666; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
      .field { display: flex; flex-direction: column; gap: 4px; }
      .field-label { font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: #aaa; }
      .field-value { font-size: 16px; font-weight: 600; color: #111; border-bottom: 1px solid #eee; padding-bottom: 4px; min-height: 28px; }
      .detalhes-box { background: #f9f9f9; border: 1px solid #eee; border-radius: 8px; padding: 16px; }
      .footer { margin-top: 32px; font-size: 10px; color: #ccc; text-align: right; letter-spacing: 2px; }
      @media print { body { padding: 20px; } }
    </style></head><body>
    <div class="header">
      <div class="brand">RL PHOTO.VIDEO</div>
      <div class="title">Ficha Seleção de Fotos</div>
      <div class="meta">
        <span><strong>Noivos:</strong> ${row.nome_noivos || '—'}</span>
        <span><strong>Referência:</strong> ${row.referencia || '—'}</span>
        <span><strong>Data Evento:</strong> ${fmt(row.date) ?? '—'}</span>
        <span><strong>Data Entrada:</strong> ${fmt(row.data_entrada) ?? '—'}</span>
      </div>
    </div>
    <div class="grid">
      ${FICHA_SECTIONS.map(s => `
        <div class="field">
          <div class="field-label">${s.label}</div>
          <div class="field-value">${row[s.field] || '—'}</div>
        </div>
      `).join('')}
    </div>
    ${row.detalhes ? `
      <div class="detalhes-box">
        <div class="field-label" style="margin-bottom:8px">Detalhes</div>
        <p style="font-size:13px;color:#444;line-height:1.6">${row.detalhes}</p>
      </div>
    ` : ''}
    <div class="footer">RL PHOTO.VIDEO · Ficha Seleção Noivos</div>
    <script>window.onload = () => { window.print(); }</script>
    </body></html>
  `)
  w.document.close()
}

const EDITORS = ['Alexandre Capão', 'Patrício Ferreira', 'Sónia Carvalho', 'Rui Garrido', 'Bruno de Carvalho', 'Pedro Martins', 'Leandro Valente']
const ALBUM_EDITORS = ['Alexandre Capão', 'Patrício Ferreira', 'Sónia Carvalho', 'Rui Garrido', 'Bruno de Carvalho', 'Pedro Martins', 'Leandro Valente']

// ── Modal Ficha ───────────────────────────────────────────────────────────────
function FichaModal({ row, onClose, onSaved }: {
  row: FotoSelecao; onClose: () => void; onSaved: (field: string, val: any) => void
}) {
  const [editor, setEditor]                   = useState<string | null>(null)
  const [editorAlbum, setEditorAlbum]         = useState<string | null>(null)
  const [editorLoading, setEditorLoading]     = useState(true)
  const [editorSaving, setEditorSaving]       = useState(false)
  const [editorAlbumSaving, setEditorAlbumSaving] = useState(false)
  const [editorFeedback, setEditorFeedback]   = useState('')

  useEffect(() => {
    fetch(`/api/fotos-selecao-editor?notion_page_id=${row.id}`)
      .then(r => r.json())
      .then(d => { setEditor(d.editor ?? null); setEditorAlbum(d.editor_album ?? null); setEditorLoading(false) })
      .catch(() => setEditorLoading(false))
  }, [row.id])

  async function handleEditorChange(name: string) {
    const next = name || null
    setEditorSaving(true)
    setEditorFeedback('')

    // 1. Persist editor selection
    await fetch('/api/fotos-selecao-editor', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notion_page_id: row.id, editor: next }),
    })

    // 2. Create freelancer_edicao entry (basic — editor uses the Ver Seleção button to see details)
    if (next) {
      try {
        const { freelancers } = await fetch('/api/freelancers').then(r => r.json())
        const fl = (freelancers ?? []).find((f: any) =>
          f.nome.trim().toLowerCase() === next.trim().toLowerCase()
        )
        if (fl) {
          // Only create if no entry already exists for this nome + freelancer
          const existingRes = await fetch(`/api/freelancer-edicao?freelancer_id=${fl.id}`).then(r => r.json())
          const already = (existingRes.edicao ?? []).find((e: any) =>
            e.nome === (row.nome_noivos || 'Sem nome')
          )
          if (!already) {
            await fetch('/api/freelancer-edicao', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                freelancer_id:  fl.id,
                nome:           row.nome_noivos || 'Sem nome',
                status:         'NOVO TRABALHO',
                data_casamento: row.date ?? null,
              }),
            })
          }
          setEditorFeedback(`✓ Enviado para ${fl.nome}`)
        } else {
          setEditorFeedback('⚠ Editor não encontrado nos freelancers')
        }
      } catch {
        setEditorFeedback('⚠ Erro ao criar entrada')
      }
    }

    setEditor(next)
    setEditorSaving(false)
    if (next) setTimeout(() => setEditorFeedback(''), 4000)
  }

  async function handleEditorAlbumChange(name: string) {
    const next = name || null
    setEditorAlbumSaving(true)

    // 1. Save editor_album assignment
    await fetch('/api/fotos-selecao-editor', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notion_page_id: row.id, editor_album: next }),
    })

    // 2. Create/update album entry in albuns_casamento
    if (next) {
      await fetch('/api/albuns-casamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: row.nome_noivos || 'Sem nome',
          ref_evento: row.referencia || null,
          num_fotografias: row.fotos_album || null,
          check_existing: true,
        }),
      })

      // 3. Create freelancer_album entry so it appears in the editor's portal
      try {
        const { freelancers } = await fetch('/api/freelancers').then(r => r.json())
        const fl = (freelancers ?? []).find((f: any) =>
          f.nome.trim().toLowerCase() === next.trim().toLowerCase()
        )
        if (fl) {
          const existingRes = await fetch(`/api/freelancer-album?freelancer_id=${fl.id}`).then(r => r.json())
          const already = (existingRes.album ?? []).find((a: any) =>
            a.nome === (row.nome_noivos || 'Sem nome')
          )
          if (!already) {
            await fetch('/api/freelancer-album', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                freelancer_id: fl.id,
                nome: row.nome_noivos || 'Sem nome',
                status: 'AGUARDAR',
                data_casamento: row.date ?? null,
                referencia_album: row.referencia || null,
              }),
            })
          }
        }
      } catch { /* silently ignore */ }
    }

    setEditorAlbum(next)
    setEditorAlbumSaving(false)
  }

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

        {/* Barra dourada no topo */}
        <div className="h-0.5 w-full bg-gold/60" />

        {/* Header */}
        <div className="px-8 pt-7 pb-5 border-b border-white/[0.05]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">Ficha Seleção de Fotos</p>
              <h2 className="text-2xl font-light tracking-[0.15em] text-white uppercase">{row.nome_noivos || '—'}</h2>
              {row.referencia && <p className="text-xs text-white/30 mt-1 tracking-widest">{row.referencia}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => printFicha(row)}
                className="flex items-center gap-1.5 text-[11px] tracking-widest px-3 py-1.5 rounded-xl border border-white/10 hover:border-gold/40 text-white/40 hover:text-gold transition-all uppercase">
                ↓ PDF
              </button>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-all text-sm">✕</button>
            </div>
          </div>
        </div>

        {/* Corpo */}
        <div className="px-8 py-6 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">

          {/* Nome + Referência */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome dos Noivos">
              <EditCell value={row.nome_noivos} field="nome_noivos" rowId={row.id} onSaved={onSaved} placeholder="Nome" />
            </Field>
            <Field label="Referência do Evento">
              <EditCell value={row.referencia} field="referencia" rowId={row.id} onSaved={onSaved} placeholder="Referência" />
            </Field>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
              <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase block mb-1">Data do Evento</span>
              <EditCell value={row.date} field="date" rowId={row.id} type="date" onSaved={onSaved} placeholder="—" />
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
              <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase block mb-1">Data de Entrada</span>
              <EditCell value={row.data_entrada} field="data_entrada" rowId={row.id} type="date" onSaved={onSaved} placeholder="—" />
            </div>
          </div>

          {/* Editor de Fotos */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase">Editor de Fotos</span>
              {editorFeedback && (
                <span className={`text-[10px] tracking-wide ${editorFeedback.startsWith('✓') ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {editorFeedback}
                </span>
              )}
            </div>
            {editorLoading ? (
              <div className="text-white/20 text-xs italic">A carregar...</div>
            ) : (
              <select
                value={editor ?? ''}
                onChange={e => handleEditorChange(e.target.value)}
                disabled={editorSaving}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/40 transition-colors disabled:opacity-40 [color-scheme:dark]"
              >
                <option value="" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>— Sem editor —</option>
                {EDITORS.map(name => (
                  <option key={name} value={name} style={{ backgroundColor: '#1a1a1a', color: 'white' }}>{name}</option>
                ))}
              </select>
            )}
            {editor && !editorSaving && (
              <p className="text-[10px] text-gold/50 mt-1.5 tracking-wide">
                Atribuído a <span className="text-gold/80">{editor}</span>
              </p>
            )}
          </div>

          {/* Editor Álbum */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase block mb-2">Editor Álbum</span>
            {editorLoading ? (
              <div className="text-white/20 text-xs italic">A carregar...</div>
            ) : (
              <select
                value={editorAlbum ?? ''}
                onChange={e => handleEditorAlbumChange(e.target.value)}
                disabled={editorAlbumSaving}
                className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold/40 transition-colors disabled:opacity-40 [color-scheme:dark]"
                style={{ colorScheme: 'dark' }}
              >
                <option value="" style={{ backgroundColor: '#1a1a1a', color: 'white' }}>— Sem editor álbum —</option>
                {ALBUM_EDITORS.map(name => (
                  <option key={name} value={name} style={{ backgroundColor: '#1a1a1a', color: 'white' }}>{name}</option>
                ))}
              </select>
            )}
            {editorAlbum && !editorAlbumSaving && (
              <p className="text-[10px] text-gold/50 mt-1.5 tracking-wide">
                Atribuído a <span className="text-gold/80">{editorAlbum}</span>
              </p>
            )}
          </div>

          {/* Contagens — grid 4 col */}
          <div>
            <p className="text-[9px] tracking-[0.35em] text-white/20 uppercase mb-3">Contagem de Fotos</p>
            <div className="grid grid-cols-4 gap-3">
              {FICHA_SECTIONS.map(({ label, field }) => (
                <div key={field} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3">
                  <span className="text-[8px] tracking-[0.3em] text-white/25 uppercase block mb-1">{label}</span>
                  <EditCell value={row[field]} field={field} rowId={row.id} onSaved={onSaved} placeholder="—" />
                </div>
              ))}
            </div>
          </div>

          {/* Detalhes */}
          <Field label="Detalhes">
            <EditCell value={row.detalhes} field="detalhes" rowId={row.id} onSaved={onSaved} placeholder="Sem detalhes" />
          </Field>
        </div>
      </div>
    </div>
  )
}

const STATUS_EDICAO_STYLE: Record<string, string> = {
  'NOVO TRABALHO': 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'EM EDIÇÃO':     'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  'CONCLUÍDO':     'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
}

// ── Card individual ───────────────────────────────────────────────────────────
function SelecaoCard({ row, onOpen, onDelete, confirmDelete, setConfirmDelete, editor, edicaoStatus }: {
  row: FotoSelecao
  onOpen: () => void
  onDelete: () => void
  confirmDelete: boolean
  setConfirmDelete: (v: boolean) => void
  editor?: string | null
  edicaoStatus?: string | null
}) {
  return (
    <div
      className="group relative bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
      onClick={onOpen}
    >
      {/* Barra dourada lateral */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gold/40" />

      <div className="pl-5 pr-4 py-3 flex items-center gap-4">
        {/* Nome + ref + data + badges */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-light tracking-wider text-white/90 truncate uppercase">
            {row.nome_noivos || <span className="text-white/25 italic text-xs">Sem nome</span>}
          </p>
          <div className="flex items-center flex-wrap gap-2 mt-1">
            {row.referencia && (
              <span className="text-[10px] text-gold/50 tracking-widest font-mono">{row.referencia}</span>
            )}
            {row.date && (
              <span className="text-[10px] text-white/25 tracking-wider">{fmt(row.date)}</span>
            )}
            {/* Editor badge */}
            {editor && (
              <span className="text-[9px] px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-white/40 tracking-wide">
                ✎ {editor}
              </span>
            )}
            {/* Estado edição badge */}
            {edicaoStatus && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full border tracking-widest uppercase font-medium ${STATUS_EDICAO_STYLE[edicaoStatus] ?? 'bg-white/5 text-white/30 border-white/10'}`}>
                {edicaoStatus}
              </span>
            )}
          </div>
        </div>

        {/* Ações */}
        <div className="shrink-0 flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {/* VER MAIS — sempre visível */}
          <button onClick={onOpen}
            className="text-[10px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-xl border border-gold/30 bg-gold/5 text-gold/70 hover:text-gold hover:border-gold/60 hover:bg-gold/10 transition-all">
            Ver Mais
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
              className="w-7 h-7 flex items-center justify-center rounded-xl text-white/15 hover:text-red-400 transition-colors text-sm opacity-0 group-hover:opacity-100">
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
function FotosSelecaoPageInner() {
  const [rows, setRows]             = useState<FotoSelecao[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [adding, setAdding]         = useState(false)
  const [error, setError]           = useState('')
  const searchParams = useSearchParams()
  const [search, setSearch]         = useState(searchParams.get('ref') ?? '')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [fichaOpen, setFichaOpen]   = useState<FotoSelecao | null>(null)
  // editor + estado por notion_page_id
  const [editorMap, setEditorMap]   = useState<Record<string, string>>({})
  const [statusMap, setStatusMap]   = useState<Record<string, string>>({})

  const loadEditorStatuses = useCallback(async (loadedRows: FotoSelecao[]) => {
    try {
      // 1. Todos os assignments de editor
      const { editors } = await fetch('/api/fotos-selecao-editor').then(r => r.json())
      const assignments: { notion_page_id: string; editor: string }[] = editors ?? []
      const newEditorMap: Record<string, string> = {}
      for (const a of assignments) { if (a.editor) newEditorMap[a.notion_page_id] = a.editor }
      setEditorMap(newEditorMap)

      // 2. Freelancers + edicao para os editores atribuídos
      const uniqueEditors = [...new Set(Object.values(newEditorMap))]
      if (!uniqueEditors.length) return

      const { freelancers } = await fetch('/api/freelancers').then(r => r.json())
      const edicaoByNome: Record<string, string> = {} // nome lowercase → status

      await Promise.all(uniqueEditors.map(async editorName => {
        const fl = (freelancers ?? []).find((f: any) =>
          f.nome.trim().toLowerCase() === editorName.trim().toLowerCase()
        )
        if (!fl) return
        const { edicao } = await fetch(`/api/freelancer-edicao?freelancer_id=${fl.id}`).then(r => r.json())
        for (const e of (edicao ?? [])) {
          edicaoByNome[e.nome?.toLowerCase().trim()] = e.status
        }
      }))

      // 3. Mapear notion_page_id → status via nome dos noivos
      const newStatusMap: Record<string, string> = {}
      for (const row of loadedRows) {
        if (!newEditorMap[row.id]) continue
        const key = (row.nome_noivos ?? '').toLowerCase().trim()
        if (edicaoByNome[key]) newStatusMap[row.id] = edicaoByNome[key]
      }
      setStatusMap(newStatusMap)
    } catch { /* silently ignore */ }
  }, [])

  const loadRows = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true)
    try {
      const d = await fetch('/api/fotos-selecao').then(r => r.json())
      if (d.error) { setError(d.error); return }
      setRows(d.rows)
      loadEditorStatuses(d.rows)
    } catch { setError('Erro de ligação') }
    finally { setLoading(false); setRefreshing(false) }
  }, [loadEditorStatuses])

  useEffect(() => { loadRows() }, [loadRows])

  function handleSaved(rowId: string, field: string, val: any) {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, [field]: val } : r))
    setFichaOpen(prev => prev?.id === rowId ? { ...prev, [field]: val } : prev)
  }

  async function addRow() {
    setAdding(true)
    const d = await fetch('/api/fotos-selecao', { method: 'POST' }).then(r => r.json())
    if (d.row) setRows(prev => [d.row, ...prev])
    setAdding(false)
  }

  async function deleteRow(id: string) {
    await fetch(`/api/fotos-selecao/${id}`, { method: 'DELETE' })
    setRows(prev => prev.filter(r => r.id !== id))
    setConfirmDelete(null)
    if (fichaOpen?.id === id) setFichaOpen(null)
  }

  const filtered = rows.filter(r =>
    !search ||
    r.nome_noivos?.toLowerCase().includes(search.toLowerCase()) ||
    r.referencia?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen px-4 py-12 max-w-5xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] text-white/30 hover:text-gold transition-colors mb-12 uppercase">
        ‹ Voltar ao Menu
      </Link>

      {/* Header */}
      <div className="mb-10 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[9px] tracking-[0.5em] text-white/20 uppercase mb-2">RL Photo.Video</p>
          <h1 className="text-3xl font-light tracking-[0.2em] text-white uppercase">Seleção de Fotos</h1>
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
            {adding ? '...' : '+ Novo Registo'}
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
          <p className="text-[10px] text-white/15 tracking-[0.3em] uppercase mb-6">{filtered.length} registos</p>

          <div className="flex flex-col gap-1.5">
            {filtered.map(row => (
              <SelecaoCard
                key={row.id}
                row={row}
                editor={editorMap[row.id]}
                edicaoStatus={statusMap[row.id]}
                onOpen={() => setFichaOpen(row)}
                onDelete={() => deleteRow(row.id)}
                confirmDelete={confirmDelete === row.id}
                setConfirmDelete={v => setConfirmDelete(v ? row.id : null)}
              />
            ))}

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

export default function FotosSelecaoPage() {
  return (
    <Suspense>
      <FotosSelecaoPageInner />
    </Suspense>
  )
}
