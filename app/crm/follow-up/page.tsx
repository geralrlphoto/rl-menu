'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ──────────────────────────────────────────────────────────────
   MAPA DE FOLLOW UP  —  guia de referência com ramificação
   3 origens (Site / Casamentos.pt / Direto).
   Fluxo: 1ª mensagem → escolher "Deu resposta" ou "Não respondeu"
   → aparecem os próximos passos desse caminho.
   Edita livremente os textos aqui em baixo.
   Placeholders: [nome], [data], [local] são substituídos à mão.
   ────────────────────────────────────────────────────────────── */

const FORM_URL = 'https://portal.rlphotovideo.pt/nova-lead'
const HERO_URL = 'https://portal.rlphotovideo.pt/casamentos-2028.png'

const PILARES = [
  { icon: '⚡', titulo: 'Responder primeiro', texto: 'Quem responde mais depressa cria a primeira ligação e fica logo à frente.' },
  { icon: '💛', titulo: 'Com empatia', texto: 'Follow up não é insistir. É mostrar, no tempo certo, que nos importamos a sério.' },
  { icon: '🎯', titulo: 'Com consistência', texto: 'Grande parte dos fechos acontece no seguimento, não no primeiro contacto.' },
]

/* Micro-dicas por fase — mostradas por baixo de cada passo (procura pelo título) */
const DICAS: Record<string, string> = {
  'Resposta imediata': 'Se tiveres o número, liga em vez de escrever. A voz cria ligação muito mais depressa.',
  'Chamada telefónica': 'Sorri enquanto falas, ouve-se do outro lado. E deixa-os falar mais do que tu.',
  'Enviar portal da reunião': 'Confirma que receberam mesmo o portal e pergunta se conseguiram abrir.',
  'Reunião feita · DFP no portal': 'Na reunião, ouve primeiro. A proposta encaixa melhor depois de perceberes o que valorizam.',
  'Fecharam contrato': 'Celebra com eles! O pós-fecho é o início da relação, não o fim.',
  'Vão dar uma resposta': 'Nunca pressiones. Um follow up caloroso vale mais do que dez insistências.',
  '2º follow up': 'Se puderes, acrescenta algo novo (um trabalho recente). Não repitas só "então?".',
  'Aguardar agendamento': 'Dá-lhes 2 ou 3 opções concretas de horário. Decidir é mais fácil do que inventar.',
  '1º lembrete': 'Se um canal não resultar, muda: sem resposta no email, tenta WhatsApp.',
  '1º lembrete (WhatsApp)': 'Sê breve e humano. Uma linha simpática abre mais portas do que um texto longo.',
  '2º lembrete': 'É o último toque deste caminho. Deixa a porta aberta, sem soar a despedida.',
}

/* Banco de respostas a objeções */
const OBJECOES = [
  {
    titulo: 'Está acima do nosso orçamento',
    resposta: `Compreendo perfeitamente, e agradeço a franqueza. 🙂

O nosso trabalho reflete tudo o que está por trás: a experiência, o cuidado em cada detalhe e a tranquilidade de saberem que o vosso dia fica em boas mãos.

Se quiserem, vemos juntos uma solução ajustada ao que faz sentido para vós, sem abdicar do essencial. O que acham?`,
  },
  {
    titulo: 'Vamos pensar / ainda estamos a decidir',
    resposta: `Claro, é uma decisão importante e faz todo o sentido pensarem com calma. 💛

Fico totalmente disponível para esclarecer qualquer dúvida que ajude nessa decisão. Posso perguntar: há algum ponto em concreto que vos deixe em dúvida? Assim consigo ajudar-vos melhor.`,
  },
  {
    titulo: 'Já temos fotógrafo / videógrafo',
    resposta: `Que bom que já têm essa parte tratada! 😊

Se um dia procurarem foto e vídeo em sintonia, trabalhamos os dois de forma integrada, o que faz toda a diferença no resultado final.

Fica o convite para verem o nosso trabalho e, se fizer sentido, será um prazer conversar.`,
  },
  {
    titulo: 'O casamento ainda é longe',
    resposta: `Sim, e é ótimo estarem a tratar disto com antecedência! ⏳

As melhores datas costumam fechar cedo, por isso garantir já a vossa é a forma de ficarem descansados. Sem qualquer pressão, fico disponível para reservarmos o vosso dia quando estiverem prontos.`,
  },
  {
    titulo: 'Encontrámos mais barato',
    resposta: `Compreendo, e há de facto muitas opções. 🙂

A diferença está no que não se vê no preço: a consistência, a experiência a lidar com imprevistos e a forma como cuidamos de vós do início ao fim. É a vossa memória para a vida, e isso merece confiança total.

Adorávamos mostrar-vos porque vale a pena.`,
  },
]

type Fase = {
  titulo: string
  quando: string
  objetivo: string
  mensagem: string
}

type Origem = {
  id: string
  label: string
  emoji: string
  descricao: string
  inicial: Fase
  deuResposta: Fase[]
  naoRespondeu: Fase[]
}

/* Guião da chamada telefónica — passo partilhado pelas três origens,
   logo a seguir ao formulário preenchido. */
type ScriptSeccao = { titulo: string; itens: string[] }

const TELEFONEMA = {
  titulo: 'Chamada telefónica',
  quando: 'Assim que recebemos o formulário preenchido',
  objetivo: 'Primeira abordagem curta (cerca de 2 minutos). Não é aqui que fazemos todas as perguntas, isso fica para a reunião. Só queremos criar o primeiro contacto e propor essa reunião. Guião válido para as três origens.',
  intro: `Olá [nome], daqui é o Rui da RL Photo.Video, tudo bem? 😊 Recebi o vosso formulário, muito obrigado!

Este é um momento oportuno para falarmos dois minutinhos?`,
  seccoes: [
    { titulo: 'Perguntar apenas (nada mais nesta chamada)', itens: [
      'De onde são os noivos?',
      'Onde será, possivelmente, a preparação do dia?',
    ] },
  ] as ScriptSeccao[],
  fecho: `Aqui na RL, optamos por criar uma relação de empatia e de amizade com os nossos noivos. Por isso, privilegiamos sempre uma reunião, presencial ou por videochamada, para vos conhecermos e vocês nos conhecerem a nós.

É também nessa reunião que vos mostramos o nosso método de trabalho e apresentamos os nossos serviços. Temos uma forma muito diferenciada de trabalhar, como já devem ter sentido no formulário que preencheram.

Faz sentido para vós marcarmos essa conversa?`,
  destaque: `Se aceitarem, perguntar já: Que disponibilidade têm em termos de horários? Assim ajustamo-nos a vocês e combinamos logo o melhor dia. 🗓️`,
}

function telefonemaTexto(t: typeof TELEFONEMA): string {
  const linhas: string[] = ['ABERTURA', t.intro, '']
  t.seccoes.forEach(s => {
    linhas.push(s.titulo.toUpperCase())
    s.itens.forEach(it => linhas.push('• ' + it))
    linhas.push('')
  })
  linhas.push('FECHO', t.fecho, '', '➤ ' + t.destaque)
  return linhas.join('\n')
}

/* Sub-caminho após a chamada, quando aceitam a reunião */
const ENVIAR_PORTAL_REUNIAO: Fase = {
  titulo: 'Enviar portal da reunião',
  quando: 'Marcaram logo o dia',
  objetivo: 'Na ficha da lead (CRM), preencher data, hora e tipo e clicar em "Enviar Reunião". O portal com os detalhes segue para os noivos. Podes reforçar por mensagem.',
  mensagem: `Ficou combinado! 🎉

Reunião marcada para [data] às [hora] ([presencial / videochamada]).

Acabei de vos enviar o vosso portal com todos os detalhes. É só confirmarem por lá:

👉 [link do portal]

Até já! Um abraço,
RL`,
}

const AGUARDAR_AGENDAMENTO: Fase = {
  titulo: 'Aguardar agendamento',
  quando: 'Vão ver a disponibilidade · toque após 24h sem resposta',
  objetivo: 'Ficam de confirmar o horário. Se não disserem nada em 24 horas, enviar este toque suave.',
  mensagem: `Olá [nome], tudo bem? 🙂

Ficámos de combinar a nossa reunião. Já conseguiram ver a vossa disponibilidade? Digam-me só dois ou três horários que vos deem jeito e eu ajusto-me a vocês.

Fico a aguardar. Um abraço,
RL`,
}

/* Depois da reunião (quando marcaram o dia) */
const REUNIAO_DFP: Fase = {
  titulo: 'Reunião feita · DFP no portal',
  quando: 'No dia da reunião',
  objetivo: 'Fazemos a reunião e disponibilizamos o DFP no portal, para os noivos verem a nossa proposta.',
  mensagem: `Foi um enorme prazer conversar convosco! 😊

Como combinado, deixámos o vosso DFP disponível no portal, com toda a nossa proposta. Vejam com calma e, qualquer dúvida, é só dizerem.

Um abraço,
RL`,
}

const FECHOU_CONTRATO: Fase = {
  titulo: 'Fecharam contrato',
  quando: 'Fecham logo na reunião',
  objetivo: 'Pedir para confirmarem a proposta no portal da reunião e preencherem os dados solicitados. Em 2 a 3 dias recebem o portal dos noivos com toda a informação.',
  mensagem: `Que alegria ter-vos connosco! 🎉 Muito obrigado pela vossa confiança.

Para avançarmos, é só confirmarem a proposta no portal da reunião e preencherem os dados que vos são solicitados.

Dentro de 2 a 3 dias recebem o vosso portal dos noivos, com toda a informação reunida num só sítio.

Estamos muito felizes por fazer parte do vosso dia. Um abraço,
RL`,
}

const AGUARDA_RESPOSTA_48H: Fase = {
  titulo: 'Vão dar uma resposta',
  quando: 'Ficaram de responder · follow up após 48h',
  objetivo: 'Ficam de decidir. Esperamos até 48 horas; se não houver resposta, enviar este follow up.',
  mensagem: `Olá [nome]! 🙂

Fiquei com um sorriso depois da nossa reunião. Foi mesmo especial. Deu para sentir a vibe e a atmosfera que se criou entre nós, e acredito que isso foi notório para todos. É exatamente essa ligação que adoramos criar com os nossos noivos e que depois se vê nas imagens do vosso dia.

Passei só para saber se já conseguiram rever a nossa proposta no portal com calma e se ficou alguma questão no ar.

Seja qual for a vossa decisão, foi um prazer enorme conhecer-vos. Estou aqui para o que precisarem. 💛

Um abraço,
RL`,
}

const AGUARDA_RESPOSTA_1SEMANA: Fase = {
  titulo: '2º follow up',
  quando: 'Após 1 semana sem resposta',
  objetivo: 'Se continuarem sem responder ao toque de 48h, enviar este segundo follow up, ainda caloroso e sem pressão.',
  mensagem: `Olá [nome]! 🙂

Voltei a lembrar-me de vocês e da boa energia da nossa conversa. Sei que esta é uma decisão importante e que merece o vosso tempo, por isso fica aqui apenas um miminho para saber como estão as coisas.

Se ainda tiverem alguma dúvida sobre a proposta, ou se quiserem que ajustemos algum detalhe para ficar tudo à vossa medida, é só dizerem. Fico muito feliz por vos ajudar.

Continuo por aqui, a torcer para fazermos parte do vosso grande dia. 💛

Um abraço,
RL`,
}

const ORIGENS: Origem[] = [
  /* ═══════════════ SITE ═══════════════ */
  {
    id: 'site',
    label: 'Site',
    emoji: '🌐',
    descricao: 'Lead que visitou o site e preencheu o formulário. Já temos a informação base; agradecemos e somos nós a entrar em contacto.',
    inicial: {
      titulo: 'Resposta imediata',
      quando: 'Mesmo dia (idealmente na 1ª hora)',
      objetivo: 'Agradecer a visita e o preenchimento do formulário, confirmar que temos a informação base e avisar que vamos entrar em contacto.',
      mensagem: `Olá [nome], tudo bem? 😊

Muito obrigado por nos terem visitado e por preencherem o formulário no nosso site. Com as informações que nos deixaram, já ficámos com uma primeira ideia do vosso casamento e daquilo que procuram.

Ficámos muito felizes por terem chegado até nós. Cada casal tem uma história única e adoramos poder fazer parte de um dia tão especial.

O próximo passo é nosso: vamos analisar tudo com atenção e entramos em contacto convosco em breve para conversarmos com calma, esclarecer todas as dúvidas e perceber se somos a equipa certa para contar a vossa história.

Entretanto, convidamos-vos a espreitar o nosso Instagram, onde partilhamos casamentos reais e muitos momentos espontâneos. 📷 @rl.photo.video

Mais uma vez, obrigado pela vossa confiança. Falamos muito em breve!

Um abraço,
RL`,
    },
    deuResposta: [],
    naoRespondeu: [
      {
        titulo: '1º lembrete',
        quando: '2 a 3 dias sem resposta',
        objetivo: 'Toque suave a confirmar que a mensagem chegou.',
        mensagem: `Olá [nome], voltei a passar por aqui só para confirmar que a minha mensagem vos chegou. 🙂

Sei que esta fase de planeamento é uma correria. Sempre que fizer sentido para vocês, estou totalmente disponível para conversar sem qualquer compromisso.

Um abraço,
RL`,
      },
      {
        titulo: '2º lembrete',
        quando: '~7 dias sem resposta',
        objetivo: 'Dar valor e reforçar disponibilidade sem pressionar.',
        mensagem: `Olá [nome], espero que esteja tudo a correr bem com os preparativos. 💫

Queria só deixar a porta aberta. Se ainda estiverem a ponderar quem irá registar o vosso dia, adorava mostrar-vos o nosso trabalho e perceber se somos a escolha certa para vós.

Qualquer coisa, é só dizer. Um abraço,
RL`,
      },
    ],
  },

  /* ═══════════════ CASAMENTOS.PT ═══════════════ */
  {
    id: 'casamentos',
    label: 'Casamentos.pt',
    emoji: '💍',
    descricao: 'Lead vinda da plataforma Casamentos.pt. Costuma comparar vários fornecedores. Enviamos o formulário logo no primeiro contacto. Se não responderem pela plataforma em 24h, o follow up passa a ser feito por WhatsApp.',
    inicial: {
      titulo: 'Resposta imediata',
      quando: 'Mesmo dia (rapidez faz a diferença no portal)',
      objetivo: 'Agradecer o contacto e enviar já o formulário. Todos os noivos preenchem antes de avançarmos.',
      mensagem: `Olá! 😊

Que bom ter-vos por aqui!

Antes de mais, obrigado por terem entrado em contacto connosco. Agora queremos conhecer-vos um pouco melhor.

Preparámos um pequeno formulário que demora cerca de 2 minutos a preencher e que nos ajuda a perceber melhor aquilo que procuram para o vosso casamento.

👉 ${FORM_URL}

Enquanto isso, convidamos-vos também a espreitar o nosso Instagram. Lá partilhamos muitos casamentos reais, momentos espontâneos e histórias de outros casais. É a melhor forma de perceberem o nosso estilo e, quem sabe, encontrarem inspiração para o vosso grande dia.

📷 Instagram: @rl.photo.video

Assim que recebermos o vosso formulário, entraremos em contacto convosco para conversarmos com calma e percebermos se somos a equipa certa para contar a vossa história.

Mal podemos esperar para vos conhecer!`,
    },
    deuResposta: [],
    naoRespondeu: [
      {
        titulo: '1º lembrete (WhatsApp)',
        quando: '24h sem resposta na plataforma · passar para WhatsApp',
        objetivo: 'Se não responderem pela plataforma em 24 horas, o follow up passa a ser feito por WhatsApp. Reforçar o preenchimento do formulário, sabendo que estão a falar com vários fornecedores.',
        mensagem: `Olá! 🙂

Passámos por aqui só para confirmar que a nossa mensagem chegou. Sabemos que nesta fase estão a falar com vários fornecedores, por isso não queremos ocupar muito do vosso tempo.

Se ainda não tiveram oportunidade, deixamos outra vez o formulário. São só 2 minutos e ajuda-nos a preparar tudo à vossa medida:

👉 ${FORM_URL}

Ficamos a aguardar. Um abraço!`,
      },
      {
        titulo: '2º lembrete',
        quando: '~7 dias sem resposta',
        objetivo: 'Diferenciar pela atenção e deixar a porta aberta para preencherem o formulário.',
        mensagem: `Olá! 💫

Esperamos que os preparativos estejam a correr bem. Continuamos disponíveis e adorávamos poder conhecer-vos melhor.

Se fizer sentido para vós, é só preencherem o formulário quando puderem, e a partir daí tratamos de tudo:

👉 ${FORM_URL}

Um abraço!`,
      },
    ],
  },

  /* ═══════════════ DIRETO (WhatsApp / mensagem) ═══════════════ */
  {
    id: 'direto',
    label: 'Direto',
    emoji: '💬',
    descricao: 'Contacto direto por WhatsApp, Instagram ou mensagem. Tom próximo e ritmo mais rápido. Enviamos o formulário logo no primeiro contacto.',
    inicial: {
      titulo: 'Resposta imediata',
      quando: 'O mais rápido possível',
      objetivo: 'Agradecer o contacto e enviar já o formulário. Todos os noivos preenchem antes de avançarmos.',
      mensagem: `Olá! 😊 Que bom ter-vos por aqui!

Antes de mais, obrigado por terem entrado em contacto connosco. Agora queremos conhecer-vos um pouco melhor.

Preparámos um pequeno formulário que demora cerca de 2 minutos a preencher e que nos ajuda a perceber aquilo que procuram para o vosso casamento.

👉 ${FORM_URL}

Enquanto isso, espreitem também o nosso Instagram. Lá partilhamos muitos casamentos reais, momentos espontâneos e histórias de outros casais. É a melhor forma de perceberem o nosso estilo. 📷 @rl.photo.video

Assim que recebermos o vosso formulário, entramos em contacto para conversarmos com calma e percebermos se somos a equipa certa para contar a vossa história.

Mal podemos esperar para vos conhecer! 🙌`,
    },
    deuResposta: [],
    naoRespondeu: [
      {
        titulo: '1º lembrete',
        quando: '1 a 2 dias sem resposta',
        objetivo: 'Toque leve a retomar o contacto e reforçar o formulário.',
        mensagem: `Olá! 🙂 Só a dar um toque para não perdermos o contacto.

Se ainda não tiveram tempo, aqui fica outra vez o formulário. São 2 minutinhos e ajuda-nos a perceber o que procuram:

👉 ${FORM_URL}

Estamos por aqui para o que precisarem! 🙌`,
      },
      {
        titulo: '2º lembrete',
        quando: '4 a 5 dias sem resposta',
        objetivo: 'Dar valor e deixar a porta aberta para preencherem o formulário.',
        mensagem: `Olá! 💫 Esperamos que esteja tudo bem com os preparativos.

Adorávamos fazer parte do vosso dia. Sempre que puderem, preencham o formulário e falamos com calma:

👉 ${FORM_URL}

Um abraço! 😊`,
      },
    ],
  },
]

/* ── Botão copiar ── */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard indisponível */
    }
  }
  return (
    <button
      onClick={handleCopy}
      className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs tracking-widest uppercase transition-all ${
        copied
          ? 'border-green-500/40 text-green-400 bg-green-500/10'
          : 'border-white/10 text-white/40 hover:text-gold hover:border-gold/40'
      }`}
    >
      {copied ? (
        <>✓ Copiado</>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="9" y="9" width="11" height="11" rx="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 15V5a2 2 0 012-2h10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Copiar
        </>
      )}
    </button>
  )
}

/* ── Micro-dica por fase ── */
function DicaLine({ titulo }: { titulo: string }) {
  const dica = DICAS[titulo]
  if (!dica) return null
  return (
    <div className="mt-2.5 flex gap-2 items-start px-1">
      <span className="text-gold/50 text-sm leading-none mt-0.5">💡</span>
      <p className="text-white/40 text-xs leading-relaxed italic">{dica}</p>
    </div>
  )
}

/* ── Mapa visual do fluxo ── */
function FlowChain({ itens, cor }: { itens: string[]; cor: 'green' | 'orange' }) {
  const border = cor === 'green' ? 'border-green-500/25' : 'border-orange-500/25'
  return (
    <div className="flex flex-col items-center">
      {itens.map((it, i) => (
        <div key={i} className="flex flex-col items-center w-full">
          <div className={`w-full text-center px-3 py-2.5 rounded-xl border ${border} bg-black/20 text-white/70 text-sm`}>{it}</div>
          {i < itens.length - 1 && <div className="w-px h-4 bg-white/15" />}
        </div>
      ))}
    </div>
  )
}

function FlowMap() {
  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs tracking-[0.35em] uppercase text-white/30">Mapa do fluxo</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>
      <div className="rounded-3xl border border-white/8 bg-white/[0.02] p-6 sm:p-8">
        {/* Nó inicial */}
        <div className="flex justify-center">
          <div className="px-5 py-2.5 rounded-full border border-gold/40 bg-gold/10 text-gold text-xs tracking-[0.2em] uppercase">1ª Mensagem</div>
        </div>
        <div className="flex justify-center"><div className="w-px h-6 bg-white/15" /></div>
        <div className="text-center text-xs tracking-[0.25em] uppercase text-white/25 mb-5">O casal respondeu?</div>
        {/* Ramos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-green-500/25 bg-green-500/5 p-4">
            <div className="text-center text-xs tracking-[0.2em] uppercase text-green-400 font-semibold mb-4">✅ Deu resposta</div>
            <FlowChain cor="green" itens={['📞 Chamada (2 min)', '🗓️ Reunião + DFP', '🤝 Fecha · ou follow up 48h / 1 sem']} />
          </div>
          <div className="rounded-2xl border border-orange-500/25 bg-orange-500/5 p-4">
            <div className="text-center text-xs tracking-[0.2em] uppercase text-orange-400 font-semibold mb-4">⏳ Não respondeu</div>
            <FlowChain cor="orange" itens={['🔔 1º lembrete', '🔔 2º lembrete']} />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Cartão de objeção (acordeão) ── */
function ObjecaoCard({ o }: { o: { titulo: string; resposta: string } }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/[0.02] transition-colors">
        <span className="text-white/80 text-sm font-light tracking-wide">“{o.titulo}”</span>
        <span className={`text-white/25 text-xs shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && (
        <div className="px-5 pb-5">
          <div className="rounded-xl border border-white/8 bg-[#111111] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
              <span className="text-xs tracking-widest uppercase text-white/25">Resposta</span>
              <CopyButton text={o.resposta} />
            </div>
            <pre className="px-4 py-4 text-sm text-white/70 whitespace-pre-wrap font-sans leading-relaxed">{o.resposta}</pre>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Cartão do guião da chamada telefónica ── */
function TelefonemaCard({ numero }: { numero: string }) {
  const t = TELEFONEMA
  return (
    <div className="relative flex gap-4 sm:gap-6">
      <div className="flex flex-col items-center shrink-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold bg-green-500/10 border border-green-500/30 text-green-400">
          {numero}
        </div>
        <div className="w-px flex-1 bg-white/10 mt-2" />
      </div>

      <div className="flex-1 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
          <h3 className="text-white font-light text-lg tracking-wide flex items-center gap-2">📞 {t.titulo}</h3>
          <span className="text-xs tracking-widest uppercase text-gold/60 shrink-0">{t.quando}</span>
        </div>
        <p className="text-white/35 text-sm mb-3">{t.objetivo}</p>

        <div className="rounded-2xl border border-green-500/20 bg-[#0F1210] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
            <span className="text-xs tracking-widest uppercase text-green-400/50">Guião da chamada</span>
            <CopyButton text={telefonemaTexto(t)} />
          </div>
          <div className="px-4 py-4 flex flex-col gap-5">
            {/* Abertura */}
            <div>
              <div className="text-xs tracking-widest uppercase text-white/25 mb-1.5">Abertura</div>
              <p className="text-white/70 text-sm leading-relaxed italic">{t.intro}</p>
            </div>
            {/* Secções de perguntas */}
            {t.seccoes.map((s, i) => (
              <div key={i}>
                <div className="text-xs tracking-widest uppercase text-green-400/60 mb-2">{s.titulo}</div>
                <ul className="flex flex-col gap-1.5">
                  {s.itens.map((it, j) => (
                    <li key={j} className="flex gap-2 text-sm text-white/70">
                      <span className="text-green-400/50 mt-0.5">›</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {/* Fecho */}
            <div>
              <div className="text-xs tracking-widest uppercase text-white/25 mb-1.5">Fecho</div>
              <p className="text-white/70 text-sm leading-relaxed italic">{t.fecho}</p>
            </div>
            {/* Destaque — disponibilidade */}
            <div className="rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 flex gap-3">
              <span className="text-gold text-lg leading-none mt-0.5">🗓️</span>
              <div>
                <div className="text-xs tracking-widest uppercase text-gold/80 font-semibold mb-1">Se aceitarem, perguntar já</div>
                <p className="text-white/85 text-sm leading-relaxed">{t.destaque.replace('Se aceitarem, perguntar já: ', '')}</p>
              </div>
            </div>
          </div>
        </div>
        <DicaLine titulo={t.titulo} />
      </div>
    </div>
  )
}

/* ── Cartão de mensagem em inset (sub-caminho, sem número) ── */
function MensagemInset({ fase, cor }: { fase: Fase; cor: string }) {
  return (
    <div className={`mt-4 rounded-2xl border ${cor} p-4`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
        <h4 className="text-white font-light tracking-wide">{fase.titulo}</h4>
        <span className="text-xs tracking-widest uppercase text-gold/60">{fase.quando}</span>
      </div>
      <p className="text-white/35 text-sm mb-3">{fase.objetivo}</p>
      <div className="rounded-xl border border-white/8 bg-[#111111] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
          <span className="text-xs tracking-widest uppercase text-white/25">Mensagem</span>
          <CopyButton text={fase.mensagem} />
        </div>
        <pre className="px-4 py-4 text-sm text-white/70 whitespace-pre-wrap font-sans leading-relaxed">{fase.mensagem}</pre>
      </div>
      <DicaLine titulo={fase.titulo} />
    </div>
  )
}

/* ── Cartão de fase ── */
function FaseCard({ fase, numero, ultima, cor }: { fase: Fase; numero: string; ultima: boolean; cor: string }) {
  return (
    <div className="relative flex gap-4 sm:gap-6">
      {/* Coluna do número + linha do tempo */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${cor}`}>
          {numero}
        </div>
        {!ultima && <div className="w-px flex-1 bg-white/10 mt-2" />}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
          <h3 className="text-white font-light text-lg tracking-wide">{fase.titulo}</h3>
          <span className="text-xs tracking-widest uppercase text-gold/60 shrink-0">{fase.quando}</span>
        </div>
        <p className="text-white/35 text-sm mb-3">{fase.objetivo}</p>

        {/* Mensagem */}
        <div className="rounded-2xl border border-white/8 bg-[#111111] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
            <span className="text-xs tracking-widest uppercase text-white/25">Mensagem</span>
            <CopyButton text={fase.mensagem} />
          </div>
          <pre className="px-4 py-4 text-sm text-white/70 whitespace-pre-wrap font-sans leading-relaxed">
            {fase.mensagem}
          </pre>
        </div>
        <DicaLine titulo={fase.titulo} />
      </div>
    </div>
  )
}

/* ── PÁGINA ── */
export default function FollowUpPage() {
  const [origemId, setOrigemId] = useState('site')
  const [ramo, setRamo] = useState<'deu' | 'nao' | null>(null)
  const [agendamento, setAgendamento] = useState<'marcado' | 'aguardar' | null>(null)
  const [fecho, setFecho] = useState<'fechou' | 'aguarda' | null>(null)
  const origem = ORIGENS.find(o => o.id === origemId) ?? ORIGENS[0]

  const trocarOrigem = (id: string) => {
    setOrigemId(id)
    setRamo(null) // reinicia o caminho ao mudar de origem
    setAgendamento(null)
    setFecho(null)
  }

  const escolherRamo = (r: 'deu' | 'nao') => {
    setRamo(r)
    setAgendamento(null) // reinicia o sub-caminho da reunião
    setFecho(null)
  }

  const escolherAgendamento = (a: 'marcado' | 'aguardar') => {
    setAgendamento(a)
    setFecho(null) // reinicia o sub-caminho do fecho
  }

  const passos = ramo === 'deu' ? origem.deuResposta : ramo === 'nao' ? origem.naoRespondeu : []

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[1000px] mx-auto">

      {/* ── HEADER COM FOTO ── */}
      <div className="relative -mx-3 sm:-mx-6 -mt-6 sm:-mt-10 mb-8 sm:mb-10 h-56 sm:h-72 overflow-hidden rounded-b-3xl">
        <img src={HERO_URL} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        {/* Gradientes para legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
        {/* Conteúdo sobreposto */}
        <div className="relative h-full max-w-[1000px] mx-auto px-3 sm:px-6 flex flex-col justify-between py-6 sm:py-8">
          <Link href="/crm" className="text-xs tracking-[0.3em] text-white/50 hover:text-gold transition-colors uppercase">
            ‹ CRM
          </Link>
          <div>
            <h1 className="text-4xl sm:text-6xl font-extralight tracking-[0.15em] sm:tracking-[0.2em] text-white uppercase drop-shadow-lg">Follow Up</h1>
            <div className="w-16 h-px bg-gold/70 mt-4 mb-3" />
            <p className="text-white/60 text-xs tracking-[0.25em] uppercase">Mapa do percurso da lead por fases</p>
          </div>
        </div>
      </div>

      {/* ── INTRODUÇÃO · IMPORTÂNCIA DO FOLLOW UP ── */}
      <section className="mb-12">
        <span className="text-xs tracking-[0.35em] uppercase text-gold/60">Porque importa</span>
        <p className="text-white/55 text-sm sm:text-base leading-relaxed max-w-2xl mt-3">
          O follow up é o que separa uma lead esquecida de um casamento fechado. A maioria dos casais não decide no primeiro contacto, decide em quem se manteve presente, com atenção e sem pressa. Cada mensagem certa, no momento certo, mostra cuidado e constrói confiança.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          {PILARES.map(p => (
            <div key={p.titulo} className="rounded-2xl border border-white/8 bg-white/[0.02] p-5 hover:border-white/15 transition-colors">
              <div className="text-2xl mb-3">{p.icon}</div>
              <div className="text-white font-light tracking-wide mb-1.5">{p.titulo}</div>
              <p className="text-white/40 text-sm leading-relaxed">{p.texto}</p>
            </div>
          ))}
        </div>

        {/* Frase motivacional */}
        <div className="relative mt-8 rounded-3xl border border-gold/20 bg-gradient-to-br from-gold/10 to-transparent px-6 sm:px-12 py-10 overflow-hidden">
          <span className="absolute top-2 left-5 text-7xl text-gold/20 font-serif leading-none select-none">“</span>
          <p className="relative text-white/90 text-lg sm:text-2xl font-extralight tracking-wide leading-relaxed text-center italic">
            O seguimento é onde a maioria desiste. É exatamente por isso que é onde tu te destacas.
          </p>
          <p className="text-center text-gold/60 text-xs tracking-[0.3em] uppercase mt-5">RL Photo · Video</p>
        </div>
      </section>

      {/* ── MAPA VISUAL DO FLUXO ── */}
      <FlowMap />

      {/* ── SELETOR DE ORIGEM ── */}
      <div className="flex items-center gap-3 mb-5">
        <span className="text-xs tracking-[0.35em] uppercase text-white/30">Escolhe a origem da lead</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>
      <div className="flex flex-wrap gap-2.5 mb-8">
        {ORIGENS.map(o => {
          const ativo = o.id === origemId
          return (
            <button
              key={o.id}
              onClick={() => trocarOrigem(o.id)}
              className={`px-5 py-3 rounded-xl border text-sm tracking-[0.15em] uppercase transition-all flex items-center gap-2 ${
                ativo
                  ? 'border-gold/50 bg-gold/10 text-gold'
                  : 'border-white/10 text-white/40 hover:border-gold/30 hover:text-white/70'
              }`}
            >
              <span className="text-base">{o.emoji}</span>
              {o.label}
            </button>
          )
        })}
      </div>

      {/* ── DESCRIÇÃO DA ORIGEM ── */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-4 mb-10">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-lg">{origem.emoji}</span>
          <span className="text-white font-light tracking-wide">{origem.label}</span>
        </div>
        <p className="text-white/40 text-sm leading-relaxed">{origem.descricao}</p>
      </div>

      {/* ── 1ª MENSAGEM ── */}
      <FaseCard fase={origem.inicial} numero="1" ultima cor="bg-gold/10 border border-gold/25 text-gold" />

      {/* ── ESCOLHA: RESPONDEU OU NÃO ── */}
      <div className="ml-0 sm:ml-16 mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs tracking-[0.3em] uppercase text-white/25">O casal respondeu?</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => escolherRamo('deu')}
            className={`px-5 py-4 rounded-2xl border text-left transition-all ${
              ramo === 'deu'
                ? 'border-green-500/50 bg-green-500/10'
                : 'border-white/10 hover:border-green-500/40 hover:bg-green-500/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">✅</span>
              <span className={`text-sm tracking-[0.2em] uppercase font-semibold ${ramo === 'deu' ? 'text-green-400' : 'text-white/60'}`}>Deu resposta</span>
            </div>
            <p className="text-white/30 text-xs mt-1.5">Responderam ou preencheram. Passo seguinte: chamada telefónica.</p>
          </button>
          <button
            onClick={() => escolherRamo('nao')}
            className={`px-5 py-4 rounded-2xl border text-left transition-all ${
              ramo === 'nao'
                ? 'border-orange-500/50 bg-orange-500/10'
                : 'border-white/10 hover:border-orange-500/40 hover:bg-orange-500/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">⏳</span>
              <span className={`text-sm tracking-[0.2em] uppercase font-semibold ${ramo === 'nao' ? 'text-orange-400' : 'text-white/60'}`}>Não respondeu</span>
            </div>
            <p className="text-white/30 text-xs mt-1.5">Silêncio. Seguir com os lembretes de follow up.</p>
          </button>
        </div>
      </div>

      {/* ── PRÓXIMOS PASSOS DO CAMINHO ESCOLHIDO ── */}
      {ramo && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className={`text-xs tracking-[0.3em] uppercase ${ramo === 'deu' ? 'text-green-400/70' : 'text-orange-400/70'}`}>
              {ramo === 'deu' ? '✅ Caminho — Deu resposta' : '⏳ Caminho — Não respondeu'}
            </span>
            <div className="flex-1 h-px bg-white/8" />
          </div>
          <div className="flex flex-col">
            {ramo === 'deu' && <TelefonemaCard numero="2" />}

            {/* Sub-caminho: marcaram o dia ou vão ver disponibilidade */}
            {ramo === 'deu' && (
              <div className="ml-0 sm:ml-16 mb-10 -mt-2">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs tracking-[0.3em] uppercase text-white/25">Na chamada, marcaram logo o dia?</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => escolherAgendamento('marcado')}
                    className={`px-5 py-4 rounded-2xl border text-left transition-all ${
                      agendamento === 'marcado'
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-white/10 hover:border-green-500/40 hover:bg-green-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">✅</span>
                      <span className={`text-sm tracking-[0.2em] uppercase font-semibold ${agendamento === 'marcado' ? 'text-green-400' : 'text-white/60'}`}>Marcaram o dia</span>
                    </div>
                    <p className="text-white/30 text-xs mt-1.5">Enviar o portal da reunião aos noivos.</p>
                  </button>
                  <button
                    onClick={() => escolherAgendamento('aguardar')}
                    className={`px-5 py-4 rounded-2xl border text-left transition-all ${
                      agendamento === 'aguardar'
                        ? 'border-amber-500/50 bg-amber-500/10'
                        : 'border-white/10 hover:border-amber-500/40 hover:bg-amber-500/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🕒</span>
                      <span className={`text-sm tracking-[0.2em] uppercase font-semibold ${agendamento === 'aguardar' ? 'text-amber-400' : 'text-white/60'}`}>Aguardar agendamento</span>
                    </div>
                    <p className="text-white/30 text-xs mt-1.5">Vão ver a disponibilidade. Toque após 24h.</p>
                  </button>
                </div>
                {agendamento === 'marcado' && (
                  <>
                    <MensagemInset fase={ENVIAR_PORTAL_REUNIAO} cor="border-green-500/30" />
                    <MensagemInset fase={REUNIAO_DFP} cor="border-green-500/20" />

                    {/* Sub-caminho do fecho */}
                    <div className="flex items-center gap-3 mb-4 mt-8">
                      <span className="text-xs tracking-[0.3em] uppercase text-white/25">Na reunião, fecharam logo contrato?</span>
                      <div className="flex-1 h-px bg-white/8" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setFecho('fechou')}
                        className={`px-5 py-4 rounded-2xl border text-left transition-all ${
                          fecho === 'fechou'
                            ? 'border-green-500/50 bg-green-500/10'
                            : 'border-white/10 hover:border-green-500/40 hover:bg-green-500/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">✅</span>
                          <span className={`text-sm tracking-[0.2em] uppercase font-semibold ${fecho === 'fechou' ? 'text-green-400' : 'text-white/60'}`}>Fecharam contrato</span>
                        </div>
                        <p className="text-white/30 text-xs mt-1.5">Confirmar proposta no portal e preencher dados.</p>
                      </button>
                      <button
                        onClick={() => setFecho('aguarda')}
                        className={`px-5 py-4 rounded-2xl border text-left transition-all ${
                          fecho === 'aguarda'
                            ? 'border-amber-500/50 bg-amber-500/10'
                            : 'border-white/10 hover:border-amber-500/40 hover:bg-amber-500/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🕒</span>
                          <span className={`text-sm tracking-[0.2em] uppercase font-semibold ${fecho === 'aguarda' ? 'text-amber-400' : 'text-white/60'}`}>Vão dar resposta</span>
                        </div>
                        <p className="text-white/30 text-xs mt-1.5">Esperar até 48h e fazer follow up.</p>
                      </button>
                    </div>
                    {fecho === 'fechou' && <MensagemInset fase={FECHOU_CONTRATO} cor="border-green-500/30" />}
                    {fecho === 'aguarda' && (
                      <>
                        <MensagemInset fase={AGUARDA_RESPOSTA_48H} cor="border-amber-500/30" />
                        <MensagemInset fase={AGUARDA_RESPOSTA_1SEMANA} cor="border-amber-500/20" />
                      </>
                    )}
                  </>
                )}
                {agendamento === 'aguardar' && <MensagemInset fase={AGUARDAR_AGENDAMENTO} cor="border-amber-500/30" />}
              </div>
            )}

            {passos.map((fase, i) => {
              const base = ramo === 'deu' ? 3 : 2
              return (
                <FaseCard
                  key={`${ramo}-${i}`}
                  fase={fase}
                  numero={String(i + base)}
                  ultima={i === passos.length - 1}
                  cor={ramo === 'deu' ? 'bg-green-500/10 border border-green-500/30 text-green-400' : 'bg-orange-500/10 border border-orange-500/30 text-orange-400'}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* ── BANCO DE RESPOSTAS A OBJEÇÕES ── */}
      <section className="mt-16">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs tracking-[0.35em] uppercase text-gold/60">Respostas a objeções</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>
        <p className="text-white/40 text-sm mb-6 max-w-2xl">Respostas prontas para as dúvidas mais comuns. Clica para abrir e copiar.</p>
        <div className="flex flex-col gap-3">
          {OBJECOES.map(o => <ObjecaoCard key={o.titulo} o={o} />)}
        </div>
      </section>

      {/* ── NOTA ── */}
      <div className="mt-16 rounded-xl border border-white/8 bg-white/[0.02] px-5 py-4 text-white/30 text-xs leading-relaxed tracking-wide">
        Substitui <span className="text-gold/60">[nome]</span>, <span className="text-gold/60">[data]</span> e <span className="text-gold/60">[local]</span> antes de enviar. Os tempos são uma referência, ajusta conforme o ritmo de cada casal.
      </div>
    </main>
  )
}
