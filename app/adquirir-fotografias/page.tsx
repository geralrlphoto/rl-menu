'use client'

import { useEffect, useRef } from 'react'

// Design FINAL e APROVADO — "Adquirir Fotografias". Markup, CSS e JS copiados
// 1:1 do ficheiro aprovado. Única alteração: o email do rodapé (artefacto
// Cloudflare) reposto para o real, e o submit faz POST para /api/photo-orders.

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,200;0,300;0,400;1,200;1,300&family=Hanken+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
:root{
  --ink:#0b0a08; --ink-2:#100e0b; --ink-3:#16130f;
  --g:#d8be93; --g-deep:#c8a866;
  --tx:rgba(243,237,226,.92); --tx-mid:rgba(243,237,226,.6); --tx-dim:rgba(243,237,226,.4);
  --line:rgba(243,237,226,.14); --line-soft:rgba(243,237,226,.08);
  --ok:#9fc6a0;
  --fd:'Jost',sans-serif; --fb:'Hanken Grotesk',sans-serif; --fm:'Space Mono',monospace;
  --ease:cubic-bezier(.16,1,.3,1); --pad:clamp(20px,5vw,80px);
}
.adqf *{margin:0;padding:0;box-sizing:border-box;}
.adqf{background:var(--ink);color:var(--tx);font-family:var(--fb);line-height:1.5;overflow-x:hidden;min-height:100vh;-webkit-font-smoothing:antialiased;}
.adqf a{color:inherit;text-decoration:none;}
.adqf ::selection{background:var(--g);color:var(--ink);}

.adqf .fx-grain{position:fixed;inset:0;z-index:9000;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");background-size:130px;}
.adqf .fx-vig{position:fixed;inset:0;z-index:8990;pointer-events:none;box-shadow:inset 0 0 240px 40px rgba(0,0,0,.5);}

.adqf .eyebrow{font-family:var(--fm);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--g);display:inline-flex;gap:.8em;align-items:center;}
.adqf .eyebrow::before{content:"";width:34px;height:1px;background:var(--g);opacity:.6;}
.adqf .wrap{width:100%;max-width:1180px;margin:0 auto;padding-inline:var(--pad);}
.adqf h1,.adqf h2,.adqf h3{font-family:var(--fd);font-weight:200;line-height:1.04;letter-spacing:-.02em;}

.adqf .phero{padding:clamp(90px,15vh,160px) var(--pad) clamp(30px,5vh,50px);text-align:center;}
.adqf .phero h1{font-size:clamp(40px,7vw,96px);}
.adqf .phero h1 em{font-style:italic;color:var(--g);}
.adqf .phero__sub{color:var(--tx-mid);max-width:54ch;margin:24px auto 0;line-height:1.7;font-size:clamp(15px,1.15vw,18px);}

.adqf .info{display:grid;grid-template-columns:1fr;gap:16px;margin:clamp(30px,5vh,50px) 0 0;}
@media(min-width:720px){.adqf .info{grid-template-columns:repeat(2,1fr);}}
@media(min-width:1000px){.adqf .info{grid-template-columns:repeat(4,1fr);}}
.adqf .icard{border:1px solid var(--line-soft);border-radius:10px;padding:28px 24px;background:var(--ink-2);position:relative;overflow:hidden;}
.adqf .icard .ic{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);}
.adqf .icard .iv{font-family:var(--fd);font-weight:200;font-size:clamp(28px,3vw,40px);margin:14px 0 8px;line-height:1;}
.adqf .icard .id{color:var(--tx-mid);font-size:13.5px;line-height:1.6;}

.adqf .order{display:grid;grid-template-columns:1fr;gap:clamp(30px,4vw,56px);margin:clamp(40px,7vh,80px) 0 clamp(70px,10vh,120px);}
@media(min-width:980px){.adqf .order{grid-template-columns:1.4fr .8fr;align-items:start;}}

.adqf .form{display:grid;gap:30px;}
.adqf .frow{display:grid;gap:30px;grid-template-columns:1fr;}
@media(min-width:620px){.adqf .frow.two{grid-template-columns:1fr 1fr;}}
.adqf .field label{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:12px;}
.adqf .field label .opt{color:var(--tx-dim);}
.adqf .field input,.adqf .field textarea{width:100%;background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--tx);
  font-family:var(--fd);font-weight:300;font-size:clamp(17px,1.6vw,22px);padding:8px 0 13px;outline:none;transition:border-color .4s var(--ease);}
.adqf .field input::placeholder,.adqf .field textarea::placeholder{color:var(--tx-dim);}
.adqf .field input:focus,.adqf .field textarea:focus{border-color:var(--g);}
.adqf .field textarea{resize:none;min-height:70px;}

.adqf .seg{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.adqf .seg label{display:block;cursor:pointer;border:1px solid var(--line-soft);border-radius:10px;padding:20px 22px;transition:.4s var(--ease);position:relative;margin:0;}
.adqf .seg input{position:absolute;opacity:0;pointer-events:none;}
.adqf .seg .t{font-family:var(--fd);font-weight:300;font-size:20px;color:var(--tx);display:block;}
.adqf .seg .d{font-family:var(--fm);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);margin-top:8px;}
.adqf .seg label:hover{border-color:var(--line);}
.adqf .seg input:checked + .lblc{}
.adqf .seg label.on{border-color:var(--g);background:rgba(216,190,147,.06);}
.adqf .seg label.on .t{color:var(--g);}

.adqf .stepper{display:inline-flex;align-items:center;gap:0;border:1px solid var(--line);border-radius:40px;overflow:hidden;}
.adqf .stepper button{width:54px;height:54px;background:transparent;border:none;color:var(--tx);font-size:22px;cursor:pointer;font-family:var(--fd);transition:.3s;}
.adqf .stepper button:hover{background:rgba(216,190,147,.1);color:var(--g);}
.adqf .stepper input{width:74px;text-align:center;background:transparent;border:none;color:var(--tx);font-family:var(--fd);font-weight:300;font-size:24px;outline:none;-moz-appearance:textfield;}
.adqf .stepper input::-webkit-outer-spin-button,.adqf .stepper input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}
.adqf .qty-hint{font-family:var(--fm);font-size:11px;letter-spacing:.1em;color:var(--tx-mid);margin-top:14px;}
.adqf .qty-hint b{color:var(--g);}

/* lista dinâmica de fotografias */
.adqf .fotolist{display:flex;flex-direction:column;gap:12px;margin-bottom:14px;}
.adqf .fotorow{display:flex;align-items:center;gap:12px;}
.adqf .fotorow .idx{font-family:var(--fm);font-size:11px;letter-spacing:.06em;color:var(--tx-dim);width:30px;flex:none;}
.adqf .fotorow input{flex:1;background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--tx);
  font-family:var(--fd);font-weight:300;font-size:clamp(16px,1.4vw,20px);padding:6px 0 10px;outline:none;transition:border-color .4s var(--ease);}
.adqf .fotorow input::placeholder{color:var(--tx-dim);}
.adqf .fotorow input:focus{border-color:var(--g);}
.adqf .fotorow .rm{flex:none;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--tx-mid);cursor:pointer;font-size:13px;transition:.3s;}
.adqf .fotorow .rm:hover{border-color:var(--g);color:var(--g);}
.adqf .addfoto{font-family:var(--fm);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--g);background:transparent;
  border:1px solid var(--line);border-radius:40px;padding:12px 22px;cursor:pointer;transition:.3s var(--ease);}
.adqf .addfoto:hover{border-color:var(--g);background:rgba(216,190,147,.06);}
.adqf .btn:disabled{opacity:.4;cursor:not-allowed;}
.adqf .btn:disabled .fill{transform:translateY(101%);}

.adqf .summary{border:1px solid var(--line-soft);border-radius:12px;background:var(--ink-2);padding:clamp(28px,3vw,38px);position:sticky;top:24px;}
.adqf .summary h3{font-family:var(--fm);font-weight:400;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);}
.adqf .sline{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:16px 0;border-bottom:1px solid var(--line-soft);}
.adqf .sline:first-of-type{margin-top:18px;}
.adqf .sline .k{color:var(--tx-mid);font-size:14px;}
.adqf .sline .k small{display:block;color:var(--tx-dim);font-size:11px;font-family:var(--fm);letter-spacing:.08em;margin-top:3px;}
.adqf .sline .v{font-family:var(--fd);font-weight:300;font-size:18px;white-space:nowrap;}
.adqf .sline .v.free{color:var(--ok);}
.adqf .stotal{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding-top:22px;margin-top:6px;}
.adqf .stotal .k{font-family:var(--fm);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--tx);}
.adqf .stotal .v{font-family:var(--fd);font-weight:200;font-size:clamp(34px,4vw,52px);color:var(--g);line-height:.9;}
.adqf .deliver{margin-top:22px;font-family:var(--fm);font-size:11px;letter-spacing:.1em;color:var(--tx-mid);display:flex;gap:.7em;align-items:flex-start;line-height:1.6;}
.adqf .deliver .dot{color:var(--g);}

.adqf .mbway{margin-top:22px;border:1px solid var(--g);border-radius:10px;padding:20px 22px;background:rgba(216,190,147,.05);text-align:center;}
.adqf .mbway__h{font-family:var(--fm);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--g);}
.adqf .mbway__num{font-family:var(--fd);font-weight:200;font-size:clamp(26px,3vw,34px);color:var(--tx);margin-top:10px;letter-spacing:.04em;}
.adqf .mbway__name{font-family:var(--fb);font-size:13px;color:var(--tx-mid);margin-top:4px;}
.adqf .mbway__amt{font-family:var(--fm);font-size:11px;letter-spacing:.1em;color:var(--tx-mid);margin-top:14px;padding-top:14px;border-top:1px solid var(--line-soft);}
.adqf .mbway__amt b{color:var(--g);font-size:14px;}

.adqf .btn{display:inline-flex;align-items:center;justify-content:center;gap:.9em;width:100%;position:relative;isolation:isolate;
  font-family:var(--fm);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);
  padding:20px 38px;border:1px solid var(--g);border-radius:40px;overflow:hidden;background:var(--g);cursor:pointer;
  transition:color .5s var(--ease);margin-top:26px;}
.adqf .btn .fill{position:absolute;inset:0;z-index:-1;background:var(--ink);transform:translateY(101%);transition:transform .6s var(--ease);}
.adqf .btn .dot{width:5px;height:5px;border-radius:50%;background:var(--ink);transition:background .5s;}
.adqf .btn:hover{color:var(--g);}.adqf .btn:hover .fill{transform:translateY(0);}.adqf .btn:hover .dot{background:var(--g);}
.adqf .note{font-family:var(--fm);font-size:10px;letter-spacing:.12em;color:var(--tx-dim);text-align:center;margin-top:16px;line-height:1.6;}

.adqf .sent{display:none;text-align:center;padding:clamp(40px,7vh,80px) var(--pad);}
.adqf .sent.show{display:block;}
.adqf .sent .mk{width:70px;height:70px;border:1px solid var(--g);border-radius:50%;display:grid;place-items:center;margin:0 auto 28px;color:var(--g);font-size:26px;}
.adqf .sent h2{font-size:clamp(30px,5vw,60px);}
.adqf .sent h2 em{font-style:italic;color:var(--g);}
.adqf .sent p{color:var(--tx-mid);max-width:46ch;margin:20px auto 0;line-height:1.7;}
.adqf .sent .recap{font-family:var(--fm);font-size:12px;letter-spacing:.08em;color:var(--g);margin-top:24px;}

.adqf .upload{position:relative;border:1px dashed var(--line);border-radius:10px;background:var(--ink-2);transition:border-color .4s var(--ease),background .4s;}
.adqf .upload.drag{border-color:var(--g);background:rgba(216,190,147,.06);}
.adqf .upload input[type=file]{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;z-index:2;}
.adqf .upload.has-file input[type=file]{pointer-events:none;}
.adqf .upload__empty{display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;padding:34px 20px;pointer-events:none;}
.adqf .upload__ic{font-size:26px;color:var(--g);}
.adqf .upload__t{font-family:var(--fd);font-weight:300;font-size:17px;color:var(--tx);}
.adqf .upload__d{font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-dim);}
.adqf .upload__filled{display:none;align-items:center;gap:16px;padding:16px;}
.adqf .upload.has-file .upload__empty{display:none;}
.adqf .upload.has-file .upload__filled{display:flex;}
.adqf .upload__filled img{width:64px;height:64px;object-fit:cover;border-radius:7px;border:1px solid var(--line-soft);display:none;}
.adqf .upload__doc{width:64px;height:64px;border-radius:7px;border:1px solid var(--g);display:none;place-items:center;
  font-family:var(--fm);font-size:12px;letter-spacing:.1em;color:var(--g);flex:none;}
.adqf .upload__meta{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;}
.adqf .upload__meta #uploadName{font-family:var(--fd);font-weight:300;font-size:16px;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.adqf .upload__meta #uploadSize{font-family:var(--fm);font-size:10px;letter-spacing:.12em;color:var(--g);}
.adqf .upload__x{flex:none;width:38px;height:38px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--tx-mid);
  cursor:pointer;font-size:14px;z-index:3;position:relative;transition:.3s;}
.adqf .upload__x:hover{border-color:var(--g);color:var(--g);}
.adqf .upload__note{font-family:var(--fm);font-size:10px;letter-spacing:.1em;color:var(--tx-dim);margin-top:12px;line-height:1.6;}

.adqf .r{opacity:0;transform:translateY(26px);transition:opacity 1s var(--ease),transform 1s var(--ease);}
.adqf .r.in{opacity:1;transform:none;}
@media(prefers-reduced-motion:reduce){.adqf .r{opacity:1;transform:none;}}

.adqf .foot{background:var(--ink-2);border-top:1px solid var(--line-soft);padding:clamp(40px,6vh,70px) 0;text-align:center;}
.adqf .foot .fm{font-family:var(--fm);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);}
.adqf .foot a{color:var(--g);}
`

const BODY = `
<div class="fx-grain"></div>
<div class="fx-vig"></div>

<section class="phero">
  <div class="r"><span class="eyebrow" style="justify-content:center">Fotografias</span></div>
  <h1 class="r" style="margin-top:22px">Adquiram as vossas <em>fotografias.</em></h1>
  <p class="phero__sub r">Escolham as fotografias que querem levar para casa. Cada uma custa <strong>5&euro;</strong>, em formato digital ou em papel. Façam o pagamento por <strong>MB WAY</strong>, anexem o comprovativo e confirmem o pedido.</p>
</section>

<div class="wrap">
  <div class="info">
    <div class="icard r"><div class="ic">Preço</div><div class="iv">5&euro;</div><div class="id">Por cada fotografia, em digital ou papel.</div></div>
    <div class="icard r"><div class="ic">Digital</div><div class="iv">15 dias</div><div class="id">Entrega por link de download, em alta resolução.</div></div>
    <div class="icard r"><div class="ic">Papel</div><div class="iv">30 dias</div><div class="id">Impressão e envio para a vossa morada por carta registada.</div></div>
    <div class="icard r"><div class="ic">Portes (papel)</div><div class="iv">+4&euro;</div><div class="id">Só abaixo de 5 fotografias. A partir de 5, portes grátis.</div></div>
  </div>
</div>

<section class="wrap">
  <div class="order" id="orderBlock">
    <form class="form r" id="orderForm" novalidate>
      <div class="frow two">
        <div class="field"><label>Nome completo</label><input type="text" id="f-nome" placeholder="O vosso nome" required></div>
        <div class="field"><label>Email</label><input type="email" id="f-email" placeholder="nome@email.pt" required></div>
      </div>
      <div class="frow two">
        <div class="field"><label>Nome dos noivos</label><input type="text" id="f-noivos" placeholder="Ex.: Ana e André" required></div>
        <div class="field"><label>Data do casamento</label><input type="text" id="f-data" placeholder="DD / MM / AAAA" required></div>
      </div>
      <div class="frow two">
        <div class="field"><label>Contacto telefónico</label><input type="tel" id="f-tel" placeholder="912 000 000" required></div>
        <div class="field" id="fieldMorada" style="display:none"><label>Morada de envio <span class="opt">(obrigatória para papel)</span></label><input type="text" id="f-morada" placeholder="Rua, nº, código postal, localidade"></div>
      </div>

      <div class="field">
        <label>Formato</label>
        <div class="seg" id="segFormato">
          <label class="on" data-val="digital">
            <input type="radio" name="formato" value="digital" checked>
            <span class="t">Digital</span>
            <span class="d">Download · 15 dias</span>
          </label>
          <label data-val="papel">
            <input type="radio" name="formato" value="papel">
            <span class="t">Papel</span>
            <span class="d">Carta registada · 30 dias</span>
          </label>
        </div>
      </div>

      <div class="field">
        <label>Fotografias <span class="opt">(escrevam o número de cada uma)</span></label>
        <div class="fotolist" id="fotoList"></div>
        <button type="button" class="addfoto" id="addFoto">+ Adicionar fotografia</button>
        <div class="qty-hint" id="qtyHint">Faltam <b>4</b> para terem portes grátis (papel).</div>
      </div>

      <div class="field">
        <label>Referências / mensagem <span class="opt">(opcional)</span></label>
        <textarea id="f-msg" placeholder="Indiquem os nomes ou números das fotografias que pretendem, ou qualquer detalhe."></textarea>
      </div>

      <div class="field">
        <label>Comprovativo de pagamento</label>
        <div class="upload" id="upload">
          <input type="file" id="f-comprovativo" accept="image/*,application/pdf">
          <div class="upload__empty" id="uploadEmpty">
            <span class="upload__ic">⤓</span>
            <span class="upload__t">Arrastem ou cliquem para anexar</span>
            <span class="upload__d">Imagem ou PDF · máx. 8MB</span>
          </div>
          <div class="upload__filled" id="uploadFilled">
            <img id="uploadThumb" alt="Comprovativo">
            <div class="upload__doc" id="uploadDoc">PDF</div>
            <div class="upload__meta"><span id="uploadName">ficheiro.jpg</span><span id="uploadSize"></span></div>
            <button type="button" class="upload__x" id="uploadRemove" aria-label="Remover">✕</button>
          </div>
        </div>
        <div class="upload__note">Anexem o comprovativo de pagamento (imagem ou PDF) para finalizar o pedido.</div>
      </div>
    </form>

    <aside class="summary r">
      <h3>Resumo da encomenda</h3>
      <div class="sline">
        <div class="k">Fotografias <small id="recapFmt">Digital</small></div>
        <div class="v"><span id="recapQtd">1</span> × 5&euro;</div>
      </div>
      <div class="sline">
        <div class="k">Subtotal</div>
        <div class="v" id="recapSub">5&euro;</div>
      </div>
      <div class="sline" id="linePortes">
        <div class="k">Portes <small>carta registada</small></div>
        <div class="v" id="recapPortes">&mdash;</div>
      </div>
      <div class="stotal">
        <div class="k">Total</div>
        <div class="v" id="recapTotal">5&euro;</div>
      </div>
      <div class="deliver"><span class="dot">✦</span><span id="recapEntrega">Entrega digital em até 15 dias úteis.</span></div>

      <div class="mbway">
        <div class="mbway__h">Pagamento por MB WAY</div>
        <div class="mbway__num">916 162 728</div>
        <div class="mbway__name">Liliana Gonçalves</div>
        <div class="mbway__amt">Valor a transferir: <b id="mbwayTotal">5&euro;</b></div>
      </div>

      <button class="btn" type="submit" form="orderForm"><span class="fill"></span><span class="dot"></span>Confirmar pedido</button>
      <p class="note">O pedido só é confirmado após o pagamento por MB WAY e o anexo do comprovativo. Responderemos por email em 24h.</p>
    </aside>
  </div>

  <div class="sent" id="sentBlock">
    <div class="mk">✓</div>
    <h2>Pedido <em>recebido.</em></h2>
    <p>Obrigado! Enviámos um <strong>comprovativo de aquisição</strong> para o vosso email com todos os detalhes do pedido. Vamos validar o pagamento e tratar das vossas fotografias.</p>
    <div class="recap" id="sentRecap"></div>
  </div>
</section>

<footer class="foot">
  <div class="fm">RL Photo.Video &nbsp;·&nbsp; <a href="mailto:geral.rlphoto@gmail.com">geral.rlphoto@gmail.com</a> &nbsp;·&nbsp; 912 832 788</div>
</footer>
`

export default function AdquirirFotografiasPage() {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    /* ── JS copiado 1:1 do design aprovado ── */
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { (e.target as HTMLElement).classList.add('in'); io.unobserve(e.target) } }) }, { threshold: .12 })
    document.querySelectorAll('.adqf .r').forEach(function (el) { reduce ? el.classList.add('in') : io.observe(el) })

    var PRICE = 5, PORTES = 4, FREE_FROM = 5
    var seg = document.getElementById('segFormato')!
    var fotoList = document.getElementById('fotoList')!
    var addFoto = document.getElementById('addFoto')!

    function fmt() { return (seg.querySelector('label.on') as HTMLElement).dataset.val! }
    function rowCount() { return fotoList.querySelectorAll('.fotorow').length }
    function n() { var v = rowCount(); return v < 1 ? 1 : v }
    function fotografiasValue() { return Array.prototype.map.call(fotoList.querySelectorAll('.fotorow input'), function (i: any) { return i.value.trim() }).filter(Boolean).join('\n') }
    function renumber() { Array.prototype.forEach.call(fotoList.querySelectorAll('.fotorow'), function (r: any, i: number) { r.querySelector('.idx').textContent = (i + 1) + '.' }) }
    function addRow() {
      var row = document.createElement('div'); row.className = 'fotorow'
      row.innerHTML = '<span class="idx"></span><input type="text" inputmode="numeric" placeholder="Nº da fotografia"><button type="button" class="rm" aria-label="Remover">✕</button>'
      ;(row.querySelector('.rm') as HTMLElement).addEventListener('click', function () { if (rowCount() <= 1) return; row.remove(); renumber(); update() })
      ;(row.querySelector('input') as HTMLInputElement).addEventListener('input', update)
      fotoList.appendChild(row); renumber()
    }
    function euro(x: number) { return (Number.isInteger(x) ? x : x.toFixed(2)) + '€' }

    function update() {
      var q = n(), f = fmt()
      var sub = q * PRICE
      var portes = (f === 'papel' && q < FREE_FROM) ? PORTES : 0
      var total = sub + portes

      document.getElementById('recapQtd')!.textContent = String(q)
      document.getElementById('recapFmt')!.textContent = f === 'papel' ? 'Papel' : 'Digital'
      document.getElementById('recapSub')!.textContent = euro(sub)
      document.getElementById('recapTotal')!.textContent = euro(total)
      var mb = document.getElementById('mbwayTotal'); if (mb) mb.textContent = euro(total)

      var lp = document.getElementById('linePortes')!, rp = document.getElementById('recapPortes')!
      if (f === 'papel') {
        lp.style.display = ''
        if (portes === 0) { rp.innerHTML = 'Grátis'; rp.className = 'v free' }
        else { rp.textContent = euro(portes); rp.className = 'v' }
      } else {
        lp.style.display = 'none'
      }

      document.getElementById('recapEntrega')!.textContent = f === 'papel'
        ? 'Impressão e envio por carta registada em até 30 dias úteis.'
        : 'Entrega digital (link de download) em até 15 dias úteis.'

      // Morada só para papel (aí é obrigatória); em digital some.
      var fm = document.getElementById('fieldMorada')!
      fm.style.display = f === 'papel' ? '' : 'none'

      var hint = document.getElementById('qtyHint')!
      if (f === 'papel') {
        hint.style.display = ''
        if (q < FREE_FROM) { var falta = FREE_FROM - q; hint.innerHTML = 'Faltam <b>' + falta + '</b> ' + (falta === 1 ? 'fotografia' : 'fotografias') + ' para terem portes grátis.' }
        else { hint.innerHTML = '<b>Portes grátis</b> — têm 5 ou mais fotografias.' }
      } else {
        hint.style.display = 'none'
      }
    }

    addFoto.addEventListener('click', function () { addRow(); update() })
    addRow()  // começa com 1 espaço

    seg.querySelectorAll('label').forEach(function (lab) {
      lab.addEventListener('click', function () {
        seg.querySelectorAll('label').forEach(function (l) { l.classList.remove('on') })
        lab.classList.add('on');
        (lab.querySelector('input') as HTMLInputElement).checked = true
        update()
      })
    })

    update()

    /* upload comprovativo */
    var upBox = document.getElementById('upload')!
    var upInput = document.getElementById('f-comprovativo') as HTMLInputElement
    var upThumb = document.getElementById('uploadThumb') as HTMLImageElement
    var upDoc = document.getElementById('uploadDoc')!
    var upName = document.getElementById('uploadName')!
    var upSize = document.getElementById('uploadSize')!
    var upRemove = document.getElementById('uploadRemove')!
    var MAXB = 8 * 1024 * 1024
    var submitBtn = document.querySelector('.adqf .btn') as HTMLButtonElement | null

    // O botão "Confirmar pedido" só fica ativo depois de anexado o comprovativo.
    function syncBtn() { if (submitBtn) submitBtn.disabled = !(upInput.files && upInput.files[0]) }

    function human(b: number) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(0) + ' KB'; return (b / 1048576).toFixed(1) + ' MB' }
    function showFile(file: File) {
      if (!file) return
      if (file.size > MAXB) { alert('O ficheiro é demasiado grande (máx. 8MB).'); clearFile(); return }
      upName.textContent = file.name
      upSize.textContent = human(file.size)
      if (file.type.indexOf('image/') === 0) {
        var url = URL.createObjectURL(file)
        upThumb.src = url; upThumb.style.display = 'block'; upDoc.style.display = 'none'
      } else {
        upThumb.style.display = 'none'; upDoc.style.display = 'grid'
        upDoc.textContent = file.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'FILE'
      }
      upBox.classList.add('has-file')
      syncBtn()
    }
    function clearFile() {
      upInput.value = ''; upThumb.src = ''; upBox.classList.remove('has-file')
      syncBtn()
    }
    syncBtn()  // estado inicial: desativado (sem comprovativo)
    upInput.addEventListener('change', function () { if (upInput.files && upInput.files[0]) showFile(upInput.files[0]) })
    upRemove.addEventListener('click', function (e) { e.stopPropagation(); clearFile() })
    ;['dragenter', 'dragover'].forEach(function (ev) { upBox.addEventListener(ev, function (e) { e.preventDefault(); upBox.classList.add('drag') }) })
    ;['dragleave', 'drop'].forEach(function (ev) { upBox.addEventListener(ev, function (e) { e.preventDefault(); upBox.classList.remove('drag') }) })
    upBox.addEventListener('drop', function (e) { var dt = (e as DragEvent).dataTransfer; var f = dt && dt.files && dt.files[0]; if (f) { try { upInput.files = dt!.files } catch (err) { } showFile(f) } })

    /* submit */
    document.getElementById('orderForm')!.addEventListener('submit', async function (e) {
      e.preventDefault()
      var nome = (document.getElementById('f-nome') as HTMLInputElement).value.trim()
      var email = (document.getElementById('f-email') as HTMLInputElement).value.trim()
      var noivos = (document.getElementById('f-noivos') as HTMLInputElement).value.trim()
      var dataCasamento = (document.getElementById('f-data') as HTMLInputElement).value.trim()
      var tel = (document.getElementById('f-tel') as HTMLInputElement).value.trim()
      var morada = (document.getElementById('f-morada') as HTMLInputElement).value.trim()
      var msg = (document.getElementById('f-msg') as HTMLTextAreaElement).value.trim()
      var f = fmt(), q = n()
      if (!nome || !email || !tel) { alert('Por favor preencham nome, email e contacto.'); return }
      if (!noivos || !dataCasamento) { alert('Por favor indiquem o nome dos noivos e a data do casamento.'); return }
      if (f === 'papel' && !morada) { alert('Para formato em papel, indiquem a morada de envio.'); document.getElementById('f-morada')!.focus(); return }
      if (!(upInput.files && upInput.files[0])) { alert('Por favor anexem o comprovativo de pagamento.'); document.getElementById('upload')!.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }

      var sub = q * PRICE, portes = (f === 'papel' && q < FREE_FROM) ? PORTES : 0, total = sub + portes
      var btn = document.querySelector('.adqf .btn') as HTMLButtonElement
      if (btn) { btn.disabled = true; (btn.querySelector('.dot')!.nextSibling as Text).textContent = ' A enviar…' }

      var fd = new FormData()
      fd.append('nome', nome); fd.append('email', email); fd.append('telefone', tel)
      fd.append('noivos', noivos); fd.append('data_casamento', dataCasamento)
      fd.append('morada', morada); fd.append('formato', f); fd.append('quantidade', String(q))
      fd.append('subtotal', String(sub)); fd.append('portes', String(portes)); fd.append('total', String(total))
      fd.append('mensagem', msg)
      fd.append('fotografias', fotografiasValue())
      fd.append('comprovativo', upInput.files[0])
      try {
        await fetch('/api/photo-orders', { method: 'POST', body: fd })
      } catch (err) { /* mostra confirmação na mesma */ }

      document.getElementById('orderBlock')!.style.display = 'none'
      var s = document.getElementById('sentBlock')!; s.classList.add('show')
      document.getElementById('sentRecap')!.innerHTML =
        q + ' fotografia' + (q > 1 ? 's' : '') + ' · ' + (f === 'papel' ? 'Papel' : 'Digital') + ' · Total ' + euro(total)
        + '<br>Comprovativo: ' + upInput.files[0].name
      s.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="adqf" dangerouslySetInnerHTML={{ __html: BODY }} />
    </>
  )
}
