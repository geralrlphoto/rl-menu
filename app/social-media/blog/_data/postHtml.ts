/* ============================================================
   Gera o código de um post do blog para colar no site
   (Hostinger, elemento de código incorporado).

   Formato igual aos posts já publicados (rlp34 "Trinta telemóveis",
   rlp35 "Belinha e Rui"): cartão compacto que abre o artigo, com
   capa, título, linha dourada, subtítulo itálico, H2 dourados e
   fotos entre secções. Cada post tem um número próprio (rlpNN)
   para as classes não chocarem entre posts na mesma página.

   Corpo: parágrafos separados por \n\n. Linha só com **texto** ou
   "## texto" vira H2. **x** vira negrito, *x* itálico. Marcadores
   [FOTO — ...] recebem as fotos pela ordem; os que sobram somem.
   ============================================================ */

export type PostInput = {
  num: number
  title: string
  subtitle?: string | null
  category: string
  readingMin: number
  date?: Date
  body: string
  coverUrl?: string
  coverAlt?: string
  bodyUrls: string[]
}

export const CATEGORIA_SITE: Record<string, string> = {
  'fotografia': 'Fotografia',
  'video': 'Vídeo',
  'pre-wedding': 'Pré-Wedding',
  'preparacao': 'Preparações',
  'pos-casamento': 'Pós-Casamento',
  'logistica': 'Logística',
  'comportamento': 'Comportamento',
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const FOTO_RE = /^\[FOTO\b[^\]]*\]\s*$/i

function esc(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function inline(t: string): string {
  return esc(t)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
}

/** Converte o corpo do artigo no HTML do post (sem o hero). */
function corpoHtml(body: string, urls: string[], alt: string): string {
  const fotos = urls.map(u => u.trim()).filter(Boolean)
  let i = 0
  const out: string[] = []
  for (const bloco of body.split(/\n\s*\n/)) {
    const p = bloco.trim()
    if (!p) continue
    if (FOTO_RE.test(p)) {
      if (i < fotos.length) out.push(`<figure><img src="${esc(fotos[i++])}" alt="${esc(alt)}"></figure>`)
      continue
    }
    const h = p.match(/^##\s+(.+)$/) ?? p.match(/^\*\*([^*]+)\*\*$/)
    if (h) { out.push(`<h2>${esc(h[1].trim())}</h2>`); continue }
    out.push(`<p>${inline(p).replace(/\n/g, '<br>')}</p>`)
  }
  // Fotos a mais do que marcadores: ficam no fim do artigo
  while (i < fotos.length) out.push(`<figure><img src="${esc(fotos[i++])}" alt="${esc(alt)}"></figure>`)
  return out.map(l => `          ${l}`).join('\n')
}

/** Primeira frase útil do corpo, para o resumo do cartão quando não há subtítulo. */
function resumo(body: string): string {
  const p = body.split(/\n\s*\n/).map(s => s.trim()).find(s => s && !FOTO_RE.test(s) && !/^(##|\*\*[^*]+\*\*$)/.test(s)) ?? ''
  const limpo = p.replace(/\*+/g, '')
  return limpo.length > 180 ? limpo.slice(0, 177).replace(/\s+\S*$/, '') + '…' : limpo
}

export function buildPostHtml(input: PostInput): string {
  const n = String(input.num)
  const P = `rlp${n}`, B = `rlb${n}`
  const data = input.date ?? new Date()
  const quando = `${MESES[data.getMonth()]} ${data.getFullYear()}`
  const cat = CATEGORIA_SITE[input.category] ?? input.category
  const sub = (input.subtitle ?? '').trim() || resumo(input.body)
  const cover = (input.coverUrl ?? '').trim()
  const alt = (input.coverAlt ?? '').trim() || input.title
  const capaCartao = cover ? `\n      <img src="${esc(cover)}" alt="${esc(alt)}">` : ''
  const capaHero = cover ? `\n          <img src="${esc(cover)}" alt="${esc(alt)}">` : ''

  return `<!-- ===== RL PHOTO.VIDEO — POST: ${esc(input.title)} (cartão compacto) ===== -->
<div class="${P}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Jost:wght@200;300&family=Hanken+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400&display=swap');
    .${P}{ --g:#d8be93; --bg:#120d08; --ink-3:#16130f; --tx:rgba(243,237,226,.92); --tx-mid:rgba(243,237,226,.62); --tx-dim:rgba(243,237,226,.4); --line-soft:rgba(243,237,226,.1);
      --gold:#c8a866; --gold-soft:#d7bd87;
      box-sizing:border-box; width:100%; max-width:1100px; margin:0 auto; padding:clamp(20px,3vh,34px) clamp(20px,5vw,40px);
      font-family:'Hanken Grotesk',system-ui,sans-serif; color:var(--tx); }
    .${P} *{ box-sizing:border-box; }
    .${P}__card{ display:grid; grid-template-columns:1fr; gap:24px; align-items:center; }
    @media(min-width:760px){ .${P}__card{ grid-template-columns:.85fr 1.15fr; gap:40px; } }
    .${P}__m{ position:relative; aspect-ratio:16/9; border-radius:6px; overflow:hidden; border:1px solid var(--line-soft);
      background:var(--ink-3) repeating-linear-gradient(122deg,rgba(243,237,226,.022) 0 1px,transparent 1px 11px); }
    @media(min-width:760px){ .${P}__m{ aspect-ratio:4/3; } }
    .${P}__m img{ width:100%; height:100%; object-fit:cover; transition:transform .9s cubic-bezier(.16,1,.3,1); }
    .${P}:hover .${P}__m img{ transform:scale(1.04); }
    .${P}__cat{ position:absolute; top:12px; left:12px; z-index:2; font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.18em; text-transform:uppercase;
      color:var(--tx); background:rgba(11,10,8,.6); backdrop-filter:blur(4px); padding:6px 11px; border-radius:20px; border:1px solid var(--line-soft); }
    .${P}__meta{ display:flex; gap:14px; align-items:center; margin-bottom:10px; font-family:'Space Mono',monospace; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:var(--tx-dim); }
    .${P}__meta .d{ width:4px; height:4px; border-radius:50%; background:var(--g); }
    .${P}__t{ font-family:'Jost',sans-serif; font-weight:200; font-size:clamp(22px,2.8vw,38px); line-height:1.18; margin:0 0 22px; letter-spacing:-.01em; }
    .${P}__ex{ color:var(--tx-mid); line-height:1.65; font-size:clamp(14px,1.05vw,16px); max-width:48ch; margin-bottom:18px; }
    .${P}__btn{ font-family:'Space Mono',monospace; font-size:12px; letter-spacing:.16em; text-transform:uppercase; display:inline-flex; gap:.7em; align-items:center; position:relative; color:var(--tx); background:none; border:0; cursor:pointer; padding:0; }
    .${P}__btn::after{ content:""; position:absolute; left:0; bottom:-5px; width:100%; height:1px; background:var(--g); transform:scaleX(0); transform-origin:right; transition:transform .5s cubic-bezier(.16,1,.3,1); }
    .${P}__btn:hover::after{ transform:scaleX(1); transform-origin:left; }
    .${P}__btn .a{ color:var(--g); transition:transform .4s cubic-bezier(.16,1,.3,1); }
    .${P}__btn:hover .a{ transform:translateX(5px); }
    .${P}__btn .lbl-close{ display:none; }
    .${P}.open .${P}__btn .lbl-open{ display:none; }
    .${P}.open .${P}__btn .lbl-close{ display:inline; }
    .${P}.open .${P}__btn .a{ transform:rotate(-90deg); }
    .${P}__panel{ overflow:hidden; transition:margin-top .68s cubic-bezier(.16,1,.3,1); }
    .${P}.open .${P}__panel{ margin-top:clamp(26px,4vh,46px); }
    .${P}__inner{ height:0; overflow:hidden; }
    .${P}__article{ border:1px solid var(--line-soft); border-radius:10px; overflow:hidden; background:var(--bg); }
    .${B}{ background:var(--bg); color:#efe7d6; }
    .${B} .eyebrow{ font-family:'Hanken Grotesk',system-ui,sans-serif; font-weight:600; font-size:11px; letter-spacing:.32em; text-transform:uppercase; color:var(--gold); }
    .${B}__hero{ position:relative; width:100%; min-height:480px; overflow:hidden; }
    @media(min-width:760px){ .${B}__hero{ min-height:520px; aspect-ratio:21/9; } }
    .${B}__hero img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
    .${B}__hero::after{ content:""; position:absolute; inset:0; background:linear-gradient(180deg, rgba(18,13,8,.30) 0%, transparent 30%, rgba(18,13,8,.62) 66%, var(--bg) 97%); }
    .${B}__hero-in{ position:absolute; left:0; right:0; bottom:0; z-index:2; padding:clamp(24px,5vw,60px); max-width:900px; }
    .${B}__hero-in .eyebrow{ display:inline-flex; gap:.8em; align-items:center; }
    .${B}__hero-in .eyebrow .dot{ width:4px; height:4px; border-radius:50%; background:var(--gold); }
    .${B}__title{ font-family:'Cormorant Garamond',serif; font-weight:300; font-size:clamp(28px,4vw,52px); line-height:1.1; color:#efe7d6; margin:16px 0 0; max-width:20ch; text-wrap:balance; }
    .${B}__rule{ width:60px; height:1px; background:var(--gold); margin:22px 0; }
    .${B}__sub{ font-family:'Cormorant Garamond',serif; font-style:italic; font-size:clamp(17px,1.6vw,22px); color:var(--gold-soft); max-width:620px; margin:0; line-height:1.5; }
    .${B}__body{ max-width:720px; margin:0 auto; padding:clamp(36px,6vh,70px) clamp(24px,4vw,48px) clamp(20px,3vh,32px); }
    .${B}__body p{ font-size:17px; line-height:1.75; color:#efe7d6; margin:0 0 22px; text-wrap:pretty; }
    .${B}__body p strong{ color:var(--gold-soft); font-weight:500; }
    .${B}__body p em{ color:var(--gold-soft); }
    .${B}__body h2{ font-family:'Cormorant Garamond',serif; font-weight:500; font-size:clamp(22px,2.6vw,26px); color:var(--gold); line-height:1.2; margin:48px 0 18px; }
    .${B}__body figure{ margin:44px 0; }
    .${B}__body figure img{ width:100%; aspect-ratio:3/2; object-fit:cover; border-radius:4px; display:block; }
    @media(prefers-reduced-motion:reduce){ .${P}__panel{ transition:none; } }
  </style>

  <div class="${P}__card">
    <div class="${P}__m">
      <span class="${P}__cat">${esc(cat)}</span>${capaCartao}
    </div>
    <div class="${P}__info">
      <div class="${P}__meta"><span>${quando}</span><span class="d"></span><span>${input.readingMin} min</span></div>
      <h2 class="${P}__t">${esc(input.title)}</h2>
      <p class="${P}__ex">${esc(sub)}</p>
      <button class="${P}__btn" id="rlpToggle${n}" aria-expanded="false">
        <span class="lbl-open">Ler artigo</span><span class="lbl-close">Fechar artigo</span> <span class="a">→</span>
      </button>
    </div>
  </div>

  <div class="${P}__panel"><div class="${P}__inner">
    <div class="${P}__article">
      <div class="${B}">
        <div class="${B}__hero">${capaHero}
          <div class="${B}__hero-in">
            <span class="eyebrow">${esc(cat)} <span class="dot"></span> ${input.readingMin} min de leitura</span>
            <h1 class="${B}__title">${esc(input.title)}</h1>
            <div class="${B}__rule"></div>
            <p class="${B}__sub">${esc(sub)}</p>
          </div>
        </div>
        <div class="${B}__body">
${corpoHtml(input.body, input.bodyUrls, input.title)}
        </div>
      </div>
    </div>
  </div></div>

  <script>
    (function(){
      var root=document.currentScript.closest('.${P}'); if(!root) return;
      root.querySelectorAll('.${B}__body figure img').forEach(function(img){
        img.addEventListener('error', function(){ var f=img.closest('figure'); if(f) f.remove(); });
      });
      var btn=root.querySelector('#rlpToggle${n}');
      var inner=root.querySelector('.${P}__inner');
      var EASE='cubic-bezier(.16,1,.3,1)', DUR=680;
      var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      function clearAnims(){ if(inner.getAnimations) inner.getAnimations().forEach(function(a){ a.cancel(); }); }
      btn.addEventListener('click', function(){
        var willOpen=!root.classList.contains('open');
        clearAnims();
        if(willOpen){
          root.classList.add('open'); btn.setAttribute('aria-expanded','true');
          inner.style.height='auto';
          if(reduce) return;
          var end=inner.getBoundingClientRect().height;
          inner.animate([{height:'0px'},{height:end+'px'}],{duration:DUR,easing:EASE,fill:'none'});
          setTimeout(function(){ if(root.classList.contains('open')){ clearAnims(); inner.style.height='auto'; } }, DUR+90);
        } else {
          var start=inner.getBoundingClientRect().height;
          root.classList.remove('open'); btn.setAttribute('aria-expanded','false');
          inner.style.height='0px';
          if(reduce) return;
          inner.animate([{height:start+'px'},{height:'0px'}],{duration:DUR,easing:EASE,fill:'none'});
          setTimeout(function(){ if(!root.classList.contains('open')){ clearAnims(); inner.style.height='0px'; } }, DUR+90);
        }
      });
      window.addEventListener('resize', function(){ if(root.classList.contains('open')) inner.style.height='auto'; });
    })();
  </script>
</div>
`
}
