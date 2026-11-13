// Vídeos da pasta MARCA PESSOAL do Vimeo para a roda "Ouçam-nos primeiro"
// do portal da reunião (app/_lead/RodaReels.tsx). Tudo o que o Rui puser
// nessa pasta aparece no portal, pela ordem da pasta (mais recente primeiro).
//
// Precisa de VIMEO_TOKEN (token pessoal do Vimeo, âmbitos "public" e "private").
// Cache de 10 min: o Vimeo não é chamado por cada visita.
// Sem token, ou se o Vimeo falhar, devolve a lista fixa (REELS_FIXOS).

import { NextResponse } from 'next/server'
import { REELS_FIXOS, REELS_FORA, type Reel } from '@/lib/reelsMarca'

export const revalidate = 600

const PASTA = '31252311' // vimeo.com/user/203067096/folder/31252311

// "QUANTO CUSTA UM CASAMENTO?" → "Quanto custa um casamento?"
function frase(nome: string): string {
  const t = nome.trim()
  if (t !== t.toUpperCase()) return t
  const m = t.toLowerCase()
  return m.charAt(0).toUpperCase() + m.slice(1)
}

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.round(s % 60)).padStart(2, '0')}`

type VimeoVideo = {
  uri: string; name: string; description: string | null; duration: number
  width: number; height: number
  privacy?: { embed?: string; view?: string }
  pictures?: { sizes?: { width: number; height: number; link: string }[] }
}

export async function GET() {
  const token = process.env.VIMEO_TOKEN
  if (!token) return NextResponse.json({ reels: REELS_FIXOS, fonte: 'fixa' })

  try {
    const url = `https://api.vimeo.com/me/projects/${PASTA}/videos?per_page=50&sort=date&direction=desc` +
      `&fields=uri,name,description,duration,width,height,privacy.embed,privacy.view,pictures.sizes`
    const r = await fetch(url, {
      headers: { Authorization: `bearer ${token}`, Accept: 'application/vnd.vimeo.*+json;version=3.4' },
      next: { revalidate: 600 },
    })
    if (!r.ok) throw new Error(`Vimeo ${r.status}`)
    const j = await r.json() as { data: VimeoVideo[] }

    const fixos = new Map(REELS_FIXOS.map(x => [x.vimeo, x]))
    const reels: Reel[] = j.data
      .map(v => ({ v, id: v.uri.split('/').pop()! }))
      .filter(({ v, id }) => !REELS_FORA.includes(id) && v.privacy?.view !== 'nobody' && v.privacy?.embed !== 'private')
      .map(({ v, id }) => {
        const f = fixos.get(id)
        const vertical = v.height > v.width
        // capa: a nossa (9:16, em /public/reels) se existir; senão a do Vimeo, a maior
        const tamanhos = [...(v.pictures?.sizes ?? [])].sort((a, b) => b.width - a.width)
        const capaVimeo = tamanhos.find(s => s.width <= 1280)?.link ?? tamanhos[0]?.link ?? ''
        return {
          vimeo: id,
          t: f?.t ?? frase(v.name),
          p: v.description?.trim() || f?.p || '',
          d: mmss(v.duration),
          vertical,
          capa: f?.capa ?? capaVimeo,
        }
      })

    return NextResponse.json({ reels: reels.length ? reels : REELS_FIXOS, fonte: 'vimeo' })
  } catch (e) {
    console.error('[reels-marca]', e)
    return NextResponse.json({ reels: REELS_FIXOS, fonte: 'fixa' })
  }
}
