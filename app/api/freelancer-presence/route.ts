import { NextRequest, NextResponse } from 'next/server'
import { FL_COOKIE_NAME, makeFlSession, verifyFlSession } from '@/lib/freelancer-session'

export const dynamic = 'force-dynamic'

/**
 * Heartbeat de sessão do freelancer (sliding window).
 *
 * O antigo sistema de presença ("quem está online") foi removido para poupar
 * egress do Supabase, por isso esta rota já NÃO lê nem escreve na tabela
 * `portais`. Continua a existir apenas para renovar o cookie fl_session
 * enquanto o membro está activo — operação puramente de JWT, sem tocar na DB.
 *
 * POST → renova o cookie fl_session a partir da sessão actual.
 *        Devolve 401 se não houver sessão válida (o cliente redireciona
 *        para /login).
 */
export async function POST(req: NextRequest) {
  try {
    const flCookie = req.cookies.get(FL_COOKIE_NAME)?.value
    const session = flCookie ? await verifyFlSession(flCookie) : null
    if (!session?.id || !session.email) {
      return NextResponse.json({ ok: false, error: 'no_session' }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true })

    // Sliding window: estende o exp por mais TTL_SECONDS.
    const token = await makeFlSession({
      id: session.id,
      email: session.email,
      role: 'freelancer',
      status: session.status ?? undefined,
    })
    res.cookies.set(FL_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      // Sem maxAge — continua session cookie. O JWT exp é que controla.
    })
    return res
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 })
  }
}
