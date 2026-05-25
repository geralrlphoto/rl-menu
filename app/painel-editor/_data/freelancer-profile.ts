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
