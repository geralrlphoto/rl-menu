import { NextResponse } from 'next/server'
import { exigeAdmin } from '@/lib/api-guard'
import { sbAdmin } from '@/lib/preparacao'

export const dynamic = 'force-dynamic'

/* Botão Atualizar da página /armazenamento.
   POST { disco } → deixa o pedido; o robô do PC lê o disco e grava a lista nova.
   GET            → estado de cada disco (sem a lista), para a página saber quando acabou. */

export async function GET(req: Request) {
  const erro = exigeAdmin(req)
  if (erro) return erro
  const { data, error } = await sbAdmin().from('armazenamento_discos').select('disco, atualizado, pedido_em, ligado, visto_em')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ discos: data ?? [] })
}

export async function POST(req: Request) {
  const erro = exigeAdmin(req)
  if (erro) return erro
  const { disco } = await req.json().catch(() => ({}))
  if (!disco) return NextResponse.json({ error: 'falta o disco' }, { status: 400 })
  const { error } = await sbAdmin().from('armazenamento_discos').update({ pedido_em: new Date().toISOString() }).eq('disco', String(disco))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
