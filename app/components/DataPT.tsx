'use client'

import { useEffect, useRef, useState } from 'react'

/* Seletor de data em português (PT-PT). O calendário nativo do <input type="date">
   segue a língua do browser (no Chrome em inglês aparece "September", "Mo Tu…"),
   por isso aqui desenha-se o nosso. O valor é sempre 'AAAA-MM-DD', como no input nativo. */

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const iso = (a: number, m: number, d: number) => `${a}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const hojeISO = () => { const h = new Date(); return iso(h.getFullYear(), h.getMonth(), h.getDate()) }

export default function DataPT({ value, onChange, className = '' }: {
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  const [aberto, setAberto] = useState(false)
  const base = value || hojeISO()
  const [ano, setAno] = useState(Number(base.slice(0, 4)))
  const [mes, setMes] = useState(Number(base.slice(5, 7)) - 1)
  const caixa = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora
  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => { if (!caixa.current?.contains(e.target as Node)) setAberto(false) }
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [aberto])

  const abrir = () => {
    const b = value || hojeISO()
    setAno(Number(b.slice(0, 4))); setMes(Number(b.slice(5, 7)) - 1); setAberto(a => !a)
  }
  const mudarMes = (n: number) => {
    const d = new Date(ano, mes + n, 1); setAno(d.getFullYear()); setMes(d.getMonth())
  }

  // Semanas a começar à segunda
  const offset = (new Date(ano, mes, 1).getDay() + 6) % 7
  const diasMes = new Date(ano, mes + 1, 0).getDate()
  const celulas: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: diasMes }, (_, i) => i + 1)]
  const hoje = hojeISO()
  const texto = value ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}` : 'dd/mm/aaaa'

  return (
    <div ref={caixa} className="relative">
      <button type="button" onClick={abrir} className={`${className} flex items-center gap-2 ${value ? 'text-white' : 'text-white/40'}`}>
        {texto}
        <svg className="w-4 h-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></svg>
      </button>
      {aberto && (
        <div className="absolute z-50 mt-1 w-64 rounded-xl border border-white/10 bg-[#161310] p-3 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => mudarMes(-1)} className="w-7 h-7 rounded-lg text-white/60 hover:bg-white/10 hover:text-white" aria-label="Mês anterior">‹</button>
            <span className="text-sm text-white">{MESES[mes]} {ano}</span>
            <button type="button" onClick={() => mudarMes(1)} className="w-7 h-7 rounded-lg text-white/60 hover:bg-white/10 hover:text-white" aria-label="Mês seguinte">›</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {DIAS.map(d => <span key={d} className="text-[10px] uppercase tracking-wider text-white/35 py-1">{d}</span>)}
            {celulas.map((d, i) => {
              if (!d) return <span key={`v${i}`} />
              const v = iso(ano, mes, d)
              const sel = v === value
              return (
                <button key={v} type="button" onClick={() => { onChange(v); setAberto(false) }}
                  className={`h-8 rounded-lg text-sm transition-colors ${sel ? 'bg-gold text-black font-semibold' : v === hoje ? 'border border-gold/60 text-gold' : 'text-white/80 hover:bg-white/10'}`}>
                  {d}
                </button>
              )
            })}
          </div>
          <div className="flex justify-between mt-2 pt-2 border-t border-white/10">
            <button type="button" onClick={() => { onChange(''); setAberto(false) }} className="text-xs text-white/50 hover:text-white">Limpar</button>
            <button type="button" onClick={() => { onChange(hoje); setAberto(false) }} className="text-xs text-gold hover:text-white">Hoje</button>
          </div>
        </div>
      )}
    </div>
  )
}
