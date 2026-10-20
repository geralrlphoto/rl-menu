// Tickets por email aos editores de vídeo, no card da equipa (lib/cardEquipa.ts):
//  · Ticket de Edição: quando é nomeado (PATCH /api/evento-equipa com editor_video)
//  · Ticket de Aprovação: quando a RL aprova o vídeo (PATCH /api/painel-editor/video-revisao)

import { SITE_URL } from '@/lib/site-url'
import { buildCardEquipa, blocoLista, blocoTexto, ESPACO } from '@/lib/cardEquipa'
import { dataBilhete, nomesBilhete } from '@/lib/bilheteNoivos'

export type TicketEditor = {
  numero: string            // ED-<referência>
  editor: string
  noivos: string
  dataCasamento: string | null   // AAAA-MM-DD
  local: string | null
  prazo: string | null           // AAAA-MM-DD (casamento + 180 dias úteis)
  atribuidoEm: Date
}

const PRAZO_DIAS_UTEIS = 180

/** Casamento + 180 dias úteis (seg a sex), como no resto da app. */
export function prazoVideo(dataCasamento: string | null): string | null {
  if (!dataCasamento) return null
  const d = new Date(dataCasamento.slice(0, 10) + 'T12:00:00Z')
  if (isNaN(d.getTime())) return null
  let n = 0
  while (n < PRAZO_DIAS_UTEIS) {
    d.setUTCDate(d.getUTCDate() + 1)
    const w = d.getUTCDay()
    if (w !== 0 && w !== 6) n++
  }
  return d.toISOString().slice(0, 10)
}

const dataLonga = (iso: string) => new Date(iso.slice(0, 10) + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' })

export type TicketAprovacao = {
  numero: string            // AP-<referência>
  editor: string
  noivos: string
  local: string | null
  link: string | null       // link de revisão aprovado
  feedback: string | null   // notas da RL (opcional)
  aprovadoEm: Date
}

const dataHoje = (d: Date) => d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Lisbon' })
const painel = `${SITE_URL}/painel-editor`

export function buildTicketEditorHtml(t: TicketEditor): string {
  return buildCardEquipa({
    pill: 'Ticket de Edição', nome: t.editor, funcao: 'Editor', contexto: 'Vídeo',
    frase: `Foste nomeado editor de vídeo do casamento da ${nomesBilhete(t.noivos) || t.noivos}. Aqui fica o essencial.`,
    campos: [
      { k: 'Nº do ticket', v: t.numero, mono: true },
      { k: 'Atribuído em', v: dataHoje(t.atribuidoEm), mono: true },
      { k: 'Casamento', v: nomesBilhete(t.noivos) || t.noivos },
      { k: 'Data', v: dataBilhete(t.dataCasamento), mono: true },
      { k: 'Local', v: t.local ?? '' },
      { k: 'Prazo do filme', v: t.prazo ? dataLonga(t.prazo) : '' },
    ],
    extra: blocoLista('Próximos passos', [
      ['Confirmar', 'Abre o teu painel e confirma que recebeste o projeto e os ficheiros (até 2 dias).'],
      ['Teaser / Trailer', 'Primeira peça para os noivos partilharem. Objetivo: 4 semanas.'],
      ['Montagem', 'Filme com cor e áudio dos votos e discursos. Vai mudando a fase no painel.'],
      ['Revisão', 'Envia o link de revisão no painel. A RL revê e manda as notas.'],
    ]),
    cta: { label: 'Abrir o meu painel', url: painel },
    nota: 'O projeto já está no teu Painel do Editor.',
    preheader: `Ticket de Edição · ${t.noivos}`,
  })
}

export function buildTicketAprovacaoHtml(t: TicketAprovacao): string {
  return buildCardEquipa({
    pill: 'Ticket de Aprovação', nome: t.editor, funcao: 'Editor', contexto: 'Vídeo',
    frase: `O filme do casamento da ${nomesBilhete(t.noivos) || t.noivos} foi aprovado. Obrigado pelo trabalho! Falta só fechar o projeto.`,
    campos: [
      { k: 'Nº do ticket', v: t.numero, mono: true },
      { k: 'Aprovado em', v: dataHoje(t.aprovadoEm), mono: true },
      { k: 'Casamento', v: nomesBilhete(t.noivos) || t.noivos },
      { k: 'Local', v: t.local ?? '' },
    ],
    extra: (t.feedback?.trim() ? blocoTexto('Notas da RL', t.feedback.trim()) + ESPACO : '') + blocoLista('Próximos passos', [
      ['Master', 'Exporta a versão final em alta qualidade.'],
      ['Finalizado', 'Muda a fase do projeto para Finalizado no teu painel.'],
      ['Entrega', 'Envia o master pelo painel. A RL faz a entrega aos noivos no portal.'],
      ['Arquivo', 'Guarda o projeto e o master no NAS.'],
    ]),
    cta: { label: t.link ? 'Ver a versão aprovada' : 'Abrir o meu painel', url: t.link || painel },
    nota: 'O projeto continua no teu Painel do Editor até à entrega.',
    preheader: `Ticket de Aprovação · ${t.noivos}`,
  })
}
