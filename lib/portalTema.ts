// Novo design dos portais (tema "RL", igual às páginas de admin).
// Desde 2026-10-20 vale para todos os portais de casamento (referência CAS_…).
// O batizado (BAT_…) ainda não foi adaptado e fica com o design atual.
export const PREFIXOS_TEMA_RL = ['CAS_']

/* Referência do portal a partir do endereço: /portal-cliente/ref/<REF> ou ?portalRef=<REF> */
export function refDoEndereco(pathname: string, search: string): string {
  const m = pathname.match(/\/ref\/([^/?#]+)/)
  if (m) return decodeURIComponent(m[1]).toUpperCase()
  return (new URLSearchParams(search).get('portalRef') || '').toUpperCase()
}

export function temTemaRL(ref: string): boolean {
  const r = ref.toUpperCase()
  return PREFIXOS_TEMA_RL.some(p => r.startsWith(p))
}
