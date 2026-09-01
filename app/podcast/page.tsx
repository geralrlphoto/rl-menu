import fs from 'node:fs'
import path from 'node:path'
import type { Metadata } from 'next'
import { BASE_URL, PROGRAMA } from '@/lib/podcast/programa'

/* ============================================================
   /podcast — design aprovado, servido tal e qual.

   O ficheiro `_design/podcast.html` é o original, sem uma vírgula
   mudada. Esta página lê-o e injecta as três partes: o <style>, o
   corpo e o <script>. Nada é transposto para JSX, e por isso não há
   forma de a transposição alterar um pixel.

   Para mudar o design ou os episódios, substitui-se o ficheiro. O
   conteúdo dos episódios vive no array EPS, lá dentro.
   ============================================================ */

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Antes do Sim — Podcast · RL Photo.Video',
  description: PROGRAMA.promessa,
  alternates: { canonical: `${BASE_URL}/podcast` },
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    title: 'Antes do Sim — Podcast · RL Photo.Video',
    description: PROGRAMA.promessa,
    url: `${BASE_URL}/podcast`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Antes do Sim — Podcast · RL Photo.Video',
    description: PROGRAMA.promessa,
  },
}

/** Parte o ficheiro original nas três peças que a página precisa. */
function lerDesign() {
  const ficheiro = path.join(process.cwd(), 'app', 'podcast', '_design', 'podcast.html')
  const html = fs.readFileSync(ficheiro, 'utf8')

  const estilo = /<style>([\s\S]*?)<\/style>/i.exec(html)?.[1] ?? ''
  const script = /<script>([\s\S]*?)<\/script>/i.exec(html)?.[1] ?? ''
  const corpo = (/<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ?? '')
    .replace(/<script>[\s\S]*?<\/script>/gi, '')   // o script é injectado à parte
    .trim()

  return { estilo, script, corpo }
}

export default function PodcastPage() {
  const { estilo, script, corpo } = lerDesign()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: PROGRAMA.nome,
    description: PROGRAMA.descricao,
    url: `${BASE_URL}/podcast`,
    inLanguage: 'pt-PT',
    author: { '@type': 'Organization', name: PROGRAMA.autor },
  }

  return (
    <>
      {/* As fontes que o design usa */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@200;300;400&family=Hanken+Grotesk:wght@300;400;500&family=Space+Mono:wght@400&display=swap"
      />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <style dangerouslySetInnerHTML={{ __html: estilo }} />
      <div dangerouslySetInnerHTML={{ __html: corpo }} />
      <script dangerouslySetInnerHTML={{ __html: script }} />
    </>
  )
}
