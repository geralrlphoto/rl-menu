// Capa (thumbnail) de um vídeo do Vimeo pelo oEmbed público: funciona com links privados com hash
// (vimeo.com/<id>/<hash>) e não precisa de token. Guardada em cache 1 dia pelo Next.

export async function capaVimeo(link?: string): Promise<string | undefined> {
  if (!link || !/vimeo\.com\//i.test(link)) return undefined
  const url = link.split('?')[0]
  try {
    const r = await fetch(`https://vimeo.com/api/oembed.json?width=1280&url=${encodeURIComponent(url)}`, { next: { revalidate: 86400 } })
    if (!r.ok) return undefined
    const j = (await r.json()) as { thumbnail_url?: string }
    return j.thumbnail_url
  } catch {
    return undefined
  }
}
