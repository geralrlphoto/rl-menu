import { NextResponse } from 'next/server'
import { clienteAdmin } from '@/lib/podcast/dados'
import { validarCandidatura, pareceSpam, excedeuLimite, ipDoPedido } from '@/lib/podcast/validacao'
import { avisarCandidatura } from '@/lib/podcast/email'

/* ============================================================
   POST /api/podcast/candidatura
   Recebe as candidaturas a convidado de /podcast/convidados.
   Mesmas regras do lead: escrita só aqui, com a service role.
   ============================================================ */

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const ip = ipDoPedido(req)
  if (excedeuLimite(ip)) {
    return NextResponse.json(
      { ok: false, erro: 'Recebemos vários pedidos seguidos. Tenta daqui a pouco.' },
      { status: 429 },
    )
  }

  const body = await req.json().catch(() => ({}))

  if (pareceSpam(body)) return NextResponse.json({ ok: true })

  const v = validarCandidatura(body)
  if (!v.ok) return NextResponse.json({ ok: false, erros: v.erros }, { status: 400 })

  const { error } = await clienteAdmin().from('podcast_candidaturas').insert(v.dados!)
  if (error) {
    console.error('[podcast/candidatura]', error.message)
    return NextResponse.json(
      { ok: false, erro: 'Não conseguimos registar a tua candidatura. Tenta outra vez.' },
      { status: 500 },
    )
  }

  await avisarCandidatura(v.dados!)

  return NextResponse.json({ ok: true })
}
