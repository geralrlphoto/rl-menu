import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// «22 / 08 / 2026» ou «22/08/2026» ou «2026-08-22» → «2026-08-22»
function isoData(v: string): string | null {
  const s = String(v || '').trim()
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  m = s.match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return null
}

// Nome comparável: sem acentos, sem conectores («e», «&», «+», «/») e só letras/dígitos.
const norm = (s: any) => String(s ?? '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/\s+e\s+/g, ' ').replace(/[&+/]/g, ' ')
  .replace(/[^a-z0-9]/g, '')

// GET ?data=DD / MM / AAAA &noivos=...  → numeração das fotos desse casamento,
// lida da pasta local pelo robô e guardada na ficha do evento. Serve para o
// ticket do dia só aceitar números que existam mesmo nas fotos do casamento.
export async function GET(req: NextRequest) {
  const data = isoData(req.nextUrl.searchParams.get('data') || '')
  const noivos = (req.nextUrl.searchParams.get('noivos') || '').trim()
  if (!data) return NextResponse.json({ encontrado: false, motivo: 'data inválida' })

  const { data: evs, error } = await db()
    .from('eventos_2026')
    .select('cliente, numeros_fotos, numeros_fotos_total, numeros_fotos_estado')
    .eq('data_evento', data)
    .limit(20)
  if (error) return NextResponse.json({ encontrado: false, motivo: error.message })
  if (!evs || evs.length === 0) return NextResponse.json({ encontrado: false })

  // Um casamento por data é o caso normal. Havendo mais do que um, só se
  // valida se o nome dos noivos bater certo — validar contra a lista do
  // casamento errado seria pior do que não validar.
  let ev = evs[0]
  if (evs.length > 1) {
    const alvo = norm(noivos)
    const match = alvo ? evs.filter(e => {
      const c = norm(e.cliente)
      return !!c && (c.includes(alvo) || alvo.includes(c))
    }) : []
    if (match.length !== 1) return NextResponse.json({ encontrado: false, motivo: 'mais do que um casamento nessa data' })
    ev = match[0]
  }

  const numeros = String(ev.numeros_fotos ?? '').split(/[,\s]+/).map(s => s.trim()).filter(Boolean)
  return NextResponse.json({
    encontrado: true,
    cliente: ev.cliente ?? '',
    estado: ev.numeros_fotos_estado ?? '',
    total: ev.numeros_fotos_total ?? numeros.length,
    numeros,
  })
}
