import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { cookieEditorial, cookieValido, lerEditorial } from '@/lib/editorialAcesso'
import { montarEntregas, type EntregaLink } from '@/lib/editoriaisEntregas'
import EntradaEditorial from '../EntradaEditorial'
import IndiceCapitulos from '../IndiceCapitulos'
import MeteoEvento from '../MeteoEvento'
import { CSS_BRIEFING } from '@/app/_briefing/estilo'

/* Portal do evento XIX Zankyou Wedding Club × SUD Lisboa (16/11/2026), onde a RL Photo Video é o vídeo oficial.
   Mesmo sistema dos editoriais: senha "RL.XXXXXX" (lib/editorialAcesso.ts), entregas geridas na janela do +
   em /portais-clientes (lib/editoriaisEntregas.ts). Tem localização, meteorologia, programa, parceiros e entregas.
   Fonte do programa e dos contactos: site oficial do evento (thatstheone.com) e lista dos parceiros. */

export const metadata: Metadata = {
  title: 'XIX Zankyou Wedding Club × SUD Lisboa',
  description: 'Portal do evento: localização, meteorologia, programa, parceiros e entregas. RL Photo Video.',
  robots: { index: false, follow: false },
}

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
  { hora: '16:00', fim: '17:00', nome: 'Welcome & Connect', texto: 'Receção dos convidados, welcome drink e os primeiros momentos de networking.' },
  { hora: '17:00', fim: '18:00', nome: 'Inspire & Share', texto: 'Abertura oficial pela Zankyou Portugal, apresentação do conceito desta edição e agradecimento aos parceiros. Intervenção de um representante do SUD / SANA.' },
  { hora: '18:00', fim: '20:00', nome: 'Taste & Experience', texto: 'Uma experiência gastronómica e sensorial, onde os sabores se encontram com o espetáculo e a surpresa.' },
  { hora: '20:00', fim: '22:00', nome: "Let's Celebrate!", texto: 'Música, animação e boas conversas para celebrar as ligações que nos unem.' },
]

type Parceiro = { nome: string; papel: string; resp?: string; tel: string; email: string; ig: string; site?: string; rl?: boolean }
const PARCEIROS: Parceiro[] = [
  { nome: 'SUD Lisboa', papel: 'Espaço anfitrião', tel: '+351 211 592 703', email: 'nassir.amirali@sudlisboa.com', ig: 'sudlisboa', site: 'sudlisboa.com' },
  { nome: 'Floor Sensation', papel: 'Entretenimento, som e produção técnica', resp: 'Douglas Silva', tel: '+351 961 681 052', email: 'geral@floorsensation.pt', ig: 'floor_sensation', site: 'floorsensation.pt' },
  { nome: 'Madame Boutique Floral', papel: 'Decoração floral', resp: 'Vanessa Oliveira', tel: '+351 913 593 672', email: 'eventos@madameboutiquefloral.pt', ig: 'floristamadameboutiquefloral', site: 'floristamafra.pt' },
  { nome: 'Detail Wedding Photography', papel: 'Fotografia oficial', resp: 'Nuno e Fátima', tel: '+351 925 038 324', email: 'geral@detailphotography.pt', ig: '_detail_photography_', site: 'detailphotography.pt' },
  { nome: 'Annia', papel: 'Artista · Live performance', tel: '+351 938 556 785', email: 'tania.silva@lifeliveevent.eu', ig: 'anniaoficial' },
  { nome: 'RL Photo Video', papel: 'Vídeo oficial', resp: 'Rui Gonçalves', tel: '+351 912 932 768', email: 'geral.rlphoto@gmail.com', ig: 'rlphoto_fotografia.video', site: 'rlphotovideo.pt', rl: true },
  { nome: 'Gio Rodrigues Atelier', papel: 'Fashion partner', tel: '+351 935 555 544', email: 'atelier@giorodrigues.com', ig: 'giorodriguesatelier', site: 'giorodrigues.com' },
  { nome: 'Filipa Martins Make Up & Hair', papel: 'Beauty partner', tel: '+351 937 795 305', email: 'filipamartinsmakeup@gmail.com', ig: 'filipamartins.makeup' },
  { nome: 'Halus Stories', papel: 'Jewellery partner', tel: '+351 911 999 618', email: 'mariana@halusstories.com', ig: 'halusstories', site: 'halusstories.com' },
]

const CAPITULOS = [
  { id: 'evento', nome: 'O evento' },
  { id: 'local', nome: 'Localização' },
  { id: 'meteo', nome: 'Meteorologia' },
  { id: 'programa', nome: 'Programa' },
  { id: 'parceiros', nome: 'Parceiros' },
  { id: 'entregas', nome: 'Entregas' },
]
const TOTAL = CAPITULOS.length + 1 // a capa é a 01

const CSS = `
.ev{overflow-x:clip;}
/* ── Capa: o cartaz do evento, inteiro ── */
.ev .capa{position:relative;text-align:center;}
.ev .capa-img{position:relative;overflow:hidden;}
.ev .capa-img img{display:block;width:100%;height:auto;max-height:86svh;object-fit:cover;object-position:center top;animation:evKen 14s cubic-bezier(.2,.6,.2,1) both;}
.ev .capa-img::after{content:"";position:absolute;left:0;right:0;bottom:0;height:28%;background:linear-gradient(transparent,var(--ink));}
.ev .capa-info{position:relative;padding:8px 20px clamp(36px,7vh,64px);}
.ev .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;}
.ev .parceiros-t{font-family:var(--fm);font-size:10px;letter-spacing:.42em;text-transform:uppercase;color:var(--tx);margin-top:18px;}
.ev .parceiros-t b{color:var(--g);font-weight:400;margin:0 .5em;}
.ev .linha{width:64px;height:1px;background:var(--g);margin:22px auto 0;}
.ev .plano{font-family:var(--fm);font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--g);margin-top:20px;}
@media (max-width:759px){.ev .capa{padding-top:59px;}.ev .parceiros-t{letter-spacing:.24em;font-size:9px;}}

/* ── Índice ── */
.ev .indice{position:sticky;top:0;z-index:30;background:rgba(11,10,8,.86);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line-soft);}
.ev .indice .chips{max-width:1080px;margin:0 auto;display:flex;gap:6px;overflow-x:auto;padding:12px 16px;scrollbar-width:none;justify-content:center;flex-wrap:wrap;}
.ev .indice .chips a{flex:none;font-family:var(--fm);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);text-decoration:none;padding:8px 13px;border:1px solid var(--line-soft);border-radius:40px;transition:.3s var(--ease);}
.ev .indice a i{font-style:normal;color:var(--g);margin-right:.6em;}
.ev .indice a:hover{color:var(--g);border-color:rgba(216,190,147,.5);}
.ev .ham-barra,.ev .ham-lista,.ev .ham-fundo{display:none;}
@media (max-width:759px){
  .ev .indice .chips{display:none;}
  .ev .indice{position:fixed;top:0;left:0;right:0;}
  .ev .ham-barra{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;}
  .ev .ham-t{font-family:var(--fm);font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--tx-mid);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .ev .ham-t b{color:var(--g);font-weight:400;}
  .ev .ham{display:flex;align-items:center;gap:4px;flex-direction:column;justify-content:center;position:relative;height:38px;padding:0 12px 0 98px;border:1px solid var(--line);border-radius:40px;background:transparent;color:var(--tx);cursor:pointer;}
  .ev .ham span{position:absolute;left:16px;top:50%;transform:translateY(-50%);font-family:var(--fm);font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-mid);}
  .ev .ham i{display:block;width:18px;height:1px;background:var(--g);transition:.35s var(--ease);}
  .ev .indice.aberto .ham i:nth-of-type(1){transform:translateY(5px) rotate(45deg);}
  .ev .indice.aberto .ham i:nth-of-type(2){opacity:0;}
  .ev .indice.aberto .ham i:nth-of-type(3){transform:translateY(-5px) rotate(-45deg);}
  .ev .ham-fundo{display:block;position:fixed;inset:0;top:59px;background:rgba(0,0,0,.55);}
  .ev .ham-lista:not([hidden]){display:block;position:absolute;left:0;right:0;top:100%;background:rgba(11,10,8,.97);border-bottom:1px solid var(--line-soft);padding:6px 16px 14px;}
  .ev .ham-lista a{display:flex;align-items:baseline;gap:16px;padding:14px 2px;border-bottom:1px solid var(--line-soft);font-family:var(--fd);font-weight:300;font-size:18px;color:var(--tx);text-decoration:none;}
  .ev .ham-lista a:last-child{border-bottom:none;}
  .ev .ham-lista a i{font-style:normal;font-family:var(--fs);font-size:20px;color:var(--g);width:28px;}
}

/* ── Capítulos ── */
.ev .cap{max-width:1080px;margin:0 auto;padding:clamp(72px,12vh,120px) 16px 0;scroll-margin-top:100px;}
.ev .cap-h h2{font-size:clamp(36px,6vw,58px);margin:18px 0 0;}
.ev .cap-h .ln{width:56px;height:1px;background:var(--g);margin-top:22px;}
.ev .cap-h .lead{max-width:760px;margin-top:26px;}
.ev .rod{display:flex;justify-content:space-between;gap:16px;margin-top:clamp(48px,8vh,72px);padding-top:16px;border-top:1px solid var(--line-soft);}
.ev .rod span{font-family:var(--fm);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-dim);}
.ev .rod b{font-weight:400;color:var(--g);white-space:nowrap;}
.ev .grid{display:grid;gap:14px;margin-top:clamp(34px,5vh,48px);}
.ev .g2{grid-template-columns:repeat(2,minmax(0,1fr));}
.ev .g3{grid-template-columns:repeat(3,minmax(0,1fr));}
.ev .g4{grid-template-columns:repeat(4,minmax(0,1fr));}
@media (max-width:900px){.ev .g3,.ev .g4{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media (max-width:620px){.ev .g2,.ev .g3,.ev .g4{grid-template-columns:minmax(0,1fr);}}
.ev .bloco{padding:24px 22px;border-radius:14px;background:#070605;border:1px solid var(--line-soft);}
.ev .bloco .v{font-family:var(--fs);font-weight:300;font-size:clamp(28px,3.4vw,38px);line-height:1;color:var(--g);}
.ev .bloco .v em{font-style:italic;}
.ev .bloco .t{font-family:var(--fm);font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-mid);margin-top:12px;line-height:1.7;}
.ev .nota{margin-top:18px;padding:20px 22px;border-left:1px solid var(--g);background:rgba(216,190,147,.04);border-radius:0 12px 12px 0;color:var(--tx-mid);font-size:14.5px;line-height:1.65;}
.ev .nota b{font-family:var(--fm);font-weight:400;font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:8px;}

/* ── Localização ── */
.ev .mapa{position:relative;margin-top:clamp(34px,5vh,48px);border-radius:18px;overflow:hidden;border:1px solid rgba(216,190,147,.3);aspect-ratio:16/8;background:#111;}
.ev .mapa iframe{position:absolute;inset:0;width:100%;height:100%;border:0;filter:grayscale(.35) contrast(1.05);}
@media (max-width:620px){.ev .mapa{aspect-ratio:4/5;}}
.ev .morada{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;margin-top:16px;}
.ev .morada p{font-family:var(--fd);font-weight:300;font-size:clamp(16px,1.8vw,19px);color:var(--tx);margin:0;}
.ev .morada p small{display:block;font-family:var(--fm);font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);margin-bottom:6px;}
.ev .acoes-mapa{display:flex;flex-wrap:wrap;gap:8px;}
.ev .pill{display:inline-flex;align-items:center;gap:8px;font-family:var(--fm);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--tx);text-decoration:none;padding:11px 16px;border-radius:40px;border:1px solid var(--line);transition:.3s var(--ease);}
.ev .pill:hover{border-color:var(--g);color:var(--g);}
.ev .pill.ouro{background:var(--g);border-color:var(--g);color:var(--ink);}
.ev .pill.ouro:hover{background:transparent;color:var(--g);}

/* ── Meteorologia ── */
.ev .meteo{margin-top:clamp(34px,5vh,48px);padding:clamp(22px,4vw,34px);border-radius:18px;background:radial-gradient(120% 140% at 0% 0%,rgba(216,190,147,.09),transparent 55%),var(--ink-2);border:1px solid var(--line-soft);}
.ev .meteo-resumo{display:flex;gap:22px;align-items:center;}
.ev .meteo-ic{width:76px;height:76px;flex:none;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(216,190,147,.4);color:var(--g);}
.ev .meteo-ic svg{width:38px;height:38px;}
.ev .meteo-t{font-family:var(--fs);font-weight:300;font-size:clamp(40px,6vw,58px);line-height:1;color:var(--tx);margin:0;}
.ev .meteo-t em{font-size:.5em;color:var(--tx-dim);}
.ev .meteo-d{font-family:var(--fm);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-mid);margin:10px 0 0;}
.ev .meteo-c{font-family:var(--fs);font-style:italic;font-size:19px;color:var(--g);margin:10px 0 0;}
.ev .meteo-horas{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin-top:26px;}
.ev .meteo-h{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 4px;border-radius:14px;border:1px solid var(--line-soft);background:#070605;}
.ev .meteo-h.por{border-color:rgba(216,190,147,.55);}
.ev .meteo-h .hh{font-family:var(--fm);font-size:10px;letter-spacing:.14em;color:var(--tx-dim);}
.ev .meteo-h .ic{color:var(--g);}.ev .meteo-h .ic svg{width:22px;height:22px;display:block;}
.ev .meteo-h b{font-family:var(--fs);font-weight:300;font-size:24px;color:var(--tx);}
.ev .meteo-h .ch{font-family:var(--fm);font-size:9.5px;color:#93c5fd;}
.ev .meteo-h .tag{position:absolute;top:-9px;font-family:var(--fm);font-size:7.5px;letter-spacing:.14em;text-transform:uppercase;background:var(--g);color:var(--ink);padding:3px 7px;border-radius:20px;white-space:nowrap;}
.ev .meteo-fonte,.ev .meteo-aviso{font-family:var(--fm);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);margin:18px 0 0;}
.ev .meteo-aviso{font-size:11px;padding:22px;border:1px dashed var(--line);border-radius:14px;text-align:center;margin-top:clamp(34px,5vh,48px);}
@media (max-width:620px){.ev .meteo-horas{grid-template-columns:repeat(4,minmax(0,1fr));}.ev .meteo-resumo{flex-direction:column;align-items:flex-start;}}

/* ── Programa ── */
.ev .prog{list-style:none;margin:clamp(34px,5vh,48px) 0 0;padding:0;position:relative;}
.ev .prog::before{content:"";position:absolute;left:96px;top:10px;bottom:10px;width:1px;background:linear-gradient(var(--g),rgba(216,190,147,.15));}
.ev .prog li{position:relative;display:grid;grid-template-columns:96px minmax(0,1fr);gap:0 34px;padding:0 0 34px;}
.ev .prog li::before{content:"";position:absolute;left:91px;top:8px;width:11px;height:11px;border-radius:50%;background:var(--ink);border:1px solid var(--g);box-shadow:0 0 14px rgba(216,190,147,.45);}
.ev .prog .h{font-family:var(--fs);font-weight:300;font-size:30px;line-height:1;color:var(--g);text-align:right;padding-right:20px;}
.ev .prog .h small{display:block;font-family:var(--fm);font-size:9.5px;letter-spacing:.14em;color:var(--tx-dim);margin-top:6px;}
.ev .prog .b{padding:18px 22px;border-radius:16px;background:var(--ink-2);border:1px solid var(--line-soft);}
.ev .prog .b h3{font-family:var(--fs);font-weight:300;font-size:clamp(24px,3vw,30px);color:var(--tx);margin:0;}
.ev .prog .b p{color:var(--tx-mid);font-size:14.5px;line-height:1.6;margin:8px 0 0;}
.ev .prog .b .vid{display:inline-block;margin-top:12px;font-family:var(--fm);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);}
@media (max-width:620px){
  .ev .prog::before{left:6px;}
  .ev .prog li{grid-template-columns:minmax(0,1fr);padding-left:28px;gap:10px;}
  .ev .prog li::before{left:1px;}
  .ev .prog .h{text-align:left;padding:0;display:flex;gap:10px;align-items:baseline;}
  .ev .prog .h small{margin:0;}
}

/* ── Parceiros ── */
.ev .logos{margin-top:clamp(34px,5vh,48px);border-radius:16px;overflow:hidden;background:#fff;padding:10px 6px;}
.ev .logos img{display:block;width:100%;height:auto;}
.ev .parc{padding:22px 22px 18px;border-radius:16px;background:var(--ink-2);border:1px solid var(--line-soft);display:flex;flex-direction:column;gap:4px;}
.ev .parc.rl{border-color:rgba(216,190,147,.45);background:radial-gradient(120% 140% at 0% 0%,rgba(216,190,147,.1),transparent 55%),var(--ink-2);}
.ev .parc .k{font-family:var(--fm);font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);}
.ev .parc h3{font-family:var(--fs);font-weight:300;font-size:25px;line-height:1.1;color:var(--tx);margin:6px 0 0;}
.ev .parc .r{font-size:13.5px;color:var(--tx-mid);margin:2px 0 8px;}
.ev .parc a{font-size:13.5px;color:var(--tx-mid);text-decoration:none;padding:5px 0;border-top:1px solid var(--line-soft);overflow-wrap:anywhere;}
.ev .parc a:hover{color:var(--g);}

/* ── Entregas ── */
.ev .ent-resumo{display:flex;align-items:center;gap:18px;margin-top:clamp(30px,5vh,44px);}
.ev .ent-resumo .barra{flex:1;height:3px;border-radius:2px;background:var(--line-soft);overflow:hidden;}
.ev .ent-resumo .barra i{display:block;height:100%;background:var(--g);}
.ev .ent-resumo span{font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-mid);white-space:nowrap;}
.ev .ent-grupo{margin-top:clamp(30px,5vh,44px);}
.ev .ent-grupo h3{font-family:var(--fs);font-weight:300;font-size:clamp(26px,3vw,32px);color:var(--tx);margin:0;display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;}
.ev .ent-grupo h3 small{font-family:var(--fm);font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);}
.ev .ent-lista{margin-top:14px;border:1px solid var(--line-soft);border-radius:16px;overflow:hidden;}
.ev .ent{display:flex;align-items:center;gap:16px;padding:16px 20px;}
.ev .ent + .ent{border-top:1px solid var(--line-soft);}
.ev .ent:nth-child(even){background:rgba(243,237,226,.025);}
.ev .ent .ic{width:38px;height:38px;flex:none;display:grid;place-items:center;border-radius:50%;border:1px solid var(--line-soft);color:var(--tx-dim);}
.ev .ent.ok .ic{border-color:rgba(216,190,147,.5);color:var(--g);}
.ev .ent .ic svg{width:15px;height:15px;}
.ev .ent .t{flex:1;min-width:0;}
.ev .ent .t b{display:block;font-family:var(--fd);font-weight:300;font-size:clamp(16px,1.6vw,18px);color:var(--tx);}
.ev .ent .t span{display:block;font-family:var(--fm);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);margin-top:4px;}
.ev .ent .est{flex:none;font-family:var(--fm);font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;padding:9px 14px;border-radius:40px;border:1px solid var(--line-soft);color:var(--tx-dim);}
.ev .ent a.est{border-color:var(--g);background:var(--g);color:var(--ink);text-decoration:none;transition:.3s var(--ease);}
.ev .ent a.est:hover{background:transparent;color:var(--g);}
@media (max-width:560px){.ev .ent{flex-wrap:wrap;padding:14px 16px;}.ev .ent .est{margin-left:54px;}}

/* ── Faixa final ── */
.ev .faixa{margin-top:clamp(72px,12vh,120px);background:#070605;border-top:1px solid var(--line-soft);text-align:center;padding:clamp(60px,11vh,100px) 16px 48px;}
.ev .faixa h2{font-size:clamp(40px,8vw,68px);margin:0;}
.ev .faixa .ln{width:56px;height:1px;background:var(--g);margin:24px auto 0;}
.ev .faixa .ct{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 26px;margin-top:28px;}
.ev .faixa .ct a,.ev .faixa .ct span{font-family:var(--fm);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-mid);text-decoration:none;}
.ev .faixa .ct a:hover{color:var(--g);}
.ev .faixa img{width:44px;margin:46px auto 0;display:block;opacity:.75;}
.ev .faixa .hint{margin-top:16px;}

@supports (animation-timeline: view()){
  .ev .rv{animation:evSobe linear both;animation-timeline:view();animation-range:entry 0% entry 60%;}
}
@keyframes evKen{from{transform:scale(1.12)}to{transform:scale(1)}}
@keyframes evSobe{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.ev *,.ev *::before,.ev *::after{animation-duration:.01s!important;animation-delay:0s!important;}}
`

/* ── Peças ─────────────────────────────────────────────────────────────── */

function Cabeca({ n, etiqueta, children, lead }: { n: number; etiqueta: string; children: React.ReactNode; lead?: React.ReactNode }) {
  return (
    <header className="cap-h rv">
      <p className="eyebrow">{String(n).padStart(2, '0')} &middot; {etiqueta}</p>
      <h2>{children}</h2>
      <div className="ln" />
      {lead && <p className="lead">{lead}</p>}
    </header>
  )
}

function Rodape({ n }: { n: number }) {
  return (
    <div className="rod">
      <span>XIX Zankyou Wedding Club | SUD Lisboa | RL Photo Video</span>
      <span><b>{String(n).padStart(2, '0')} / {TOTAL}</b></span>
    </div>
  )
}

const IcPlay = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
const IcRelogio = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>

function Entregas({ links }: { links: Record<string, EntregaLink> }) {
  const grupos = montarEntregas(SLUG, links).filter(g => g.itens.length)
  const todas = grupos.flatMap(g => g.itens)
  const feitas = todas.filter(e => e.link).length
  if (!todas.length) return null
  return (
    <>
      <div className="ent-resumo rv">
        <div className="barra"><i style={{ width: `${(feitas / todas.length) * 100}%` }} /></div>
        <span>{feitas} de {todas.length} entregues</span>
      </div>
      {grupos.map(g => (
        <div key={g.parceiro} className="ent-grupo rv">
          <h3>{g.parceiro} <small>{g.sub}</small></h3>
          <div className="ent-lista">
            {g.itens.map(e => (
              <div key={e.id} className={`ent${e.link ? ' ok' : ''}`}>
                <span className="ic">{e.link ? <IcPlay /> : <IcRelogio />}</span>
                <span className="t"><b>{e.nome}</b><span>{[e.formato, e.data && `entregue a ${e.data.split('-').reverse().join('/')}`].filter(Boolean).join(' · ')}</span></span>
                {e.link
                  ? <a className="est" href={e.link} target="_blank" rel="noopener noreferrer">Ver / Descarregar ↗</a>
                  : <span className="est">Aguardar</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

/* ── Página ────────────────────────────────────────────────────────────── */

export default async function ZankyouSudLisboaPage() {
  // Só entra quem tem a senha do portal (cookie assinado) ou a sessão de admin
  const c = await cookies()
  const admin = !!process.env.AUTH_SECRET && c.get('rl_auth')?.value === process.env.AUTH_SECRET
  const ed = await lerEditorial(SLUG)
  if (!admin && !cookieValido(SLUG, ed.senhaHash, c.get(cookieEditorial(SLUG))?.value)) {
    return <EntradaEditorial slug={SLUG} parceiros={['Zankyou', 'SUD Lisboa', 'RL Photo Video']}
      titulo={<>Wedding <em>Club</em></>} fundo={`${IMG}/cartaz.webp`} />
  }

  return (
    <main className="nlead ev" style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      <style>{CSS_BRIEFING + CSS}</style>
      <div className="fx-grain" aria-hidden="true" />

      {/* Capa */}
      {/* O cartaz já tem o título: mostra-se inteiro, sem texto por cima */}
      <section className="capa" id="capa">
        <div className="capa-img"><img src={`${IMG}/cartaz.webp`} alt="XIX Edição Zankyou Wedding Club × SUD Lisboa, Party & Experience, 16 de novembro, das 16 às 22" /></div>
        <div className="capa-info">
          <h1 className="sr">XIX Zankyou Wedding Club × SUD Lisboa</h1>
          <p className="eyebrow">Portal do evento</p>
          <p className="parceiros-t">Zankyou<b>×</b>SUD Lisboa<b>×</b>RL Photo Video</p>
          <div className="linha" />
          <p className="plano">Segunda, 16 de novembro · das 16h às 22h</p>
        </div>
      </section>

      <IndiceCapitulos capitulos={CAPITULOS} rotulo="Zankyou × SUD Lisboa" />

      {/* 01 · O evento */}
      <section className="cap" id="evento">
        <Cabeca n={2} etiqueta="O evento" lead="A XIX Edição do Zankyou Wedding Club volta a Lisboa, em parceria com o SUD Lisboa, para reunir profissionais do setor dos casamentos numa tarde de networking, inspiração e celebração, com o pôr do sol sobre o Tejo como cenário. A RL Photo Video assina o vídeo oficial.">
          Uma tarde à beira do <em>Tejo</em>
        </Cabeca>
        <div className="grid g4">
          <div className="bloco rv"><div className="v">16 <em>nov</em></div><div className="t">Segunda-feira · 2026</div></div>
          <div className="bloco rv"><div className="v">16h<em>–</em>22h</div><div className="t">Quatro momentos</div></div>
          <div className="bloco rv"><div className="v"><em>SUD</em> Lisboa</div><div className="t">Belém, ao lado do MAAT</div></div>
          <div className="bloco rv"><div className="v"><em>Vídeo</em></div><div className="t">Oficial · RL Photo Video</div></div>
        </div>
        <div className="nota rv"><b>Organização</b>Zankyou Portugal · <a href="mailto:info@zankyou.pt" style={{ color: 'var(--tx)' }}>info@zankyou.pt</a> · <a href="tel:+351930563680" style={{ color: 'var(--tx)' }}>+351 930 563 680</a></div>
        <Rodape n={2} />
      </section>

      {/* 02 · Localização */}
      <section className="cap" id="local">
        <Cabeca n={3} etiqueta="Localização" lead="O SUD Lisboa fica junto ao Tejo, em Belém, ao lado do MAAT. Do Aeroporto Humberto Delgado são 20 a 30 minutos de carro, conforme o trânsito. O espaço tem estacionamento; táxi e TVDE deixam-vos à porta.">
          Como <em>chegar</em>
        </Cabeca>
        <div className="mapa rv"><iframe src={MAPA} title="Mapa do SUD Lisboa" loading="lazy" referrerPolicy="no-referrer-when-downgrade" /></div>
        <div className="morada rv">
          <p><small>Morada</small>{MORADA}</p>
          <div className="acoes-mapa">
            <a className="pill ouro" href={GMAPS} target="_blank" rel="noopener noreferrer">Google Maps ↗</a>
            <a className="pill" href={WAZE} target="_blank" rel="noopener noreferrer">Waze ↗</a>
            <a className="pill" href={APPLE} target="_blank" rel="noopener noreferrer">Apple Maps ↗</a>
          </div>
        </div>
        <Rodape n={3} />
      </section>

      {/* 03 · Meteorologia */}
      <section className="cap" id="meteo">
        <Cabeca n={4} etiqueta="Meteorologia" lead="Previsão hora a hora para Belém, das 16h às 22h. O pôr do sol é por volta das 17h20: a melhor luz da tarde sobre o Tejo.">
          O tempo no <em>dia</em>
        </Cabeca>
        <MeteoEvento lat={LAT} lon={LON} data={DATA} inicio={16} fim={22} por={17} />
        <Rodape n={4} />
      </section>

      {/* 04 · Programa */}
      <section className="cap" id="programa">
        <Cabeca n={5} etiqueta="Programa" lead="An Afternoon of Connections, Inspiration & Celebration. Quatro momentos, do welcome drink à festa.">
          A <em>timeline</em> do evento
        </Cabeca>
        <ol className="prog">
          {PROGRAMA.map(p => (
            <li key={p.hora} className="rv">
              <div className="h">{p.hora}<small>até às {p.fim}</small></div>
              <div className="b"><h3>{p.nome}</h3><p>{p.texto}</p></div>
            </li>
          ))}
        </ol>
        <Rodape n={5} />
      </section>

      {/* 05 · Parceiros */}
      <section className="cap" id="parceiros">
        <Cabeca n={6} etiqueta="Parceiros" lead="As marcas que fazem esta edição. Toquem num contacto para ligar, escrever ou abrir o Instagram.">
          Quem faz o <em>evento</em>
        </Cabeca>
        <div className="logos rv"><img src={`${IMG}/parceiros.webp`} alt="Logótipos: Zankyou, SUD Lisboa, Floor Sensation, Detail Wedding Photography, Madame Boutique Floral, RL Photo Video, Halus Stories, Filipa Martins Make Up, Gio Rodrigues Atelier" /></div>
        <div className="grid g3">
          {PARCEIROS.map(p => (
            <div key={p.nome} className={`parc rv${p.rl ? ' rl' : ''}`}>
              <span className="k">{p.papel}</span>
              <h3>{p.nome}</h3>
              <span className="r">{p.resp ?? ' '}</span>
              <a href={`tel:${p.tel.replace(/\s/g, '')}`}>{p.tel}</a>
              <a href={`mailto:${p.email}`}>{p.email}</a>
              <a href={`https://instagram.com/${p.ig}`} target="_blank" rel="noopener noreferrer">@{p.ig}</a>
              {p.site && <a href={`https://${p.site}`} target="_blank" rel="noopener noreferrer">{p.site} ↗</a>}
            </div>
          ))}
        </div>
        <Rodape n={6} />
      </section>

      {/* 06 · Entregas */}
      <section className="cap" id="entregas">
        <Cabeca n={7} etiqueta="Entregas" lead="Todo o vídeo do evento é entregue aqui. Cada peça aparece como disponível assim que estiver pronta, com o link para ver e descarregar.">
          O vídeo oficial, <em>pronto a usar</em>
        </Cabeca>
        <Entregas links={ed.entregas} />
        <Rodape n={7} />
      </section>

      <footer className="faixa">
        <p className="eyebrow">Vídeo oficial</p>
        <h2 style={{ marginTop: 18 }}>RL Photo <em>Video</em></h2>
        <div className="ln" />
        <div className="ct">
          <span>Rui Gonçalves</span>
          <a href="tel:+351912932768">912 932 768</a>
          <a href="mailto:geral.rlphoto@gmail.com">geral.rlphoto@gmail.com</a>
          <a href="https://www.instagram.com/rlphoto_fotografia.video/" target="_blank" rel="noopener noreferrer">@rlphoto_fotografia.video</a>
        </div>
        <img src="/logo_rl_gold.png" alt="RL Photo Video" />
        <div className="hint">XIX Zankyou Wedding Club | SUD Lisboa | 16 de novembro de 2026</div>
      </footer>
    </main>
  )
}
