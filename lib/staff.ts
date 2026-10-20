// Staff (Gestão › Staff): cada pessoa da RL fica "responsável" por alguns emails
// aos noivos. Nesses emails, por cima do bilhete, aparece a pessoa: foto redonda,
// nome e função (imagem gerada em /api/staff/cartao?email=<chave>), para os noivos
// sentirem que há várias pessoas em vários departamentos a tratar do casamento.
// A chave de cada email é passada ao bilhete (lib/bilheteNoivos.ts, campo `chave`).

export type EmailNoivos = { chave: string; nome: string }

export const EMAILS_NOIVOS: { grupo: string; emails: EmailNoivos[] }[] = [
  { grupo: 'Portal e contacto', emails: [
    { chave: 'portal', nome: 'O vosso portal está aberto' },
    { chave: 'portal-pronto', nome: 'Portal dos noivos pronto' },
    { chave: 'recuperar', nome: 'Recuperar a palavra-passe' },
    { chave: 'dados-recebidos', nome: 'Dados recebidos' },
    { chave: 'notificacao', nome: 'Nova notificação' },
    { chave: 'resposta', nome: 'Resposta à mensagem' },
    { chave: 'tarefa', nome: 'Tarefas (nova e concluída)' },
  ] },
  { grupo: 'Reunião e proposta', emails: [
    { chave: 'nova-lead', nome: 'Recebemos o vosso contacto' },
    { chave: 'reuniao', nome: 'Reunião marcada' },
    { chave: 'lembrete-reuniao', nome: 'Lembrete da reunião' },
  ] },
  { grupo: 'Pré-wedding', emails: [
    { chave: 'proposta-60', nome: 'Faltam 60 dias (proposta pré-wedding)' },
    { chave: 'marcar-prewedding', nome: 'Marcar o pré-wedding' },
    { chave: 'prewedding-reservado', nome: 'Pré-wedding reservado' },
  ] },
  { grupo: 'Fotografias', emails: [
    { chave: 'fotos-sneakpeek', nome: 'Sneak peek' },
    { chave: 'entrega-galerias', nome: 'Fotos do dia (galeria online)' },
    { chave: 'entrega-selecao', nome: 'Fotos para seleção' },
    { chave: 'fotos-recebida', nome: 'Seleção recebida' },
    { chave: 'fotos-lembrete', nome: 'Lembretes da seleção (30 e 60 dias)' },
    { chave: 'entrega-fotos_finais', nome: 'Fotos editadas' },
    { chave: 'fotos-download', nome: 'Fim do download' },
    { chave: 'entrega-prewedding', nome: 'Fotos pré-wedding' },
    { chave: 'entrega-maquete', nome: 'Álbum (maquete para aprovar)' },
  ] },
  { grupo: 'Vídeos', emails: [
    { chave: 'filme', nome: 'Ticket do Filme (todos os passos)' },
    { chave: 'entrega-teaser', nome: 'Teaser / trailer' },
    { chave: 'entrega-same_day_edit', nome: 'Same Day Edit' },
    { chave: 'entrega-video_prewedding', nome: 'Vídeo pré-wedding' },
    { chave: 'entrega-wedding_film', nome: 'Wedding Film' },
  ] },
  { grupo: 'Pagamentos', emails: [
    { chave: 'pagamento', nome: 'Comprovativo de pagamento' },
    { chave: 'pagamento-tally', nome: 'Pagamento registado' },
  ] },
]

export const TODAS_CHAVES = EMAILS_NOIVOS.flatMap(g => g.emails.map(e => e.chave))

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.rlphotovideo.pt').replace(/\/+$/, '')

/** Imagem com a pessoa responsável por este email (vazia se não houver ninguém). */
export const urlCartaoStaff = (chave: string) => `${SITE}/api/staff/cartao?email=${encodeURIComponent(chave)}`
