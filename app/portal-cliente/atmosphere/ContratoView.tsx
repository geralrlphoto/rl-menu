'use client'

/* ============================================================
   ContratoView — render Atmosphère da página Contrato · CPS.
   Só apresentação. Toda a lógica/data vem por props.
   ============================================================ */

import { type ReactNode } from 'react'
import './contrato.css'

const fmtEur = (n: number | null | undefined): string => {
  if (n === null || n === undefined || isNaN(Number(n))) return '—'
  return Number(n).toLocaleString('pt-PT', { maximumFractionDigits: 0 })
}

export type ContratoViewProps = {
  // Hero
  title: string
  heroImageUrl?: string | null
  backHref: string

  // Status + acções
  contratoDisponivel: boolean
  contratoUrl?: string | null
  onPrint: () => void

  // Texto editorial
  investParagraphs?: string[]    // parágrafos da secção "Mais do que um serviço…"

  // Serviços
  servicosFoto: string[]
  servicosVideo: string[]

  // Totais e planos
  totalEur: number
  pagamentos: Array<{
    label: string         // ex: 'Assinatura', 'Entrada', 'Final'
    roman?: string        // ex: 'I', 'II', 'III'
    valor: number
    paid: boolean
    when?: string         // ex: 'há 1 mês', 'previsto em mar 2026'
  }>

  // Admin actions (top right)
  isAdmin: boolean
  adminActions?: ReactNode

  // Edit pencil junto ao título do hero (se admin)
  onEditTitle?: () => void
}

export function ContratoView(props: ContratoViewProps) {
  const fotoItems = props.servicosFoto.filter(Boolean)
  const videoItems = props.servicosVideo.filter(Boolean)

  return (
    <>
      {/* Admin actions bar */}
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
            <h1>{props.title || 'Contrato · CPS'}</h1>
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

      {/* Sub-barra: chip + Imprimir */}
      <div className="subbar">
        <div className="left">
          <span className={`statuschip ${props.contratoDisponivel ? 'ok' : 'wait'}`}>
            <span className="pip" />
            {props.contratoDisponivel ? 'Contrato Disponível' : 'Em Preparação'}
          </span>
        </div>
        <div className="right">
          <button type="button" className="printbtn" onClick={props.onPrint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9V4h12v5M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" rx="1" />
            </svg>
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Bloco download */}
      {props.contratoDisponivel && props.contratoUrl ? (
        <a className="downloadblock" href={props.contratoUrl} target="_blank" rel="noopener noreferrer">
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3h9l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
              <path d="M15 3v5h5" />
              <path d="M9 13h6M9 17h6" />
            </svg>
          </span>
          <div className="meta">
            <div className="lab">Documento</div>
            <div className="t">Contrato Prestação de Serviços</div>
          </div>
          <span className="arr">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v12M6 12l6 6 6-6" />
            </svg>
          </span>
        </a>
      ) : (
        <div className="downloadblock" style={{ cursor: 'default', opacity: .65 }}>
          <span className="ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3h9l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
              <path d="M15 3v5h5" />
            </svg>
          </span>
          <div className="meta">
            <div className="lab">Documento</div>
            <div className="t">Contrato Prestação de Serviços</div>
          </div>
        </div>
      )}

      {/* Nota verde-sálvia */}
      <div className="note">
        <span className="ic">✓</span>
        <div>
          {props.contratoDisponivel ? (
            <>
              O contrato está <strong>disponível para descarregar</strong>. Façam o download,
              revejam e — caso queiram pedir alguma alteração — contactem-nos directamente.
            </>
          ) : (
            <>
              O contrato fica <strong>disponível em 7 dias úteis</strong> após a vossa adesão.
              Quando estiver pronto vão receber notificação por e-mail e o documento aparecerá
              aqui para download.
            </>
          )}
        </div>
      </div>

      {/* Secção investimento */}
      {props.investParagraphs && props.investParagraphs.length > 0 && (
        <section className="invest">
          <div className="eyebrow">O Vosso Investimento</div>
          <h2>{props.investParagraphs[0]}</h2>
          {props.investParagraphs.slice(1).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
      )}

      {/* A Vossa Proposta */}
      <div className="proposeh">
        <div className="eyebrow">A Vossa Proposta</div>
        <h2>Serviços contratados</h2>
      </div>

      <div className="propcards">
        <div className="servicecard">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
              <circle cx="12" cy="13" r="3.2" />
            </svg>
            Serviços de Fotografia
          </h3>
          {fotoItems.length > 0 ? (
            <ul className="checklist">
              {fotoItems.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          ) : (
            <p className="empty">Sem itens contratados para fotografia.</p>
          )}
        </div>
        <div className="servicecard">
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="14" height="12" rx="2" />
              <path d="M17 10l4-2v8l-4-2z" />
            </svg>
            Serviços de Vídeo
          </h3>
          {videoItems.length > 0 ? (
            <ul className="checklist">
              {videoItems.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          ) : (
            <p className="empty">Sem itens contratados para vídeo.</p>
          )}
        </div>
      </div>

      {/* Total bar dourada */}
      <div className="totalbar">
        <span className="lab">Total do Serviço</span>
        <span className="val"><em>€</em>{fmtEur(props.totalEur)}</span>
      </div>

      {/* 3 cards plano de pagamento */}
      <div className="proposeh">
        <div className="eyebrow">Plano de Pagamento</div>
        <h2>Faseamento</h2>
      </div>
      <div className="planscards">
        {props.pagamentos.map((p, i) => (
          <div key={i} className={`plancard ${p.paid ? 'paid' : 'pending'}`}>
            <div className="roman">{p.roman ?? toRoman(i + 1)}</div>
            <h4>{p.label}</h4>
            <div className="v"><em>€</em>{fmtEur(p.valor)}</div>
            <div className="foot">
              <span className="stt">
                <span className="pip" />
                {p.paid ? 'Pago' : 'Aguarda'}
              </span>
              {p.when && <span className="when">{p.when}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function toRoman(n: number): string {
  const map = ['I', 'II', 'III', 'IV', 'V', 'VI']
  return map[n - 1] ?? String(n)
}
