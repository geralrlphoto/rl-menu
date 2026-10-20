import { exigeAdmin } from '@/lib/api-guard'
import { buildPortalEmailV2 } from '@/lib/portalEmail'
import { buildTicketHtml } from '@/lib/ticket-html'
import { buildTicketEditorHtml, prazoVideo } from '@/lib/ticket-editor-html'

// Pré-visualização real dos emails ao cliente no mapa da jornada (/crm/follow-up).
// Usa as mesmas funções de HTML que as rotas de envio, com um casal fictício.
// GET ?k=<chave>  (portal | ticket | ticket-editor)
// Os emails de entrega (seleção, galerias, filme…) entram aqui quando lib/entregaEmail.ts
// estiver no repositório: usar buildEntregaEmailHtml com a configuração de cada tipo.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt'
const NOMES = 'Ana | Tiago'

function html(k: string): string | null {
  const login = `${SITE}/login-noivos`
  if (k === 'portal') {
    return buildPortalEmailV2({
      tipo: 'casamento', heroUrl: `${SITE}/email/casamento-bg.jpg`, nomesAlt: NOMES, data: '2027-06-12',
      email: 'ana.tiago@exemplo.pt', password: 'exemplo123', loginUrl: login, siteBase: SITE,
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
