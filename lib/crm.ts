// Regras partilhadas do CRM (quadro /crm, ficha /crm/[id], sino do admin e estatísticas).
import { linkPublico } from '@/lib/site-url'

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
const ASSINATURA_ABRACO = ['Um abraço grande,', 'RL PhotoVideo', '', 'Visite-nos: www.rlphotovideo.pt']

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
    `Olá${quem ? ' ' + quem : ''}!`,
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
    `Olá${quem ? ' ' + quem : ''}!`,
    '',
    `Aqui está o vosso portal da reunião${quando ? `, marcada para ${quando}` : ''}:`,
    portalUrl,
    '',
    'No portal encontram o link de acesso à reunião. Recomendamos que assistam através de um computador.',
    '',
    ...ASSINATURA,
  ].join('\n')
}

/* Follow up pelo WhatsApp: só fica disponível 3 dias depois da reunião */
export const FOLLOW_WA_DIAS = 3
/* 2.º follow up: 8 dias depois do 1.º, se não houver resposta */
export const FOLLOW2_WA_DIAS = 8

// Dias que faltam para passarem `dias` dias sobre `data` (0 = já pode enviar)
export function diasParaFollowUp(data: string | null | undefined, dias = FOLLOW_WA_DIAS): number {
  let ymd = data ?? ''
  if (ymd.length > 10) {
    // timestamp: usa o dia local
    const d = new Date(ymd)
    if (!isNaN(d.getTime())) ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return 0
  const [hy, hm, hd] = hojeISO().split('-').map(Number)
  const passados = Math.round((Date.UTC(hy, hm - 1, hd) - Date.UTC(+m[1], +m[2] - 1, +m[3])) / 86400000)
  return Math.max(0, dias - passados)
}

export function mensagemFollowUp2(nome: string | null | undefined, dataCasamento?: string | null): string {
  const quem = (nome ?? '').trim()
  const m = (dataCasamento ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  const dia = m ? ` (${m[3]}/${m[2]}/${m[1]})` : ''
  return [
    `Olá${quem ? ' ' + quem : ''}!`,
    '',
    `Sabemos que preparar um casamento traz mil decisões ao mesmo tempo, e não queremos ser mais uma preocupação. Só não queríamos deixar de vos dizer, uma última vez, o quanto gostávamos de estar convosco no vosso dia${dia}.`,
    '',
    'Continuamos a pensar em vocês e na história que queremos contar: aquele primeiro olhar, o abraço apertado dos vossos pais, a pista cheia até ao fim da noite. São momentos que só acontecem uma vez e merecem ser guardados por quem sente verdadeiramente o vosso dia.',
    '',
    'A vossa data ainda está livre na nossa agenda, mas não a conseguimos segurar por muito mais tempo. Se o vosso coração também diz que sim, basta uma mensagem e fica reservada só para vocês.',
    '',
    'E se entretanto escolheram outro caminho, está tudo bem. Foi um prazer enorme conhecer-vos e desejamos-vos um dia inesquecível.',
    '',
    'Um abraço grande,',
    'RL PhotoVideo',
    '',
    'Visite-nos: www.rlphotovideo.pt',
  ].join('\n')
}

export function mensagemFollowUp(nome: string | null | undefined, dataCasamento?: string | null): string {
  const quem = (nome ?? '').trim()
  const m = (dataCasamento ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  const dia = m ? ` (${m[3]}/${m[2]}/${m[1]})` : ''
  return [
    `Olá${quem ? ' ' + quem : ''}!`,
    '',
    'Ainda estamos a sorrir com a nossa reunião. Há casais com quem sentimos logo que existe algo especial, e convosco foi exatamente assim. A vossa energia, a cumplicidade entre os dois, a forma como falaram do vosso dia... é isto que nos faz amar o que fazemos.',
    '',
    `Já nos imaginamos no vosso casamento${dia}: os nervos antes da cerimónia, os olhares trocados quando ninguém está a ver, as gargalhadas na festa, as lágrimas de quem mais gosta de vocês. Queremos muito ser nós a guardar tudo isso para sempre.`,
    '',
    'Por isso, gostávamos de bloquear já a vossa data na nossa agenda, antes que outro casal a reserve. Basta um "sim" da vossa parte e o dia fica guardado só para vocês.',
    '',
    'Se ainda tiverem alguma dúvida, estamos aqui para vos ajudar em tudo o que precisarem.',
    '',
    'Um abraço grande,',
    'RL PhotoVideo',
    '',
    'Visite-nos: www.rlphotovideo.pt',
  ].join('\n')
}

/* Fecho: o casal aceitou a proposta (só na coluna Follow Up) */
export function mensagemFecho(nome: string | null | undefined, dataCasamento?: string | null, portalUrl?: string | null): string {
  const quem = (nome ?? '').trim()
  const m = (dataCasamento ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  const dia = m ? ` (${m[3]}/${m[2]}/${m[1]})` : ''
  return [
    `Olá${quem ? ' ' + quem : ''}!`,
    '',
    `Que alegria enorme! Muito obrigado por nos escolherem para contar a vossa história. É uma honra fazer parte do vosso casamento${dia} e mal podemos esperar por esse dia.`,
    '',
    'Para avançarmos, só precisam de:',
    `1. Aceder ao vosso portal da reunião${portalUrl ? `: ${portalUrl}` : ''}`,
    '2. Confirmar a proposta',
    '3. Preencher o formulário com os vossos dados',
    '',
    'Assim que recebermos os vossos dados, vamos preparar o vosso portal dos noivos e o contrato.',
    '',
    'Importante: quando receberem o portal dos noivos, têm 48 horas para efetuar a reserva. Só assim o vosso dia fica efetivamente reservado na nossa agenda.',
    '',
    'Mais uma vez, obrigado pela vossa confiança. Vamos criar juntos memórias para a vida!',
    '',
    'Um abraço grande,',
    'RL PhotoVideo',
    '',
    'Visite-nos: www.rlphotovideo.pt',
  ].join('\n')
}

/* "Ana e Pedro" a partir dos primeiros nomes; senão o campo cliente arrumado */
export function nomeNoivos(cliente?: string | null, nomeNoiva?: string | null, nomeNoivo?: string | null): string {
  const primeiro = (n?: string | null) => (n ?? '').trim().split(/\s+/)[0] ?? ''
  const cap = (s: string) => s.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()).replace(/ E /g, ' e ')
  const a = primeiro(nomeNoiva), b = primeiro(nomeNoivo)
  if (a && b) return cap(`${a} e ${b}`)
  const c = (cliente ?? '').trim()
  return c ? cap(c) : a || b ? cap(a || b) : ''
}

/* Reunião de preparação do dia: ~15 dias antes do casamento (ficha do evento e /photo) */
export const PREPARACAO_DIAS = 15
/* Sala fixa de videochamada da RL (a mesma das reuniões do CRM) */
export const MEET_LINK = 'https://meet.google.com/dih-etvh-xkh'

/* Batizado: tipo_evento vem como texto JSON (["BATIZADO"]) ou array */
export function ehBatizado(tipoEvento: unknown): boolean {
  return /batiz/i.test(typeof tipoEvento === 'string' ? tipoEvento : JSON.stringify(tipoEvento ?? ''))
}

/* "o batizado do Vicente" com o primeiro nome da criança; sem nome, "o batizado" */
export function oBatizado(crianca?: string | null): string {
  const n = (crianca ?? '').trim().split(/\s+/)[0]
  return n ? `o batizado de ${n}` : 'o batizado'
}

export function mensagemReuniaoPreparacao(nome: string | null | undefined, eventoId?: string | null, batizado?: { crianca?: string | null } | null): string {
  const quem = (nome ?? '').trim()
  const link = eventoId ? linkPublico(`/preparacao/${eventoId}`) : null
  const evento = batizado ? oBatizado(batizado.crianca) : 'o vosso casamento'
  return [
    `Olá${quem ? ' ' + quem : ''}!`,
    '',
    `Está quase! Faltam cerca de duas semanas para ${evento} e nós já estamos a contar os dias.`,
    '',
    `Gostávamos de marcar uma pequena reunião convosco para falarmos sobre ${batizado ? 'esse dia' : 'o vosso dia'}: os horários, algumas dicas e sugestões nossas, e ajustar os últimos detalhes para que tudo corra na perfeição e vocês só tenham de aproveitar.`,
    '',
    ...(link
      ? [`A reunião é por videochamada. Neste link preencham primeiro o briefing ${batizado ? 'do batizado' : 'do vosso dia'} e, depois de o enviarem, escolham o dia e a hora que vos dá mais jeito:`, link]
      : ['A reunião é por videochamada. Que dia e hora vos dá mais jeito nos próximos dias?']),
    '',
    'No dia e à hora marcados, é só entrarem na videochamada por este link:',
    MEET_LINK,
    ...(link
      ? ['', 'Se precisarem de alterar a data, basta voltarem ao mesmo link e clicarem em "Alterar data da reunião". O calendário volta a aparecer com os horários disponíveis.']
      : []),
    '',
    ...ASSINATURA_ABRACO,
  ].join('\n')
}

/* Lembrete: o link foi enviado há 3 dias e o briefing continua por preencher */
export const LEMBRETE_BRIEFING_DIAS = 3

export function mensagemLembreteBriefing(nome: string | null | undefined, eventoId: string, batizado?: { crianca?: string | null } | null): string {
  const quem = (nome ?? '').trim()
  return [
    `Olá${quem ? ' ' + quem : ''}!`,
    '',
    'Esperamos que esteja tudo a correr bem com os preparativos.',
    '',
    `Passámos só para lembrar que ainda falta preencher o briefing ${batizado ? 'do batizado' : 'do vosso dia'}. Leva poucos minutos e ajuda-nos muito a preparar a nossa reunião e ${batizado ? 'esse dia' : 'o vosso dia'}. Depois de o enviarem, já podem escolher o dia e a hora da reunião:`,
    linkPublico(`/preparacao/${eventoId}`),
    '',
    'Qualquer dúvida, estamos aqui para vos ajudar.',
    '',
    ...ASSINATURA_ABRACO,
  ].join('\n')
}

/* Lembrete 1 hora antes da reunião de preparação (videochamada) */
export function mensagemLembretePreparacao(nome: string | null | undefined, hora?: string | null): string {
  const quem = (nome ?? '').trim()
  const h = (hora ?? '').slice(0, 5)
  return [
    `Olá${quem ? ' ' + quem : ''}!`,
    '',
    `Daqui a 1 hora${h ? ` (às ${h})` : ''} temos a nossa videochamada de preparação.`,
    '',
    'Para entrarem, basta clicarem neste link:',
    MEET_LINK,
    '',
    'Recomendamos que usem um computador, para uma melhor experiência.',
    '',
    'Até já!',
    '',
    ...ASSINATURA_ABRACO,
  ].join('\n')
}

/* Sessão pré-wedding: alerta no /photo a 30 dias do casamento (se tiver o serviço) */
export const PREWEDDING_ALERTA_DIAS = 30

export function mensagemPreWedding(nome: string | null | undefined, eventoId: string): string {
  const quem = (nome ?? '').trim()
  return [
    `Olá${quem ? ' ' + quem : ''}!`,
    '',
    'Chegou uma das partes que mais adoramos: a vossa sessão pré-wedding! É o momento perfeito para ficarem à vontade connosco e com a câmara, e para criarmos juntos imagens lindas antes do grande dia.',
    '',
    'Escolham aqui o dia, a hora e o local que mais gostarem, entre os que temos disponíveis:',
    linkPublico(`/prewedding/${eventoId}`),
    '',
    'Se precisarem de alterar a data, basta voltarem ao mesmo link e clicarem em "Alterar data da sessão".',
    '',
    ...ASSINATURA_ABRACO,
  ].join('\n')
}

/* Lembrar a marcação do pré-wedding: link enviado há 5 dias e sessão por marcar */
export const LEMBRETE_PREWEDDING_DIAS = 5

export function mensagemLembreteMarcarPreWedding(nome: string | null | undefined, eventoId: string): string {
  const quem = (nome ?? '').trim()
  return [
    `Olá${quem ? ' ' + quem : ''}!`,
    '',
    'Esperamos que esteja tudo a correr bem com os preparativos.',
    '',
    'Passámos só para lembrar que ainda falta escolherem o dia da vossa sessão pré-wedding. Estamos mesmo com vontade de a fazer convosco! Os horários disponíveis estão aqui:',
    linkPublico(`/prewedding/${eventoId}`),
    '',
    'Se nenhum dia vos der jeito, digam-nos e combinamos juntos.',
    '',
    ...ASSINATURA_ABRACO,
  ].join('\n')
}

/* Lembrete na véspera da sessão pré-wedding (hora, local e o Guia Pré-Wedding do portal) */
export function mensagemVesperaPreWedding(nome: string | null | undefined, hora?: string | null, local?: string | null, referencia?: string | null): string {
  const quem = (nome ?? '').trim()
  const h = (hora ?? '').slice(0, 5)
  const l = (local ?? '').trim()
  return [
    `Olá${quem ? ' ' + quem : ''}!`,
    '',
    `Amanhã é o dia da vossa sessão pré-wedding${h ? `, às ${h}` : ''}! Estamos mesmo entusiasmados.`,
    ...(l ? ['', `Local: ${l}`, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l)}`] : []),
    '',
    'Antes da sessão, espreitem o Guia Pré-Wedding que está dentro do vosso portal dos noivos. Lá encontram algumas dicas sobre a roupa, o que levar e como aproveitar ao máximo este momento.',
    ...(referencia ? [linkPublico(`/portal-cliente/ref/${encodeURIComponent(referencia)}`)] : []),
    '',
    'Venham descontraídos e a divertir-se. Nós tratamos do resto!',
    '',
    'Até amanhã!',
    '',
    ...ASSINATURA_ABRACO,
  ].join('\n')
}

/* Mensagem de boas-vindas enviada às leads da coluna NOVA ENTRADA */
export function mensagemBoasVindas(nome: string | null | undefined): string {
  const quem = (nome ?? '').trim()
  return [
    `Olá${quem ? ' ' + quem : ''}!`,
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
