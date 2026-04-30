'use client'
import { useState } from 'react'
import Link from 'next/link'
import type { Projeto } from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import EditableField from './EditableField'

const NAV = [
  { slug: 'workflow',        label: 'Workflow',        desc: 'Fases do projeto',        icon: '◈' },
  { slug: 'briefing',        label: 'Briefing',        desc: 'Objetivos e referências', icon: '◎' },
  { slug: 'contrato',        label: 'Contrato & CPS',  desc: 'Documentos e dados',      icon: '◇' },
  { slug: 'pagamentos',      label: 'Pagamentos',      desc: 'Estado financeiro',       icon: '◉' },
  { slug: 'revisoes',        label: 'Revisões',        desc: 'Feedback e aprovações',   icon: '⬡' },
  { slug: 'entregas',        label: 'Entregas',        desc: 'Ficheiros finais',         icon: '◐' },
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

  const set = (field: keyof Projeto, value: any) =>
    setProjeto(p => ({ ...p, [field]: value }))

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

  const fasesTotal = projeto.fases.length
  const fasesConcluidas = projeto.fases.filter(f => f.estado === 'concluido').length
  const progresso = Math.round((fasesConcluidas / fasesTotal) * 100)
  const faseAtual = projeto.fases.find(f => f.estado === 'em_curso') ?? projeto.fases.find(f => f.estado === 'pendente')

  return (
    <>
      {/* Hero image */}
      {projeto.heroImageUrl && (
        <div className="relative z-10 w-full overflow-hidden shrink-0" style={{ height: '320px' }}>
          <div className="absolute inset-0 bg-cover bg-center scale-105"
            style={{ backgroundImage: `url(${projeto.heroImageUrl})` }} />
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#050507] to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#050507] via-[#050507]/70 to-transparent" />
          {isEditing && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-80">
              <p className="text-xs text-white/40 text-center mb-1">URL da imagem de fundo</p>
              <EditableField
                value={projeto.heroImageUrl ?? ''}
                isEditing={true}
                onChange={v => set('heroImageUrl', v)}
                placeholder="https://..."
              />
            </div>
          )}
          {projeto.heroLogoUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <img src={projeto.heroLogoUrl} alt={projeto.nome} className="max-h-16 max-w-[200px] object-contain opacity-80" />
            </div>
          )}
          <div className="absolute top-5 right-6 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 animate-pulse" />
            <span className="text-xs tracking-[0.4em] text-white/30 uppercase">Activo</span>
          </div>
          <div className="absolute top-5 left-6 flex items-center gap-3">
            <div className="flex flex-col gap-[3px]">
              <div className="h-px w-5 bg-white/30" /><div className="h-px w-3 bg-white/15" /><div className="h-px w-5 bg-white/30" />
            </div>
            <span className="text-xs tracking-[0.45em] text-white/25 uppercase">RL Media · Portal do Cliente</span>
          </div>
        </div>
      )}

      <div className="relative z-10 px-6 sm:px-12 pt-8 pb-14 max-w-5xl mx-auto">

        {/* Project name */}
        <div className="flex items-start gap-6 mb-6">
          <div className="mt-2 w-12 h-12 border border-white/10 flex items-center justify-center shrink-0">
            <span className="text-xl text-white/20 select-none">◈</span>
          </div>
          <div className="flex-1">
            <EditableField value={projeto.tipo} isEditing={isEditing} onChange={v => set('tipo', v)}
              className="text-xs tracking-[0.6em] text-white/20 uppercase mb-1 block" />
            <EditableField value={projeto.nome} isEditing={isEditing} onChange={v => set('nome', v)}
              className="text-[clamp(2rem,6vw,3.5rem)] font-extralight tracking-[0.4em] text-white/85 uppercase leading-none block" />
            <EditableField value={projeto.cliente} isEditing={isEditing} onChange={v => set('cliente', v)}
              className="text-sm tracking-[0.3em] text-white/30 uppercase mt-2 block" />
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
                    <span className="text-sm text-white/40 leading-relaxed"><span className="text-white/60 font-medium">{t}</span> — {d}</span>
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
          {([
            { label: 'Local',         field: 'local'         },
            { label: 'Filmagem',      field: 'dataFilmagem'  },
            { label: 'Revisões',      field: null            },
            { label: 'Entrega Final', field: 'dataEntrega'   },
          ] as { label: string; field: keyof Projeto | null }[]).map(stat => (
            <div key={stat.label} className="border border-white/[0.07] bg-white/[0.02] px-4 py-3">
              <p className="text-xs tracking-[0.4em] text-white/25 uppercase mb-1">{stat.label}</p>
              {stat.field ? (
                <EditableField value={String(projeto[stat.field] ?? '')} isEditing={isEditing}
                  onChange={v => set(stat.field!, v)}
                  className="text-sm tracking-[0.15em] text-white/65 font-light block" />
              ) : (
                <p className="text-sm tracking-[0.15em] text-white/65 font-light">
                  {projeto.revisoes.usadas} / {projeto.revisoes.total}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs tracking-[0.4em] text-white/25 uppercase">Fase Actual — {faseAtual?.nome ?? 'Concluído'}</p>
          <p className="text-xs tracking-[0.4em] text-white/25 uppercase">{progresso}%</p>
        </div>
        <div className="h-px w-full bg-white/[0.06] relative overflow-hidden mb-4">
          <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-white/30 to-white/10" style={{ width: `${progresso}%` }} />
        </div>
        <div className="flex items-start gap-0 overflow-x-auto pb-1 mb-12">
          {projeto.fases.map((fase, i) => {
            const cfg = FASE_CFG[fase.estado]
            return (
              <div key={fase.id} className="flex items-center shrink-0">
                <div className="flex flex-col items-center gap-1.5 px-3">
                  <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                  <span className={`text-xs tracking-[0.2em] uppercase whitespace-nowrap ${cfg.color}`}>{fase.nome}</span>
                </div>
                {i < projeto.fases.length - 1 && <div className="h-px w-6 bg-white/[0.06] shrink-0" />}
              </div>
            )
          })}
        </div>

        {/* Divider */}
        <div className="mb-10 flex items-center gap-4">
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
          <span className="text-xs tracking-[0.5em] text-white/15 uppercase">Menu</span>
          <div className="h-px flex-1 bg-gradient-to-l from-white/10 to-transparent" />
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-16">
          {NAV.map((item, i) => (
            <Link key={item.slug} href={`/portal-media/${projeto.ref}/${item.slug}`}
              className="group relative border border-white/[0.07] hover:border-white/18 bg-white/[0.015] hover:bg-white/[0.035] transition-all duration-400 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <span className="text-lg text-white/10 group-hover:text-white/25 transition-colors select-none leading-none">{item.icon}</span>
                <span className="text-xs font-mono text-white/12 group-hover:text-white/25 transition-colors">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <div>
                <p className="text-xs tracking-[0.3em] font-medium text-white/55 group-hover:text-white/80 uppercase transition-colors leading-tight">{item.label}</p>
                <p className="text-xs text-white/20 mt-1 leading-tight">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-white/[0.04] pt-5 flex items-center justify-between">
          <p className="text-xs tracking-[0.5em] text-white/10 uppercase">© RL Media · Audiovisual · 2026</p>
          <p className="text-xs tracking-[0.3em] text-white/10 uppercase font-mono">REF: {projeto.ref}</p>
        </div>
      </div>

      {isAdmin && (
        <AdminBar isEditing={isEditing} saving={saving}
          onToggle={() => setIsEditing(true)} onSave={save} onCancel={cancel} />
      )}
    </>
  )
}
