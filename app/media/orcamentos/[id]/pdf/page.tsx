'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

/* ─────────────────────────────────────────────────────────────────────────── *
 *  RL PROD · Proposta de Orçamento (PDF)
 *
 *  Layout cinematográfico para entrega corporate. Paleta extraída do
 *  logotipo: ink profundo + azul brand como único acento. Tipografia
 *  editorial com Cormorant Garamond para títulos e Inter para corpo.
 *  Optimizado para A4 (210 × 297 mm) com print styles.
 * ─────────────────────────────────────────────────────────────────────────── */

const LS_KEY = 'rl_orcamentos_v1'

type Estado    = 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Expirado'
type Cobertura = 'Fotografia' | 'Vídeo' | 'Fotografia e Vídeo'
type ServicoSelected = { catalogId: string; nome: string; desc: string; duracao?: string }
type Proposta = { id: string; titulo: string; valor: number; servicos: ServicoSelected[]; descricao: string | null }
type Orcamento = {
  id: string; cliente: string; contacto: string | null; email: string | null
  cobertura: Cobertura | null; resumo: string | null; propostas: Proposta[]
  data_inicio: string | null; data_fim: string | null
  validade: string | null; estado: Estado; notas: string | null; criado_em: string
}

/* Paleta — inspirada na identidade RL PROD (azul brand do logo) */
const PAPER       = '#0b0d12'   // ink profundo, undertone azul
const PANEL       = '#11141b'   // card escuro
const PANEL_SOFT  = '#161a23'   // card alternativo
const INK         = '#ecf0f5'   // off white frio
const INK_SOFT    = '#cdd3df'   // texto principal secundário
const SUB         = '#8b93a4'   // texto secundário
const MUTE        = '#5a6273'   // texto subtil
const LINE        = 'rgba(255,255,255,0.07)'
const LINE_SOFT   = 'rgba(255,255,255,0.04)'
const ACCENT      = '#84A8E8'   // azul brand RL PROD
const ACCENT_DEEP = '#5d83c6'   // azul mais escuro para borders e detalhes

/* helpers */
function fmtEur(n: number) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n || 0)
}
function fmtData(iso: string | null) {
  if (!iso) return ''
  try {
    const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'))
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })
  } catch { return iso }
}
function fmtDataCurta(iso: string | null) {
  if (!iso) return ''
  try {
    const d = new Date(iso + (iso.includes('T') ? '' : 'T00:00:00'))
    return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return iso }
}
function fmtIntervaloEvento(inicio: string | null, fim: string | null): string {
  if (!inicio && !fim) return 'A definir'
  if (inicio && !fim) return fmtData(inicio)
  if (!inicio && fim) return `Até ${fmtData(fim)}`
  if (inicio === fim) return fmtData(inicio)
  return `${fmtDataCurta(inicio)} → ${fmtData(fim)}`
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

  useEffect(() => {
    if (loaded && orcamento) {
      const t = setTimeout(() => window.print(), 700)
      return () => clearTimeout(t)
    }
  }, [loaded, orcamento])

  if (loaded && !orcamento) {
    return (
      <main style={{ minHeight: '100vh', background: PAPER, color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
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
  const num = orcamento.id.slice(-6).toUpperCase()

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        @media print {
          @page { size: A4; margin: 0; }
          body { background: ${PAPER} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .pdf-page { box-shadow: none !important; margin: 0 !important; break-after: page; }
          .pdf-page:last-child { break-after: auto; }
        }
        body { background: #1a1c22; }
        .pdf-root { font-family: 'Inter', -apple-system, sans-serif; }
        .serif { font-family: 'Cormorant Garamond', 'Georgia', serif; }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(7,9,13,0.92)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${LINE}`,
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase', color: SUB, margin: 0 }}>
          Pré visualização · {orcamento.cliente}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.history.back()}
            style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '8px 18px', background: 'transparent', color: INK_SOFT, border: `1px solid ${LINE}`, borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: 'pointer', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            ‹ Voltar
          </button>
          <button onClick={() => window.print()}
            style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '8px 20px', background: ACCENT, color: '#0b0d12', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            ⎙ Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* PDF A4 */}
      <main className="pdf-root" style={{ minHeight: '100vh', padding: '24px 0' }}>
        <div className="pdf-page" style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          background: PAPER,
          color: INK,
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
          position: 'relative',
          overflow: 'hidden',
        }}>

          {/* Top accent bar */}
          <div style={{
            height: 3,
            background: `linear-gradient(90deg, ${ACCENT_DEEP} 0%, ${ACCENT} 50%, ${ACCENT_DEEP} 100%)`,
          }} />

          {/* HEADER */}
          <header style={{ padding: '20mm 22mm 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-rl-prod-branco.png" alt="RL PROD"
                style={{ width: 54, height: 54, objectFit: 'contain', opacity: 0.95 }} />
              <div>
                <p style={{ fontSize: 8, letterSpacing: '0.55em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 500 }}>
                  Photography &amp; Video
                </p>
                <p style={{ fontSize: 19, letterSpacing: '0.42em', textTransform: 'uppercase', color: INK, margin: '4px 0 0', fontWeight: 600 }}>
                  RL PROD
                </p>
                <p style={{ fontSize: 9, color: SUB, margin: '8px 0 0', letterSpacing: '0.04em' }}>
                  geral@rlphotovideo.pt &nbsp;·&nbsp; www.rlprod.pt
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: ACCENT, margin: 0, fontWeight: 700 }}>
                Proposta de Orçamento
              </p>
              <p className="serif" style={{ fontSize: 22, color: INK, margin: '6px 0 0', fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.01em' }}>
                Nº {num}
              </p>
              <p style={{ fontSize: 10, color: SUB, margin: '8px 0 0' }}>
                Emitido em {dataDeHoje()}
              </p>
              {orcamento.validade && (
                <p style={{ fontSize: 10, color: SUB, margin: '2px 0 0' }}>
                  Válido até {fmtData(orcamento.validade)}
                </p>
              )}
            </div>
          </header>

          {/* Divider */}
          <div style={{ margin: '12mm 22mm 0', height: 1, background: LINE }} />
          <div style={{ margin: '0 22mm', height: 2, background: ACCENT, width: 56 }} />

          {/* CLIENTE */}
          <section style={{ padding: '8mm 22mm 0' }}>
            <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 600 }}>
              Proposta apresentada a
            </p>
            <h1 className="serif" style={{ fontSize: 40, color: INK, margin: '6px 0 0', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.005em' }}>
              {orcamento.cliente}
            </h1>
            {(orcamento.contacto || orcamento.email) && (
              <p style={{ fontSize: 11, color: INK_SOFT, margin: '10px 0 0', letterSpacing: '0.02em' }}>
                {orcamento.contacto && <span>{orcamento.contacto}</span>}
                {orcamento.contacto && orcamento.email && <span style={{ color: ACCENT, margin: '0 8px' }}>·</span>}
                {orcamento.email && <span>{orcamento.email}</span>}
              </p>
            )}
          </section>

          {/* DADOS DO EVENTO */}
          <section style={{ padding: '8mm 22mm 0' }}>
            <div style={{
              border: `1px solid ${LINE}`,
              borderLeft: `2px solid ${ACCENT}`,
              padding: '12px 18px',
              background: PANEL,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 18,
              borderRadius: 2,
            }}>
              <div>
                <p style={{ fontSize: 8, letterSpacing: '0.45em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 600 }}>Data do Evento</p>
                <p style={{ fontSize: 13, color: INK, margin: '4px 0 0', fontWeight: 500 }}>
                  {fmtIntervaloEvento(orcamento.data_inicio, orcamento.data_fim)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 8, letterSpacing: '0.45em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 600 }}>Cobertura</p>
                <p style={{ fontSize: 13, color: INK, margin: '4px 0 0', fontWeight: 500 }}>
                  {orcamento.cobertura ?? 'A definir'}
                </p>
              </div>
            </div>
          </section>

          {/* RESUMO */}
          {orcamento.resumo && (
            <section style={{ padding: '8mm 22mm 0' }}>
              <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 6px', fontWeight: 700 }}>
                Resumo
              </p>
              <p style={{ fontSize: 11.5, lineHeight: 1.65, color: INK_SOFT, margin: 0, whiteSpace: 'pre-wrap' }}>
                {orcamento.resumo}
              </p>
            </section>
          )}

          {/* PROPOSTAS */}
          <section style={{ padding: '10mm 22mm 0' }}>
            <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 8px', fontWeight: 700 }}>
              {orcamento.propostas.length === 1 ? 'Proposta' : `Propostas (${orcamento.propostas.length})`}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              {orcamento.propostas.map((p, i) => (
                <PropostaBlock key={p.id} proposta={p} numero={i + 1} />
              ))}
            </div>

            {orcamento.propostas.length > 1 && (
              <p style={{ marginTop: 12, fontSize: 10.5, color: SUB, fontStyle: 'italic', textAlign: 'right' }}>
                Investimento {totalRange.min === totalRange.max
                  ? fmtEur(totalRange.max)
                  : `entre ${fmtEur(totalRange.min)} e ${fmtEur(totalRange.max)}`}, valores líquidos sem IVA.
              </p>
            )}
          </section>

          {/* CONDIÇÕES */}
          <section style={{ padding: '12mm 22mm 0' }}>
            <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: ACCENT, margin: '0 0 8px', fontWeight: 700 }}>
              Condições Comerciais
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 10.5, color: INK_SOFT, lineHeight: 1.55 }}>
              <Condicao titulo="Validade da Proposta">
                {orcamento.validade
                  ? `Esta proposta mantém-se válida até ${fmtData(orcamento.validade)}.`
                  : 'Proposta válida por 30 dias após a data de emissão.'}
              </Condicao>
              <Condicao titulo="Pagamento">
                50 por cento na confirmação da reserva e 50 por cento na entrega final dos materiais.
              </Condicao>
              <Condicao titulo="Impostos">
                Os valores apresentados não incluem IVA à taxa em vigor.
              </Condicao>
              <Condicao titulo="Confirmação">
                Datas e disponibilidade ficam reservadas após assinatura de contrato.
              </Condicao>
            </div>
          </section>

          {/* FOOTER */}
          <footer style={{
            position: 'absolute',
            bottom: '12mm',
            left: '22mm',
            right: '22mm',
            paddingTop: 10,
            borderTop: `1px solid ${LINE}`,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}>
            <div>
              <p style={{ fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 600 }}>
                RL Prod &nbsp;·&nbsp; Photography &amp; Video
              </p>
              <p style={{ fontSize: 9, color: SUB, margin: '4px 0 0', fontStyle: 'italic' }}>
                Obrigado pela confiança. Estamos disponíveis para qualquer esclarecimento adicional.
              </p>
            </div>
            <p style={{ fontSize: 9, color: SUB, margin: 0, letterSpacing: '0.12em' }}>
              Nº {num}
            </p>
          </footer>

          {/* Bottom accent */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${ACCENT_DEEP} 0%, ${ACCENT} 50%, ${ACCENT_DEEP} 100%)`,
          }} />
        </div>
      </main>
    </>
  )
}

/* ─── Proposta Card ───────────────────────────────────────────────────────── */

function PropostaBlock({ proposta, numero }: { proposta: Proposta; numero: number }) {
  return (
    <article style={{
      border: `1px solid ${LINE}`,
      borderRadius: 3,
      padding: '14px 18px 16px',
      background: PANEL,
      breakInside: 'avoid',
      position: 'relative',
    }}>
      {/* Header da proposta */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        paddingBottom: 10,
        borderBottom: `1px solid ${LINE}`,
      }}>
        <div style={{ minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span className="serif" style={{
            fontSize: 32,
            color: ACCENT,
            fontStyle: 'italic',
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}>
            {String(numero).padStart(2, '0')}
          </span>
          <div>
            <p style={{ fontSize: 8, letterSpacing: '0.45em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 700 }}>
              Proposta
            </p>
            <h2 className="serif" style={{ fontSize: 22, color: INK, margin: '2px 0 0', fontWeight: 500, lineHeight: 1.15 }}>
              {proposta.titulo || 'Proposta'}
            </h2>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 600 }}>
            Investimento
          </p>
          <p className="serif" style={{ fontSize: 26, color: INK, margin: '2px 0 0', fontWeight: 500, letterSpacing: '-0.01em' }}>
            {fmtEur(proposta.valor)}
          </p>
        </div>
      </div>

      {proposta.servicos.length > 0 && (
        <div style={{ paddingTop: 12 }}>
          <p style={{ fontSize: 8, letterSpacing: '0.45em', textTransform: 'uppercase', color: MUTE, margin: '0 0 8px', fontWeight: 600 }}>
            Incluído nesta proposta
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {proposta.servicos.map((s, idx) => (
              <li key={s.catalogId} style={{
                padding: '9px 0',
                borderBottom: idx === proposta.servicos.length - 1 ? 'none' : `1px solid ${LINE_SOFT}`,
                display: 'grid',
                gridTemplateColumns: '26px 1fr',
                gap: 10,
                alignItems: 'flex-start',
              }}>
                <span style={{
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: 10,
                  color: ACCENT,
                  fontWeight: 700,
                  lineHeight: 1.4,
                  letterSpacing: '0.05em',
                  paddingTop: 1,
                }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div>
                  <p style={{ fontSize: 11.5, color: INK, margin: 0, fontWeight: 600, letterSpacing: '0.005em' }}>
                    {s.nome}{s.duracao ? ` · ${s.duracao}` : ''}
                  </p>
                  <p style={{ fontSize: 10, color: SUB, margin: '3px 0 0', lineHeight: 1.5 }}>
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {proposta.descricao && (
        <p style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: `1px solid ${LINE}`,
          fontSize: 10,
          lineHeight: 1.55,
          color: SUB,
          fontStyle: 'italic',
        }}>
          {proposta.descricao}
        </p>
      )}
    </article>
  )
}

function Condicao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ borderLeft: `1px solid ${LINE}`, paddingLeft: 12 }}>
      <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: INK, margin: 0, fontWeight: 700 }}>
        {titulo}
      </p>
      <p style={{ fontSize: 10.5, color: INK_SOFT, margin: '4px 0 0', lineHeight: 1.55 }}>
        {children}
      </p>
    </div>
  )
}
