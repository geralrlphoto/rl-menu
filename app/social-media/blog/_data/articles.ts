/* ============================================================
   Catálogo de artigos pré-escritos para o blog RL Photo Video.
   Estes textos foram redigidos pelo Claude (Anthropic) em
   PT-PT premium editorial, sobre casamentos / fotografia / vídeo.

   Para adicionar mais artigos: pede-mos no chat e eu acrescento
   aqui mais entradas. Cada artigo é independente — copia o body
   inteiro para o teu blog.
   ============================================================ */

export type Article = {
  id: string
  title: string
  subtitle?: string
  body: string        // texto completo em parágrafos separados por \n\n
  keywords: string    // SEO keywords
  category: 'fotografia' | 'video' | 'pre-wedding' | 'preparacao' | 'pos-casamento'
  readingMin: number  // minutos de leitura aproximados
}

// Catálogo vazio por agora. Pede no chat:
//   "gera 5 artigos sobre [tema]"
//   "1 artigo sobre [...]"
// e eu acrescento aqui.
export const ARTICLES: Article[] = []

export const CATEGORY_LABEL: Record<Article['category'], string> = {
  'fotografia':    'Fotografia',
  'video':         'Vídeo',
  'pre-wedding':   'Pré-Wedding',
  'preparacao':    'Preparações',
  'pos-casamento': 'Pós-Casamento',
}
