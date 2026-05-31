'use client'

/* ============================================================
   Portal do Cliente · Dashboard (protegido)
   Acesso só com sessão Supabase válida.
   Por agora: ecrã simples com nome do utilizador + logout.
   Conteúdo real (galerias / faturas / aprovações) vem depois.
   ============================================================ */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Manrope, Space_Grotesk } from 'next/font/google'
import { supabase } from '@/lib/supabase'
import '../acesso.css'

const manrope = Manrope({ subsets: ['latin'], weight: ['400','500','600','700','800'], variable: '--font-manrope', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400','500','600','700'], variable: '--font-space-grotesk', display: 'swap' })

type UserInfo = { email: string; nome?: string }

export default function PortalDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      if (!session) {
        router.replace('/media/portal-cliente/acesso')
        return
      }
      setUser({
        email: session.user.email ?? '',
        nome: (session.user.user_metadata as any)?.nome,
      })
      setChecking(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session) router.replace('/media/portal-cliente/acesso')
    })

    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/media/portal-cliente/acesso')
  }

  if (checking) {
    return (
      <div className={`portal-acesso ${manrope.variable} ${spaceGrotesk.variable}`} style={{ display: 'grid', placeItems: 'center', minHeight: '100dvh' }}>
        <span className="spinner" style={{ borderTopColor: 'var(--navy-800)' }} />
      </div>
    )
  }

  const primeiroNome = (user?.nome ?? user?.email ?? '').split(/[\s@]/)[0]

  return (
    <main className={`portal-acesso ${manrope.variable} ${spaceGrotesk.variable}`}
      style={{ display: 'block', background: 'var(--bg)', minHeight: '100dvh', padding: '40px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48, gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/portal-cliente/mark-navy.png" alt="RL PROD" style={{ height: 38, width: 'auto' }} />
            <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 600, letterSpacing: '.02em', fontSize: 18, color: 'var(--navy-800)' }}>
              RL PROD <span style={{ opacity: .55, fontWeight: 400 }}>· Portal</span>
            </div>
          </div>
          <button className="btn btn--ghost" style={{ width: 'auto', padding: '10px 18px' }} onClick={handleLogout}>
            Sair
          </button>
        </header>

        {/* Welcome */}
        <section style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: 'var(--ff-display)', textTransform: 'uppercase', letterSpacing: '.32em', fontSize: 11, color: 'var(--accent-strong)', margin: '0 0 8px' }}>Painel</p>
          <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 500, fontSize: 'clamp(28px, 3.4vw, 40px)', lineHeight: 1.1, letterSpacing: '-.015em', color: 'var(--text)', margin: 0 }}>
            Olá, {primeiroNome || 'cliente'} 👋
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, marginTop: 10 }}>Bem-vindo ao teu portal. Em breve verás aqui as tuas galerias, contratos e faturas.</p>
        </section>

        {/* Conteúdo placeholder */}
        <section style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '32px 28px', boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>Sessão ativa.</strong><br />
            Email: <span style={{ color: 'var(--navy-800)' }}>{user?.email}</span>
          </p>
        </section>
      </div>
    </main>
  )
}
