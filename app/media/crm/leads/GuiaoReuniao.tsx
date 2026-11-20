'use client'

import { useState } from 'react'

// Guião da reunião (R1) com uma empresa: oito tempos, sempre por esta ordem.
// Os tempos 1 e 2 ocupam uns dois minutos; os 3 a 6 ocupam o resto da reunião.

type Tempo = { n: string; titulo: string; ideia: string; frases: string[]; destaque?: boolean }

const TEMPOS: Tempo[] = [
  { n: '01', titulo: 'Apresentação', ideia: 'Quem és e porque é que a conversa vale o tempo dele.',
    frases: ['"Sou o Rui, da RL PROD. Fazemos vídeo e fotografia para empresas. Pedi esta conversa porque vi [o sinal: abertura, lançamento, evento]."'] },
  { n: '02', titulo: 'Contexto da reunião', ideia: 'Dizer ao que vens e pedir o OK.',
    frases: ['"Hoje quero perceber como fazem conteúdo e onde podemos ajudar. Se fizer sentido, marcamos uma segunda conversa já com proposta. Pode ser?"'] },
  { n: '03', titulo: 'Ponto A', ideia: 'Onde é que a empresa está mesmo.',
    frases: [
      '"Como estão a fazer conteúdo hoje? Equipa interna, freelancer ou agência?"',
      '"Que trabalho do último ano vos deu mais retorno?"',
      '"O que vos incomodou da última vez que contrataram produção?"',
      '"Quanto investiram em vídeo e conteúdo nos últimos 12 meses?"',
      '"De quanto em quanto tempo precisam de conteúdo novo?"',
    ] },
  { n: '04', titulo: 'Objetivos', ideia: 'Onde querem estar e o que é, para eles, um bom resultado.',
    frases: ['"Daqui a 6 a 12 meses, o que tinha de acontecer para dizerem que o vídeo resultou?"', '"É para vender, recrutar, marca ou eventos?"'] },
  { n: '05', titulo: 'Problemas', ideia: 'O que trava, há quanto tempo e o que já tentaram.',
    frases: ['"O que vos impede hoje de lá chegar?"', '"Há quanto tempo?"', '"O que já tentaram?"'] },
  { n: '06', titulo: 'Impacto', ideia: 'Quanto custa manter isto assim. A venda faz-se aqui. Nunca se salta.', destaque: true,
    frases: ['"O que custa continuar assim mais seis meses?"', '"Quanto vale para vocês um cliente novo?"', '"Se o próximo lançamento sair sem vídeo, o que se perde?"'] },
  { n: '07', titulo: 'Decisão e viabilidade', ideia: 'Quem decide, investimento, datas e direitos.',
    frases: ['"Além de si, quem decide?"', '"Que valor têm pensado?"', '"Há datas fixas?"', '"Precisam de direitos para anúncios pagos?"'] },
  { n: '08', titulo: 'Recapitular e marcar', ideia: 'Resumir nas palavras dele e sair com a R2 na agenda.',
    frases: ['"Deixe-me ver se percebi: hoje fazem X, querem Y, o que trava é Z e isso custa-vos W. Está certo?"', '"Então marco já [dia e hora] para lhe apresentar a proposta."'] },
]

// Tempos 4 e 5: o mapa. Dor → Problema → Solução, por esta ordem, sempre.
const MAPA = [
  { titulo: 'Dor', sub: 'O que ele sente', texto: 'A frase que ele diz, nas palavras dele. Ainda é um incómodo, sem número.',
    exemplo: '"Temos um produto muito bom e ninguém percebe o que ele faz."' },
  { titulo: 'Problema', sub: 'O que isso causa no negócio', texto: 'O efeito concreto na faturação, no tempo da equipa e nos clientes perdidos.',
    exemplo: 'Em cada reunião comercial gastam 20 minutos a explicar o produto e perdem negócios para concorrentes que explicam melhor.' },
  { titulo: 'Solução', sub: 'O que a RL PROD entrega', texto: 'Só aqui entras tu, e só depois de ele confirmar as duas colunas anteriores.', destaque: true,
    exemplo: 'Um vídeo de produto de 90 segundos e seis cortes curtos para a equipa comercial usar antes de cada reunião.' },
]

// Tempo 6: o custo de não fazer nada. Três perdas que o cliente ainda não contou.
const PERDAS = [
  { n: '01', titulo: 'O site que não converte', texto: 'Tem visitas, mas não passa confiança nem mostra a qualidade do trabalho. Quem lá chega não pede contacto.',
    pergunta: '"Em cada 100 visitas ao site, quantas vos deixam contacto?"' },
  { n: '02', titulo: 'O evento que morre no próprio dia', texto: 'Gasta milhares num evento e não usa o conteúdo para vender patrocínios nem lugares na edição seguinte.',
    pergunta: '"Quanto custou o último evento e o que ficou dele a trabalhar para o próximo?"' },
  { n: '03', titulo: 'O concorrente que aparece sempre', texto: 'Comunica quando tem tempo. O concorrente aparece todas as semanas e é desse que o cliente se lembra.',
    pergunta: '"Quando um cliente vos compara com outro, o que vê de cada lado?"' },
]

type Bloco = { eyebrow: string; titulo: string; itens: string[] }

// Antes da R1: a chamada fria só serve para marcar a reunião.
const CHAMADA: Bloco[] = [
  { eyebrow: 'Chamada fria · 3 a 5 minutos', titulo: 'Não se vende o serviço. Vende-se a reunião.', itens: [
    'Volume: cerca de 100 chamadas dão 5 reuniões. Leads de anúncios: ligar no primeiro minuto.',
    'Qualificar com 2 a 4 perguntas leves: "Qual é o objetivo de faturação este ano?", "Quantas pessoas têm na equipa?" (nunca "quanto faturam?").',
    'Ritmo e tom variados; abrandar no fim para dar peso ao que se marca.',
    'Ao marcar: "Se tiver algum imprevisto, ligue-me um dia antes e mudamos para a mesma hora."',
    'Marcar para hoje ou amanhã. Mais de 3 dias depois, muitos faltam.',
    'Depois de um "não": "Compreendo. Quem conhece que eu possa contactar e ver se conseguimos ajudar?"',
  ] },
  { eyebrow: 'Se pedem o preço ao telefone', titulo: 'Responder e marcar.', itens: [
    '"Os nossos valores dependem mesmo do que vamos entregar. Prefere amanhã às 14h ou segunda às 10h?"',
    '"Fico contente com a pergunta, quer dizer que está mesmo interessado. Daqui a pouco envio-lhe a nossa apresentação e alguns casos."',
    'Entre a chamada e a R1: enviar apresentação, casos e testemunhos por email ou WhatsApp.',
  ] },
  { eyebrow: 'A quem ligar', titulo: 'Primeiro a base que já tens.', itens: [
    'Orçamentos que ficaram em "vou pensar", antigos clientes, quem já pagou vídeo a alguém.',
    'Depois: empresas com redes ou vídeo fracos, ou sem vídeo nenhum.',
    'Um grupo por tarde. Segunda de manhã e sexta à tarde atendem pouco: usar para pesquisar contactos (LinkedIn, Google Maps).',
  ] },
]

// R1: o que não fazer.
const ERROS = [
  'Mostrar o portfólio nos primeiros 5 minutos.',
  'Fazer 10 perguntas e não aprofundar nenhuma.',
  'Dizer o preço antes do tempo.',
  'Não descobrir quem decide.',
  'Sair sem a próxima data marcada.',
]

// Depois da R1.
const DEPOIS: Bloco[] = [
  { eyebrow: 'R1 · notas', titulo: 'Como um médico: primeiro examina, só depois receita.', itens: [
    'Abrir com: "O que te despertou o interesse para estarmos aqui hoje?" e pedir licença para fazer as perguntas.',
    'Ele fala 70 a 80% do tempo. Quem faz as perguntas comanda a reunião.',
    'Se há sócio, mulher ou diretor a decidir, tem de estar na R2.',
    'Pedir o compromisso em voz alta: "No fim da apresentação, posso contar com um sim ou um não?"',
    'Trabalho pequeno (até uns 3.000 €): R1 e R2 podem ser juntas, acrescentando valor (versão vertical, brutos, testemunhos no evento).',
    'Se não for para nós: dizer com franqueza, perguntar quando poderá fazer sentido e pedir referências.',
  ] },
  { eyebrow: 'R2 · apresentação da proposta, cerca de 35 minutos', titulo: 'Recapitular, apresentar, calar, marcar.', itens: [
    'Recapitular a R1 e o custo de não fazer nada. "A trabalhar connosco, como veem o negócio daqui a 3 ou 6 meses?"',
    'Por esta ordem: quem somos e números que dão confiança; a solução, dita com autoridade; a metodologia; casos de clientes.',
    'Garantia ligada ao maior receio dele (por exemplo, o prazo de entrega).',
    'O investimento. Depois do preço, 8 segundos de silêncio.',
    'Sair com os próximos passos marcados: contrato, pagamento e arranque, no máximo em 48 horas.',
  ] },
  { eyebrow: 'Objeções', titulo: 'A melhor objeção é a que não aparece.', itens: [
    '"Vou pensar" quer dizer que falta informação: "O que é que tem mesmo de pensar? É o timing ou o preço?"',
    'Preço: "Qual é a dificuldade? Pagamento faseado, outro pacote?" e "Caro comparado com quê?"',
    '"Já trabalhamos com uma empresa": "De 0 a 10, quão satisfeitos estão? O que falta para ser 10?" Trabalhamos em parceria com agências, não somos concorrentes.',
    'Na escala de 0 a 10, perguntar "porque não é um 4?": é ele que justifica o nosso valor.',
    'Decisor ausente: "Percebo que esteja ocupado. Se isto é urgente, marcamos para quando ele puder estar."',
    'Se não decidir na R2: marcar logo uma R3 de esclarecimento, que acaba em sim ou não.',
  ] },
  { eyebrow: 'Métricas', titulo: 'Medir cada passo.', itens: [
    'Atendidas, qualificadas, R1 marcadas, comparência, R2, fecho.',
    'Um bom fecho fica nos 25 a 30%. Acima disso: pouco volume ou qualificação a mais, e negócio perdido.',
  ] },
]

function Blocos({ lista }: { lista: Bloco[] }) {
  return (
    <>
      {lista.map(b => (
        <div key={b.eyebrow} className="mt-3 rounded-xl border border-white/[0.08] bg-[#00141f]/60 px-4 py-4">
          <p className="rlp-m text-[10px] text-[#5a8bff]">{b.eyebrow}</p>
          <p className="rlp-t mt-1 text-[18px] leading-tight text-white">{b.titulo}</p>
          <ul className="mt-2 space-y-1.5">
            {b.itens.map(i => <li key={i} className="text-[13px] leading-snug text-white/75">{i}</li>)}
          </ul>
        </div>
      ))}
    </>
  )
}

const REGRAS = [
  'Uma pergunta de cada vez. Depois, silêncio.',
  'Quando a resposta interessa, aprofunda antes de passar à seguinte: "há quanto tempo?", "e o que fizeram quanto a isso?".',
  'A lista não é uma checklist. Se a resposta já apareceu na conversa, não voltes a perguntar.',
  'A pergunta do investimento dos últimos 12 meses já diz se há orçamento.',
]

export default function GuiaoReuniao({ labelCls }: { labelCls: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div>
      <button type="button" onClick={() => setAberto(a => !a)} className="flex w-full items-center justify-between gap-3 text-left">
        <span className={labelCls}>Guião de vendas · chamada, R1, R2, objeções</span>
        <span className="text-[12px] text-[#5a8bff]">{aberto ? 'Fechar' : 'Abrir'}</span>
      </button>
      {aberto && (
        <div className="mt-4">
          <Blocos lista={CHAMADA} />
          <p className="rlp-m mt-6 text-[10px] text-[#5a8bff]">R1 · diagnóstico, 20 a 25 minutos</p>
          <p className="text-[13px] text-white/50 mt-1 mb-4">Sempre esta ordem. Os tempos 1 e 2 levam uns dois minutos; os 3 a 6 ocupam o resto da reunião.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEMPOS.map(t => (
              <div key={t.n} className={'rounded-xl border px-4 py-4 ' + (t.destaque ? 'border-[#2e6cf6]/70 bg-[#2e6cf6]/[0.14]' : 'border-white/[0.08] bg-white/[0.02]')}>
                <p className="rlp-m text-[10px] text-[#5a8bff]">{t.n}</p>
                <p className="rlp-t mt-1 text-[18px] leading-tight text-white">{t.titulo}</p>
                <p className="mt-1 text-[12.5px] text-white/50">{t.ideia}</p>
                <ul className="mt-3 space-y-1.5">
                  {t.frases.map(f => <li key={f} className="text-[13px] leading-snug text-white/80">{f}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#00141f]/60 px-4 py-4">
            <p className="rlp-m text-[10px] text-[#5a8bff]">Tempos 4 e 5 · o mapa</p>
            <p className="rlp-t mt-1 text-[18px] leading-tight text-white">Dor → Problema → Solução. Por esta ordem, sempre.</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {MAPA.map(m => (
                <div key={m.titulo} className={'rounded-xl border px-4 py-4 ' + (m.destaque ? 'border-[#2e6cf6]/70 bg-[#2e6cf6]/[0.14]' : 'border-white/[0.08] bg-white/[0.02]')}>
                  <p className="rlp-m text-[10px] text-[#5a8bff]">{m.titulo}</p>
                  <p className="mt-1 text-[14px] font-medium text-white">{m.sub}</p>
                  <p className="mt-1 text-[12.5px] text-white/50">{m.texto}</p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/35">Exemplo</p>
                  <p className="mt-1 text-[13px] leading-snug text-white/80">{m.exemplo}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#00141f]/60 px-4 py-4">
            <p className="rlp-m text-[10px] text-[#5a8bff]">Tempo 6 · o custo de não fazer nada</p>
            <p className="rlp-t mt-1 text-[18px] leading-tight text-white">Três perdas que o cliente ainda não contou.</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {PERDAS.map(p => (
                <div key={p.n} className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-4">
                  <p className="rlp-m text-[10px] text-[#5a8bff]">{p.n}</p>
                  <p className="mt-1 text-[14px] font-medium text-white">{p.titulo}</p>
                  <p className="mt-1 text-[12.5px] text-white/50">{p.texto}</p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-white/35">Pergunta</p>
                  <p className="mt-1 text-[13px] leading-snug text-white/80">{p.pergunta}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-xl border border-[#2e6cf6]/70 bg-[#2e6cf6]/[0.14] px-4 py-3 text-[13px] text-white/85">Estes números não são teus para prometer. São dele: pergunta, escreve e devolve-lhos no fim. &quot;É isto?&quot;</p>
          </div>
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#00141f]/60 px-4 py-4">
            <p className="rlp-m text-[10px] text-[#5a8bff] mb-2">A regra das perguntas</p>
            <ul className="space-y-1.5">
              {REGRAS.map(r => <li key={r} className="text-[13px] leading-snug text-white/70">{r}</li>)}
            </ul>
          </div>
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#00141f]/60 px-4 py-4">
            <p className="rlp-m text-[10px] text-[#5a8bff] mb-2">Os cinco erros mais comuns</p>
            <ol className="space-y-1.5 list-decimal pl-5">
              {ERROS.map(e => <li key={e} className="text-[13px] leading-snug text-white/70">{e}</li>)}
            </ol>
          </div>
          <Blocos lista={DEPOIS} />
        </div>
      )}
    </div>
  )
}
