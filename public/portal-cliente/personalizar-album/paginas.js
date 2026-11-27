/* ═════════════ PÁGINAS DO ÁLBUM ═════════════
   Os noivos montam até 12 folhas duplas (as duas páginas abertas) com as fotografias
   que escolheram para o álbum. Cada folha tem um modelo (disposição dos espaços, sem fotos); as fotos arrastam-se
   para os espaços (ou toca-se numa foto e depois num espaço). Dentro do espaço,
   arrastar acerta o enquadramento e o zoom aproxima.
   Usa as variáveis globais do script principal: st, guardar, toast, esc, $. */

// Protótipo: as fotos de exemplo. No portal serão as do separador Álbum (Wfolio).
// Fotografias que os noivos escolheram para o álbum (vêm do portal, galeria do Wfolio)
const FOTOS_ALBUM = (window.FOTOS_PORTAL || []).map(f => ({ id: f.id, src: f.src, t: f.t || f.src, w: f.w, h: f.h }))
// 12 folhas incluídas; a partir daí cada folha extra custa PRECO_EXTRA € (máximo do DreamBooks: 44)
const INCLUIDAS = 12, MAX_PAG = 44, PRECO_EXTRA = 15
const extras = () => Math.max(0, st.paginas.length - INCLUIDAS)

// Modelos de folha dupla (as duas páginas abertas, 60 × 25 cm, dobra ao meio).
// Tudo é calculado em centímetros para ficar exatamente simétrico: a mesma margem em
// todos os lados (MG), o mesmo espaço entre fotos (ES) e a dobra exatamente ao centro.
// No fim passa para % da folha (x, y, largura, altura).
const FL = 60, FA = 25, MEIO = FL / 2, MG = 1.2, ES = 0.4
// divide [ini, ini+tam] em partes com os pesos dados e ES entre elas
function partes(ini, tam, pesos) {
  const total = pesos.reduce((a, b) => a + b, 0), livre = tam - ES * (pesos.length - 1)
  let x = ini
  return pesos.map(p => { const t = livre * p / total, r = [x, t]; x += t + ES; return r })
}
// grelha: colunas com pesos, e em cada coluna linhas com pesos → espaços [x, y, l, a] em cm
function grelha(x, y, l, a, cols, linhas = cols.map(() => [1])) {
  return partes(x, l, cols).flatMap(([cx, cl], k) => partes(y, a, linhas[k]).map(([ly, la]) => [cx, ly, cl, la]))
}
// linhas de cima a baixo, cada uma com as suas colunas
function linhas(x, y, l, a, pesosL, colsPorLinha) {
  return partes(y, a, pesosL).flatMap(([ly, la], k) => partes(x, l, colsPorLinha[k]).map(([cx, cl]) => [cx, ly, cl, la]))
}
const pct = (r) => r.map(([x, y, l, a, o]) => { const v = [x / FL * 100, y / FA * 100, l / FL * 100, a / FA * 100]; return o ? [...v, o] : v })
// Foto que desvanece para o branco a ocupar a folha toda, com fotos por cima da parte branca.
// O 5.º elemento do espaço ({ fade: 'dir' | 'esq' }) diz para que lado vai o branco.
const ZONA_DIR = { x: MEIO + 3, y: 4, l: MEIO - 5.4, a: FA - 8 }
const ZONA_ESQ = { x: 2.4, y: 4, l: MEIO - 5.4, a: FA - 8 }
const fade = (lado, fotos) => [[0, 0, FL, FA, { fade: lado }], ...fotos]
const MARGEM_FADE = 1.05   // a foto de fundo ocupa a folha toda: menos margem = mais resolução
// áreas úteis: folha inteira, página esquerda e direita (com o espaço ES na dobra)
const AREA = { x: MG, y: MG, l: FL - 2 * MG, a: FA - 2 * MG }
const ESQ = { x: MG, y: MG, l: MEIO - ES / 2 - MG, a: FA - 2 * MG }
const DIR = { x: MEIO + ES / 2, y: MG, l: MEIO - ES / 2 - MG, a: FA - 2 * MG }
// página com margem igual em todos os lados da própria página (fotos que não tocam a dobra)
const PAG_E = { x: MG, y: MG, l: MEIO - 2 * MG, a: FA - 2 * MG }
const PAG_D = { x: MEIO + MG, y: MG, l: MEIO - 2 * MG, a: FA - 2 * MG }
const em = (z, f) => f(z.x, z.y, z.l, z.a)

// Desvanecimento: as fotos por cima da parte branca, por número e posição (página da direita;
// à esquerda é o espelho). k = '0' | '1-v' | '1-h' | '2-v' | '2-h' | '3-v' | '3-h'
const FADE_FOTOS = {
  '0': [],
  '1-v': [[MEIO + 7, 3.5, 16, FA - 7]],
  '1-h': [[MEIO + 4, 5.5, 22, 14]],
  '2-v': em(ZONA_DIR, (x, y, l, a) => grelha(x, y, l, a, [1, 1])),
  '2-h': grelha(MEIO + 5, 3.5, 20, FA - 7, [1], [[1, 1]]),
  '3-v': em(ZONA_DIR, (x, y, l, a) => grelha(x, y, l, a, [1, 1, 1])),
  // três horizontais do mesmo tamanho: duas em cima e uma em baixo, centrada
  '3-h': (() => { const z = ZONA_DIR, l = (z.l - ES) / 2, a = (z.a - ES) / 2
    return [[z.x, z.y, l, a], [z.x + l + ES, z.y, l, a], [z.x + (z.l - l) / 2, z.y + a + ES, l, a]] })(),
}
const FADE_KS = Object.keys(FADE_FOTOS)
const MODELOS_FADE = ['dir', 'esq'].flatMap(lado => FADE_KS.map(k => {
  const n = Number(k[0]), ladoN = lado === 'dir' ? 'direita' : 'esquerda'
  const fotos = lado === 'dir' ? FADE_FOTOS[k] : FADE_FOTOS[k].map(([x, y, l, a]) => [FL - x - l, y, l, a])
  return {
    id: `fade-${lado}-${k}`, semAuto: true, esconder: k !== '2-v', fade: { lado, k },
    n: k === '2-v' ? `Desvanecer à ${ladoN}` : `Desvanecer à ${ladoN}${n ? ` + ${n} ${n === 1 ? 'foto' : 'fotos'} (${k.endsWith('v') ? 'vertical' : 'horizontal'})` : ''}`,
    s: pct(fade(lado, fotos)),
  }
}))
const MODELOS_PAG = [
  // os três esquemas do Rui
  { id: 'esq-preparativos', n: 'Quatro + página inteira', s: pct([
    ...em(ESQ, (x, y, l, a) => grelha(x, y, l, a, [1, 2, 2], [[1, 1], [1], [1]])),
    [DIR.x, DIR.y, DIR.l, DIR.a]]) },
  { id: 'esq-cerimonia', n: 'Quatro + panorâmica', s: pct((() => {
    const [esq, dir] = partes(AREA.x, AREA.l, [2, 3])
    return [...linhas(esq[0], AREA.y, esq[1], AREA.a, [1, 1], [[1, 2], [1, 2]]), [dir[0], AREA.y, dir[1], AREA.a]]
  })()) },
  { id: 'esq-saida', n: 'Panorâmica + quatro', s: pct((() => {
    const [esq, dir] = partes(AREA.x, AREA.l, [3, 2])
    return [[esq[0], AREA.y, esq[1], AREA.a], ...linhas(dir[0], AREA.y, dir[1], AREA.a, [1, 1], [[1, 2], [2, 1]])]
  })()) },
  { id: 'esq-tres-dobra', n: 'Três com a do meio na dobra', s: pct(em(AREA, (x, y, l, a) => grelha(x, y, l, a, [3, 4, 3]))) },
  { id: 'esq-dois-tres', n: 'Duas em cima + três em baixo', s: pct(em(AREA, (x, y, l, a) => linhas(x, y, l, a, [3, 2], [[1, 1], [1, 1, 1]]))) },
  // foto a desvanecer para o branco (as variantes ficam escondidas; escolhem-se ao tocar na foto)
  ...MODELOS_FADE,
  // outros modelos
  // uma foto a ocupar a página inteira (até ao corte)
  { id: 'pag-inteira-esq', n: 'Página inteira à esquerda', s: pct([[0, 0, MEIO, FA]]) },
  { id: 'pag-inteira-dir', n: 'Página inteira à direita', s: pct([[MEIO, 0, MEIO, FA]]) },
  { id: 'pag-inteiras', n: 'Duas páginas inteiras', s: pct([[0, 0, MEIO, FA], [MEIO, 0, MEIO, FA]]) },
  // uma só foto a ocupar as duas páginas (passa por cima da dobra)
  { id: 'panoramica', n: 'Uma foto nas duas páginas', s: pct([[0, 0, FL, FA]]) },
  { id: 'pan-margem', n: 'Panorâmica com margem', s: pct([[AREA.x, AREA.y, AREA.l, AREA.a]]) },
  { id: 'uma-pagina', n: 'Uma por página', s: pct([[PAG_E.x, PAG_E.y, PAG_E.l, PAG_E.a], [PAG_D.x, PAG_D.y, PAG_D.l, PAG_D.a]]) },
  { id: 'inteira-margem', n: 'Página inteira + foto com margem', s: pct([[0, 0, MEIO, FA], [MEIO + 4, 4, MEIO - 8, FA - 8]]) },
  { id: 'centro', n: 'Pequena ao centro', s: pct([[(MEIO - 13) / 2, 4, 13, FA - 8], [MEIO + (MEIO - 13) / 2, 4, 13, FA - 8]]) },
  { id: 'grande-duas', n: 'Uma grande + duas', s: pct([[PAG_E.x, PAG_E.y, PAG_E.l, PAG_E.a], ...em(PAG_D, (x, y, l, a) => grelha(x, y, l, a, [1], [[1, 1]]))]) },
  { id: 'quatro-alto', n: 'Quatro ao alto', s: pct([...em(PAG_E, (x, y, l, a) => grelha(x, y, l, a, [1, 1])), ...em(PAG_D, (x, y, l, a) => grelha(x, y, l, a, [1, 1]))]) },
  { id: 'tres-grande', n: 'Três colunas + grande', s: pct([...em(PAG_E, (x, y, l, a) => grelha(x, y, l, a, [1, 1, 1])), [PAG_D.x, PAG_D.y, PAG_D.l, PAG_D.a]]) },
  { id: 'grelha-grande', n: 'Quatro em grelha + grande', s: pct([...em(PAG_E, (x, y, l, a) => grelha(x, y, l, a, [1, 1], [[1, 1], [1, 1]])), [PAG_D.x, PAG_D.y, PAG_D.l, PAG_D.a]]) },
  { id: 'seis', n: 'Seis em grelha', s: pct(em(AREA, (x, y, l, a) => grelha(x, y, l, a, [1, 1, 1], [[1, 1], [1, 1], [1, 1]]))) },
  { id: 'oito', n: 'Oito em grelha', s: pct([...em(PAG_E, (x, y, l, a) => grelha(x, y, l, a, [1, 1], [[1, 1], [1, 1]])), ...em(PAG_D, (x, y, l, a) => grelha(x, y, l, a, [1, 1], [[1, 1], [1, 1]]))]) },
]

if (!Array.isArray(st.paginas) || !st.paginas.length) st.paginas = [{ modelo: null, slots: [] }]
if (!(st.pagAtual >= 0 && st.pagAtual < st.paginas.length)) st.pagAtual = 0
let pgSel = null        // espaço selecionado na página atual
let pgEscolhida = null  // foto tocada, à espera de um espaço
let pgFiltro = 'todas'

const pgAtual = () => st.paginas[st.pagAtual]
const pgModelo = (p) => MODELOS_PAG.find(m => m.id === p.modelo)
const fotoDe = (id) => FOTOS_ALBUM.find(f => f.id === id)
// onde está cada foto: id → número da página
function usos() {
  const u = {}
  st.paginas.forEach((p, i) => p.slots.forEach(s => { if (s.foto) u[s.foto] = i + 1 }))
  return u
}
const oculto = (p, i) => (p.ocultos || []).includes(i)
const vazios = (p) => pgModelo(p) ? pgModelo(p).s.filter((_, i) => !oculto(p, i) && !p.slots[i]?.foto).length : 0

// Tamanho e posição da foto dentro do espaço, em % do espaço.
// A foto cobre o espaço e fica MARGEM maior, para poder andar para os lados e para cima/baixo.
// x e y vão de 0 a 100: 0 = foto encostada à esquerda/em cima do movimento, 50 = centrada.
const MARGEM = 1.12
function geo(f, sw, sh, s, margem = MARGEM) {
  const espaco = (sw * 60) / (sh * 25), foto = f.w / f.h
  let W = 100, H = 100
  if (foto > espaco) W = foto / espaco * 100; else H = espaco / foto * 100
  W *= margem; H *= margem
  const x = s.x ?? 50, y = s.y ?? 50
  // barra para a direita = foto anda para a direita
  return { W, H, left: -(W - 100) * (1 - x / 100), top: -(H - 100) * (1 - y / 100) }
}
const estiloImg = (g) => `width:${g.W}%;height:${g.H}%;left:${g.left}%;top:${g.top}%`
// desvanece para o branco: a foto vai ficando transparente sobre o papel branco
const mascara = (lado) => { const g = `linear-gradient(to ${lado === 'dir' ? 'right' : 'left'}, #000 32%, transparent 74%)`; return `-webkit-mask-image:${g};mask-image:${g}` }
function folhaHTML(p, mini) {
  const m = pgModelo(p)
  if (!m) return mini ? '<span class="pg-vazia">Sem modelo</span>' : `<div class="pg-sem"><span class="ms">dashboard_customize</span>Escolham um modelo de folha em baixo</div>`
  return m.s.map(([x, y, w, h, o], i) => {
    if (oculto(p, i)) return ''   // espaço eliminado pelos noivos
    const s = p.slots[i] || {}, f = s.foto && fotoDe(s.foto)
    const img = f ? `<img src="${f.src}" alt="" draggable="false" style="${estiloImg(geo(f, w, h, s, o?.fade ? MARGEM_FADE : MARGEM))}${o?.fade ? ';' + mascara(o.fade) : ''}">` : ''
    if (mini) return `<span class="pg-slot${f ? '' : ' livre'}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%">${img}</span>`
    return `<div class="pg-slot${f ? '' : ' livre'}${o?.fade ? ' fundo' : ''}${pgSel === i ? ' sel' : ''}" data-slot="${i}" ${f && pgSel !== i ? 'draggable="true"' : ''}
      style="left:${x}%;top:${y}%;width:${w}%;height:${h}%">${img || `<span class="pg-mais"><span class="ms">add_photo_alternate</span>Arraste uma foto</span><button class="pg-del" data-pgdel="${i}" title="Eliminar este espaço"><span class="ms">close</span></button>`}</div>`
  }).join('')
}

function renderPaginas() {
  const p = pgAtual(), m = pgModelo(p), u = usos()
  const total = st.paginas.length, n = st.pagAtual + 1
  const sl = pgSel !== null && p.slots[pgSel]?.foto ? p.slots[pgSel] : null
  const lista = FOTOS_ALBUM.filter(f => pgFiltro === 'todas' || !u[f.id])
  const vz = st.paginas.reduce((a, q) => a + vazios(q), 0)
  const semModelo = st.paginas.filter(q => !q.modelo).length

  $('#paginas').innerHTML = `
  <section class="sec pg">
    <div class="sec-h"><h3>Páginas do Álbum</h3><span class="tag">${INCLUIDAS} folhas duplas incluídas · 60 × 25 cm</span><span class="sp"></span><span class="tag">${total} ${total === 1 ? 'folha' : 'folhas'}${extras() ? ` · ${extras()} extra` : ''}</span></div>
    <div class="sec-b">
      <div class="pg-auto">
        <div><b>Montagem automática</b><span>Distribuímos as vossas ${FOTOS_ALBUM.length} fotografias pelas ${Math.min(INCLUIDAS, FOTOS_ALBUM.length)} folhas incluídas, com modelos escolhidos pelo número de fotos. Depois podem mudar tudo.</span></div>
        <button class="btn cheio" data-pgauto="1"><span class="ms" style="font-size:17px">auto_awesome</span>Montar automaticamente</button>
        <button class="btn" data-pgver="1"><span class="ms" style="font-size:17px">menu_book</span>Ver o álbum</button>
      </div>
      <div class="aviso"><span class="ms">info</span><span>Cada folha mostra as duas páginas abertas do álbum. Escolham um modelo para cada folha e arrastem as vossas fotografias para os espaços (ou toquem numa foto e depois num espaço). Para acertar o enquadramento, toquem na foto e usem as barras.</span></div>

      <div class="pg-grid">
        <aside class="pg-col">
          <div class="pg-col-t">As vossas fotografias <b>${FOTOS_ALBUM.length}</b></div>
          <div class="pg-filtro">
            <button class="${pgFiltro === 'todas' ? 'on' : ''}" data-pgfiltro="todas">Todas</button>
            <button class="${pgFiltro === 'livres' ? 'on' : ''}" data-pgfiltro="livres">Por usar · ${FOTOS_ALBUM.filter(f => !u[f.id]).length}</button>
          </div>
          <div class="pg-fotos">${lista.map(f => `
            <button class="pg-foto${pgEscolhida === f.id ? ' esc' : ''}${u[f.id] ? ' usada' : ''}" data-foto="${esc(f.id)}" draggable="true" title="${esc(f.id)}">
              <img src="${f.t}" alt="" draggable="false" loading="lazy">${u[f.id] ? `<span class="pg-uso">folha ${u[f.id]}</span>` : ''}</button>`).join('') || '<p class="pg-nada">Já usaram todas as fotografias.</p>'}</div>
        </aside>

        <div class="pg-centro">
          <div class="pg-topo">
            <b>Folha ${n}</b><span class="pg-modelo-n">páginas ${n * 2 - 1}–${n * 2}</span><span class="pg-modelo-n">${m ? m.n : 'sem modelo'}</span><span class="sp"></span>
            <button class="pg-ic" data-pgnav="-1" ${st.pagAtual === 0 ? 'disabled' : ''} title="Folha anterior"><span class="ms">chevron_left</span></button>
            <button class="pg-ic" data-pgnav="1" ${st.pagAtual === total - 1 ? 'disabled' : ''} title="Folha seguinte"><span class="ms">chevron_right</span></button>
            ${(p.ocultos || []).length ? `<button class="pg-repor" data-pgrepor="1" title="Voltar a pôr os espaços eliminados"><span class="ms">restart_alt</span>Repor espaços (${p.ocultos.length})</button>` : ''}
            <button class="pg-ic" data-pglimpar="1" ${m && p.slots.some(s => s.foto) ? '' : 'disabled'} title="Tirar as fotos desta folha"><span class="ms">layers_clear</span></button>
            <button class="pg-ic perigo" data-pgapagar="1" title="Apagar folha"><span class="ms">delete</span></button>
          </div>
          <div class="pg-folha" id="pgFolha">${folhaHTML(p)}<span class="pg-dobra"></span><span class="pg-num esq">${n * 2 - 1}</span><span class="pg-num">${n * 2}</span></div>
          ${m?.fade && pgSel === 0 ? `
          <div class="pg-fade">
            <span class="pg-fade-t"><span class="ms">gradient</span>Fotos na parte branca</span>
            <div class="pg-fade-g">${[0, 1, 2, 3].map(q => `<button class="pg-fade-b${Number(m.fade.k[0]) === q ? ' on' : ''}" data-faden="${q}">${q}</button>`).join('')}</div>
            <span class="pg-fade-t">Posição</span>
            <div class="pg-fade-g">${[['v', 'Vertical', 'crop_portrait'], ['h', 'Horizontal', 'crop_landscape']].map(([o, t, ic]) =>
              `<button class="pg-fade-b${m.fade.k.endsWith(o) ? ' on' : ''}" data-fadeo="${o}" ${m.fade.k === '0' ? 'disabled' : ''}><span class="ms">${ic}</span>${t}</button>`).join('')}</div>
          </div>` : ''}
          <div class="pg-ferr">${sl ? `
            <div class="pg-barras">
              <label><span>Esquerda / Direita</span><span class="ms">arrow_back</span><input type="range" min="0" max="100" step="0.5" value="${sl.x ?? 50}" data-eixo="x"><span class="ms">arrow_forward</span></label>
              <label><span>Cima / Baixo</span><span class="ms">arrow_upward</span><input type="range" min="0" max="100" step="0.5" value="${sl.y ?? 50}" data-eixo="y"><span class="ms">arrow_downward</span></label>
            </div>
            <button class="pg-centrar" data-pgcentrar="1" title="Centrar a foto"><span class="ms">center_focus_strong</span>Centrar</button>
            <button class="btn" data-pgtirar="1"><span class="ms" style="font-size:16px">hide_image</span>Tirar foto</button>
            <button class="btn perigo" data-pgdel="${pgSel}"><span class="ms" style="font-size:16px">delete</span>Eliminar espaço</button>
            <span class="pg-dica">Também podem arrastar a foto diretamente na folha.</span>`
            : `<span class="pg-dica">${pgEscolhida ? 'Toquem num espaço da folha para colocar a foto escolhida.' : m ? 'Toquem numa foto da folha para a ajustar, ou arrastem-na para outro espaço para trocar.' : 'Comecem por escolher um modelo de folha.'}</span>`}</div>
        </div>

        <aside class="pg-col">
          <div class="pg-col-t">Modelos de folha dupla <b>${MODELOS_PAG.filter(md => !md.esconder).length}</b></div>
          <div class="pg-modelos">${MODELOS_PAG.filter(md => !md.esconder).map(md => `
            <button class="pg-mod${p.modelo === md.id || (md.fade && m?.fade?.lado === md.fade.lado) ? ' on' : ''}" data-pgmodelo="${md.id}" title="${md.n}">
              <span class="pg-mod-f"><span class="pg-dobra"></span>${md.s.map(([x, y, w, h, o]) => `<i class="${o?.fade ? 'fade-' + o.fade : ''}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%"></i>`).join('')}</span>
              <span class="pg-mod-n">${md.n}</span><span class="pg-mod-c">${md.fade ? 'escolham 0 a 3 fotos' : `${md.s.length} ${md.s.length === 1 ? 'foto' : 'fotos'}`}</span></button>`).join('')}</div>
        </aside>
      </div>

      <div class="pg-barra">
        ${st.paginas.map((q, i) => `
          <button class="pg-thumb${i === st.pagAtual ? ' on' : ''}${!q.modelo || vazios(q) ? ' falta' : ''}" data-pgir="${i}">
            <span class="pg-thumb-f">${folhaHTML(q, true)}<span class="pg-dobra"></span></span><span class="pg-thumb-n">${i + 1}${i >= INCLUIDAS ? '<span class="pg-extra">extra</span>' : ''}</span></button>`).join('')}
        <button class="pg-add" data-pgadd="1" ${total >= MAX_PAG ? 'disabled' : ''}><span class="ms">add</span>${total >= MAX_PAG ? `Máximo de ${MAX_PAG}` : total >= INCLUIDAS ? `Folha extra<small>+${PRECO_EXTRA} €</small>` : 'Adicionar folha'}</button>
      </div>
      ${extras() ? `<div class="pg-extras"><span class="ms" style="font-size:17px">add_circle</span><span>${extras()} ${extras() === 1 ? 'folha extra' : 'folhas extra'} além das ${INCLUIDAS} incluídas · ${PRECO_EXTRA} € cada</span><span class="sp" style="flex:1"></span><b>+${extras() * PRECO_EXTRA} €</b></div>` : ''}
      <div class="pg-estado ${vz || semModelo ? '' : 'ok'}">
        <span class="ms">${vz || semModelo ? 'error' : 'check_circle'}</span>
        ${vz || semModelo
          ? [semModelo ? `${semModelo} ${semModelo === 1 ? 'folha sem modelo' : 'folhas sem modelo'}` : '', vz ? `${vz} ${vz === 1 ? 'espaço vazio' : 'espaços vazios'}` : ''].filter(Boolean).join(' · ')
          : `${total} ${total === 1 ? 'folha pronta' : 'folhas prontas'}`}
      </div>
    </div>
  </section>`
}

/* ── Montagem automática ──
   Distribui as fotografias, pela ordem em que estão, pelas folhas (até 12):
   1) quantas fotos em cada folha: abre e fecha com uma foto grande e, no meio,
      alterna folhas mais cheias e mais leves para dar ritmo;
   2) escolhe um modelo com esse número de espaços, variando entre os disponíveis;
   3) dentro de cada folha, as fotos ao alto vão para os espaços mais altos. */
function contagens(n) {
  const max = Math.max(...MODELOS_PAG.map(m => m.s.length))
  const folhas = Math.min(INCLUIDAS, n)   // a montagem automática usa só as incluídas
  if (folhas <= 2) return folhas === 1 ? [n] : [Math.ceil(n / 2), Math.floor(n / 2)]
  // abertura e fecho com uma foto quando há fotos que cheguem
  const pontas = n >= folhas * 2 ? [1, 1] : []
  const meio = folhas - pontas.length, resto = n - pontas.length
  const base = Math.floor(resto / meio), extra = resto % meio
  const c = Array.from({ length: meio }, (_, i) => base + (i < extra ? 1 : 0))
  // ritmo: em cada par de folhas iguais, uma fica com mais uma foto e a outra com menos uma
  for (let i = 0; i + 1 < c.length; i += 2) {
    if (c[i] === c[i + 1] && c[i] >= 3 && c[i] + 1 <= max) { c[i]++; c[i + 1]-- }
  }
  // espalha as folhas mais cheias para não ficarem todas seguidas
  c.sort((a, b) => b - a)
  const alternado = []
  while (c.length) { alternado.push(c.shift()); if (c.length) alternado.push(c.pop()) }
  const out = pontas.length ? [1, ...alternado, 1] : alternado
  // se algum número não tem modelo (ex.: 7), parte-o pela folha seguinte
  for (let i = 0; i < out.length; i++) {
    while (!MODELOS_PAG.some(m => m.s.length === out[i]) && out[i] > 1) { out[i]--; out[(i + 1) % out.length]++ }
  }
  return out
}
function montarAuto() {
  const fotos = FOTOS_ALBUM.slice(0, INCLUIDAS * Math.max(...MODELOS_PAG.map(m => m.s.length)))
  const cont = contagens(fotos.length)
  // abertura e fecho levam uma foto nas duas páginas: escolhe a mais deitada entre as
  // primeiras (e entre as últimas) e põe-na na ponta, sem baralhar o resto
  const deitada = (de, ate) => { let b = de; for (let i = de; i < ate; i++) if (fotos[i].w / fotos[i].h > fotos[b].w / fotos[b].h) b = i; return b }
  if (cont[0] === 1 && fotos.length > 6) fotos.unshift(...fotos.splice(deitada(0, 6), 1))
  if (cont[cont.length - 1] === 1 && fotos.length > 6) fotos.push(...fotos.splice(deitada(fotos.length - 6, fotos.length), 1))
  const usadosPorN = {}
  let k = 0
  st.paginas = cont.map((n, idx, todas) => {
    // modelos com n espaços; abertura e fecho preferem a foto nas duas páginas
    let opcoes = MODELOS_PAG.filter(m => m.s.length === n && !m.semAuto)
    if (n === 1 && (idx === 0 || idx === todas.length - 1)) opcoes = opcoes.filter(m => m.id === 'panoramica').concat(opcoes)
    const vez = usadosPorN[n] = (usadosPorN[n] ?? -1) + 1
    const modelo = n === 1 && (idx === 0 || idx === todas.length - 1) ? opcoes[0] : opcoes[vez % opcoes.length]
    const grupo = fotos.slice(k, k + n); k += n
    // fotos ao alto nos espaços mais altos (relação altura/largura em cm)
    const alturaRel = ([, , w, hh]) => (hh * 25) / (w * 60)
    const espacos = modelo.s.map((r, i) => ({ i, rel: alturaRel(r) })).sort((a, b) => b.rel - a.rel)
    const porForma = [...grupo].sort((a, b) => (b.h / b.w) - (a.h / a.w))
    const slots = modelo.s.map(() => ({ foto: null }))
    espacos.forEach((e, j) => { if (porForma[j]) slots[e.i] = { foto: porForma[j].id, x: 50, y: 50 } })
    return { modelo: modelo.id, slots, ocultos: [] }
  })
  st.pagAtual = 0; pgSel = null; pgEscolhida = null
  toast(`${fotos.length} fotografias distribuídas por ${st.paginas.length} folhas`)
  pgGuardar()
}

function pgGuardar() { guardar(true); renderPaginas() }

async function colocar(fotoId, i) {
  const p = pgAtual()
  // a mesma foto não deve repetir: se já está noutro espaço, avisa e só a repete se confirmarem
  const usada = st.paginas.some((q, qi) => q.slots.some((x, xi) => x.foto === fotoId && !(qi === st.pagAtual && xi === i)))
  if (usada && !(await perguntar({ titulo: 'Fotografia repetida', icone: 'photo_library',
    texto: `Não é possível repetir a mesma fotografia no álbum: esta já está na <b>folha ${usos()[fotoId]}</b>.\n\nTêm a certeza que a querem usar outra vez?`,
    sim: 'Sim, usar outra vez', nao: 'Cancelar' }))) {
    pgEscolhida = null; return renderPaginas()
  }
  p.slots[i] = { foto: fotoId, x: 50, y: 50, z: 1 }
  pgEscolhida = null; pgSel = i
  pgGuardar()
}
function trocar(a, b) {
  const p = pgAtual()
  const sa = p.slots[a] || { foto: null }, sb = p.slots[b] || { foto: null }
  p.slots[a] = sb; p.slots[b] = sa; pgSel = b
  pgGuardar()
}

const raiz = $('#paginas')
raiz.addEventListener('click', async e => {
  if (pgIgnorarClique) { pgIgnorarClique = false; return }  // fim de um arrasto de enquadramento
  // botões primeiro: as miniaturas das folhas também têm espaços (.pg-slot) lá dentro
  const b = e.target.closest('button') || e.target.closest('.pg-slot'); if (!b || b.disabled) return
  const d = b.dataset, p = pgAtual()
  if (d.pgauto) {
    const feito = st.paginas.some(q => q.slots.some(x => x.foto))
    if (feito && !(await perguntar({ titulo: 'Montar automaticamente?', icone: 'auto_awesome', texto: 'A montagem automática substitui as folhas que já fizeram.', sim: 'Montar', nao: 'Cancelar' }))) return
    return montarAuto()
  }
  if (d.pgfiltro) { pgFiltro = d.pgfiltro; return renderPaginas() }
  if (d.foto) {
    // com um espaço selecionado e vazio, a foto vai direta para lá
    if (pgSel !== null && pgModelo(p) && !p.slots[pgSel]?.foto) return colocar(d.foto, pgSel)
    pgEscolhida = pgEscolhida === d.foto ? null : d.foto; pgSel = null; return renderPaginas()
  }
  if (d.slot !== undefined) {
    const i = Number(d.slot)
    if (pgEscolhida) return colocar(pgEscolhida, i)
    pgSel = pgSel === i ? null : i; return renderPaginas()
  }
  if (d.faden !== undefined || d.fadeo) {
    const f = pgModelo(p)?.fade; if (!f) return
    const nAtual = Number(f.k[0]), oAtual = f.k.length > 1 ? f.k.slice(-1) : 'v'
    const nNovo = d.faden !== undefined ? Number(d.faden) : nAtual, oNovo = d.fadeo || oAtual
    const k = nNovo ? `${nNovo}-${oNovo}` : '0'
    const novo = MODELOS_PAG.find(x => x.id === `fade-${f.lado}-${k}`)
    const extras = p.slots.slice(1).filter(x => x.foto)
    p.modelo = novo.id; p.ocultos = []
    p.slots = novo.s.map((_, i) => i === 0 ? (p.slots[0] || { foto: null }) : (extras[i - 1] ? { ...extras[i - 1] } : { foto: null }))
    if (extras.length > nNovo) toast(`${extras.length - nNovo} ${extras.length - nNovo === 1 ? 'foto voltou' : 'fotos voltaram'} para a lista`)
    pgSel = 0; return pgGuardar()
  }
  if (d.pgmodelo) {
    const novo = MODELOS_PAG.find(m => m.id === d.pgmodelo)
    const fotos = p.slots.filter(s => s.foto)
    p.modelo = novo.id
    p.ocultos = []
    p.slots = novo.s.map((_, i) => fotos[i] ? { ...fotos[i] } : { foto: null })
    if (fotos.length > novo.s.length) toast(`${fotos.length - novo.s.length} ${fotos.length - novo.s.length === 1 ? 'foto voltou' : 'fotos voltaram'} para a lista`)
    pgSel = null; return pgGuardar()
  }
  if (d.pgir) { st.pagAtual = Number(d.pgir); pgSel = null; return pgGuardar() }
  if (d.pgadd) {
    if (st.paginas.length >= MAX_PAG) return toast(`O álbum tem no máximo ${MAX_PAG} folhas duplas`)
    if (st.paginas.length >= INCLUIDAS && !(await perguntar({ titulo: 'Folha extra', icone: 'add_circle', texto: `Já têm as <b>${INCLUIDAS} folhas incluídas</b>. Cada folha extra custa <b>${PRECO_EXTRA} €</b>.\n\nAcrescentar uma folha extra?`, sim: `Acrescentar · ${PRECO_EXTRA} €`, nao: 'Cancelar' }))) return
    st.paginas.push({ modelo: null, slots: [] }); st.pagAtual = st.paginas.length - 1; pgSel = null; return pgGuardar()
  }
  if (d.pgnav) { st.pagAtual = Math.max(0, Math.min(st.paginas.length - 1, st.pagAtual + Number(d.pgnav))); pgSel = null; return pgGuardar() }
  if (d.pgmove) {
    const j = st.pagAtual + Number(d.pgmove)
    ;[st.paginas[st.pagAtual], st.paginas[j]] = [st.paginas[j], st.paginas[st.pagAtual]]
    st.pagAtual = j; return pgGuardar()
  }
  if (d.pglimpar) { p.slots = p.slots.map(() => ({ foto: null })); pgSel = null; return pgGuardar() }
  if (d.pgapagar) {
    if (p.slots.some(s => s.foto) && !(await perguntar({ titulo: `Apagar a folha ${st.pagAtual + 1}?`, icone: 'delete', texto: 'As fotografias desta folha voltam para a lista.', sim: 'Apagar', nao: 'Cancelar' }))) return
    st.paginas.splice(st.pagAtual, 1)
    if (!st.paginas.length) st.paginas.push({ modelo: null, slots: [] })
    st.pagAtual = Math.min(st.pagAtual, st.paginas.length - 1); pgSel = null; return pgGuardar()
  }
  if (d.pgcentrar) { Object.assign(p.slots[pgSel], { x: 50, y: 50 }); return pgGuardar() }
  if (d.pgdel !== undefined) {
    // elimina o espaço da folha; se tinha foto, a foto volta para a lista
    const i = Number(d.pgdel)
    p.ocultos = [...new Set([...(p.ocultos || []), i])]
    p.slots[i] = { foto: null }
    pgSel = null; return pgGuardar()
  }
  if (d.pgrepor) { p.ocultos = []; return pgGuardar() }
  if (d.pgtirar) { p.slots[pgSel] = { foto: null }; return pgGuardar() }
})

// barras do espaço selecionado: esquerda/direita e cima/baixo (sem redesenhar tudo enquanto desliza)
function aplicarImg(s) {
  const img = raiz.querySelector(`.pg-slot[data-slot="${pgSel}"] img`); if (!img) return
  const [, , w, h, o] = pgModelo(pgAtual()).s[pgSel]
  img.style.cssText = estiloImg(geo(fotoDe(s.foto), w, h, s, o?.fade ? MARGEM_FADE : MARGEM)) + (o?.fade ? ';' + mascara(o.fade) : '')
}
raiz.addEventListener('input', e => {
  const eixo = e.target.dataset?.eixo; if (!eixo) return
  const s = pgAtual().slots[pgSel]; s[eixo] = Number(e.target.value)
  aplicarImg(s)
})
raiz.addEventListener('change', e => { if (e.target.dataset?.eixo) guardar(true) })

// arrastar fotos: da lista para um espaço, ou de um espaço para outro (troca)
raiz.addEventListener('dragstart', e => {
  const f = e.target.closest('[data-foto]'), s = e.target.closest('.pg-slot[draggable="true"]')
  if (f) e.dataTransfer.setData('text/plain', 'foto:' + f.dataset.foto)
  else if (s) e.dataTransfer.setData('text/plain', 'slot:' + s.dataset.slot)
  e.dataTransfer.effectAllowed = 'move'
})
raiz.addEventListener('dragover', e => {
  const s = e.target.closest('.pg-slot'); if (!s) return
  e.preventDefault(); raiz.querySelectorAll('.pg-slot.alvo').forEach(x => x !== s && x.classList.remove('alvo')); s.classList.add('alvo')
})
raiz.addEventListener('dragleave', e => { const s = e.target.closest('.pg-slot'); if (s && !s.contains(e.relatedTarget)) s.classList.remove('alvo') })
raiz.addEventListener('drop', e => {
  const s = e.target.closest('.pg-slot'); if (!s) return
  e.preventDefault()
  const [tipo, v] = (e.dataTransfer.getData('text/plain') || '').split(':')
  const i = Number(s.dataset.slot)
  if (tipo === 'foto') colocar(v, i)
  else if (tipo === 'slot' && Number(v) !== i) trocar(Number(v), i)
  else renderPaginas()
})

// enquadramento: arrastar a foto dentro do espaço selecionado
let pan = null, pgIgnorarClique = false
raiz.addEventListener('pointerdown', e => {
  const s = e.target.closest('.pg-slot.sel'); if (!s) return
  const slot = pgAtual().slots[pgSel]; if (!slot?.foto) return
  const [, , w, h, o] = pgModelo(pgAtual()).s[pgSel], g = geo(fotoDe(slot.foto), w, h, slot, o?.fade ? MARGEM_FADE : MARGEM)
  // quantos píxeis a foto pode andar em cada sentido
  pan = { x0: e.clientX, y0: e.clientY, px: slot.x ?? 50, py: slot.y ?? 50,
          ox: s.clientWidth * (g.W - 100) / 100, oy: s.clientHeight * (g.H - 100) / 100, mexeu: false }
  s.setPointerCapture(e.pointerId)
})
raiz.addEventListener('pointermove', e => {
  if (!pan) return
  const slot = pgAtual().slots[pgSel]
  const dx = e.clientX - pan.x0, dy = e.clientY - pan.y0
  if (Math.abs(dx) + Math.abs(dy) > 3) pan.mexeu = true
  slot.x = Math.max(0, Math.min(100, pan.px + dx / pan.ox * 100))
  slot.y = Math.max(0, Math.min(100, pan.py + dy / pan.oy * 100))
  aplicarImg(slot)
})
raiz.addEventListener('pointerup', () => {
  if (!pan) return
  const mexeu = pan.mexeu; pan = null
  if (mexeu) { pgIgnorarClique = true; setTimeout(() => { pgIgnorarClique = false }, 0); guardar(true); renderPaginas() }
})

renderPaginas()
