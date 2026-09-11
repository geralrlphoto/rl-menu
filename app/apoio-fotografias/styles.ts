// Sistema visual da página de Apoio ao Cliente (fotografias).
// Mesmo desenho das páginas públicas — ver /adquirir-fotografias.

export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,200;0,300;0,400;1,200;1,300&family=Hanken+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
.apoio{
  --ink:#0b0a08; --ink-2:#100e0b;
  --g:#d8be93;
  --tx:rgba(243,237,226,.92); --tx-mid:rgba(243,237,226,.6); --tx-dim:rgba(243,237,226,.4);
  --line:rgba(243,237,226,.14); --line-soft:rgba(243,237,226,.08);
  --fd:'Jost',sans-serif; --fb:'Hanken Grotesk',sans-serif; --fm:'Space Mono',monospace;
  --ease:cubic-bezier(.16,1,.3,1); --pad:clamp(20px,5vw,80px);
}
.apoio *{margin:0;padding:0;box-sizing:border-box;}
.apoio{background:var(--ink);color:var(--tx);font-family:var(--fb);line-height:1.5;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column;-webkit-font-smoothing:antialiased;}
.apoio a{color:inherit;text-decoration:none;}
.apoio ::selection{background:var(--g);color:var(--ink);}

.apoio .fx-grain{position:fixed;inset:0;z-index:9000;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");background-size:130px;}
.apoio .fx-vig{position:fixed;inset:0;z-index:8990;pointer-events:none;box-shadow:inset 0 0 240px 40px rgba(0,0,0,.5);}

.apoio .eyebrow{font-family:var(--fm);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--g);display:inline-flex;gap:.8em;align-items:center;}
.apoio .eyebrow::before{content:"";width:34px;height:1px;background:var(--g);opacity:.6;}
.apoio .wrap{width:100%;max-width:900px;margin:0 auto;padding-inline:var(--pad);text-align:center;}
.apoio h1,.apoio h2,.apoio h3{font-family:var(--fd);font-weight:200;line-height:1.04;letter-spacing:-.02em;}

.apoio .phero{padding:clamp(80px,13vh,150px) var(--pad) clamp(26px,4vh,44px);text-align:center;}
.apoio .phero h1{font-size:clamp(38px,6.4vw,88px);}
.apoio .phero h1 em{font-style:italic;color:var(--g);}
.apoio .phero__sub{color:var(--tx-mid);max-width:56ch;margin:24px auto 0;line-height:1.7;font-size:clamp(15px,1.15vw,18px);}
.apoio .phero__sub strong{color:var(--g);font-weight:400;}

/* ── Passos ──────────────────────────────────────────────────────────────── */
.apoio .steps{display:inline-flex;align-items:center;gap:14px;margin:clamp(26px,4vh,40px) auto 0;}
.apoio .steps .st{font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-dim);display:inline-flex;align-items:center;gap:.7em;}
.apoio .steps .st .n{width:24px;height:24px;border-radius:50%;border:1px solid var(--line);display:grid;place-items:center;font-size:10px;}
.apoio .steps .st.on{color:var(--g);}
.apoio .steps .st.on .n{border-color:var(--g);}
.apoio .steps .sep{width:40px;height:1px;background:var(--line-soft);}

/* ── Blocos e formulário ─────────────────────────────────────────────────── */
.apoio .block{margin:clamp(40px,6vh,70px) auto clamp(60px,9vh,110px);}
.apoio .block > .lbl{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:22px;text-align:center;}

.apoio .form{display:grid;gap:30px;text-align:left;}
.apoio .frow{display:grid;gap:30px;grid-template-columns:1fr;}
@media(min-width:620px){.apoio .frow.two{grid-template-columns:1fr 1fr;}}
.apoio .field label{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:12px;}
.apoio .field label .opt{color:var(--tx-dim);}
.apoio .field input{width:100%;background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--tx);
  font-family:var(--fd);font-weight:300;font-size:clamp(16px,1.5vw,20px);padding:8px 0 13px;outline:none;transition:border-color .4s var(--ease);}
.apoio .field input::placeholder{color:var(--tx-dim);}
.apoio .field input:focus{border-color:var(--g);}
.apoio .field input[type=date]{color-scheme:dark;cursor:pointer;}
.apoio .field .hint{font-family:var(--fm);font-size:10px;letter-spacing:.1em;color:var(--tx-dim);margin-top:10px;}

/* ── Temas (2.ª fase) ────────────────────────────────────────────────────── */
.apoio .seg{display:grid;grid-template-columns:1fr;gap:12px;}
@media(min-width:620px){.apoio .seg{grid-template-columns:1fr 1fr;}}
.apoio .seg button{display:block;width:100%;text-align:center;cursor:pointer;border:1px solid var(--line-soft);border-radius:10px;padding:30px 28px;background:transparent;transition:border-color .4s var(--ease),background-color .4s var(--ease);}
.apoio .seg button:hover{border-color:var(--line);}
.apoio .seg button .t{font-family:var(--fd);font-weight:300;font-size:clamp(19px,2vw,23px);color:var(--tx);display:block;transition:color .4s var(--ease);}
.apoio .seg button .d{font-family:var(--fm);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);margin-top:10px;display:block;}
.apoio .seg button.on{border-color:var(--g);background:rgba(216,190,147,.06);}
.apoio .seg button.on .t{color:var(--g);}

/* ── Resposta ────────────────────────────────────────────────────────────── */
.apoio .answer{border:1px solid var(--line-soft);border-radius:10px;background:var(--ink-2);padding:clamp(26px,4vw,38px);text-align:left;margin-top:clamp(26px,4vh,44px);}
.apoio .answer .ac{font-family:var(--fm);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--g);}
.apoio .answer h2{font-size:clamp(22px,2.8vw,30px);margin-top:12px;}
.apoio .answer p{color:var(--tx-mid);font-size:14.5px;line-height:1.75;margin-top:16px;}
.apoio .answer p strong{color:var(--g);font-weight:400;}
.apoio .answer .prazo{border:1px solid rgba(216,190,147,.32);border-radius:8px;background:rgba(216,190,147,.05);padding:20px 22px;margin-top:22px;text-align:center;}
.apoio .answer .prazo .k{font-family:var(--fm);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--g);}
.apoio .answer .prazo .v{font-family:var(--fd);font-weight:200;font-size:clamp(28px,3.4vw,42px);color:var(--tx);line-height:1;margin-top:12px;}
.apoio .answer .prazo .d{color:var(--tx-mid);font-size:13.5px;line-height:1.65;margin-top:12px;}
.apoio .answer ul{list-style:none;margin-top:18px;display:grid;gap:12px;}
.apoio .answer li{color:var(--tx-mid);font-size:14.5px;line-height:1.65;display:flex;gap:.8em;align-items:flex-start;}
.apoio .answer li .dot{color:var(--g);flex:none;}
.apoio .answer li b{color:var(--tx);font-weight:400;}

/* ── Opções finais (3.º passo da resposta) ───────────────────────────────── */
.apoio .opcoes{margin-top:clamp(30px,5vh,50px);}
.apoio .opcoes > .lbl{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:20px;text-align:center;}
@media(min-width:820px){.apoio .seg.tres{grid-template-columns:repeat(3,1fr);}}
.apoio .seg.tres button{padding:26px 22px;display:flex;align-items:center;justify-content:center;min-height:110px;}
.apoio .seg.tres button .t{font-size:clamp(16px,1.6vw,18px);line-height:1.4;}
.apoio .resposta{border:1px solid rgba(216,190,147,.32);border-radius:10px;background:rgba(216,190,147,.05);padding:clamp(26px,4vw,34px);margin-top:18px;text-align:center;}
.apoio .resposta .mk{width:54px;height:54px;border:1px solid var(--g);border-radius:50%;display:grid;place-items:center;margin:0 auto 18px;color:var(--g);font-size:20px;}
.apoio .resposta h3{font-size:clamp(22px,2.6vw,28px);color:var(--tx);}
.apoio .resposta p{color:var(--tx-mid);font-size:14.5px;line-height:1.75;margin-top:14px;max-width:52ch;margin-inline:auto;}
.apoio .resposta p strong{color:var(--g);font-weight:400;}
.apoio .resposta .aenviar{font-family:var(--fm);font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--g);margin-top:0;}

/* ── Recapitulação dos dados ─────────────────────────────────────────────── */
.apoio .recap{border:1px solid var(--line-soft);border-radius:10px;background:var(--ink-2);padding:22px 24px;text-align:left;
  display:grid;gap:16px;grid-template-columns:1fr;margin-bottom:clamp(26px,4vh,40px);}
@media(min-width:620px){.apoio .recap{grid-template-columns:repeat(3,1fr);}}
.apoio .recap .k{font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-dim);}
.apoio .recap .v{font-family:var(--fd);font-weight:300;font-size:17px;color:var(--tx);margin-top:6px;word-break:break-word;}
.apoio .recap .v.g{color:var(--g);}

/* ── Botões ──────────────────────────────────────────────────────────────── */
.apoio .btn{display:inline-flex;align-items:center;justify-content:center;gap:.9em;width:100%;position:relative;isolation:isolate;
  font-family:var(--fm);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);
  padding:20px 38px;border:1px solid var(--g);border-radius:40px;overflow:hidden;background:var(--g);cursor:pointer;
  transition:color .5s var(--ease);margin-top:10px;}
.apoio .btn .fill{position:absolute;inset:0;z-index:-1;background:var(--ink);transform:translateY(101%);transition:transform .6s var(--ease);}
.apoio .btn .dot{width:5px;height:5px;border-radius:50%;background:var(--ink);transition:background .5s;}
.apoio .btn:hover{color:var(--g);}.apoio .btn:hover .fill{transform:translateY(0);}.apoio .btn:hover .dot{background:var(--g);}
.apoio .ghost{font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-dim);background:transparent;
  border:1px solid var(--line);border-radius:40px;padding:13px 24px;cursor:pointer;transition:.4s var(--ease);}
.apoio .ghost:hover{border-color:var(--g);color:var(--g);}
.apoio .actions{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:clamp(26px,4vh,40px);}

.apoio .note{font-family:var(--fm);font-size:10px;letter-spacing:.12em;color:var(--tx-dim);text-align:center;margin-top:16px;line-height:1.6;}
.apoio .err{font-family:var(--fm);font-size:11px;letter-spacing:.1em;color:#e0a0a0;text-align:center;margin-top:16px;}

.apoio .r{opacity:0;transform:translateY(26px);transition:opacity 1s var(--ease),transform 1s var(--ease);}
.apoio .r.in{opacity:1;transform:none;}
@media(prefers-reduced-motion:reduce){.apoio .r{opacity:1;transform:none;}}

.apoio .foot{margin-top:auto;background:var(--ink-2);border-top:1px solid var(--line-soft);padding:clamp(40px,6vh,70px) 0;text-align:center;}
.apoio .foot .fm{font-family:var(--fm);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);}
.apoio .foot a{color:var(--g);}
`
