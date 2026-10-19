'use client'

/* Página "O Nosso Filme" no novo design (tema RL): topo com o estado do filme e a
   data prevista, o Wedding Film em destaque, os outros vídeos em cartões (VER MAIS
   quando têm link, AGUARDAR quando não têm) e os passos depois da entrega.
   Só apresentação: os dados vêm da página. */

import { useEffect, useState, type ReactNode } from 'react'
import { prazoVideoDias } from '@/lib/crm'
import { embedDe } from '@/lib/videoEmbed'

export type VideoRL = { titulo: string; url?: string | null; capa?: string | null; principal?: boolean; enviadoEm?: string | null }

const G = '#d8be93'

function somaUteis(iso: string, n: number): string {
  const d = new Date(iso.slice(0, 10) + 'T12:00:00Z')
  let k = 0
  while (k < n) { d.setUTCDate(d.getUTCDate() + 1); const w = d.getUTCDay(); if (w !== 0 && w !== 6) k++ }
  return d.toISOString().slice(0, 10)
}
const dataPt = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })

/* Download: cada vídeo fica disponível 30 dias a contar do dia em que o entregámos */
const DIAS_DOWNLOAD = 30
function NotaDownload({ enviadoEm }: { enviadoEm?: string | null }) {
  const m = String(enviadoEm ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return <div style={{ marginTop: 6, fontSize: 12.5, color: 'rgba(255,255,255,.5)' }}>Disponível para download durante {DIAS_DOWNLOAD} dias depois da entrega</div>
  const limite = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + DIAS_DOWNLOAD, 12))
  const hoje = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date()) + 'T12:00:00Z')
  const faltam = Math.round((limite.getTime() - hoje.getTime()) / 86400000)
  const data = limite.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })
  const cor = faltam < 0 ? '#f87171' : faltam <= 7 ? '#fbbf24' : '#86efac'
  return (
    <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 600, color: cor }}>
      {faltam < 0
        ? 'O período de download terminou. Falem connosco no Atendimento.'
        : `Download até ${data} · ${faltam === 0 ? 'último dia' : `faltam ${faltam} ${faltam === 1 ? 'dia' : 'dias'}`}`}
    </div>
  )
}

/* Partilhar um vídeo com os convidados: no telemóvel abre a partilha do sistema
   (WhatsApp, SMS, email…); no computador copia a mensagem com o link. */
function PartilharVideo({ titulo, url, pagina, largo }: { titulo: string; url: string; pagina?: string | null; largo?: boolean }) {
  const [copiado, setCopiado] = useState(false)
  async function partilhar() {
    // Com a página dos convidados, partilha-se essa página (todos os vídeos, com leitor)
    const texto = pagina
      ? `Olá! Já podem ver o filme do nosso casamento aqui: ${pagina}`
      : `Olá! Já podem ver o ${titulo} do nosso casamento: ${url}`
    try {
      if (navigator.share) { await navigator.share({ title: titulo, text: texto }); return }
    } catch { return /* partilha cancelada */ }
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 3500)
    } catch {}
  }
  return (
    <button type="button" onClick={partilhar} className="atm-btn" style={largo ? { width: '100%' } : undefined}
      title="Enviar o link deste vídeo aos convidados">
      {copiado ? 'Mensagem copiada ✓' : 'Partilhar com convidados'}
    </button>
  )
}

export function FilmeRL({ title, heroUrl, backHref, videos, dataCasamento, proposta, estadoVideo, intro, acoes, paginaConvidados }: {
  title: string
  heroUrl?: string | null
  backHref: string
  videos: VideoRL[]
  dataCasamento?: string | null
  proposta?: string | null
  estadoVideo?: string | null
  intro?: ReactNode
  acoes?: ReactNode
  /** Página dos vídeos para os convidados (o que o botão Partilhar envia) */
  paginaConvidados?: string | null
}) {
  const casamento = /^\d{4}-\d{2}-\d{2}/.test(dataCasamento ?? '') ? dataCasamento!.slice(0, 10) : null
  const dias = prazoVideoDias(proposta)
  const previsto = casamento ? somaUteis(casamento, dias) : null
  // Capa de cada vídeo: a do próprio vídeo (og:image do Vimeo/YouTube, lida pelo
  // /api/link-preview); sem ela, a foto do casal. As imagens de modelo da página
  // (claquete) já não se usam.
  const [capas, setCapas] = useState<Record<string, string>>({})
  const chave = videos.map(v => v.url ?? '').join('|')
  useEffect(() => {
    let vivo = true
    const comLink = videos.filter(v => v.url)
    Promise.all(comLink.map(async v => {
      try {
        const d = await fetch(`/api/link-preview?url=${encodeURIComponent(v.url!)}`).then(r => r.json())
        return d?.image ? [v.url!, String(d.image).replace(/&amp;/g, '&')] as const : null
      } catch { return null }
    })).then(rows => {
      if (!vivo) return
      const next: Record<string, string> = {}
      for (const r of rows) if (r) next[r[0]] = r[1]
      setCapas(next)
    })
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  const capaDe = (v: VideoRL) => (v.url && capas[v.url]) || heroUrl || null
  // Leitor aberto (por cima da página); fecha com o × ou a tecla Esc
  const [aVer, setAVer] = useState<{ titulo: string; src: string } | null>(null)
  useEffect(() => {
    if (!aVer) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setAVer(null) }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [aVer])
  const ver = (v: VideoRL) => { const src = embedDe(v.url); if (src) setAVer({ titulo: v.titulo, src }) }

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
            {capa(capaDe(principal), 340)}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,11,11,.9), rgba(11,11,11,.1) 60%)' }} />
            <div style={{ position: 'absolute', left: 24, right: 24, bottom: 22, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div className="eyebrow">Filme completo</div>
                <div style={{ marginTop: 6, fontSize: 'clamp(26px, 3.4vw, 36px)', color: '#fff' }}>{principal.titulo}</div>
                {!principal.url && previsto && <div style={{ marginTop: 4, fontSize: 13, color: G, fontWeight: 600 }}>Previsto até {dataPt(previsto)}</div>}
                {principal.url && <NotaDownload enviadoEm={principal.enviadoEm} />}
              </div>
              {principal.url
                ? (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {embedDe(principal.url)
                      ? <button type="button" onClick={() => ver(principal)} className="atm-btn solid">▶ Ver o filme</button>
                      : <a href={principal.url} target="_blank" rel="noopener noreferrer" className="atm-btn solid">▶ Ver o filme</a>}
                    <PartilharVideo titulo={principal.titulo} url={principal.url} pagina={paginaConvidados} />
                  </div>
                )
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
                {capa(capaDe(v), 150)}
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{v.titulo}</span>
                    <span style={{
                      borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                      ...(v.url ? { color: '#86efac', background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.3)' } : { color: 'rgba(255,255,255,.5)', border: '1px solid rgba(255,255,255,.12)' }),
                    }}>{v.url ? 'Disponível' : 'A aguardar'}</span>
                  </div>
                  {v.url && <NotaDownload enviadoEm={v.enviadoEm} />}
                  <div style={{ marginTop: 14 }}>
                    {v.url
                      ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {embedDe(v.url)
                            ? <button type="button" onClick={() => ver(v)} className="atm-btn solid" style={{ width: '100%' }}>▶ Ver o vídeo</button>
                            : <a href={v.url} target="_blank" rel="noopener noreferrer" className="atm-btn solid" style={{ width: '100%' }}>Ver mais →</a>}
                        </div>
                      )
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

      {aVer && (
        <div role="dialog" aria-modal="true" aria-label={aVer.titulo} onClick={() => setAVer(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.88)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 'min(1100px, 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span className="eyebrow">{aVer.titulo}</span>
              <button type="button" onClick={() => setAVer(null)} aria-label="Fechar"
                style={{ width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(255,255,255,.2)', background: 'rgba(14,14,14,.9)', color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ position: 'relative', aspectRatio: '16 / 9', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(216,190,147,.3)', boxShadow: '0 0 60px -20px rgba(216,190,147,.5)', background: '#000' }}>
              <iframe src={aVer.src} title={aVer.titulo} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
            </div>
          </div>
        </div>
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
