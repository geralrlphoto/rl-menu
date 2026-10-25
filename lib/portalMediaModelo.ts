import { randomBytes } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

// Modelo do Road Map dos portais RL PROD (Briefing → Proposta → Planeamento → … → Entrega).
// Usado no "Novo portal" e no portal criado ao qualificar uma lead.

export const ROADMAP_RLPROD = [
  {
    id: 'briefing', titulo: 'Briefing', cor: 'blue',
    tarefas: [
      { id: 'b1', titulo: 'Primeiro Contato',    estado: 'nao_iniciada', data: '' },
      { id: 'b2', titulo: 'Formulário Briefing', estado: 'nao_iniciada', data: '' },
      { id: 'b3', titulo: 'Reunião de Briefing', estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'proposta', titulo: 'Proposta', cor: 'cyan',
    tarefas: [
      { id: 'p1', titulo: 'Análise de Requisitos', estado: 'nao_iniciada', data: '' },
      { id: 'p2', titulo: 'Criação da Proposta',   estado: 'nao_iniciada', data: '' },
      { id: 'p3', titulo: 'Apresentação',          estado: 'nao_iniciada', data: '' },
      { id: 'p4', titulo: 'Adjudicação',           estado: 'nao_iniciada', data: '' },
      { id: 'p5', titulo: 'CPS Assinado',          estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'planeamento', titulo: 'Planeamento', cor: 'yellow',
    tarefas: [
      { id: 'pl1', titulo: 'Definição de Datas',       estado: 'nao_iniciada', data: '' },
      { id: 'pl2', titulo: 'Seleção de Staff',          estado: 'nao_iniciada', data: '' },
      { id: 'pl3', titulo: 'Logística e Equipamento',   estado: 'nao_iniciada', data: '' },
      { id: 'pl4', titulo: 'Storytelling / Guião',      estado: 'nao_iniciada', data: '' },
      { id: 'pl5', titulo: 'Vistoria ao Local',         estado: 'nao_iniciada', data: '' },
      { id: 'pl6', titulo: 'Data Captação Confirmada',  estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'pre-producao', titulo: 'Pré-Produção', cor: 'purple',
    tarefas: [
      { id: 'pr1', titulo: 'Briefing de Staff',            estado: 'nao_iniciada', data: '' },
      { id: 'pr2', titulo: 'Organização de Equipamento',   estado: 'nao_iniciada', data: '' },
      { id: 'pr3', titulo: 'Confirmar Datas com Cliente',  estado: 'nao_iniciada', data: '' },
      { id: 'pr4', titulo: 'Preparação de Materiais',      estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'producao', titulo: 'Produção', cor: 'orange',
    tarefas: [
      { id: 'prod1', titulo: 'Captação de Conteúdo',  estado: 'nao_iniciada', data: '' },
      { id: 'prod2', titulo: 'Fotografia de Produto', estado: 'nao_iniciada', data: '' },
      { id: 'prod3', titulo: 'Vídeo Institucional',   estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'pos-producao', titulo: 'Pós-Produção', cor: 'violet',
    tarefas: [
      { id: 'pp1', titulo: 'Arquivo e Organização', estado: 'nao_iniciada', data: '' },
      { id: 'pp2', titulo: 'Edição de Vídeo',        estado: 'nao_iniciada', data: '' },
      { id: 'pp3', titulo: 'Edição de Fotografias',  estado: 'nao_iniciada', data: '' },
      { id: 'pp4', titulo: 'Color Grading',           estado: 'nao_iniciada', data: '' },
      { id: 'pp5', titulo: 'Revisão Interna',         estado: 'nao_iniciada', data: '' },
      { id: 'pp6', titulo: 'Revisão do Cliente',      estado: 'nao_iniciada', data: '' },
    ],
  },
  {
    id: 'entrega', titulo: 'Entrega', cor: 'emerald',
    tarefas: [
      { id: 'e1', titulo: 'Exportação Final',       estado: 'nao_iniciada', data: '' },
      { id: 'e2', titulo: 'Entrega de Ficheiros',   estado: 'nao_iniciada', data: '' },
      { id: 'e3', titulo: 'Fatura Final',           estado: 'nao_iniciada', data: '' },
      { id: 'e4', titulo: 'Avaliação / Satisfação', estado: 'nao_iniciada', data: '' },
    ],
  },
]

// Fases do portal de um projeto RL PROD que acabou de ser qualificado
export const FASES_RLPROD = [
  { id: 'primeiro-contato', nome: 'Primeiro Contacto',  descricao: 'Quando nos contactaste e falámos pela primeira vez.',              estado: 'concluido' },
  { id: 'briefing-inicial', nome: 'Briefing Inicial',   descricao: 'Briefing realizado durante a nossa primeira reunião.',            estado: 'em_curso'  },
  { id: 'proposta-base',    nome: 'Proposta',           descricao: 'Proposta com base nas informações recolhidas.',                   estado: 'pendente'  },
  { id: 'adjudicacao',      nome: 'Adjudicação',        descricao: 'A proposta é aprovada e iniciamos o processo.',                   estado: 'pendente'  },
  { id: 'elaboracao-cps',   nome: 'Elaboração do CPS',  descricao: 'Recolha dos dados para o contrato de prestação de serviços.',     estado: 'pendente'  },
  { id: 'cps',              nome: 'CPS · Contrato',     descricao: 'Contrato de Prestação de Serviços a assinar e devolver.',         estado: 'pendente'  },
  { id: 'planeamento',      nome: 'Planeamento',        descricao: 'Definição de como e quando tudo vai acontecer.',                  estado: 'pendente'  },
  { id: 'producao',         nome: 'Produção',           descricao: 'Dia de filmagem em locação.',                                     estado: 'pendente'  },
  { id: 'pos-producao',     nome: 'Pós-Produção',       descricao: 'Edição e criação dos conteúdos captados.',                        estado: 'pendente'  },
  { id: 'aprovacao',        nome: 'Aprovação',          descricao: 'Avaliação dos conteúdos e ronda de revisões.',                    estado: 'pendente'  },
  { id: 'entrega',          nome: 'Entrega Final',      descricao: 'Entrega de todos os conteúdos acordados.',                        estado: 'pendente'  },
]

type LeadParaPortal = { nome?: string | null; empresa?: string | null; email?: string | null; telefone?: string | null; tipo?: string | null; ramo?: string | null; mensagem?: string | null }

// Dados iniciais do portal criado ao passar uma lead a "Qualificado".
// Fica em "Novos projetos" (ainda não enviado) até carregares em "Enviar portal".
export function dadosPortalDaLead(lead: LeadParaPortal, ref: string) {
  const nome = (lead.empresa || lead.nome || ref).trim()
  return {
    ref,
    nome,
    cliente: nome,
    tipo: lead.tipo || 'Produção Photography & Video',
    local: '',
    dataFilmagem: '',
    dataEntrega: '',
    gestorNome: 'Rui Lima',
    gestorEmail: 'geral@rlprod.pt',
    gestorTelefone: '+351 912 932 768',
    status: 'Em Produção',
    revisoes: { usadas: 0, total: 3 },
    fases: FASES_RLPROD,
    pagamentos: [],
    entregas: [],
    roadmap: ROADMAP_RLPROD,
    briefingItems: [
      ...(lead.empresa ? [{ label: 'Empresa / Marca', desc: lead.empresa }] : []),
      ...(lead.ramo ? [{ label: 'Ramo', desc: lead.ramo }] : []),
      ...(lead.mensagem ? [{ label: 'Pedido inicial', desc: lead.mensagem }] : []),
    ],
    fichaCliente: {
      nome: lead.nome || '',
      empresa: lead.empresa || '',
      email: lead.email || '',
      telefone: lead.telefone || '',
      representanteLegal: lead.nome || '',
    },
    origemLead: true,
  }
}

// Cria (uma só vez) o portal do projeto de uma lead e guarda a referência em media_leads.portal_ref
export async function portalDaLead(supabase: SupabaseClient, id: string): Promise<string | null> {
  const { data: lead } = await supabase.from('media_leads')
    .select('nome, empresa, email, telefone, tipo, ramo, mensagem, page_token, portal_ref').eq('id', id).maybeSingle()
  if (!lead) return null
  if (lead.portal_ref) return lead.portal_ref

  // Se já existe um portal com o token da proposta, usa esse; senão cria uma referência nova
  let ref = lead.page_token ? String(lead.page_token).toUpperCase() : ''
  if (ref) {
    const { data: existe } = await supabase.from('media_portais').select('ref').eq('ref', ref).maybeSingle()
    if (existe) {
      await supabase.from('media_leads').update({ portal_ref: ref }).eq('id', id)
      return ref
    }
  } else {
    ref = randomBytes(12).toString('hex').toUpperCase()
  }

  const { error } = await supabase.from('media_portais')
    .insert({ ref, dados: dadosPortalDaLead(lead, ref), updated_at: new Date().toISOString() })
  if (error) return null
  await supabase.from('media_leads').update({ portal_ref: ref }).eq('id', id)
  return ref
}
