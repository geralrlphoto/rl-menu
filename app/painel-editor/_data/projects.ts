// ────────────────────────────────────────────────────────────────────────
//  Shared mock data: projetos do painel editor
//  Pagamentos, Novos Projetos, Em Edição, etc. derivam tudo daqui
// ────────────────────────────────────────────────────────────────────────

export type WorkflowStage =
  | 'Novo Projeto' | 'Em Edição' | 'Color Grading' | 'Trailer em Produção'
  | 'Áudio / Sincronização' | 'Para Revisão' | 'Correções' | 'Finalizado' | 'Entregue'

export type Approval = 'Aguardando Revisão' | 'Aprovado Cliente' | 'Requer Alterações' | 'Não Aprovado'

export type Pacote = 'Pacote Premium 👑' | 'Pacote Essencial'

export type Project = {
  id: string
  noivos: string
  foto: string
  email: string
  telefone: string
  recebido: string
  dataCasamento: string  // dd/mm/yyyy
  entregaPrevista: string
  pacote: Pacote
  preco: number
  duracao: string
  stage: WorkflowStage
  approval: Approval
  progress: number  // 0..100
  editor: string
  finalEntregue: boolean
  finalLink: string
  archived?: boolean
  cancelled?: boolean
}

export const PROJECTS: Project[] = [
  {
    id: 'p1',
    noivos: 'Amanda & Lucas',
    foto: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=900&h=600&fit=crop',
    email: 'amanda.lucas@mail.com',
    telefone: '+351 912 345 678',
    recebido: '18/05/2026',
    dataCasamento: '28/06/2026',
    entregaPrevista: '15/07/2026',
    pacote: 'Pacote Premium 👑',
    preco: 3500,
    duracao: '~12 min',
    stage: 'Em Edição',
    approval: 'Aguardando Revisão',
    progress: 35,
    editor: 'Editor Pro',
    finalEntregue: false,
    finalLink: '',
  },
  {
    id: 'p2',
    noivos: 'Beatriz & Gabriel',
    foto: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=900&h=600&fit=crop',
    email: 'beatriz.gabriel@mail.com',
    telefone: '+351 936 222 113',
    recebido: '17/05/2026',
    dataCasamento: '31/05/2026',
    entregaPrevista: '20/06/2026',
    pacote: 'Pacote Premium 👑',
    preco: 4200,
    duracao: '~14 min',
    stage: 'Para Revisão',
    approval: 'Requer Alterações',
    progress: 70,
    editor: 'Editor Pro',
    finalEntregue: false,
    finalLink: 'https://vimeo.com/beatriz-gabriel-v2',
  },
  {
    id: 'p3',
    noivos: 'Juliana & Matheus',
    foto: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=900&h=600&fit=crop',
    email: 'juliana.matheus@mail.com',
    telefone: '+351 962 901 020',
    recebido: '16/05/2026',
    dataCasamento: '07/06/2026',
    entregaPrevista: '28/06/2026',
    pacote: 'Pacote Essencial',
    preco: 1800,
    duracao: '~8 min',
    stage: 'Novo Projeto',
    approval: 'Aguardando Revisão',
    progress: 5,
    editor: 'Editor Pro',
    finalEntregue: false,
    finalLink: '',
  },
  {
    id: 'p4',
    noivos: 'Carolina & Felipe',
    foto: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=900&h=600&fit=crop',
    email: 'carolina.felipe@mail.com',
    telefone: '+351 919 778 845',
    recebido: '14/05/2026',
    dataCasamento: '14/06/2026',
    entregaPrevista: '05/07/2026',
    pacote: 'Pacote Premium 👑',
    preco: 3800,
    duracao: '~15 min',
    stage: 'Entregue',
    approval: 'Aprovado Cliente',
    progress: 100,
    editor: 'Editor Pro',
    finalEntregue: true,
    finalLink: 'https://vimeo.com/carolina-felipe-final',
  },
  {
    id: 'p5',
    noivos: 'Sofia & Ricardo',
    foto: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=900&h=600&fit=crop',
    email: 'sofia.ricardo@mail.com',
    telefone: '+351 925 110 332',
    recebido: '05/05/2026',
    dataCasamento: '21/06/2026',
    entregaPrevista: '12/07/2026',
    pacote: 'Pacote Premium 👑',
    preco: 3200,
    duracao: '~11 min',
    stage: 'Finalizado',
    approval: 'Aprovado Cliente',
    progress: 90,
    editor: 'Editor Pro',
    finalEntregue: false,
    finalLink: '',
  },
]

// ────────────────────────────────────────────────────────────────────────
//  Payment plan generator
// ────────────────────────────────────────────────────────────────────────

export type InstallmentKey = 'reserva' | 'casamento' | 'entrega'

export type Installment = {
  key: InstallmentKey
  label: string
  percent: number
  value: number
  dueDate: string         // dd/mm/yyyy
  paidDate: string | null // dd/mm/yyyy or null
  status: 'Recebido' | 'A receber' | 'Atrasado' | 'Parcial' | 'Cancelado'
  metodo?: string
}

/** Adicionar dias a uma data dd/mm/yyyy */
function addDaysPt(date: string, days: number): string {
  const [dd, mm, yyyy] = date.split('/').map(Number)
  const d = new Date(yyyy, mm - 1, dd)
  d.setDate(d.getDate() + days)
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`
}

/** Compara duas datas dd/mm/yyyy. Retorna negativo se a < b */
export function comparePtDate(a: string, b: string): number {
  const [da, ma, ya] = a.split('/').map(Number)
  const [db, mb, yb] = b.split('/').map(Number)
  return new Date(ya, ma-1, da).getTime() - new Date(yb, mb-1, db).getTime()
}

/** Hoje em dd/mm/yyyy (mock fixo para consistência) */
export const TODAY = '24/05/2026'

/** Gera plano de pagamento — UMA única parcela por projeto (100%) */
export function paymentPlanFor(p: Project): Installment[] {
  if (p.cancelled) {
    return [
      { key: 'entrega', label: 'Pagamento Único', percent: 100, value: p.preco, dueDate: p.entregaPrevista, paidDate: null, status: 'Cancelado' },
    ]
  }

  // Vencimento: alguns dias antes da entrega prevista (ou na data de entrega)
  const due = p.entregaPrevista || p.dataCasamento || p.recebido
  // Default: marcado como pago se o projeto foi entregue + aprovado pelo cliente.
  // O user pode sempre alterar via dropdown (override em paymentOverrides).
  const pago = p.finalEntregue && p.approval === 'Aprovado Cliente'
  const atrasado = !pago && comparePtDate(due, TODAY) < 0

  return [
    {
      key: 'entrega',
      label: 'Pagamento Único',
      percent: 100,
      value: p.preco,
      dueDate: due,
      paidDate: pago ? due : null,
      status: pago ? 'Recebido' : atrasado ? 'Atrasado' : 'A receber',
      metodo: pago ? 'Transferência' : undefined,
    },
  ]
}

// ────────────────────────────────────────────────────────────────────────
//  TAREFAS (sincronizadas com projetos)
// ────────────────────────────────────────────────────────────────────────

export type TaskStatus = 'Pendente' | 'Em andamento' | 'Em revisão' | 'Bloqueada' | 'Concluída' | 'Cancelada'
export type Priority = 'Alta' | 'Média' | 'Baixa'

export type Task = {
  id: string
  title: string
  description?: string
  projectId: string
  assignee: string          // editor / freelancer
  assigneeAvatar?: string
  deadline: string          // dd/mm/yyyy
  hora?: string
  priority: Priority
  status: TaskStatus
  progress: number          // 0..100
  comments?: number
  files?: number
  completedAt?: string      // dd/mm/yyyy hh:mm
  autoGenerated?: boolean
}

const AVATAR_E = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=80&h=80&fit=crop&crop=face'
const AVATAR_F = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face'
const AVATAR_M = 'https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=80&h=80&fit=crop&crop=face'
const AVATAR_W = 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face'

export const TASKS: Task[] = [
  // Tarefas de Hoje
  { id: 't1', title: 'Revisar color grading do filme',            projectId: 'p1', assignee: 'Editor Pro',  assigneeAvatar: AVATAR_E, deadline: TODAY, priority: 'Alta',  status: 'Em andamento', progress: 60, comments: 2 },
  { id: 't2', title: 'Criar trailer 1 minuto',                    projectId: 'p2', assignee: 'Sara Lopes',  assigneeAvatar: AVATAR_F, deadline: TODAY, priority: 'Alta',  status: 'Pendente',     progress: 0 },
  { id: 't3', title: 'Sincronizar áudio da cerimónia',            projectId: 'p3', assignee: 'João Mendes', assigneeAvatar: AVATAR_M, deadline: TODAY, priority: 'Média', status: 'Concluída',    progress: 100, completedAt: '24/05/2026 — 11:08' },
  { id: 't4', title: 'Enviar primeira versão para revisão',       projectId: 'p4', assignee: 'Editor Pro',  assigneeAvatar: AVATAR_E, deadline: TODAY, priority: 'Alta',  status: 'Em andamento', progress: 80 },

  // Próximas Tarefas
  { id: 't5', title: 'Ajustar transições e cortes finais',        projectId: 'p2', assignee: 'Sara Lopes',  assigneeAvatar: AVATAR_F, deadline: '25/05/2026', priority: 'Média', status: 'Pendente', progress: 0 },
  { id: 't6', title: 'Adicionar música final',                    projectId: 'p3', assignee: 'João Mendes', assigneeAvatar: AVATAR_M, deadline: '26/05/2026', priority: 'Baixa', status: 'Pendente', progress: 0 },
  { id: 't7', title: 'Revisar filme final completo',              projectId: 'p4', assignee: 'Ana Ribeiro', assigneeAvatar: AVATAR_W, deadline: '27/05/2026', priority: 'Alta',  status: 'Pendente', progress: 0 },

  // Atrasada
  { id: 't8', title: 'Exportar versão final para cliente',         projectId: 'p5', assignee: 'Editor Pro',  assigneeAvatar: AVATAR_E, deadline: '22/05/2026', priority: 'Alta',  status: 'Pendente', progress: 30 },

  // Concluídas (extra)
  { id: 't9',  title: 'Importar material',     projectId: 'p1', assignee: 'Editor Pro',  assigneeAvatar: AVATAR_E, deadline: '19/05/2026', priority: 'Média', status: 'Concluída', progress: 100, completedAt: '19/05/2026 — 15:42', autoGenerated: true },
  { id: 't10', title: 'Organizar ficheiros',   projectId: 'p1', assignee: 'Editor Pro',  assigneeAvatar: AVATAR_E, deadline: '20/05/2026', priority: 'Baixa', status: 'Concluída', progress: 100, completedAt: '20/05/2026 — 09:10', autoGenerated: true },
  { id: 't11', title: 'Criar reels Instagram', projectId: 'p4', assignee: 'Sara Lopes',  assigneeAvatar: AVATAR_F, deadline: '15/05/2026', priority: 'Média', status: 'Concluída', progress: 100, completedAt: '15/05/2026 — 17:20', autoGenerated: true },
]

/** Tarefas auto-geradas para um projeto novo (template) */
export const AUTO_TASKS_TEMPLATE: { title: string; priority: Priority }[] = [
  { title: 'Importar material',           priority: 'Média' },
  { title: 'Organizar ficheiros',         priority: 'Baixa' },
  { title: 'Criar trailer',                priority: 'Alta' },
  { title: 'Color grading',               priority: 'Alta' },
  { title: 'Sincronizar áudio',           priority: 'Média' },
  { title: 'Criar reels',                  priority: 'Média' },
  { title: 'Enviar revisão',               priority: 'Alta' },
  { title: 'Aplicar alterações',          priority: 'Média' },
  { title: 'Exportar final',              priority: 'Alta' },
  { title: 'Entrega cliente',             priority: 'Alta' },
]

// ────────────────────────────────────────────────────────────────────────
//  CALENDÁRIO (eventos derivados dos projetos)
// ────────────────────────────────────────────────────────────────────────

export type EventType = 'Casamento' | 'Prazo' | 'Entrega' | 'Revisão' | 'Pagamento' | 'Reunião' | 'Urgente'

export type CalendarEvent = {
  id: string
  title: string
  subtitle?: string
  date: string          // dd/mm/yyyy
  hora?: string
  type: EventType
  projectId?: string
  todoODia?: boolean
  completed?: boolean
}

const EVENT_COLORS: Record<EventType, { dot: string; bg: string; text: string; badge: string }> = {
  Casamento: { dot: '#a78bfa', bg: 'bg-purple-500/10',   text: 'text-purple-200', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  Prazo:     { dot: '#34d399', bg: 'bg-emerald-500/10',  text: 'text-emerald-200', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  Entrega:   { dot: '#60a5fa', bg: 'bg-blue-500/10',     text: 'text-blue-200',    badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  Revisão:   { dot: '#facc15', bg: 'bg-yellow-500/10',   text: 'text-yellow-200',  badge: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30' },
  Pagamento: { dot: '#fb923c', bg: 'bg-orange-500/10',   text: 'text-orange-200',  badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  Reunião:   { dot: '#06b6d4', bg: 'bg-cyan-500/10',     text: 'text-cyan-200',    badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  Urgente:   { dot: '#ef4444', bg: 'bg-red-500/10',      text: 'text-red-200',     badge: 'bg-red-500/15 text-red-300 border-red-500/30' },
}

export function eventColorFor(t: EventType) { return EVENT_COLORS[t] }

function addDaysISO(date: string, days: number): string {
  const [d, m, y] = date.split('/').map(Number)
  const dt = new Date(y, m-1, d)
  dt.setDate(dt.getDate() + days)
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
}

/** Gera eventos auto a partir dos projetos */
export function eventsFromProjects(): CalendarEvent[] {
  const events: CalendarEvent[] = []

  PROJECTS.forEach(p => {
    if (p.cancelled || p.archived) return
    const baseId = p.id

    // 💍 Casamento
    events.push({ id: `${baseId}-wed`, title: 'Casamento', subtitle: p.noivos, date: p.dataCasamento, type: 'Casamento', projectId: p.id, todoODia: true })

    // 📦 Material recebido (recebido)
    events.push({ id: `${baseId}-mat`, title: 'Material Recebido', subtitle: p.noivos, date: p.recebido, type: 'Prazo', projectId: p.id, todoODia: true })

    // 📅 Edição start (~5 dias após recebido)
    events.push({ id: `${baseId}-edit`, title: 'Início da Edição', subtitle: p.noivos, date: addDaysISO(p.recebido, 5), type: 'Prazo', projectId: p.id, todoODia: true })

    // 🟡 Review V1 (~10 dias após edição)
    events.push({ id: `${baseId}-v1`, title: 'Revisão V1', subtitle: p.noivos, date: addDaysISO(p.recebido, 15), type: 'Revisão', projectId: p.id, todoODia: true })

    // 🟡 Review V2 (~5 dias antes da entrega)
    events.push({ id: `${baseId}-v2`, title: 'Revisão V2', subtitle: p.noivos, date: addDaysISO(p.entregaPrevista, -5), type: 'Revisão', projectId: p.id, todoODia: true })

    // 🔵 Entrega Trailer (~7 dias antes da entrega final)
    events.push({ id: `${baseId}-trailer`, title: 'Entrega Trailer', subtitle: p.noivos, date: addDaysISO(p.entregaPrevista, -7), type: 'Entrega', projectId: p.id, todoODia: true })

    // 🔵 Entrega Final
    events.push({ id: `${baseId}-final`, title: 'Entrega Final', subtitle: p.noivos, date: p.entregaPrevista, type: 'Entrega', projectId: p.id, todoODia: true, completed: p.finalEntregue })

    // 🟠 Pagamento único (gerado via paymentPlanFor)
    const plan = paymentPlanFor(p)
    plan.forEach((inst, i) => {
      events.push({
        id: `${baseId}-pay-${i}`,
        title: 'Pagamento',
        subtitle: p.noivos,
        date: inst.dueDate,
        type: 'Pagamento',
        projectId: p.id,
        todoODia: true,
        completed: inst.status === 'Recebido',
      })
    })
  })

  // Reuniões cliente (mock)
  events.push({ id: 'meet-1', title: 'Reunião Cliente', subtitle: 'Amanda & Lucas', date: '24/05/2026', hora: '10:00', type: 'Reunião', projectId: 'p1' })
  events.push({ id: 'meet-2', title: 'Reunião Cliente', subtitle: 'Beatriz & Gabriel', date: '28/05/2026', hora: '14:30', type: 'Reunião', projectId: 'p2' })

  return events
}

// ────────────────────────────────────────────────────────────────────────
//  WORKFLOW — sistema de 9 etapas
// ────────────────────────────────────────────────────────────────────────

export type WorkflowStep = 'Recebido' | 'Organização' | 'Pré-Produção' | 'Edição' | 'Color Grading' | 'Áudio' | 'Revisão' | 'Aprovação' | 'Entrega'

export const WORKFLOW_STEPS: WorkflowStep[] = [
  'Recebido', 'Organização', 'Pré-Produção', 'Edição', 'Color Grading', 'Áudio', 'Revisão', 'Aprovação', 'Entrega',
]

export const WORKFLOW_PROGRESS: Record<WorkflowStep, number> = {
  'Recebido':      10,
  'Organização':   20,
  'Pré-Produção':  30,
  'Edição':        50,
  'Color Grading': 65,
  'Áudio':         75,
  'Revisão':       85,
  'Aprovação':     95,
  'Entrega':       100,
}

export const WORKFLOW_DESCRIPTIONS: Record<WorkflowStep, string> = {
  'Recebido':      'Projeto recebido e confirmado',
  'Organização':   'Download e organização dos arquivos',
  'Pré-Produção':  'Análise do material e planeamento da edição',
  'Edição':        'Cortes, montagem e sincronização',
  'Color Grading': 'Correção de cor e tratamento de imagem',
  'Áudio':         'Mixagem, trilha sonora e limpeza de áudio',
  'Revisão':       'Envio para revisão e ajustes necessários',
  'Aprovação':     'Aguardando aprovação do cliente',
  'Entrega':       'Exportação e entrega final ao cliente',
}

/** Mapeia o stage atual do projeto para uma das 9 etapas do workflow */
export function workflowStageFor(p: Project): WorkflowStep {
  switch (p.stage) {
    case 'Novo Projeto':           return 'Recebido'
    case 'Em Edição':              return 'Edição'
    case 'Color Grading':          return 'Color Grading'
    case 'Trailer em Produção':    return 'Edição'
    case 'Áudio / Sincronização':  return 'Áudio'
    case 'Para Revisão':           return 'Revisão'
    case 'Correções':              return 'Revisão'
    case 'Finalizado':             return 'Aprovação'
    case 'Entregue':               return 'Entrega'
    default:                       return 'Recebido'
  }
}

