'use client'

import { useState } from 'react'

/* Botão do cabeçalho da faixa: volta a mostrar tudo o que foi escondido com o ✕ */
export function ReporEscondidos({ n }: { n: number }) {
  const [estado, setEstado] = useState<'ok' | 'a' | 'feito'>('ok')
  if (n === 0 || estado === 'feito') return null
  return (
    <button type="button" disabled={estado === 'a'} title="Voltar a mostrar os itens escondidos com o ✕"
      onClick={() => {
        setEstado('a')
        fetch('/api/agenda-ocultar', { method: 'DELETE' }).then(r => r.json())
          .then(d => { if (d?.ok) { setEstado('feito'); window.location.reload() } else setEstado('ok') })
          .catch(() => setEstado('ok'))
      }}
      className="text-[9px] tracking-[0.3em] uppercase text-white/25 hover:text-[#C9A84C] transition-colors disabled:opacity-40">
      ↺ Repor {n} escondido{n === 1 ? '' : 's'}
    </button>
  )
}

/* Item da faixa "Próximos 30 dias" com um ✕ para o esconder só dali.
   Some logo no ecrã; o servidor guarda a chave para não voltar a aparecer. */
export function AgendaItem({ chave, children }: { chave: string; children: React.ReactNode }) {
  const [oculto, setOculto] = useState(false)
  if (oculto) return null
  return (
    <div className="relative group/item">
      {children}
      <button
        type="button"
        aria-label="Esconder do calendário"
        title="Esconder só do calendário"
        onClick={e => {
          e.preventDefault(); e.stopPropagation()
          setOculto(true)
          fetch('/api/agenda-ocultar', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chave }),
          }).then(r => r.json()).then(d => { if (!d?.ok) setOculto(false) }).catch(() => setOculto(false))
        }}
        className="absolute -top-1.5 -right-1.5 z-10 w-4 h-4 rounded-full flex items-center justify-center text-[9px] leading-none bg-[#1a1a1a] border border-white/15 text-white/50 hover:text-white hover:border-red-400/60 hover:bg-red-500/20 transition-all opacity-60 sm:opacity-0 sm:group-hover/item:opacity-100 focus:opacity-100"
      >
        ✕
      </button>
    </div>
  )
}
