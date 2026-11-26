/* ═════════════ VER O ÁLBUM (folhear) ═════════════
   Mostra o álbum como um livro: capa, as folhas montadas e a contracapa, com as
   páginas a virar em 3D. Cada "folha" física tem frente e verso:
     folha 0: capa | página esquerda da folha dupla 1
     folha k: página direita da folha dupla k | página esquerda da folha dupla k+1
     última:  página direita da última folha dupla | contracapa
   Usa as globais: st, livro, folhaHTML, $. */

let rvVirada = 0          // quantas folhas físicas já foram viradas
let rvTotal = 0           // número de folhas físicas
let rvTimers = []

function rvMeia(p, lado) {
  // metade de uma folha dupla: desenha a folha inteira com o dobro da largura e corta
  return `<div class="rv-meia"><div class="rv-spread ${lado}">${folhaHTML(p, true)}</div><span class="rv-sombra ${lado}"></span></div>`
}
const rvCapa = (verso) => `<div class="rv-capa${verso ? ' verso' : ''}">${verso ? livroContracapa() : livro('mini')}</div>`
function livroContracapa() {
  // contracapa: o mesmo linho e a fita, sem design
  const cor = achar(REVESTIMENTOS, st.rev)?.[2]
  return `<div class="livro ${cor ? 'cheio' : 'vazio'}" style="${cor ? fundoLinho(st.rev, cor) : ''}"><div class="lomb"></div></div>`
}

function rvFaces() {
  const folhas = st.paginas.filter(p => p.modelo)
  const faces = [rvCapa(false)]
  folhas.forEach(p => { faces.push(rvMeia(p, 'esq'), rvMeia(p, 'dir')) })
  faces.push(rvCapa(true))
  return { faces, n: folhas.length }
}

function rvLegenda() {
  const nFolhas = rvTotal - 1
  if (rvVirada === 0) return 'Capa'
  if (rvVirada === rvTotal) return 'Contracapa'
  return `Páginas ${rvVirada * 2 - 1}–${rvVirada * 2} <small>· folha ${rvVirada} de ${nFolhas}</small>`
}

function rvZ(i) { return i < rvVirada ? i + 1 : rvTotal - i }

function abrirRevista() {
  if ($('#revista')) return          // já está aberto
  const { faces, n } = rvFaces()
  if (!n) return toast('Ainda não há folhas montadas para ver')
  rvTotal = n + 1; rvVirada = 0
  const folhasFisicas = []
  for (let k = 0; k < rvTotal; k++) folhasFisicas.push(`
    <div class="rv-folha" data-k="${k}" style="z-index:${rvTotal - k}">
      <div class="rv-face frente">${faces[2 * k]}</div>
      <div class="rv-face verso">${faces[2 * k + 1]}</div>
    </div>`)
  const el = document.createElement('div')
  el.className = 'rv'
  el.id = 'revista'
  el.innerHTML = `
    <div class="rv-topo"><span class="rv-titulo">O vosso álbum</span><span class="rv-sub">${n} ${n === 1 ? 'folha' : 'folhas'} · ${n * 2} páginas</span>
      <button class="rv-fechar" data-rv="fechar" title="Fechar (Esc)"><span class="ms">close</span></button></div>
    <div class="rv-palco"><div class="rv-livro fechado-frente" id="rvLivro">${folhasFisicas.join('')}</div></div>
    <div class="rv-base">
      <button class="rv-seta" data-rv="ant" title="Anterior (←)"><span class="ms">chevron_left</span></button>
      <span class="rv-leg" id="rvLeg">Capa</span>
      <button class="rv-seta" data-rv="seg" title="Seguinte (→)"><span class="ms">chevron_right</span></button>
    </div>
    <p class="rv-dica">Toquem na página da direita para avançar e na da esquerda para voltar.</p>`
  document.body.appendChild(el)
  document.body.style.overflow = 'hidden'
  rvTamanho(); rvAtualizar()
}

function rvTamanho() {
  const livro = $('#rvLivro'); if (!livro) return
  // folha aberta 60 × 25 → largura = 2,4 × altura
  const maxL = innerWidth * 0.92, maxA = innerHeight - 190
  const l = Math.min(maxL, maxA * 2.4)
  livro.style.width = l + 'px'; livro.style.height = (l / 2.4) + 'px'
}

function rvAtualizar() {
  const livro = $('#rvLivro'); if (!livro) return
  livro.classList.toggle('fechado-frente', rvVirada === 0)
  livro.classList.toggle('fechado-tras', rvVirada === rvTotal)
  livro.querySelectorAll('.rv-folha').forEach(f => {
    const k = Number(f.dataset.k)
    f.classList.toggle('virada', k < rvVirada)
  })
  $('#rvLeg').innerHTML = rvLegenda()
  document.querySelector('[data-rv="ant"]').disabled = rvVirada === 0
  document.querySelector('[data-rv="seg"]').disabled = rvVirada === rvTotal
}

function rvVirar(d) {
  const novo = Math.max(0, Math.min(rvTotal, rvVirada + d))
  if (novo === rvVirada) return
  // a folha que está a virar fica por cima das outras durante a animação
  const k = d > 0 ? rvVirada : novo
  const f = document.querySelector(`.rv-folha[data-k="${k}"]`)
  rvVirada = novo
  f.style.zIndex = rvTotal + 10
  rvAtualizar()
  rvTimers.push(setTimeout(() => {
    document.querySelectorAll('.rv-folha').forEach(x => { x.style.zIndex = rvZ(Number(x.dataset.k)) })
  }, 900))
}

function fecharRevista() {
  rvTimers.forEach(clearTimeout); rvTimers = []
  $('#revista')?.remove()
  document.body.style.overflow = ''
}

document.addEventListener('click', e => {
  if (e.target.closest('[data-pgver]')) return abrirRevista()
  const rv = e.target.closest('#revista'); if (!rv) return
  const b = e.target.closest('[data-rv]')
  if (b) {
    if (b.dataset.rv === 'fechar') return fecharRevista()
    return rvVirar(b.dataset.rv === 'seg' ? 1 : -1)
  }
  // clique no livro: metade direita avança, metade esquerda volta
  const livro = e.target.closest('#rvLivro')
  if (livro) {
    const r = livro.getBoundingClientRect()
    rvVirar(e.clientX > r.left + r.width / 2 ? 1 : -1)
  }
})
document.addEventListener('keydown', e => {
  if (!$('#revista')) return
  if (e.key === 'Escape') fecharRevista()
  else if (e.key === 'ArrowRight') rvVirar(1)
  else if (e.key === 'ArrowLeft') rvVirar(-1)
})
addEventListener('resize', rvTamanho)
