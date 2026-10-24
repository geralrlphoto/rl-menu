// Guia de boas práticas da RL PROD, mostrado no portal da equipa (/equipa-rlprod/<token>/guia).
// Para mudar uma regra basta editar este ficheiro.

export type SecaoGuia = {
  id: string
  titulo: string
  intro?: string
  regras: { t: string; d?: string }[]
}

export const VALORES = [
  { t: 'Pontualidade', d: 'Chegar cedo é chegar a horas. Chegar a horas é chegar tarde.' },
  { t: 'Discrição', d: 'Estamos lá para contar a história de outros, não para fazer parte dela.' },
  { t: 'Rigor', d: 'Cada plano conta. Não há segunda oportunidade para o mesmo momento.' },
  { t: 'Confiança', d: 'O que vemos e ouvimos num trabalho fica no trabalho.' },
]

export const SECOES: SecaoGuia[] = [
  {
    id: 'antes',
    titulo: 'Antes do projeto',
    intro: 'Um dia de captação bem feito começa dias antes. A preparação é metade do resultado.',
    regras: [
      { t: 'Confirma a disponibilidade logo que fores nomeado', d: 'Se não puderes, avisa de imediato para encontrarmos alternativa a tempo.' },
      { t: 'Lê o briefing e o guião com atenção', d: 'Estão na ficha de cada trabalho no teu portal. Chega ao dia a saber o que o cliente quer, o tom e os momentos-chave.' },
      { t: 'Tira dúvidas antes, nunca no dia', d: 'Se algo não estiver claro, pergunta à RL PROD até à véspera.' },
      { t: 'Prepara o equipamento na véspera', d: 'Baterias carregadas (e de reserva), cartões vazios e formatados, lentes e sensor limpos, áudio testado, firmware em dia.' },
      { t: 'Acerta as definições combinadas', d: 'Resolução, fotogramas por segundo, perfil de cor e formato (horizontal ou vertical) iguais em todas as câmaras da equipa.' },
      { t: 'Planeia a deslocação', d: 'Vê o percurso, o estacionamento e o tempo de viagem. Conta sempre com margem para trânsito.' },
      { t: 'Na véspera, confirma com o responsável', d: 'Hora de chegada, local exato e contacto no local.' },
    ],
  },
  {
    id: 'postura',
    titulo: 'Postura no dia de captação',
    intro: 'Para o cliente, tu és a RL PROD. A forma como estás conta tanto como as imagens que fazes.',
    regras: [
      { t: 'Chega 30 minutos antes da hora marcada', d: 'Tempo para montar, ver a luz e o espaço com calma.' },
      { t: 'Veste-te de forma sóbria', d: 'Roupa escura (preto de preferência), limpa e cuidada, sem logótipos de outras marcas. Calçado confortável e silencioso. Em eventos formais, segue o código combinado.' },
      { t: 'Apresenta-te sempre', d: '"Olá, sou o/a [nome], da equipa RL PROD." Um sorriso e um aperto de mão abrem portas.' },
      { t: 'Telemóvel em silêncio e no bolso', d: 'Só o usas para trabalho. Nada de redes sociais nem chamadas pessoais à frente do cliente ou dos convidados.' },
      { t: 'Sê invisível, mas presente', d: 'Movimenta-te com discrição, não te ponhas à frente dos convidados nem de outros profissionais (fotógrafo, celebrante, DJ).' },
      { t: 'Respeita o espaço e as pessoas', d: 'Pede licença, não mexas em decoração sem autorização e deixa tudo como encontraste.' },
      { t: 'Linguagem cuidada', d: 'Tom calmo e simpático, mesmo sob pressão. Nada de palavrões nem comentários sobre o cliente, o espaço ou os convidados.' },
      { t: 'Comida e bebida só quando te oferecerem', d: 'E nunca à mesa dos convidados nem durante momentos-chave. Álcool: zero durante o trabalho.' },
      { t: 'Não fumes à vista', d: 'Se precisares de uma pausa, avisa a equipa e afasta-te do evento.' },
      { t: 'Preços, prazos e entregas são com a RL PROD', d: 'Se o cliente perguntar, responde com simpatia: "Isso é tratado diretamente com a RL PROD, eles explicam-lhe tudo."' },
    ],
  },
  {
    id: 'captacao',
    titulo: 'Durante a captação',
    intro: 'O guião é o mapa. A tua experiência é o que faz a diferença quando o dia não corre como planeado.',
    regras: [
      { t: 'Segue o guião e os momentos-chave', d: 'Garante primeiro os planos obrigatórios. Depois, liberdade criativa.' },
      { t: 'Faz sempre planos de segurança', d: 'Um plano aberto e estável de cada momento importante, antes de arriscar.' },
      { t: 'Áudio é metade do filme', d: 'Confirma níveis, microfones e baterias do áudio antes de cada momento com voz (votos, discursos, entrevistas).' },
      { t: 'Cuida da técnica', d: 'Horizontes direitos, exposição correta, foco no sítio certo, movimentos suaves.' },
      { t: 'Muda de cartão sem apagar nada', d: 'Nunca formates um cartão no local. Marca os cartões cheios e guarda-os num estojo à parte.' },
      { t: 'Comunica com a equipa', d: 'Combina posições antes de cada momento para não aparecerem uns nos planos dos outros.' },
      { t: 'Drone só com regras cumpridas', d: 'Registo e seguro em dia, regras da ANAC, autorização do local e nunca por cima de pessoas.' },
      { t: 'Se algo falhar, avisa logo', d: 'Equipamento avariado, cartão com erro ou momento perdido: diz de imediato ao responsável. Esconder um problema é sempre pior.' },
    ],
  },
  {
    id: 'equipamento',
    titulo: 'Equipamento e segurança',
    regras: [
      { t: 'O equipamento nunca fica sozinho', d: 'Malas fechadas e sempre à vista ou num local combinado com o cliente.' },
      { t: 'Cabos e tripés em segurança', d: 'Fita nos cabos no chão e tripés fora das zonas de passagem. Ninguém pode tropeçar por nossa causa.' },
      { t: 'Cuidado com o tempo', d: 'Proteção para chuva e sol. Atenção à condensação ao passar do frio para o calor.' },
      { t: 'Equipamento da RL PROD', d: 'Se usares material da RL PROD, devolve-o limpo, carregado e completo. Qualquer dano, avisa no próprio dia.' },
    ],
  },
  {
    id: 'depois',
    titulo: 'Depois da captação',
    intro: 'O trabalho só acaba quando o material está seguro e entregue.',
    regras: [
      { t: 'Faz cópia de segurança no próprio dia', d: 'Pelo menos duas cópias em discos diferentes antes de dormires.' },
      { t: 'Não apagues os cartões', d: 'Só depois de a RL PROD confirmar que recebeu e verificou todo o material.' },
      { t: 'Organiza as pastas', d: 'Uma pasta por câmara e por cartão, com o nome AAAA-MM-DD_PROJETO_FUNÇÃO_CAM-A. Áudio numa pasta à parte.' },
      { t: 'Envia o material no portal até 48 horas depois', d: 'Na ficha do trabalho, em "Enviar material", cola o link da transferência (WeTransfer, Google Drive ou Dropbox) com validade de pelo menos 7 dias.' },
      { t: 'Junta uma nota curta', d: 'O que gravaste, cartões, o que correu menos bem e momentos especiais que vale a pena ver primeiro.' },
    ],
  },
  {
    id: 'confidencialidade',
    titulo: 'Confidencialidade e redes sociais',
    intro: 'Os nossos clientes confiam-nos momentos únicos. Essa confiança protege-se todos os dias.',
    regras: [
      { t: 'O material pertence à RL PROD e ao cliente', d: 'Não o uses, vendas nem partilhes fora da RL PROD.' },
      { t: 'Nada nas redes sem autorização escrita', d: 'Nem imagens, nem bastidores, nem histórias. Quando houver autorização, identifica sempre a @rlprod.' },
      { t: 'Bastidores sem o cliente', d: 'Mesmo com autorização, não mostres rostos do cliente nem dos convidados antes da entrega final.' },
      { t: 'O briefing e o guião são confidenciais', d: 'São só para ti. Não os reencaminhes nem tires capturas de ecrã para partilhar.' },
      { t: 'Contactos do cliente', d: 'Não contactes o cliente diretamente fora do trabalho nem ofereças os teus serviços em nome próprio.' },
    ],
  },
  {
    id: 'comunicacao',
    titulo: 'Comunicação com a RL PROD',
    regras: [
      { t: 'Canal principal: WhatsApp', d: 'Responde às mensagens de trabalho no próprio dia.' },
      { t: 'Imprevistos: avisa de imediato', d: 'Atrasos, doença ou problemas no caminho. Liga ao responsável, não esperes.' },
      { t: 'Cancelamentos com 72 horas', d: 'Salvo motivo de força maior. Um cancelamento em cima da hora deixa o cliente sem cobertura.' },
      { t: 'Mantém os teus dados em dia', d: 'IBAN, NIF, contacto de urgência. Se algo mudar, avisa para atualizarmos a tua ficha.' },
    ],
  },
  {
    id: 'pagamentos',
    titulo: 'Pagamentos',
    regras: [
      { t: 'O valor fica combinado antes do trabalho', d: 'Aparece na ficha de cada trabalho no teu portal.' },
      { t: 'O pagamento segue a entrega do material', d: 'Depois de o material ser recebido e verificado pela RL PROD. Acompanha o estado em "Pagamentos".' },
      { t: 'Envia o recibo ou a fatura', d: 'Com o NIF da RL PROD e a referência do projeto.' },
    ],
  },
]

export const NUNCA = [
  'Chegar atrasado sem avisar',
  'Formatar ou apagar cartões antes da confirmação da RL PROD',
  'Beber álcool durante o trabalho',
  'Falar de preços, prazos ou entregas com o cliente',
  'Publicar material do cliente sem autorização escrita',
  'Usar o telemóvel pessoal à frente do cliente',
  'Esconder um problema técnico ou um momento perdido',
  'Deixar o equipamento sem vigilância',
]

export const CHECKLISTS = [
  { titulo: 'Na véspera', itens: ['Briefing e guião lidos', 'Baterias carregadas e de reserva', 'Cartões vazios e formatados', 'Lentes e sensor limpos', 'Definições de câmara combinadas', 'Roupa preparada', 'Percurso e hora de saída', 'Confirmação com o responsável'] },
  { titulo: 'No dia', itens: ['Chegar 30 minutos antes', 'Apresentar-me ao cliente', 'Telemóvel em silêncio', 'Testar áudio', 'Planos de segurança dos momentos-chave', 'Cartões cheios guardados à parte'] },
  { titulo: 'Depois', itens: ['Duas cópias de segurança no próprio dia', 'Pastas organizadas com o nome certo', 'Link enviado no portal até 48 horas', 'Nota com o resumo do trabalho', 'Cartões guardados até confirmação'] },
]
