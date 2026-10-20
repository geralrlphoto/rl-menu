// Links partilhados pelos portais.

import { linkPublico } from './site-url'

// Apoio ao Cliente das fotografias encomendadas — prazos, onde procurar a
// entrega e aviso à equipa. Vai no ticket e no comprovativo de aquisição.
export const APOIO_FOTOGRAFIAS_URL = linkPublico('/apoio-fotografias')

// Formulário de seleção de fotografias (substituiu o formulário do Tally).
export const FORM_SELECAO_FOTOS_URL = 'https://rl-menu-lake.vercel.app/form-selecao-fotos'

// Alguns portais têm o link antigo do Tally gravado nas definições. Enquanto
// esses valores não forem limpos, reencaminha-se para o formulário novo.
export function linkSelecaoFotos(url?: string | null) {
  if (!url || url.includes('tally.so/r/448PrO')) return FORM_SELECAO_FOTOS_URL
  return url
}

// Link do formulário de seleção a partir do portal: abre já o formulário do tipo
// certo com a referência do casamento, que o formulário mostra trancada (e com os
// nomes dos noivos), para a seleção chegar sempre ligada ao casamento certo.
export function linkSelecaoFotosDoPortal(url: string | null | undefined, referencia: string | null | undefined, tipo: 'casamento' | 'batizado') {
  const base = linkSelecaoFotos(url)
  if (!referencia || !base.includes('/form-selecao-fotos')) return base
  return `${FORM_SELECAO_FOTOS_URL}/${tipo}?ref=${encodeURIComponent(referencia)}`
}
