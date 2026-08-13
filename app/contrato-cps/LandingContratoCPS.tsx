'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

// ─── DESIGN SYSTEM — RL PHOTO.VIDEO (rlphotovideo.pt) ─────────────────────────
const RLP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400&family=Hanken+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap');

.rl-portal{
  --ink:#0b0a08; --ink-2:#100e0b; --ink-3:#16130f;
  --g:#d8be93; --g-deep:#c8a866;
  --tx:rgba(243,237,226,.92); --tx-mid:rgba(243,237,226,.6); --tx-dim:rgba(243,237,226,.4);
  --line:rgba(243,237,226,.14); --line-soft:rgba(243,237,226,.08);
  --fd:'Jost',sans-serif; --fb:'Hanken Grotesk',sans-serif; --fm:'Space Mono',monospace; --fs:'Cormorant Garamond',serif;
  --ease:cubic-bezier(.16,1,.3,1); --pad:clamp(20px,5vw,80px);
  background:var(--ink); color:var(--tx); font-family:var(--fb);
  -webkit-font-smoothing:antialiased; min-height:100vh;
}
.rl-portal ::selection{background:rgba(216,190,147,.28);color:#0b0a08;}

.rlp-grain{position:fixed;inset:0;z-index:9000;pointer-events:none;opacity:.05;mix-blend-mode:overlay;background-size:130px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");}
.rlp-vig{position:fixed;inset:0;z-index:8990;pointer-events:none;box-shadow:inset 0 0 240px 40px rgba(0,0,0,.5);}

.rlp-bar{position:fixed;top:0;left:0;width:100%;z-index:8000;display:flex;align-items:center;justify-content:space-between;padding:20px var(--pad);border-bottom:1px solid transparent;transition:background .6s var(--ease),padding .6s var(--ease),border-color .6s;}
.rlp-bar.s{background:rgba(11,10,8,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding-top:13px;padding-bottom:13px;border-color:var(--line-soft);}
.rlp-mono{display:inline-flex;align-items:baseline;gap:.6em;text-decoration:none;}
.rlp-mono span{font-family:var(--fd);font-weight:300;letter-spacing:.3em;font-size:16px;color:var(--tx);}
.rlp-mono i{font-family:var(--fm);font-style:normal;font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);opacity:.85;}

.rlp-eyebrow{font-family:var(--fm);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--g);display:inline-flex;gap:.8em;align-items:center;}
.rlp-eyebrow::before{content:"";width:34px;height:1px;background:var(--g);opacity:.6;}
.rlp-eyebrow.c{justify-content:center;}
.rlp-eyebrow.n::before{display:none;}

.rlp-h1{font-family:var(--fd);font-weight:200;line-height:.98;letter-spacing:-.02em;color:var(--tx);}
.rlp-h1 em{font-style:italic;color:var(--g);}
.rlp-h2{font-family:var(--fd);font-weight:200;line-height:1.02;letter-spacing:-.02em;color:var(--tx);}
.rlp-h2 em{font-style:italic;color:var(--g);}
.rlp-ed{font-family:var(--fs);font-weight:300;color:var(--tx-mid);}
.rlp-ed em{font-style:italic;color:var(--g);}

.rlp-btn{display:inline-flex;align-items:center;justify-content:center;gap:.9em;position:relative;isolation:isolate;font-family:var(--fm);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);padding:16px 34px;border:1px solid var(--g);border-radius:40px;overflow:hidden;background:var(--g);transition:color .5s var(--ease),opacity .3s;cursor:pointer;text-decoration:none;}
.rlp-btn .fill{position:absolute;inset:0;z-index:-1;background:var(--ink);transform:translateY(101%);transition:transform .6s var(--ease);}
.rlp-btn .dot{width:5px;height:5px;border-radius:50%;background:var(--ink);transition:background .5s;flex:none;}
.rlp-btn:hover{color:var(--g);} .rlp-btn:hover .fill{transform:translateY(0);} .rlp-btn:hover .dot{background:var(--g);}
.rlp-btn:disabled{opacity:.45;pointer-events:none;}
.rlp-btn.ghost{background:transparent;color:var(--tx);border-color:var(--line);}
.rlp-btn.ghost .dot{background:var(--g);} .rlp-btn.ghost .fill{background:var(--g);}
.rlp-btn.ghost:hover{color:var(--ink);} .rlp-btn.ghost:hover .dot{background:var(--ink);}
.rlp-btn.full{width:100%;}

.rlp-link-u{font-family:var(--fm);font-size:12px;letter-spacing:.16em;text-transform:uppercase;display:inline-flex;gap:.7em;align-items:center;position:relative;color:var(--tx-mid);text-decoration:none;background:none;border:none;cursor:pointer;}
.rlp-link-u::after{content:"";position:absolute;left:0;bottom:-5px;width:100%;height:1px;background:var(--g);transform:scaleX(0);transform-origin:right;transition:transform .5s var(--ease);}
.rlp-link-u:hover::after{transform:scaleX(1);transform-origin:left;}
.rlp-link-u .a{color:var(--g);transition:transform .4s var(--ease);}
.rlp-link-u:hover .a{transform:translateX(-5px);}

.rlp-wrap{width:100%;max-width:1080px;margin:0 auto;padding-left:var(--pad);padding-right:var(--pad);}

/* Cards de escolha */
.rlp-choice{position:relative;width:100%;max-width:440px;aspect-ratio:3/4;overflow:hidden;border-radius:10px;border:1px solid var(--line-soft);background:var(--ink-3);transition:border-color .5s var(--ease),transform .5s var(--ease);}
.rlp-choice:hover{border-color:var(--g);transform:translateY(-4px);}
.rlp-choice img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 2s var(--ease);}
.rlp-choice:hover img{transform:scale(1.05);}
.rlp-choice .ph{position:absolute;inset:0;background:var(--ink-3);background-image:repeating-linear-gradient(122deg,rgba(243,237,226,.022) 0 1px,transparent 1px 11px);display:grid;place-items:center;}
.rlp-choice .ph span{font-family:var(--fm);font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:var(--tx-dim);}
.rlp-choice .scrim{position:absolute;inset:0;background:linear-gradient(to top,rgba(11,10,8,.95) 0%,rgba(11,10,8,.55) 46%,rgba(11,10,8,.12) 100%);}
.rlp-choice .body{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(26px,4vw,40px);gap:18px;}

/* Campos (modal admin) */
.rlp-field .lab{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:12px;}
.rlp-field input{width:100%;background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--tx);font-family:var(--fd);font-weight:300;font-size:18px;padding:8px 0 13px;outline:none;transition:border-color .4s var(--ease);}
.rlp-field input:focus{border-color:var(--g);}
`

// ─── Defaults (se nada estiver gravado em Supabase) ──────────────────────────
const DEFAULTS = {
  intro_kicker: 'RL PHOTO.VIDEO',
  intro_title_1: 'Dados para',
  intro_title_2: 'Contrato',
  intro_subtitle: 'Escolham o tipo de evento para preencher os dados.',
  casamento_title: 'Casamento',
  casamento_subtitle: 'Para o vosso grande dia',
  casamento_photo_url: '', // vazio → placeholder
  batizado_title: 'Batizado',
  batizado_subtitle: 'Para o batizado da criança',
  batizado_photo_url: '', // vazio → placeholder
}

type Config = typeof DEFAULTS

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
    <div className="rlp-choice group">
      {/* Foto / placeholder */}
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={title} />
      ) : (
        <div className="ph"><span>{fallbackLabel}</span></div>
      )}

      <div className="scrim" />

      {/* Conteúdo do card */}
      <div className="body">
        <span className="rlp-eyebrow n">{fallbackLabel}</span>
        <h2 className="rlp-h2" style={{ fontSize: 'clamp(34px,5vw,54px)' }}>{title}</h2>
        <p className="rlp-ed" style={{ fontStyle: 'italic', fontSize: 'clamp(16px,2vw,20px)' }}>{subtitle}</p>
        <Link href={href} className="rlp-btn ghost self-start" style={{ marginTop: 6 }}>
          <span className="fill" /><span className="dot" />Entrar
        </Link>
      </div>

      {/* Admin controls (overlay) */}
      {adminMode && (
        <>
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            <button onClick={onEdit}
              className="px-4 py-2 text-[10px] tracking-[0.3em] uppercase border shadow-lg"
              style={{ borderColor: 'rgba(216,190,147,.5)', background: 'rgba(11,10,8,.8)', color: 'var(--g)', fontFamily: "'Space Mono',monospace" }}>
              ✎ Editar texto
            </button>
            <button onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 text-[10px] tracking-[0.3em] uppercase border shadow-lg"
              style={{ borderColor: 'rgba(216,190,147,.5)', background: 'rgba(11,10,8,.8)', color: 'var(--g)', fontFamily: "'Space Mono',monospace" }}>
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
              className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-6 py-4 text-[11px] tracking-[0.35em] uppercase border border-dashed"
              style={{ borderColor: 'rgba(216,190,147,.5)', background: 'rgba(11,10,8,.4)', color: 'var(--g)', fontFamily: "'Space Mono',monospace" }}>
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
    <div className="fixed inset-0 z-[9200] flex items-center justify-center px-4" style={{ background: 'rgba(11,10,8,.8)', backdropFilter: 'blur(6px)' }}
         onClick={onClose}>
      <div className="w-full p-8" style={{ maxWidth: 440, background: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 12 }} onClick={e => e.stopPropagation()}>
        <span className="rlp-eyebrow" style={{ marginBottom: 18 }}>Editar Card</span>
        <h3 className="rlp-h2" style={{ fontSize: 30, margin: '14px 0 24px' }}><em>{initial.title}</em></h3>

        <label className="rlp-field block mb-6">
          <span className="lab">Título</span>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} />
        </label>

        <label className="rlp-field block mb-8">
          <span className="lab">Subtítulo</span>
          <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} />
        </label>

        <div className="flex gap-3">
          <button onClick={onClose} className="rlp-btn ghost" style={{ flex: 1 }}>
            <span className="fill" /><span className="dot" />Cancelar
          </button>
          <button onClick={() => onSave({ title, subtitle })} className="rlp-btn" style={{ flex: 1 }}>
            <span className="fill" /><span className="dot" />Guardar
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
export default function LandingContratoCPS({
  initialConfig,
  isAdminUser = false,
}: {
  initialConfig: Partial<Config> | null
  isAdminUser?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  // Admin mode: cookie de admin (auto) OU ?admin=1 (manual / override)
  const adminMode = isAdminUser || searchParams.get('admin') === '1'

  const [config, setConfig] = useState<Config>(mergeConfig(DEFAULTS, initialConfig))
  const [editing, setEditing] = useState<null | 'casamento' | 'batizado'>(null)
  const [savingMsg, setSavingMsg] = useState<string | null>(null)

  // Estado da barra ao fazer scroll
  useEffect(() => {
    const onScroll = () => {
      const st = window.scrollY || document.documentElement.scrollTop
      const bar = document.getElementById('rlp-bar')
      if (bar) bar.classList.toggle('s', st > 40)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function saveConfig(next: Config) {
    setConfig(next)
    setSavingMsg('A guardar…')
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
    setSavingMsg('A enviar foto…')
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
    <main className="rl-portal">
      <style>{RLP_CSS}</style>

      {/* Atmosfera */}
      <div className="rlp-grain" aria-hidden />
      <div className="rlp-vig" aria-hidden />

      {/* Barra fixa */}
      <header id="rlp-bar" className="rlp-bar">
        <Link href="/" className="rlp-mono" aria-label="RL Photo · Video">
          <span>RL</span><i>Photo · Video</i>
        </Link>
        <Link href="/photo" className="rlp-link-u"><span className="a">‹</span><span>Voltar</span></Link>
      </header>

      <div className="rlp-wrap" style={{ paddingTop: 'clamp(120px,16vh,180px)', paddingBottom: 'clamp(60px,10vh,120px)' }}>

        {/* Admin badge */}
        {adminMode && (
          <div className="mb-10 flex items-center justify-between gap-4">
            <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: '.3em', textTransform: 'uppercase', color: 'var(--g)', border: '1px solid var(--line)', padding: '7px 14px', borderRadius: 40 }}>
              ⚙ Modo Admin
            </span>
            {/* Só mostra "Sair do admin" se foi ativado via ?admin=1 (sem cookie) */}
            {!isAdminUser && (
              <button onClick={() => router.push('/contrato-cps')} className="rlp-link-u">
                <span>Sair do admin</span>
              </button>
            )}
          </div>
        )}

        {/* Hero */}
        <header className="text-center flex flex-col items-center" style={{ marginBottom: 'clamp(48px,8vh,84px)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo_rl_gold.png" alt="RL Photo Video" style={{ width: 96, height: 'auto', opacity: .9, marginBottom: 28 }} />
          <span className="rlp-eyebrow c" style={{ marginBottom: 22 }}>{config.intro_kicker}</span>
          <h1 className="rlp-h1" style={{ fontSize: 'clamp(44px,9vw,110px)' }}>
            {config.intro_title_1}<br /><em>{config.intro_title_2}</em>
          </h1>
          <div style={{ width: 60, height: 1, background: 'var(--g)', opacity: .5, margin: '30px 0' }} />
          <p className="rlp-ed" style={{ fontStyle: 'italic', fontSize: 'clamp(18px,2.2vw,23px)', lineHeight: 1.6, maxWidth: '40ch' }}>
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
          <div className="fixed bottom-8 right-8 z-[9200] px-5 py-3"
            style={{ border: '1px solid var(--line)', background: 'var(--ink-2)', color: 'var(--g)', fontFamily: "'Space Mono',monospace", fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', borderRadius: 8 }}>
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
