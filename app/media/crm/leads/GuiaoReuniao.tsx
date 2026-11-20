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
        <span className={labelCls}>Guião da reunião · oito tempos</span>
        <span className="text-[12px] text-[#5a8bff]">{aberto ? 'Fechar' : 'Abrir'}</span>
      </button>
      {aberto && (
        <div className="mt-4">
          <p className="text-[13px] text-white/50 mb-4">Sempre esta ordem. Os tempos 1 e 2 levam uns dois minutos; os 3 a 6 ocupam o resto da reunião.</p>
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
        </div>
      )}
    </div>
  )
}
