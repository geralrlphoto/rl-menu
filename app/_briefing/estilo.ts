// Estilo partilhado pelos briefings públicos (/nova-lead e /batizado):
// "a pré-produção do vosso filme", manifesto na abertura e perguntas em cenas.
// O @import tem de viajar num <style> em runtime: o Turbopack remove os
// @import dos ficheiros .css no build de produção.
export const CSS_BRIEFING = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:ital,wght@0,200;0,300;0,400;1,200;1,300&family=Hanken+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
.nlead{
  --ink:#0b0a08; --ink-2:#100e0b; --ink-3:#16130f;
  --g:#d8be93; --g-deep:#c8a866;
  --tx:rgba(243,237,226,.94); --tx-mid:rgba(243,237,226,.64); --tx-dim:rgba(243,237,226,.4);
  --line:rgba(243,237,226,.16); --line-soft:rgba(243,237,226,.08);
  --fs:'Cormorant Garamond',serif; --fd:'Jost',sans-serif; --fb:'Hanken Grotesk',sans-serif; --fm:'Space Mono',monospace;
  --ease:cubic-bezier(.16,1,.3,1);
  background:var(--ink); color:var(--tx); font-family:var(--fb); line-height:1.5;
  min-height:100vh; -webkit-font-smoothing:antialiased;
}
.nlead ::selection{background:var(--g);color:var(--ink);}
.nlead .fx-grain{position:fixed;inset:0;z-index:40;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");background-size:130px;}

.nlead h1,.nlead h2{font-family:var(--fs);font-weight:300;line-height:1.02;letter-spacing:-.01em;color:var(--tx);}
.nlead h1 em,.nlead h2 em{font-style:italic;color:var(--g);}
.nlead .eyebrow{font-family:var(--fm);font-size:10.5px;letter-spacing:.34em;text-transform:uppercase;color:var(--g);display:inline-flex;gap:.8em;align-items:center;}
.nlead .eyebrow::before{content:"";width:30px;height:1px;background:var(--g);opacity:.6;}
.nlead .lead{color:var(--tx-mid);line-height:1.75;font-size:clamp(15px,1.12vw,17.5px);}
.nlead .quest{font-family:var(--fs);font-weight:300;font-size:clamp(23px,2.3vw,30px);line-height:1.2;color:var(--tx);}
.nlead .quest em{font-style:italic;color:var(--g);}
.nlead .hint{font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-dim);}

.nlead .flabel{font-family:var(--fm);font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:12px;}
.nlead .flabel .opt{color:var(--tx-dim);}
.nlead .finput{width:100%;background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--tx);
  font-family:var(--fd);font-weight:300;font-size:clamp(17px,1.5vw,21px);padding:8px 0 13px;outline:none;
  transition:border-color .4s var(--ease);}
.nlead .finput::placeholder{color:var(--tx-dim);}
.nlead .finput:focus{border-color:var(--g);}
.nlead select.finput{appearance:none;cursor:pointer;}
.nlead select.finput option{background:var(--ink-2);color:var(--tx);}
.nlead textarea.finput{resize:none;min-height:74px;font-size:clamp(16px,1.35vw,19px);}
.nlead input[type=date].finput{color-scheme:dark;}

.nlead .pill{font-family:var(--fm);font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-mid);
  background:transparent;border:1px solid var(--line-soft);border-radius:40px;padding:11px 20px;cursor:pointer;transition:.3s var(--ease);}
.nlead .pill:hover{border-color:var(--line);color:var(--tx);}
.nlead .pill.on{border-color:var(--g);background:rgba(216,190,147,.07);color:var(--g);}

.nlead .segbtn{display:flex;align-items:center;gap:14px;width:100%;text-align:left;border:1px solid var(--line-soft);
  border-radius:10px;padding:16px 20px;background:transparent;cursor:pointer;transition:.4s var(--ease);}
.nlead .segbtn:hover{border-color:var(--line);}
.nlead .segbtn.on{border-color:var(--g);background:rgba(216,190,147,.07);}
.nlead .segbtn .t{font-family:var(--fd);font-weight:300;font-size:18px;color:var(--tx-mid);line-height:1.25;}
.nlead .segbtn.on .t{color:var(--g);}
.nlead .segbtn.sm{padding:11px 14px;gap:11px;border-radius:9px;}
.nlead .segbtn.sm .t{font-size:15px;}
.nlead .mk{width:16px;height:16px;border-radius:50%;border:1px solid var(--line);flex:none;display:grid;place-items:center;transition:.3s;}
.nlead .segbtn.on .mk{border-color:var(--g);}
.nlead .segbtn.on .mk::after{content:"";width:6px;height:6px;border-radius:50%;background:var(--g);}
.nlead .segbtn.sm .mk{width:13px;height:13px;}
.nlead .segbtn.sm.on .mk::after{width:5px;height:5px;}

.nlead .btn{display:inline-flex;align-items:center;justify-content:center;gap:.9em;position:relative;isolation:isolate;
  font-family:var(--fm);font-size:11.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);
  padding:18px 34px;border:1px solid var(--g);border-radius:40px;overflow:hidden;background:var(--g);cursor:pointer;transition:color .5s var(--ease);}
.nlead .btn .fill{position:absolute;inset:0;z-index:-1;background:var(--ink);transform:translateY(101%);transition:transform .6s var(--ease);}
.nlead .btn:hover{color:var(--g);}
.nlead .btn:hover .fill{transform:translateY(0);}
.nlead .btn:disabled{opacity:.4;cursor:not-allowed;}
.nlead .btn:disabled .fill{transform:translateY(101%);}
.nlead .btn-ghost{font-family:var(--fm);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);
  background:none;border:none;cursor:pointer;display:inline-flex;align-items:center;gap:.7em;transition:color .3s;}
.nlead .btn-ghost:hover{color:var(--g);}
.nlead .err{font-family:var(--fm);font-size:11px;letter-spacing:.1em;color:#e59a88;}
.nlead .meta{font-family:var(--fm);font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--tx-dim);}

/* ── Abertura: manifesto ─────────────────────────────────────────────── */
@keyframes nlSobe{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
@keyframes nlRisca{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes nlZoom{from{transform:scale(1.12)}to{transform:scale(1)}}
.nlead .sobe{opacity:0;animation:nlSobe 1.1s var(--ease) forwards;}
.nlead .riscado{position:relative;display:inline-block;color:var(--tx-dim);}
.nlead .riscado::after{content:"";position:absolute;left:-2%;right:-2%;top:54%;height:2px;background:var(--g);
  transform:scaleX(0);transform-origin:left;animation:nlRisca .7s var(--ease) forwards;}
.nlead .hero-img{animation:nlZoom 9s ease-out forwards;}
.nlead .pilar{border-top:1px solid var(--line);padding-top:16px;}

/* ── Cenas: imagem ao lado + formulário ──────────────────────────────── */
.nlead .cena-img{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transform:scale(1.06);
  transition:opacity 1.1s ease, transform 6s ease-out;}
.nlead .cena-img.on{opacity:1;transform:scale(1);}
.nlead .fotograma{height:3px;flex:1;border-radius:2px;background:var(--line-soft);transition:background .6s var(--ease);}
.nlead .fotograma.feito{background:rgba(216,190,147,.45);}
.nlead .fotograma.agora{background:var(--g);}

@media (prefers-reduced-motion: reduce){
  .nlead .sobe{animation:none;opacity:1}
  .nlead .riscado::after{animation:none;transform:scaleX(1)}
  .nlead .hero-img{animation:none}
  .nlead .cena-img{transition:opacity .3s}
}
`
