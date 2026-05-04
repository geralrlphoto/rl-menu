'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  portalRef: string
  nomeProjeto: string
  cliente: string
}

export default function PortalLoginClient({ portalRef, nomeProjeto, cliente }: Props) {
  const [senha, setSenha]   = useState('')
  const [erro, setErro]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!senha.trim()) return
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`/api/media-portal/${portalRef}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: senha.trim() }),
      })
      const data = await res.json()
      if (data.ok) {
        router.refresh()
      } else {
        setErro(data.error ?? 'Senha incorrecta. Tenta novamente.')
        setSenha('')
      }
    } catch {
      setErro('Erro de ligação. Verifica a internet e tenta novamente.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative">

      {/* Grid neon background */}
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        backgroundImage: `linear-gradient(rgba(70,120,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(70,120,255,0.04) 1px,transparent 1px)`,
        backgroundSize: '64px 64px',
      }} />
      <div className="pointer-events-none fixed inset-0 z-0" style={{
        background: 'radial-gradient(ellipse 110% 55% at 50% -8%, rgba(50,110,255,0.10) 0%, transparent 70%)',
      }} />

      <div className="relative z-10 w-full max-w-[360px]">

        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border border-white/15 bg-white/[0.03] mb-8"
            style={{ boxShadow: '0 0 24px rgba(255,255,255,0.06), inset 0 0 12px rgba(255,255,255,0.03)' }}>
            <img src="/logo-rl-media-branco.png" alt="RL Media" className="w-11 opacity-90" style={{ mixBlendMode: 'screen' }} />
          </div>

          {/* Neon line */}
          <div className="h-px mb-8" style={{ background: 'linear-gradient(90deg,transparent,rgba(37,99,235,0.4),transparent)' }} />

          <p className="text-xs tracking-[0.6em] text-white/20 uppercase mb-2">Portal do Cliente</p>
          <h1 className="text-2xl font-extralight tracking-[0.3em] text-white/80 uppercase mb-1">{nomeProjeto}</h1>
          <p className="text-sm tracking-[0.3em] text-white/25 uppercase">{cliente}</p>
        </div>

        {/* Card */}
        <div className="border border-white/[0.07] bg-white/[0.02] p-6 flex flex-col gap-4">
          <p className="text-xs tracking-[0.4em] text-white/20 uppercase mb-1">Acesso protegido</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="border border-white/[0.08] bg-black/20 flex items-center gap-3 px-4">
              <span className="text-white/20 text-sm shrink-0">🔑</span>
              <input
                type="password"
                value={senha}
                onChange={e => { setSenha(e.target.value); setErro(null) }}
                placeholder="Senha de acesso"
                autoFocus
                className="flex-1 bg-transparent py-4 text-sm tracking-[0.2em] text-white/65
                           placeholder:text-white/15 focus:outline-none"
              />
            </div>

            {erro && (
              <p className="text-xs text-red-400/70 tracking-[0.2em] leading-relaxed">⚠ {erro}</p>
            )}

            <button
              type="submit"
              disabled={loading || !senha.trim()}
              className="border border-white/20 bg-white/[0.03] hover:bg-white/[0.07]
                         py-4 text-sm tracking-[0.5em] text-white/50 hover:text-white/80 uppercase
                         transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ A verificar...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-xs tracking-[0.4em] text-white/10 uppercase">
          RL Media · Audiovisual
        </p>
      </div>
    </div>
  )
}
