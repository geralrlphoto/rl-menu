import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ContratoEditBar from './ContratoEditBar'
import AutoImprimir from './AutoImprimir'
import { getClausula, type ClausulasMap } from './clausulas-defaults'
import { COR, FONTE, FONTES_CSS } from '../../_lib/estilo'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type Props = { params: Promise<{ ref: string }> }

// Prestadora (dados fixos RL PROD)
const PRESTADORA = {
  nome: 'Liliana Sofia Fernandes Barreto Gonçalves (RL PROD - Photography & Video)',
  nif: '238076415',
  cae: '74200 (Atividades Fotográficas/Vídeo)',
  morada: 'Centro Comercial os Mochos Loja 136 - 2955-185 Pinhal Novo',
  email: 'geral.rlphoto@gmail.com',
  telefone: '916162728',
  iban: 'PT50 0018 0003 6110 2844 0284 0204 5',
}

// Paleta do documento (papel claro, identidade rlprod.pt)
const TINTA = '#10202d'
const MUTED = COR.cinza
const AZUL = COR.azul
const NOITE = COR.noite
const LINHA = '#dde3e9'

export default async function ContratoPage({ params }: Props) {
  const { ref } = await params
  const refUp = ref.toUpperCase()

  const { data } = await supabase
    .from('media_portais')
    .select('dados')
    .eq('ref', refUp)
    .single()

  if (!data?.dados?.contrato?.gerado) notFound()

  const cookieStore = await cookies()
  const isAdmin = cookieStore.get('rl_auth')?.value === process.env.AUTH_SECRET

  const ficha = data.dados.ficha ?? {}
  const contrato = data.dados.contrato ?? {}
  const clausulas: ClausulasMap = data.dados.clausulas ?? {}
  const clausulasRemovidas: string[] = data.dados.clausulasRemovidas ?? []
  const clausulasCustom: { id: string; titulo: string; texto: string }[] = data.dados.clausulasCustom ?? []

  // Renderiza linhas de uma cláusula: "1." a negrito, resto como ClauseText
  const renderLines = (text: string) =>
    text.split('\n').filter(Boolean).map((line, i) =>
      /^\d+\./.test(line.trim())
        ? <BodyText key={i} style={{ fontWeight: 600, marginTop: 14, color: TINTA }}>{line}</BodyText>
        : <ClauseText key={i}>{line}</ClauseText>
    )

  // Renderiza cláusula com override do Supabase ou texto padrão
  const rc = (key: string) => renderLines(getClausula(clausulas, key))

  // Renderiza cláusula com título (devolve null se removida)
  const rct = (key: string, titulo: string, num?: string) =>
    clausulasRemovidas.includes(key) ? null : (
      <section className="clausula">
        <ClauseTitle num={num}>{titulo}</ClauseTitle>
        {rc(key)}
      </section>
    )

  // Renderiza cláusula sem título (devolve null se removida)
  const rcm = (key: string) => clausulasRemovidas.includes(key) ? null : rc(key)

  const valorNum = parseFloat(String(ficha.orcamento || '').replace(/[^\d.,]/g, '').replace(',', '.')) || 0
  const val80 = (valorNum * 0.8).toLocaleString('pt-PT', { minimumFractionDigits: 2 })
  const val20 = (valorNum * 0.2).toLocaleString('pt-PT', { minimumFractionDigits: 2 })
  const valorTotal = valorNum.toLocaleString('pt-PT', { minimumFractionDigits: 2 })

  const servicosList: string[] = ficha.servicosList
    ? ficha.servicosList.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : []

  const profissionaisList: string[] = ficha.profissionaisList
    ? ficha.profissionaisList.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : []

  const metodoPagamentoList: string[] = ficha.metodoPagamento
    ? ficha.metodoPagamento.split('\n').map((s: string) => s.trim()).filter(Boolean)
    : []

  const clienteNome = ficha.nome || ficha.empresa || refUp
  const clienteEmpresa = ficha.empresa || ficha.nome || ''

  const dataDoc = contrato.geradoEm || new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <>
      <link rel="stylesheet" href={FONTES_CSS} precedence="default" />
      <AutoImprimir />
      <ContratoEditBar
        refUp={refUp}
        contrato={contrato}
        fichaInit={ficha}
        clausulasInit={clausulas}
        removidas_init={clausulasRemovidas}
        custom_init={clausulasCustom}
        isAdmin={isAdmin}
      />

      <style>{`
        .contrato-mesa { background: #e7ebef; padding: 40px 16px 64px; min-height: 100vh; }
        .contrato-papel {
          max-width: 820px; margin: 0 auto; background: #ffffff; color: ${TINTA};
          box-shadow: 0 1px 2px rgba(16,32,45,0.08), 0 12px 40px rgba(16,32,45,0.14);
          font-family: ${FONTE.texto};
        }
        .contrato-papel *, .contrato-papel *::before, .contrato-papel *::after { box-sizing: border-box; }
        .contrato-corpo { padding: 48px 64px 32px; }
        .contrato-banda { padding: 36px 64px 32px; }
        .contrato-partes { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
        .contrato-assin { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; }
        .clausula { margin-top: 30px; }
        .clausula-titulo { break-after: avoid; page-break-after: avoid; break-inside: avoid; page-break-inside: avoid; }
        .contrato-papel p, .contrato-papel li { orphans: 3; widows: 3; }
        .bloco-inteiro { break-inside: avoid; page-break-inside: avoid; }
        .quebra { break-before: page; page-break-before: always; }
        @media (max-width: 640px) {
          .contrato-mesa { padding: 0; }
          .contrato-corpo { padding: 32px 20px 24px; }
          .contrato-banda { padding: 28px 20px 24px; }
          .contrato-partes, .contrato-assin { grid-template-columns: 1fr; gap: 24px; }
        }
        @media print {
          @page {
            size: A4; margin: 18mm 18mm 20mm;
            @bottom-left { content: "RL PROD · Contrato de Prestação de Serviços"; font: 7.5pt 'JetBrains Mono', monospace; color: #7c8893; }
            @bottom-right { content: "Página " counter(page) " de " counter(pages); font: 7.5pt 'JetBrains Mono', monospace; color: #7c8893; }
          }
          html, body { background: #ffffff !important; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .contrato-mesa { background: none; padding: 0; min-height: 0; }
          .contrato-papel { max-width: none; box-shadow: none; color: #000; }
          .contrato-corpo { padding: 10mm 0 0; }
          .contrato-banda { padding: 9mm 10mm 8mm; }
          .contrato-banda, .contrato-banda * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .contrato-corpo h2, .contrato-corpo h3, .contrato-corpo p, .contrato-corpo li { color: #000 !important; }
          .contrato-rodape { margin-top: 12mm; }
        }
      `}</style>

      <div className="contrato-mesa">
        <article className="contrato-papel">

          {/* ── Capa: banda azul-noite ── */}
          <header className="contrato-banda" style={{ background: NOITE, color: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-rl-prod-branco.png" alt="RL PROD" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
              <div style={{ textAlign: 'right' }}>
                <Etiqueta cor="rgba(255,255,255,0.55)">Referência</Etiqueta>
                <div style={{ fontFamily: FONTE.mono, fontSize: 13, letterSpacing: 1, marginTop: 4 }}>{contrato.ref || refUp}</div>
              </div>
            </div>

            <div style={{ marginTop: 40 }}>
              <Etiqueta cor={COR.azulClaro}>Documento contratual</Etiqueta>
              <h1 style={{
                fontFamily: FONTE.titulo, fontWeight: 700, textTransform: 'uppercase',
                fontSize: 34, lineHeight: 1.05, letterSpacing: 0.5, margin: '10px 0 0',
              }}>
                Contrato de Prestação de Serviços
              </h1>
              <div style={{ width: 56, height: 3, background: AZUL, margin: '16px 0 14px' }} />
              <div style={{ fontFamily: FONTE.titulo, fontWeight: 600, textTransform: 'uppercase', fontSize: 18, letterSpacing: 1, color: COR.azulPalido }}>
                {clienteNome}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 40, marginTop: 28, flexWrap: 'wrap' }}>
              <div>
                <Etiqueta cor="rgba(255,255,255,0.55)">Data</Etiqueta>
                <div style={{ fontSize: 13, marginTop: 4 }}>{dataDoc}</div>
              </div>
              <div>
                <Etiqueta cor="rgba(255,255,255,0.55)">Prestadora</Etiqueta>
                <div style={{ fontSize: 13, marginTop: 4 }}>RL PROD · Photography &amp; Video</div>
              </div>
            </div>
          </header>

          <div className="contrato-corpo tinta">

            {/* ── Partes contratantes ── */}
            <SecaoTitulo>Partes contratantes</SecaoTitulo>
            <div className="contrato-partes bloco-inteiro">
              <ParteBloco papel="Contratada · Primeira Outorgante" titulo="Prestadora">
                <InfoLine label="Nome" value={PRESTADORA.nome} />
                <InfoLine label="NIF" value={PRESTADORA.nif} />
                <InfoLine label="CAE" value={PRESTADORA.cae} />
                <InfoLine label="Endereço" value={PRESTADORA.morada} />
                <InfoLine label="E-mail" value={PRESTADORA.email} />
                <InfoLine label="Telefone" value={PRESTADORA.telefone} />
              </ParteBloco>
              <ParteBloco papel="Contratante · Segunda Outorgante" titulo="Cliente">
                {clienteEmpresa && <InfoLine label="Empresa" value={clienteEmpresa.toUpperCase()} />}
                {ficha.representanteLegal && <InfoLine label="Representante legal" value={ficha.representanteLegal.toUpperCase()} />}
                {ficha.nif && <InfoLine label="NIF" value={ficha.nif} />}
                {ficha.morada && <InfoLine label="Morada" value={ficha.morada.toUpperCase()} />}
                {ficha.telefone && <InfoLine label="Contacto" value={ficha.telefone} />}
                {ficha.email && <InfoLine label="E-mail" value={ficha.email} />}
              </ParteBloco>
            </div>

            <div style={{ marginTop: 28 }}>
              <BodyText>
                Por este acordo, as partes têm entre si, contratante e contratado o que segue. A CONTRATADA é ajustada, para realizar os serviços a seguir discriminados com seus respectivos valores, o serviço de videografia e fotografia será realizado pela RL PROD - Photography & Video.
              </BodyText>
            </div>

            {/* ── Considerandos e cláusulas ── */}
            <div style={{ marginTop: 36 }}>
              <SecaoTitulo>Cláusulas</SecaoTitulo>
              {rcm('considerandos')}
            </div>
            {rct('c1', 'Primeira Cláusula', '1.ª')}
            {rct('c2_servicos', 'Segunda Cláusula', '2.ª')}
            {rcm('c2_cancelamento')}
            {rct('c3', 'Terceira Cláusula', '3.ª')}
            {rct('c4', 'Quarta Cláusula', '4.ª')}
            {rct('c5', 'Quinta Cláusula', '5.ª')}
            {rct('c6', 'Sexta Cláusula', '6.ª')}
            {rct('c7', 'Sétima Cláusula', '7.ª')}
            {rct('c8', 'Oitava Cláusula', '8.ª')}
            {rct('c9', 'Nona Cláusula', '9.ª')}
            {rct('c10', 'Décima Cláusula', '10.ª')}
            {rct('c11', 'Décima Primeira Cláusula', '11.ª')}
            {rct('c12', 'Décima Segunda Cláusula', '12.ª')}
            {rct('dos_servicos', 'Dos Serviços Contratados')}

            <section className="clausula">
              <div className="clausula-titulo">
                <BodyText style={{ fontWeight: 600, color: TINTA }}>Preços e métodos de pagamento:</BodyText>
              </div>
              {valorNum > 0 ? (
                <>
                  <ClauseText>a) Pelo serviço contratado, o cliente pagará à prestadora o montante de {valorTotal} Euros, ao qual acresce IVA à taxa legal em vigor.</ClauseText>
                  <ClauseText>b) O montante indicado no número anterior, será pago através de transferência bancária, para o IBAN {PRESTADORA.iban}, da seguinte forma:</ClauseText>
                  <div style={{ paddingLeft: 18, margin: '4px 0 12px', borderLeft: `2px solid ${LINHA}` }}>
                    <ClauseText>— Em duas prestações, de acordo com as seguintes fases de execução do serviço:</ClauseText>
                    <ClauseText>— 80% (oitenta por cento) — {val80} € — com a adjudicação do serviço, na data de celebração do presente contrato;</ClauseText>
                    <ClauseText>— 20% (vinte por cento) — {val20} € — passados sessenta dias após o primeiro dia do contrato.</ClauseText>
                  </div>
                </>
              ) : (
                <ClauseText>a) O valor dos serviços será acordado e formalizado em proposta anexa a este contrato.</ClauseText>
              )}
              <ClauseText>c) Qualquer serviço adicional, não compreendido neste contrato, poderá ser executado mediante apresentação de orçamento prévio ao cliente e aprovação.</ClauseText>
              <ClauseText>d) O não pagamento ou atraso de qualquer uma das prestações, implica a suspensão da execução do serviço, podendo a prestadora proceder à cobrança do remanescente do valor em dívida, conforme fase de desenvolvimento.</ClauseText>
            </section>

            {rct('confidencialidade', 'Confidencialidade')}
            {rct('dados_pessoais', 'Dados Pessoais')}
            {rct('lei_foro', 'Lei e Foro')}
            {rct('disposicoes_finais', 'Disposições Finais')}

            {/* Cláusulas adicionadas pelo admin */}
            {clausulasCustom.map(c => (
              <section key={c.id} className="clausula">
                <ClauseTitle>{c.titulo}</ClauseTitle>
                {renderLines(c.texto)}
              </section>
            ))}

            {/* ── Anexo I ── */}
            <div className="quebra" style={{ paddingTop: 48 }}>
              <div className="clausula-titulo" style={{ textAlign: 'center', marginBottom: 28 }}>
                <Etiqueta cor={AZUL}>Anexo</Etiqueta>
                <div style={{ fontFamily: FONTE.titulo, fontWeight: 700, fontSize: 28, letterSpacing: 2, textTransform: 'uppercase', color: TINTA, marginTop: 4 }}>
                  Anexo I
                </div>
                <div style={{ fontFamily: FONTE.titulo, fontWeight: 600, fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', color: MUTED, marginTop: 2 }}>
                  Contrato de Prestação de Serviços
                </div>
                <div style={{ width: 40, height: 2, background: AZUL, margin: '14px auto 0' }} />
              </div>

              {rc('anexo_intro')}

              <div className="clausula-titulo" style={{ marginTop: 22 }}>
                <BodyText style={{ fontWeight: 600, color: TINTA }}>Que contempla:</BodyText>
              </div>
              {servicosList.length > 0 ? (
                <ListaDoc itens={servicosList} />
              ) : (
                <ClauseText>A definir em proposta.</ClauseText>
              )}

              {profissionaisList.length > 0 && (
                <>
                  <div className="clausula-titulo" style={{ marginTop: 18 }}>
                    <BodyText style={{ fontWeight: 600, color: TINTA }}>Profissionais envolvidos:</BodyText>
                  </div>
                  <ListaDoc itens={profissionaisList} />
                </>
              )}

              {valorNum > 0 && (
                <div className="bloco-inteiro" style={{
                  marginTop: 24, padding: '16px 22px', background: '#f3f6fa',
                  borderLeft: `4px solid ${AZUL}`, display: 'flex', justifyContent: 'space-between',
                  alignItems: 'baseline', gap: 16, flexWrap: 'wrap',
                }}>
                  <Etiqueta cor={MUTED}>Investimento</Etiqueta>
                  <span style={{ fontFamily: FONTE.titulo, fontWeight: 700, fontSize: 24, letterSpacing: 0.5, color: TINTA }}>
                    {valorTotal} € <span style={{ fontSize: 15, fontWeight: 600, color: MUTED }}>+ IVA</span>
                  </span>
                </div>
              )}

              {metodoPagamentoList.length > 0 && (
                <div className="bloco-inteiro" style={{ marginTop: 24 }}>
                  <BodyText style={{ fontWeight: 600, color: TINTA }}>Plano de Pagamentos:</BodyText>
                  <div style={{ borderLeft: `2px solid ${LINHA}`, paddingLeft: 16, marginTop: 6 }}>
                    {metodoPagamentoList.map((linha, i) => (
                      <ClauseText key={i}>— {linha}</ClauseText>
                    ))}
                    <p style={{ fontFamily: FONTE.mono, fontSize: 11, color: MUTED, marginTop: 8, letterSpacing: 0.5 }}>
                      IBAN: {PRESTADORA.iban}
                    </p>
                  </div>
                </div>
              )}

              <p style={{ fontSize: 12.5, color: MUTED, marginTop: 24, fontStyle: 'italic', lineHeight: 1.6 }}>
                {getClausula(clausulas, 'anexo_nota')}
              </p>
            </div>

            {/* ── Assinaturas ── */}
            <section className="bloco-inteiro" style={{ marginTop: 44, paddingTop: 28, borderTop: `1px solid ${LINHA}` }}>
              <SecaoTitulo>Assinaturas</SecaoTitulo>
              <ClauseText>E por assim estarem ambas as partes de acordo, firmam o presente ANEXO I que integra o contrato principal, em duas vias de igual teor.</ClauseText>

              <div style={{ margin: '18px 0 44px' }}>
                <Etiqueta cor={MUTED}>Local e data</Etiqueta>
                <p style={{ fontSize: 15, color: TINTA, marginTop: 6 }}>
                  {ficha.localAssinatura || 'Lisboa'}, {dataDoc}.
                </p>
              </div>

              <div className="contrato-assin">
                {/* Cliente */}
                <div>
                  <Etiqueta cor={AZUL}>Cliente · Segunda Outorgante</Etiqueta>
                  <div style={{ height: 64, borderBottom: `1.5px solid ${TINTA}` }} />
                  <p style={{ fontFamily: FONTE.titulo, fontWeight: 700, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5, color: TINTA, margin: '10px 0 2px' }}>
                    {clienteNome}
                  </p>
                  {ficha.representanteLegal && (
                    <p style={{ fontSize: 13, color: TINTA, marginBottom: 2 }}>{ficha.representanteLegal}</p>
                  )}
                  <Etiqueta cor={MUTED}>Representante Legal</Etiqueta>
                  <div style={{
                    marginTop: 22, border: `1px dashed ${LINHA}`, height: 90,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Etiqueta cor="#b9c2ca">Carimbo</Etiqueta>
                  </div>
                </div>

                {/* RL PROD */}
                <div>
                  <Etiqueta cor={AZUL}>Prestadora · Primeira Outorgante</Etiqueta>
                  <div style={{ height: 64, borderBottom: `1.5px solid ${TINTA}` }} />
                  <p style={{ fontFamily: FONTE.titulo, fontWeight: 700, fontSize: 16, textTransform: 'uppercase', letterSpacing: 0.5, color: TINTA, margin: '10px 0 2px' }}>
                    RL PROD — Photography & Video
                  </p>
                  <p style={{ fontSize: 13, color: TINTA, marginBottom: 2 }}>Liliana Sofia Fernandes Barreto Gonçalves</p>
                  <Etiqueta cor={MUTED}>Representante Legal</Etiqueta>
                </div>
              </div>
            </section>

            {/* ── Rodapé ── */}
            <footer className="contrato-rodape" style={{
              marginTop: 48, paddingTop: 14, borderTop: `1px solid ${LINHA}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            }}>
              <Etiqueta cor={MUTED}>www.rlprod.pt · {contrato.ref || refUp}</Etiqueta>
              <Etiqueta cor={MUTED}>More than a product, an experience.</Etiqueta>
            </footer>
          </div>
        </article>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════
// Componentes auxiliares
// ══════════════════════════════════════════════════════

function Etiqueta({ children, cor }: { children: React.ReactNode; cor: string }) {
  return (
    <div style={{
      fontFamily: FONTE.mono, fontSize: 10, letterSpacing: 2.2,
      textTransform: 'uppercase', color: cor, lineHeight: 1.5,
    }}>
      {children}
    </div>
  )
}

function SecaoTitulo({ children }: { children: React.ReactNode }) {
  return (
    <div className="clausula-titulo" style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
      <h2 style={{
        fontFamily: FONTE.titulo, fontWeight: 700, fontSize: 20, letterSpacing: 1.5,
        textTransform: 'uppercase', color: TINTA, margin: 0, whiteSpace: 'nowrap',
      }}>
        {children}
      </h2>
      <div style={{ flex: 1, height: 1, background: LINHA }} />
    </div>
  )
}

function ParteBloco({ papel, titulo, children }: { papel: string; titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: `3px solid ${AZUL}`, background: '#f6f8fa', padding: '16px 18px 14px' }}>
      <Etiqueta cor={AZUL}>{papel}</Etiqueta>
      <div style={{ fontFamily: FONTE.titulo, fontWeight: 700, fontSize: 18, textTransform: 'uppercase', letterSpacing: 1, color: TINTA, margin: '4px 0 10px' }}>
        {titulo}
      </div>
      {children}
    </div>
  )
}

function ClauseTitle({ children, num }: { children: React.ReactNode; num?: string }) {
  return (
    <div className="clausula-titulo" style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${LINHA}` }}>
      {num && (
        <span style={{ fontFamily: FONTE.mono, fontSize: 12, fontWeight: 500, color: AZUL, letterSpacing: 1 }}>
          {num}
        </span>
      )}
      <h3 style={{
        fontFamily: FONTE.titulo, fontWeight: 700, fontSize: 17, letterSpacing: 1.2,
        textTransform: 'uppercase', color: TINTA, margin: 0,
      }}>
        {children}
      </h3>
    </div>
  )
}

function ClauseText({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 15,
      color: TINTA,
      lineHeight: 1.65,
      textAlign: 'justify',
      hyphens: 'auto',
      margin: '0 0 9px',
      fontFamily: FONTE.texto,
    }}>
      {children}
    </p>
  )
}

function BodyText({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{
      fontSize: 15,
      color: TINTA,
      lineHeight: 1.65,
      margin: '0 0 10px',
      fontFamily: FONTE.texto,
      ...style,
    }}>
      {children}
    </p>
  )
}

function ListaDoc({ itens }: { itens: string[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '4px 0 14px' }}>
      {itens.map((s, i) => (
        <li key={i} style={{ display: 'flex', gap: 12, fontSize: 15, lineHeight: 1.65, color: TINTA, padding: '3px 0' }}>
          <span style={{ flex: '0 0 6px', height: 6, marginTop: '0.62em', background: AZUL }} />
          <span>{s}</span>
        </li>
      ))}
    </ul>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '5px 0', borderTop: `1px solid ${LINHA}` }}>
      <div style={{ fontFamily: FONTE.mono, fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', color: MUTED }}>
        {label}
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.45, color: TINTA, wordBreak: 'break-word' }}>{value}</div>
    </div>
  )
}
