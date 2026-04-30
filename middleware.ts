import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and auth API
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/eventos-notion') ||
    pathname.startsWith('/api/eventos-supabase') ||
    pathname.startsWith('/api/debug-page') ||
    pathname.startsWith('/api/debug-calendar') ||
    pathname.startsWith('/api/setup-fotos-estados') ||
    pathname.startsWith('/api/freelancer-auth') ||
    pathname.startsWith('/api/freelancers') ||
    pathname.startsWith('/api/freelancer-') ||
    pathname.startsWith('/api/portais') ||
    pathname.startsWith('/api/pagamentos-by-ref') ||
    pathname.startsWith('/api/pagamentos-noivos') ||
    pathname.startsWith('/api/fotos-selecao') ||
    pathname.startsWith('/api/webhook-tally-selecao') ||
    pathname.startsWith('/api/albuns-casamento') ||
    pathname.startsWith('/api/send-admin-notification') ||
    pathname.startsWith('/api/webhook-tally-pagamento') ||
    pathname.startsWith('/api/evento-by-ref') ||
    pathname.startsWith('/api/webhook-tally-cps') ||
    pathname.startsWith('/api/webhook-tally-freelancer') ||
    pathname.startsWith('/api/tally-webhook') ||
    pathname.startsWith('/api/webhook-tally-evento') ||
    pathname.startsWith('/api/crm-intake') ||
    pathname.startsWith('/api/send-reuniao-email') ||
    pathname.startsWith('/api/test-email-freelancer') ||
    pathname.startsWith('/portal-cliente') ||
    (pathname.includes('/contrato') && !pathname.startsWith('/api')) ||
    pathname.startsWith('/freelancer-view') ||
    pathname.startsWith('/r/') ||
    pathname.startsWith('/api/lead-page/view') ||
    pathname.startsWith('/api/lead-page/confirm') ||
    pathname.startsWith('/api/lead-page/change-request') ||
    pathname.startsWith('/api/lead-page/request-change-email') ||
    pathname.startsWith('/api/lead-page/check-admin') ||
    pathname.startsWith('/api/lead-page/proposta-response') ||
    pathname.startsWith('/api/lembrete-reuniao') ||
    pathname.startsWith('/api/upload-image') ||
    pathname.startsWith('/api/portal-notif-prewedding') ||
    pathname === '/newsletter' ||
    pathname.startsWith('/newsletter/') ||
    pathname.startsWith('/api/newsletter-subscribe') ||
    pathname.startsWith('/api/newsletter-confirm') ||
    pathname.startsWith('/api/newsletter-unsubscribe') ||
    pathname.startsWith('/api/newsletter-cron') ||
    pathname.startsWith('/api/newsletter-preview') ||
    pathname.startsWith('/api/newsletter-webhook') ||
    pathname.startsWith('/api/newsletter-debug') ||
    pathname.startsWith('/api/tally-relatorio-video') ||
    pathname.startsWith('/api/relatorios-video') ||
    pathname.startsWith('/nova-lead') ||
    pathname.startsWith('/api/nova-lead') ||
    pathname.startsWith('/media/crm/nova-lead') ||
    pathname.startsWith('/api/media-leads') ||
    pathname.startsWith('/api/test-lead-card') ||
    pathname.startsWith('/api/webhook-tally-fotos-convidados') ||
    pathname.startsWith('/portal-media')
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.ico).*)'],
}
