'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError('Password incorreta')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#080808] flex flex-col items-center justify-center">

      <div className="mb-10 text-center">
        <h1 className="text-sm font-light tracking-[0.5em] text-white uppercase">
          RL <span className="text-[#C9A84C]">PHOTO</span>.VIDEO
        </h1>
      </div>

      <form onSubmit={handleSubmit}
        className="w-full max-w-xs flex flex-col gap-4">

        <div className="border border-white/10 rounded-lg overflow-hidden">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full bg-[#111] text-white text-sm px-4 py-3 outline-none placeholder:text-white/20 tracking-widest"
          />
        </div>

        {error && (
          <p className="text-red-400 text-[11px] tracking-wider text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !password}
          className="bg-[#C9A84C] hover:bg-white transition-colors duration-300 text-black text-[11px] font-bold tracking-[0.3em] uppercase py-3 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'A entrar...' : 'ENTRAR'}
        </button>
      </form>
    </main>
  )
}
