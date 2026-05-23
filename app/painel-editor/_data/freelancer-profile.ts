// ──────────────────────────────────────────────────────────────────
//  Perfil do freelancer (Editor Pro) — persistido em localStorage
//  Usado em /painel-editor/dados-pessoais e /painel-editor/tarefas
// ──────────────────────────────────────────────────────────────────

export type FreelancerProfile = {
  nome: string
  username: string
  email: string
  telefone: string
  dataNascimento: string
  localizacao: string
  fusoHorario: string
  idioma: string
}

export const DEFAULT_FREELANCER_PROFILE: FreelancerProfile = {
  nome: 'Editor Pro',
  username: 'editorpro',
  email: 'editorpro@mail.com',
  telefone: '+351 912 345 678',
  dataNascimento: '15/07/1992',
  localizacao: 'Lisboa, Portugal',
  fusoHorario: '🌐 (GMT+01:00) Lisboa',
  idioma: '🇵🇹 Português (Portugal)',
}

const STORAGE_KEY = 'painel-editor-freelancer-profile'

export function loadFreelancerProfile(): FreelancerProfile {
  if (typeof window === 'undefined') return DEFAULT_FREELANCER_PROFILE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_FREELANCER_PROFILE
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_FREELANCER_PROFILE, ...parsed }
  } catch {
    return DEFAULT_FREELANCER_PROFILE
  }
}

export function saveFreelancerProfile(p: FreelancerProfile): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {}
}
