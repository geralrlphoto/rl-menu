import { exigeAdmin } from '@/lib/api-guard'
import { buildPortalEmailV2 } from '@/lib/portalEmail'
import { buildTicketHtml } from '@/lib/ticket-html'
import { buildTicketEditorHtml, buildTicketAprovacaoHtml, prazoVideo } from '@/lib/ticket-editor-html'
import { buildTicketFilmeHtml, type PassoFilme } from '@/lib/ticket-filme-html'
import { cardPagamento } from '@/lib/pagamentoEmail'
import { ENTREGAS, buildEntregaEmailHtml, type TipoEntrega } from '@/lib/entregaEmail'
import { emailNovidadesFreelancer, emailNovoBriefing, emailTrabalhoEdicao, emailEdicaoFotos, emailCandidatura } from '@/lib/emailsFreelancers'
import { buildRecoveryEmail, buildDadosRecebidosEmail, buildNovaLeadEmail } from '@/lib/emailsClientes'

// Pré-visualização real dos emails ao cliente no mapa da jornada (/crm/follow-up).
// Usa as mesmas funções de HTML que as rotas de envio, com um casal fictício.
// GET ?k=<chave>  (portal | ticket | ticket-editor | ticket-aprovacao | filme-<passo> | pagamento | entrega-<tipo> | fl-<tipo> | recuperar | dados-recebidos | nova-lead)
// Os emails aos noivos usam todos o bilhete (lib/bilheteNoivos.ts).

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'
const NOMES = 'Ana | Tiago'

function html(k: string): string | null {
  const login = `${SITE}/login-noivos`
  if (k === 'portal') {
    return buildPortalEmailV2({
      tipo: 'casamento', nomesAlt: NOMES, data: '2027-06-12', referencia: 'CAS_000_27_RL',
      email: 'ana.tiago@exemplo.pt', password: 'exemplo123', loginUrl: login,
    })
  }
  if (k === 'ticket') {
    return buildTicketHtml({
      created_at: new Date().toISOString(), formato: 'papel', pedido: 'RP-0000', nome: 'Convidado Exemplo',
      email: 'convidado@exemplo.pt', telefone: '900 000 000', morada: 'Rua de Exemplo 1, 2950-000 Palmela',
      noivos: 'Ana e Tiago', data_casamento: '12/06/2027', fotografias: '4218\n4219\n4230', quantidade: 3,
      subtotal: '9,00 €', portes: '2,00 €', total: '11,00 €', metodo_pagamento: 'MB WAY', responsavel: 'Ana',
    })
  }
  if (k === 'ticket-editor') {
    // Ticket de Edição: o email que o editor recebe quando é nomeado (fluxo da Edição de Vídeo)
    return buildTicketEditorHtml({
      numero: 'ED-CAS_000_27_RL', editor: 'Marco Exemplo', noivos: 'Ana e Tiago',
      dataCasamento: '2027-06-12', local: 'Quinta de Exemplo', prazo: prazoVideo('2027-06-12'), atribuidoEm: new Date(),
    })
  }
  if (k === 'ticket-aprovacao') {
    // Ticket de Aprovação: o email que o editor recebe quando a RL aprova o vídeo
    return buildTicketAprovacaoHtml({
      numero: 'AP-CAS_000_27_RL', editor: 'Marco Exemplo', noivos: 'Ana e Tiago', local: 'Quinta de Exemplo',
      link: 'https://frame.io/exemplo', feedback: 'Excelente ritmo na cerimónia. Só baixar um pouco a música nos votos.', aprovadoEm: new Date(),
    })
  }
  // Emails de entrega aos noivos (fotos e vídeos), os mesmos das rotas send-<tipo>-email
  if (k.startsWith('entrega-')) {
    const t = k.slice(8)
    return Object.hasOwn(ENTREGAS, t)
      ? buildEntregaEmailHtml(t as TipoEntrega, { nomes: NOMES, url: `${SITE}/login-noivos`, data: '2027-06-12', local: 'Quinta de Exemplo', referencia: 'CAS_000_27_RL' })
      : null
  }
  // Freelancers (cards em imagem) e emails a noivos e leads
  if (k === 'fl-novidades') return emailNovidadesFreelancer('exemplo')
  if (k === 'fl-briefing') return emailNovoBriefing(SITE, 'exemplo')
  if (k === 'fl-trabalho-edicao') return emailTrabalhoEdicao(SITE, 'exemplo')
  if (k === 'fl-edicao-fotos') return emailEdicaoFotos(`${SITE}/freelancer-view/exemplo`, 'Ana e Tiago', 'CAS_000_27_RL')
  if (k === 'fl-candidatura') return emailCandidatura(SITE)
  if (k === 'recuperar') return buildRecoveryEmail({ nome: 'Ana & Tiago', password: 'exemplo123', loginUrl: login })
  if (k === 'dados-recebidos') return buildDadosRecebidosEmail({ nome_noivos: 'Ana e Tiago', data_casamento: '2027-06-12' })
  if (k === 'nova-lead') return buildNovaLeadEmail('Ana e Tiago', 'Fotografia, Vídeo')
  if (k === 'pagamento') {
    // Comprovativo de pagamento: o mesmo card vai à noiva e ao admin (/api/registar-pagamento-noivos)
    return cardPagamento({ nome_noivos: 'Ana e Tiago', referencia: 'CAS_000_27_RL', valor: 750, fase: 'REFORÇO', metodo: 'MBWAY', data: '12/03/2027', comprovativo_url: null })
  }
  // Ticket do Filme aos noivos: filme-aguardar, filme-edicao, filme-revisao, filme-finalizado, filme-estreia
  const PASSO: Record<string, PassoFilme> = { 'filme-aguardar': 'Aguardar', 'filme-edicao': 'Em Edição', 'filme-revisao': 'Em Revisão', 'filme-finalizado': 'Finalizado', 'filme-estreia': 'Estreia' }
  if (PASSO[k]) {
    const sabado = new Date(); sabado.setDate(sabado.getDate() + ((6 - sabado.getDay() + 7) % 7 || 7)); sabado.setHours(21, 0, 0, 0)
    return buildTicketFilmeHtml({ passo: PASSO[k], referencia: 'CAS_000_27_RL', noivos: 'Ana & Tiago', estreia: sabado.toISOString(), data: '2027-06-12' })
  }
  return null
}

export async function GET(req: Request) {
  const bloqueio = exigeAdmin(req)
  if (bloqueio) return bloqueio
  const k = new URL(req.url).searchParams.get('k') ?? ''
  const h = html(k)
  if (!h) return new Response('sem_previsualizacao', { status: 404 })
  return new Response(h, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, max-age=3600' } })
}
