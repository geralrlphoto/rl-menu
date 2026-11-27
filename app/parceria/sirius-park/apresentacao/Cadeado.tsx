'use client'

// Ecrã de password da apresentação e do portal de parceria (mesmo tema RL do portal).
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RLP_CSS } from '@/app/_lead/rlpCss'
import { entrar } from './acesso'

export default function Cadeado({ titulo = 'apresentação', voltar = true }: { titulo?: string; voltar?: boolean }) {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [erro, setErro] = useState(false)
  const [aEntrar, setAEntrar] = useState(false)

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault()
    setAEntrar(true); setErro(false)
    const ok = await entrar(pw)
    if (ok) router.refresh()
    else { setErro(true); setAEntrar(false) }
  }

  return (
    <div className="rl-portal min-h-screen flex items-center justify-center" style={{ padding: 24 }}>
      <style>{RLP_CSS}</style>
      <form onSubmit={submeter} className="rlp-card" style={{ width: '100%', maxWidth: 420, padding: 'clamp(28px,5vw,44px)', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <span className="rlp-eyebrow">RL Photo · Video × Sirius Park</span>
        <h1 className="rlp-h2" style={{ fontSize: 'clamp(28px,4vw,40px)', margin: 0 }}>{voltar ? 'A nossa' : 'O vosso'} <em>{titulo}</em></h1>
        <p className="rlp-lede" style={{ fontSize: 15, margin: 0 }}>Introduza a password para continuar.</p>
        <input
          type="password" inputMode="numeric" autoFocus value={pw} onChange={e => setPw(e.target.value)}
          aria-label="Password" placeholder="Password"
          style={{ background: 'rgba(255,255,255,.04)', border: `1px solid ${erro ? '#c0605a' : 'var(--line)'}`, borderRadius: 8, padding: '14px 16px', color: 'var(--tx)', fontFamily: 'var(--fb)', fontSize: 16, letterSpacing: '.2em', outline: 'none' }}
        />
        {erro && <p style={{ color: '#d98a84', fontSize: 13, margin: 0, fontFamily: 'var(--fb)' }}>Password errada. Tente outra vez.</p>}
        <button type="submit" disabled={aEntrar || !pw} className="rlp-btn full" style={{ opacity: aEntrar || !pw ? .6 : 1 }}>
          <span className="fill" /><span className="dot" />{aEntrar ? 'A abrir…' : 'Entrar'}
        </button>
        {voltar && <a href="/parceria/sirius-park" className="rlp-link-u" style={{ alignSelf: 'flex-start' }}><span>Voltar ao portal</span></a>}
      </form>
    </div>
  )
}
