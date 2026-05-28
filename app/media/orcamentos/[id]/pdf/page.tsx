'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

/* ─────────────────────────────────────────────────────────────────────────── *
 *  RL PROD · Proposta de Orçamento · Edição Editorial
 *
 *  Linguagem visual: arquitectónica / magazine
 *    · Coluna vertical de acento navy à esquerda (8mm) em todas as páginas
 *    · Tipografia massiva em momentos chave (cliente, números, títulos)
 *    · Hierarquia por escala e peso, sem caixas
 *    · Régua horizontal a separar blocos
 *
 *  Cores extraídas da identidade oficial RL PROD:
 *    Papel creme texturado + azul-marinho profundo do logo.
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

/* ─── Paleta — RL PROD oficial ─── */
const PAPER       = '#e3ded2'   // creme texturado mais frio
const PAPER_SOFT  = '#ece8dc'   // ligeira variação para superfícies
const PAPER_DEEP  = '#d3ccbd'   // tons mais profundos
const NAVY        = '#2A4D6E'   // azul marinho exacto do logo
const NAVY_DEEP   = '#1B3552'   // navy profundo (títulos)
const NAVY_SOFT   = '#456a8a'   // acento secundário
const INK         = '#15181c'   // tinta principal
const SUB         = '#4a4640'   // texto secundário
const MUTE        = '#7c766a'   // texto subtil
const LINE        = 'rgba(42,77,110,0.22)'
const LINE_SOFT   = 'rgba(42,77,110,0.10)'

/* ─── helpers ─── */
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

const PROCESSO = [
  { titulo: 'Briefing e Imersão',     desc: 'Recebemos o briefing, mergulhamos na marca e no contexto do evento.' },
  { titulo: 'Proposta',               desc: 'Desenvolvemos uma visão completa, técnica e estratégica para a comunicação.' },
  { titulo: 'Planeamento',            desc: 'Definimos como e quando tudo acontece, com mapa de captação e logística.' },
  { titulo: 'Produção',               desc: 'Captação no terreno com equipa e equipamento dedicados ao evento.' },
  { titulo: 'Edição',                 desc: 'Montagem narrativa, correcção de cor, mistura de áudio e exportação final.' },
  { titulo: 'Aprovação',              desc: 'Primeira versão apresentada, feedback recolhido, ajustes integrados.' },
  { titulo: 'Entrega',                desc: 'Conteúdos finais entregues via Plataforma do Cliente, prontos a publicar.' },
  { titulo: 'Feedback e Resultados',  desc: 'Avaliação do percurso e análise do impacto da comunicação.' },
]

/* ─── Page ────────────────────────────────────────────────────────────────── */

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
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='320'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.92'/%3E%3CfeColorMatrix values='0 0 0 0 0.16  0 0 0 0 0.14  0 0 0 0 0.10  0 0 0 0.05 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")
  `

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Inter:wght@300;400;500;600;700;800&display=swap');
        @media print {
          @page { size: A4; margin: 0; }
          body { background: ${PAPER} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .pdf-page { box-shadow: none !important; margin: 0 !important; break-after: page; page-break-after: always; }
          .pdf-page:last-child { break-after: auto; page-break-after: auto; }
        }
        body { background: #2a2825; }
        .pdf-root { font-family: 'Inter', -apple-system, sans-serif; }
        .serif { font-family: 'Cormorant Garamond', 'Georgia', serif; }
        .mono { font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace; }
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

        {/* ─────────────────── PÁGINA 1 · CAPA ─────────────────── */}
        <Page texture={paperTexture}>
          {/* Coluna vertical de acento à esquerda */}
          <SideRail num={num} pagina="01 / 03" />

          {/* Top tagline */}
          <div style={{ position: 'absolute', top: '14mm', left: 0, right: '18mm', display: 'flex', justifyContent: 'flex-end' }}>
            <p style={{ fontSize: 8, letterSpacing: '0.6em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
              Proposta de Orçamento · {num}
            </p>
          </div>

          {/* Centro — logo grande + cliente massivo */}
          <section style={{ paddingLeft: '32mm', paddingRight: '22mm', paddingTop: '40mm', display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-rl-prod-accent.png" alt="RL PROD"
                style={{ width: 80, height: 80, objectFit: 'contain' }} />
              <div>
                <p style={{ fontSize: 9, letterSpacing: '0.55em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
                  Photography &amp; Video (for brands)
                </p>
                <p style={{ fontSize: 26, letterSpacing: '0.4em', textTransform: 'uppercase', color: NAVY_DEEP, margin: '5px 0 0', fontWeight: 700 }}>
                  RL PROD
                </p>
              </div>
            </div>

            {/* Espaço vertical largo */}
            <div style={{ flex: 1, minHeight: 60 }} />

            {/* Linha mestre */}
            <div style={{ height: 1, background: LINE, marginBottom: 26 }} />

            <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 700 }}>
              Proposta apresentada a
            </p>
            <h1 className="serif" style={{
              fontSize: 78, color: NAVY_DEEP, margin: '14px 0 0', fontWeight: 500,
              lineHeight: 0.98, letterSpacing: '-0.025em',
            }}>
              {orcamento.cliente}
            </h1>

            {(orcamento.contacto || orcamento.email) && (
              <p style={{ fontSize: 12, color: SUB, margin: '20px 0 0', letterSpacing: '0.02em' }}>
                {orcamento.contacto && <span>{orcamento.contacto}</span>}
                {orcamento.contacto && orcamento.email && <span className="mono" style={{ color: NAVY, margin: '0 10px', fontWeight: 700 }}>/</span>}
                {orcamento.email && <span>{orcamento.email}</span>}
              </p>
            )}

            {/* Bloco de metadata em régua horizontal */}
            <div style={{ marginTop: 38, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, borderTop: `1px solid ${NAVY_DEEP}` }}>
              <Meta label="Data do Evento" value={fmtIntervaloEvento(orcamento.data_inicio, orcamento.data_fim)} />
              <Meta label="Cobertura" value={orcamento.cobertura ?? 'A definir'} divider />
              <Meta label="Validade" value={orcamento.validade ? fmtData(orcamento.validade) : '30 dias após emissão'} divider />
            </div>

            {orcamento.resumo && (
              <div style={{ marginTop: 34, maxWidth: '78%' }}>
                <p style={{ fontSize: 9, letterSpacing: '0.45em', textTransform: 'uppercase', color: NAVY, margin: '0 0 8px', fontWeight: 700 }}>
                  Resumo
                </p>
                <p style={{ fontSize: 12, lineHeight: 1.7, color: SUB, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {orcamento.resumo}
                </p>
              </div>
            )}
          </section>

          {/* Footer capa */}
          <CoverFooter />
        </Page>

        {/* ─────────────────── PÁGINA 2 · INVESTIMENTO ─────────────────── */}
        <Page texture={paperTexture}>
          <SideRail num={num} pagina="02 / 03" />
          <PageTopBar num={num} cliente={orcamento.cliente} secao="Investimento" />

          <section style={{ paddingLeft: '32mm', paddingRight: '22mm', paddingTop: '8mm' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
              {orcamento.propostas.length === 1 ? 'A Nossa Proposta' : 'As Nossas Propostas'}
            </p>
            <h2 className="serif" style={{ fontSize: 48, color: NAVY_DEEP, margin: '8px 0 0', fontWeight: 500, lineHeight: 1.0, letterSpacing: '-0.02em' }}>
              Investimento.
            </h2>
            <p style={{ fontSize: 11.5, color: SUB, margin: '10px 0 22px', fontStyle: 'italic', maxWidth: '72%', lineHeight: 1.55 }}>
              {orcamento.propostas.length === 1
                ? 'Cobertura integral, com tudo o que precisas para uma comunicação de excelência.'
                : 'Apresentamos alternativas para que escolhas a que melhor se adapta ao briefing e ao impacto pretendido.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {orcamento.propostas.map((p, i) => (
                <PropostaEditorial key={p.id} proposta={p} numero={i + 1} />
              ))}
            </div>

            {orcamento.propostas.length > 1 && (
              <p style={{ marginTop: 14, fontSize: 10.5, color: SUB, fontStyle: 'italic', textAlign: 'right' }}>
                Investimento {totalRange.min === totalRange.max
                  ? fmtEur(totalRange.max)
                  : `entre ${fmtEur(totalRange.min)} e ${fmtEur(totalRange.max)}`}, valores líquidos sem IVA.
              </p>
            )}
          </section>

          <PageBottomBar />
        </Page>

        {/* ─────────────────── PÁGINA 3 · PROCESSO + TERMOS ─────────────────── */}
        <Page texture={paperTexture}>
          <SideRail num={num} pagina="03 / 03" />
          <PageTopBar num={num} cliente={orcamento.cliente} secao="Processo · Termos" />

          {/* Processo */}
          <section style={{ paddingLeft: '32mm', paddingRight: '22mm', paddingTop: '8mm' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
              Como Trabalhamos
            </p>
            <h2 className="serif" style={{ fontSize: 44, color: NAVY_DEEP, margin: '6px 0 0', fontWeight: 500, lineHeight: 1.0, letterSpacing: '-0.02em' }}>
              O Nosso Processo.
            </h2>
            <p style={{ fontSize: 11, color: SUB, margin: '10px 0 18px', fontStyle: 'italic' }}>
              Oito etapas, do primeiro briefing aos resultados finais.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 28px' }}>
              {PROCESSO.map((p, i) => (
                <div key={i} style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr',
                  gap: 12,
                  alignItems: 'flex-start',
                  paddingTop: 8,
                  borderTop: `1px solid ${LINE_SOFT}`,
                }}>
                  <span className="mono" style={{
                    fontSize: 14, color: NAVY, fontWeight: 700,
                    lineHeight: 1, letterSpacing: '0.05em',
                    paddingTop: 2,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p style={{ fontSize: 11, color: INK, margin: 0, fontWeight: 700, letterSpacing: '0.015em', textTransform: 'uppercase' }}>
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
          <section style={{ paddingLeft: '32mm', paddingRight: '22mm', paddingTop: '12mm' }}>
            <p style={{ fontSize: 10, letterSpacing: '0.5em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
              Termos
            </p>
            <h2 className="serif" style={{ fontSize: 36, color: NAVY_DEEP, margin: '6px 0 14px', fontWeight: 500, lineHeight: 1.0, letterSpacing: '-0.02em' }}>
              Condições Comerciais.
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 28px' }}>
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

          {/* Closing */}
          <section style={{ position: 'absolute', bottom: '26mm', left: '32mm', right: '22mm', paddingTop: 12, borderTop: `1px solid ${NAVY_DEEP}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24, marginTop: 14, alignItems: 'flex-end' }}>
              <div>
                <p className="serif" style={{ fontSize: 24, color: NAVY_DEEP, margin: 0, fontWeight: 500, lineHeight: 1.1, fontStyle: 'italic' }}>
                  Obrigado pela confiança.
                </p>
                <p style={{ fontSize: 11, color: SUB, margin: '8px 0 0', lineHeight: 1.55 }}>
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

          <PageBottomBar />
        </Page>

      </main>
    </>
  )
}

/* ─── Page shell ──────────────────────────────────────────────────────────── */

function Page({ children, texture }: { children: React.ReactNode; texture: string }) {
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

/* ─── Lateral fixa — coluna navy + paginação rotacionada ──────────────────── */

function SideRail({ num, pagina }: { num: string; pagina: string }) {
  return (
    <>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '6mm',
        background: NAVY,
      }} />
      <div style={{
        position: 'absolute', left: '6mm', top: 0, bottom: 0, width: '1px',
        background: LINE,
      }} />
      <p style={{
        position: 'absolute', left: '8mm', bottom: '14mm', margin: 0,
        fontSize: 8, letterSpacing: '0.55em', textTransform: 'uppercase',
        color: NAVY_DEEP, fontWeight: 700,
        transform: 'rotate(-90deg)', transformOrigin: 'left bottom',
        whiteSpace: 'nowrap',
      }}>
        Pág. {pagina} · Nº {num}
      </p>
    </>
  )
}

function PageTopBar({ num, cliente, secao }: { num: string; cliente: string; secao: string }) {
  return (
    <div style={{
      position: 'absolute', top: '14mm', left: '32mm', right: '22mm',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingBottom: 6, borderBottom: `1px solid ${LINE}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-rl-prod-accent.png" alt="RL PROD"
          style={{ width: 28, height: 28, objectFit: 'contain' }} />
        <p style={{ fontSize: 10, letterSpacing: '0.4em', textTransform: 'uppercase', color: NAVY_DEEP, margin: 0, fontWeight: 700 }}>
          RL PROD
        </p>
      </div>
      <div style={{ textAlign: 'right' }}>
        <p style={{ fontSize: 8, letterSpacing: '0.45em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 700 }}>
          {secao}
        </p>
        <p style={{ fontSize: 9, color: SUB, margin: '2px 0 0', fontStyle: 'italic' }}>
          {cliente} · Nº {num}
        </p>
      </div>
    </div>
  )
}

function PageBottomBar() {
  return (
    <p style={{
      position: 'absolute', bottom: '8mm', left: '32mm', right: '22mm', textAlign: 'center',
      margin: 0, fontSize: 8, letterSpacing: '0.5em', textTransform: 'uppercase', color: MUTE, fontWeight: 600,
    }}>
      geral@rlphotovideo.pt · www.rlprod.pt
    </p>
  )
}

function CoverFooter() {
  return (
    <footer style={{
      position: 'absolute', bottom: '12mm', left: '32mm', right: '22mm',
      paddingTop: 10, borderTop: `1px solid ${LINE}`,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
    }}>
      <p className="serif" style={{ fontSize: 14, color: NAVY_DEEP, margin: 0, fontStyle: 'italic', fontWeight: 500 }}>
        More than a product, an experience.
      </p>
      <p style={{ fontSize: 9, color: NAVY, margin: 0, letterSpacing: '0.4em', textTransform: 'uppercase', fontWeight: 700 }}>
        Emitido em {dataDeHoje()}
      </p>
    </footer>
  )
}

/* ─── Meta (cell na barra horizontal da capa) ─────────────────────────────── */

function Meta({ label, value, divider }: { label: string; value: string; divider?: boolean }) {
  return (
    <div style={{ padding: '14px 16px 0', borderLeft: divider ? `1px solid ${LINE}` : undefined }}>
      <p style={{ fontSize: 8, letterSpacing: '0.45em', textTransform: 'uppercase', color: NAVY, margin: 0, fontWeight: 700 }}>
        {label}
      </p>
      <p style={{ fontSize: 13, color: INK, margin: '6px 0 0', fontWeight: 600 }}>
        {value}
      </p>
    </div>
  )
}

/* ─── Proposta · Editorial vertical layout ────────────────────────────────── */

function PropostaEditorial({ proposta, numero }: { proposta: Proposta; numero: number }) {
  return (
    <article style={{
      paddingTop: 14,
      borderTop: `2px solid ${NAVY_DEEP}`,
      breakInside: 'avoid',
    }}>
      {/* Header */}
      <header style={{ display: 'grid', gridTemplateColumns: '70px 1fr auto', gap: 14, alignItems: 'flex-start', marginBottom: 12 }}>
        <span className="serif" style={{
          fontSize: 56, color: NAVY, fontStyle: 'italic', fontWeight: 500,
          lineHeight: 0.85, letterSpacing: '-0.04em', display: 'block',
        }}>
          {String(numero).padStart(2, '0')}
        </span>
        <div style={{ minWidth: 0, paddingTop: 8 }}>
          <p style={{ fontSize: 8, letterSpacing: '0.45em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 700 }}>
            Proposta {String(numero).padStart(2, '0')}
          </p>
          <h3 className="serif" style={{ fontSize: 28, color: NAVY_DEEP, margin: '2px 0 0', fontWeight: 500, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            {proposta.titulo || 'Proposta'}
          </h3>
        </div>
        <div style={{ textAlign: 'right', paddingTop: 8 }}>
          <p style={{ fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: MUTE, margin: 0, fontWeight: 700 }}>
            Investimento
          </p>
          <p className="serif" style={{ fontSize: 34, color: NAVY_DEEP, margin: '2px 0 0', fontWeight: 600, letterSpacing: '-0.015em', lineHeight: 1 }}>
            {fmtEur(proposta.valor)}
          </p>
        </div>
      </header>

      {/* Lista de serviços */}
      {proposta.servicos.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px',
          padding: '4px 0 0 70px',
        }}>
          {proposta.servicos.map((s, idx) => (
            <div key={s.catalogId} style={{
              padding: '7px 0',
              borderBottom: `1px solid ${LINE_SOFT}`,
              display: 'grid', gridTemplateColumns: '24px 1fr', gap: 8, alignItems: 'flex-start',
            }}>
              <span className="mono" style={{
                fontSize: 9, color: NAVY, fontWeight: 700, paddingTop: 2, letterSpacing: '0.05em',
              }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div>
                <p style={{ fontSize: 11, color: INK, margin: 0, fontWeight: 600 }}>
                  {s.nome}{s.duracao ? ` · ${s.duracao}` : ''}
                </p>
                <p style={{ fontSize: 9.5, color: SUB, margin: '2px 0 0', lineHeight: 1.45 }}>
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {proposta.descricao && (
        <p style={{
          marginTop: 12, paddingTop: 10, paddingLeft: 70,
          borderTop: `1px solid ${LINE_SOFT}`,
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
    <div style={{ borderTop: `1px solid ${LINE_SOFT}`, paddingTop: 8, gridColumn: full ? '1 / -1' : undefined }}>
      <p style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', color: NAVY_DEEP, margin: 0, fontWeight: 700 }}>
        {titulo}
      </p>
      <p style={{ fontSize: 10.5, color: SUB, margin: '4px 0 0', lineHeight: 1.55 }}>
        {children}
      </p>
    </div>
  )
}
