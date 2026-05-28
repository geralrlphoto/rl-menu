'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

/* ─────────────────────────────────────────────────────────────────────────── *
 *  RL PROD · Proposta de Orçamento (PDF · multi página)
 *
 *  Estrutura:
 *    Pág 1 · Capa editorial (cliente em destaque, resumo, dados do evento)
 *    Pág 2 · Propostas (uma a uma com investimento e serviços)
 *    Pág 3 · O Nosso Processo + Condições + Contacto
 *
 *  Paleta extraída do logotipo oficial RL PROD:
 *    Papel creme + azul marinho profundo (sem dourados).
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

/* Paleta oficial */
const PAPER       = '#e9e5dc'
const PAPER_SOFT  = '#f1ede4'
const NAVY        = '#284E70'
const NAVY_DEEP   = '#1d3a55'
const NAVY_SOFT   = '#3a6791'
const INK         = '#1a1816'
const SUB         = '#4f4a42'
const MUTE        = '#7e786e'
const LINE        = 'rgba(40, 78, 112, 0.20)'
const LINE_SOFT   = 'rgba(40, 78, 112, 0.10)'

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

/* O Nosso Processo · 8 passos editoriais */
const PROCESSO = [
  { n: 1, titulo: 'Briefing e Imersão', desc: 'Recebemos o teu briefing, mergulhamos na marca e no contexto do evento.' },
  { n: 2, titulo: 'Proposta',           desc: 'Desenvolvemos uma visão completa, técnica e estratégica para a tua comunicação.' },
  { n: 3, titulo: 'Planeamento',        desc: 'Definimos como e quando tudo vai acontecer, com mapa de captação e logística.' },
  { n: 4, titulo: 'Produção',           desc: 'Preparamos e executamos a captação no terreno com equipa e equipamento dedicados.' },
  { n: 5, titulo: 'Edição',             desc: 'Montagem narrativa, correcção de cor, mistura de áudio e exportação final.' },
  { n: 6, titulo: 'Aprovação',          desc: 'Apresentamos uma primeira versão, recebemos feedback e fazemos os ajustes.' },
  { n: 7, titulo: 'Entrega',            desc: 'Conteúdos finais entregues via Plataforma do Cliente, prontos a publicar.' },
  { n: 8, titulo: 'Feedback e Resultados', desc: 'Recolhemos a tua avaliação e analisamos o impacto da comunicação.' },
]

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
      const t = setTimeout(() => window.print(), 800)
      return () => clearTimeout(t)
    }
  }, [loaded, orcamento])

  if (loaded && !orcamento) {
    return (
      <main style={{ minHeight: '100vh', background: PAPER, color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: NAVY, letterSpacing: '0.4em', textTransform: 'uppercase', marginBottom: 16, fontWeight: 700 }}>RL PROD</p>
          <p style={{ fontSize: 18 }}>Orçamento não encontrado.</p>
          <p style={{ fontSize: 12, color: SUB, marginTop: 12 }}>Os orçamentos estão guardados no browser onde foram criados.</p>
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

  const paperTexture = `
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85'/%3E%3CfeColorMatrix values='0 0 0 0 0.16  0 0 0 0 0.14  0 0 0 0 0.10  0 0 0 0.045 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")
  `

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        @media print {
          @page { size: A4; margin: 0; }
          body { background: ${PAPER} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .pdf-page { box-shadow: none !important; margin: 0 !important; break-after: page; page-break-after: always; }
          .pdf-page:last-child { break-after: auto; page-break-after: auto; }
        }
        body { background: #2b2925; }
        .pdf-root { font-family: 'Inter', -apple-system, sans-serif; }
        .serif { font-family: 'Cormorant Garamond', 'Georgia', serif; }
      `}</style>

      {/* Toolbar */}
      <div className="no-print" style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(15,15,15,0.92)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '14px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <p style={{ fontFamily: 'Inter, system-ui, sans-serif', fontSize: 11, letterSpacing: '0.4em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
          Pré visualização · {orcamento.cliente}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => window.history.back()}
            style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '8px 18px', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: 'pointer', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            ‹ Voltar
          </button>
          <button onClick={() => window.print()}
            style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '8px 20px', background: NAVY, color: PAPER, border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 11, cursor: 'pointer', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            ⎙ Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      <main className="pdf-root" style={{ minHeight: '100vh', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

        {/* ─── PÁGINA 1 · CAPA ────────────────────────────────────── */}
        <PdfPage texture={paperTexture}>
          <div style={{ height: 5, background: `linear-gradient(90deg, ${NAVY_DEEP} 0%, ${NAVY} 50%, ${NAVY_DEEP} 100%)` }} />

          <header style={{ padding: '20mm 22mm 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-rl-prod-accent.png" alt="RL PROD"
                style={{ width: 60, height: 60, objectFit: 'contain' }} />
              <div style={{ paddingTop: 4 }}>
                <p style={{ fontSize: 8, letterSpacing: '0.55em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
                  Photography &amp; Video (for brands)
                </p>
                <p style={{ fontSize: 21, letterSpacing: '0.4em', textTransform: 'uppercase', color: NAVY_DEEP, margin: '5px 0 0', fontWeight: 700 }}>
                  RL PROD
                </p>
                <p style={{ fontSize: 9, color: SUB, margin: '8px 0 0', letterSpacing: '0.04em' }}>
                  geral@rlphotovideo.pt &nbsp;·&nbsp; www.rlprod.pt
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
                Proposta de Orçamento
              </p>
              <p className="serif" style={{ fontSize: 24, color: NAVY_DEEP, margin: '6px 0 0', fontWeight: 500, fontStyle: 'italic' }}>
                Nº {num}
              </p>
              <p style={{ fontSize: 10, color: SUB, margin: '8px 0 0' }}>Emitido em {dataDeHoje()}</p>
              {orcamento.validade && <p style={{ fontSize: 10, color: SUB, margin: '2px 0 0' }}>Válido até {fmtData(orcamento.validade)}</p>}
            </div>
          </header>

          {/* Centro — Cliente em destaque grande */}
          <section style={{ padding: '40mm 22mm 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ height: 2, background: NAVY, width: 60, marginBottom: 18 }} />
            <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 700 }}>
              Proposta apresentada a
            </p>
            <h1 className="serif" style={{
              fontSize: 64, color: NAVY_DEEP, margin: '12px 0 0', fontWeight: 500,
              lineHeight: 1.0, letterSpacing: '-0.02em',
            }}>
              {orcamento.cliente}
            </h1>

            {(orcamento.contacto || orcamento.email) && (
              <p style={{ fontSize: 13, color: SUB, margin: '18px 0 0', letterSpacing: '0.02em' }}>
                {orcamento.contacto && <span>{orcamento.contacto}</span>}
                {orcamento.contacto && orcamento.email && <span style={{ color: NAVY, margin: '0 10px' }}>·</span>}
                {orcamento.email && <span>{orcamento.email}</span>}
              </p>
            )}

            {/* Dados do evento */}
            <div style={{
              marginTop: 36,
              border: `1px solid ${LINE}`, borderLeft: `3px solid ${NAVY}`,
              padding: '14px 20px', background: PAPER_SOFT,
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
              borderRadius: 2,
            }}>
              <div>
                <p style={{ fontSize: 8, letterSpacing: '0.45em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>Data do Evento</p>
                <p style={{ fontSize: 14, color: INK, margin: '4px 0 0', fontWeight: 600 }}>
                  {fmtIntervaloEvento(orcamento.data_inicio, orcamento.data_fim)}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 8, letterSpacing: '0.45em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>Cobertura</p>
                <p style={{ fontSize: 14, color: INK, margin: '4px 0 0', fontWeight: 600 }}>
                  {orcamento.cobertura ?? 'A definir'}
                </p>
              </div>
            </div>

            {orcamento.resumo && (
              <div style={{ marginTop: 26 }}>
                <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: NAVY, margin: '0 0 6px', fontWeight: 700 }}>
                  Resumo
                </p>
                <p style={{ fontSize: 12, lineHeight: 1.65, color: SUB, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {orcamento.resumo}
                </p>
              </div>
            )}
          </section>

          {/* Footer capa */}
          <footer style={{ position: 'absolute', bottom: '12mm', left: '22mm', right: '22mm', paddingTop: 10, borderTop: `1px solid ${LINE}`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
              More than a product, an experience.
            </p>
            <p style={{ fontSize: 9, color: NAVY, margin: 0, letterSpacing: '0.12em', fontWeight: 600 }}>
              01 · Capa
            </p>
          </footer>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${NAVY_DEEP} 0%, ${NAVY} 50%, ${NAVY_DEEP} 100%)` }} />
        </PdfPage>

        {/* ─── PÁGINA 2 · PROPOSTAS ───────────────────────────────── */}
        <PdfPage texture={paperTexture}>
          <PageHeader num={num} cliente={orcamento.cliente} />

          <section style={{ padding: '6mm 22mm 0' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
              Investimento
            </p>
            <h2 className="serif" style={{ fontSize: 36, color: NAVY_DEEP, margin: '6px 0 0', fontWeight: 500, lineHeight: 1.05 }}>
              {orcamento.propostas.length === 1 ? 'A Nossa Proposta' : `${orcamento.propostas.length} Propostas`}
            </h2>
            <p style={{ fontSize: 11, color: SUB, margin: '6px 0 0', fontStyle: 'italic' }}>
              {orcamento.propostas.length === 1
                ? 'Cobertura integral, com tudo o que precisas para uma comunicação de excelência.'
                : 'Apresentamos alternativas para que escolhas a que melhor se adapta ao teu briefing.'}
            </p>
          </section>

          <section style={{ padding: '8mm 22mm 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {orcamento.propostas.map((p, i) => (
              <PropostaBlock key={p.id} proposta={p} numero={i + 1} />
            ))}

            {orcamento.propostas.length > 1 && (
              <p style={{ marginTop: 4, fontSize: 10.5, color: SUB, fontStyle: 'italic', textAlign: 'right' }}>
                Investimento {totalRange.min === totalRange.max
                  ? fmtEur(totalRange.max)
                  : `entre ${fmtEur(totalRange.min)} e ${fmtEur(totalRange.max)}`}, valores líquidos sem IVA.
              </p>
            )}
          </section>

          <PageFooter num={num} pagina="02 · Investimento" />
        </PdfPage>

        {/* ─── PÁGINA 3 · PROCESSO + CONDIÇÕES ────────────────────── */}
        <PdfPage texture={paperTexture}>
          <PageHeader num={num} cliente={orcamento.cliente} />

          {/* O Nosso Processo */}
          <section style={{ padding: '6mm 22mm 0' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
              Como Trabalhamos
            </p>
            <h2 className="serif" style={{ fontSize: 32, color: NAVY_DEEP, margin: '6px 0 0', fontWeight: 500, lineHeight: 1.05 }}>
              O Nosso Processo
            </h2>
            <p style={{ fontSize: 11, color: SUB, margin: '6px 0 14px', fontStyle: 'italic' }}>
              Oito etapas, do primeiro briefing aos resultados finais.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 22px' }}>
              {PROCESSO.map(p => (
                <div key={p.n} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 10, alignItems: 'flex-start' }}>
                  <span className="serif" style={{
                    fontSize: 26, color: NAVY, fontWeight: 500, fontStyle: 'italic',
                    lineHeight: 1, letterSpacing: '-0.02em',
                  }}>
                    {String(p.n).padStart(2, '0')}
                  </span>
                  <div>
                    <p style={{ fontSize: 11, color: INK, margin: 0, fontWeight: 700, letterSpacing: '0.005em', textTransform: 'uppercase' }}>
                      {p.titulo}
                    </p>
                    <p style={{ fontSize: 10, color: SUB, margin: '3px 0 0', lineHeight: 1.5 }}>
                      {p.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Condições */}
          <section style={{ padding: '12mm 22mm 0' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
              Termos
            </p>
            <h2 className="serif" style={{ fontSize: 28, color: NAVY_DEEP, margin: '6px 0 14px', fontWeight: 500, lineHeight: 1.05 }}>
              Condições Comerciais
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 22px' }}>
              <Condicao titulo="Validade da Proposta">
                {orcamento.validade
                  ? `Esta proposta mantém-se válida até ${fmtData(orcamento.validade)}.`
                  : 'Proposta válida por 30 dias após a data de emissão.'}
              </Condicao>
              <Condicao titulo="Pagamento">
                50 por cento na adjudicação do serviço, 40 por cento na véspera do evento e 10 por cento na entrega final dos materiais.
              </Condicao>
              <Condicao titulo="Impostos">
                Os valores apresentados não incluem IVA à taxa em vigor.
              </Condicao>
              <Condicao titulo="Confirmação">
                Datas e disponibilidade ficam reservadas após assinatura de contrato.
              </Condicao>
              <Condicao titulo="Confidencialidade" full>
                Todo o conteúdo desta proposta, incluindo anexos, design, conceito e imagem, é propriedade da RL PROD. Ao avaliar esta proposta, o cliente concorda em não divulgar o conteúdo deste documento, total ou parcialmente, a qualquer outra entidade.
              </Condicao>
            </div>
          </section>

          {/* Assinatura / contacto */}
          <section style={{ position: 'absolute', bottom: '24mm', left: '22mm', right: '22mm', paddingTop: 14, borderTop: `1px solid ${LINE}` }}>
            <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
              Vamos falar
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24, marginTop: 8, alignItems: 'flex-end' }}>
              <div>
                <p className="serif" style={{ fontSize: 22, color: NAVY_DEEP, margin: 0, fontWeight: 500, lineHeight: 1.1 }}>
                  Obrigado pela confiança.
                </p>
                <p style={{ fontSize: 11, color: SUB, margin: '8px 0 0', lineHeight: 1.55, fontStyle: 'italic' }}>
                  Estamos disponíveis para qualquer esclarecimento adicional ou ajuste à proposta.
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 8, letterSpacing: '0.45em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
                  Contacto
                </p>
                <p style={{ fontSize: 11, color: INK, margin: '6px 0 0', fontWeight: 600 }}>
                  geral@rlphotovideo.pt
                </p>
                <p style={{ fontSize: 11, color: INK, margin: '2px 0 0', fontWeight: 600 }}>
                  www.rlprod.pt
                </p>
              </div>
            </div>
          </section>

          <PageFooter num={num} pagina="03 · Termos" />
        </PdfPage>

      </main>
    </>
  )

  /* helpers locais para texture */
  function PdfPage({ children, texture }: { children: React.ReactNode; texture: string }) {
    return (
      <div className="pdf-page" style={{
        width: '210mm', minHeight: '297mm',
        background: PAPER, color: INK,
        boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
        position: 'relative', overflow: 'hidden',
        backgroundImage: texture,
        backgroundBlendMode: 'multiply',
        display: 'flex', flexDirection: 'column',
      }}>
        {children}
      </div>
    )
  }
}

/* ─── Page header (páginas 2 e 3) ─────────────────────────────────────────── */

function PageHeader({ num, cliente }: { num: string; cliente: string }) {
  return (
    <>
      <div style={{ height: 5, background: `linear-gradient(90deg, ${NAVY_DEEP} 0%, ${NAVY} 50%, ${NAVY_DEEP} 100%)` }} />
      <header style={{ padding: '16mm 22mm 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-rl-prod-accent.png" alt="RL PROD"
            style={{ width: 38, height: 38, objectFit: 'contain' }} />
          <div style={{ paddingTop: 2 }}>
            <p style={{ fontSize: 7, letterSpacing: '0.55em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
              Photography &amp; Video
            </p>
            <p style={{ fontSize: 13, letterSpacing: '0.4em', textTransform: 'uppercase', color: NAVY_DEEP, margin: '3px 0 0', fontWeight: 700 }}>
              RL PROD
            </p>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 600 }}>
            Proposta Nº {num}
          </p>
          <p style={{ fontSize: 10, color: SUB, margin: '4px 0 0', fontWeight: 500 }}>
            {cliente}
          </p>
        </div>
      </header>
      <div style={{ margin: '8mm 22mm 0', height: 1, background: LINE }} />
      <div style={{ margin: '0 22mm', height: 2, background: NAVY, width: 48 }} />
    </>
  )
}

function PageFooter({ num, pagina }: { num: string; pagina: string }) {
  return (
    <>
      <footer style={{
        position: 'absolute', bottom: '12mm', left: '22mm', right: '22mm',
        paddingTop: 8, borderTop: `1px solid ${LINE}`,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <p style={{ fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
          RL Prod &nbsp;·&nbsp; geral@rlphotovideo.pt &nbsp;·&nbsp; www.rlprod.pt
        </p>
        <p style={{ fontSize: 9, color: NAVY, margin: 0, letterSpacing: '0.12em', fontWeight: 600 }}>
          {pagina}
        </p>
      </footer>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${NAVY_DEEP} 0%, ${NAVY} 50%, ${NAVY_DEEP} 100%)` }} />
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
      background: PAPER_SOFT,
      breakInside: 'avoid',
      position: 'relative',
    }}>
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 16, paddingBottom: 10, borderBottom: `1px solid ${LINE}`,
      }}>
        <div style={{ minWidth: 0, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span className="serif" style={{
            fontSize: 36, color: NAVY, fontStyle: 'italic', fontWeight: 500,
            lineHeight: 1, letterSpacing: '-0.02em',
          }}>
            {String(numero).padStart(2, '0')}
          </span>
          <div>
            <p style={{ fontSize: 8, letterSpacing: '0.45em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 700 }}>Proposta</p>
            <h3 className="serif" style={{ fontSize: 22, color: NAVY_DEEP, margin: '2px 0 0', fontWeight: 500, lineHeight: 1.15 }}>
              {proposta.titulo || 'Proposta'}
            </h3>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 700 }}>Investimento</p>
          <p className="serif" style={{ fontSize: 28, color: NAVY_DEEP, margin: '2px 0 0', fontWeight: 600, letterSpacing: '-0.01em' }}>
            {fmtEur(proposta.valor)}
          </p>
        </div>
      </div>

      {proposta.servicos.length > 0 && (
        <div style={{ paddingTop: 12 }}>
          <p style={{ fontSize: 8, letterSpacing: '0.45em', textTransform: 'uppercase', color: NAVY, margin: '0 0 8px', fontWeight: 700 }}>
            Incluído nesta proposta
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {proposta.servicos.map((s, idx) => (
              <li key={s.catalogId} style={{
                padding: '9px 0',
                borderBottom: idx === proposta.servicos.length - 1 ? 'none' : `1px solid ${LINE_SOFT}`,
                display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10, alignItems: 'flex-start',
              }}>
                <span style={{
                  fontFamily: 'Inter, system-ui, sans-serif', fontSize: 10, color: NAVY,
                  fontWeight: 800, lineHeight: 1.4, letterSpacing: '0.05em', paddingTop: 1,
                }}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div>
                  <p style={{ fontSize: 11.5, color: INK, margin: 0, fontWeight: 600 }}>
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
          marginTop: 12, paddingTop: 10, borderTop: `1px solid ${LINE}`,
          fontSize: 10, lineHeight: 1.55, color: SUB, fontStyle: 'italic',
        }}>
          {proposta.descricao}
        </p>
      )}
    </article>
  )
}

function Condicao({ titulo, children, full }: { titulo: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div style={{ borderLeft: `2px solid ${NAVY}`, paddingLeft: 12, gridColumn: full ? '1 / -1' : undefined }}>
      <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: NAVY_DEEP, margin: 0, fontWeight: 700 }}>
        {titulo}
      </p>
      <p style={{ fontSize: 10.5, color: SUB, margin: '4px 0 0', lineHeight: 1.55 }}>
        {children}
      </p>
    </div>
  )
}
