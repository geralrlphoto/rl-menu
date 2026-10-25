'use client'
import { useState } from 'react'

// Campo de data com calendário em português (o calendário do browser segue a língua
// do Chrome e aparece em inglês). Valor no formato AAAA-MM-DD, como o <input type="date">.

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const lerIso = (v: string) => { const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null }

export default function CampoDataPT({ value, onChange, className = '', min }: { value: string; onChange: (v: string) => void; className?: string; min?: string }) {
  const escolhida = lerIso(value)
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0)
  const [aberto, setAberto] = useState(false)
  const [mes, setMes] = useState(() => { const b = escolhida ?? hoje; return new Date(b.getFullYear(), b.getMonth(), 1) })

  // Grelha de 6 semanas a começar na segunda-feira
  const inicio = new Date(mes); inicio.setDate(1 - ((mes.getDay() + 6) % 7))
  const dias = Array.from({ length: 42 }, (_, i) => { const d = new Date(inicio); d.setDate(inicio.getDate() + i); return d })
  const mudarMes = (n: number) => setMes(m => new Date(m.getFullYear(), m.getMonth() + n, 1))
  const escolher = (d: Date | null) => { onChange(d ? iso(d) : ''); setAberto(false) }

  return (
    <div>
      <button type="button" onClick={() => setAberto(a => !a)} className={`${className} flex items-center justify-between text-left`}>
        <span className={escolhida ? '' : 'opacity-40'}>
          {escolhida ? escolhida.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' }) : 'dd/mm/aaaa'}
        </span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="opacity-60 shrink-0">
          <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
      </button>

      {aberto && (
        <div className="rlp mt-2 w-full max-w-[320px] rounded-xl border border-white/[0.12] bg-[#00141f] p-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => mudarMes(-1)} aria-label="Mês anterior" className="w-8 h-8 rounded-full hover:bg-white/10 text-white/70">‹</button>
            <p className="rlp-t text-[17px] text-white">{MESES[mes.getMonth()]} {mes.getFullYear()}</p>
            <button type="button" onClick={() => mudarMes(1)} aria-label="Mês seguinte" className="w-8 h-8 rounded-full hover:bg-white/10 text-white/70">›</button>
          </div>
          <div className="mt-2 grid grid-cols-7 gap-0.5 text-center">
            {DIAS.map(d => <span key={d} className="rlp-m py-1 text-[8.5px] text-white/40">{d}</span>)}
            {dias.map(d => {
              const doMes = d.getMonth() === mes.getMonth()
              const sel = escolhida && iso(d) === iso(escolhida)
              const eHoje = iso(d) === iso(hoje)
              const antes = !!min && iso(d) < min
              return (
                <button key={iso(d)} type="button" onClick={() => escolher(d)} disabled={antes}
                  className={`h-9 rounded-lg text-[13.5px] transition-colors disabled:opacity-20 disabled:pointer-events-none ${sel ? 'bg-[#2e6cf6] text-white' : eHoje ? 'border border-[#2e6cf6]/70 text-white' : doMes ? 'text-white/85 hover:bg-white/10' : 'text-white/25 hover:bg-white/5'}`}>
                  {d.getDate()}
                </button>
              )
            })}
          </div>
          <div className="mt-2 flex justify-between text-[12.5px]">
            <button type="button" onClick={() => escolher(null)} className="text-white/50 hover:text-white">Limpar</button>
            <button type="button" onClick={() => { setMes(new Date(hoje.getFullYear(), hoje.getMonth(), 1)); escolher(hoje) }} className="text-[#a9c1ff] hover:text-white">Hoje</button>
          </div>
        </div>
      )}
    </div>
  )
}
