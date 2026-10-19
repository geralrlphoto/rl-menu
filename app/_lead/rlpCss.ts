// Design partilhado dos portais da reunião (casamento /r e batizado /b).
// Linguagem RL: Jost fino nos títulos, Roboto Condensed no resto, dourado #d8be93,
// fundo #0b0b0b com grelha de pontos, cartões de vidro com barra dourada.
export const RLP_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,200;0,300;0,400;1,200;1,300&family=Roboto+Condensed:wght@100;300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap');

.rl-portal{
  --ink:#0b0b0b; --ink-2:#111111; --ink-3:#141414;
  --g:#d8be93; --g-deep:#c8a866;
  --tx:rgba(243,237,226,.92); --tx-mid:rgba(243,237,226,.6); --tx-dim:rgba(243,237,226,.4);
  --line:rgba(243,237,226,.14); --line-soft:rgba(243,237,226,.08);
  --fd:'Jost',sans-serif; --fb:'Roboto Condensed',sans-serif; --fm:'Roboto Condensed',sans-serif; --fs:'Jost',sans-serif;
  --glow:0 0 40px -18px rgba(216,190,147,.6); --glow-lg:0 0 48px -22px rgba(216,190,147,.5);
  --ease:cubic-bezier(.16,1,.3,1); --pad:clamp(20px,5vw,80px);
  color:var(--tx); font-family:var(--fb);
  /* Atmosfera RL (como /photo, /crm e portal dos noivos): brilho dourado + grelha de pontos */
  background-color:var(--ink);
  background-image:
    radial-gradient(ellipse 70% 45% at 50% 0%,rgba(216,190,147,.08),transparent 70%),
    radial-gradient(rgba(216,190,147,.10) 1px,transparent 1px);
  background-size:100% 100%,26px 26px;
  background-attachment:fixed,fixed;
  -webkit-font-smoothing:antialiased;
}
.rl-portal ::selection{background:rgba(216,190,147,.28);color:#0b0a08;}

/* Atmosfera */
/* (grão antigo desligado: a textura é a grelha de pontos do fundo) */
.rlp-grain{display:none;position:fixed;inset:0;z-index:9000;pointer-events:none;opacity:.05;mix-blend-mode:overlay;background-size:130px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");}
.rlp-vig{position:fixed;inset:0;z-index:8990;pointer-events:none;box-shadow:inset 0 0 240px 40px rgba(0,0,0,.5);}
.rlp-prog{position:fixed;top:0;left:0;height:2px;width:0;background:linear-gradient(90deg,rgba(216,190,147,.5),var(--g));box-shadow:0 0 12px rgba(216,190,147,.6);z-index:9100;transition:width .1s linear;}

/* Barra fixa */
.rlp-bar{position:fixed;left:0;width:100%;z-index:8000;display:flex;align-items:center;justify-content:space-between;padding:20px var(--pad);border-bottom:1px solid transparent;transition:background .6s var(--ease),padding .6s var(--ease),border-color .6s;}
.rlp-bar.s{background:rgba(11,11,11,.78);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding-top:13px;padding-bottom:13px;border-color:var(--line-soft);}
.rlp-mono{display:inline-flex;align-items:baseline;gap:.6em;text-decoration:none;}
.rlp-mono span{font-family:var(--fd);font-weight:300;letter-spacing:.3em;font-size:16px;color:var(--tx);}
.rlp-mono i{font-family:var(--fm);font-style:normal;font-weight:600;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--g);opacity:.85;}

/* Eyebrow */
.rlp-eyebrow{font-family:var(--fm);font-weight:600;font-size:11px;letter-spacing:.4em;text-transform:uppercase;color:var(--g);display:inline-flex;gap:.8em;align-items:center;}
.rlp-eyebrow::before{content:"";width:34px;height:1px;background:var(--g);opacity:.6;}
.rlp-eyebrow.c{justify-content:center;}

/* Contentor / secção */
.rlp-wrap{width:100%;max-width:1280px;margin:0 auto;padding-left:var(--pad);padding-right:var(--pad);}
.rlp-sec{position:relative;padding-top:clamp(60px,9vh,120px);padding-bottom:clamp(60px,9vh,120px);}

/* Títulos */
.rlp-h1{font-family:var(--fd);font-weight:200;line-height:.92;letter-spacing:-.02em;color:var(--tx);}
.rlp-h2{font-family:var(--fd);font-weight:200;line-height:1.04;letter-spacing:-.02em;font-size:clamp(30px,5vw,64px);color:var(--tx);}
.rlp-h2 em{font-style:italic;color:var(--g);}
.rlp-lede{font-family:var(--fb);font-weight:300;letter-spacing:.01em;color:var(--tx-mid);line-height:1.75;font-size:clamp(15px,1.4vw,18px);}
.rlp-ed{font-family:var(--fs);font-weight:200;color:var(--tx-mid);}
.rlp-ed em{font-style:italic;color:var(--g);}

/* Botões */
.rlp-btn{display:inline-flex;align-items:center;justify-content:center;gap:.9em;position:relative;isolation:isolate;font-family:var(--fm);font-weight:600;font-size:14px;letter-spacing:.2em;text-transform:uppercase;color:#fff;padding:17px 36px;border:1px solid rgba(216,190,147,.6);border-radius:40px;overflow:hidden;background:rgba(216,190,147,.15);box-shadow:0 0 34px -12px rgba(216,190,147,.7);transition:color .5s var(--ease),background .4s var(--ease),border-color .4s var(--ease),transform .4s var(--ease),opacity .3s;cursor:pointer;text-decoration:none;}
.rlp-btn .fill{position:absolute;inset:0;z-index:-1;background:rgba(216,190,147,.18);transform:translateY(101%);transition:transform .6s var(--ease);}
.rlp-btn .dot{width:5px;height:5px;border-radius:50%;background:var(--g);box-shadow:0 0 8px var(--g);transition:background .5s;flex:none;}
.rlp-btn:hover{border-color:var(--g);transform:translateY(-2px);} .rlp-btn:hover .fill{transform:translateY(0);}
.rlp-btn:disabled{opacity:.45;pointer-events:none;}
.rlp-btn.ghost{background:rgba(0,0,0,.3);color:var(--tx);border-color:rgba(255,255,255,.14);box-shadow:none;}
.rlp-btn.ghost .dot{background:var(--g);}
.rlp-btn.ghost .fill{background:rgba(255,255,255,.06);}
.rlp-btn.ghost:hover{border-color:rgba(255,255,255,.3);}

.rlp-btn.danger{background:transparent;color:#e79b9b;border-color:rgba(231,155,155,.4);box-shadow:none;}
.rlp-btn.danger .dot{background:#e79b9b;} .rlp-btn.danger .fill{background:rgba(231,155,155,.12);}
.rlp-btn.danger:hover{border-color:#e79b9b;}
.rlp-btn.full{width:100%;}

/* Link sublinhado */
.rlp-link-u{font-family:var(--fm);font-weight:600;font-size:13px;letter-spacing:.18em;text-transform:uppercase;display:inline-flex;gap:.7em;align-items:center;position:relative;color:var(--tx-mid);text-decoration:none;}
.rlp-link-u::after{content:"";position:absolute;left:0;bottom:-5px;width:100%;height:1px;background:var(--g);transform:scaleX(0);transform-origin:right;transition:transform .5s var(--ease);}
.rlp-link-u:hover::after{transform:scaleX(1);transform-origin:left;}
.rlp-link-u .a{color:var(--g);transition:transform .4s var(--ease);}
.rlp-link-u:hover .a{transform:translateX(5px);}

/* Placeholder de imagem */
.rlp-slot{position:relative;overflow:hidden;background:var(--ink-3);background-image:repeating-linear-gradient(122deg,rgba(243,237,226,.022) 0 1px,transparent 1px 11px);}
.rlp-slot .lab{position:absolute;inset:0;display:grid;place-items:center;text-align:center;font-family:var(--fm);font-weight:600;font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--tx-dim);padding:1em;}
.rlp-slot img{width:100%;height:100%;object-fit:cover;display:block;}

/* Cartão com sheen */
.rlp-card{border:1px solid rgba(216,190,147,.14);border-left:2px solid rgba(216,190,147,.45);border-radius:22px;background:rgba(17,17,17,.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);position:relative;overflow:hidden;box-shadow:var(--glow-lg);transition:border-color .5s var(--ease),transform .5s var(--ease),box-shadow .5s var(--ease);}
.rlp-card::before{content:"";position:absolute;top:0;left:-70%;width:55%;height:100%;background:linear-gradient(100deg,transparent,rgba(216,190,147,.08),transparent);transform:skewX(-18deg);animation:rlpSheen 6s ease-in-out infinite;pointer-events:none;}
@keyframes rlpSheen{0%{left:-70%}55%,100%{left:170%}}
.rlp-card:hover{border-color:rgba(216,190,147,.45);border-left-color:var(--g);transform:translateY(-2px);box-shadow:0 0 32px -14px rgba(216,190,147,.7);}

/* Linha de detalhe */
.rlp-drow{display:flex;align-items:center;justify-content:space-between;padding:16px 0;border-top:1px solid var(--line-soft);}
.rlp-drow:first-child{border-top:0;}
.rlp-drow .k{font-family:var(--fm);font-weight:600;font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--tx-dim);}
.rlp-drow .v{font-family:var(--fd);font-weight:300;font-size:clamp(16px,1.6vw,20px);color:var(--tx);}

/* Divisor */
.rlp-div{width:100%;max-width:1280px;margin:0 auto;height:1px;background:linear-gradient(90deg,transparent,rgba(216,190,147,.45),transparent);}

/* Footer */
.rlp-foot{background:rgba(6,6,6,.92);border-top:1px solid var(--line-soft);padding:clamp(50px,7vh,90px) 0 0;}
.rlp-foot h5{font-family:var(--fm);font-weight:600;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);margin-bottom:18px;}
.rlp-foot a{color:var(--tx-mid);text-decoration:none;transition:color .4s var(--ease);}
.rlp-foot a:hover{color:var(--tx);}
.rlp-foot .end{border-top:1px solid var(--line-soft);margin-top:clamp(40px,6vh,70px);padding:22px var(--pad);display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;font-family:var(--fm);font-size:12px;letter-spacing:.06em;color:var(--tx-dim);}

/* Botões de calendário */
.rlp-calbtn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:.6em;padding:13px 0;border:1px solid rgba(255,255,255,.14);border-radius:40px;font-family:var(--fm);font-weight:600;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-mid);background:transparent;cursor:pointer;transition:border-color .4s var(--ease),color .4s var(--ease);}
.rlp-calbtn:hover{border-color:rgba(216,190,147,.6);color:var(--g);box-shadow:0 0 24px -12px rgba(216,190,147,.7);}
.rlp-calbtn svg{width:13px;height:13px;}

/* Botão flutuante WhatsApp */
.rlp-wa{position:fixed;bottom:24px;right:24px;width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;z-index:8100;background:var(--g);color:var(--ink);box-shadow:0 10px 30px rgba(0,0,0,.4),0 0 30px -6px rgba(216,190,147,.55);transition:transform .4s var(--ease);}
.rlp-wa:hover{transform:translateY(-3px) scale(1.05);}

/* Editor (admin): janela centrada no estilo RL */
.rlp-ed-veu{position:fixed;inset:0;z-index:9200;background:rgba(5,5,5,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .35s var(--ease);}
.rlp-ed-veu.on{opacity:1;pointer-events:auto;}
.rlp-edw{position:fixed;left:50%;top:50%;z-index:9300;width:min(780px,calc(100vw - 32px));height:min(86vh,920px);display:flex;flex-direction:column;border-radius:22px;overflow:hidden;
  background:rgba(17,17,17,.95);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);
  border:1px solid rgba(216,190,147,.25);border-left:2px solid var(--g);
  box-shadow:0 0 60px -20px rgba(216,190,147,.55),0 40px 100px -30px rgba(0,0,0,.9);
  transform:translate(-50%,-47%) scale(.97);opacity:0;pointer-events:none;transition:opacity .35s var(--ease),transform .45s var(--ease);font-family:var(--fb);}
.rlp-edw.on{opacity:1;transform:translate(-50%,-50%);pointer-events:auto;}
.rlp-ed-cab{flex:none;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 26px 18px;border-bottom:1px solid rgba(216,190,147,.14);
  background:radial-gradient(ellipse 70% 120% at 0% 0%,rgba(216,190,147,.10),transparent 70%);}
.rlp-ed-tit{font-family:var(--fd);font-weight:200;font-size:30px;line-height:1;color:var(--tx);margin-top:10px;letter-spacing:-.01em;}
.rlp-ed-sub{font-family:var(--fm);font-weight:600;font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:var(--tx-dim);margin-top:8px;}
.rlp-ed-x{flex:none;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid rgba(216,190,147,.35);background:rgba(216,190,147,.08);color:var(--g);cursor:pointer;transition:background .3s,transform .3s;}
.rlp-ed-x:hover{background:rgba(216,190,147,.2);transform:rotate(90deg);}
.rlp-ed-corpo{flex:1 1 0;min-height:0;overflow-y:auto;padding:20px 26px 24px;display:flex;flex-direction:column;gap:10px;}
.rlp-ed-corpo > *{flex-shrink:0;}
.rlp-ed-corpo::-webkit-scrollbar{width:6px;} .rlp-ed-corpo::-webkit-scrollbar-thumb{background:rgba(216,190,147,.25);border-radius:6px;}
.rlp-ed-pe{flex:none;padding:16px 26px 20px;border-top:1px solid rgba(216,190,147,.14);display:flex;flex-direction:column;gap:8px;}
.rlp-ed-sec{border:1px solid rgba(255,255,255,.08);border-radius:18px;background:rgba(0,0,0,.3);overflow:hidden;transition:border-color .3s;}
.rlp-ed-sec.on{border-color:rgba(216,190,147,.35);border-left:2px solid rgba(216,190,147,.7);}
.rlp-ed-sec > button{width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px 18px;text-align:left;background:none;border:0;cursor:pointer;
  font-family:var(--fm);font-weight:600;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:rgba(243,237,226,.7);transition:color .3s;}
.rlp-ed-sec > button:hover,.rlp-ed-sec.on > button{color:var(--g);}
.rlp-ed-sec > button i{font-style:normal;color:var(--g);transition:transform .3s;}
.rlp-ed-sec.on > button i{transform:rotate(180deg);}
.rlp-ed-sec > div{padding:4px 18px 18px;display:flex;flex-direction:column;gap:16px;}
.rlp-ed-lab{font-family:var(--fm);font-weight:600;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:rgba(243,237,226,.45);}
.rlp-ed-guardar{width:100%;padding:15px;border-radius:999px;font-family:var(--fm);font-weight:600;font-size:13px;letter-spacing:.22em;text-transform:uppercase;cursor:pointer;transition:background .3s,box-shadow .3s;}
.rlp-ed-guardar:disabled{opacity:.5;cursor:default;}
@media (max-width:640px){ .rlp-edw{height:calc(100dvh - 24px);} .rlp-ed-cab,.rlp-ed-corpo,.rlp-ed-pe{padding-left:18px;padding-right:18px;} }

@media (max-width:760px){
  .rlp-foot .end{flex-direction:column;align-items:flex-start;}
  .rlp-mono i{display:none;}
}
@media (prefers-reduced-motion:reduce){
  .rlp-card::before{animation:none;}
}
`
