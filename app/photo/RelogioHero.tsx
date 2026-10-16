'use client'

// Relógio grande do topo do /photo: horas finas a branco, minutos a dourado,
// e por baixo "Sábado | Fevereiro 06 2021" (hora de Lisboa).

import { useEffect, useState } from 'react'

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function agoraLisboa() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Lisbon', hour: '2-digit', minute: '2-digit', hour12: false,
      year: 'numeric', month: 'numeric', day: '2-digit', weekday: 'short',
    }).formatToParts(new Date()).map(x => [x.type, x.value])
  )
  const semana = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday)
  return {
    horas: p.hour === '24' ? '00' : p.hour,
    minutos: p.minute,
    data: `${DIAS[semana]} | ${MESES[Number(p.month) - 1]} ${p.day} ${p.year}`,
  }
}

export default function RelogioHero() {
  const [t, setT] = useState<ReturnType<typeof agoraLisboa> | null>(null)

  useEffect(() => {
    setT(agoraLisboa())
    const id = setInterval(() => setT(agoraLisboa()), 10_000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="select-none" suppressHydrationWarning>
      <p className="font-cond font-thin leading-[0.85] tracking-[0.02em] text-[88px] sm:text-[120px]">
        <span className="text-white/90">{t?.horas ?? '--'}</span>
        <span className="text-[#C9A84C]">{t?.minutos ?? '--'}</span>
      </p>
      <p className="font-cond font-light text-white/75 text-lg sm:text-xl tracking-[0.04em] mt-3 min-h-[1.75rem]">
        {t?.data ?? ''}
      </p>
    </div>
  )
}
