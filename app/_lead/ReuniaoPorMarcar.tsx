'use client'

// Portais da reunião (/r e /b): a nova lead recebe logo o link do portal. Enquanto não escolher
// horário só vê o calendário (o mesmo da /reuniao, com a mesma confirmação da RL no /photo);
// depois fica o pedido à espera da confirmação. Os 4 painéis (e o testemunho, em /r) ficam sempre
// visíveis, seguidos do aviso; o resto do portal abre quando a RL aceitar.

import MarcarReuniao, { CSS_MARCAR, type PedidoMarcado } from '@/app/rollup/MarcarReuniao'

const DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado']
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
function longa(iso: string) {
  const x = new Date(iso + 'T12:00:00')
  return `${DIAS[x.getDay()]}, ${x.getDate()} de ${MESES[x.getMonth()]}`
}

const espaco = { paddingTop: 'clamp(46px,7vh,88px)', paddingBottom: 'clamp(46px,7vh,88px)' }

export function MarcarNoPortal({ leadId, dataCasamento, onMarcada }: {
  leadId: string; dataCasamento: string; onMarcada: (p: PedidoMarcado) => void
}) {
  return (
    <section id="sec-marcar" className="border-y" style={{ borderColor: 'var(--line-soft)', background: 'var(--ink-2)' }}>
      <style>{CSS_MARCAR + CSS}</style>
      <div className="rlp-wrap flex flex-col items-center gap-5 text-center" style={espaco}>
        <span className="rlp-eyebrow c">O primeiro passo</span>
        <h2 className="rlp-h2" style={{ fontSize: 'clamp(30px,4.4vw,52px)' }}>Escolham o <em>vosso momento</em></h2>
        <p className="rlp-lede" style={{ maxWidth: '50ch' }}>
          Escolham o dia e a hora. Assim que confirmarmos a reunião, o resto do vosso portal fica disponível.
        </p>
        <p className="rlp-lede" style={{ maxWidth: '50ch', fontSize: 14 }}>
          Não enviamos valores por mensagem nem em PDF. Gostamos sempre de falar com os nossos noivos, criar empatia e ganhar confiança mútua.
        </p>
        <div className="ru rlp-marcar">
          <MarcarReuniao dataCasamento={dataCasamento} leadId={leadId} sujeitaConfirmacao onMarcada={onMarcada} />
        </div>
      </div>
    </section>
  )
}

export function PedidoNoPortal({ pedido }: { pedido: PedidoMarcado }) {
  return (
    <section id="sec-pedido" className="border-y" style={{ borderColor: 'var(--line-soft)', background: 'var(--ink-2)' }}>
      <div className="rlp-wrap flex flex-col items-center gap-5 text-center" style={espaco}>
        <span className="rlp-eyebrow c">Pedido de reunião enviado</span>
        <h2 className="rlp-h2" style={{ fontSize: 'clamp(30px,4.4vw,52px)' }}>Até <em>breve!</em></h2>
        <div className="rlp-lede" style={{ color: 'var(--tx)' }}>
          {pedido.opcoes.map(o => <p key={o.data + o.hora}>{longa(o.data)} às {o.hora}</p>)}
          <p>{pedido.formato === 'Presencial' ? 'No nosso estúdio' : 'Por videochamada'}</p>
        </div>
        <p className="rlp-lede" style={{ maxWidth: '46ch', fontSize: 14 }}>
          A reunião está sujeita a confirmação. Vamos confirmar convosco muito em breve pelo WhatsApp.
        </p>
      </div>
    </section>
  )
}

// Depois dos blocos que ficam visíveis: explica porque o resto do portal ainda não aparece
export function AvisoPortalFechado({ pedido }: { pedido: boolean }) {
  return (
    <section id="sec-aviso" style={{ background: 'var(--ink-2)', borderTop: '1px solid var(--line-soft)' }}>
      <div className="rlp-wrap flex flex-col items-center gap-5 text-center" style={espaco}>
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="var(--g)" strokeWidth="1.2" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
        </svg>
        <span className="rlp-eyebrow c">O vosso portal</span>
        <h2 className="rlp-h2" style={{ fontSize: 'clamp(30px,4.4vw,52px)' }}>Ainda há mais <em>à vossa espera</em></h2>
        <p className="rlp-lede" style={{ maxWidth: '50ch' }}>
          Os nossos filmes, o portfólio e tudo o que preparámos para vocês ficam disponíveis {pedido ? 'assim que confirmarmos a vossa reunião' : 'assim que a vossa reunião estiver agendada'}.
        </p>
        {!pedido && (
          <a href="#sec-marcar" className="rlp-btn" style={{ marginTop: 8 }}>
            <span className="fill" /><span className="dot" />Escolher o dia e a hora
          </a>
        )}
      </div>
    </section>
  )
}

// O calendário foi feito para a /reuniao: aqui fica centrado e com o texto alinhado à esquerda
const CSS = `
@keyframes ruSobe{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@keyframes ruBrilho{0%{left:-60%}35%,100%{left:130%}}
.rlp-marcar{width:100%;max-width:560px;text-align:left;}
.ru.rlp-marcar .mr-btn{margin-top:8px;}
`
