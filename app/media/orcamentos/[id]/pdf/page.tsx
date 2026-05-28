'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

/* ─────────────────────────────────────────────────────────────────────────── *
 *  RL PROD · Orçamento — Print View
 *
 *  Página optimizada para impressão / exportação PDF. Lê o orçamento de
 *  localStorage (chave rl_orcamentos_v1) e renderiza um layout editorial
 *  profissional com logo RL PROD, header, propostas e termos.
 *
 *  Usa window.print() — guardar como PDF pelo browser.
 * ─────────────────────────────────────────────────────────────────────────── */

const LS_KEY = 'rl_orcamentos_v1'

type Estado    = 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Expirado'
type Cobertura = 'Fotografia' | 'Vídeo' | 'Fotografia e Vídeo'
type ServicoSelected = { catalogId: string; nome: string; desc: string; duracao?: string }
type Proposta = { id: string; titulo: string; valor: number; servicos: ServicoSelected[]; descricao: string | null }
type Orcamento = {
  id: string; cliente: string; contacto: string | null; email: string | null
  cobertura: Cobertura | null; resumo: string | null; propostas: Proposta[]
  validade: string | null; estado: Estado; notas: string | null; criado_em: string
}

function fmtEur(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0)
}
function fmtData(iso: string | null) {
  if (!iso) return '—'
  try {
    const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'))
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return iso }
}
function dataDeHoje() {
  return new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function PdfPage() {
  const { id } = useParams<{ id: string }>()
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      const list: Orcamento[] = raw ? JSON.parse(raw) : []
      const o = list.find(x => x.id === id) ?? null
      setOrcamento(o)
    } catch { setOrcamento(null) }
    setLoaded(true)
  }, [id])

  // Auto-print depois de carregar e renderizar
  useEffect(() => {
    if (loaded && orcamento) {
      const t = setTimeout(() => window.print(), 700)
      return () => clearTimeout(t)
    }
  }, [loaded, orcamento])

  if (loaded && !orcamento) {
    return (
      <main style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, opacity: 0.5, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 16 }}>RL PROD</p>
          <p style={{ fontSize: 18 }}>Orçamento não encontrado.</p>
          <p style={{ fontSize: 12, opacity: 0.4, marginTop: 12 }}>Os orçamentos estão guardados no browser onde foram criados.</p>
        </div>
      </main>
    )
  }
  if (!orcamento) return null

  const totalRange = (() => {
    const v = orcamento.propostas.map(p => p.valor || 0)
    return { min: Math.min(...v), max: Math.max(...v) }
  })()

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: #fff !important; }
          .no-print { display: none !important; }
          .pdf-page { box-shadow: none !important; margin: 0 !important; }
        }
        body { background: #1a1a1a; }
      `}</style>

      {/* Toolbar (não aparece no PDF) */}
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
          Pré-visualização PDF · {orcamento.cliente}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.history.back()}
            style={{ fontFamily: 'system-ui, sans-serif', padding: '8px 18px', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, fontWeight: 600, fontSize: 11, cursor: 'pointer', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            ‹ Voltar
          </button>
          <button onClick={() => window.print()}
            style={{ fontFamily: 'system-ui, sans-serif', padding: '8px 20px', background: '#fff', color: '#000', border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            ⎙ Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* PDF Page (A4) */}
      <main style={{ minHeight: '100vh', padding: '24px 0' }}>
        <div className="pdf-page" style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          background: '#0d0e10',
          color: '#fff',
          fontFamily: 'Georgia, "Times New Roman", serif',
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* subtle grid background */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none',
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          {/* HEADER */}
          <header style={{ position: 'relative', padding: '28mm 22mm 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
            <div>
              {/* Logo */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-rl-prod-branco.png" alt="RL PROD"
                style={{ width: 50, height: 50, objectFit: 'contain', opacity: 0.9, marginBottom: 14 }} />
              <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 8, letterSpacing: '0.7em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Photography &amp; Video</p>
              <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 18, letterSpacing: '0.55em', textTransform: 'uppercase', color: '#fff', margin: '4px 0 0', fontWeight: 300 }}>
                RL PROD
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Orçamento</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', margin: '6px 0 0' }}>Emitido em {dataDeHoje()}</p>
              {orcamento.validade && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', margin: '2px 0 0' }}>Válido até {fmtData(orcamento.validade)}</p>
              )}
              <p style={{ fontFamily: 'monospace', fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', margin: '6px 0 0' }}>#{orcamento.id.slice(-8).toUpperCase()}</p>
            </div>
          </header>

          {/* Divider */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)', margin: '20mm 22mm 0' }} />

          {/* TÍTULO + CLIENTE */}
          <section style={{ position: 'relative', padding: '8mm 22mm 0' }}>
            <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Para</p>
            <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-0.01em', margin: '6px 0 0', lineHeight: 1.1 }}>
              {orcamento.cliente}
            </h1>
            {(orcamento.contacto || orcamento.email) && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', margin: '8px 0 0', fontStyle: 'italic' }}>
                {[orcamento.contacto, orcamento.email].filter(Boolean).join(' · ')}
              </p>
            )}
            {orcamento.cobertura && (
              <p style={{ marginTop: 12, display: 'inline-block', fontFamily: 'system-ui, sans-serif', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', fontWeight: 700, padding: '5px 12px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, color: 'rgba(255,255,255,0.85)' }}>
                Cobertura · {orcamento.cobertura}
              </p>
            )}
          </section>

          {/* RESUMO */}
          {orcamento.resumo && (
            <section style={{ position: 'relative', padding: '10mm 22mm 0' }}>
              <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 6px' }}>Resumo da Proposta</p>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.78)', margin: 0, whiteSpace: 'pre-wrap' }}>{orcamento.resumo}</p>
            </section>
          )}

          {/* PROPOSTAS */}
          <section style={{ position: 'relative', padding: '12mm 22mm 0' }}>
            <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 8mm' }}>
              {orcamento.propostas.length === 1 ? 'Proposta' : `${orcamento.propostas.length} Propostas`}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: orcamento.propostas.length === 1 ? '1fr' : orcamento.propostas.length === 2 ? '1fr 1fr' : '1fr 1fr 1fr', gap: 10 }}>
              {orcamento.propostas.map((p, i) => (
                <div key={p.id} style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: '14px 14px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Proposta {i + 1}</p>
                  <h2 style={{ fontSize: 18, fontWeight: 400, margin: '4px 0 8px', lineHeight: 1.2 }}>{p.titulo || '—'}</h2>
                  <p style={{ fontSize: 26, fontWeight: 300, margin: '0 0 12px', letterSpacing: '-0.01em' }}>{fmtEur(p.valor)}</p>

                  {p.servicos.length > 0 && (
                    <ul style={{ listStyle: 'none', margin: 0, padding: 0, flex: 1 }}>
                      {p.servicos.map(s => (
                        <li key={s.catalogId} style={{ fontSize: 11, color: 'rgba(255,255,255,0.78)', padding: '5px 0', borderBottom: '1px dashed rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <span style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>✓</span>
                          <span style={{ flex: 1, lineHeight: 1.4 }}>{s.nome}{s.duracao ? ` · ${s.duracao}` : ''}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {p.descricao && (
                    <p style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: 10, lineHeight: 1.5, color: 'rgba(255,255,255,0.55)', fontStyle: 'italic' }}>
                      {p.descricao}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Total range */}
            {orcamento.propostas.length > 1 && (
              <p style={{ marginTop: 12, fontSize: 11, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', textAlign: 'right' }}>
                Investimento {totalRange.min === totalRange.max ? fmtEur(totalRange.max) : `entre ${fmtEur(totalRange.min)} e ${fmtEur(totalRange.max)}`} · valores líquidos
              </p>
            )}
          </section>

          {/* CONDIÇÕES */}
          <section style={{ position: 'relative', padding: '14mm 22mm 0' }}>
            <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: '0 0 8px' }}>Condições</p>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 11, lineHeight: 1.7, color: 'rgba(255,255,255,0.7)' }}>
              <li style={{ paddingLeft: 14, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: 'rgba(255,255,255,0.3)' }}>·</span>
                Validade da proposta {orcamento.validade ? `até ${fmtData(orcamento.validade)}` : 'de 30 dias após emissão'}.
              </li>
              <li style={{ paddingLeft: 14, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: 'rgba(255,255,255,0.3)' }}>·</span>
                Pagamento: 50% na confirmação da reserva, 50% após entrega final.
              </li>
              <li style={{ paddingLeft: 14, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: 'rgba(255,255,255,0.3)' }}>·</span>
                Valores apresentados não incluem IVA à taxa em vigor.
              </li>
              <li style={{ paddingLeft: 14, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 0, color: 'rgba(255,255,255,0.3)' }}>·</span>
                Datas e disponibilidade confirmadas mediante assinatura do contrato.
              </li>
            </ul>
          </section>

          {/* FOOTER */}
          <footer style={{ position: 'absolute', bottom: '14mm', left: '22mm', right: '22mm', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', margin: 0 }}>RL Prod · Photography &amp; Video</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0', fontStyle: 'italic' }}>geral@rlphotovideo.pt · www.rlprod.pt</p>
            </div>
            <p style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', margin: 0 }}>
              {dataDeHoje()}
            </p>
          </footer>
        </div>
      </main>
    </>
  )
}
