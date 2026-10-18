// Novo design dos portais (tema "RL", igual às páginas de admin), em teste.
// Só os portais desta lista o recebem; os outros ficam com o design atual.
export const PORTAIS_TEMA_RL = ['CAS_064_27_RL']

/* Referência do portal a partir do endereço: /portal-cliente/ref/<REF> ou ?portalRef=<REF> */
export function refDoEndereco(pathname: string, search: string): string {
  const m = pathname.match(/\/ref\/([^/?#]+)/)
  if (m) return decodeURIComponent(m[1]).toUpperCase()
  return (new URLSearchParams(search).get('portalRef') || '').toUpperCase()
}

export function temTemaRL(ref: string): boolean {
  return PORTAIS_TEMA_RL.includes(ref.toUpperCase())
}
