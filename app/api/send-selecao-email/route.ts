import { NextRequest, NextResponse } from 'next/server'
import { resolveEmailNoiva } from '../_lib/emailNoiva'
import { enviarEmailEntrega } from '@/lib/entregaEmail'
import { ehGaleriaWfolio } from '@/lib/wfolioGaleria'

export async function POST(req: NextRequest) {
  const { email_noiva, nome_noiva, nome_noivo, url, referencia } = await req.json().catch(() => ({}))

  const resolvedEmail = await resolveEmailNoiva(email_noiva, referencia)
  if (!resolvedEmail) {
    return NextResponse.json({ error: 'Email da noiva não encontrado. Preenche o email na ficha do evento.' }, { status: 400 })
  }

  // Galeria do Wfolio: a escolha faz-se dentro do portal, por isso o botão leva ao portal
  const destino = ehGaleriaWfolio(url) ? null : url
  const r = await enviarEmailEntrega('selecao', { email: resolvedEmail, nome_noiva, nome_noivo, url: destino, referencia })
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 500 })
  return NextResponse.json({ ok: true, id: r.id })
}
