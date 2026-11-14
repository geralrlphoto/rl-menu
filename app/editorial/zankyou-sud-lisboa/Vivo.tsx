'use client'
import { useEffect, useState } from 'react'

// Peças vivas do portal do evento: contagem decrescente e programa com o momento atual.
// O evento é em Lisboa a 16/11/2026 (hora de inverno, UTC+0).

const INICIO = Date.parse('2026-11-16T16:00:00Z')
const FIM = Date.parse('2026-11-16T22:00:00Z')

function useAgora(ms = 1000) {
  const [agora, setAgora] = useState<number | null>(null)
  useEffect(() => {
    setAgora(Date.now())
    const t = setInterval(() => setAgora(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return agora
}

export function Contagem() {
  const agora = useAgora(1000)
  if (agora === null) return <div className="cd" aria-hidden="true" />
  if (agora >= FIM) return <div className="cd"><p className="cd-msg">Obrigado a todos. Até à próxima edição.</p></div>
  if (agora >= INICIO) return <div className="cd"><p className="cd-msg"><span className="vivo" />A decorrer agora no SUD Lisboa</p></div>
  const s = Math.floor((INICIO - agora) / 1000)
  const partes: Array<[number, string]> = [[Math.floor(s / 86400), 'dias'], [Math.floor(s % 86400 / 3600), 'horas'], [Math.floor(s % 3600 / 60), 'min'], [s % 60, 'seg']]
  return (
    <div className="cd" aria-label="Tempo até ao início do evento">
      {partes.map(([v, l]) => (
        <div key={l}><b>{String(v).padStart(2, '0')}</b><span>{l}</span></div>
      ))}
    </div>
  )
}

type Bloco = { hora: string; fim: string; nome: string; texto: string }

const min = (h: string) => { const [a, b] = h.split(':').map(Number); return a * 60 + b }

export function ProgramaVivo({ blocos }: { blocos: Bloco[] }) {
  const agora = useAgora(30000)
  // Minutos desde a meia-noite em Lisboa no dia do evento (fora do dia: null)
  let m: number | null = null
  if (agora !== null) {
    const d = new Date(agora)
    const lx = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Lisbon' }))
    if (lx.getFullYear() === 2026 && lx.getMonth() === 10 && lx.getDate() === 16) m = lx.getHours() * 60 + lx.getMinutes()
  }
  const total = min(blocos[blocos.length - 1].fim) - min(blocos[0].hora)
  const progresso = m === null ? (agora !== null && agora > FIM ? 1 : 0) : Math.min(1, Math.max(0, (m - min(blocos[0].hora)) / total))

  return (
    <div className="pg">
      <div className="pg-barra" aria-hidden="true"><i style={{ height: `${progresso * 100}%` }} /></div>
      {blocos.map((b, i) => {
        const ini = min(b.hora), fim = min(b.fim)
        // No dia: concluído, a decorrer, ou o próximo a começar ("a seguir")
        const proximo = m === null ? -1 : blocos.findIndex(x => min(x.hora) > m!)
        let estado = ''
        if (m !== null) estado = m >= fim ? 'feito' : m >= ini ? 'agora' : i === proximo ? 'seguir' : ''
        else if (agora !== null && agora > FIM) estado = 'feito'
        return (
          <article key={b.hora} className={`pg-b rv ${estado}`}>
            <div className="pg-h"><b>{b.hora}</b><span>até às {b.fim}</span></div>
            <div className="pg-c">
              <div className="pg-top">
                <h3>{b.nome}</h3>
                {estado === 'agora' && <span className="chip agora"><i />A decorrer</span>}
                {estado === 'seguir' && <span className="chip">A seguir</span>}
                {estado === 'feito' && <span className="chip feito">Concluído</span>}
              </div>
              <p>{b.texto}</p>
            </div>
          </article>
        )
      })}
    </div>
  )
}
