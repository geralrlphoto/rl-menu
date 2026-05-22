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

/** Gera plano de pagamento a partir de um projeto */
export function paymentPlanFor(p: Project): Installment[] {
  if (p.cancelled) {
    return [
      { key: 'reserva',   label: 'Reserva 30%',       percent: 30, value: p.preco * 0.30, dueDate: p.recebido, paidDate: p.recebido, status: 'Cancelado' },
      { key: 'casamento', label: 'Dia do Casamento 40%', percent: 40, value: p.preco * 0.40, dueDate: p.dataCasamento, paidDate: null, status: 'Cancelado' },
      { key: 'entrega',   label: 'Entrega Final 30%', percent: 30, value: p.preco * 0.30, dueDate: p.entregaPrevista, paidDate: null, status: 'Cancelado' },
    ]
  }

  if (p.pacote === 'Pacote Essencial') {
    // 50/50: reserva + entrega
    const reservaDue = p.recebido
    const entregaDue = p.entregaPrevista
    return [
      { key: 'reserva', label: 'Reserva 50%',       percent: 50, value: p.preco * 0.50, dueDate: reservaDue, paidDate: reservaDue, status: 'Recebido', metodo: 'Transferência' },
      { key: 'entrega', label: 'Entrega Final 50%', percent: 50, value: p.preco * 0.50, dueDate: entregaDue, paidDate: p.finalEntregue ? entregaDue : null, status: p.finalEntregue ? 'Recebido' : (comparePtDate(entregaDue, TODAY) < 0 ? 'Atrasado' : 'A receber'), metodo: p.finalEntregue ? 'Transferência' : undefined },
    ]
  }

  // Premium: 30/40/30
  const reservaDue   = p.recebido
  const casamentoDue = p.dataCasamento
  const entregaDue   = addDaysPt(p.entregaPrevista, -2)

  // status casamento: já pago se data casamento passou
  const casamentoPago = comparePtDate(p.dataCasamento, TODAY) < 0
  // status entrega: só Recebido se finalEntregue + aprovação cliente
  const entregaPago = p.finalEntregue && p.approval === 'Aprovado Cliente'

  return [
    {
      key: 'reserva',
      label: 'Reserva 30%',
      percent: 30,
      value: p.preco * 0.30,
      dueDate: reservaDue,
      paidDate: reservaDue,
      status: 'Recebido',
      metodo: 'Transferência',
    },
    {
      key: 'casamento',
      label: 'Dia do Casamento 40%',
      percent: 40,
      value: p.preco * 0.40,
      dueDate: casamentoDue,
      paidDate: casamentoPago ? casamentoDue : null,
      status: casamentoPago ? 'Recebido' : (comparePtDate(casamentoDue, TODAY) < 0 ? 'Atrasado' : 'A receber'),
      metodo: casamentoPago ? 'MB Way' : undefined,
    },
    {
      key: 'entrega',
      label: 'Entrega Final 30%',
      percent: 30,
      value: p.preco * 0.30,
      dueDate: entregaDue,
      paidDate: entregaPago ? entregaDue : null,
      status: entregaPago ? 'Recebido' : (comparePtDate(entregaDue, TODAY) < 0 ? 'Atrasado' : 'A receber'),
      metodo: entregaPago ? 'Transferência' : undefined,
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

