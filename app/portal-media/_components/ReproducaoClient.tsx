'use client'
import { useState } from 'react'
import Link from 'next/link'
import type {
  Projeto,
  StorytellingSena,
  StoryboardCena,
  StoryboardTipo,
  MoodboardItem,
  MoodboardCategoria,
} from '@/app/portal-media/_data/mockProject'
import AdminBar from './AdminBar'
import HeroUploadBlock from './HeroUploadBlock'

/* ──────────────────────────────────────────────────────── */
/*  CONFIG                                                  */
/* ──────────────────────────────────────────────────────── */

const TIPO_OPTS: { value: StoryboardTipo; label: string; dot: string }[] = [
  { value: 'abertura',      label: 'Abertura',       dot: 'bg-violet-400'  },
  { value: 'cerimonia',     label: 'Cerimónia',      dot: 'bg-blue-400'    },
  { value: 'momento_chave', label: 'Momento-chave',  dot: 'bg-amber-400'   },
  { value: 'detalhe',       label: 'Detalhe',        dot: 'bg-white/40'    },
  { value: 'final',         label: 'Final',          dot: 'bg-emerald-400' },
  { value: 'outro',         label: 'Outro',          dot: 'bg-white/20'    },
]

const CAT_OPTS: { value: MoodboardCategoria; label: string }[] = [
  { value: 'referencia',  label: 'Referência'   },
  { value: 'paleta',      label: 'Paleta'       },
  { value: 'composicao',  label: 'Composição'   },
  { value: 'luz',         label: 'Luz'          },
  { value: 'outro',       label: 'Outro'        },
]

const tipoDot = Object.fromEntries(TIPO_OPTS.map(t => [t.value, t.dot]))
const tipoLabel = Object.fromEntries(TIPO_OPTS.map(t => [t.value, t.label]))

type Tab = 'storytelling' | 'storyboard' | 'moodboard'

/* ──────────────────────────────────────────────────────── */
/*  COMPONENT                                               */
/* ──────────────────────────────────────────────────────── */

interface Props { projeto: Projeto }

export default function ReproducaoClient({ projeto: initial }: Props) {
  const [tab, setTab]               = useState<Tab>('storytelling')
  const [isEditing, setIsEditing]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [heroUrl, setHeroUrl]       = useState(initial.reproducaoImageUrl ?? '')

  /* storytelling */
  const [storytelling, setStorytelling]         = useState(initial.reproducaoStorytelling ?? '')
  const [palavrasChave, setPalavrasChave]       = useState(initial.reproducaoPalavrasChave ?? '')
  const [tomEmocional, setTomEmocional]         = useState(initial.reproducaoTomEmocional ?? '')
  const [senas, setSenas]                       = useState<StorytellingSena[]>(initial.reproducaoSenas ?? [])

  /* storyboard */
  const [cenas, setCenas] = useState<StoryboardCena[]>(initial.reproducaoStoryboard ?? [])

  /* moodboard */
  const [items, setItems] = useState<MoodboardItem[]>(initial.reproducaoMoodboard ?? [])
  const [novaUrl, setNovaUrl]       = useState('')
  const [novaLegenda, setNovaLegenda] = useState('')
  const [novaCat, setNovaCat]       = useState<MoodboardCategoria>('referencia')
  const [uploading, setUploading]   = useState(false)

  /* ── persistência ── */
  const buildPayload = () => ({
    reproducaoStorytelling: storytelling,
    reproducaoPalavrasChave: palavrasChave,
    reproducaoTomEmocional: tomEmocional,
    reproducaoSenas: senas,
    reproducaoStoryboard: cenas,
    reproducaoMoodboard: items,
    reproducaoImageUrl: heroUrl,
  })

  const saveData = async (payload = buildPayload()) => {
    await fetch(`/api/media-portal/${initial.ref}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try { await saveData() } catch {}
    setSaving(false)
    setIsEditing(false)
  }

  const cancel = () => {
    setStorytelling(initial.reproducaoStorytelling ?? '')
    setPalavrasChave(initial.reproducaoPalavrasChave ?? '')
    setTomEmocional(initial.reproducaoTomEmocional ?? '')
    setSenas(initial.reproducaoSenas ?? [])
    setCenas(initial.reproducaoStoryboard ?? [])
    setItems(initial.reproducaoMoodboard ?? [])
    setHeroUrl(initial.reproducaoImageUrl ?? '')
    setIsEditing(false)
  }

  /* ── storytelling senas helpers ── */
  const addSena = () => {
    const n = senas.length + 1
    setSenas(s => [...s, { id: Date.now().toString(), titulo: `Cena ${n}`, texto: '', concluido: false }])
    setIsEditing(true)
  }

  const updateSena = (id: string, field: keyof StorytellingSena, value: string | boolean) =>
    setSenas(s => s.map(s2 => s2.id === id ? { ...s2, [field]: value } : s2))

  const removeSena = (id: string) =>
    setSenas(s => s.filter(s2 => s2.id !== id))

  const toggleSena = async (id: string) => {
    const updated = senas.map(s => s.id === id ? { ...s, concluido: !s.concluido } : s)
    setSenas(updated)
    try {
      await saveData({ ...buildPayload(), reproducaoSenas: updated })
    } catch {}
  }

  /* ── storyboard helpers ── */
  const addCena = () => setCenas(c => [...c, {
    id: Date.now().toString(),
    momento: `Cena ${c.length + 1}`,
    descricao: '',
    tipo: 'outro',
    duracao: '',
  }])

  const updateCena = (id: string, field: keyof StoryboardCena, value: string) =>
    setCenas(c => c.map(s => s.id === id ? { ...s, [field]: value } : s))

  const removeCena = (id: string) =>
    setCenas(c => c.filter(s => s.id !== id))

  const moveCena = (id: string, dir: -1 | 1) => {
    setCenas(c => {
      const idx = c.findIndex(s => s.id === id)
      if (idx + dir < 0 || idx + dir >= c.length) return c
      const next = [...c]
      ;[next[idx], next[idx + dir]] = [next[idx + dir], next[idx]]
      return next
    })
  }

  /* ── moodboard helpers ── */
  const addItem = () => {
    if (!novaUrl.trim()) return
    const novo: MoodboardItem = {
      id: Date.now().toString(),
      url: novaUrl.trim(),
      legenda: novaLegenda.trim() || undefined,
      categoria: novaCat,
    }
    const updated = [...items, novo]
    setItems(updated)
    setNovaUrl('')
    setNovaLegenda('')
    setNovaCat('referencia')
    saveData({ ...buildPayload(), reproducaoMoodboard: updated }).catch(() => {})
  }

  const removeItem = (id: string) => {
    const updated = items.filter(it => it.id !== id)
    setItems(updated)
    saveData({ ...buildPayload(), reproducaoMoodboard: updated }).catch(() => {})
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) {
        setNovaUrl(data.url)
      }
    } catch {}
    setUploading(false)
  }

  /* ──────────────────────────────────────────────────────── */
  /*  RENDER                                                  */
  /* ──────────────────────────────────────────────────────── */
  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 sm:px-10 py-10">

        {/* Back */}
        <Link href={`/portal-media/${initial.ref}`}
          className="inline-flex items-center gap-2 text-[9px] tracking-[0.4em] text-white/25 hover:text-white/55 transition-colors uppercase mb-12 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {initial.nome}
        </Link>

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-[8px] tracking-[0.6em] text-white/20 uppercase mb-2">RL Media · {initial.nome}</p>
            <h1 className="text-3xl font-extralight tracking-[0.3em] text-white/80 uppercase">Reprodução</h1>
            <div className="mt-4 flex items-center gap-3">
              <div className="h-px w-12 bg-white/25" />
              <div className="h-px flex-1 bg-white/[0.04]" />
            </div>
          </div>
          {/* Admin-only badge */}
          <div className="flex items-center gap-2 border border-amber-400/20 bg-amber-400/[0.04] px-3 py-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 shrink-0" />
            <span className="text-[9px] tracking-[0.3em] text-amber-400/60 uppercase">Interno</span>
          </div>
        </div>

        {/* Tab nav */}
        <div className="flex items-center gap-0 border-b border-white/[0.07] mb-8">
          {([
            { key: 'storytelling', label: 'Storytelling', icon: '✦' },
            { key: 'storyboard',   label: 'Storyboard',   icon: '◫' },
            { key: 'moodboard',    label: 'Moodboard',    icon: '⬡' },
          ] as { key: Tab; label: string; icon: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 text-[9px] tracking-[0.35em] uppercase transition-colors border-b-2 -mb-px
                ${tab === t.key
                  ? 'border-white/40 text-white/70'
                  : 'border-transparent text-white/20 hover:text-white/45'}`}
            >
              <span className="text-[11px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════════ */}
        {/*  TAB: STORYTELLING                                    */}
        {/* ══════════════════════════════════════════════════════ */}
        {tab === 'storytelling' && (
          <div className="flex flex-col gap-6">

            {/* Narrativa */}
            <div className="border border-white/[0.08] bg-white/[0.02] px-6 py-5">
              <p className="text-[9px] tracking-[0.5em] text-white/30 uppercase mb-3">Narrativa Geral</p>
              {isEditing ? (
                <textarea
                  value={storytelling}
                  onChange={e => setStorytelling(e.target.value)}
                  placeholder="Escreve aqui a história e a narrativa do projeto: quem são, o que os une, o que querem sentir quando veem o resultado, os momentos que não podem faltar, a essência do dia..."
                  rows={6}
                  className="w-full bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-[13px] font-light text-white/55
                             placeholder:text-white/15 focus:outline-none focus:border-white/20 leading-relaxed resize-none tracking-wide"
                />
              ) : storytelling ? (
                <p className="text-[13px] font-light text-white/50 leading-relaxed whitespace-pre-wrap">{storytelling}</p>
              ) : (
                <p className="text-[12px] font-light text-white/18 italic">Sem narrativa escrita ainda.</p>
              )}
            </div>

            {/* ── Divisor Cenas ── */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-4 flex-1">
                <span className="text-[9px] tracking-[0.5em] text-white/25 uppercase">Cenas</span>
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[9px] font-mono text-white/15">{senas.filter(s => s.concluido).length}/{senas.length}</span>
              </div>
              <button
                onClick={addSena}
                className="border border-dashed border-white/20 hover:border-white/40 px-4 py-1.5
                           text-[9px] tracking-[0.3em] text-white/30 hover:text-white/60 uppercase transition-colors shrink-0"
              >
                + Cena
              </button>
            </div>

            {/* Empty */}
            {senas.length === 0 && (
              <div className="border border-dashed border-white/[0.06] px-6 py-10 text-center">
                <p className="text-[9px] tracking-[0.4em] text-white/18 uppercase mb-2">Sem cenas</p>
                <p className="text-[12px] font-light text-white/12">Clica em "+ Cena" para adicionar</p>
              </div>
            )}

            {/* Lista de cenas */}
            <div className="flex flex-col gap-3">
              {senas.map((sena, i) => (
                <div
                  key={sena.id}
                  className={`border transition-colors duration-300 ${
                    sena.concluido
                      ? 'border-emerald-400/30 bg-emerald-400/[0.05]'
                      : 'border-white/[0.08] bg-white/[0.02]'
                  }`}
                >
                  {/* Header da cena */}
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.05]">

                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSena(sena.id)}
                      className={`w-5 h-5 shrink-0 border flex items-center justify-center transition-all duration-200
                        ${sena.concluido
                          ? 'border-emerald-400/60 bg-emerald-400/20'
                          : 'border-white/20 bg-white/[0.03] hover:border-white/40'}`}
                      title={sena.concluido ? 'Marcar como não efectuado' : 'Marcar como efectuado'}
                    >
                      {sena.concluido && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="rgb(52 211 153 / 0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>

                    <span className="text-[10px] font-mono text-white/15 shrink-0">{String(i + 1).padStart(2, '0')}</span>

                    {/* Título */}
                    {isEditing ? (
                      <input
                        value={sena.titulo}
                        onChange={e => updateSena(sena.id, 'titulo', e.target.value)}
                        placeholder="Título da cena"
                        className="flex-1 bg-transparent text-[11px] tracking-[0.25em] text-white/65 uppercase
                                   placeholder:text-white/15 focus:outline-none border-b border-white/[0.08] focus:border-white/25 pb-0.5"
                      />
                    ) : (
                      <span className={`flex-1 text-[11px] tracking-[0.25em] uppercase font-medium
                        ${sena.concluido ? 'text-emerald-400/70 line-through decoration-emerald-400/30' : 'text-white/65'}`}>
                        {sena.titulo}
                      </span>
                    )}

                    {/* Estado + delete */}
                    <div className="flex items-center gap-3 shrink-0">
                      {sena.concluido && (
                        <span className="text-[9px] tracking-[0.25em] text-emerald-400/60 uppercase">✓ Efectuado</span>
                      )}
                      {isEditing && (
                        <button
                          onClick={() => removeSena(sena.id)}
                          className="text-[9px] tracking-[0.25em] text-red-400/40 hover:text-red-400/70 uppercase transition-colors"
                        >✕</button>
                      )}
                    </div>
                  </div>

                  {/* Texto / Resumo */}
                  <div className="px-5 py-4">
                    {isEditing ? (
                      <textarea
                        value={sena.texto}
                        onChange={e => updateSena(sena.id, 'texto', e.target.value)}
                        placeholder="Resumo desta cena: o que acontece, emoção, momentos-chave..."
                        rows={4}
                        className="w-full bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-[13px] font-light text-white/55
                                   placeholder:text-white/15 focus:outline-none focus:border-white/20 leading-relaxed resize-none"
                      />
                    ) : sena.texto ? (
                      <p className={`text-[13px] font-light leading-relaxed whitespace-pre-wrap
                        ${sena.concluido ? 'text-emerald-400/40' : 'text-white/40'}`}>
                        {sena.texto}
                      </p>
                    ) : (
                      <p className="text-[12px] font-light text-white/15 italic">Sem resumo.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/*  TAB: STORYBOARD                                      */}
        {/* ══════════════════════════════════════════════════════ */}
        {tab === 'storyboard' && (
          <div className="flex flex-col gap-4">

            {/* Header + add */}
            <div className="flex items-center justify-between gap-4 mb-2">
              <div>
                <p className="text-[9px] tracking-[0.5em] text-white/25 uppercase mb-1">Guião de Cenas</p>
                <p className="text-[12px] font-light text-white/30 leading-relaxed">
                  Sequência de momentos e cenas a captar. Define a ordem, o tipo e a duração estimada.
                </p>
              </div>
              <button
                onClick={() => { addCena(); setIsEditing(true) }}
                className="border border-dashed border-white/20 hover:border-white/40 px-4 py-2
                           text-[9px] tracking-[0.3em] text-white/30 hover:text-white/60 uppercase transition-colors shrink-0"
              >
                + Cena
              </button>
            </div>

            {/* Legenda de tipos */}
            <div className="flex flex-wrap gap-2 mb-2">
              {TIPO_OPTS.map(t => (
                <span key={t.value} className="flex items-center gap-1.5 text-[9px] text-white/25">
                  <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                  {t.label}
                </span>
              ))}
            </div>

            {/* Empty state */}
            {cenas.length === 0 && (
              <div className="border border-dashed border-white/[0.07] px-6 py-14 text-center">
                <p className="text-[9px] tracking-[0.4em] text-white/20 uppercase mb-2">Sem cenas definidas</p>
                <p className="text-[12px] font-light text-white/15">Clica em "+ Cena" para começar o storyboard</p>
              </div>
            )}

            {/* Cenas */}
            {cenas.map((cena, i) => {
              const dot = tipoDot[cena.tipo ?? 'outro'] ?? 'bg-white/20'
              const tlabel = tipoLabel[cena.tipo ?? 'outro'] ?? 'Outro'
              return (
                <div key={cena.id} className="border border-white/[0.08] bg-white/[0.02]">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-white/[0.06]">
                    <span className="text-[10px] font-mono text-white/15 shrink-0">{String(i + 1).padStart(2, '0')}</span>

                    {isEditing ? (
                      <>
                        <input
                          value={cena.momento}
                          onChange={e => updateCena(cena.id, 'momento', e.target.value)}
                          placeholder="Nome da cena"
                          className="flex-1 min-w-[140px] bg-transparent text-[11px] tracking-[0.25em] text-white/65 uppercase
                                     placeholder:text-white/15 focus:outline-none border-b border-white/[0.08] focus:border-white/25 pb-0.5"
                        />
                        <select
                          value={cena.tipo ?? 'outro'}
                          onChange={e => updateCena(cena.id, 'tipo', e.target.value)}
                          className="bg-[#04080f] border border-white/[0.08] text-[10px] text-white/40 px-2 py-1 focus:outline-none shrink-0"
                        >
                          {TIPO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <input
                          value={cena.duracao ?? ''}
                          onChange={e => updateCena(cena.id, 'duracao', e.target.value)}
                          placeholder="Duração"
                          className="w-20 bg-transparent text-[10px] text-white/30 placeholder:text-white/15
                                     focus:outline-none border-b border-white/[0.08] focus:border-white/25 pb-0.5 shrink-0"
                        />
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-[11px] tracking-[0.25em] text-white/65 uppercase font-medium">{cena.momento}</span>
                        <span className="flex items-center gap-1.5 text-[9px] text-white/30 shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />{tlabel}
                        </span>
                        {cena.duracao && (
                          <span className="text-[9px] text-white/20 shrink-0">{cena.duracao}</span>
                        )}
                      </>
                    )}

                    {/* Move + remove (edit mode) */}
                    {isEditing && (
                      <div className="flex items-center gap-2 shrink-0 ml-auto">
                        <button onClick={() => moveCena(cena.id, -1)} disabled={i === 0}
                          className="text-[11px] text-white/20 hover:text-white/50 disabled:opacity-20 transition-colors">↑</button>
                        <button onClick={() => moveCena(cena.id, 1)} disabled={i === cenas.length - 1}
                          className="text-[11px] text-white/20 hover:text-white/50 disabled:opacity-20 transition-colors">↓</button>
                        <button onClick={() => removeCena(cena.id)}
                          className="text-[9px] tracking-[0.25em] text-red-400/40 hover:text-red-400/70 uppercase transition-colors">✕</button>
                      </div>
                    )}
                  </div>

                  {/* Descrição */}
                  <div className="px-5 py-4">
                    {isEditing ? (
                      <textarea
                        value={cena.descricao}
                        onChange={e => updateCena(cena.id, 'descricao', e.target.value)}
                        placeholder="Descreve o que acontece nesta cena: ação, enquadramento, luz, emoção esperada..."
                        rows={3}
                        className="w-full bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-[13px] font-light text-white/55
                                   placeholder:text-white/15 focus:outline-none focus:border-white/20 leading-relaxed resize-none"
                      />
                    ) : cena.descricao ? (
                      <p className="text-[13px] font-light text-white/40 leading-relaxed">{cena.descricao}</p>
                    ) : (
                      <p className="text-[12px] font-light text-white/15 italic">Sem descrição.</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════ */}
        {/*  TAB: MOODBOARD                                       */}
        {/* ══════════════════════════════════════════════════════ */}
        {tab === 'moodboard' && (
          <div className="flex flex-col gap-6">

            {/* Adicionar imagem */}
            <div className="border border-white/[0.08] bg-white/[0.02] px-6 py-5 flex flex-col gap-3">
              <p className="text-[9px] tracking-[0.5em] text-white/30 uppercase mb-1">Adicionar Referência</p>

              {/* Upload ou URL */}
              <div className="flex items-center gap-3">
                <input
                  value={novaUrl}
                  onChange={e => setNovaUrl(e.target.value)}
                  placeholder="URL da imagem (https://...)"
                  className="flex-1 bg-white/[0.03] border border-white/[0.08] px-4 py-2.5 text-[12px] font-light text-white/55
                             placeholder:text-white/15 focus:outline-none focus:border-white/20"
                />
                <label className={`shrink-0 border border-white/15 bg-white/[0.02] hover:bg-white/[0.05] px-4 py-2.5
                                   text-[9px] tracking-[0.3em] text-white/35 hover:text-white/60 uppercase transition-colors cursor-pointer
                                   ${uploading ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  {uploading ? '⏳' : '⬆ Upload'}
                  <input type="file" accept="image/*" className="hidden"
                    disabled={uploading}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  value={novaLegenda}
                  onChange={e => setNovaLegenda(e.target.value)}
                  placeholder="Legenda (opcional)"
                  className="flex-1 min-w-[160px] bg-white/[0.03] border border-white/[0.08] px-4 py-2.5 text-[12px] font-light text-white/55
                             placeholder:text-white/15 focus:outline-none focus:border-white/20"
                />
                <select
                  value={novaCat}
                  onChange={e => setNovaCat(e.target.value as MoodboardCategoria)}
                  className="bg-[#04080f] border border-white/[0.08] text-[11px] text-white/40 px-3 py-2.5 focus:outline-none shrink-0"
                >
                  {CAT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button
                  onClick={addItem}
                  disabled={!novaUrl.trim()}
                  className="shrink-0 border border-white/20 hover:border-white/40 bg-white/[0.02] hover:bg-white/[0.05]
                             px-5 py-2.5 text-[9px] tracking-[0.3em] text-white/40 hover:text-white/70 uppercase transition-colors
                             disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  + Adicionar
                </button>
              </div>
            </div>

            {/* Grid de imagens */}
            {items.length === 0 ? (
              <div className="border border-dashed border-white/[0.07] px-6 py-14 text-center">
                <p className="text-[9px] tracking-[0.4em] text-white/20 uppercase mb-2">Moodboard vazio</p>
                <p className="text-[12px] font-light text-white/15">Adiciona imagens de referência acima</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map(item => (
                  <div key={item.id} className="group relative border border-white/[0.07] overflow-hidden bg-white/[0.02]">
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={item.url}
                        alt={item.legenda ?? ''}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="px-3 py-2 border-t border-white/[0.06]">
                      {item.categoria && (
                        <p className="text-[8px] tracking-[0.3em] text-white/25 uppercase mb-0.5">
                          {CAT_OPTS.find(c => c.value === item.categoria)?.label ?? item.categoria}
                        </p>
                      )}
                      {item.legenda && (
                        <p className="text-[11px] font-light text-white/40 leading-snug">{item.legenda}</p>
                      )}
                    </div>
                    {/* Remove overlay */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center
                                 bg-black/60 border border-white/10 text-white/40 hover:text-red-400/80
                                 text-[11px] opacity-0 group-hover:opacity-100 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <p className="text-[9px] tracking-[0.3em] text-white/15 uppercase text-center">
                {items.length} referência{items.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}
      </div>

      <AdminBar
        isEditing={isEditing}
        saving={saving}
        onToggle={() => setIsEditing(true)}
        onSave={handleSave}
        onCancel={cancel}
      />
    </>
  )
}
