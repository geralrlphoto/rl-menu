'use client'

import { useState } from 'react'
import DataPT from '@/app/components/DataPT'

/* Disponibilidade da reunião de preparação (preparacao_slots), comum a todos os casais.
   Usada na ficha do evento e no /calendario. */

export type SlotPreparacao = { id: string; data: string; hora: string; evento_id: string | null; formato: string | null; cliente: string | null }

function fmtDia(iso: string) {
  return new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'UTC' })
}

export default function DisponibilidadePreparacao({ slots, recarregar, serveEste, dataCas }: {
  slots: SlotPreparacao[]
  recarregar: () => void
  // Na ficha: horários que este casal não vê ficam a cinzento
  serveEste?: (s: SlotPreparacao) => boolean
  dataCas?: string | null
}) {
  const [novaData, setNovaData] = useState('')
  const [novaHora, setNovaHora] = useState('')
  const [erro, setErro] = useState('')

  async function acrescentar() {
    setErro('')
    const d = await fetch('/api/preparacao/slots', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: novaData, hora: novaHora }),
    }).then(r => r.json()).catch(() => ({ error: 'Sem ligação' }))
    if (!d.ok) { setErro(d.error || 'Não foi possível acrescentar'); return }
    setNovaHora(''); recarregar()
  }
  async function remover(id: string) {
    await fetch(`/api/preparacao/slots?id=${id}`, { method: 'DELETE' }).catch(() => {})
    recarregar()
  }

  const porDia = slots.reduce<Record<string, SlotPreparacao[]>>((acc, s) => { (acc[s.data] ||= []).push(s); return acc }, {})
  const visivel = (s: SlotPreparacao) => !serveEste || serveEste(s)

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3 flex flex-col gap-3">
      <p className="text-white/40 text-[11px] leading-relaxed">
        Horários que qualquer casal pode escolher. Quando um casal marca, o horário fica ocupado para os outros.
        {dataCas && <> Cada casal só vê os horários <span className="text-white/70">antes do seu evento</span>; a cinzento estão os que este casal não vê.</>}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <DataPT value={novaData} onChange={setNovaData}
          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-gold" />
        <input type="time" value={novaHora} onChange={ev => setNovaHora(ev.target.value)} step={900}
          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-gold [color-scheme:dark]" />
        <button onClick={acrescentar} disabled={!novaData || !novaHora}
          className="px-3 py-1.5 rounded-lg bg-gold text-black text-[10px] font-bold tracking-[0.2em] uppercase disabled:opacity-40">+ Acrescentar</button>
        {erro && <span className="text-[11px] text-red-400">{erro}</span>}
      </div>
      {slots.length === 0 ? (
        <p className="text-white/30 text-xs">Ainda não há horários. Acrescenta a data e a hora acima.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {Object.entries(porDia).map(([dia, lista]) => (
            <div key={dia} className="flex items-start gap-3">
              <span className="w-24 shrink-0 text-[11px] text-white/50 capitalize pt-1">{fmtDia(dia)}</span>
              <div className="flex flex-wrap gap-1.5">
                {lista.map(s => s.evento_id ? (
                  <span key={s.id} title={`${s.cliente ?? ''} · ${s.formato ?? ''}`}
                    className="text-[11px] px-2 py-1 rounded-md border border-gold/40 bg-gold/10 text-gold">
                    {s.hora} · {(s.cliente ?? '').trim() || 'Reservado'}
                  </span>
                ) : (
                  <span key={s.id} title={visivel(s) ? undefined : 'Depois do evento deste casal (ou já passou): não aparece no link deles'}
                    className={`group text-[11px] pl-2 pr-1 py-1 rounded-md border flex items-center gap-1 ${visivel(s) ? 'border-white/12 text-white/75' : 'border-white/5 text-white/25 line-through decoration-white/20'}`}>
                    {s.hora}
                    <button onClick={() => remover(s.id)} aria-label="Remover horário" className="w-4 h-4 rounded text-white/30 hover:text-red-400">✕</button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
