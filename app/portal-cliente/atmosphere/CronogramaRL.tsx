'use client'

/* Cronograma no novo design (tema RL): topo com o progresso e o próximo passo,
   e a linha do tempo das etapas. Cada etapa fica a vermelho (pendente) ou verde
   (concluída), como nos portais. As que a app consegue confirmar sozinha
   (contrato, pagamentos, pré-wedding, dia, backup, entregas) marcam-se
   automaticamente; as outras continuam com o botão. */

import { type ReactNode } from 'react'

export type EtapaRL = {
  id: string
  titulo: string
  texto?: string
  feito: boolean
  /** true = marcada pela app (sem botão) */
  automatico?: boolean
}

const G = '#d8be93'

export function CronogramaRL({ title, heroUrl, backHref, etapas, onAlternar, intro }: {
  title: string
  heroUrl?: string | null
  backHref: string
  etapas: EtapaRL[]
  onAlternar: (id: string) => void
  intro?: ReactNode
}) {
  const feitas = etapas.filter(e => e.feito).length
  const pct = etapas.length ? Math.round(feitas / etapas.length * 100) : 0
  const proxima = etapas.find(e => !e.feito)

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
          <div className="rl-crono-topo" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 290px', gap: 36, alignItems: 'center', marginTop: 20 }}>
            <div>
              <div className="eyebrow">{title || 'Cronograma'}</div>
              <h1 style={{ margin: '12px 0 0', fontSize: 'clamp(34px, 4.8vw, 56px)', color: '#fff' }}>
                O caminho até ao vosso <em style={{ fontStyle: 'normal', color: G }}>dia</em>
              </h1>
              <p style={{ margin: '14px 0 0', color: 'rgba(255,255,255,.55)', maxWidth: '50ch', lineHeight: 1.7 }}>
                A vermelho o que ainda falta, a verde o que já está feito. Muitas etapas atualizam-se sozinhas à medida que avançamos.
              </p>
            </div>
            <aside style={{ borderRadius: 22, border: '1px solid rgba(216,190,147,.3)', background: 'rgba(17,17,17,.8)', backdropFilter: 'blur(16px)', padding: 20, boxShadow: '0 0 48px -22px rgba(216,190,147,.5)' }}>
              <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: G, boxShadow: `0 0 8px ${G}` }} />Progresso
              </div>
              <div style={{ marginTop: 10, fontSize: 30, fontWeight: 600, color: G, lineHeight: 1 }}>{feitas} <span style={{ fontSize: 15, color: 'rgba(255,255,255,.5)', fontWeight: 400 }}>de {etapas.length} etapas</span></div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,.08)', marginTop: 12, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg, rgba(216,190,147,.5), ${G})`, transition: 'width .7s' }} />
              </div>
              {proxima && (
                <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.07)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>Próximo passo</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginTop: 4 }}>{proxima.titulo}</div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {intro}

      {/* ── linha do tempo ── */}
      <section style={{ position: 'relative', paddingLeft: 30 }}>
        <div aria-hidden style={{ position: 'absolute', left: 13, top: 10, bottom: 10, width: 1, background: 'linear-gradient(to bottom, rgba(216,190,147,.5), rgba(216,190,147,.08))' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {etapas.map((e, i) => {
            const cor = e.feito ? '74,222,128' : '239,68,68'
            return (
              <div key={e.id} style={{ position: 'relative' }}>
                <span aria-hidden style={{
                  position: 'absolute', left: -30, top: 18, width: 27, height: 27, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600,
                  background: e.feito ? 'rgba(74,222,128,.15)' : '#111', color: e.feito ? '#86efac' : 'rgba(255,255,255,.55)',
                  border: `1px solid rgba(${cor},.55)`,
                }}>{e.feito ? '✓' : i + 1}</span>
                <div style={{
                  borderRadius: 18, background: 'rgba(17,17,17,.92)', padding: '14px 18px',
                  border: `1px solid rgba(${cor},${e.feito ? .45 : .4})`,
                  boxShadow: `0 0 18px 2px rgba(${cor},.12), inset 0 0 18px 0 rgba(${cor},.04)`,
                  display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                }}>
                  <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 600, color: '#fff' }}>{e.titulo}</div>
                    {e.texto && <div style={{ marginTop: 3, fontSize: 13.5, color: 'rgba(255,255,255,.55)', lineHeight: 1.5 }}>{e.texto}</div>}
                  </div>
                  {e.automatico ? (
                    <span title="Atualizado automaticamente pela app" style={{
                      borderRadius: 999, padding: '6px 12px', fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
                      color: e.feito ? '#86efac' : '#fca5a5', border: `1px solid rgba(${cor},.45)`, background: `rgba(${cor},.08)`,
                    }}>{e.feito ? '✓ Concluído' : '○ Pendente'} · auto</span>
                  ) : (
                    <button type="button" onClick={() => onAlternar(e.id)} style={{
                      borderRadius: 999, padding: '6px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer',
                      color: e.feito ? '#86efac' : '#fca5a5', border: `1px solid rgba(${cor},.5)`, background: `rgba(${cor},.1)`,
                    }}>{e.feito ? '✓ Concluído' : '○ Pendente'}</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>
      <style>{`@media (max-width: 860px) { .rl-crono-topo { grid-template-columns: minmax(0,1fr) !important; } }`}</style>
    </div>
  )
}
