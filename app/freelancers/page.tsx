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
  foto_url?: string | null
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
      className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border tracking-[0.08em] uppercase font-semibold transition-all hover:-translate-y-0.5 ${copied ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' : 'border-white/12 text-white/45 hover:text-white hover:border-white/30'}`}>
      {copied ? '✓ Copiado' : 'Copiar link'}
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

  // Visual igual ao /casamentos e /photo: preto, dourado suave, fotos locais
  const OURO = '#C9A84C'
  const btnAcao = 'inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full border tracking-[0.08em] uppercase font-semibold transition-all hover:-translate-y-0.5'
  const porCategoria = CATEGORIAS.filter(c => (contagens[c.key] ?? 0) > 0)

  return (
    <main className="min-h-screen bg-[#070707] overflow-x-clip font-cond">
      <style jsx global>{`
        @keyframes flSobe { from { opacity: 0; transform: translateY(14px) scale(.985) } to { opacity: 1; transform: none } }
        @keyframes flPulso { 0%,100% { opacity:.35 } 50% { opacity:1 } }
        .fl-card { animation: flSobe .5s cubic-bezier(.2,.7,.2,1) both }
        .fl-foto { filter: grayscale(1) brightness(.6); transform: scale(1.02); transition: filter .6s ease, transform 1.2s cubic-bezier(.19,1,.22,1) }
        .fl-card:hover .fl-foto { filter: grayscale(0) brightness(.85); transform: scale(1.07) }
        .fl-linha { width: 0; transition: width .6s cubic-bezier(.19,1,.22,1) }
        .fl-card:hover .fl-linha { width: 100% }
        @media (prefers-reduced-motion: reduce) { .fl-card { animation: none !important } }
      `}</style>

      {/* ── CAPA (como o /casamentos) ───────────────────────────────────── */}
      <section className="relative min-h-[600px] lg:min-h-[78vh] flex flex-col overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-[64%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/boas-vindas-camera.webp" alt="" className="absolute inset-0 w-full h-full object-cover object-center grayscale opacity-40 lg:opacity-55" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, #070707 0%, rgba(7,7,7,0.75) 30%, rgba(7,7,7,0.15) 70%, rgba(7,7,7,0.5) 100%)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, #070707 0%, transparent 35%, transparent 75%, rgba(7,7,7,0.6) 100%)' }} />
        </div>
        <div className="absolute top-0 bottom-0 left-6 sm:left-10 lg:left-14 w-px bg-[#C9A84C]/45" />
        <p className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 text-[11px] tracking-[0.4em] uppercase text-white/30 [writing-mode:vertical-rl]">
          Fotografia · Vídeo · Edição
        </p>

        <div className="relative flex-1 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_330px] gap-10 items-end pl-11 sm:pl-16 lg:pl-24 pr-5 sm:pr-16 pt-14 lg:pt-8 pb-12 lg:pb-16">
          <div className="min-w-0 flex flex-col h-full">
            <div className="flex items-center gap-4">
              <Link href="/photo" onClick={sfx.clique} className="text-[14px] text-white/45 hover:text-[#C9A84C] transition-colors">‹ Menu principal</Link>
              <button onClick={() => { sfx.alternar(); sfx.clique() }} title={sfx.ligado ? 'Silenciar' : 'Ligar som'}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] transition-all"
                style={{ border: `1px solid ${sfx.ligado ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.12)'}`, color: sfx.ligado ? OURO : 'rgba(255,255,255,0.35)' }}>
                {sfx.ligado ? '♪' : '✕'}
              </button>
            </div>

            <div className="mt-auto pt-20">
              <p className="text-[13px] sm:text-[18px] font-bold tracking-[0.55em] uppercase text-[#C9A84C]">RL Photo.Video</p>
              <h1 className="font-bold uppercase text-white leading-[0.88] text-[52px] sm:text-[88px] lg:text-[84px] xl:text-[128px] 2xl:text-[150px] mt-2 whitespace-nowrap">
                A Equipa
              </h1>
              <div className="flex items-center gap-4 mt-5">
                <span className="hidden sm:block w-12 h-px bg-[#C9A84C]" />
                <p className="text-[13px] sm:text-[17px] tracking-[0.22em] uppercase text-white/70">
                  {porCategoria.length
                    ? porCategoria.map((c, i) => <span key={c.key}>{i > 0 && ' · '}<span className={i === 0 ? 'text-[#C9A84C]' : ''}>{c.label}</span></span>)
                    : 'Fotógrafos · Videógrafos · Editores'}
                </p>
              </div>
              <p className="font-light text-white/50 text-[15px] sm:text-[17px] leading-relaxed mt-5 max-w-xl">
                {loading ? 'A carregar a equipa…' : `${list.length} pessoas na equipa, ${comPassword} com acesso ao seu painel.`}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-8">
                <button onClick={() => { sfx.clique(); setShowAdd(true); setEditingId(null); setForm(EMPTY_FORM) }}
                  className="inline-flex items-center gap-2.5 border border-[#C9A84C]/70 bg-[#C9A84C]/15 hover:bg-[#C9A84C]/30 px-7 py-3.5 text-[15px] font-semibold tracking-[0.18em] uppercase text-white transition-all shadow-[0_0_34px_-12px_rgba(201,168,76,0.7)]">
                  Adicionar membro
                  <span className="text-[#C9A84C]">+</span>
                </button>
                {[
                  { href: '/freelancers/novos', txt: 'Novos' },
                  { href: '/recrutamento', txt: 'Recrutamento' },
                  { href: '/painel-editor', txt: 'Maquete' },
                ].map(({ href, txt }) => (
                  <Link key={href} href={href} onClick={sfx.clique}
                    className="inline-flex items-center gap-2 border border-white/15 hover:border-white/35 bg-black/30 px-5 py-3.5 text-[14px] font-semibold tracking-[0.18em] uppercase text-white/85 transition-all">
                    / {txt}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Números da equipa */}
          <aside className="rounded-[22px] border border-[#C9A84C]/30 bg-[#111111]/80 backdrop-blur-xl p-5 shadow-[0_0_48px_-22px_rgba(201,168,76,0.5)]">
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.12em] uppercase text-white/85">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C] shadow-[0_0_8px_#C9A84C]" />
              A equipa em números
            </p>
            <div className="grid grid-cols-2 mt-3">
              {[
                { l: 'Pessoas', v: list.length, ouro: true },
                { l: 'Com acesso', v: comPassword },
                ...porCategoria.map(c => ({ l: c.label, v: contagens[c.key] ?? 0, ouro: false })),
              ].map((x, i, arr) => (
                <div key={x.l} className={`py-3 ${i % 2 === 0 ? 'pr-4 border-r border-white/[0.07]' : 'pl-4'} ${i < arr.length - (arr.length % 2 === 0 ? 2 : 1) ? 'border-b border-white/[0.07]' : ''}`}>
                  <p className="text-[11px] text-white/50">{x.l}</p>
                  <p className={`font-semibold text-[24px] leading-none mt-1.5 ${x.ouro ? 'text-[#C9A84C]' : 'text-white'}`}><Contador valor={x.v} /></p>
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
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Membros</p>
            <h2 className="font-semibold text-white text-[30px] sm:text-[34px] leading-tight mt-1">
              {filtro ? LABEL[filtro] : 'Toda a equipa'} <span className="text-white/30 font-normal">· {visiveis.length}</span>
            </h2>
          </div>
          <div className="relative">
            <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Procurar pessoa…"
              className="w-60 rounded-full pl-10 pr-4 py-2.5 text-[14px] text-white/85 placeholder-white/25 focus:outline-none transition-all focus:w-72 focus:border-[#C9A84C]/50"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }} />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4-4" /></svg>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-8">
          {[{ key: null as string | null, label: 'Todos', n: list.length }, ...porCategoria.map(c => ({ key: c.key as string | null, label: c.label, n: contagens[c.key] ?? 0 }))].map(c => {
            const on = filtro === c.key
            return (
              <button key={c.label} onClick={() => { sfx.clique(); setFiltro(on && c.key ? null : c.key) }}
                className="px-4 py-2 rounded-full text-[13px] font-semibold tracking-[0.06em] transition-all hover:-translate-y-0.5"
                style={{
                  border: `1px solid ${on ? 'rgba(201,168,76,0.7)' : 'rgba(255,255,255,0.1)'}`,
                  background: on ? 'rgba(201,168,76,0.15)' : 'transparent',
                  color: on ? '#fff' : 'rgba(255,255,255,0.5)',
                  boxShadow: on ? '0 0 26px -10px rgba(201,168,76,0.8)' : 'none',
                }}>
                {c.label} <span style={{ color: on ? OURO : 'rgba(255,255,255,0.3)' }}>{c.n}</span>
              </button>
            )
          })}
        </div>

        {/* ── Formulário de novo membro ───────────────────────────────────── */}
        {showAdd && (
          <div className="mb-8 rounded-[22px] border border-white/[0.08] bg-[#111111]/90 p-5 sm:p-6 space-y-3 fl-card" style={{ borderLeft: `2px solid ${OURO}` }}>
            <p className="text-[11px] tracking-[0.2em] text-[#C9A84C] uppercase">Novo membro</p>
            <FormFields form={form} setForm={setForm} />
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => { sfx.clique(); setShowAdd(false) }} className="px-4 py-2 rounded-full text-[13px] border border-white/10 text-white/50 hover:text-white transition-all">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.nome}
                className="px-5 py-2 rounded-full text-[13px] font-semibold text-black transition-all disabled:opacity-50" style={{ background: OURO }}>
                {saving ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          </div>
        )}

        {/* ── Membros ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-80 rounded-[22px] border border-white/[0.05] bg-white/[0.015]"
                style={{ animation: 'flPulso 1.4s ease-in-out infinite', animationDelay: `${i * 0.12}s` }} />
            ))}
          </div>
        ) : visiveis.length === 0 ? (
          <div className="py-20 text-center text-white/30 text-[14px] border border-white/[0.06] rounded-[22px]">Ninguém encontrado</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {visiveis.map((f, i) => {
              const cat = catDe(f.status)

              if (editingId === f.id) {
                return (
                  <div key={f.id} className="sm:col-span-2 lg:col-span-3 rounded-[22px] border border-white/[0.08] bg-[#111111]/90 p-5 sm:p-6 space-y-3 fl-card" style={{ borderLeft: `2px solid ${OURO}` }}>
                    <p className="text-[11px] tracking-[0.2em] text-[#C9A84C] uppercase">A editar · {f.nome}</p>
                    <FormFields form={form} setForm={setForm} />
                    <div className="flex items-center justify-between pt-1">
                      <button onClick={() => handleDelete(f.id)} disabled={!!deletingId}
                        className="text-[12px] text-red-400/70 hover:text-red-400 transition-colors">✕ Remover</button>
                      <div className="flex gap-2">
                        <button onClick={() => { sfx.clique(); setEditingId(null) }} className="px-4 py-2 rounded-full text-[13px] border border-white/10 text-white/50 hover:text-white transition-all">Cancelar</button>
                        <button onClick={handleSave} disabled={saving || !form.nome}
                          className="px-5 py-2 rounded-full text-[13px] font-semibold text-black transition-all disabled:opacity-50" style={{ background: OURO }}>
                          {saving ? 'A guardar...' : 'Guardar'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }

              const wa = linkWhatsapp(f.contato)
              return (
                <div key={f.id}
                  className="fl-card group relative rounded-[22px] overflow-hidden border border-white/[0.08] bg-[#111111] transition-all duration-300 hover:border-[#C9A84C]/45 hover:shadow-[0_0_50px_-20px_rgba(201,168,76,0.6)] hover:-translate-y-1"
                  style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}>
                  {/* Fotografia (ou iniciais) */}
                  <Link href={`/freelancers/${f.id}`} onClick={sfx.clique} className="relative block h-44 overflow-hidden">
                    {f.foto_url
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={f.foto_url} alt="" className="fl-foto absolute inset-0 w-full h-full object-cover object-[center_25%]" />
                      : <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'radial-gradient(circle at 50% 40%, rgba(201,168,76,0.14), #0e0e0e 70%)' }}>
                          <span className="font-bold text-[64px] leading-none text-transparent" style={{ WebkitTextStroke: `1px ${OURO}` }}>{iniciais(f.nome)}</span>
                        </div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/30 to-transparent" />
                    <span className="absolute top-3.5 left-4 text-[11px] font-semibold tracking-[0.2em] uppercase px-3 py-1 rounded-full border border-[#C9A84C]/45 text-[#C9A84C] bg-black/50 backdrop-blur-sm">
                      {LABEL[cat]}
                    </span>
                    <div className="absolute top-3.5 right-4 flex items-center gap-1.5">
                      {f.is_template && <span className="text-[10px] px-2 py-0.5 rounded-full border tracking-widest uppercase font-semibold bg-white/10 text-white/80 border-white/25">Template</span>}
                      {f.password && <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/50 text-white/60" title="Tem palavra-passe">🔑</span>}
                    </div>
                    <div className="absolute left-4 right-4 bottom-3">
                      <p className="font-bold uppercase text-white text-[22px] leading-tight truncate">{f.nome}</p>
                    </div>
                    <span className="fl-linha absolute left-0 bottom-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${OURO}, transparent)` }} />
                  </Link>

                  <div className="px-4 pt-3 pb-4">
                    <div className="space-y-1 min-h-[38px]">
                      {f.contato && <p className="text-[13px] text-white/55 truncate">{f.contato}</p>}
                      {f.email && <p className="text-[13px] text-white/40 truncate">{f.email}</p>}
                      {f.nome_sos && <p className="text-[12px] text-white/30 truncate">SOS: {f.nome_sos}{f.contato_sos ? ` · ${f.contato_sos}` : ''}</p>}
                    </div>

                    {/* Ações */}
                    <div className="mt-3.5 pt-3.5 border-t border-white/[0.07] flex items-center gap-1.5 flex-wrap">
                      {wa && (
                        <a href={wa} target="_blank" rel="noopener noreferrer" onClick={sfx.clique} title={`Falar com ${f.nome} no WhatsApp`}
                          className={btnAcao} style={{ background: 'rgba(37,211,102,0.10)', borderColor: 'rgba(37,211,102,0.45)', color: '#25D366' }}>
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 004.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2zm4.52 11.99c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.04s.87 2.37 1 2.53c.12.17 1.72 2.63 4.17 3.69.58.25 1.04.4 1.39.51.58.19 1.12.16 1.54.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.22-.17-.47-.29z"/>
                          </svg>
                          WhatsApp
                        </a>
                      )}
                      <Link href={`/painel-editor?freelancer=${f.id}&admin=1`} onClick={sfx.clique} title={`Ver e editar o painel de ${f.nome} como admin`}
                        className={btnAcao} style={{ background: 'rgba(201,168,76,0.12)', borderColor: 'rgba(201,168,76,0.5)', color: OURO }}>
                        Maquete
                      </Link>
                      <Link href={`/login?next=${encodeURIComponent(`/freelancers/${f.id}?view=freelancer`)}`} target="_blank" rel="noopener noreferrer" onClick={sfx.clique}
                        title={`Login como ${f.nome} (nova tab)`}
                        className={`${btnAcao} border-white/12 text-white/60 hover:text-white hover:border-white/30`}>
                        Ver ↗
                      </Link>
                      <CopiarUrlButton id={f.id} status={f.status} onSom={sfx.sucesso} />
                      <button onClick={() => { sfx.clique(); setPwEditId(pwEditId === f.id ? null : f.id); setPwDraft(f.password ?? '') }}
                        className={`${btnAcao} border-white/12 text-white/45 hover:text-white hover:border-white/30`}>
                        Password
                      </button>
                      {removidoIds.has(f.id) ? (
                        <span className={`${btnAcao} border-emerald-500/40 bg-emerald-500/10 text-emerald-400`}>✓ Movido</span>
                      ) : (
                        <button onClick={() => handleRemoverDaEquipa(f)} disabled={removendoId === f.id} title="Mover de volta para Novos freelancers"
                          className={`${btnAcao} border-white/12 text-white/35 hover:text-red-300 hover:border-red-400/40 disabled:opacity-40`}>
                          {removendoId === f.id ? '...' : '− Equipa'}
                        </button>
                      )}
                      <button onClick={() => startEdit(f)} title="Editar dados"
                        className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-white/35 hover:text-[#C9A84C] hover:bg-white/[0.05] transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>

                    {/* Palavra-passe */}
                    {pwEditId === f.id && (
                      <div className="mt-3 flex items-center gap-2">
                        <input type="text" value={pwDraft} onChange={e => setPwDraft(e.target.value)} placeholder="ex: rl2026" autoFocus
                          className="flex-1 bg-black/40 border border-white/10 rounded-full px-4 py-2 text-[13px] text-white/85 outline-none focus:border-[#C9A84C]/50 transition-colors font-mono placeholder:text-white/20" />
                        <button onClick={() => handleSavePassword(f.id)} disabled={pwSaving}
                          className="text-[12px] px-4 py-2 rounded-full font-semibold text-black transition-all disabled:opacity-40" style={{ background: OURO }}>
                          {pwSaving ? '...' : 'Guardar'}
                        </button>
                        <button onClick={() => setPwEditId(null)} className="w-8 h-8 rounded-full border border-white/10 text-white/40 hover:text-white transition-all">✕</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── Maquetes (cartões com foto, como as temporadas do /casamentos) ── */}
        <div className="mt-16">
          <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A84C]">Maquetes</p>
          <h2 className="font-semibold text-white text-[30px] sm:text-[34px] leading-tight mt-1 mb-6">Os painéis da equipa</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { href: '/painel-editor', img: '/prewedding-hero.webp', titulo: 'Editor de vídeo',
                desc: 'Novos projetos, pagamentos, calendário, tarefas, biblioteca de músicas e workflow.' },
              { href: '/freelancers/8694241a-7530-4dfd-8619-a8bf15b9e15e?view=freelancer', img: '/eventos-hero-2028.webp', titulo: 'Fotógrafo',
                desc: 'Projetos, entregas, calendário e dados pessoais. Separado do editor.' },
            ].map(m => (
              <Link key={m.href} href={m.href} onClick={sfx.clique}
                className="fl-card group relative h-64 rounded-[24px] overflow-hidden border border-[#C9A84C]/15 hover:border-[#C9A84C]/50 hover:shadow-[0_0_50px_-20px_rgba(201,168,76,0.6)] transition-all flex items-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.img} alt="" className="fl-foto absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(7,7,7,0.95) 20%, rgba(7,7,7,0.35) 65%, rgba(7,7,7,0.1))' }} />
                <span className="absolute top-5 left-6 text-[11px] font-medium tracking-[0.2em] uppercase px-3 py-1 rounded-full border border-[#C9A84C]/45 text-[#C9A84C] bg-black/40 backdrop-blur-sm">Maquete</span>
                <div className="relative w-full p-6 flex items-end justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold uppercase text-white text-[34px] leading-none">{m.titulo}</p>
                    <div className="w-14 h-px bg-[#C9A84C] my-3" />
                    <p className="text-[14px] text-white/60 max-w-md">{m.desc}</p>
                  </div>
                  <span className="w-11 h-11 shrink-0 rounded-full border border-[#C9A84C]/45 text-[#C9A84C] flex items-center justify-center group-hover:bg-[#C9A84C]/25 transition-all">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

function FormFields({ form, setForm }: { form: FormData; setForm: React.Dispatch<React.SetStateAction<FormData>> }) {
  const inputCls = "w-full bg-black/40 border border-white/10 rounded-[14px] px-4 py-2.5 text-[14px] text-white/85 outline-none focus:border-[#C9A84C]/55 transition-colors placeholder:text-white/20"
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Nome *</label>
          <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Nome" className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Função</label>
          <select value={form.status ?? ''} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
            className={inputCls + ' cursor-pointer [color-scheme:dark]'}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Contato</label>
          <input value={form.contato ?? ''} onChange={e => setForm(f => ({ ...f, contato: e.target.value }))} placeholder="9XX XXX XXX" className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Email</label>
          <input value={form.email ?? ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Contato SOS (nome)</label>
          <input value={form.nome_sos ?? ''} onChange={e => setForm(f => ({ ...f, nome_sos: e.target.value }))} placeholder="Nome familiar" className={inputCls} />
        </div>
        <div>
          <label className="block text-[11px] text-white/45 tracking-[0.14em] uppercase mb-1.5">Contato SOS (nº)</label>
          <input value={form.contato_sos ?? ''} onChange={e => setForm(f => ({ ...f, contato_sos: e.target.value }))} placeholder="9XX XXX XXX" className={inputCls} />
        </div>
      </div>
    </div>
  )
}
