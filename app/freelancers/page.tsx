'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { linkPublico } from '@/lib/site-url'

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

const CATEGORIAS = [
  { key: 'FOTOGRAFO',  label: 'Fotógrafos',  curto: 'Foto',   cor: '#facc15' },
  { key: 'VIDEOGRAFO', label: 'Videógrafos', curto: 'Vídeo',  cor: '#34d399' },
  { key: 'ASSISTENTE', label: 'Assistentes', curto: 'Assist', cor: '#f472b6' },
  { key: 'EDITORES',   label: 'Editores',    curto: 'Edição', cor: '#fb923c' },
  { key: 'OUTRO',      label: 'Outros',      curto: 'Outros', cor: '#94a3b8' },
]

const COR = Object.fromEntries(CATEGORIAS.map(c => [c.key, c.cor])) as Record<string, string>
const LABEL = Object.fromEntries(CATEGORIAS.map(c => [c.key, c.label])) as Record<string, string>

const EMPTY_FORM: FormData = { nome: '', status: 'FOTOGRAFO', contato: '', email: '', nome_sos: '', contato_sos: '' }

// Número em formato WhatsApp: tira espaços e assume Portugal quando vem só com 9 dígitos
function linkWhatsapp(contato?: string | null): string | null {
  const so = (contato ?? '').replace(/[^\d+]/g, '')
  if (!so) return null
  let digitos = so.replace(/\D/g, '')
  if (digitos.startsWith('00')) digitos = digitos.slice(2)   // 00351… → 351…
  if (digitos.length < 9) return null
  if (digitos.length === 9) digitos = `351${digitos}`        // número nacional sem indicativo
  return `https://wa.me/${digitos}`
}

const iniciais = (nome: string) =>
  nome.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?'

const catDe = (status: string | null) =>
  STATUS_OPTIONS.includes(status ?? '') ? (status as string) : 'OUTRO'

// ── Som: blips curtos gerados no browser, sem ficheiros ──────────────────────
function useSfx() {
  const [ligado, setLigado] = useState(true)
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    setLigado(localStorage.getItem('rl-sfx') !== '0')
  }, [])

  function alternar() {
    setLigado(v => { localStorage.setItem('rl-sfx', v ? '0' : '1'); return !v })
  }

  function tocar(freq: number, dur = 0.06, vol = 0.05, tipo: OscillatorType = 'sine') {
    if (!ligado || typeof window === 'undefined') return
    try {
      const Ctx = window.AudioContext ?? (window as any).webkitAudioContext
      if (!Ctx) return
      const ctx = ctxRef.current ?? new Ctx()
      ctxRef.current = ctx
      if (ctx.state === 'suspended') ctx.resume()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = tipo
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(); osc.stop(ctx.currentTime + dur + 0.02)
    } catch { /* som é acessório, nunca parte a página */ }
  }

  return {
    ligado,
    alternar,
    clique:  () => tocar(760, 0.075, 0.045),
    sucesso: () => { tocar(880, 0.09, 0.05); setTimeout(() => tocar(1320, 0.12, 0.045), 90) },
    erro:    () => tocar(180, 0.16, 0.05, 'triangle'),
  }
}

// ── Número que sobe até ao valor ─────────────────────────────────────────────
function Contador({ valor, duracao = 900 }: { valor: number; duracao?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let raf = 0
    const inicio = performance.now()
    const passo = (t: number) => {
      const p = Math.min(1, (t - inicio) / duracao)
      setN(Math.round(valor * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [valor, duracao])
  return <>{n}</>
}

function CopiarUrlButton({ id, status, onSom }: { id: string; status?: string | null; onSom?: () => void }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    const url = status === 'EDITORES'
      ? linkPublico(`/painel-editor?freelancer=${id}`)
      : linkPublico(`/freelancers/${id}?view=freelancer`)
    navigator.clipboard.writeText(url).then(() => {
      onSom?.()
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
  const [filtro, setFiltro]       = useState<string | null>(null)
  const [busca, setBusca]         = useState('')
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

  const sfx = useSfx()

  async function load() {
    setLoading(true)
    const d = await fetch('/api/freelancers').then(r => r.json())
    setList(d.freelancers ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(f: Freelancer) {
    sfx.clique()
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
      sfx.sucesso()
      await load()
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover este membro da equipa?')) return
    setDeletingId(id)
    await fetch(`/api/freelancers?id=${id}`, { method: 'DELETE' })
    setDeletingId(null)
    sfx.erro()
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
    sfx.sucesso()
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

  // ── Contagens e lista visível ──────────────────────────────────────────────
  const contagens = useMemo(() => {
    const c: Record<string, number> = {}
    for (const f of list) { const k = catDe(f.status); c[k] = (c[k] ?? 0) + 1 }
    return c
  }, [list])

  const visiveis = useMemo(() => {
    const q = busca.trim().normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    return list.filter(f => {
      if (filtro && catDe(f.status) !== filtro) return false
      if (!q) return true
      const alvo = `${f.nome} ${f.email ?? ''} ${f.contato ?? ''}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
      return alvo.includes(q)
    })
  }, [list, filtro, busca])

  const comPassword = list.filter(f => f.password).length

  return (
    <main className="min-h-screen bg-[#08070a]">
      <style jsx global>{`
        @keyframes flSobe { from { opacity: 0; transform: translateY(14px) scale(.985) } to { opacity: 1; transform: none } }
        @keyframes flAurora {
          0%   { transform: translate3d(-8%, -4%, 0) scale(1) }
          50%  { transform: translate3d(8%, 4%, 0) scale(1.12) }
          100% { transform: translate3d(-8%, -4%, 0) scale(1) }
        }
        @keyframes flPulso { 0%,100% { opacity:.35 } 50% { opacity:1 } }
        .fl-card { animation: flSobe .5s cubic-bezier(.2,.7,.2,1) both }
        .fl-card:hover { transform: translateY(-4px) }
        .fl-aurora { animation: flAurora 18s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) {
          .fl-card, .fl-aurora { animation: none !important }
          .fl-card:hover { transform: none }
        }
      `}</style>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="fl-aurora absolute -top-40 -left-20 w-[70%] h-[420px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.16), transparent 65%)' }} />
          <div className="fl-aurora absolute -top-24 right-0 w-[45%] h-[360px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.10), transparent 65%)', animationDelay: '-6s' }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-10 pb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <Link href="/photo"
                className="text-[10px] tracking-[0.4em] text-white/30 hover:text-gold uppercase transition-colors">
                ‹ Dashboard
              </Link>
              <h1 className="font-cormorant font-light text-white text-5xl sm:text-6xl tracking-[0.05em] mt-3 leading-none">
                A <span className="italic text-gold">Equipa</span>
              </h1>
              <div className="w-20 h-px bg-gold/60 mt-5" />
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {[
                { href: '/painel-editor', txt: '✦ Maquete', gold: true },
                { href: '/freelancers/novos', txt: 'Novos' },
                { href: '/recrutamento', txt: 'Formulário' },
              ].map(({ href, txt, gold }) => (
                <Link key={href} href={href} onClick={sfx.clique}
                  className="px-4 py-2 rounded-xl text-[11px] font-semibold tracking-widest uppercase transition-all hover:-translate-y-0.5"
                  style={gold
                    ? { background: 'linear-gradient(135deg, rgba(201,164,92,0.18), rgba(201,164,92,0.04))', border: '1px solid rgba(201,164,92,0.5)', color: '#C9A45C', boxShadow: '0 0 16px rgba(201,164,92,0.2)' }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }}>
                  {txt}
                </Link>
              ))}
              <button onClick={() => { sfx.clique(); setShowAdd(true); setEditingId(null); setForm(EMPTY_FORM) }}
               
                className="px-4 py-2 rounded-xl bg-gold text-black text-[11px] font-bold tracking-widest uppercase transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-10px_rgba(201,168,76,0.9)]">
                + Adicionar
              </button>
              <button onClick={() => { sfx.alternar(); sfx.clique() }} title={sfx.ligado ? 'Silenciar' : 'Ligar som'}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ border: `1px solid ${sfx.ligado ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)'}`, color: sfx.ligado ? '#C9A45C' : 'rgba(255,255,255,0.3)' }}>
                {sfx.ligado ? '♪' : '✕'}
              </button>
            </div>
          </div>

          {/* Números da equipa */}
          <div className="flex items-end gap-8 mt-8 flex-wrap">
            <div>
              <p className="text-5xl font-extralight text-white leading-none"><Contador valor={list.length} /></p>
              <p className="text-[9px] tracking-[0.35em] uppercase text-white/30 mt-2">Pessoas</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            {CATEGORIAS.filter(c => (contagens[c.key] ?? 0) > 0).map(c => (
              <div key={c.key}>
                <p className="text-2xl font-light leading-none" style={{ color: c.cor }}>
                  <Contador valor={contagens[c.key] ?? 0} />
                </p>
                <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mt-2">{c.curto}</p>
              </div>
            ))}
            <div className="w-px h-12 bg-white/10" />
            <div>
              <p className="text-2xl font-light text-white/70 leading-none"><Contador valor={comPassword} /></p>
              <p className="text-[9px] tracking-[0.3em] uppercase text-white/25 mt-2">Com acesso</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">

        {/* ── Filtros + pesquisa ──────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap mb-7">
          <button onClick={() => { sfx.clique(); setFiltro(null) }}
            className="px-4 py-2 rounded-full text-[10px] tracking-[0.25em] uppercase font-semibold transition-all"
            style={{
              border: `1px solid ${filtro === null ? 'rgba(201,168,76,0.6)' : 'rgba(255,255,255,0.08)'}`,
              background: filtro === null ? 'rgba(201,168,76,0.12)' : 'transparent',
              color: filtro === null ? '#e8c76d' : 'rgba(255,255,255,0.4)',
            }}>
            Todos · {list.length}
          </button>

          {CATEGORIAS.map(c => {
            const n = contagens[c.key] ?? 0
            if (n === 0) return null
            const on = filtro === c.key
            return (
              <button key={c.key}
                onClick={() => { sfx.clique(); setFiltro(on ? null : c.key) }}
                className="px-4 py-2 rounded-full text-[10px] tracking-[0.25em] uppercase font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  border: `1px solid ${on ? c.cor : 'rgba(255,255,255,0.08)'}`,
                  background: on ? `${c.cor}1f` : 'transparent',
                  color: on ? c.cor : 'rgba(255,255,255,0.4)',
                  boxShadow: on ? `0 0 22px -6px ${c.cor}` : 'none',
                }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle"
                  style={{ background: c.cor, opacity: on ? 1 : 0.4 }} />
                {c.label} · {n}
              </button>
            )
          })}

          <div className="relative ml-auto">
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Procurar pessoa…"
              className="w-56 rounded-full pl-9 pr-4 py-2 text-[12px] text-white/80 placeholder-white/20 focus:outline-none transition-all focus:w-64"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-3.5 h-3.5">
                <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4-4" />
              </svg>
            </span>
          </div>
        </div>

        {/* ── Formulário de novo membro ───────────────────────────────────── */}
        {showAdd && (
          <div className="mb-8 rounded-2xl border border-gold/25 bg-gold/[0.03] p-5 space-y-3 fl-card">
            <p className="text-[10px] tracking-[0.3em] text-gold/70 uppercase mb-3">Novo Membro</p>
            <FormFields form={form} setForm={setForm} />
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => { sfx.clique(); setShowAdd(false) }} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.nome}
                className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                {saving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* ── Equipa ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-40 rounded-2xl border border-white/[0.05] bg-white/[0.015]"
                style={{ animation: 'flPulso 1.4s ease-in-out infinite', animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        ) : visiveis.length === 0 ? (
          <div className="py-20 text-center text-white/25 text-xs tracking-widest uppercase border border-white/[0.06] rounded-2xl">
            Ninguém encontrado
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visiveis.map((f, i) => {
              const cat = catDe(f.status)
              const cor = COR[cat]

              if (editingId === f.id) {
                return (
                  <div key={f.id} className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-gold/25 bg-gold/[0.03] p-5 space-y-3 fl-card">
                    <p className="text-[10px] tracking-[0.3em] text-gold/70 uppercase">A editar · {f.nome}</p>
                    <FormFields form={form} setForm={setForm} />
                    <div className="flex items-center justify-between pt-1">
                      <button onClick={() => handleDelete(f.id)} disabled={!!deletingId}
                        className="text-[10px] text-red-400/60 hover:text-red-400 transition-colors tracking-widest">
                        ✕ Remover
                      </button>
                      <div className="flex gap-2">
                        <button onClick={() => { sfx.clique(); setEditingId(null) }} className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-white/40 hover:text-white/70 transition-all">Cancelar</button>
                        <button onClick={handleSave} disabled={saving || !form.nome}
                          className="px-4 py-1.5 rounded-lg text-xs bg-gold text-black font-semibold hover:bg-gold/80 transition-all disabled:opacity-50">
                          {saving ? 'A guardar...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={f.id}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${cor}66`
                    e.currentTarget.style.boxShadow = `0 18px 40px -22px ${cor}, 0 0 0 1px ${cor}22`
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
                  className="fl-card group relative rounded-2xl overflow-hidden transition-all duration-300"
                  style={{
                    animationDelay: `${Math.min(i, 12) * 45}ms`,
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'linear-gradient(160deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))',
                  }}
                >
                  {/* Luz que segue o rato */}
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `radial-gradient(260px circle at var(--mx,50%) var(--my,50%), ${cor}1a, transparent 70%)` }} />

                  {/* Faixa da função */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: `linear-gradient(to bottom, ${cor}, transparent)` }} />

                  <div className="relative p-5">
                    <div className="flex items-start gap-3.5">
                      {/* Monograma */}
                      <Link href={`/freelancers/${f.id}`} onClick={sfx.clique}
                        className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-[13px] font-semibold tracking-wider transition-transform duration-300 group-hover:scale-105"
                        style={{ color: cor, border: `1px solid ${cor}55`, background: `${cor}14`, boxShadow: `0 0 20px -8px ${cor}` }}>
                        {iniciais(f.nome)}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/freelancers/${f.id}`} onClick={sfx.clique} className="block min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[14px] font-semibold text-white/90 group-hover:text-white transition-colors truncate">{f.nome}</span>
                            {f.is_template && (
                              <span className="text-[8px] px-2 py-0.5 rounded-full border tracking-widest uppercase font-semibold bg-white/10 text-white/80 border-white/25">⌘ Template</span>
                            )}
                            {f.password && <span className="text-[9px] text-white/25" title="Tem palavra-passe">🔑</span>}
                          </div>
                          <p className="text-[9px] tracking-[0.3em] uppercase mt-1" style={{ color: `${cor}cc` }}>
                            {LABEL[cat]}
                          </p>
                        </Link>

                        <div className="mt-3 space-y-1">
                          {f.contato && <p className="text-[11px] text-white/45 truncate">📞 {f.contato}</p>}
                          {f.email && <p className="text-[11px] text-white/45 truncate">✉ {f.email}</p>}
                          {f.nome_sos && (
                            <p className="text-[10px] text-white/25 truncate">
                              SOS: {f.nome_sos}{f.contato_sos ? ` · ${f.contato_sos}` : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ações — sobem ao passar o rato */}
                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-1.5 flex-wrap opacity-60 group-hover:opacity-100 transition-all duration-300">
                      {linkWhatsapp(f.contato) && (
                        <a href={linkWhatsapp(f.contato)!} target="_blank" rel="noopener noreferrer"
                          onClick={sfx.clique}
                          title={`Falar com ${f.nome} no WhatsApp`}
                          className="inline-flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-lg border tracking-widest uppercase font-bold transition-all hover:-translate-y-0.5"
                          style={{ background: 'rgba(37,211,102,0.10)', borderColor: 'rgba(37,211,102,0.45)', color: '#25D366' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm0 18.15h-.01a8.2 8.2 0 01-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 01-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 012.41 5.83c0 4.54-3.7 8.23-8.24 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.04s.87 2.37 1 2.53c.12.17 1.72 2.63 4.17 3.69.58.25 1.04.4 1.39.51.58.19 1.12.16 1.54.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.22-.17-.47-.29z"/>
                          </svg>
                          WhatsApp
                        </a>
                      )}

                      <Link href={`/painel-editor?freelancer=${f.id}&admin=1`} onClick={sfx.clique}
                        className="text-[9px] px-2.5 py-1 rounded-lg border tracking-widest uppercase font-bold transition-all hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg, rgba(201,164,92,0.15), rgba(201,164,92,0.04))', borderColor: 'rgba(201,164,92,0.45)', color: '#C9A45C' }}
                        title={`Ver e editar o painel de ${f.nome} como admin`}>
                        ✦ Maquete
                      </Link>

                      <Link href={`/login?next=${encodeURIComponent(`/freelancers/${f.id}?view=freelancer`)}`}
                        target="_blank" rel="noopener noreferrer" onClick={sfx.clique}
                        className="text-[9px] px-2.5 py-1 rounded-lg border tracking-widest uppercase font-bold transition-all hover:-translate-y-0.5"
                        style={{ background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.4)', color: '#34d399' }}
                        title={`Login como ${f.nome} (nova tab)`}>
                        👁 Ver ↗
                      </Link>

                      <CopiarUrlButton id={f.id} status={f.status} onSom={sfx.sucesso} />

                      <button onClick={() => { sfx.clique(); setPwEditId(pwEditId === f.id ? null : f.id); setPwDraft(f.password ?? '') }}
                        className="text-[9px] px-2.5 py-1 rounded-lg border border-white/10 text-white/30 hover:text-white/60 hover:border-white/25 transition-all tracking-widest uppercase">
                        🔑 PW
                      </button>

                      {removidoIds.has(f.id) ? (
                        <span className="text-[9px] px-2.5 py-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 tracking-widest uppercase">✓ Movido</span>
                      ) : (
                        <button onClick={() => handleRemoverDaEquipa(f)} disabled={removendoId === f.id}
                          className="text-[9px] px-2.5 py-1 rounded-lg border border-orange-500/25 bg-orange-500/5 text-orange-400/70 hover:text-orange-400 hover:border-orange-500/40 transition-all tracking-widest uppercase disabled:opacity-40">
                          {removendoId === f.id ? '...' : '− Equipa'}
                        </button>
                      )}

                      <button onClick={() => startEdit(f)}
                        className="ml-auto p-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/[0.06] transition-all">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>

                    {/* Palavra-passe */}
                    {pwEditId === f.id && (
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="text" value={pwDraft} onChange={e => setPwDraft(e.target.value)}
                          placeholder="ex: rl2026" autoFocus
                          className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors font-mono placeholder:text-white/15"
                        />
                        <button onClick={() => handleSavePassword(f.id)} disabled={pwSaving}
                          className="text-[9px] px-3 py-1.5 rounded-lg bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 transition-all tracking-widest uppercase disabled:opacity-40">
                          {pwSaving ? '...' : 'Guardar'}
                        </button>
                        <button onClick={() => setPwEditId(null)}
                          className="text-[9px] px-2.5 py-1.5 rounded-lg border border-white/10 text-white/30 hover:text-white/60 transition-all">✕</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Maquetes ────────────────────────────────────────────────────── */}
        <div className="mt-12">
          <div className="flex items-center gap-4 mb-5">
            <span className="text-[10px] tracking-[0.45em] uppercase text-white/30">Maquetes</span>
            <div className="flex-1 h-px bg-white/[0.07]" />
            <span className="text-[9px] tracking-[0.3em] uppercase text-white/20">2 painéis</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { href: '/painel-editor', tag: 'Editor de Vídeo', titulo: 'Editor de Vídeo',
                desc: 'Novos projetos, pagamentos, calendário, tarefas, biblioteca de músicas e workflow.' },
              { href: '/freelancers/8694241a-7530-4dfd-8619-a8bf15b9e15e?view=freelancer', tag: 'Fotógrafo', titulo: 'Fotógrafo',
                desc: 'Fluxo de fotografia: projetos, entregas, calendário e dados pessoais. Separado do editor.' },
            ].map(m => (
              <Link key={m.href} href={m.href} onClick={sfx.clique}
                className="group relative overflow-hidden rounded-2xl border border-gold/25 p-5 transition-all hover:border-gold/60 hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, rgba(24,18,9,0.7), rgba(11,11,11,0.85))' }}>
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.2), transparent 70%)' }} />
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl border border-gold/45 flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-500 group-hover:rotate-[8deg]"
                    style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(201,164,92,0.04))' }}>
                    <img src="/logo_rl_gold.png" alt="RL" className="w-8 h-8 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] tracking-[0.4em] uppercase text-gold/60 font-bold mb-1">{m.tag}</p>
                    <h3 className="font-cormorant text-2xl text-white leading-tight">
                      Maquete <span className="italic text-gold">{m.titulo}</span>
                    </h3>
                    <p className="text-[11px] text-white/45 mt-2 leading-relaxed">{m.desc}</p>
                    <span className="inline-flex items-center gap-1.5 mt-3 text-[10px] tracking-widest uppercase text-gold/85 font-bold">
                      Abrir painel <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-gold/0 via-gold/[0.06] to-gold/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

function FormFields({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  const inputCls = "w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/15"
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Nome *</label>
          <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome" className={inputCls} />
        </div>
        <div>
          <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Função</label>
          <select value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className={inputCls + ' cursor-pointer bg-zinc-900'}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Contato</label>
          <input value={form.contato ?? ''} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))} placeholder="9XX XXX XXX" className={inputCls} />
        </div>
        <div>
          <label className="block text-[9px] text-white/25 tracking-widest uppercase mb-1">Email</label>
          <input value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
