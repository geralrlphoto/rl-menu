// Novo design dos portais (tema "RL", igual às páginas de admin).
// Desde 2026-10-20 vale para todos os portais de casamento (CAS_…) e de batizado (BAT_…).
export const PREFIXOS_TEMA_RL = ['CAS_', 'BAT_']

/* Referência do portal a partir do endereço: /portal-cliente/ref/<REF> ou ?portalRef=<REF> */
export function refDoEndereco(pathname: string, search: string): string {
  const m = pathname.match(/\/ref\/([^/?#]+)/)
  if (m) return decodeURIComponent(m[1]).toUpperCase()
  return (new URLSearchParams(search).get('portalRef') || '').toUpperCase()
}

/* Portal de batizado (/portal-batizado ou referência BAT_…): muda o texto "casamento" */
export function ehBatizado(pathname: string, ref: string): boolean {
  return pathname.startsWith('/portal-batizado') || ref.toUpperCase().startsWith('BAT_')
}

export function temTemaRL(ref: string): boolean {
  const r = ref.toUpperCase()
  return PREFIXOS_TEMA_RL.some(p => r.startsWith(p))
}

/* Tema RL pelo endereço. Sem referência, o /portal-cliente é o portal modelo (de exemplo),
   que também usa o novo design */
export function temTemaRLnoEndereco(pathname: string, search: string): boolean {
  const ref = refDoEndereco(pathname, search)
  return ref ? temTemaRL(ref) : pathname.startsWith('/portal-cliente')
}
