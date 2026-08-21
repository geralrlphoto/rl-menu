'use client'

/* ============================================================
   FotografiasView — render Atmosphère da página FOTOGRAFIAS.
   Renderiza o conteúdo INTERNO da .subarticle .body (callout,
   secção "Seleção de Fotografias", 4 cards 2×2, separador,
   secção "Processo de Criação do Álbum", e maquete + aprovação).

   A lógica continua nos componentes existentes:
     - guiaLinks.fotosSelecaoUrl (callout)
     - portalSettingsObj.{galerias_url, selecao_url, prewedding_url,
                          fotos_finais_url, fotos_finais_enviada}
     - MaqueteAlbumSection via /api/albuns-by-ref + PATCH
   ============================================================ */

import { useEffect, useState, type ReactNode } from 'react'
import { SectionTitle } from './SectionTitle'
import './fotografias.css'

export type FotografiasCard = {
  /** Stable key — 'galerias' | 'selecao' | 'prewedding' | 'editadas' */
  key: string
  /** Eyebrow text (small caps) — ex.: 'GALERIA ON-LINE' */
  title: string
  /** Cormorant heading (medium type) — ex.: 'Galeria On-line' */
  heading: string
  /** Small caption under heading */
  caption?: string
  /** Initial — short letter for the round mark */
  mark: string
  /** URL — empty/null = locked */
  url?: string | null
  /** Footnote (small italic, ex.: '30 dias para download') */
  footnote?: string | null
  /** Título editorial que aparece por cima do card. Sem isto, deriva-se
   *  de title/heading/caption para o portal não ficar sem texto. */
  lead?: { kicker: string; title: ReactNode; subtitle?: ReactNode }
}

export type FotografiasViewProps = {
  /** Tally URL para Enviar Selecção */
  enviarFotosUrl: string
  /** Bloqueado vs disponível para legenda da secção */
  selecaoAvailable?: boolean
  /** Os 4 cartões 2×2 */
  cards: FotografiasCard[]
  /** URL da imagem separadora (fallback: placeholder) */
  separatorImageUrl?: string | null
  /** Referência do portal, passa-se ao MaquetePanel para API calls */
  portalRef?: string | null
  /** URL do PDF / link da maqueta para o botão "Ver Maqueta" */
  maqueteUrl?: string | null
  /** Node opcional para se quiser injectar um substituto da maquete */
  maquetePanelOverride?: ReactNode
}

/* ───────────────────────────────────────────────────────────────
   Maquete + Aprovação — usa os mesmos endpoints da MaqueteAlbumSection
   mas com layout Atmosphère.
   ─────────────────────────────────────────────────────────────── */
type AlbumState = {
  id?: string
  status?: string
  num_fotografias?: number | null
  data_entrega_fotos?: string | null
  data_aprovacao?: string | null
  data_prevista_entrega?: string | null
  imagem_maquete_url?: string | null
} | null

const STATUS_LABEL: Record<string, string> = {
  AGUARDA:    'Aguardar',
  EM_ANALISE: 'Em análise',
  APROVADO:   'Aprovado',
  ENTREGUE:   'Entregue',
}

function fmtPt(iso?: string | null): string {
  if (!iso) return '—'
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso
  const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${m[3]} ${MESES[Number(m[2]) - 1]} ${m[1]}`
}

function MaquetePanel({ portalRef, maqueteUrl }: { portalRef: string; maqueteUrl?: string | null }) {
  const [album, setAlbum]   = useState<AlbumState>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!portalRef) return
    fetch(`/api/albuns-by-ref?ref=${encodeURIComponent(portalRef)}`)
      .then(r => r.json())
      .then(d => setAlbum(d))
      .catch(() => {})
  }, [portalRef])

  async function handleAprovar() {
    if (!album?.id) return
    setSaving(true)
    setFeedback('')
    try {
      const res = await fetch('/api/albuns-casamento', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: album.id, status: 'APROVADO' }),
      }).then(r => r.json())
      if (res?.row) {
        setAlbum(a => ({
          ...(a ?? {}),
          status: 'APROVADO',
          data_aprovacao: res.row.data_aprovacao,
          data_prevista_entrega: res.row.data_prevista_entrega,
        }))
        setFeedback('✓ Álbum aprovado com sucesso!')
        setTimeout(() => setFeedback(''), 5000)
      }
    } finally {
      setSaving(false)
    }
  }

  const status     = album?.status ?? 'AGUARDA'
  const isApproved = status === 'APROVADO' || status === 'ENTREGUE'

  // Os 3 passos da timeline — estado derivado do album
  const steps: Array<{ num: string; title: string; meta: string; done: boolean }> = [
    {
      num: '01',
      title: 'Entrada das fotografias',
      meta: album?.data_entrega_fotos ? fmtPt(album.data_entrega_fotos) : 'Aguarda registo',
      done: Boolean(album?.data_entrega_fotos),
    },
    {
      num: '02',
      title: 'Aprovação da maqueta',
      meta: album?.data_aprovacao ? fmtPt(album.data_aprovacao) : 'A aguardar a vossa aprovação',
      done: Boolean(album?.data_aprovacao),
    },
    {
      num: '03',
      title: 'Entrega do álbum',
      meta: album?.data_prevista_entrega ? fmtPt(album.data_prevista_entrega) : 'Calculada após aprovação',
      done: status === 'ENTREGUE',
    },
  ]

  return (
    <section className="fp-maquete">
      <div className="fp-maquete-head">
        <div className="eyebrow">Maquete Álbum</div>
        <h2>Aprovação da <em>maqueta</em></h2>
      </div>
      <div className="fp-maquete-body">
        {/* Imagem da maquete (se vier de Notion ou de campo dedicado) */}
        {album?.imagem_maquete_url && (
          <div className="fp-maquete-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={album.imagem_maquete_url} alt="Maquete do álbum" />
          </div>
        )}

        {/* Stats — só quando há registo do álbum */}
        {album?.id && (
          <div className="fp-stats">
            <div className="fp-stat">
              <div className="lbl">Fotos para Álbum</div>
              <div className="val">{album.num_fotografias ?? '—'}</div>
            </div>
            <div className="fp-stat">
              <div className="lbl">Estado</div>
              <div className="val" style={{ fontSize: 16, color: isApproved ? 'var(--ok)' : 'var(--wait)' }}>
                {STATUS_LABEL[status] ?? status}
              </div>
            </div>
          </div>
        )}

        {/* Botão "Ver Maqueta" — abre o link/PDF da maqueta para o cliente rever */}
        <div className="fp-view-maquete">
          {maqueteUrl ? (
            <a
              className="fp-approve-btn primary"
              href={maqueteUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ver Maqueta
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
              </svg>
            </a>
          ) : (
            <span className="fp-approve-btn ghost" style={{ cursor: 'default', opacity: .55 }}>
              Maqueta a aguardar
            </span>
          )}
        </div>

        {/* Timeline 3 passos */}
        <div className="fp-timeline">
          {steps.map(s => (
            <div key={s.num} className={`fp-step${s.done ? ' done' : ''}`}>
              <span className="fp-step-pip" />
              <div className="fp-step-num">{s.num}</div>
              <div className="fp-step-title">{s.title}</div>
              <div className="fp-step-meta">{s.meta}</div>
            </div>
          ))}
        </div>

        {/* Botões */}
        {album?.id && !isApproved && (
          <div className="fp-approve">
            <button
              type="button"
              className="fp-approve-btn primary"
              onClick={handleAprovar}
              disabled={saving}
            >
              {saving ? 'A guardar…' : '✓ Aprovar Maqueta'}
            </button>
            <a
              className="fp-approve-btn ghost"
              href={`/portal-cliente/album-alteracao?ref=${encodeURIComponent(portalRef)}`}
            >
              Pedir Alterações
            </a>
          </div>
        )}

        {!album?.id && (
          <p style={{ textAlign: 'center', color: 'var(--ink-3)', fontStyle: 'italic', margin: '6px 0 0' }}>
            A preparar o vosso álbum…
          </p>
        )}

        {isApproved && (
          <div className="fp-approved-state">
            <span className="check">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l4 4 10-10" />
              </svg>
            </span>
            <div>
              <div className="label">Maqueta Aprovada</div>
              {album?.data_aprovacao && (
                <div className="sub">Aprovado a {fmtPt(album.data_aprovacao)}</div>
              )}
            </div>
          </div>
        )}

        {feedback && <div className="fp-feedback">{feedback}</div>}
      </div>
    </section>
  )
}

/* ───────────────────────────────────────────────────────────────
   Partilhar galeria — abre um painel com o link à mão, que fica aberto
   nas visitas seguintes. Assim os noivos entram, copiam e passam o
   link aos convidados sem terem de o ir procurar.
   ─────────────────────────────────────────────────────────────── */
function ShareGalleryButton({ url, storageKey }: { url: string; storageKey: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try { if (localStorage.getItem(storageKey) === '1') setOpen(true) } catch {}
  }, [storageKey])

  function toggle() {
    const next = !open
    setOpen(next)
    try { localStorage.setItem(storageKey, next ? '1' : '0') } catch {}
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {}
  }

  return (
    <>
      <button type="button" className="fp-btn ghost" onClick={toggle} aria-expanded={open}>
        {open ? 'Esconder link' : 'Partilhar Galeria'}
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
      </button>

      {open && (
        <div className="fp-share">
          <div className="lbl">Link para os convidados</div>
          <div className="row">
            <input
              type="text"
              readOnly
              value={url}
              onFocus={e => e.currentTarget.select()}
              aria-label="Link da galeria"
            />
            <button type="button" className="copy" onClick={copy}>
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/* ───────────────────────────────────────────────────────────────
   FotografiasView (default export)
   ─────────────────────────────────────────────────────────────── */
export function FotografiasView(props: FotografiasViewProps) {
  const selecaoOk = props.selecaoAvailable ?? props.cards.some(c => c.key === 'selecao' && !!c.url)

  // ── Capas das galerias ────────────────────────────────────────
  // O Wfolio publica a capa escolhida em og:image. /api/link-preview lê-a
  // do lado do servidor (o browser não pode, por CORS) e faz cache.
  const [covers, setCovers] = useState<Record<string, string>>({})
  const cardsKey = props.cards.map(c => `${c.key}:${c.url ?? ''}`).join('|')

  useEffect(() => {
    const targets = props.cards.filter(c => c.url)
    if (targets.length === 0) { setCovers({}); return }
    let alive = true
    Promise.all(targets.map(async c => {
      try {
        const r = await fetch(`/api/link-preview?url=${encodeURIComponent(c.url!)}`)
        const d = await r.json()
        return d?.image ? ([c.key, d.image as string] as const) : null
      } catch { return null }
    })).then(rows => {
      if (!alive) return
      const next: Record<string, string> = {}
      for (const row of rows) if (row) next[row[0]] = row[1]
      setCovers(next)
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsKey])

  return (
    <div className="fotos-page">
      {/* ── Título da galeria ────────────────────────────────── */}
      <SectionTitle kicker="Alguns momentos" title={<>As vossas <em>fotografias.</em></>} />

      {/* ── Título editorial + card, dois por linha ───────────── */}
      <div className="fp-grid">
        {props.cards.map(c => {
          const available = Boolean(c.url && c.url.length > 0)
          const lead = c.lead ?? { kicker: c.title, title: c.heading, subtitle: c.caption }
          const cover = covers[c.key]
          return (
            <div key={c.key} className="fp-grid-item">
              <SectionTitle size="sm" kicker={lead.kicker} title={lead.title} subtitle={lead.subtitle} />
              <article className={`fp-card${cover ? ' has-cover' : ''}`}>
                <div className="fp-card-head">
                  <span className="fp-card-title">{c.title}</span>
                  <span className={`fp-chip ${available ? 'available' : 'locked'}`}>
                    {available ? 'Disponível' : 'Aguardar'}
                  </span>
                </div>
                {cover && (
                  <div className="fp-card-cover">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="fp-card-logo">
                  <div className="meta">
                    {!cover && <span className="mark">{c.mark}</span>}
                    <div className="meta-title">{c.heading}</div>
                    {c.caption && <div className="meta-sub">{c.caption}</div>}
                  </div>
                </div>
                <div className="fp-card-foot">
                  {available ? (
                    <a className="fp-btn available" href={c.url!} target="_blank" rel="noopener noreferrer">
                      Ver Mais
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" /><path d="M13 6l6 6-6 6" />
                      </svg>
                    </a>
                  ) : (
                    <span className="fp-btn locked">Aguardar</span>
                  )}
                  {/* A galeria on-line é para partilhar: botão de partilha
                      assim que houver link. */}
                  {c.key === 'galerias' && available && (
                    <ShareGalleryButton url={c.url!} storageKey={`rl_share_${props.portalRef ?? 'portal'}_${c.key}`} />
                  )}
                  {/* O card da selecção leva também o formulário: é por ali
                      que a escolha nos chega. */}
                  {c.key === 'selecao' && (
                    <a className="fp-btn ghost" href={props.enviarFotosUrl} target="_blank" rel="noopener noreferrer">
                      Enviar Selecção
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17 17 7" /><path d="M9 7h8v8" />
                      </svg>
                    </a>
                  )}
                  {c.footnote && <span className="fp-foot-note">{c.footnote}</span>}
                </div>
              </article>
            </div>
          )
        })}
      </div>

      {/* ── Texto editorial · Seleção de Fotografias ─────────── */}
      <section className="fp-section">
        <div className="eyebrow">Seleção</div>
        <h2>Seleção de <em>Fotografias</em></h2>
        <hr className="lede-rule" />
        <p>
          A partir do dia em que disponibilizarmos a galeria para seleção, têm acesso à pré seleção
          das fotos do vosso casamento. <strong>Escolhem as imagens preferidas</strong> e enviam nos
          a lista pelo formulário acima. É a partir dessa selecção que preparamos o vosso álbum.
        </p>
        <p>
          A galeria online fica disponível durante <strong>vários meses</strong> para partilharem com
          familiares e amigos. Após a galeria de seleção fechar, o atelier inicia a montagem da
          maqueta, que depois aprovam aqui dentro do portal.
        </p>
        <div className={`fp-caption${selecaoOk ? '' : ' locked'}`}>
          <strong>{selecaoOk ? 'Galeria de seleção disponível.' : 'Galeria de seleção a aguardar abertura.'}</strong>{' '}
          {selecaoOk
            ? 'Podem entrar agora e enviar a vossa lista.'
            : 'Quando a galeria estiver pronta, o cartão fica activo e podem entrar a partir daqui.'}
        </div>
      </section>

      {/* ── Separador de imagem ─────────────────────────────── */}
      <div className="fp-sep">
        {props.separatorImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.separatorImageUrl} alt="" />
        ) : (
          <div className="ph" style={{ width: '100%', height: '100%' }} data-label="Imagem · Casamento" />
        )}
        <div className="fp-sep-scrim" />
      </div>

      {/* ── Texto editorial · Processo de Criação do Álbum ──── */}
      <section className="fp-section">
        <div className="eyebrow">Atelier</div>
        <h2>Processo de Criação do <em>Álbum</em></h2>
        <hr className="lede-rule" />
        <p>
          A partir da vossa selecção, o atelier monta uma <strong>maqueta dedicada</strong> ao vosso
          casamento. Escolha de duplas, ordenação narrativa, equilíbrio de tons e composição
          editorial. É um processo demorado, feito com tempo e cuidado.
        </p>
        <p>
          Recebem aqui no portal o aviso para reverem a maqueta. Podem <strong>aprovar</strong> ou
          <strong> pedir alterações</strong>. Depois de aprovada, entra na produção física e a entrega
          fica calendarizada automaticamente.
        </p>
      </section>

      {/* ── Maquete + Aprovação ─────────────────────────────── */}
      {props.maquetePanelOverride
        ? props.maquetePanelOverride
        : props.portalRef && (
          <MaquetePanel
            portalRef={props.portalRef}
            maqueteUrl={props.maqueteUrl ?? null}
          />
        )}
    </div>
  )
}

export default FotografiasView
