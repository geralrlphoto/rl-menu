'use client'

/* ============================================================
   PreWeddingView — render Atmosphère da página Guia Pré-Wedding.
   Recebe slots + reservedSlotId + callbacks. Toda a lógica de
   reservas e notificações continua no componente original
   PreWeddingSection (passado como prop bookNode).
   ============================================================ */

import { type ReactNode } from 'react'
import './prewedding.css'

export type PreWeddingViewProps = {
  // Hero
  title: string
  heroImageUrl?: string | null
  backHref: string
  isAdmin: boolean
  adminActions?: ReactNode
  onEditTitle?: () => void

  // Conteúdo editorial (vem do Notion)
  /** Foto à direita da intro (foto principal pré-wedding) */
  introPhotoUrl?: string | null
  /** Texto da secção introdutória (parágrafos Notion) */
  introParagraphs: string[]
  /** Tríptico de imagens (3 fotos abaixo da intro) */
  triptychUrls?: Array<string | null | undefined>

  /** 3 cenários (Cidade / Campo / Praia) */
  cenarios: Array<{
    num: string                    // ex: '01'
    title: string                  // ex: 'Na Cidade'
    titleAccent?: string           // palavra final em itálico dourado
    paragraphs: string[]
    photoUrl?: string | null
    bullets?: string[]
    outfit?: { noivo?: string; noiva?: string }
    dica?: string
    galleryUrls?: Array<string | null | undefined>
  }>

  /** Booking slot: passa-se já renderizado o componente
   *  PreWeddingSection existente, mas só queremos a parte do
   *  calendário + slots + notificar. */
  bookNode?: ReactNode
}

export function PreWeddingView(props: PreWeddingViewProps) {
  return (
    <>
      {/* Admin bar */}
      {props.isAdmin && props.adminActions && (
        <div className="abar">{props.adminActions}</div>
      )}

      {/* Hero */}
      <header className="subhero">
        {props.heroImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.heroImageUrl} alt="" className="img" />
        ) : (
          <div className="ph img" />
        )}
        <div className="scrim" />
        <a className="back back-hero" href={props.backHref}>
          <span className="chev">‹</span> Voltar
        </a>
        <div className="cap">
          <div className="eyebrow e">RL Photo · Video</div>
          <div className="title">
            <h1>{props.title || 'Guia Pré-Wedding'}</h1>
            {props.isAdmin && props.onEditTitle && (
              <span className="pencil" onClick={props.onEditTitle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 19l1-4L16 5l3 3L9 18l-4 1Z" /><path d="M14 7l3 3" />
                </svg>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Intro */}
      <section className="pw-intro">
        <div className="body">
          <div className="eyebrow">Pré-Wedding</div>
          <h2>Para que serve a <em>sessão</em></h2>
          {props.introParagraphs.slice(0, 4).map((p, i) => (
            <p key={i} dangerouslySetInnerHTML={{ __html: highlight(p) }} />
          ))}
        </div>
        <div className="photo">
          {props.introPhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.introPhotoUrl} alt="" />
          ) : (
            <div className="ph" data-label="Pré-Wedding" />
          )}
        </div>
      </section>

      {/* Tríptico de imagens */}
      {props.triptychUrls && props.triptychUrls.filter(Boolean).length > 0 && (
        <div className="pw-tript">
          {[0, 1, 2].map(i => {
            const u = props.triptychUrls?.[i] ?? null
            return (
              <div key={i} className="frame">
                {u ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u} alt="" />
                ) : (
                  <div className="ph" data-label="Foto" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 3 Cenários */}
      {props.cenarios.map((c, i) => (
        <section key={i} className="pw-cenario">
          <div className="num">{c.num}</div>
          <h3>
            {c.titleAccent ? (
              <>{c.title.replace(c.titleAccent, '').trim()}{' '}
                <em>{c.titleAccent}</em></>
            ) : c.title}
          </h3>
          <hr className="gold-rule" />

          <div className="body">
            <div>
              {c.paragraphs.map((p, j) => (
                <p key={j} dangerouslySetInnerHTML={{ __html: highlight(p) }} />
              ))}

              {c.bullets && c.bullets.length > 0 && (
                <ul className="cen-list">
                  {c.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              )}

              {c.outfit && (
                <div className="pw-outfit">
                  <div className="card">
                    <h4>Noivo</h4>
                    <p>{c.outfit.noivo ?? 'Camisa clara, blazer leve, calças de algodão.'}</p>
                  </div>
                  <div className="card">
                    <h4>Noiva</h4>
                    <p>{c.outfit.noiva ?? 'Vestido fluido, tons neutros, calçado confortável.'}</p>
                  </div>
                </div>
              )}

              {c.dica && (
                <div className="pw-dica">
                  <span className="ic">✦</span>
                  <div className="txt" dangerouslySetInnerHTML={{ __html: highlight(c.dica) }} />
                </div>
              )}
            </div>

            <div className="cen-photo">
              {c.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.photoUrl} alt="" />
              ) : (
                <div className="ph" data-label={c.title} />
              )}
            </div>
          </div>

          {c.galleryUrls && c.galleryUrls.filter(Boolean).length > 0 && (
            <div className="pw-gallery">
              {[0, 1, 2].map(j => {
                const u = c.galleryUrls?.[j] ?? null
                return (
                  <div key={j} className="frame">
                    {u ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u} alt="" />
                    ) : (
                      <div className="ph" data-label="Foto" />
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      ))}

      {/* Logo card creme */}
      <div className="logocard">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/portal-noivos/logo-ink.png" alt="RL Photo Video" />
        <div className="url">www.rlphotovideo.pt</div>
      </div>

      {/* Marcar Pré-Wedding — usa PreWeddingSection existente */}
      {props.bookNode && (
        <div className="pw-book">
          <div className="head">
            <div className="eyebrow">Reserva</div>
            <h2>Marcar Pré-Wedding</h2>
          </div>
          {props.bookNode}
        </div>
      )}
    </>
  )
}

/** Realça palavras-chave entre **double-stars** como <strong> dourado */
function highlight(text: string): string {
  const safe = String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return safe
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

/** Defaults editoriais para os 3 cenários quando não há overrides
 *  no Notion. Texto curto e elegante — copia o tom da maquete. */
export const DEFAULT_CENARIOS: PreWeddingViewProps['cenarios'] = [
  {
    num: '01',
    title: 'Na Cidade',
    titleAccent: 'Cidade',
    paragraphs: [
      'Praças, arquitectura clássica e ruelas escondidas — a **cidade traz um carácter editorial** à sessão.',
      'Adapta-se bem a casais que gostam de luz frontal, contrastes urbanos e enquadramentos com janelas, varandas e fachadas.',
    ],
    bullets: [
      'Bairros históricos com luz da manhã',
      'Café típico ou esplanada para um momento descontraído',
      'Travessas com cor e textura de mosaico',
    ],
    outfit: {
      noivo: 'Camisa clara, blazer leve, sapato fechado clássico.',
      noiva: 'Vestido midi fluido, tons neutros, calçado confortável.',
    },
    dica: 'Manhãs a meio da semana têm **menos tráfego e melhor luz**. Marquem com 2-3 dias de antecedência para acertar o tempo.',
  },
  {
    num: '02',
    title: 'No Campo',
    titleAccent: 'Campo',
    paragraphs: [
      'O verde abre espaço para uma estética mais natural, com **luz dourada do fim da tarde** e silêncio à volta.',
      'Cenários como vinhas, quintas e caminhos rurais funcionam bem para casais que querem fugir ao excesso visual da cidade.',
    ],
    bullets: [
      'Quintas e vinhas com horizonte aberto',
      'Caminhos de terra ao pôr-do-sol',
      'Pequenos detalhes — flores silvestres, muretas, árvores antigas',
    ],
    outfit: {
      noivo: 'Camisa de linho, calça de algodão, sapatos botinas.',
      noiva: 'Vestido longo leve, tom marfim ou bege, sandália baixa.',
    },
    dica: 'Verifiquem o **acesso ao local com antecedência** — algumas quintas pedem marcação prévia. Levem água.',
  },
  {
    num: '03',
    title: 'Na Praia',
    titleAccent: 'Praia',
    paragraphs: [
      'A praia oferece o registo mais espontâneo e descontraído — **luz suave**, brisa, e o som das ondas como banda sonora.',
      'Ideal para casais que querem fotos sem rigidez, com movimento e expressão livre.',
    ],
    bullets: [
      'Falésias e arribas ao fim do dia',
      'Praia de areia clara — passos descalços, mãos dadas',
      'Pequeno barco ou cais para mudar o cenário rapidamente',
    ],
    outfit: {
      noivo: 'Camisa branca de linho, calça clara enrolada.',
      noiva: 'Vestido leve e branco, descalça ou sandália plana.',
    },
    dica: 'A **última hora antes do pôr-do-sol** é mágica. Vai com cabelo arranjado mas pronto a deixar o vento entrar.',
  },
]
