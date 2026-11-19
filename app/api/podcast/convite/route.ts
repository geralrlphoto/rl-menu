import { NextResponse } from 'next/server'
import { clienteAdmin } from '@/lib/podcast/dados'
import { excedeuLimite, ipDoPedido } from '@/lib/podcast/validacao'
import { avisarRespostaConvite } from '@/lib/podcast/email'

/* ============================================================
   POST /api/podcast/convite  { token, resposta: 'aceitou' | 'recusou' }
   Resposta pública ao convite pessoal (/podcast/convite/<token>).
   Só mexe na linha desse token, e só na resposta. Avisa o Rui por
   email (falhar o email não falha a resposta).
   ============================================================ */

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  if (excedeuLimite(ipDoPedido(req))) {
    return NextResponse.json({ ok: false, erro: 'Recebemos vários pedidos seguidos. Tente daqui a pouco.' }, { status: 429 })
  }
  const { token, resposta } = await req.json().catch(() => ({} as any))
  if (typeof token !== 'string' || !/^[a-f0-9]{24}$/.test(token) || !['aceitou', 'recusou'].includes(resposta)) {
    return NextResponse.json({ ok: false, erro: 'Pedido inválido.' }, { status: 400 })
  }

  const sb = clienteAdmin()
  const { data, error } = await sb
    .from('podcast_convites')
    .update({ resposta, resposta_em: new Date().toISOString() })
    .eq('token', token)
    .select('nome, podcast_episodios (numero, titulo)')
    .maybeSingle()

  if (error) return NextResponse.json({ ok: false, erro: 'Não foi possível registar. Tente outra vez.' }, { status: 500 })
  if (!data) return NextResponse.json({ ok: false, erro: 'Convite não encontrado.' }, { status: 404 })

  const ep: any = (data as any).podcast_episodios
  await avisarRespostaConvite({
    nome: data.nome, resposta,
    episodio: ep ? `${String(ep.numero).padStart(2, '0')} · ${ep.titulo}` : '',
  })
  return NextResponse.json({ ok: true })
}
