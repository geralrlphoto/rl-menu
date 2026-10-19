'use client'

/* Página "O Nosso Filme" no novo design (tema RL): topo com o estado do filme e a
   data prevista, o Wedding Film em destaque, os outros vídeos em cartões (VER MAIS
   quando têm link, AGUARDAR quando não têm) e os passos depois da entrega.
   Só apresentação: os dados vêm da página. */

import { type ReactNode } from 'react'
import { prazoVideoDias } from '@/lib/crm'

export type VideoRL = { titulo: string; url?: string | null; capa?: string | null; principal?: boolean }

const G = '#d8be93'

function somaUteis(iso: string, n: number): string {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00Z')
  let k = 0
  while (k < n) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) k++ }
  return d.toISOString().slice(0, 10)
}
const dataPt = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })

export function FilmeRL({ title, heroUrl, backHref, videos, dataCasamento, proposta, estadoVideo, intro, acoes }: {
  title: string
  heroUrl?: string | null
  backHref: string
  videos: VideoRL[]
  dataCasamento?: string | null
  proposta?: string | null
  estadoVideo?: string | null
  intro?: ReactNode
  acoes?: ReactNode
}) {
  const casamento = /^\d{4}-\d{2}-\d{2}/.test(dataCasamento ?? '') ? dataCasamento!.slice(0, 10) : null
  const dias = prazoVideoDias(proposta)
  const previsto = casamento ? somaUteis(casamento, dias) : null
  const principal = videos.find(v => v.principal) ?? null
  const outros = videos.filter(v => v !== principal)
  const prontos = videos.filter(v => v.url).length
  const filmeEntregue = Boolean(principal?.url)
  const estadoFilme = filmeEntregue ? 'Entregue' : /edi/i.test(estadoVideo ?? '') ? 'Em edição' : 'A aguardar'

  const card: React.CSSProperties = { borderRadius: 22, border: '1px solid rgba(255,255,255,.08)', background: '#141414', overflow: 'hidden' }
  const capa = (src?: string | null, h = 180): ReactNode => src
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={src} alt="" className="rl-filme-capa" style={{ width: '100%', height: h, objectFit: 'cover' }} />
    : <div style={{ height: h, background: 'radial-gradient(circle at 50% 40%, rgba(216,190,147,.12), #111 70%)' }} />

  return (
    <div className="rl-filme" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
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
          <div className="rl-filme-topo" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 40, alignItems: 'center', marginTop: 22 }}>
            <div>
              <div className="eyebrow">{title || 'O Nosso Filme'}</div>
              <h1 style={{ margin: '12px 0 0', fontSize: 'clamp(36px, 5vw, 58px)', color: '#fff' }}>
                O vosso dia, contado como um <em style={{ fontStyle: 'normal', color: G }}>filme</em>
              </h1>
              <p style={{ margin: '14px 0 0', color: 'rgba(255,255,255,.55)', maxWidth: '46ch', lineHeight: 1.7 }}>
                Cada vídeo aparece aqui assim que fica pronto, e recebem também um aviso por email e no sino do portal.
              </p>
            </div>
            <aside style={{ borderRadius: 22, border: '1px solid rgba(216,190,147,.3)', background: 'rgba(17,17,17,.8)', backdropFilter: 'blur(16px)', padding: 20, boxShadow: '0 0 48px -22px rgba(216,190,147,.5)' }}>
              <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: G, boxShadow: `0 0 8px ${G}` }} />Wedding Film
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
                {[
                  ['Estado', estadoFilme, filmeEntregue],
                  ['Vídeos prontos', `${prontos} de ${videos.length}`, true],
                  ['Pacote', proposta ? proposta.charAt(0) + proposta.slice(1).toLowerCase() : '—', false],
                  ['Prazo', `${dias} dias úteis`, false],
                ].map(([l, v, dourado], k) => (
                  <div key={String(l)} style={{ padding: '12px 0', paddingRight: k % 2 === 0 ? 14 : 0, paddingLeft: k % 2 ? 14 : 0, borderRight: k % 2 === 0 ? '1px solid rgba(255,255,255,.07)' : 0, borderBottom: k < 2 ? '1px solid rgba(255,255,255,.07)' : 0 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{l}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.15, marginTop: 6, color: dourado ? G : '#fff' }}>{v}</div>
                  </div>
                ))}
              </div>
              {!filmeEntregue && previsto && (
                <div style={{ marginTop: 12, fontSize: 12.5, fontWeight: 600, color: G }}>Previsto até {dataPt(previsto)}</div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {intro}

      {/* ── Wedding Film em destaque ── */}
      {principal && (
        <section style={{ ...card, borderLeft: `2px solid ${principal.url ? G : 'rgba(216,190,147,.45)'}` }} className="rl-filme-card">
          <div style={{ position: 'relative' }}>
            {capa(principal.capa, 340)}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,11,11,.9), rgba(11,11,11,.1) 60%)' }} />
            <div style={{ position: 'absolute', left: 24, right: 24, bottom: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div className="eyebrow">Filme completo</div>
                <div style={{ marginTop: 6, fontSize: 'clamp(26px, 3.4vw, 36px)', color: '#fff' }}>{principal.titulo}</div>
                {!principal.url && previsto && <div style={{ marginTop: 4, fontSize: 13, color: G, fontWeight: 600 }}>Previsto até {dataPt(previsto)}</div>}
              </div>
              {principal.url
                ? <a href={principal.url} target="_blank" rel="noopener noreferrer" className="atm-btn solid">▶ Ver o filme</a>
                : <span className="atm-btn" style={{ opacity: .55, cursor: 'default' }}>Aguardar</span>}
            </div>
          </div>
        </section>
      )}

      {/* ── os outros vídeos ── */}
      {outros.length > 0 && (
        <section>
          <div className="eyebrow">Os outros vídeos</div>
          <h2 style={{ margin: '6px 0 16px', fontSize: 'clamp(26px, 3vw, 34px)', color: '#fff' }}>Teaser, pré-wedding e mais</h2>
          <div className="rl-filme-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, outros.length)}, minmax(0,1fr))`, gap: 14 }}>
            {outros.map(v => (
              <div key={v.titulo} style={{ ...card, borderLeft: `2px solid ${v.url ? 'rgba(216,190,147,.7)' : 'rgba(216,190,147,.3)'}` }} className="rl-filme-card">
                {capa(v.capa, 150)}
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{v.titulo}</span>
                    <span style={{
                      borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                      ...(v.url ? { color: '#86efac', background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.3)' } : { color: 'rgba(255,255,255,.5)', border: '1px solid rgba(255,255,255,.12)' }),
                    }}>{v.url ? 'Disponível' : 'A aguardar'}</span>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    {v.url
                      ? <a href={v.url} target="_blank" rel="noopener noreferrer" className="atm-btn solid" style={{ width: '100%' }}>Ver mais →</a>
                      : <span className="atm-btn" style={{ width: '100%', opacity: .5, cursor: 'default' }}>Aguardar</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── depois da entrega ── */}
      {acoes && (
        <section>
          <div className="eyebrow">Depois da entrega</div>
          <h2 style={{ margin: '6px 0 16px', fontSize: 'clamp(26px, 3vw, 34px)', color: '#fff' }}>Descarregar, partilhar e deixar testemunho</h2>
          {acoes}
          <p style={{ marginTop: 14, fontSize: 13.5, color: 'rgba(255,255,255,.5)', lineHeight: 1.6 }}>
            Alterações ao filme: até 5 dias úteis depois da entrega, no máximo 3 alterações pontuais, pedidas no Atendimento.
          </p>
        </section>
      )}

      <style>{`
        .rl-filme .rl-filme-card .rl-filme-capa { filter: grayscale(.6); opacity: .8; transition: filter .7s, opacity .7s, transform .7s; }
        .rl-filme .rl-filme-card:hover .rl-filme-capa { filter: none; opacity: 1; transform: scale(1.03); }
        .rl-filme .rl-filme-card { transition: transform .3s, box-shadow .3s; }
        .rl-filme .rl-filme-card:hover { transform: translateY(-3px); box-shadow: 0 0 40px -18px rgba(216,190,147,.6); }
        @media (max-width: 860px) {
          .rl-filme-topo { grid-template-columns: minmax(0,1fr) !important; }
          .rl-filme-grid { grid-template-columns: minmax(0,1fr) !important; }
        }
      `}</style>
    </div>
  )
}
