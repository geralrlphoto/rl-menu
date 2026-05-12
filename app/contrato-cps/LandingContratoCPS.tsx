'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

// ─── Defaults (se nada estiver gravado em Supabase) ──────────────────────────
const DEFAULTS = {
  intro_kicker: 'RL PHOTO.VIDEO',
  intro_title_1: 'Dados para',
  intro_title_2: 'Contrato',
  intro_subtitle: 'Escolham o tipo de evento para preencher os dados.',
  casamento_title: 'Casamento',
  casamento_subtitle: 'Para o vosso grande dia',
  casamento_photo_url: '', // vazio → SVG placeholder
  batizado_title: 'Batizado',
  batizado_subtitle: 'Para o batizado da criança',
  batizado_photo_url: '', // vazio → SVG placeholder
}

type Config = typeof DEFAULTS

// ─── SVG placeholder (gradiente dourado) ─────────────────────────────────────
function PlaceholderSVG({ label }: { label: string }) {
  return (
    <svg viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
      <defs>
        <linearGradient id={`g-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#2b1b04" />
          <stop offset="50%"  stopColor="#1a1003" />
          <stop offset="100%" stopColor="#080503" />
        </linearGradient>
        <radialGradient id={`r-${label}`} cx="50%" cy="40%" r="50%">
          <stop offset="0%"   stopColor="#c9a96e" stopOpacity="0.20" />
          <stop offset="60%"  stopColor="#c9a96e" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#c9a96e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="600" fill={`url(#g-${label})`} />
      <rect width="400" height="600" fill={`url(#r-${label})`} />
      <text x="200" y="305" textAnchor="middle"
        fontFamily="'Cormorant Garamond', Georgia, serif"
        fontSize="22" fill="#c9a96e" fillOpacity="0.25" letterSpacing="6">
        {label.toUpperCase()}
      </text>
    </svg>
  )
}

// ─── Card de escolha ──────────────────────────────────────────────────────────
function ChoiceCard({
  href, photoUrl, title, subtitle, fallbackLabel,
  adminMode, onEdit, onUpload,
}: {
  href: string
  photoUrl: string
  title: string
  subtitle: string
  fallbackLabel: string
  adminMode: boolean
  onEdit: () => void
  onUpload: (file: File) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="group relative w-full sm:w-[420px] aspect-[3/4] overflow-hidden border border-white/[0.06]">
      {/* Foto / placeholder */}
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-[1.04]" />
      ) : (
        <PlaceholderSVG label={fallbackLabel} />
      )}

      {/* Overlay gradient bottom→up */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

      {/* Conteúdo do card */}
      <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-10">
        <p className="text-[9px] tracking-[0.5em] text-gold/50 uppercase mb-3">RL PHOTO.VIDEO</p>
        <h2 className="font-cormorant text-4xl sm:text-5xl font-light leading-[1.05] mb-2">
          <span className="italic text-gold">{title}</span>
        </h2>
        <div className="h-px w-12 bg-gold/60 mb-4" />
        <p className="font-cormorant text-[17px] text-white/70 italic font-light mb-8 leading-[1.6]">
          {subtitle}
        </p>
        <Link href={href}
          className="inline-flex items-center justify-center w-full sm:w-auto self-start
                     border border-gold/40 bg-gold/[0.05] hover:bg-gold/[0.12] hover:border-gold/70
                     px-10 py-4 text-[11px] tracking-[0.4em] text-gold uppercase
                     transition-all duration-500">
          Entrar
        </Link>
      </div>

      {/* Admin controls (overlay) */}
      {adminMode && (
        <>
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            <button onClick={onEdit}
              className="px-4 py-2 text-[10px] tracking-[0.3em] uppercase border border-gold/60 bg-black/80 text-gold hover:bg-gold/20 shadow-lg">
              ✎ Editar texto
            </button>
            <button onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-[10px] tracking-[0.3em] uppercase border border-gold/60 bg-black/80 text-gold hover:bg-gold/20 shadow-lg">
              📷 Trocar foto
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) onUpload(f)
                e.target.value = ''
              }}
            />
          </div>
          {!photoUrl && (
            <button onClick={() => fileInputRef.current?.click()}
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                         px-6 py-4 text-[11px] tracking-[0.35em] uppercase
                         border border-dashed border-gold/60 bg-black/40 text-gold/90
                         hover:bg-gold/15 hover:border-gold transition">
              📷 Carregar Foto
            </button>
          )}
        </>
      )}
    </div>
  )
}

// ─── Modal de edição ──────────────────────────────────────────────────────────
function EditModal({
  open, onClose, initial, onSave,
}: {
  open: boolean
  onClose: () => void
  initial: { title: string; subtitle: string }
  onSave: (v: { title: string; subtitle: string }) => void
}) {
  const [title, setTitle] = useState(initial.title)
  const [subtitle, setSubtitle] = useState(initial.subtitle)

  useEffect(() => {
    if (open) {
      setTitle(initial.title)
      setSubtitle(initial.subtitle)
    }
  }, [open, initial.title, initial.subtitle])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
         onClick={onClose}>
      <div className="bg-[#120e09] border border-gold/40 max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
        <p className="text-[9px] tracking-[0.5em] text-gold/50 uppercase mb-4">Editar Card</p>
        <h3 className="font-cormorant text-3xl italic text-gold mb-6">{initial.title}</h3>

        <label className="block mb-5">
          <span className="block text-[10px] tracking-[0.4em] text-gold/55 uppercase mb-2">Título</span>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full bg-transparent border-b border-white/15 px-0 py-3 text-[15px] text-white/90 focus:outline-none focus:border-gold/70" />
        </label>

        <label className="block mb-8">
          <span className="block text-[10px] tracking-[0.4em] text-gold/55 uppercase mb-2">Subtítulo</span>
          <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)}
            className="w-full bg-transparent border-b border-white/15 px-0 py-3 text-[15px] text-white/90 focus:outline-none focus:border-gold/70" />
        </label>

        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 border border-white/15 px-6 py-3 text-[11px] tracking-[0.4em] text-white/50 uppercase hover:text-white/80">
            Cancelar
          </button>
          <button onClick={() => onSave({ title, subtitle })}
            className="flex-1 border border-gold/60 bg-gold/10 px-6 py-3 text-[11px] tracking-[0.4em] text-gold uppercase hover:bg-gold/20">
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Junta defaults + valores da BD, IGNORANDO null/undefined/string vazia
// (evita que valores null da BD sobrescrevam defaults sensatos)
function mergeConfig(defaults: Config, override: Partial<Config> | null): Config {
  if (!override) return { ...defaults }
  const merged: Config = { ...defaults }
  for (const [k, v] of Object.entries(override)) {
    if (v != null && v !== '') {
      (merged as Record<string, any>)[k] = v
    }
  }
  return merged
}

// ─── Main landing ─────────────────────────────────────────────────────────────
export default function LandingContratoCPS({ initialConfig }: { initialConfig: Partial<Config> | null }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const adminMode = searchParams.get('admin') === '1'

  const [config, setConfig] = useState<Config>(mergeConfig(DEFAULTS, initialConfig))
  const [editing, setEditing] = useState<null | 'casamento' | 'batizado'>(null)
  const [savingMsg, setSavingMsg] = useState<string | null>(null)

  async function saveConfig(next: Config) {
    setConfig(next)
    setSavingMsg('A guardar...')
    try {
      const res = await fetch('/api/contrato-cps-landing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      if (!res.ok) throw new Error('save failed')
      setSavingMsg('✓ Guardado')
      setTimeout(() => setSavingMsg(null), 2000)
    } catch {
      setSavingMsg('✗ Erro a guardar')
      setTimeout(() => setSavingMsg(null), 3000)
    }
  }

  async function handleUpload(which: 'casamento' | 'batizado', file: File) {
    setSavingMsg('A enviar foto...')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('which', which)
      const res = await fetch('/api/contrato-cps-landing/upload', {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()
      if (!res.ok || !json.url) throw new Error(json.error ?? 'upload failed')
      const next: Config = { ...config, [`${which}_photo_url`]: json.url } as Config
      await saveConfig(next)
    } catch (e: any) {
      setSavingMsg(`✗ ${e.message ?? 'erro'}`)
      setTimeout(() => setSavingMsg(null), 3000)
    }
  }

  return (
    <main className="min-h-screen px-4 py-12 sm:py-20"
      style={{ background: 'radial-gradient(ellipse at 50% 25%, #1f1404 0%, #100a02 45%, #060402 100%)' }}>
      <div className="max-w-5xl mx-auto">

        {/* Voltar */}
        <Link href="/photo"
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.35em] text-white/30 hover:text-gold transition-colors mb-12 uppercase">
          ‹ Voltar
        </Link>

        {/* Admin badge */}
        {adminMode && (
          <div className="mb-8 flex items-center justify-between">
            <span className="text-[10px] tracking-[0.4em] text-gold/70 uppercase border border-gold/40 px-3 py-1.5">
              ⚙ Modo Admin
            </span>
            <button onClick={() => router.push('/contrato-cps')}
              className="text-[10px] tracking-[0.3em] text-white/40 hover:text-white/80 uppercase">
              Sair do admin
            </button>
          </div>
        )}

        {/* Hero */}
        <header className="mb-16 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/logo_rl_gold.png"
            alt="RL Photo Video"
            className="mx-auto mb-8 w-[110px] sm:w-[130px] h-auto opacity-90"
          />
          <p className="text-[9px] tracking-[0.5em] text-gold/40 uppercase mb-4">{config.intro_kicker}</p>
          <h1 className="font-cormorant text-5xl sm:text-6xl font-light tracking-wide text-white/95 leading-[1.05] mb-4">
            {config.intro_title_1}
            <br/>
            <span className="italic text-gold">{config.intro_title_2}</span>
          </h1>
          <div className="mx-auto h-px w-16 bg-gold/50 my-6" />
          <p className="font-cormorant text-[19px] sm:text-[21px] text-white/65 leading-[1.7] max-w-lg mx-auto font-light italic">
            {config.intro_subtitle}
          </p>
        </header>

        {/* Cards */}
        <div className="flex flex-col sm:flex-row justify-center items-stretch gap-6 sm:gap-8">
          <ChoiceCard
            href={`/contrato-cps/casamento${adminMode ? '?admin=1' : ''}`}
            photoUrl={config.casamento_photo_url}
            title={config.casamento_title}
            subtitle={config.casamento_subtitle}
            fallbackLabel="Casamento"
            adminMode={adminMode}
            onEdit={() => setEditing('casamento')}
            onUpload={(f) => handleUpload('casamento', f)}
          />
          <ChoiceCard
            href={`/contrato-cps/batizado${adminMode ? '?admin=1' : ''}`}
            photoUrl={config.batizado_photo_url}
            title={config.batizado_title}
            subtitle={config.batizado_subtitle}
            fallbackLabel="Batizado"
            adminMode={adminMode}
            onEdit={() => setEditing('batizado')}
            onUpload={(f) => handleUpload('batizado', f)}
          />
        </div>

        {/* Saving feedback */}
        {savingMsg && (
          <div className="fixed bottom-8 right-8 z-50 px-5 py-3 border border-gold/40 bg-[#120e09]
                          text-[11px] tracking-[0.3em] text-gold uppercase">
            {savingMsg}
          </div>
        )}

      </div>

      {/* Modal edição */}
      <EditModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        initial={{
          title: editing === 'casamento' ? config.casamento_title : config.batizado_title,
          subtitle: editing === 'casamento' ? config.casamento_subtitle : config.batizado_subtitle,
        }}
        onSave={(v) => {
          if (!editing) return
          const next: Config = {
            ...config,
            [`${editing}_title`]: v.title,
            [`${editing}_subtitle`]: v.subtitle,
          } as Config
          setEditing(null)
          saveConfig(next)
        }}
      />
    </main>
  )
}
