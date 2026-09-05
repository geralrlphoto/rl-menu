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
   sub-páginas: /episodios, /candidaturas e /leads, e os atalhos para
   elas vivem no canto inferior direito, fora do design.
   ============================================================ */

export const metadata = {
  title: 'Antes do Sim — Plano do podcast · RL Photo.Video',
}

const ATALHOS = [
  { href: '/social-media/podcast/episodios', texto: 'Gerir episódios' },
  { href: '/social-media/podcast/candidaturas', texto: 'Candidaturas' },
  { href: '/social-media/podcast/leads', texto: 'Leads' },
  { href: '/podcast', texto: 'Página pública ↗' },
]

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

      {/* Atalhos do back-office, fora do design para não lhe tocar. */}
      <nav className="pod-atalhos" aria-label="Gestão do podcast">
        {ATALHOS.map(a => (
          <a key={a.href} href={a.href}>{a.texto}</a>
        ))}
      </nav>

      <style dangerouslySetInnerHTML={{ __html: `
        .pod-atalhos {
          position: fixed; right: 16px; bottom: 16px; z-index: 8100;
          display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end;
          max-width: min(420px, calc(100vw - 32px));
        }
        .pod-atalhos a {
          font-family: 'Space Mono', monospace;
          font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase;
          color: rgba(243,237,226,.6); text-decoration: none;
          padding: 9px 14px; border-radius: 40px;
          border: 1px solid rgba(243,237,226,.14);
          background: rgba(11,10,8,.82); backdrop-filter: blur(10px);
          transition: color .3s, border-color .3s;
        }
        .pod-atalhos a:hover { color: #d8be93; border-color: #d8be93; }
        @media (max-width: 640px) { .pod-atalhos { position: static; margin: 24px 20px 40px; } }
      ` }} />
    </>
  )
}
