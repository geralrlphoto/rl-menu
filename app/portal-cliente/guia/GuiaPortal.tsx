'use client'

/* ============================================================
   GuiaPortal — guia prático e interativo do portal para os
   noivos. Só é usado em /portal-cliente (não nos portais
   reais /ref/<REF>). Cada tema tem passos com uma maquete de
   telemóvel animada que mostra o procedimento.
   ============================================================ */

import { type CSSProperties, type ReactNode, useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import './guia.css'
import { PRAZO_VIDEO_DIAS } from '@/lib/crm'

// Prazos do Wedding Film por pacote (dias úteis), da mesma fonte que o contrato
const PV_S = PRAZO_VIDEO_DIAS.SIGNATURE, PV_E = PRAZO_VIDEO_DIAS.ESSENCIAL, PV_B = PRAZO_VIDEO_DIAS.BASIC

// ─── ícones ──────────────────────────────────────────────────────────────────

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
)
const IcPortal   = () => svg(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M8 4v5" /></>)
const IcCamera   = () => svg(<><path d="M3 9a2 2 0 0 1 2-2h1.5l1.5-2h8l1.5 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><circle cx="12" cy="13" r="3.2" /></>)
const IcFilm     = () => svg(<><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-2.5v9L16 14" /></>)
const IcContract = () => svg(<><path d="M7 3h8l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M15 3v4h4M9 12h6M9 16h4" /></>)
const IcCard     = () => svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></>)
const IcChat     = () => svg(<><path d="M21 12c0 4.4-4 8-9 8a9.9 9.9 0 0 1-4.3-.9L3 20l1.4-3.7A7.4 7.4 0 0 1 3 12c0-4.4 4-8 9-8s9 3.6 9 8Z" /></>)
const IcMail     = () => svg(<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>)
const IcClock    = () => svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>)
const IcBell     = () => svg(<><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></>)
const IcArrow    = () => svg(<path d="M5 12h14M13 6l6 6-6 6" />)
const IcBack     = () => svg(<path d="M19 12H5M11 6l-6 6 6 6" />)
const IcPlay     = () => svg(<path d="M8 5v14l11-7Z" fill="currentColor" />)
const IcPause    = () => svg(<><path d="M8 5v14M16 5v14" strokeWidth="2.4" /></>)
const IcDownload = () => svg(<path d="M12 4v12M6 12l6 6 6-6M5 21h14" />)
const IcUpload   = () => svg(<path d="M12 20V8M6 12l6-6 6 6M5 3h14" />)

// ─── maquete de telemóvel ────────────────────────────────────────────────────

/** Atraso em cascata para os elementos da maquete. */
const d = (i: number) => ({ animationDelay: `${0.12 + i * 0.12}s` })

function Phone({ children, bell }: { children: ReactNode; bell?: boolean }) {
  return (
    <div className="guia-phone" aria-hidden="true">
      <div className="screen">
        <div className="notch" />
        <div className="topbar">
          <span className="brand">RL PHOTO · VIDEO</span>
          <span className="m-bell">{IcBell()}{bell && <span className="dot" />}</span>
        </div>
        <div className="content">{children}</div>
      </div>
    </div>
  )
}

const Chip = ({ s, children }: { s: 'wait' | 'info' | 'ok' | 'red'; children: ReactNode }) =>
  <span className={`m-chip ${s}`}>{children}</span>

/** Chip que muda de estado a meio da animação (ex.: Aguardar → Entregue). */
const ChipSwap = ({ from, to }: { from: [string, 'wait' | 'info' | 'ok' | 'red']; to: [string, 'wait' | 'info' | 'ok' | 'red'] }) => (
  <span className="m-chip-swap-wrap">
    <span className={`m-chip ${from[1]} a`}>{from[0]}</span>
    <span className={`m-chip ${to[1]} b`}>{to[0]}</span>
  </span>
)

// ─── conteúdo do guia ────────────────────────────────────────────────────────

type Step = { title: ReactNode; text: string; tip?: string; list?: Array<[string, string]>; mock: ReactNode }
type Topic = { id: string; label: string; intro: string; icon: () => ReactNode; steps: Step[] }

const TOPICS: Topic[] = [
  {
    id: 'portal', label: 'Como funciona', icon: IcPortal,
    intro: 'Como entram no portal, o que lá encontram e como andar por ele.',
    steps: [
      {
        title: <>Do <em>sim</em> ao portal</>,
        text: 'Tudo começa no portal da reunião. Escolham a proposta que querem e preencham os dados para o contrato. Assim que recebemos os dados, o vosso portal e o contrato ficam prontos, com os serviços, o valor e o plano de pagamentos da proposta que aceitaram. Não há esperas.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Do sim ao portal</div>
            <div className="m-timeline">
              {[['1', 'A nossa escolha', 'No portal da reunião', 'ok'], ['2', 'Dados para contrato', 'Todos os campos preenchidos', 'ok'], ['3', 'Portal e contrato', 'Prontos na hora', '']].map(([n, t, sub, st], i) => (
                <div key={t} className="st m-in" style={d(i + 1)}>
                  <span className={`bul ${st}`}>{n}</span>
                  <span><div style={{ fontSize: 12 }}>{t}</div><div className="m-small">{sub}</div></span>
                  <span />
                </div>
              ))}
            </div>
            <span className="m-btn gold m-in m-tap" style={d(4)}>A nossa escolha</span>
          </>
        ),
      },
      {
        title: <>O email de <em>boas-vindas</em></>,
        text: 'Logo a seguir recebem o email "💍 O portal do casamento está pronto". É o vosso bilhete de entrada: traz o email de acesso, a palavra-passe que criámos para vocês e o botão Aceder ao Portal.',
        tip: 'Guardem este email. A referência do casamento (por exemplo CAS_026_26_RL) está no portal e é pedida no formulário de seleção e no registo de pagamentos.',
        mock: (
          <div className="m-mail m-in" style={d(0)}>
            <div className="hd">O vosso <em>portal</em></div>
            <div className="bd">
              Este é o vosso espaço exclusivo: fotos, vídeos, cronograma e muito mais.
              <div style={{ marginTop: 10, padding: 8, border: '1px solid #d8c9a8', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: 7, letterSpacing: '.3em', color: '#8a7450' }}>A VOSSA CHAVE</div>
                <div style={{ fontFamily: 'var(--g-fm)', fontSize: 11, color: '#8a6a30' }}>ana@email.pt</div>
                <div style={{ fontSize: 7, letterSpacing: '.3em', color: '#8a7450', marginTop: 6 }}>PALAVRA-PASSE</div>
                <div style={{ fontFamily: 'var(--g-fm)', fontSize: 11, color: '#8a6a30' }}>••••••</div>
              </div>
              <div className="cta m-tap">ACEDER AO PORTAL</div>
            </div>
          </div>
        ),
      },
      {
        title: <>Um só lugar para <em>tudo</em></>,
        text: 'Este é o vosso portal privado. Aqui ficam o contrato, os pagamentos, as fotografias, os vídeos e todas as novidades do vosso casamento, sempre atualizados por nós. Funciona no telemóvel e no computador.',
        mock: (
          <>
            <div className="m-img m-in" style={{ ...d(0), height: 130 }} />
            <div className="m-sub m-in" style={d(1)}>Os Noivos</div>
            <div className="m-h m-in" style={d(2)}>Ana <em>&amp;</em> Pedro</div>
            <div className="m-small m-in" style={{ ...d(3), textAlign: 'center' }}>12 · Setembro · 2026</div>
            <div className="m-count m-in" style={d(4)}>
              <div><b>128</b><span>Dias</span></div><div><b>09</b><span>Horas</span></div><div><b>41</b><span>Min</span></div>
            </div>
          </>
        ),
      },
      {
        title: <>As <em>secções</em> do portal</>,
        text: 'No menu encontram cada secção. Toquem numa para a abrir. A que está em dourado é o passo em que estamos agora. Até a adjudicação estar paga e o contrato assinado nos chegar, só o Início, o Contrato e os Pagamentos abrem; as outras secções mostram um cadeado.',
        list: [
          ['Atendimento', 'Mensagens entre vocês e nós'],
          ['Contrato · CPS', 'O contrato e os serviços contratados'],
          ['Pagamentos', 'Fases, valores e registo de pagamentos'],
          ['Fotografias', 'Galerias, seleção, fotos editadas e álbum'],
          ['O Nosso Filme', 'Same Day Edit, teaser e Wedding Film'],
          ['Briefing e Cronograma', 'Os detalhes e as tarefas antes do dia'],
        ],
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Menu</div>
            {['Atendimento', 'Contrato · CPS', 'Pagamentos', 'Fotografias', 'O Nosso Filme', 'Cronograma'].map((t, i) => {
              const aberta = i === 1 || i === 2
              return (
                <div key={t} className={`m-card m-in ${i === 2 ? 'gold m-tap' : ''}`} style={{ ...d(i + 1), padding: '9px 12px', opacity: aberta ? 1 : .5 }}>
                  <span className="m-grow">{t}</span><span style={{ opacity: .6 }}>{aberta ? '›' : '🔒'}</span>
                </div>
              )
            })}
          </>
        ),
      },
      {
        title: <>O <em>sino</em> das novidades</>,
        text: 'Sempre que temos algo para vos dizer aparece um ponto vermelho no sino dourado, no topo do portal. Toquem no sino para ler a mensagem. Ao mesmo tempo enviamos um email com o mesmo título.',
        mock: (
          <>
            <div className="m-drop m-in" style={d(3)}>
              <div className="m-label">Nova notificação</div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>As fotos do dia já estão disponíveis</div>
              <div className="m-small">Já podem ver a Galeria Online em Fotografias.</div>
            </div>
            <div className="m-drop m-in" style={{ ...d(5), opacity: .6 }}>
              <div className="m-label" style={{ color: 'var(--g-ink-3)' }}>Há 3 dias</div>
              <div style={{ fontSize: 12 }}>Reunião de preparação marcada</div>
            </div>
          </>
        ),
      },
      {
        title: <>Estado das <em>Entregas</em></>,
        text: 'Na página inicial acompanham cada entrega. Cada linha muda de estado à medida que o trabalho avança no nosso atelier, por isso não precisam de nos perguntar em que ponto está.',
        list: [
          ['Aguardar', 'Ainda não começou'],
          ['Em Seleção', 'A galeria está convosco para escolherem (muda sozinho depois do casamento)'],
          ['Em Edição', 'Estamos a trabalhar nela'],
          ['Entregue / Concluído', 'Está pronta e disponível no portal'],
        ],
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Estado das Entregas</div>
            <div className="m-card m-in" style={d(1)}><span className="m-grow">Seleção de Fotos</span><ChipSwap from={['Aguardar', 'wait']} to={['Em Seleção', 'info']} /></div>
            <div className="m-card m-in" style={d(2)}><span className="m-grow">Fotos para Edição</span><Chip s="info">Em Edição</Chip></div>
            <div className="m-card m-in" style={d(3)}><span className="m-grow">Álbum</span><Chip s="wait">Aguardar</Chip></div>
            <div className="m-card m-in" style={d(4)}><span className="m-grow">Entrega do Vídeo</span><Chip s="wait">Aguardar</Chip></div>
          </>
        ),
      },
    ],
  },
  {
    id: 'emails', label: 'Emails que recebem', icon: IcMail,
    intro: 'Cada email que vos enviamos, o que significa e onde fica no portal.',
    steps: [
      {
        title: <>Para onde vão os <em>emails</em></>,
        text: 'Todos os avisos são enviados de RL Photo.Video (geral@rlphotovideo.pt) para o email da noiva que nos indicaram. Cada email tem um botão dourado que leva diretamente à entrega e diz onde ela fica guardada no portal.',
        tip: 'Se não encontrarem um email, vejam a pasta de Spam ou Promoções e marquem-nos como remetente de confiança. Tudo o que enviamos fica também no portal.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Caixa de entrada</div>
            {[['As fotos do dia já estão disponíveis', '09:12'], ['O vosso Teaser está pronto', 'Ontem'], ['💍 O portal do casamento está pronto', '12 Jan']].map(([s, h], i) => (
              <div key={s} className={`m-inbox m-in ${i === 0 ? 'unread m-tap' : ''}`} style={d(i + 1)}>
                <div className="from"><span>RL Photo.Video</span><span>{h}</span></div>
                <div className="subj">{s}</div>
              </div>
            ))}
          </>
        ),
      },
      {
        title: <>Os emails das <em>fotografias</em></>,
        text: 'Estes são os emails que recebem sobre fotografias, pela ordem em que normalmente chegam. O botão do email abre a galeria; a mesma entrega fica guardada em Fotografias.',
        list: [
          ['As fotos do dia já estão disponíveis', 'Galeria Online · botão VER A GALERIA'],
          ['As vossas fotos estão prontas para seleção', 'Galeria Fotos p/ Seleção · botão ESCOLHER AS FOTOS'],
          ['As vossas fotos já estão editadas', 'Fotos Finais · botão VER AS FOTOS'],
          ['A vossa maquete do álbum está pronta', 'Álbum · botão VER A MAQUETE'],
          ['As vossas fotos pré-wedding estão prontas', 'Pré-Wedding · botão VER AS FOTOS'],
        ],
        mock: (
          <div className="m-mail m-in" style={d(0)}>
            <div className="hd">AS FOTOS PARA <em>SELEÇÃO</em></div>
            <div className="bd">
              Chegou a parte mais bonita: escolher. Com calma, escolham as fotos que contam a vossa história.
              <div className="cta m-tap">ESCOLHER AS FOTOS →</div>
              <div style={{ marginTop: 8, fontSize: 9, color: '#776b58', textAlign: 'center' }}>Fica também guardado no vosso portal, em Fotografias → Galeria Fotos p/ Seleção.</div>
            </div>
          </div>
        ),
      },
      {
        title: <>Os emails dos <em>vídeos</em></>,
        text: 'Para os vídeos recebem um email por cada entrega. O botão abre o vídeo e a entrega fica guardada em O Nosso Filme.',
        list: [
          ['O vosso Same Day Edit está pronto', 'O Nosso Filme → Same Day Edit'],
          ['O vosso Teaser está pronto', 'O Nosso Filme → Teaser'],
          ['O vosso vídeo pré-wedding está pronto', 'O Nosso Filme → Pré-Wedding'],
          ['O vosso Wedding Film está pronto', 'O Nosso Filme → Wedding Film'],
        ],
        mock: (
          <div className="m-mail m-in" style={d(0)}>
            <div className="hd">O VOSSO <em>WEDDING FILM</em></div>
            <div className="bd">
              O vosso dia, contado como um filme. Chamem quem mais gostam e carreguem no play.
              <div className="cta m-tap">VER O FILME →</div>
              <div style={{ marginTop: 8, fontSize: 9, color: '#776b58', textAlign: 'center' }}>Fica também guardado no vosso portal, em O Nosso Filme → Wedding Film.</div>
            </div>
          </div>
        ),
      },
      {
        title: <>Mensagens e <em>marcações</em></>,
        text: 'Além das entregas, recebem um email sempre que vos deixamos uma notificação ou respondemos no Atendimento (o assunto começa com 🔔), quando é marcada uma reunião e quando abrimos a marcação da sessão pré-wedding.',
        list: [
          ['🔔 + título da notificação', 'Sino do portal e Atendimento'],
          ['Tens uma reunião marcada', 'Data e hora da reunião'],
          ['O seu Pré-Wedding', 'Escolher o dia da sessão no portal'],
        ],
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Caixa de entrada</div>
            {[['🔔 Resposta à vossa mensagem', 'Agora'], ['Tens uma reunião marcada · 14 Mar às 18:00', 'Seg'], ['O seu Pré-Wedding', '2 Fev']].map(([s, h], i) => (
              <div key={s} className={`m-inbox m-in ${i === 0 ? 'unread' : ''}`} style={d(i + 1)}>
                <div className="from"><span>RL Photo.Video</span><span>{h}</span></div>
                <div className="subj">{s}</div>
              </div>
            ))}
          </>
        ),
      },
    ],
  },
  {
    id: 'prazos', label: 'Prazos de entrega', icon: IcClock,
    intro: 'Fotos, álbum e vídeos: quando chega cada coisa, segundo o contrato.',
    steps: [
      {
        title: <>Todos os <em>prazos</em></>,
        text: 'Resumo de tudo o que vos entregamos e quando. Os prazos contam em dias úteis, de segunda a sexta. Nos passos seguintes explicamos cada um em detalhe.',
        list: [
          ['Galeria Online', 'até 7 dias úteis após o casamento'],
          ['Fotos para Seleção', 'até 30 dias úteis após o casamento'],
          ['Fotos editadas', '30 dias úteis após recebermos a vossa seleção'],
          ['Maquete do álbum', '30 dias úteis após recebermos as fotos do álbum'],
          ['Entrega do álbum', '30 dias úteis após aprovarem a maquete'],
          ['Wedding Film', `Signature ${PV_S} · Essencial ${PV_E} · Basic ${PV_B} dias úteis`],
          ['Alterações ao filme', 'pedidas até 5 dias úteis após a entrega'],
          ['Fotos para os convidados', 'digitais em 15 dias úteis, em papel em 30 dias úteis'],
          ['Same Day Edit', 'no próprio dia do casamento'],
          ['Downloads', 'fotos editadas e vídeos disponíveis 30 dias'],
        ],
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Fotografia</div>
            {[['Galeria Online', '7 dias úteis'], ['Fotos p/ Seleção', '30 dias úteis'], ['Álbum', '30 + 30 dias úteis']].map(([t, v], i) => (
              <div key={t} className="m-card m-in" style={{ ...d(i + 1), padding: '8px 12px' }}><span className="m-grow">{t}</span><Chip s="info">{v}</Chip></div>
            ))}
            <div className="m-label m-in" style={{ ...d(4), marginTop: 6 }}>Vídeo</div>
            {[['Same Day Edit', 'no dia'], ['Wedding Film', `${PV_S} a ${PV_B} dias úteis`]].map(([t, v], i) => (
              <div key={t} className={`m-card m-in ${i === 1 ? 'gold' : ''}`} style={{ ...d(i + 5), padding: '8px 12px' }}><span className="m-grow">{t}</span><Chip s={i === 1 ? 'ok' : 'info'}>{v}</Chip></div>
            ))}
          </>
        ),
      },
      {
        title: <>Prazos das <em>fotografias</em></>,
        text: 'Contam a partir do dia do casamento, exceto as fotos editadas, que contam a partir do dia em que nos enviam a seleção. Dias úteis são de segunda a sexta.',
        list: [
          ['Galeria Online', 'até 7 dias úteis após o casamento'],
          ['Fotos para Seleção', 'até 30 dias úteis após o casamento'],
          ['A vossa seleção', 'enviada por vocês no formulário'],
          ['Fotos editadas', '30 dias úteis após recebermos a seleção'],
          ['Download das fotos editadas', 'disponível durante 30 dias'],
          ['Fotos compradas pelos convidados', 'digitais em 15 dias úteis, em papel em 30 dias úteis'],
        ],
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Fotografias</div>
            <div className="m-timeline">
              {[['0', 'Casamento', 'O grande dia', 'ok'], ['7', 'Galeria Online', 'até 7 dias úteis', 'ok'], ['30', 'Fotos p/ Seleção', 'até 30 dias úteis', 'ok'], ['✎', 'Vocês escolhem', 'formulário', ''], ['30', 'Fotos editadas', '30 dias úteis', '']].map(([n, t, s, st], i) => (
                <div key={t} className="st m-in" style={d(i + 1)}>
                  <span className={`bul ${st}`}>{n}</span>
                  <span><div style={{ fontSize: 12 }}>{t}</div><div className="m-small">{s}</div></span>
                  <span />
                </div>
              ))}
            </div>
          </>
        ),
      },
      {
        title: <>Prazos do <em>álbum</em></>,
        text: 'O álbum nasce das fotografias que escolhem para ele. Estes são os prazos, em dias úteis.',
        list: [
          ['Fotos para o álbum', 'enviadas por vocês até 15 de outubro'],
          ['Maquete do álbum', '30 dias úteis após recebermos as fotografias'],
          ['Aprovação', 'feita por vocês em Fotografias → Álbum'],
          ['Entrega do álbum', '30 dias úteis após a aprovação da maquete'],
          ['Impressão', 'só depois do pagamento total do serviço'],
        ],
        tip: 'Para manterem o valor do álbum apresentado na reunião, enviem as fotografias do álbum até 15 de outubro.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Processo do álbum</div>
            {[['01', 'Fotos do álbum enviadas', '10 Out 2026', true], ['02', 'Maquete (30 dias úteis)', '20 Nov 2026', true], ['03', 'Aprovação da maquete', '25 Nov 2026', true], ['04', 'Entrega (30 dias úteis)', '8 Jan 2027', false]].map(([n, t, s, ok], i) => (
              <div key={String(n)} className="m-card m-in" style={d(i + 1)}>
                <span className="m-ic" style={ok ? { background: 'var(--g-gold)', color: '#0b0a08' } : undefined}>{n}</span>
                <span className="m-grow">{t}<div className="m-small">{s}</div></span>
              </div>
            ))}
          </>
        ),
      },
      {
        title: <>Prazos do <em>Wedding Film</em></>,
        text: 'O prazo do filme depende do pacote que contrataram e está escrito no vosso contrato (cláusula 7.1). Conta em dias úteis, de segunda a sexta, a partir do dia do casamento. A data prevista aparece em Estado das Entregas.',
        list: [
          ['Signature', `até ${PV_S} dias úteis (cerca de 3 meses)`],
          ['Essencial', `até ${PV_E} dias úteis (cerca de 6 meses)`],
          ['Basic', `até ${PV_B} dias úteis (cerca de 8 a 9 meses)`],
        ],
        tip: 'Não sabem qual é o vosso pacote? Vejam a secção Contrato · CPS, em Serviços contratados, ou a cláusula 7.1 do contrato.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Prazo do Wedding Film</div>
            {([['Signature', PV_S], ['Essencial', PV_E], ['Basic', PV_B]] as const).map(([p, dias]) => [p, String(dias), `${Math.round(dias / PV_B * 100)}%`]).map(([p, n, w], i) => (
              <div key={p} className={`m-card m-in ${i === 1 ? 'gold' : ''}`} style={{ ...d(i + 1), flexDirection: 'column', alignItems: 'stretch', gap: 7 }}>
                <div className="m-row" style={{ alignItems: 'baseline' }}><span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{p}</span><span style={{ flex: 'none', fontSize: 12 }}>{n} dias úteis</span></div>
                <div className="m-progress" style={{ '--w': w } as CSSProperties}><i /></div>
              </div>
            ))}
          </>
        ),
      },
      {
        title: <>Os outros <em>vídeos</em></>,
        text: 'Os vídeos mais curtos chegam antes do filme, conforme o que contrataram.',
        list: [
          ['Same Day Edit', 'no próprio dia, mostrado ainda durante a festa'],
          ['Teaser', 'um primeiro olhar, antes do filme completo'],
          ['Vídeo Pré-Wedding', 'depois da sessão pré-wedding'],
          ['Download dos vídeos', 'disponível durante 30 dias depois da entrega'],
        ],
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Estado das Entregas</div>
            <div className="m-card m-in" style={d(1)}><span className="m-grow">Same Day Edit</span><Chip s="ok">Entregue</Chip></div>
            <div className="m-card m-in" style={d(2)}><span className="m-grow">Teaser</span><Chip s="ok">Entregue</Chip></div>
            <div className="m-card m-in" style={{ ...d(3), flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <div className="m-row" style={{ alignItems: 'center' }}><span>Wedding Film</span><span style={{ flex: 'none' }}><Chip s="info">Em Edição</Chip></span></div>
              <div className="m-progress" style={{ '--w': '64%' } as CSSProperties}><i /></div>
              <div className="m-small">Data prevista · 28 Maio 2027</div>
            </div>
          </>
        ),
      },
      {
        title: <>Alterações ao <em>filme</em></>,
        text: 'Depois de receberem o filme final têm até 5 dias úteis para nos pedirem alterações pontuais, até um máximo de 3. As alterações são feitas entre janeiro e março. Peçam-nas no Atendimento, com o minuto e o segundo de cada ponto.',
        list: [
          ['Prazo para pedir', 'até 5 dias úteis após a entrega do filme'],
          ['Número de alterações', 'até 3 alterações pontuais'],
          ['Quando as fazemos', 'entre janeiro e março'],
          ['Ficheiros guardados', '180 dias após a entrega final; segunda via depois disso: 300 €'],
        ],
        tip: 'Vejam o filme logo que chegar e anotem tudo de uma vez, para usarem bem as 3 alterações.',
        mock: (
          <>
            <div className="m-title m-in" style={d(0)}>Atendimento</div>
            <div className="m-bubble me m-in" style={d(1)}>Alterações ao filme: 1) 02:14 trocar a música da entrada. 2) 05:40 cortar este plano.</div>
            <div className="m-bubble them m-in" style={d(3)}>Recebido! Ficam 2 de 3 alterações. Tratamos disso e avisamos.</div>
            <div className="m-card m-in" style={d(4)}><span className="m-grow">Prazo para pedir</span><Chip s="info">Faltam 3 dias</Chip></div>
          </>
        ),
      },
      {
        title: <>Não percam os <em>downloads</em></>,
        text: 'As fotos editadas e os vídeos ficam disponíveis para download durante 30 dias. No cartão das Fotos Editadas aparece a contagem, por exemplo "Faltam 12 dias para download". Descarreguem tudo e guardem cópias em mais do que um sítio.',
        tip: 'Quando o período termina o cartão mostra "Período de download expirado". Se acontecer, falem connosco no Atendimento.',
        mock: (
          <div className="m-card m-in" style={{ ...d(0), flexDirection: 'column', alignItems: 'stretch', padding: 8 }}>
            <div className="m-row" style={{ alignItems: 'center', marginBottom: 6 }}><span className="lab" style={{ flex: 1 }}>Fotos Editadas</span><span style={{ flex: 'none' }}><Chip s="ok">Disponível</Chip></span></div>
            <div className="m-img" style={{ height: 110 }} />
            <span className="m-btn gold m-tap" style={{ marginTop: 8 }}>{IcDownload()} Ver mais</span>
            <div className="m-small m-in" style={{ ...d(2), textAlign: 'center', marginTop: 6, color: 'var(--g-wait)' }}>Faltam 12 dias para download</div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'fotos', label: 'Fotografias', icon: IcCamera,
    intro: 'As galerias, como fazer a seleção passo a passo e o álbum.',
    steps: [
      {
        title: <>Os quatro <em>cartões</em></>,
        text: 'Em Fotografias há um cartão para cada entrega. Quando está pronto mostra Disponível e o botão VER MAIS; enquanto o preparamos mostra Aguardar.',
        list: [
          ['Galeria Online', 'O dia completo para partilhar com família e amigos'],
          ['Galeria para Seleção', 'De onde escolhem as fotografias'],
          ['Fotos Pré-Wedding', 'A sessão antes do grande dia'],
          ['Fotos Editadas', 'A seleção final, pronta para imprimir'],
          ['Fotos dos convidados', 'Digital em 15 dias úteis, em papel em 30 dias úteis'],
        ],
        mock: (
          <>
            {[['Galeria Online', true], ['Galeria para Seleção', true], ['Fotos Pré-Wedding', false], ['Fotos Editadas', false]].map(([t, ok], i) => (
              <div key={String(t)} className="m-card m-in" style={{ ...d(i), opacity: ok ? 1 : .55 }}>
                <span className="m-grow">{t}</span>
                {ok ? <span className={`m-btn gold ${i === 0 ? 'm-tap' : ''}`} style={{ height: 24, padding: '0 10px' }}>Ver mais</span> : <span className="m-btn" style={{ height: 24, padding: '0 10px' }}>Aguardar</span>}
              </div>
            ))}
          </>
        ),
      },
      {
        title: <>Galeria Online e <em>partilha</em></>,
        text: 'Até 7 dias úteis depois do casamento recebem o email "As fotos do dia já estão disponíveis". Em Fotografias toquem em VER MAIS na Galeria Online. Com o botão Partilhar Galeria aparece um link que podem copiar e enviar aos convidados.',
        mock: (
          <div className="m-card m-in" style={{ ...d(0), flexDirection: 'column', alignItems: 'stretch', padding: 8, gap: 8 }}>
            <div className="m-img" style={{ height: 96 }} />
            <div style={{ fontSize: 12 }}>Galeria Online</div>
            <div className="m-row"><span className="m-btn gold">Ver mais</span><span className="m-btn m-tap">Partilhar</span></div>
            <div className="m-in" style={d(3)}>
              <div className="m-label">Link para os convidados</div>
              <div className="m-row"><div className="m-input" style={{ flex: 3 }}>galeria.rlphoto…/ana-pedro</div><span className="m-btn gold" style={{ height: 30, flex: 1 }}>Copiar</span></div>
            </div>
          </div>
        ),
      },
      {
        title: <>Fotos para <em>Seleção</em></>,
        text: 'Até 30 dias úteis depois do casamento recebem o email "As vossas fotos estão prontas para seleção". A galeria está organizada em pastas (Noivo, Noiva, Cerimónia e as seguintes) e cada fotografia tem um nome com as vossas iniciais e um número, por exemplo AP-0001.',
        tip: 'No cartão Galeria para Seleção há o botão "Como fazer a escolha", que mostra sempre estas instruções.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Pasta · Cerimónia</div>
            <div className="m-grid m-in" style={d(1)}>
              {['0120', '0121', '0122', '0123', '0124', '0125', '0126', '0127', '0131'].map((c, i) => (
                <div key={c} className={`m-img ${[0, 4, 8].includes(i) ? 'sel' : ''}`}><span className="code">AP-{c}</span></div>
              ))}
            </div>
            <div className="m-row m-in" style={d(3)}><span className="m-btn m-tap">Como fazer a escolha</span><span className="m-btn">Enviar Seleção</span></div>
          </>
        ),
      },
      {
        title: <>Passo 1: um <em>Word</em> por pastas</>,
        text: 'Abram um documento Word e criem uma secção para cada pasta da galeria, pela mesma ordem: Noivo, Noiva, Cerimónia e assim sucessivamente. Percorram a galeria pasta a pasta e, em cada secção, escrevam as fotografias que escolheram.',
        mock: (
          <div className="m-doc m-in" style={d(0)}>
            <div className="s">NOIVO</div><div className="c">AP-0001, AP-0002, AP-0003</div>
            <div className="s">NOIVA</div><div className="c">AP-0045, AP-0046, AP-0052</div>
            <div className="s">CERIMÓNIA</div><div className="c">AP-0120, AP-0124, AP-0131</div>
            <div className="s">CONVIDADOS</div><div className="c">AP-0210, AP-0233 …</div>
          </div>
        ),
      },
      {
        title: <>Passo 2: os nomes <em>certos</em></>,
        text: 'Escrevam o nome de cada fotografia exatamente como aparece na galeria: as vossas iniciais, hífen e o número com quatro dígitos. Separem sempre cada fotografia com uma vírgula. Sem vírgulas o formulário não deixa enviar.',
        list: [
          ['Certo', 'AP-0001, AP-0002, AP-0003'],
          ['Errado', '1, 2, 3 (sem iniciais)'],
          ['Errado', 'AP-0001 AP-0002 (sem vírgula)'],
        ],
        tip: 'Um nome mal escrito pode não ser reconhecido e atrasar a edição. Confirmem a numeração antes de enviar.',
        mock: (
          <>
            <div className="m-in" style={d(0)}><div className="m-label">Certo</div><div className="m-input" style={{ borderColor: 'rgba(157,181,139,.5)', color: 'var(--g-ok)' }}>AP-0001, AP-0002, AP-0003</div></div>
            <div className="m-in" style={d(1)}><div className="m-label" style={{ color: 'var(--g-red)' }}>Errado</div><div className="m-input" style={{ borderColor: 'rgba(224,122,110,.5)' }}>1, 2, 3</div></div>
            <div className="m-in" style={d(2)}><div className="m-label" style={{ color: 'var(--g-red)' }}>Errado</div><div className="m-input" style={{ borderColor: 'rgba(224,122,110,.5)' }}>AP-0001 AP-0002</div>
              <div className="m-small" style={{ color: 'var(--g-red)', marginTop: 4 }}>Falta a vírgula entre fotografias.</div></div>
          </>
        ),
      },
      {
        title: <>Passo 3: o <em>formulário</em></>,
        text: 'Toquem em Enviar Seleção. No formulário escrevam o nome dos noivos, a data do casamento e a referência do evento. Depois abram cada secção e colem a escolha do Word. O contador de cada secção mostra quantas fotografias indicaram.',
        list: [
          ['Secções', 'Fotos do Noivo · Fotos da Noiva · Cerimónia · Convidados · Sala e Animação · Bolo e Bouquet · Detalhes · Sessão Noivos · Fotos para Álbum'],
          ['Fotos para Álbum', 'a última secção: as fotografias que querem ver no álbum'],
        ],
        mock: (
          <>
            <div className="m-in" style={d(0)}><div className="m-label">Referência do Evento</div><div className="m-input">CAS_026_26_RL</div></div>
            {[['Fotos do Noivo', '3 fotos'], ['Fotos da Noiva', '3 fotos'], ['Cerimónia', '0 fotos']].map(([t, n], i) => (
              <div key={t} className={`m-card m-in ${i === 2 ? 'gold' : ''}`} style={{ ...d(i + 1), padding: '8px 12px' }}><span className="m-grow">{t}</span><span className="m-small">{n} ›</span></div>
            ))}
            <div className="m-in" style={d(4)}><div className="m-input"><span className="typed">AP-0120, AP-0124, AP-0131</span></div></div>
            <div className="m-small m-in" style={d(4)}>Separem cada fotografia com vírgula (,)</div>
          </>
        ),
      },
      {
        title: <>Passo 4: <em>enviar</em></>,
        text: 'Toquem em Enviar seleção. Aparece "Seleção recebida" com o total de fotografias. A partir daqui editamos as fotografias escolhidas e entregamo-las em alta qualidade em 30 dias úteis.',
        mock: (
          <>
            <span className="m-btn gold m-in m-tap" style={d(0)}>Enviar seleção</span>
            <div className="m-in" style={{ ...d(3), textAlign: 'center', padding: '18px 0 6px' }}>
              <div style={{ width: 40, height: 40, margin: '0 auto 10px', borderRadius: '50%', border: '1px solid var(--g-gold)', display: 'grid', placeItems: 'center', color: 'var(--g-gold)' }}>✓</div>
              <div className="m-h" style={{ fontSize: 20 }}>Seleção <em>recebida.</em></div>
              <div className="m-small" style={{ marginTop: 6 }}>Já temos a vossa seleção de 86 fotografias. Entregamos em 30 dias úteis.</div>
            </div>
            <div className="m-card m-in" style={d(5)}><span className="m-grow">Seleção Fotos</span><ChipSwap from={['Em Seleção', 'info']} to={['Concluído', 'ok']} /></div>
          </>
        ),
      },
      {
        title: <>As fotos <em>editadas</em></>,
        text: 'Quando a edição termina recebem o email "As vossas fotos já estão editadas" e o cartão Fotos Editadas fica Disponível. Têm 30 dias para fazer o download; a contagem aparece no próprio cartão.',
        mock: (
          <div className="m-card m-in" style={{ ...d(0), flexDirection: 'column', alignItems: 'stretch', padding: 8 }}>
            <div className="m-row" style={{ alignItems: 'center', marginBottom: 6 }}><span className="lab" style={{ flex: 1 }}>Fotos Editadas</span><span style={{ flex: 'none' }}><ChipSwap from={['Aguardar', 'wait']} to={['Disponível', 'ok']} /></span></div>
            <div className="m-img" style={{ height: 110 }} />
            <span className="m-btn gold m-tap" style={{ marginTop: 8 }}>Ver mais</span>
            <div className="m-small" style={{ textAlign: 'center', marginTop: 6 }}>30 dias para download</div>
          </div>
        ),
      },
      {
        title: <>Aprovar o <em>álbum</em></>,
        text: 'Com a seleção feita, o atelier monta a maqueta do álbum. Recebem o email "A vossa maquete do álbum está pronta". Em Fotografias, na secção Álbum, revejam a maqueta e toquem em Aprovar Maqueta, ou digam-nos no Atendimento o que querem mudar. A maquete fica pronta 30 dias úteis depois de recebermos as fotografias; depois de aprovada, entregamos o álbum em 30 dias úteis. O álbum só é impresso depois do pagamento total.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Maquete Álbum</div>
            <div className="m-row m-in" style={{ ...d(1), gap: 3 }}>
              <div className="m-img" style={{ height: 100 }} /><div className="m-img" style={{ height: 100 }} />
            </div>
            <div className="m-row m-in" style={d(2)}>
              <div className="m-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}><span className="lab">Fotos p/ Álbum</span>60</div>
              <div className="m-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}><span className="lab">Estado</span><ChipSwap from={['Em análise', 'wait']} to={['Aprovado', 'ok']} /></div>
            </div>
            <span className="m-btn gold m-in m-tap" style={d(3)}>✓ Aprovar Maqueta</span>
          </>
        ),
      },
      {
        title: <>Fotos dos <em>convidados</em></>,
        text: 'Os vossos convidados também tiraram fotografias? Na secção Enviar Fotos, dentro de Fotografias, abram o formulário e carreguem-nas para ficarem juntas das nossas.',
        mock: (
          <>
            <div className="m-card m-in" style={{ ...d(0), flexDirection: 'column', gap: 10, borderColor: 'rgba(255,255,255,.4)' }}>
              <div className="m-title">Enviar Fotos</div>
              <div className="m-drop-zone" style={{ width: '100%' }}><span className="m-ic" style={{ margin: '0 auto 6px' }}>{IcUpload()}</span>Toquem para escolher fotografias</div>
              <span className="m-btn white m-tap" style={{ width: '100%' }}>Abrir formulário</span>
            </div>
            <div className="m-in" style={d(2)}><div className="m-progress" style={{ '--w': '72%' } as CSSProperties}><i /></div></div>
            <div className="m-small m-in" style={d(2)}>A enviar 18 fotografias…</div>
          </>
        ),
      },
      {
        title: <>Fotografias para os <em>convidados</em></>,
        text: 'Vocês e os vossos convidados podem adquirir fotografias do casamento, em digital ou em papel. Depois do pedido recebem por email um ticket com a aquisição das fotografias. As digitais são entregues em 15 dias úteis. As de papel ficam prontas em 30 dias úteis e seguem por correio, em carta registada.',
        list: [
          ['Digital', 'entrega em 15 dias úteis'],
          ['Papel', '30 dias úteis, por correio em carta registada'],
          ['Ticket', 'enviado por email com o pedido'],
        ],
        mock: (
          <>
            <div className="m-mail m-in" style={d(0)}>
              <div className="hd">O vosso <em>pedido</em></div>
              <div className="bd">
                Recebemos o pedido das vossas fotografias.
                <div style={{ marginTop: 10, padding: 8, border: '1px dashed #d8c9a8', borderRadius: 6, textAlign: 'center' }}>
                  <div style={{ fontSize: 7, letterSpacing: '.3em', color: '#8a7450' }}>TICKET</div>
                  <div style={{ fontFamily: 'var(--g-fm)', fontSize: 11, color: '#8a6a30' }}>CAS_026_26_RL · 12 fotos</div>
                </div>
              </div>
            </div>
            <div className="m-row m-in" style={d(2)}>
              <div className="m-card gold m-tap" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}><span className="lab">Digital</span>15 dias úteis</div>
              <div className="m-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}><span className="lab">Papel</span>30 dias úteis</div>
            </div>
          </>
        ),
      },
    ],
  },
  {
    id: 'filme', label: 'Vídeos e Filme', icon: IcFilm,
    intro: 'Quando chegam os vídeos, onde os veem e como os guardam.',
    steps: [
      {
        title: <>O aviso de cada <em>vídeo</em></>,
        text: 'Sempre que carregamos um vídeo recebem um email (por exemplo "O vosso Teaser está pronto") e uma notificação no sino. O botão do email abre o vídeo; fica também guardado em O Nosso Filme.',
        mock: (
          <>
            <div className="m-drop m-in" style={d(1)}>
              <div className="m-label">Nova notificação</div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>O vosso Teaser está pronto</div>
              <div className="m-small">Vejam-no em O Nosso Filme → Teaser.</div>
            </div>
            <div className="m-card gold m-in m-tap" style={d(3)}><span className="m-ic">{IcFilm()}</span><span className="m-grow">O Nosso Filme</span>›</div>
          </>
        ),
      },
      {
        title: <>Pela ordem em que <em>chegam</em></>,
        text: 'Conforme o que contrataram, os vídeos chegam por esta ordem. Em O Nosso Filme cada cartão mostra VER MAIS quando o vídeo já está disponível e AGUARDAR enquanto o preparamos.',
        list: [
          ['Vídeo Pré-Wedding', 'depois da sessão pré-wedding'],
          ['Same Day Edit', 'no próprio dia do casamento'],
          ['Teaser', 'um primeiro olhar, antes do filme'],
          ['Wedding Film', `até ${PV_S}, ${PV_E} ou ${PV_B} dias úteis, conforme o pacote`],
        ],
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>O Nosso Filme</div>
            {[['Pré-Wedding', true], ['Same Day Edit', true], ['Teaser', true], ['Wedding Film', false]].map(([t, ok], i) => (
              <div key={String(t)} className="m-card m-in" style={{ ...d(i + 1), opacity: ok ? 1 : .55 }}>
                <span className="m-ic">{IcFilm()}</span><span className="m-grow">{t}</span>
                {ok ? <span className="m-btn gold" style={{ height: 24, padding: '0 10px' }}>Ver mais</span> : <span className="m-btn" style={{ height: 24, padding: '0 10px' }}>Aguardar</span>}
              </div>
            ))}
          </>
        ),
      },
      {
        title: <>Descarregar, partilhar, <em>testemunho</em></>,
        text: 'Na página do filme têm três passos. Descarregar: abram a pasta, façam o download de cada vídeo e guardem no computador (disponível 30 dias). Partilhar: copiem o link privado e enviem a quem quiserem. Deixar testemunho: se gostaram, umas palavras vossas ajudam-nos muito.',
        tip: 'Para a melhor qualidade descarreguem num computador com boa ligação à internet.',
        mock: (
          <>
            {[['01', 'Descarregar', 'Abrir pasta', 'Disponível 30 dias'], ['02', 'Partilhar', 'Copiar link', 'Só acede quem tiver o link'], ['03', 'Deixar testemunho', 'Escrever', 'Umas palavras vossas']].map(([n, t, a, s], i) => (
              <div key={n} className={`m-card m-in ${i === 0 ? 'm-tap' : ''}`} style={{ ...d(i), alignItems: 'flex-start' }}>
                <span className="m-ic" style={{ fontFamily: 'var(--g-fm)', fontSize: 9 }}>{n}</span>
                <span className="m-grow">{t}<div className="m-small">{s}</div><div style={{ color: 'var(--g-gold)', fontSize: 10, marginTop: 4 }}>{a} →</div></span>
              </div>
            ))}
          </>
        ),
      },
      {
        title: <>Pedir <em>alterações</em></>,
        text: 'Se quiserem mudar algum detalhe do filme final, têm até 5 dias úteis depois da entrega para o pedir no Atendimento, até 3 alterações pontuais. Indiquem o minuto e o segundo de cada ponto. As alterações são feitas entre janeiro e março.',
        mock: (
          <>
            <div className="m-title m-in" style={d(0)}>Atendimento</div>
            <div className="m-bubble me m-in" style={d(1)}>Alteração ao filme: 03:22 podem usar outra foto no fim?</div>
            <div className="m-bubble them m-in" style={d(3)}>Claro! Fica registada (1 de 3).</div>
            <div className="m-card m-in" style={d(4)}><span className="m-grow">Pedidos de alteração</span><Chip s="info">1 de 3</Chip></div>
          </>
        ),
      },
    ],
  },
  {
    id: 'contrato', label: 'Contrato', icon: IcContract,
    intro: 'Dos vossos dados ao contrato assinado.',
    steps: [
      {
        title: <>Os vossos <em>dados</em></>,
        text: 'Depois de escolherem a proposta no portal da reunião, abre o formulário Dados para Contrato, já com a proposta que aceitaram. Preencham os vossos nomes, documentos de identificação, moradas, contactos e os dados do casamento. Todos os campos são obrigatórios.',
        mock: (
          <>
            <div className="m-title m-in" style={d(0)}>Dados para Contrato</div>
            <div className="m-in" style={d(1)}><div className="m-label">Nome completo</div><div className="m-input"><span className="typed">Ana Sofia Martins</span></div></div>
            <div className="m-in" style={d(2)}><div className="m-label">NIF</div><div className="m-input">•••••••••</div></div>
            <div className="m-in" style={d(3)}><div className="m-label">Proposta escolhida</div><div className="m-input">SIGNATURE</div></div>
            <span className="m-btn gold m-in m-tap" style={{ ...d(4), marginTop: 4 }}>Enviar dados</span>
          </>
        ),
      },
      {
        title: <>O contrato fica <em>pronto</em></>,
        text: 'Assim que enviam os dados, o vosso Contrato de Prestação de Serviços é criado automaticamente, com os serviços, o valor e o plano de pagamentos da proposta que aceitaram. Na secção Contrato · CPS aparece logo como Contrato Disponível.',
        mock: (
          <>
            <div className="m-sub m-in" style={{ ...d(0), textAlign: 'left' }}>RL Photo · Video</div>
            <div className="m-h m-in" style={{ ...d(1), textAlign: 'left' }}>Contrato · CPS</div>
            <div className="m-in" style={d(2)}><ChipSwap from={['Dados recebidos', 'info']} to={['Contrato Disponível', 'ok']} /></div>
            <div className="m-card m-in" style={{ ...d(3), opacity: .7 }}><span className="m-ic">{IcContract()}</span><span className="m-grow"><span className="lab">Documento</span><br />Contrato Prestação de Serviços</span></div>
          </>
        ),
      },
      {
        title: <>Ler e <em>guardar</em></>,
        text: 'Toquem no documento para o abrir e ler com calma. Com o botão Imprimir / Guardar PDF ficam com uma cópia no telemóvel ou no computador.',
        mock: (
          <>
            <div className="m-h m-in" style={{ ...d(0), textAlign: 'left' }}>Contrato · CPS</div>
            <div className="m-in" style={d(1)}><Chip s="ok">Contrato Disponível</Chip></div>
            <div className="m-card gold m-in m-tap" style={d(2)}><span className="m-ic">{IcContract()}</span><span className="m-grow"><span className="lab">Documento</span><br />Contrato Prestação de Serviços</span>↗</div>
            <span className="m-btn m-in" style={d(3)}>Imprimir / Guardar PDF</span>
          </>
        ),
      },
      {
        title: <>Enviar o contrato <em>assinado</em></>,
        text: 'Assinem o contrato e, na secção Contrato · CPS, toquem em Enviar contrato assinado. Pode ser em PDF ou numa fotografia, até 4 MB. Quando o contrato assinado nos chega e a adjudicação está paga, as restantes páginas do portal ficam desbloqueadas.',
        tip: 'Enquanto faltar um destes passos, ao tocarem numa página com cadeado aparece o que ainda está em falta.',
        mock: (
          <>
            <div className="m-h m-in" style={{ ...d(0), textAlign: 'left' }}>Contrato · CPS</div>
            <div className="m-card m-in m-tap" style={{ ...d(1), borderColor: 'rgba(255,255,255,.55)' }}><span className="m-ic">{IcUpload()}</span><span className="m-grow"><span className="lab">Contrato assinado</span><br />Enviar contrato assinado</span></div>
            <div className="m-in" style={d(3)}><ChipSwap from={['A enviar…', 'info']} to={['Recebido ✓', 'ok']} /></div>
            <div className="m-label m-in" style={{ ...d(4), marginTop: 6 }}>Menu</div>
            <div className="m-card m-in" style={d(5)}><span className="m-grow">Fotografias</span><ChipSwap from={['Bloqueada', 'wait']} to={['Aberta', 'ok']} /></div>
          </>
        ),
      },
      {
        title: <>Serviços <em>contratados</em></>,
        text: 'Por baixo do contrato veem o resumo do que contrataram em fotografia e em vídeo. Se algo não estiver como combinámos, digam-nos no Atendimento.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Serviços contratados</div>
            <div className="m-card m-in" style={{ ...d(1), alignItems: 'flex-start' }}><span className="m-ic">{IcCamera()}</span><span className="m-grow">Fotografia<div className="m-small">Preparação · Cerimónia · Sessão · Festa · Álbum</div></span></div>
            <div className="m-card m-in" style={{ ...d(2), alignItems: 'flex-start' }}><span className="m-ic">{IcFilm()}</span><span className="m-grow">Vídeo<div className="m-small">Teaser · Filme completo · Drone</div></span></div>
          </>
        ),
      },
    ],
  },
  {
    id: 'pagamentos', label: 'Pagamentos', icon: IcCard,
    intro: 'As fases, os métodos e como registar cada pagamento.',
    steps: [
      {
        title: <>Três <em>fases</em></>,
        text: 'O pagamento é feito em três fases. A Adjudicação é paga na assinatura do contrato e reserva o vosso dia. O Reforço corresponde a 80% do valor em falta, até 2 dias antes do casamento. O Final são os restantes 20%, no final. Cada pagamento é registado no portal e fica visível como confirmado.',
        list: [
          ['Adjudicação', 'na assinatura do contrato, para reservar o dia'],
          ['Reforço', '80% do valor em falta, até 2 dias antes do casamento'],
          ['Final', 'os restantes 20%, no final'],
        ],
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Pagamentos</div>
            <div className="m-timeline">
              {[['I', 'Adjudicação', 'Na assinatura · reserva o dia', 'ok', 'Pago'], ['II', 'Reforço', '80% · até 2 dias antes', 'wait', 'Pendente'], ['III', 'Final', '20% · no final', 'wait', 'Pendente']].map(([n, t, s, st, l], i) => (
                <div key={n} className="st m-in" style={d(i + 1)}>
                  <span className={`bul ${st === 'ok' ? 'ok' : ''}`}>{n}</span>
                  <span><div style={{ fontSize: 12 }}>{t}</div><div className="m-small">{s}</div></span>
                  <Chip s={st as 'ok' | 'wait'}>{l}</Chip>
                </div>
              ))}
            </div>
          </>
        ),
      },
      {
        title: <>Como <em>pagar</em></>,
        text: 'Podem pagar por MB WAY, por transferência bancária ou em numerário. Os dados para pagamento estão na secção Pagamentos. Na descrição indiquem a referência do vosso evento.',
        tip: 'A referência está no portal, por exemplo CAS_026_26_RL. Ajuda-nos a identificar o pagamento logo.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Método de pagamento</div>
            {['MB WAY', 'Transferência', 'Numerário'].map((m, i) => (
              <div key={m} className={`m-card m-in ${i === 1 ? 'gold m-tap' : ''}`} style={d(i + 1)}><span className="m-ic">{IcCard()}</span><span className="m-grow">{m}</span></div>
            ))}
            <div className="m-card m-in" style={d(4)}><span className="m-grow"><span className="lab">Referência</span><br /><span style={{ fontFamily: 'var(--g-fm)', fontSize: 11 }}>CAS_026_26_RL</span></span></div>
          </>
        ),
      },
      {
        title: <>Registar o <em>pagamento</em></>,
        text: 'Depois de pagar, toquem em Registar Pagamento. Indiquem o valor, escolham a fase e o método e anexem o comprovativo. Demora menos de um minuto.',
        mock: (
          <>
            <div className="m-in" style={d(0)}><div className="m-label">Valor pago (€)</div><div className="m-input"><span className="typed">500,00</span></div></div>
            <div className="m-in" style={d(1)}><div className="m-label">Fase do pagamento</div>
              <div className="m-row"><span className="m-btn" style={{ height: 28 }}>Adjud.</span><span className="m-btn gold m-tap" style={{ height: 28 }}>Reforço</span><span className="m-btn" style={{ height: 28 }}>Final</span></div>
            </div>
            <div className="m-in" style={d(2)}><div className="m-label">Comprovativo</div><div className="m-drop-zone" style={{ padding: 10 }}>comprovativo.pdf ✓</div></div>
            <span className="m-btn gold m-in" style={d(3)}>Registar Pagamento</span>
          </>
        ),
      },
      {
        title: <>Pagamento <em>confirmado</em></>,
        text: 'Confirmamos o pagamento do nosso lado e ele passa a aparecer na secção Pagamentos, junto dos anteriores. Assim têm sempre presente o que já foi pago e o que falta.',
        mock: (
          <>
            <div className="m-h m-in" style={{ ...d(0), fontSize: 20 }}>Pagamento <em>registado.</em></div>
            <div className="m-card m-in" style={d(1)}><span className="m-grow">Adjudicação</span><Chip s="ok">Pago</Chip></div>
            <div className="m-card m-in" style={d(2)}><span className="m-grow">Reforço</span><ChipSwap from={['Em validação', 'info']} to={['Pago', 'ok']} /></div>
            <div className="m-card m-in" style={d(3)}><span className="m-grow">Final</span><Chip s="wait">Pendente</Chip></div>
          </>
        ),
      },
    ],
  },
  {
    id: 'atendimento', label: 'Falar connosco', icon: IcChat,
    intro: 'Mensagens, a preparação do dia e a vossa opinião.',
    steps: [
      {
        title: <>Enviar uma <em>mensagem</em></>,
        text: 'Têm uma dúvida ou um pedido? Na secção Atendimento escrevam a mensagem e enviem. Fica tudo registado num só sítio, sem se perder em emails.',
        mock: (
          <>
            <div className="m-title m-in" style={d(0)}>Atendimento</div>
            <div style={{ flex: 1, minHeight: 150 }} />
            <div className="m-row m-in" style={{ ...d(1), alignItems: 'center' }}>
              <div className="m-input" style={{ flex: 1 }}><span className="typed">Podemos mudar a hora?</span></div>
              <span className="m-btn gold m-tap" style={{ flex: 'none', width: 34, padding: 0 }}>→</span>
            </div>
          </>
        ),
      },
      {
        title: <>A nossa <em>resposta</em></>,
        text: 'Quando respondemos, a resposta aparece na mesma conversa em Atendimento e recebem um aviso no sino e por email.',
        mock: (
          <>
            <div className="m-title m-in" style={d(0)}>Atendimento</div>
            <div className="m-bubble me m-in" style={d(1)}>Podemos mudar a hora da sessão para as 17h?</div>
            <div className="m-bubble them m-in" style={d(4)}>Claro que sim! Já atualizámos o cronograma. Até breve, Rui</div>
          </>
        ),
      },
      {
        title: <>Pré-wedding e <em>preparação</em></>,
        text: 'A sessão pré-wedding é marcada por vocês no portal, 30 dias antes do casamento. Cerca de 15 dias antes do dia, preencham o Briefing com os detalhes e marquem a reunião de preparação, feita por videochamada. No Cronograma cada tarefa pendente aparece a vermelho e passa a verde quando fica concluída.',
        list: [
          ['Pré-wedding', 'marcada por vocês no portal, 30 dias antes do casamento'],
          ['Briefing', 'preenchido cerca de 15 dias antes'],
          ['Reunião de preparação', 'por videochamada, marcada por vocês'],
        ],
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Cronograma Casamento</div>
            {[['Contrato assinado', 'green'], ['Marcar o Pré-Wedding', 'green'], ['Preencher o Briefing', 'flip'], ['Reunião de preparação', 'red']].map(([t, s], i) => (
              <div key={t} className="m-card m-in" style={d(i + 1)}><span className="m-grow">{t}</span><span className={`m-toggle ${s}`} /></div>
            ))}
          </>
        ),
      },
      {
        title: <>A vossa <em>opinião</em></>,
        text: 'Depois da última entrega, contamos com a vossa opinião. Na Área SAT do portal toquem em DAR SATISFAÇÃO e digam-nos como foi. Cada palavra vossa ajuda-nos a fazer melhor.',
        mock: (
          <>
            <div className="m-title m-in" style={d(0)}>Área SAT. Noivos</div>
            <div className="m-small m-in" style={{ ...d(1), textAlign: 'center' }}>A vossa opinião é muito importante para nós.</div>
            <div className="m-in" style={{ ...d(2), textAlign: 'center', fontSize: 20, letterSpacing: '.2em', color: 'var(--g-gold)' }}>★★★★★</div>
            <span className="m-btn white m-in m-tap" style={d(3)}>Dar satisfação</span>
          </>
        ),
      },
    ],
  },
]

// ─── componente ──────────────────────────────────────────────────────────────

const STEP_MS = 7000

export default function GuiaPortal() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [topicIdx, setTopicIdx] = useState<number | null>(null)
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const topic = topicIdx !== null ? TOPICS[topicIdx] : null
  const isLastStep = topic ? step === topic.steps.length - 1 : false
  const isLastTopic = topicIdx === TOPICS.length - 1

  const goTopic = useCallback((i: number) => { setTopicIdx(i); setStep(0) }, [])

  const next = useCallback(() => {
    if (!topic || topicIdx === null) return
    if (step < topic.steps.length - 1) setStep(s => s + 1)
    else if (topicIdx < TOPICS.length - 1) goTopic(topicIdx + 1)
    else { setPlaying(false); setTopicIdx(null) }
  }, [topic, topicIdx, step, goTopic])

  const prev = useCallback(() => {
    if (topicIdx === null) return
    if (step > 0) setStep(s => s - 1)
    else if (topicIdx > 0) { setTopicIdx(topicIdx - 1); setStep(TOPICS[topicIdx - 1].steps.length - 1) }
  }, [topicIdx, step])

  // Reprodução automática
  useEffect(() => {
    if (!open || !playing || topicIdx === null) return
    const id = setTimeout(next, STEP_MS)
    return () => clearTimeout(id)
  }, [open, playing, topicIdx, step, next])

  // Teclado + bloquear scroll da página por trás
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
      else if (topicIdx !== null && e.key === 'ArrowRight') { setPlaying(false); next() }
      else if (topicIdx !== null && e.key === 'ArrowLeft') { setPlaying(false); prev() }
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow }
  }, [open, topicIdx, next, prev])

  // No telemóvel os temas são chips com scroll horizontal: manter o ativo à vista
  useEffect(() => {
    if (!open || topicIdx === null) return
    document.querySelector('.guia-side .tab.on')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [open, topicIdx])

  function close() { setOpen(false); setPlaying(false) }

  const current = topic?.steps[step]

  return (
    <>
      <button type="button" className="guia-rl guia-fab" onClick={() => { setOpen(true); setTopicIdx(null) }}>
        Guia do Portal <span className="ic">◆</span>
      </button>

      {open && mounted && createPortal(
        <div className="guia-rl guia-overlay" onClick={close}>
          <div className="guia-modal" role="dialog" aria-modal="true" aria-label="Guia do Portal" onClick={e => e.stopPropagation()}>
            <button type="button" className="guia-close" onClick={close} aria-label="Fechar">✕</button>

            {!topic ? (
              <div className="guia-home">
                {/* Capa de cinema, igual às páginas novas do menu */}
                <section className="guia-capa">
                  <div className="foto">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/portal-defaults/hero-default.webp" alt="" />
                  </div>
                  <span className="vline" />
                  <p className="kicker"><span className="pulse" />Guia do portal dos noivos</p>
                  <div className="capa-body">
                    <p className="brand">RL Photo.Video</p>
                    <h2 className="capa-titulo">Guia do<br />Portal</h2>
                    <div className="sub"><span className="ln" /><p>Tudo o que precisam de saber, passo a passo</p></div>
                    <div className="pills">
                      <span className="pill gold">{TOPICS.length} temas</span>
                      <span className="pill">{TOPICS.reduce((n, t) => n + t.steps.length, 0)} passos</span>
                      <span className="pill">Emails · Prazos · Seleção</span>
                    </div>
                    <button type="button" className="guia-cta" onClick={() => { goTopic(0); setPlaying(true) }}>
                      {IcPlay()} Ver o guia completo
                    </button>
                  </div>
                </section>

                <div className="guia-temas">
                  <p className="sec-eyebrow">Escolham um tema</p>
                  <div className="guia-topics">
                    {TOPICS.map((t, i) => (
                      <button key={t.id} type="button" className="guia-topic" style={{ animationDelay: `${0.05 + i * 0.06}s` }} onClick={() => goTopic(i)}>
                        <div className="top">
                          <span className="tic">{t.icon()}</span>
                          <span className="n">{String(i + 1).padStart(2, '0')}</span>
                        </div>
                        <h3>{t.label}</h3>
                        <p>{t.intro}</p>
                        <div className="foot"><span>{t.steps.length} passos</span><span className="go">{IcArrow()}</span></div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="guia-player">
                <nav className="guia-side">
                  <button type="button" className="back" onClick={() => { setTopicIdx(null); setPlaying(false) }}>{IcBack()}<span>Todos os temas</span></button>
                  {TOPICS.map((t, i) => (
                    <button key={t.id} type="button" className={`tab ${i === topicIdx ? 'on' : ''}`} onClick={() => goTopic(i)}>
                      {t.icon()}<span className="t">{t.label}</span>
                    </button>
                  ))}
                </nav>

                <div className="guia-stage">
                  <div className="guia-text">
                    <div className="body guia-anim" key={`t-${topicIdx}-${step}`}>
                      <div className="count"><span className="pulse" />{topic.label} · <b>Passo {step + 1}</b> de {topic.steps.length}</div>
                      <h3>{current?.title}</h3>
                      <p className="desc">{current?.text}</p>
                      {current?.list && (
                        <dl className="guia-list">
                          {current.list.map(([k, v], i) => (
                            <div key={i} style={{ animationDelay: `${0.15 + i * 0.06}s` }}><dt>{k}</dt><dd>{v}</dd></div>
                          ))}
                        </dl>
                      )}
                      {current?.tip && <div className="tip"><span>Dica</span><span>{current.tip}</span></div>}
                    </div>

                    <div className="guia-controls">
                      <div className="guia-dots">
                        {topic.steps.map((_, i) => (
                          <button
                            key={`${topicIdx}-${i}-${i === step ? step : ''}`}
                            type="button"
                            aria-label={`Passo ${i + 1}`}
                            title={`Passo ${i + 1}`}
                            className={`${i === step ? 'on' : ''} ${i < step ? 'done' : ''} ${playing ? 'playing' : ''}`}
                            style={{ '--dur': `${STEP_MS}ms` } as CSSProperties}
                            onClick={() => { setPlaying(false); setStep(i) }}
                          ><span className="fill" /></button>
                        ))}
                      </div>
                      <button type="button" className="guia-btn icon" onClick={() => setPlaying(p => !p)} aria-label={playing ? 'Pausar' : 'Reproduzir'}>
                        {playing ? IcPause() : IcPlay()}
                      </button>
                      <button type="button" className="guia-btn icon" onClick={() => { setPlaying(false); prev() }} disabled={topicIdx === 0 && step === 0} aria-label="Anterior">
                        {IcBack()}
                      </button>
                      <button type="button" className="guia-btn primary" onClick={() => { setPlaying(false); next() }}>
                        {isLastStep ? (isLastTopic ? 'Concluir' : 'Próximo tema') : 'Seguinte'} {IcArrow()}
                      </button>
                    </div>
                  </div>

                  <div className="guia-visual" key={`v-${topicIdx}-${step}`}>
                    <Phone bell={(topic.id === 'portal' && step === 3) || (topic.id === 'filme' && step === 0)}>
                      {current?.mock}
                    </Phone>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}
