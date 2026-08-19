'use client'

import { useEffect, useRef } from 'react'

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Jost:ital,wght@0,200;0,300;0,400;1,200;1,300&family=Hanken+Grotesk:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');
:root{
  --ink:#0b0a08; --ink-2:#100e0b; --g:#d8be93; --g-deep:#c8a866;
  --tx:rgba(243,237,226,.92); --tx-mid:rgba(243,237,226,.6); --tx-dim:rgba(243,237,226,.4);
  --line:rgba(243,237,226,.14); --line-soft:rgba(243,237,226,.08); --ok:#9fc6a0;
  --fd:'Jost',sans-serif; --fb:'Hanken Grotesk',sans-serif; --fm:'Space Mono',monospace;
  --ease:cubic-bezier(.16,1,.3,1); --pad:clamp(20px,5vw,80px);
}
.tkt *{margin:0;padding:0;box-sizing:border-box;}
.tkt{background:var(--ink);color:var(--tx);font-family:var(--fb);line-height:1.5;min-height:100vh;-webkit-font-smoothing:antialiased;}
.tkt a{color:inherit;text-decoration:none;}
.tkt .eyebrow{font-family:var(--fm);font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:var(--g);display:inline-flex;gap:.8em;align-items:center;}
.tkt .eyebrow::before{content:"";width:34px;height:1px;background:var(--g);opacity:.6;}
.tkt .wrap{width:100%;max-width:1180px;margin:0 auto;padding-inline:var(--pad);}
.tkt h1{font-family:var(--fd);font-weight:200;line-height:1.04;letter-spacing:-.02em;}
.tkt .phero{padding:clamp(70px,12vh,120px) var(--pad) clamp(20px,4vh,40px);text-align:center;}
.tkt .phero h1{font-size:clamp(36px,6vw,76px);}
.tkt .phero h1 em{font-style:italic;color:var(--g);}
.tkt .phero__sub{color:var(--tx-mid);max-width:54ch;margin:18px auto 0;line-height:1.7;font-size:clamp(14px,1.1vw,17px);}
.tkt .info{display:grid;grid-template-columns:1fr;gap:16px;margin:clamp(20px,4vh,40px) 0 0;}
@media(min-width:720px){.tkt .info{grid-template-columns:repeat(2,1fr);}}
@media(min-width:1000px){.tkt .info{grid-template-columns:repeat(4,1fr);}}
.tkt .icard{border:1px solid var(--line-soft);border-radius:10px;padding:24px 22px;background:var(--ink-2);}
.tkt .icard .ic{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);}
.tkt .icard .iv{font-family:var(--fd);font-weight:200;font-size:clamp(26px,3vw,38px);margin:12px 0 8px;line-height:1;}
.tkt .icard .id{color:var(--tx-mid);font-size:13px;line-height:1.6;}

.tkt .order{display:grid;grid-template-columns:1fr;gap:clamp(30px,4vw,56px);margin:clamp(30px,5vh,60px) 0 clamp(70px,10vh,120px);}
@media(min-width:980px){.tkt .order{grid-template-columns:1.4fr .8fr;align-items:start;}}
.tkt .form{display:grid;gap:30px;}
.tkt .frow{display:grid;gap:30px;grid-template-columns:1fr;}
@media(min-width:620px){.tkt .frow.two{grid-template-columns:1fr 1fr;}}
.tkt .field label{font-family:var(--fm);font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:12px;}
.tkt .field label .opt{color:var(--tx-dim);}
.tkt .field input,.tkt .field textarea,.tkt .field select{width:100%;background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--tx);
  font-family:var(--fd);font-weight:300;font-size:clamp(16px,1.5vw,21px);padding:8px 0 13px;outline:none;transition:border-color .4s var(--ease);}
.tkt .field select{cursor:pointer;color-scheme:dark;}
.tkt .field select option{background:#15110b;color:var(--tx);}
.tkt .field input::placeholder,.tkt .field textarea::placeholder{color:var(--tx-dim);}
.tkt .field input.locked{color:var(--g);border-bottom-style:dashed;cursor:not-allowed;}
.tkt .field input:focus,.tkt .field textarea:focus,.tkt .field select:focus{border-color:var(--g);}
.tkt .field textarea{resize:none;min-height:60px;}

.tkt .respbox{border:1px solid var(--g);border-radius:12px;padding:clamp(20px,3vw,28px);background:rgba(216,190,147,.05);display:grid;gap:24px;}
.tkt .respbox .rh{font-family:var(--fm);font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--g);}

.tkt .seg{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
.tkt .seg.three{grid-template-columns:1fr 1fr 1fr;}
.tkt .seg label{display:block;cursor:pointer;border:1px solid var(--line-soft);border-radius:10px;padding:18px 20px;transition:.4s var(--ease);text-align:center;margin:0;}
.tkt .seg .t{font-family:var(--fd);font-weight:300;font-size:18px;color:var(--tx);display:block;}
.tkt .seg .d{font-family:var(--fm);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-dim);margin-top:6px;}
.tkt .seg label:hover{border-color:var(--line);}
.tkt .seg label.on{border-color:var(--g);background:rgba(216,190,147,.06);}
.tkt .seg label.on .t{color:var(--g);}

.tkt .fotolist{display:flex;flex-direction:column;gap:12px;margin-bottom:14px;}
.tkt .fotorow{display:flex;align-items:center;gap:12px;}
.tkt .fotorow .idx{font-family:var(--fm);font-size:11px;color:var(--tx-dim);width:30px;flex:none;}
.tkt .fotorow input{flex:1;background:transparent;border:none;border-bottom:1px solid var(--line);color:var(--tx);font-family:var(--fd);font-weight:300;font-size:clamp(16px,1.4vw,20px);padding:6px 0 10px;outline:none;}
.tkt .fotorow input:focus{border-color:var(--g);}
.tkt .fotorow .rm{flex:none;width:34px;height:34px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--tx-mid);cursor:pointer;font-size:13px;}
.tkt .fotorow .rm:hover{border-color:var(--g);color:var(--g);}
.tkt .addfoto{font-family:var(--fm);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--g);background:transparent;border:1px solid var(--line);border-radius:40px;padding:12px 22px;cursor:pointer;}
.tkt .addfoto:hover{border-color:var(--g);background:rgba(216,190,147,.06);}
.tkt .qty-hint{font-family:var(--fm);font-size:11px;letter-spacing:.1em;color:var(--tx-mid);margin-top:14px;}
.tkt .qty-hint b{color:var(--g);}

.tkt .summary{border:1px solid var(--line-soft);border-radius:12px;background:var(--ink-2);padding:clamp(26px,3vw,36px);position:sticky;top:24px;}
.tkt .summary h3{font-family:var(--fm);font-weight:400;font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);}
.tkt .sline{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding:16px 0;border-bottom:1px solid var(--line-soft);}
.tkt .sline:first-of-type{margin-top:18px;}
.tkt .sline .k{color:var(--tx-mid);font-size:14px;}
.tkt .sline .v{font-family:var(--fd);font-weight:300;font-size:18px;white-space:nowrap;}
.tkt .sline .v.free{color:var(--ok);}
.tkt .stotal{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding-top:22px;margin-top:6px;}
.tkt .stotal .k{font-family:var(--fm);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--tx);}
.tkt .stotal .v{font-family:var(--fd);font-weight:200;font-size:clamp(34px,4vw,50px);color:var(--g);line-height:.9;}
.tkt .btn{display:inline-flex;align-items:center;justify-content:center;gap:.9em;width:100%;font-family:var(--fm);font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--ink);padding:20px 38px;border:1px solid var(--g);border-radius:40px;background:var(--g);cursor:pointer;margin-top:26px;transition:opacity .3s;}
.tkt .btn:disabled{opacity:.5;cursor:not-allowed;}
.tkt .mbway{max-width:640px;margin:0 auto clamp(40px,8vh,90px);border:1px solid var(--g);border-radius:12px;padding:24px 26px;background:rgba(216,190,147,.05);text-align:center;}
.tkt .mbway__h{font-family:var(--fm);font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);}
.tkt .mbway__num{font-family:var(--fd);font-weight:200;font-size:clamp(26px,3vw,34px);color:var(--tx);margin-top:10px;letter-spacing:.04em;}
.tkt .mbway__name{font-family:var(--fb);font-size:13px;color:var(--tx-mid);margin-top:4px;}
.tkt .note{font-family:var(--fm);font-size:10px;letter-spacing:.12em;color:var(--tx-dim);text-align:center;margin-top:16px;line-height:1.6;}
.tkt .msg{font-family:var(--fm);font-size:11px;text-align:center;margin-top:14px;}
.tkt .msg.err{color:#e9a3a3;} .tkt .msg.ok{color:var(--ok);}
.tkt .sent{display:none;text-align:center;padding:clamp(40px,7vh,80px) var(--pad);}
.tkt .sent.show{display:block;}
.tkt .sent .mk{width:70px;height:70px;border:1px solid var(--g);border-radius:50%;display:grid;place-items:center;margin:0 auto 24px;color:var(--g);font-size:26px;}
.tkt .sent h2{font-family:var(--fd);font-weight:200;font-size:clamp(28px,5vw,52px);}
.tkt .sent h2 em{font-style:italic;color:var(--g);}
.tkt .sent p{color:var(--tx-mid);max-width:46ch;margin:18px auto 0;line-height:1.7;}
.tkt .sent .recap{font-family:var(--fm);font-size:12px;color:var(--g);margin-top:20px;}
.tkt .cal-wrap{position:relative;}
.tkt .cal-pop{position:absolute;z-index:60;top:calc(100% + 8px);left:0;width:290px;max-width:92vw;background:#15110b;border:1px solid var(--line);border-radius:14px;padding:14px;display:none;box-shadow:0 24px 60px rgba(0,0,0,.65);}
.tkt .cal-pop.open{display:block;}
.tkt .cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.tkt .cal-nav{background:transparent;border:1px solid var(--line-soft);color:var(--g);font-size:16px;line-height:1;cursor:pointer;width:30px;height:30px;border-radius:8px;}
.tkt .cal-nav:hover{border-color:var(--g);}
.tkt .cal-title{font-family:var(--fd);font-weight:300;color:var(--tx);font-size:16px;}
.tkt .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;}
.tkt .cal-dow{font-family:var(--fm);font-size:9px;color:var(--tx-dim);text-align:center;padding:4px 0;text-transform:uppercase;}
.tkt .cal-day{aspect-ratio:1;border:none;background:transparent;color:var(--tx);border-radius:9px;cursor:pointer;font-family:var(--fd);font-weight:300;font-size:14px;}
.tkt .cal-day:hover{background:rgba(216,190,147,.14);}
.tkt .cal-day.sel{background:var(--g);color:#0b0a08;}
.tkt .cal-day.empty{visibility:hidden;cursor:default;}
`

const BODY = `
<section class="phero" style="padding-bottom:clamp(10px,2vh,20px)">
  <div class="r"><span class="eyebrow" style="justify-content:center">Responsável pela venda</span></div>
  <div class="respbox r" style="max-width:640px;margin:24px auto 0;text-align:left;">
    <div class="frow two">
      <div class="field"><label>Membro responsável</label>
        <select id="t-resp"><option value="">— Seleciona o fotógrafo —</option></select>
      </div>
      <div class="field"><label>Conta MB WAY</label>
        <select id="t-mbway">
          <option value="">— Seleciona a conta —</option>
          <option value="Liliana Gonçalves - 916 162 728">Liliana Gonçalves · 916 162 728</option>
          <option value="Alexandre Capão - 969 000 132">Alexandre Capão · 969 000 132</option>
          <option value="Patrício Ferreira - 964 211 778">Patrício Ferreira · 964 211 778</option>
        </select>
      </div>
    </div>
    <div class="field" style="margin-top:22px">
      <label>Envio automático de fotos <span class="opt">(só para digital)</span></label>
      <div class="seg" id="segAuto">
        <label class="on" data-val="nao"><span class="t">Não</span><span class="d">Envio manual</span></label>
        <label data-val="sim"><span class="t">Sim</span><span class="d">O sistema envia sozinho</span></label>
      </div>
    </div>
  </div>
  <p class="phero__sub r" id="gateHint" style="margin-top:20px">Seleciona o responsável e a conta MB WAY para continuar.</p>
</section>

<div id="formBody" style="display:none">
<section class="phero" style="padding-top:clamp(20px,4vh,40px)">
  <h1><em>Comprovativo</em></h1>
  <p class="phero__sub">Preenche os dados do cliente, as fotografias e o pagamento. Cada fotografia custa <strong>5&euro;</strong>.</p>
</section>

<div class="wrap">
  <div class="info">
    <div class="icard"><div class="ic">Preço</div><div class="iv">5&euro;</div><div class="id">Por cada fotografia, em digital ou papel.</div></div>
    <div class="icard"><div class="ic">Digital</div><div class="iv">15 dias</div><div class="id">Entrega por link de download, em alta resolução.</div></div>
    <div class="icard"><div class="ic">Papel</div><div class="iv">30 dias</div><div class="id">Impressão e envio para a vossa morada por carta registada.</div></div>
    <div class="icard"><div class="ic">Portes (papel)</div><div class="iv">+4&euro;</div><div class="id">Só abaixo de 5 fotografias. A partir de 5, portes grátis.</div></div>
  </div>
</div>

<section class="wrap">
  <div class="order" id="orderBlock">
    <form class="form" id="ticketForm" novalidate>

      <div class="frow two">
        <div class="field"><label>Nome do cliente</label><input type="text" id="t-nome" placeholder="Nome do cliente"></div>
        <div class="field"><label>Email</label><input type="email" id="t-email" placeholder="nome@email.pt"></div>
      </div>
      <div class="frow two">
        <div class="field"><label>Nome dos noivos</label><input type="text" id="t-noivos" placeholder="Ex.: Ana e André"></div>
        <div class="field"><label>Data do casamento</label><div class="cal-wrap"><input type="text" id="t-data" placeholder="DD / MM / AAAA" readonly autocomplete="off" style="cursor:pointer;"></div></div>
      </div>
      <div class="frow two">
        <div class="field"><label>Contacto telefónico</label><input type="tel" id="t-tel" placeholder="912 000 000"></div>
        <div class="field" id="fieldMorada" style="display:none"><label>Morada de envio <span class="opt">(para papel)</span></label><input type="text" id="t-morada" placeholder="Rua, nº, código postal"></div>
      </div>

      <div class="field">
        <label>Formato</label>
        <div class="seg" id="segFormato">
          <label class="on" data-val="digital"><span class="t">Digital</span><span class="d">Download · 15 dias</span></label>
          <label data-val="papel"><span class="t">Papel</span><span class="d">Carta registada · 30 dias</span></label>
        </div>
      </div>

      <div class="field">
        <label>Fotografias <span class="opt">(escrevam o número de cada uma)</span></label>
        <div class="fotolist" id="fotoList"></div>
        <button type="button" class="addfoto" id="addFoto">+ Adicionar fotografia</button>
        <div class="qty-hint" id="qtyHint"></div>
      </div>

      <div class="field">
        <label>Método de pagamento</label>
        <div class="seg three" id="segMetodo">
          <label class="on" data-val="Numerário"><span class="t">Numerário</span></label>
          <label data-val="MBWay"><span class="t">MB WAY</span></label>
          <label data-val="Multibanco"><span class="t">Multibanco</span></label>
        </div>
      </div>

      <div class="field"><label>Mensagem <span class="opt">(opcional)</span></label><textarea id="t-msg" placeholder="Notas do pedido…"></textarea></div>
    </form>

    <aside class="summary">
      <h3>Resumo do pedido</h3>
      <div class="sline"><div class="k">Fotografias <span id="recapFmt">Digital</span></div><div class="v"><span id="recapQtd">1</span> × 5&euro;</div></div>
      <div class="sline"><div class="k">Subtotal</div><div class="v" id="recapSub">5&euro;</div></div>
      <div class="sline" id="linePortes" style="display:none"><div class="k">Portes</div><div class="v" id="recapPortes">&mdash;</div></div>
      <div class="stotal"><div class="k">Total</div><div class="v" id="recapTotal">5&euro;</div></div>
      <button class="btn" type="submit" form="ticketForm" id="btnSubmit" disabled>Confirmar pedido</button>
      <p class="note" id="btnHint"></p>
      <p class="note">Envia ao cliente e ao responsável. Fica guardado em Pedidos de Fotos.</p>
      <p class="msg" id="formMsg"></p>
    </aside>
  </div>

  <div class="mbway" id="mbwayBox">
    <div class="mbway__h">Pagamento por MB WAY</div>
    <div class="mbway__num" id="mbwayNum">&mdash;</div>
    <div class="mbway__name" id="mbwayName"></div>
  </div>

  <div class="sent" id="sentBlock">
    <div class="mk">✓</div>
    <h2>Pedido <em>registado.</em></h2>
    <p>O pedido foi enviado ao cliente e ao responsável, e ficou guardado em Pedidos de Fotos.</p>
    <div class="recap" id="sentRecap"></div>
    <button type="button" class="btn" id="btnNovo" style="max-width:300px;margin:30px auto 0;">+ Novo pedido</button>
  </div>
</section>
</div>
`

export default function TicketForm() {
  const ran = useRef(false)
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { (e.target as HTMLElement).classList.add('in'); io.unobserve(e.target) } }) }, { threshold: .1 })
    document.querySelectorAll('.tkt .r').forEach(function (el) { reduce ? el.classList.add('in') : io.observe(el) })

    var PRICE = 5, PORTES = 4, FREE = 5
    var seg = document.getElementById('segFormato')!
    var segM = document.getElementById('segMetodo')!
    var segAuto = document.getElementById('segAuto')!
    function envioAuto() { return (segAuto.querySelector('label.on') as HTMLElement).dataset.val === 'sim' }
    var fotoList = document.getElementById('fotoList')!
    var addFoto = document.getElementById('addFoto')!
    var resp = document.getElementById('t-resp') as HTMLSelectElement
    var mbwaySel = document.getElementById('t-mbway') as HTMLSelectElement

    function fmt() { return (seg.querySelector('label.on') as HTMLElement).dataset.val! }
    function metodo() { return (segM.querySelector('label.on') as HTMLElement).dataset.val! }
    function rowCount() { return fotoList.querySelectorAll('.fotorow').length }
    function n() { return Math.max(1, rowCount()) }
    function fotosVal() { return Array.prototype.map.call(fotoList.querySelectorAll('.fotorow input'), function (i: any) { return i.value.trim() }).filter(Boolean).join('\n') }
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
      var sub = q * PRICE, portes = (f === 'papel' && q < FREE) ? PORTES : 0, total = sub + portes
      document.getElementById('recapQtd')!.textContent = String(q)
      document.getElementById('recapFmt')!.textContent = f === 'papel' ? 'Papel' : 'Digital'
      document.getElementById('recapSub')!.textContent = euro(sub)
      document.getElementById('recapTotal')!.textContent = euro(total)
      var lp = document.getElementById('linePortes')!, rp = document.getElementById('recapPortes')!
      if (f === 'papel') { lp.style.display = ''; if (portes === 0) { rp.innerHTML = 'Grátis'; rp.className = 'v free' } else { rp.textContent = euro(portes); rp.className = 'v' } } else { lp.style.display = 'none' }
      var hint = document.getElementById('qtyHint')!
      if (f === 'papel') { hint.style.display = ''; if (q < FREE) { var falta = FREE - q; hint.innerHTML = 'Faltam <b>' + falta + '</b> ' + (falta === 1 ? 'fotografia' : 'fotografias') + ' para portes grátis.' } else { hint.innerHTML = '<b>Portes grátis</b> — 5 ou mais fotografias.' } } else { hint.style.display = 'none' }
      var fm = document.getElementById('fieldMorada')!
      fm.style.display = f === 'papel' ? '' : 'none'
      syncBtn()
    }
    function gv(id: string) { return (document.getElementById(id) as HTMLInputElement).value.trim() }
    // Lista dos campos ainda por preencher — usada para ativar o botão e para
    // explicar ao utilizador o que falta (evita a sensação de "não deixa confirmar").
    function faltam() {
      var m: string[] = []
      if (!resp.value) m.push('responsável')
      if (!mbwaySel.value) m.push('conta MB WAY')
      if (!gv('t-nome')) m.push('nome do cliente')
      if (!gv('t-email')) m.push('email')
      if (!gv('t-tel')) m.push('contacto')
      if (!gv('t-noivos')) m.push('nome dos noivos')
      if (!gv('t-data')) m.push('data do casamento')
      if (fmt() === 'papel' && !gv('t-morada')) m.push('morada')
      var inputs = Array.prototype.slice.call(fotoList.querySelectorAll('.fotorow input')) as HTMLInputElement[]
      if (inputs.length === 0 || inputs.some(i => !i.value.trim())) m.push('nº das fotografias')
      if (!metodo()) m.push('método de pagamento')
      return m
    }
    function allFilled() { return faltam().length === 0 }
    function syncBtn() {
      var b = document.getElementById('btnSubmit') as HTMLButtonElement | null
      var m = faltam()
      if (b) b.disabled = m.length > 0
      var h = document.getElementById('btnHint')
      if (h) h.textContent = m.length ? ('Falta preencher: ' + m.join(', ') + '.') : ''
    }
    function updateMbway() {
      var v = mbwaySel.value
      var parts = v.split(' - ')
      var num = document.getElementById('mbwayNum')!, nm = document.getElementById('mbwayName')!
      num.textContent = v ? (parts[1] || v) : '—'
      nm.textContent = v ? (parts[0] || '') : ''
    }
    function segWire(box: HTMLElement) {
      box.querySelectorAll('label').forEach(function (lab) {
        lab.addEventListener('click', function () { box.querySelectorAll('label').forEach(l => l.classList.remove('on')); lab.classList.add('on'); update() })
      })
    }
    segWire(seg); segWire(segM); segWire(segAuto)
    addFoto.addEventListener('click', function () { addRow(); update() })
    addRow(); update()

    // O resto do formulário só fica disponível depois de escolher o
    // responsável + a conta MB WAY.
    var formBody = document.getElementById('formBody')!
    var gateHint = document.getElementById('gateHint')!
    function checkGate() {
      var ok = !!(resp.value && mbwaySel.value)
      formBody.style.display = ok ? '' : 'none'
      gateHint.style.display = ok ? 'none' : ''
      updateMbway(); syncBtn()
    }
    resp.addEventListener('change', checkGate)
    mbwaySel.addEventListener('change', checkGate)
    ;['t-nome', 't-email', 't-tel', 't-noivos', 't-data', 't-morada'].forEach(function (id) {
      document.getElementById(id)!.addEventListener('input', syncBtn)
    })
    checkGate()

    /* Calendário próprio em pt-PT (não abre se a data vier bloqueada do link) */
    function montarCalendario(inputId: string) {
      var inp = document.getElementById(inputId) as HTMLInputElement
      if (!inp || !inp.parentElement) return
      var MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
      var DOW = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
      var wrap = inp.parentElement
      var pop = document.createElement('div'); pop.className = 'cal-pop'; wrap.appendChild(pop)
      var hoje = new Date()
      var view = { y: hoje.getFullYear(), m: hoje.getMonth() }
      var sel: { y: number; m: number; d: number } | null = null
      function pad(n: number) { return (n < 10 ? '0' : '') + n }
      function foraListener(e: MouseEvent) { if (!wrap.contains(e.target as Node)) { fechar() } }
      function fechar() { pop.classList.remove('open'); document.removeEventListener('mousedown', foraListener) }
      function abrir() { if (inp.classList.contains('locked')) return; render(); pop.classList.add('open'); document.addEventListener('mousedown', foraListener) }
      function render() {
        var inicioDow = (new Date(view.y, view.m, 1).getDay() + 6) % 7
        var diasNoMes = new Date(view.y, view.m + 1, 0).getDate()
        var html = '<div class="cal-head"><button type="button" class="cal-nav" data-nav="-1">‹</button><span class="cal-title">' + MESES[view.m] + ' ' + view.y + '</span><button type="button" class="cal-nav" data-nav="1">›</button></div><div class="cal-grid">'
        for (var i = 0; i < 7; i++) html += '<div class="cal-dow">' + DOW[i] + '</div>'
        for (var e2 = 0; e2 < inicioDow; e2++) html += '<button type="button" class="cal-day empty"></button>'
        for (var d = 1; d <= diasNoMes; d++) {
          var isSel = !!(sel && sel.y === view.y && sel.m === view.m && sel.d === d)
          html += '<button type="button" class="cal-day' + (isSel ? ' sel' : '') + '" data-d="' + d + '">' + d + '</button>'
        }
        pop.innerHTML = html + '</div>'
        pop.querySelectorAll('.cal-nav').forEach(function (b) {
          b.addEventListener('click', function () { view.m += parseInt((b as HTMLElement).dataset.nav!, 10); if (view.m < 0) { view.m = 11; view.y-- } if (view.m > 11) { view.m = 0; view.y++ } render() })
        })
        pop.querySelectorAll('.cal-day[data-d]').forEach(function (b) {
          b.addEventListener('click', function () {
            var d = parseInt((b as HTMLElement).dataset.d!, 10)
            sel = { y: view.y, m: view.m, d: d }
            inp.value = pad(d) + ' / ' + pad(view.m + 1) + ' / ' + view.y
            fechar(); inp.dispatchEvent(new Event('input', { bubbles: true }))
          })
        })
      }
      inp.addEventListener('click', abrir)
      inp.addEventListener('focus', abrir)
    }
    montarCalendario('t-data')

    // Pré-preenchimento via URL (vindo do portal do membro): noivos + data do
    // casamento. Ficam bloqueados, pois o ticket pertence àquele casamento.
    try {
      var params = new URLSearchParams(window.location.search)
      var qNoivos = params.get('noivos')
      var qData = params.get('data')
      if (qNoivos) {
        var elN = document.getElementById('t-noivos') as HTMLInputElement
        elN.value = qNoivos; elN.readOnly = true; elN.classList.add('locked')
      }
      if (qData) {
        var elD = document.getElementById('t-data') as HTMLInputElement
        elD.value = qData; elD.readOnly = true; elD.classList.add('locked')
      }
      syncBtn()
    } catch {}

    fetch('/api/freelancers').then(r => r.json()).then(d => {
      var membros = (d?.freelancers ?? []).filter((f: any) => ['FOTOGRAFO', 'VIDEOGRAFO'].includes(String(f.status || '').toUpperCase()))
      if (membros.length === 0) membros = d?.freelancers ?? []
      var sel = document.getElementById('t-resp') as HTMLSelectElement
      membros.forEach((m: any) => { var o = document.createElement('option'); o.value = m.id; o.textContent = m.nome; o.dataset.email = m.email || ''; sel.appendChild(o) })
    }).catch(() => {})

    document.getElementById('ticketForm')!.addEventListener('submit', async function (e) {
      e.preventDefault()
      var g = (id: string) => (document.getElementById(id) as HTMLInputElement).value.trim()
      var respSel = document.getElementById('t-resp') as HTMLSelectElement
      var respOpt = respSel.selectedOptions[0]
      var responsavel = respOpt ? respOpt.textContent || '' : ''
      var responsavel_email = respOpt ? (respOpt.dataset.email || '') : ''
      var mbway = g('t-mbway')
      var f = fmt(), q = n(), met = metodo()
      var nome = g('t-nome'), email = g('t-email'), noivos = g('t-noivos'), data = g('t-data'), tel = g('t-tel'), morada = g('t-morada'), msg = g('t-msg')
      var setMsg = (t: string, ok = false) => { var el = document.getElementById('formMsg')!; el.textContent = t; el.className = 'msg ' + (ok ? 'ok' : 'err') }
      if (!respSel.value || !mbway) { setMsg('Seleciona o responsável e a conta MB WAY.'); return }
      if (!nome || !email || !tel || !noivos || !data) { setMsg('Preenche todos os campos do cliente.'); return }
      if (f === 'papel' && !morada) { setMsg('Indica a morada para entrega em papel.'); return }
      if (!met) { setMsg('Escolhe o método de pagamento.'); return }

      var sub = q * PRICE, portes = (f === 'papel' && q < FREE) ? PORTES : 0, total = sub + portes
      var btn = document.getElementById('btnSubmit') as HTMLButtonElement
      btn.disabled = true; btn.textContent = 'A registar…'
      var ctrl = new AbortController()
      var to = setTimeout(function () { ctrl.abort() }, 25000)
      try {
        var res = await fetch('/api/ticket-fotos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responsavel, responsavel_id: respSel.value, responsavel_email, mbway_conta: mbway, metodo_pagamento: met, nome, email, telefone: tel, noivos, data_casamento: data, morada, formato: f, quantidade: q, subtotal: sub, portes, total, fotografias: fotosVal(), mensagem: msg, envio_auto: envioAuto() }),
          signal: ctrl.signal,
        })
        clearTimeout(to)
        var dd = await res.json().catch(() => ({}))
        if (res.ok && dd?.ok) {
          document.getElementById('orderBlock')!.style.display = 'none'
          var s = document.getElementById('sentBlock')!; s.classList.add('show')
          var recap = [dd.pedido]
          if (noivos) recap.push(noivos)
          if (data) recap.push(data)
          recap.push(q + ' fotografia' + (q > 1 ? 's' : ''))
          recap.push(f === 'papel' ? 'Papel' : 'Digital')
          recap.push(euro(total))
          recap.push(met)
          document.getElementById('sentRecap')!.innerHTML = recap.join(' · ')
          s.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else { setMsg(dd?.error || 'Não foi possível registar o ticket.'); btn.disabled = false; btn.textContent = 'Confirmar pedido' }
      } catch (err: any) {
        clearTimeout(to)
        if (err && err.name === 'AbortError') {
          setMsg('O pedido demorou a responder — pode já ter sido registado. Verifica em Pedidos de Fotos antes de repetir.')
        } else {
          setMsg('Erro de rede. Tenta novamente.')
        }
        btn.disabled = false; btn.textContent = 'Confirmar pedido'
      }
    })

    // Novo pedido — limpa os dados do cliente/pedido; mantém o responsável + conta
    // MB WAY. Noivos + data pertencem ao CASAMENTO e tratam-se conforme a origem:
    //   · Bloqueados (vieram do link do portal de um casamento específico, com a
    //     sua data): mantêm-se. Repreenchê-los seria impossível e deixaria o botão
    //     preso — e como trazem a data exata, não há ambiguidade.
    //   · Escritos à mão: limpam-se, para obrigar a indicar explicitamente o
    //     casamento de cada pedido. Assim nunca se misturam dois casamentos com o
    //     mesmo nome (ex.: "Ana e Rui") mas datas/eventos diferentes.
    document.getElementById('btnNovo')!.addEventListener('click', function () {
      ;['t-nome', 't-email', 't-tel', 't-morada', 't-msg'].forEach(function (id) { var el = document.getElementById(id) as HTMLInputElement | null; if (el) el.value = '' })
      ;['t-noivos', 't-data'].forEach(function (id) { var el = document.getElementById(id) as HTMLInputElement | null; if (el && !el.classList.contains('locked')) el.value = '' })
      seg.querySelectorAll('label').forEach(l => l.classList.remove('on')); (seg.querySelector('label[data-val="digital"]') as HTMLElement).classList.add('on')
      segM.querySelectorAll('label').forEach(l => l.classList.remove('on')); (segM.querySelector('label[data-val="Numerário"]') as HTMLElement).classList.add('on')
      fotoList.innerHTML = ''; addRow()
      var b = document.getElementById('btnSubmit') as HTMLButtonElement; b.textContent = 'Confirmar pedido'
      document.getElementById('formMsg')!.textContent = ''
      update()
      document.getElementById('sentBlock')!.classList.remove('show')
      document.getElementById('orderBlock')!.style.display = ''
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="tkt" dangerouslySetInnerHTML={{ __html: BODY }} />
    </>
  )
}
