'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EstiloRLProd from '@/app/media/_components/EstiloRLProd'
import { FUNDO } from '@/app/media/_lib/estilo'

// Ecrã de entrada do portal do staff: pede a senha (começa por "RL.").

export default function EntradaStaff({ token, nome }: { token: string; nome: string }) {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aEntrar, setAEntrar] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    setErro(''); setAEntrar(true)
    try {
      const r = await fetch('/api/equipa-rlprod/entrar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(d.error || 'Não foi possível entrar.')
      router.refresh()
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível entrar.'); setAEntrar(false) }
  }

  return (
    <main className="rlp min-h-screen relative text-white flex items-center justify-center px-4">
      <EstiloRLProd />
      <div className="pointer-events-none fixed inset-0 z-0" style={{ background: FUNDO }} />
      <form onSubmit={entrar} className="relative z-10 w-full max-w-sm rounded-2xl border border-white/[0.1] bg-[#00141f]/85 backdrop-blur-md p-6 sm:p-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-rl-prod-branco.png" alt="RL PROD" className="w-10 h-10 object-contain" />
        <p className="rlp-m traco mt-6 text-[10px] text-[#5a8bff]">RL Prod · Portal da equipa</p>
        <h1 className="rlp-t mt-3 text-[40px] leading-[0.9]">Olá, {nome}.</h1>
        <p className="mt-3 text-[14px] text-white/60">Escreve a tua senha para entrar. Começa por <span className="text-white">RL.</span></p>
        <input
          autoFocus autoComplete="current-password" type="password" placeholder="RL.XXXXXX"
          value={senha} onChange={e => setSenha(e.target.value)}
          className="mt-5 w-full rounded-md border border-white/[0.14] bg-[#00141f]/70 px-4 py-3 text-[16px] tracking-[0.15em] text-white placeholder:text-white/25 focus:outline-none focus:border-[#2e6cf6]"
        />
        {erro && <p className="mt-3 text-[13px] text-[#ff8a8a]">{erro}</p>}
        <button type="submit" disabled={aEntrar || !senha.trim()}
          className="mt-4 w-full rounded-full bg-[#2e6cf6] hover:bg-[#5a8bff] px-6 py-3 text-[14px] font-medium disabled:opacity-50">
          {aEntrar ? 'A entrar…' : 'Entrar'}
        </button>
        <p className="mt-5 text-[12px] text-white/40">Não tens a senha? Pede-a à RL PROD.</p>
      </form>
    </main>
  )
}
