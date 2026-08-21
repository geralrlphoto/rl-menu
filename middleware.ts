import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyFlSession } from '@/lib/freelancer-session'
import { verifyNvSession, NV_COOKIE_NAME } from '@/lib/noivos-session'

export async function middleware(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl

  // ── Endpoint público de subscrição ao blog ───────────────────────────────
  //   POST /api/blog-subscribers (e OPTIONS preflight) é chamado por
  //   formulários no site público — sem auth.
  //   GET fica admin-only (lista completa de emails é sensível).
  if (
    pathname === '/api/blog-subscribers' &&
    (request.method === 'POST' || request.method === 'OPTIONS')
  ) {
    return NextResponse.next()
  }

  // ── Portal dos Noivos (casamento / batizado) ─────────────────────────────
  //   /portal-cliente/ref/<REF>   e   /portal-batizado/ref/<REF>
  //   exigem sessão `nv_session` válida cuja referencia bate com a URL.
  //
  //   Bypass:
  //     · admin (rl_auth válido)
  //     · ?admin=1 na URL
  //
  //   Sem sessão → redirect /login-noivos OU /login-batizado consoante o portal
  //   Sessão de outro casal → redirect para o portal próprio (não permite
  //     ver portais alheios).
  const noivosMatch = pathname.match(/^\/(portal-cliente|portal-batizado)\/ref\/([^/?]+)/)
  if (noivosMatch) {
    const adminAuth = request.cookies.get('rl_auth')?.value
    const isAdmin = (adminAuth && adminAuth === process.env.AUTH_SECRET) ||
      searchParams.get('admin') === '1'
    if (!isAdmin) {
      const refUrl = decodeURIComponent(noivosMatch[2])
      const isBatizado = noivosMatch[1] === 'portal-batizado'
      const nvCookie = request.cookies.get(NV_COOKIE_NAME)?.value
      const session = await verifyNvSession(nvCookie)
      if (!session) {
        const loginPath = isBatizado ? '/login-batizado' : '/login-noivos'
        const loginUrl = new URL(loginPath, request.url)
        loginUrl.searchParams.set('next', `${pathname}${search}`)
        return NextResponse.redirect(loginUrl)
      }
      // Sessão noutro casamento → manda-os para o portal próprio
      if (session.referencia.toLowerCase() !== refUrl.toLowerCase()) {
        const ownBase = session.tipo === 'batizado' ? '/portal-batizado' : '/portal-cliente'
        return NextResponse.redirect(new URL(`${ownBase}/ref/${encodeURIComponent(session.referencia)}`, request.url))
      }
      // OK — sessão bate com a referencia da URL, deixa passar
    }
  }

  // ── 1) Compatibilidade: /freelancer-view/<id>  →  /freelancers/<id>?view=freelancer
  //   URL antigo redireciona sempre para o novo padrão (admin ou membro).
  const legacyMatch = pathname.match(/^\/freelancer-view\/([^/]+)/)
  if (legacyMatch) {
    const targetId = legacyMatch[1]
    return NextResponse.redirect(new URL(`/freelancers/${targetId}?view=freelancer`, request.url))
  }

  // ── Formulário de recrutamento — público ─────────────────────────────────
  //   /freelancers/formulario é preenchido por candidatos externos (sem login).
  //   Tem de vir ANTES do flMatch, senão "formulario" é tratado como id de
  //   portal e reencaminhado para /login. /recrutamento é o alias público.
  if (pathname === '/freelancers/formulario' || pathname === '/recrutamento') {
    return NextResponse.next()
  }

  // ── 2) Acesso ao portal do membro (/freelancers/<id>?view=freelancer) ──
  //   Admin (rl_auth válido) entra em /freelancers/<id> com ou sem ?view.
  //   Freelancer só entra se:
  //     · pathname = /freelancers/<sessionId>
  //     · query    = view=freelancer
  //   Sessão noutro id → reencaminha para o portal próprio dele.
  //   Sem credenciais → /login?next=…
  const flMatch = pathname.match(/^\/freelancers\/([^/]+)(?:\/.*)?$/)
  if (flMatch) {
    const targetId = flMatch[1]
    const adminAuth = request.cookies.get('rl_auth')?.value
    if (adminAuth && adminAuth === process.env.AUTH_SECRET) {
      return NextResponse.next()
    }
    const flCookie = request.cookies.get('fl_session')?.value
    const session = await verifyFlSession(flCookie)
    const isFreelancerView = searchParams.get('view') === 'freelancer'
    if (session && session.id === targetId && isFreelancerView) {
      // Editores têm portal próprio — reencaminha no servidor (sem flash).
      if (session.status === 'EDITORES') {
        return NextResponse.redirect(new URL(`/painel-editor?freelancer=${targetId}`, request.url))
      }
      return NextResponse.next()
    }
    if (session) {
      return NextResponse.redirect(new URL(`/freelancers/${session.id}?view=freelancer`, request.url))
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

  // ── 2b) Painel do Editor (/painel-editor) — portal próprio dos editores ──
  //   Admin (rl_auth) entra livremente. Editor (fl_session) entra no seu painel
  //   (força ?freelancer=<sessionId>). Sem credenciais → /login?next=…
  if (pathname.startsWith('/painel-editor')) {
    const adminAuth = request.cookies.get('rl_auth')?.value
    if (adminAuth && adminAuth === process.env.AUTH_SECRET) {
      return NextResponse.next()
    }
    const flCookie = request.cookies.get('fl_session')?.value
    const session = await verifyFlSession(flCookie)
    if (session) {
      // Força sempre ?freelancer=<id da sessão>: garante que o editor vê o SEU
      // painel (com a identidade real) e nunca o painel sem id (dados demo).
      // IMPORTANTE: preservar o pathname (sub-páginas como /pagamentos), senão
      // qualquer clique no menu lateral era reenviado para o dashboard base.
      const wanted = searchParams.get('freelancer')
      if (wanted !== session.id) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.searchParams.set('freelancer', session.id)
        return NextResponse.redirect(redirectUrl)
      }
      return NextResponse.next()
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', `${pathname}${search}`)
    return NextResponse.redirect(loginUrl)
  }

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
    // APIs do painel do editor — id-parametrizadas, lidas pelo próprio editor
    // (só tem fl_session, não rl_auth). Sem isto o middleware reenviava-as para
    // /login e a dashboard do editor aparecia vazia (admin via dados, editor não).
    pathname.startsWith('/api/painel-editor') ||
    pathname.startsWith('/api/noivos-auth') ||
    pathname.startsWith('/api/noivos-recover') ||
    pathname.startsWith('/api/noivos-presence') ||
    pathname.startsWith('/api/noivos-message') ||
    pathname === '/login-noivos' ||
    pathname === '/login-batizado' ||
    pathname.startsWith('/api/portais') ||
    pathname.startsWith('/api/link-preview') ||
    pathname.startsWith('/api/pagamentos-by-ref') ||
    pathname.startsWith('/api/pagamentos-noivos') ||
    pathname.startsWith('/api/fotos-selecao') ||
    pathname.startsWith('/api/webhook-tally-selecao') ||
    pathname.startsWith('/api/albuns-casamento') ||
    pathname.startsWith('/api/send-admin-notification') ||
    pathname.startsWith('/api/webhook-tally-pagamento') ||
    pathname.startsWith('/api/evento-by-ref') ||
    pathname.startsWith('/api/webhook-tally-cps') ||
    pathname.startsWith('/api/contrato-cps') ||
    pathname.startsWith('/api/contrato-cps-landing') ||
    pathname.startsWith('/api/webhook-tally-freelancer') ||
    pathname.startsWith('/api/tally-webhook') ||
    pathname.startsWith('/api/webhook-tally-evento') ||
    pathname.startsWith('/api/crm-intake') ||
    pathname.startsWith('/api/send-reuniao-email') ||
    pathname.startsWith('/api/test-email-freelancer') ||
    pathname.startsWith('/portal-cliente') ||
    pathname.startsWith('/portal-batizado') ||
    (pathname.includes('/contrato') && !pathname.startsWith('/api')) ||
    // (/freelancer-view é tratado no bloco acima — requer fl_session OU rl_auth)
    pathname.startsWith('/p/') ||   // páginas partilhadas por token assinado
    // A própria rota decide quem pode emitir (admin ou noivos dessa referência);
    // aqui só se deixa passar, senão o middleware barrava os noivos.
    pathname.startsWith('/api/partilha-token') ||
    pathname.startsWith('/r/') ||
    pathname.startsWith('/b/') ||
    pathname.startsWith('/secao/') ||
    pathname.startsWith('/api/batizado/') ||
    pathname.startsWith('/api/lead-page/view') ||
    pathname.startsWith('/api/lead-page/confirm') ||
    pathname.startsWith('/api/lead-page/change-request') ||
    pathname.startsWith('/api/lead-page/request-change-email') ||
    pathname.startsWith('/api/lead-page/check-admin') ||
    pathname.startsWith('/api/lead-page/proposta-response') ||
    pathname.startsWith('/api/lembrete-reuniao') ||
    pathname.startsWith('/api/upload-image') ||
    pathname.startsWith('/api/portal-notif-prewedding') ||
    pathname.startsWith('/api/send-booking-reservation') ||
    pathname.startsWith('/api/send-task-email') ||
    pathname.startsWith('/api/calendar/ics') ||
    pathname === '/' ||
    pathname.startsWith('/wedding-mentor') ||
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
    pathname.startsWith('/batizado') ||
    pathname.startsWith('/media/crm/nova-lead') ||
    pathname.startsWith('/api/media-leads') ||
    pathname.startsWith('/api/test-lead-card') ||
    pathname.startsWith('/api/test-batizado-email') ||
    pathname.startsWith('/api/webhook-tally-fotos-convidados') ||
    pathname.startsWith('/api/photo-orders') ||
    pathname.startsWith('/adquirir-fotografias') ||
    pathname.startsWith('/ticket-fotos-dia') ||
    pathname.startsWith('/api/ticket-') ||
    pathname.startsWith('/registar-pagamento') ||
    pathname.startsWith('/api/registar-pagamento-noivos') ||
    pathname.startsWith('/api/fotos-auto') ||
    pathname.startsWith('/portal-media') ||
    pathname.startsWith('/media/portal-cliente/acesso') ||
    pathname.startsWith('/api/media-portal-acesso') ||
    pathname.startsWith('/apresentacao') ||
    pathname.startsWith('/rm/') ||
    pathname.startsWith('/api/media-portal/view') ||
    pathname.startsWith('/api/media-portal/confirm') ||
    pathname.startsWith('/api/media-portal/notify-entregas') ||
    pathname.startsWith('/api/media-portal/notify-briefing') ||
    pathname.startsWith('/api/media-portal/notify-workflow') ||
    pathname.startsWith('/api/test-portal-card') ||
    /^\/api\/media-portal\/[^/]+\/feedback/.test(pathname) ||
    /^\/api\/media-portal\/[^/]+\/chat/.test(pathname) ||
    /^\/api\/media-portal\/[^/]+\/auth/.test(pathname) ||
    /^\/api\/media-portal\/[^/]+\/notifications/.test(pathname) ||
    /^\/api\/media-portal\/[^/]+\/notify(\/|$)/.test(pathname) ||
    /^\/api\/media-portal\/[^/]+$/.test(pathname)
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.webp|.*\\.avif|.*\\.gif|.*\\.svg|.*\\.ico).*)'],
}
