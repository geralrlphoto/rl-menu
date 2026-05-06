import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ContratoEditBar from './ContratoEditBar'
import { getClausula, type ClausulasMap } from './clausulas-defaults'

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

// Cor de destaque roxa
const PURPLE = '#9B59D0'

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

  // Renderiza linhas de uma cláusula — "1." → bold, resto → ClauseText
  const renderLines = (text: string) =>
    text.split('\n').filter(Boolean).map((line, i) =>
      /^\d+\./.test(line.trim())
        ? <BodyText key={i} style={{ fontWeight: 600, marginTop: 12 }}>{line}</BodyText>
        : <ClauseText key={i}>{line}</ClauseText>
    )

  // Renderiza cláusula com override do Supabase ou texto padrão
  const rc = (key: string) => renderLines(getClausula(clausulas, key))

  // Renderiza cláusula com título — devolve null se removida
  const rct = (key: string, titulo: string) =>
    clausulasRemovidas.includes(key) ? null : (
      <>{<ClauseTitle>{titulo}</ClauseTitle>}{rc(key)}</>
    )

  // Renderiza cláusula sem título — devolve null se removida
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

  return (
    <>
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
        @media print {
          @page { margin: 0; size: A4; }
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; break-before: page; }
        }
        .page-break { page-break-before: always; break-before: page; }
        * { box-sizing: border-box; }
      `}</style>

      {/* ══════════════════════════════════════════
          CAPA — fundo preto total
      ══════════════════════════════════════════ */}
      <div style={{
        background: '#000000',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: "'Arial Black', Arial, sans-serif",
        padding: '60px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Logo branco topo centro */}
        <div style={{ textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-rl-media-branco.png"
            alt="RL PROD"
            style={{ width: 220, height: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Slogan centro */}
        <div style={{ textAlign: 'left', alignSelf: 'flex-start' }}>
          <div style={{
            fontSize: 28,
            fontWeight: 400,
            color: PURPLE,
            fontStyle: 'italic',
            fontFamily: 'Arial, sans-serif',
            lineHeight: 1.3,
          }}>
            MORE THAN A PRODUCT,
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 900,
            color: '#ffffff',
            fontFamily: "'Arial Black', Arial, sans-serif",
            lineHeight: 1.3,
          }}>
            AN EXPERIENCE.
          </div>
        </div>

        {/* Título do contrato — fundo */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: 3,
            textTransform: 'uppercase',
            fontFamily: "'Arial Black', Arial, sans-serif",
            marginBottom: 10,
          }}>
            CONTRATO DE PRESTAÇÃO DE SERVIÇOS
          </div>
          <div style={{
            fontSize: 18,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontFamily: "'Arial Black', Arial, sans-serif",
          }}>
            ({clienteNome.toUpperCase()})
          </div>
          <div style={{
            marginTop: 16,
            fontSize: 10,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: 3,
            fontFamily: 'Arial, sans-serif',
          }}>
            {contrato.ref} · {contrato.geradoEm}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          PÁG 2 — Partes Contratantes
      ══════════════════════════════════════════ */}
      <ContentPage purple={PURPLE}>
        <SectionTitle>CONTRATANTE SEGUNDA OUTORGANTE:</SectionTitle>
        <InfoBlock>
          {clienteEmpresa && <InfoLine label="EMPRESA" value={clienteEmpresa.toUpperCase()} />}
          {ficha.representanteLegal && <InfoLine label="LEGAL REPRESENTANTE" value="" />}
          {ficha.representanteLegal && <InfoLine label="NOME" value={ficha.representanteLegal.toUpperCase()} />}
          {ficha.nif && <InfoLine label="NIF" value={ficha.nif} />}
          {ficha.morada && <InfoLine label="MORADA" value={ficha.morada.toUpperCase()} />}
          {ficha.telefone && <InfoLine label="CONTATO" value={ficha.telefone} />}
          {ficha.email && <InfoLine label="EMAIL" value={ficha.email} />}
        </InfoBlock>

        <SectionTitle>CONTRATADA - PRIMEIRA OUTORGANTE:</SectionTitle>
        <InfoBlock>
          <InfoLine label="NOME" value={PRESTADORA.nome} />
          <InfoLine label="NIF" value={PRESTADORA.nif} />
          <InfoLine label="CAE" value={PRESTADORA.cae} />
          <InfoLine label="ENDEREÇO" value={PRESTADORA.morada} />
          <InfoLine label="E-MAIL" value={PRESTADORA.email} />
          <InfoLine label="TELEFONE" value={PRESTADORA.telefone} />
        </InfoBlock>

        <BodyText>
          Por este acordo, as partes têm entre si, contratante e contratado o que segue. A CONTRATADA é ajustada, para realizar os serviços a seguir discriminados com seus respectivos valores, o serviço de videografia e fotografia será realizado pela RL PROD - Photography & Video.
        </BodyText>
      </ContentPage>

      {/* ══════════════════════════════════════════
          PÁG 3 — Considerandos + Cláusulas 1ª e 2ª início
      ══════════════════════════════════════════ */}
      <ContentPage purple={PURPLE}>
        {rcm('considerandos')}
        {rct('c1', 'PRIMEIRA CLÁUSULA')}
        {rct('c2_servicos', 'SEGUNDA CLÁUSULA')}
      </ContentPage>

      {/* ══════════════════════════════════════════
          PÁG 4 — Segunda Cláusula cont. + Terceira
      ══════════════════════════════════════════ */}
      <ContentPage purple={PURPLE}>
        {rcm('c2_cancelamento')}
        {rct('c3', 'TERCEIRA CLÁUSULA')}
      </ContentPage>

      {/* ══════════════════════════════════════════
          PÁG 5 — Quarta a Nona Cláusula
      ══════════════════════════════════════════ */}
      <ContentPage purple={PURPLE}>
        {rct('c4', 'QUARTA CLÁUSULA')}
        {rct('c5', 'QUINTA CLÁUSULA')}
        {rct('c6', 'SEXTA CLÁUSULA')}
        {rct('c7', 'SÉTIMA CLÁUSULA')}
        {rct('c8', 'OITAVA CLÁUSULA')}
        {rct('c9', 'NONA CLÁUSULA')}
      </ContentPage>

      {/* ══════════════════════════════════════════
          PÁG 6 — Décima a Décima Segunda + Serviços
      ══════════════════════════════════════════ */}
      <ContentPage purple={PURPLE}>
        {rct('c10', 'DÉCIMA CLÁUSULA')}
        {rct('c11', 'DÉCIMA PRIMEIRA CLÁUSULA')}
        {rct('c12', 'DÉCIMA SEGUNDA CLÁUSULA')}
        {rct('dos_servicos', 'DOS SERVIÇOS CONTRATADOS')}
        <BodyText style={{ fontWeight: 600, marginTop: 20 }}>Preços e métodos de pagamento:</BodyText>
        {valorNum > 0 ? (
          <>
            <ClauseText>a) Pelo serviço contratado, o cliente pagará à prestadora o montante de {valorTotal} Euros, ao qual acresce IVA à taxa legal em vigor.</ClauseText>
            <ClauseText>b) O montante indicado no número anterior, será pago através de transferência bancária, para o IBAN {PRESTADORA.iban}, da seguinte forma:</ClauseText>
            <div style={{ paddingLeft: 20, marginBottom: 10 }}>
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
      </ContentPage>

      {/* ══════════════════════════════════════════
          PÁG 7 — Confidencialidade + Lei + Cláusulas Custom
      ══════════════════════════════════════════ */}
      <ContentPage purple={PURPLE}>
        {rct('confidencialidade', 'CONFIDENCIALIDADE')}
        {rct('dados_pessoais', 'DADOS PESSOAIS')}
        {rct('lei_foro', 'LEI E FORO')}
        {rct('disposicoes_finais', 'DISPOSIÇÕES FINAIS')}

        {/* Cláusulas adicionadas pelo admin */}
        {clausulasCustom.map(c => (
          <div key={c.id}>
            <ClauseTitle>{c.titulo.toUpperCase()}</ClauseTitle>
            {renderLines(c.texto)}
          </div>
        ))}
      </ContentPage>

      {/* ══════════════════════════════════════════
          PÁG 8 — ANEXO I
      ══════════════════════════════════════════ */}
      <ContentPage purple={PURPLE}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 4, color: '#000', fontFamily: "'Arial Black', Arial, sans-serif", textTransform: 'uppercase' }}>ANEXO I</div>
          <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 2, color: '#333', marginTop: 4, textTransform: 'uppercase' }}>Contrato de Prestação de Serviços</div>
        </div>

        {rc('anexo_intro')}

        <BodyText style={{ fontWeight: 700, marginTop: 20 }}>Que contempla:</BodyText>
        {servicosList.length > 0 ? (
          <ul style={{ fontSize: 13, color: '#333', lineHeight: 2, paddingLeft: 24, marginBottom: 16 }}>
            {servicosList.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        ) : (
          <ClauseText>A definir em proposta.</ClauseText>
        )}

        {profissionaisList.length > 0 && (
          <>
            <BodyText style={{ fontWeight: 700, marginTop: 16 }}>Profissionais envolvidos:</BodyText>
            <ul style={{ fontSize: 13, color: '#333', lineHeight: 2, paddingLeft: 24, marginBottom: 16 }}>
              {profissionaisList.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </>
        )}

        {valorNum > 0 && (
          <div style={{
            marginTop: 20,
            padding: '12px 20px',
            background: '#000',
            display: 'inline-block',
          }}>
            <span style={{ fontSize: 14, color: '#fff', fontWeight: 900, letterSpacing: 2, fontFamily: "'Arial Black', Arial, sans-serif" }}>
              INVESTIMENTO = {valorTotal} EUROS + IVA
            </span>
          </div>
        )}

        {metodoPagamentoList.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <BodyText style={{ fontWeight: 700 }}>Plano de Pagamentos:</BodyText>
            <div style={{ borderLeft: '4px solid #000', paddingLeft: 16, marginTop: 8 }}>
              {metodoPagamentoList.map((linha, i) => (
                <p key={i} style={{ fontSize: 13, color: '#333', lineHeight: 2, fontFamily: 'Arial, sans-serif' }}>
                  — {linha}
                </p>
              ))}
              <p style={{ fontSize: 12, color: '#555', marginTop: 8, fontFamily: 'Arial, sans-serif' }}>
                IBAN: {PRESTADORA.iban}
              </p>
            </div>
          </div>
        )}

        <p style={{ fontSize: 11, color: '#888', marginTop: 24, fontStyle: 'italic', lineHeight: 1.6 }}>
          {getClausula(clausulas, 'anexo_nota')}
        </p>
      </ContentPage>

      {/* ══════════════════════════════════════════
          PÁG 9 — Assinaturas
      ══════════════════════════════════════════ */}
      <ContentPage purple={PURPLE}>
        <ClauseText>E por assim estarem ambas as partes de acordo, firmam o presente ANEXO I que integra o contrato principal, em duas vias de igual teor.</ClauseText>

        <p style={{ fontSize: 13, color: '#333', margin: '24px 0 48px', lineHeight: 1.8 }}>
          {ficha.localAssinatura || 'Lisboa'}, {contrato.geradoEm || new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'long', year: 'numeric' })}.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, marginTop: 40 }}>
          {/* Cliente */}
          <div>
            <div style={{ marginBottom: 60, borderBottom: '2px solid #000', paddingBottom: 4 }}>
              <span style={{ fontSize: 9, letterSpacing: 3, color: '#999', textTransform: 'uppercase' }}>Assinatura</span>
            </div>
            <p style={{ fontSize: 14, color: '#000', fontWeight: 900, fontFamily: "'Arial Black', Arial, sans-serif", textTransform: 'uppercase', marginBottom: 4 }}>
              {(clienteNome).toUpperCase()}
            </p>
            {ficha.representanteLegal && (
              <p style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>{ficha.representanteLegal}</p>
            )}
            <p style={{ fontSize: 10, color: '#999', letterSpacing: 1, textTransform: 'uppercase' }}>Representante Legal</p>
            {/* Caixa carimbo */}
            <div style={{
              marginTop: 28,
              border: '1.5px solid #ccc',
              height: 90,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ fontSize: 9, color: '#ddd', letterSpacing: 4, textTransform: 'uppercase' }}>Carimbo</span>
            </div>
          </div>

          {/* RL PROD */}
          <div>
            <div style={{ marginBottom: 60, borderBottom: '2px solid #000', paddingBottom: 4 }}>
              <span style={{ fontSize: 9, letterSpacing: 3, color: '#999', textTransform: 'uppercase' }}>Assinatura</span>
            </div>
            <p style={{ fontSize: 14, color: '#000', fontWeight: 900, fontFamily: "'Arial Black', Arial, sans-serif", textTransform: 'uppercase', marginBottom: 4 }}>
              RL PROD — Photography & Video
            </p>
            <p style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>Liliana Sofia Fernandes Barreto Gonçalves</p>
            <p style={{ fontSize: 10, color: '#999', letterSpacing: 1, textTransform: 'uppercase' }}>Representante Legal</p>
          </div>
        </div>
      </ContentPage>
    </>
  )
}

// ══════════════════════════════════════════════════════
// Componentes auxiliares
// ══════════════════════════════════════════════════════

function ContentPage({ children, purple }: { children: React.ReactNode; purple: string }) {
  return (
    <div className="page-break" style={{
      background: '#ffffff',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header diagonal preto — compacto */}
      <div style={{
        background: '#000000',
        padding: '14px 56px 22px',
        position: 'relative',
        clipPath: 'polygon(0 0, 100% 0, 82% 100%, 0 100%)',
        marginBottom: -2,
      }}>
        <div style={{ textAlign: 'center', paddingRight: '16%' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-rl-media-branco.png"
            alt="RL PROD"
            style={{ height: 32, width: 'auto', objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* Corpo */}
      <div style={{ flex: 1, padding: '32px 64px 20px' }}>
        {children}
      </div>

      {/* Rodapé */}
      <div style={{
        padding: '16px 64px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        borderTop: '1px solid #e8e8e8',
      }}>
        <div style={{ fontSize: 8, letterSpacing: 3, color: '#bbb', textTransform: 'uppercase' }}>
          WWW.rlphotovideo.pt
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: purple, fontStyle: 'italic', lineHeight: 1.3 }}>MORE THAN A PRODUCT,</div>
          <div style={{ fontSize: 10, fontWeight: 900, color: '#000', fontFamily: "'Arial Black', Arial, sans-serif", lineHeight: 1.3 }}>AN EXPERIENCE.</div>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 12,
      fontWeight: 900,
      color: '#000',
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 12,
      marginTop: 24,
      fontFamily: "'Arial Black', Arial, sans-serif",
    }}>
      {children}
    </p>
  )
}

function ClauseTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 11,
      fontWeight: 700,
      color: '#000',
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginTop: 20,
      marginBottom: 6,
      fontFamily: 'Arial, sans-serif',
    }}>
      {children}
    </p>
  )
}

function ClauseText({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 12,
      color: '#333',
      lineHeight: 1.85,
      textAlign: 'justify',
      marginBottom: 8,
      fontFamily: 'Arial, sans-serif',
    }}>
      {children}
    </p>
  )
}

function BodyText({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <p style={{
      fontSize: 12,
      color: '#333',
      lineHeight: 1.85,
      marginBottom: 10,
      fontFamily: 'Arial, sans-serif',
      ...style,
    }}>
      {children}
    </p>
  )
}

function InfoBlock({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: 20,
      padding: '16px 20px',
      borderLeft: '4px solid #000',
      background: '#f5f5f5',
    }}>
      {children}
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p style={{ fontSize: 12, color: '#222', lineHeight: 1.8, fontFamily: 'Arial, sans-serif' }}>
      {value
        ? <><strong style={{ fontWeight: 700 }}>{label}:</strong> {value}</>
        : <strong style={{ fontWeight: 700 }}>{label}</strong>
      }
    </p>
  )
}
