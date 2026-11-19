/* ============================================================
   Modelos das mensagens aos convidados do podcast.

   Vêm do plano do programa (secção "Como convidar"), com duas
   mudanças pedidas pelo Rui a 2026-11-19:
   - o Rui apresenta-se como "Rui Gonçalves, da RL Photo.Video"
     (sem "CEO" e sem "filmo e fotografo casamentos");
   - o convidado recebe só o ficheiro do episódio (sem retrato nem
     cortes verticais).

   Os dados do episódio entram sozinhos; o que não existir fica entre
   parênteses retos para preencher à mão. Sem emojis: no WhatsApp
   via wa.me viram "?".
   ============================================================ */

export type DadosMensagem = {
  nome?: string | null
  tema: string
  dataPublicacao?: string | null
  gravacaoData?: string | null
  gravacaoHora?: string | null
  gravacaoLocal?: string | null
  linkEpisodio?: string | null
  linkYoutube?: string | null
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado']

function dataLonga(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso)
  if (isNaN(d.getTime())) return null
  return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`
}
function mes(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : MESES[d.getMonth()]
}

export const MODELOS = [
  { chave: 'dm', titulo: 'Mensagem direta', quando: 'Primeiro contacto' },
  { chave: 'email', titulo: 'Email de convite', quando: 'Primeiro contacto' },
  { chave: 'insistencia', titulo: 'Insistência', quando: '7 dias sem resposta' },
  { chave: 'datas', titulo: 'Proposta de data', quando: 'Depois do sim' },
  { chave: 'confirmacao', titulo: 'Confirmação', quando: '7 dias antes' },
  { chave: 'temas', titulo: 'Envio dos temas', quando: '2 dias antes' },
  { chave: 'agradecimento', titulo: 'Agradecimento', quando: 'No dia da gravação' },
  { chave: 'kit', titulo: 'Episódio no ar', quando: 'Dia da publicação' },
] as const

export type ChaveModelo = typeof MODELOS[number]['chave']

export function textoModelo(chave: ChaveModelo, d: DadosMensagem): { assunto?: string; texto: string } {
  const nome = (d.nome ?? '').trim().split(/\s+/)[0] || '[Nome]'
  const tema = d.tema || '[tema]'
  const m = mes(d.dataPublicacao) ?? '[mês]'
  const gData = dataLonga(d.gravacaoData) ?? '[data]'
  const gHora = d.gravacaoHora || '[hora]'
  const gLocal = d.gravacaoLocal || '[morada completa e nota de estacionamento]'
  const pub = dataLonga(d.dataPublicacao) ?? '[data]'
  const link = d.linkEpisodio || '[ligação]'
  const yt = d.linkYoutube || '[ligação YouTube]'

  switch (chave) {
    case 'dm':
      return { texto:
`Olá ${nome}, tudo bem?
Sou o Rui Gonçalves, da RL Photo.Video, aqui na zona de Setúbal e Palmela.
Estamos a lançar o Antes do Sim, um podcast mensal para noivos que estão a planear o casamento, onde convidamos quem trabalha no setor para explicar as coisas que os noivos só descobrem tarde demais. O episódio de ${m} é sobre ${tema} e lembrei-me logo de si.
São 45 minutos de conversa, gravados em vídeo, sem preparação necessária da sua parte. Posso enviar-lhe os detalhes?
Obrigado pelo tempo.` }

    case 'email':
      return { assunto: `Convite para o podcast Antes do Sim | episódio sobre ${tema}`, texto:
`Olá ${nome},

Chamo-me Rui Gonçalves e sou da RL Photo.Video, em Palmela.

Estamos a produzir o Antes do Sim, um podcast mensal dirigido a casais em fase de planeamento. Cada episódio é uma conversa de 45 minutos com um profissional do setor sobre um tema concreto, para ajudar os noivos a decidir melhor.

O episódio de ${m} é sobre ${tema} e gostaríamos de o ter como convidado, pelo trabalho que tem feito em [referência concreta e verdadeira].

O que implica da sua parte: 45 minutos de conversa, mais cerca de 30 minutos de preparação no local. Não precisa de preparar nada, os temas são enviados com antecedência.

O que recebe: o ficheiro do episódio completo, para publicar nos seus canais.

Pode ver como funciona aqui: https://portal.rlphotovideo.pt/podcast/apresentacao

Cumprimentos,
Rui Gonçalves · RL Photo.Video
912 932 768 · www.rlphotovideo.pt` }

    case 'insistencia':
      return { texto:
`Olá ${nome}, só para garantir que a minha mensagem não se perdeu. Continuamos com interesse em tê-lo no episódio sobre ${tema}. Se agora não for altura, diga-me e voltamos a falar mais para a frente, sem problema nenhum.` }

    case 'datas':
      return { texto:
`Ótimo, obrigado pela disponibilidade.
Temos duas janelas de gravação: [data 1, dia da semana, hora] ou [data 2, dia da semana, hora]. Alguma destas serve?
A gravação é em ${d.gravacaoLocal || '[local]'} e conta com cerca de 90 minutos no total, entre preparação e conversa.` }

    case 'confirmacao':
      return { texto:
`Olá ${nome}, confirmação da nossa gravação.
Data: ${gData}, às ${gHora}
Local: ${gLocal}
Duração: cerca de 90 minutos no total
Roupa: cores lisas, evite riscas finas, xadrez miúdo e verde forte. Camisa ou blusa lisa funciona sempre bem.
Nota: gravamos em vídeo, com duas câmaras. Envio-lhe os temas da conversa dois dias antes, para não haver surpresas.
Não precisa de levar nada. Se quiser mostrar algum trabalho ou material seu no episódio, traga.` }

    case 'temas':
      return { texto:
`Olá ${nome}, deixo os temas da conversa. Não são um guião rígido e não precisa de decorar respostas, a ideia é conversarmos com naturalidade.
1. [tema]
2. [tema]
3. [tema]
4. Uma história de algo que correu mal e o que aprendeu com isso
5. Três conselhos para quem está a planear o casamento
O ponto 5 é a rubrica fixa do programa, é a única pergunta que peço que traga pensada.` }

    case 'agradecimento':
      return { texto:
`${nome}, muito obrigado pela conversa de hoje, ficou excelente. O episódio sai ${pub === '[data]' ? 'a [data]' : 'na ' + pub} e envio-lhe o ficheiro nesse dia.` }

    case 'kit':
      return { texto:
`Olá ${nome}, o episódio está no ar.
Ouvir: ${link}
Ver: ${yt}
Deixo o ficheiro do episódio para publicar nos seus canais. Se quiser partilhar, aqui fica um texto que pode copiar:
"Estive à conversa no podcast Antes do Sim sobre ${tema}. Falámos de [ponto 1], [ponto 2] e daquilo que ninguém diz aos noivos sobre [ponto 3]. Fica aqui para quem estiver a planear o casamento: ${link}"
Obrigado outra vez pela disponibilidade.` }
  }
}

/** Número português para wa.me: "912 932 768" → "351912932768". */
export function numeroWhatsapp(tel?: string | null): string | null {
  if (!tel) return null
  let n = tel.replace(/\D/g, '')
  if (n.startsWith('00')) n = n.slice(2)
  if (n.length === 9) n = '351' + n
  return n.length >= 11 ? n : null
}
