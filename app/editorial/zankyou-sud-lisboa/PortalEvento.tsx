import { montarEntregas, type EntregaLink } from '@/lib/editoriaisEntregas'
import MeteoEvento from '../MeteoEvento'
import { Contagem, ProgramaVivo } from './Vivo'

/* Portal do XIX Zankyou Wedding Club × SUD Lisboa (16/11/2026). Design claro e moderno:
   papel quente, terracota do pôr do sol e azul do Tejo (as cores do cartaz), Instrument Serif nos títulos
   e Inter Tight no texto, blocos arredondados ("bento"), contagem e programa vivos.
   A página (page.tsx) trata do acesso por senha; aqui só se desenha. */

const SLUG = 'zankyou-sud-lisboa'
const DATA = '2026-11-16'
const LAT = 38.696528, LON = -9.191611 // coordenadas do site do SUD Lisboa
const MORADA = 'Avenida Brasília, Pavilhão Poente (ao lado do MAAT), 1300-598 Lisboa'
const MAPA = `https://www.google.com/maps?q=${LAT},${LON}&z=16&output=embed`
const GMAPS = `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LON}`
const WAZE = `https://waze.com/ul?ll=${LAT},${LON}&navigate=yes`
const APPLE = `https://maps.apple.com/?daddr=${LAT},${LON}&q=SUD%20Lisboa`
const IMG = '/editorial/zankyou-sud-lisboa'

const PROGRAMA = [
  { hora: '15:00', fim: '16:00', nome: 'Chegada da equipa RL', equipa: true, texto: 'A equipa da RL Photo Video chega ao SUD Lisboa para o briefing e para captar o espaço e os detalhes antes da chegada dos convidados.' },
  { hora: '16:00', fim: '17:00', nome: 'Welcome & Connect', texto: 'Receção dos convidados, welcome drink e os primeiros momentos de networking.' },
  { hora: '17:00', fim: '18:00', nome: 'Inspire & Share', texto: 'Abertura oficial pela Zankyou Portugal, apresentação do conceito desta edição e agradecimento aos parceiros. Intervenção de um representante do SUD / SANA.' },
  { hora: '18:00', fim: '20:00', nome: 'Taste & Experience', texto: 'Uma experiência gastronómica e sensorial, onde os sabores se encontram com o espetáculo e a surpresa.' },
  { hora: '20:00', fim: '22:00', nome: "Let's Celebrate!", texto: 'Música, animação e boas conversas para celebrar as ligações que nos unem.' },
]

type Parceiro = { nome: string; papel: string; resp?: string; tel: string; email: string; ig: string; site?: string; rl?: boolean }
const PARCEIROS: Parceiro[] = [
  { nome: 'SUD Lisboa', papel: 'Espaço anfitrião', tel: '+351 211 592 703', email: 'nassir.amirali@sudlisboa.com', ig: 'sudlisboa', site: 'sudlisboa.com' },
  { nome: 'Floor Sensation', papel: 'Som, entretenimento e produção técnica', resp: 'Douglas Silva', tel: '+351 961 681 052', email: 'geral@floorsensation.pt', ig: 'floor_sensation', site: 'floorsensation.pt' },
  { nome: 'Madame Boutique Floral', papel: 'Decoração floral', resp: 'Vanessa Oliveira', tel: '+351 913 593 672', email: 'eventos@madameboutiquefloral.pt', ig: 'floristamadameboutiquefloral', site: 'floristamafra.pt' },
  { nome: 'Detail Wedding Photography', papel: 'Fotografia oficial', resp: 'Nuno e Fátima', tel: '+351 925 038 324', email: 'geral@detailphotography.pt', ig: '_detail_photography_', site: 'detailphotography.pt' },
  { nome: 'Annia', papel: 'Artista · live performance', tel: '+351 938 556 785', email: 'tania.silva@lifeliveevent.eu', ig: 'anniaoficial' },
  { nome: 'RL Photo Video', papel: 'Vídeo oficial', resp: 'Rui Gonçalves', tel: '+351 912 932 768', email: 'geral.rlphoto@gmail.com', ig: 'rlphoto_fotografia.video', site: 'rlphotovideo.pt', rl: true },
  { nome: 'Gio Rodrigues Atelier', papel: 'Fashion partner', tel: '+351 935 555 544', email: 'atelier@giorodrigues.com', ig: 'giorodriguesatelier', site: 'giorodrigues.com' },
  { nome: 'Filipa Martins Make Up & Hair', papel: 'Beauty partner', tel: '+351 937 795 305', email: 'filipamartinsmakeup@gmail.com', ig: 'filipamartins.makeup' },
  { nome: 'Halus Stories', papel: 'Jewellery partner', tel: '+351 911 999 618', email: 'mariana@halusstories.com', ig: 'halusstories', site: 'halusstories.com' },
]

const NAV = [
  ['evento', 'Evento'], ['local', 'Local'], ['meteo', 'Tempo'], ['programa', 'Programa'], ['video', 'Vídeo'], ['parceiros', 'Parceiros'], ['entregas', 'Entregas'],
]

// O vídeo oficial: plano explicado ao cliente (sem detalhes internos da equipa)
const FASES = [
  { n: '01', quando: '15h00', titulo: 'Antes dos convidados', itens: [
    'Chegamos uma hora antes para preparar a captação.',
    'O espaço vazio e arrumado, com a melhor luz: interiores, esplanada e o Tejo.',
    'Decoração, flores e detalhes de cada parceiro, ainda sem gente.',
    'Se for possível, imagens aéreas de drone do SUD, do rio e da ponte.',
  ] },
  { n: '02', quando: '16h00 → 22h00', titulo: 'Durante o evento', itens: [
    'A chegada dos convidados e os primeiros momentos de networking.',
    'Os discursos da Zankyou e do SUD, com som limpo.',
    'O pôr do sol sobre o Tejo, por volta das 17h20.',
    'A experiência gastronómica, a atuação da Annia e a festa até ao fim.',
  ] },
  { n: '03', quando: 'Depois', titulo: 'Montagem e entrega', itens: [
    'Selecionamos os melhores momentos e montamos as peças.',
    'Cada peça aparece neste portal, na secção Entregas, assim que estiver pronta.',
    'Prontas a partilhar nas redes da Zankyou, do SUD e de cada parceiro.',
  ] },
]

const DESTAQUES: Array<[string, string]> = [
  ['SUD Lisboa', 'O espaço, a esplanada e a vista para o Tejo'],
  ['Floor Sensation', 'Som, luz e ambiente da festa'],
  ['Madame Boutique Floral', 'Os arranjos florais, de perto'],
  ['Detail Wedding Photography', 'A fotografia oficial em ação'],
  ['Annia', 'A atuação ao vivo'],
  ['Gio Rodrigues Atelier', 'Os vestidos e looks'],
  ['Filipa Martins Make Up & Hair', 'Maquilhagem e cabelos'],
  ['Halus Stories', 'As joias, em detalhe'],
  ['Zankyou', 'A organização e os momentos de palco'],
]

const SAIDAS = [
  { nome: 'Aftermovie', formato: '16:9 · 60–90 s', texto: 'O filme da tarde: o ambiente, as pessoas e os melhores momentos.' },
  { nome: 'Reel', formato: '9:16 · 30–45 s', texto: 'O evento em vertical, pensado para o Instagram.' },
  { nome: 'Teaser', formato: '9:16 · 15 s', texto: 'Uma primeira amostra, logo no dia seguinte.' },
  { nome: 'Clips', formato: '9:16 · por marca', texto: 'Planos de cada parceiro, para as suas redes.' },
]

const PEDIDOS: Array<[string, string]> = [
  ['Tudo pronto até às 15h30', 'Decoração, produtos e espaços montados, para filmarmos os detalhes antes de chegar gente.'],
  ['Digam-nos o que querem em destaque', 'Um produto, um look, um momento: falem connosco antes ou no dia e garantimos esse plano.'],
  ['Som dos discursos', 'Coordenamos com a Floor Sensation uma saída de áudio para gravar as intervenções com qualidade.'],
  ['Uma palavra para a câmara', 'Se quiserem deixar um pequeno testemunho no vídeo, falem com o Rui no dia.'],
]

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter+Tight:wght@300;400;500;600&display=swap');
.zw{--bg:#f6faf9;--bg2:#e6f1ef;--card:#ffffff;--ink:#2f2c2f;--mute:#66626a;--soft:#9a969e;--line:rgba(47,44,47,.1);--sun:#3d8a82;--sun2:#5baaa2;--tejo:#2f6f8a;--deep:#1f3f3b;
  --serif:'Instrument Serif',Georgia,serif;--sans:'Inter Tight',system-ui,sans-serif;--ease:cubic-bezier(.2,.7,.2,1);
  background:var(--bg);color:var(--ink);font-family:var(--sans);font-weight:400;-webkit-font-smoothing:antialiased;overflow-x:clip;min-height:100vh;}
.zw *{box-sizing:border-box;}
.zw a{color:inherit;text-decoration:none;}
.zw img{display:block;max-width:100%;}
.zw .wrap{max-width:1240px;margin:0 auto;padding:0 clamp(16px,4vw,40px);}
.zw em{font-style:italic;}

/* Barra fixa em pílula */
.zw .nav{position:sticky;top:14px;z-index:40;display:flex;justify-content:center;padding:0 12px;margin-top:14px;}
.zw .nav-in{display:flex;align-items:center;gap:6px;padding:6px;border-radius:999px;background:rgba(255,255,255,.78);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid var(--line);box-shadow:0 10px 40px -18px rgba(47,44,47,.35);max-width:100%;overflow-x:auto;scrollbar-width:none;}
.zw .nav-in::-webkit-scrollbar{display:none;}
.zw .nav-marca{flex:none;display:flex;align-items:center;gap:8px;padding:8px 14px 8px 10px;border-radius:999px;background:var(--deep);color:#fff;font-size:12px;font-weight:600;letter-spacing:.04em;white-space:nowrap;}
.zw .nav-marca i{width:7px;height:7px;border-radius:50%;background:var(--sun2);box-shadow:0 0 0 3px rgba(91,170,162,.25);}
.zw .nav a.l{flex:none;font-size:13px;color:var(--mute);padding:8px 12px;border-radius:999px;transition:background .3s,color .3s;white-space:nowrap;}
.zw .nav a.l:hover{background:var(--bg2);color:var(--ink);}

/* Abertura */
.zw .hero{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:clamp(24px,4vw,56px);align-items:end;padding-top:clamp(36px,7vh,80px);}
.zw .kick{display:inline-flex;align-items:center;gap:10px;font-size:12px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--mute);}
.zw .kick i{width:28px;height:1px;background:var(--sun);}
.zw .hero h1{font-family:var(--serif);font-weight:400;font-size:clamp(64px,10.5vw,152px);line-height:.86;letter-spacing:-.02em;margin:22px 0 0;}
.zw .hero h1 em{color:var(--sun);display:block;}
.zw .hero .sub{font-size:clamp(17px,1.6vw,20px);line-height:1.55;color:var(--mute);max-width:34ch;margin:26px 0 0;font-weight:300;}
.zw .meta{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px;}
.zw .meta span{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:999px;background:var(--card);border:1px solid var(--line);font-size:14px;font-weight:500;}
.zw .meta span b{font-weight:400;color:var(--soft);}
.zw .cd{display:flex;gap:clamp(14px,3vw,28px);margin-top:34px;min-height:64px;}
.zw .cd div{display:flex;flex-direction:column;}
.zw .cd b{font-family:var(--serif);font-weight:400;font-size:clamp(40px,5vw,60px);line-height:1;font-variant-numeric:tabular-nums;}
.zw .cd span{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--soft);margin-top:6px;}
.zw .cd-msg{display:flex;align-items:center;gap:10px;font-family:var(--serif);font-size:30px;margin:0;}
.zw .vivo{width:10px;height:10px;border-radius:50%;background:#d94b3d;box-shadow:0 0 0 0 rgba(217,75,61,.5);animation:zwPulso 1.6s infinite;}
.zw .hero-img{position:relative;margin:0;border-radius:28px;overflow:hidden;aspect-ratio:4/5;box-shadow:0 40px 80px -40px rgba(47,44,47,.45);}
.zw .hero-img img{width:100%;height:100%;object-fit:cover;object-position:center 58%;animation:zwEntra 1.6s var(--ease) both;}
.zw .vidro{position:absolute;left:14px;right:14px;bottom:14px;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 16px;border-radius:18px;background:rgba(255,255,255,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.6);}
.zw .vidro p{margin:0;font-size:13px;line-height:1.35;color:var(--mute);}
.zw .vidro p b{display:block;font-family:var(--serif);font-weight:400;font-size:20px;color:var(--ink);}
.zw .vidro .sol{flex:none;text-align:right;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--soft);}
.zw .vidro .sol b{display:block;font-family:var(--serif);font-size:24px;letter-spacing:0;text-transform:none;color:var(--sun);}
@media (max-width:860px){.zw .hero{grid-template-columns:minmax(0,1fr);}.zw .hero-img{aspect-ratio:4/4.4;}}

/* Faixa de parceiros a deslizar */
.zw .marquee{margin-top:clamp(48px,8vh,80px);border-block:1px solid var(--line);overflow:hidden;padding:18px 0;}
.zw .marquee .trilho{display:flex;width:max-content;animation:zwRola 42s linear infinite;}
.zw .marquee span{font-family:var(--serif);font-size:clamp(22px,2.6vw,32px);padding:0 22px;white-space:nowrap;color:var(--ink);}
.zw .marquee span::after{content:"✦";font-family:var(--sans);font-size:12px;color:var(--sun);margin-left:44px;vertical-align:middle;}

/* Secções */
.zw .sec{padding-top:clamp(80px,13vh,140px);scroll-margin-top:90px;}
.zw .sec-h{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.8fr);gap:24px;align-items:end;margin-bottom:clamp(28px,4vh,44px);}
.zw .sec-h .n{font-size:12px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--sun);}
.zw .sec-h h2{font-family:var(--serif);font-weight:400;font-size:clamp(44px,6.4vw,88px);line-height:.92;letter-spacing:-.015em;margin:12px 0 0;}
.zw .sec-h h2 em{color:var(--sun);}
.zw .sec-h p{margin:0;font-size:17px;line-height:1.6;color:var(--mute);font-weight:300;}
@media (max-width:760px){.zw .sec-h{grid-template-columns:minmax(0,1fr);}}

/* Bento */
.zw .bento{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;}
.zw .bx{border-radius:24px;background:var(--card);border:1px solid var(--line);padding:24px;display:flex;flex-direction:column;justify-content:space-between;min-height:190px;transition:transform .5s var(--ease),box-shadow .5s var(--ease);}
.zw .bx:hover{transform:translateY(-4px);box-shadow:0 24px 50px -30px rgba(47,44,47,.4);}
.zw .bx .k{font-size:11px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--soft);}
.zw .bx .v{font-family:var(--serif);font-size:clamp(40px,4.4vw,60px);line-height:.95;margin-top:18px;}
.zw .bx .v em{color:var(--sun);}
.zw .bx p{margin:12px 0 0;font-size:14.5px;line-height:1.55;color:var(--mute);}
.zw .bx.l2{grid-column:span 2;}
.zw .bx.escuro{background:var(--deep);color:#fff;border-color:var(--deep);}
.zw .bx.escuro .k,.zw .bx.escuro p{color:rgba(246,250,249,.6);}
.zw .bx.sol{background:linear-gradient(150deg,#7cc4bb,#3d8a82);color:#fff;border:0;}
.zw .bx.sol .k,.zw .bx.sol p{color:rgba(255,255,255,.82);}
.zw .bx.sol .v em{color:#fff;}
.zw .bx .txt{font-family:var(--serif);font-size:clamp(26px,2.6vw,34px);line-height:1.15;margin:0;}
.zw .bx .txt em{color:var(--sun);}
.zw .bx a.lk{display:inline-flex;margin-top:14px;font-size:13px;font-weight:500;border-bottom:1px solid currentColor;align-self:flex-start;}
@media (max-width:980px){.zw .bento{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media (max-width:560px){.zw .bento{grid-template-columns:minmax(0,1fr);}.zw .bx.l2{grid-column:auto;}}

/* Fotos a toda a largura */
.zw .foto{position:relative;margin:clamp(80px,13vh,140px) clamp(10px,2vw,24px) 0;height:clamp(320px,72vh,720px);border-radius:32px;overflow:hidden;}
.zw .foto img{position:absolute;inset:-6% 0;width:100%;height:112%;object-fit:cover;}
.zw .foto::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(16,38,36,.62));}
.zw .foto figcaption{position:absolute;z-index:2;left:clamp(20px,4vw,48px);bottom:clamp(20px,4vw,44px);color:#fff;font-family:var(--serif);font-size:clamp(34px,5vw,72px);line-height:.95;}
.zw .foto figcaption small{display:block;font-family:var(--sans);font-size:12px;letter-spacing:.16em;text-transform:uppercase;opacity:.8;margin-bottom:10px;}
@supports (animation-timeline: view()){.zw .foto img{animation:zwParalaxe linear both;animation-timeline:view();}}

/* Localização */
.zw .loc{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:12px;}
.zw .mapa{border-radius:24px;overflow:hidden;border:1px solid var(--line);min-height:440px;position:relative;background:var(--bg2);}
.zw .mapa iframe{position:absolute;inset:0;width:100%;height:100%;border:0;filter:saturate(.75) contrast(1.02);}
.zw .loc .bx{min-height:0;justify-content:flex-start;}
.zw .loc .linha{display:flex;justify-content:space-between;gap:16px;padding:14px 0;border-top:1px solid var(--line);font-size:14.5px;}
.zw .loc .linha span:first-child{color:var(--soft);}
.zw .loc .linha span:last-child{text-align:right;}
.zw .acoes{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px;}
.zw .pill{display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border-radius:999px;font-size:14px;font-weight:500;border:1px solid var(--line);background:var(--card);transition:all .3s var(--ease);}
.zw .pill:hover{border-color:var(--deep);}
.zw .pill.forte{background:var(--deep);color:#fff;border-color:var(--deep);}
.zw .pill.forte:hover{background:var(--sun2);border-color:var(--sun2);}
@media (max-width:860px){.zw .loc{grid-template-columns:minmax(0,1fr);}.zw .mapa{min-height:360px;}}

/* Meteorologia (componente MeteoEvento) */
.zw .tempo{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:12px;}
.zw .meteo{border-radius:24px;background:var(--card);border:1px solid var(--line);padding:clamp(20px,3vw,30px);}
.zw .meteo-resumo{display:flex;gap:20px;align-items:center;}
.zw .meteo-ic{width:72px;height:72px;flex:none;display:grid;place-items:center;border-radius:50%;background:rgba(91,170,162,.12);color:var(--sun);}
.zw .meteo-ic svg{width:36px;height:36px;}
.zw .meteo-t{font-family:var(--serif);font-size:clamp(48px,6vw,68px);line-height:1;margin:0;}
.zw .meteo-t em{font-size:.5em;color:var(--soft);}
.zw .meteo-d{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--soft);margin:8px 0 0;}
.zw .meteo-c{font-family:var(--serif);font-style:italic;font-size:21px;color:var(--sun);margin:8px 0 0;}
.zw .meteo-horas{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin-top:26px;}
.zw .meteo-h{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 4px;border-radius:16px;background:var(--bg);}
.zw .meteo-h.por{background:linear-gradient(170deg,#cfe9e5,#eef7f5);}
.zw .meteo-h .hh{font-size:12px;color:var(--soft);}
.zw .meteo-h .ic{color:var(--ink);}.zw .meteo-h .ic svg{width:22px;height:22px;display:block;}
.zw .meteo-h b{font-family:var(--serif);font-weight:400;font-size:26px;}
.zw .meteo-h .ch{font-size:11px;color:var(--tejo);}
.zw .meteo-h .tag{position:absolute;top:-9px;font-size:9px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;background:var(--sun);color:#fff;padding:3px 8px;border-radius:20px;white-space:nowrap;}
.zw .meteo-fonte,.zw .meteo-aviso{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--soft);margin:18px 0 0;}
.zw .tempo figure{margin:0;border-radius:24px;overflow:hidden;position:relative;min-height:320px;}
.zw .tempo figure img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.zw .tempo figcaption{position:absolute;left:14px;right:14px;bottom:14px;padding:14px 16px;border-radius:16px;background:rgba(255,255,255,.78);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);font-size:14px;line-height:1.45;color:var(--mute);}
.zw .tempo figcaption b{color:var(--ink);font-weight:500;}
@media (max-width:860px){.zw .tempo{grid-template-columns:minmax(0,1fr);}.zw .meteo-horas{grid-template-columns:repeat(4,minmax(0,1fr));}}

/* Programa (componente ProgramaVivo) */
.zw .pg{position:relative;display:grid;gap:12px;padding-left:28px;}
.zw .pg-barra{position:absolute;left:6px;top:8px;bottom:8px;width:2px;border-radius:2px;background:var(--line);}
.zw .pg-barra i{display:block;width:100%;border-radius:2px;background:linear-gradient(var(--sun2),var(--sun));transition:height 1s var(--ease);}
.zw .pg-b{position:relative;display:grid;grid-template-columns:150px minmax(0,1fr);gap:24px;padding:26px;border-radius:24px;background:var(--card);border:1px solid var(--line);transition:transform .5s var(--ease),box-shadow .5s var(--ease);}
.zw .pg-b::before{content:"";position:absolute;left:-27px;top:36px;width:12px;height:12px;border-radius:50%;background:var(--bg);border:2px solid var(--sun);}
.zw .pg-b:hover{transform:translateX(4px);box-shadow:0 24px 50px -30px rgba(47,44,47,.35);}
.zw .pg-b.agora{background:var(--deep);color:#fff;border-color:var(--deep);}
.zw .pg-b.agora::before{background:var(--sun);box-shadow:0 0 0 5px rgba(91,170,162,.25);}
.zw .pg-b.agora p,.zw .pg-b.agora .pg-h span{color:rgba(246,250,249,.65);}
.zw .pg-b.feito{opacity:.55;}
.zw .pg-b.eq:not(.agora){background:transparent;border-style:dashed;border-color:rgba(61,138,130,.45);}
.zw .pg-b.eq:not(.agora)::before{border-style:dashed;}
.zw .pg-h b{display:block;font-family:var(--serif);font-weight:400;font-size:46px;line-height:1;}
.zw .pg-h span{display:block;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--soft);margin-top:8px;}
.zw .pg-top{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.zw .pg h3{font-family:var(--serif);font-weight:400;font-size:clamp(28px,3vw,38px);line-height:1.05;margin:0;}
.zw .pg p{margin:10px 0 0;font-size:15.5px;line-height:1.6;color:var(--mute);max-width:62ch;}
.zw .chip{display:inline-flex;align-items:center;gap:7px;padding:6px 12px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;background:var(--bg2);color:var(--ink);}
.zw .chip.agora{background:var(--sun);color:#fff;}
.zw .chip.agora i{width:7px;height:7px;border-radius:50%;background:#fff;animation:zwPisca 1.2s infinite;}
.zw .chip.feito{background:transparent;border:1px solid var(--line);color:var(--soft);}
@media (max-width:640px){.zw .pg-b{grid-template-columns:minmax(0,1fr);gap:10px;padding:22px;}.zw .pg-h b{font-size:38px;}}

/* O vídeo oficial: fases, destaques e pedidos */
.zw .fases{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;}
.zw .fs{border-radius:24px;background:var(--card);border:1px solid var(--line);padding:24px;transition:transform .5s var(--ease),box-shadow .5s var(--ease);}
.zw .fs:hover{transform:translateY(-4px);box-shadow:0 24px 50px -30px rgba(47,44,47,.35);}
.zw .fs-top{display:flex;justify-content:space-between;align-items:center;gap:10px;}
.zw .fs-n{font-family:var(--serif);font-size:44px;line-height:1;color:var(--sun2);}
.zw .fs h3{font-family:var(--serif);font-weight:400;font-size:clamp(28px,2.6vw,34px);line-height:1.05;margin:18px 0 0;}
.zw .fs ul{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:10px;}
.zw .fs li{display:flex;gap:10px;font-size:15px;line-height:1.5;color:var(--mute);}
.zw .fs li::before{content:"";flex:none;width:6px;height:6px;border-radius:50%;background:var(--sun2);margin-top:8px;}
.zw .fases .fs:nth-child(2){background:var(--deep);color:#fff;border-color:var(--deep);}
.zw .fases .fs:nth-child(2) li{color:rgba(255,255,255,.75);}
.zw .fases .fs:nth-child(2) .chip{background:rgba(255,255,255,.12);color:#fff;}
.zw .plano{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:24px;margin-top:12px;border-radius:24px;background:var(--bg2);padding:clamp(22px,3vw,34px);}
.zw .plano .k,.zw .pedido .k{font-size:11px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--sun);}
.zw .plano .txt{font-family:var(--serif);font-size:clamp(26px,2.6vw,34px);line-height:1.15;margin:12px 0 0;}
.zw .plano .txt em{color:var(--sun);}
.zw .plano-lista{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2px 24px;}
.zw .plano-lista div{padding:11px 0;border-top:1px solid var(--line);}
.zw .plano-lista b{display:block;font-weight:500;font-size:15px;}
.zw .plano-lista span{display:block;font-size:14px;color:var(--mute);margin-top:2px;}
.zw .pedido{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:24px;margin-top:12px;border-radius:24px;border:1px dashed rgba(61,138,130,.45);padding:clamp(22px,3vw,34px);}
.zw .pedido h3{font-family:var(--serif);font-weight:400;font-size:clamp(30px,3vw,40px);line-height:1.05;margin:12px 0 0;}
.zw .pedido h3 em{color:var(--sun);}
.zw .pedido ol{list-style:none;margin:0;padding:0;counter-reset:p;display:grid;gap:4px;}
.zw .pedido li{counter-increment:p;display:grid;grid-template-columns:36px minmax(0,1fr);gap:4px 12px;padding:12px 0;border-top:1px solid var(--line);}
.zw .pedido li::before{content:counter(p);grid-row:span 2;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--sun2);color:#fff;font-size:13px;font-weight:600;}
.zw .pedido li b{font-weight:500;font-size:16px;}
.zw .pedido li span{font-size:14.5px;line-height:1.55;color:var(--mute);}
@media (max-width:900px){.zw .fases,.zw .plano,.zw .pedido{grid-template-columns:minmax(0,1fr);}}
@media (max-width:560px){.zw .plano-lista{grid-template-columns:minmax(0,1fr);}}
/* Parceiros */
.zw .logos{border-radius:24px;background:#fff;border:1px solid var(--line);padding:14px 10px;}
.zw .logos img{width:100%;height:auto;}
.zw .parc{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px;}
.zw .pc{border-radius:24px;background:var(--card);border:1px solid var(--line);padding:22px;transition:transform .5s var(--ease),box-shadow .5s var(--ease),background .4s;}
.zw .pc:hover{transform:translateY(-4px);box-shadow:0 24px 50px -30px rgba(47,44,47,.35);}
.zw .pc.rl{background:var(--deep);color:#fff;border-color:var(--deep);}
.zw .pc .k{font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:var(--sun);}
.zw .pc h3{font-family:var(--serif);font-weight:400;font-size:28px;line-height:1.05;margin:10px 0 0;}
.zw .pc .r{font-size:14px;color:var(--soft);margin:4px 0 0;min-height:20px;}
.zw .pc .ct{display:grid;gap:2px;margin-top:16px;padding-top:14px;border-top:1px solid var(--line);}
.zw .pc.rl .ct{border-color:rgba(246,250,249,.15);}
.zw .pc .ct a{font-size:14px;color:var(--mute);padding:4px 0;overflow-wrap:anywhere;transition:color .3s;}
.zw .pc.rl .ct a{color:rgba(246,250,249,.7);}
.zw .pc .ct a:hover{color:var(--sun);}
@media (max-width:980px){.zw .parc{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media (max-width:600px){.zw .parc{grid-template-columns:minmax(0,1fr);}}

/* Entregas */
.zw .ent-top{display:flex;align-items:center;gap:18px;margin-bottom:12px;}
.zw .ent-top .barra{flex:1;height:6px;border-radius:6px;background:var(--bg2);overflow:hidden;}
.zw .ent-top .barra i{display:block;height:100%;border-radius:6px;background:linear-gradient(90deg,var(--sun2),var(--sun));}
.zw .ent-top span{font-size:13px;color:var(--mute);white-space:nowrap;}
.zw .ent-g{border-radius:24px;background:var(--card);border:1px solid var(--line);padding:6px 24px;margin-top:12px;}
.zw .ent-g h3{font-family:var(--serif);font-weight:400;font-size:26px;margin:16px 0 4px;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;}
.zw .ent-g h3 small{font-family:var(--sans);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--soft);}
.zw .ent{display:flex;align-items:center;gap:16px;padding:16px 0;border-top:1px solid var(--line);}
.zw .ent .t{flex:1;min-width:0;}
.zw .ent .t b{display:block;font-weight:500;font-size:16px;}
.zw .ent .t span{display:block;font-size:13px;color:var(--soft);margin-top:3px;}
.zw .ent .est{flex:none;padding:9px 15px;border-radius:999px;font-size:12px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;background:var(--bg2);color:var(--soft);}
.zw .ent a.est{background:var(--deep);color:#fff;transition:background .3s;}
.zw .ent a.est:hover{background:var(--sun2);}

/* Fim */
.zw .fim{margin-top:clamp(80px,13vh,140px);background:var(--deep);color:#fff;border-radius:36px 36px 0 0;padding:clamp(56px,10vh,100px) 0 36px;}
.zw .fim h2{font-family:var(--serif);font-weight:400;font-size:clamp(52px,9vw,128px);line-height:.88;margin:14px 0 0;}
.zw .fim h2 em{color:var(--sun2);}
.zw .fim .n{font-size:12px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:var(--sun2);}
.zw .fim .cts{display:flex;flex-wrap:wrap;gap:8px;margin-top:32px;}
.zw .fim .pill{background:transparent;color:var(--bg);border-color:rgba(246,250,249,.25);}
.zw .fim .pill:hover{border-color:var(--bg);}
.zw .fim .rod{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:64px;padding-top:22px;border-top:1px solid rgba(246,250,249,.12);font-size:13px;color:rgba(246,250,249,.5);}

/* Aparecer ao fazer scroll */
@supports (animation-timeline: view()){
  .zw .rv{animation:zwSobe linear both;animation-timeline:view();animation-range:entry 0% entry 55%;}
}
@keyframes zwSobe{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@keyframes zwEntra{from{transform:scale(1.08)}to{transform:none}}
@keyframes zwParalaxe{from{transform:translateY(-4%)}to{transform:translateY(4%)}}
@keyframes zwRola{to{transform:translateX(-50%)}}
@keyframes zwPulso{0%{box-shadow:0 0 0 0 rgba(217,75,61,.5)}70%{box-shadow:0 0 0 10px rgba(217,75,61,0)}100%{box-shadow:0 0 0 0 rgba(217,75,61,0)}}
@keyframes zwPisca{50%{opacity:.3}}
@media (prefers-reduced-motion:reduce){.zw *{animation:none!important;transition:none!important;}}
`

function Cabeca({ n, titulo, texto }: { n: string; titulo: React.ReactNode; texto?: string }) {
  return (
    <header className="sec-h rv">
      <div><span className="n">{n}</span><h2>{titulo}</h2></div>
      {texto && <p>{texto}</p>}
    </header>
  )
}

function Entregas({ links }: { links: Record<string, EntregaLink> }) {
  const grupos = montarEntregas(SLUG, links).filter(g => g.itens.length)
  const todas = grupos.flatMap(g => g.itens)
  const feitas = todas.filter(e => e.link).length
  if (!todas.length) return null
  return (
    <>
      <div className="ent-top rv">
        <div className="barra"><i style={{ width: `${(feitas / todas.length) * 100}%` }} /></div>
        <span>{feitas} de {todas.length} entregues</span>
      </div>
      {grupos.map(g => (
        <div key={g.parceiro} className="ent-g rv">
          <h3>{g.parceiro} <small>{g.sub}</small></h3>
          {g.itens.map(e => (
            <div key={e.id} className="ent">
              <span className="t"><b>{e.nome}</b><span>{[e.formato, e.data && `entregue a ${e.data.split('-').reverse().join('/')}`].filter(Boolean).join(' · ')}</span></span>
              {e.link
                ? <a className="est" href={e.link} target="_blank" rel="noopener noreferrer">Ver ↗</a>
                : <span className="est">Em breve</span>}
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

export default function PortalEvento({ entregas }: { entregas: Record<string, EntregaLink> }) {
  const nomes = PARCEIROS.map(p => p.nome).concat('Zankyou')
  return (
    <main className="zw">
      <style>{CSS}</style>

      <nav className="nav" aria-label="Secções">
        <div className="nav-in">
          <a href="#capa" className="nav-marca"><i />Wedding Club × SUD</a>
          {NAV.map(([id, nome]) => <a key={id} className="l" href={`#${id}`}>{nome}</a>)}
        </div>
      </nav>

      {/* Abertura */}
      <div className="wrap">
        <section className="hero" id="capa">
          <div>
            <p className="kick"><i />XIX Edição · Party &amp; Experience</p>
            <h1>Zankyou <em>Wedding Club</em></h1>
            <p className="sub">Uma tarde de ligações, inspiração e celebração, com o pôr do sol sobre o Tejo.</p>
            <div className="meta">
              <span>16 de novembro <b>segunda</b></span>
              <span>16h → 22h</span>
              <span>SUD Lisboa <b>Belém</b></span>
            </div>
            <Contagem />
          </div>
          <figure className="hero-img">
            <img src={`${IMG}/sud-terrazza.webp`} alt="Interior do SUD Lisboa com vista para o Tejo e a Ponte 25 de Abril" />
            <figcaption className="vidro">
              <p><b>SUD Lisboa · Terrazza</b>Vista para o Tejo e a Ponte 25 de Abril</p>
              <p className="sol">Pôr do sol<b>17h20</b></p>
            </figcaption>
          </figure>
        </section>
      </div>

      <div className="marquee" aria-hidden="true">
        <div className="trilho">{[...nomes, ...nomes].map((n, i) => <span key={i}>{n}</span>)}</div>
      </div>

      <div className="wrap">
        {/* O evento */}
        <section className="sec" id="evento">
          <Cabeca n="01 · O evento" titulo={<>Uma tarde à beira do <em>Tejo</em></>}
            texto="A XIX Edição do Zankyou Wedding Club volta a Lisboa, em parceria com o SUD Lisboa, para reunir profissionais do setor dos casamentos. A RL Photo Video assina o vídeo oficial." />
          <div className="bento">
            <div className="bx sol rv"><span className="k">Data</span><div><div className="v">16 <em>nov</em></div><p>Segunda-feira, 2026</p></div></div>
            <div className="bx rv"><span className="k">Horário</span><div><div className="v">16h<em>–</em>22h</div><p>Quatro momentos, do welcome drink à festa.</p></div></div>
            <div className="bx l2 rv"><span className="k">A edição</span><p className="txt">Networking, inspiração e novas oportunidades, com <em>Lisboa e o Tejo</em> como pano de fundo.</p></div>
            <div className="bx l2 rv"><span className="k">Local</span><div><div className="v">SUD <em>Lisboa</em></div><p>Belém, ao lado do MAAT, à beira do rio.</p><a className="lk" href="#local">Ver o mapa ↓</a></div></div>
            <div className="bx escuro rv"><span className="k">Vídeo oficial</span><div><div className="v" style={{ fontSize: 'clamp(34px,3.4vw,46px)' }}>RL Photo <em style={{ color: 'var(--sun2)' }}>Video</em></div><p>As peças do evento ficam disponíveis neste portal.</p></div></div>
            <div className="bx rv"><span className="k">Organização</span><div><div className="v" style={{ fontSize: 'clamp(34px,3.4vw,46px)' }}>Zankyou</div><p><a href="mailto:info@zankyou.pt">info@zankyou.pt</a><br /><a href="tel:+351930563680">+351 930 563 680</a></p></div></div>
          </div>
        </section>
      </div>

      <figure className="foto"><img src={`${IMG}/sud-fachada.webp`} alt="Fachada do SUD Lisboa ao fim da tarde" loading="lazy" /><figcaption><small>SUD Lisboa</small>A casa desta <em>edição</em></figcaption></figure>

      <div className="wrap">
        {/* Localização */}
        <section className="sec" id="local">
          <Cabeca n="02 · Localização" titulo={<>Como <em>chegar</em></>}
            texto="O SUD Lisboa fica junto ao Tejo, em Belém. Táxi e TVDE deixam-vos à porta, e o espaço tem estacionamento." />
          <div className="loc">
            <div className="mapa rv"><iframe src={MAPA} title="Mapa do SUD Lisboa" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
            <div className="bx rv">
              <span className="k">Morada</span>
              <p className="txt" style={{ marginTop: 14 }}>{MORADA}</p>
              <div style={{ marginTop: 20 }}>
                <div className="linha"><span>Do aeroporto</span><span>20 a 30 min de carro</span></div>
                <div className="linha"><span>Estacionamento</span><span>No local</span></div>
                <div className="linha"><span>Ao lado de</span><span>MAAT, Belém</span></div>
              </div>
              <div className="acoes">
                <a className="pill forte" href={GMAPS} target="_blank" rel="noopener noreferrer">Google Maps ↗</a>
                <a className="pill" href={WAZE} target="_blank" rel="noopener noreferrer">Waze</a>
                <a className="pill" href={APPLE} target="_blank" rel="noopener noreferrer">Apple Maps</a>
              </div>
            </div>
          </div>
        </section>

        {/* Meteorologia */}
        <section className="sec" id="meteo">
          <Cabeca n="03 · Meteorologia" titulo={<>O tempo no <em>dia</em></>}
            texto="Previsão hora a hora para Belém, das 16h às 22h, atualizada sempre que abrem esta página." />
          <div className="tempo">
            <div className="rv"><MeteoEvento lat={LAT} lon={LON} data={DATA} inicio={16} fim={22} por={17} /></div>
            <figure className="rv">
              <img src={`${IMG}/sud-terrazza-barco.webp`} alt="Esplanada do SUD Lisboa com um veleiro no Tejo" loading="lazy" />
              <figcaption><b>A esplanada, de frente para o rio.</b> Por volta das 17h20 o sol põe-se sobre o Tejo: a melhor luz da tarde.</figcaption>
            </figure>
          </div>
        </section>

        {/* Programa */}
        <section className="sec" id="programa">
          <Cabeca n="04 · Programa" titulo={<>A <em>timeline</em></>}
            texto="An Afternoon of Connections, Inspiration & Celebration. No dia, o momento que está a decorrer fica assinalado aqui." />
          <ProgramaVivo blocos={PROGRAMA} />
        </section>

        {/* O vídeo oficial: o que vamos fazer */}
        <section className="sec" id="video">
          <Cabeca n="05 · O vídeo oficial" titulo={<>O que vamos <em>fazer</em></>}
            texto="A RL Photo Video assina o vídeo oficial desta edição. Aqui fica o nosso plano: o que vamos gravar, quando, e o que vai sair daqui." />
          <div className="fases">
            {FASES.map(f => (
              <div key={f.n} className="fs rv">
                <div className="fs-top"><span className="fs-n">{f.n}</span><span className="chip">{f.quando}</span></div>
                <h3>{f.titulo}</h3>
                <ul>{f.itens.map(x => <li key={x}>{x}</li>)}</ul>
              </div>
            ))}
          </div>

          <div className="plano rv">
            <div>
              <span className="k">Cada parceiro em destaque</span>
              <p className="txt">Cada marca tem planos <em>próprios</em> no vídeo, para usar também nas suas redes.</p>
            </div>
            <div className="plano-lista">
              {DESTAQUES.map(([n, o]) => <div key={n}><b>{n}</b><span>{o}</span></div>)}
            </div>
          </div>

          <div className="bento" style={{ marginTop: 12 }}>
            {SAIDAS.map(s => (
              <div key={s.nome} className="bx rv"><span className="k">{s.formato}</span><div><div className="v" style={{ fontSize: 'clamp(30px,2.8vw,40px)' }}>{s.nome}</div><p>{s.texto}</p></div></div>
            ))}
          </div>

          <div className="pedido rv">
            <div>
              <span className="k">Para correr bem</span>
              <h3>O que pedimos aos <em>parceiros</em></h3>
            </div>
            <ol>{PEDIDOS.map(([t, x]) => <li key={t}><b>{t}</b><span>{x}</span></li>)}</ol>
          </div>
        </section>
      </div>

      <figure className="foto"><img src={`${IMG}/sud-placa.webp`} alt="Placa do SUD Lisboa junto ao Tejo" loading="lazy" style={{ objectPosition: 'center 40%' }} /><figcaption><small>Belém</small>À beira do <em>Tejo</em></figcaption></figure>

      <div className="wrap">
        {/* Parceiros */}
        <section className="sec" id="parceiros">
          <Cabeca n="06 · Parceiros" titulo={<>Quem faz o <em>evento</em></>}
            texto="As marcas desta edição. Toquem num contacto para ligar, escrever ou abrir o Instagram." />
          <div className="logos rv"><img src={`${IMG}/parceiros.webp`} alt="Logótipos dos parceiros: Zankyou, SUD Lisboa, Floor Sensation, Detail Wedding Photography, Madame Boutique Floral, RL Photo Video, Halus Stories, Filipa Martins Make Up, Gio Rodrigues Atelier" /></div>
          <div className="parc">
            {PARCEIROS.map(p => (
              <div key={p.nome} className={`pc rv${p.rl ? ' rl' : ''}`}>
                <span className="k">{p.papel}</span>
                <h3>{p.nome}</h3>
                <p className="r">{p.resp ?? ' '}</p>
                <div className="ct">
                  <a href={`tel:${p.tel.replace(/\s/g, '')}`}>{p.tel}</a>
                  <a href={`mailto:${p.email}`}>{p.email}</a>
                  <a href={`https://instagram.com/${p.ig}`} target="_blank" rel="noopener noreferrer">@{p.ig}</a>
                  {p.site && <a href={`https://${p.site}`} target="_blank" rel="noopener noreferrer">{p.site} ↗</a>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <figure className="foto"><img src={`${IMG}/sud-noite.webp`} alt="Entrada do SUD Lisboa à noite" loading="lazy" /><figcaption><small>Até às 22h</small>E a noite <em>continua</em></figcaption></figure>

      <div className="wrap">
        {/* Entregas */}
        <section className="sec" id="entregas">
          <Cabeca n="07 · Entregas" titulo={<>As peças, <em>prontas</em></>}
            texto="Cada peça aparece aqui assim que estiver pronta, com o link para ver e descarregar." />
          <Entregas links={entregas} />
        </section>
      </div>

      <footer className="fim">
        <div className="wrap">
          <span className="n">Vídeo oficial</span>
          <h2>RL Photo <em>Video</em></h2>
          <div className="cts">
            <a className="pill" href="tel:+351912932768">912 932 768</a>
            <a className="pill" href="mailto:geral.rlphoto@gmail.com">geral.rlphoto@gmail.com</a>
            <a className="pill" href="https://www.instagram.com/rlphoto_fotografia.video/" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
          </div>
          <div className="rod"><span>XIX Zankyou Wedding Club × SUD Lisboa</span><span>16 de novembro de 2026</span></div>
        </div>
      </footer>
    </main>
  )
}
