import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and auth API
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth') || pathname.startsWith('/api/eventos-notion') || pathname.startsWith('/api/debug-page')) {
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
