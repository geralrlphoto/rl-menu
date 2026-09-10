// Links partilhados pelos portais.

// Formulário de seleção de fotografias (substituiu o formulário do Tally).
export const FORM_SELECAO_FOTOS_URL = 'https://rl-menu-lake.vercel.app/form-selecao-fotos'

// Alguns portais têm o link antigo do Tally gravado nas definições. Enquanto
// esses valores não forem limpos, reencaminha-se para o formulário novo.
export function linkSelecaoFotos(url?: string | null) {
  if (!url || url.includes('tally.so/r/448PrO')) return FORM_SELECAO_FOTOS_URL
  return url
}
