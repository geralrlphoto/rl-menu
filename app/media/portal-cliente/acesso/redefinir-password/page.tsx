'use client'

/* ============================================================
   Portal do Cliente · Redefinir Palavra-passe
   Destino do link enviado por resetPasswordForEmail.
   Quando o utilizador chega aqui já tem uma sessão temporária
   criada pelo Supabase — só precisamos de pedir a nova password
   e chamar updateUser({ password }).
   ============================================================ */

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Manrope, Space_Grotesk } from 'next/font/google'
import { supabase } from '@/lib/supabase'
import '../acesso.css'

const manrope = Manrope({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-manrope', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-space-grotesk', display: 'swap' })

export default function RedefinirPasswordPage() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  // O Supabase põe um access_token no fragmento. O auto-detect cria a sessão.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setHasSession(!!session))
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => setHasSession(!!session))
    return () => sub.subscription.unsubscribe()
  }, [])

  const pErr = !pw ? 'Cria uma nova palavra-passe.' : pw.length < 8 ? 'Mínimo de 8 caracteres.' : ''
  const p2Err = !pw2 ? 'Repete a palavra-passe.' : pw2 !== pw ? 'As palavras-passe não coincidem.' : ''

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true); setErr('')
    if (pErr || p2Err) return
    if (!hasSession) { setErr('Link inválido ou expirado. Pede novo link de recuperação.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pw })
      if (error) { setErr(error.message); return }
      setDone(true)
      setTimeout(() => router.push('/media/portal-cliente/acesso/portal'), 1600)
    } catch {
      setErr('Erro de ligação. Tenta novamente.')
    } finally { setLoading(false) }
  }

  return (
    <div className={`portal-acesso ${manrope.variable} ${spaceGrotesk.variable}`}>
      <BrandSide />
      <main className="panel">
        <div className="card">
          {done ? (
            <div className="view success">
              <div className="success__icon"><IcCheckBig /></div>
              <h1>Palavra-passe atualizada!</h1>
              <p>A redirecionar-te para o portal…</p>
            </div>
          ) : (
            <form className="view" onSubmit={submit} noValidate>
              <div className="view-head">
                <h1>Define uma nova palavra-passe</h1>
                <p>Escolhe algo com pelo menos 8 caracteres.</p>
              </div>

              <div className={'field' + (touched && pErr ? ' invalid' : '')}>
                <label className="field__label">Nova palavra-passe</label>
                <div className="input-wrap">
                  <input
                    className="input has-icon has-trail"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    autoComplete="new-password"
                    value={pw} onChange={e => setPw(e.target.value)}
                  />
                  <span className="input__icon"><IcLock /></span>
                  <button type="button" className="trail-btn" tabIndex={-1}
                    onClick={() => setShowPw(s => !s)}
                    aria-label={showPw ? 'Ocultar' : 'Mostrar'}>
                    {showPw ? <IcEyeOff /> : <IcEye />}
                  </button>
                </div>
                {touched && pErr && <p className="err"><IcAlert />{pErr}</p>}
              </div>

              <div className={'field' + (touched && p2Err ? ' invalid' : '')}>
                <label className="field__label">Repete a palavra-passe</label>
                <div className="input-wrap">
                  <input
                    className="input has-icon"
                    type="password"
                    placeholder="Repete a nova palavra-passe"
                    autoComplete="new-password"
                    value={pw2} onChange={e => setPw2(e.target.value)}
                  />
                  <span className="input__icon"><IcLock /></span>
                </div>
                {touched && p2Err && <p className="err"><IcAlert />{p2Err}</p>}
              </div>

              {err && <p className="err" style={{ marginTop: -4, marginBottom: 12 }}><IcAlert />{err}</p>}

              <button className="btn" disabled={loading}>
                {loading
                  ? (<><span className="spinner" />A guardar…</>)
                  : (<>Definir palavra-passe <IcArrow /></>)
                }
              </button>

              <p className="helper" style={{ marginTop: 20 }}>
                <a href="/media/portal-cliente/acesso">Voltar ao início de sessão</a>
              </p>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

function BrandSide() {
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
        <h2 className="brand__headline">Recupera o teu acesso.</h2>
        <p className="brand__sub">Define uma nova palavra-passe e volta ao teu portal.</p>
      </div>
      <div className="brand__foot">
        <span>© 2026 RL PROD</span>
      </div>
    </aside>
  )
}

const IcLock = () => (<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>)
const IcEye = () => (<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>)
const IcEyeOff = () => (<svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7c2 0 3.7-.4 5.2-1.2M3 3l18 18" /></svg>)
const IcAlert = () => (<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>)
const IcArrow = () => (<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>)
const IcCheckBig = () => (<svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>)
