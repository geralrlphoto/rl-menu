import { NextResponse } from 'next/server'
import { sbAdmin } from '@/lib/preparacao'
import { ehAdmin } from '@/lib/api-guard'

// Público (/rollup): conta uma entrada por visita (o cliente só chama uma vez por sessão).
// As visitas do admin (cookie rl_auth) não contam. O total aparece em /formularios.

export async function POST(req: Request) {
  if (ehAdmin(req)) return NextResponse.json({ ok: true, contou: false })
  const { error } = await sbAdmin().from('rollup_entradas').insert({})
  if (error) return NextResponse.json({ ok: false }, { status: 500 })
  return NextResponse.json({ ok: true, contou: true })
}
