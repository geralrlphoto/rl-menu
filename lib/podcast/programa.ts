/* ============================================================
   Identidade do programa.

   Estes campos são do programa, não de cada episódio, e por isso não
   estão na base de dados: mudam uma vez por ano, no máximo. Quando
   tiveres os endereços das plataformas, preenche-os aqui e os botões
   aparecem sozinhos nas páginas.
   ============================================================ */

export const PROGRAMA = {
  nome: 'Antes do Sim',
  promessa:
    'Todos os meses, uma conversa com quem faz casamentos por dentro, para quem está a planear o seu.',
  descricao:
    'Um podcast da RL Photo Video para casais em fase de planeamento. Uma conversa por mês com profissionais do setor: wedding planners, quintas, catering, flores, música. Sem publicidade disfarçada, com números e respostas concretas.',
  autor: 'RL Photo Video',
  email: 'geral.rlphoto@gmail.com',
  /** Deixa vazio o que ainda não existir: o botão não é mostrado. */
  plataformas: {
    spotify: '',
    apple: '',
    youtube: '',
    rss: '',
  },
  /** Capa do programa. Substitui por uma imagem em WebP até 1600 px. */
  capa: '/logo_rl_gold.png',
} as const

/** Endereço público do site, para os metadados e o JSON-LD. */
export const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'
