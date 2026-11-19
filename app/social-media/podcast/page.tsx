import fs from 'node:fs'
import path from 'node:path'
import FichaNoPainel from './FichaNoPainel'
import GestaoPodcast from './GestaoPodcast'

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
  title: 'Antes do Sim · Gestão do podcast · RL Photo.Video',
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
    // Por baixo dos botões do topo: a página de apresentação para os
    // convidados (public/podcast/apresentacao), para abrir ou copiar o link.
    .replace(
      /(<a class="btn btn--ghost" href="#convidado">[\s\S]*?<\/a>\s*<\/div>)/,
      `$1
    <div class="hero__row r pod-apresentacao" style="margin-top:14px">
      <a class="btn btn--ghost" href="/podcast/apresentacao" target="_blank" rel="noopener"><span class="fill"></span><span class="dot"></span>Página de apresentação ↗</a>
      <button type="button" class="btn btn--ghost" onclick="(function(b){var u=location.origin+'/podcast/apresentacao';var ok=function(){var t=b.lastChild.textContent;b.lastChild.textContent='Link copiado';setTimeout(function(){b.lastChild.textContent=t},1800)};if(navigator.clipboard){navigator.clipboard.writeText(u).then(ok,function(){prompt('Copie o link:',u)})}else{prompt('Copie o link:',u)}})(this)"><span class="fill"></span><span class="dot"></span>Copiar link</button>
    </div>`,
    )
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

      {/* Gestão: convidados, mensagens e gravações de cada episódio. */}
      <GestaoPodcast />

      {/* O plano do programa (design aprovado), recolhido para consulta. */}
      <details className="pod-plano">
        <summary>
          <span>Plano do programa</span>
          <small>Porquê um podcast, guião, temporada, convites, divulgação e produção</small>
        </summary>
        <div dangerouslySetInnerHTML={{ __html: corpo }} />
      </details>
      <script dangerouslySetInnerHTML={{ __html: script }} />

      {/* As fichas do convidado e dos potenciais, dentro do painel lateral
          que o design abre em cada episódio. */}
      <FichaNoPainel />

      <style dangerouslySetInnerHTML={{ __html: `
        .pod-plano { max-width: 1180px; margin: 0 auto 80px; padding: 0 clamp(16px,4vw,48px); }
        .pod-plano > summary {
          list-style: none; cursor: pointer; display: flex; flex-direction: column; gap: 6px;
          padding: 24px 28px; border: 1px solid rgba(216,190,147,.3);
          background: linear-gradient(90deg, rgba(216,190,147,.06), transparent);
        }
        .pod-plano > summary::-webkit-details-marker { display: none; }
        .pod-plano > summary span { font-family: 'Cormorant Garamond', serif; font-size: 30px; font-weight: 300; color: rgba(243,237,226,.92); }
        .pod-plano > summary span::after { content: ' +'; color: #d8be93; }
        .pod-plano[open] > summary span::after { content: ' 2'; }
        .pod-plano > summary small { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: .16em; text-transform: uppercase; color: rgba(243,237,226,.45); }
        .pod-plano > summary:hover { border-color: #d8be93; }
        .pod-plano[open] > div { margin: 0 calc(-1 * clamp(16px,4vw,48px)); }
        .pod-plano .bar { display: none; }
      ` }} />
    </>
  )
}
