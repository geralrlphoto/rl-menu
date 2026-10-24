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
    // O fundo de metal escovado vem do layout (FUNDO); aqui só o cartão centrado.
    <div className="rlp min-h-screen flex items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-[400px]">

        <div className="rounded-2xl border border-white/[0.1] bg-[#00141f]/70 px-6 sm:px-8 py-9 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">

          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="h-12 w-auto" />
          </div>

          {/* Projeto */}
          <div className="text-center mb-8">
            <p className="rlp-m text-[10px] text-[#5a8bff] mb-3">Portal do cliente</p>
            <h1 className="rlp-t text-[clamp(26px,6vw,34px)] leading-tight text-white break-words">{nomeProjeto}</h1>
            {cliente && <p className="mt-1 text-[14px] text-[#a9c1ff]">{cliente}</p>}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label htmlFor="pm-senha" className="rlp-m text-[9px] text-[#7c8893]">Senha de acesso</label>
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8893]">
                <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              <input
                id="pm-senha"
                type="password"
                value={senha}
                onChange={e => { setSenha(e.target.value); setErro(null) }}
                placeholder="Escreve a senha"
                autoFocus
                className={`w-full rounded-md border bg-[#00141f]/70 pl-11 pr-4 py-3 text-[15px] text-white placeholder:text-white/35 focus:outline-none transition-colors ${
                  erro ? 'border-[#ff4747]' : 'border-white/[0.12] focus:border-[#2e6cf6]'
                }`}
              />
            </div>

            {erro && (
              <p className="text-[13px] text-[#ff4747] leading-relaxed">{erro}</p>
            )}

            <button
              type="submit"
              disabled={loading || !senha.trim()}
              className="rlp-m mt-2 rounded-md bg-[#2e6cf6] hover:bg-[#5a8bff] py-4 text-[11px] tracking-[0.25em] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'A verificar…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="rlp-m text-center mt-6 text-[9px] text-white/35">
          RL PROD · Photography &amp; Video
        </p>
      </div>
    </div>
  )
}
