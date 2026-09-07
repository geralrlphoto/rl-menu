// ──────────────────────────────────────────────────────────────────
//  Perfil do freelancer (Editor Pro) — persistido em localStorage
//  Usado em /painel-editor/dados-pessoais e /painel-editor/tarefas
// ──────────────────────────────────────────────────────────────────

export type FreelancerProfile = {
  // Identidade
  nome: string
  username: string
  email: string
  telefone: string
  dataNascimento: string
  localizacao: string
  fusoHorario: string
  idioma: string
  foto: string   // URL externo ou dataURL (upload local)
  // Sobre Mim
  sobre: string
  experiencia: string
  projetosRealizados: string
  estilo: string
  // Especialidades (label → percentagem)
  skills: { label: string; value: number }[]
  // Preferências de Trabalho
  funcao: 'Videógrafo' | 'Fotógrafo' | 'Editor de Foto' | 'Editor de Vídeo' | 'Assistente'
  diasTrabalho: string
  horarioPreferencial: string
  comunicacao: string
  notificacoesAtivas: boolean
  disponivelNovosProjetos: boolean
  // Pagamento
  metodoPagamento: string
  iban: string
  titularConta: string
  nif: string
  moeda: string
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
  foto: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300&h=300&fit=crop&crop=face',
  sobre: 'Editor de vídeo especializado em casamentos com mais de 6 anos de experiência. Apaixonado por contar histórias reais através de imagens. Busco sempre capturar emoções autênticas e transformar momentos em memórias inesquecíveis.',
  experiencia: '6+ anos',
  projetosRealizados: '150+',
  estilo: 'Cinemático, Emocional, Autêntico',
  skills: [
    { label: 'Edição de Vídeo',   value: 95 },
    { label: 'Color Grading',     value: 90 },
    { label: 'Motion Graphics',   value: 75 },
    { label: 'Sound Design',      value: 70 },
    { label: 'Direção Criativa',  value: 85 },
  ],
  funcao: 'Editor de Vídeo',
  diasTrabalho: 'Segunda a Sábado',
  horarioPreferencial: '09:00 - 18:00',
  comunicacao: 'Email, WhatsApp, Slack',
  notificacoesAtivas: true,
  disponivelNovosProjetos: true,
  metodoPagamento: 'Transferência Bancária',
  iban: 'PT50 0010 0000 1234 5678 9015 4',
  titularConta: 'Editor Pro',
  nif: '123 456 789',
  moeda: 'EUR (€)',
}

// ── Identidade do editor (id do freelancer) partilhada entre páginas ──────────
// O painel principal recebe ?freelancer=<id> e memoriza-o; as sub-páginas leem-no
// daqui (URL tem prioridade; senão localStorage).
const EDITOR_ID_KEY = 'painel-editor-fl-id'
export function rememberEditorId(id: string | null): void {
  if (id && typeof window !== 'undefined') {
    try { localStorage.setItem(EDITOR_ID_KEY, id) } catch {}
  }
}
export function getEditorId(urlId?: string | null): string | null {
  if (urlId) return urlId
  if (typeof window === 'undefined') return null
  // O ?freelancer=<id> do URL manda: uma sub-página pode ser aberta directamente
  // com o id de outra pessoa e o id memorizado ficaria desactualizado.
  try {
    const doUrl = new URLSearchParams(window.location.search).get('freelancer')
    if (doUrl) { rememberEditorId(doUrl); return doUrl }
  } catch {}
  try { return localStorage.getItem(EDITOR_ID_KEY) } catch {}
  return null
}

// ── Modo admin (maquete) — admin abre o painel do editor com ?admin=1 e pode
// editar tudo. Persistido em sessionStorage (por separador) para sobreviver à
// navegação entre sub-páginas sem ter de propagar o ?admin=1 em todos os links.
const ADMIN_MODE_KEY = 'painel-editor-admin-mode'
export function rememberAdminMode(on: boolean): void {
  if (typeof window === 'undefined' || !on) return
  try { sessionStorage.setItem(ADMIN_MODE_KEY, 'true') } catch {}
}
export function isAdminMode(urlAdmin?: boolean): boolean {
  if (urlAdmin) return true
  if (typeof window !== 'undefined') {
    try { return sessionStorage.getItem(ADMIN_MODE_KEY) === 'true' } catch {}
  }
  return false
}

const STORAGE_KEY = 'painel-editor-freelancer-profile'

// O perfil vive no localStorage do browser, que é partilhado por toda a gente
// que ali entre. Carimbamos o id do dono para nunca mostrar (nem gravar) os
// dados de uma pessoa na ficha de outra: sem correspondência, volta ao default
// e é a BD que preenche.
type StoredProfile = FreelancerProfile & { _owner?: string | null }

export function loadFreelancerProfile(id?: string | null): FreelancerProfile {
  if (typeof window === 'undefined') return DEFAULT_FREELANCER_PROFILE
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_FREELANCER_PROFILE
    const parsed = JSON.parse(raw) as StoredProfile
    const dono = parsed._owner ?? null
    if (dono !== (getEditorId(id) ?? null)) return DEFAULT_FREELANCER_PROFILE
    const { _owner: _dono, ...perfil } = parsed
    return { ...DEFAULT_FREELANCER_PROFILE, ...perfil }
  } catch {
    return DEFAULT_FREELANCER_PROFILE
  }
}

export function saveFreelancerProfile(p: FreelancerProfile, id?: string | null): void {
  if (typeof window === 'undefined') return
  try {
    const stored: StoredProfile = { ...p, _owner: getEditorId(id) ?? null }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch {}
}
