'use client'

import { useState } from 'react'
import DataPT from '@/app/components/DataPT'

/* Disponibilidade da reunião de preparação (preparacao_slots), comum a todos os casais.
   Usada na ficha do evento, no CRM e no /calendario.
   Escolhe-se o dia e marcam-se as horas com um clique (manhã 10h–12h, tarde 16h–19h);
   a lista de todos os horários abre num dropdown, para não ocupar a página. */

export type SlotPreparacao = { id: string; data: string; hora: string; evento_id: string | null; formato: string | null; cliente: string | null }

const HORAS = [
  { periodo: 'Manhã', horas: ['10:00', '11:00', '12:00'] },
  { periodo: 'Tarde', horas: ['16:00', '17:00', '18:00', '19:00'] },
]

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
  const [dia, setDia] = useState('')
  const [aGravar, setAGravar] = useState<string | null>(null)
  const [erro, setErro] = useState('')
  const [listaAberta, setListaAberta] = useState(false)

  // Um clique numa hora: marca-a (se ainda não existe) ou desmarca-a (se está livre)
  async function alternar(hora: string) {
    if (!dia || aGravar) return
    setErro('')
    const existente = slots.find(s => s.data === dia && s.hora.slice(0, 5) === hora)
    if (existente?.evento_id) return
    setAGravar(hora)
    const d = existente
      ? await fetch(`/api/preparacao/slots?id=${existente.id}`, { method: 'DELETE' }).then(r => r.json()).catch(() => ({ error: 'Sem ligação' }))
      : await fetch('/api/preparacao/slots', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: dia, hora }),
        }).then(r => r.json()).catch(() => ({ error: 'Sem ligação' }))
    if (!d.ok) setErro(d.error || 'Não foi possível gravar')
    await recarregar()
    setAGravar(null)
  }
  async function remover(id: string) {
    await fetch(`/api/preparacao/slots?id=${id}`, { method: 'DELETE' }).catch(() => {})
    recarregar()
  }

  const porDia = slots.reduce<Record<string, SlotPreparacao[]>>((acc, s) => { (acc[s.data] ||= []).push(s); return acc }, {})
  const visivel = (s: SlotPreparacao) => !serveEste || serveEste(s)
  const livres = slots.filter(s => !s.evento_id).length
  const reservados = slots.length - livres

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 p-3 flex flex-col gap-3">
      <p className="text-white/40 text-[11px] leading-relaxed">
        Escolhe o dia e clica nas horas para as marcar (outro clique desmarca). Quando um casal marca, o horário fica ocupado para os outros.
        {dataCas && <> Cada casal só vê os horários <span className="text-white/70">antes do seu evento</span>.</>}
      </p>

      {/* Dia + horas por clique */}
      <div className="flex flex-wrap items-start gap-4">
        <DataPT value={dia} onChange={setDia}
          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-gold" />
        {HORAS.map(g => (
          <div key={g.periodo} className="flex items-center gap-1.5">
            <span className="text-[10px] tracking-[0.2em] uppercase text-white/35 mr-1">{g.periodo}</span>
            {g.horas.map(h => {
              const s = dia ? slots.find(x => x.data === dia && x.hora.slice(0, 5) === h) : undefined
              const reservado = !!s?.evento_id
              const marcado = !!s && !reservado
              return (
                <button key={h} type="button" onClick={() => alternar(h)}
                  disabled={!dia || reservado || !!aGravar}
                  title={!dia ? 'Escolhe primeiro o dia' : reservado ? `Reservado por ${(s?.cliente ?? '').trim() || 'um casal'}` : marcado ? 'Clica para desmarcar' : 'Clica para marcar'}
                  className={`min-w-[52px] px-2 py-1.5 rounded-lg border text-[12px] font-semibold transition-all disabled:cursor-not-allowed ${
                    reservado ? 'border-gold/40 bg-gold/10 text-gold/80'
                    : marcado ? 'border-gold bg-gold text-black hover:brightness-110'
                    : 'border-white/12 text-white/60 hover:border-gold/60 hover:text-white disabled:opacity-35 disabled:hover:border-white/12 disabled:hover:text-white/60'
                  } ${aGravar === h ? 'animate-pulse' : ''}`}>
                  {marcado && '✓ '}{h.slice(0, 2)}h
                </button>
              )
            })}
          </div>
        ))}
      </div>
      {!dia && <p className="text-white/30 text-[11px]">Escolhe primeiro o dia para marcar as horas.</p>}
      {erro && <p className="text-[11px] text-red-400">{erro}</p>}

      {/* Todos os horários: fechado num dropdown */}
      <div className="border-t border-white/[0.07] pt-2">
        <button type="button" onClick={() => setListaAberta(a => !a)} aria-expanded={listaAberta}
          className="w-full flex items-center justify-between gap-3 text-left py-1 group">
          <span className="text-[11px] tracking-[0.2em] uppercase text-white/60 group-hover:text-white">
            Ver todos os horários
            <span className="ml-2 normal-case tracking-normal text-white/35">
              {slots.length === 0 ? 'nenhum ainda' : `${livres} ${livres === 1 ? 'livre' : 'livres'} · ${reservados} ${reservados === 1 ? 'reservado' : 'reservados'}`}
            </span>
          </span>
          <span className={`text-white/40 text-xs transition-transform ${listaAberta ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {listaAberta && (
          slots.length === 0 ? (
            <p className="text-white/30 text-xs mt-2">Ainda não há horários.</p>
          ) : (
            <div className="flex flex-col gap-2 mt-2">
              {Object.entries(porDia).map(([d, lista]) => (
                <div key={d} className="flex items-start gap-3">
                  <button type="button" onClick={() => setDia(d)} title="Abrir este dia para marcar horas"
                    className={`w-24 shrink-0 text-left text-[11px] capitalize pt-1 hover:text-gold ${d === dia ? 'text-gold' : 'text-white/50'}`}>{fmtDia(d)}</button>
                  <div className="flex flex-wrap gap-1.5">
                    {lista.map(s => s.evento_id ? (
                      <span key={s.id} title={`${s.cliente ?? ''} · ${s.formato ?? ''}`}
                        className="text-[11px] px-2 py-1 rounded-md border border-gold/40 bg-gold/10 text-gold">
                        {s.hora.slice(0, 5)} · {(s.cliente ?? '').trim() || 'Reservado'}
                      </span>
                    ) : (
                      <span key={s.id} title={visivel(s) ? undefined : 'Depois do evento deste casal (ou já passou): não aparece no link deles'}
                        className={`group text-[11px] pl-2 pr-1 py-1 rounded-md border flex items-center gap-1 ${visivel(s) ? 'border-white/12 text-white/75' : 'border-white/5 text-white/25 line-through decoration-white/20'}`}>
                        {s.hora.slice(0, 5)}
                        <button onClick={() => remover(s.id)} aria-label="Remover horário" className="w-4 h-4 rounded text-white/30 hover:text-red-400">✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
