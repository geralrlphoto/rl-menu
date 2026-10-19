// Leitor embutido para vídeos do Vimeo/YouTube (o vídeo vem deles, não gasta o nosso tráfego).
/* Endereço do leitor para ver o vídeo dentro do portal (o vídeo continua a vir do
   Vimeo/YouTube, sem gastar o nosso tráfego). null = não dá para embutir. */
export function embedDe(url?: string | null): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    const h = u.hostname.replace(/^www\./, '')
    if (h === 'vimeo.com') {
      const [id, hash] = u.pathname.split('/').filter(Boolean)
      if (!/^\d+$/.test(id ?? '')) return null
      return `https://player.vimeo.com/video/${id}?autoplay=1&title=0&byline=0&portrait=0${hash ? `&h=${hash}` : ''}`
    }
    if (h === 'player.vimeo.com') return `${url}${url.includes('?') ? '&' : '?'}autoplay=1`
    if (h === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}?autoplay=1&rel=0`
    if (h === 'youtube.com' || h === 'm.youtube.com') {
      const id = u.searchParams.get('v')
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null
    }
  } catch { /* link inválido */ }
  return null
}

