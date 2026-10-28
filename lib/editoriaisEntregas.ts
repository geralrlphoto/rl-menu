// Vídeos a entregar em cada portal de editorial (/editorial/<slug>).
// A lista fica no código; os links de cada vídeo guardam-se na tabela `editoriais` (coluna entregas),
// preenchidos pelo admin na janela do + em /portais-clientes.

export type EntregaDef = { id: string; nome: string; formato: string }
export type GrupoEntregas = { parceiro: string; sub: string; itens: EntregaDef[] }
export type EntregaLink = { link: string; data?: string }

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
