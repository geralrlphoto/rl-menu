'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

/* ─────────────────────────────────────────────────────────────────────────── *
 *  RL PROD · Orçamento Editorial PDF
 *
 *  Layout profissional para entrega a empresas. Fundo creme premium,
 *  tipografia serif para títulos, sans para corpo, acentos dourados,
 *  estrutura editorial limpa. Cada serviço apresentado com nome,
 *  duração (quando aplicável) e descrição completa.
 *
 *  Optimizado para A4 (210 × 297 mm) e impressão / Save as PDF.
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

const GOLD = '#B89460'
const INK  = '#1a1816'
const SUB  = '#5a544c'
const MUTE = '#8a8278'
const LINE = '#d7d1c6'
const PAPER = '#fbf9f5'

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
  const num = orcamento.id.slice(-6).toUpperCase()

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        @media print {
          @page { size: A4; margin: 0; }
          body { background: ${PAPER} !important; }
          .no-print { display: none !important; }
          .pdf-page { box-shadow: none !important; margin: 0 !important; break-after: page; }
          .pdf-page:last-child { break-after: auto; }
        }
        body { background: #2a2825; }
        .pdf-root { font-family: 'Inter', -apple-system, sans-serif; }
        .serif { font-family: 'Cormorant Garamond', 'Georgia', serif; }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(15,12,8,0.92)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(184,148,96,0.2)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
          Pré visualização · {orcamento.cliente}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.history.back()}
            style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '8px 18px', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: 'pointer', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            ‹ Voltar
          </button>
          <button onClick={() => window.print()}
            style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '8px 20px', background: GOLD, color: '#1a1816', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            ⎙ Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* PDF Page A4 */}
      <main className="pdf-root" style={{ minHeight: '100vh', padding: '24px 0' }}>
        <div className="pdf-page" style={{
          width: '210mm',
          minHeight: '297mm',
          margin: '0 auto',
          background: PAPER,
          color: INK,
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
          position: 'relative',
          overflow: 'hidden',
        }}>

          {/* Top gold accent bar */}
          <div style={{ height: 4, background: GOLD, width: '100%' }} />

          {/* HEADER */}
          <header style={{ padding: '22mm 22mm 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-rl-prod-black.png" alt="RL PROD"
                style={{ width: 56, height: 56, objectFit: 'contain' }} />
              <div>
                <p style={{ fontSize: 8, letterSpacing: '0.55em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 500 }}>
                  Photography &amp; Video
                </p>
                <p style={{ fontSize: 19, letterSpacing: '0.4em', textTransform: 'uppercase', color: INK, margin: '4px 0 0', fontWeight: 600 }}>
                  RL PROD
                </p>
                <p style={{ fontSize: 9, color: MUTE, margin: '8px 0 0', letterSpacing: '0.05em' }}>
                  geral@rlphotovideo.pt · www.rlprod.pt
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: GOLD, margin: 0, fontWeight: 700 }}>
                Proposta de Orçamento
              </p>
              <p className="serif" style={{ fontSize: 22, color: INK, margin: '6px 0 0', fontWeight: 400, fontStyle: 'italic' }}>
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

          {/* Gold divider */}
          <div style={{ margin: '12mm 22mm 0', height: 1, background: LINE }} />
          <div style={{ margin: '0 22mm', height: 2, background: GOLD, width: 60 }} />

          {/* CLIENTE */}
          <section style={{ padding: '8mm 22mm 0' }}>
            <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 600 }}>
              Proposta apresentada a
            </p>
            <h1 className="serif" style={{ fontSize: 38, color: INK, margin: '6px 0 0', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.005em' }}>
              {orcamento.cliente}
            </h1>
            {(orcamento.contacto || orcamento.email) && (
              <p style={{ fontSize: 11, color: SUB, margin: '8px 0 0', letterSpacing: '0.02em' }}>
                {orcamento.contacto && <span>{orcamento.contacto}</span>}
                {orcamento.contacto && orcamento.email && <span style={{ color: GOLD, margin: '0 8px' }}>·</span>}
                {orcamento.email && <span>{orcamento.email}</span>}
              </p>
            )}
          </section>

          {/* DADOS DO EVENTO — table */}
          <section style={{ padding: '8mm 22mm 0' }}>
            <div style={{ border: `1px solid ${LINE}`, borderLeft: `3px solid ${GOLD}`, padding: '12px 18px', background: 'rgba(184,148,96,0.04)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
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
              <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: GOLD, margin: '0 0 6px', fontWeight: 700 }}>
                Resumo
              </p>
              <p style={{ fontSize: 11.5, lineHeight: 1.65, color: SUB, margin: 0, whiteSpace: 'pre-wrap' }}>
                {orcamento.resumo}
              </p>
            </section>
          )}

          {/* PROPOSTAS */}
          <section style={{ padding: '10mm 22mm 0' }}>
            <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: GOLD, margin: '0 0 8px', fontWeight: 700 }}>
              {orcamento.propostas.length === 1 ? 'Proposta' : `Propostas (${orcamento.propostas.length})`}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
              {orcamento.propostas.map((p, i) => (
                <PropostaBlock key={p.id} proposta={p} numero={i + 1} />
              ))}
            </div>

            {orcamento.propostas.length > 1 && (
              <p style={{ marginTop: 12, fontSize: 10.5, color: MUTE, fontStyle: 'italic', textAlign: 'right' }}>
                Investimento {totalRange.min === totalRange.max
                  ? fmtEur(totalRange.max)
                  : `entre ${fmtEur(totalRange.min)} e ${fmtEur(totalRange.max)}`}, valores líquidos sem IVA.
              </p>
            )}
          </section>

          {/* CONDIÇÕES */}
          <section style={{ padding: '12mm 22mm 0' }}>
            <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: GOLD, margin: '0 0 8px', fontWeight: 700 }}>
              Condições Comerciais
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: 10.5, color: SUB, lineHeight: 1.55 }}>
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
          <footer style={{ position: 'absolute', bottom: '12mm', left: '22mm', right: '22mm', paddingTop: 10, borderTop: `1px solid ${LINE}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 600 }}>
                RL Prod · Photography &amp; Video
              </p>
              <p style={{ fontSize: 9, color: MUTE, margin: '4px 0 0', fontStyle: 'italic' }}>
                Obrigado pela confiança. Estamos disponíveis para qualquer esclarecimento adicional.
              </p>
            </div>
            <p style={{ fontSize: 9, color: MUTE, margin: 0, letterSpacing: '0.1em' }}>
              Nº {num}
            </p>
          </footer>

          {/* Bottom gold accent */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: GOLD }} />
        </div>
      </main>
    </>
  )
}

/* ─── Sub components ──────────────────────────────────────────────────────── */

function PropostaBlock({ proposta, numero }: { proposta: Proposta; numero: number }) {
  return (
    <article style={{
      border: `1px solid ${LINE}`,
      borderRadius: 4,
      padding: '14px 18px 16px',
      background: '#fff',
      breakInside: 'avoid',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, paddingBottom: 10, borderBottom: `1px solid ${LINE}` }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 8, letterSpacing: '0.45em', textTransform: 'uppercase', color: GOLD, margin: 0, fontWeight: 700 }}>
            Proposta {numero}
          </p>
          <h2 className="serif" style={{ fontSize: 22, color: INK, margin: '4px 0 0', fontWeight: 500, lineHeight: 1.15 }}>
            {proposta.titulo || 'Proposta'}
          </h2>
        </div>
        <div style={{ textAlign: 'right', shrink: 0 } as any}>
          <p style={{ fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 600 }}>Investimento</p>
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
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, counterReset: 'svc' }}>
            {proposta.servicos.map(s => (
              <li key={s.catalogId} style={{
                counterIncrement: 'svc',
                padding: '8px 0',
                borderBottom: `1px dashed ${LINE}`,
                display: 'grid',
                gridTemplateColumns: '22px 1fr',
                gap: 10,
              }}>
                <span className="serif" style={{ fontSize: 13, color: GOLD, fontWeight: 500, lineHeight: 1.4, fontStyle: 'italic' }}>
                  {String((proposta.servicos.indexOf(s)) + 1).padStart(2, '0')}
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
        <p style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${LINE}`, fontSize: 10, lineHeight: 1.55, color: SUB, fontStyle: 'italic', margin: '12px 0 0' }}>
          {proposta.descricao}
        </p>
      )}
    </article>
  )
}

function Condicao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: INK, margin: 0, fontWeight: 700 }}>
        {titulo}
      </p>
      <p style={{ fontSize: 10.5, color: SUB, margin: '4px 0 0', lineHeight: 1.55 }}>
        {children}
      </p>
    </div>
  )
}
