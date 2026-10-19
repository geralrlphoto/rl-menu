'use client'

/* Topo da página Briefing no novo design (tema RL): foto esbatida, título e um
   resumo com o prazo do briefing (cerca de 15 dias antes) e os dias até ao casamento.
   O formulário por baixo mantém-se igual; só ganha o estilo novo (tema-rl.css). */

import { useBatizado } from './PortalShell'

const G = '#d8be93'

export function BriefingTopoRL({ title, heroUrl, backHref, dataCasamento }: {
  title: string
  heroUrl?: string | null
  backHref: string
  dataCasamento?: string | null
}) {
  const evento = useBatizado() ? 'batizado' : 'casamento'
  const hoje = new Date(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date()) + 'T12:00:00Z')
  const casamento = /^\d{4}-\d{2}-\d{2}/.test(dataCasamento ?? '') ? new Date(dataCasamento!.slice(0, 10) + 'T12:00:00Z') : null
  const limite = casamento ? new Date(casamento.getTime() - 15 * 86400000) : null
  const dias = (d: Date) => Math.round((d.getTime() - hoje.getTime()) / 86400000)
  const fmt = (d: Date) => d.toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })

  const tiles: Array<[string, string, string, boolean]> = [
    ['Preencher até', limite ? fmt(limite) : '15 dias antes', limite ? (dias(limite) >= 0 ? `faltam ${dias(limite)} dias` : 'prazo passou') : `do ${evento}`, true],
    ['Faltam', casamento ? `${Math.max(0, dias(casamento))} dias` : '—', 'para o grande dia', false],
  ]

  return (
    <section className="rl-briefing-topo" style={{ position: 'relative', overflow: 'hidden', borderRadius: 28, border: '1px solid rgba(216,190,147,.2)', background: '#0b0b0b', padding: 'clamp(28px, 5vw, 44px)', marginBottom: 28 }}>
      {heroUrl && <div aria-hidden style={{ position: 'absolute', inset: 0, backgroundImage: `url('${heroUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center 35%', filter: 'grayscale(1)', opacity: .28 }} />}
      <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(11,11,11,.97) 0%, rgba(11,11,11,.78) 58%, rgba(11,11,11,.5) 100%)' }} />
      <div aria-hidden style={{
        position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(216,190,147,0.18) 1px, transparent 1px)', backgroundSize: '24px 24px',
        maskImage: 'radial-gradient(ellipse at 80% 40%, #000 0%, transparent 70%)', WebkitMaskImage: 'radial-gradient(ellipse at 80% 40%, #000 0%, transparent 70%)',
      }} />
      <div style={{ position: 'relative' }}>
        <a href={backHref} style={{ fontSize: 14, color: 'rgba(255,255,255,.5)' }}>‹ Voltar</a>
        <div className="rl-briefing-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 36, alignItems: 'center', marginTop: 20 }}>
          <div>
            <div className="eyebrow">{title || 'Briefing'}</div>
            <h1 style={{ margin: '12px 0 0', fontSize: 'clamp(34px, 4.6vw, 54px)', color: '#fff' }}>
              Os detalhes do vosso <em style={{ fontStyle: 'normal', color: G }}>dia</em>
            </h1>
            <p style={{ margin: '14px 0 0', color: 'rgba(255,255,255,.55)', maxWidth: '50ch', lineHeight: 1.7 }}>
              Preencham com calma, secção a secção. Fica tudo guardado e podem voltar quando quiserem. Cerca de 15 dias antes do {evento} falamos numa reunião de preparação por videochamada.
            </p>
          </div>
          <aside style={{ borderRadius: 22, border: '1px solid rgba(216,190,147,.3)', background: 'rgba(17,17,17,.8)', backdropFilter: 'blur(16px)', padding: 20, boxShadow: '0 0 48px -22px rgba(216,190,147,.5)' }}>
            <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: G, boxShadow: `0 0 8px ${G}` }} />Briefing
            </div>
            {tiles.map(([l, v, sub, dourado], k) => (
              <div key={l} style={{ padding: '12px 0', borderTop: k ? '1px solid rgba(255,255,255,.07)' : 0 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{l}</div>
                <div style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.15, marginTop: 4, color: dourado ? G : '#fff' }}>{v}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.35)', marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </aside>
        </div>
      </div>
      <style>{`@media (max-width: 860px) { .rl-briefing-grid { grid-template-columns: minmax(0,1fr) !important; } }`}</style>
    </section>
  )
}
