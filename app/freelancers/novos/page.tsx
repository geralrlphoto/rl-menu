'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type NovoFreelancer = {
  id: string
  nome: string
  instagram: string | null
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
  equipamento_cameras: string | null
  captacao_audio: string | null
  marca_drone: string | null
  link_trailer: string | null
  link_trailer2: string | null
  link_video: string | null
  link_video2: string | null
  avaliacao: string[]
  tipo_videos: string[]
  tempo_entrega: string | null
  software_edicao: string[]
  skills_editor: string | null
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
  nome: '', instagram: '', funcao: 'FOTOGRAFO', tipo_eventos: [] as string[], zona: '',
  telefone: '', valor_servico: '', valor_drone: '', valor_edicao: '',
  servicos_feitos: '', drone: '', faz_edicao: '', equipamento_cameras: '', captacao_audio: '', marca_drone: '',
  link_trailer: '', link_trailer2: '',
  link_video: '', link_video2: '', avaliacao: [] as string[],
  tipo_videos: [] as string[], tempo_entrega: '',
  software_edicao: [] as string[], skills_editor: '', mensagem: '',
}

// Cor por função — usada nas pílulas e nos cartões
const FUNCAO_COR: Record<string, string> = {
  FOTOGRAFO: '#facc15', VIDEOGRAFO: '#34d399', EDITOR: '#a78bfa',
  ASSISTENTE: '#f472b6', DRONE: '#60a5fa', OUTRO: '#94a3b8',
}

// Número em formato WhatsApp: assume Portugal quando vem só com 9 dígitos
function linkWhatsapp(contato?: string | null): string | null {
  const so = (contato ?? '').replace(/[^\d+]/g, '')
  if (!so) return null
  let digitos = so.replace(/\D/g, '')
  if (digitos.startsWith('00')) digitos = digitos.slice(2)
  if (digitos.length < 9) return null
  if (digitos.length === 9) digitos = `351${digitos}`
  return `https://wa.me/${digitos}`
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
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Instagram</label>
          <input value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@utilizador ou URL" className={inp} />
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
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Link Trailer 2</label>
          <input value={form.link_trailer2} onChange={e => set('link_trailer2', e.target.value)} placeholder="https://..." className={inp} />
        </div>
        <div>
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Link Vídeo Completo</label>
          <input value={form.link_video} onChange={e => set('link_video', e.target.value)} placeholder="https://..." className={inp} />
        </div>
        <div>
          <label className="block text-[10px] text-white/30 tracking-widest uppercase mb-1">Link Vídeo Completo 2</label>
          <input value={form.link_video2} onChange={e => set('link_video2', e.target.value)} placeholder="https://..." className={inp} />
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

  const semAcentos = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

  const filtered = list.filter(f => {
    const matchTab = activeTab === 'TODOS' || f.funcao === activeTab
    if (!matchTab) return false
    const q = semAcentos(search.trim())
    if (!q) return true
    const alvo = semAcentos([f.nome, f.zona, f.mensagem, f.telefone, f.equipamento_cameras].filter(Boolean).join(' '))
    return alvo.includes(q)
  })

  const countByTab = (tab: string) => tab === 'TODOS' ? list.length : list.filter(f => f.funcao === tab).length

  // Números do topo
  const comDrone = list.filter(f => (f.drone ?? '').toUpperCase() === 'SIM').length
  const comEdicao = list.filter(f => (f.faz_edicao ?? '').toUpperCase() === 'SIM').length
  const bemAvaliados = list.filter(f => parseInt(f.avaliacao?.[0] ?? '0') >= 4).length

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
    <main className="min-h-screen bg-[#08070a]">
      <style jsx global>{`
        @keyframes nvSobe { from { opacity: 0; transform: translateY(14px) scale(.985) } to { opacity: 1; transform: none } }
        @keyframes nvAurora {
          0%   { transform: translate3d(-8%, -4%, 0) scale(1) }
          50%  { transform: translate3d(8%, 4%, 0) scale(1.12) }
          100% { transform: translate3d(-8%, -4%, 0) scale(1) }
        }
        @keyframes nvPulso { 0%,100% { opacity:.35 } 50% { opacity:1 } }
        .nv-card { animation: nvSobe .5s cubic-bezier(.2,.7,.2,1) both }
        .nv-aurora { animation: nvAurora 20s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .nv-card, .nv-aurora { animation: none !important } }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="nv-aurora absolute -top-40 left-10 w-[60%] h-[400px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.14), transparent 65%)' }} />
          <div className="nv-aurora absolute -top-28 right-0 w-[45%] h-[340px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.10), transparent 65%)', animationDelay: '-7s' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link href="/freelancers"
                className="text-[10px] tracking-[0.4em] text-white/30 hover:text-gold uppercase transition-colors">
                ‹ A Equipa
              </Link>
              <h1 className="font-cormorant font-light text-white text-5xl sm:text-6xl tracking-[0.05em] mt-3 leading-none">
                Novos <span className="italic text-gold">Freelancers</span>
              </h1>
              <p className="text-[11px] text-white/35 mt-3 tracking-wide">
                Candidatos do formulário de recrutamento, à espera de entrar na equipa
              </p>
              <div className="w-20 h-px bg-gold/60 mt-5" />
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Link href="/recrutamento"
                className="px-4 py-2 rounded-xl text-[11px] font-semibold tracking-widest uppercase transition-all hover:-translate-y-0.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}>
                Formulário
              </Link>
              <button onClick={() => { setShowAdd(true); setEditingId(null) }}
                className="px-4 py-2 rounded-xl bg-gold text-black text-[11px] font-bold tracking-widest uppercase transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-10px_rgba(201,168,76,0.9)]">
                + Adicionar
              </button>
            </div>
          </div>

          <div className="flex items-end gap-8 mt-8 flex-wrap">
            <div>
              <p className="text-5xl font-extralight text-white leading-none">{list.length}</p>
              <p className="text-[9px] tracking-[0.35em] uppercase text-white/30 mt-2">Candidatos</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div>
              <p className="text-2xl font-light text-gold leading-none">{bemAvaliados}</p>
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mt-2">4★ ou mais</p>
            </div>
            <div>
              <p className="text-2xl font-light text-blue-300 leading-none">{comDrone}</p>
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mt-2">Com drone</p>
            </div>
            <div>
              <p className="text-2xl font-light text-purple-300 leading-none">{comEdicao}</p>
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mt-2">Fazem edição</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">

        {/* ── Filtros + pesquisa ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap mb-7">
          {tabs.map(tab => {
            const count = countByTab(tab)
            if (count === 0 && tab !== 'TODOS') return null
            const on = activeTab === tab
            const cor = tab === 'TODOS' ? '#C9A84C' : (FUNCAO_COR[tab] ?? '#94a3b8')
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-full text-[10px] tracking-[0.25em] uppercase font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  border: `1px solid ${on ? cor : 'rgba(255,255,255,0.08)'}`,
                  background: on ? `${cor}1f` : 'transparent',
                  color: on ? cor : 'rgba(255,255,255,0.4)',
                  boxShadow: on ? `0 0 22px -6px ${cor}` : 'none',
                }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
                  style={{ background: cor, opacity: on ? 1 : 0.4 }} />
                {tab} · {count}
              </button>
            )
          })}

          <div className="relative ml-auto">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Procurar nome, zona, notas…"
              className="w-60 rounded-full pl-9 pr-4 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none transition-all focus:w-72"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }} />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4-4" />
              </svg>
            </span>
          </div>
        </div>

        {/* ── Form adicionar ──────────────────────────────────────────────── */}
        {showAdd && (
          <div className="mb-7 nv-card">
            <FreelancerForm initial={EMPTY_FORM} onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
          </div>
        )}

        {/* ── Candidatos ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-44 rounded-2xl border border-white/[0.05] bg-white/[0.015]"
                style={{ animation: 'nvPulso 1.4s ease-in-out infinite', animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-white/25 text-xs tracking-widest uppercase border border-white/[0.06] rounded-2xl">
            Sem candidatos
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {filtered.map((f, i) => {
              if (editingId === f.id) {
                return (
                  <div key={f.id} className="lg:col-span-2 nv-card">
                    <FreelancerForm
                      initial={{ ...EMPTY_FORM, ...f, servicos_feitos: String(f.servicos_feitos ?? '') }}
                      onSave={form => handleEdit(f.id, form)}
                      onCancel={() => setEditingId(null)}
                      saving={saving}
                    />
                  </div>
                )
              }

              const cor = FUNCAO_COR[f.funcao ?? ''] ?? '#94a3b8'
              const aberto = expanded === f.id
              const wa = linkWhatsapp(f.telefone)

              return (
                <div key={f.id}
                  className="nv-card group relative rounded-2xl overflow-hidden transition-all duration-300"
                  style={{
                    animationDelay: `${Math.min(i, 10) * 45}ms`,
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${cor}55`
                    e.currentTarget.style.boxShadow = `0 18px 40px -24px ${cor}`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                  onMouseMove={e => {
                    const r = e.currentTarget.getBoundingClientRect()
                    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`)
                    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`)
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `radial-gradient(280px circle at var(--mx,50%) var(--my,50%), ${cor}14, transparent 70%)` }} />
                  <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: `linear-gradient(to bottom, ${cor}, transparent)` }} />

                  <div className="relative p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-[13px] font-semibold tracking-wider"
                        style={{ color: cor, border: `1px solid ${cor}55`, background: `${cor}14`, boxShadow: `0 0 20px -8px ${cor}` }}>
                        {(f.nome || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-white/90 truncate">{f.nome || '—'}</p>
                            <p className="text-[9px] tracking-[0.3em] uppercase mt-1" style={{ color: `${cor}cc` }}>
                              {f.funcao ?? 'Sem função'}
                            </p>
                          </div>
                          <AvaliacaoStars avaliacao={f.avaliacao} />
                        </div>

                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          {f.zona && <span className="text-[10px] text-white/40">📍 {f.zona}</span>}
                          {f.valor_servico && <span className="text-[10px] text-white/40">💶 {f.valor_servico}</span>}
                          {f.telefone && <span className="text-[10px] text-white/40">📞 {f.telefone}</span>}
                        </div>

                        {/* Etiquetas rápidas */}
                        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                          {(f.drone ?? '').toUpperCase() === 'SIM' && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full border border-blue-500/25 bg-blue-500/10 text-blue-300">🚁 Drone</span>
                          )}
                          {(f.faz_edicao ?? '').toUpperCase() === 'SIM' && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full border border-purple-500/25 bg-purple-500/10 text-purple-300">✂️ Edição</span>
                          )}
                          {f.tempo_entrega && (
                            <span className="text-[9px] px-2 py-0.5 rounded-full border border-white/10 text-white/35">⏱ {f.tempo_entrega}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-1.5 flex-wrap">
                      {wa && (
                        <a href={wa} target="_blank" rel="noopener noreferrer"
                          title={`Falar com ${f.nome} no WhatsApp`}
                          className="inline-flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-lg border tracking-widest uppercase font-bold transition-all hover:-translate-y-0.5"
                          style={{ background: 'rgba(37,211,102,0.10)', borderColor: 'rgba(37,211,102,0.45)', color: '#25D366' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.15h-.01a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.04s.87 2.37 1 2.53c.12.17 1.72 2.63 4.17 3.69.58.25 1.04.4 1.39.51.58.19 1.12.16 1.54.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.22-.17-.47-.29z"/>
                          </svg>
                          WhatsApp
                        </a>
                      )}

                      {f.instagram && (
                        <a href={f.instagram} target="_blank" rel="noopener noreferrer"
                          className="text-[9px] px-2.5 py-1 rounded-lg border border-pink-500/30 bg-pink-500/5 text-pink-300 hover:bg-pink-500/10 transition-all tracking-widest uppercase font-bold hover:-translate-y-0.5">
                          📷 Insta
                        </a>
                      )}

                      {(f.link_trailer || f.link_video) && (
                        <a href={(f.link_trailer || f.link_video) as string} target="_blank" rel="noopener noreferrer"
                          className="text-[9px] px-2.5 py-1 rounded-lg border border-gold/35 bg-gold/5 text-gold hover:bg-gold/10 transition-all tracking-widest uppercase font-bold hover:-translate-y-0.5">
                          ▶ Trabalho
                        </a>
                      )}

                      {juntadoIds.has(f.id) ? (
                        <span className="text-[9px] px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 tracking-widest uppercase">✓ Na equipa</span>
                      ) : (
                        <button onClick={() => handleJuntarEquipa(f)} disabled={juntandoId === f.id}
                          className="text-[9px] px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300 hover:bg-emerald-500/15 transition-all tracking-widest uppercase font-bold disabled:opacity-40">
                          {juntandoId === f.id ? '...' : '+ Equipa'}
                        </button>
                      )}

                      <button onClick={() => setExpanded(aberto ? null : f.id)}
                        className="text-[9px] px-2.5 py-1 rounded-lg border border-white/10 text-white/35 hover:text-white/70 hover:border-white/25 transition-all tracking-widest uppercase">
                        {aberto ? 'Fechar' : 'Ficha'}
                      </button>

                      <button onClick={() => setEditingId(f.id)}
                        className="ml-auto p-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/[0.06] transition-all">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(f.id)}
                        className="p-1.5 rounded-lg text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all text-[11px]">
                        ✕
                      </button>
                    </div>

                    {/* Ficha completa */}
                    {aberto && (
                      <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-4 nv-card">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {([
                            ['Valor por Serviço', f.valor_servico],
                            ['Valor Drone', f.valor_drone],
                            ['Valor Edição 20m', f.valor_edicao],
                            ['Tempo de Entrega', f.tempo_entrega],
                            ['Serviços Feitos', f.servicos_feitos != null ? String(f.servicos_feitos) : null],
                          ] as [string, string | null][]).filter(([, v]) => v).map(([label, val]) => (
                            <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                              <p className="text-[8.5px] text-white/30 tracking-[0.25em] uppercase mb-1">{label}</p>
                              <p className="text-sm font-semibold text-white/75">{val}</p>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {f.drone && <span className="text-[10px] px-3 py-1 rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-300">🚁 Drone: {f.drone}{f.marca_drone ? ` · ${f.marca_drone}` : ''}</span>}
                          {f.equipamento_cameras && <span className="text-[10px] px-3 py-1 rounded-lg border border-white/10 bg-white/[0.03] text-white/50">📷 {f.equipamento_cameras}</span>}
                          {f.captacao_audio && <span className="text-[10px] px-3 py-1 rounded-lg border border-white/10 bg-white/[0.03] text-white/50">🎙️ {f.captacao_audio}</span>}
                          {f.faz_edicao && <span className="text-[10px] px-3 py-1 rounded-lg border border-purple-500/20 bg-purple-500/10 text-purple-300">✂️ Edição: {f.faz_edicao}</span>}
                          {f.tipo_eventos?.map(t => (
                            <span key={t} className="text-[10px] px-3 py-1 rounded-lg border border-white/10 text-white/35">{t}</span>
                          ))}
                          {f.tipo_videos?.map(t => (
                            <span key={t} className="text-[10px] px-3 py-1 rounded-lg border border-white/10 text-white/35">🎬 {t}</span>
                          ))}
                          {f.software_edicao?.map(s => (
                            <span key={s} className="text-[10px] px-3 py-1 rounded-lg border border-violet-500/25 bg-violet-500/10 text-violet-300">🎛️ {s}</span>
                          ))}
                          {(f.skills_editor ?? '').split(' · ').filter(Boolean).map(s => (
                            <span key={s} className="text-[10px] px-3 py-1 rounded-lg border border-violet-500/20 bg-violet-500/[0.06] text-violet-200/80">✦ {s}</span>
                          ))}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {f.link_trailer && <a href={f.link_trailer} target="_blank" rel="noopener noreferrer" className="text-[10px] px-3 py-1.5 rounded-lg border border-gold/20 bg-gold/5 text-gold hover:bg-gold/10 transition-all">▶ Trailer{f.link_trailer2 ? ' 1' : ''}</a>}
                          {f.link_trailer2 && <a href={f.link_trailer2} target="_blank" rel="noopener noreferrer" className="text-[10px] px-3 py-1.5 rounded-lg border border-gold/20 bg-gold/5 text-gold hover:bg-gold/10 transition-all">▶ Trailer 2</a>}
                          {f.link_video && <a href={f.link_video} target="_blank" rel="noopener noreferrer" className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-white/50 hover:text-white/70 transition-all">🎬 Vídeo{f.link_video2 ? ' 1' : ''}</a>}
                          {f.link_video2 && <a href={f.link_video2} target="_blank" rel="noopener noreferrer" className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-white/50 hover:text-white/70 transition-all">🎬 Vídeo 2</a>}
                          {f.telefone && <a href={`tel:${f.telefone}`} className="text-[10px] px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-white/50 hover:text-white/70 transition-all">📞 Ligar</a>}
                        </div>

                        {f.mensagem && (
                          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                            <p className="text-[9px] text-white/30 tracking-[0.25em] uppercase mb-2">Mensagem</p>
                            <p className="text-xs text-white/55 leading-relaxed whitespace-pre-wrap">{f.mensagem}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
