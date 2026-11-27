// Resumo legível do álbum que os noivos personalizaram no portal
// (/portal-cliente/personalizar-album, guardado em portais.settings.album_config).
// Usado na página de Álbuns do Departamento de Fotografia: é daqui que a RL pede ao
// Claude para fazer o álbum ("fazer álbum CAS_xxx"), sem nomear editor.
// Os nomes têm de acompanhar os da página (public/portal-cliente/personalizar-album).

const REVESTIMENTOS: Record<string, string> = {
  L01: 'L01 - Linen Aqua', L02: 'L02 - Linen Pétal', L03: 'L03 - Linen Sun (stock limitado)', L04: 'L04 - Linen Pumpkin',
  L05: 'L05 - Linen Apple', L06: 'L06 - Linen Zink', L07: 'L07 - Linen Bege', L08: 'L08 - Linen Branco',
  M2: 'M2 - Madeira Castanha', M9: 'M9 - Madeira Cinza Clara', M10: 'M10 - Madeira Cinza Escura',
}
const GAMAS: Record<string, string> = { aland: 'Luxe Linen (capa Åland)', rustic: 'Rustic' }
const MODELOS: Record<string, string> = {
  'esq-preparativos': 'Quatro + página inteira', 'esq-cerimonia': 'Quatro + panorâmica', 'esq-saida': 'Panorâmica + quatro',
  'esq-tres-dobra': 'Três com a do meio na dobra', 'esq-dois-tres': 'Duas em cima + três em baixo',
  'pag-inteira-esq': 'Página inteira à esquerda', 'pag-inteira-dir': 'Página inteira à direita', 'pag-inteiras': 'Duas páginas inteiras',
  panoramica: 'Uma foto nas duas páginas', 'pan-margem': 'Panorâmica com margem', 'uma-pagina': 'Uma por página',
  'inteira-margem': 'Página inteira + foto com margem', centro: 'Pequena ao centro', 'grande-duas': 'Uma grande + duas',
  'quatro-alto': 'Quatro ao alto', 'tres-grande': 'Três colunas + grande', 'grelha-grande': 'Quatro em grelha + grande',
  seis: 'Seis em grelha', oito: 'Oito em grelha',
  'fade-dir-1': 'Desvanecer à direita + 1 foto',
  'fade-dir-2': 'Desvanecer à direita + 2 fotos',
  'fade-dir-3': 'Desvanecer à direita + 3 fotos',
  'fade-esq-1': 'Desvanecer à esquerda + 1 foto',
  'fade-esq-2': 'Desvanecer à esquerda + 2 fotos',
  'fade-esq-3': 'Desvanecer à esquerda + 3 fotos',
}
const DESIGNS_UV: Record<string, string> = { ramo: 'Ramo', raminho: 'Raminho', monograma: 'Monograma', circulo: 'Círculo', coroa: 'Coroa', cruz: 'Cruz', arco: 'Arco' }
const LETRAS: Record<string, string> = { georgia: 'Georgia', optima: 'Optima', impact: 'Impact' }
const LOCAIS: Record<string, string> = {
  centro: 'Centro', 'centro-esq': 'Centro Esquerdo', 'centro-dir': 'Centro Direito', 'centro-inf': 'Centro Inferior', 'centro-sup': 'Centro Superior',
  'canto-inf-esq': 'Canto Inferior Esquerdo', 'canto-inf-dir': 'Canto Inferior Direito', 'canto-sup-esq': 'Canto Superior Esquerdo', 'canto-sup-dir': 'Canto Superior Direito',
}
const CORES: Record<string, string> = { prateado: 'Prateado', dourado: 'Dourado', 'rose-gold': 'Rose Gold', 'rose-metalic': 'Rose Metalic' }
export const FOLHAS_INCLUIDAS = 12
export const PRECO_FOLHA_EXTRA = 15

export type ResumoAlbum = {
  enviado: string | null
  pasta: string | null
  gama: string
  revestimento: string | null
  personalizacao: string
  folhas: { n: number; modelo: string; fotos: string[] }[]
  extras: number
}

const txt = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export function resumoAlbum(cfg: any): ResumoAlbum | null {
  if (!cfg || typeof cfg !== 'object') return null
  const st = cfg.estado && typeof cfg.estado === 'object' ? cfg.estado : {}
  const pers: string[] = Array.isArray(st.pers) ? st.pers : []
  let personalizacao = 'Sem personalização'
  if (pers.includes('uv')) {
    const u = st.uv ?? {}
    personalizacao = `Impressão UV · design ${DESIGNS_UV[u.design] ?? '—'} · ${txt(u.n1).toUpperCase()} & ${txt(u.n2).toUpperCase()} · ${txt(u.data)}`
  } else if (pers.includes('stamping')) {
    const s = st.stamp ?? {}
    const l2 = s.linha2 === 'Com 2ª Linha' ? ` / "${txt(s.txt2)}" (${txt(s.car2)})` : ''
    personalizacao = `Stamping · ${LETRAS[s.letra] ?? '—'} · ${txt(s.car)} · ${LOCAIS[s.loc] ?? '—'} · ${CORES[s.cor] ?? '—'} · "${txt(s.txt1)}"${l2}`
  }
  const paginas: any[] = Array.isArray(st.paginas) ? st.paginas : []
  const folhas = paginas.map((p, i) => ({
    n: i + 1,
    modelo: MODELOS[p?.modelo] ?? 'sem modelo',
    fotos: (Array.isArray(p?.slots) ? p.slots : []).map((x: any) => txt(x?.foto)).filter(Boolean),
  }))
  return {
    enviado: cfg.enviado ?? null,
    pasta: cfg.pasta ?? null,
    gama: GAMAS[st.capa] ?? GAMAS.aland,
    revestimento: REVESTIMENTOS[st.rev] ?? null,
    personalizacao,
    folhas,
    extras: Math.max(0, folhas.length - FOLHAS_INCLUIDAS),
  }
}

// Quantos espaços tem cada modelo de folha (igual a paginas.js)
const ESPACOS: Record<string, number> = {
  'esq-preparativos': 5, 'esq-cerimonia': 5, 'esq-saida': 5, 'esq-tres-dobra': 3, 'esq-dois-tres': 5,
  'pag-inteira-esq': 1, 'pag-inteira-dir': 1, 'pag-inteiras': 2, panoramica: 1, 'pan-margem': 1, 'uma-pagina': 2,
  'inteira-margem': 2, centro: 2, 'grande-duas': 3, 'quatro-alto': 4, 'tres-grande': 4, 'grelha-grande': 5, seis: 6, oito: 8,
  // foto a desvanecer (fundo) + 1, 2 ou 3 fotos
  'fade-dir-1': 2, 'fade-dir-2': 3, 'fade-dir-3': 4, 'fade-esq-1': 2, 'fade-esq-2': 3, 'fade-esq-3': 4,
}

// Desvanecimento: fade-<dir|esq>-<0 | 1-v | 1-h | 2-v | 2-h | 3-v | 3-h> (foto de fundo + 0 a 3 fotos)
for (const lado of ['dir', 'esq'] as const) for (const k of ['0', '1-v', '1-h', '2-v', '2-h', '3-v', '3-h']) {
  const n = Number(k[0]), id = `fade-${lado}-${k}`
  MODELOS[id] = `Desvanecer à ${lado === 'dir' ? 'direita' : 'esquerda'}${n ? ` + ${n} ${n === 1 ? 'foto' : 'fotos'} (${k.endsWith('v') ? 'vertical' : 'horizontal'})` : ' (sem fotos por cima)'}`
  ESPACOS[id] = n + 1
}

/** O que falta para o álbum personalizado estar completo, e as fotos do álbum que não foram colocadas. */
export function validarAlbum(estado: any, fotosAlbum: string[]): { iniciado: boolean; faltas: string[]; porColocar: string[] } {
  const st = estado && typeof estado === 'object' ? estado : null
  const paginas: any[] = Array.isArray(st?.paginas) ? st.paginas : []
  const iniciado = !!st && (!!st.rev || paginas.some(p => p?.modelo))
  if (!iniciado) return { iniciado: false, faltas: [], porColocar: fotosAlbum }
  const faltas: string[] = []
  if (!st.rev) faltas.push('o revestimento da capa')
  const pers: string[] = Array.isArray(st.pers) ? st.pers : []
  if (pers.includes('uv')) {
    const u = st.uv ?? {}
    if (!u.design) faltas.push('o design da impressão UV')
    if (!txt(u.n1) || !txt(u.n2)) faltas.push('os nomes da impressão UV')
    if (!txt(u.data)) faltas.push('a data da impressão UV')
  }
  if (pers.includes('stamping')) {
    const s = st.stamp ?? {}
    if (!s.letra || !s.car || !s.loc || !s.cor || !txt(s.txt1) || !s.linha2) faltas.push('campos do stamping')
    else if (s.linha2 === 'Com 2ª Linha' && (!s.car2 || !txt(s.txt2))) faltas.push('a 2ª linha do stamping')
  }
  const semModelo = paginas.filter(p => !p?.modelo).length
  if (semModelo) faltas.push(`${semModelo} ${semModelo === 1 ? 'folha sem modelo' : 'folhas sem modelo'}`)
  let vazios = 0
  const colocadas = new Set<string>()
  for (const p of paginas) {
    const n = ESPACOS[p?.modelo] ?? 0
    const ocultos: number[] = Array.isArray(p?.ocultos) ? p.ocultos : []
    for (let i = 0; i < n; i++) {
      if (ocultos.includes(i)) continue
      const f = txt(p?.slots?.[i]?.foto)
      if (f) colocadas.add(f); else vazios++
    }
  }
  if (vazios) faltas.push(`${vazios} ${vazios === 1 ? 'espaço vazio' : 'espaços vazios'} nas folhas`)
  return { iniciado: true, faltas, porColocar: fotosAlbum.filter(f => !colocadas.has(f)) }
}
