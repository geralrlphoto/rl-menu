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
        </select>
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

<section class="wrap">
  <div class="order" id="orderBlock">
    <form class="form" id="ticketForm" novalidate>

      <div class="frow two">
        <div class="field"><label>Nome do cliente</label><input type="text" id="t-nome" placeholder="Nome do cliente"></div>
        <div class="field"><label>Email</label><input type="email" id="t-email" placeholder="nome@email.pt"></div>
      </div>
      <div class="frow two">
        <div class="field"><label>Nome dos noivos</label><input type="text" id="t-noivos" placeholder="Ana &amp; Edney"></div>
        <div class="field"><label>Data do casamento</label><input type="text" id="t-data" placeholder="DD / MM / AAAA"></div>
      </div>
      <div class="frow two">
        <div class="field"><label>Contacto telefónico</label><input type="tel" id="t-tel" placeholder="912 000 000"></div>
        <div class="field"><label>Morada de envio <span class="opt">(para papel)</span></label><input type="text" id="t-morada" placeholder="Rua, nº, código postal"></div>
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
      <h3>Resumo do ticket</h3>
      <div class="sline"><div class="k">Fotografias <span id="recapFmt">Digital</span></div><div class="v"><span id="recapQtd">1</span> × 5&euro;</div></div>
      <div class="sline"><div class="k">Subtotal</div><div class="v" id="recapSub">5&euro;</div></div>
      <div class="sline" id="linePortes" style="display:none"><div class="k">Portes</div><div class="v" id="recapPortes">&mdash;</div></div>
      <div class="stotal"><div class="k">Total</div><div class="v" id="recapTotal">5&euro;</div></div>
      <button class="btn" type="submit" form="ticketForm" id="btnSubmit">Confirmar ticket</button>
      <p class="note">Envia o registo ao responsável e ao admin. Fica guardado em Pedidos de Fotos.</p>
      <p class="msg" id="formMsg"></p>
    </aside>
  </div>

  <div class="sent" id="sentBlock">
    <div class="mk">✓</div>
    <h2>Ticket <em>registado.</em></h2>
    <p>O pedido foi enviado ao responsável e ao admin, e ficou guardado em Pedidos de Fotos.</p>
    <div class="recap" id="sentRecap"></div>
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
    var fotoList = document.getElementById('fotoList')!
    var addFoto = document.getElementById('addFoto')!

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
    }
    function segWire(box: HTMLElement) {
      box.querySelectorAll('label').forEach(function (lab) {
        lab.addEventListener('click', function () { box.querySelectorAll('label').forEach(l => l.classList.remove('on')); lab.classList.add('on'); update() })
      })
    }
    segWire(seg); segWire(segM)
    addFoto.addEventListener('click', function () { addRow(); update() })
    addRow(); update()

    // O resto do formulário só fica disponível depois de escolher o
    // responsável + a conta MB WAY.
    var resp = document.getElementById('t-resp') as HTMLSelectElement
    var mbwaySel = document.getElementById('t-mbway') as HTMLSelectElement
    var formBody = document.getElementById('formBody')!
    var gateHint = document.getElementById('gateHint')!
    function checkGate() {
      var ok = !!(resp.value && mbwaySel.value)
      formBody.style.display = ok ? '' : 'none'
      gateHint.style.display = ok ? 'none' : ''
    }
    resp.addEventListener('change', checkGate)
    mbwaySel.addEventListener('change', checkGate)
    checkGate()

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
      try {
        var res = await fetch('/api/ticket-fotos', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ responsavel, responsavel_email, mbway_conta: mbway, metodo_pagamento: met, nome, email, telefone: tel, noivos, data_casamento: data, morada, formato: f, quantidade: q, subtotal: sub, portes, total, fotografias: fotosVal(), mensagem: msg }),
        })
        var dd = await res.json().catch(() => ({}))
        if (res.ok && dd?.ok) {
          document.getElementById('orderBlock')!.style.display = 'none'
          var s = document.getElementById('sentBlock')!; s.classList.add('show')
          document.getElementById('sentRecap')!.innerHTML = dd.pedido + ' · ' + q + ' fotografia' + (q > 1 ? 's' : '') + ' · ' + (f === 'papel' ? 'Papel' : 'Digital') + ' · ' + euro(total) + ' · ' + met
          s.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else { setMsg(dd?.error || 'Não foi possível registar o ticket.'); btn.disabled = false; btn.textContent = 'Confirmar ticket' }
      } catch { setMsg('Erro de rede. Tenta novamente.'); btn.disabled = false; btn.textContent = 'Confirmar ticket' }
    })
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="tkt" dangerouslySetInnerHTML={{ __html: BODY }} />
    </>
  )
}
