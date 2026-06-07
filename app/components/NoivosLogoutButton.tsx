'use client'

/**
 * Botão "Sair" minimalista para usar no header dos portais dos noivos
 * (/portal-cliente/ref/<REF> e /portal-batizado/ref/<REF>).
 *
 * Limpa cookie nv_session no servidor + sessionStorage do tab + redirect
 * para /login-noivos. Esconde-se se o user é admin (rl_auth) — o admin
 * não precisa de sair, está só a editar.
 */

import { useState } from 'react'

export function NoivosLogoutButton({
  referencia,
  isAdmin = false,
  variant = 'default',
  tipo,
}: {
  referencia: string
  isAdmin?: boolean
  variant?: 'default' | 'minimal'
  /** 'casamento' (default) ou 'batizado' — controla o redirect do logout. */
  tipo?: 'casamento' | 'batizado'
}) {
  const [signingOut, setSigningOut] = useState(false)

  if (isAdmin) return null

  async function handleLogout() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await fetch('/api/noivos-auth', { method: 'DELETE', credentials: 'include' }).catch(() => {})
      try {
        sessionStorage.removeItem('nv_active')
        sessionStorage.removeItem(`portalAuth_${referencia}`)
      } catch {}
      // Detecção automática se não vier explícito: olha para a URL actual.
      const isBat = tipo === 'batizado'
        || (typeof window !== 'undefined' && window.location.pathname.startsWith('/portal-batizado'))
      window.location.href = isBat ? '/login-batizado' : '/login-noivos'
    } catch {
      setSigningOut(false)
    }
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleLogout}
        disabled={signingOut}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] tracking-[0.3em] uppercase text-white/40 hover:text-gold hover:bg-white/[0.04] transition-colors disabled:opacity-40"
        title="Terminar sessão"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        {signingOut ? 'a sair…' : 'Sair'}
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      disabled={signingOut}
      className="group fixed top-4 right-4 z-[60] flex items-center gap-2 px-3.5 py-2 rounded-full backdrop-blur transition-all disabled:opacity-40"
      style={{
        background: 'rgba(20,12,6,0.55)',
        border: '1px solid rgba(201,164,92,0.30)',
        color: 'rgba(245,235,212,0.80)',
        boxShadow: '0 6px 18px -8px rgba(0,0,0,0.55)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(40,28,12,0.85)'
        e.currentTarget.style.borderColor = 'rgba(201,164,92,0.55)'
        e.currentTarget.style.color = '#F5EAD2'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(20,12,6,0.55)'
        e.currentTarget.style.borderColor = 'rgba(201,164,92,0.30)'
        e.currentTarget.style.color = 'rgba(245,235,212,0.80)'
      }}
      title="Terminar sessão dos noivos"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      <span className="text-[10px] tracking-[0.35em] uppercase font-semibold">
        {signingOut ? 'A sair…' : 'Sair'}
      </span>
    </button>
  )
}
