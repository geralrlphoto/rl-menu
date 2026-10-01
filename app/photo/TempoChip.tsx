'use client'

// Linha pequena com o tempo previsto no cartão de cada casamento da agenda do /photo.
// Usa a mesma rota do quadro do briefing; só pede para casamentos até 10 dias à frente.

import { useEffect, useState } from 'react'

const COR_AVISO: Record<string, string> = { yellow: '#facc15', orange: '#fb923c', red: '#ef4444' }
const NOME_AVISO: Record<string, string> = { yellow: 'amarelo', orange: 'laranja', red: 'vermelho' }

type Prev = {
  estado: string
  dia?: { tMin: number | null; tMax: number | null; tipo: number; chuva: number | null }
  avisos?: Array<{ nivel: string; tipo: string }>
}

export default function TempoChip({ local, data }: { local?: string | null; data?: string | null }) {
  const [p, setP] = useState<Prev | null>(null)

  useEffect(() => {
    if (!local || !data) return
    const dias = (new Date(`${data.slice(0, 10)}T12:00:00`).getTime() - Date.now()) / 86400000
    if (dias > 10 || dias < -1) return
    fetch(`/api/previsao-ipma?local=${encodeURIComponent(local)}&data=${encodeURIComponent(data.slice(0, 10))}`, { cache: 'no-store' })
      .then(r => r.json()).then(setP).catch(() => {})
  }, [local, data])

  if (p?.estado !== 'ok' || !p.dia) return null
  const { dia } = p
  const pior = p.avisos?.find(a => a.nivel === 'red') ?? p.avisos?.find(a => a.nivel === 'orange') ?? p.avisos?.[0]
  const titulo = [
    `${dia.tMin}° a ${dia.tMax}°`,
    dia.chuva != null ? `chuva ${dia.chuva}%` : '',
    pior ? `aviso ${NOME_AVISO[pior.nivel] ?? ''} (${pior.tipo.toLowerCase()})` : '',
  ].filter(Boolean).join(' · ')

  return (
    <p className="mt-1 flex items-center gap-1 text-[9px] text-white/55" title={titulo}>
      <img src={`https://www.ipma.pt/bin/icons/svg/weather/w_ic_d_${String(dia.tipo).padStart(2, '0')}anim.svg`} alt="" className="w-4 h-4 -my-0.5" />
      <span>{dia.tMin}°/{dia.tMax}°</span>
      {dia.chuva != null && dia.chuva > 0 && <span className="text-sky-300/70">{dia.chuva}%</span>}
      {pior && <span className="ml-0.5 inline-block w-1.5 h-1.5 rounded-full" style={{ background: COR_AVISO[pior.nivel] ?? '#facc15' }} />}
    </p>
  )
}
