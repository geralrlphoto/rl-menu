'use client'

/* ============================================================
   Portal do Cliente · Acesso
   Vistas: Entrar, Criar conta, Recuperar.
   Ligada ao Supabase Auth (signInWithPassword / signUp /
   resetPasswordForEmail / signInWithOAuth).
   Design: design_handoff_portal_cliente (RL PROD).
   ============================================================ */

import { useState, useEffect, type ReactNode, type FormEvent, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Manrope, Space_Grotesk } from 'next/font/google'
import { supabase } from '@/lib/supabase'
import './acesso.css'

const manrope = Manrope({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-manrope', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-space-grotesk', display: 'swap' })

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type View = 'login' | 'register' | 'forgot'

/* ============================================================
   PÁGINA
   ============================================================ */
export default function AcessoPortalPage() {
  const [view, setView] = useState<View>('login')
  const [flash, setFlash] = useState('')

  // Auto-redirect via Supabase removido — auth do cliente é por cookie
  // pm_<REF> definida pelo /api/media-portal-acesso. O portal de destino
  // (/portal-media/<ref>) faz o seu próprio check do cookie.

  // Auto-dismiss flash
  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(''), 3200)
    return () => clearTimeout(t)
  }, [flash])

  return (
    <div className={`portal-acesso ${manrope.variable} ${spaceGrotesk.variable}`}>
      <BrandPanel />
      <main className="panel">
        <div className="card">
          {view === 'login'    && <LoginForm key="l" go={setView} setFlash={setFlash} />}
          {view === 'register' && <RegisterForm key="r" go={setView} />}
          {view === 'forgot'   && <ForgotForm key="f" go={setView} />}
          {view === 'login' && (
            <p className="legal">
              Ao continuar aceitas os nossos <a href="#">Termos</a> e <a href="#">Política de Privacidade</a>.
            </p>
          )}
        </div>
      </main>

      {flash && (
        <div className="toast">
          <IcCheck color="oklch(0.74 0.11 245)" />
          {flash}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   PAINEL DA MARCA (esquerda)
   ============================================================ */
function BrandPanel() {
  return (
    <aside className="brand">
      <div className="brand__grain" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="brand__watermark" src="/portal-cliente/mark-white.png" alt="" />

      <div className="brand__top">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="brand__mark" src="/portal-cliente/mark-white.png" alt="RL PROD" />
        <div className="brand__name">RL PROD <span>· Portal</span></div>
      </div>

      <div className="brand__mid">
        <p className="brand__eyebrow">Photography &amp; Video</p>
        <h2 className="brand__headline">O teu espaço de projeto, num só sítio.</h2>
        <p className="brand__sub">Acede às tuas sessões, aprova entregas e descarrega os teus ficheiros finais — quando quiseres.</p>
        <ul className="brand__points">
          <li><span className="dot" />Galerias e showreels privados</li>
          <li><span className="dot" />Aprovação e feedback de edições</li>
          <li><span className="dot" />Faturas e contratos sempre à mão</li>
        </ul>
      </div>

      <div className="brand__foot">
        <span>© 2026 RL PROD</span>
        <a href="#">Ajuda</a>
        <a href="#">Contacto</a>
      </div>
    </aside>
  )
}

/* ============================================================
   LOGIN
   ============================================================ */
function LoginForm({ go, setFlash }: { go: (v: View) => void; setFlash: (s: string) => void }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [remember, setRemember] = useState(true)
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authErr, setAuthErr] = useState('')

  const eErr = !email ? 'Indica o teu email.' : !EMAIL_RE.test(email) ? 'Email inválido.' : ''
  const pErr = !pw ? 'Indica a palavra-passe.' : ''

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true); setAuthErr('')
    if (eErr || pErr) return
    setLoading(true)
    try {
      // Auth contra media_portais: match email + senha → cookie + ref do portal
      const res = await fetch('/api/media-portal-acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha: pw }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        setAuthErr(data?.error ?? 'Email ou palavra-passe inválidos.')
        return
      }
      setFlash('Sessão iniciada. A abrir o teu portal…')
      // Redireciona para o portal específico deste cliente
      router.push(`/portal-media/${data.ref}`)
    } catch {
      setAuthErr('Erro de ligação. Tenta novamente.')
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    try {
      const redirect = typeof window !== 'undefined'
        ? `${window.location.origin}/media/portal-cliente/acesso/portal`
        : '/media/portal-cliente/acesso/portal'
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: redirect } })
    } catch {
      setFlash('Não foi possível abrir o Google.')
    }
  }

  return (
    <form className="view" onSubmit={submit} noValidate>
      <div className="view-head">
        <h1>Bem-vindo de volta</h1>
        <p>Inicia sessão para entrar no teu portal de cliente.</p>
      </div>

      <Field
        label="Email" type="email" name="email" icon={IcMail}
        placeholder="nome@email.com" autoComplete="email"
        value={email} onChange={e => setEmail(e.target.value)}
        invalid={touched && !!eErr} err={eErr}
      />
      <PwField
        label="Palavra-passe" name="password" placeholder="••••••••"
        autoComplete="current-password"
        value={pw} onChange={e => setPw(e.target.value)}
        invalid={touched && !!pErr} err={pErr}
      />

      <div className="row-between">
        <label className="check">
          <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
          <span className="box">{remember && <IcCheck />}</span>
          Manter sessão iniciada
        </label>
        <button type="button" className="link" onClick={() => go('forgot')}>Esqueceste-te?</button>
      </div>

      {authErr && <p className="err" style={{ marginTop: -10, marginBottom: 14 }}><IcAlert />{authErr}</p>}

      <button className="btn" disabled={loading}>
        {loading
          ? (<><span className="spinner" />A entrar…</>)
          : (<>Entrar <IcArrow /></>)
        }
      </button>

      <div className="divider">OU</div>
      <button type="button" className="sso" onClick={handleGoogle}>
        <IcGoogle /> Continuar com Google
      </button>

      <p className="helper">
        Ainda não tens conta? <button type="button" onClick={() => go('register')}>Criar conta</button>
      </p>
    </form>
  )
}

/* ============================================================
   REGISTO
   ============================================================ */
function RegisterForm({ go }: { go: (v: View) => void }) {
  const [f, setF] = useState({ name: '', email: '', pw: '', terms: false })
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [authErr, setAuthErr] = useState('')

  const nErr = !f.name.trim() ? 'Indica o teu nome.' : ''
  const eErr = !f.email ? 'Indica o teu email.' : !EMAIL_RE.test(f.email) ? 'Email inválido.' : ''
  const pErr = !f.pw ? 'Cria uma palavra-passe.' : f.pw.length < 8 ? 'Mínimo de 8 caracteres.' : ''
  const tErr = !f.terms ? 'Tens de aceitar os termos.' : ''

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true); setAuthErr('')
    if (nErr || eErr || pErr || tErr) return
    setLoading(true)
    try {
      const redirect = typeof window !== 'undefined'
        ? `${window.location.origin}/media/portal-cliente/acesso/portal`
        : '/media/portal-cliente/acesso/portal'
      const { error } = await supabase.auth.signUp({
        email: f.email,
        password: f.pw,
        options: { data: { nome: f.name.trim() }, emailRedirectTo: redirect },
      })
      if (error) { setAuthErr(error.message); return }
      setDone(true)
    } catch {
      setAuthErr('Erro de ligação. Tenta novamente.')
    } finally { setLoading(false) }
  }

  if (done) {
    return (
      <div className="view success">
        <div className="success__icon"><IcCheckBig /></div>
        <h1>Conta criada!</h1>
        <p>Enviámos um link de confirmação para <span className="mail">{f.email}</span>. Confirma o email para ativares o acesso.</p>
        <button className="btn" onClick={() => go('login')}>Ir para o início de sessão <IcArrow /></button>
      </div>
    )
  }

  return (
    <form className="view" onSubmit={submit} noValidate>
      <div className="view-head">
        <h1>Criar conta</h1>
        <p>Regista-te para acederes às tuas sessões e entregas.</p>
      </div>

      <Field
        label="Nome completo" name="name" icon={IcUser}
        placeholder="O teu nome" autoComplete="name"
        value={f.name} onChange={e => setF(s => ({ ...s, name: e.target.value }))}
        invalid={touched && !!nErr} err={nErr}
      />
      <Field
        label="Email" type="email" name="email" icon={IcMail}
        placeholder="nome@email.com" autoComplete="email"
        value={f.email} onChange={e => setF(s => ({ ...s, email: e.target.value }))}
        invalid={touched && !!eErr} err={eErr}
      />
      <PwField
        label="Palavra-passe" name="new-password" placeholder="Mínimo 8 caracteres"
        autoComplete="new-password"
        value={f.pw} onChange={e => setF(s => ({ ...s, pw: e.target.value }))}
        invalid={touched && !!pErr} err={pErr}
      />
      <Strength value={f.pw} />

      <label className="check" style={{ marginBottom: 20, alignItems: 'flex-start' }}>
        <input type="checkbox" checked={f.terms} onChange={e => setF(s => ({ ...s, terms: e.target.checked }))} />
        <span className="box" style={{ marginTop: 1 }}>{f.terms && <IcCheck />}</span>
        <span style={{ lineHeight: 1.45 }}>
          Aceito os <a className="link" onClick={e => e.preventDefault()}>Termos</a> e a <a className="link" onClick={e => e.preventDefault()}>Política de Privacidade</a>.
        </span>
      </label>
      {touched && tErr && <p className="err" style={{ marginTop: -14, marginBottom: 16 }}><IcAlert />{tErr}</p>}
      {authErr && <p className="err" style={{ marginTop: -10, marginBottom: 14 }}><IcAlert />{authErr}</p>}

      <button className="btn" disabled={loading}>
        {loading
          ? (<><span className="spinner" />A criar conta…</>)
          : (<>Criar conta <IcArrow /></>)
        }
      </button>

      <p className="helper">
        Já tens conta? <button type="button" onClick={() => go('login')}>Iniciar sessão</button>
      </p>
    </form>
  )
}

/* ============================================================
   RECUPERAR PALAVRA-PASSE
   ============================================================ */
function ForgotForm({ go }: { go: (v: View) => void }) {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const eErr = !email ? 'Indica o teu email.' : !EMAIL_RE.test(email) ? 'Email inválido.' : ''

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (eErr) return
    setLoading(true)
    try {
      const redirect = typeof window !== 'undefined'
        ? `${window.location.origin}/media/portal-cliente/acesso/redefinir-password`
        : '/media/portal-cliente/acesso/redefinir-password'
      // Sempre mostrar "sucesso" — por segurança, não revelar se a conta existe
      await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirect })
    } catch {/* swallow */} finally {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="view success">
        <div className="success__icon"><IcMail width={28} height={28} /></div>
        <h1>Verifica o teu email</h1>
        <p>Se existir uma conta associada a <span className="mail">{email}</span>, enviámos instruções para redefinir a palavra-passe.</p>
        <button className="btn btn--ghost" onClick={() => go('login')}><IcBack /> Voltar ao início de sessão</button>
      </div>
    )
  }

  return (
    <form className="view" onSubmit={submit} noValidate>
      <button type="button" className="back" onClick={() => go('login')}><IcBack /> Voltar</button>
      <div className="view-head">
        <h1>Recuperar acesso</h1>
        <p>Indica o teu email e enviamos-te um link para redefinires a palavra-passe.</p>
      </div>

      <Field
        label="Email" type="email" name="email" icon={IcMail}
        placeholder="nome@email.com" autoComplete="email"
        value={email} onChange={e => setEmail(e.target.value)}
        invalid={touched && !!eErr} err={eErr}
      />

      <button className="btn" disabled={loading} style={{ marginTop: 6 }}>
        {loading
          ? (<><span className="spinner" />A enviar…</>)
          : (<>Enviar link de recuperação <IcArrow /></>)
        }
      </button>

      <p className="helper">
        Lembraste-te? <button type="button" onClick={() => go('login')}>Iniciar sessão</button>
      </p>
    </form>
  )
}

/* ============================================================
   CAMPOS REUTILIZÁVEIS
   ============================================================ */
function Field(props: {
  label?: string
  icon?: (p: any) => ReactNode
  invalid?: boolean
  err?: string
  type?: string
  name?: string
  placeholder?: string
  autoComplete?: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}) {
  const Icon = props.icon
  return (
    <div className={'field' + (props.invalid ? ' invalid' : '')}>
      {props.label && <label className="field__label">{props.label}</label>}
      <div className="input-wrap">
        <input
          className={'input' + (Icon ? ' has-icon' : '')}
          type={props.type ?? 'text'} name={props.name}
          placeholder={props.placeholder} autoComplete={props.autoComplete}
          value={props.value} onChange={props.onChange}
        />
        {Icon && <span className="input__icon"><Icon /></span>}
      </div>
      {props.invalid && props.err && <p className="err"><IcAlert />{props.err}</p>}
    </div>
  )
}

function PwField(props: {
  label?: string
  name?: string
  placeholder?: string
  autoComplete?: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  invalid?: boolean
  err?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className={'field' + (props.invalid ? ' invalid' : '')}>
      {props.label && <label className="field__label">{props.label}</label>}
      <div className="input-wrap">
        <input
          className="input has-icon has-trail"
          type={show ? 'text' : 'password'}
          name={props.name} placeholder={props.placeholder} autoComplete={props.autoComplete}
          value={props.value} onChange={props.onChange}
        />
        <span className="input__icon"><IcLock /></span>
        <button type="button" className="trail-btn" tabIndex={-1}
          onClick={() => setShow(s => !s)}
          aria-label={show ? 'Ocultar' : 'Mostrar'}>
          {show ? <IcEyeOff /> : <IcEye />}
        </button>
      </div>
      {props.invalid && props.err && <p className="err"><IcAlert />{props.err}</p>}
    </div>
  )
}

function Strength({ value }: { value: string }) {
  if (!value) return null
  const score = scorePw(value)
  const LABEL = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']
  const COLOR = ['', 'oklch(0.62 0.18 25)', 'oklch(0.72 0.14 75)', 'oklch(0.68 0.13 130)', 'oklch(0.60 0.13 150)']
  return (
    <div className="strength">
      <div className="strength__bars">
        {[1, 2, 3, 4].map(i => (
          <i key={i} style={{ background: i <= score ? COLOR[score] : 'var(--border)' }} />
        ))}
      </div>
      <span className="strength__label" style={{ color: COLOR[score] || 'var(--muted)' }}>
        Segurança da palavra-passe: {LABEL[score]}
      </span>
    </div>
  )
}

function scorePw(v: string): number {
  let s = 0
  if (!v) return 0
  if (v.length >= 8) s++
  if (v.length >= 12) s++
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) s++
  if (/\d/.test(v)) s++
  if (/[^A-Za-z0-9]/.test(v)) s++
  return Math.min(s, 4)
}

/* ============================================================
   ÍCONES SVG (inline, leves)
   ============================================================ */
const IcMail = (p: any) => (
  <svg width={p.width ?? 18} height={p.height ?? 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 7 9-7" />
  </svg>
)
const IcLock = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)
const IcUser = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
)
const IcEye = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
const IcEyeOff = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.9 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7c2 0 3.7-.4 5.2-1.2M3 3l18 18" />
  </svg>
)
const IcCheck = ({ color }: { color?: string } = {}) => (
  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 7" />
  </svg>
)
const IcCheckBig = () => (
  <svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 7" />
  </svg>
)
const IcArrow = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)
const IcBack = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
)
const IcAlert = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
  </svg>
)
const IcGoogle = () => (
  <svg width={18} height={18} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1a5.9 5.9 0 0 1-5.5-4H3.2v2.5A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-4V7.5H3.2a10 10 0 0 0 0 9L6.5 14Z" />
    <path fill="#EA4335" d="M12 6.2c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.2 7.5L6.5 10A5.9 5.9 0 0 1 12 6.2Z" />
  </svg>
)
