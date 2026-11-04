/* Testemunho em destaque no portal da reunião (/r casamento), logo abaixo dos
   4 painéis "Uma conversa, não uma proposta". Mostra a abertura do testemunho da
   Catarina e do Ruben (mesmo visual do topo da página no site) e leva à história
   completa em rlphotovideo.pt/testemunho. */

const LINK = 'https://rlphotovideo.pt/testemunho'

export default function TestemunhoDestaque() {
  return (
    <section className="td" aria-labelledby="td-t">
      <style>{CSS}</style>
      <div className="td-foto">
        <img
          src="/testemunho-catarina-ruben-1200.webp"
          srcSet="/testemunho-catarina-ruben-1200.webp 1200w, /testemunho-catarina-ruben-2400.webp 2400w"
          sizes="(max-width: 760px) 100vw, 60vw"
          alt="Catarina e Ruben abraçados numa vinha ao pôr do sol"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="td-in">
        <p className="td-id"><span>Testemunho Nº 001</span><span>Catarina &amp; Ruben</span></p>
        <h2 id="td-t" className="td-t">
          <span>Não nos conheciam.</span>
          <span>Não tinham referências nossas.</span>
          <span>Mas confiaram.</span>
        </h2>
        <p className="td-sub">
          Uma história sobre confiança, escolhas e a responsabilidade de contar um dos dias mais importantes da vida de um casal.
        </p>
        <a className="td-btn" href={LINK} target="_blank" rel="noopener noreferrer">
          Ler a história deles
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M1 8h13M9 3l5 5-5 5" /></svg>
        </a>
      </div>
    </section>
  )
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400&family=Inter:wght@500&family=Lora:ital@1&family=Marcellus&display=swap');
.td{position:relative;display:flex;align-items:center;min-height:clamp(560px,86vh,820px);background:#120d00;color:#f5f1ea;overflow:hidden;border-top:1px solid var(--line-soft);}
/* Computador: foto à direita, texto à esquerda sobre o castanho (o casal fica sempre visível) */
.td-foto{position:absolute;top:0;right:0;bottom:0;width:58%;}
.td-foto img{width:100%;height:100%;object-fit:cover;object-position:62% 45%;display:block;}
.td-foto::after{content:'';position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(to right,#120d00 0%,rgba(18,13,0,.75) 12%,rgba(18,13,0,.3) 28%,rgba(18,13,0,0) 46%),
             linear-gradient(to bottom,rgba(18,13,0,.5) 0%,rgba(18,13,0,0) 18%,rgba(18,13,0,0) 75%,rgba(18,13,0,.5) 100%);}
.td-in > *{max-width:min(44vw,640px);}
.td-in{position:relative;z-index:1;width:100%;max-width:1240px;margin:0 auto;padding:clamp(64px,10vh,110px) var(--pad,24px);}
.td-id{display:flex;flex-wrap:wrap;align-items:center;gap:10px 28px;margin:0;font:500 11px/1 'Inter',Arial,sans-serif;letter-spacing:.26em;text-transform:uppercase;color:#f5f1ea;}
.td-id span:first-child{color:rgba(245,241,234,.68);}
.td-id span+span::before{content:'';display:inline-block;width:28px;height:1px;background:currentColor;vertical-align:middle;margin-right:28px;opacity:.6;}
.td-t{margin:clamp(24px,4vh,36px) 0 0;font-family:'Marcellus','Times New Roman',serif;font-weight:400;color:#f5f1ea;font-size:clamp(36px,4.6vw,76px);line-height:1.05;letter-spacing:-.012em;max-width:16ch;}
.td-t span{display:block;}
.td-t span:last-child{font-family:'Lora',Georgia,serif;font-style:italic;}
.td-sub{max-width:40ch;margin:clamp(22px,3.5vh,32px) 0 0;font-family:'Barlow','Helvetica Neue',Arial,sans-serif;font-size:clamp(16px,1.3vw,19px);line-height:1.6;color:rgba(245,241,234,.75);}
.td-btn{display:inline-flex;align-items:center;gap:12px;margin-top:clamp(30px,5vh,44px);padding:15px 26px;min-height:48px;border:1px solid #f5f1ea;border-radius:5px;
  font:500 14px/1.3 'Inter',Arial,sans-serif;letter-spacing:.06em;color:#f5f1ea;text-decoration:none;transition:background .35s ease,color .35s ease;}
.td-btn svg{width:16px;height:16px;flex:none;transition:transform .35s ease;}
.td-btn:hover{background:#f5f1ea;color:#120d00;}
.td-btn:hover svg{transform:translateX(4px);}
.td-btn:focus-visible{outline:1px solid #f5f1ea;outline-offset:4px;}

/* Telemóvel: foto em cima, desvanece para o castanho, texto em baixo */
@media (max-width:900px){
  .td{display:block;min-height:0;}
  .td-foto{position:relative;width:100%;height:64vh;min-height:360px;}
  .td-foto img{object-position:55% 35%;}
  .td-foto::after{background:linear-gradient(to bottom,rgba(18,13,0,.45) 0%,rgba(18,13,0,0) 22%,rgba(18,13,0,0) 55%,#120d00 100%);}
  .td-in{margin-top:-40px;padding-top:0;padding-bottom:64px;}
  .td-in > *{max-width:none;}
}
@media (prefers-reduced-motion:reduce){.td-btn,.td-btn svg{transition:none;}}
`
