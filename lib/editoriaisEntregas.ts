// Vídeos a entregar em cada portal de editorial (/editorial/<slug>).
// A lista de partida fica no código; na janela do + em /portais-clientes o admin muda o título e o formato,
// cola os links, acrescenta vídeos novos e remove os que não vão existir. Tudo isso guarda-se na tabela
// `editoriais` (coluna entregas, jsonb), por id do vídeo.

export type EntregaDef = { id: string; nome: string; formato: string }
export type GrupoEntregas = { parceiro: string; sub: string; itens: EntregaDef[] }

/** O que fica guardado por vídeo. Nos vídeos da lista de partida, nome/formato só existem se o admin os mudou. */
export type EntregaLink = {
  link?: string
  data?: string
  nome?: string
  formato?: string
  /** Vídeo acrescentado pelo admin (id "extra-…"), no grupo com este parceiro */
  extra?: boolean
  grupo?: string
  ordem?: number
  /** Vídeo da lista de partida que o admin removeu */
  oculto?: boolean
}

export type EntregaVista = EntregaDef & { link?: string; data?: string; extra?: boolean }
export type GrupoVista = { parceiro: string; sub: string; itens: EntregaVista[] }

export const ENTREGAS_EDITORIAL: Record<string, GrupoEntregas[]> = {
  'zankyou-quinta-da-ria': [
    { parceiro: 'Zankyou', sub: 'Editorial', itens: [
      { id: 'filme-editorial', nome: 'Filme editorial', formato: '16:9 · 60–90 s' },
      { id: 'reel-detalhes', nome: 'Reel 1 · Detalhes', formato: '9:16 · 15–30 s' },
      { id: 'reel-casal', nome: 'Reel 2 · Casal', formato: '9:16 · 15–30 s' },
      { id: 'reel-ambiente', nome: 'Reel 3 · Ambiente', formato: '9:16 · 15–30 s' },
      { id: 'teaser', nome: 'Teaser do lançamento', formato: '9:16 · vertical' },
    ] },
    { parceiro: 'Quinta da Ria', sub: 'Apresentação do espaço', itens: [
      { id: 'filme-espaco', nome: 'Filme de apresentação do espaço', formato: '16:9 · 60–90 s' },
    ] },
  ],
}

export const ehIdExtra = (id: string) => /^extra-[a-z0-9]{4,20}$/.test(id)

/** Lista final que o portal mostra: a de partida com os títulos do admin, sem as removidas, mais as acrescentadas. */
export function montarEntregas(slug: string, guardadas: Record<string, EntregaLink>): GrupoVista[] {
  const grupos = ENTREGAS_EDITORIAL[slug] ?? []
  const extras = Object.entries(guardadas)
    .filter(([id, v]) => ehIdExtra(id) && v?.extra && v.nome?.trim())
    .sort(([, a], [, b]) => (a.ordem ?? 0) - (b.ordem ?? 0))
  return grupos.map((g, k) => ({
    parceiro: g.parceiro,
    sub: g.sub,
    itens: [
      ...g.itens.filter(i => !guardadas[i.id]?.oculto).map(i => {
        const v = guardadas[i.id] ?? {}
        return { id: i.id, nome: v.nome?.trim() || i.nome, formato: v.formato?.trim() ?? i.formato, link: v.link, data: v.data }
      }),
      // Acrescentadas: no grupo escolhido (se o grupo deixou de existir, vão para o primeiro)
      ...extras
        .filter(([, v]) => (grupos.some(x => x.parceiro === v.grupo) ? v.grupo === g.parceiro : k === 0))
        .map(([id, v]) => ({ id, nome: v.nome!.trim(), formato: v.formato?.trim() ?? '', link: v.link, data: v.data, extra: true })),
    ],
  }))
}
