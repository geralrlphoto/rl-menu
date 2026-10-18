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

type Step = { title: ReactNode; text: string; tip?: string; mock: ReactNode }
type Topic = { id: string; label: string; intro: string; icon: () => ReactNode; steps: Step[] }

const TOPICS: Topic[] = [
  {
    id: 'portal', label: 'Como funciona', icon: IcPortal,
    intro: 'O que encontram no portal e como andar por ele.',
    steps: [
      {
        title: <>Um só lugar para <em>tudo</em></>,
        text: 'Este é o vosso portal privado. Aqui ficam o contrato, os pagamentos, as fotografias, o filme e todas as novidades do vosso casamento, sempre atualizados por nós.',
        tip: 'Guardem o link que receberam por email. Podem abrir o portal no telemóvel ou no computador.',
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
        text: 'No menu encontram cada secção: Atendimento, Contrato, Pagamentos, Fotografias, O Nosso Filme, Cronograma e as restantes. Toquem numa para a abrir. A que está em dourado é o passo em que estamos agora.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Menu</div>
            {['Atendimento', 'Contrato · CPS', 'Pagamentos', 'Fotografias', 'O Nosso Filme', 'Cronograma'].map((t, i) => (
              <div key={t} className={`m-card m-in ${i === 2 ? 'gold m-tap' : ''}`} style={{ ...d(i + 1), padding: '9px 12px' }}>
                <span className="m-grow">{t}</span><span style={{ opacity: .5 }}>›</span>
              </div>
            ))}
          </>
        ),
      },
      {
        title: <>O <em>sino</em> das novidades</>,
        text: 'Sempre que temos algo para vos dizer aparece um ponto vermelho no sino dourado, no topo do portal. Toquem no sino para ler a mensagem. Também enviamos um email com o mesmo aviso.',
        mock: (
          <>
            <div className="m-drop m-in" style={d(3)}>
              <div className="m-label">Nova notificação</div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>As vossas fotografias estão prontas</div>
              <div className="m-small">Já podem ver a Galeria Online na secção Fotografias.</div>
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
        text: 'Na página inicial acompanham cada entrega e a data prevista. Cada linha passa de Aguardar para Em Edição e depois Entregue, à medida que o trabalho avança no nosso atelier.',
        tip: 'Não precisam de nos perguntar em que ponto está: este quadro atualiza-se sozinho.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Estado das Entregas</div>
            <div className="m-card m-in" style={d(1)}><span className="m-grow">Seleção de Fotos</span><ChipSwap from={['Aguardar', 'wait']} to={['Entregue', 'ok']} /></div>
            <div className="m-card m-in" style={d(2)}><span className="m-grow">Fotos para Edição</span><Chip s="info">Em Edição</Chip></div>
            <div className="m-card m-in" style={d(3)}><span className="m-grow">Álbum</span><Chip s="wait">Aguardar</Chip></div>
            <div className="m-card m-in" style={d(4)}><span className="m-grow">Entrega do Vídeo</span><Chip s="wait">Aguardar</Chip></div>
          </>
        ),
      },
    ],
  },
  {
    id: 'fotos', label: 'Fotografias', icon: IcCamera,
    intro: 'Como recebem, escolhem e aprovam as vossas fotografias.',
    steps: [
      {
        title: <>Recebem um <em>aviso</em></>,
        text: 'Quando carregamos fotografias no portal recebem um email e uma notificação no sino. Basta tocar no botão do email ou abrir a secção Fotografias.',
        mock: (
          <div className="m-mail m-in m-tap" style={{ ...d(0), borderRadius: 10 }}>
            <div className="hd">As vossas <em>fotografias</em></div>
            <div className="bd">
              Olá Ana e Pedro,<br />as primeiras fotografias do vosso dia já estão no portal.
              <div className="cta">Abrir o portal</div>
            </div>
          </div>
        ),
      },
      {
        title: <>Galeria <em>Online</em></>,
        text: 'Até 7 dias depois do casamento fica disponível a Galeria Online, para verem, descarregarem e partilharem com a família. Em Fotografias, toquem em VER MAIS. Um cartão com AGUARDAR significa que ainda está a ser preparado.',
        mock: (
          <>
            <div className="m-card m-in" style={{ ...d(0), flexDirection: 'column', alignItems: 'stretch', padding: 8 }}>
              <div className="m-img" style={{ height: 86 }} />
              <div className="m-row" style={{ alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 12 }}>Galeria Online</span>
                <span className="m-btn gold m-tap" style={{ height: 26, flex: 'none', padding: '0 12px' }}>Ver mais →</span>
              </div>
            </div>
            <div className="m-card m-in" style={{ ...d(1), flexDirection: 'column', alignItems: 'stretch', padding: 8, opacity: .55 }}>
              <div className="m-img" style={{ height: 56 }} />
              <div className="m-row" style={{ alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 12 }}>Fotos para Seleção</span>
                <span className="m-btn" style={{ height: 26, flex: 'none', padding: '0 12px' }}>Aguardar</span>
              </div>
            </div>
          </>
        ),
      },
      {
        title: <>Fotos para <em>Seleção</em></>,
        text: 'Até 30 dias depois do casamento recebem a galeria completa, organizada em pastas (Noivo, Noiva, Cerimónia e as seguintes). É daqui que escolhem as fotografias para o álbum. Cada fotografia tem um nome, por exemplo RR-0001.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Pasta · Cerimónia</div>
            <div className="m-grid m-in" style={d(1)}>
              {['0120', '0121', '0122', '0123', '0124', '0125', '0126', '0127', '0131'].map((c, i) => (
                <div key={c} className={`m-img ${[0, 4, 8].includes(i) ? 'sel' : ''}`}><span className="code">RR-{c}</span></div>
              ))}
            </div>
            <div className="m-small m-in" style={d(3)}>3 fotografias escolhidas nesta pasta</div>
          </>
        ),
      },
      {
        title: <>Como fazer a <em>escolha</em></>,
        text: 'Abram um documento Word e criem uma secção para cada pasta da galeria, pela mesma ordem. Em cada secção escrevam os nomes das fotografias exatamente como aparecem na galeria.',
        tip: 'Escrevam RR-0001 e não só 1. Assim não há trocas de fotografias.',
        mock: (
          <div className="m-doc m-in" style={d(0)}>
            <div className="s">NOIVO</div><div className="c">RR-0001, RR-0002, RR-0003</div>
            <div className="s">NOIVA</div><div className="c">RR-0045, RR-0046, RR-0052</div>
            <div className="s">CERIMÓNIA</div><div className="c">RR-0120, RR-0124, RR-0131</div>
            <div className="s">FESTA</div><div className="c">RR-0310, RR-0322 …</div>
          </div>
        ),
      },
      {
        title: <>Enviar a <em>seleção</em></>,
        text: 'Quando terminarem, toquem em Enviar Seleção e copiem a escolha do Word para cada secção do formulário. Em Estado das Entregas a Seleção passa a Concluído e nós começamos a editar.',
        mock: (
          <>
            <div className="m-in" style={d(0)}><div className="m-label">Noivo</div><div className="m-input"><span className="typed">RR-0001, RR-0002, RR-0003</span></div></div>
            <div className="m-in" style={d(1)}><div className="m-label">Noiva</div><div className="m-input">RR-0045, RR-0046, RR-0052</div></div>
            <div className="m-in" style={d(2)}><div className="m-label">Cerimónia</div><div className="m-input">RR-0120, RR-0124, RR-0131</div></div>
            <span className="m-btn gold m-in m-tap" style={{ ...d(3), marginTop: 6 }}>Enviar Seleção</span>
            <div className="m-card m-in" style={d(4)}><span className="m-grow">Seleção Fotos Noivos</span><ChipSwap from={['Em Seleção', 'info']} to={['Concluído', 'ok']} /></div>
          </>
        ),
      },
      {
        title: <>Aprovar o <em>álbum</em></>,
        text: 'Com a seleção feita, desenhamos a maqueta do álbum e mostramo-la em Fotografias. Revejam com calma, peçam alterações se quiserem e aprovem quando estiver como sonharam. Só depois vai para impressão.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Maquete Álbum</div>
            <div className="m-row m-in" style={{ ...d(1), gap: 3 }}>
              <div className="m-img" style={{ height: 110 }} /><div className="m-img" style={{ height: 110 }} />
            </div>
            <div className="m-small m-in" style={{ ...d(2), textAlign: 'center' }}>Páginas 4 · 5</div>
            <div className="m-row m-in" style={d(3)}>
              <span className="m-btn">Pedir alteração</span>
              <span className="m-btn gold m-tap">Aprovar</span>
            </div>
          </>
        ),
      },
      {
        title: <>Fotos dos <em>convidados</em></>,
        text: 'Os vossos convidados também tiraram fotografias? Na secção Enviar Fotos, dentro de Fotografias, podem carregá-las para ficarem juntas das nossas.',
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
    ],
  },
  {
    id: 'filme', label: 'Vídeos e Filme', icon: IcFilm,
    intro: 'Quando chegam os vídeos e onde os veem.',
    steps: [
      {
        title: <>O aviso do <em>filme</em></>,
        text: 'Sempre que carregamos um vídeo no portal (Same Day Edit, teaser ou o filme completo) recebem um email e uma notificação no sino.',
        mock: (
          <>
            <div className="m-drop m-in" style={d(1)}>
              <div className="m-label">Nova notificação</div>
              <div style={{ fontSize: 12, marginBottom: 4 }}>O vosso teaser está pronto</div>
              <div className="m-small">Vejam-no na secção O Nosso Filme.</div>
            </div>
            <div className="m-card gold m-in m-tap" style={d(3)}><span className="m-ic">{IcFilm()}</span><span className="m-grow">O Nosso Filme</span>›</div>
          </>
        ),
      },
      {
        title: <>Primeiro o <em>teaser</em></>,
        text: 'Se o vosso pacote incluir Same Day Edit ou teaser, estes chegam primeiro, para poderem reviver o dia e partilhar logo com quem mais gostam.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>O Nosso Filme</div>
            {[['Same Day Edit', 'ok', 'Entregue'], ['Teaser', 'ok', 'Entregue'], ['Filme completo', 'info', 'Em Edição']].map(([t, s, l], i) => (
              <div key={t} className="m-card m-in" style={d(i + 1)}>
                <span className="m-ic">{IcFilm()}</span><span className="m-grow">{t}</span><Chip s={s as 'ok' | 'info'}>{l}</Chip>
              </div>
            ))}
          </>
        ),
      },
      {
        title: <>O filme <em>completo</em></>,
        text: 'O filme completo é entregue até 180 dias úteis depois do casamento. A data prevista está sempre visível em Estado das Entregas, para saberem quando contar com ele.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Estado das Entregas</div>
            <div className="m-card m-in" style={{ ...d(1), flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <div className="m-row" style={{ alignItems: 'center' }}><span>Entrega do Vídeo</span><span style={{ flex: 'none' }}><Chip s="info">Em Edição</Chip></span></div>
              <div className="m-progress" style={{ '--w': '64%' } as CSSProperties}><i /></div>
              <div className="m-small">Data prevista · 28 Maio 2027</div>
            </div>
          </>
        ),
      },
      {
        title: <>Ver e <em>descarregar</em></>,
        text: 'Em O Nosso Filme toquem no vídeo para o ver no portal. Usem o botão Descarregar para guardar a versão em alta qualidade no computador.',
        tip: 'Para a melhor qualidade, descarreguem num computador com boa ligação à internet.',
        mock: (
          <>
            <div className="m-img m-in" style={{ ...d(0), height: 150 }}><span className="m-play m-tap" style={{ borderRadius: '50%' }}>{IcPlay()}</span></div>
            <div className="m-title m-in" style={d(1)}>O filme de Ana &amp; Pedro</div>
            <div className="m-small m-in" style={d(1)}>12 · Setembro · 2026 · 14 min</div>
            <span className="m-btn gold m-in" style={d(2)}>{IcDownload()} Descarregar</span>
          </>
        ),
      },
    ],
  },
  {
    id: 'contrato', label: 'Contrato', icon: IcContract,
    intro: 'Dos vossos dados ao contrato pronto a guardar.',
    steps: [
      {
        title: <>Os vossos <em>dados</em></>,
        text: 'Para prepararmos o contrato, preencham o formulário Dados para Contrato com os vossos nomes, documentos de identificação, morada e os dados do casamento.',
        mock: (
          <>
            <div className="m-title m-in" style={d(0)}>Dados para Contrato</div>
            <div className="m-in" style={d(1)}><div className="m-label">Nome completo</div><div className="m-input"><span className="typed">Ana Sofia Martins</span></div></div>
            <div className="m-in" style={d(2)}><div className="m-label">NIF</div><div className="m-input">•••••••••</div></div>
            <div className="m-in" style={d(3)}><div className="m-label">Local do casamento</div><div className="m-input">Quinta da Serra</div></div>
            <span className="m-btn gold m-in m-tap" style={{ ...d(4), marginTop: 4 }}>Enviar dados</span>
          </>
        ),
      },
      {
        title: <>Preparamos o <em>contrato</em></>,
        text: 'Com os vossos dados, preparamos o Contrato de Prestação de Serviços. Na secção Contrato · CPS o estado passa de Em Preparação para Contrato Disponível.',
        mock: (
          <>
            <div className="m-sub m-in" style={{ ...d(0), textAlign: 'left' }}>RL Photo · Video</div>
            <div className="m-h m-in" style={{ ...d(1), textAlign: 'left' }}>Contrato · CPS</div>
            <div className="m-in" style={d(2)}><ChipSwap from={['Em Preparação', 'wait']} to={['Contrato Disponível', 'ok']} /></div>
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
        text: 'O pagamento é feito em três fases: Adjudicação, que reserva a vossa data, Reforço e Final. Os valores e datas de cada fase estão no contrato e na secção Pagamentos.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Pagamentos</div>
            <div className="m-timeline">
              {[['I', 'Adjudicação', 'Reserva da data', 'ok', 'Pago'], ['II', 'Reforço', 'Antes do casamento', 'wait', 'Pendente'], ['III', 'Final', 'Pagamento final', 'wait', 'Pendente']].map(([n, t, s, st, l], i) => (
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
    intro: 'Mensagens, briefing e o cronograma do dia.',
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
        title: <>Briefing e <em>cronograma</em></>,
        text: 'Antes do casamento preencham o Briefing com os detalhes do dia e acompanhem o Cronograma. Cada tarefa pendente aparece a vermelho e passa a verde quando fica concluída.',
        mock: (
          <>
            <div className="m-label m-in" style={d(0)}>Cronograma Casamento</div>
            {[['Preencher o Briefing', 'flip'], ['Reunião de preparação', 'red'], ['Lista de fotos de família', 'red'], ['Contrato assinado', 'green']].map(([t, s], i) => (
              <div key={t} className="m-card m-in" style={d(i + 1)}><span className="m-grow">{t}</span><span className={`m-toggle ${s}`} /></div>
            ))}
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
        <span className="ic">?</span> Guia do Portal
      </button>

      {open && mounted && createPortal(
        <div className="guia-rl guia-overlay" onClick={close}>
          <div className="guia-modal" role="dialog" aria-modal="true" aria-label="Guia do Portal" onClick={e => e.stopPropagation()}>
            <button type="button" className="guia-close" onClick={close} aria-label="Fechar">×</button>

            {!topic ? (
              <div className="guia-home">
                <div className="guia-eyebrow">Guia do Portal</div>
                <h2>Como funciona o <em>vosso</em> portal</h2>
                <p className="lead">Escolham um tema e vejam, passo a passo, como cada coisa acontece: das fotografias e do filme ao contrato e aos pagamentos.</p>
                <div className="guia-topics">
                  {TOPICS.map((t, i) => (
                    <button key={t.id} type="button" className="guia-topic" style={{ animationDelay: `${0.05 + i * 0.07}s` }} onClick={() => goTopic(i)}>
                      <span className="n">0{i + 1}</span>
                      <span className="go">{IcArrow()}</span>
                      <div className="tic">{t.icon()}</div>
                      <h3>{t.label}</h3>
                      <p>{t.intro}</p>
                      <div className="steps">{t.steps.length} passos</div>
                    </button>
                  ))}
                </div>
                <div style={{ marginTop: 28, display: 'flex', justifyContent: 'center' }}>
                  <button type="button" className="guia-btn primary" onClick={() => { goTopic(0); setPlaying(true) }}>
                    {IcPlay()} Ver o guia completo
                  </button>
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
                      <div className="count">{topic.label} · <b>Passo {step + 1}</b> de {topic.steps.length}</div>
                      <h3>{current?.title}</h3>
                      <p className="desc">{current?.text}</p>
                      {current?.tip && <div className="tip"><span>Dica</span><span>{current.tip}</span></div>}
                    </div>

                    <div className="guia-controls">
                      <div className="guia-dots">
                        {topic.steps.map((_, i) => (
                          <button
                            key={`${topicIdx}-${i}-${i === step ? step : ''}`}
                            type="button"
                            aria-label={`Passo ${i + 1}`}
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
                    <Phone bell={(topic.id === 'portal' && step === 2) || (topic.id === 'filme' && step === 0)}>
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
