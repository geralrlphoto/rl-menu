'use client'

import { useState } from 'react'
import Link from 'next/link'

/* ──────────────────────────────────────────────────────────────
   MAPA DE FOLLOW UP  —  guia de referência
   3 origens (Site / Casamentos.pt / Direto), cada uma com o seu
   percurso por fases desde que a lead chega até dar resposta.
   Edita livremente os textos das mensagens aqui em baixo.
   Placeholders: [nome], [data], [local] são substituídos à mão.
   ────────────────────────────────────────────────────────────── */

type Fase = {
  n: number
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
  fases: Fase[]
}

const ORIGENS: Origem[] = [
  /* ═══════════════ SITE ═══════════════ */
  {
    id: 'site',
    label: 'Site',
    emoji: '🌐',
    descricao: 'Lead que preencheu o formulário do site. Já demonstrou intenção e deixou dados. Responder rápido é o que mais converte.',
    fases: [
      {
        n: 1,
        titulo: 'Resposta imediata',
        quando: 'Mesmo dia (idealmente na 1ª hora)',
        objetivo: 'Confirmar que recebemos, mostrar entusiasmo e propor o próximo passo.',
        mensagem: `Olá [nome], tudo bem? 😊

Muito obrigado pelo vosso contacto através do nosso site. Ficámos felizes por nos terem escolhido para fazer parte de um dia tão especial.

Adorávamos conhecer melhor a vossa história e a visão que têm para o casamento. Quando tiverem 15 minutos, podemos marcar uma conversa (chamada ou presencial) para vos explicar tudo com calma?

Fico a aguardar. Um abraço,
RL`,
      },
      {
        n: 2,
        titulo: '1º lembrete',
        quando: '2 a 3 dias sem resposta',
        objetivo: 'Toque suave a confirmar que a mensagem chegou.',
        mensagem: `Olá [nome], voltei a passar por aqui só para confirmar que a minha mensagem vos chegou. 🙂

Sei que esta fase de planeamento é uma correria. Sempre que fizer sentido para vocês, estou totalmente disponível para conversar sem qualquer compromisso.

Um abraço,
RL`,
      },
      {
        n: 3,
        titulo: '2º lembrete',
        quando: '~7 dias sem resposta',
        objetivo: 'Dar valor e reforçar disponibilidade sem pressionar.',
        mensagem: `Olá [nome], espero que esteja tudo a correr bem com os preparativos. 💫

Queria só deixar a porta aberta. Se ainda estiverem a ponderar quem irá registar o vosso dia, adorava mostrar-vos o nosso trabalho e perceber se somos a escolha certa para vós.

Qualquer coisa, é só dizer. Um abraço,
RL`,
      },
      {
        n: 4,
        titulo: 'Reunião agendada',
        quando: 'Quando marcam a conversa',
        objetivo: 'Confirmar a reunião e reduzir faltas.',
        mensagem: `Olá [nome], está confirmada a nossa conversa para [data]. 🎉

Vai ser um prazer conhecer-vos e mostrar-vos como trabalhamos. Não precisam de preparar nada, apenas trazer as vossas ideias e dúvidas.

Até já! Um abraço,
RL`,
      },
      {
        n: 5,
        titulo: 'Proposta enviada',
        quando: 'Logo após enviar o orçamento',
        objetivo: 'Confirmar entrega da proposta e abrir canal para dúvidas.',
        mensagem: `Olá [nome], acabei de vos enviar a proposta com todos os detalhes. 📄

Vejam com calma e digam-me o que acharam. Se houver qualquer dúvida, ou se quiserem ajustar alguma coisa ao vosso gosto, estou aqui para ajudar.

Um abraço,
RL`,
      },
      {
        n: 6,
        titulo: 'Follow up decisão',
        quando: '3 a 5 dias após a proposta',
        objetivo: 'Perceber onde está a decisão e desbloquear objeções.',
        mensagem: `Olá [nome], tudo bem? 🙂

Passei só para saber se conseguiram ver a proposta e se ficou alguma questão por esclarecer. Fico feliz por vos ajudar a decidir com toda a tranquilidade.

Um abraço,
RL`,
      },
      {
        n: 7,
        titulo: 'Última tentativa',
        quando: '~2 semanas sem resposta',
        objetivo: 'Toque final respeitoso, deixando a porta aberta.',
        mensagem: `Olá [nome], não quero ser insistente, por isso este é o meu último toque por agora. 🙏

Se entretanto seguiram outro caminho, desejo-vos do fundo do coração um casamento perfeito. E se ainda estiverem a decidir, estarei sempre por aqui.

Um grande abraço,
RL`,
      },
    ],
  },

  /* ═══════════════ CASAMENTOS.PT ═══════════════ */
  {
    id: 'casamentos',
    label: 'Casamentos.pt',
    emoji: '💍',
    descricao: 'Lead vinda da plataforma Casamentos.pt. Costuma trazer menos informação e comparar vários fornecedores. Primeiro contacto mais cuidado e a destacar-nos.',
    fases: [
      {
        n: 1,
        titulo: 'Resposta imediata',
        quando: 'Mesmo dia (rapidez faz a diferença no portal)',
        objetivo: 'Responder antes da concorrência e agradecer o contacto pela plataforma.',
        mensagem: `Olá [nome], muito obrigado pela vossa mensagem através do Casamentos.pt. 😊

Foi um gosto receber o vosso contacto. Adorávamos saber mais sobre o vosso casamento em [local] e mostrar-vos como podemos eternizar esse dia.

Fazia sentido marcarmos uma breve conversa esta semana? Assim explico tudo com calma e respondo a todas as vossas questões.

Um abraço,
RL`,
      },
      {
        n: 2,
        titulo: '1º lembrete',
        quando: '2 a 3 dias sem resposta',
        objetivo: 'Reforçar o contacto sabendo que estão a falar com vários fornecedores.',
        mensagem: `Olá [nome], sei que nesta fase estão a receber várias propostas, por isso queria só garantir que a minha mensagem vos chegou. 🙂

Se quiserem, envio-vos alguns exemplos do nosso trabalho para verem se é o estilo que procuram. Basta dizer.

Um abraço,
RL`,
      },
      {
        n: 3,
        titulo: '2º lembrete',
        quando: '~7 dias sem resposta',
        objetivo: 'Diferenciar pela atenção e disponibilidade.',
        mensagem: `Olá [nome], espero que os preparativos estejam a correr bem. 💫

Continuo disponível para conversar quando fizer sentido para vós. Gosto de conhecer bem cada casal antes de qualquer proposta, para que fique tudo à vossa medida.

Um abraço,
RL`,
      },
      {
        n: 4,
        titulo: 'Reunião agendada',
        quando: 'Quando marcam a conversa',
        objetivo: 'Confirmar a reunião e reduzir faltas.',
        mensagem: `Olá [nome], fica então confirmada a nossa conversa para [data]. 🎉

Vai ser um prazer conhecer-vos. Tragam as vossas ideias e dúvidas, o resto trato eu.

Até já! Um abraço,
RL`,
      },
      {
        n: 5,
        titulo: 'Proposta enviada',
        quando: 'Logo após enviar o orçamento',
        objetivo: 'Confirmar entrega e mostrar abertura a personalizar.',
        mensagem: `Olá [nome], enviei-vos agora a proposta com tudo detalhado. 📄

Vejam com calma. Se quiserem ajustar algo para ficar perfeito para vós, é só dizer, temos toda a flexibilidade.

Um abraço,
RL`,
      },
      {
        n: 6,
        titulo: 'Follow up decisão',
        quando: '3 a 5 dias após a proposta',
        objetivo: 'Perceber a decisão e responder a objeções.',
        mensagem: `Olá [nome], tudo bem? 🙂

Queria só saber se tiveram oportunidade de ver a proposta e se posso esclarecer alguma coisa. Fico feliz por vos ajudar a decidir com tranquilidade.

Um abraço,
RL`,
      },
      {
        n: 7,
        titulo: 'Última tentativa',
        quando: '~2 semanas sem resposta',
        objetivo: 'Toque final respeitoso, deixando a porta aberta.',
        mensagem: `Olá [nome], este é o meu último toque para não vos incomodar mais. 🙏

Se já escolheram outro caminho, desejo-vos um casamento maravilhoso. E se ainda estiverem a decidir, estarei sempre por aqui para vós.

Um grande abraço,
RL`,
      },
    ],
  },

  /* ═══════════════ DIRETO (WhatsApp / mensagem) ═══════════════ */
  {
    id: 'direto',
    label: 'Direto',
    emoji: '💬',
    descricao: 'Contacto direto por WhatsApp, Instagram ou mensagem. Tom mais próximo e direto, ritmo mais rápido.',
    fases: [
      {
        n: 1,
        titulo: 'Resposta imediata',
        quando: 'O mais rápido possível',
        objetivo: 'Responder na hora com energia e propor conversa.',
        mensagem: `Olá [nome], tudo bem? 😊 Que bom terem chegado até nós!

Adorava saber mais sobre o vosso grande dia. Preferem que vos ligue ou combinamos uma conversa rápida por aqui mesmo?

Fico a aguardar 🙌`,
      },
      {
        n: 2,
        titulo: '1º lembrete',
        quando: '1 a 2 dias sem resposta',
        objetivo: 'Toque leve e informal a retomar a conversa.',
        mensagem: `Olá [nome] 🙂 só a dar um toque para não perdermos o contacto.

Sempre que quiserem falar, é só dizer. Estou por aqui!`,
      },
      {
        n: 3,
        titulo: '2º lembrete',
        quando: '4 a 5 dias sem resposta',
        objetivo: 'Dar valor, oferecer ver o trabalho.',
        mensagem: `Olá [nome], espero que esteja tudo bem com os preparativos 💫

Se quiserem, mando-vos alguns dos nossos trabalhos recentes para verem o estilo. Dizem só que sim e envio 😊`,
      },
      {
        n: 4,
        titulo: 'Reunião / chamada',
        quando: 'Quando combinam falar',
        objetivo: 'Confirmar o horário.',
        mensagem: `Combinado [nome]! Falamos então [data] 🎉

Qualquer coisa até lá, é só chamar. Até já!`,
      },
      {
        n: 5,
        titulo: 'Proposta enviada',
        quando: 'Logo após enviar',
        objetivo: 'Confirmar entrega e abrir para dúvidas.',
        mensagem: `Já vos enviei a proposta 📄 vejam com calma!

Qualquer dúvida ou se quiserem ajustar algo, é só dizer 🙂`,
      },
      {
        n: 6,
        titulo: 'Follow up decisão',
        quando: '2 a 3 dias após a proposta',
        objetivo: 'Perceber a decisão de forma leve.',
        mensagem: `Olá [nome] 🙂 conseguiram dar uma vista de olhos na proposta? Ficou alguma dúvida?

Estou aqui para o que precisarem 🙌`,
      },
      {
        n: 7,
        titulo: 'Última tentativa',
        quando: '~10 dias sem resposta',
        objetivo: 'Fecho respeitoso, porta aberta.',
        mensagem: `Olá [nome], não quero estar sempre a chamar 🙏 por isso deixo aqui o meu último toque.

Se seguiram outro caminho, desejo-vos um casamento incrível! E se ainda estiverem a decidir, sabem onde me encontrar 😊`,
      },
    ],
  },
]

/* ── Ícone copiar ── */
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

/* ── Cartão de fase ── */
function FaseCard({ fase, ultima }: { fase: Fase; ultima: boolean }) {
  return (
    <div className="relative flex gap-4 sm:gap-6">
      {/* Coluna do número + linha do tempo */}
      <div className="flex flex-col items-center shrink-0">
        <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/25 flex items-center justify-center text-gold text-sm font-semibold">
          {fase.n}
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
      </div>
    </div>
  )
}

/* ── PÁGINA ── */
export default function FollowUpPage() {
  const [origemId, setOrigemId] = useState('site')
  const origem = ORIGENS.find(o => o.id === origemId) ?? ORIGENS[0]

  return (
    <main className="min-h-screen px-3 sm:px-6 py-6 sm:py-10 max-w-[1000px] mx-auto">

      {/* ── HEADER ── */}
      <div className="mb-8 sm:mb-10">
        <Link href="/crm" className="text-xs tracking-[0.3em] text-white/20 hover:text-gold transition-colors uppercase">
          ‹ CRM
        </Link>
        <h1 className="text-3xl sm:text-5xl font-extralight tracking-[0.15em] sm:tracking-[0.2em] text-white uppercase mt-3">Follow Up</h1>
        <p className="text-white/25 text-xs tracking-[0.25em] mt-2 uppercase">Mapa do percurso da lead por fases</p>
      </div>

      {/* ── SELETOR DE ORIGEM ── */}
      <div className="flex flex-wrap gap-2.5 mb-8">
        {ORIGENS.map(o => {
          const ativo = o.id === origemId
          return (
            <button
              key={o.id}
              onClick={() => setOrigemId(o.id)}
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
          <span className="ml-auto text-xs tracking-widest uppercase text-white/25">{origem.fases.length} fases</span>
        </div>
        <p className="text-white/40 text-sm leading-relaxed">{origem.descricao}</p>
      </div>

      {/* ── MAPA DE FASES ── */}
      <div className="flex flex-col">
        {origem.fases.map((fase, i) => (
          <FaseCard key={fase.n} fase={fase} ultima={i === origem.fases.length - 1} />
        ))}
      </div>

      {/* ── NOTA ── */}
      <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] px-5 py-4 text-white/30 text-xs leading-relaxed tracking-wide">
        Substitui <span className="text-gold/60">[nome]</span>, <span className="text-gold/60">[data]</span> e <span className="text-gold/60">[local]</span> antes de enviar. Os tempos são uma referência, ajusta conforme o ritmo de cada casal.
      </div>
    </main>
  )
}
