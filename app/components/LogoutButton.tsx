'use client'

import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="text-[10px] tracking-[0.3em] uppercase text-white/20 hover:text-[#C9A84C]/70 transition-colors"
    >
      SAIR
    </button>
  )
}
