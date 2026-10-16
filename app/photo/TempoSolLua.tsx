'use client'

// Tempo de agora em Palmela, para o canto superior direito do /photo.
// O arco mostra onde vai o sol (do nascer ao pôr) ou a lua (do pôr ao nascer seguinte).
// Dados do Open-Meteo, pedidos pelo browser (sem chave e sem passar pelo Supabase).

import { useEffect, useState } from 'react'

const LAT = 38.569, LON = -8.901
const URL_TEMPO = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}`
  + '&current=temperature_2m,weather_code,is_day,precipitation_probability'
  + '&daily=sunrise,sunset&past_days=1&forecast_days=2&timezone=GMT'
const DOURADO = '#C9A84C'

type Tempo = { temp: number; codigo: number; dia: boolean; chuva: number | null; fracao: number }

// Horas pedidas em GMT, por isso basta acrescentar o Z
const instante = (iso: string) => new Date(iso + ':00Z').getTime()

function posicao(nasc: string[], por: string[], agora: Date) {
  const t = agora.getTime()
  const [, srHoje, srAmanha] = nasc.map(instante)
  const [ssOntem, ssHoje] = por.map(instante)
  if (t >= srHoje && t < ssHoje) return { dia: true, fracao: (t - srHoje) / (ssHoje - srHoje) }
  if (t >= ssHoje) return { dia: false, fracao: (t - ssHoje) / (srAmanha - ssHoje) }
  return { dia: false, fracao: (t - ssOntem) / (srHoje - ssOntem) }
}

async function carregar(): Promise<Tempo | null> {
  const r = await fetch(URL_TEMPO, { cache: 'no-store' }).then(x => x.json()).catch(() => null)
  if (!r?.current || !r?.daily) return null
  const agora = new Date()
  const pos = posicao(r.daily.sunrise, r.daily.sunset, agora)
  return {
    temp: Math.round(r.current.temperature_2m),
    codigo: r.current.weather_code,
    dia: pos.dia,
    chuva: r.current.precipitation_probability ?? null,
    fracao: Math.min(1, Math.max(0, pos.fracao)),
  }
}

// Ícone de linha a dourado conforme o código WMO
function Icone({ codigo, dia }: { codigo: number; dia: boolean }) {
  const astro = dia
    ? <g><circle cx="15" cy="13" r="5" /><path d="M15 3.5v2M15 20.5v2M5.5 13h2M22.5 13h2M8.3 6.3l1.4 1.4M20.3 18.3l1.4 1.4M8.3 19.7l1.4-1.4M20.3 7.7l1.4-1.4" /></g>
    : <path d="M22 15.5A7.5 7.5 0 0 1 12.5 6a7.5 7.5 0 1 0 9.5 9.5z" />
  const nuvem = <path d="M9 30h17a5.5 5.5 0 0 0 .6-11 7.5 7.5 0 0 0-14.3 1.9A4.6 4.6 0 0 0 9 30z" fill="#0b0b0b" />
  const chuva = <path d="M12 33l-1.5 3M18 33l-1.5 3M24 33l-1.5 3" />
  const raio = <path d="M19 30l-3 4.5h4l-3 4.5" />
  const nevoeiro = <path d="M6 22h22M8 26h18M10 30h14" />
  let corpo
  if (codigo === 0) corpo = <g transform="translate(3 4)">{astro}</g>
  else if (codigo <= 3) corpo = <>{astro}{nuvem}</>
  else if (codigo <= 48) corpo = nevoeiro
  else if (codigo >= 95) corpo = <>{nuvem}{raio}</>
  else if (codigo >= 51) corpo = <>{nuvem}{chuva}</>
  else corpo = nuvem
  return (
    <svg viewBox="0 0 34 40" className="w-11 h-12" fill="none" stroke={DOURADO} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {corpo}
    </svg>
  )
}

export default function TempoSolLua() {
  const [t, setT] = useState<Tempo | null>(null)

  useEffect(() => {
    let vivo = true
    const atualizar = () => { if (!document.hidden) carregar().then(x => { if (vivo && x) setT(x) }) }
    atualizar()
    const id = setInterval(atualizar, 15 * 60_000)
    return () => { vivo = false; clearInterval(id) }
  }, [])

  if (!t) return null

  // Arco de 180°: esquerda = nascer (ou pôr do sol, à noite), direita = pôr (ou nascer)
  const R = 92, CX = 110, CY = 104
  const ang = Math.PI * (1 - t.fracao)
  const x = CX + R * Math.cos(ang), y = CY - R * Math.sin(ang)
  const arco = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`
  const feito = `M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`

  return (
    <div className="relative w-[220px] h-[124px] select-none"
      title={`Palmela · ${t.temp}°${t.chuva != null ? ` · chuva ${t.chuva}%` : ''} · ${t.dia ? 'de dia' : 'de noite'}`}>
      <svg viewBox="0 0 220 124" className="absolute inset-0 w-full h-full overflow-visible" aria-hidden>
        <defs>
          <radialGradient id="tempo-sol">
            <stop offset="0%" stopColor="#ffe9a8" />
            <stop offset="100%" stopColor={DOURADO} />
          </radialGradient>
          <radialGradient id="tempo-lua" cx="35%" cy="35%">
            <stop offset="0%" stopColor="#e5e5e5" />
            <stop offset="100%" stopColor="#7a7a7a" />
          </radialGradient>
        </defs>
        <path d={arco} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        <path d={feito} fill="none" stroke={t.dia ? DOURADO : 'rgba(255,255,255,0.75)'} strokeWidth="2" strokeLinecap="round" />
        {/* Pontos fixos do nascer e do pôr */}
        <circle cx={CX - R} cy={CY} r="2" fill="rgba(255,255,255,0.45)" />
        <circle cx={CX + R} cy={CY} r="2" fill="rgba(255,255,255,0.45)" />
        {t.dia ? (
          <>
            <circle cx={x} cy={y} r="16" fill={DOURADO} opacity="0.18" />
            <circle cx={x} cy={y} r="8" fill="url(#tempo-sol)" />
          </>
        ) : (
          <>
            <circle cx={x} cy={y} r="13" fill="#fff" opacity="0.07" />
            <circle cx={x} cy={y} r="8" fill="url(#tempo-lua)" />
          </>
        )}
      </svg>

      <div className="absolute inset-x-0 bottom-1 flex items-center justify-center gap-3">
        <Icone codigo={t.codigo} dia={t.dia} />
        <span className="w-px h-11 bg-white/50" />
        <div className="font-cond leading-none">
          <p className="font-light text-[34px] text-[#C9A84C]">{t.temp}°</p>
          {t.chuva != null && (
            <p className="flex items-center gap-1 text-[14px] text-white/80 mt-1">
              <svg viewBox="0 0 10 14" className="w-2 h-3 -rotate-12" fill="currentColor" aria-hidden><path d="M5 0C5 0 0 6 0 9a5 5 0 0 0 10 0C10 6 5 0 5 0z" /></svg>
              {t.chuva}%
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
