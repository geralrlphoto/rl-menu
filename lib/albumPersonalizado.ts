// Resumo legível do álbum que os noivos personalizaram no portal
// (/portal-cliente/personalizar-album, guardado em portais.settings.album_config).
// Usado na página de Álbuns do Departamento de Fotografia: é daqui que a RL pede ao
// Claude para fazer o álbum ("fazer álbum CAS_xxx"), sem nomear editor.
// Os nomes têm de acompanhar os da página (public/portal-cliente/personalizar-album).

const REVESTIMENTOS: Record<string, string> = {
  L01: 'L01 - Linen Aqua', L02: 'L02 - Linen Pétal', L03: 'L03 - Linen Sun (stock limitado)', L04: 'L04 - Linen Pumpkin',
  L05: 'L05 - Linen Apple', L06: 'L06 - Linen Zink', L07: 'L07 - Linen Bege', L08: 'L08 - Linen Branco',
}
const MODELOS: Record<string, string> = {
  'esq-preparativos': 'Quatro + página inteira', 'esq-cerimonia': 'Quatro + panorâmica', 'esq-saida': 'Panorâmica + quatro',
  'esq-tres-dobra': 'Três com a do meio na dobra', 'esq-dois-tres': 'Duas em cima + três em baixo',
  'pag-inteira-esq': 'Página inteira à esquerda', 'pag-inteira-dir': 'Página inteira à direita', 'pag-inteiras': 'Duas páginas inteiras',
  panoramica: 'Uma foto nas duas páginas', 'pan-margem': 'Panorâmica com margem', 'uma-pagina': 'Uma por página',
  'inteira-margem': 'Página inteira + foto com margem', centro: 'Pequena ao centro', 'grande-duas': 'Uma grande + duas',
  'quatro-alto': 'Quatro ao alto', 'tres-grande': 'Três colunas + grande', 'grelha-grande': 'Quatro em grelha + grande',
  seis: 'Seis em grelha', oito: 'Oito em grelha',
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
    revestimento: REVESTIMENTOS[st.rev] ?? null,
    personalizacao,
    folhas,
    extras: Math.max(0, folhas.length - FOLHAS_INCLUIDAS),
  }
}
