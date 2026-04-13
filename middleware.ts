import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and auth API
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/eventos-notion') ||
    pathname.startsWith('/api/debug-page') ||
    pathname.startsWith('/api/debug-calendar') ||
    pathname.startsWith('/api/setup-fotos-estados') ||
    pathname.startsWith('/api/freelancer-auth') ||
    pathname.startsWith('/api/freelancers') ||
    pathname.startsWith('/api/freelancer-') ||
    pathname.startsWith('/api/portais') ||
    pathname.startsWith('/api/fotos-selecao') ||
    pathname.startsWith('/api/webhook-tally-selecao') ||
    pathname.startsWith('/api/albuns-casamento') ||
    pathname.startsWith('/api/send-admin-notification') ||
    pathname.startsWith('/api/webhook-tally-pagamento') ||
    pathname.startsWith('/portal-cliente') ||
    pathname.startsWith('/freelancer-view')
  ) {
    return NextResponse.next()
  }

  const auth = request.cookies.get('rl_auth')?.value
  if (auth !== process.env.AUTH_SECRET) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
