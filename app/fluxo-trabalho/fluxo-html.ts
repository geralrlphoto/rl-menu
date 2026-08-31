// ─────────────────────────────────────────────────────────────────────────
//  FLUXO DE TRABALHO — Fotógrafos
//  Cópia LITERAL do design aprovado ("Fluxo Fotografo.html"): HTML, <style>
//  e <script> exatamente como no ficheiro original. Para editar conteúdo,
//  mexer apenas no array FASES dentro do <script>.
//  NÃO redesenhar, NÃO simplificar, NÃO trocar cores/fontes/espaçamentos.
// ─────────────────────────────────────────────────────────────────────────

export const FLUXO_TRABALHO_HTML = `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fluxo de Trabalho — RL Photo.Video</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=Jost:wght@200;300;400&family=Hanken+Grotesk:wght@300;400;500&family=Space+Mono:wght@400&display=swap" rel="stylesheet">
<style>
:root{
  --ink:#0b0a08; --ink-2:#100e0b; --ink-3:#16130f;
  --g:#d8be93; --g-deep:#c8a866;
  --tx:rgba(243,237,226,.92); --tx-mid:rgba(243,237,226,.6); --tx-dim:rgba(243,237,226,.4);
  --line:rgba(243,237,226,.14); --line-soft:rgba(243,237,226,.08);
  --fd:'Jost',sans-serif; --fb:'Hanken Grotesk',sans-serif; --fm:'Space Mono',monospace; --fs:'Cormorant Garamond',serif;
  --ease:cubic-bezier(.16,1,.3,1); --pad:clamp(20px,5vw,80px);
}
*{margin:0;padding:0;box-sizing:border-box;}
html{-webkit-font-smoothing:antialiased;}
body{background:var(--ink);color:var(--tx);font-family:var(--fb);line-height:1.5;min-height:100vh;overflow-x:hidden;}
a{color:inherit;text-decoration:none;}
::selection{background:var(--g);color:var(--ink);}

.fx-grain{position:fixed;inset:0;z-index:9000;pointer-events:none;opacity:.05;mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");background-size:130px;}
.fx-vig{position:fixed;inset:0;z-index:8990;pointer-events:none;box-shadow:inset 0 0 240px 40px rgba(0,0,0,.5);}

.wrap{width:100%;max-width:1400px;margin:0 auto;padding-inline:var(--pad);}
h1,h2,h3{font-family:var(--fd);font-weight:200;line-height:1.05;letter-spacing:-.02em;}
h1 em,h2 em{font-style:italic;color:var(--g);}
.eyebrow{font-family:var(--fm);font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:var(--g);display:inline-flex;gap:.85em;align-items:center;}
.eyebrow::before{content:"";width:40px;height:1px;background:var(--g);opacity:.7;}
.eyebrow.c{justify-content:center;}

.r{transition:opacity 1s var(--ease),transform 1s var(--ease);}
html.js .r{opacity:0;transform:translateY(26px);}
html.js .is-in .r{opacity:1;transform:none;}
@media(prefers-reduced-motion:reduce){html.js .r{opacity:1;transform:none;}}

/* ===== TOPO ===== */
.head{text-align:center;padding:clamp(80px,12vh,140px) var(--pad) clamp(26px,4vh,44px);}
.head__lock{display:flex;align-items:center;justify-content:center;gap:13px;margin-bottom:clamp(24px,4vh,38px);}
.head__lock svg{width:34px;height:auto;}
.head__lock svg ellipse{stroke:var(--g);}
.head__lock .wm{font-family:var(--fd);font-weight:300;letter-spacing:.14em;font-size:15px;text-align:left;}
.head__lock .wm span{display:block;font-family:var(--fm);font-size:8px;letter-spacing:.42em;color:var(--tx-dim);margin-top:4px;}
.head h1{font-size:clamp(34px,6.4vw,88px);max-width:20ch;margin:0 auto;}
.head__lede{max-width:50ch;margin:24px auto 0;color:var(--tx-mid);font-size:clamp(15px,1.15vw,18px);line-height:1.75;}

/* ===== TRACKER ===== */
.tracker{position:sticky;top:0;z-index:70;background:rgba(11,10,8,.86);backdrop-filter:blur(14px);
  border-block:1px solid var(--line-soft);padding:14px var(--pad);}
.tracker__in{max-width:1400px;margin:0 auto;display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:space-between;}
.tracker__lbl{font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-dim);}
.tracker__lbl b{color:var(--g);font-weight:400;}
.tracker__bar{flex:1;min-width:180px;height:4px;border-radius:4px;background:var(--ink-3);overflow:hidden;}
.tracker__bar i{display:block;height:100%;width:0;background:var(--g);border-radius:4px;transition:width .5s var(--ease);}
.tracker__reset{font-family:var(--fm);font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);
  background:none;border:1px solid var(--line-soft);border-radius:30px;padding:8px 16px;cursor:pointer;transition:.4s;}
.tracker__reset:hover{border-color:var(--g);color:var(--g);}

/* ===== CARDS ===== */
.grid{display:grid;grid-template-columns:1fr;gap:18px;padding-block:clamp(40px,6vh,72px);}
@media(min-width:680px){.grid{grid-template-columns:repeat(2,1fr);}}
@media(min-width:1080px){.grid{grid-template-columns:repeat(3,1fr);}}

.card{position:relative;overflow:hidden;isolation:isolate;cursor:pointer;text-align:left;
  border:1px solid var(--line-soft);border-radius:14px;background:var(--ink-2);
  padding:clamp(26px,2.6vw,34px);min-height:270px;display:flex;flex-direction:column;justify-content:space-between;gap:20px;
  font:inherit;color:inherit;transition:border-color .5s var(--ease),transform .5s var(--ease);}
.card::before{content:"";position:absolute;top:0;left:-70%;width:55%;height:100%;z-index:-1;
  background:linear-gradient(100deg,transparent,rgba(216,190,147,.07),transparent);transform:skewX(-18deg);animation:sheen 7s ease-in-out infinite;}
.card:nth-child(2)::before{animation-delay:1.1s}.card:nth-child(3)::before{animation-delay:2.2s}
.card:nth-child(4)::before{animation-delay:3.3s}.card:nth-child(5)::before{animation-delay:4.4s}.card:nth-child(6)::before{animation-delay:5.5s}
@keyframes sheen{0%{left:-70%}55%,100%{left:170%}}
.card:hover{border-color:var(--g);transform:translateY(-6px);}
.card__bg{position:absolute;right:6px;bottom:-26px;z-index:-1;font-family:var(--fs);font-weight:300;font-style:italic;
  font-size:clamp(120px,13vw,180px);line-height:.7;color:rgba(243,237,226,.035);}
.card__top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;}
.card__n{font-family:var(--fm);font-size:11px;letter-spacing:.22em;color:var(--g);}
.card__ring{position:relative;width:42px;height:42px;flex:none;}
.card__ring svg{width:100%;height:100%;transform:rotate(-90deg);}
.card__ring circle{fill:none;stroke-width:2;}
.card__ring .bgc{stroke:var(--line-soft);}
.card__ring .fgc{stroke:var(--g);stroke-linecap:round;transition:stroke-dashoffset .6s var(--ease);}
.card__ring b{position:absolute;inset:0;display:grid;place-items:center;font-family:var(--fm);font-size:9px;color:var(--tx-mid);font-weight:400;}
.card__ring.full b{color:var(--g);}
.card__t{display:block;font-family:var(--fd);font-weight:200;font-size:clamp(23px,2.3vw,32px);line-height:1.08;transition:color .5s;}
.card:hover .card__t{color:var(--g);}
.card__d{display:block;color:var(--tx-mid);font-size:13.5px;line-height:1.65;margin-top:10px;}
.card__foot{display:flex;align-items:center;justify-content:space-between;gap:14px;
  font-family:var(--fm);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--tx-dim);}
.card__foot .go{color:var(--g);display:inline-flex;gap:.6em;align-items:center;}
.card__foot .go i{font-style:normal;transition:transform .4s var(--ease);}
.card:hover .card__foot .go i{transform:translateX(5px);}

/* ===== DRAWER ===== */
.dw{position:fixed;inset:0;z-index:9500;display:flex;justify-content:flex-end;pointer-events:none;}
.dw__scrim{position:absolute;inset:0;background:rgba(6,5,4,.7);backdrop-filter:blur(6px);opacity:0;transition:opacity .45s var(--ease);}
.dw__panel{position:relative;width:min(560px,100%);height:100%;background:var(--ink-2);border-left:1px solid var(--line-soft);
  transform:translateX(102%);transition:transform .55s var(--ease);display:flex;flex-direction:column;box-shadow:-30px 0 80px rgba(0,0,0,.55);}
.dw.open{pointer-events:auto;}
.dw.open .dw__scrim{opacity:1;}
.dw.open .dw__panel{transform:none;}
@media(max-width:620px){.dw__panel{width:100%;border-left:none;}}

.dw__head{padding:26px clamp(22px,4vw,36px) 20px;border-bottom:1px solid var(--line-soft);flex:none;}
.dw__row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;}
.dw__n{font-family:var(--fm);font-size:11px;letter-spacing:.22em;color:var(--g);}
.dw__x{font-family:var(--fm);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--tx-mid);
  background:none;border:1px solid var(--line-soft);border-radius:30px;padding:9px 16px;cursor:pointer;transition:.4s;flex:none;}
.dw__x:hover{border-color:var(--g);color:var(--g);}
.dw__t{font-family:var(--fd);font-weight:200;font-size:clamp(26px,4vw,38px);line-height:1.05;margin-top:12px;}
.dw__when{font-family:var(--fm);font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--tx-dim);margin-top:10px;}
.dw__body{padding:24px clamp(22px,4vw,36px) 40px;overflow-y:auto;flex:1;}
.dw__intro{color:var(--tx-mid);line-height:1.8;font-size:15px;margin-bottom:22px;}
.dw__intro strong{color:var(--tx);font-weight:500;}

.check{display:grid;gap:2px;}
.check__i{display:flex;gap:14px;align-items:flex-start;padding:13px 0;border-bottom:1px solid var(--line-soft);cursor:pointer;}
.check__i:last-child{border-bottom:none;}
.check__i input{position:absolute;opacity:0;pointer-events:none;}
.check__box{flex:none;width:20px;height:20px;border:1px solid var(--line);border-radius:4px;display:grid;place-items:center;
  transition:background .35s var(--ease),border-color .35s var(--ease);margin-top:2px;}
.check__box::after{content:"";width:10px;height:6px;border-left:1.5px solid var(--ink);border-bottom:1.5px solid var(--ink);
  transform:rotate(-45deg) scale(0);transition:transform .3s var(--ease);margin-top:-2px;}
.check__i.on .check__box{background:var(--g);border-color:var(--g);}
.check__i.on .check__box::after{transform:rotate(-45deg) scale(1);}
.check__t{color:var(--tx);font-size:15px;line-height:1.6;transition:color .35s;}
.check__i.on .check__t{color:var(--tx-dim);text-decoration:line-through;text-decoration-color:var(--g-deep);}
.check__t small{display:block;color:var(--tx-dim);font-size:12.5px;margin-top:4px;text-decoration:none;line-height:1.55;}

.abox{border:1px solid var(--line-soft);border-radius:10px;padding:20px 18px;background:var(--ink-3);margin-top:24px;}
.abox h4{font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--g);font-weight:400;margin-bottom:11px;}
.abox p{color:var(--tx-mid);font-size:13.5px;line-height:1.7;}
.abox ul{list-style:none;display:grid;gap:9px;}
.abox li{display:flex;gap:10px;align-items:baseline;color:var(--tx-mid);font-size:13.5px;line-height:1.55;}
.abox li::before{content:"";width:12px;height:1px;background:var(--g);flex:none;transform:translateY(7px);}
.abox--warn{border-color:var(--g);background:rgba(216,190,147,.06);}
.abox--warn p{color:var(--tx);}

/* footer */
.foot{border-top:1px solid var(--line-soft);padding:clamp(34px,5vh,60px) 0;text-align:center;}
.foot .fm{font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-dim);line-height:2;}
.foot a{color:var(--g);}
</style>
</head>
<body>
<div class="fx-grain"></div>
<div class="fx-vig"></div>

<!-- TOPO -->
<header class="head" data-io>
  <div class="head__lock r">
    <svg viewBox="0 0 60 76" fill="none" aria-hidden="true"><ellipse cx="30" cy="28" rx="25" ry="27" stroke-width="1.2"/><text x="13" y="37" font-family="Jost" font-weight="300" font-size="26" fill="#f3ede2">R</text><text x="28" y="42" font-family="Jost" font-weight="300" font-size="26" fill="#f3ede2">L</text></svg>
    <span class="wm">RL Photo.Video<span>Wedding Moments</span></span>
  </div>
  <h1 class="r">Fluxo de <em>trabalho.</em></h1>
  <p class="head__lede r">Seis etapas, do primeiro contacto à entrega. Abre cada cartão e vai marcando o que está feito: o progresso fica guardado.</p>
</header>

<!-- TRACKER -->
<div class="tracker">
  <div class="tracker__in">
    <div class="tracker__lbl"><b id="tDone">0</b> de <span id="tTotal">0</span> tarefas concluídas</div>
    <div class="tracker__bar"><i id="tBar"></i></div>
    <button class="tracker__reset" id="tReset">Limpar</button>
  </div>
</div>

<!-- CARDS -->
<main class="wrap" data-io>
  <div class="grid" id="grid"></div>
</main>

<footer class="foot">
  <div class="fm">RL Photo.Video · Wedding Moments<br><a href="mailto:geral.rlphoto@gmail.com">geral.rlphoto@gmail.com</a> · 912 832 788</div>
</footer>

<!-- DRAWER -->
<div class="dw" id="dw">
  <div class="dw__scrim" id="dwScrim"></div>
  <aside class="dw__panel" role="dialog" aria-modal="true" aria-labelledby="dwT">
    <div class="dw__head">
      <div class="dw__row">
        <div>
          <div class="dw__n" id="dwN">01</div>
          <div class="dw__t" id="dwT">—</div>
          <div class="dw__when" id="dwW">—</div>
        </div>
        <button class="dw__x" id="dwX">Fechar ✕</button>
      </div>
    </div>
    <div class="dw__body" id="dwBody"></div>
  </aside>
</div>

<script>
(function(){
  document.documentElement.classList.add('js');
  var KEY='rl_fluxo_fotografo_v1';

  var FASES=[
    {
      n:'01', t:'Novo casamento', when:'Notificação e confirmação · 48h', mark:'N',
      d:'Recebes o casamento no portal e por email. Confirma ou recusa a disponibilidade para a data.',
      intro:'Quando entra um novo casamento, ele aparece no <strong>teu portal</strong> e recebes também uma <strong>notificação por email</strong>. A partir daí, a primeira coisa a fazer é responder: <strong>confirmar ou recusar a disponibilidade</strong> para o dia do casamento. Enquanto não confirmares, a alocação fica pendente.',
      tools:['Portal do fotógrafo','Email com a notificação','Agenda pessoal atualizada'],
      warn:'Deixar a notificação sem resposta. Sem a tua confirmação, a produção não consegue fechar a equipa do dia e a data pode ser dada a outro fotógrafo.',
      tasks:[
        ['Abrir a notificação recebida por email','Chega também ao portal: confirma sempre nos dois'],
        ['Consultar o novo casamento no portal','Data, horário previsto, locais e função atribuída'],
        ['Verificar a data na tua agenda pessoal','Inclui deslocação e margem antes e depois'],
        ['Confirmar ou recusar a disponibilidade no portal','Responde em 48h, mesmo que seja para recusar'],
        ['Após confirmar, bloquear a data na agenda pessoal'],
        ['Ler as notas da produção sobre o casal e o dia'],
        ['Confirmar a função no evento','Primeiro fotógrafo, segundo, vídeo ou apoio']
      ]
    },
    {
      n:'02', t:'Briefing', when:'Notificação por email · antes do dia', mark:'B',
      d:'Recebes notificação por email quando o briefing fica disponível. Está dentro da pasta do casamento.',
      intro:'Toda a informação do casamento chega-te no <strong>briefing do respetivo casamento</strong>. Quando ficar pronto, recebes uma <strong>notificação por email</strong> a avisar que já está disponível — e encontras o briefing <strong>dentro da pasta do casamento</strong>, no portal. Lê-o por inteiro antes do dia: é a tua única fonte de verdade.',
      tools:['Notificação por email','Pasta do casamento no portal','Agenda e mapas para a deslocação'],
      warn:'Chegar ao dia do casamento sem ter lido o briefing. Tudo o que precisas já lá está: horários, locais, contactos e pedidos especiais.',
      tasks:[
        ['Abrir a notificação de briefing disponível','Chega por email quando a produção o publica'],
        ['Entrar na pasta do casamento e abrir o briefing'],
        ['Ler o cronograma completo do dia','Horas reais de cada momento e onde tens de estar'],
        ['Confirmar locais e tempos de deslocação'],
        ['Rever a lista de fotografias obrigatórias de família'],
        ['Anotar pedidos especiais e momentos-chave do casal'],
        ['Verificar contactos da equipa e dos fornecedores'],
        ['Confirmar a tua função e o que se espera de ti'],
        ['Esclarecer dúvidas com a produção antes do dia','Melhor perguntar agora do que improvisar no próprio dia'],
        ['Guardar o briefing acessível offline no telefone']
      ]
    },
    {
      n:'03', t:'Dia do casamento', when:'Preparativos ao último brinde · 12 a 14h', mark:'D',
      d:'Chegar com tempo, não sair de casa sem as fotos de família e enviar as provas do dia.',
      intro:'Chega <strong>com tempo</strong> a cada local. Antes de sair da casa dos noivos, confirma que já tens as <strong>fotos com pais, avós e padrinhos</strong> (se estiverem presentes). Se houver provas no dia, envia-as dos tablets a <strong>75% de qualidade</strong> para <strong>fotos.rlphoto@gmail.com</strong> e coloca o link da transferência na ficha do casamento, no campo <strong>Fotos prova</strong>.',
      tools:['Cronograma do briefing no telefone','Tablets para as provas','Ficha do casamento no portal'],
      dress:{
        t:'Apresentação e roupa',
        p:'Roupa adequada ao momento: <strong>cores lisas</strong>, sem desenhos nem letras estampadas. Calça lisa — <strong>ganga é proibida</strong>. Ténis confortáveis e discretos. Cores permitidas: cinzento, branco, preto, creme/castanho e azul-escuro.'
      },
      warn:'Sair da casa dos noivos sem as fotografias de família. Depois já estão todos dispersos e essas fotos não se repetem.',
      tasks:[
        ['Vestir roupa adequada ao momento','Cores lisas, sem estampados nem letras. Ganga proibida'],
        ['Ténis confortáveis e discretos'],
        ['Equipamento revisto, baterias carregadas, cartões formatados','Na noite anterior, nunca na manhã do dia'],
        ['Chegar com tempo a cada local','Conta com trânsito, estacionamento e reconhecimento do espaço'],
        ['Apresentar-se aos noivos e à família próxima','Deixas de ser um estranho e começam a ignorar a câmara'],
        ['Fotografar os detalhes antes de tudo começar'],
        ['Antes de sair de casa: confirmar fotos com pais, avós e padrinhos','Só se estiverem presentes. Verifica antes de arrancar para a cerimónia'],
        ['Confirmar posições na cerimónia com o celebrante'],
        ['Gravação de som redundante nos votos','Dois gravadores: os votos não se repetem'],
        ['Reservar 20 minutos na hora dourada'],
        ['Trocar de cartão antes de encher, nunca no limite'],
        ['Provas do dia: enviar dos tablets a 75% de qualidade','Para fotos.rlphoto@gmail.com'],
        ['Incluir também fotos da sessão de noivos, se possível'],
        ['Colar o link da transferência na ficha do casamento','No campo Fotos prova'],
        ['Se não houver provas no dia: seleção enviada em 7 dias','Prazo máximo de 7 dias após o evento'],
        ['Guardar cartões usados em local separado do equipamento']
      ]
    },
    {
      n:'04', t:'Pós-casamento', when:'Primeiras 72 horas · provas até 7 dias', mark:'P',
      d:'Segurança dos ficheiros: backup de todos os cartões e provas em falta enviadas até 7 dias.',
      intro:'Esta etapa é sobre <strong>não perder nada</strong>. Faz o <strong>backup de todos os cartões</strong> antes de fazer qualquer outra coisa. Se não conseguiste enviar as provas no próprio dia, é agora que as envias — com <strong>marca de água</strong>, dentro dos <strong>7 dias</strong> após o evento. A seleção completa é a etapa seguinte.',
      tools:['Dois discos externos','Marca de água aplicada em lote','Ficha do casamento no portal'],
      warn:'Formatar cartões antes de confirmar que os backups abrem mesmo. Sem backup verificado, um cartão corrompido é o casamento perdido.',
      tasks:[
        ['Descarregar e fazer backup de todos os cartões','Todos, sem exceção. Duas cópias em locais diferentes'],
        ['Abrir e verificar ficheiros de cada backup','Não confies no tamanho da pasta: abre imagens ao acaso'],
        ['Só depois formatar os cartões'],
        ['Organizar o material por momentos do dia','Facilita a seleção da etapa seguinte'],
        ['Provas em falta: enviar até 7 dias após o evento','Só se não foram enviadas no próprio dia'],
        ['Aplicar marca de água nas provas','Sem marca de água não seguem'],
        ['Enviar as provas para fotos.rlphoto@gmail.com','E colar o link no campo Fotos prova da ficha'],
        ['Registar no calendário o prazo dos 20 dias da seleção']
      ]
    },
    {
      n:'05', t:'Seleção de fotos', when:'Até 20 dias após o casamento', mark:'S',
      d:'Entre 1500 e 3000 fotos, organizadas por pastas, entregues até 20 dias após o casamento.',
      intro:'A seleção deve ter <strong>entre 1500 e 3000 fotografias</strong> — se forem mais, não há problema. Envia sempre <strong>organizada por pastas</strong>, como temos feito. Prazo: <strong>até 20 dias após o casamento</strong>. Depois envia para <strong>fotos.rlphoto@gmail.com</strong> e coloca o link da transferência na ficha do casamento, em <strong>Seleção de fotos</strong>.',
      tools:['Lightroom ou Photo Mechanic','Estrutura de pastas por momentos','Ficha do casamento no portal'],
      warn:'Passar dos 20 dias ou enviar tudo numa pasta única sem organização. Atrasa toda a produção a jusante.',
      tasks:[
        ['Importar e organizar por momentos do dia'],
        ['Primeira passagem: eliminar erros técnicos','Desfocadas, olhos fechados, exposições perdidas'],
        ['Segunda passagem: escolher a melhor de cada sequência'],
        ['Confirmar volume final entre 1500 e 3000 fotos','Mais do que 3000 não é problema; menos de 1500 é'],
        ['Garantir cobertura de todos os momentos do cronograma'],
        ['Confirmar fotos de família: pais, avós e padrinhos'],
        ['Organizar a seleção por pastas','Mesma estrutura que usamos sempre'],
        ['Cumprir o prazo de 20 dias após o casamento'],
        ['Enviar a seleção para fotos.rlphoto@gmail.com'],
        ['Colar o link da transferência na ficha do casamento','No campo Seleção de fotos']
      ]
    },
    {
      n:'06', t:'Edição de fotos', when:'Notificação de novo trabalho · 30 dias úteis', mark:'E',
      d:'Recebes notificação de nomeação para o trabalho. Edição em 30 dias úteis, entregue por pastas.',
      intro:'Recebes uma <strong>notificação de novo trabalho</strong> a informar que foste nomeado para a edição. A partir daí tens <strong>30 dias úteis</strong> para a concluir. Depois envia por email para <strong>fotos.rlphoto@gmail.com</strong>, com a edição <strong>dividida por pastas</strong>, e coloca o link na ficha do casamento, no campo <strong>Fotos editadas</strong>.',
      tools:['Notificação de nomeação','Presets ou perfis próprios','Ficha do casamento no portal'],
      dress:{
        t:'Preto e branco e edições ousadas',
        p:'Podes entregar fotografias a <strong>preto e branco</strong> — e edições mais ousadas, se a imagem pedir. Mas <strong>deixa sempre a versão a cores</strong> da mesma fotografia. O casal escolhe qual prefere; nunca lhes retires essa opção.'
      },
      warn:'Editar cada fotografia isoladamente. A galeria fica com saltos de cor e perde a leitura de um dia único.',
      tasks:[
        ['Abrir a notificação de nomeação para o trabalho'],
        ['Confirmar o prazo: 30 dias úteis a partir da nomeação'],
        ['Definir o tom base numa fotografia de referência'],
        ['Editar por blocos de luz e local','Não fotografia a fotografia: a coerência é o que se nota'],
        ['Uniformizar exposição e temperatura dentro de cada bloco'],
        ['Retoque de pele apenas onde é necessário','Discreto: a pessoa tem de continuar a ser ela'],
        ['Preto e branco: deixar sempre a versão a cores','O mesmo vale para edições mais ousadas'],
        ['Rever tudo a 100% em monitor calibrado'],
        ['Exportar e organizar a edição por pastas','Mesma estrutura de pastas da seleção'],
        ['Revisão final como se fosses o cliente','Vê do início ao fim, de uma vez, sem interrupções'],
        ['Enviar a edição por email para fotos.rlphoto@gmail.com','Dentro dos 30 dias úteis'],
        ['Colar o link na ficha do casamento','No campo Fotos editadas']
      ]
    }
  ];

  /* build cards */
  var grid=document.getElementById('grid');
  FASES.forEach(function(f,i){
    var b=document.createElement('button');
    b.className='card r'; b.type='button'; b.dataset.i=i;
    b.innerHTML=
      '<span class="card__bg">'+f.mark+'</span>'+
      '<span class="card__top"><span class="card__n">'+f.n+'</span>'+
      '<span class="card__ring" data-ring><svg viewBox="0 0 44 44"><circle class="bgc" cx="22" cy="22" r="19"/>'+
      '<circle class="fgc" cx="22" cy="22" r="19" stroke-dasharray="119.4" stroke-dashoffset="119.4"/></svg><b>0/'+f.tasks.length+'</b></span></span>'+
      '<span><span class="card__t">'+f.t+'</span><span class="card__d">'+f.d+'</span></span>'+
      '<span class="card__foot"><span>'+f.when+'</span><span class="go">Abrir <i>→</i></span></span>';
    grid.appendChild(b);
  });

  /* estado */
  var state={};
  try{ state=JSON.parse(localStorage.getItem(KEY)||'{}')||{}; }catch(e){ state={}; }
  function done(i){ return (state[i]||[]).length; }
  function total(){ return FASES.reduce(function(a,f){return a+f.tasks.length;},0); }
  function allDone(){ return FASES.reduce(function(a,f,i){return a+done(i);},0); }
  function save(){ try{ localStorage.setItem(KEY,JSON.stringify(state)); }catch(e){} }

  var C=2*Math.PI*19;
  function refresh(){
    var d=allDone(), t=total();
    document.getElementById('tDone').textContent=d;
    document.getElementById('tTotal').textContent=t;
    document.getElementById('tBar').style.width=(t?(d/t)*100:0)+'%';
    [].slice.call(grid.querySelectorAll('.card')).forEach(function(card,i){
      var f=FASES[i], dn=done(i);
      var ring=card.querySelector('[data-ring]');
      ring.querySelector('.fgc').setAttribute('stroke-dashoffset', String(C-(dn/f.tasks.length)*C));
      ring.querySelector('b').textContent=dn+'/'+f.tasks.length;
      ring.classList.toggle('full', dn===f.tasks.length);
    });
  }

  /* drawer */
  var dw=document.getElementById('dw'), dwBody=document.getElementById('dwBody');
  var cur=null;
  function open(i){
    cur=i; var f=FASES[i];
    document.getElementById('dwN').textContent=f.n;
    document.getElementById('dwT').textContent=f.t;
    document.getElementById('dwW').textContent=f.when;
    var on=state[i]||[];
    var html='<p class="dw__intro">'+f.intro+'</p><div class="check">';
    f.tasks.forEach(function(tk,k){
      html+='<label class="check__i'+(on.indexOf(k)>-1?' on':'')+'" data-k="'+k+'">'+
        '<input type="checkbox"'+(on.indexOf(k)>-1?' checked':'')+'><span class="check__box"></span>'+
        '<span class="check__t">'+tk[0]+(tk[1]?'<small>'+tk[1]+'</small>':'')+'</span></label>';
    });
    html+='</div>';
    html+='<div class="abox"><h4>Ferramentas</h4><ul>'+f.tools.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul></div>';
    if(f.dress){ html+='<div class="abox abox--warn"><h4>'+f.dress.t+'</h4><p>'+f.dress.p+'</p></div>'; }
    html+='<div class="abox abox--warn"><h4>Erro comum</h4><p>'+f.warn+'</p></div>';
    dwBody.innerHTML=html; dwBody.scrollTop=0;
    dw.classList.add('open'); document.body.style.overflow='hidden';
  }
  function close(){ dw.classList.remove('open'); document.body.style.overflow=''; cur=null; }

  grid.addEventListener('click',function(e){
    var card=e.target.closest('.card'); if(card) open(+card.dataset.i);
  });
  document.getElementById('dwX').addEventListener('click',close);
  document.getElementById('dwScrim').addEventListener('click',close);
  addEventListener('keydown',function(e){ if(e.key==='Escape'&&dw.classList.contains('open')) close(); });

  dwBody.addEventListener('click',function(e){
    var it=e.target.closest('.check__i'); if(!it||cur===null) return;
    if(e.target.tagName!=='INPUT') e.preventDefault();
    var inp=it.querySelector('input'), k=+it.dataset.k;
    var on=state[cur]||[]; var idx=on.indexOf(k);
    if(idx>-1){ on.splice(idx,1); it.classList.remove('on'); inp.checked=false; }
    else { on.push(k); it.classList.add('on'); inp.checked=true; }
    state[cur]=on; save(); refresh();
  });

  document.getElementById('tReset').addEventListener('click',function(){
    state={}; save(); refresh();
    if(cur!==null) open(cur);
  });

  refresh();

  /* reveals */
  var groups=[].slice.call(document.querySelectorAll('[data-io]'));
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-in');io.unobserve(e.target);}});},{threshold:.06});
    groups.forEach(function(g){io.observe(g);});
  } else { groups.forEach(function(g){g.classList.add('is-in');}); }
  setTimeout(function(){ groups.forEach(function(g){g.classList.add('is-in');}); },2400);
})();
</script>
</body>
</html>
`
