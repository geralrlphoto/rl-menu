/**
 * GET /api/previsao-ipma?local=<local do evento>&data=YYYY-MM-DD
 *
 * Previsão do IPMA para o dia do evento (secção PREVISÃO METEOROLÓGICA do
 * briefing). O concelho é tirado do texto do local ("Quinta dos Plátanos,
 * Palmela" → Palmela). O IPMA só tem previsão para ~10 dias à frente.
 *
 * Inclui ainda o pôr do sol e a luz dourada (calculados, sem serviço externo)
 * e os avisos do IPMA (amarelo/laranja/vermelho) para o distrito no dia.
 *
 * Lê do IPMA no servidor, com cache, sem passar pelo Supabase.
 */

import { NextRequest, NextResponse } from 'next/server'

const IPMA = 'https://api.ipma.pt'

type Local = { globalIdLocal: number; local: string; latitude: string; longitude: string; idRegiao: number; idAreaAviso: string }
type Aviso = { awarenessTypeName: string; awarenessLevelID: string; idAreaAviso: string; startTime: string; endTime: string; text: string }
type Prev = {
  dataPrev: string; idPeriodo: number; idTipoTempo: number; probabilidadePrecipita: string
  ddVento: string; tMin?: string; tMax?: string; tMed?: string; iUv?: string; ffVento?: string; idFfxVento?: number
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/* Quintas habituais cujo local costuma vir sem concelho (confirmado pelo Rui) */
const QUINTAS: Array<[string, string]> = [
  ['quinta do david', 'Palmela'], ['quinta david', 'Palmela'], ['lagus', 'Palmela'],
  ['algeruz', 'Palmela'], ['quinta do corvo', 'Palmela'], ['quinta das riscas', 'Palmela'],
  ['quinta du alecrim', 'Palmela'], ['quinta dos platanos', 'Palmela'], ['colina do romao', 'Braga'],
]

/* Concelho do IPMA cujo nome aparece no local (o nome mais comprido ganha: "Vila Nova de Gaia" antes de "Gaia");
   se o local não disser o concelho, procura nas quintas habituais */
function concelhoDe(local: string, locais: Local[]): Local | null {
  const limpa = (s: string) => norm(s).replace(/[^a-z0-9]+/g, ' ').trim()
  const txt = ` ${limpa(local)} `
  let melhor: Local | null = null
  for (const l of locais) {
    const nome = limpa(l.local)
    if (nome && txt.includes(` ${nome} `) && (!melhor || nome.length > limpa(melhor.local).length)) melhor = l
  }
  if (melhor) return melhor
  const quinta = QUINTAS.find(([k]) => txt.includes(` ${k} `))
  return quinta ? locais.find(l => limpa(l.local) === limpa(quinta[1])) ?? null : null
}

/* Hora UTC (Date) em que o sol desce até `altitude` graus nesse dia (equação do nascer/pôr do sol) */
function solDesceA(data: string, lat: number, lon: number, altitude: number): Date | null {
  const rad = Math.PI / 180
  const [y, m, d] = data.split('-').map(Number)
  const n = Date.UTC(y, m - 1, d, 12) / 86400000 + 2440587.5 - 2451545 + 0.0008
  const J = n - lon / 360
  const M = (357.5291 + 0.98560028 * J) % 360
  const C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad)
  const L = (M + C + 180 + 102.9372) % 360
  const transito = 2451545 + J + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad)
  const sinDec = Math.sin(L * rad) * Math.sin(23.4397 * rad)
  const cosDec = Math.cos(Math.asin(sinDec))
  const cosH = (Math.sin(altitude * rad) - Math.sin(lat * rad) * sinDec) / (Math.cos(lat * rad) * cosDec)
  if (cosH < -1 || cosH > 1) return null
  return new Date((transito + Math.acos(cosH) / rad / 360 - 2440587.5) * 86400000)
}

/* Pôr do sol e luz dourada (sol entre 6° e o horizonte) na hora local */
function sol(data: string, c: Local) {
  const fuso = c.idRegiao === 3 ? 'Atlantic/Azores' : c.idRegiao === 2 ? 'Atlantic/Madeira' : 'Europe/Lisbon'
  const hm = (dt: Date | null) => dt ? dt.toLocaleTimeString('pt-PT', { timeZone: fuso, hour: '2-digit', minute: '2-digit' }) : null
  const lat = Number(c.latitude), lon = Number(c.longitude)
  return { porDoSol: hm(solDesceA(data, lat, lon, -0.833)), luzDourada: hm(solDesceA(data, lat, lon, 6)) }
}

/* Avisos do IPMA (sem os verdes) para a área do concelho que tocam no dia do evento */
async function avisosDe(data: string, c: Local) {
  try {
    const todos: Aviso[] = await fetch(`${IPMA}/open-data/forecast/warnings/warnings_www.json`, { next: { revalidate: 1800 } }).then(r => r.json())
    return todos
      .filter(a => a.idAreaAviso === c.idAreaAviso && a.awarenessLevelID !== 'green')
      .filter(a => a.startTime < `${data}T23:59:59` && a.endTime > `${data}T00:00:00`)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map(a => ({ nivel: a.awarenessLevelID, tipo: a.awarenessTypeName, texto: a.text, inicio: a.startTime, fim: a.endTime }))
  } catch { return [] }
}

/* O IPMA usa -99 para "sem informação" */
const num = (v?: string) => (v == null || v === '' || Number(v) <= -99 ? null : Math.round(Number(v)))

export async function GET(req: NextRequest) {
  const local = req.nextUrl.searchParams.get('local')?.trim() ?? ''
  const data = req.nextUrl.searchParams.get('data')?.slice(0, 10) ?? ''
  if (!local || !/^\d{4}-\d{2}-\d{2}$/.test(data)) return NextResponse.json({ estado: 'sem-dados' })

  const hoje = new Date().toISOString().slice(0, 10)
  if (data < hoje) return NextResponse.json({ estado: 'passado' })

  try {
    const locais: Local[] = await fetch(`${IPMA}/public-data/forecast/locations.json`, { next: { revalidate: 86400 } }).then(r => r.json())
    const c = concelhoDe(local, locais)
    if (!c) return NextResponse.json({ estado: 'sem-local' })

    const [prev, avisos]: [Prev[], Awaited<ReturnType<typeof avisosDe>>] = await Promise.all([
      fetch(`${IPMA}/public-data/forecast/aggregate/${c.globalIdLocal}.json`, { next: { revalidate: 3600 } }).then(r => r.json()),
      avisosDe(data, c),
    ])
    const doDia = prev.filter(p => p.dataPrev.startsWith(data))
    const dia = doDia.find(p => p.idPeriodo === 24)
    if (!dia) {
      const ultimo = prev.map(p => p.dataPrev.slice(0, 10)).sort().pop() ?? null
      return NextResponse.json({ estado: 'cedo', concelho: c.local, ate: ultimo, sol: sol(data, c) }, { headers: { 'Cache-Control': 's-maxage=3600' } })
    }

    // Horas (das 6h às 23h): horárias nos dias mais próximos, de 3 em 3 horas nos outros
    const deDia = (per: number) => doDia.filter(p => p.idPeriodo === per && Number(p.dataPrev.slice(11, 13)) >= 6)
    const horarias = deDia(1).filter(p => Number(p.dataPrev.slice(11, 13)) % 2 === 0)
    const horas = (horarias.length >= deDia(3).length ? horarias : deDia(3))
      .map(p => ({ hora: p.dataPrev.slice(11, 13), temp: num(p.tMed), tipo: p.idTipoTempo, chuva: num(p.probabilidadePrecipita), vento: p.ddVento }))

    return NextResponse.json({
      estado: 'ok',
      concelho: c.local,
      dia: {
        tMin: num(dia.tMin), tMax: num(dia.tMax), tipo: dia.idTipoTempo,
        chuva: num(dia.probabilidadePrecipita), vento: dia.ddVento, ventoClasse: dia.idFfxVento ?? null,
        uv: dia.iUv ? Number(dia.iUv) : null,
      },
      horas,
      sol: sol(data, c),
      avisos,
    }, { headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' } })
  } catch {
    return NextResponse.json({ estado: 'erro' })
  }
}
