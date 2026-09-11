import { NextRequest, NextResponse } from 'next/server'
import { enviarEmailAdminApoio, type PedidoApoio } from '@/lib/apoio-fotografias-email'

// Página de Apoio ao Cliente (/apoio-fotografias): o cliente diz que já passou
// o prazo e não recebeu as fotografias. Aqui só se avisa o admin por email —
// não se grava nada, o registo é o próprio email.

function clean(v: unknown, max = 200): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const pedido: PedidoApoio = {
      nome:             clean(body.nome),
      email:            clean(body.email),
      telefone:         clean(body.telefone),
      noivos:           clean(body.noivos),
      data:             clean(body.data, 10),
      ticket:           clean(body.ticket, 60),
      formato:          body.formato === 'papel' ? 'papel' : 'digital',
      entregaPrevista:  clean(body.entregaPrevista, 60),
    }

    const emFalta = (['nome', 'email', 'telefone', 'noivos', 'data', 'ticket'] as const)
      .filter(k => !pedido[k])
    if (emFalta.length) {
      return NextResponse.json({ error: `Campos em falta: ${emFalta.join(', ')}` }, { status: 400 })
    }

    await enviarEmailAdminApoio(pedido)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[apoio-fotografias]', e)
    return NextResponse.json({ error: e?.message || 'Erro no envio' }, { status: 500 })
  }
}
