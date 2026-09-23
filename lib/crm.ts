// Regras partilhadas do CRM (quadro /crm, ficha /crm/[id], sino do admin e estatísticas).

export const STATUSES = ['Por Contactar','Iniciar','Contactado','Agendar Reunião','Reunião Agendada','Negociação','Follow Up 1','Follow Up 2','Follow Up 3','Fechou','NÃO FECHOU','Sem resposta','Encerrado','Cancelado']

export type ColunaKey = 'nova' | 'reuniao' | 'follow' | 'encerrada'
export const REUNIAO_STATUSES = ['Reunião Agendada']
export const FOLLOW_STATUSES = ['Negociação', 'Follow Up 1', 'Follow Up 2', 'Follow Up 3']
export const ENCERRADA_STATUSES = ['Fechou', 'NÃO FECHOU', 'Sem resposta', 'Encerrado', 'Cancelado']

// Status aplicado quando um cartão é largado numa coluna (Encerrada pergunta ao utilizador)
export const DROP_STATUS: Record<Exclude<ColunaKey, 'encerrada'>, string> = {
  nova: 'Por Contactar',
  reuniao: 'Reunião Agendada',
  follow: 'Negociação',
}

export function colunaDe(status: string | null | undefined): ColunaKey {
  const s = status ?? ''
  if (REUNIAO_STATUSES.includes(s)) return 'reuniao'
  if (FOLLOW_STATUSES.includes(s)) return 'follow'
  if (ENCERRADA_STATUSES.includes(s)) return 'encerrada'
  return 'nova'
}

export const MOTIVOS_NAO_FECHOU = ['Preço', 'Data ocupada', 'Escolheram outro fornecedor', 'Sem resposta', 'Desistiram do serviço', 'Outro']

// Dias parado no mesmo passo do Follow Up sem próxima ação agendada
export const FOLLOW_PARADO_DIAS = 5

export function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return 0
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return 0
  return Math.floor((Date.now() - d.getTime()) / 86400000)
}

export function hojeISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 'atrasada' | 'hoje' | 'futura' | null
export function estadoAcao(data: string | null | undefined): 'atrasada' | 'hoje' | 'futura' | null {
  if (!data) return null
  const hoje = hojeISO()
  const d = data.slice(0, 10)
  return d < hoje ? 'atrasada' : d === hoje ? 'hoje' : 'futura'
}

export function fmtDataCurta(data: string | null | undefined): string {
  if (!data) return ''
  const d = new Date(data.length === 10 ? data + 'T00:00:00' : data)
  if (isNaN(d.getTime())) return data
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}

export function parseOrcamento(v: string | null | undefined): number {
  const n = parseFloat((v ?? '').toString().replace(/[^\d.,]/g, '').replace(',', '.'))
  return isNaN(n) ? 0 : n
}

// Número para wa.me: só dígitos; números PT de 9 dígitos ganham o 351
export function whatsappLink(contato: string | null | undefined, texto?: string): string | null {
  let n = (contato ?? '').replace(/[^\d+]/g, '')
  if (!n) return null
  if (n.startsWith('+')) n = n.slice(1)
  else if (n.startsWith('00')) n = n.slice(2)
  else if (n.length === 9) n = '351' + n
  if (n.length < 9) return null
  return texto ? `https://wa.me/${n}?text=${encodeURIComponent(texto)}` : `https://wa.me/${n}`
}

const ASSINATURA = ['Com os melhores cumprimentos,', 'RL PhotoVideo', '', 'Visite-nos: www.rlphotovideo.pt']

function quandoReuniao(data?: string | null, hora?: string | null): string {
  const h = (hora ?? '').slice(0, 5)
  const m = (data ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? `${m[3]}/${m[2]}` : ''
  return [d && `dia ${d}`, h && `às ${h}`].filter(Boolean).join(' ')
}

/* Lembrete enviado 1 hora antes da reunião */
export function mensagemLembreteReuniao(nome: string | null | undefined, hora?: string | null): string {
  const quem = (nome ?? '').trim()
  const h = (hora ?? '').slice(0, 5)
  return [
    `Olá${quem ? ' ' + quem : ''}! 🤍`,
    '',
    `Falta 1 hora para a nossa reunião${h ? ` (hoje às ${h})` : ''}.`,
    '',
    'Para entrarem, acedam ao link da reunião através do vosso portal.',
    '',
    'Recomendamos que assistam à reunião através de um computador, para uma melhor experiência.',
    '',
    'Até já!',
    '',
    ...ASSINATURA,
  ].join('\n')
}

/* Envio do portal da reunião (o link da reunião está dentro do portal) */
export function mensagemPortalReuniao(nome: string | null | undefined, portalUrl: string, data?: string | null, hora?: string | null): string {
  const quem = (nome ?? '').trim()
  const quando = quandoReuniao(data, hora)
  return [
    `Olá${quem ? ' ' + quem : ''}! 🤍`,
    '',
    `Aqui está o vosso portal da reunião${quando ? `, marcada para ${quando}` : ''}:`,
    portalUrl,
    '',
    'No portal encontram o link de acesso à reunião. Recomendamos que assistam através de um computador.',
    '',
    ...ASSINATURA,
  ].join('\n')
}

/* Mensagem de boas-vindas enviada às leads da coluna NOVA ENTRADA */
export function mensagemBoasVindas(nome: string | null | undefined): string {
  const quem = (nome ?? '').trim()
  return [
    `Olá${quem ? ' ' + quem : ''}! 🤍`,
    '',
    'Obrigado pelo vosso contacto. Já recebemos e lemos com atenção as respostas ao vosso formulário.',
    '',
    'Gostávamos de vos ligar para uma conversa rápida de apenas 2 minutos, sem vos tomar muito tempo.',
    '',
    'Que dia e hora durante a semana vos dá mais jeito?',
    '',
    ...ASSINATURA,
  ].join('\n')
}

export function telLink(contato: string | null | undefined): string | null {
  const n = (contato ?? '').replace(/[^\d+]/g, '')
  return n.length >= 9 ? `tel:${n}` : null
}
