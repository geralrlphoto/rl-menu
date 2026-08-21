/**
 * GET /api/link-preview?url=<link>
 *
 * Lê as meta tags Open Graph de um link e devolve { image, title }.
 * Serve para os cards da sub-página FOTOGRAFIAS mostrarem a capa que foi
 * escolhida na galeria (o Wfolio publica og:image e og:title na página
 * de entrada, mesmo nas galerias com palavra-passe).
 *
 * Tem de ser no servidor: o browser não consegue ler o HTML de outro
 * domínio por causa do CORS.
 */

import { NextRequest, NextResponse } from 'next/server'

/** Só lemos o início do HTML — as meta tags vivem no <head>. */
const MAX_BYTES = 150_000
const FETCH_TIMEOUT_MS = 8_000
const CACHE_TTL_MS = 12 * 60 * 60 * 1000

/**
 * Serviços de transferência de ficheiros: o og:image é o logótipo da marca
 * e não a capa da galeria, por isso não vale a pena mostrá-lo no card.
 */
const NO_COVER_HOSTS = [
  'swisstransfer.com',
  'fromsmash.com',
  'wetransfer.com',
  'dropbox.com',
  'drive.google.com',
  'mega.nz',
  'onedrive.live.com',
]

type Preview = { image: string | null; title: string | null }
const cache = new Map<string, { at: number; data: Preview }>()

/** Bloqueia rede interna: este endpoint aceita um url arbitrário. */
function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase()
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal')) return true
  if (h === '::1' || h === '[::1]') return true
  if (/^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h)) return true
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true
  if (/^169\.254\./.test(h)) return true
  return false
}

function metaContent(html: string, key: string): string | null {
  // Aceita property= ou name=, por qualquer ordem em relação a content=.
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return m[1]
  }
  return null
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url') ?? ''
  if (!raw) return NextResponse.json({ error: 'url em falta' }, { status: 400 })

  let target: URL
  try { target = new URL(raw) } catch { return NextResponse.json({ error: 'url inválido' }, { status: 400 }) }
  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return NextResponse.json({ error: 'protocolo não suportado' }, { status: 400 })
  }
  if (isPrivateHost(target.hostname)) {
    return NextResponse.json({ error: 'host não permitido' }, { status: 400 })
  }

  const key = target.toString()
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.data, { headers: cacheHeaders() })
  }

  const host = target.hostname.replace(/^www\./, '')
  const brandOnly = NO_COVER_HOSTS.some(h => host === h || host.endsWith(`.${h}`))

  let data: Preview = { image: null, title: null }
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS)
    const res = await fetch(key, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        // Sem um UA normal há sites que devolvem uma página vazia.
        'user-agent': 'Mozilla/5.0 (compatible; RLPhotoVideoBot/1.0; +https://rlphotovideo.pt)',
        accept: 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(timer)

    if (res.ok && (res.headers.get('content-type') ?? '').includes('html')) {
      const html = (await res.text()).slice(0, MAX_BYTES)
      const title = metaContent(html, 'og:title')
      const image = brandOnly
        ? null
        : metaContent(html, 'og:image') ?? metaContent(html, 'twitter:image')
      data = {
        image: image ? decodeEntities(image) : null,
        title: title ? decodeEntities(title) : null,
      }
    }
  } catch {
    // Link inacessível ou lento: devolve vazio e o card fica como está.
  }

  cache.set(key, { at: Date.now(), data })
  return NextResponse.json(data, { headers: cacheHeaders() })
}

function cacheHeaders() {
  return { 'cache-control': 'public, s-maxage=43200, stale-while-revalidate=86400' }
}
