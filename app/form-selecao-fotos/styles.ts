// Sistema visual das páginas de Seleção de Fotografias (cliente).
// Mesmo desenho das páginas públicas — ver /adquirir-fotografias.

export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,200;0,300;0,400;1,200;1,300&family=Hanken+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
.self{
  --ink:#0b0a08; --ink-2:#100e0b;
  --g:#d8be93;
  --tx:rgba(243,237,226,.92); --tx-mid:rgba(243,237,226,.6); --tx-dim:rgba(243,237,226,.4);
  --line:rgba(243,237,226,.14); --line-soft:rgba(243,237,226,.08);
  --fd:'Jost',sans-serif; --fb:'Hanken Grotesk',sans-serif; --fm:'Space Mono',monospace;
  --ease:cubic-bezier(.16,1,.3,1); --pad:clamp(20px,5vw,80px);
}
.self *{margin:0;padding:0;box-sizing:border-box;}
.self{background:var(--ink);color:var(--tx);font-family:var(--fb);line-height:1.5;overflow-x:hidden;min-height:100vh;display:flex;flex-direction:column;-webkit-font-smoothing:antialiased;}
.self a{color:inherit;text-decoration:none;}
.self ::selection{background:var(--g);color:var(--ink);}

.self .fx-grain{position:fixed;inset:0;z-index:9000;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");background-size:130px;}
.self .fx-vig{position:fixed;inset:0;z-index:8990;pointer-events:none;box-shadow:inset 0 0 240px 40px rgba(0,0,0,.5);}

.self .back{position:absolute;top:clamp(20px,4vh,34px);left:var(--pad);z-index:20;font-family:var(--fm);font-size:10px;letter-spacing:.35em;text-transform:uppercase;color:var(--tx-dim);transition:color .4s var(--ease);}
.self .back:hover{color:var(--g);}

.self .eyebrow{font-family:var(--fm);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--g);display:inline-flex;gap:.8em;align-items:center;}
.self .eyebrow::before{content:"";width:34px;height:1px;background:var(--g);opacity:.6;}
.self .wrap{width:100%;max-width:900px;margin:0 auto;padding-inline:var(--pad);text-align:center;}
.self h1,.self h2{font-family:var(--fd);font-weight:200;line-height:1.04;letter-spacing:-.02em;}

.self .phero{padding:clamp(90px,15vh,160px) var(--pad) clamp(30px,5vh,50px);text-align:center;}
.self .phero h1{font-size:clamp(38px,6.4vw,88px);}
.self .phero h1 em{font-style:italic;color:var(--g);}
.self .phero__sub{color:var(--tx-mid);max-width:56ch;margin:24px auto 0;line-height:1.7;font-size:clamp(15px,1.15vw,18px);}
.self .phero__sub strong{color:var(--g);font-weight:400;}

.self .info{display:grid;grid-template-columns:1fr;gap:16px;margin:clamp(30px,5vh,50px) 0 0;}
@media(min-width:720px){.self .info{grid-template-columns:repeat(2,1fr);}}
.self .icard{border:1px solid var(--line-soft);border-radius:10px;padding:30px 24px;background:var(--ink-2);text-align:center;}
.self .icard .ic{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);}
.self .icard .iv{font-family:var(--fd);font-weight:200;font-size:clamp(28px,3vw,40px);margin:14px 0 8px;line-height:1;}
.self .icard .id{color:var(--tx-mid);font-size:13.5px;line-height:1.6;max-width:34ch;margin:0 auto;}

.self .block{margin:clamp(50px,8vh,90px) auto clamp(70px,10vh,120px);}
.self .block > .lbl{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:20px;text-align:center;}
.self .seg{display:grid;grid-template-columns:1fr;gap:12px;}
@media(min-width:620px){.self .seg{grid-template-columns:1fr 1fr;}}
.self .seg button{display:block;width:100%;text-align:center;cursor:pointer;border:1px solid var(--line-soft);border-radius:10px;padding:30px 28px;background:transparent;transition:border-color .4s var(--ease),background-color .4s var(--ease);}
.self .seg button:hover{border-color:var(--line);}
.self .seg button .t{font-family:var(--fd);font-weight:300;font-size:24px;color:var(--tx);display:block;transition:color .4s var(--ease);}
.self .seg button .d{font-family:var(--fm);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);margin-top:10px;display:block;}
.self .seg button.on{border-color:var(--g);background:rgba(216,190,147,.06);}
.self .seg button.on .t{color:var(--g);}
.self .chosen{font-family:var(--fm);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-mid);margin-top:22px;text-align:center;}
.self .chosen b{color:var(--g);font-weight:400;}

/* ── Instruções e formulário ─────────────────────────────────────────────── */
.self .instr{border:1px solid var(--line-soft);border-radius:10px;background:var(--ink-2);padding:clamp(26px,4vw,38px);text-align:left;margin-top:clamp(30px,5vh,50px);}
.self .instr h2{font-size:clamp(20px,2.4vw,26px);text-align:center;}
.self .instr p{color:var(--tx-mid);font-size:14.5px;line-height:1.75;margin-top:16px;}
.self .instr .ex{font-family:var(--fm);font-size:13px;letter-spacing:.1em;color:var(--g);text-align:center;border:1px solid var(--line-soft);border-radius:8px;padding:16px;margin-top:18px;background:rgba(216,190,147,.05);}

.self .form{display:grid;gap:30px;text-align:left;margin-top:clamp(40px,6vh,70px);}
.self .frow{display:grid;gap:30px;grid-template-columns:1fr;}
@media(min-width:620px){.self .frow.two{grid-template-columns:1fr 1fr;}}
.self .field label{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:12px;}
.self .field label .opt{color:var(--tx-dim);}
.self .field input,.self .field textarea{width:100%;background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--tx);
  font-family:var(--fd);font-weight:300;font-size:clamp(16px,1.5vw,20px);padding:8px 0 13px;outline:none;transition:border-color .4s var(--ease);}
.self .field input::placeholder,.self .field textarea::placeholder{color:var(--tx-dim);}
.self .field input:focus,.self .field textarea:focus{border-color:var(--g);}
.self .field textarea{resize:vertical;min-height:64px;}
.self .field input[type=date]{color-scheme:dark;cursor:pointer;}
.self .field .hint{font-family:var(--fm);font-size:10px;letter-spacing:.1em;color:var(--tx-dim);margin-top:10px;}

/* cards das secções — abrem para mostrar a lista de fotografias */
.self .cards{display:grid;grid-template-columns:1fr;gap:14px;}
@media(min-width:620px){.self .cards{grid-template-columns:1fr 1fr;}}
.self .scard{border:1px solid var(--line-soft);border-radius:10px;background:var(--ink-2);overflow:hidden;transition:border-color .4s var(--ease);}
.self .scard:hover{border-color:var(--line);}
.self .scard.has{border-color:rgba(216,190,147,.32);}
.self .scard.open{grid-column:1/-1;border-color:var(--g);}
.self .scard__head{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;text-align:left;
  padding:24px 26px;background:transparent;border:none;cursor:pointer;}
.self .scard__t{font-family:var(--fd);font-weight:300;font-size:clamp(17px,1.7vw,21px);color:var(--tx);}
.self .scard.open .scard__t,.self .scard.has .scard__t{color:var(--g);}
.self .scard__t .opt{font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-dim);margin-left:.6em;}
.self .scard__meta{display:flex;align-items:center;gap:16px;flex:none;}
.self .chev{font-family:var(--fd);font-size:20px;color:var(--tx-dim);transition:transform .4s var(--ease),color .4s var(--ease);display:inline-block;}
.self .scard.open .chev{transform:rotate(90deg);color:var(--g);}
.self .scard__body{padding:0 26px 26px;}
.self .loading{padding:4px 0 18px;}
.self .loading .track{height:2px;background:var(--line-soft);border-radius:2px;overflow:hidden;}
.self .loading .bar{display:block;height:100%;width:100%;background:var(--g);transform-origin:left;animation:selfload .7s var(--ease) forwards;}
.self .loading .lbl{font-family:var(--fm);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--tx-dim);margin-top:12px;}
@keyframes selfload{from{transform:scaleX(0);}to{transform:scaleX(1);}}

/* lista de fotografias por secção (mesmo padrão de /adquirir-fotografias) */
.self .fhead{display:flex;align-items:baseline;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px;}
.self .fhead label{margin-bottom:0;}
.self .count{font-family:var(--fm);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);}
.self .count.has{color:var(--g);}
.self .fotolist{display:flex;flex-direction:column;gap:12px;margin-bottom:14px;}
.self .fotorow{display:flex;align-items:center;gap:12px;}
.self .fotorow .idx{font-family:var(--fm);font-size:11px;letter-spacing:.06em;color:var(--tx-dim);width:30px;flex:none;}
.self .fotorow input{flex:1;background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--tx);
  font-family:var(--fd);font-weight:300;font-size:clamp(16px,1.4vw,20px);padding:6px 0 10px;outline:none;transition:border-color .4s var(--ease);}
.self .fotorow input::placeholder{color:var(--tx-dim);}
.self .fotorow input:focus{border-color:var(--g);}
.self .fotorow .rm{flex:none;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--tx-mid);cursor:pointer;font-size:13px;transition:.3s;}
.self .fotorow .rm:hover{border-color:var(--g);color:var(--g);}
.self .addfoto{font-family:var(--fm);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--g);background:transparent;
  border:1px solid var(--line);border-radius:40px;padding:12px 22px;cursor:pointer;transition:.3s var(--ease);}
.self .addfoto:hover{border-color:var(--g);background:rgba(216,190,147,.06);}
.self .vazio{font-family:var(--fm);font-size:10px;letter-spacing:.12em;color:var(--tx-dim);margin-bottom:14px;}
.self .totalgeral{display:flex;align-items:baseline;justify-content:space-between;gap:16px;border-top:1px solid var(--line-soft);padding-top:24px;}
.self .totalgeral .k{font-family:var(--fm);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--tx);}
.self .totalgeral .v{font-family:var(--fd);font-weight:200;font-size:clamp(34px,4vw,52px);color:var(--g);line-height:.9;}

.self .btn{display:inline-flex;align-items:center;justify-content:center;gap:.9em;width:100%;position:relative;isolation:isolate;
  font-family:var(--fm);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);
  padding:20px 38px;border:1px solid var(--g);border-radius:40px;overflow:hidden;background:var(--g);cursor:pointer;
  transition:color .5s var(--ease);margin-top:10px;}
.self .btn .fill{position:absolute;inset:0;z-index:-1;background:var(--ink);transform:translateY(101%);transition:transform .6s var(--ease);}
.self .btn .dot{width:5px;height:5px;border-radius:50%;background:var(--ink);transition:background .5s;}
.self .btn:hover{color:var(--g);}.self .btn:hover .fill{transform:translateY(0);}.self .btn:hover .dot{background:var(--g);}
.self .btn:disabled{opacity:.5;cursor:default;}
.self .enviando{margin-top:10px;text-align:center;}
.self .enviando .track{height:3px;background:var(--line-soft);border-radius:3px;overflow:hidden;}
.self .enviando .bar{display:block;height:100%;background:var(--g);border-radius:3px;transition:width .12s linear;}
.self .enviando .pct{font-family:var(--fd);font-weight:200;font-size:clamp(34px,4vw,52px);color:var(--g);line-height:1;margin-top:20px;}
.self .enviando .lbl{font-family:var(--fm);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--tx-dim);margin-top:12px;}

.self .note{font-family:var(--fm);font-size:10px;letter-spacing:.12em;color:var(--tx-dim);text-align:center;margin-top:16px;line-height:1.6;}
.self .err{font-family:var(--fm);font-size:11px;letter-spacing:.1em;color:#e0a0a0;text-align:center;margin-top:16px;}

.self .sent{text-align:center;padding:clamp(60px,12vh,140px) var(--pad);}
.self .sent .mk{width:70px;height:70px;border:1px solid var(--g);border-radius:50%;display:grid;place-items:center;margin:0 auto 28px;color:var(--g);font-size:26px;}
.self .sent h2{font-size:clamp(30px,5vw,60px);}
.self .sent h2 em{font-style:italic;color:var(--g);}
.self .sent p{color:var(--tx-mid);max-width:48ch;margin:20px auto 0;line-height:1.7;}
.self .sent .recap{font-family:var(--fm);font-size:12px;letter-spacing:.08em;color:var(--g);margin-top:24px;}

.self .r{opacity:0;transform:translateY(26px);transition:opacity 1s var(--ease),transform 1s var(--ease);}
.self .r.in{opacity:1;transform:none;}
@media(prefers-reduced-motion:reduce){.self .r{opacity:1;transform:none;}}

.self .foot{margin-top:auto;background:var(--ink-2);border-top:1px solid var(--line-soft);padding:clamp(40px,6vh,70px) 0;text-align:center;}
.self .foot .fm{font-family:var(--fm);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);}
.self .foot a{color:var(--g);}
`
