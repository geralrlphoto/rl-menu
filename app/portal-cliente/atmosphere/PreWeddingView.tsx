'use client'

/* ============================================================
   PreWeddingView — render Atmosphère da página Guia Pré-Wedding.
   Recebe slots + reservedSlotId + callbacks. Toda a lógica de
   reservas e notificações continua no componente original
   PreWeddingSection (passado como prop bookNode).

   Gestão de fotos: cada slot de foto tem upload directo na página
   (admin). Slots: hero, intro, tript-0/1/2, cen-0/1/2.
   ============================================================ */

import { type ReactNode } from 'react'
import { CustomSections, type PwSection } from './CustomSections'
import './prewedding.css'

export type { PwSection }

export type PreWeddingViewProps = {
  // Hero
  title: string
  heroImageUrl?: string | null
  backHref: string
  isAdmin: boolean
  adminActions?: ReactNode
  onEditTitle?: () => void

  /** Upload directo na página: chamado por qualquer slot.
   *  slot é uma chave estável (ex: 'hero', 'intro', 'tript-0',
   *  'cen-1'). Persistência cabe ao parent. */
  onUploadPhoto?: (slot: string, file: File) => void | Promise<void>
  /** Remover foto de um slot. */
  onRemovePhoto?: (slot: string) => void | Promise<void>
  /** Indicador: qual slot está a fazer upload (ou null). */
  uploadingSlot?: string | null

  // Conteúdo editorial
  /** Foto full-width logo abaixo do hero (mesma largura/altura) */
  heroPhotoUrl?: string | null
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

  /** Secções personalizadas adicionadas pelo admin directamente
   *  na página (texto + foto opcional). Renderizadas depois dos
   *  cenários, antes do bloco de reserva. */
  customSections?: PwSection[]
  onChangeCustomSections?: (next: PwSection[]) => void | Promise<void>
}

/** Overlay de controlos (Adicionar/Trocar + Remover) sobre qualquer foto.
 *  Renderiza apenas quando admin + onUpload definidos. */
function SlotControls(props: {
  slot: string
  url?: string | null
  isAdmin: boolean
  uploading: boolean
  onUpload?: (slot: string, file: File) => void | Promise<void>
  onRemove?: (slot: string) => void | Promise<void>
}) {
  if (!props.isAdmin || !props.onUpload) return null
  return (
    <div className="imgctrl">
      <label className="gbtn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="M5 17l4.5-4 3 2.5L16 11l3 3" />
        </svg>
        {props.uploading ? 'A carregar…' : props.url ? 'Trocar' : 'Adicionar'}
        <input
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          disabled={props.uploading}
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) props.onUpload?.(props.slot, f)
            e.currentTarget.value = ''
          }}
        />
      </label>
      {props.url && props.onRemove && (
        <button type="button" className="gbtn danger" onClick={() => props.onRemove?.(props.slot)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
          Remover
        </button>
      )}
    </div>
  )
}

export function PreWeddingView(props: PreWeddingViewProps) {
  const upSlot = props.uploadingSlot ?? null
  const isUp = (s: string) => upSlot === s

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

      {/* Foto full-width logo abaixo do hero */}
      <section className="pw-hero-photo">
        {props.heroPhotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.heroPhotoUrl} alt="" />
        ) : (
          <div className="ph" />
        )}
        <SlotControls slot="hero" url={props.heroPhotoUrl}
          isAdmin={props.isAdmin} uploading={isUp('hero')}
          onUpload={props.onUploadPhoto} onRemove={props.onRemovePhoto} />
      </section>

      {/* Intro fixa removida — usar CustomSections para adicionar texto. */}

      {/* Foto única full-width abaixo da intro (substitui o antigo tríptico) */}
      {(() => {
        const u = props.triptychUrls?.[0] ?? null
        if (!props.isAdmin && !u) return null
        return (
          <div className="pw-tript">
            <div className="frame">
              {u ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u} alt="" />
              ) : (
                <div className="ph" data-label="Foto" />
              )}
              <SlotControls slot="tript-0" url={u}
                isAdmin={props.isAdmin} uploading={isUp('tript-0')}
                onUpload={props.onUploadPhoto} onRemove={props.onRemovePhoto} />
            </div>
          </div>
        )
      })()}

      {/* Cenários fixos (Cidade/Campo/Praia) removidos — admin cria
       *  agora secções livres via CustomSections. */}

      {/* Secções personalizadas (texto + foto, editáveis na página) */}
      {((props.customSections && props.customSections.length > 0) || props.isAdmin) && props.onChangeCustomSections && (
        <CustomSections
          sections={props.customSections ?? []}
          isAdmin={props.isAdmin}
          uploadingSlot={props.uploadingSlot ?? null}
          onChange={props.onChangeCustomSections}
          onUploadPhoto={props.onUploadPhoto ?? (() => {})}
          onRemovePhoto={props.onRemovePhoto ?? (() => {})}
        />
      )}

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
