// ──────────────────────────────────────────────────────────────────
//  Domínio canónico da app
//  O window.location.origin devolve o host por onde a pessoa entrou: quem
//  abrisse o admin pelo rl-menu-lake.vercel.app copiava links com o domínio
//  antigo e enviava-os assim aos noivos e à equipa. Tudo o que se dá a outra
//  pessoa constrói-se a partir daqui.
//  (Não serve para os redirects de autenticação, que têm mesmo de bater certo
//   com o host onde a sessão está a decorrer.)
// ──────────────────────────────────────────────────────────────────

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt').replace(/\/+$/, '')

export function linkPublico(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
