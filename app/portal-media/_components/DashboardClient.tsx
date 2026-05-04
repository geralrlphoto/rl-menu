'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import type { Projeto } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'
import EditableDateField from './EditableDateField'

const NAV = [
  { slug: 'workflow',        label: 'Workflow',        desc: 'Fases do projeto',        icon: '◈' },
  { slug: 'briefing',        label: 'Briefing',        desc: 'Objetivos e referências', icon: '◎' },
  { slug: 'contrato',        label: 'Contrato & CPS',  desc: 'Documentos e dados',      icon: '◇' },
  { slug: 'pagamentos',      label: 'Pagamentos',      desc: 'Estado financeiro',       icon: '◉' },
  { slug: 'entregas',        label: 'Entregas',        desc: 'Ficheiros e revisões',    icon: '◐' },
  { slug: 'atendimento',     label: 'Atendimento',     desc: 'Equipa e contactos',      icon: '◑' },
  { slug: 'satisfacao',      label: 'Satisfação',      desc: 'Avaliação do projeto',    icon: '◒' },
]

const FASE_CFG = {
  concluido: { dot: 'bg-emerald-400', color: 'text-emerald-400/80' },
  em_curso:  { dot: 'bg-blue-400 animate-pulse', color: 'text-blue-400/80' },
  pendente:  { dot: 'bg-white/15', color: 'text-white/25' },
}

interface Props { projeto: Projeto; isAdmin: boolean }

export default function DashboardClient({ projeto: initial, isAdmin }: Props) {
  const [projeto, setProjeto] = useState(initial)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const heroFileRef = useRef<HTMLInputElement>(null)
  const logoFileRef = useRef<HTMLInputElement>(null)
  const [heroUploading, setHeroUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)

  const set = (field: keyof Projeto, value: any) =>
    setProjeto(p => ({ ...p, [field]: value }))

  const handleHeroUpload = async (file: File) => {
    setHeroUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) set('heroImageUrl', data.url)
    } catch {}
    setHeroUploading(false)
  }

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) set('heroLogoUrl', data.url)
    } catch {}
    setLogoUploading(false)
  }

  const save = async () => {
    setSaving(true)
    await fetch(`/api/media-portal/${projeto.ref}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projeto),
    })
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => { setProjeto(initial); setIsEditing(false) }

  // Click on phase dot → set as current (all before = concluido, all after = pendente)
  const setFaseAtual = (idx: number) => {
    setProjeto(p => ({
      ...p,
      fases: p.fases.map((f, i) => ({
        ...f,
        estado: i < idx ? 'concluido' : i === idx ? 'em_curso' : 'pendente',
      })),
    }))
    setIsEditing(true)
  }

  const fasesTotal = projeto.fases.length
  const fasesConcluidas = projeto.fases.filter(f => f.estado === 'concluido').length
  const progresso = Math.round((fasesConcluidas / fasesTotal) * 100)
  const faseAtual = projeto.fases.find(f => f.estado === 'em_curso') ?? projeto.fases.find(f => f.estado === 'pendente')

  return (
    <>
      {/* Hero image */}
      {projeto.heroImageUrl && (
        <div className="relative w-full shrink-0 overflow-hidden" style={{ height: 320 }}>
          <img
            src={projeto.heroImageUrl}
            alt=""
            className="w-full h-full object-cover object-center"
            style={{
              maskImage: 'linear-gradient(to bottom, black 0%, black 30%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 30%, transparent 100%)',
            }}
          />
          <div className="absolute top-5 right-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
            <span className="text-sm tracking-[0.4em] text-white/30 uppercase">Activo</span>
          </div>
          <div className="absolute top-5 left-6 flex items-center gap-3">
            <div className="flex flex-col gap-[3px]">
              <div className="h-px w-5 bg-white/30" /><div className="h-px w-3 bg-white/15" /><div className="h-px w-5 bg-white/30" />
            </div>
            <span className="text-sm tracking-[0.45em] text-white/25 uppercase">RL Media · Portal do Cliente</span>
          </div>
        </div>
      )}

      {/* Hero upload controls (edit mode) */}
      {isEditing && (
        <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 pt-4 flex flex-col gap-2">
          <input
            ref={heroFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleHeroUpload(f) }}
          />
          <div className="flex items-center gap-3 border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <span className="text-sm tracking-[0.4em] text-white/25 uppercase shrink-0">🖼 Foto cabeçalho</span>
            <button
              onClick={() => heroFileRef.current?.click()}
              disabled={heroUploading}
              className="flex-1 text-left text-sm text-white/40 hover:text-white/70 transition-colors disabled:opacity-40"
            >
              {heroUploading ? '⏳ A carregar...' : projeto.heroImageUrl ? '✓ Trocar foto' : '⬆ Carregar foto'}
            </button>
            {projeto.heroImageUrl && !heroUploading && (
              <button
                onClick={() => set('heroImageUrl', '')}
                className="text-white/20 hover:text-white/50 text-sm transition-colors shrink-0"
              >
                ✕ Remover
              </button>
            )}
          </div>
          <input
            ref={logoFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f) }}
          />
          <div className="flex items-center gap-3 border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <span className="text-sm tracking-[0.4em] text-white/25 uppercase shrink-0">Logo cliente</span>
            <button
              onClick={() => logoFileRef.current?.click()}
              disabled={logoUploading}
              className="flex-1 text-left text-sm text-white/40 hover:text-white/70 transition-colors disabled:opacity-40"
            >
              {logoUploading ? '⏳ A carregar...' : projeto.heroLogoUrl ? '✓ Trocar logo' : '⬆ Carregar logo'}
            </button>
            {projeto.heroLogoUrl && !logoUploading && (
              <button
                onClick={() => set('heroLogoUrl', '')}
                className="text-white/20 hover:text-white/50 text-sm transition-colors shrink-0"
              >
                ✕ Remover
              </button>
            )}
          </div>
        </div>
      )}

      <div className="relative z-10 px-6 sm:px-12 pt-8 pb-14 max-w-5xl mx-auto">

        {/* Project name */}
        <div className="flex items-start gap-6 mb-6">
          {/* Logo circle with color neon glow */}
          <div className="mt-2 relative shrink-0 flex items-center justify-center">
            {/* Neon glow — blurred copy of logo picks up its colors */}
            {projeto.heroLogoUrl && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full overflow-hidden blur-lg opacity-45 pointer-events-none">
                <img src={projeto.heroLogoUrl} aria-hidden className="w-full h-full object-cover" />
              </div>
            )}
            {/* Circle */}
            <div
              className={`relative z-10 w-20 h-20 rounded-full border border-white/10 flex items-center justify-center overflow-hidden
                ${isEditing ? 'cursor-pointer hover:border-white/30 transition-colors' : ''}`}
              onClick={isEditing ? () => logoFileRef.current?.click() : undefined}
              title={isEditing ? (projeto.heroLogoUrl ? 'Trocar logo' : 'Carregar logo') : undefined}
            >
              {projeto.heroLogoUrl ? (
                <img src={projeto.heroLogoUrl} alt={projeto.nome} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl text-white/20 select-none">◈</span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <EditableField value={projeto.tipo} isEditing={isEditing} onChange={v => set('tipo', v)}
              className="text-sm tracking-[0.6em] text-white/20 uppercase mb-1 block" />
            <EditableField value={projeto.nome} isEditing={isEditing} onChange={v => set('nome', v)}
              className="text-[clamp(2rem,6vw,3.5rem)] font-extralight tracking-[0.4em] text-white/85 uppercase leading-none block" />
            <EditableField value={projeto.cliente} isEditing={isEditing} onChange={v => set('cliente', v)}
              className="text-sm tracking-[0.3em] text-white/30 uppercase mt-2 block" />
            <div className="mt-2 flex items-center gap-2">
              {!isEditing && <span className="text-sm tracking-[0.25em] text-white/20 uppercase">Estado:</span>}
              <EditableField value={projeto.status} isEditing={isEditing} onChange={v => set('status', v)}
                className="text-sm tracking-[0.25em] text-white/40 uppercase block"
                placeholder="Estado do projeto" />
            </div>
          </div>
        </div>

        {/* Boas-vindas */}
        <div className="mb-8 border border-white/[0.07] bg-white/[0.02] px-7 py-7">
          <div className="flex items-start gap-3 mb-5">
            <span className="text-2xl leading-none mt-1">👋</span>
            <h2 className="text-xl font-light text-white/75">Bem-vindo ao Portal do Cliente</h2>
          </div>
          <p className="text-sm text-white/45 leading-relaxed mb-6">
            Olá, seja bem-vindo ao <span className="text-white/65">Portal do Cliente</span>.<br />
            Aqui encontra <span className="text-white/65">tudo o que precisa saber sobre o andamento do seu projeto</span> de forma clara, organizada e transparente.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-white/40 font-medium mb-3 flex items-center gap-2"><span>🔎</span> O que pode acompanhar</p>
              <ul className="flex flex-col gap-3">
                {[['Workflow do Projeto','Etapas concluídas, em curso e próximas fases'],['Cronograma','Progresso detalhado de cada fase'],['Contactos Dedicados','A quem falar em cada momento'],['Documentos & Entregas','Ficheiros e registos importantes']].map(([t, d]) => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="text-white/20 mt-1 shrink-0">—</span>
                    <span className="text-sm text-white/40 leading-relaxed"><span className="text-white/60 font-medium">{t}:</span> {d}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm text-white/40 font-medium mb-3 flex items-center gap-2"><span>✅</span> Como usar</p>
              <ol className="flex flex-col gap-3">
                {['Navegue pelo menu para explorar cada secção.','Clique na fase do projeto para ver detalhes, prazos e status.','Use a área de contactos para falar diretamente com os responsáveis.'].map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-sm font-mono text-white/20 shrink-0 mt-0.5">{i + 1}.</span>
                    <span className="text-sm text-white/40 leading-relaxed">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="border-t border-white/[0.05] pt-5 flex items-start gap-2">
            <span className="text-base shrink-0">👉</span>
            <p className="text-sm text-white/35 leading-relaxed">
              Este portal foi criado para <span className="text-white/45">garantir transparência, confiança e proximidade</span> durante todo o processo. Obrigado pela confiança na nossa equipa.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {/* Local */}
          <div className="border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <p className="text-sm tracking-[0.4em] text-white/25 uppercase mb-1">Local</p>
            <EditableField value={projeto.local} isEditing={isEditing}
              onChange={v => set('local', v)}
              className="text-sm tracking-[0.15em] text-white/65 font-light block" />
          </div>
          {/* Filmagem */}
          <div className="border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <p className="text-sm tracking-[0.4em] text-white/25 uppercase mb-1">Filmagem</p>
            <EditableDateField value={projeto.dataFilmagem} isEditing={isEditing}
              onChange={v => set('dataFilmagem', v)}
              className="text-sm tracking-[0.15em] text-white/65 font-light block" />
          </div>
          {/* Revisões */}
          <div className="border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <p className="text-sm tracking-[0.4em] text-white/25 uppercase mb-1">Revisões</p>
            <p className="text-sm tracking-[0.15em] text-white/65 font-light">
              {projeto.revisoes.usadas} / {projeto.revisoes.total}
            </p>
          </div>
          {/* Entrega Final */}
          <div className="border border-white/[0.07] bg-white/[0.02] px-4 py-3">
            <p className="text-sm tracking-[0.4em] text-white/25 uppercase mb-1">Entrega Final</p>
            <EditableDateField value={projeto.dataEntrega} isEditing={isEditing}
              onChange={v => set('dataEntrega', v)}
              className="text-sm tracking-[0.15em] text-white/65 font-light block" />
          </div>
        </div>

        {/* Progress */}
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm tracking-[0.4em] text-white/25 uppercase">Fase Actual · {faseAtual?.nome ?? 'Concluído'}</p>
          <p className="text-sm tracking-[0.4em] text-white/25 uppercase">{progresso}%</p>
        </div>
        <div className="h-px w-full bg-white/[0.06] relative overflow-hidden mb-4">
          <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-white/30 to-white/10" style={{ width: `${progresso}%` }} />
        </div>
        {isAdmin && (
          <p className="text-sm tracking-[0.3em] text-white/15 uppercase mb-2">
            ↑ clica numa fase para definir a fase actual
          </p>
        )}
        <div className="flex items-start gap-0 overflow-x-auto pb-1 mb-12">
          {projeto.fases.map((fase, i) => {
            const cfg = FASE_CFG[fase.estado]
            return (
              <div key={fase.id} className="flex items-center shrink-0">
                <div
                  className={`flex flex-col items-center gap-1.5 px-3 transition-opacity duration-150
                    ${isAdmin ? 'cursor-pointer hover:opacity-100 opacity-70' : ''}`}
                  onClick={isAdmin ? () => setFaseAtual(i) : undefined}
                  title={isAdmin ? `Definir "${fase.nome}" como fase actual` : undefined}
                >
                  <div className={`w-2 h-2 rounded-full transition-transform duration-150
                    ${cfg.dot}
                    ${isAdmin ? 'hover:scale-150' : ''}
                    ${fase.estado === 'em_curso' ? 'animate-pulse' : ''}`}
                  />
                  <span className={`text-sm tracking-[0.2em] uppercase whitespace-nowrap ${cfg.color}`}>
                    {fase.nome}
                  </span>
                </div>
                {i < projeto.fases.length - 1 && <div className="h-px w-6 bg-white/[0.06] shrink-0" />}
              </div>
            )
          })}
        </div>

        {/* Divider */}
        <div className="mb-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          <span className="text-sm tracking-[0.5em] text-white/15 uppercase">Menu</span>
          <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
          {NAV.map((item, i) => (
            <Link key={item.slug} href={`/portal-media/${projeto.ref}/${item.slug}`}
              className="group relative border border-white/[0.07] hover:border-white/18 bg-white/[0.015] hover:bg-white/[0.035] transition-all duration-400 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className="text-lg text-white/10 group-hover:text-white/25 transition-colors select-none leading-none">{item.icon}</span>
                <span className="text-sm font-mono text-white/12 group-hover:text-white/25 transition-colors">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div>
                <p className="text-sm tracking-[0.3em] font-medium text-white/55 group-hover:text-white/80 uppercase transition-colors leading-tight">{item.label}</p>
                <p className="text-sm text-white/20 mt-1 leading-tight">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.04] pt-5 flex items-center justify-between">
          <p className="text-sm tracking-[0.5em] text-white/10 uppercase">© RL Media · Audiovisual · 2026</p>
          <p className="text-sm tracking-[0.3em] text-white/10 uppercase font-mono">REF: {projeto.ref}</p>
        </div>
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}
