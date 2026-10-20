// Fluxo de trabalho do Departamento de Edição de Vídeo (/edicao-video/fluxo).
// Mesmo mapa interativo do /crm/follow-up (JornadaMapa), com as fases da
// edição: do dia do pré-wedding até ao feedback dos noivos.
// Ids "fase-passo" (como em lib/jornada.ts). Estado guardado por /api/edicao-video/fluxo.

import type { Fase } from '@/lib/jornada'

const cadeia = (n: number) => ({
  seq: Object.fromEntries([...Array(Math.max(0, n - 1)).keys()].map(i => [i, [i + 1]])) as Record<number, number[]>,
  saida: [n - 1],
})

export const FASES_EDICAO: Fase[] = [
  /* 01 */
  {
    titulo: 'Pré-wedding', sub: 'o dia da sessão',
    fluxo: cadeia(3),
    passos: [
      {
        id: '0-0', titulo: 'Captação', sub: 'sessão pré-wedding',
        descricao: 'Sessão de fotografia e vídeo antes do casamento. O videógrafo capta pensando já no filme do pré-wedding e em planos que possam entrar no Same Day Edit e no filme final.',
        quem: ['Equipa'], prazo: 'Dia marcado', onde: 'Local escolhido · marcação no portal',
        tarefas: ['Confirmar local e hora com os noivos', 'Baterias e cartões formatados', 'Planos de ligação para o filme do casamento', 'Som ambiente e pequenas falas dos noivos'],
      },
      {
        id: '0-1', titulo: 'Backup', sub: 'no próprio dia',
        descricao: 'Os cartões só são formatados depois de existirem duas cópias: NAS e disco externo.',
        quem: ['Equipa'], prazo: 'Até 24 h', onde: 'NAS · pasta do casal',
        tarefas: ['Copiar cartões para o NAS', 'Segunda cópia em disco externo', 'Verificar se os ficheiros abrem', 'Só depois formatar os cartões'],
      },
      {
        id: '0-2', titulo: 'Vídeo pré-wedding', sub: 'edição e entrega',
        descricao: 'Edição curta do pré-wedding e entrega no portal dos noivos (Ações Vídeo na ficha). O email aos noivos sai automaticamente.',
        quem: ['Equipa', 'Rui'], prazo: 'Antes do casamento', onde: 'Ficha do evento › Ações Vídeo',
        tarefas: ['Editar o vídeo do pré-wedding', 'Rever antes de enviar', 'Enviar pelo portal (Vídeo Pré-Wedding)'],
        dica: 'Chegar antes do casamento cria expectativa para o grande dia.',
      },
    ],
  },
  /* 02 */
  {
    titulo: 'Dia do casamento', sub: 'captação',
    fluxo: { ...cadeia(4), abaixo: true },
    passos: [
      {
        id: '1-0', titulo: 'Preparação', sub: 'véspera',
        descricao: 'Ler o briefing e o cronograma do casamento, confirmar a equipa e o material.',
        quem: ['Equipa'], prazo: 'Véspera', onde: 'Portal dos noivos › Briefing e Cronograma',
        tarefas: ['Ler o briefing dos noivos', 'Rever o cronograma do dia', 'Material, baterias e cartões', 'Combinar a divisão com a restante equipa'],
      },
      {
        id: '1-1', titulo: 'Captação', sub: 'o dia todo',
        descricao: 'Do making of à festa. Áudio dos votos e discursos sempre gravado à parte, para a sincronização na edição.',
        quem: ['Equipa'], prazo: 'Dia do casamento', onde: 'Local do casamento',
        tarefas: ['Making of dos noivos', 'Cerimónia com áudio dos votos', 'Sessão de casal', 'Discursos e momentos da festa', 'Planos de drone (se contratado)'],
      },
      {
        id: '1-2', titulo: 'Same Day Edit', sub: 'só SIGNATURE',
        descricao: 'Edição no próprio dia, projetada durante a festa. É um dos momentos altos do casamento.',
        quem: ['Equipa'], prazo: 'No próprio dia', onde: 'Local do casamento',
        tarefas: ['Editar durante a festa', 'Testar a projeção e o som', 'Projetar no momento combinado'],
      },
      {
        id: '1-3', titulo: 'Relatório do dia', sub: 'no fim do casamento',
        descricao: 'O videógrafo deixa o relatório do dia: horários, momentos-chave e notas para o editor.',
        quem: ['Equipa'], prazo: 'No próprio dia', onde: 'Portal da equipa › Relatório',
        tarefas: ['Preencher o relatório do dia', 'Notas para o editor (momentos, música, pedidos dos noivos)'],
      },
    ],
  },
  /* 03 */
  {
    titulo: 'Backup', sub: 'logo a seguir',
    fluxo: cadeia(2),
    passos: [
      {
        id: '2-0', titulo: 'Backup', sub: 'duas cópias',
        descricao: 'Nada se formata sem duas cópias verificadas. Os ficheiros ficam guardados 180 dias depois da entrega (cláusula 9 do contrato).',
        quem: ['Equipa'], prazo: 'Até 48 h', onde: 'NAS · disco externo',
        tarefas: ['Copiar todos os cartões para o NAS', 'Segunda cópia em disco externo', 'Organizar por câmara e momento', 'Verificar as cópias e só depois formatar'],
      },
      {
        id: '2-1', titulo: 'SDE no portal', sub: 'entrega',
        descricao: 'O Same Day Edit fica disponível no portal dos noivos (Ações Vídeo na ficha). O email aos noivos sai automaticamente.',
        quem: ['Rui', 'Automático'], prazo: 'Até 48 h', onde: 'Ficha do evento › Ações Vídeo',
        tarefas: ['Exportar a versão final do SDE', 'Enviar pelo portal (Same Day Edit)'],
      },
    ],
  },
  /* 04 */
  {
    titulo: 'Edição', sub: 'no Painel do Editor',
    // Nomear editor fica numa lista por baixo da fase; a edição segue para a direita
    // Cor e Áudio ficam por baixo da Montagem; o caminho segue da Montagem para a Revisão
    fluxo: { abaixo: [0, 1, 2], seq: { 3: [4] }, baixo: { 4: [5], 5: [6] }, saida: [4] },
    passos: [
      {
        id: '3-0', titulo: 'Escolher editor', sub: 'pela carga',
        descricao: 'Na página Edição de Vídeo, a equipa aparece ordenada do mais livre para o mais ocupado. Atribuir no quadro (coluna Por atribuir).',
        quem: ['Rui'], prazo: 'Até 3 dias úteis', onde: 'Produção › Edição de Vídeo',
        tarefas: ['Ver a carga de cada editor', 'Atribuir o editor no quadro', 'Confirmar o prazo de entrega (proposta)'],
      },
      {
        id: '3-1', titulo: 'Entregar o projeto', sub: 'ficheiros e notas',
        descricao: 'O editor recebe o aviso e o projeto aparece no Painel do Editor, com o link dos ficheiros, o briefing e as notas do dia.',
        quem: ['Rui', 'Automático'], prazo: 'No mesmo dia', onde: 'Painel do Editor',
        tarefas: ['Partilhar a pasta dos ficheiros', 'Juntar briefing, cronograma e relatório do dia', 'Indicar as músicas aprovadas'],
      },
      {
        id: '3-2', titulo: 'Editor confirma', sub: 'arranque',
        descricao: 'O editor confirma que tem tudo e o projeto passa a Em Edição no Painel do Editor. O portal dos noivos acompanha a fase.',
        quem: ['Equipa'], prazo: 'Até 2 dias', onde: 'Painel do Editor › Workflow',
        tarefas: ['Confirmar a receção dos ficheiros', 'Mudar a fase para Em Edição'],
      },
      {
        id: '3-3', titulo: 'Teaser / Trailer', sub: 'primeira peça',
        descricao: 'Peça curta para os noivos partilharem. Enviada pelo portal: fica marcada nas entregas do quadro.',
        quem: ['Equipa', 'Rui'], prazo: 'Objetivo: 4 semanas', onde: 'Ficha do evento › Ações Vídeo',
        tarefas: ['Editar o teaser', 'Revisão rápida da RL', 'Enviar pelo portal (Teaser)'],
      },
      {
        id: '3-4', titulo: 'Montagem', sub: 'o filme',
        descricao: 'Seleção dos melhores momentos e construção da história do dia, com a estrutura e o ritmo da RL.',
        quem: ['Equipa'], prazo: 'Em Edição', onde: 'Painel do Editor',
        tarefas: ['Selecionar os planos', 'Estrutura do filme', 'Música aprovada'],
      },
      {
        id: '3-5', titulo: 'Cor', sub: 'color grading',
        descricao: 'Look RL, uniforme entre câmaras e momentos.',
        quem: ['Equipa'], prazo: 'Em Edição', onde: 'Painel do Editor › Color Grading',
        tarefas: ['Igualar as câmaras', 'Aplicar o look RL', 'Rever peles e tons'],
      },
      {
        id: '3-6', titulo: 'Áudio', sub: 'votos e discursos',
        descricao: 'Sincronização do áudio dos votos e dos discursos, mistura com a música.',
        quem: ['Equipa'], prazo: 'Em Edição', onde: 'Painel do Editor › Áudio / Sincronização',
        tarefas: ['Sincronizar votos e discursos', 'Limpar o ruído', 'Equilibrar voz e música'],
      },
    ],
  },
  /* 05 */
  {
    titulo: 'Revisão', sub: 'interna',
    fluxo: cadeia(2),
    passos: [
      {
        id: '4-0', titulo: 'Para revisão', sub: 'link de revisão',
        descricao: 'O editor envia o link no Painel do Editor e a fase passa a Para Revisão (no portal dos noivos aparece Em Revisão).',
        quem: ['Equipa'], prazo: 'Quando o filme estiver montado', onde: 'Painel do Editor › Para Revisão',
        tarefas: ['Exportar a versão de revisão', 'Enviar o link de revisão'],
      },
      {
        id: '4-1', titulo: 'Revisão da RL', sub: 'notas ao editor',
        descricao: 'A RL vê o filme inteiro: ritmo, música, cor, momentos-chave e nomes. As notas voltam ao editor (Correções).',
        quem: ['Rui'], prazo: 'Até 3 dias úteis', onde: 'Painel do Editor › Correções',
        tarefas: ['Ver o filme do princípio ao fim', 'Anotar correções com o minuto', 'Enviar as notas ao editor'],
      },
    ],
  },
  /* 06 */
  {
    titulo: 'Aprovado', sub: 'versão final',
    fluxo: cadeia(2),
    passos: [
      {
        id: '5-0', titulo: 'Correções', sub: 'pelo editor',
        descricao: 'O editor aplica as notas e envia a nova versão.',
        quem: ['Equipa'], prazo: 'Até 5 dias úteis', onde: 'Painel do Editor',
        tarefas: ['Aplicar todas as notas', 'Enviar a nova versão'],
      },
      {
        id: '5-1', titulo: 'Aprovação', sub: 'finalizado',
        descricao: 'A RL aprova e a fase passa a Finalizado. Exportação final em alta qualidade.',
        quem: ['Rui', 'Equipa'], prazo: 'Até 2 dias úteis', onde: 'Painel do Editor › Finalizado',
        tarefas: ['Aprovar a versão final', 'Exportar o master', 'Guardar o projeto e o master no NAS'],
      },
    ],
  },
  /* 07 */
  {
    titulo: 'Entrega', sub: 'no portal',
    fluxo: cadeia(2),
    passos: [
      {
        id: '6-0', titulo: 'Wedding Film', sub: 'no portal',
        descricao: 'O filme fica disponível no portal dos noivos (Ações Vídeo › Wedding Film) e o email sai automaticamente. Prazo por proposta: BASIC 180, ESSENCIAL 120, SIGNATURE 60 dias úteis.',
        quem: ['Rui', 'Automático'], prazo: 'Até 180 dias úteis', onde: 'Ficha do evento › Ações Vídeo',
        tarefas: ['Carregar o filme (Vimeo/YouTube)', 'Enviar pelo portal (Wedding Film)', 'Confirmar que o link abre'],
      },
      {
        id: '6-1', titulo: 'Entregue', sub: 'fecho',
        descricao: 'A fase passa a Entregue (no Painel do Editor e no portal). O cartão sai do quadro de trabalho.',
        quem: ['Rui', 'Equipa'], prazo: 'No dia da entrega', onde: 'Painel do Editor › Entregue',
        tarefas: ['Marcar como Entregue', 'Pagamento ao editor'],
      },
    ],
  },
  /* 08 */
  {
    titulo: 'Feedback dos noivos', sub: 'depois da entrega',
    fluxo: cadeia(3),
    passos: [
      {
        id: '7-0', titulo: 'Ajustes dos noivos', sub: 'uma ronda',
        descricao: 'Os noivos veem o filme e podem pedir pequenos ajustes. Uma ronda de correções incluída.',
        quem: ['Noivos', 'Equipa'], prazo: '5 dias úteis', onde: 'Portal dos noivos › Atendimento',
        tarefas: ['Receber os pedidos dos noivos', 'Aplicar os ajustes acordados', 'Reenviar pelo portal'],
      },
      {
        id: '7-1', titulo: 'Satisfação', sub: 'opinião',
        descricao: 'Pedir aos noivos a opinião sobre o filme e o serviço (DAR SATISFAÇÃO no portal) e uma avaliação pública.',
        quem: ['Rui', 'Noivos'], prazo: '1 semana após a entrega', onde: 'Portal › Área SAT Noivos',
        tarefas: ['Pedir a satisfação no portal', 'Pedir avaliação no Google / Casamentos.pt', 'Partilhar o melhor comentário com o editor'],
      },
      {
        id: '7-2', titulo: 'Arquivo', sub: '180 dias',
        descricao: 'Os ficheiros ficam guardados 180 dias depois da entrega final (cláusula 9). Depois podem ser apagados.',
        quem: ['Rui'], prazo: '180 dias', onde: 'NAS',
        tarefas: ['Registar a data de entrega', 'Ao fim de 180 dias, libertar o espaço'],
      },
    ],
  },
]

/** Separadores do topo: [nome, fase onde abre] */
export const SEPARADORES_EDICAO: [string, number][] = [
  ['Captação', 0], ['Backup', 2], ['Edição', 3], ['Revisão', 4], ['Entrega', 6], ['Feedback', 7],
]
