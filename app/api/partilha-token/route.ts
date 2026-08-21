import { NextRequest, NextResponse } from 'next/server'
import { assinarPartilha } from '@/lib/partilha-token'
import { verifyNvSession, NV_COOKIE_NAME } from '@/lib/noivos-session'

/**
 * Emite um token de partilha para UMA sub-página do portal.
 *
 * Só os próprios noivos (sessão válida para essa referência) ou o admin
 * podem emitir. Sem isto, o endpoint seria uma fábrica aberta de tokens e
 * a rota /p/[token] não valeria de nada.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? ''
  const ref = req.nextUrl.searchParams.get('ref') ?? ''
  const titulo = (req.nextUrl.searchParams.get('titulo') ?? '').slice(0, 80)

  if (!/^[0-9a-f-]{32,36}$/i.test(id)) {
    return NextResponse.json({ error: 'id_invalido' }, { status: 400 })
  }

  const isAdmin = req.cookies.get('rl_auth')?.value === process.env.AUTH_SECRET
  const sessao = await verifyNvSession(req.cookies.get(NV_COOKIE_NAME)?.value)
  const noivosDestaRef = !!sessao && !!ref
    && sessao.referencia.toLowerCase() === ref.toLowerCase()

  if (!isAdmin && !noivosDestaRef) {
    return NextResponse.json({ error: 'nao_autorizado' }, { status: 401 })
  }

  const token = await assinarPartilha({ id, ref, titulo })
  return NextResponse.json(
    { token, url: `${req.nextUrl.origin}/p/${token}` },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
