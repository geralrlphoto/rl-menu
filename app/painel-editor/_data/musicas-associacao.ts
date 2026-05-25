// ──────────────────────────────────────────────────────────────────
//  Associação Música ↔ Projeto
//  Persistido em localStorage: painel-editor-musicas-por-projeto
//  Estrutura: { [projectId]: string[] } — array de trackIds por projeto
// ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'painel-editor-musicas-por-projeto'

export type AssociacaoMap = Record<string, string[]>

export function loadAssociacao(): AssociacaoMap {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function saveAssociacao(map: AssociacaoMap): void {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(map)) } catch {}
}

export function getTracksForProject(projectId: string): string[] {
  const map = loadAssociacao()
  return map[projectId] || []
}

export function getProjectsForTrack(trackId: string): string[] {
  const map = loadAssociacao()
  return Object.keys(map).filter(pid => (map[pid] || []).includes(trackId))
}

export function associate(trackId: string, projectId: string): void {
  const map = loadAssociacao()
  const current = map[projectId] || []
  if (!current.includes(trackId)) {
    map[projectId] = [...current, trackId]
    saveAssociacao(map)
  }
}

export function disassociate(trackId: string, projectId: string): void {
  const map = loadAssociacao()
  const current = map[projectId] || []
  map[projectId] = current.filter(id => id !== trackId)
  if (map[projectId].length === 0) delete map[projectId]
  saveAssociacao(map)
}

export function disassociateAll(trackId: string): void {
  const map = loadAssociacao()
  Object.keys(map).forEach(pid => {
    map[pid] = (map[pid] || []).filter(id => id !== trackId)
    if (map[pid].length === 0) delete map[pid]
  })
  saveAssociacao(map)
}
