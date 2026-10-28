import { NextResponse } from 'next/server'
import { senhaCerta, assinaturaEditorial, cookieEditorial, EDITORIAL_COOKIE_MAX_AGE } from '@/lib/editorialAcesso'

// Entrada nos portais de editoriais: confere a senha e deixa o cookie assinado.
// Cada tentativa errada espera um pouco, para tornar inútil tentar senhas às cegas.
export async function POST(req: Request) {
  const { slug, senha } = await req.json().catch(() => ({})) as { slug?: string; senha?: string }
  if (!slug || !senha || !senhaCerta(slug, senha)) {
    await new Promise(r => setTimeout(r, 1200))
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieEditorial(slug), assinaturaEditorial(slug), {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/', maxAge: EDITORIAL_COOKIE_MAX_AGE,
  })
  return res
}
