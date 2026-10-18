// Posições dos cards e ligações do mapa da jornada (função pura, sem DOM).
// Segue o protótipo aprovado: fase → passos em colunas → fase seguinte, tudo numa linha.
import type { Fase, Passo } from '@/lib/jornada'

export const PW = 210, PH = 60, KW = 200, KH = 46, GX = 80, GY = 14

export type No = {
  id: string            // "p<i>" para fases, id do passo para passos
  fase: number
  passo?: Passo
  x: number; y: number; w: number; h: number
  saida?: boolean
}
export type Ligacao = {
  a: No; b: No
  t: 'lead' | 'seq' | 'baixo' | 'out' | 'atalho'
  lb?: string
}
export type Mapa = { nos: No[]; lig: Ligacao[]; minY: number; maxY: number; maxX: number }

export function calcularMapa(fases: Fase[]): Mapa {
  const nos: No[] = [], lig: Ligacao[] = []
  const porFase: No[][] = [], nosFase: No[] = []
  let x = 0, prev: No[] = []

  fases.forEach((f, i) => {
    const ph: No = { id: 'p' + i, fase: i, x, y: -PH / 2, w: PW, h: PH }
    nos.push(ph); nosFase[i] = ph
    prev.forEach(k => lig.push({ a: k, b: ph, t: 'out' }))

    const F = f.fluxo, nk = f.passos.length, col = new Array(nk).fill(0)
    // coluna = caminho mais longo desde o início da fase
    if (F?.seq) {
      let mudou = true, g = 0
      while (mudou && g++ < 50) {
        mudou = false
        for (const a in F.seq) for (const b of F.seq[a]) if (col[b] < col[+a] + 1) { col[b] = col[+a] + 1; mudou = true }
      }
    }
    const pos = F?.pos ?? {}
    const fora = new Set<number>([...Object.values(F?.baixo ?? {}).flat(), ...Object.keys(pos).map(Number)])
    const cols = Math.max(0, ...col.filter((_, j) => !fora.has(j)), ...Object.values(pos).map(v => v[0])) + 1
    const nodes: No[] = []
    for (let c = 0; c < cols; c++) {
      const ids = [...Array(nk).keys()].filter(j => col[j] === c && !fora.has(j))
      const tot = ids.length * KH + (ids.length - 1) * GY, cx = x + PW + GX + c * (KW + GX)
      ids.forEach((j, r) => { nodes[j] = { id: f.passos[j].id, fase: i, passo: f.passos[j], x: cx, y: -tot / 2 + r * (KH + GY), w: KW, h: KH } })
    }
    for (const a in F?.baixo ?? {}) F!.baixo![+a].forEach((b, r) => {
      const pa = nodes[+a]
      nodes[b] = { id: f.passos[b].id, fase: i, passo: f.passos[b], x: pa.x, y: pa.y + (r + 1) * (KH + 44), w: KW, h: KH }
    })
    for (const j in pos) {
      const b = +j
      nodes[b] = { id: f.passos[b].id, fase: i, passo: f.passos[b], x: x + PW + GX + pos[b][0] * (KW + GX), y: (nodes[0]?.y ?? -KH / 2) + pos[b][1], w: KW, h: KH }
    }
    nodes.forEach(nd => nd && nos.push(nd))
    porFase[i] = nodes

    if (F) {
      nodes.forEach((nd, j) => { if (col[j] === 0 && !fora.has(j)) lig.push({ a: ph, b: nd, t: 'lead' }) })
      for (const a in F.seq ?? {}) F.seq![+a].forEach(b => lig.push({ a: nodes[+a], b: nodes[b], t: 'seq' }))
      for (const a in F.baixo ?? {}) F.baixo![+a].forEach(b => lig.push({ a: nodes[+a], b: nodes[b], t: 'baixo' }))
      prev = F.saida.map(j => nodes[j])
    } else {
      nodes.forEach(nd => lig.push({ a: ph, b: nd, t: 'lead' }))
      prev = nodes.slice()
    }
    prev.forEach(nd => { nd.saida = true })
    x = x + PW + GX + cols * (KW + GX)
  })

  fases.forEach((f, i) => {
    for (const j in f.fluxo?.atalho ?? {}) {
      const [alvo, lb] = f.fluxo!.atalho![+j]
      if (nosFase[alvo]) lig.push({ a: porFase[i][+j], b: nosFase[alvo], t: 'atalho', lb })
    }
  })

  let minY = 1e9, maxY = -1e9, maxX = 0
  for (const o of nos) { minY = Math.min(minY, o.y); maxY = Math.max(maxY, o.y + o.h); maxX = Math.max(maxX, o.x + o.w) }
  return { nos, lig, minY, maxY, maxX }
}

/** Caminho SVG de uma ligação (mesmas curvas do protótipo) */
export function caminho(e: Ligacao, mapa: Mapa): { d: string; dot?: [number, number]; lbl?: [number, number] } {
  const { a, b } = e
  if (e.t === 'baixo') {
    const cx = a.x + a.w / 2
    return { d: `M${cx},${a.y + a.h} L${cx},${b.y - 5}`, dot: [cx, a.y + a.h] }
  }
  if (e.t === 'atalho') {
    const ax = a.x + a.w, ay = a.y + a.h / 2, bx = b.x, by = b.y + b.h / 2
    const top = Math.min(...mapa.nos.filter(nd => nd.x > ax && nd.x + nd.w < bx).map(nd => nd.y), ay, by) - 46
    return {
      d: `M${ax},${ay} C${ax + 70},${ay} ${ax + 40},${top} ${ax + 120},${top} L${bx - 120},${top} C${bx - 40},${top} ${bx - 70},${by} ${bx - 5},${by}`,
      dot: [ax, ay], lbl: [(ax + bx) / 2, top - 8],
    }
  }
  if (Math.abs(a.x - b.x) < 2) {
    // mesma coluna: ligação vertical, para cima ou para baixo
    const cx = a.x + a.w / 2, up = b.y < a.y, y1 = up ? a.y : a.y + a.h, y2 = up ? b.y + b.h + 5 : b.y - 5
    return { d: `M${cx},${y1} L${cx},${y2}`, dot: [cx, y1] }
  }
  const ax = a.x + a.w, ay = a.y + a.h / 2, bx = b.x, by = b.y + b.h / 2, m = (bx - ax) / 2
  const seta = e.t === 'seq'
  return { d: `M${ax},${ay} C${ax + m},${ay} ${bx - m},${by} ${bx - (seta ? 5 : 0)},${by}`, dot: e.t !== 'out' ? [ax, ay] : undefined }
}
