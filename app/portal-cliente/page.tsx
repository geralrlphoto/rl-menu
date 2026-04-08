'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PortalClienteLanding() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const ref = code.trim()
    if (!ref) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/portal-by-ref?ref=${encodeURIComponent(ref)}`)
      const data = await res.json()
      if (data.found && data.pageId) {
        const title = data.title ? `?title=${encodeURIComponent(data.title)}` : ''
        router.push(`/portal-cliente/${data.pageId}${title}`)
      } else {
        setError('Código não encontrado. Verifica e tenta novamente.')
        setLoading(false)
      }
    } catch {
      setError('Erro de ligação. Tenta novamente.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">

      {/* Logo / marca */}
      <div className="mb-10 text-center">
        <p className="font-cormorant text-gold text-3xl sm:text-4xl italic tracking-widest mb-1">
          RL Photo.Video
        </p>
        <p className="text-[10px] text-white/20 tracking-[0.4em] uppercase">Portal do Cliente</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-8">
          <p className="text-xs text-white/40 tracking-wider mb-6 text-center leading-relaxed">
            Introduz o teu código de acesso para entrar no teu portal pessoal.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value); setError('') }}
                placeholder="Código de acesso"
                autoCapitalize="none"
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 outline-none focus:border-gold/40 transition-colors placeholder:text-white/20 text-center tracking-widest"
              />
            </div>

            {error && (
              <p className="text-[11px] text-red-400/70 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3 rounded-xl bg-gold/10 border border-gold/30 text-gold text-xs font-semibold tracking-widest uppercase hover:bg-gold/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                  A procurar...
                </>
              ) : (
                'Entrar no Portal'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-white/10 mt-6 tracking-widest uppercase">
          O código foi enviado pela RL Photo.Video
        </p>
      </div>
    </main>
  )
}
