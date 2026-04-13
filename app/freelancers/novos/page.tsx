'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type NovoFreelancer = {
  id: string
  nome: string
  funcao: string | null
  tipo_eventos: string[]
  zona: string | null
  telefone: string | null
  valor_servico: string | null
  valor_drone: string | null
  valor_edicao: string | null
  servicos_feitos: number | null
  drone: string | null
  faz_edicao: string | null
  link_trailer: string | null
  link_video: string | null
  avaliacao: string[]
  mensagem: string | null
}

const FUNCAO_OPTIONS = ['FOTOGRAFO', 'VIDEOGRAFO', 'EDITOR', 'ASSISTENTE', 'DRONE', 'OUTRO']

const FUNCAO_STYLE: Record<string, { badge: string; tab: string; dot: string }> = {
  FOTOGRAFO:  { badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',   tab: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10',   dot: 'bg-yellow-400' },
  VIDEOGRAFO: { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', tab: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10', dot: 'bg-emerald-400' },
  EDITOR:     { badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',   tab: 'border-purple-500/40 text-purple-400 bg-purple-500/10',   dot: 'bg-purple-400' },
  ASSISTENTE: { badge: 'bg-pink-500/15 text-pink-400 border-pink-500/30',         tab: 'border-pink-500/40 text-pink-400 bg-pink-500/10',         dot: 'bg-pink-400' },
  DRONE:      { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',         tab: 'border-blue-500/40 text-blue-400 bg-blue-500/10',         dot: 'bg-blue-400' },
  OUTRO:      { badge: 'bg-white/10 text-white/40 border-white/20',               tab: 'border-white/20 text-white/40 bg-white/5',               dot: 'bg-white/30' },
}

const EMPTY_FORM = {
  nome: '', funcao: 'FOTOGRAFO', tipo_eventos: [] as string[], zona: '',
  telefone: '', valor_servico: '', valor_drone: '', valor_edicao: '',
  servicos_feitos: '', drone: '', faz_edicao: '', link_trailer: '',
  link_video: '', avaliacao: [] as string[], mensagem: '',
}

function funcaoStyle(f: string | null) {
  return FUNCAO_STYLE[f ?? ''] ?? FUNCAO_STYLE.OUTRO
}

function AvaliacaoEditor({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const current = parseInt(value[0] ?? '0')
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" onClick={() => onChange(current === n ? [] : [String(n)])}
          className={`w-6 h-6 transition-colors ${n <= current ? 'text-gold' : 'text-white/15 hover:text-white/30'}`}>
          <svg viewBox="0 0 24 24" fill={n <= current ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

function AvaliacaoStars({ avaliacao }: { avaliacao: string[] }) {
  const val = parseInt(avaliacao[0] ?? '0')
  if (!val) return <span className="text-white/20 text-xs">—</span>
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} viewBox="0 0 24 24" fill={i <= val ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"
          className={`w-3 h-3 ${i <= val ? 'text-gold' : 'text-white/15'}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ))}
      <span className="text-white/30 text-[10px] ml-1">{val}/5</span>
    </div>
  )
}

function FreelancerForm({ initial, onSave, onCancel, saving }: {
  initial: typeof EMPTY_FORM
  onSave: (data: typeof EMPTY_FORM) => void
  onCancel: () => void
  saving: boolean
}) {
  const [form, setForm] = useState(initial)
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))
  const inp = "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20"

  return (
    <div className="bg-white/[0.02] border border-gold/20 rounded-2xl p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Nome *</label>
          <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome do freelancer" className={inp} />
        </div>
        <div>
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Função</label>
          <select value={form.funcao} onChange={e => set('funcao', e.target.value)} className={inp + ' cursor-pointer'}>
            {FUNCAO_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Telefone</label>
          <input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="9xx xxx xxx" className={inp} />
        </div>
        <div>
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Zona de Residência</label>
          <input value={form.zona} onChange={e => set('zona', e.target.value)} placeholder="ex: Lisboa" className={inp} />
        </div>
        <div>
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Valor por Serviço</label>
          <input value={form.valor_servico} onChange={e => set('valor_servico', e.target.value)} placeholder="ex: 250€" className={inp} />
        </div>
        <div>
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Valor Drone</label>
          <input value={form.valor_drone} onChange={e => set('valor_drone', e.target.value)} placeholder="ex: 100€" className={inp} />
        </div>
        <div>
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Valor Edição 20min</label>
          <input value={form.valor_edicao} onChange={e => set('valor_edicao', e.target.value)} placeholder="ex: 80€" className={inp} />
        </div>
        <div>
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Drone</label>
          <select value={form.drone} onChange={e => set('drone', e.target.value)} className={inp + ' cursor-pointer'}>
            <option value="">—</option>
            <option value="SIM">SIM</option>
            <option value="NÃO">NÃO</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Faz Edição de Vídeo</label>
          <select value={form.faz_edicao} onChange={e => set('faz_edicao', e.target.value)} className={inp + ' cursor-pointer'}>
            <option value="">—</option>
            <option value="SIM">SIM</option>
            <option value="NÃO">NÃO</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Avaliação</label>
          <AvaliacaoEditor value={form.avaliacao} onChange={v => set('avaliacao', v)} />
        </div>
        <div>
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Link Trailer</label>
          <input value={form.link_trailer} onChange={e => set('link_trailer', e.target.value)} placeholder="https://..." className={inp} />
        </div>
        <div>
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Link Vídeo Completo</label>
          <input value={form.link_video} onChange={e => set('link_video', e.target.value)} placeholder="https://..." className={inp} />
        </div>
      </div>
      <div>
        <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Mensagem / Notas</label>
        <textarea value={form.mensagem} onChange={e => set('mensagem', e.target.value)}
          rows={3} placeholder="Mensagem de apresentação ou notas..." className={inp + ' resize-none'} />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
        <button onClick={() => onSave(form)} disabled={saving || !form.nome}
          className="px-5 py-2 rounded-xl text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
          {saving ? 'A guardar...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

export default function NovosFreelancersPage() {
  const [list, setList]             = useState<NovoFreelancer[]>([])
  const [loading, setLoading]       = useState(true)
  const [activeTab, setActiveTab]   = useState('TODOS')
  const [search, setSearch]         = useState('')
  const [expanded, setExpanded]     = useState<string | null>(null)
  const [editingId, setEditingId]   = useState<string | null>(null)
  const [showAdd, setShowAdd]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [juntandoId, setJuntandoId] = useState<string | null>(null)
  const [juntadoIds, setJuntadoIds] = useState<Set<string>>(new Set())

  function load() {
    setLoading(true)
    fetch('/api/freelancers-novos')
      .then(r => r.json())
      .then(d => { setList(d.rows ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  // Tabs dinâmicas baseadas nos dados
  const tabsFromData = Array.from(new Set(list.map(f => f.funcao).filter(Boolean) as string[]))
  const tabs = ['TODOS', ...FUNCAO_OPTIONS.filter(f => tabsFromData.includes(f)), ...tabsFromData.filter(f => !FUNCAO_OPTIONS.includes(f))]

  const filtered = list.filter(f => {
    const matchTab = activeTab === 'TODOS' || f.funcao === activeTab
    const matchSearch = !search ||
      f.nome?.toLowerCase().includes(search.toLowerCase()) ||
      f.zona?.toLowerCase().includes(search.toLowerCase()) ||
      f.mensagem?.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const countByTab = (tab: string) => tab === 'TODOS' ? list.length : list.filter(f => f.funcao === tab).length

  async function handleAdd(form: typeof EMPTY_FORM) {
    setSaving(true)
    const res = await fetch('/api/freelancers-novos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    })
    const d = await res.json()
    if (d.ok) { setList(prev => [d.row, ...prev]); setShowAdd(false) }
    setSaving(false)
  }

  async function handleEdit(id: string, form: typeof EMPTY_FORM) {
    setSaving(true)
    const res = await fetch('/api/freelancers-novos', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...form }),
    })
    const d = await res.json()
    if (d.ok) { setList(prev => prev.map(f => f.id === id ? d.row : f)); setEditingId(null) }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este candidato?')) return
    await fetch('/api/freelancers-novos', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    })
    setList(prev => prev.filter(f => f.id !== id))
  }

  // Mapeamento funcao → status da equipa (EDITORES é o nome na equipa)
  function funcaoToStatus(funcao: string | null): string {
    if (funcao === 'EDITOR') return 'EDITORES'
    if (funcao === 'DRONE') return 'OUTRO'
    return funcao ?? 'OUTRO'
  }

  async function handleJuntarEquipa(f: NovoFreelancer) {
    if (!confirm(`Juntar "${f.nome}" à equipa de trabalho?`)) return
    setJuntandoId(f.id)
    try {
      // 1. Criar na equipa de trabalho (Supabase)
      const res = await fetch('/api/freelancers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: f.nome,
          status: funcaoToStatus(f.funcao),
          contato: f.telefone ?? '',
          email: '',
          nome_sos: '',
          contato_sos: '',
          order_index: 999,
        }),
      })
      if (!res.ok) { alert('Erro ao adicionar à equipa.'); return }
      // 2. Arquivar dos Novos (Notion)
      await fetch('/api/freelancers-novos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: f.id }),
      })
      setJuntadoIds(prev => new Set([...prev, f.id]))
      setTimeout(() => {
        setList(prev => prev.filter(x => x.id !== f.id))
        setJuntadoIds(prev => { const s = new Set(prev); s.delete(f.id); return s })
      }, 1200)
    } finally {
      setJuntandoId(null)
    }
  }

  return (
    <main className="min-h-screen px-4 sm:px-8 py-8 max-w-[960px] mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/freelancers" className="text-[10px] tracking-[0.3em] text-white/25 hover:text-white/50 uppercase transition-colors">
            ← Equipas de Trabalho
          </Link>
          <h1 className="text-xl font-bold tracking-widest text-gold uppercase mt-1">Novos Freelancers</h1>
          <div className="mt-2 h-px w-12 bg-gold/40" />
        </div>
        <button onClick={() => { setShowAdd(true); setEditingId(null) }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest hover:bg-gold/20 transition-all uppercase">
          + Adicionar
        </button>
      </div>

      {/* Form adicionar */}
      {showAdd && (
        <div className="mb-6">
          <FreelancerForm initial={EMPTY_FORM} onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
        </div>
      )}

      {/* Tabs por função */}
      <div className="flex gap-2 flex-wrap mb-4">
        {tabs.map(tab => {
          const count = countByTab(tab)
          if (count === 0 && tab !== 'TODOS' && !FUNCAO_OPTIONS.includes(tab)) return null
          const style = tab === 'TODOS'
            ? activeTab === 'TODOS' ? 'border-gold/40 text-gold bg-gold/10' : 'border-white/10 text-white/30 hover:text-white/60 bg-white/[0.02]'
            : activeTab === tab ? funcaoStyle(tab).tab : 'border-white/10 text-white/30 hover:text-white/60 bg-white/[0.02]'
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl border text-[10px] font-semibold tracking-widest uppercase transition-all flex items-center gap-2 ${style}`}>
              {tab}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-white/20' : 'bg-white/10'}`}>{count}</span>
            </button>
          )
        })}
      </div>

      {/* Pesquisa */}
      <div className="mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar nome, zona, mensagem..."
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white/70 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20" />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-24 text-white/20 text-xs tracking-widest uppercase">A carregar...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-white/20 text-xs tracking-widest uppercase">Sem resultados</div>
      ) : (
        <div className="space-y-2">
          {filtered.map(f => (
            <div key={f.id} className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/10 transition-all">

              {editingId === f.id ? (
                <div className="p-4">
                  <FreelancerForm
                    initial={{ ...EMPTY_FORM, ...f, servicos_feitos: String(f.servicos_feitos ?? '') }}
                    onSave={form => handleEdit(f.id, form)}
                    onCancel={() => setEditingId(null)}
                    saving={saving}
                  />
                </div>
              ) : (
                <>
                  {/* Linha principal */}
                  <div className="px-5 py-4 flex items-center gap-4">
                    <button onClick={() => setExpanded(expanded === f.id ? null : f.id)} className="flex-1 flex items-center gap-4 text-left min-w-0">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white/40">
                          {(f.nome || '?').split(' ').map((w:string) => w[0]).slice(0, 2).join('').toUpperCase()}
                        </span>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white/80">{f.nome || '—'}</span>
                          {f.funcao && (
                            <span className={`text-[9px] px-2 py-0.5 rounded-full border font-semibold tracking-widest uppercase ${funcaoStyle(f.funcao).badge}`}>
                              {f.funcao}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          {f.zona && <span className="text-[10px] text-white/30">📍 {f.zona}</span>}
                          {f.valor_servico && <span className="text-[10px] text-white/30">💶 {f.valor_servico}</span>}
                          {f.telefone && <span className="text-[10px] text-white/30">📞 {f.telefone}</span>}
                        </div>
                      </div>
                      {/* Avaliação + chevron */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <AvaliacaoStars avaliacao={f.avaliacao} />
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                          className={`w-4 h-4 text-white/20 transition-transform ${expanded === f.id ? 'rotate-180' : ''}`}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </button>
                    {/* Ações */}
                    <div className="flex gap-1 flex-shrink-0">
                      {juntadoIds.has(f.id) ? (
                        <span className="px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] tracking-wider font-semibold">
                          ✓ Adicionado
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJuntarEquipa(f)}
                          disabled={juntandoId === f.id}
                          className="px-2.5 py-1.5 rounded-lg border border-gold/30 bg-gold/5 text-gold hover:bg-gold/15 hover:border-gold/50 transition-all text-[10px] tracking-wider disabled:opacity-50 whitespace-nowrap">
                          {juntandoId === f.id ? '...' : '+ Equipa'}
                        </button>
                      )}
                      <button onClick={() => setEditingId(f.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white/60 hover:border-white/25 transition-all text-[10px] tracking-wider">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(f.id)}
                        className="px-2.5 py-1.5 rounded-lg border border-red-500/20 text-red-400/50 hover:text-red-400 hover:border-red-500/40 transition-all text-[10px]">
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Detalhes expandidos */}
                  {expanded === f.id && (
                    <div className="px-5 pb-5 border-t border-white/[0.05] pt-4 space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {([
                          ['Valor por Serviço', f.valor_servico],
                          ['Valor Drone', f.valor_drone],
                          ['Valor Edição 20m', f.valor_edicao],
                          ['Serviços Feitos', f.servicos_feitos != null ? String(f.servicos_feitos) : null],
                        ] as [string, string | null][]).filter(([,v]) => v).map(([label, val]) => (
                          <div key={label} className="bg-white/[0.03] rounded-xl p-3">
                            <p className="text-[9px] text-white/30 tracking-widest uppercase mb-1">{label}</p>
                            <p className="text-sm font-semibold text-white/70">{val}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {f.drone && <span className="text-[10px] px-3 py-1 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-400">🚁 Drone: {f.drone}</span>}
                        {f.faz_edicao && <span className="text-[10px] px-3 py-1 rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-400">✂️ Edição: {f.faz_edicao}</span>}
                        {f.tipo_eventos?.map(t => (
                          <span key={t} className="text-[10px] px-3 py-1 rounded-lg border border-white/10 text-white/30">{t}</span>
                        ))}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {f.link_trailer && <a href={f.link_trailer} target="_blank" rel="noopener noreferrer" className="text-[10px] px-3 py-1.5 rounded-lg border border-gold/20 bg-gold/5 text-gold hover:bg-gold/10 transition-all">▶ Ver Trailer</a>}
                        {f.link_video && <a href={f.link_video} target="_blank" rel="noopener noreferrer" className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-white/50 hover:text-white/70 transition-all">🎬 Vídeo Completo</a>}
                        {f.telefone && <a href={`tel:${f.telefone}`} className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-white/50 hover:text-white/70 transition-all">📞 {f.telefone}</a>}
                      </div>
                      {f.mensagem && (
                        <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4">
                          <p className="text-[9px] text-white/30 tracking-widest uppercase mb-2">Mensagem</p>
                          <p className="text-xs text-white/50 leading-relaxed whitespace-pre-wrap">{f.mensagem}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
