'use client'

import { useState } from 'react'

// Peças visuais da ficha de cliente (identidade RL PROD)

export const labelCls = 'rlp-m block text-[10.5px] text-white/55 mb-2.5'
export const inputCls =
  'w-full rounded-md border border-white/[0.12] bg-[#00141f]/70 px-4 py-3.5 text-[16px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#2e6cf6] focus:bg-[#00141f] transition-colors'

export const chip = (ativo: boolean) =>
  `rounded-full border px-4 py-2 text-[13.5px] transition-colors ${ativo
    ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white'
    : 'border-white/[0.14] bg-white/[0.03] text-white/75 hover:border-[#5a8bff]/70 hover:text-white'}`

export function Secao({ id, num, titulo, sub, preenchidos, total, children }: {
  id: string
  num: string
  titulo: string
  sub?: string
  preenchidos: number
  total: number
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-6 rounded-xl border border-white/[0.1] bg-[#00141f]/55 p-5 sm:p-7">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-baseline gap-4">
          <span className="rlp-t text-[44px] leading-none text-[#2e6cf6]">{num}</span>
          <div>
            <h2 className="rlp-t text-[24px] leading-tight">{titulo}</h2>
            {sub && <p className="text-[13.5px] text-white/50 mt-0.5">{sub}</p>}
          </div>
        </div>
        <span className={`rlp-m shrink-0 mt-2 text-[10px] ${preenchidos === total ? 'text-[#5a8bff]' : 'text-[#7c8893]'}`}>
          {preenchidos}/{total}
        </span>
      </div>
      {children}
    </section>
  )
}

export function Campo({ label, obrigatorio, dica, erro, className = '', children }: {
  label: string
  obrigatorio?: boolean
  dica?: string
  erro?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={className}>
      <label className={labelCls}>
        {label}{obrigatorio && <span className={erro ? 'text-[#ff4747]' : 'text-[#5a8bff]'}> *</span>}
      </label>
      {children}
      {dica && <p className="mt-1.5 text-[12.5px] text-white/40">{dica}</p>}
    </div>
  )
}

// Botão de copiar dentro de um input (canto direito)
export function Copiar({ valor, rotulo = 'Copiar' }: { valor: string; rotulo?: string }) {
  const [ok, setOk] = useState(false)
  if (!valor.trim()) return null
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(valor.trim())
          setOk(true)
          setTimeout(() => setOk(false), 1600)
        } catch { /* sem acesso à área de transferência */ }
      }}
      className={`rlp-m absolute right-2 top-1/2 -translate-y-1/2 rounded border px-2.5 py-1.5 text-[9.5px] transition-colors ${ok
        ? 'border-[#2e6cf6] bg-[#2e6cf6] text-white'
        : 'border-white/[0.14] bg-[#0c2236] text-white/60 hover:text-white hover:border-[#5a8bff]/70'}`}
      title={rotulo}
    >
      {ok ? 'Copiado' : rotulo}
    </button>
  )
}

export function ComCopiar({ valor, children }: { valor: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <Copiar valor={valor} />
    </div>
  )
}

export const nLinhas = (s: string) => s.split('\n').map(l => l.trim()).filter(Boolean).length
