import { NextRequest, NextResponse } from 'next/server'

// Proxy ao YouTube oEmbed para evitar CORS no browser.
// Devolve: { title, author_name, thumbnail_url } ou { error }.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Faltam parâmetro ?url' }, { status: 400 })
  }
  // Aceitar só YouTube por segurança (evita SSRF noutros domínios)
  if (!/(?:youtube\.com|youtu\.be)/.test(url)) {
    return NextResponse.json({ error: 'URL não é do YouTube' }, { status: 400 })
  }

  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`

  try {
    const res = await fetch(oembedUrl, { headers: { 'User-Agent': 'RL-Photo-Video' } })
    if (!res.ok) {
      return NextResponse.json({ error: `YouTube respondeu ${res.status}` }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json({
      title: data.title ?? null,
      author_name: data.author_name ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Erro ao consultar oEmbed' }, { status: 500 })
  }
}
