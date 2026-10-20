// Restantes emails aos noivos (e aos casais que ainda são leads), todos no bilhete
// (lib/bilheteNoivos.ts). Partilhados entre as rotas de envio e a página Tickets.
import { buildBilheteNoivos, blocoTexto, blocoDestaque, nomesBilhete } from './bilheteNoivos'

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt').replace(/\/+$/, '')
const ADMIN_EMAIL = 'geral.rlphoto@gmail.com'
const ESPACO = '<div style="height:16px;font-size:0;line-height:0;">&nbsp;</div>'
const tipoDe = (batizado?: boolean) => (batizado ? 'batizado' : 'casamento') as 'casamento' | 'batizado'
const nomesOu = (n?: string | null, alt = 'Para vocês') => nomesBilhete(n) || alt

/** "🔔 <título>": notificação escrita na ficha do evento (notificacao-noivos). */
export function emailNotificacaoNoivos(o: { titulo: string; texto: string; nomes?: string | null; data?: string | null; portalUrl: string; batizado?: boolean }): string {
  return buildBilheteNoivos({
    pill: 'Nova notificação', nomes: nomesOu(o.nomes), data: o.data, tipo: tipoDe(o.batizado),
    frase: o.titulo,
    extra: blocoTexto('Mensagem', o.texto),
    cta: { label: 'Ver no portal', url: o.portalUrl },
    nota: 'Fica também no sino do vosso portal.',
    preheader: o.titulo,
  })
}

/** "RE: <assunto>": resposta da RL a uma mensagem dos noivos (tarefas/[id]). */
export function emailRespostaNoivos(o: { nomes?: string | null; titulo?: string | null; resposta: string; mensagemOriginal?: string | null; data?: string | null; portalUrl?: string; batizado?: boolean }): string {
  return buildBilheteNoivos({
    pill: 'Resposta da nossa equipa', nomes: nomesOu(o.nomes), data: o.data, tipo: tipoDe(o.batizado),
    frase: o.titulo ? `Sobre: ${o.titulo}` : 'Respondemos à vossa mensagem.',
    extra: blocoTexto('A nossa resposta', o.resposta) + (o.mensagemOriginal ? ESPACO + blocoTexto('A vossa mensagem', o.mensagemOriginal) : ''),
    cta: o.portalUrl ? { label: 'Abrir o nosso portal', url: o.portalUrl } : null,
    nota: 'Com os melhores cumprimentos, RL Photo · Video',
    preheader: 'Respondemos à vossa mensagem.',
  })
}

/** "📋 Nova tarefa" / "✓ Tarefa concluída" no portal (send-task-email). */
export function emailTarefaNoivos(o: { nome: string; taskText: string; url: string; tipo: 'casamento' | 'batizado'; kind: 'new' | 'completed'; data?: string | null }): string {
  const feita = o.kind === 'completed'
  return buildBilheteNoivos({
    pill: feita ? 'Tarefa concluída' : 'Nova tarefa', nomes: nomesOu(o.nome), data: o.data, tipo: o.tipo,
    frase: feita
      ? 'Continuamos atentos a todas as etapas até ao grande dia. Podem acompanhar o ponto de situação no vosso portal.'
      : 'Acabámos de adicionar uma nova tarefa no vosso portal. Quando estiver concluída, vão receber a confirmação.',
    extra: blocoTexto(feita ? '✓ Concluída' : 'Tarefa', o.taskText),
    cta: { label: 'Abrir o nosso portal', url: o.url },
    preheader: o.taskText,
  })
}

/** "O vosso Pré-Wedding": convite para marcarem a sessão (portal-notif-prewedding). */
export function emailMarcarPreWedding(o: { nomes?: string | null; data?: string | null; local?: string | null; portalUrl: string }): string {
  return buildBilheteNoivos({
    pill: 'O vosso pré-wedding', nomes: nomesOu(o.nomes), data: o.data,
    frase: 'Está na hora de marcarem a vossa sessão pré-wedding. Escolham no portal o dia que vos fica melhor.',
    campos: [
      { k: 'Casamento', v: o.local ?? '' },
      { k: 'No portal', v: 'Guia Pré-Wedding' },
    ],
    cta: { label: 'Marcar a sessão', url: o.portalUrl },
    preheader: 'Está na hora de marcarem a vossa sessão pré-wedding.',
  })
}

/** "📅 Pré-wedding reservado": confirmação aos noivos (send-admin-notification). */
export function emailPreWeddingReservado(o: { nomes?: string | null; referencia?: string | null; dataSessao?: string | null; local?: string | null; portalUrl?: string }): string {
  return buildBilheteNoivos({
    pill: 'Pré-wedding reservado', nomes: nomesOu(o.nomes),
    frase: 'A vossa sessão está confirmada. Entraremos em contacto com mais detalhes.',
    campos: [
      { k: 'Data da sessão', v: o.dataSessao ?? '' },
      { k: 'Hora / Local', v: o.local ?? '' },
      { k: 'Referência', v: o.referencia ?? '', mono: true },
    ],
    cta: o.portalUrl ? { label: 'Abrir o nosso portal', url: o.portalUrl } : null,
    preheader: 'A vossa sessão pré-wedding está confirmada.',
  })
}

/** "Faltam 60 dias · preparámos algo para vocês" (proposta de pré-wedding agendada). */
export function emailPropostaPreWedding(o: { nomes?: string | null; data?: string | null; url: string }): string {
  return buildBilheteNoivos({
    pill: 'Faltam 60 dias', nomes: nomesOu(o.nomes, 'Noivos'), data: o.data,
    frase: 'Preparámos algo para vocês.',
    texto: 'Faltam dois meses para o vosso casamento. Antes de entrarmos na reta final, preparámos uma página só para vocês, com uma coisa que faz toda a diferença no resultado do dia.',
    cta: { label: 'Ver a página', url: o.url },
    nota: 'Falamos em breve, Rui · RL Photo.Video',
    preheader: 'Faltam 60 dias para o vosso casamento.',
  })
}

/** "✓ Pagamento registado": comprovativo do formulário Tally (webhook-tally-pagamento). */
export function emailPagamentoRegistado(o: { nome_noivos: string; referencia?: string | null; valor?: string | null; forma_pagamento?: string | null; data?: string }): string {
  const batizado = /^BAT/i.test(String(o.referencia ?? ''))
  const valor = o.valor ? (o.valor.includes('€') ? o.valor : `${o.valor} €`) : ''
  return buildBilheteNoivos({
    pill: 'Pagamento registado', nomes: nomesOu(o.nome_noivos), tipo: tipoDe(batizado),
    frase: 'Recebemos o registo do vosso pagamento. Obrigado pela vossa confiança.',
    campos: [
      { k: 'Referência', v: o.referencia ?? '', mono: true },
      { k: 'Forma de pagamento', v: o.forma_pagamento ?? '' },
      { k: 'Data', v: o.data ?? '', mono: true },
    ],
    extra: valor ? blocoDestaque('Valor', valor, true) : '',
    cta: { label: 'Abrir o nosso portal', url: `${SITE}/${batizado ? 'login-batizado' : 'login-noivos'}` },
    nota: `Para qualquer questão estamos sempre disponíveis.<br>${ADMIN_EMAIL}`,
    preheader: 'Recebemos o registo do vosso pagamento.',
  })
}

/** "O vosso Portal dos Noivos está pronto": botão da ficha do evento (send-portal-email). */
export function emailPortalPronto(o: { nomes?: string | null; referencia?: string | null; password?: string | null; portalUrl: string; data?: string | null }): string {
  return buildBilheteNoivos({
    pill: 'O vosso portal', nomes: nomesOu(o.nomes, 'Noivos'), data: o.data,
    frase: 'Este é o vosso espaço exclusivo: fotos, vídeos, cronograma e muito mais.',
    campos: [
      { k: 'Referência', v: o.referencia ?? '', mono: true },
      { k: 'Palavra-passe', v: o.password ?? '', mono: true },
    ],
    cta: { label: 'Abrir o nosso portal', url: o.portalUrl },
    preheader: 'O vosso portal está pronto.',
  })
}

/** "Tens uma reunião marcada": enviado ao casal pelo CRM (send-reuniao-email). */
export function emailReuniaoMarcada(o: { nome?: string | null; dataFmt: string; hora: string; modo: string; link: string; batizado?: boolean }): string {
  return buildBilheteNoivos({
    pill: 'Reunião marcada', nomes: nomesOu(o.nome, 'Olá!'), tipo: tipoDe(o.batizado),
    frase: 'Temos uma conversa marcada. Estamos ansiosos por vos conhecer e ouvir a vossa história.',
    campos: [
      { k: 'Data', v: o.dataFmt },
      { k: 'Hora', v: o.hora, mono: true },
      { k: 'Modo', v: o.modo },
    ],
    cta: { label: 'Ver a reunião', url: o.link },
    preheader: `Reunião marcada · ${o.dataFmt} às ${o.hora}`,
  })
}

/** "⏰ A vossa reunião começa em 30 minutos" (lembrete-reuniao, cron). */
export function emailLembreteReuniao(o: { nome?: string | null; hora?: string | null; link?: string | null }): string {
  return buildBilheteNoivos({
    pill: 'Faltam 30 minutos', nomes: nomesOu(o.nome, 'Noivos'),
    frase: 'Falta pouco para a nossa reunião. Estamos ansiosos por vos conhecer e ouvir a vossa história.',
    campos: [{ k: 'Hora', v: o.hora ? o.hora.slice(0, 5) : '', mono: true }],
    extra: blocoDestaque('Começa em', '30 minutos', true),
    cta: o.link ? { label: 'Juntar à videochamada', url: o.link } : null,
    nota: 'Vemo-nos já de seguida!',
    preheader: 'A vossa reunião começa em 30 minutos.',
  })
}
