// Novo layout das secções: só dourado suave (#C9A84C), letra Roboto Condensed,
// cartões de cantos redondos com risco dourado à esquerda, pills compactas.
export const CSS_SECAO_NOVA = `
.secao-nova{
  --g:#C9A84C; --g-deep:#C9A84C; --ink:#070707;
  --fs:'Roboto Condensed',sans-serif; --fd:'Roboto Condensed',sans-serif;
  --fb:'Roboto Condensed',sans-serif; --fm:'Roboto Condensed',sans-serif;
}
.secao-nova .fx-grain{display:none;}
.secao-nova .eyebrow{font-size:12px;font-weight:700;letter-spacing:.3em;}
.secao-nova .pill{border-radius:999px !important;font-size:12px;font-weight:600;letter-spacing:.12em;padding:7px 14px;}
.secao-nova .pill.on{background:rgba(201,168,76,.14) !important;}
.secao-nova .btn-ghost{font-size:13px;}

.secao-nova .mg .mg-busca input{font-size:17px;}
.secao-nova .mg .mg-atalho{border-radius:999px;}
.secao-nova .mg .mg-painel{
  border-radius:18px; background:#111 !important;
  border-color:rgba(201,168,76,.14) !important; border-left:2px solid rgba(201,168,76,.35) !important;
}
.secao-nova .mg .mg-painel.aberto, .secao-nova .mg .mg-painel:hover{
  background:linear-gradient(135deg, rgba(201,168,76,.10), #111 60%) !important;
  border-color:rgba(201,168,76,.45) !important; border-left-color:#C9A84C !important;
  box-shadow:0 0 34px -18px rgba(201,168,76,.7);
}
.secao-nova .mg .mg-fila:hover .mg-painel.aberto:not(:hover){
  background:#111 !important; border-color:rgba(201,168,76,.14) !important;
  border-left-color:rgba(201,168,76,.35) !important; box-shadow:none;
}
.secao-nova .mg .mg-vert{text-transform:uppercase;font-weight:600;letter-spacing:.14em;font-size:clamp(15px,1.5vw,18px);}
.secao-nova .mg .mg-vert-num, .secao-nova .mg .mg-num{font-size:12px;letter-spacing:.15em;color:rgba(201,168,76,.7);}
.secao-nova .mg .mg-nome{text-transform:uppercase;font-weight:700;font-size:clamp(28px,3.2vw,46px);line-height:.95;}
.secao-nova .mg .mg-desc{font-size:15px;}
.secao-nova .mg .mg-icone{width:44px;height:44px;padding:11px;border-radius:999px;background:rgba(201,168,76,.12);opacity:1;}
.secao-nova .mg .mg-accao span{font-size:12px;font-weight:600;letter-spacing:.2em;}
.secao-nova .mg .mg-bola{border-color:rgba(201,168,76,.6);}
.secao-nova h1{font-family:'Roboto Condensed',sans-serif !important;font-weight:700 !important;color:#fff !important;letter-spacing:0 !important;}
.secao-nova [class*="text-emerald"], .secao-nova [class*="text-green"], .secao-nova [class*="text-red"], .secao-nova [class*="text-amber"]{color:#C9A84C !important;}
.secao-nova [class*="border-emerald"], .secao-nova [class*="border-green"], .secao-nova [class*="border-red"], .secao-nova [class*="border-amber"]{border-color:rgba(201,168,76,.4) !important;}
.secao-nova [class*="bg-emerald"], .secao-nova [class*="bg-green"], .secao-nova [class*="bg-red"], .secao-nova [class*="bg-amber"]{background-color:rgba(201,168,76,.14) !important;}
`
