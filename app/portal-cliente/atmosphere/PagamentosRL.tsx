'use client'

/* Página Pagamentos no novo design (tema RL), como o /photo e o /eventos:
   topo com foto esbatida e indicadores, as três fases em cartões, a lista dos
   pagamentos já registados e, por baixo, a informação de como pagar.
   Só apresentação: os dados e os botões vêm da página. */

import { type ReactNode } from 'react'
import { useBatizado } from './PortalShell'

type Pag = {
  id: string
  fase_pagamento: string[]
  metodo_pagamento: string[]
  valor_liquidado: number | null
  data_pagamento: string | null
  confirmado?: boolean
}

const G = '#d8be93'
const ADJ = 400
const eur = (n: number) => `${n.toLocaleString('pt-PT', { maximumFractionDigits: 2 })} €`
const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const fmt = (d: string | null) => {
  if (!d) return '—'
  const dt = new Date(d.split('T')[0] + 'T12:00:00')
  return isNaN(dt.getTime()) ? '—' : `${String(dt.getDate()).padStart(2, '0')} ${MESES[dt.getMonth()]} ${dt.getFullYear()}`
}

export function PagamentosRL({ title, heroUrl, backHref, total, pagamentos, registarUrl, ibanNode, comoPagar, isAdmin, dataCasamento }: {
  title: string
  heroUrl?: string | null
  backHref: string
  total: number
  pagamentos: Pag[]
  registarUrl: string
  ibanNode?: ReactNode
  comoPagar?: ReactNode
  isAdmin?: boolean
  /** YYYY-MM-DD: dá as datas concretas de cada fase */
  dataCasamento?: string | null
}) {
  // Os noivos só recebem os confirmados; o admin vê também os por confirmar
  const confirmados = pagamentos.filter(p => p.confirmado !== false)
  const pago = confirmados.reduce((s, p) => s + Number(p.valor_liquidado ?? 0), 0)
  const falta = Math.max(0, total - pago)
  const pct = total > 0 ? Math.min(100, Math.round(pago / total * 100)) : 0

  const evento = useBatizado() ? 'batizado' : 'casamento'
  const resto = Math.max(0, total - ADJ)
  // Reforço: até 2 dias antes do casamento (a mesma regra do alerta do /photo)
  const hoje = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Lisbon' }).format(new Date())
  const casamento = /^\d{4}-\d{2}-\d{2}/.test(dataCasamento ?? '') ? dataCasamento!.slice(0, 10) : null
  const menos = (iso: string, n: number) => { const d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10) }
  const limiteReforco = casamento ? menos(casamento, 2) : null
  const fases = [
    { nome: 'Adjudicação', codigo: 'ADJUDICAÇÃO', quando: 'Na assinatura do contrato, para reservar o dia', valor: total > 0 ? ADJ : 0, limite: null as string | null },
    { nome: 'Reforço', codigo: 'REFORÇO', quando: `80% do valor em falta, até 2 dias antes do ${evento}`, valor: Math.round(resto * 0.8 * 100) / 100, limite: limiteReforco },
    { nome: 'Final', codigo: 'FINAL', quando: 'Os restantes 20%, no final', valor: Math.round(resto * 0.2 * 100) / 100, limite: null as string | null },
  ]
  const dataLonga = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })
  const faltamDias = (iso: string) => Math.round((Date.parse(iso + 'T12:00:00Z') - Date.parse(hoje + 'T12:00:00Z')) / 86400000)
  // O total pago preenche as fases por ordem (igual à página atual)
  let acumulado = 0
  const fasesEstado = fases.map(f => {
    const antes = acumulado
    acumulado += f.valor
    const pagoFase = Math.max(0, Math.min(pago, acumulado) - antes)
    return { ...f, pago: pagoFase, completa: f.valor > 0 && pago >= acumulado }
  })
  // Próximo pagamento: a primeira fase ainda por pagar, com o valor que falta
  const proxima = fasesEstado.find(f => f.valor > 0 && !f.completa)
  const valorProxima = proxima ? Math.round(Math.max(0, proxima.valor - proxima.pago) * 100) / 100 : 0
  const registarProxima = proxima ? `${registarUrl}&fase=${encodeURIComponent(proxima.codigo)}&valor=${valorProxima}` : registarUrl

  const card: React.CSSProperties = {
    borderRadius: 22, border: '1px solid rgba(216,190,147,.2)', background: 'rgba(17,17,17,.9)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
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
          <div className="rl-pag-topo" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 40, alignItems: 'center', marginTop: 22 }}>
            <div>
              <div className="eyebrow">{title || 'Pagamentos'}</div>
              <h1 style={{ margin: '12px 0 0', fontSize: 'clamp(36px, 5vw, 58px)', color: '#fff' }}>
                Os vossos <em style={{ fontStyle: 'normal', color: G }}>pagamentos</em>
              </h1>
              <p style={{ margin: '14px 0 22px', color: 'rgba(255,255,255,.55)', maxWidth: '46ch', lineHeight: 1.7 }}>
                Três fases ao longo do caminho. Depois de cada pagamento, registem-no aqui; fica confirmado assim que o validarmos.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <a href={registarUrl} target="_blank" rel="noopener noreferrer" className="atm-btn solid">Registar pagamento</a>
                {ibanNode}
              </div>
            </div>
            <aside style={{ ...card, border: '1px solid rgba(216,190,147,.3)', background: 'rgba(17,17,17,.8)', backdropFilter: 'blur(16px)', padding: 20, boxShadow: '0 0 48px -22px rgba(216,190,147,.5)' }}>
              <div className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: G, boxShadow: `0 0 8px ${G}` }} />Resumo
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: 8 }}>
                {[['Total do serviço', eur(total), false], ['Pago', eur(pago), true], ['Em falta', eur(falta), false], ['Concluído', `${pct}%`, true]].map(([l, v, dourado], k) => (
                  <div key={String(l)} style={{ padding: '12px 0', paddingRight: k % 2 === 0 ? 14 : 0, paddingLeft: k % 2 ? 14 : 0, borderRight: k % 2 === 0 ? '1px solid rgba(255,255,255,.07)' : 0, borderBottom: k < 2 ? '1px solid rgba(255,255,255,.07)' : 0 }}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)' }}>{l}</div>
                    <div style={{ fontSize: 21, fontWeight: 600, lineHeight: 1.1, marginTop: 6, color: dourado ? G : '#fff' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,.08)', marginTop: 14, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg, rgba(216,190,147,.5), ${G})`, transition: 'width .7s' }} />
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── próximo pagamento, já com a fase e o valor no formulário ── */}
      {proxima && (
        <section style={{ ...card, border: '1px solid rgba(216,190,147,.45)', borderLeft: `2px solid ${G}`, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', boxShadow: '0 0 40px -18px rgba(216,190,147,.6)' }}>
          <div style={{ flex: '1 1 240px' }}>
            <div className="eyebrow">Próximo pagamento</div>
            <div style={{ marginTop: 8, fontSize: 22, fontWeight: 600, color: '#fff' }}>
              {proxima.nome} · <span style={{ color: G }}>{eur(valorProxima)}</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 13.5, color: 'rgba(255,255,255,.55)' }}>
              {proxima.limite
                ? (faltamDias(proxima.limite) >= 0
                    ? `Até ${dataLonga(proxima.limite)} · faltam ${faltamDias(proxima.limite)} ${faltamDias(proxima.limite) === 1 ? 'dia' : 'dias'}`
                    : `O prazo era ${dataLonga(proxima.limite)}`)
                : proxima.quando}
            </div>
          </div>
          <a href={registarProxima} target="_blank" rel="noopener noreferrer" className="atm-btn solid">Registar este pagamento</a>
        </section>
      )}

      {/* ── três fases ── */}
      <section>
        <div className="eyebrow">As três fases</div>
        <h2 style={{ margin: '6px 0 16px', fontSize: 'clamp(26px, 3vw, 34px)', color: '#fff' }}>Plano de pagamentos</h2>
        <div className="rl-pag-fases" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14 }}>
          {fasesEstado.map((f, i) => (
            <div key={f.nome} style={{ ...card, padding: 20, borderLeft: `2px solid ${f.completa ? 'rgba(74,222,128,.7)' : 'rgba(216,190,147,.45)'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ width: 40, height: 40, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(216,190,147,.12)', color: G, fontSize: 16 }}>{['I', 'II', 'III'][i]}</span>
                <span style={{
                  borderRadius: 999, padding: '4px 10px', fontSize: 11.5, fontWeight: 600,
                  ...(f.completa
                    ? { color: '#86efac', background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.3)' }
                    : f.pago > 0
                      ? { color: G, background: 'rgba(216,190,147,.1)', border: '1px solid rgba(216,190,147,.3)' }
                      : { color: 'rgba(255,255,255,.55)', background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.1)' }),
                }}>{f.completa ? 'Pago' : f.pago > 0 ? 'Em curso' : 'Pendente'}</span>
              </div>
              <div style={{ marginTop: 14, fontSize: 17, fontWeight: 600, color: '#fff' }}>{f.nome}</div>
              <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,.5)', lineHeight: 1.5, minHeight: '3em' }}>{f.quando}</div>
              {f.limite && !f.completa && (
                <div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 600, color: faltamDias(f.limite) < 0 ? '#f87171' : G }}>
                  {faltamDias(f.limite) >= 0 ? `Até ${dataLonga(f.limite)} · faltam ${faltamDias(f.limite)} ${faltamDias(f.limite) === 1 ? 'dia' : 'dias'}` : `Prazo: ${dataLonga(f.limite)}`}
                </div>
              )}
              <div style={{ marginTop: 12, fontSize: 24, fontWeight: 600, color: G }}>{eur(f.valor)}</div>
              {!f.completa && f.pago > 0 && <div style={{ fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>Pago {eur(f.pago)} · faltam {eur(Math.max(0, f.valor - f.pago))}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── pagamentos registados ── */}
      <section>
        <div className="eyebrow">Histórico</div>
        <h2 style={{ margin: '6px 0 16px', fontSize: 'clamp(26px, 3vw, 34px)', color: '#fff' }}>Pagamentos registados</h2>
        {pagamentos.length === 0 ? (
          <div style={{ borderRadius: 22, border: '1px dashed rgba(216,190,147,.25)', padding: '36px 16px', textAlign: 'center', color: 'rgba(255,255,255,.4)' }}>
            Ainda não há pagamentos confirmados.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pagamentos.map(p => {
              const porConfirmar = p.confirmado === false
              return (
                <div key={p.id} style={{ ...card, border: '1px solid rgba(216,190,147,.14)', borderLeft: `2px solid ${porConfirmar ? 'rgba(255,255,255,.2)' : 'rgba(216,190,147,.6)'}`, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 160px' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{(p.fase_pagamento ?? []).join(' · ') || 'Pagamento'}</div>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>{fmt(p.data_pagamento)}{p.metodo_pagamento?.length ? ` · ${p.metodo_pagamento.join(', ')}` : ''}</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: G }}>{eur(Number(p.valor_liquidado ?? 0))}</div>
                  <span style={{
                    borderRadius: 999, padding: '4px 10px', fontSize: 11.5, fontWeight: 600,
                    ...(porConfirmar
                      ? { color: 'rgba(255,255,255,.6)', border: '1px solid rgba(255,255,255,.15)' }
                      : { color: '#86efac', background: 'rgba(74,222,128,.1)', border: '1px solid rgba(74,222,128,.3)' }),
                  }}>{porConfirmar ? (isAdmin ? 'Por confirmar' : 'Em validação') : '✓ Confirmado'}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── como pagar (texto da página) ── */}
      {comoPagar && (
        <section>
          <div className="eyebrow">Como pagar</div>
          <h2 style={{ margin: '6px 0 16px', fontSize: 'clamp(26px, 3vw, 34px)', color: '#fff' }}>Informação de pagamento</h2>
          {comoPagar}
        </section>
      )}

      <style>{`
        @media (max-width: 860px) {
          .rl-pag-topo { grid-template-columns: minmax(0,1fr) !important; }
          .rl-pag-fases { grid-template-columns: minmax(0,1fr) !important; }
        }
      `}</style>
    </div>
  )
}
