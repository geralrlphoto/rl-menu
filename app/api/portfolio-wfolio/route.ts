import { NextResponse } from 'next/server'

// Fotos do portfólio dos portais da reunião (/r e /b), lidas da galeria do
// Wfolio. As imagens são servidas pelo i.wfolio.com (tráfego do Wfolio, 0 no
// Supabase). A lista fica em cache na Vercel 6 h, por isso o Wfolio só é lido
// de vez em quando. Para mudar as fotos basta mudá-las na galeria do Wfolio.

const GALERIA_PORTFOLIO = 'https://geral-rlphoto.wfolio.pro/disk/portfolio-7cn8hr'
const FRAME = `${GALERIA_PORTFOLIO}/pieces?design_variant=masonry&folder_path=photos`
const CACHE_S = 6 * 60 * 60

type Foto = { src: string; srcSet: string }

export async function GET() {
  try {
    const r = await fetch(FRAME, {
      headers: { 'User-Agent': 'Mozilla/5.0 (RL Photo.Video portal)' },
      next: { revalidate: CACHE_S },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) throw new Error(`wfolio ${r.status}`)
    const html = await r.text()
    const fotos: Foto[] = []
    const vistos = new Set<string>()
    for (const m of html.matchAll(/data-srcset="([^"]+)"/g)) {
      // "url 600w, url 1240w" → fica com os dois tamanhos (só do i.wfolio.com)
      const partes = m[1].split(',').map(p => p.trim()).map(p => {
        const [u, w] = p.split(/\s+/)
        return { u: u.startsWith('//') ? `https:${u}` : u, w: parseInt(w) || 0 }
      }).filter(p => /^https:\/\/i\.wfolio\.com\//.test(p.u) && p.w > 0)
      if (!partes.length) continue
      partes.sort((a, b) => a.w - b.w)
      const maior = partes[partes.length - 1].u
      if (vistos.has(maior)) continue
      vistos.add(maior)
      fotos.push({ src: maior, srcSet: partes.map(p => `${p.u} ${p.w}w`).join(', ') })
    }
    return NextResponse.json({ ok: true, galeria: GALERIA_PORTFOLIO, fotos }, {
      headers: { 'Cache-Control': `public, s-maxage=${CACHE_S}, stale-while-revalidate=86400` },
    })
  } catch {
    return NextResponse.json({ ok: false, galeria: GALERIA_PORTFOLIO, fotos: [] }, {
      headers: { 'Cache-Control': 'public, s-maxage=300' },
    })
  }
}
