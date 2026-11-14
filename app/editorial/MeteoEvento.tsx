'use client'
import { useEffect, useState } from 'react'

// Previsão meteorológica de um evento, hora a hora, a partir do Open-Meteo (gratuito, sem chave).
// A previsão só existe até ~16 dias antes; até lá mostra um aviso. O estilo (.meteo…) está no CSS da página.

type Hora = { h: number; temp: number; chuva: number; codigo: number; vento: number }

// Códigos WMO → descrição curta
function descricao(c: number) {
  if (c === 0) return 'Céu limpo'
  if (c <= 2) return 'Pouco nublado'
  if (c === 3) return 'Nublado'
  if (c <= 48) return 'Nevoeiro'
  if (c <= 57) return 'Chuvisco'
  if (c <= 67) return 'Chuva'
  if (c <= 77) return 'Neve'
  if (c <= 82) return 'Aguaceiros'
  return 'Trovoada'
}

function Icone({ c, noite }: { c: number; noite: boolean }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const nuvem = <path {...p} d="M7 18h10a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 7 11a3.5 3.5 0 0 0 0 7z" />
  if (c === 0) return noite
    ? <svg viewBox="0 0 24 24"><path {...p} d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>
    : <svg viewBox="0 0 24 24"><circle {...p} cx="12" cy="12" r="4" /><path {...p} d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  if (c <= 48) return <svg viewBox="0 0 24 24">{nuvem}</svg>
  if (c <= 82) return <svg viewBox="0 0 24 24">{nuvem}<path {...p} d="M9 20.5l-1 2M13 20.5l-1 2M17 20.5l-1 2" /></svg>
  return <svg viewBox="0 0 24 24">{nuvem}<path {...p} d="M12.5 19l-2 3h3l-2 3" /></svg>
}

export default function MeteoEvento({ lat, lon, data, inicio, fim, por }: {
  lat: number; lon: number; data: string; inicio: number; fim: number; por?: number
}) {
  const [horas, setHoras] = useState<Hora[] | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
      + `&hourly=temperature_2m,precipitation_probability,weather_code,wind_speed_10m`
      + `&timezone=Europe%2FLisbon&start_date=${data}&end_date=${data}`
    fetch(url).then(r => r.ok ? r.json() : Promise.reject()).then(d => {
      const t: number[] = d?.hourly?.temperature_2m ?? []
      if (!t.length || t.every(v => v == null)) { setErro(true); return }
      const lista: Hora[] = []
      for (let h = inicio; h <= fim; h++) lista.push({
        h, temp: Math.round(t[h]), chuva: d.hourly.precipitation_probability?.[h] ?? 0,
        codigo: d.hourly.weather_code?.[h] ?? 0, vento: Math.round(d.hourly.wind_speed_10m?.[h] ?? 0),
      })
      setHoras(lista)
    }).catch(() => setErro(true))
  }, [lat, lon, data, inicio, fim])

  if (erro) return <p className="meteo-aviso">A previsão fica disponível nos 16 dias antes do evento. Voltem a espreitar mais perto da data.</p>
  if (!horas) return <p className="meteo-aviso">A carregar a previsão…</p>

  const temps = horas.map(x => x.temp)
  const chuvaMax = Math.max(...horas.map(x => x.chuva))
  const ventoMax = Math.max(...horas.map(x => x.vento))
  const principal = horas[Math.floor(horas.length / 2)]
  const conselho = chuvaMax >= 50 ? 'Tragam guarda-chuva: há boa probabilidade de chuva.'
    : chuvaMax >= 25 ? 'Pode cair alguma chuva. Um casaco leve resolve.'
    : 'Tudo indica uma tarde seca junto ao Tejo.'

  return (
    <div className="meteo">
      <div className="meteo-resumo">
        <span className="meteo-ic"><Icone c={principal.codigo} noite={false} /></span>
        <div>
          <p className="meteo-t">{Math.min(...temps)}° <em>a</em> {Math.max(...temps)}°</p>
          <p className="meteo-d">{descricao(principal.codigo)} · chuva até {chuvaMax}% · vento até {ventoMax} km/h</p>
          <p className="meteo-c">{conselho}</p>
        </div>
      </div>
      <div className="meteo-horas">
        {horas.map(x => (
          <div key={x.h} className={`meteo-h${por === x.h ? ' por' : ''}`}>
            <span className="hh">{String(x.h).padStart(2, '0')}h</span>
            <span className="ic"><Icone c={x.codigo} noite={x.h >= 18} /></span>
            <b>{x.temp}°</b>
            <span className="ch">{x.chuva}%</span>
            {por === x.h && <span className="tag">Pôr do sol</span>}
          </div>
        ))}
      </div>
      <p className="meteo-fonte">Previsão Open-Meteo, atualizada sempre que abrem a página.</p>
    </div>
  )
}
