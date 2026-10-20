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

const FUNCAO_LABEL: Record<string, string> = {
  FOTOGRAFO: 'Fotógrafos', VIDEOGRAFO: 'Videógrafos', EDITOR: 'Editores',
  ASSISTENTE: 'Assistentes', DRONE: 'Drone', OUTRO: 'Outros',
}
// O webhook antigo do Tally gravava as opções com o id (ex.: 71107c57-…) em vez do texto
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-/i
const funcaoValida = (f: string | null) => (f && !UUID_RE.test(f) ? f : null)

const EMPTY_FORM = {
  nome: '', instagram: '', funcao: 'FOTOGRAFO', tipo_eventos: [] as string[], zona: '',
  telefone: '', valor_servico: '', valor_drone: '', valor_edicao: '',
  servicos_feitos: '', drone: '', faz_edicao: '', equipamento_cameras: '', captacao_audio: '', marca_drone: '',
  link_trailer: '', link_trailer2: '',
  link_video: '', link_video2: '', avaliacao: [] as string[],
  tipo_videos: [] as string[], tempo_entrega: '',
  software_edicao: [] as string[], skills_editor: '', mensagem: '',
}

// Número em formato WhatsApp: assume Portugal quando vem só com 9 dígitos
function linkWhatsapp(contato?: string | null, texto?: string): string | null {
  const so = (contato ?? '').replace(/[^\d+]/g, '')
  if (!so) return null
  let digitos = so.replace(/\D/g, '')
  if (digitos.startsWith('00')) digitos = digitos.slice(2)
  if (digitos.length < 9) return null
  if (digitos.length === 9) digitos = `351${digitos}`
  return texto ? `https://wa.me/${digitos}?text=${encodeURIComponent(texto)}` : `https://wa.me/${digitos}`
}

// Respostas ao freelancer que preencheu o formulário (sem emojis: no wa.me viram "?")
// 'analisar' = vamos ver o portfólio; 'completa' = equipa de edição fechada, ficamos com o contacto
function mensagemFreelancer(tipo: 'analisar' | 'completa', nome?: string | null): string {
  const primeiro = (nome ?? '').trim().split(/\s+/)[0]
  const corpo = tipo === 'analisar'
    ? 'Agora vamos analisar com atenção o teu portfólio e o teu trabalho. Em breve entramos em contacto contigo com mais informações.'
    : 'De momento a nossa equipa de edição já está completa e não pretendemos alargá-la. Ainda assim, vamos ficar com o teu contacto para que no futuro possamos trabalhar juntos.'
  return [
    primeiro ? `Olá ${primeiro}, tudo bem?` : 'Olá, tudo bem?',
    '',
    'Muito obrigado pelo teu interesse em trabalhar com a RL PhotoVideo!',
    '',
    corpo,
    '',
    'Um abraço grande,',
    'RL PhotoVideo',
    '',
    'Visite-nos: www.rlphotovideo.pt',
  ].join('\n')
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
  const inp = "w-full bg-black/40 border border-white/10 rounded-[14px] px-4 py-2.5 text-[14px] text-white/85 outline-none focus:border-[#C9A84C]/55 transition-colors placeholder:text-white/20 [color-scheme:dark]"

  return (
    <div className="rounded-[22px] border border-white/[0.08] bg-[#111111]/90 p-5 sm:p-6 space-y-4" style={{ borderLeft: '2px solid #C9A84C' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Nome *</label>
          <input value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome do freelancer" className={inp} />
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Função</label>
          <select value={form.funcao} onChange={e => set('funcao', e.target.value)} className={inp + ' cursor-pointer'}>
            {FUNCAO_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Telefone</label>
          <input value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="9xx xxx xxx" className={inp} />
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Instagram</label>
          <input value={form.instagram} onChange={e => set('instagram', e.target.value)} placeholder="@utilizador ou URL" className={inp} />
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Zona de Residência</label>
          <input value={form.zona} onChange={e => set('zona', e.target.value)} placeholder="ex: Lisboa" className={inp} />
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Valor por Serviço</label>
          <input value={form.valor_servico} onChange={e => set('valor_servico', e.target.value)} placeholder="ex: 250€" className={inp} />
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Valor Drone</label>
          <input value={form.valor_drone} onChange={e => set('valor_drone', e.target.value)} placeholder="ex: 100€" className={inp} />
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Valor Edição 20min</label>
          <input value={form.valor_edicao} onChange={e => set('valor_edicao', e.target.value)} placeholder="ex: 80€" className={inp} />
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Drone</label>
          <select value={form.drone} onChange={e => set('drone', e.target.value)} className={inp + ' cursor-pointer'}>
            <option value="">—</option>
            <option value="SIM">SIM</option>
            <option value="NÃO">NÃO</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Faz Edição de Vídeo</label>
          <select value={form.faz_edicao} onChange={e => set('faz_edicao', e.target.value)} className={inp + ' cursor-pointer'}>
            <option value="">—</option>
            <option value="SIM">SIM</option>
            <option value="NÃO">NÃO</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Avaliação</label>
          <AvaliacaoEditor value={form.avaliacao} onChange={v => set('avaliacao', v)} />
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Link Trailer</label>
          <input value={form.link_trailer} onChange={e => set('link_trailer', e.target.value)} placeholder="https://..." className={inp} />
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Link Trailer 2</label>
          <input value={form.link_trailer2} onChange={e => set('link_trailer2', e.target.value)} placeholder="https://..." className={inp} />
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Link Vídeo Completo</label>
          <input value={form.link_video} onChange={e => set('link_video', e.target.value)} placeholder="https://..." className={inp} />
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Link Vídeo Completo 2</label>
          <input value={form.link_video2} onChange={e => set('link_video2', e.target.value)} placeholder="https://..." className={inp} />
        </div>
      </div>
      <div>
        <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Mensagem / Notas</label>
        <textarea value={form.mensagem} onChange={e => set('mensagem', e.target.value)}
          rows={3} placeholder="Mensagem de apresentação ou notas..." className={inp + ' resize-none'} />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="px-4 py-2 rounded-full text-[13px] border border-white/10 text-white/50 hover:text-white transition-all">Cancelar</button>
        <button onClick={() => onSave(form)} disabled={saving || !form.nome}
          className="px-5 py-2 rounded-full text-[13px] font-semibold text-black transition-all disabled:opacity-50" style={{ background: '#C9A84C' }}>
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
  const tabsFromData = Array.from(new Set(list.map(f => funcaoValida(f.funcao)).filter(Boolean) as string[]))
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

  const OURO = '#C9A84C'
  const btnAcao = 'inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border tracking-[0.08em] uppercase font-semibold transition-all hover:-translate-y-0.5'
  const nomeFuncao = (t: string) => t === 'TODOS' ? 'Todos' : (FUNCAO_LABEL[t] ?? t.charAt(0) + t.slice(1).toLowerCase())

  return (
    <main className="min-h-screen bg-[#070707] overflow-x-clip font-cond">
      <style jsx global>{`
        @keyframes nvSobe { from { opacity: 0; transform: translateY(14px) scale(.985) } to { opacity: 1; transform: none } }
        @keyframes nvPulso { 0%,100% { opacity:.35 } 50% { opacity:1 } }
        .nv-card { animation: nvSobe .5s cubic-bezier(.2,.7,.2,1) both }
        @media (prefers-reduced-motion: reduce) { .nv-card { animation: none !important } }
      `}</style>

      {/* ── CAPA (como o /casamentos) ───────────────────────────────────── */}
      <section className="relative min-h-[560px] lg:min-h-[72vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/eventos-hero-2027.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-[center_35%] grayscale opacity-40 lg:opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Recrutamento · Candidaturas
        </p>

        <div className="relative flex-1 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_330px] gap-10 items-end pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-14 lg:pt-8 pb-12 lg:pb-16">
          <div className="min-w-0 flex flex-col h-full">
            <Link href="/freelancers" className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors self-start">‹ A equipa</Link>
            <div className="mt-auto pt-20">
              <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
              <h1 className="font-bold uppercase text-white leading-[0.88] text-[48px] sm:text-[84px] lg:text-[80px] xl:text-[118px] 2xl:text-[138px] mt-2">
                Candidatos
              </h1>
              <div className="flex items-center gap-4 mt-5">
                <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
                <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                  À espera de entrar na <span className="text-[#C9A84C]">equipa</span>
                </p>
              </div>
              <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-xl">
                {loading ? 'A carregar as candidaturas…' : `${list.length} candidaturas do formulário de recrutamento. Avalia, fala por WhatsApp e junta à equipa.`}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <button onClick={() => { setShowAdd(true); setEditingId(null) }}
                  className="inline-flex items-center gap-2.5 border border-[#C9A84C]/70 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/30 px-7 py-3.5 text-[15px] font-semibold tracking-[0.18em] uppercase text-white transition-all shadow-[0_0_34px_-12px_rgba(201,168,76,0.7)]">
                  Adicionar candidato
                  <span className="text-[#C9A84C]">+</span>
                </button>
                <Link href="/recrutamento"
                  className="inline-flex items-center gap-2 border border-white/15 hover:border-white/35 bg-black/30 px-5 py-3.5 text-[14px] font-semibold tracking-[0.18em] uppercase text-white/85 transition-all">
                  / Formulário
                </Link>
              </div>
            </div>
          </div>

          <aside className="rounded-[22px] border border-[#C9A84C]/30 bg-[#111111]/80 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(201,168,76,0.5)]">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_#C9A84C]" />
              As candidaturas
            </p>
            <div className="grid grid-cols-2 mt-3">
              {[
                { l: 'Candidatos', v: list.length, ouro: true },
                { l: '4★ ou mais', v: bemAvaliados },
                { l: 'Com drone', v: comDrone },
                { l: 'Fazem edição', v: comEdicao },
              ].map((x, i) => (
                <div key={x.l} className={`py-3 ${i % 2 === 0 ? 'pr-4 border-r border-white/[0.07]' : 'pl-4'} ${i < 2 ? 'border-b border-white/[0.07]' : ''}`}>
                  <p className="text-[11px] text-white/50">{x.l}</p>
                  <p className={`font-semibold text-[24px] leading-none mt-1.5 ${x.ouro ? 'text-[#C9A84C]' : 'text-white'}`}>{x.v}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-5 sm:px-10 pt-4 pb-20">

        {/* ── Título + filtros + pesquisa ───────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Candidaturas</p>
            <h2 className="font-semibold text-white text-[30px] sm:text-[34px] leading-tight mt-1">
              {nomeFuncao(activeTab)} <span className="text-white/30 font-normal">· {filtered.length}</span>
            </h2>
          </div>
          <div className="relative">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Procurar nome, zona, notas…"
              className="w-64 rounded-full pl-10 pr-4 py-2.5 text-[14px] text-white/85 placeholder-white/25 focus:outline-none transition-all focus:w-72 focus:border-[#C9A84C]/50"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4-4" /></svg>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-8">
          {tabs.map(tab => {
            const count = countByTab(tab)
            if (count === 0 && tab !== 'TODOS') return null
            const on = activeTab === tab
            return (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-full text-[13px] font-semibold tracking-[0.06em] transition-all hover:-translate-y-0.5"
                style={{
                  border: `1px solid ${on ? 'rgba(201,168,76,0.7)' : 'rgba(255,255,255,0.1)'}`,
                  background: on ? 'rgba(201,168,76,0.15)' : 'transparent',
                  color: on ? '#fff' : 'rgba(255,255,255,0.5)',
                  boxShadow: on ? '0 0 26px -10px rgba(201,168,76,0.8)' : 'none',
                }}>
                {nomeFuncao(tab)} <span style={{ color: on ? OURO : 'rgba(255,255,255,0.3)' }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* ── Form adicionar ──────────────────────────────────────────────── */}
        {showAdd && (
          <div className="mb-8 nv-card">
            <FreelancerForm initial={EMPTY_FORM} onSave={handleAdd} onCancel={() => setShowAdd(false)} saving={saving} />
          </div>
        )}

        {/* ── Candidatos ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-64 rounded-[22px] border border-white/[0.05] bg-white/[0.015]"
                style={{ animation: 'nvPulso 1.4s ease-in-out infinite', animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-white/30 text-[14px] border border-white/[0.06] rounded-[22px]">Sem candidatos</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
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

              const aberto = expanded === f.id
              const waOpcoes = ([
                ['analisar', 'Analisar', 'Agradecer e dizer que vamos analisar o portfólio'],
                ['completa', 'Equipa completa', 'Agradecer, equipa de edição completa, ficamos com o contacto'],
              ] as const).map(([tipo, label, title]) => ({ tipo, label, title, href: linkWhatsapp(f.telefone, mensagemFreelancer(tipo, f.nome)) }))
              const fc = funcaoValida(f.funcao)

              return (
                <div key={f.id}
                  className="nv-card group relative rounded-[22px] overflow-hidden border border-white/[0.08] bg-[#111111] transition-all duration-300 hover:border-[#C9A84C]/45 hover:shadow-[0_0_50px_-20px_rgba(201,168,76,0.6)]"
                  style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}>
                  <div className="relative p-5">
                    <div className="flex items-start gap-3.5">
                      <div className="shrink-0 w-14 h-14 rounded-full flex items-center justify-center font-bold text-[20px]"
                        style={{ color: OURO, border: `1px solid ${OURO}88`, background: 'rgba(201,168,76,0.08)', boxShadow: '0 0 26px -10px rgba(201,168,76,0.7)' }}>
                        {(f.nome || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold uppercase text-white text-[21px] leading-tight truncate">{f.nome || '—'}</p>
                          <AvaliacaoStars avaliacao={f.avaliacao} />
                        </div>
                        <span className="inline-block mt-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase px-3 py-0.5 rounded-full border border-[#C9A84C]/45 text-[#C9A84C]">
                          {fc ? nomeFuncao(fc) : 'Sem função'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-x-4 gap-y-1 mt-3 flex-wrap text-[13px] text-white/50">
                      {f.zona && !UUID_RE.test(f.zona) && <span>{f.zona}</span>}
                      {f.valor_servico && <span>{f.valor_servico}</span>}
                      {f.telefone && <span>{f.telefone}</span>}
                    </div>

                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                      {(f.drone ?? '').toUpperCase() === 'SIM' && <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-white/12 text-white/60">Drone</span>}
                      {(f.faz_edicao ?? '').toUpperCase() === 'SIM' && <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-white/12 text-white/60">Faz edição</span>}
                      {f.tempo_entrega && <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-white/12 text-white/45">Entrega {f.tempo_entrega.toLowerCase()}</span>}
                    </div>

                    {/* Ações */}
                    <div className="mt-4 pt-3.5 border-t border-white/[0.07] flex items-center gap-1.5 flex-wrap">
                      {waOpcoes.map(o => o.href && (
                        <a key={o.tipo} href={o.href} target="_blank" rel="noopener noreferrer" title={`WhatsApp a ${f.nome}: ${o.title}`}
                          className={btnAcao} style={{ background: 'rgba(37,211,102,0.10)', borderColor: 'rgba(37,211,102,0.45)', color: '#25D366' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm4.52 11.99c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.04s.87 2.37 1 2.53c.12.17 1.72 2.63 4.17 3.69.58.25 1.04.4 1.39.51.58.19 1.12.16 1.54.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.22-.17-.47-.29z"/>
                          </svg>
                          {o.label}
                        </a>
                      ))}
                      {f.instagram && (
                        <a href={f.instagram} target="_blank" rel="noopener noreferrer" className={`${btnAcao} border-white/12 text-white/60 hover:text-white hover:border-white/30`}>Instagram ↗</a>
                      )}
                      {(f.link_trailer || f.link_video) && (
                        <a href={(f.link_trailer || f.link_video) as string} target="_blank" rel="noopener noreferrer"
                          className={btnAcao} style={{ background: 'rgba(201,168,76,0.12)', borderColor: 'rgba(201,168,76,0.5)', color: OURO }}>▶ Trabalho</a>
                      )}
                      {juntadoIds.has(f.id) ? (
                        <span className={`${btnAcao} border-emerald-500/40 bg-emerald-500/10 text-emerald-400`}>✓ Na equipa</span>
                      ) : (
                        <button onClick={() => handleJuntarEquipa(f)} disabled={juntandoId === f.id}
                          className={`${btnAcao} disabled:opacity-40`} style={{ borderColor: 'rgba(201,168,76,0.7)', background: OURO, color: '#0b0b0b' }}>
                          {juntandoId === f.id ? '...' : '+ Equipa'}
                        </button>
                      )}
                      <button onClick={() => setExpanded(aberto ? null : f.id)} className={`${btnAcao} border-white/12 text-white/50 hover:text-white hover:border-white/30`}>
                        {aberto ? 'Fechar' : 'Ficha'}
                      </button>
                      <button onClick={() => setEditingId(f.id)} title="Editar"
                        className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-white/35 hover:text-[#C9A84C] hover:bg-white/[0.05] transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDelete(f.id)} title="Remover candidato"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-all text-[13px]">✕</button>
                    </div>

                    {/* Ficha completa */}
                    {aberto && (
                      <div className="mt-4 pt-4 border-t border-white/[0.07] space-y-4 nv-card">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {([
                            ['Valor por serviço', f.valor_servico],
                            ['Valor drone', f.valor_drone],
                            ['Valor edição 20 min', f.valor_edicao],
                            ['Tempo de entrega', f.tempo_entrega],
                            ['Serviços feitos', f.servicos_feitos != null ? String(f.servicos_feitos) : null],
                          ] as [string, string | null][]).filter(([, v]) => v).map(([label, val]) => (
                            <div key={label} className="rounded-[16px] border border-white/[0.07] bg-black/30 p-3">
                              <p className="text-[11px] text-white/40">{label}</p>
                              <p className="text-[16px] font-semibold text-white mt-1">{val}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            f.drone && !UUID_RE.test(f.drone) ? `Drone: ${f.drone}${f.marca_drone ? ` · ${f.marca_drone}` : ''}` : null,
                            f.equipamento_cameras ? `Câmaras: ${f.equipamento_cameras}` : null,
                            f.captacao_audio ? `Áudio: ${f.captacao_audio}` : null,
                            f.faz_edicao && !UUID_RE.test(f.faz_edicao) ? `Edição: ${f.faz_edicao}` : null,
                            ...(f.tipo_eventos ?? []), ...(f.tipo_videos ?? []), ...(f.software_edicao ?? []),
                            ...(f.skills_editor ?? '').split(' · ').filter(Boolean),
                          ].filter(Boolean).map(t => (
                            <span key={t as string} className="text-[12px] px-3 py-1 rounded-full border border-white/10 bg-white/[0.02] text-white/60">{t}</span>
                          ))}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {f.link_trailer && <a href={f.link_trailer} target="_blank" rel="noopener noreferrer" className={`${btnAcao} border-[#C9A84C]/40 text-[#C9A84C]`}>▶ Trailer{f.link_trailer2 ? ' 1' : ''}</a>}
                          {f.link_trailer2 && <a href={f.link_trailer2} target="_blank" rel="noopener noreferrer" className={`${btnAcao} border-[#C9A84C]/40 text-[#C9A84C]`}>▶ Trailer 2</a>}
                          {f.link_video && <a href={f.link_video} target="_blank" rel="noopener noreferrer" className={`${btnAcao} border-white/12 text-white/60`}>Vídeo{f.link_video2 ? ' 1' : ''} ↗</a>}
                          {f.link_video2 && <a href={f.link_video2} target="_blank" rel="noopener noreferrer" className={`${btnAcao} border-white/12 text-white/60`}>Vídeo 2 ↗</a>}
                          {f.telefone && <a href={`tel:${f.telefone}`} className={`${btnAcao} border-white/12 text-white/60`}>Ligar</a>}
                        </div>
                        {f.mensagem && (
                          <div className="rounded-[16px] border border-white/[0.07] bg-black/30 p-4" style={{ borderLeft: `2px solid ${OURO}99` }}>
                            <p className="text-[11px] text-[#C9A84C] tracking-[0.14em] uppercase mb-2">Mensagem</p>
                            <p className="text-[14px] text-white/65 leading-relaxed whitespace-pre-wrap">{f.mensagem}</p>
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
      </section>
    </main>
  )
}
