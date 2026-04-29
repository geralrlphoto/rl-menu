'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Freelancer = {
  id: string
  nome: string
  status: string | null
  contato: string | null
  email: string | null
  nome_sos: string | null
  contato_sos: string | null
  order_index: number
  password?: string | null
  is_template?: boolean | null
}

type FormData = Omit<Freelancer, 'id' | 'order_index'>

const STATUS_OPTIONS = ['FOTOGRAFO', 'VIDEOGRAFO', 'ASSISTENTE', 'EDITORES', 'OUTRO']

// ── Ícones SVG futuristas ─────────────────────────────────────────────────────
const IconCamera = ({ color }: { color: string }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="12" width="32" height="22" rx="3" stroke={color} strokeWidth="1.5"/>
    <path d="M14 12V9a2 2 0 012-2h8a2 2 0 012 2v3" stroke={color} strokeWidth="1.5"/>
    <circle cx="20" cy="23" r="5.5" stroke={color} strokeWidth="1.5"/>
    <circle cx="20" cy="23" r="2.5" fill={color} opacity="0.4"/>
    <rect x="28" y="17" width="4" height="2.5" rx="0.5" fill={color} opacity="0.5"/>
    <line x1="4" y1="18" x2="11" y2="18" stroke={color} strokeWidth="1" opacity="0.4"/>
  </svg>
)

const IconVideo = ({ color }: { color: string }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="11" width="24" height="18" rx="3" stroke={color} strokeWidth="1.5"/>
    <path d="M27 16l9-5v18l-9-5V16z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
    <line x1="10" y1="20" x2="18" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="14" y1="16" x2="14" y2="24" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <circle cx="14" cy="20" r="1.5" fill={color} opacity="0.6"/>
  </svg>
)

const IconAssist = ({ color }: { color: string }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="13" r="5.5" stroke={color} strokeWidth="1.5"/>
    <path d="M7 35c0-7.18 5.82-13 13-13s13 5.82 13 13" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="20" y1="18" x2="20" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    <circle cx="20" cy="13" r="2" fill={color} opacity="0.4"/>
  </svg>
)

const IconEdit = ({ color }: { color: string }) => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="6" y1="12" x2="34" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="12" y="8" width="16" height="8" rx="1.5" stroke={color} strokeWidth="1.2" opacity="0.4"/>
    <line x1="6" y1="20" x2="34" y2="20" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="6" y="16" width="10" height="8" rx="1.5" stroke={color} strokeWidth="1.2" opacity="0.4"/>
    <line x1="6" y1="28" x2="34" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <rect x="24" y="24" width="10" height="8" rx="1.5" stroke={color} strokeWidth="1.2" opacity="0.4"/>
  </svg>
)

const CATEGORY_ICONS: Record<string, (color: string) => JSX.Element> = {
  FOTOGRAFO:  (c) => <IconCamera color={c} />,
  VIDEOGRAFO: (c) => <IconVideo color={c} />,
  ASSISTENTE: (c) => <IconAssist color={c} />,
  EDITORES:   (c) => <IconEdit color={c} />,
}

const CATEGORY_COLORS: Record<string, string> = {
  FOTOGRAFO:  '#facc15',
  VIDEOGRAFO: '#34d399',
  ASSISTENTE: '#f472b6',
  EDITORES:   '#fb923c',
}

const NEON_GLOW: Record<string, { idle: string; active: string; border: string; borderActive: string }> = {
  FOTOGRAFO:  {
    idle:        '0 0 8px rgba(250,204,21,0.15), 0 0 20px rgba(250,204,21,0.08)',
    active:      '0 0 12px rgba(250,204,21,0.5), 0 0 30px rgba(250,204,21,0.25), 0 0 60px rgba(250,204,21,0.1), inset 0 0 20px rgba(250,204,21,0.05)',
    border:      'rgba(250,204,21,0.2)',
    borderActive:'rgba(250,204,21,0.7)',
  },
  VIDEOGRAFO: {
    idle:        '0 0 8px rgba(52,211,153,0.15), 0 0 20px rgba(52,211,153,0.08)',
    active:      '0 0 12px rgba(52,211,153,0.5), 0 0 30px rgba(52,211,153,0.25), 0 0 60px rgba(52,211,153,0.1), inset 0 0 20px rgba(52,211,153,0.05)',
    border:      'rgba(52,211,153,0.2)',
    borderActive:'rgba(52,211,153,0.7)',
  },
  ASSISTENTE: {
    idle:        '0 0 8px rgba(244,114,182,0.15), 0 0 20px rgba(244,114,182,0.08)',
    active:      '0 0 12px rgba(244,114,182,0.5), 0 0 30px rgba(244,114,182,0.25), 0 0 60px rgba(244,114,182,0.1), inset 0 0 20px rgba(244,114,182,0.05)',
    border:      'rgba(244,114,182,0.2)',
    borderActive:'rgba(244,114,182,0.7)',
  },
  EDITORES:   {
    idle:        '0 0 8px rgba(251,146,60,0.15), 0 0 20px rgba(251,146,60,0.08)',
    active:      '0 0 12px rgba(251,146,60,0.5), 0 0 30px rgba(251,146,60,0.25), 0 0 60px rgba(251,146,60,0.1), inset 0 0 20px rgba(251,146,60,0.05)',
    border:      'rgba(251,146,60,0.2)',
    borderActive:'rgba(251,146,60,0.7)',
  },
}

const CATEGORY_CONFIG = [
  {
    key: 'FOTOGRAFO',
    label: 'Fotógrafos',
    border:  'border-yellow-500/25 hover:border-yellow-500/50',
    borderActive: 'border-yellow-500/60',
    bg:      'bg-yellow-500/5',
    bgActive:'bg-yellow-500/10',
    accent:  'text-yellow-400',
    badge:   'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    dot:     'bg-yellow-400',
    glow:    'shadow-yellow-500/10',
  },
  {
    key: 'VIDEOGRAFO',
    label: 'Videógrafos',
    border:  'border-emerald-500/25 hover:border-emerald-500/50',
    borderActive: 'border-emerald-500/60',
    bg:      'bg-emerald-500/5',
    bgActive:'bg-emerald-500/10',
    accent:  'text-emerald-400',
    badge:   'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    dot:     'bg-emerald-400',
    glow:    'shadow-emerald-500/10',
  },
  {
    key: 'ASSISTENTE',
    label: 'Assistentes',
    border:  'border-pink-500/25 hover:border-pink-500/50',
    borderActive: 'border-pink-500/60',
    bg:      'bg-pink-500/5',
    bgActive:'bg-pink-500/10',
    accent:  'text-pink-400',
    badge:   'bg-pink-500/15 text-pink-400 border-pink-500/30',
    dot:     'bg-pink-400',
    glow:    'shadow-pink-500/10',
  },
  {
    key: 'EDITORES',
    label: 'Editores',
    border:  'border-orange-500/25 hover:border-orange-500/50',
    borderActive: 'border-orange-500/60',
    bg:      'bg-orange-500/5',
    bgActive:'bg-orange-500/10',
    accent:  'text-orange-400',
    badge:   'bg-orange-500/15 text-orange-400 border-orange-500/30',
    dot:     'bg-orange-400',
    glow:    'shadow-orange-500/10',
  },
]

const CATEGORY_MAP: Record<string, typeof CATEGORY_CONFIG[0]> = Object.fromEntries(
  CATEGORY_CONFIG.map(c => [c.key, c])
)

const EMPTY_FORM: FormData = { nome: '', status: 'FOTOGRAFO', contato: '', email: '', nome_sos: '', contato_sos: '' }

function CopiarUrlButton({ id }: { id: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    const url = `${window.location.origin}/freelancer-view/${id}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button onClick={copy}
      className={`text-[9px] px-2.5 py-1 rounded-lg border transition-all tracking-widest uppercase ${copied ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-white/10 text-white/30 hover:text-white/60 hover:border-white/25'}`}>
      {copied ? '✓ Copiado' : '🔗 URL'}
    </button>
  )
}

export default function FreelancersPage() {
  const [list, setList]           = useState<Freelancer[]>([])
  const [loading, setLoading]     = useState(true)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd]     = useState(false)
  const [form, setForm]           = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving]       = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pwEditId, setPwEditId]   = useState<string | null>(null)
  const [pwDraft, setPwDraft]     = useState('')
  const [pwSaving, setPwSaving]   = useState(false)
  const [removendoId, setRemovendo] = useState<string | null>(null)
  const [removidoIds, setRemovidoIds] = useState<Set<string>>(new Set())

  async function load() {
    setLoading(true)
    const d = await fetch('/api/freelancers').then(r => r.json())
    setList(d.freelancers ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(f: Freelancer) {
    setEditingId(f.id)
    setForm({ nome: f.nome, status: f.status ?? '', contato: f.contato ?? '', email: f.email ?? '', nome_sos: f.nome_sos ?? '', contato_sos: f.contato_sos ?? '' })
    setShowAdd(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editingId) {
        await fetch('/api/freelancers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingId, ...form }) })
        setEditingId(null)
      } else {
        await fetch('/api/freelancers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, order_index: list.length + 1 }) })
        setShowAdd(false)
      }
      setForm(EMPTY_FORM)
      await load()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este membro da equipa?')) return
    setDeletingId(id)
    await fetch(`/api/freelancers?id=${id}`, { method: 'DELETE' })
    setDeletingId(null)
    await load()
  }

  async function handleSavePassword(id: string) {
    setPwSaving(true)
    await fetch('/api/freelancers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password: pwDraft.trim() || null }),
    })
    setList(prev => prev.map(f => f.id === id ? { ...f, password: pwDraft.trim() || null } : f))
    setPwEditId(null)
    setPwDraft('')
    setPwSaving(false)
  }

  function statusToFuncao(status: string | null): string {
    if (status === 'EDITORES') return 'EDITOR'
    return status ?? 'OUTRO'
  }

  async function handleRemoverDaEquipa(f: Freelancer) {
    if (!confirm(`Mover "${f.nome}" de volta para Novos Freelancers?`)) return
    setRemovendo(f.id)
    try {
      await fetch('/api/freelancers-novos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: f.nome, funcao: statusToFuncao(f.status), telefone: f.contato ?? '', tipo_eventos: [], zona: '', avaliacao: [] }),
      })
      await fetch(`/api/freelancers?id=${f.id}`, { method: 'DELETE' })
      setRemovidoIds(prev => new Set([...prev, f.id]))
      setTimeout(() => {
        setList(prev => prev.filter(x => x.id !== f.id))
        setRemovidoIds(prev => { const s = new Set(prev); s.delete(f.id); return s })
      }, 1200)
    } finally { setRemovendo(null) }
  }

  // Group by status
  const groups: Record<string, Freelancer[]> = {}
  for (const f of list) {
    const key = STATUS_OPTIONS.includes(f.status ?? '') ? (f.status ?? 'OUTRO') : 'OUTRO'
    if (!groups[key]) groups[key] = []
    groups[key].push(f)
  }

  const activeCat = activeGroup ? CATEGORY_MAP[activeGroup] : null

  return (
    <main className="min-h-screen px-4 sm:px-8 py-8 max-w-[900px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <Link href="/" className="text-[10px] tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold tracking-widest text-gold uppercase mt-1">Equipas de Trabalho</h1>
          <div className="mt-2 h-px w-12 bg-gold/40" />
        </div>
        <div className="flex items-center gap-3">
          <Link href="/freelancers/novos"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white/40 text-xs font-semibold tracking-widest hover:bg-white/[0.06] hover:text-white/70 transition-all uppercase">
            Novos Freelancers
          </Link>
          <button
            onClick={() => { setShowAdd(true); setEditingId(null); setForm(EMPTY_FORM) }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
            + Adicionar
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-8 bg-white/[0.02] border border-gold/20 rounded-2xl p-5 space-y-3">
          <p className="text-[10px] tracking-[0.3em] text-gold/70 uppercase mb-3">Novo Membro</p>
          <FormFields form={form} setForm={setForm} />
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={() => setShowAdd(false)} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !form.nome} className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
              {saving ? 'A guardar...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-24 text-white/20 text-xs tracking-widest uppercase">A carregar...</div>
      ) : (
        <>
          {/* ── Category cards ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {CATEGORY_CONFIG.map(cat => {
              const count = groups[cat.key]?.length ?? 0
              const isActive = activeGroup === cat.key
              const neon = NEON_GLOW[cat.key]
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveGroup(isActive ? null : cat.key)}
                  className={`relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all duration-300 ${
                    isActive ? cat.bgActive : cat.bg
                  }`}
                  style={{
                    borderColor: isActive ? neon.borderActive : neon.border,
                    boxShadow: isActive ? neon.active : neon.idle,
                    transition: 'box-shadow 0.3s ease, border-color 0.3s ease, background 0.3s ease',
                  }}
                >
                  {/* count badge */}
                  <span className={`absolute top-3 right-3 text-[10px] px-2 py-0.5 rounded-full border font-semibold tracking-wider ${cat.badge}`}>
                    {count}
                  </span>

                  {/* icon — mais brilhante quando activo */}
                  <div style={{ opacity: isActive ? 1 : 0.7, filter: isActive ? `drop-shadow(0 0 6px ${CATEGORY_COLORS[cat.key]}99)` : 'none', transition: 'all 0.3s ease' }}>
                    {CATEGORY_ICONS[cat.key]?.(CATEGORY_COLORS[cat.key] ?? '#ffffff')}
                  </div>

                  {/* label */}
                  <span className={`text-xs font-bold tracking-widest uppercase transition-colors duration-300 ${isActive ? cat.accent : 'text-white/40'}`}>
                    {cat.label}
                  </span>

                  {/* chevron */}
                  <span className={`text-[10px] transition-all duration-300 ${isActive ? cat.accent : 'text-white/15'}`}
                    style={{ transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── Active group members ──────────────────────────────────────── */}
          {activeGroup && activeCat && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">

              {/* Section header */}
              <div className="flex items-center gap-3 mb-4">
                <span className={`w-2 h-2 rounded-full ${activeCat.dot}`} />
                <span className={`text-xs font-bold tracking-[0.3em] uppercase ${activeCat.accent}`}>
                  {activeCat.label}
                </span>
                <span className="text-xs text-white/20">
                  {groups[activeGroup]?.length ?? 0} membro{(groups[activeGroup]?.length ?? 0) !== 1 ? 's' : ''}
                </span>
              </div>

              {(!groups[activeGroup] || groups[activeGroup].length === 0) ? (
                <div className="py-12 text-center text-white/20 text-xs tracking-widest border border-white/5 rounded-2xl">
                  Nenhum membro nesta categoria
                </div>
              ) : (
                <div className="space-y-2">
                  {groups[activeGroup].map(f => (
                    <div key={f.id}>
                      {editingId === f.id ? (
                        <div className="bg-white/[0.02] border border-gold/20 rounded-xl p-4 space-y-3">
                          <FormFields form={form} setForm={setForm} />
                          <div className="flex items-center justify-between pt-1">
                            <button onClick={() => handleDelete(f.id)} disabled={!!deletingId}
                              className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors tracking-widest">
                              ✕ Remover
                            </button>
                            <div className="flex gap-2">
                              <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
                              <button onClick={handleSave} disabled={saving || !form.nome} className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                                {saving ? 'A guardar...' : 'Guardar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] transition-all group">
                          <div className="flex items-center gap-4 px-4 py-3">
                            <Link href={`/freelancers/${f.id}`} className="flex-1 min-w-0 cursor-pointer">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-white/85 group-hover:text-white transition-colors">{f.nome}</span>
                                {f.is_template && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full border tracking-widest uppercase font-semibold bg-white/10 text-white border-white/30">
                                    ⌘ Template
                                  </span>
                                )}
                                {f.password && (
                                  <span className="text-[9px] text-white/20">🔑</span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                                {f.contato && <span className="text-xs text-white/40">📞 {f.contato}</span>}
                                {f.email && <span className="text-xs text-white/40 truncate max-w-[220px]">✉ {f.email}</span>}
                                {f.nome_sos && <span className="text-xs text-white/25">SOS: {f.nome_sos}{f.contato_sos ? ` · ${f.contato_sos}` : ''}</span>}
                              </div>
                            </Link>

                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                              <CopiarUrlButton id={f.id} />
                              <button onClick={() => { setPwEditId(f.id); setPwDraft(f.password ?? '') }}
                                className="text-[9px] px-2.5 py-1 rounded-lg border border-white/10 text-white/30 hover:text-white/60 hover:border-white/25 transition-all tracking-widest uppercase">
                                🔑 PW
                              </button>
                              {removidoIds.has(f.id) ? (
                                <span className="text-[9px] px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 tracking-widest uppercase">
                                  ✓ Movido
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleRemoverDaEquipa(f)}
                                  disabled={removendoId === f.id}
                                  className="text-[9px] px-2.5 py-1 rounded-lg border border-orange-500/25 bg-orange-500/5 text-orange-400/70 hover:text-orange-400 hover:border-orange-500/40 hover:bg-orange-500/10 transition-all tracking-widest uppercase disabled:opacity-40">
                                  {removendoId === f.id ? '...' : '− Equipa'}
                                </button>
                              )}
                              <button onClick={() => startEdit(f)}
                                className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-all">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Password editor inline */}
                          {pwEditId === f.id && (
                            <div className="px-4 pb-3 flex items-center gap-2 border-t border-white/[0.05] pt-3">
                              <span className="text-[9px] text-white/25 tracking-widest uppercase shrink-0">Password:</span>
                              <input
                                type="text"
                                value={pwDraft}
                                onChange={e => setPwDraft(e.target.value)}
                                placeholder="ex: rl2026"
                                autoFocus
                                className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors font-mono placeholder:text-white/15"
                              />
                              <button onClick={() => handleSavePassword(f.id)} disabled={pwSaving}
                                className="text-[9px] px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all tracking-widest uppercase disabled:opacity-40">
                                {pwSaving ? '...' : 'Guardar'}
                              </button>
                              <button onClick={() => setPwEditId(null)}
                                className="text-[9px] px-2.5 py-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white/60 transition-all">
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </main>
  )
}

function FormFields({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  const inputCls = "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15"
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Nome *</label>
          <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome" className={inputCls} />
        </div>
        <div>
          <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Função</label>
          <select value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className={inputCls + ' cursor-pointer'}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Contato</label>
          <input value={form.contato ?? ''} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))} placeholder="9XX XXX XXX" className={inputCls} />
        </div>
        <div>
          <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Email</label>
          <input value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Contato SOS (nome)</label>
          <input value={form.nome_sos ?? ''} onChange={e => setForm(f => ({ ...f, nome_sos: e.target.value }))} placeholder="Nome familiar" className={inputCls} />
        </div>
        <div>
          <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Contato SOS (nº)</label>
          <input value={form.contato_sos ?? ''} onChange={e => setForm(f => ({ ...f, contato_sos: e.target.value }))} placeholder="9XX XXX XXX" className={inputCls} />
        </div>
      </div>
    </div>
  )
}
