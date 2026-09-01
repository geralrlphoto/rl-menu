import fs from 'node:fs'
import path from 'node:path'
import FichaNoPainel from './FichaNoPainel'

/* ============================================================
   /social-media/podcast — o plano do podcast "Antes do Sim".

   Serve o design aprovado (`_design/podcast.html`) tal e qual: esta
   página lê o ficheiro e injecta as três peças, o <style>, o corpo e
   o <script>. Nada é transposto para JSX, por isso a transposição não
   pode alterar um pixel.

   Para mudar o design, substitui-se o ficheiro. Os episódios estão no
   array EPS, lá dentro.

   Dentro do painel lateral de cada episódio há duas fichas, a do
   convidado e a dos potenciais convidados (FichaNoPainel).

   A gestão dos episódios, as candidaturas e os leads vivem nas
   sub-páginas: /episodios, /candidaturas e /leads. Não há atalhos para
   elas nesta página, por opção: o design fica intacto.
   ============================================================ */

export const metadata = {
  title: 'Antes do Sim — Plano do podcast · RL Photo.Video',
}


function lerDesign() {
  const ficheiro = path.join(process.cwd(), 'app', 'social-media', 'podcast', '_design', 'podcast.html')
  const html = fs.readFileSync(ficheiro, 'utf8')

  const estilo = /<style>([\s\S]*?)<\/style>/i.exec(html)?.[1] ?? ''
  const script = /<script>([\s\S]*?)<\/script>/i.exec(html)?.[1] ?? ''
  const corpo = (/<body[^>]*>([\s\S]*?)<\/body>/i.exec(html)?.[1] ?? '')
    .replace(/<script>[\s\S]*?<\/script>/gi, '')
    // No ficheiro original o logótipo ligava para "RL Photo.Video.html", o
    // ficheiro que estava ao lado no computador. Dentro da aplicação isso não
    // vai a lado nenhum: passa a voltar para a Social Media. É a única
    // alteração ao design, e é feita aqui para o ficheiro ficar intacto.
    .replace(/href="RL Photo\.Video\.html"/g, 'href="/social-media"')
    .trim()

  return { estilo, script, corpo }
}

export default function PlanoPodcastPage() {
  const { estilo, script, corpo } = lerDesign()

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@200;300;400&family=Hanken+Grotesk:wght@300;400;500&family=Space+Mono:wght@400&display=swap"
      />

      <style dangerouslySetInnerHTML={{ __html: estilo }} />
      <div dangerouslySetInnerHTML={{ __html: corpo }} />
      <script dangerouslySetInnerHTML={{ __html: script }} />

      {/* As fichas do convidado e dos potenciais, dentro do painel lateral
          que o design abre em cada episódio. */}
      <FichaNoPainel />

    </>
  )
}
