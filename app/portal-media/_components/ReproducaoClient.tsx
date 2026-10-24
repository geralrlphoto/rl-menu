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
  { value: 'abertura',      label: 'Abertura',       dot: 'bg-[#a9c1ff]'   },
  { value: 'cerimonia',     label: 'Cerimónia',      dot: 'bg-[#2e6cf6]'   },
  { value: 'momento_chave', label: 'Momento-chave',  dot: 'bg-[#5a8bff]'   },
  { value: 'detalhe',       label: 'Detalhe',        dot: 'bg-white/50'    },
  { value: 'final',         label: 'Final',          dot: 'bg-white'       },
  { value: 'outro',         label: 'Outro',          dot: 'bg-[#7c8893]'   },
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
  const CARD  = 'rounded-2xl border border-white/[0.1] bg-[#00141f]/70'
  const TILE  = 'rounded-xl border border-white/[0.08] bg-[#0c2236]/70'
  const INPUT = 'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3 text-[15px] text-white/85 placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6] transition-colors'
  const SELECT = 'rounded-md border border-white/[0.12] bg-[#00141f] px-3 py-2.5 text-[14px] text-white/75 focus:outline-none focus:border-[#2e6cf6] shrink-0'
  const BTN_ADD = 'rlp-m shrink-0 rounded-md border border-dashed border-[#2e6cf6]/60 hover:border-[#2e6cf6] hover:bg-[#2e6cf6]/10 px-4 py-2.5 text-[10px] text-[#a9c1ff] transition-colors'
  const VAZIO = 'rounded-2xl border border-dashed border-white/[0.14] bg-[#00141f]/50 px-6 py-12 text-center'
  const concluidas = senas.filter(s => s.concluido).length

  return (
    <>
      <HeroUploadBlock url={heroUrl} isEditing={isEditing} onChange={setHeroUrl} />

      <div className="rlp relative z-10 max-w-3xl mx-auto px-4 sm:px-8 py-8 sm:py-12">

        {/* Back */}
        <Link href={`/portal-media/${initial.ref}`}
          className="rlp-m inline-flex items-center gap-2 text-[11px] text-white/45 hover:text-white/80 transition-colors mb-10 group">
          <span className="group-hover:-translate-x-1 transition-transform duration-200">‹</span>
          Portal {initial.nome}
        </Link>

        {/* Header */}
        <header className="flex items-start justify-between gap-4 mb-8">
          <div className="min-w-0">
            <p className="rlp-m traco text-[11px] text-[#5a8bff] mb-3">RL PROD · {initial.nome}</p>
            <h1 className="rlp-t text-4xl sm:text-5xl text-white leading-none">Reprodução</h1>
            <p className="mt-4 text-[15px] text-white/60 leading-relaxed max-w-xl">
              Narrativa, guião de cenas e referências visuais do projeto.
            </p>
          </div>
          {/* Admin-only badge */}
          <span className="rlp-m shrink-0 inline-flex items-center gap-2 rounded-full border border-[#a9c1ff]/60 px-3 py-1.5 text-[9px] text-[#a9c1ff]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#a9c1ff] shrink-0" />
            Interno
          </span>
        </header>

        {/* Tab nav */}
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.1] bg-[#00141f]/70 p-1 mb-8">
          {([
            { key: 'storytelling', label: 'Storytelling' },
            { key: 'storyboard',   label: 'Storyboard'   },
            { key: 'moodboard',    label: 'Moodboard'    },
          ] as { key: Tab; label: string }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rlp-m rounded-lg px-2 py-2.5 text-[9px] sm:text-[10px] tracking-[0.15em] sm:tracking-[0.3em] transition-colors truncate
                ${tab === t.key
                  ? 'bg-[#2e6cf6] text-white'
                  : 'text-white/50 hover:text-white/85 hover:bg-[#0c2236]'}`}
            >
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
            <div className={`${CARD} px-5 sm:px-6 py-5`}>
              <p className="rlp-m traco text-[11px] text-white/50 mb-3">Narrativa geral</p>
              {isEditing ? (
                <textarea
                  value={storytelling}
                  onChange={e => setStorytelling(e.target.value)}
                  placeholder="Escreve aqui a história e a narrativa do projeto: quem são, o que os une, o que querem sentir quando veem o resultado, os momentos que não podem faltar, a essência do dia..."
                  rows={6}
                  className={`${INPUT} leading-relaxed resize-none`}
                />
              ) : storytelling ? (
                <p className="text-[16px] text-white/80 leading-relaxed whitespace-pre-wrap">{storytelling}</p>
              ) : (
                <p className="text-[15px] text-white/40">Sem narrativa escrita ainda.</p>
              )}
            </div>

            {/* ── Divisor Cenas ── */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="rlp-m traco text-[11px] text-white/50">Cenas</span>
                <span className="rlp-m rounded-full border border-white/[0.12] px-2.5 py-0.5 text-[9px] tracking-[0.1em] text-white/60">{concluidas}/{senas.length}</span>
              </div>
              <button onClick={addSena} className={BTN_ADD}>+ Cena</button>
            </div>

            {senas.length > 0 && (
              <div className="h-1.5 w-full rounded-full bg-[#0c2236] overflow-hidden -mt-3">
                <div className="h-full rounded-full bg-[#2e6cf6] transition-all duration-500"
                  style={{ width: `${Math.round((concluidas / senas.length) * 100)}%` }} />
              </div>
            )}

            {/* Empty */}
            {senas.length === 0 && (
              <div className={VAZIO}>
                <p className="rlp-t text-2xl text-white/80 mb-2">Sem cenas</p>
                <p className="text-[15px] text-white/50">Clica em &quot;+ Cena&quot; para adicionar a primeira.</p>
              </div>
            )}

            {/* Lista de cenas */}
            <div className="flex flex-col gap-3">
              {senas.map((sena, i) => (
                <div
                  key={sena.id}
                  className={`rounded-2xl border overflow-hidden transition-colors duration-300 ${
                    sena.concluido
                      ? 'border-[#2e6cf6]/45 bg-[#2e6cf6]/[0.07]'
                      : 'border-white/[0.1] bg-[#00141f]/70'
                  }`}
                >
                  {/* Header da cena */}
                  <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-white/[0.07]">

                    {/* Checkbox */}
                    <button
                      onClick={() => toggleSena(sena.id)}
                      className={`w-6 h-6 shrink-0 rounded-md border flex items-center justify-center transition-all duration-200
                        ${sena.concluido
                          ? 'border-[#2e6cf6] bg-[#2e6cf6]'
                          : 'border-white/[0.2] bg-[#0c2236]/70 hover:border-[#5a8bff]'}`}
                      title={sena.concluido ? 'Marcar como não efetuado' : 'Marcar como efetuado'}
                    >
                      {sena.concluido && (
                        <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>

                    <span className="rlp-m text-[10px] text-white/35 shrink-0">{String(i + 1).padStart(2, '0')}</span>

                    {/* Título */}
                    {isEditing ? (
                      <input
                        value={sena.titulo}
                        onChange={e => updateSena(sena.id, 'titulo', e.target.value)}
                        placeholder="Título da cena"
                        className="flex-1 min-w-0 rounded-md border border-white/[0.12] bg-[#00141f]/70 px-3 py-2 text-[15px] text-white/85
                                   placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6]"
                      />
                    ) : (
                      <span className={`rlp-t flex-1 min-w-0 text-lg leading-tight
                        ${sena.concluido ? 'text-[#a9c1ff] line-through decoration-[#a9c1ff]/40' : 'text-white'}`}>
                        {sena.titulo}
                      </span>
                    )}

                    {/* Estado + delete */}
                    <div className="flex items-center gap-3 shrink-0">
                      {sena.concluido && (
                        <span className="rlp-m hidden sm:inline-flex rounded-full bg-[#2e6cf6] px-2.5 py-1 text-[9px] text-white">Efetuado</span>
                      )}
                      {isEditing && (
                        <button
                          onClick={() => removeSena(sena.id)}
                          title="Remover cena"
                          className="text-[14px] text-white/40 hover:text-[#ff4747] transition-colors"
                        >✕</button>
                      )}
                    </div>
                  </div>

                  {/* Texto / Resumo */}
                  <div className="px-4 sm:px-5 py-4">
                    {isEditing ? (
                      <textarea
                        value={sena.texto}
                        onChange={e => updateSena(sena.id, 'texto', e.target.value)}
                        placeholder="Resumo desta cena: o que acontece, emoção, momentos-chave..."
                        rows={4}
                        className={`${INPUT} leading-relaxed resize-none`}
                      />
                    ) : sena.texto ? (
                      <p className={`text-[15px] leading-relaxed whitespace-pre-wrap
                        ${sena.concluido ? 'text-white/50' : 'text-white/75'}`}>
                        {sena.texto}
                      </p>
                    ) : (
                      <p className="text-[14px] text-white/40">Sem resumo.</p>
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
            <div className="flex items-start justify-between gap-4 mb-1">
              <div>
                <p className="rlp-m traco text-[11px] text-white/50 mb-2">Guião de cenas</p>
                <p className="text-[15px] text-white/60 leading-relaxed">
                  Sequência de momentos e cenas a captar. Define a ordem, o tipo e a duração estimada.
                </p>
              </div>
              <button onClick={() => { addCena(); setIsEditing(true) }} className={BTN_ADD}>+ Cena</button>
            </div>

            {/* Legenda de tipos */}
            <div className="flex flex-wrap gap-2 mb-1">
              {TIPO_OPTS.map(t => (
                <span key={t.value} className="rlp-m inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-[#0c2236]/70 px-2.5 py-1 text-[9px] tracking-[0.15em] text-white/60">
                  <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
                  {t.label}
                </span>
              ))}
            </div>

            {/* Empty state */}
            {cenas.length === 0 && (
              <div className={VAZIO}>
                <p className="rlp-t text-2xl text-white/80 mb-2">Sem cenas definidas</p>
                <p className="text-[15px] text-white/50">Clica em &quot;+ Cena&quot; para começar o storyboard.</p>
              </div>
            )}

            {/* Cenas */}
            {cenas.map((cena, i) => {
              const dot = tipoDot[cena.tipo ?? 'outro'] ?? 'bg-[#7c8893]'
              const tlabel = tipoLabel[cena.tipo ?? 'outro'] ?? 'Outro'
              return (
                <div key={cena.id} className={`${CARD} overflow-hidden`}>
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-3 border-b border-white/[0.07]">
                    <span className="rlp-m text-[10px] text-white/35 shrink-0">{String(i + 1).padStart(2, '0')}</span>

                    {isEditing ? (
                      <>
                        <input
                          value={cena.momento}
                          onChange={e => updateCena(cena.id, 'momento', e.target.value)}
                          placeholder="Nome da cena"
                          className="flex-1 min-w-[140px] rounded-md border border-white/[0.12] bg-[#00141f]/70 px-3 py-2 text-[15px] text-white/85
                                     placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6]"
                        />
                        <select
                          value={cena.tipo ?? 'outro'}
                          onChange={e => updateCena(cena.id, 'tipo', e.target.value)}
                          className={SELECT}
                        >
                          {TIPO_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                        <input
                          value={cena.duracao ?? ''}
                          onChange={e => updateCena(cena.id, 'duracao', e.target.value)}
                          placeholder="Duração"
                          className="w-24 rounded-md border border-white/[0.12] bg-[#00141f]/70 px-3 py-2 text-[14px] text-white/80
                                     placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6] shrink-0"
                        />
                      </>
                    ) : (
                      <>
                        <span className="rlp-t flex-1 min-w-0 text-lg text-white leading-tight">{cena.momento}</span>
                        <span className="rlp-m inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] px-2.5 py-1 text-[9px] tracking-[0.15em] text-white/65 shrink-0">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />{tlabel}
                        </span>
                        {cena.duracao && (
                          <span className="rlp-m text-[9px] tracking-[0.15em] text-white/45 shrink-0">{cena.duracao}</span>
                        )}
                      </>
                    )}

                    {/* Move + remove (edit mode) */}
                    {isEditing && (
                      <div className="flex items-center gap-1 shrink-0 ml-auto">
                        <button onClick={() => moveCena(cena.id, -1)} disabled={i === 0} title="Subir"
                          className="w-8 h-8 rounded-md border border-white/[0.12] text-[14px] text-white/50 hover:text-white hover:border-[#2e6cf6] disabled:opacity-25 transition-colors">↑</button>
                        <button onClick={() => moveCena(cena.id, 1)} disabled={i === cenas.length - 1} title="Descer"
                          className="w-8 h-8 rounded-md border border-white/[0.12] text-[14px] text-white/50 hover:text-white hover:border-[#2e6cf6] disabled:opacity-25 transition-colors">↓</button>
                        <button onClick={() => removeCena(cena.id)} title="Remover cena"
                          className="w-8 h-8 rounded-md text-[14px] text-white/40 hover:text-[#ff4747] transition-colors">✕</button>
                      </div>
                    )}
                  </div>

                  {/* Descrição */}
                  <div className="px-4 sm:px-5 py-4">
                    {isEditing ? (
                      <textarea
                        value={cena.descricao}
                        onChange={e => updateCena(cena.id, 'descricao', e.target.value)}
                        placeholder="Descreve o que acontece nesta cena: ação, enquadramento, luz, emoção esperada..."
                        rows={3}
                        className={`${INPUT} leading-relaxed resize-none`}
                      />
                    ) : cena.descricao ? (
                      <p className="text-[15px] text-white/75 leading-relaxed">{cena.descricao}</p>
                    ) : (
                      <p className="text-[14px] text-white/40">Sem descrição.</p>
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
            <div className={`${CARD} px-5 sm:px-6 py-5 flex flex-col gap-3`}>
              <p className="rlp-m traco text-[11px] text-white/50 mb-1">Adicionar referência</p>

              {/* Upload ou URL */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={novaUrl}
                  onChange={e => setNovaUrl(e.target.value)}
                  placeholder="URL da imagem (https://...)"
                  className={INPUT}
                />
                <label className={`rlp-m shrink-0 inline-flex items-center justify-center rounded-md border border-[#2e6cf6]/60 hover:bg-[#2e6cf6]/15 px-4 py-3
                                   text-[10px] text-[#a9c1ff] transition-colors cursor-pointer
                                   ${uploading ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  {uploading ? 'A carregar...' : '↑ Upload'}
                  <input type="file" accept="image/*" className="hidden"
                    disabled={uploading}
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={novaLegenda}
                  onChange={e => setNovaLegenda(e.target.value)}
                  placeholder="Legenda (opcional)"
                  className={INPUT}
                />
                <select
                  value={novaCat}
                  onChange={e => setNovaCat(e.target.value as MoodboardCategoria)}
                  className={`${SELECT} py-3`}
                >
                  {CAT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <button
                  onClick={addItem}
                  disabled={!novaUrl.trim()}
                  className="rlp-m shrink-0 inline-flex items-center justify-center rounded-md bg-[#2e6cf6] hover:bg-[#2e6cf6]/85 px-5 py-3
                             text-[10px] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  + Adicionar
                </button>
              </div>
            </div>

            {/* Grid de imagens */}
            {items.length === 0 ? (
              <div className={VAZIO}>
                <p className="rlp-t text-2xl text-white/80 mb-2">Moodboard vazio</p>
                <p className="text-[15px] text-white/50">Adiciona imagens de referência acima.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {items.map(item => (
                  <div key={item.id} className={`group relative overflow-hidden ${TILE}`}>
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={item.url}
                        alt={item.legenda ?? ''}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="px-3 py-2.5 border-t border-white/[0.07]">
                      {item.categoria && (
                        <p className="rlp-m text-[8px] text-[#5a8bff] mb-1">
                          {CAT_OPTS.find(c => c.value === item.categoria)?.label ?? item.categoria}
                        </p>
                      )}
                      {item.legenda && (
                        <p className="text-[14px] text-white/75 leading-snug">{item.legenda}</p>
                      )}
                    </div>
                    {/* Remove overlay */}
                    <button
                      onClick={() => removeItem(item.id)}
                      title="Remover referência"
                      className="absolute top-2 right-2 w-8 h-8 rounded-md flex items-center justify-center
                                 bg-[#00141f]/85 border border-white/[0.12] text-white/60 hover:text-[#ff4747]
                                 text-[14px] opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {items.length > 0 && (
              <p className="rlp-m text-[10px] text-white/45 text-center">
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
