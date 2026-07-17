'use client'

import { useEffect, useState } from 'react'
import { loadFreelancerProfile } from '../_data/freelancer-profile'

// ──────────────────────────────────────────────────────────────────────
//  Brand Logo — caixa rounded gold com logo RL centrado +
//  função do freelancer (Editor de Vídeo / Fotógrafo / etc.) por baixo.
//  Lê profile.funcao de localStorage e actualiza on focus + storage.
// ──────────────────────────────────────────────────────────────────────

export function BrandLogo() {
  const [funcao, setFuncao] = useState<string>('Editor de Vídeo')

  useEffect(() => {
    function refresh() {
      try { setFuncao(loadFreelancerProfile().funcao || 'Editor de Vídeo') } catch {}
    }
    refresh()
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    window.addEventListener('storage', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('storage', onFocus)
    }
  }, [])

  return (
    <div className="px-6 pt-8 pb-7 flex flex-col items-center border-b border-white/[0.04]">
      <div className="w-14 h-14 rounded-2xl border border-gold/40 flex items-center justify-center mb-2 overflow-hidden"
        style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,164,92,0.18), rgba(201,164,92,0.04))', boxShadow: '0 0 20px rgba(201,164,92,0.15)' }}>
        <img src="/logo_rl_gold.png" alt="RL" className="w-10 h-10 object-contain" />
      </div>
      <p className="text-[10px] tracking-[0.4em] text-gold/70 font-light uppercase mt-1">{funcao}</p>
    </div>
  )
}
