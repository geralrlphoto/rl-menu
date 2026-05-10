// Shared helpers for batizado API routes.
// Keep here (not in route.ts files) to avoid cross-route import issues in Next.js.

export const MASTER_TOKEN = 'batizado-maquete'

// Design fields that the master template propagates to ALL client pages.
// 'evento' (baby name/date/local) and 'proposta.password' are client-specific — never overwritten.
export const DESIGN_FIELDS = [
  'hero', 'video', 'portfolio', 'revista', 'testimonials',
  'about', 'banner', 'propostaPage', 'propostas', 'extras_proposta',
]

/**
 * Merges master design fields into an existing client content object.
 * Preserves: evento (client-specific event details) + proposta.password.
 */
export function buildSyncedContent(
  masterContent: Record<string, any>,
  clientContent: Record<string, any>
): Record<string, any> {
  const synced: Record<string, any> = { ...clientContent }

  for (const field of DESIGN_FIELDS) {
    if (masterContent[field] !== undefined) {
      synced[field] = masterContent[field]
    }
  }

  // Preserve client's evento (baby name, date, hour, local)
  synced.evento = clientContent.evento ?? masterContent.evento ?? {}

  // Sync button label from master; keep client's own password
  synced.proposta = {
    buttonLabel: masterContent.proposta?.buttonLabel ?? clientContent.proposta?.buttonLabel ?? '',
    password: clientContent.proposta?.password ?? '',
  }

  return synced
}
