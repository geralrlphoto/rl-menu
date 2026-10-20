// Fluxo de trabalho do Departamento de Edição de Vídeo (/edicao-video/fluxo).
// Mesmo mapa interativo do /crm/follow-up (JornadaMapa), com as fases da
// edição: de nomear o editor até ao feedback dos noivos.
// Ids "fase-passo" (como em lib/jornada.ts). Estado guardado por /api/edicao-video/fluxo.

import type { Fase } from '@/lib/jornada'

const cadeia = (n: number) => ({
  seq: Object.fromEntries([...Array(Math.max(0, n - 1)).keys()].map(i => [i, [i + 1]])) as Record<number, number[]>,
  saida: [n - 1],
})

export const FASES_EDICAO: Fase[] = [
  /* 01 */
  {
    titulo: 'Nomear editor', sub: 'quem edita',
    fluxo: { ...cadeia(3), abaixo: true },
    passos: [
      {
        id: '0-0', titulo: 'Escolher editor', sub: 'pela carga',
        descricao: 'Na página Edição de Vídeo, a equipa aparece ordenada do mais livre para o mais ocupado. Atribuir no quadro (coluna Por atribuir).',
        quem: ['Rui'], prazo: 'Até 3 dias úteis', onde: 'Produção › Edição de Vídeo',
        tarefas: ['Ver a carga de cada editor', 'Atribuir o editor no quadro', 'Confirmar o prazo de entrega (proposta)'],
      },
      {
        id: '0-1', titulo: 'Entregar o projeto', sub: 'ficheiros e notas',
        descricao: 'O editor recebe o aviso e o projeto aparece no Painel do Editor, com o link dos ficheiros, o briefing e as notas do dia.',
        quem: ['Rui', 'Automático'], prazo: 'No mesmo dia', onde: 'Painel do Editor',
        tarefas: ['Partilhar a pasta dos ficheiros', 'Juntar briefing, cronograma e relatório do dia', 'Indicar as músicas aprovadas'],
      },
      {
        id: '0-2', titulo: 'Editor confirma', sub: 'arranque',
        descricao: 'O editor confirma que tem tudo e o projeto passa a Em Edição no Painel do Editor. O portal dos noivos acompanha a fase.',
        quem: ['Equipa'], prazo: 'Até 2 dias', onde: 'Painel do Editor › Workflow',
        tarefas: ['Confirmar a receção dos ficheiros', 'Mudar a fase para Em Edição'],
      },
    ],
  },
  /* 02 */
  {
    titulo: 'Edição', sub: 'no Painel do Editor',
    // Cor e Áudio ficam por baixo da Montagem; o caminho segue da Montagem para a Revisão
    fluxo: { seq: { 0: [1] }, baixo: { 1: [2], 2: [3] }, saida: [1] },
    passos: [
      {
        id: '1-0', titulo: 'Teaser / Trailer', sub: 'primeira peça',
        descricao: 'Peça curta para os noivos partilharem. Enviada pelo portal: fica marcada nas entregas do quadro.',
        quem: ['Equipa', 'Rui'], prazo: 'Objetivo: 4 semanas', onde: 'Ficha do evento › Ações Vídeo',
        tarefas: ['Editar o teaser', 'Revisão rápida da RL', 'Enviar pelo portal (Teaser)'],
      },
      {
        id: '1-1', titulo: 'Montagem', sub: 'o filme',
        descricao: 'Seleção dos melhores momentos e construção da história do dia, com a estrutura e o ritmo da RL.',
        quem: ['Equipa'], prazo: 'Em Edição', onde: 'Painel do Editor',
        tarefas: ['Selecionar os planos', 'Estrutura do filme', 'Música aprovada'],
      },
      {
        id: '1-2', titulo: 'Cor', sub: 'color grading',
        descricao: 'Look RL, uniforme entre câmaras e momentos.',
        quem: ['Equipa'], prazo: 'Em Edição', onde: 'Painel do Editor › Color Grading',
        tarefas: ['Igualar as câmaras', 'Aplicar o look RL', 'Rever peles e tons'],
      },
      {
        id: '1-3', titulo: 'Áudio', sub: 'votos e discursos',
        descricao: 'Sincronização do áudio dos votos e dos discursos, mistura com a música.',
        quem: ['Equipa'], prazo: 'Em Edição', onde: 'Painel do Editor › Áudio / Sincronização',
        tarefas: ['Sincronizar votos e discursos', 'Limpar o ruído', 'Equilibrar voz e música'],
      },
    ],
  },
  /* 03 */
  {
    titulo: 'Revisão', sub: 'interna',
    fluxo: cadeia(2),
    passos: [
      {
        id: '2-0', titulo: 'Para revisão', sub: 'link de revisão',
        descricao: 'O editor envia o link no Painel do Editor e a fase passa a Para Revisão (no portal dos noivos aparece Em Revisão).',
        quem: ['Equipa'], prazo: 'Quando o filme estiver montado', onde: 'Painel do Editor › Para Revisão',
        tarefas: ['Exportar a versão de revisão', 'Enviar o link de revisão'],
      },
      {
        id: '2-1', titulo: 'Revisão da RL', sub: 'notas ao editor',
        descricao: 'A RL vê o filme inteiro: ritmo, música, cor, momentos-chave e nomes. As notas voltam ao editor (Correções).',
        quem: ['Rui'], prazo: 'Até 3 dias úteis', onde: 'Painel do Editor › Correções',
        tarefas: ['Ver o filme do princípio ao fim', 'Anotar correções com o minuto', 'Enviar as notas ao editor'],
      },
    ],
  },
  /* 04 */
  {
    titulo: 'Aprovado', sub: 'versão final',
    fluxo: cadeia(2),
    passos: [
      {
        id: '3-0', titulo: 'Correções', sub: 'pelo editor',
        descricao: 'O editor aplica as notas e envia a nova versão.',
        quem: ['Equipa'], prazo: 'Até 5 dias úteis', onde: 'Painel do Editor',
        tarefas: ['Aplicar todas as notas', 'Enviar a nova versão'],
      },
      {
        id: '3-1', titulo: 'Aprovação', sub: 'finalizado',
        descricao: 'A RL aprova e a fase passa a Finalizado. Exportação final em alta qualidade.',
        quem: ['Rui', 'Equipa'], prazo: 'Até 2 dias úteis', onde: 'Painel do Editor › Finalizado',
        tarefas: ['Aprovar a versão final', 'Exportar o master', 'Guardar o projeto e o master no NAS'],
      },
    ],
  },
  /* 05 */
  {
    titulo: 'Entrega', sub: 'no portal',
    fluxo: cadeia(2),
    passos: [
      {
        id: '4-0', titulo: 'Wedding Film', sub: 'no portal',
        descricao: 'O filme fica disponível no portal dos noivos (Ações Vídeo › Wedding Film) e o email sai automaticamente. Prazo por proposta: BASIC 180, ESSENCIAL 120, SIGNATURE 60 dias úteis.',
        quem: ['Rui', 'Automático'], prazo: 'Até 180 dias úteis', onde: 'Ficha do evento › Ações Vídeo',
        tarefas: ['Carregar o filme (Vimeo/YouTube)', 'Enviar pelo portal (Wedding Film)', 'Confirmar que o link abre'],
      },
      {
        id: '4-1', titulo: 'Entregue', sub: 'fecho',
        descricao: 'A fase passa a Entregue (no Painel do Editor e no portal). O cartão sai do quadro de trabalho.',
        quem: ['Rui', 'Equipa'], prazo: 'No dia da entrega', onde: 'Painel do Editor › Entregue',
        tarefas: ['Marcar como Entregue', 'Pagamento ao editor'],
      },
    ],
  },
  /* 06 */
  {
    titulo: 'Feedback dos noivos', sub: 'depois da entrega',
    fluxo: cadeia(3),
    passos: [
      {
        id: '5-0', titulo: 'Ajustes dos noivos', sub: 'uma ronda',
        descricao: 'Os noivos veem o filme e podem pedir pequenos ajustes. Uma ronda de correções incluída.',
        quem: ['Noivos', 'Equipa'], prazo: '5 dias úteis', onde: 'Portal dos noivos › Atendimento',
        tarefas: ['Receber os pedidos dos noivos', 'Aplicar os ajustes acordados', 'Reenviar pelo portal'],
      },
      {
        id: '5-1', titulo: 'Satisfação', sub: 'opinião',
        descricao: 'Pedir aos noivos a opinião sobre o filme e o serviço (DAR SATISFAÇÃO no portal) e uma avaliação pública.',
        quem: ['Rui', 'Noivos'], prazo: '1 semana após a entrega', onde: 'Portal › Área SAT Noivos',
        tarefas: ['Pedir a satisfação no portal', 'Pedir avaliação no Google / Casamentos.pt', 'Partilhar o melhor comentário com o editor'],
      },
      {
        id: '5-2', titulo: 'Arquivo', sub: '180 dias',
        descricao: 'Os ficheiros ficam guardados 180 dias depois da entrega final (cláusula 9). Depois podem ser apagados.',
        quem: ['Rui'], prazo: '180 dias', onde: 'NAS',
        tarefas: ['Registar a data de entrega', 'Ao fim de 180 dias, libertar o espaço'],
      },
    ],
  },
]

/** Separadores do topo: [nome, fase onde abre] */
export const SEPARADORES_EDICAO: [string, number][] = [
  ['Editor', 0], ['Edição', 1], ['Revisão', 2], ['Aprovado', 3], ['Entrega', 4], ['Feedback', 5],
]
