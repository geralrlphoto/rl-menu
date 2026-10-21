// Propostas automáticas da ficha do CRM (botão "Gerar propostas automáticas").
// Regras fixas, sem IA: partem das propostas que o Rui tem fechado (BASIC ~2.000 €,
// ESSENCIAL ~2.600 €, SIGNATURE ~3.150 €; só foto ou só vídeo ~850 €) e do que as
// análises das reuniões mostraram (respeitar o teto, oferta no pack que podem pagar,
// o que pediram entra nas propostas). Devolve as 3 propostas e o comentário com o porquê.

import { parseOrcamento } from '@/lib/crm'

export type PropostaAuto = { nome: string; servicos_foto: string[]; servicos_video: string[]; valor: string; oferta?: string }
export type Lead = { orcamento?: string; servicos?: string; num_convidados?: string; local_casamento?: string; tipo_evento?: string }

type Nivel = { nome: string; foto: string[]; video: string[]; preco: { ambos: number; foto: number; video: number } }

// Serviços por nível (nomes iguais aos do catálogo; os que não existirem no catálogo são ignorados)
const NIVEIS: Nivel[] = [
  {
    nome: 'BASIC',
    foto: ['1 Fotógrafo', 'Rep. Todo Evento', '600 Fotografias Editadas', 'Álbum 25×25 — 30 Fotos', 'Entrega por Link', 'Deslocação'],
    video: ['1 Videógrafo', 'Rep. Todo Evento', 'Vídeo até 20 min | Full HD', 'Teaser', 'Entrega por Link', 'Deslocação'],
    preco: { ambos: 2000, foto: 850, video: 950 },
  },
  {
    nome: 'ESSENCIAL',
    foto: ['2 Fotógrafos', 'Rep. Todo Evento', '700 Fotografias Editadas', 'Sessão Pré-Wedding', 'Álbum 25×25 — 30 Fotos', 'Entrega por Link', 'Deslocação'],
    video: ['2 Videógrafos', 'Rep. Todo Evento', 'Vídeo até 20 min | Full HD', 'Teaser', 'Drone', 'Entrega por Link', 'Deslocação'],
    preco: { ambos: 2600, foto: 1250, video: 1500 },
  },
  {
    nome: 'SIGNATURE',
    foto: ['2 Fotógrafos', 'Rep. Todo Evento', '800 Fotografias Editadas', 'Sessão Pré-Wedding', 'Álbum 30×30 — 50 Fotos', 'Entrega em Pen Box', 'Deslocação'],
    video: ['2 Videógrafos', 'Rep. Todo Evento', 'Vídeo até 20 min | Full HD', 'Qualidade 4K', 'Drone', 'Same Day Edit', 'Trailer', 'Entrega por Link', 'Deslocação'],
    preco: { ambos: 3150, foto: 1650, video: 2000 },
  },
]

const euros = (n: number) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')} €`
const arred50 = (n: number) => Math.round(n / 50) * 50

export function gerarPropostasAuto(lead: Lead, catalogo: { foto: string[]; video: string[] }): { propostas: PropostaAuto[]; comentario: string[]; recomendada: number } {
  const pedidos = (lead.servicos || '').toLowerCase()
  const querFoto = /fotograf/.test(pedidos)
  const querVideo = /v[íi]deo/.test(pedidos)
  // Sem indicação no formulário, propõe os dois (é o que mais se fecha)
  const tipo: 'ambos' | 'foto' | 'video' = querFoto && !querVideo ? 'foto' : querVideo && !querFoto ? 'video' : 'ambos'
  const teto = parseOrcamento(lead.orcamento)
  const convidados = parseInt(String(lead.num_convidados || '').replace(/\D/g, ''), 10) || 0
  const pediuDrone = /drone/.test(pedidos)
  const pediuPreWedding = /pr[ée]-?wedding/.test(pedidos)
  const pediuSde = /same day/.test(pedidos)
  const pediuAlbum = /[áa]lbum/.test(pedidos)

  const noCatalogo = (lista: string[], cat: string[]) => lista.filter(s => cat.includes(s))
  const comentario: string[] = []

  comentario.push(
    tipo === 'ambos'
      ? (querFoto && querVideo ? 'Pediram fotografia e vídeo, por isso as três propostas levam os dois.' : 'O formulário não diz que serviços querem, por isso propus fotografia e vídeo (é o que mais se fecha).')
      : tipo === 'foto' ? 'Só pediram fotografia: as três propostas são só de fotografia, com valores de serviço único.'
      : 'Só pediram vídeo: as três propostas são só de vídeo, com valores de serviço único.',
  )

  const propostas: PropostaAuto[] = NIVEIS.map(n => ({
    nome: n.nome,
    servicos_foto: tipo === 'video' ? [] : noCatalogo(n.foto, catalogo.foto),
    servicos_video: tipo === 'foto' ? [] : noCatalogo(n.video, catalogo.video),
    valor: String(n.preco[tipo]),
  }))

  // Muitos convidados: 2 fotógrafos já na BASIC (uma pessoa não chega a tudo)
  if (convidados >= 120 && tipo !== 'video') {
    const b = propostas[0]
    b.servicos_foto = b.servicos_foto.map(s => s === '1 Fotógrafo' ? '2 Fotógrafos' : s)
    b.valor = String(Number(b.valor) + 250)
    comentario.push(`Têm ${convidados} convidados: pus 2 fotógrafos já na BASIC (+250 €), porque com tanta gente uma pessoa não chega a tudo.`)
  }

  // O que pediram no formulário entra nas propostas
  if (pediuAlbum) comentario.push('Pediram álbum impresso: as três propostas já incluem álbum.')
  if (pediuSde) comentario.push('Pediram Same Day Edit: só está na SIGNATURE, porque é o que a diferencia. Se o teto não chegar, é um extra para decidirem mais perto da data.')

  // Teto do orçamento: há sempre uma proposta que cabe (nunca mais de 10% acima)
  const valores = propostas.map(p => Number(p.valor))
  let cabe = -1
  if (teto > 0) {
    valores.forEach((v, i) => { if (v <= teto * 1.1) cabe = i })
    if (cabe === -1) {
      // Nem a BASIC cabe: baixa-se a BASIC tirando serviços, não dando desconto
      const b = propostas[0]
      b.servicos_video = b.servicos_video.filter(s => s !== 'Teaser')
      b.servicos_foto = b.servicos_foto.filter(s => !/^Álbum/.test(s))
      const novo = Math.max(arred50(teto), tipo === 'ambos' ? 1500 : 750)
      comentario.push(`O teto é ${euros(teto)} e nem a BASIC (${euros(valores[0])}) cabia. Baixei a BASIC para ${euros(novo)} tirando o teaser e o álbum, em vez de dar desconto. Confirma se o valor te serve.`)
      b.valor = String(novo)
      cabe = 0
    } else {
      comentario.push(`O teto indicado é ${euros(teto)} (orçamento: ${lead.orcamento}). A ${propostas[cabe].nome} (${euros(Number(propostas[cabe].valor))}) é a mais completa que cabe nele: marquei-a como recomendada na Proposta Criativa.`)
    }
  } else {
    cabe = 1
    comentario.push('Não há orçamento no formulário: deixei os valores da tabela. Pergunta o teto na reunião antes de mostrar os preços.')
  }

  // Oferta: só no pack que podem pagar e só com algo que pediram (nunca no mais caro)
  const alvo = propostas[cabe]
  const temDrone = alvo.servicos_video.includes('Drone')
  const temPre = alvo.servicos_foto.includes('Sessão Pré-Wedding') || alvo.servicos_video.includes('Sessão Pré-Wedding')
  if (pediuDrone && !temDrone && tipo !== 'foto' && catalogo.video.includes('Drone')) {
    alvo.oferta = `Se reservarem a data, oferecemos o serviço de drone na ${alvo.nome}.`
    comentario.push(`Pediram drone e a ${alvo.nome} não o tem: deixei-o como oferta nessa proposta, com a condição de reservarem a data. Oferta escrita, no pack que podem pagar.`)
  } else if (pediuPreWedding && !temPre && tipo !== 'video') {
    alvo.oferta = `Se reservarem a data, oferecemos a sessão pré-wedding na ${alvo.nome}.`
    comentario.push(`Pediram pré-wedding e a ${alvo.nome} não a tem: deixei-a como oferta nessa proposta, com a condição de reservarem a data.`)
  }

  comentario.push('Os serviços seguem as propostas que tens fechado: BASIC com 1 pessoa por serviço, ESSENCIAL com 2 e pré-wedding, SIGNATURE com 4K, Same Day Edit e álbum 30×30. Revê e ajusta antes de guardar.')
  return { propostas, comentario, recomendada: cabe }
}
