'use client'

/**
 * BriefingExtensions — secções premium adicionais para a página de Briefing.
 * Inclui: Status, Cronograma do Dia, Mapas, Momentos Obrigatórios, VIPs,
 * Mood Board, Playlist, Restrições, Contactos, Notas Sensíveis, Tarefas
 * Pré-Evento, Notas Privadas (admin) e Histórico.
 *
 * Toda a edição é admin-only. O cliente vê tudo (em modo leitura) excepto:
 *   - Notas Privadas da Equipa
 *   - Histórico de Alterações
 *
 * Persistência: tudo guardado dentro de briefingInfo[pageId] em
 * portalSettingsObj (Supabase). O parent passa `info` + `onSave`.
 */

import { useState, useEffect, useMemo, useRef, type ReactNode } from 'react'

// ─── Types ───────────────────────────────────────────────────────────────────

export type BriefingExt = {
  // Existing (do tipo legado)
  fields?: Array<{ label: string; value: string }>
  infoGeral?: string
  equipa?: Array<{ role: string; name: string; phone?: string; email?: string; photo?: string }>

  // Novos campos
  status?: 'rascunho' | 'em_revisao' | 'aprovado' | 'enviado'
  cronograma?: Array<{ id: string; time: string; title: string; team?: string; location?: string }>
  mapas?: Array<{ id: string; label: string; address: string; time?: string }>
  momentos?: Array<{ id: string; label: string; done?: boolean }>
  vips?: Array<{ id: string; name: string; relation: string }>
  moodboard?: Array<{ id: string; url: string; caption?: string }>
  playlist?: Array<{ id: string; moment: string; song: string; artist?: string; url?: string }>
  notasSensiveis?: string
  contactos?: Array<{ id: string; role: string; name: string; phone?: string; email?: string }>
  restricoes?: Array<{ id: string; label: string; allowed?: boolean; note?: string }>
  tarefasPre?: Array<{ id: string; when: 'T-7' | 'T-3' | 'T-1' | 'T-0'; label: string; done?: boolean; responsavel?: string }>
  historico?: Array<{ at: string; who: string; action: string }>
  notasPrivadas?: string
}

type Props = {
  info: BriefingExt
  isAdmin: boolean
  onSave: (patch: Partial<BriefingExt>) => Promise<void> | void
  pageTitle?: string
  portalRef?: string
  dataEvento?: string | null
  local?: string | null
  // Slots opcionais: o parent passa os blocos antigos (CTA Enviar Briefing,
  // card Equipa, grid Fichas Individuais) e o componente posiciona-os no
  // layout novo.
  enviarBriefingNode?: ReactNode
  equipaNode?: ReactNode
  fichasNode?: ReactNode
}

const uid = () => `b-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG = {
  rascunho:    { label: 'Rascunho',        bg: 'bg-white/[0.04]',  border: 'border-white/15',     text: 'text-white/55',  glow: 'rgba(255,255,255,0.08)' },
  em_revisao:  { label: 'Em Revisão',      bg: 'bg-amber-500/15',  border: 'border-amber-500/40', text: 'text-amber-300', glow: 'rgba(245,158,11,0.35)' },
  aprovado:    { label: 'Aprovado',        bg: 'bg-emerald-500/15',border: 'border-emerald-500/40',text:'text-emerald-300',glow:'rgba(52,211,153,0.35)' },
  enviado:     { label: 'Enviado à Equipa',bg: 'bg-blue-500/15',   border: 'border-blue-500/40',  text: 'text-blue-300',  glow: 'rgba(59,130,246,0.35)' },
} as const

const ROLE_ICONS: Record<string, string> = {
  'Fotógrafo':       '◉',
  'Videógrafo':      '▶',
  'Assistente':      '◇',
  'Editor':          '✎',
  'Wedding Planner': '◆',
  'DJ':              '♫',
  'Florista':        '✿',
  'Catering':        '⌘',
  'Oficiante':       '✝',
  'Padre':           '✝',
}

// ─── Section primitive ───────────────────────────────────────────────────────

function Section({
  id, icon, label, title, subtitle, action, children, accent = 'gold', className,
}: {
  id: string
  icon: string
  label: string
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  accent?: 'gold' | 'rose' | 'blue' | 'emerald' | 'amber'
  className?: string
}) {
  const accents = {
    gold:    { iconBg: 'bg-gold/[0.08]',    iconBorder: 'border-gold/30',    iconText: 'text-gold',         labelText: 'text-gold/65' },
    rose:    { iconBg: 'bg-rose-500/15',    iconBorder: 'border-rose-500/40',iconText: 'text-rose-300',     labelText: 'text-rose-300/80' },
    blue:    { iconBg: 'bg-blue-500/15',    iconBorder: 'border-blue-500/40',iconText: 'text-blue-300',     labelText: 'text-blue-300/80' },
    emerald: { iconBg: 'bg-emerald-500/15', iconBorder: 'border-emerald-500/40',iconText:'text-emerald-300',labelText:'text-emerald-300/80' },
    amber:   { iconBg: 'bg-amber-500/15',   iconBorder: 'border-amber-500/40',iconText: 'text-amber-300',   labelText: 'text-amber-300/80' },
  }[accent]
  return (
    <section id={id} className={`rounded-2xl border border-white/[0.08] overflow-hidden ${className ?? ''}`}
      style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.4), rgba(11,11,11,0.55))', boxShadow: '0 20px 40px -22px rgba(0,0,0,0.5)' }}>
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.05] flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`w-9 h-9 rounded-lg border ${accents.iconBorder} ${accents.iconBg} ${accents.iconText} flex items-center justify-center text-base shrink-0`}>{icon}</span>
          <div className="min-w-0">
            <p className={`text-[9px] tracking-[0.4em] uppercase ${accents.labelText}`}>{label}</p>
            <h3 className="text-[15px] sm:text-[16px] text-white font-light tracking-tight mt-0.5 truncate" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
              {title}
            </h3>
            {subtitle && <p className="text-[10px] text-white/35 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

// Botão "Editar" / "Concluir" para cada secção
function EditChip({ active, onClick, accent = 'gold' }: { active: boolean; onClick: () => void; accent?: 'gold' | 'emerald' }) {
  if (active) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[11px] tracking-[0.28em] uppercase font-bold border border-emerald-500/45 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 hover:border-emerald-500/65 transition-all"
        style={{ boxShadow: '0 0 18px -8px rgba(34,197,94,0.40)' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Concluir
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-[11px] tracking-[0.28em] uppercase font-bold border border-gold/45 bg-gold/[0.08] text-gold hover:bg-gold/[0.18] hover:border-gold/75 transition-all"
      style={{ boxShadow: '0 0 18px -8px rgba(201,164,92,0.45)' }}
      title="Clica para editar esta secção"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </svg>
      Editar
    </button>
  )
}

function Inp({ value, onChange, placeholder, type = 'text', cls = '' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; cls?: string }) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className={`bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-gold/50 transition-colors [color-scheme:dark] ${cls}`} />
  )
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-white/25 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all shrink-0"
      title="Remover">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  )
}

function AddBtn({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="w-full py-2.5 rounded-xl border border-dashed border-gold/25 text-gold/65 hover:text-gold hover:border-gold/55 hover:bg-gold/[0.04] text-[10px] tracking-[0.3em] uppercase font-bold transition-all">
      + {label}
    </button>
  )
}

function EmptyState({ icon, msg, hint }: { icon: string; msg: string; hint?: string }) {
  return (
    <div className="text-center py-7">
      <span className="text-3xl opacity-15 block mb-2">{icon}</span>
      <p className="text-[12px] text-white/35 italic">{msg}</p>
      {hint && <p className="text-[10px] text-white/25 mt-1">{hint}</p>}
    </div>
  )
}

// ─── Toolbar (Status + Actions) ──────────────────────────────────────────────

function Toolbar({ info, isAdmin, onSave }: { info: BriefingExt; isAdmin: boolean; onSave: (patch: Partial<BriefingExt>) => void | Promise<void> }) {
  const status = info.status ?? 'rascunho'
  const cfg = STATUS_CFG[status]
  const [statusOpen, setStatusOpen] = useState(false)

  function handlePrint() {
    if (typeof window !== 'undefined') window.print()
  }
  function handlePresent() {
    if (typeof window === 'undefined') return
    document.documentElement.requestFullscreen?.()
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] p-3 flex items-center justify-between gap-3 flex-wrap"
      style={{ background: 'linear-gradient(120deg, rgba(20,15,8,0.5), rgba(11,11,11,0.55))' }}>
      <div className="flex items-center gap-2 relative">
        <span className="text-[9px] tracking-[0.35em] text-white/35 uppercase">Estado</span>
        <button onClick={() => isAdmin && setStatusOpen(s => !s)}
          disabled={!isAdmin}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.text} text-[10px] tracking-[0.25em] uppercase font-bold transition-all ${isAdmin ? 'hover:opacity-90 cursor-pointer' : 'cursor-default'}`}
          style={{ boxShadow: status !== 'rascunho' ? `0 0 12px -4px ${cfg.glow}` : undefined }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor', boxShadow: `0 0 8px ${cfg.glow}` }} />
          {cfg.label}
          {isAdmin && <span className="opacity-50 ml-0.5">▾</span>}
        </button>
        {statusOpen && (
          <div className="absolute top-full left-12 mt-1 z-20 rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden min-w-[180px]">
            {(Object.keys(STATUS_CFG) as Array<keyof typeof STATUS_CFG>).map(k => (
              <button key={k} onClick={() => { onSave({ status: k }); setStatusOpen(false) }}
                className={`w-full px-3 py-2 text-left text-[11px] tracking-widest uppercase font-bold transition-all flex items-center gap-2 ${STATUS_CFG[k].text} hover:bg-white/[0.04]`}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                {STATUS_CFG[k].label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={handlePrint}
          title="Exportar como PDF (Ctrl+P)"
          className="px-3 py-1.5 rounded-md text-[10px] tracking-[0.25em] uppercase font-bold border border-white/12 bg-white/[0.04] text-white/65 hover:text-gold hover:border-gold/40 hover:bg-gold/[0.06] transition-all flex items-center gap-1.5">
          ↓ PDF
        </button>
        <button onClick={handlePresent}
          title="Modo apresentação (fullscreen)"
          className="px-3 py-1.5 rounded-md text-[10px] tracking-[0.25em] uppercase font-bold border border-white/12 bg-white/[0.04] text-white/65 hover:text-gold hover:border-gold/40 hover:bg-gold/[0.06] transition-all flex items-center gap-1.5">
          ▶ Apresentar
        </button>
        {isAdmin && (
          <button onClick={() => alert('Replicar de outro evento — escolhe a referência no admin do portal.')}
            title="Replicar este briefing a partir de outro evento"
            className="px-3 py-1.5 rounded-md text-[10px] tracking-[0.25em] uppercase font-bold border border-white/12 bg-white/[0.04] text-white/65 hover:text-gold hover:border-gold/40 hover:bg-gold/[0.06] transition-all flex items-center gap-1.5">
            ⎘ Replicar
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Section: Cronograma do Dia ──────────────────────────────────────────────

function CronogramaSection({ info, isAdmin, onSave }: { info: BriefingExt; isAdmin: boolean; onSave: (p: Partial<BriefingExt>) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(info.cronograma ?? [])

  function startEdit() { setDraft(info.cronograma?.length ? info.cronograma.map(x => ({ ...x })) : [{ id: uid(), time: '', title: '', team: '', location: '' }]); setEditing(true) }
  async function save() { await onSave({ cronograma: draft.filter(x => x.time || x.title) }); setEditing(false) }

  const sorted = useMemo(() => [...(info.cronograma ?? [])].sort((a, b) => (a.time || '').localeCompare(b.time || '')), [info.cronograma])

  return (
    <Section id="cronograma" icon="⌚" label="Cronograma do Dia" title="Linha temporal do evento" subtitle={`${sorted.length} momento${sorted.length === 1 ? '' : 's'}`}
      action={isAdmin && <EditChip active={editing} onClick={editing ? save : startEdit} />}>
      {editing ? (
        <div className="space-y-2">
          {draft.map((row, idx) => (
            <div key={row.id} className="grid grid-cols-[80px_1fr_120px_36px] gap-2 items-center">
              <Inp type="time" value={row.time} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, time: v } : x))} placeholder="HH:MM" cls="text-center" />
              <div className="grid grid-cols-2 gap-2">
                <Inp value={row.title} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, title: v } : x))} placeholder="Momento (ex: Preparação Noiva)" />
                <Inp value={row.location ?? ''} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, location: v } : x))} placeholder="Local" />
              </div>
              <Inp value={row.team ?? ''} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, team: v } : x))} placeholder="Equipa" />
              <RemoveBtn onClick={() => setDraft(d => d.filter((_, i) => i !== idx))} />
            </div>
          ))}
          <AddBtn onClick={() => setDraft(d => [...d, { id: uid(), time: '', title: '', team: '', location: '' }])} label="Adicionar Momento" />
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState icon="⌚" msg="Sem cronograma definido." hint={isAdmin ? 'Clica em Editar para começar.' : undefined} />
      ) : (
        <div className="relative pl-6">
          <span className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-gold/40 via-gold/20 to-transparent" />
          <div className="space-y-3">
            {sorted.map((row) => (
              <div key={row.id} className="relative flex items-start gap-4">
                <span className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-gold border-2 border-[#0a0a0a]"
                  style={{ boxShadow: '0 0 10px rgba(201,164,92,0.6)' }} />
                <span className="text-[12px] tabular-nums text-gold font-bold tracking-wider w-14 shrink-0 pt-0.5">{row.time || '—'}</span>
                <div className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:border-gold/25 transition-colors">
                  <p className="text-[13px] text-white font-medium leading-tight">{row.title || <span className="text-white/30 italic">Sem título</span>}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {row.location && <span className="text-[10px] text-white/45 inline-flex items-center gap-1">◉ {row.location}</span>}
                    {row.team && <span className="text-[10px] text-gold/70 inline-flex items-center gap-1">⌘ {row.team}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  )
}

// ─── Section: Mapas / Localizações ───────────────────────────────────────────

function MapasSection({ info, isAdmin, onSave }: { info: BriefingExt; isAdmin: boolean; onSave: (p: Partial<BriefingExt>) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(info.mapas ?? [])

  function startEdit() { setDraft(info.mapas?.length ? info.mapas.map(x => ({ ...x })) : [{ id: uid(), label: '', address: '', time: '' }]); setEditing(true) }
  async function save() { await onSave({ mapas: draft.filter(x => x.label || x.address) }); setEditing(false) }

  const list = info.mapas ?? []

  return (
    <Section id="mapas" icon="◉" label="Mapas & Localizações" title="Sítios do evento" subtitle={`${list.length} local${list.length === 1 ? '' : 'ais'}`}
      action={isAdmin && <EditChip active={editing} onClick={editing ? save : startEdit} />}>
      {editing ? (
        <div className="space-y-2">
          {draft.map((row, idx) => (
            <div key={row.id} className="grid grid-cols-[1fr_2fr_90px_36px] gap-2 items-center">
              <Inp value={row.label} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, label: v } : x))} placeholder="Etiqueta (ex: Igreja)" />
              <Inp value={row.address} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, address: v } : x))} placeholder="Morada / cidade" />
              <Inp type="time" value={row.time ?? ''} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, time: v } : x))} cls="text-center" />
              <RemoveBtn onClick={() => setDraft(d => d.filter((_, i) => i !== idx))} />
            </div>
          ))}
          <AddBtn onClick={() => setDraft(d => [...d, { id: uid(), label: '', address: '', time: '' }])} label="Adicionar Localização" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon="◉" msg="Sem localizações registadas." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {list.map(p => {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`
            return (
              <a key={p.id} href={mapsUrl} target="_blank" rel="noopener noreferrer"
                className="block p-4 rounded-xl border border-white/[0.06] bg-white/[0.025] hover:border-gold/30 hover:bg-gold/[0.04] transition-all group">
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-lg border border-gold/30 bg-gold/10 flex items-center justify-center text-gold text-base shrink-0">◉</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-[10px] tracking-[0.3em] text-gold/65 uppercase truncate">{p.label || 'Local'}</p>
                      {p.time && <span className="text-[10px] text-gold tabular-nums">{p.time}</span>}
                    </div>
                    <p className="text-[12px] text-white/75 leading-snug line-clamp-2">{p.address}</p>
                    <p className="text-[9px] text-white/30 mt-1.5 tracking-widest uppercase group-hover:text-gold/60 transition-colors">Abrir no Maps ↗</p>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      )}
    </Section>
  )
}

// ─── Section: Momentos Obrigatórios (checklist) ──────────────────────────────

function MomentosSection({ info, isAdmin, onSave }: { info: BriefingExt; isAdmin: boolean; onSave: (p: Partial<BriefingExt>) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(info.momentos ?? [])
  const list = info.momentos ?? []

  function startEdit() {
    setDraft(list.length ? list.map(x => ({ ...x })) : [
      { id: uid(), label: 'Primeiro Olhar' },
      { id: uid(), label: 'Troca de Alianças' },
      { id: uid(), label: 'Entrada da Noiva' },
      { id: uid(), label: 'Primeira Dança' },
      { id: uid(), label: 'Corte do Bolo' },
      { id: uid(), label: 'Ramo da Noiva' },
    ])
    setEditing(true)
  }
  async function save() { await onSave({ momentos: draft.filter(x => x.label.trim()) }); setEditing(false) }

  async function toggleDone(id: string) {
    const next = list.map(m => m.id === id ? { ...m, done: !m.done } : m)
    await onSave({ momentos: next })
  }

  const done = list.filter(m => m.done).length

  return (
    <Section id="momentos" icon="✓" label="Momentos Obrigatórios" title="Checklist criativo"
      subtitle={list.length > 0 ? `${done} de ${list.length} confirmados` : 'Lista a definir'}
      accent="emerald"
      action={isAdmin && <EditChip active={editing} onClick={editing ? save : startEdit} />}>
      {editing ? (
        <div className="space-y-2">
          {draft.map((row, idx) => (
            <div key={row.id} className="flex items-center gap-2">
              <Inp value={row.label} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, label: v } : x))} placeholder="Ex: Lançamento do ramo" cls="flex-1" />
              <RemoveBtn onClick={() => setDraft(d => d.filter((_, i) => i !== idx))} />
            </div>
          ))}
          <AddBtn onClick={() => setDraft(d => [...d, { id: uid(), label: '' }])} label="Adicionar Momento" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon="✓" msg="Sem momentos definidos." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {list.map(m => (
            <button key={m.id} onClick={() => toggleDone(m.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                m.done
                  ? 'border-emerald-500/35 bg-emerald-500/[0.06] hover:border-emerald-500/50'
                  : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15'
              }`}>
              <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-[12px] shrink-0 transition-all ${
                m.done ? 'border-emerald-500/55 bg-emerald-500/25 text-emerald-200' : 'border-white/20 bg-transparent text-transparent'
              }`}>✓</span>
              <span className={`text-[12px] flex-1 transition-all ${m.done ? 'text-emerald-200/85 line-through decoration-emerald-400/40' : 'text-white/80'}`}>{m.label}</span>
            </button>
          ))}
        </div>
      )}
    </Section>
  )
}

// ─── Section: VIPs ────────────────────────────────────────────────────────────

function VipsSection({ info, isAdmin, onSave }: { info: BriefingExt; isAdmin: boolean; onSave: (p: Partial<BriefingExt>) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(info.vips ?? [])
  const list = info.vips ?? []

  function startEdit() { setDraft(list.length ? list.map(x => ({ ...x })) : [{ id: uid(), name: '', relation: '' }]); setEditing(true) }
  async function save() { await onSave({ vips: draft.filter(x => x.name.trim()) }); setEditing(false) }

  return (
    <Section id="vips" icon="★" label="Convidados VIP" title="Pessoas importantes" subtitle={`${list.length} VIP${list.length === 1 ? '' : 's'}`}
      action={isAdmin && <EditChip active={editing} onClick={editing ? save : startEdit} />}>
      {editing ? (
        <div className="space-y-2">
          {draft.map((row, idx) => (
            <div key={row.id} className="grid grid-cols-[1fr_1fr_36px] gap-2 items-center">
              <Inp value={row.name} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, name: v } : x))} placeholder="Nome (ex: Maria Costa)" />
              <Inp value={row.relation} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, relation: v } : x))} placeholder="Relação (ex: Mãe da Noiva)" />
              <RemoveBtn onClick={() => setDraft(d => d.filter((_, i) => i !== idx))} />
            </div>
          ))}
          <AddBtn onClick={() => setDraft(d => [...d, { id: uid(), name: '', relation: '' }])} label="Adicionar VIP" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon="★" msg="Sem VIPs registados." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {list.map(v => (
            <div key={v.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.06]">
              <span className="w-9 h-9 rounded-full border border-gold/35 bg-gradient-to-br from-gold/25 to-gold/5 text-gold flex items-center justify-center text-[13px] font-bold shrink-0">
                {(v.name || '?').charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-white/90 font-medium truncate">{v.name}</p>
                <p className="text-[10px] text-gold/65 tracking-wider uppercase truncate">{v.relation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

// ─── Section: Mood Board ─────────────────────────────────────────────────────

function MoodboardSection({ info, isAdmin, onSave }: { info: BriefingExt; isAdmin: boolean; onSave: (p: Partial<BriefingExt>) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(info.moodboard ?? [])
  const list = info.moodboard ?? []

  function startEdit() { setDraft(list.length ? list.map(x => ({ ...x })) : [{ id: uid(), url: '', caption: '' }]); setEditing(true) }
  async function save() { await onSave({ moodboard: draft.filter(x => x.url.trim()) }); setEditing(false) }

  return (
    <Section id="moodboard" icon="◧" label="Mood Board" title="Referências visuais" subtitle={`${list.length} imagem${list.length === 1 ? '' : 'ns'}`}
      action={isAdmin && <EditChip active={editing} onClick={editing ? save : startEdit} />}>
      {editing ? (
        <div className="space-y-2">
          {draft.map((row, idx) => (
            <div key={row.id} className="grid grid-cols-[2fr_1fr_36px] gap-2 items-center">
              <Inp value={row.url} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, url: v } : x))} placeholder="URL da imagem (https://...)" />
              <Inp value={row.caption ?? ''} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, caption: v } : x))} placeholder="Legenda (opcional)" />
              <RemoveBtn onClick={() => setDraft(d => d.filter((_, i) => i !== idx))} />
            </div>
          ))}
          <AddBtn onClick={() => setDraft(d => [...d, { id: uid(), url: '', caption: '' }])} label="Adicionar Imagem" />
          <p className="text-[10px] text-white/30 italic">Cola URLs públicos (Pinterest, Unsplash, Drive partilhado, etc).</p>
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon="◧" msg="Sem referências visuais." hint="Inspiração ajuda a equipa a alinhar o estilo." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {list.map(m => (
            <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer"
              className="block group">
              <div className="aspect-[4/5] rounded-xl overflow-hidden bg-white/[0.04] border border-white/[0.06] hover:border-gold/30 transition-all">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.caption ?? ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              {m.caption && <p className="text-[10px] text-white/50 mt-1.5 px-1 truncate group-hover:text-gold/70 transition-colors">{m.caption}</p>}
            </a>
          ))}
        </div>
      )}
    </Section>
  )
}

// ─── Section: Playlist ───────────────────────────────────────────────────────

function PlaylistSection({ info, isAdmin, onSave }: { info: BriefingExt; isAdmin: boolean; onSave: (p: Partial<BriefingExt>) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(info.playlist ?? [])
  const list = info.playlist ?? []

  function startEdit() { setDraft(list.length ? list.map(x => ({ ...x })) : [{ id: uid(), moment: 'Entrada da Noiva', song: '', artist: '', url: '' }]); setEditing(true) }
  async function save() { await onSave({ playlist: draft.filter(x => x.song.trim()) }); setEditing(false) }

  return (
    <Section id="playlist" icon="♫" label="Playlist de Momentos" title="Música do evento" subtitle={`${list.length} música${list.length === 1 ? '' : 's'}`}
      action={isAdmin && <EditChip active={editing} onClick={editing ? save : startEdit} />}>
      {editing ? (
        <div className="space-y-2">
          {draft.map((row, idx) => (
            <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_36px] gap-2 items-center">
              <Inp value={row.moment} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, moment: v } : x))} placeholder="Momento" />
              <Inp value={row.song} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, song: v } : x))} placeholder="Música" />
              <Inp value={row.artist ?? ''} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, artist: v } : x))} placeholder="Artista" />
              <Inp value={row.url ?? ''} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, url: v } : x))} placeholder="Link Spotify/YouTube" />
              <RemoveBtn onClick={() => setDraft(d => d.filter((_, i) => i !== idx))} />
            </div>
          ))}
          <AddBtn onClick={() => setDraft(d => [...d, { id: uid(), moment: '', song: '', artist: '', url: '' }])} label="Adicionar Música" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon="♫" msg="Sem playlist definida." />
      ) : (
        <div className="space-y-1.5">
          {list.map(p => (
            <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:border-gold/25 transition-colors group">
              <span className="w-9 h-9 rounded-lg border border-gold/30 bg-gold/10 text-gold flex items-center justify-center text-base shrink-0">♫</span>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] tracking-[0.3em] text-gold/65 uppercase mb-0.5 truncate">{p.moment || 'Momento'}</p>
                <p className="text-[13px] text-white/90 font-medium truncate">
                  {p.song || <span className="text-white/30 italic">Sem título</span>}
                  {p.artist && <span className="text-white/45 font-normal"> — {p.artist}</span>}
                </p>
              </div>
              {p.url && (
                <a href={p.url} target="_blank" rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-md text-[9px] tracking-widest uppercase font-bold border border-white/12 text-white/55 hover:text-gold hover:border-gold/40 transition-all shrink-0">
                  ▶ Ouvir
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

// ─── Section: Restrições do Local ────────────────────────────────────────────

function RestricoesSection({ info, isAdmin, onSave }: { info: BriefingExt; isAdmin: boolean; onSave: (p: Partial<BriefingExt>) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(info.restricoes ?? [])
  const list = info.restricoes ?? []

  function startEdit() {
    setDraft(list.length ? list.map(x => ({ ...x })) : [
      { id: uid(), label: 'Drone autorizado', allowed: true, note: '' },
      { id: uid(), label: 'Flash na cerimónia', allowed: false, note: '' },
      { id: uid(), label: 'Refeição para equipa', allowed: true, note: '' },
    ])
    setEditing(true)
  }
  async function save() { await onSave({ restricoes: draft.filter(x => x.label.trim()) }); setEditing(false) }

  return (
    <Section id="restricoes" icon="◆" label="Restrições & Permissões" title="Regras do local" subtitle={`${list.length} item${list.length === 1 ? '' : 's'}`}
      accent="amber"
      action={isAdmin && <EditChip active={editing} onClick={editing ? save : startEdit} />}>
      {editing ? (
        <div className="space-y-2">
          {draft.map((row, idx) => (
            <div key={row.id} className="grid grid-cols-[1.5fr_90px_1fr_36px] gap-2 items-center">
              <Inp value={row.label} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, label: v } : x))} placeholder="Item (ex: Drone autorizado)" />
              <select value={row.allowed ? 'sim' : 'nao'}
                onChange={e => setDraft(d => d.map((x, i) => i === idx ? { ...x, allowed: e.target.value === 'sim' } : x))}
                className="bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[12px] text-white outline-none focus:border-gold/50 [color-scheme:dark]">
                <option value="sim" className="bg-neutral-900">Sim</option>
                <option value="nao" className="bg-neutral-900">Não</option>
              </select>
              <Inp value={row.note ?? ''} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, note: v } : x))} placeholder="Nota (opcional)" />
              <RemoveBtn onClick={() => setDraft(d => d.filter((_, i) => i !== idx))} />
            </div>
          ))}
          <AddBtn onClick={() => setDraft(d => [...d, { id: uid(), label: '', allowed: true, note: '' }])} label="Adicionar Restrição" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon="◆" msg="Sem restrições registadas." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {list.map(r => (
            <div key={r.id} className={`flex items-start gap-3 px-3.5 py-2.5 rounded-xl border ${
              r.allowed ? 'border-emerald-500/30 bg-emerald-500/[0.05]' : 'border-rose-500/30 bg-rose-500/[0.05]'
            }`}>
              <span className={`w-7 h-7 rounded-md flex items-center justify-center text-[12px] font-bold shrink-0 ${
                r.allowed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>{r.allowed ? '✓' : '✕'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-medium truncate ${r.allowed ? 'text-emerald-200/90' : 'text-rose-200/90'}`}>{r.label}</p>
                {r.note && <p className="text-[10px] text-white/45 mt-0.5 leading-relaxed">{r.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

// ─── Section: Contactos Rápidos ──────────────────────────────────────────────

function ContactosSection({ info, isAdmin, onSave }: { info: BriefingExt; isAdmin: boolean; onSave: (p: Partial<BriefingExt>) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(info.contactos ?? [])
  const list = info.contactos ?? []

  function startEdit() {
    setDraft(list.length ? list.map(x => ({ ...x })) : [
      { id: uid(), role: 'Wedding Planner', name: '', phone: '', email: '' },
      { id: uid(), role: 'DJ', name: '', phone: '', email: '' },
    ])
    setEditing(true)
  }
  async function save() { await onSave({ contactos: draft.filter(x => x.name.trim() || x.role.trim()) }); setEditing(false) }

  return (
    <Section id="contactos" icon="✆" label="Contactos Rápidos" title="Fornecedores do evento" subtitle={`${list.length} contacto${list.length === 1 ? '' : 's'}`}
      accent="blue"
      action={isAdmin && <EditChip active={editing} onClick={editing ? save : startEdit} />}>
      {editing ? (
        <div className="space-y-2">
          {draft.map((row, idx) => (
            <div key={row.id} className="grid grid-cols-[1fr_1fr_120px_1fr_36px] gap-2 items-center">
              <Inp value={row.role} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, role: v } : x))} placeholder="Função" />
              <Inp value={row.name} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, name: v } : x))} placeholder="Nome" />
              <Inp type="tel" value={row.phone ?? ''} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, phone: v } : x))} placeholder="Telefone" />
              <Inp type="email" value={row.email ?? ''} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, email: v } : x))} placeholder="Email" />
              <RemoveBtn onClick={() => setDraft(d => d.filter((_, i) => i !== idx))} />
            </div>
          ))}
          <AddBtn onClick={() => setDraft(d => [...d, { id: uid(), role: '', name: '', phone: '', email: '' }])} label="Adicionar Contacto" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon="✆" msg="Sem contactos registados." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {list.map(c => (
            <div key={c.id} className="flex items-start gap-3 px-3.5 py-2.5 rounded-xl bg-white/[0.025] border border-white/[0.06] hover:border-blue-500/30 transition-colors">
              <span className="w-9 h-9 rounded-lg border border-blue-500/35 bg-blue-500/10 text-blue-300 flex items-center justify-center text-base shrink-0">
                {ROLE_ICONS[c.role] ?? '◆'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] tracking-[0.3em] text-blue-300/70 uppercase mb-0.5 truncate">{c.role}</p>
                <p className="text-[13px] text-white/90 font-medium truncate">{c.name || <span className="text-white/30 italic">—</span>}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {c.phone && <a href={`tel:${c.phone}`} className="text-[10px] text-white/55 hover:text-gold inline-flex items-center gap-1 transition-colors">✆ {c.phone}</a>}
                  {c.email && <a href={`mailto:${c.email}`} className="text-[10px] text-white/55 hover:text-gold inline-flex items-center gap-1 transition-colors truncate">✉ {c.email}</a>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  )
}

// ─── Section: Notas Sensíveis ────────────────────────────────────────────────

function NotasSensiveisSection({ info, isAdmin, onSave }: { info: BriefingExt; isAdmin: boolean; onSave: (p: Partial<BriefingExt>) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(info.notasSensiveis ?? '')

  function startEdit() { setDraft(info.notasSensiveis ?? ''); setEditing(true) }
  async function save() { await onSave({ notasSensiveis: draft.trim() }); setEditing(false) }

  return (
    <Section id="notas-sensiveis" icon="⚠" label="Notas Sensíveis" title="Informação a ter atenção"
      subtitle={info.notasSensiveis ? 'Atenção ao ler' : 'Alergias, conflitos, situações delicadas'}
      accent="rose"
      action={isAdmin && <EditChip active={editing} onClick={editing ? save : startEdit} />}>
      {editing ? (
        <div className="space-y-2">
          <textarea value={draft} onChange={e => setDraft(e.target.value)}
            rows={5} placeholder="Ex: O pai da noiva faleceu recentemente — evitar perguntar por ele.&#10;Alergia a frutos secos na mesa 3.&#10;Ex-cônjuge do noivo presente como convidado."
            className="w-full bg-black/40 border border-rose-500/25 rounded-lg px-3 py-2.5 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-rose-500/55 resize-none leading-relaxed" />
        </div>
      ) : info.notasSensiveis ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.06] px-4 py-3.5">
          <p className="text-[12px] text-rose-100/90 whitespace-pre-wrap leading-relaxed">{info.notasSensiveis}</p>
        </div>
      ) : (
        <EmptyState icon="⚠" msg="Sem notas sensíveis." hint="Usar para alertas que a equipa precisa de saber sem chamar à atenção." />
      )}
    </Section>
  )
}

// ─── Section: Tarefas Pré-Evento ─────────────────────────────────────────────

function TarefasPreSection({ info, isAdmin, onSave }: { info: BriefingExt; isAdmin: boolean; onSave: (p: Partial<BriefingExt>) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(info.tarefasPre ?? [])
  const list = info.tarefasPre ?? []

  function startEdit() {
    setDraft(list.length ? list.map(x => ({ ...x })) : [
      { id: uid(), when: 'T-7', label: 'Reconhecimento do local', responsavel: '', done: false },
      { id: uid(), when: 'T-3', label: 'Briefing enviado à equipa', responsavel: '', done: false },
      { id: uid(), when: 'T-1', label: 'Baterias carregadas + cartões formatados', responsavel: '', done: false },
      { id: uid(), when: 'T-1', label: 'Equipa confirmada e horários revistos', responsavel: '', done: false },
    ])
    setEditing(true)
  }
  async function save() { await onSave({ tarefasPre: draft.filter(x => x.label.trim()) }); setEditing(false) }

  async function toggleDone(id: string) {
    const next = list.map(t => t.id === id ? { ...t, done: !t.done } : t)
    await onSave({ tarefasPre: next })
  }

  const WHENS: Array<BriefingExt['tarefasPre'] extends Array<infer U> | undefined ? (U extends { when: infer W } ? W : never) : never> = ['T-7', 'T-3', 'T-1', 'T-0']
  const grouped = useMemo(() => {
    const g: Record<string, typeof list> = {}
    for (const w of WHENS) g[w as string] = list.filter(t => t.when === w)
    return g
  }, [list])

  const done = list.filter(t => t.done).length

  return (
    <Section id="tarefas-pre" icon="◴" label="Tarefas Pré-Evento" title="Checklist preparatório"
      subtitle={list.length > 0 ? `${done} de ${list.length} concluídas` : 'Garantir que tudo está pronto'}
      accent="amber"
      action={isAdmin && <EditChip active={editing} onClick={editing ? save : startEdit} />}>
      {editing ? (
        <div className="space-y-2">
          {draft.map((row, idx) => (
            <div key={row.id} className="grid grid-cols-[70px_1fr_1fr_36px] gap-2 items-center">
              <select value={row.when}
                onChange={e => setDraft(d => d.map((x, i) => i === idx ? { ...x, when: e.target.value as any } : x))}
                className="bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-[12px] text-white outline-none focus:border-gold/50 [color-scheme:dark]">
                {WHENS.map(w => <option key={w as string} value={w as string} className="bg-neutral-900">{w as string}</option>)}
              </select>
              <Inp value={row.label} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, label: v } : x))} placeholder="Tarefa" />
              <Inp value={row.responsavel ?? ''} onChange={v => setDraft(d => d.map((x, i) => i === idx ? { ...x, responsavel: v } : x))} placeholder="Responsável" />
              <RemoveBtn onClick={() => setDraft(d => d.filter((_, i) => i !== idx))} />
            </div>
          ))}
          <AddBtn onClick={() => setDraft(d => [...d, { id: uid(), when: 'T-7', label: '', responsavel: '', done: false }])} label="Adicionar Tarefa" />
          <p className="text-[10px] text-white/30 italic">T-7 = 7 dias antes · T-3 = 3 dias · T-1 = véspera · T-0 = dia do evento.</p>
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon="◴" msg="Sem tarefas pré-evento." />
      ) : (
        <div className="space-y-4">
          {WHENS.map(w => {
            const tasks = grouped[w as string]
            if (!tasks?.length) return null
            return (
              <div key={w as string}>
                <p className="text-[9px] tracking-[0.4em] text-amber-300/70 uppercase font-bold mb-2">{w as string}</p>
                <div className="space-y-1.5">
                  {tasks.map(t => (
                    <button key={t.id} onClick={() => toggleDone(t.id)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                        t.done
                          ? 'border-emerald-500/30 bg-emerald-500/[0.05]'
                          : 'border-white/[0.07] bg-white/[0.02] hover:border-amber-500/35'
                      }`}>
                      <span className={`w-5 h-5 rounded-md border flex items-center justify-center text-[11px] shrink-0 ${
                        t.done ? 'border-emerald-500/55 bg-emerald-500/25 text-emerald-200' : 'border-white/20 bg-transparent text-transparent'
                      }`}>✓</span>
                      <span className={`text-[12px] flex-1 ${t.done ? 'text-emerald-200/85 line-through decoration-emerald-400/40' : 'text-white/80'}`}>
                        {t.label}
                      </span>
                      {t.responsavel && <span className="text-[10px] text-gold/65 tracking-wider uppercase shrink-0">⌘ {t.responsavel}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Section>
  )
}

// ─── Section: Notas Privadas (admin only) ────────────────────────────────────

function NotasPrivadasSection({ info, onSave }: { info: BriefingExt; onSave: (p: Partial<BriefingExt>) => void | Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(info.notasPrivadas ?? '')

  function startEdit() { setDraft(info.notasPrivadas ?? ''); setEditing(true) }
  async function save() { await onSave({ notasPrivadas: draft.trim() }); setEditing(false) }

  return (
    <Section id="notas-privadas" icon="◬" label="Notas Privadas · Apenas Equipa" title="Comentários internos"
      subtitle="O cliente NÃO vê esta secção"
      accent="blue"
      action={<EditChip active={editing} onClick={editing ? save : startEdit} />}>
      {editing ? (
        <textarea value={draft} onChange={e => setDraft(e.target.value)}
          rows={4} placeholder="Notas para a equipa que o cliente não deve ver…"
          className="w-full bg-black/40 border border-blue-500/25 rounded-lg px-3 py-2.5 text-[12px] text-white placeholder:text-white/25 outline-none focus:border-blue-500/55 resize-none leading-relaxed" />
      ) : info.notasPrivadas ? (
        <div className="rounded-xl border border-blue-500/25 bg-blue-500/[0.05] px-4 py-3.5">
          <p className="text-[12px] text-blue-100/85 whitespace-pre-wrap leading-relaxed">{info.notasPrivadas}</p>
        </div>
      ) : (
        <EmptyState icon="◬" msg="Sem notas privadas." />
      )}
    </Section>
  )
}

// ─── Section: Histórico (admin only) ─────────────────────────────────────────

function HistoricoSection({ info }: { info: BriefingExt }) {
  const list = info.historico ?? []
  return (
    <Section id="historico" icon="◷" label="Histórico de Alterações" title="Atividade neste briefing"
      subtitle={`${list.length} alteração${list.length === 1 ? '' : 'ões'}`}
      accent="blue">
      {list.length === 0 ? (
        <EmptyState icon="◷" msg="Sem alterações registadas." />
      ) : (
        <ol className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
          {[...list].reverse().slice(0, 30).map((h, i) => (
            <li key={i} className="flex items-start gap-3 text-[11px] px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
              <span className="text-blue-300/70 tabular-nums tracking-wider shrink-0">{new Date(h.at).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-white/60 truncate">{h.who} · <span className="text-white/85">{h.action}</span></span>
            </li>
          ))}
        </ol>
      )}
    </Section>
  )
}

// ─── Calculadora de progresso ────────────────────────────────────────────────

function calcProgress(info: BriefingExt) {
  const checks: Array<{ key: keyof BriefingExt; label: string }> = [
    { key: 'cronograma',     label: 'Cronograma' },
    { key: 'mapas',          label: 'Mapas' },
    { key: 'equipa',         label: 'Equipa' },
    { key: 'momentos',       label: 'Momentos' },
    { key: 'vips',           label: 'VIPs' },
    { key: 'moodboard',      label: 'Mood Board' },
    { key: 'playlist',       label: 'Playlist' },
    { key: 'restricoes',     label: 'Restrições' },
    { key: 'contactos',      label: 'Contactos' },
    { key: 'tarefasPre',     label: 'Tarefas Pré' },
  ]
  const filled = checks.filter(c => {
    const v = info[c.key]
    if (Array.isArray(v)) return v.length > 0
    if (typeof v === 'string') return v.trim().length > 0
    return false
  })
  return { filled: filled.length, total: checks.length, pct: Math.round((filled.length / checks.length) * 100) }
}

// ─── Hero Premium ────────────────────────────────────────────────────────────

function BriefingHero({
  info, dataEvento, local, pageTitle, isAdmin, viewMode, setViewMode, onSave, enviarBriefingNode,
}: {
  info: BriefingExt
  dataEvento?: string | null
  local?: string | null
  pageTitle?: string
  isAdmin: boolean
  viewMode: 'admin' | 'client'
  setViewMode: (v: 'admin' | 'client') => void
  onSave: (p: Partial<BriefingExt>) => void | Promise<void>
  enviarBriefingNode?: ReactNode
}) {
  const status = info.status ?? 'rascunho'
  const cfg = STATUS_CFG[status]
  const [statusOpen, setStatusOpen] = useState(false)
  const { filled, total, pct } = calcProgress(info)

  const dateLabel = useMemo(() => {
    if (!dataEvento) return null
    try {
      const d = new Date(dataEvento)
      return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
    } catch { return dataEvento }
  }, [dataEvento])

  function handlePrint() { if (typeof window !== 'undefined') window.print() }
  function handlePresent() {
    if (typeof document === 'undefined') return
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.()
    else document.exitFullscreen?.()
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] mb-5"
      style={{ background: 'linear-gradient(125deg, rgba(20,15,8,0.7) 0%, rgba(11,11,11,0.6) 55%, rgba(201,164,92,0.08) 100%)', boxShadow: '0 30px 60px -25px rgba(0,0,0,0.6)' }}>
      {/* Glow no canto */}
      <span className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.16), transparent 70%)' }} />
      <span className="pointer-events-none absolute -bottom-24 -left-24 w-60 h-60 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.10), transparent 70%)' }} />

      <div className="relative px-5 sm:px-8 py-6 sm:py-7">
        {/* Linha 1: label, view mode toggle */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <p className="text-[9px] tracking-[0.5em] text-gold/65 uppercase">RL Photo·Video · Briefing</p>
          {isAdmin && (
            <div className="inline-flex items-center rounded-full border border-white/10 bg-black/40 p-1 gap-1">
              {(['admin', 'client'] as const).map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-3 py-1 rounded-full text-[9px] tracking-[0.3em] uppercase font-bold transition-all ${
                    viewMode === m ? 'bg-gold text-black' : 'text-white/45 hover:text-white/75'
                  }`}>
                  {m === 'admin' ? '◆ Admin' : '◯ Cliente'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Linha 2: ícone + título grande + data/local à direita */}
        <div className="flex items-start justify-between gap-5 flex-wrap mb-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl border border-gold/40 bg-gold/[0.08] flex items-center justify-center text-gold text-2xl shrink-0"
              style={{ boxShadow: '0 0 22px -6px rgba(201,164,92,0.5)' }}>◧</div>
            <div className="min-w-0">
              <h1 className="font-light text-white tracking-tight leading-tight"
                style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(1.5rem, 3.5vw, 2.4rem)' }}>
                {pageTitle || 'Briefing do Evento'}
              </h1>
              <p className="text-[12px] text-white/50 mt-1 leading-relaxed max-w-md">
                Toda a informação organizada para a equipa e os noivos consultarem em qualquer momento.
              </p>
            </div>
          </div>

          {/* Cartão data/local */}
          {(dateLabel || local) && (
            <div className="flex items-center gap-4 px-4 py-3 rounded-2xl border border-white/[0.08] bg-black/30">
              {dateLabel && (
                <div>
                  <p className="text-[8px] tracking-[0.35em] text-gold/55 uppercase mb-1">Data</p>
                  <p className="text-[13px] text-white font-medium tabular-nums">{dateLabel}</p>
                </div>
              )}
              {dateLabel && local && <span className="w-px h-7 bg-white/10" />}
              {local && (
                <div>
                  <p className="text-[8px] tracking-[0.35em] text-gold/55 uppercase mb-1">Local</p>
                  <p className="text-[13px] text-white font-medium truncate max-w-[180px]">{local}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Linha 3: status + progress + actions */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Status pill */}
          <div className="relative">
            <button onClick={() => isAdmin && setStatusOpen(s => !s)} disabled={!isAdmin}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border ${cfg.bg} ${cfg.border} ${cfg.text} text-[10px] tracking-[0.25em] uppercase font-bold transition-all ${isAdmin ? 'hover:opacity-90 cursor-pointer' : 'cursor-default'}`}
              style={{ boxShadow: `0 0 14px -4px ${cfg.glow}` }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor', boxShadow: `0 0 8px ${cfg.glow}` }} />
              {cfg.label}
              {isAdmin && <span className="opacity-60 ml-0.5">▾</span>}
            </button>
            {statusOpen && (
              <div className="absolute top-full left-0 mt-1.5 z-30 rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl overflow-hidden min-w-[200px]">
                {(Object.keys(STATUS_CFG) as Array<keyof typeof STATUS_CFG>).map(k => (
                  <button key={k} onClick={() => { onSave({ status: k }); setStatusOpen(false) }}
                    className={`w-full px-3 py-2.5 text-left text-[11px] tracking-widest uppercase font-bold transition-all flex items-center gap-2 ${STATUS_CFG[k].text} hover:bg-white/[0.04]`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
                    {STATUS_CFG[k].label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="flex-1 min-w-[160px] max-w-[420px]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[9px] tracking-[0.3em] text-white/40 uppercase">Briefing · {pct}%</p>
              <p className="text-[9px] text-gold/65 tracking-widest">{filled}/{total} secções</p>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gold/70 to-gold transition-all duration-500"
                style={{ width: `${pct}%`, boxShadow: '0 0 10px rgba(201,164,92,0.5)' }} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button onClick={handlePrint} title="Exportar como PDF (Ctrl+P)"
              className="px-3 py-2 rounded-lg text-[10px] tracking-[0.25em] uppercase font-bold border border-white/12 bg-white/[0.04] text-white/65 hover:text-gold hover:border-gold/40 hover:bg-gold/[0.06] transition-all flex items-center gap-1.5">
              ↓ PDF
            </button>
            <button onClick={handlePresent} title="Modo apresentação (fullscreen)"
              className="px-3 py-2 rounded-lg text-[10px] tracking-[0.25em] uppercase font-bold border border-white/12 bg-white/[0.04] text-white/65 hover:text-gold hover:border-gold/40 hover:bg-gold/[0.06] transition-all flex items-center gap-1.5">
              ▶ Apresentar
            </button>
            {enviarBriefingNode}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar Navegação ───────────────────────────────────────────────────────

type NavItem = { id: string; label: string; icon: string; group: string; accent?: string }

function BriefingSidebar({ items, activeId, onClick }: { items: NavItem[]; activeId: string; onClick: (id: string) => void }) {
  // Agrupa por group preservando ordem
  const groups = useMemo(() => {
    const m = new Map<string, NavItem[]>()
    for (const it of items) {
      if (!m.has(it.group)) m.set(it.group, [])
      m.get(it.group)!.push(it)
    }
    return Array.from(m.entries())
  }, [items])

  return (
    <aside className="lg:sticky lg:top-4 lg:self-start">
      {/* Mobile: horizontal scroll strip */}
      <div className="lg:hidden -mx-1 overflow-x-auto pb-2 no-scrollbar">
        <div className="flex items-center gap-1.5 px-1 whitespace-nowrap">
          {items.map(it => {
            const active = activeId === it.id
            return (
              <button key={it.id} onClick={() => onClick(it.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] tracking-widest uppercase font-bold transition-all ${
                  active ? 'border-gold/55 bg-gold/15 text-gold' : 'border-white/10 bg-white/[0.03] text-white/55 hover:text-white/85 hover:border-white/25'
                }`}>
                <span className="text-[11px]">{it.icon}</span>
                {it.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop: vertical sticky sidebar */}
      <nav className="hidden lg:block rounded-2xl border border-white/[0.08] overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(20,15,8,0.45), rgba(11,11,11,0.6))' }}>
        <div className="px-4 py-3 border-b border-white/[0.05]">
          <p className="text-[9px] tracking-[0.4em] text-gold/60 uppercase font-bold">Navegação</p>
        </div>
        <div className="py-2 max-h-[calc(100vh-220px)] overflow-y-auto">
          {groups.map(([groupName, groupItems]) => (
            <div key={groupName} className="mb-2 last:mb-0">
              <p className="px-4 py-1.5 text-[8px] tracking-[0.3em] text-white/30 uppercase font-bold">{groupName}</p>
              {groupItems.map(it => {
                const active = activeId === it.id
                return (
                  <button key={it.id} onClick={() => onClick(it.id)}
                    className={`group w-full flex items-center gap-2.5 px-4 py-2 text-left transition-all ${
                      active ? 'bg-gold/[0.08] text-gold' : 'text-white/55 hover:text-white hover:bg-white/[0.025]'
                    }`}>
                    <span className={`w-1 self-stretch rounded-full transition-all ${active ? 'bg-gold' : 'bg-transparent'}`} />
                    <span className={`text-[14px] shrink-0 ${active ? 'text-gold' : 'text-white/45 group-hover:text-white/75'}`}>{it.icon}</span>
                    <span className={`text-[11px] tracking-wider truncate flex-1 ${active ? 'font-bold' : 'font-medium'}`}>{it.label}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </nav>
    </aside>
  )
}

// ─── Visão Geral (KPI dashboard premium) ─────────────────────────────────────

type KpiAccent = 'gold' | 'rose' | 'blue' | 'emerald' | 'amber' | 'purple'

function KpiCard({ icon, label, value, sub, accent, filled, onClick }: {
  icon: string
  label: string
  value: string
  sub: string
  accent: KpiAccent
  filled: boolean
  onClick: () => void
}) {
  const accents: Record<KpiAccent, { iconBg: string; iconBorder: string; iconText: string }> = {
    gold:    { iconBg: 'bg-gold/10',         iconBorder: 'border-gold/35',         iconText: 'text-gold' },
    rose:    { iconBg: 'bg-rose-500/12',     iconBorder: 'border-rose-500/40',     iconText: 'text-rose-300' },
    blue:    { iconBg: 'bg-blue-500/12',     iconBorder: 'border-blue-500/35',     iconText: 'text-blue-300' },
    emerald: { iconBg: 'bg-emerald-500/12',  iconBorder: 'border-emerald-500/35',  iconText: 'text-emerald-300' },
    amber:   { iconBg: 'bg-amber-500/12',    iconBorder: 'border-amber-500/35',    iconText: 'text-amber-300' },
    purple:  { iconBg: 'bg-purple-500/12',   iconBorder: 'border-purple-500/35',   iconText: 'text-purple-300' },
  }
  const a = accents[accent]
  return (
    <button onClick={onClick}
      className="group relative text-left p-4 rounded-xl border border-white/[0.07] bg-white/[0.015] hover:border-white/15 hover:bg-white/[0.03] transition-all"
      style={{ boxShadow: '0 8px 22px -16px rgba(0,0,0,0.5)' }}>
      {/* Top: ícone + label */}
      <div className="flex items-center justify-between mb-3">
        <span className={`w-8 h-8 rounded-lg border ${a.iconBorder} ${a.iconBg} ${a.iconText} flex items-center justify-center text-[13px] shrink-0`}>
          {icon}
        </span>
        <span className="text-[8px] tracking-[0.35em] uppercase font-bold text-white/40 group-hover:text-white/70 transition-colors truncate">{label}</span>
      </div>
      {/* Valor */}
      <p className={`leading-none tabular-nums ${filled ? 'text-white' : 'text-white/25'}`}
        style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '28px', fontWeight: 300 }}>
        {value}
      </p>
      {/* Sub */}
      <p className={`text-[10px] mt-1.5 tracking-wide truncate ${filled ? 'text-white/55' : 'text-white/30 italic'}`}>{sub}</p>
      {/* Setinha hover */}
      <span className="absolute top-3 right-3 text-gold/0 group-hover:text-gold/70 transition-all duration-200 text-xs">›</span>
    </button>
  )
}

function VisaoGeralSection({ info, onJump }: { info: BriefingExt; onJump: (id: string) => void }) {
  const equipaN     = info.equipa?.length ?? 0
  const cronogramaN = info.cronograma?.length ?? 0
  const mapasN      = info.mapas?.length ?? 0
  const momentosN   = info.momentos?.length ?? 0
  const momentosDone= info.momentos?.filter(m => m.done).length ?? 0
  const vipsN       = info.vips?.length ?? 0
  const playlistN   = info.playlist?.length ?? 0
  const contactosN  = info.contactos?.length ?? 0
  const tarefasN    = info.tarefasPre?.length ?? 0
  const tarefasDone = info.tarefasPre?.filter(t => t.done).length ?? 0
  const restricoesN = info.restricoes?.length ?? 0
  const temNotas    = !!(info.notasSensiveis ?? '').trim()
  const moodN       = info.moodboard?.length ?? 0
  const { filled, total, pct } = calcProgress(info)

  const sing = (n: number, s: string, p: string) => n === 1 ? s : p

  // KPI cards agrupados
  const operacional = [
    { id: 'k-crono',  icon: '⌚', label: 'Cronograma',  value: String(cronogramaN), sub: cronogramaN > 0 ? `${sing(cronogramaN, 'momento', 'momentos')} definidos` : 'por definir',            accent: 'gold' as KpiAccent,    target: 'cronograma', filled: cronogramaN > 0 },
    { id: 'k-mapas',  icon: '◉', label: 'Localizações',value: String(mapasN),      sub: mapasN > 0 ? `${sing(mapasN, 'local', 'locais')} com Maps` : 'sem locais',                            accent: 'gold' as KpiAccent,    target: 'mapas',      filled: mapasN > 0 },
    { id: 'k-equip',  icon: '⌘', label: 'Equipa',      value: String(equipaN),     sub: equipaN > 0 ? `${sing(equipaN, 'profissional', 'profissionais')}` : 'por definir',                    accent: 'gold' as KpiAccent,    target: 'equipa',     filled: equipaN > 0 },
  ]
  const criativo = [
    { id: 'k-mom',    icon: '✓', label: 'Momentos',    value: momentosN > 0 ? `${momentosDone}/${momentosN}` : '—', sub: momentosN > 0 ? 'obrigatórios marcados' : 'por definir',              accent: 'emerald' as KpiAccent, target: 'momentos',  filled: momentosN > 0 },
    { id: 'k-vips',   icon: '★', label: 'VIPs',        value: String(vipsN),       sub: vipsN > 0 ? `${sing(vipsN, 'convidado-chave', 'convidados-chave')}` : 'sem VIPs',                      accent: 'gold' as KpiAccent,    target: 'vips',       filled: vipsN > 0 },
    { id: 'k-mood',   icon: '◧', label: 'Referências', value: String(moodN),       sub: moodN > 0 ? `${sing(moodN, 'imagem', 'imagens')} de mood` : 'sem referências',                         accent: 'gold' as KpiAccent,    target: 'moodboard',  filled: moodN > 0 },
    { id: 'k-ply',    icon: '♫', label: 'Playlist',    value: String(playlistN),   sub: playlistN > 0 ? `${sing(playlistN, 'música', 'músicas')}` : 'sem música',                              accent: 'purple' as KpiAccent,  target: 'playlist',   filled: playlistN > 0 },
  ]
  const logistica = [
    { id: 'k-cont',   icon: '✆', label: 'Contactos',   value: String(contactosN),  sub: contactosN > 0 ? `${sing(contactosN, 'fornecedor', 'fornecedores')}` : 'sem contactos',                accent: 'blue' as KpiAccent,    target: 'contactos',  filled: contactosN > 0 },
    { id: 'k-rest',   icon: '◆', label: 'Restrições',  value: String(restricoesN), sub: restricoesN > 0 ? `${sing(restricoesN, 'regra do local', 'regras do local')}` : 'sem regras',          accent: 'amber' as KpiAccent,   target: 'restricoes', filled: restricoesN > 0 },
    { id: 'k-notas',  icon: '⚠', label: 'Atenção',     value: temNotas ? '!' : '—',sub: temNotas ? 'requer atenção' : 'tudo limpo',                                                            accent: 'rose' as KpiAccent,    target: 'notas-sensiveis', filled: temNotas },
    { id: 'k-pre',    icon: '◴', label: 'Pré-Evento',  value: tarefasN > 0 ? `${tarefasDone}/${tarefasN}` : '—', sub: tarefasN > 0 ? 'tarefas T-7…T-0' : 'sem tarefas',                         accent: 'amber' as KpiAccent,   target: 'tarefas-pre', filled: tarefasN > 0 },
  ]

  return (
    <Section id="visao" icon="▣" label="Visão Geral" title="Resumo do briefing"
      subtitle="Estado de cada área num só ecrã">
      {/* ─── Hero card: Conclusão Geral ───────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-gold/20 mb-5"
        style={{ background: 'linear-gradient(110deg, rgba(201,164,92,0.08) 0%, rgba(20,15,8,0.5) 50%, rgba(11,11,11,0.55) 100%)' }}>
        <span className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(201,164,92,0.18), transparent 70%)' }} />
        <div className="relative px-6 py-5 flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-5 min-w-0">
            <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
              {/* anel SVG */}
              <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#C9A45C" strokeWidth="2.5"
                  strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 600ms ease' }} />
              </svg>
              <span className="relative text-gold font-bold tabular-nums text-[13px]">{pct}%</span>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.5em] text-gold/60 uppercase mb-1.5">Conclusão do Briefing</p>
              <p className="text-white font-light tracking-tight" style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '22px' }}>
                {pct === 100 ? 'Briefing completo' : pct >= 50 ? 'Em bom ritmo' : pct > 0 ? 'A começar' : 'Por iniciar'}
                <span className="text-white/45 italic"> · {filled} de {total} secções</span>
              </p>
            </div>
          </div>
          <div className="flex-1 min-w-[180px] max-w-md">
            <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-gold/70 to-gold transition-all duration-700"
                style={{ width: `${pct}%`, boxShadow: '0 0 10px rgba(201,164,92,0.55)' }} />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[9px] tracking-[0.3em] text-white/30 uppercase">Início</span>
              <span className="text-[9px] tracking-[0.3em] text-gold/60 uppercase">Pronto</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Grupo: OPERACIONAL ──────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[9px] tracking-[0.4em] text-gold/55 uppercase font-bold">Operacional</span>
          <span className="flex-1 h-px bg-gradient-to-r from-gold/20 to-transparent" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {operacional.map(k => (
            <KpiCard key={k.id} icon={k.icon} label={k.label} value={k.value} sub={k.sub} accent={k.accent} filled={k.filled} onClick={() => onJump(k.target)} />
          ))}
        </div>
      </div>

      {/* ─── Grupo: CRIATIVO ──────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[9px] tracking-[0.4em] text-gold/55 uppercase font-bold">Criativo</span>
          <span className="flex-1 h-px bg-gradient-to-r from-gold/20 to-transparent" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {criativo.map(k => (
            <KpiCard key={k.id} icon={k.icon} label={k.label} value={k.value} sub={k.sub} accent={k.accent} filled={k.filled} onClick={() => onJump(k.target)} />
          ))}
        </div>
      </div>

      {/* ─── Grupo: LOGÍSTICA & PREPARAÇÃO ──────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-[9px] tracking-[0.4em] text-gold/55 uppercase font-bold">Logística & Preparação</span>
          <span className="flex-1 h-px bg-gradient-to-r from-gold/20 to-transparent" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {logistica.map(k => (
            <KpiCard key={k.id} icon={k.icon} label={k.label} value={k.value} sub={k.sub} accent={k.accent} filled={k.filled} onClick={() => onJump(k.target)} />
          ))}
        </div>
      </div>
    </Section>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function BriefingExtensions({
  info, isAdmin, onSave, pageTitle, dataEvento, local,
  enviarBriefingNode, equipaNode, fichasNode,
}: Props) {
  const [viewMode, setViewMode] = useState<'admin' | 'client'>(isAdmin ? 'admin' : 'client')
  const effectiveAdmin = isAdmin && viewMode === 'admin'
  const [activeId, setActiveId] = useState('visao')
  const contentRef = useRef<HTMLDivElement>(null)

  // Wrapper que regista no histórico automaticamente
  async function saveWithLog(patch: Partial<BriefingExt>) {
    const action = describePatch(patch)
    const historico = [...(info.historico ?? []), { at: new Date().toISOString(), who: effectiveAdmin ? 'Admin' : 'Cliente', action }]
    await onSave({ ...patch, historico })
  }

  // Definição da navegação
  const nav: NavItem[] = useMemo(() => {
    const base: NavItem[] = [
      { id: 'visao',        label: 'Visão Geral',   icon: '▣', group: 'Início' },
      { id: 'cronograma',   label: 'Cronograma',    icon: '⌚', group: 'Operacional' },
      { id: 'mapas',        label: 'Mapas',         icon: '◉', group: 'Operacional' },
      { id: 'equipa',       label: 'Equipa & Fichas', icon: '⌘', group: 'Operacional' },
      { id: 'momentos',     label: 'Momentos',      icon: '✓', group: 'Criativo' },
      { id: 'vips',         label: 'VIPs',          icon: '★', group: 'Criativo' },
      { id: 'moodboard',    label: 'Mood Board',    icon: '◧', group: 'Criativo' },
      { id: 'playlist',     label: 'Playlist',      icon: '♫', group: 'Criativo' },
      { id: 'restricoes',   label: 'Restrições',    icon: '◆', group: 'Logística' },
      { id: 'contactos',    label: 'Contactos',     icon: '✆', group: 'Logística' },
      { id: 'notas-sensiveis', label: 'Notas Sensíveis', icon: '⚠', group: 'Logística' },
      { id: 'tarefas-pre',  label: 'Tarefas Pré',   icon: '◴', group: 'Preparação' },
    ]
    if (effectiveAdmin) {
      base.push(
        { id: 'notas-privadas', label: 'Notas Privadas', icon: '◬', group: 'Admin' },
        { id: 'historico',      label: 'Histórico',      icon: '◷', group: 'Admin' },
      )
    }
    return base
  }, [effectiveAdmin])

  // Smooth scroll para uma secção
  function scrollTo(id: string) {
    if (typeof document === 'undefined') return
    const el = document.getElementById(id)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
    setActiveId(id)
  }

  // Scroll-spy: descobre que secção está visível
  useEffect(() => {
    if (typeof window === 'undefined') return
    const ids = nav.map(n => n.id)
    function onScroll() {
      const offsets = ids
        .map(id => ({ id, top: document.getElementById(id)?.getBoundingClientRect().top ?? Infinity }))
        .filter(o => o.top < 200)
        .sort((a, b) => b.top - a.top)
      const visible = offsets[0]
      if (visible && visible.id !== activeId) setActiveId(visible.id)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [nav, activeId])

  // Helpers para mostrar/esconder em modo cliente
  const showAdminEditing = effectiveAdmin // pass to sections

  return (
    <div className="briefing-premium">
      {/* HERO */}
      <BriefingHero
        info={info}
        dataEvento={dataEvento}
        local={local}
        pageTitle={pageTitle}
        isAdmin={isAdmin}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onSave={saveWithLog}
        enviarBriefingNode={enviarBriefingNode}
      />

      {/* ── Banner: admin a ver como Cliente — explica como editar ── */}
      {isAdmin && viewMode === 'client' && (
        <div
          className="mt-4 mb-4 flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-400/35 transition-all"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.10), rgba(201,164,92,0.05))',
            boxShadow: '0 0 24px -8px rgba(251,191,36,0.25)',
          }}
          role="status"
        >
          <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-amber-300 border border-amber-400/35 bg-amber-500/10"
            style={{ boxShadow: '0 0 14px -4px rgba(251,191,36,0.45)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5" />
              <circle cx="12" cy="16" r="0.6" fill="currentColor" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] tracking-[0.3em] uppercase text-amber-300 font-bold mb-0.5">
              Estás em pré-visualização · Cliente
            </p>
            <p className="text-[12.5px] text-white/70 leading-snug">
              Os controlos de edição (lápis dourado, botões de guardar) <strong className="text-white">estão escondidos</strong>{' '}
              porque estás a ver como o cliente vê.{' '}
              <button
                onClick={() => setViewMode('admin')}
                className="inline-flex items-center gap-1.5 ml-1 px-2.5 py-0.5 rounded-full text-[10px] tracking-[0.18em] uppercase font-bold text-black bg-gold hover:brightness-110 transition-all"
                title="Voltar a Modo Admin para editar"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Activar Modo Admin
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Layout 2 colunas — sidebar à esquerda, conteúdo à direita */}
      <div className="grid grid-cols-1 lg:grid-cols-[210px_1fr] gap-5 items-start">
        <BriefingSidebar items={nav} activeId={activeId} onClick={scrollTo} />

        <div ref={contentRef} className="space-y-4 min-w-0">
          {/* Visão Geral (KPIs) */}
          <VisaoGeralSection info={info} onJump={scrollTo} />

          {/* Operacional */}
          <CronogramaSection info={info} isAdmin={showAdminEditing} onSave={saveWithLog} />
          <MapasSection info={info} isAdmin={showAdminEditing} onSave={saveWithLog} />

          {/* Equipa + Fichas Individuais combinados num bloco visual */}
          <section id="equipa" className="space-y-4">
            {equipaNode}
            {fichasNode}
          </section>

          {/* Criativos — grid 2 col */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MomentosSection info={info} isAdmin={showAdminEditing} onSave={saveWithLog} />
            <VipsSection info={info} isAdmin={showAdminEditing} onSave={saveWithLog} />
          </div>

          <MoodboardSection info={info} isAdmin={showAdminEditing} onSave={saveWithLog} />
          <PlaylistSection info={info} isAdmin={showAdminEditing} onSave={saveWithLog} />

          {/* Logística — grid 2 col */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RestricoesSection info={info} isAdmin={showAdminEditing} onSave={saveWithLog} />
            <ContactosSection info={info} isAdmin={showAdminEditing} onSave={saveWithLog} />
          </div>

          <NotasSensiveisSection info={info} isAdmin={showAdminEditing} onSave={saveWithLog} />
          <TarefasPreSection info={info} isAdmin={showAdminEditing} onSave={saveWithLog} />

          {/* Admin-only */}
          {effectiveAdmin && <NotasPrivadasSection info={info} onSave={saveWithLog} />}
          {effectiveAdmin && <HistoricoSection info={info} />}
        </div>
      </div>
    </div>
  )
}

function describePatch(p: Partial<BriefingExt>): string {
  const keys = Object.keys(p).filter(k => k !== 'historico')
  if (keys.length === 0) return 'guardou alterações'
  const labels: Record<string, string> = {
    status: 'estado',
    cronograma: 'cronograma',
    mapas: 'mapas',
    momentos: 'momentos',
    vips: 'VIPs',
    moodboard: 'mood board',
    playlist: 'playlist',
    notasSensiveis: 'notas sensíveis',
    contactos: 'contactos',
    restricoes: 'restrições',
    tarefasPre: 'tarefas pré-evento',
    notasPrivadas: 'notas privadas',
    equipa: 'equipa',
    fields: 'informação',
    infoGeral: 'informação geral',
  }
  return `atualizou ${keys.map(k => labels[k] ?? k).join(', ')}`
}
