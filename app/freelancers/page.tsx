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
}

type FormData = Omit<Freelancer, 'id' | 'order_index'>

const STATUS_OPTIONS = ['FOTOGRAFO', 'VIDEOGRAFO', 'ASSISTENTE', 'EDITORES', 'OUTRO']

const STATUS_STYLE: Record<string, { badge: string; dot: string }> = {
  FOTOGRAFO:  { badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',  dot: 'bg-yellow-400' },
  VIDEOGRAFO: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-400' },
  ASSISTENTE: { badge: 'bg-pink-500/15 text-pink-400 border-pink-500/30',        dot: 'bg-pink-400' },
  EDITORES:   { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/30',  dot: 'bg-orange-400' },
  OUTRO:      { badge: 'bg-white/10 text-white/50 border-white/20',              dot: 'bg-white/40' },
}

function statusStyle(s: string | null) {
  return STATUS_STYLE[s ?? ''] ?? STATUS_STYLE.OUTRO
}

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
      {copied ? '✓ Copiado' : '🔗 Copiar URL'}
    </button>
  )
}

export default function FreelancersPage() {
  const [list, setList] = useState<Freelancer[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pwEditId, setPwEditId] = useState<string | null>(null)
  const [pwDraft, setPwDraft]   = useState('')
  const [pwSaving, setPwSaving] = useState(false)

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

  // Group by status
  const groups: Record<string, Freelancer[]> = {}
  const ORDER = ['FOTOGRAFO', 'VIDEOGRAFO', 'ASSISTENTE', 'EDITORES', 'OUTRO']
  for (const f of list) {
    const key = STATUS_OPTIONS.includes(f.status ?? '') ? (f.status ?? 'OUTRO') : 'OUTRO'
    if (!groups[key]) groups[key] = []
    groups[key].push(f)
  }

  return (
    <main className="min-h-screen px-4 sm:px-8 py-8 max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
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
        <div className="mb-6 bg-white/[0.02] border border-gold/20 rounded-2xl p-5 space-y-3">
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
        <div className="space-y-8">
          {ORDER.filter(g => groups[g]?.length).map(group => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2 h-2 rounded-full ${statusStyle(group).dot}`} />
                <span className="text-[10px] tracking-[0.35em] text-white/30 uppercase">{group}</span>
                <span className="text-[10px] text-white/20">({groups[group].length})</span>
              </div>
              <div className="space-y-2">
                {groups[group].map(f => (
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
                              {f.status && (
                                <span className={`text-[9px] px-2 py-0.5 rounded-full border tracking-widest uppercase font-semibold ${statusStyle(f.status).badge}`}>
                                  {f.status}
                                </span>
                              )}
                              {f.password && (
                                <span className="text-[9px] text-white/20">🔑</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                              {f.contato && <span className="text-xs text-white/40">📞 {f.contato}</span>}
                              {f.email && <span className="text-xs text-white/40 truncate max-w-[200px]">✉ {f.email}</span>}
                              {f.nome_sos && <span className="text-xs text-white/25">SOS: {f.nome_sos}{f.contato_sos ? ` · ${f.contato_sos}` : ''}</span>}
                            </div>
                          </Link>
                          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                            <CopiarUrlButton id={f.id} />
                            <button onClick={() => { setPwEditId(f.id); setPwDraft(f.password ?? '') }}
                              className="text-[9px] px-2.5 py-1 rounded-lg border border-white/10 text-white/30 hover:text-white/60 hover:border-white/25 transition-all tracking-widest uppercase">
                              🔑 Password
                            </button>
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
            </div>
          ))}
        </div>
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
