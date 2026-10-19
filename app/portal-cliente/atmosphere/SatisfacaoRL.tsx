'use client'

/* Área SAT no novo design (tema RL): topo com foto esbatida, a avaliação (estrelas
   e comentário) numa caixa de moldura branca (regra dos portais). Toda a lógica (gravar, avisar o admin) vem da página. */

import { type ReactNode } from 'react'

const G = '#d8be93'
const LABELS = ['', 'Fraco', 'Razoável', 'Bom', 'Muito bom', 'Excelente']

export function SatisfacaoRL({ title, heroUrl, backHref, intro, nota, hover, setNota, setHover, comentario, setComentario, onSubmeter, enviando, erro, resposta }: {
  title: string
  heroUrl?: string | null
  backHref: string
  intro?: ReactNode
  nota: number
  hover: number
  setNota: (n: number) => void
  setHover: (n: number) => void
  comentario: string
  setComentario: (v: string) => void
  onSubmeter: () => void
  enviando: boolean
  erro?: string | null
  resposta?: { nota: number; comentario: string } | null
}) {
  const ativa = hover || nota
  const caixaBranca: React.CSSProperties = {
    borderRadius: 22, border: '1px solid rgba(255,255,255,.55)', background: 'rgba(17,17,17,.9)',
    boxShadow: '0 0 22px rgba(255,255,255,.1)', padding: 'clamp(22px, 4vw, 34px)',
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
      {/* ── topo ── */}
      <section style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, border: '1px solid rgba(216,190,147,.2)', background: '#0b0b0b', padding: 'clamp(28px, 5vw, 48px)' }}>
        {heroUrl && <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: `url('${heroUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center 35%', filter: 'grayscale(1)', opacity: .28 }} />}
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(11,11,11,.97) 0%, rgba(11,11,11,.78) 58%, rgba(11,11,11,.5) 100%)' }} />
        <div aria-hidden style={{
          position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(216,190,147,0.18) 1px, transparent 1px)', backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at 80% 40%, #000 0%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at 80% 40%, #000 0%, transparent 70%)',
        }} />
        <div style={{ position: 'relative' }}>
          <a href={backHref} style={{ fontSize: 14, color: 'rgba(255,255,255,.5)' }}>‹ Voltar</a>
          <div className="eyebrow" style={{ marginTop: 22 }}>{title || 'Área SAT'}</div>
          <h1 style={{ margin: '12px 0 0', fontSize: 'clamp(36px, 5vw, 58px)', color: '#fff' }}>
            A vossa <em style={{ fontStyle: 'normal', color: G }}>opinião</em>
          </h1>
          <p style={{ margin: '14px 0 0', color: 'rgba(255,255,255,.55)', maxWidth: '52ch', lineHeight: 1.7 }}>
            Depois da última entrega, contamos com a vossa opinião. Cada palavra vossa ajuda-nos a fazer melhor e a contar mais histórias como a vossa.
          </p>
        </div>
      </section>

      {intro}

      {/* ── avaliação (moldura branca) ── */}
      <section style={caixaBranca}>
        {resposta ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
            <span style={{ width: 48, height: 48, borderRadius: '50%', border: '1px solid rgba(74,222,128,.5)', color: '#86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>✓</span>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#fff' }}>Obrigado pela vossa avaliação</div>
            <div style={{ fontSize: 30, letterSpacing: 4 }}>
              {[1, 2, 3, 4, 5].map(i => <span key={i} style={{ color: i <= resposta.nota ? G : 'rgba(255,255,255,.12)' }}>★</span>)}
            </div>
            <div className="eyebrow">{LABELS[resposta.nota]}</div>
            {resposta.comentario && (
              <p style={{ maxWidth: '46ch', margin: '6px 0 0', fontStyle: 'italic', color: 'rgba(255,255,255,.6)', lineHeight: 1.6 }}>&ldquo;{resposta.comentario}&rdquo;</p>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
            <div className="eyebrow" style={{ color: '#fff' }}>Dar satisfação</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <button key={i} type="button" onClick={() => setNota(i)} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
                  aria-label={`${i} estrela${i > 1 ? 's' : ''}`}
                  style={{ fontSize: 42, lineHeight: 1, background: 'none', border: 0, cursor: 'pointer', color: i <= ativa ? G : 'rgba(255,255,255,.14)', transition: 'color .15s, transform .15s', transform: i <= ativa ? 'scale(1.06)' : 'none' }}>★</button>
              ))}
            </div>
            <div className="eyebrow" style={{ minHeight: 14, opacity: ativa ? 1 : 0 }}>{LABELS[ativa] ?? ''}</div>
            <textarea value={comentario} onChange={e => setComentario(e.target.value)} rows={4}
              placeholder="Partilhem connosco como foi a vossa experiência (opcional)"
              style={{ width: '100%', maxWidth: 520, borderRadius: 16, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.03)', color: '#fff', padding: '12px 16px', fontSize: 14.5, lineHeight: 1.6, resize: 'none', outline: 'none' }} />
            {erro && <p style={{ margin: 0, color: '#f87171', fontSize: 13 }}>{erro}</p>}
            <button type="button" onClick={onSubmeter} disabled={enviando || nota === 0}
              style={{ borderRadius: 999, border: '1px solid rgba(255,255,255,.6)', background: 'rgba(255,255,255,.06)', color: '#fff', padding: '13px 34px', fontSize: 12, letterSpacing: '.3em', textTransform: 'uppercase', cursor: 'pointer', opacity: enviando || nota === 0 ? .4 : 1, boxShadow: '0 0 18px rgba(255,255,255,.12)' }}>
              {enviando ? 'A enviar…' : 'Dar satisfação'}
            </button>
          </div>
        )}
      </section>

    </div>
  )
}
