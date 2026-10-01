/**
 * GET /api/previsao-ipma?local=<local do evento>&data=YYYY-MM-DD
 *
 * Previsão do IPMA para o dia do evento (secção PREVISÃO METEOROLÓGICA do
 * briefing). O concelho é tirado do texto do local ("Quinta dos Plátanos,
 * Palmela" → Palmela). O IPMA só tem previsão para ~10 dias à frente.
 *
 * Lê do IPMA no servidor, com cache, sem passar pelo Supabase.
 */

import { NextRequest, NextResponse } from 'next/server'

const IPMA = 'https://api.ipma.pt'

type Local = { globalIdLocal: number; local: string }
type Prev = {
  dataPrev: string; idPeriodo: number; idTipoTempo: number; probabilidadePrecipita: string
  ddVento: string; tMin?: string; tMax?: string; tMed?: string; iUv?: string; ffVento?: string; idFfxVento?: number
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/* Concelho do IPMA cujo nome aparece no local (o nome mais comprido ganha: "Vila Nova de Gaia" antes de "Gaia") */
function concelhoDe(local: string, locais: Local[]): Local | null {
  const txt = ` ${norm(local).replace(/[^a-z0-9]+/g, ' ')} `
  let melhor: Local | null = null
  for (const l of locais) {
    const nome = norm(l.local).replace(/[^a-z0-9]+/g, ' ').trim()
    if (nome && txt.includes(` ${nome} `) && (!melhor || nome.length > norm(melhor.local).length)) melhor = l
  }
  return melhor
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

    const prev: Prev[] = await fetch(`${IPMA}/public-data/forecast/aggregate/${c.globalIdLocal}.json`, { next: { revalidate: 3600 } }).then(r => r.json())
    const doDia = prev.filter(p => p.dataPrev.startsWith(data))
    const dia = doDia.find(p => p.idPeriodo === 24)
    if (!dia) {
      const ultimo = prev.map(p => p.dataPrev.slice(0, 10)).sort().pop() ?? null
      return NextResponse.json({ estado: 'cedo', concelho: c.local, ate: ultimo }, { headers: { 'Cache-Control': 's-maxage=3600' } })
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
    }, { headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=3600' } })
  } catch {
    return NextResponse.json({ estado: 'erro' })
  }
}
