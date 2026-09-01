import { NextResponse } from 'next/server'
import { clienteAdmin } from '@/lib/podcast/dados'
import { validarLead, pareceSpam, excedeuLimite, ipDoPedido } from '@/lib/podcast/validacao'
import { avisarLead } from '@/lib/podcast/email'

/* ============================================================
   POST /api/podcast/lead
   Recebe o formulário "Está a planear o seu casamento?".
   A escrita é sempre aqui, no servidor, com a service role. O cliente
   nunca toca no Supabase: as tabelas de leads não têm política de
   leitura nem de escrita para a chave anónima.
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

  // Responde como se tivesse corrido bem: um robô não deve aprender nada.
  if (pareceSpam(body)) return NextResponse.json({ ok: true })

  const v = validarLead(body)
  if (!v.ok) return NextResponse.json({ ok: false, erros: v.erros }, { status: 400 })

  const { error } = await clienteAdmin().from('podcast_leads').insert(v.dados!)
  if (error) {
    console.error('[podcast/lead]', error.message)
    return NextResponse.json(
      { ok: false, erro: 'Não conseguimos guardar o teu contacto. Tenta outra vez.' },
      { status: 500 },
    )
  }

  // O nome do episódio de origem, só para o email ser legível.
  let episodio: string | null = null
  if (v.dados!.origem_episodio_id) {
    const { data } = await clienteAdmin()
      .from('podcast_episodios')
      .select('numero, titulo')
      .eq('id', v.dados!.origem_episodio_id!)
      .maybeSingle()
    if (data) episodio = `${String(data.numero).padStart(2, '0')} — ${data.titulo}`
  }

  await avisarLead({ ...v.dados!, episodio })

  return NextResponse.json({ ok: true })
}
