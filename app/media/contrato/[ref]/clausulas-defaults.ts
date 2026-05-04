export type ClausulasMap = Record<string, string>

export const CLAUSULAS_EDITAVEIS: { key: string; titulo: string }[] = [
  { key: 'c1',                 titulo: 'Primeira Cláusula' },
  { key: 'c2_servicos',        titulo: 'Segunda Cláusula — Regras dos Serviços' },
  { key: 'c2_cancelamento',    titulo: 'Segunda Cláusula — Cancelamento' },
  { key: 'c3',                 titulo: 'Terceira Cláusula' },
  { key: 'c4',                 titulo: 'Quarta Cláusula' },
  { key: 'c5',                 titulo: 'Quinta Cláusula' },
  { key: 'c6',                 titulo: 'Sexta Cláusula' },
  { key: 'c7',                 titulo: 'Sétima Cláusula' },
  { key: 'c8',                 titulo: 'Oitava Cláusula' },
  { key: 'c9',                 titulo: 'Nona Cláusula' },
  { key: 'c10',                titulo: 'Décima Cláusula' },
  { key: 'c11',                titulo: 'Décima Primeira Cláusula' },
  { key: 'c12',                titulo: 'Décima Segunda Cláusula' },
  { key: 'dos_servicos',       titulo: 'Dos Serviços Contratados' },
  { key: 'confidencialidade',  titulo: 'Confidencialidade' },
  { key: 'dados_pessoais',     titulo: 'Dados Pessoais' },
  { key: 'lei_foro',           titulo: 'Lei e Foro' },
  { key: 'disposicoes_finais', titulo: 'Disposições Finais' },
  { key: 'anexo_intro',        titulo: 'Anexo I — Introdução' },
  { key: 'anexo_nota',         titulo: 'Anexo I — Nota Final' },
  { key: 'considerandos',      titulo: 'Considerandos (intro)' },
]

export const CLAUSULAS_DEFAULT: ClausulasMap = {
  considerandos:
`Considerando que:
i. A Prestadora de Serviços, entre outros, dedica-se à prestação de produção de vídeos e fotografia bem como a criação de um website.
ii. O Cliente pretende contratar os serviços de produção de vídeo, fotografia e website.
É livremente estabelecido e mutuamente aceite, nos termos e condições aqui estabelecidos, o presente Contrato de Prestação de Serviços (doravante, o "Contrato") que se regerá pelos considerados acima e pelas seguintes cláusulas:`,

  c1:
`A prestadora de serviço compromete-se a executar os serviços de produção de conteúdo audiovisual ao cliente, assumindo a correspondente responsabilidade técnica pela elaboração dos mesmos. A prestação dos serviços é realizada com autonomia técnica e criativa, sendo as estratégias e sugestões de desenvolvimento, elaboradas com base no conhecimento da equipa da prestadora, as quais são discutidas e partilhadas com o cliente.`,

  c2_servicos:
`Os serviços prestados pela primeira parte estão sujeitos a regras de utilização que visam o bom funcionamento dos mesmos, nomeadamente:
1. Relativas aos serviços prestados:
a) No caso de atrasos na entrega de dados ou informação necessária à realização dos serviços contratados pelo cliente, a prestadora não se responsabiliza pelo incumprimento do prazo de entrega e declina todas e quaisquer responsabilidades por erros ou omissões que possam existir e não tenham sido devidamente identificados e anotados pelo cliente nos suportes documentais apresentados e comunicados por escrito para a prestadora.
b) A aprovação ou pedido de alterações aos planeamentos devem ser comunicados por escrito no prazo máximo de 3 (três) dias úteis após a sua boa receção. No caso de solicitar alterações, a prestadora compromete-se com o prazo máximo de 10 (dez) dias úteis para alterações e o envio do novo conteúdo por e-mail para aprovação.
c) Na falta de resposta dentro do prazo, ao exposto nas anteriores alíneas a prestadora considera o trabalho aprovado e não se responsabilizando por demais alterações.
d) As avenças mensais serão faturadas na última semana de cada mês com prazo de pagamento de 5 dias úteis para efetuar o mesmo.
e) No caso da contratação para a cobertura de eventos e os mesmos sofrerem alterações de qualquer natureza, é obrigação do cliente informar via e-mail à produtora as alterações. O novo agendamento ficará sujeito a confirmação, mediante disponibilidade de datas da produtora.`,

  c2_cancelamento:
`2. Cancelamento na prestação dos serviços:
O cliente ficará sujeito ao cancelamento da prestação de serviços sempre que:
a) Publique conteúdos ilegais ou impróprios associados ao nome da prestadora.
b) Seja insultuosa com entidades coletivas, particulares ou quaisquer outras.
c) Invada a privacidade e/ou ponha em risco a integridade do utilizador ou do conteúdo produzido pela prestadora.
d) Publicar conteúdos que incitem à violência, intolerância ou qualquer outro comportamento censurável.
e) Seja incumpridora relativamente ao pagamento dos serviços prestados pela primeira outorgante, dentro do prazo estipulado neste contrato.`,

  c3:
`O cliente aceita, salvo disposição expressa em contrário, que a prestadora possa colocar a sua imagem e/ou menção aos seus serviços em todos os suportes gráficos a desenvolver e possa utilizar o projeto no seu website, portfólio e outros meios de promoção.
a) Produções extras: Todas as propostas apresentadas pela produtora que não sejam aprovadas pelo cliente e/ou não resultem em aprovação de proposta com valores e contrato validado, são propriedade exclusiva da prestadora.`,

  c4:
`a) O incumprimento pelo cliente das regras de utilização, mencionadas nas cláusulas anteriores, traduzem-se no cancelamento dos serviços prestados, ficando aquela sem direito a devolução do valor pago pela mesma.
b) O cliente deve nomear um responsável, devendo identificá-lo, por escrito, o qual irá assegurar a dinâmica necessária na troca de informação com a prestadora, sendo responsável pela disponibilização, em tempo útil, de todos os dados necessários à correta elaboração da prestação de serviços.`,

  c5:
`A prestadora não se responsabiliza pelos conteúdos publicados pelo cliente, sendo a responsabilidade dos mesmos do seu autor, mesmo que publicados por colaboradores da prestadora a pedido do cliente.`,

  c6:
`A prestadora reserva o direito de debitar a totalidade do valor da prestação de serviços, caso haja incumprimento, pelo cliente, na entrega dos conteúdos ou tomadas de decisão para o avanço do projeto no período superior a 22 dias úteis, respetivamente em trabalhos que demandem agendamentos e reservas prévias de materiais, equipamentos e deslocação de profissionais.`,

  c7:
`As deslocações estão incluídas no presente contrato. Deslocações prevista fora do acordado será taxado a um valor de 0,45€ por quilometro.`,

  c8:
`Após a rescisão de algum dos serviços contratados, por motivo explícito em alguma cláusula deste contrato, em especial para pacotes de serviços diversificados, os trabalhos desenvolvidos e afetos a este contrato e ainda não facultados ao cliente podem por solicitados no prazo de 15 dias, a contar da data de rescisão, desde que nada seja devido à prestadora.`,

  c9:
`O não consumo dos serviços prestados pelo presente contrato, por incumprimento da parte do cliente, é da responsabilidade do mesmo e não são acumuláveis com outros, nem podem ser trocados por quaisquer outros serviços da prestadora.`,

  c10:
`O presente contrato inicia-se imediatamente após assinatura por parte do cliente, e tem a duração pelo prazo de execução dos serviços apresentados na proposta e até a entrega final do conteúdo contratado.`,

  c11:
`O presente contrato pode ser rescindido por qualquer das partes com justa causa, devendo essa rescisão verificar-se através de carta registada com aviso de receção, na qual se invoquem os seus motivos.
a) A rescisão contratual sem justa causa, obrigará o cliente a liquidar de forma imediata, o valor acordado pelos outorgantes para pagamento dos serviços prestados pela prestadora e demais despesas que tenham incorrido por parte da mesma, a fim de realizar os serviços para o cliente, conforme proposto.`,

  c12:
`Os prazos de entrega do projeto, video fotografia e website prevemos que este seja entregue num prazo não superior a 90 dias úteis.`,

  dos_servicos:
`Descritivo dos Serviços: O descritivo de todos os serviços contemplados neste contrato encontrar-se-ão no ANEXO I deste contrato.`,

  confidencialidade:
`a) Todas as comunicações trocadas entre a prestadora e o cliente, são confidenciais.
b) Todos os projetos, propostas e materiais para aprovação, apresentados pela prestadora ao cliente, são confidenciais, não podendo o último divulgá-las a terceiros ou facilitar o acesso às mesmas, durante a execução dos serviços, sob pena de incumprimento do presente contrato e responsabilidade civil contratual perante a prestadora.
c) Todas as informações transmitidas à prestadora, que digam respeito ao know-how, estratégia e organização comercial do cliente, só serão usadas pela prestadora para efeitos de execução do presente contrato, sempre com pré-aprovação do cliente.
d) O cliente desde já autoriza a prestadora a utilizar a(s) marca(s) do primeiro, em tudo o quanto diga respeito à execução do presente contrato.`,

  dados_pessoais:
`Os dados pessoais das PARTES neste contrato, são exclusivamente processados para efeitos da execução do presente contrato e obrigações legais associadas. Os mesmos serão tratados em observância das regras aplicáveis em matéria de proteção de dados, designadamente o RGPD, sendo conservados enquanto tal for exigido por lei.`,

  lei_foro:
`Em tudo o que não estiver previsto no presente contrato, aplicam-se as normas do Código Civil, onde obrigam-se as partes a desenvolver todos os esforços na resolução amigável e extrajudicial de quaisquer diferendos que possam surgir. Na falta de possibilidade de alcançar solução consensual, para litígios emergentes da execução do Contrato, é competente o Tribunal Judicial da Comarca de Lisboa com expressa renúncia a qualquer outro.`,

  disposicoes_finais:
`Qualquer alteração ao presente contrato deverá revestir a forma de documento escrito e será válida desde que acordada por todas as partes por escrito, com menção expressa de cada uma das cláusulas eliminadas e da redação de cada uma das aditadas ou modificadas.
Para efeitos do presente contrato, todas as comunicações oficiais deverão realizar-se para o seguinte endereço de correio eletrónico: geral.rlphoto@gmail.com
Este presente contrato segue devidamente preenchido com os dados fornecidos e deve ser assinado pelo representante legal da segunda outorgante, bem como constar o carimbo da empresa no local indicado abaixo. Após assinatura e carimbo, o documento deverá ser digitalizado e encaminhado para o e-mail indicado acima para que seja realizado o mesmo procedimento pela parte da prestadora, formalizando-se, em duas vias de igual teor, o contrato entre as partes.`,

  anexo_intro:
`Esse ANEXO I é parte integrante do Contrato de Prestação de Serviços. O descritivo abaixo refere-se a todos os serviços contemplados no contrato, conforme mencionado no item DOS SERVIÇOS CONTRATADOS.`,

  anexo_nota:
`*O contrato entre as partes é válido até que a entrega de todos os conteúdos contratados, seja finalizada. A forma de pagamento antecipada aos serviços não retira da prestadora a sua responsabilidade com o cliente.`,
}

/** Devolve o texto de uma cláusula — override do Supabase ou default */
export function getClausula(clausulas: ClausulasMap, key: string): string {
  return clausulas[key] ?? CLAUSULAS_DEFAULT[key] ?? ''
}
